/* Firewall activities for Network Builder Workshop
   A) Firewall duty: allow or block each packet, then say why.
   B) Rule builder: write sentence rules, then run test traffic through them. */
window.NB = window.NB || {};

NB.Firewall = (function () {
  const el = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ------------------------------------------------------------------ A) Firewall duty */
  const REASONS = {
    read: 'It only wants to read a public page',
    reply: 'It is a reply to something we asked for',
    change: 'It tries to change our files',
    unasked: 'Nobody in school asked for it',
    private: 'It asks for private data',
    flood: 'It is trying to overload our server'
  };

  const PACKETS = [
    { from: 'Library Laptop (inside school)', to: 'School Web Server', wants: 'Read the page index.html', asked: 'Yes. A pupil typed the address.', allow: true, why: 'read' },
    { from: 'Unknown computer', to: 'School Web Server', wants: 'Change index.html', asked: 'No. Nobody in school requested this.', allow: false, why: 'change' },
    { from: "Gran's tablet (at home)", to: 'School Web Server', wants: 'Read the page index.html', asked: 'She typed your web address.', allow: true, why: 'read' },
    { from: 'Unknown computer', to: 'Student PC', wants: 'Deliver the file free-game.exe', asked: 'No. Nobody in school requested this.', allow: false, why: 'unasked' },
    { from: 'BBC Bitesize server', to: 'Student PC', wants: 'Deliver a revision page', asked: 'Yes. Student PC asked for it 1 second ago.', allow: true, why: 'reply' },
    { from: 'Unknown computer', to: 'File Server', wants: 'Get a list of every password', asked: 'No. Nobody in school requested this.', allow: false, why: 'private' },
    { from: 'Unknown computer', to: 'School Web Server', wants: 'Send 10,000 page requests every second', asked: 'No real visitor needs that many.', allow: false, why: 'flood' },
    { from: 'Homework site server', to: 'Teacher Laptop', wants: 'Deliver the page the teacher opened', asked: 'Yes. The teacher clicked a link.', allow: true, why: 'reply' }
  ];
  const PASS_MARK = 6;

  let duty = null;

  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function openDuty(opts) {
    duty = { opts: opts || {}, queue: shuffle(PACKETS), i: 0, score: 0, right: 0, health: 3, visitors: 0, visitorsTotal: PACKETS.filter(p => p.allow).length, log: [], stage: 'decide', lastOk: false };
    el('modal-duty').hidden = false;
    renderDuty();
  }

  function reasonChoices(p) {
    const keys = Object.keys(REASONS).filter(k => k !== p.why);
    return shuffle([p.why].concat(shuffle(keys).slice(0, 3)));
  }

  function renderDuty() {
    const d = duty;
    el('duty-score').innerHTML = `<span>Packet ${Math.min(d.i + 1, d.queue.length)} of ${d.queue.length}</span><strong>Score ${d.score}</strong>`;
    const body = el('duty-body');
    const side = `
      <aside class="duty-side">
        <div class="duty-meter"><div class="duty-meter-row"><span>Website health</span><strong>${d.health > 0 ? d.health + ' / 3' : 'Defaced!'}</strong></div>
          <div class="meter"><i style="width:${(d.health / 3) * 100}%" class="${d.health < 2 ? 'low' : ''}"></i></div></div>
        <div class="duty-meter"><div class="duty-meter-row"><span>Happy visitors</span><strong>${d.visitors} / ${d.visitorsTotal}</strong></div>
          <div class="meter"><i style="width:${(d.visitors / d.visitorsTotal) * 100}%" class="sun"></i></div></div>
        <p class="duty-tip">Block too much and real visitors cannot see your page. Block too little and attacks get in.</p>
        <div class="duty-log">${d.log.slice().reverse().map(l => `<div class="${l.ok ? 'ok' : 'bad'}"><b>${l.allowed ? 'Allowed' : 'Blocked'}</b> ${esc(l.text)}</div>`).join('') || '<div class="muted">Your decisions will appear here.</div>'}</div>
      </aside>`;

    if (d.stage === 'end') {
      const pass = d.right >= PASS_MARK && d.health > 0;
      body.innerHTML = `<div class="duty-grid"><section class="duty-main">
          <div class="duty-end ${pass ? 'ok' : 'bad'}">
            <h3>${pass ? 'Shift complete. The network is safe!' : d.health <= 0 ? 'Too many attacks got through.' : 'Not quite enough correct decisions.'}</h3>
            <p>You made <b>${d.right} of ${d.queue.length}</b> correct decisions and scored <b>${d.score}</b>. ${pass ? '' : `You need ${PASS_MARK} correct, with the website still standing.`}</p>
            <p class="duty-rule">A firewall checks every packet at the edge of the network, like a door supervisor checking tickets. It lets through traffic we want and stops traffic we do not.</p>
            <button id="duty-next" class="btn btn-primary" type="button">${pass ? 'Continue →' : 'Try the shift again'}</button>
          </div></section>${side}</div>`;
      el('duty-next').addEventListener('click', () => {
        if (pass) { el('modal-duty').hidden = true; if (d.opts.onPass) d.opts.onPass({ score: d.score, right: d.right }); }
        else openDuty(d.opts);
      });
      return;
    }

    const p = d.queue[d.i];
    let main = `
      <div class="duty-card">
        <div class="duty-from"><span class="duty-shield" aria-hidden="true"></span><div><small>At the firewall now</small><strong>From: ${esc(p.from)}</strong></div></div>
        <dl class="duty-facts">
          <dt>Going to</dt><dd>${esc(p.to)}</dd>
          <dt>It wants to</dt><dd>${esc(p.wants)}</dd>
          <dt>Did we ask?</dt><dd>${esc(p.asked)}</dd>
        </dl>`;
    if (d.stage === 'decide') {
      main += `<div class="duty-actions">
          <button id="duty-allow" class="btn duty-allow" type="button">✓ Allow</button>
          <button id="duty-block" class="btn duty-block" type="button">✕ Block</button>
        </div></div>`;
    } else {
      main += `<div class="duty-verdict ${d.lastOk ? 'ok' : 'bad'}">${d.lastOk ? 'Correct decision.' : (p.allow ? 'Oops. That was real traffic we wanted, so it should be allowed.' : 'Oops. That was an attack, so it should be blocked.')}</div></div>
        <div class="duty-why">
          <h4>${d.stage === 'why' ? 'Why should it be ' + (p.allow ? 'allowed' : 'blocked') + '? (bonus 10 points)' : 'The reason'}</h4>
          <div class="duty-chips">${d.choices.map(k => `<button type="button" class="chip-btn ${d.stage === 'done' ? (k === p.why ? 'right' : k === d.picked ? 'wrong' : '') : ''}" data-why="${k}" ${d.stage === 'done' ? 'disabled' : ''}>${esc(REASONS[k])}</button>`).join('')}</div>
          ${d.stage === 'done' ? `<button id="duty-continue" class="btn btn-primary" type="button">${d.i + 1 < d.queue.length ? 'Next packet →' : 'Finish shift →'}</button>` : ''}
        </div>`;
    }
    body.innerHTML = `<div class="duty-grid"><section class="duty-main">${main}</section>${side}</div>`;

    if (d.stage === 'decide') {
      const decide = (allowed) => {
        d.lastOk = allowed === p.allow;
        if (d.lastOk) { d.score += 10; d.right++; }
        if (allowed && !p.allow) d.health = Math.max(0, d.health - 1);
        if (allowed && p.allow) d.visitors++;
        d.log.push({ allowed, ok: d.lastOk, text: `${p.from}: ${p.wants.toLowerCase()}.` });
        d.choices = reasonChoices(p);
        d.picked = null;
        d.stage = 'why';
        renderDuty();
      };
      el('duty-allow').addEventListener('click', () => decide(true));
      el('duty-block').addEventListener('click', () => decide(false));
    } else if (d.stage === 'why') {
      body.querySelectorAll('[data-why]').forEach(b => b.addEventListener('click', () => {
        d.picked = b.dataset.why;
        if (d.picked === p.why) d.score += 10;
        d.stage = 'done';
        renderDuty();
      }));
    } else {
      el('duty-continue').addEventListener('click', () => {
        d.i++;
        d.stage = (d.i >= d.queue.length || d.health <= 0) ? 'end' : 'decide';
        renderDuty();
      });
    }
  }

  /* ------------------------------------------------------------------ B) Rule builder */
  const WHAT = { read: 'requests to read a page', change: 'attempts to change files', unasked: 'files nobody asked for', private: 'requests for private data', any: 'everything else' };
  const FROM = { any: 'anyone', in: 'inside the school', out: 'outside the school' };

  const TESTS = [
    { text: "Gran's tablet reads your page", what: 'read', from: 'out', allow: true, good: 'Visitors can see your site.', bad: 'Real visitors are locked out of your site.' },
    { text: 'Unknown computer changes index.html', what: 'change', from: 'out', allow: false, good: 'The attack is stopped.', bad: 'Your site has been defaced.' },
    { text: 'Your PC deploys version 2 of your page', what: 'change', from: 'in', allow: true, good: 'You can still update your own site.', bad: 'You locked yourself out of your own site.' },
    { text: 'Unknown computer sends free-game.exe', what: 'unasked', from: 'out', allow: false, good: 'The unwanted file never arrives.', bad: 'A file nobody asked for got into school.' },
    { text: 'Library Laptop reads your page', what: 'read', from: 'in', allow: true, good: 'Pupils can see the site.', bad: 'Pupils in school cannot see the site.' },
    { text: 'Unknown computer asks for the password list', what: 'private', from: 'out', allow: false, good: 'Private data stays private.', bad: 'Private data has leaked.' }
  ];

  let rules = null;
  let rulesOpts = null;

  function openRules(opts) {
    rulesOpts = opts || {};
    if (!rules) rules = [{ act: 'allow', what: 'read', from: 'any' }, { act: '', what: 'change', from: 'out' }];
    el('modal-rules').hidden = false;
    el('rules-msg').textContent = 'Build your rules, then press Test.';
    renderRules();
    renderResults(null);
  }

  function sel(name, map, val, idx, placeholder) {
    return `<select class="rule-sel rule-${name}" data-i="${idx}" data-k="${name}" aria-label="Rule ${idx + 1} ${name}">` +
      (placeholder ? `<option value="">${placeholder}</option>` : '') +
      Object.keys(map).map(k => `<option value="${k}" ${k === val ? 'selected' : ''}>${map[k]}</option>`).join('') + '</select>';
  }

  function renderRules() {
    const box = el('rules-list');
    box.innerHTML = rules.map((r, i) => `
      <div class="rule-row ${r.act || 'unset'}">
        <span class="rule-num">${i + 1}</span>
        ${sel('act', { allow: 'ALLOW', block: 'BLOCK' }, r.act, i, 'Choose…')}
        ${sel('what', WHAT, r.what, i)}
        <span class="rule-word">from</span>
        ${sel('from', FROM, r.from, i)}
        <button type="button" class="rule-del" data-del="${i}" aria-label="Remove rule ${i + 1}" ${rules.length <= 1 ? 'disabled' : ''}>✕</button>
        <span class="rule-move"><button type="button" data-up="${i}" aria-label="Move rule ${i + 1} up" ${i === 0 ? 'disabled' : ''}>▲</button><button type="button" data-down="${i}" aria-label="Move rule ${i + 1} down" ${i === rules.length - 1 ? 'disabled' : ''}>▼</button></span>
      </div>`).join('');
    box.querySelectorAll('select').forEach(s => s.addEventListener('change', () => { rules[+s.dataset.i][s.dataset.k] = s.value; renderRules(); }));
    box.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => { rules.splice(+b.dataset.del, 1); renderRules(); }));
    box.querySelectorAll('[data-up]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.up; [rules[i - 1], rules[i]] = [rules[i], rules[i - 1]]; renderRules(); }));
    box.querySelectorAll('[data-down]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.down; [rules[i + 1], rules[i]] = [rules[i], rules[i + 1]]; renderRules(); }));
    el('btn-add-rule').disabled = rules.length >= 5;
  }

  /* First rule that fits wins. If no rule fits, the packet gets through (an unsafe default the pupil must fix). */
  function evaluate(ruleList, t) {
    for (let i = 0; i < ruleList.length; i++) {
      const r = ruleList[i];
      if (!r.act) continue;
      if ((r.what === 'any' || r.what === t.what) && (r.from === 'any' || r.from === t.from)) return { allowed: r.act === 'allow', rule: i + 1 };
    }
    return { allowed: true, rule: 0 };
  }

  function renderResults(results) {
    el('rules-results').innerHTML = TESTS.map((t, i) => {
      const r = results && results[i];
      if (!r) return `<div class="rule-test"><div class="rule-test-top"><span>${esc(t.text)}</span><em class="tag wait">Not tested</em></div></div>`;
      const ok = r.allowed === t.allow;
      const tag = r.rule === 0 ? '<em class="tag none">No rule</em>' : r.allowed ? '<em class="tag allow">Allowed</em>' : '<em class="tag block">Blocked</em>';
      const why = r.rule === 0 ? 'No rule fits, so it got through. ' : `Rule ${r.rule} fits. `;
      return `<div class="rule-test ${ok ? 'ok' : 'bad'}"><div class="rule-test-top"><span>${esc(t.text)}</span>${tag}</div><small>${why}${ok ? 'Correct: ' + t.good : t.bad}</small></div>`;
    }).join('');
  }

  function testRules() {
    if (rules.some(r => !r.act)) { el('rules-msg').textContent = 'One rule still says "Choose…". Pick ALLOW or BLOCK for it.'; return; }
    const results = TESTS.map(t => evaluate(rules, t));
    renderResults(results);
    const right = results.filter((r, i) => r.allowed === TESTS[i].allow).length;
    const noRule = results.some(r => r.rule === 0);
    if (right === TESTS.length && !noRule) {
      el('rules-msg').textContent = `All ${TESTS.length} tests passed. Your firewall is secure!`;
      setTimeout(() => { el('modal-rules').hidden = true; if (rulesOpts.onPass) rulesOpts.onPass({ rules: rules.length }); }, 1400);
    } else if (right === TESTS.length) {
      el('rules-msg').textContent = 'Nearly! Some traffic matched no rule at all. Add a last rule for "everything else".';
    } else {
      el('rules-msg').textContent = `${right} of ${TESTS.length} tests passed. Read the red results, change your rules and test again. Remember: the first rule that fits wins.`;
    }
  }

  function init() {
    el('btn-add-rule').addEventListener('click', () => { if (rules.length < 5) { rules.push({ act: '', what: 'any', from: 'any' }); renderRules(); } });
    el('btn-test-rules').addEventListener('click', testRules);
  }

  function reset() { rules = null; }

  return { init, openDuty, openRules, reset, evaluate, TESTS };
})();
