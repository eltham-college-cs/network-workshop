/* Core Interactive Engine for Year 8 Network Builder Workshop */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const H = NB.Helpers;
  const DONE_KEY = 'y8-nb-done-v2';
  const JUST_KEY = 'y8-nb-just-v1';
  const PRO_START = NB.PRO_START || NB.MISSIONS.length;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const state = {
    m: 0,
    track: 'core',
    just: {},
    tool: 'move',
    selectedId: null,
    dragging: null,
    busy: false,
    hint: false,
    teacher: location.hash === '#teacher',
    done: {},
    boards: [],
    meta: [],
    nextUid: 100,
    timerSec: 30 * 60,
    timerRunning: false,
    timerHandle: null
  };

  try {
    state.done = JSON.parse(localStorage.getItem(DONE_KEY) || '{}') || {};
    state.just = JSON.parse(localStorage.getItem(JUST_KEY) || '{}') || {};
  } catch (e) {}

  function initBoards() {
    state.boards = NB.MISSIONS.map(m => cloneBoard(m.starter()));
    state.meta = NB.MISSIONS.map(() => ({}));
  }

  function cloneBoard(b) {
    return {
      devices: b.devices.map(d => Object.assign({}, d)),
      links: b.links.map(l => Object.assign({}, l))
    };
  }

  const B = () => state.boards[state.m];
  const M = () => NB.MISSIONS[state.m];
  const META = () => state.meta[state.m];

  function isUnlocked(idx) {
    return state.teacher || idx === 0 || idx === PRO_START || !!state.done[idx - 1];
  }

  function saveDone() {
    try {
      localStorage.setItem(DONE_KEY, JSON.stringify(state.done));
      localStorage.setItem(JUST_KEY, JSON.stringify(state.just));
    } catch (e) {}
  }
  const trackOf = (i) => (i >= PRO_START ? 'pro' : 'core');
  const missionName = (m) => (m.track === 'pro' ? `Pro Mission ${m.proNum}` : `Mission ${m.id + 1}`);

  function svgEl(tag, attrs, inner) {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (inner !== undefined) el.innerHTML = inner;
    return el;
  }

  function addLog(text, kind) {
    const list = document.getElementById('log-list');
    const div = document.createElement('div');
    div.className = 'log-item' + (kind ? ' ' + kind : '');
    div.textContent = text;
    list.prepend(div);
  }

  function clearLog() {
    document.getElementById('log-list').innerHTML = '';
  }

  /* ---------- Header, Tabs & Sidebar ---------- */
  function renderProgress() {
    const idxs = NB.MISSIONS.map((_, i) => i).filter(i => trackOf(i) === state.track);
    const total = idxs.length;
    const count = idxs.filter(i => state.done[i]).length;
    document.getElementById('prog-text').textContent = `${count} / ${total}`;
    document.getElementById('prog-fill').style.width = `${Math.round((count / total) * 100)}%`;
  }

  function renderTabs() {
    const wrap = document.getElementById('mission-tabs');
    wrap.innerHTML = '';
    document.getElementById('track-core').classList.toggle('active', state.track === 'core');
    document.getElementById('track-pro').classList.toggle('active', state.track === 'pro');
    NB.MISSIONS.forEach((m, i) => {
      if (trackOf(i) !== state.track) return;
      const btn = document.createElement('button');
      const unlocked = isUnlocked(i);
      const done = !!state.done[i];
      btn.type = 'button';
      btn.className = 'm-tab' + (i === state.m ? ' active' : '') + (done ? ' done' : '');
      btn.disabled = !unlocked;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', i === state.m ? 'true' : 'false');
      btn.innerHTML = `<span class="m-num">${done ? '✓' : unlocked ? (m.proNum || i + 1) : '🔒'}</span><span>${m.short}</span>`;
      btn.addEventListener('click', () => selectMission(i));
      wrap.appendChild(btn);
    });
  }

  function renderSidebar() {
    const m = M();
    const b = B();
    const meta = META();

    document.getElementById('m-badge').textContent = missionName(m);
    document.getElementById('m-time').textContent = m.time;
    document.getElementById('m-stars').textContent = '★'.repeat(m.stars);
    document.getElementById('m-title').textContent = m.title;
    document.getElementById('m-brief').textContent = m.brief;

    // Web Studio CTA
    const cta = document.getElementById('web-studio-cta');
    cta.hidden = !m.usesWebStudio;
    if (m.usesWebStudio) {
      const status = document.getElementById('studio-status');
      if (NB.WebStudio.isDeployed()) {
        status.textContent = `Live on the Web Server (v${NB.WebStudio.getVersion()}) ✓`;
        status.classList.add('deployed');
      } else if (NB.WebStudio.isReady()) {
        status.textContent = 'Page ready. Now send it across the network!';
        status.classList.add('deployed');
      } else {
        status.textContent = 'Not deployed yet';
        status.classList.remove('deployed');
      }
    }

    // Checklist
    const ul = document.getElementById('checklist');
    ul.innerHTML = '';
    let reqTotal = 0;
    let reqPass = 0;
    m.checks.forEach(([label, fn, isBonus]) => {
      const pass = !!fn(b, meta);
      if (!isBonus) {
        reqTotal++;
        if (pass) reqPass++;
      }
      const li = document.createElement('li');
      li.className = (pass ? 'pass' : '') + (isBonus ? ' bonus' : '');
      li.innerHTML = `<span class="chk-icon">${pass ? '✓' : ''}</span><span>${label}</span>`;
      ul.appendChild(li);
    });
    document.getElementById('check-count').textContent = `${reqPass}/${reqTotal}`;

    // Smart Misconception Nudge
    const nudge = (m.nudge && m.nudge(b)) || H.getNudge(b, m);
    const nudgeBox = document.getElementById('nudge-box');
    if (nudge) {
      nudgeBox.hidden = false;
      document.getElementById('nudge-text').textContent = nudge;
    } else {
      nudgeBox.hidden = true;
    }

    // Cable efficiency callout (Mission 7)
    const statsBox = document.getElementById('cable-stats');
    if (m.stats) {
      statsBox.hidden = false;
      statsBox.textContent = m.stats(b);
    } else if (m.showCableStats) {
      const nClients = H.clients(b).length;
      const meshCables = nClients > 1 ? (nClients * (nClients - 1)) / 2 : 0;
      const lanLinks = H.clientsOnRouter(b).length;
      statsBox.hidden = false;
      statsBox.textContent = nClients >= 2
        ? `📊 Cable Efficiency: ${nClients} clients via Router = ${lanLinks} links (vs. ${meshCables} cables if wired directly!)`
        : '📊 Add clients to see how much cabling a central Router saves!';
    } else {
      statsBox.hidden = true;
    }

    // Action button
    const runBtn = document.getElementById('btn-run');
    runBtn.textContent = `▶ ${m.action}`;
    const ready = reqPass === reqTotal || !!m.allowUnsafeTest || m.simType === 'lostpacket';
    runBtn.disabled = state.busy || !ready;

    // Layout hint button
    const hintBtn = document.getElementById('btn-hint');
    hintBtn.hidden = !m.ghosts || m.ghosts.length === 0;
    hintBtn.textContent = state.hint ? '🙈 Hide Hint' : '👁 Layout Hint';
  }

  function renderToolbar() {
    const m = M();
    document.querySelectorAll('.tool-btn').forEach(btn => {
      const t = btn.dataset.tool;
      const allowed = m.tools.includes(t);
      btn.disabled = !allowed;
      btn.classList.toggle('active', state.tool === t);
    });

    const pal = document.getElementById('palette');
    pal.innerHTML = '';
    if (!m.palette.length) {
      pal.innerHTML = '<span style="font-size:0.82rem;color:var(--muted);font-weight:700;">Pre-built network — use the tools to test or inspect!</span>';
      return;
    }
    m.palette.forEach(type => {
      const info = NB.DEVICES[type];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pal-btn';
      btn.innerHTML = `<span>+ ${info.name}</span><span class="pal-tag">${info.role}</span>`;
      btn.addEventListener('click', () => spawnDevice(type));
      pal.appendChild(btn);
    });
  }

  function setTool(tool) {
    if (!M().tools.includes(tool)) tool = 'move';
    state.tool = tool;
    state.selectedId = null;
    const tips = {
      move: 'Drag devices to arrange your network. Click a palette button to add hardware.',
      eth: 'Ethernet (copper cable): click two devices to link them, or click a red broken cable to repair it.',
      wifi: 'Wi-Fi (radio waves): click a portable client (Laptop/Phone) and the Router to connect wirelessly.',
      fibre: 'Fibre Optic (light pulses): click two devices (e.g., Router/Firewall ↔ Internet Cloud) for a fast long-distance link.',
      delete: 'Click any unlocked device or cable to remove it.'
    };
    document.getElementById('tool-tip').textContent = tips[tool] || '';
    renderToolbar();
    renderBoard();
  }

  function spawnDevice(type) {
    const b = B();
    const m = M();
    // Place on an unoccupied ghost slot of the same type if available, else pick a clean spot
    let x = 220 + ((b.devices.length * 73) % 420);
    let y = 140 + ((b.devices.length * 91) % 300);
    if (m.ghosts) {
      const match = m.ghosts.find(([gt, gx, gy]) =>
        gt === type && !b.devices.some(d => Math.hypot(d.x - gx, d.y - gy) < 42)
      );
      if (match) { x = match[1]; y = match[2]; }
    }
    const existingCount = H.byType(b, type).length + 1;
    const baseName = NB.DEVICES[type].name;
    const label = (['pc', 'laptop', 'phone'].includes(type) || existingCount > 1) ? `${baseName} ${existingCount}` : baseName;
    const id = `${type}_${state.nextUid++}`;
    b.devices.push({ id, type, x, y, label, locked: false });
    addLog(`Added ${label} to the board.`);
    updateUI();
  }

  /* ---------- SVG Canvas Rendering ---------- */
  function renderBoard() {
    const b = B();
    const m = M();
    const lZones = document.getElementById('layer-zones');
    const lGhosts = document.getElementById('layer-ghosts');
    const lLinks = document.getElementById('layer-links');
    const lDevs = document.getElementById('layer-devices');

    lZones.innerHTML = '';
    lGhosts.innerHTML = '';
    lLinks.innerHTML = '';
    lDevs.innerHTML = '';

    // Zones
    if (m.zones) {
      m.zones.forEach(z => {
        lZones.appendChild(svgEl('rect', {
          x: z.x, y: z.y, width: z.w, height: z.h,
          class: 'zone-rect' + (z.net ? ' zone-rect-net' : '')
        }));
        lZones.appendChild(svgEl('text', {
          x: z.x + 14, y: z.y + 22, class: 'zone-label'
        }, z.label));
      });
    }

    // Ghost hints
    if (state.hint && m.ghosts) {
      m.ghosts.forEach(([type, gx, gy]) => {
        const g = svgEl('g', { transform: `translate(${gx},${gy})`, class: 'ghost-node' });
        g.innerHTML = NB.DEVICES[type].svg + `<text y="40" class="dev-label">${NB.DEVICES[type].name}</text>`;
        lGhosts.appendChild(g);
      });
    }

    // Links
    b.links.forEach((l, idx) => {
      const A = H.dev(b, l.a);
      const Bdev = H.dev(b, l.b);
      if (!A || !Bdev) return;

      const g = svgEl('g', {});
      const showBroken = l.broken && !(l.hidden && !l.revealed);
      const cls = showBroken ? 'link-broken' : (l.kind === 'wifi' ? 'link-wifi' : l.kind === 'fibre' ? 'link-fibre' : 'link-eth');
      g.appendChild(svgEl('line', { x1: A.x, y1: A.y, x2: Bdev.x, y2: Bdev.y, class: cls }));
      if (l.kind === 'fibre' && !showBroken) {
        g.appendChild(svgEl('line', { x1: A.x, y1: A.y, x2: Bdev.x, y2: Bdev.y, class: 'link-fibre-core' }));
      }
      if (showBroken) {
        const mx = (A.x + Bdev.x) / 2;
        const my = (A.y + Bdev.y) / 2;
        g.appendChild(svgEl('circle', { cx: mx, cy: my, r: 12, fill: '#E23D63', stroke: '#1B2440', 'stroke-width': 2.5 }));
        g.appendChild(svgEl('text', { x: mx, y: my + 4, 'text-anchor': 'middle', fill: '#fff', 'font-size': 13, 'font-weight': 900 }, '✕'));
      }

      const hit = svgEl('line', { x1: A.x, y1: A.y, x2: Bdev.x, y2: Bdev.y, class: 'link-hit' });
      hit.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (state.busy) return;
        if (state.tool === 'delete') {
          if (l.locked) { addLog('That cable is part of the starter setup and cannot be deleted.', 'warn'); return; }
          b.links.splice(idx, 1);
          addLog(`Removed ${l.kind.toUpperCase()} link.`);
          updateUI();
        } else if (l.broken && state.tool === 'eth') {
          l.broken = false;
          addLog('Repaired the broken Ethernet cable!', 'ok');
          updateUI();
        } else if (['eth', 'wifi', 'fibre'].includes(state.tool) && !l.locked) {
          l.kind = state.tool;
          l.broken = false;
          addLog(`Switched link to ${state.tool.toUpperCase()}.`);
          updateUI();
        }
      });
      g.appendChild(hit);
      lLinks.appendChild(g);
    });

    // Devices
    b.devices.forEach((d, idx) => {
      const info = NB.DEVICES[d.type];
      const g = svgEl('g', {
        transform: `translate(${d.x},${d.y})`,
        class: 'dev-node' + (state.selectedId === d.id ? ' selected' : '') + (d.down ? ' dev-down' : '') + (d.infected ? ' dev-infected' : ''),
        filter: 'url(#soft-shadow)'
      });

      let subLabel = info.role;
      if (d.type === 'web' && NB.WebStudio.isDeployed()) {
        subLabel = `index.html v${NB.WebStudio.getVersion()} ✓`;
      }
      if (d.down) subLabel = 'CRASHED';
      if (d.infected) subLabel = 'INFECTED';

      g.innerHTML = `
        <circle r="37" class="dev-ring"/>
        ${info.svg}
        <text y="40" class="dev-label">${d.label}</text>
        <text y="53" class="dev-sub">${subLabel}</text>
        ${d.down ? '<g class="dev-flag"><circle cx="24" cy="-26" r="11" fill="#E23D63" stroke="#1B2440" stroke-width="2.5"/><text x="24" y="-22" text-anchor="middle" font-size="13" font-weight="900" fill="#fff">✕</text></g>' : ''}
        ${d.infected ? '<g class="dev-flag"><circle cx="24" cy="-26" r="11" fill="#FF5D8F" stroke="#1B2440" stroke-width="2.5"/><text x="24" y="-21.5" text-anchor="middle" font-size="14" font-weight="900" fill="#1B2440">!</text></g>' : ''}
      `;

      g.addEventListener('pointerdown', (ev) => onDevicePointerDown(ev, d, idx));
      lDevs.appendChild(g);
    });
  }

  function svgPoint(ev) {
    const svg = document.getElementById('board');
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX;
    pt.y = ev.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function onDevicePointerDown(ev, d, idx) {
    ev.stopPropagation();
    if (state.busy) return;
    const b = B();

    if (state.tool === 'delete') {
      if (d.locked) { addLog(`${d.label} is fixed for this mission and cannot be removed.`, 'warn'); return; }
      b.devices.splice(idx, 1);
      b.links = b.links.filter(l => l.a !== d.id && l.b !== d.id);
      addLog(`Removed ${d.label}.`);
      updateUI();
      return;
    }

    if (['eth', 'wifi', 'fibre'].includes(state.tool)) {
      if (!state.selectedId) {
        state.selectedId = d.id;
        renderBoard();
      } else if (state.selectedId === d.id) {
        state.selectedId = null;
        renderBoard();
      } else {
        const existing = H.linkBetween(b, state.selectedId, d.id);
        if (existing) {
          if (existing.locked) {
            addLog('That link is locked for this mission.', 'warn');
          } else {
            existing.kind = state.tool;
            existing.broken = false;
            addLog(`Updated link to ${state.tool.toUpperCase()}.`, 'ok');
          }
        } else {
          b.links.push({ a: state.selectedId, b: d.id, kind: state.tool, broken: false, locked: false });
          const other = H.dev(b, state.selectedId);
          addLog(`Connected ${other.label} ↔ ${d.label} (${state.tool.toUpperCase()}).`);
        }
        state.selectedId = null;
        updateUI();
      }
      return;
    }

    // Move tool
    const pt = svgPoint(ev);
    state.dragging = { d, dx: d.x - pt.x, dy: d.y - pt.y };
    ev.currentTarget.classList.add('dragging');
  }

  function setupCanvasPointerEvents() {
    const svg = document.getElementById('board');
    svg.addEventListener('pointermove', (ev) => {
      if (!state.dragging) return;
      const pt = svgPoint(ev);
      state.dragging.d.x = Math.max(48, Math.min(912, Math.round(pt.x + state.dragging.dx)));
      state.dragging.d.y = Math.max(48, Math.min(502, Math.round(pt.y + state.dragging.dy)));
      renderBoard();
    });
    window.addEventListener('pointerup', () => {
      state.dragging = null;
    });
    svg.addEventListener('click', () => {
      if (state.selectedId) {
        state.selectedId = null;
        renderBoard();
      }
    });
  }

  /* ---------- Smooth Packet & Shield FX Engine ---------- */
  function animatePacket(pathIds, opts) {
    opts = opts || {};
    const b = B();
    const fx = document.getElementById('layer-fx');
    const color = opts.color || '#FFC83D';
    const label = opts.label || 'PKT';
    const speed = opts.speed || 420; // ms per hop
    const dropHop = typeof opts.dropAtHop === 'number' ? opts.dropAtHop : -1;

    return new Promise(resolve => {
      if (!pathIds || pathIds.length < 2) return resolve();

      const g = svgEl('g', {});
      g.appendChild(svgEl('rect', { x: -24, y: -12, width: 48, height: 24, rx: 12, fill: color, stroke: '#1B2440', 'stroke-width': 2.5 }));
      g.appendChild(svgEl('text', { y: 4, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 900, fill: '#1B2440', 'font-family': 'JetBrains Mono, monospace' }, label));
      fx.appendChild(g);

      let hop = 0;
      let hopStart = performance.now();

      function step(now) {
        const A = H.dev(b, pathIds[hop]);
        const Bdev = H.dev(b, pathIds[hop + 1]);
        if (!A || !Bdev) { g.remove(); return resolve(); }
        let t = Math.min(1, (now - hopStart) / speed);

        if (hop === dropHop && t >= 0.5) {
          const mx = A.x + (Bdev.x - A.x) * 0.5;
          const my = A.y + (Bdev.y - A.y) * 0.5;
          g.remove();
          showBurst(mx, my, opts.dropText || '✕ LOST', '#E23D63');
          return resolve('dropped');
        }

        const x = A.x + (Bdev.x - A.x) * t;
        const y = A.y + (Bdev.y - A.y) * t;
        g.setAttribute('transform', `translate(${x},${y})`);

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          hop++;
          if (hop >= pathIds.length - 1) {
            g.remove();
            if (opts.endBurst) showBurst(Bdev.x, Bdev.y - 34, opts.endBurst, opts.endBurstColor || '#16B383');
            resolve('arrived');
          } else {
            hopStart = now;
            requestAnimationFrame(step);
          }
        }
      }
      requestAnimationFrame(step);
    });
  }

  function showBurst(x, y, text, color) {
    const fx = document.getElementById('layer-fx');
    const g = svgEl('g', { transform: `translate(${x},${y})` });
    g.appendChild(svgEl('rect', { x: -46, y: -14, width: 92, height: 26, rx: 13, fill: color, stroke: '#1B2440', 'stroke-width': 2.5 }));
    g.appendChild(svgEl('text', { y: 4, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 900, fill: '#fff' }, text));
    fx.appendChild(g);
    setTimeout(() => g.remove(), 1400);
  }

  /* ---------- Mission Simulations ---------- */
  async function runCurrentMission() {
    if (state.busy) return;
    state.busy = true;
    document.getElementById('layer-fx').innerHTML = '';
    renderSidebar();

    const m = M();
    const b = B();
    const meta = META();

    try {
      if (m.predict && meta.predicted === undefined) {
        addLog('Before you test: make a prediction.');
        meta.predicted = await ask(
          `<strong>Predict first:</strong> ${escapeHtml(m.predict.q)}`,
          m.predict.options
        );
        addLog(`Prediction saved: "${m.predict.options[meta.predicted]}". Now let's test it.`);
      }

      if (m.run) {
        await m.run({
          b, meta, m, H, sleep, animatePacket, showBurst, addLog, renderBoard, updateUI,
          openDebrief: () => openDebrief(m), openClientBrowser
        });
      }

      else if (m.simType === 'save') {
        const fs = H.first(b, 'file');
        const pcs = H.byType(b, 'pc');
        addLog('Sending homework.docx from all 3 Desktop PCs to the File Server...');
        for (const pc of pcs) {
          const p = H.findPath(b, pc.id, fs.id);
          await animatePacket(p, { label: 'DOCX', color: '#FFC83D', speed: 340 });
          await animatePacket([...p].reverse(), { label: 'SAVED', color: '#3EE0AE', speed: 280 });
        }
        addLog('All 3 clients saved their homework to the File Server!', 'ok');
        openDebrief(m);
      }

      else if (m.simType === 'wifi') {
        const fs = H.first(b, 'file');
        const allClients = H.clients(b);
        addLog('Testing Ethernet (wired) and Wi-Fi (radio wave) clients...');
        for (const c of allClients) {
          const p = H.findPath(b, c.id, fs.id);
          if (!p) continue;
          const isWifi = H.linkedToType(b, c, 'router', 'wifi');
          await animatePacket(p, { label: isWifi ? 'WI-FI' : 'ETH', color: isWifi ? '#6EF3D6' : '#FFC83D', speed: 320 });
        }
        addLog('Both wired Ethernet PCs and wireless Wi-Fi devices synced cleanly!', 'ok');
        openDebrief(m);
      }

      else if (m.simType === 'print') {
        const lap = H.first(b, 'laptop') || H.clients(b)[0];
        const ps = H.first(b, 'print');
        const pr = H.first(b, 'printer');
        addLog(`${lap.label} sends a print request via Wi-Fi → Router → Print Server...`);
        await animatePacket(H.findPath(b, lap.id, ps.id), { label: 'PRINT', color: '#FFC83D', speed: 380 });
        addLog('Print Server queues the job and sends it to the Shared Printer...');
        await animatePacket(H.findPath(b, ps.id, pr.id), { label: 'PAGE', color: '#FF8AB5', speed: 380, endBurst: 'PRINTED ✓' });
        addLog('Homework printed on the shared corridor printer!', 'ok');
        openDebrief(m);
      }

      else if (m.simType === 'web') {
        const ws = H.first(b, 'web');
        const pc = H.dev(b, 'pc1') || H.clients(b)[0];
        const up = H.findPath(b, pc.id, ws.id);
        const addr = NB.WebStudio.getAddress();

        if (NB.WebStudio.isReady() || !NB.WebStudio.isDeployed()) {
          const pk = NB.WebStudio.getPacketSnippets(false);
          addLog(`Deploying: ${pc.label} splits index.html and style.css into ${pk.length} numbered packets...`);
          for (const p of pk) {
            addLog(`Packet ${p.id} of ${pk.length} (${p.file}): ${p.payload.slice(0, 44)}${p.payload.length > 44 ? '…' : ''}`);
            await animatePacket(up, { label: `PKT ${p.id}`, color: p.file === 'style.css' ? '#74B9FF' : '#FFC83D', speed: 300 });
          }
          const ver = NB.WebStudio.goLive();
          showBurst(ws.x, ws.y - 44, 'LIVE ✓', '#16B383');
          addLog(`The Web Server put the packets back in order. Your page is live at ${addr} (v${ver}).`, 'ok');
          renderBoard();
          await sleep(700);
        }

        const results = [];
        const clients = H.clients(b);
        for (let ci = 0; ci < clients.length; ci++) {
          const c = clients[ci];
          const p = H.findPath(b, c.id, ws.id);
          if (!p) {
            showBurst(c.x, c.y - 44, 'NO ROUTE', '#E23D63');
            addLog(`${c.label} typed ${addr} but has no link to the Router, so the request went nowhere.`, 'bad');
            results.push({ id: c.id, label: c.label, mode: 'unreachable' });
            await sleep(500);
            continue;
          }
          const viaWifi = H.linkedToType(b, c, 'router', 'wifi');
          addLog(`${c.label} requests ${addr} (${viaWifi ? 'Wi-Fi' : 'Ethernet'} then Fibre Optic)...`);
          await animatePacket(p, { label: 'GET /', color: '#FFC83D', speed: 300 });
          const rev = [...p].reverse();
          await animatePacket(rev, { label: 'HTML', color: '#3EE0AE', speed: 280 });
          // The first Wi-Fi client loses a stylesheet packet, so pupils see what a missing packet does.
          const lose = viaWifi && !results.some(r => r.mode === 'unstyled') && !meta.resent;
          if (lose) {
            await animatePacket(rev, { label: 'CSS', color: '#74B9FF', speed: 280, dropAtHop: 0, dropText: '✕ CSS LOST' });
            addLog(`A style.css packet for ${c.label} was lost on the way!`, 'warn');
            results.push({ id: c.id, label: c.label, mode: 'unstyled', wifi: viaWifi });
          } else {
            await animatePacket(rev, { label: 'CSS', color: '#74B9FF', speed: 280, endBurst: 'LOADED ✓' });
            results.push({ id: c.id, label: c.label, mode: 'normal', wifi: viaWifi });
          }
        }
        openClientsView(results, () => openDebrief(m));
      }

      else if (m.simType === 'firewall') {
        const net = H.first(b, 'internet');
        const ws = H.first(b, 'web');
        const pc = H.first(b, 'pc');
        const protectedByFw = H.isFirewallProtectingRouter(b) && H.internetUplink(b) && H.internetUplink(b).kind === 'fibre';

        if (!protectedByFw) {
          const attackPath = H.findPath(b, net.id, ws.id);
          addLog('⚠️ Unauthorised attack packet incoming from the Internet Cloud!', 'bad');
          if (attackPath) {
            await animatePacket(attackPath, { label: 'ATK!', color: '#FF5D8F', speed: 380, endBurst: 'DEFACED!', endBurstColor: '#E23D63' });
          }
          addLog('No Firewall protected the Router! Your Web Server page was defaced.', 'bad');
          openClientBrowser({
            title: '⚠️ Attack Succeeded — No Firewall!',
            sub: 'Place a Firewall between the Internet Cloud and Router (and remove the direct bypass link) to protect your site.',
            mode: 'defaced',
            packets: [],
            onContinue: null
          });
        } else {
          const fw = H.first(b, 'firewall');
          const atkToFw = H.findPath(b, net.id, fw.id);
          addLog('Testing Perimeter Security: Attacker sends malicious packet from Internet Cloud...', 'warn');
          await animatePacket(atkToFw, { label: 'ATK!', color: '#FF5D8F', speed: 380, endBurst: '🛡 BLOCKED!', endBurstColor: '#16B383' });
          addLog('The Firewall is in place. Now YOU decide what it lets through...', 'ok');
          NB.Firewall.openDuty({
            onPass: async (res) => {
              addLog(`Firewall duty complete: ${res.right} of 8 correct decisions, score ${res.score}.`, 'ok');
              const okPath = H.findPath(b, pc.id, ws.id);
              await animatePacket(okPath, { label: 'GET /', color: '#FFC83D', speed: 320 });
              await animatePacket([...okPath].reverse(), { label: 'HTML', color: '#3EE0AE', speed: 320, endBurst: 'SAFE ✓' });
              openClientBrowser({
                title: 'Your firewall kept the site safe!',
                sub: 'Real visitors reached your Web Server while the attacks were stopped at the Firewall.',
                mode: 'normal',
                packets: NB.WebStudio.getPacketSnippets(false),
                onContinue: () => openDebrief(m)
              });
            }
          });
        }
      }

      else if (m.simType === 'diagnostic') {
        const pc1 = H.dev(b, 'pc1');
        const pc2 = H.dev(b, 'pc2');
        const fs = H.first(b, 'file');
        const net = H.first(b, 'internet');
        const r = H.first(b, 'router');
        const ws = H.first(b, 'web');

        addLog('Running diagnostic across the school network...');
        await animatePacket(H.findPath(b, pc1.id, fs.id), { label: 'PC1 OK', color: '#3EE0AE', speed: 300 });

        const pc2Broken = !H.linkedToType(b, pc2, 'router', 'eth');
        if (pc2Broken) {
          const brokenPath = H.findPath(b, pc2.id, r.id, { includeBroken: true });
          if (brokenPath) await animatePacket(brokenPath, { label: 'PC2', color: '#FFC83D', speed: 350, dropAtHop: 0, dropText: '✕ FAULT 1' });
          addLog('Fault 1: PC 2’s Ethernet cable is broken! Select Ethernet and click the red X to repair it.', 'bad');
        } else {
          await animatePacket(H.findPath(b, pc2.id, fs.id), { label: 'PC2 OK', color: '#3EE0AE', speed: 300 });
        }

        const uplink = H.internetUplink(b);
        const badFibre = !uplink || uplink.kind !== 'fibre';
        const noFw = !H.isFirewallProtectingRouter(b);

        if (badFibre) addLog('Fault 2: The Internet Cloud link is not Fibre Optic! Upgrade it to Fibre Optic.', 'bad');
        if (noFw) addLog('Fault 3: No Firewall is protecting the Router! Add a Firewall between Router & Internet Cloud.', 'bad');

        if (!pc2Broken && !badFibre && !noFw) {
          const fw = H.first(b, 'firewall');
          await animatePacket(H.findPath(b, net.id, fw.id), { label: 'ATK!', color: '#FF5D8F', speed: 340, endBurst: '🛡 BLOCKED!', endBurstColor: '#16B383' });
          await animatePacket(H.findPath(b, pc2.id, ws.id), { label: 'WEB', color: '#3EE0AE', speed: 290, endBurst: 'ALL FIXED ✓' });
          addLog('All 3 faults repaired! Network diagnostics passed 100%.', 'ok');
          openDebrief(m);
        }
      }

      else if (m.simType === 'office') {
        const fs = H.first(b, 'file');
        const pr = H.first(b, 'printer');
        const ws = H.first(b, 'web');
        const net = H.first(b, 'internet');
        const fw = H.first(b, 'firewall');
        const wired = H.byType(b, 'pc').find(p => H.linkedToType(b, p, 'router', 'eth'));
        const wireless = b.devices.find(d => (d.type === 'laptop' || d.type === 'phone') && H.linkedToType(b, d, 'router', 'wifi'));

        addLog('1/4 Testing File Server from wired Desktop PC...');
        await animatePacket(H.findPath(b, wired.id, fs.id), { label: 'FILE', color: '#FFC83D', speed: 300 });
        addLog('2/4 Testing Shared Printer from Wi-Fi client...');
        await animatePacket(H.findPath(b, wireless.id, pr.id), { label: 'PRINT', color: '#FF8AB5', speed: 300 });
        addLog('3/4 Testing Firewall against external threat...');
        await animatePacket(H.findPath(b, net.id, fw.id), { label: 'ATK!', color: '#FF5D8F', speed: 320, endBurst: '🛡 BLOCKED!', endBurstColor: '#16B383' });
        addLog('4/4 Loading your Na<>y Builds webpage across Fibre Optic to all clients...');
        const pWeb = H.findPath(b, ws.id, wireless.id);
        await animatePacket(pWeb, { label: 'SITE', color: '#3EE0AE', speed: 290, endBurst: 'LIVE ✓' });
        openClientBrowser({
          title: 'New Wing Network Online — All Clients Loaded Your Site!',
          sub: 'Wired PCs and Wi-Fi devices all share the File Server, Print Server, Firewall, and live Web Server.',
          mode: 'normal',
          packets: NB.WebStudio.getPacketSnippets(false),
          onContinue: () => openDebrief(m)
        });
      }

      else if (m.simType === 'lostpacket') {
        const meta = META();
        addLog('Downloading your 4-packet website (index.html + style.css) across the Internet...');
        // Packet 1 (route top)
        await animatePacket(['ws', 'rc', 'ra', 'fw', 'r0', 'pc1'], { label: 'PKT 1', color: '#3EE0AE', speed: 240 });
        // Packet 2 (route bottom)
        await animatePacket(['ws', 'rd', 'rb', 'fw', 'r0', 'pc1'], { label: 'PKT 2', color: '#3EE0AE', speed: 240 });
        // Spoofed packet blocked at firewall
        await animatePacket(['ws', 'rc', 'rb', 'fw'], { label: 'SPOOF', color: '#FF5D8F', speed: 240, endBurst: '🛡 BLOCKED', endBurstColor: '#16B383' });
        // Packet 3 (style.css) drops mid-internet!
        await animatePacket(['ws', 'rd', 'ra', 'fw', 'r0', 'pc1'], { label: 'PKT 3', color: '#FFC83D', speed: 260, dropAtHop: 1, dropText: '✕ CSS LOST!' });
        // Packet 4 arrives out of order
        await animatePacket(['ws', 'rc', 'ra', 'fw', 'r0', 'pc1'], { label: 'PKT 4', color: '#74B9FF', speed: 240 });

        meta.sent = true;
        addLog('Arrived: Packet 1, Packet 2, Packet 4. Packet 3 (style.css) was LOST!', 'warn');
        renderSidebar();

        openClientBrowser({
          title: 'Uh oh — Your Styles Disappeared!',
          sub: 'Packets 1 & 2 (index.html) arrived, so the text loaded — but Packet 3 (style.css) was lost in transit!',
          mode: 'unstyled',
          packets: NB.WebStudio.getPacketSnippets(true),
          onContinue: () => showLostPacketRecoveryBar()
        });
      }
    } finally {
      state.busy = false;
      renderSidebar();
    }
  }

  /* Ask a question in the bar under the board. Resolves with the index of the chosen option. */
  function ask(html, options) {
    return new Promise(resolve => {
      const bar = document.getElementById('interactive-bar');
      bar.hidden = false;
      bar.innerHTML = `<p>${html}</p><div class="interactive-choices">${options.map((o, i) => `<button class="btn btn-soft" data-i="${i}" type="button">${escapeHtml(o)}</button>`).join('')}</div>`;
      bar.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      bar.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
        bar.hidden = true;
        resolve(+btn.dataset.i);
      }));
    });
  }

  /* Every client's browser side by side (Mission 4) */
  function openClientsView(results, onContinue) {
    const grid = document.getElementById('clients-grid');
    const msg = document.getElementById('clients-msg');
    const cont = document.getElementById('btn-clients-continue');
    const addr = NB.WebStudio.getAddress();
    document.getElementById('clients-sub').textContent = `One Web Server, ${results.length} clients. Each one asked for ${addr}.`;

    function draw() {
      grid.innerHTML = '';
      results.forEach(r => {
        const card = document.createElement('div');
        card.className = 'client-card ' + r.mode;
        const status = r.mode === 'normal' ? 'Loaded. Every packet arrived.' : r.mode === 'unstyled' ? 'No styling: a style.css packet was lost.' : 'Not connected to the Router.';
        card.innerHTML = `<div class="client-name"><strong>${escapeHtml(r.label)}</strong><span>${r.mode === 'unreachable' ? 'No link' : r.wifi ? 'Wi-Fi' : 'Ethernet'}</span></div>
          <div class="browser-chrome"><span class="b-dot red"></span><span class="b-dot yellow"></span><span class="b-dot green"></span><span class="b-url">${addr}</span></div>
          <iframe class="preview-frame client-frame" title="${escapeHtml(r.label)} browser" sandbox=""></iframe>
          <div class="client-status">${status}</div>`;
        card.querySelector('iframe').srcdoc = NB.WebStudio.buildDocument(r.mode);
        if (r.mode === 'unstyled') {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn btn-grape';
          btn.textContent = 'Ask the server to resend the lost packet';
          btn.addEventListener('click', () => {
            r.mode = 'normal';
            META().resent = true;
            addLog(`${r.label} asked the Web Server to resend the missing style.css packet. Styles restored!`, 'ok');
            draw();
          });
          card.appendChild(btn);
        }
        grid.appendChild(card);
      });
      const waiting = results.some(r => r.mode === 'unstyled');
      const missing = results.filter(r => r.mode === 'unreachable');
      cont.disabled = waiting;
      msg.textContent = waiting
        ? 'One client is missing its styles. The packet numbers tell it exactly which packet to ask for again.'
        : missing.length
          ? `${missing.map(r => r.label).join(', ')} could not load the page. For the bonus, connect it to the Router with Wi-Fi and deploy again.`
          : 'Every client shows the same page, because they all asked the same server.';
    }
    draw();
    cont.onclick = () => {
      document.getElementById('modal-clients').hidden = true;
      if (onContinue) onContinue();
    };
    document.getElementById('modal-clients').hidden = false;
  }

  function showLostPacketRecoveryBar() {
    const bar = document.getElementById('interactive-bar');
    bar.hidden = false;
    bar.innerHTML = `
      <p>🔍 <strong>Recovery Step:</strong> Packets 1, 2, and 4 arrived, but your CSS vanished. Which packet should your PC ask the Web Server to resend?</p>
      <div class="interactive-choices">
        <button class="btn btn-soft" data-pkt="1">Packet 1</button>
        <button class="btn btn-soft" data-pkt="2">Packet 2</button>
        <button class="btn btn-primary" data-pkt="3">Packet 3 (style.css)</button>
        <button class="btn btn-soft" data-pkt="4">Packet 4</button>
      </div>
    `;
    bar.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (btn.dataset.pkt !== '3') {
          addLog(`Packet ${btn.dataset.pkt} already arrived! Look at which number is missing.`, 'warn');
          return;
        }
        bar.hidden = true;
        state.busy = true;
        META().resent = true;
        addLog('Requesting resend of Packet 3 (style.css) via alternate route...', 'ok');
        await animatePacket(['ws', 'rc', 'ra', 'fw', 'r0', 'pc1'], { label: 'PKT 3', color: '#3EE0AE', speed: 250, endBurst: 'CSS FIXED ✓' });
        META().recovered = true;
        state.busy = false;
        renderSidebar();
        openClientBrowser({
          title: '✅ Packet 3 Recovered — Full Website Restored!',
          sub: 'Your client reassembled Packets 1, 2, 3 and 4 in order and applied style.css!',
          mode: 'normal',
          packets: NB.WebStudio.getPacketSnippets(false),
          onContinue: () => openDebrief(M())
        });
      });
    });
  }

  /* ---------- Client Mini-Browser Modal ---------- */
  function openClientBrowser(cfg) {
    document.getElementById('client-browser-title').textContent = cfg.title;
    document.getElementById('client-browser-sub').textContent = cfg.sub;
    document.getElementById('client-browser-frame').srcdoc = NB.WebStudio.buildDocument(cfg.mode);

    const inspect = document.getElementById('packet-inspect');
    if (cfg.packets && cfg.packets.length) {
      inspect.hidden = false;
      inspect.innerHTML = cfg.packets.map(p => `
        <div class="pkt-card ${p.lost ? 'lost' : ''}">
          <strong>Packet ${p.id} · ${p.file} ${p.lost ? '✕ LOST' : '✓'}</strong>
          <code>${escapeHtml(p.payload.slice(0, 56))}${p.payload.length > 56 ? '…' : ''}</code>
        </div>
      `).join('');
    } else {
      inspect.hidden = true;
    }

    const contBtn = document.getElementById('btn-browser-continue');
    contBtn.onclick = () => {
      document.getElementById('modal-browser').hidden = true;
      if (cfg.onContinue) cfg.onContinue();
    };
    document.getElementById('modal-browser').hidden = false;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---------- Debrief, Quiz & Unlock Modal ---------- */
  function justifyCheck(text, j) {
    const t = ' ' + text.toLowerCase() + ' ';
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const hit = j.groups.filter(g => g.some(k => t.includes(k))).length;
    const typedMore = text.trim().length > (j.stem || '').trim().length + 15;
    return { ok: wordCount >= 10 && hit >= j.need && typedMore, wordCount, hit };
  }

  function openDebrief(m) {
    const meta = state.meta[m.id];
    document.getElementById('debrief-kicker').textContent = `${missionName(m)}: test passed!`;
    document.getElementById('debrief-title').textContent = m.title;
    document.getElementById('debrief-takeaway').textContent = m.takeaway;

    const quizBox = document.getElementById('debrief-quiz');
    const justBox = document.getElementById('debrief-justify');
    const unlockBox = document.getElementById('debrief-unlock');
    const nextBtn = document.getElementById('btn-next-mission');
    const fb = document.getElementById('quiz-feedback');
    const predBox = document.getElementById('debrief-predict');
    fb.hidden = true;

    // Prediction result
    if (m.predict && meta && meta.predicted !== undefined) {
      const right = meta.predicted === m.predict.correct;
      predBox.hidden = false;
      predBox.className = 'predict-result ' + (right ? 'ok' : 'bad');
      predBox.innerHTML = `<strong>Your prediction: ${right ? 'correct!' : 'not quite.'}</strong> You said "${escapeHtml(m.predict.options[meta.predicted])}". ${escapeHtml(m.predict.explain)}`;
    } else {
      predBox.hidden = true;
    }

    const alreadyDone = !!state.done[m.id];

    function revealUnlock() {
      state.done[m.id] = m.code;
      saveDone();
      renderProgress();
      renderTabs();
      unlockBox.hidden = false;
      document.getElementById('debrief-code').textContent = m.code;
      const next = NB.MISSIONS[m.id + 1];
      const lastCore = m.id + 1 === PRO_START;
      document.getElementById('debrief-next-msg').textContent = !next
        ? 'You have completed every Pro mission. Open your Passport to review your code words and justifications.'
        : lastCore
          ? 'You have completed all 8 core missions! The Pro missions are waiting.'
          : `${missionName(next)} (“${next.title}”) is now unlocked!`;
      nextBtn.hidden = !next;
      nextBtn.textContent = lastCore ? 'Start the Pro Missions →' : 'Unlock & Start Next Mission →';
      nextBtn.onclick = () => {
        document.getElementById('modal-debrief').hidden = true;
        selectMission(m.id + 1);
      };
    }

    function showJustify() {
      const j = m.justify;
      justBox.hidden = false;
      const ta = document.getElementById('justify-text');
      const jfb = document.getElementById('justify-feedback');
      document.getElementById('justify-prompt').textContent = j.prompt;
      document.getElementById('justify-keys').textContent = `Write at least 10 words. Key ideas to include: ${j.hint}.`;
      ta.value = state.just[m.id] || j.stem || '';
      jfb.textContent = '';
      document.getElementById('btn-justify').onclick = () => {
        const res = justifyCheck(ta.value, j);
        if (res.ok) {
          state.just[m.id] = ta.value.trim();
          jfb.className = 'quiz-feedback ok';
          jfb.textContent = '✓ Good explanation. Copy it into your book.';
          revealUnlock();
        } else {
          jfb.className = 'quiz-feedback bad';
          jfb.textContent = res.wordCount < 10
            ? `Add more detail: you have ${res.wordCount} words and need at least 10.`
            : `Nearly. Make sure you mention the key ideas: ${j.hint}.`;
        }
      };
    }

    justBox.hidden = true;
    if (alreadyDone) {
      quizBox.hidden = true;
      revealUnlock();
    } else if (!m.quiz) {
      quizBox.hidden = true;
      unlockBox.hidden = true;
      nextBtn.hidden = true;
      showJustify();
    } else {
      quizBox.hidden = false;
      unlockBox.hidden = true;
      nextBtn.hidden = true;
      document.getElementById('quiz-q').textContent = m.quiz.q;
      const optsWrap = document.getElementById('quiz-options');
      optsWrap.innerHTML = '';
      m.quiz.options.forEach((optText, oi) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-opt';
        btn.textContent = optText;
        btn.addEventListener('click', () => {
          if (oi === m.quiz.correct) {
            btn.classList.add('correct');
            fb.hidden = false;
            fb.className = 'quiz-feedback ok';
            fb.textContent = '✓ Spot on! ' + m.quiz.explain;
            optsWrap.querySelectorAll('button').forEach(b => b.disabled = true);
            if (m.justify) showJustify(); else revealUnlock();
          } else {
            btn.classList.add('wrong');
            fb.hidden = false;
            fb.className = 'quiz-feedback bad';
            fb.textContent = 'Not quite — try another answer!';
          }
        });
        optsWrap.appendChild(btn);
      });
    }

    document.getElementById('modal-debrief').hidden = false;
  }

  /* ---------- Passport Modal ---------- */
  function openPassport() {
    const grid = document.getElementById('passport-grid');
    grid.innerHTML = NB.MISSIONS.map((m, i) => {
      const code = state.done[i];
      return `
        <div class="pass-item ${code ? 'done' : ''} ${m.track === 'pro' ? 'pro' : ''}">
          <div style="font-size:0.74rem;font-weight:900;color:var(--muted);">${missionName(m).toUpperCase()} ${'★'.repeat(m.stars)}</div>
          <div class="p-title">${m.title}</div>
          <div class="p-code">${code ? `✓ ${code}` : '🔒 Locked / Incomplete'}</div>
        </div>
      `;
    }).join('');
    const just = NB.MISSIONS.filter(m => state.just[m.id]);
    document.getElementById('passport-just').innerHTML = just.length
      ? '<h4>My justifications (copy these into your book)</h4>' + just.map(m => `<div class="just-item"><strong>${missionName(m)}: ${m.title}</strong><p>${escapeHtml(state.just[m.id])}</p></div>`).join('')
      : '';
    document.getElementById('modal-passport').hidden = false;
  }

  /* ---------- Mission Switching & Controls ---------- */
  function selectMission(idx) {
    if (!isUnlocked(idx)) return;
    state.m = idx;
    state.track = trackOf(idx);
    state.selectedId = null;
    state.hint = false;
    document.getElementById('interactive-bar').hidden = true;
    document.getElementById('layer-fx').innerHTML = '';
    clearLog();
    addLog(`Loaded ${missionName(NB.MISSIONS[idx])}: ${NB.MISSIONS[idx].title}.`);
    setTool(NB.MISSIONS[idx].tools[0] || 'move');
    updateUI();
  }

  function updateUI() {
    renderProgress();
    renderTabs();
    renderSidebar();
    renderToolbar();
    renderBoard();
  }

  function updateTimerDisplay() {
    const mins = String(Math.floor(state.timerSec / 60)).padStart(2, '0');
    const secs = String(state.timerSec % 60).padStart(2, '0');
    document.getElementById('timer-display').textContent = `${mins}:${secs}`;
  }

  function toggleTimer() {
    const btn = document.getElementById('btn-timer');
    if (state.timerRunning) {
      clearInterval(state.timerHandle);
      state.timerRunning = false;
      btn.classList.remove('active');
    } else {
      state.timerRunning = true;
      btn.classList.add('active');
      state.timerHandle = setInterval(() => {
        if (state.timerSec > 0) {
          state.timerSec--;
          updateTimerDisplay();
        } else {
          clearInterval(state.timerHandle);
          state.timerRunning = false;
          btn.classList.remove('active');
          addLog('⏱ Workshop timer finished!', 'warn');
        }
      }, 1000);
    }
  }

  /* ---------- Boot ---------- */
  function boot() {
    initBoards();
    setupCanvasPointerEvents();

    NB.Firewall.init();
    NB.WebStudio.init(() => {
      // Mission 4 sends the page across the network. Anywhere else, an update goes live straight away.
      if (M().simType === 'web' || !NB.WebStudio.isDeployed()) {
        addLog('Your page is ready to deploy. Finish the checklist, then send it across the network to the Web Server.', 'ok');
      } else {
        const ver = NB.WebStudio.goLive();
        addLog(`Deployed version ${ver} of your page to the Web Server.`, 'ok');
      }
      updateUI();
    });

    const switchTrack = (track) => {
      const idxs = NB.MISSIONS.map((_, i) => i).filter(i => trackOf(i) === track);
      const target = idxs.find(i => isUnlocked(i) && !state.done[i]);
      selectMission(target !== undefined ? target : idxs[0]);
    };
    document.getElementById('track-core').addEventListener('click', () => { if (state.track !== 'core') switchTrack('core'); });
    document.getElementById('track-pro').addEventListener('click', () => { if (state.track !== 'pro') switchTrack('pro'); });

    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => setTool(btn.dataset.tool));
    });

    document.getElementById('btn-run').addEventListener('click', runCurrentMission);
    document.getElementById('btn-hint').addEventListener('click', () => {
      state.hint = !state.hint;
      renderSidebar();
      renderBoard();
    });
    document.getElementById('btn-reset').addEventListener('click', () => {
      state.boards[state.m] = cloneBoard(M().starter());
      state.meta[state.m] = {};
      state.selectedId = null;
      document.getElementById('interactive-bar').hidden = true;
      addLog('Reset mission board to starter layout.');
      updateUI();
    });
    document.getElementById('btn-clear-log').addEventListener('click', clearLog);
    document.getElementById('btn-open-studio').addEventListener('click', () => NB.WebStudio.open());
    document.getElementById('btn-passport').addEventListener('click', openPassport);
    document.getElementById('btn-timer').addEventListener('click', toggleTimer);

    const teacherBtn = document.getElementById('btn-teacher');
    teacherBtn.classList.toggle('active', state.teacher);
    teacherBtn.addEventListener('click', () => {
      state.teacher = !state.teacher;
      teacherBtn.classList.toggle('active', state.teacher);
      addLog(state.teacher ? 'Teacher Mode ON: every mission is unlocked.' : 'Teacher Mode OFF: missions unlock in order.', 'warn');
      renderTabs();
    });

    document.getElementById('btn-theme').addEventListener('click', () => {
      const root = document.documentElement;
      const isDark = root.getAttribute('data-theme') === 'dark';
      root.setAttribute('data-theme', isDark ? 'light' : 'dark');
    });

    document.getElementById('btn-reset-all').addEventListener('click', () => {
      if (!confirm('Reset all completed missions and code words?')) return;
      state.done = {};
      state.just = {};
      saveDone();
      NB.WebStudio.resetAll();
      NB.Firewall.reset();
      initBoards();
      document.getElementById('modal-passport').hidden = true;
      selectMission(0);
    });

    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById(btn.dataset.close).hidden = true;
      });
    });

    selectMission(location.hash === '#pro' ? PRO_START : 0);
  }

  window.addEventListener('hashchange', () => location.reload());
  document.addEventListener('DOMContentLoaded', boot);
})();
