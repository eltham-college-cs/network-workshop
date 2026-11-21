/* Na<>y Builds Web Studio for Network Builder Workshop
   Three ways to make a page:
   - guided:      level by level, with goals, hints and "Check my page" (like Na<>y Builds)
   - paste:       paste the hobby page you downloaded from Na<>y Builds
   - independent: free build with stretch goals and no hints (extension)            */
window.NB = window.NB || {};

NB.WebStudio = (function () {
  const STORAGE_KEY = 'y8-nb-website-v2';
  const NAVVY_BASE = 'https://eltham-college-cs.github.io/navvy-builds/';

  const STARTERS = {
    guided: {
      html: '<!-- Level 1: type your main heading on the next line -->\n',
      css: '/* Level 4: add your CSS rules here */\n'
    },
    paste: { html: '', css: '' },
    independent: {
      html: '<h1>My page</h1>\n<p>Write about anything you like.</p>\n',
      css: 'body {\n  font-family: sans-serif;\n}\n'
    }
  };

  const has = (re) => (s) => re.test(s);
  const words = (s) => s.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  const inner = (html, tag) => {
    const m = new RegExp('<' + tag + '\\b[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'i').exec(html);
    return m ? m[1] : '';
  };
  const cssRule = (css, sel, prop) =>
    new RegExp('(^|[},\\s])' + sel + '\\s*(,[^{]*)?\\{[^}]*' + prop + '\\s*:\\s*[^;}\\s]', 'i').test(css);

  /* Guided levels. Each goal: label, test(html, css), hints[] */
  const LEVELS = [
    {
      name: 'Heading',
      intro: 'Every page needs a main heading. Tell visitors what your page is about.',
      goals: [{
        label: 'Add a main heading with <h1> about your hobby',
        test: (h) => words(inner(h, 'h1')) >= 1,
        hints: ['A heading starts with <h1> and ends with </h1>. Your words go in between.', 'Type this, with your own hobby: <h1>Skateboarding</h1>']
      }]
    },
    {
      name: 'Paragraph',
      intro: 'Paragraphs hold your sentences. Say something about your hobby.',
      goals: [{
        label: 'Add a paragraph with <p> that has 5 or more words',
        test: (h) => words(inner(h, 'p')) >= 5,
        hints: ['A paragraph starts with <p> and ends with </p>. Put it on a new line under your heading.', 'Type this, in your own words: <p>I skate at the park every Saturday.</p>']
      }]
    },
    {
      name: 'List',
      intro: 'Lists make things easy to read. Add your top three.',
      goals: [{
        label: 'Add a list with <ul> that has 3 <li> items',
        test: (h) => /<ul\b[^>]*>[\s\S]*<\/ul>/i.test(h) && (inner(h, 'ul').match(/<li\b[^>]*>[\s\S]*?\S[\s\S]*?<\/li>/gi) || []).length >= 3,
        hints: ['A list is <ul> ... </ul>. Each item inside it is <li> ... </li>.', 'Type:\n<ul>\n  <li>Ollie</li>\n  <li>Kickflip</li>\n  <li>Manual</li>\n</ul>']
      }]
    },
    {
      name: 'Style it',
      intro: 'HTML is the content. CSS is the style. Click the style.css tab for this level.',
      goals: [
        {
          label: 'In style.css, give your h1 a colour',
          test: (h, c) => cssRule(c, 'h1', 'color'),
          hints: ['Click the style.css tab. A CSS rule says what to style, then how, inside curly brackets.', 'Type this in style.css: h1 { color: darkblue; }']
        },
        {
          label: 'In style.css, give the body a background colour',
          test: (h, c) => cssRule(c, 'body', 'background(-color)?'),
          hints: ['The body is the whole page. Its rule starts with: body {', 'Type this in style.css: body { background: lightyellow; }']
        }
      ]
    },
    {
      name: 'Make it yours',
      bonus: true,
      intro: 'Bonus level. You can deploy now, or polish your page first.',
      goals: [
        {
          label: 'Add a smaller heading with <h2>',
          test: (h) => words(inner(h, 'h2')) >= 1,
          hints: ['<h2> works just like <h1> but is smaller. Use it above your list.', 'Type: <h2>My best tricks</h2>']
        },
        {
          label: 'In style.css, change the font with font-family',
          test: (h, c) => /font-family\s*:\s*[^;}\s]/i.test(c),
          hints: ['font-family goes inside a rule, like the body rule.', 'Add this line inside your body rule: font-family: sans-serif;']
        }
      ]
    }
  ];
  const DEPLOY_LEVEL = 4; // levels 1-4 must be cleared in guided mode

  const STRETCH = [
    ['A second heading (<h2>)', (h) => words(inner(h, 'h2')) >= 1],
    ['A list with 3 or more items', (h) => (h.match(/<li\b/gi) || []).length >= 3],
    ['A link (<a href="...">)', (h) => /<a\b[^>]*href\s*=/i.test(h)],
    ['Bold or italic text (<strong> or <em>)', (h) => /<(strong|em|b|i)\b/i.test(h)],
    ['3 or more CSS rules', (h, c) => (c.match(/\{[^}]*:[^}]*\}/g) || []).length >= 3],
    ['A class used in HTML and styled in CSS', (h, c) => {
      const m = /class\s*=\s*["']([A-Za-z][\w-]*)/i.exec(h);
      return !!m && new RegExp('\\.' + m[1] + '\\b').test(c);
    }]
  ];

  let data = {
    mode: 'guided',
    html: STARTERS.guided.html,
    css: STARTERS.guided.css,
    level: 0,              // guided: index of the current level (levels below are cleared)
    hints: {},             // "level-goal" -> hints shown
    site: 'my-hobby',
    ready: false,          // "Ready to deploy" pressed, waiting to cross the network
    deployed: false,       // live on the Web Server
    version: 0,
    deployedHtml: '',
    deployedCss: ''
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && typeof saved.html === 'string') data = Object.assign(data, saved);
  } catch (e) {}

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function stripScripts(str) {
    return String(str || '')
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<\/?(script|iframe|object|embed|link|meta|base)\b[^>]*>/gi, '')
      .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/javascript\s*:/gi, '');
  }

  function baseChecks(html, css) {
    return [
      { label: 'A main heading (<h1>)', pass: words(inner(html, 'h1')) >= 1 },
      { label: 'A paragraph (<p>)', pass: words(inner(html, 'p')) >= 1 },
      { label: 'Some CSS styling (a colour, background, font or border)', pass: /(color|background|font-family|border)\s*:/i.test(css) }
    ];
  }

  function canDeploy() {
    if (data.mode === 'guided') return data.level >= DEPLOY_LEVEL;
    return baseChecks(data.html, data.css).every(c => c.pass);
  }

  /* Turn a whole pasted page (doctype, head, style, body) into body HTML + CSS */
  function parsePasted(text) {
    let src = String(text || '');
    let css = '';
    src = src.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (m, c) => { css += c.trim() + '\n'; return ''; });
    const body = /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(src);
    let html = body ? body[1] : src.replace(/<!doctype[^>]*>/i, '').replace(/<\/?(html|head|body)\b[^>]*>/gi, '').replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '');
    html = stripScripts(html).trim();
    // Na<>y Builds pictures use paths on its own site; point them back there so they still load.
    html = html.replace(/(<img\b[^>]*\ssrc\s*=\s*["'])(?!https?:|data:)\/?(?:navvy-builds\/)?([^"']+)/gi, '$1' + NAVVY_BASE + '$2');
    return { html, css: css.trim() };
  }

  function buildDocument(mode, customHtml, customCss) {
    if (mode === 'defaced') {
      return `<!doctype html><html><body style="margin:0;padding:24px;background:#1b0b12;color:#ff5d8f;font-family:monospace;text-align:center;">
        <h1 style="font-size:2rem;margin:10px 0;">SITE DEFACED!</h1>
        <p style="color:#ffd6e0;font-size:1rem;">An unauthorised packet from the Internet overwrote <strong>index.html</strong> on your Web Server!</p>
        <p style="color:#ffc83d;font-size:0.9rem;">Fix: a <strong>Firewall</strong> must check every packet before it reaches the Router.</p>
      </body></html>`;
    }
    if (mode === 'unreachable') {
      return `<!doctype html><html><body style="margin:0;padding:22px 16px;background:#f3f8ff;color:#1b2440;font-family:sans-serif;text-align:center;">
        <div style="font-size:2.2rem;font-weight:900;color:#56628a;">!</div>
        <h1 style="font-size:1.1rem;margin:6px 0;">Can't reach this page</h1>
        <p style="font-size:0.85rem;color:#56628a;">This device has no link to the Router, so its request has nowhere to go.</p>
      </body></html>`;
    }
    const live = data.deployed;
    const html = stripScripts(customHtml !== undefined ? customHtml : (live ? data.deployedHtml : data.html));
    const css = mode === 'unstyled'
      ? ''
      : stripScripts(customCss !== undefined ? customCss : (live ? data.deployedCss : data.css)).replace(/<\/style/gi, '');
    return `<!doctype html>
<html lang="en-GB">
<head><meta charset="utf-8"><style>${css}</style></head>
<body>${html}</body>
</html>`;
  }

  function getPacketSnippets(includeCssLost) {
    const html = (data.deployed ? data.deployedHtml : data.html).trim().replace(/\s+/g, ' ');
    const css = (data.deployed ? data.deployedCss : data.css).trim().replace(/\s+/g, ' ');
    const mid = Math.max(20, Math.floor(html.length / 2));
    return [
      { id: 1, file: 'index.html', payload: html.slice(0, mid) || '<h1>My Page</h1>', lost: false },
      { id: 2, file: 'index.html', payload: html.slice(mid, mid + 70) || '<p>Hello world</p>', lost: false },
      { id: 3, file: 'style.css', payload: css.slice(0, 65) || 'body { background: #e8f4ff; }', lost: !!includeCssLost },
      { id: 4, file: 'style.css', payload: css.slice(65, 130) || 'h1 { color: #2b2f86; }', lost: false }
    ];
  }

  function goLive() {
    data.deployed = true;
    data.ready = false;
    data.version += 1;
    data.deployedHtml = data.html;
    data.deployedCss = data.css;
    save();
    refresh();
    return data.version;
  }

  const el = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let onReadyCallback = null;
  let feedback = null; // {text, tone}

  function renderGuided() {
    const box = el('studio-guided');
    const lvIdx = Math.min(data.level, LEVELS.length - 1);
    const allDone = data.level >= LEVELS.length;
    const lv = LEVELS[lvIdx];
    const dots = LEVELS.map((l, i) =>
      `<span class="lv-dot ${i < data.level ? 'done' : i === lvIdx && !allDone ? 'now' : ''}" title="Level ${i + 1}: ${l.name}">${i < data.level ? '✓' : l.bonus ? '★' : i + 1}</span>`
    ).join('');
    let h = `<div class="lv-head"><div class="lv-dots" aria-label="Levels">${dots}</div>
      <strong>${allDone ? 'All levels cleared!' : `Level ${lvIdx + 1}: ${lv.name}${lv.bonus ? ' (bonus)' : ''}`}</strong></div>`;
    if (allDone) {
      h += '<p class="lv-intro">Brilliant. Your page is ready for the Web Server.</p>';
    } else {
      h += `<p class="lv-intro">${esc(lv.intro)}</p><ul class="lv-goals">`;
      lv.goals.forEach((g, gi) => {
        const pass = g.test(data.html, data.css);
        const key = lvIdx + '-' + gi;
        const shown = data.hints[key] || 0;
        h += `<li class="${pass ? 'ok' : ''}"><div class="lv-goal-row"><span><em>${pass ? 'Done:' : 'Not done yet:'}</em> ${esc(g.label)}</span>` +
          (pass ? '' : `<button type="button" class="link-btn lv-hint-btn" data-hint="${key}">${shown ? `Hint ${shown} of ${g.hints.length}` : 'Hint'}</button>`) + '</div>' +
          (shown && !pass ? `<pre class="lv-hint">${esc(g.hints.slice(0, shown).join('\n\n'))}</pre>` : '') + '</li>';
      });
      h += '</ul>';
    }
    h += `<div class="lv-foot"><button type="button" id="btn-check-page" class="btn btn-grape btn-check"${allDone ? ' disabled' : ''}>Check my page</button>
      <span class="lv-feedback ${feedback ? feedback.tone : ''}" role="status">${feedback ? esc(feedback.text) : 'Type your code, then press Check my page.'}</span></div>`;
    box.innerHTML = h;

    box.querySelectorAll('[data-hint]').forEach(b => b.addEventListener('click', () => {
      const [li, gi] = b.dataset.hint.split('-').map(Number);
      const max = LEVELS[li].goals[gi].hints.length;
      data.hints[b.dataset.hint] = Math.min(max, (data.hints[b.dataset.hint] || 0) + 1);
      save();
      renderGuided();
    }));
    const check = el('btn-check-page');
    if (check) check.addEventListener('click', () => {
      const cur = LEVELS[Math.min(data.level, LEVELS.length - 1)];
      const left = cur.goals.filter(g => !g.test(data.html, data.css));
      if (!left.length) {
        data.level += 1;
        feedback = data.level >= LEVELS.length
          ? { text: 'Every level cleared. Great work!', tone: 'ok' }
          : { text: `Level cleared! ${data.level === DEPLOY_LEVEL ? 'You can deploy now, or try the bonus level.' : 'On to the next one.'}`, tone: 'ok' };
      } else {
        feedback = { text: `Nearly. ${left.length} goal${left.length > 1 ? 's' : ''} still to do. Use a Hint if you are stuck.`, tone: 'bad' };
      }
      save();
      refresh();
    });
  }

  function renderIndependent() {
    const rows = STRETCH.map(([label, fn]) => {
      const ok = fn(data.html, data.css);
      return `<li class="${ok ? 'ok' : ''}">${ok ? '✓' : '○'} ${esc(label)}</li>`;
    }).join('');
    const n = STRETCH.filter(([, fn]) => fn(data.html, data.css)).length;
    el('studio-independent').innerHTML =
      `<div class="lv-head"><strong>Independent build (extension)</strong><span class="stretch-count">${n} / ${STRETCH.length} stretch goals</span></div>
       <p class="lv-intro">No levels and no hints. Design your own page, then see how many stretch goals you can tick.</p>
       <ul class="studio-check-list">${rows}</ul>`;
  }

  function refresh() {
    const htmlEl = el('code-html');
    if (!htmlEl) return;
    const cssEl = el('code-css');
    data.html = htmlEl.value;
    data.css = cssEl.value;
    save();

    document.querySelectorAll('.studio-mode').forEach(b => b.classList.toggle('active', b.dataset.mode === data.mode));
    el('studio-guided').hidden = data.mode !== 'guided';
    el('studio-paste').hidden = data.mode !== 'paste';
    el('studio-independent').hidden = data.mode !== 'independent';
    if (data.mode === 'guided') renderGuided();
    if (data.mode === 'independent') renderIndependent();

    el('studio-preview').srcdoc = buildDocument('normal', data.html, data.css);
    el('studio-url').textContent = 'preview only · ' + getAddress();

    const checks = baseChecks(data.html, data.css);
    el('studio-check-list').innerHTML = checks.map(c => `<li class="${c.pass ? 'ok' : ''}">${c.pass ? '✓' : '○'} ${esc(c.label)}</li>`).join('');
    el('studio-checks').hidden = data.mode === 'guided';

    const ok = canDeploy();
    const changed = !data.deployed || data.html !== data.deployedHtml || data.css !== data.deployedCss;
    const btn = el('btn-deploy');
    btn.disabled = !ok || !changed;
    btn.textContent = data.deployed ? `Deploy version ${data.version + 1}` : 'Ready to deploy';
    el('deploy-hint').textContent = !ok
      ? (data.mode === 'guided' ? `Clear levels 1 to ${DEPLOY_LEVEL} to deploy (you are on level ${Math.min(data.level + 1, LEVELS.length)}).` : 'Tick all 3 page checks to deploy.')
      : !changed ? `Version ${data.version} is live. Change your page to deploy again.`
      : data.ready ? 'Ready! Close the studio and send it across the network.'
      : 'All set. Your page can go to the Web Server.';
  }

  function setMode(mode) {
    if (mode === data.mode) return;
    const blank = !data.html.replace(/<!--[\s\S]*?-->/g, '').trim();
    const isStarter = Object.keys(STARTERS).some(k => STARTERS[k].html === data.html);
    data.mode = mode;
    if (blank || isStarter) {
      el('code-html').value = STARTERS[mode].html;
      el('code-css').value = STARTERS[mode].css;
    }
    feedback = null;
    refresh();
  }

  function init(onReady) {
    onReadyCallback = onReady;
    const htmlEl = el('code-html');
    const cssEl = el('code-css');
    htmlEl.value = data.html;
    cssEl.value = data.css;
    el('site-name').value = data.site;

    htmlEl.addEventListener('input', refresh);
    cssEl.addEventListener('input', refresh);
    [htmlEl, cssEl].forEach(t => t.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      e.preventDefault();
      const s = t.selectionStart;
      t.value = t.value.slice(0, s) + '  ' + t.value.slice(t.selectionEnd);
      t.selectionStart = t.selectionEnd = s + 2;
      refresh();
    }));

    document.querySelectorAll('.studio-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.studio-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const isHtml = tab.dataset.file === 'html';
        htmlEl.hidden = !isHtml;
        cssEl.hidden = isHtml;
      });
    });

    document.querySelectorAll('.studio-mode').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

    el('btn-use-paste').addEventListener('click', () => {
      const raw = el('paste-box').value;
      const msg = el('paste-msg');
      if (!raw.trim()) { msg.textContent = 'Paste your page code into the box first.'; msg.className = 'lv-feedback bad'; return; }
      const parsed = parsePasted(raw);
      if (!parsed.html) { msg.textContent = 'No page content found. Copy everything from your Na<>y Builds file and try again.'; msg.className = 'lv-feedback bad'; return; }
      htmlEl.value = parsed.html;
      cssEl.value = parsed.css || '/* No CSS was found in your page. Add some rules here. */\n';
      el('paste-box').value = '';
      msg.textContent = `Imported! ${parsed.css ? 'Your styles went into style.css.' : 'Your page had no CSS, so add some in style.css.'} You can keep editing below.`;
      msg.className = 'lv-feedback ok';
      refresh();
    });

    el('site-name').addEventListener('input', (e) => {
      data.site = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 18) || 'my-hobby';
      save();
      el('studio-url').textContent = 'preview only · ' + getAddress();
    });
    el('site-name').addEventListener('blur', (e) => { e.target.value = data.site; });

    el('btn-studio-restart').addEventListener('click', () => {
      if (!confirm('Start your page again? Your code in this mode will be cleared.')) return;
      htmlEl.value = STARTERS[data.mode].html;
      cssEl.value = STARTERS[data.mode].css;
      data.level = 0;
      data.hints = {};
      feedback = null;
      refresh();
    });

    el('btn-deploy').addEventListener('click', () => {
      data.ready = true;
      save();
      refresh();
      el('modal-studio').hidden = true;
      if (onReadyCallback) onReadyCallback();
    });

    refresh();
  }

  function open() {
    el('modal-studio').hidden = false;
    refresh();
  }

  function resetAll() {
    data = Object.assign(data, {
      mode: 'guided', html: STARTERS.guided.html, css: STARTERS.guided.css, level: 0, hints: {},
      site: 'my-hobby', ready: false, deployed: false, version: 0, deployedHtml: '', deployedCss: ''
    });
    feedback = null;
    save();
    if (el('code-html')) {
      el('code-html').value = data.html;
      el('code-css').value = data.css;
      el('site-name').value = data.site;
      refresh();
    }
  }

  const getAddress = () => `www.${data.site}.eltham`;

  return {
    init, open, resetAll, buildDocument, getPacketSnippets, goLive, parsePasted, getAddress,
    isDeployed: () => data.deployed,
    isReady: () => data.ready,
    getVersion: () => data.version,
    getMode: () => data.mode,
    stretchCount: () => STRETCH.filter(([, fn]) => fn(data.html, data.css)).length
  };
})();
