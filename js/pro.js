/* Pro missions for the Year 8 Network Builder Workshop (consolidation lesson lab).
   Every Pro mission follows Predict -> Test -> Justify:
   - predict: a question answered before the first test
   - run(ctx): the simulation
   - justify: a written explanation (checked for key ideas) that unlocks the code word */
(function () {
  const H = NB.Helpers;
  const D = (id, type, x, y, label, locked, extra) => Object.assign({ id, type, x, y, label: label || NB.DEVICES[type].name, locked: !!locked }, extra || {});
  const L = (a, b, kind, extra) => Object.assign({ a, b, kind: kind || 'eth', broken: false, locked: false }, extra || {});
  const lock = { locked: true };

  /* ---------- Mission 1 helpers: costs ---------- */
  const PRICE = { pc: 250, laptop: 350, phone: 200, router: 100, firewall: 200, file: 500, print: 200, printer: 150 };
  const CABLE = { eth: 5, wifi: 0, fibre: 150 };
  const BUDGET = 2000;
  function cost(b) {
    let total = 0;
    b.devices.forEach(d => { if (!d.locked) total += PRICE[d.type] || 0; });
    b.links.forEach(l => { if (!l.locked) total += CABLE[l.kind] || 0; });
    return total;
  }
  const routerOnline = (b) => {
    const r = H.first(b, 'router'), net = H.first(b, 'internet');
    return !!(r && net && H.findPath(b, r.id, net.id));
  };

  /* ---------- Mission 3 helpers: two sites ---------- */
  const SITE_A = ['a1', 'a2', 'ra', 'fsA'];
  const SITE_B = ['b1', 'b2', 'rb'];
  const crossLinks = (b) => H.activeLinks(b).filter(l => (SITE_A.includes(l.a) && SITE_B.includes(l.b)) || (SITE_B.includes(l.a) && SITE_A.includes(l.b)));
  const ispLink = (b, rid) => { const l = H.linkBetween(b, rid, 'net'); return l && !l.broken ? l : null; };

  /* ---------- Mission 4 helper ---------- */
  const laptopLinks = (b) => H.activeLinks(b).filter(l => l.a === 'lapX' || l.b === 'lapX');

  /* ---------- Mission 6 helper ---------- */
  const videoLink = (b) => { const l = H.linkBetween(b, 'vs', 'r1'); return l && !l.broken ? l : null; };
  const fastKind = (l) => !!l && (l.kind === 'eth' || l.kind === 'fibre');

  const PRO = [
    /* ===================== PRO 1: On a budget ===================== */
    {
      title: 'On a Budget',
      short: 'Budget',
      time: '~5 min',
      stars: 2,
      code: NB.dc('TkNRXkVfQw=='),
      brief: 'The art department has £2,000 for a new network. It needs 4 clients that can save to a File Server and reach the Internet. Every device and cable costs money, so choose carefully.',
      action: 'Test My Budget Network',
      tools: ['move', 'eth', 'wifi', 'fibre', 'delete'],
      palette: ['pc', 'laptop', 'router', 'file', 'firewall', 'print', 'printer'],
      starter: () => ({
        devices: [D('net', 'internet', 770, 120, 'Internet Cloud', true), D('ws', 'web', 890, 120, 'Web Server', true)],
        links: [L('net', 'ws', 'fibre', lock)]
      }),
      ghosts: [],
      stats: (b) => {
        const c = cost(b);
        return `Price list: PC £250 · Laptop £350 · Router £100 · File Server £500 · Firewall £200 · Print Server £200 · Printer £150 · Ethernet £5 · Wi-Fi £0 · Fibre £150.  Spent: £${c.toLocaleString('en-GB')} of £${BUDGET.toLocaleString('en-GB')}${c > BUDGET ? ' (over budget!)' : ''}`;
      },
      checks: [
        ['4 clients connected to the Router', b => H.clientsOnRouter(b).length >= 4],
        ['A File Server cabled to the Router (Ethernet)', b => H.linkedToType(b, H.first(b, 'file'), 'router', 'eth')],
        ['The Router can reach the Internet Cloud over Fibre Optic', b => routerOnline(b) && H.internetUplink(b) && H.internetUplink(b).kind === 'fibre'],
        ['Total cost is £2,000 or less', b => cost(b) > 0 && cost(b) <= BUDGET],
        ['Bonus: add a Firewall and still stay in budget', b => H.isFirewallProtectingRouter(b) && cost(b) <= BUDGET, true]
      ],
      predict: {
        q: 'You need 4 clients. Which option will cost more?',
        options: ['4 Desktop PCs on Ethernet cables', '4 Laptops on Wi-Fi', 'They cost the same'],
        correct: 1,
        explain: 'Wi-Fi saves on cable, but each laptop costs £100 more than a PC, so the laptops cost more overall.'
      },
      justify: {
        prompt: 'Explain one choice you made to stay in budget, and one drawback of your design.',
        stem: 'To stay in budget I chose ',
        groups: [['cost', 'budget', 'cheap', 'expensive', '£', 'money', 'afford', 'price'], ['ethernet', 'wi-fi', 'wifi', 'fibre', 'cable', 'pc', 'laptop', 'firewall', 'printer', 'server'], ['drawback', 'but', 'however', 'risk', 'cannot', "can't", 'no firewall', 'no printer', 'downside']],
        need: 3,
        hint: 'cost, the hardware you chose, a drawback'
      },
      takeaway: 'Setting up a network costs money: hardware, cables and someone to manage it. Network designers trade cost against speed, convenience and security.',
      run: async (ctx) => {
        const { b } = ctx;
        const fs = H.first(b, 'file'), ws = H.first(b, 'web');
        ctx.addLog(`Testing your £${cost(b)} network...`);
        for (const c of H.clientsOnRouter(b).slice(0, 4)) {
          await ctx.animatePacket(H.findPath(b, c.id, fs.id), { label: 'SAVE', color: '#FFC83D', speed: 260 });
        }
        const c0 = H.clientsOnRouter(b)[0];
        await ctx.animatePacket(H.findPath(b, c0.id, ws.id), { label: 'GET /', color: '#FFC83D', speed: 280 });
        await ctx.animatePacket(H.findPath(b, ws.id, c0.id), { label: 'HTML', color: '#3EE0AE', speed: 280, endBurst: 'IN BUDGET ✓' });
        ctx.addLog(`Network works and cost £${cost(b)}. £${BUDGET - cost(b)} left over.`, 'ok');
        ctx.openDebrief();
      }
    },

    /* ===================== PRO 2: Single point of failure ===================== */
    {
      title: 'Single Point of Failure',
      short: 'Server Crash',
      time: '~4 min',
      stars: 2,
      code: NB.dc('R0JcVFZV'),
      allowUnsafeTest: true,
      brief: 'Everyone in the office saves to one File Server. Test the network and watch what happens when that server crashes. Then make the network more reliable and test again.',
      action: 'Test: Crash the Server',
      tools: ['move', 'eth', 'delete'],
      palette: ['file'],
      starter: () => ({
        devices: [
          D('pc1', 'pc', 130, 110, 'PC 1', true), D('pc2', 'pc', 130, 275, 'PC 2', true), D('pc3', 'pc', 130, 440, 'PC 3', true),
          D('r1', 'router', 400, 275, 'Router', true), D('fs1', 'file', 690, 160, 'File Server', true)
        ],
        links: [L('pc1', 'r1', 'eth', lock), L('pc2', 'r1', 'eth', lock), L('pc3', 'r1', 'eth', lock), L('r1', 'fs1', 'eth', lock)]
      }),
      ghosts: [['file', 690, 400]],
      checks: [
        ['Run the test to see what the crash does', (b, meta) => !!meta.tested],
        ['Add a backup File Server', b => H.byType(b, 'file').length >= 2],
        ['Cable the backup to the Router (Ethernet)', b => H.byType(b, 'file').filter(f => H.linkedToType(b, f, 'router', 'eth')).length >= 2]
      ],
      predict: {
        q: 'The only File Server crashes at lunchtime. Who loses access to their saved files?',
        options: ['Only the PC nearest the server', 'Every client on the network', 'Nobody. Files are saved on each PC'],
        correct: 1,
        explain: 'Every client depends on the same server, so when it fails they all lose access. That is a single point of failure.'
      },
      justify: {
        prompt: 'Why is relying on one server a drawback of a network? How did you reduce the risk?',
        stem: 'If the only server fails, ',
        groups: [['server'], ['fail', 'crash', 'break', 'broke', 'down', 'single point'], ['backup', 'second', 'spare', 'another', 'two', 'copy', 'extra']],
        need: 3,
        hint: 'server, fails, backup'
      },
      takeaway: 'A drawback of networks: if a central server fails, every client that depends on it is affected. A backup server removes the single point of failure.',
      run: async (ctx) => {
        const { b, meta } = ctx;
        const fs = H.dev(b, 'fs1');
        const backup = H.byType(b, 'file').find(f => f.id !== 'fs1' && H.linkedToType(b, f, 'router', 'eth'));
        fs.down = false; ctx.renderBoard();
        ctx.addLog('PC 1 saves report.docx to the File Server...');
        await ctx.animatePacket(H.findPath(b, 'pc1', 'fs1'), { label: 'SAVE', color: '#FFC83D', speed: 300, endBurst: 'SAVED ✓' });
        fs.down = true; ctx.renderBoard();
        ctx.showBurst(fs.x, fs.y - 44, 'SERVER CRASH!', '#E23D63');
        ctx.addLog('The File Server has crashed!', 'bad');
        await ctx.sleep(900);
        meta.tested = true;
        for (const id of ['pc2', 'pc3', 'pc1']) {
          if (backup) await ctx.animatePacket(H.findPath(b, id, backup.id), { label: 'SAVE', color: '#FFC83D', speed: 280, endBurst: 'BACKUP ✓' });
          else await ctx.animatePacket(['' + id, 'r1', 'fs1'], { label: 'SAVE', color: '#FFC83D', speed: 300, dropAtHop: 1, dropText: '✕ NO SERVER' });
        }
        if (backup) {
          ctx.addLog('The Router sent every client to the backup server. Nobody lost access!', 'ok');
          fs.down = false; ctx.renderBoard();
          ctx.openDebrief();
        } else {
          ctx.addLog('All 3 clients lost access because they all depend on ONE server: a single point of failure. Add a backup File Server and test again.', 'bad');
        }
      }
    },

    /* ===================== PRO 3: Two sites, one school ===================== */
    {
      title: 'Two Sites, One School',
      short: 'Two Sites',
      time: '~4 min',
      stars: 2,
      code: NB.dc('VlJFVjpSU15A'),
      brief: 'The Sixth Form site is 5 km from the main school. Pupils there need to save work on the File Server at the main site. Join the two LANs together.',
      action: 'Test the Link Between Sites',
      tools: ['move', 'eth', 'wifi', 'fibre', 'delete'],
      palette: [],
      zones: [
        { x: 20, y: 60, w: 330, h: 460, label: 'Main site (LAN)', net: false },
        { x: 610, y: 60, w: 330, h: 460, label: 'Sixth Form site, 5 km away (LAN)', net: false }
      ],
      starter: () => ({
        devices: [
          D('a1', 'pc', 90, 190, 'PC A1', true), D('a2', 'pc', 90, 410, 'PC A2', true),
          D('ra', 'router', 260, 300, 'Router A', true), D('fsA', 'file', 260, 130, 'File Server', true),
          D('net', 'internet', 480, 170, 'Internet (ISP)', true),
          D('rb', 'router', 700, 300, 'Router B', true), D('b1', 'pc', 870, 190, 'PC B1', true), D('b2', 'laptop', 870, 410, 'Laptop B2', true)
        ],
        links: [L('a1', 'ra', 'eth', lock), L('a2', 'ra', 'eth', lock), L('ra', 'fsA', 'eth', lock), L('b1', 'rb', 'eth', lock), L('b2', 'rb', 'wifi', lock)]
      }),
      ghosts: [],
      nudge: (b) => {
        const x = crossLinks(b);
        if (x.some(l => l.kind !== 'fibre')) return 'The sites are 5 km apart. Ethernet only works up to about 100 m, and Wi-Fi covers even less. Go through the Internet Service Provider (ISP) instead.';
        if (x.length) return 'Laying your own cable between towns would cost a fortune. Schools rent a connection from an ISP instead: connect each Router to the Internet Cloud.';
        return null;
      },
      checks: [
        ['Connect Router A to the Internet (ISP)', b => !!ispLink(b, 'ra')],
        ['Connect Router B to the Internet (ISP)', b => !!ispLink(b, 'rb')],
        ['Use Fibre Optic for both long-distance links', b => ispLink(b, 'ra') && ispLink(b, 'rb') && ispLink(b, 'ra').kind === 'fibre' && ispLink(b, 'rb').kind === 'fibre'],
        ['No cable runs straight from one site to the other', b => crossLinks(b).length === 0]
      ],
      predict: {
        q: 'Two school sites in different towns are joined into one network. What type of network is that?',
        options: ['A LAN (local area network)', 'A WAN (wide area network)', 'A Wi-Fi hotspot'],
        correct: 1,
        explain: 'Each site has its own LAN. Joining LANs over a large distance makes a WAN. The Internet is the biggest WAN of all.'
      },
      justify: {
        prompt: 'Explain the difference between a LAN and a WAN. Use this mission as your example.',
        stem: 'Each site has its own LAN because ',
        groups: [['lan', 'local'], ['wan', 'wide'], ['isp', 'internet', 'fibre', 'router', 'site', 'building', 'town', 'distance', 'far', 'km']],
        need: 3,
        hint: 'LAN, WAN, distance or ISP'
      },
      takeaway: 'A LAN covers one site. A WAN joins networks across large distances, using links rented from an Internet Service Provider. The Router is the gateway out of each LAN.',
      run: async (ctx) => {
        const { b } = ctx;
        ctx.addLog('PC B1 at the Sixth Form site saves essay.docx to the File Server at the main site...');
        const p = H.findPath(b, 'b1', 'fsA');
        await ctx.animatePacket(p, { label: 'SAVE', color: '#FFC83D', speed: 330 });
        await ctx.animatePacket([...p].reverse(), { label: 'SAVED', color: '#3EE0AE', speed: 300, endBurst: 'SAVED ✓' });
        ctx.addLog('Laptop B2 opens a shared file from the main site...');
        await ctx.animatePacket(H.findPath(b, 'fsA', 'b2'), { label: 'FILE', color: '#74B9FF', speed: 300, endBurst: 'WAN ✓' });
        ctx.addLog('Two LANs, joined through the ISP, now work as one WAN.', 'ok');
        ctx.openDebrief();
      }
    },

    /* ===================== PRO 4: Outbreak! ===================== */
    {
      title: 'Outbreak!',
      short: 'Outbreak',
      time: '~5 min',
      stars: 3,
      code: NB.dc('UlleQ1lWRVZCRg=='),
      allowUnsafeTest: true,
      brief: 'A visitor has joined the school Wi-Fi with an infected laptop, and there is no Firewall. Test to see how far the malware spreads. Then isolate the laptop, protect the network and test again.',
      action: 'Test: Release the Malware',
      tools: ['move', 'eth', 'fibre', 'delete'],
      palette: ['firewall'],
      starter: () => ({
        devices: [
          D('pc1', 'pc', 130, 110, 'PC 1', true), D('pc2', 'pc', 130, 275, 'PC 2', true), D('pc3', 'pc', 130, 440, 'PC 3', true),
          D('lapX', 'laptop', 330, 470, 'Visitor Laptop', true, { infected: true }),
          D('r1', 'router', 400, 275, 'School Router', true), D('fs1', 'file', 400, 95, 'File Server', true),
          D('net', 'internet', 760, 275, 'Internet Cloud', true), D('ws', 'web', 890, 275, 'Web Server', true)
        ],
        links: [L('pc1', 'r1', 'eth', lock), L('pc2', 'r1', 'eth', lock), L('pc3', 'r1', 'eth', lock), L('r1', 'fs1', 'eth', lock),
          L('lapX', 'r1', 'wifi'), L('r1', 'net', 'fibre'), L('net', 'ws', 'fibre', lock)]
      }),
      ghosts: [['firewall', 580, 275]],
      checks: [
        ['Run the test to see how the malware spreads', (b, meta) => !!meta.tested],
        ['Isolate the infected laptop (remove its connection)', b => laptopLinks(b).length === 0],
        ['Place a Firewall between the Internet Cloud and the Router', b => H.isFirewallProtectingRouter(b) && H.internetUplink(b) && H.internetUplink(b).kind === 'fibre']
      ],
      predict: {
        q: 'One infected laptop joins the school Wi-Fi. What is the risk?',
        options: ['Only that laptop is affected', 'The malware can spread to other devices on the network', 'The Wi-Fi gets faster'],
        correct: 1,
        explain: 'Connected devices can pass data to each other, and that includes malware. Sharing is the benefit of a network and also its risk.'
      },
      justify: {
        prompt: 'Why is malware a drawback of networks? What two things did you do to protect the school?',
        stem: 'Because the devices are connected, ',
        groups: [['malware', 'virus', 'infect'], ['spread', 'connected', 'network', 'share'], ['isolate', 'disconnect', 'remove', 'unplug', 'cut', 'took off'], ['firewall', 'block']],
        need: 3,
        hint: 'malware, spread, isolate, firewall'
      },
      takeaway: 'A drawback of networks: malware can spread quickly between connected devices. Isolating infected devices and placing a Firewall at the edge of the network limits the damage.',
      run: async (ctx) => {
        const { b, meta } = ctx;
        b.devices.forEach(d => { if (d.id !== 'lapX') d.infected = false; });
        ctx.renderBoard();
        const lap = H.dev(b, 'lapX');
        const isolated = laptopLinks(b).length === 0;
        const safe = H.isFirewallProtectingRouter(b);
        meta.tested = true;
        if (!isolated) {
          ctx.addLog('The infected laptop starts sending malware to everything it can reach...', 'bad');
          for (const id of ['pc1', 'pc2', 'pc3', 'fs1']) {
            const p = H.findPath(b, 'lapX', id);
            if (!p) continue;
            await ctx.animatePacket(p, { label: 'MALWARE', color: '#FF5D8F', speed: 240 });
            H.dev(b, id).infected = true; ctx.renderBoard();
          }
          ctx.addLog('Every device the laptop could reach is now infected. Remove the laptop’s connection to isolate it.', 'bad');
        } else {
          ctx.showBurst(lap.x, lap.y - 44, 'ISOLATED ✓', '#16B383');
          ctx.addLog('The laptop is isolated. With no connection, its malware has nowhere to go.', 'ok');
          await ctx.sleep(700);
        }
        const net = H.first(b, 'internet');
        if (!safe) {
          const p = H.findPath(b, net.id, 'r1');
          if (p) await ctx.animatePacket(p, { label: 'ATK!', color: '#FF5D8F', speed: 320, endBurst: 'GOT IN!', endBurstColor: '#E23D63' });
          ctx.addLog('An attack from the Internet walked straight in. There is no Firewall checking packets at the edge of the network.', 'bad');
        } else {
          const fw = H.first(b, 'firewall');
          await ctx.animatePacket(H.findPath(b, net.id, fw.id), { label: 'ATK!', color: '#FF5D8F', speed: 320, endBurst: 'BLOCKED ✓', endBurstColor: '#16B383' });
          ctx.addLog('The Firewall blocked the attack from the Internet.', 'ok');
        }
        if (isolated && safe) {
          await ctx.animatePacket(H.findPath(b, 'pc1', 'fs1'), { label: 'SAVE', color: '#FFC83D', speed: 280, endBurst: 'CLEAN ✓' });
          ctx.addLog('The school network is clean and protected.', 'ok');
          ctx.openDebrief();
        }
      }
    },

    /* ===================== PRO 5: Firewall rules ===================== */
    {
      title: 'Write the Firewall Rules',
      short: 'Fw Rules',
      time: '~5 min',
      stars: 3,
      code: NB.dc('XFhYVVJbQkU='),
      allowUnsafeTest: true,
      brief: 'A Firewall only knows what you tell it. Write rules that let real visitors read your website and let you update it, but stop everything harmful. Then run the test traffic.',
      action: 'Open Firewall Rules',
      tools: ['move'],
      palette: [],
      zones: [
        { x: 30, y: 40, w: 600, h: 480, label: 'School LAN (inside)', net: false },
        { x: 660, y: 40, w: 270, h: 480, label: 'Internet (outside)', net: true }
      ],
      starter: () => ({
        devices: [
          D('pc1', 'pc', 120, 180, 'Your PC', true), D('lap1', 'laptop', 120, 390, 'Library Laptop', true),
          D('ws', 'web', 340, 110, 'School Web Server', true), D('r1', 'router', 380, 300, 'School Router', true),
          D('fw', 'firewall', 550, 300, 'Firewall', true), D('net', 'internet', 790, 300, 'Internet Cloud', true)
        ],
        links: [L('pc1', 'r1', 'eth', lock), L('lap1', 'r1', 'wifi', lock), L('ws', 'r1', 'eth', lock), L('r1', 'fw', 'eth', lock), L('fw', 'net', 'fibre', lock)]
      }),
      ghosts: [],
      checks: [['Write rules that pass all 6 traffic tests', (b, meta) => !!meta.rulesPassed]],
      predict: {
        q: 'Suppose your first rule is "BLOCK everything from anyone". What happens?',
        options: ['Only attacks are stopped', 'Nobody can reach your website, not even real visitors', 'Nothing changes'],
        correct: 1,
        explain: 'The firewall uses the first rule that fits. A block-everything rule at the top fits every packet, so nothing gets through at all.'
      },
      justify: {
        prompt: 'Why does the order of firewall rules matter? Give an example from your own rules.',
        stem: 'The firewall reads its rules from the top, so ',
        groups: [['first', 'order', 'top', 'before', 'above', 'earlier'], ['rule'], ['allow', 'block']],
        need: 3,
        hint: 'first, rule, allow or block'
      },
      takeaway: 'A firewall follows rules written by people. It checks each packet against the rules in order and uses the first one that fits, so the order matters. A final rule should deal with everything else.',
      run: async (ctx) => {
        const { b, meta } = ctx;
        NB.Firewall.openRules({
          onPass: async () => {
            meta.rulesPassed = true;
            ctx.updateUI();
            await ctx.animatePacket(['net', 'fw'], { label: 'ATK!', color: '#FF5D8F', speed: 340, endBurst: 'BLOCKED ✓', endBurstColor: '#16B383' });
            await ctx.animatePacket(H.findPath(b, 'net', 'ws'), { label: 'GET /', color: '#FFC83D', speed: 280, endBurst: 'ALLOWED ✓' });
            ctx.addLog('Your rules block the attacks and allow real visitors.', 'ok');
            ctx.openDebrief();
          }
        });
      }
    },

    /* ===================== PRO 6: Bottleneck ===================== */
    {
      title: 'Bottleneck',
      short: 'Bottleneck',
      time: '~4 min',
      stars: 3,
      code: NB.dc('X0NTXkBTWVZV'),
      allowUnsafeTest: true,
      noNudge: true,
      brief: 'Six clients are trying to stream the lesson video and the whole class is complaining: the video keeps buffering and web pages crawl. Run a speed test, find the slow links and upgrade them.',
      action: 'Run Speed Test',
      tools: ['move', 'eth', 'wifi', 'fibre'],
      palette: [],
      starter: () => ({
        devices: [
          D('c1', 'pc', 110, 90, 'PC 1', true), D('c2', 'pc', 110, 200, 'PC 2', true), D('c3', 'pc', 110, 310, 'PC 3', true), D('c4', 'pc', 110, 420, 'PC 4', true),
          D('l1', 'laptop', 260, 500, 'Laptop 1', true), D('l2', 'laptop', 410, 500, 'Laptop 2', true),
          D('r1', 'router', 430, 260, 'Router', true), D('vs', 'file', 680, 120, 'Video Server', true),
          D('net', 'internet', 740, 400, 'Internet Cloud', true), D('ws', 'web', 880, 400, 'Web Server', true)
        ],
        links: [L('c1', 'r1', 'eth', lock), L('c2', 'r1', 'eth', lock), L('c3', 'r1', 'eth', lock), L('c4', 'r1', 'eth', lock),
          L('l1', 'r1', 'wifi', lock), L('l2', 'r1', 'wifi', lock), L('vs', 'r1', 'wifi'), L('r1', 'net', 'eth'), L('net', 'ws', 'fibre', lock)]
      }),
      ghosts: [],
      checks: [
        ['Run a speed test', (b, meta) => !!meta.tested],
        ['The lesson video plays without buffering', b => fastKind(videoLink(b))],
        ['Web pages load at full speed', b => H.internetUplink(b) && H.internetUplink(b).kind === 'fibre']
      ],
      predict: {
        q: 'Thirty pupils stream the same lesson video. Where is the traffic jam most likely to be?',
        options: ["On each pupil's own cable", 'On the one link that every packet has to share', 'Inside the printer'],
        correct: 1,
        explain: 'Each client has its own link to the router, but every video packet has to squeeze down the single link to the server. A shared link that is too slow is called a bottleneck.'
      },
      justify: {
        prompt: 'Which link was the bottleneck, and why did changing it fix the problem?',
        stem: 'The bottleneck was ',
        groups: [['wi-fi', 'wifi', 'wireless', 'ethernet', 'fibre', 'cable'], ['slow', 'fast', 'speed', 'quick', 'bandwidth', 'buffer'], ['share', 'every', 'all', 'many', 'lots', 'six']],
        need: 3,
        hint: 'the cable type, speed, shared by every client'
      },
      takeaway: 'A network is only as fast as its slowest shared link. Servers and Internet links carry traffic for everyone, so they need the fastest connections: Ethernet inside the building, Fibre Optic over long distances.',
      run: async (ctx) => {
        const { b, meta } = ctx;
        meta.tested = true;
        const v = videoLink(b), up = H.internetUplink(b);
        const vFast = fastKind(v), upFast = !!up && up.kind === 'fibre';
        ctx.addLog('Speed test 1 of 2: three clients stream the lesson video...');
        for (const id of ['c1', 'c3', 'l1']) {
          const p = H.findPath(b, 'vs', id);
          if (!p) { ctx.addLog('The Video Server is not connected to the Router!', 'bad'); break; }
          await ctx.animatePacket(p, { label: 'VIDEO', color: vFast ? '#3EE0AE' : '#FFC83D', speed: vFast ? 220 : 950, endBurst: vFast ? 'HD ✓' : 'BUFFERING…', endBurstColor: vFast ? '#16B383' : '#E23D63' });
        }
        ctx.addLog(vFast ? `Video Server link is ${v.kind === 'fibre' ? 'Fibre Optic' : 'Ethernet'}: every client gets smooth video.` : 'Video wait time: 9 seconds. Every video packet shares one slow link. Which link is it?', vFast ? 'ok' : 'bad');
        ctx.addLog('Speed test 2 of 2: PC 2 loads a web page...');
        const pw = up ? H.findPath(b, 'ws', 'c2') : null;
        if (pw) await ctx.animatePacket(pw, { label: 'WEB', color: upFast ? '#3EE0AE' : '#FFC83D', speed: upFast ? 220 : 900, endBurst: upFast ? 'FAST ✓' : 'SLOW…', endBurstColor: upFast ? '#16B383' : '#E23D63' });
        ctx.addLog(upFast ? 'Internet link is Fibre Optic: web pages load at full speed.' : 'Web page wait time: 7 seconds. The whole school shares one link to the Internet. Is it the right kind?', upFast ? 'ok' : 'bad');
        if (vFast && upFast) ctx.openDebrief();
      }
    },

    /* ===================== PRO 7: Troubleshooter (boss) ===================== */
    {
      title: 'Boss: The Troubleshooter',
      short: 'Boss',
      time: '~6 min',
      stars: 3,
      code: NB.dc('RVJSWV5QWVI='),
      allowUnsafeTest: true,
      noNudge: true,
      brief: 'You are the network engineer. This office has three hidden faults and nobody will tell you what they are. Run the diagnostic, read the results like a detective, fix one thing at a time and test again. The clock is running!',
      action: 'Run Diagnostic',
      tools: ['move', 'eth', 'wifi', 'fibre', 'delete'],
      palette: [],
      starter: () => ({
        devices: [
          D('pc1', 'pc', 120, 100, 'PC 1', true), D('pc2', 'pc', 120, 250, 'PC 2', true), D('pc3', 'pc', 120, 400, 'PC 3', true),
          D('r1', 'router', 390, 250, 'Router', true), D('fs1', 'file', 390, 75, 'File Server', true),
          D('ps', 'print', 600, 440, 'Print Server', true), D('pr', 'printer', 280, 490, 'Shared Printer', true),
          D('net', 'internet', 740, 180, 'Internet Cloud', true), D('ws', 'web', 880, 180, 'Web Server', true)
        ],
        links: [L('pc1', 'r1', 'eth', lock), L('pc2', 'r1', 'eth', lock), L('pc3', 'r1', 'eth', lock),
          L('r1', 'fs1', 'eth', { broken: true, hidden: true }), L('r1', 'ps', 'eth', lock), L('pc3', 'pr', 'eth'),
          L('r1', 'net', 'wifi'), L('net', 'ws', 'fibre', lock)]
      }),
      ghosts: [],
      checks: [
        ['Run the diagnostic', (b, meta) => !!meta.tested],
        ['Everyone can save to the File Server', b => H.linkedToType(b, H.dev(b, 'fs1'), 'router', 'eth')],
        ['Everyone can share the printer', b => H.linkedToType(b, H.dev(b, 'pr'), 'print') && !H.clients(b).some(c => H.linkBetween(b, c.id, 'pr'))],
        ['Web pages load at full speed', b => H.internetUplink(b) && H.internetUplink(b).kind === 'fibre']
      ],
      predict: {
        q: 'What is the best way to find faults in a network?',
        options: ['Change everything at once and hope', 'Test one thing at a time and read the results', 'Switch the Internet off and on'],
        correct: 1,
        explain: 'Engineers test systematically. Changing one thing at a time shows exactly which change fixed which fault.'
      },
      justify: {
        prompt: 'Which fault was hardest to find? How did the test results help you find it?',
        stem: 'The hardest fault was ',
        groups: [['cable', 'link', 'wi-fi', 'wifi', 'fibre', 'ethernet', 'printer', 'print server', 'file server'], ['test', 'diagnostic', 'result', 'log', 'packet', 'lost'], ['because', 'so ', 'showed', 'told']],
        need: 3,
        hint: 'the fault, the test result, because'
      },
      takeaway: 'You found a broken cable, a printer plugged into one PC instead of the Print Server, and an Internet link using the wrong medium. Every one is a Lesson 1 idea: cables, servers and routers each have a job.',
      run: async (ctx) => {
        const { b, meta } = ctx;
        if (!meta.t0) meta.t0 = Date.now();
        meta.tested = true;
        let faults = 0;
        ctx.addLog('Test 1 of 3: PC 1 saves a file...');
        const fsLink = H.linkBetween(b, 'r1', 'fs1');
        if (H.linkedToType(b, H.dev(b, 'fs1'), 'router', 'eth')) {
          await ctx.animatePacket(H.findPath(b, 'pc1', 'fs1'), { label: 'SAVE', color: '#3EE0AE', speed: 260, endBurst: 'SAVED ✓' });
        } else {
          faults++;
          if (fsLink) {
            await ctx.animatePacket(['pc1', 'r1', 'fs1'], { label: 'SAVE', color: '#FFC83D', speed: 300, dropAtHop: 1, dropText: '✕ LOST' });
            fsLink.revealed = true; ctx.renderBoard();
            ctx.addLog('FAIL: the packet left the Router but never reached the File Server.', 'bad');
          } else ctx.addLog('FAIL: the File Server is not cabled to the Router with Ethernet.', 'bad');
        }
        ctx.addLog('Test 2 of 3: PC 1 prints a page...');
        const pr = H.dev(b, 'pr');
        if (H.linkedToType(b, pr, 'print') && !H.clients(b).some(c => H.linkBetween(b, c.id, 'pr'))) {
          await ctx.animatePacket(H.findPath(b, 'pc1', 'pr'), { label: 'PRINT', color: '#3EE0AE', speed: 260, endBurst: 'PRINTED ✓' });
        } else {
          faults++;
          await ctx.animatePacket(H.findPath(b, 'pc1', 'ps'), { label: 'PRINT', color: '#FFC83D', speed: 280, endBurst: 'NO PRINTER?', endBurstColor: '#E23D63' });
          ctx.addLog('FAIL: the print job reached the Print Server, but the Print Server has no printer to send it to.', 'bad');
        }
        ctx.addLog('Test 3 of 3: PC 2 loads a web page...');
        const up = H.internetUplink(b);
        if (up && up.kind === 'fibre') {
          await ctx.animatePacket(H.findPath(b, 'ws', 'pc2'), { label: 'WEB', color: '#3EE0AE', speed: 240, endBurst: 'FAST ✓' });
        } else {
          faults++;
          const p = up ? H.findPath(b, 'ws', 'pc2') : null;
          if (p) await ctx.animatePacket(p, { label: 'WEB', color: '#FFC83D', speed: 900, endBurst: 'VERY SLOW…', endBurstColor: '#E23D63' });
          ctx.addLog(up ? 'FAIL: the page took 8 seconds. Something is wrong with the long-distance link.' : 'FAIL: the Router has no link to the Internet Cloud.', 'bad');
        }
        if (!faults) {
          const secs = Math.round((Date.now() - meta.t0) / 1000);
          ctx.addLog(`All 3 faults fixed in ${Math.floor(secs / 60)} min ${secs % 60} s. Outstanding engineering!`, 'ok');
          ctx.openDebrief();
        } else {
          ctx.addLog(`${faults} fault${faults > 1 ? 's' : ''} still to fix. Fix one, then test again.`, 'warn');
        }
      }
    }
  ];

  const base = NB.MISSIONS.length;
  NB.PRO_START = base;
  PRO.forEach((m, i) => {
    m.id = base + i;
    m.track = 'pro';
    m.proNum = i + 1;
    NB.MISSIONS.push(m);
  });
})();
