/* Core missions (1-8) for the Year 8 Networking Workshop + graph helpers. Pro missions live in pro.js */
window.NB = window.NB || {};

NB.Helpers = (function () {
  const dev = (b, id) => b.devices.find(d => d.id === id);
  const byType = (b, type) => b.devices.filter(d => d.type === type);
  const first = (b, type) => b.devices.find(d => d.type === type);
  const clients = (b) => b.devices.filter(d => NB.DEVICES[d.type] && NB.DEVICES[d.type].isClient);
  const activeLinks = (b) => b.links.filter(l => !l.broken);

  function linkBetween(b, idA, idB) {
    return b.links.find(l => (l.a === idA && l.b === idB) || (l.a === idB && l.b === idA));
  }

  function neighbors(b, id, includeBroken) {
    const list = includeBroken ? b.links : activeLinks(b);
    const out = [];
    for (const l of list) {
      if (l.a === id) out.push({ id: l.b, link: l });
      else if (l.b === id) out.push({ id: l.a, link: l });
    }
    return out;
  }

  function linkedToType(b, d, targetType, kind) {
    if (!d) return false;
    return activeLinks(b).some(l => {
      if (kind && l.kind !== kind) return false;
      const otherId = l.a === d.id ? l.b : l.b === d.id ? l.a : null;
      if (!otherId) return false;
      const other = dev(b, otherId);
      return other && other.type === targetType;
    });
  }

  function clientsOnRouter(b, kind) {
    return clients(b).filter(c => linkedToType(b, c, 'router', kind));
  }

  function findPath(b, startId, endId, opts) {
    opts = opts || {};
    if (!startId || !endId) return null;
    const prev = { [startId]: null };
    const q = [startId];
    while (q.length) {
      const cur = q.shift();
      if (cur === endId) break;
      for (const n of neighbors(b, cur, !!opts.includeBroken)) {
        if (opts.avoidType && dev(b, n.id) && dev(b, n.id).type === opts.avoidType && n.id !== endId) continue;
        if (!(n.id in prev)) {
          prev[n.id] = cur;
          q.push(n.id);
        }
      }
    }
    if (!(endId in prev)) return null;
    const path = [];
    for (let c = endId; c !== null; c = prev[c]) path.unshift(c);
    return path;
  }

  // Checks if every path from Internet Cloud to Router passes through a Firewall
  function isFirewallProtectingRouter(b) {
    const r = first(b, 'router');
    const net = first(b, 'internet');
    const fw = first(b, 'firewall');
    if (!r || !net || !fw) return false;
    const hasPath = !!findPath(b, net.id, r.id);
    const bypassPath = findPath(b, net.id, r.id, { avoidType: 'firewall' });
    return hasPath && !bypassPath;
  }

  // Returns the link touching the Internet Cloud from the LAN side (router or firewall)
  function internetUplink(b) {
    const net = first(b, 'internet');
    if (!net) return null;
    return activeLinks(b).find(l => {
      const otherId = l.a === net.id ? l.b : l.b === net.id ? l.a : null;
      if (!otherId) return false;
      const other = dev(b, otherId);
      return other && (other.type === 'router' || other.type === 'firewall');
    }) || null;
  }

  // Smart misconception nudges tailored to Year 8 slides
  function getNudge(b, mission) {
    if (mission.noNudge) return null;
    const net = first(b, 'internet');
    const r = first(b, 'router');
    const fw = first(b, 'firewall');
    const printer = first(b, 'printer');

    // 1. Wrong medium to Internet Cloud
    if (net) {
      const badUplink = activeLinks(b).find(l => {
        const otherId = l.a === net.id ? l.b : l.b === net.id ? l.a : null;
        if (!otherId) return false;
        const other = dev(b, otherId);
        return other && (other.type === 'router' || other.type === 'firewall') && l.kind !== 'fibre';
      });
      if (badUplink) {
        return 'Long-distance links to the Internet Cloud need Fibre Optic (pulses of light) — Ethernet and Wi-Fi are for short distances inside a building!';
      }
    }

    // 2. Printer plugged directly into a client PC
    if (printer && clients(b).some(c => linkBetween(b, c.id, printer.id))) {
      return 'Your printer is plugged straight into one client! Connect it to the Print Server so everyone on the network can share it.';
    }

    // 3. Firewall placed, but Router still directly linked to Internet (bypassing Firewall)
    if (fw && r && net && linkBetween(b, r.id, net.id)) {
      return 'Your Router is still connected straight to the Internet Cloud, bypassing the Firewall! Remove the direct link and route traffic Internet ↔ Firewall ↔ Router.';
    }

    // 4. Desktop PC connected via Wi-Fi when Ethernet is expected
    if (mission.preferWiredPCs && byType(b, 'pc').some(pc => linkedToType(b, pc, 'router', 'wifi'))) {
      return 'Tip: Classroom Desktop PCs stay in one place — connect them with an Ethernet cable for fast, reliable wired speeds, and save Wi-Fi for laptops and phones.';
    }

    // 5. Servers on Wi-Fi
    const serverOnWifi = b.devices.some(d =>
      (d.type === 'file' || d.type === 'print') && linkedToType(b, d, 'router', 'wifi')
    );
    if (serverOnWifi) {
      return 'Servers handle lots of traffic at once — connect servers to the Router with a wired Ethernet cable rather than Wi-Fi.';
    }

    return null;
  }

  return {
    dev, byType, first, clients, activeLinks, linkBetween, neighbors,
    linkedToType, clientsOnRouter, findPath, isFirewallProtectingRouter,
    internetUplink, getNudge
  };
})();

(function () {
  const H = NB.Helpers;
  const D = (id, type, x, y, label, locked) => ({ id, type, x, y, label: label || NB.DEVICES[type].name, locked: !!locked });
  const L = (a, b, kind, extra) => Object.assign({ a, b, kind: kind || 'eth', broken: false, locked: false }, extra || {});

  NB.MISSIONS = [
    /* ===================== MISSION 1 ===================== */
    {
      id: 0,
      title: 'Save Your Homework',
      short: 'Save Work',
      time: '~3 min',
      stars: 1,
      code: NB.dc('Q1JcVFZH'),
      brief: 'Build a classroom LAN. Connect 3 Desktop PCs (clients) and 1 File Server to a central Router using Ethernet cables, then save homework.docx.',
      action: 'Send homework.docx',
      tools: ['move', 'eth', 'delete'],
      palette: ['pc', 'router', 'file'],
      preferWiredPCs: true,
      starter: () => ({ devices: [], links: [] }),
      ghosts: [
        ['pc', 170, 120], ['pc', 170, 280], ['pc', 170, 440],
        ['router', 470, 280], ['file', 760, 280]
      ],
      checks: [
        ['Place 1 Router', b => H.byType(b, 'router').length >= 1],
        ['Place 3 Desktop PCs (clients)', b => H.byType(b, 'pc').length >= 3],
        ['Place 1 File Server', b => H.byType(b, 'file').length >= 1],
        ['Connect all 3 PCs to the Router with Ethernet', b => H.byType(b, 'pc').length >= 3 && H.byType(b, 'pc').every(p => H.linkedToType(b, p, 'router', 'eth'))],
        ['Connect the File Server to the Router with Ethernet', b => H.linkedToType(b, H.first(b, 'file'), 'router', 'eth')]
      ],
      simType: 'save',
      takeaway: 'Every client requests services from the File Server through one central Router. Because files live on the server, you can log on to any PC and open your work!',
      quiz: {
        q: 'Why do we connect classroom PCs through a central Router instead of wiring every PC directly to every other PC?',
        options: [
          'It needs far fewer cables and makes adding new devices easy',
          'Routers store all your Word documents instead of a file server',
          'Ethernet cables cannot connect two computers'
        ],
        correct: 0,
        explain: 'With a central router, each new computer only needs 1 extra cable instead of cabling to every single machine!'
      }
    },

    /* ===================== MISSION 2 ===================== */
    {
      id: 1,
      title: 'Wired vs. Wireless',
      short: 'Wi-Fi + LAN',
      time: '~3 min',
      stars: 1,
      code: NB.dc('WF5TVkU='),
      brief: 'Keep the 2 fixed Desktop PCs on Ethernet, then add 2 portable clients (Laptops or Phones) and connect them to the Router using Wi-Fi.',
      action: 'Sync All Devices',
      tools: ['move', 'eth', 'wifi', 'delete'],
      palette: ['pc', 'laptop', 'phone', 'router', 'file'],
      preferWiredPCs: true,
      starter: () => ({
        devices: [
          D('pc1', 'pc', 170, 130, 'PC 1', true),
          D('pc2', 'pc', 170, 280, 'PC 2', true),
          D('r1', 'router', 470, 280, 'School Router', true),
          D('fs1', 'file', 760, 280, 'File Server', true)
        ],
        links: [
          L('pc1', 'r1', 'eth', { locked: true }),
          L('pc2', 'r1', 'eth', { locked: true }),
          L('r1', 'fs1', 'eth', { locked: true })
        ]
      }),
      ghosts: [['laptop', 170, 420], ['phone', 330, 470]],
      checks: [
        ['Keep 2 Desktop PCs on Ethernet', b => H.byType(b, 'pc').filter(p => H.linkedToType(b, p, 'router', 'eth')).length >= 2],
        ['Add at least 2 portable devices (Laptop or Phone)', b => (H.byType(b, 'laptop').length + H.byType(b, 'phone').length) >= 2],
        ['Connect at least 2 portable devices to the Router via Wi-Fi', b => b.devices.filter(d => (d.type === 'laptop' || d.type === 'phone') && H.linkedToType(b, d, 'router', 'wifi')).length >= 2]
      ],
      simType: 'wifi',
      takeaway: 'Ethernet uses electrical signals in copper wires (great for fixed PCs and servers). Wi-Fi uses radio waves so portable devices like laptops and phones can move freely.',
      quiz: {
        q: 'How does Wi-Fi send data between a laptop and a router?',
        options: [
          'Pulses of light along glass strands',
          'Radio waves through the air',
          'Electrical signals through copper wires'
        ],
        correct: 1,
        explain: 'Wi-Fi uses radio waves — Ethernet uses copper electrical signals, and fibre optic uses pulses of light.'
      }
    },

    /* ===================== MISSION 3 ===================== */
    {
      id: 2,
      title: 'Share the Printer',
      short: 'Print Server',
      time: '~3 min',
      stars: 1,
      code: NB.dc('UkJSQkY='),
      brief: 'Printers are expensive, so a whole corridor shares one. Add a Print Server (Ethernet to Router) and a Shared Printer (Ethernet to Print Server), then print from the Wi-Fi Laptop.',
      action: 'Send Print Job',
      tools: ['move', 'eth', 'wifi', 'delete'],
      palette: ['print', 'printer', 'laptop'],
      starter: () => ({
        devices: [
          D('pc1', 'pc', 160, 140, 'PC 1', true),
          D('lap1', 'laptop', 160, 390, 'Student Laptop', true),
          D('r1', 'router', 450, 260, 'School Router', true),
          D('fs1', 'file', 740, 140, 'File Server', true)
        ],
        links: [
          L('pc1', 'r1', 'eth', { locked: true }),
          L('lap1', 'r1', 'wifi', { locked: true }),
          L('r1', 'fs1', 'eth', { locked: true })
        ]
      }),
      ghosts: [['print', 680, 380], ['printer', 850, 380]],
      checks: [
        ['Add a Print Server', b => H.byType(b, 'print').length >= 1],
        ['Connect the Print Server to the Router (Ethernet)', b => H.linkedToType(b, H.first(b, 'print'), 'router', 'eth')],
        ['Add a Shared Printer connected to the Print Server', b => H.linkedToType(b, H.first(b, 'printer'), 'print', 'eth')]
      ],
      simType: 'print',
      takeaway: 'Sharing expensive hardware is a major benefit of a LAN. Your laptop is the client requesting printing; the Print Server queues jobs and sends them to the shared printer.',
      quiz: {
        q: 'When you print homework at school, which device is the CLIENT?',
        options: [
          'Your computer or laptop',
          'The Print Server',
          'The Shared Printer'
        ],
        correct: 0,
        explain: 'Your computer requests the printing service, so it is the client. The Print Server provides the service!'
      }
    },

    /* ===================== MISSION 4 (Na<>y Builds!) ===================== */
    {
      id: 3,
      title: 'Build, Deploy & Load',
      short: 'Web + Fibre',
      time: '~8 min',
      stars: 2,
      code: NB.dc('UkVVXlE='),
      usesWebStudio: true,
      brief: 'Build your own web page in Web Studio. Then link the School Router to the Internet Cloud with Fibre Optic, send your page to the Web Server in packets, and load it on every client.',
      action: 'Deploy & Load My Website',
      tools: ['move', 'eth', 'wifi', 'fibre', 'delete'],
      palette: [],
      predict: {
        q: 'Your page will travel as numbered packets. What will a client show if a style.css packet gets lost on the way?',
        options: ['A completely blank page', 'The words, but with the styling missing', 'The page exactly as normal'],
        correct: 1,
        explain: 'index.html still arrived, so the words show. Without all of style.css the browser cannot apply your styles.'
      },
      justify: {
        prompt: 'One Web Server, three clients. Why is storing the page once on a server a benefit of a network?',
        stem: 'The page is stored once on the server, so ',
        groups: [['server'], ['client', 'device', 'computer', 'everyone', 'anyone'], ['share', 'same', 'once', 'update', 'change', 'copy', 'copies']],
        need: 2,
        hint: 'server, client, share, update'
      },
      zones: [
        { x: 30, y: 40, w: 500, h: 480, label: 'School LAN (Inside Building)', net: false },
        { x: 560, y: 40, w: 370, h: 480, label: 'WAN / Internet', net: true }
      ],
      starter: () => ({
        devices: [
          D('pc1', 'pc', 140, 180, 'Classroom PC', true),
          D('lap1', 'laptop', 140, 330, 'Library Laptop', true),
          D('ph1', 'phone', 300, 460, 'Phone', true),
          D('r1', 'router', 420, 275, 'School Router', true),
          D('net', 'internet', 680, 275, 'Internet Cloud', true),
          D('ws', 'web', 855, 275, 'Web Server', true)
        ],
        links: [
          L('pc1', 'r1', 'eth', { locked: true }),
          L('lap1', 'r1', 'wifi', { locked: true }),
          L('net', 'ws', 'fibre', { locked: true })
        ]
      }),
      ghosts: [],
      checks: [
        ['Build your page in Web Studio and press "Ready to deploy"', () => NB.WebStudio.isReady() || NB.WebStudio.isDeployed()],
        ['Connect the School Router to the Internet Cloud', b => !!H.internetUplink(b)],
        ['Use Fibre Optic cable for the Internet Cloud link', b => H.internetUplink(b) && H.internetUplink(b).kind === 'fibre'],
        ['Bonus: connect the Phone to the Router with Wi-Fi', b => H.linkedToType(b, H.dev(b, 'ph1'), 'router', 'wifi'), true]
      ],
      simType: 'web',
      takeaway: 'A Router acts as the gateway from your LAN to the Internet via an ISP. Fibre-optic cables send pulses of light for fast, long-distance connections so the Web Server can deliver your HTML & CSS packets!',
      quiz: {
        q: 'Why do connections to the Internet Cloud use Fibre Optic cable instead of Ethernet?',
        options: [
          'Fibre optic uses pulses of light, which are faster and work over long distances',
          'Ethernet cables cannot carry HTML files',
          'Fibre optic cables use radio waves'
        ],
        correct: 0,
        explain: 'Fibre optic sends pulses of light along a glass core — ideal for high-speed, long-distance ISP connections.'
      }
    },

    /* ===================== MISSION 5 (Firewall + Na<>y Builds!) ===================== */
    {
      id: 4,
      title: 'Stop the Defacement!',
      short: 'Firewall',
      time: '~6 min',
      stars: 2,
      code: NB.dc('U1tSXl9E'),
      usesWebStudio: true,
      allowUnsafeTest: true,
      brief: 'An attacker on the Internet Cloud is trying to deface your live website! Test now to see what happens. Then place a Firewall between the Internet Cloud and the Router (remove the direct bypass link!) and go on Firewall duty: you decide which packets to allow and which to block.',
      action: 'Test Security & Start Firewall Duty',
      tools: ['move', 'eth', 'fibre', 'delete'],
      palette: ['firewall'],
      zones: [
        { x: 30, y: 40, w: 560, h: 480, label: 'School LAN (Protected Zone)', net: false },
        { x: 630, y: 40, w: 300, h: 480, label: 'Untrusted Internet', net: true }
      ],
      starter: () => ({
        devices: [
          D('pc1', 'pc', 130, 180, 'Student PC', true),
          D('ws', 'web', 130, 380, 'School Web Server', true),
          D('r1', 'router', 360, 280, 'School Router', true),
          D('net', 'internet', 780, 280, 'Internet Cloud', true)
        ],
        links: [
          L('pc1', 'r1', 'eth', { locked: true }),
          L('ws', 'r1', 'eth', { locked: true }),
          L('r1', 'net', 'fibre')
        ]
      }),
      ghosts: [['firewall', 550, 280]],
      checks: [
        ['Add a Firewall to the board', b => H.byType(b, 'firewall').length >= 1],
        ['Route traffic Internet Cloud ↔ Firewall ↔ Router (no direct bypass!)', b => H.isFirewallProtectingRouter(b)],
        ['Use Fibre Optic between Internet Cloud and Firewall', b => H.internetUplink(b) && H.internetUplink(b).kind === 'fibre']
      ],
      simType: 'firewall',
      takeaway: 'A Firewall inspects incoming and outgoing packets at the edge of a network. It allows legitimate web traffic through while blocking unauthorised attacks before they reach your servers!',
      quiz: {
        q: 'Where should a Firewall be placed to protect a school LAN from Internet attacks?',
        options: [
          'At the network boundary, between the Internet Cloud and the LAN Router',
          'Only between the Print Server and the Printer',
          'Disconnected from the Router'
        ],
        correct: 0,
        explain: 'Placing the Firewall at the perimeter ensures every packet from the Internet is checked before entering the LAN.'
      }
    },

    /* ===================== MISSION 6 (Diagnostic!) ===================== */
    {
      id: 5,
      title: 'IT Support: Break It, Fix It',
      short: 'Fix Faults',
      time: '~4 min',
      stars: 2,
      code: NB.dc('RV5WR1JF'),
      allowUnsafeTest: true,
      brief: 'Emergency in CMP2! PC 2 cannot save work, the Internet link is too slow, and there is no Firewall. Press Run Diagnostic to spot the faults, then repair all 3 issues and test again.',
      action: 'Run Diagnostic Test',
      tools: ['move', 'eth', 'wifi', 'fibre', 'delete'],
      palette: ['firewall'],
      starter: () => ({
        devices: [
          D('pc1', 'pc', 130, 110, 'PC 1', true),
          D('pc2', 'pc', 130, 275, 'PC 2', true),
          D('lap1', 'laptop', 130, 440, 'Teacher Laptop', true),
          D('r1', 'router', 380, 275, 'School Router', true),
          D('fs1', 'file', 380, 95, 'File Server', true),
          D('net', 'internet', 750, 275, 'Internet Cloud', true),
          D('ws', 'web', 880, 275, 'Web Server', true)
        ],
        links: [
          L('pc1', 'r1', 'eth', { locked: true }),
          L('pc2', 'r1', 'eth', { broken: true }),
          L('lap1', 'r1', 'wifi', { locked: true }),
          L('r1', 'fs1', 'eth', { locked: true }),
          L('r1', 'net', 'eth'), // Fault 2: wrong cable type (eth instead of fibre) + Fault 3: no firewall!
          L('net', 'ws', 'fibre', { locked: true })
        ]
      }),
      ghosts: [['firewall', 565, 275]],
      checks: [
        ['Replace the broken Ethernet cable to PC 2', b => H.linkedToType(b, H.dev(b, 'pc2'), 'router', 'eth')],
        ['Place a Firewall between the Router and Internet Cloud', b => H.isFirewallProtectingRouter(b)],
        ['Upgrade the Internet Cloud link to Fibre Optic', b => H.internetUplink(b) && H.internetUplink(b).kind === 'fibre']
      ],
      simType: 'diagnostic',
      takeaway: 'Good network engineers test systematically: check local client links first, verify the right transmission medium (Ethernet vs. Wi-Fi vs. Fibre), and confirm perimeter Firewall protection.',
      quiz: {
        q: 'In this mission, why could PC 1 save its work to the File Server while PC 2 could not?',
        options: [
          'Only PC 2’s own Ethernet cable to the Router was broken; PC 1’s link was still working',
          'The File Server was turned off for everyone',
          'The Internet Cloud was down'
        ],
        correct: 0,
        explain: 'In a star network through a router, a broken cable on one client only disconnects that single device!'
      }
    },

    /* ===================== MISSION 7 (COULD: Open Design + Multi-Client Web!) ===================== */
    {
      id: 6,
      title: 'Design the New Wing',
      short: 'Design Brief',
      time: '~5 min',
      stars: 3,
      code: NB.dc('Q1RSQ15fVEVW'),
      usesWebStudio: true,
      showCableStats: true,
      preferWiredPCs: true,
      brief: 'COULD Challenge: Design a complete network from scratch! Include 4 wired PCs, 2 Wi-Fi clients, 1 File Server, 1 Print Server + Printer, and a Firewall-protected Fibre link to the Internet so every client can load your Na<>y Builds website.',
      action: 'Test Full Network',
      tools: ['move', 'eth', 'wifi', 'fibre', 'delete'],
      palette: ['pc', 'laptop', 'phone', 'router', 'firewall', 'file', 'print', 'printer'],
      starter: () => ({
        devices: [
          D('net', 'internet', 770, 120, 'Internet Cloud', true),
          D('ws', 'web', 890, 120, 'Web Server', true)
        ],
        links: [L('net', 'ws', 'fibre', { locked: true })]
      }),
      ghosts: [
        ['pc', 120, 90], ['pc', 120, 200], ['pc', 120, 310], ['pc', 120, 420],
        ['laptop', 250, 480], ['phone', 380, 480],
        ['router', 440, 260], ['file', 440, 90],
        ['print', 650, 390], ['printer', 830, 390],
        ['firewall', 610, 150]
      ],
      checks: [
        ['4 Desktop PCs connected to Router via Ethernet', b => H.byType(b, 'pc').filter(p => H.linkedToType(b, p, 'router', 'eth')).length >= 4],
        ['2+ portable clients (Laptop/Phone) connected via Wi-Fi', b => b.devices.filter(d => (d.type === 'laptop' || d.type === 'phone') && H.linkedToType(b, d, 'router', 'wifi')).length >= 2],
        ['File Server connected to Router (Ethernet)', b => H.linkedToType(b, H.first(b, 'file'), 'router', 'eth')],
        ['Print Server on Router + Shared Printer on Print Server', b => H.linkedToType(b, H.first(b, 'print'), 'router', 'eth') && H.linkedToType(b, H.first(b, 'printer'), 'print', 'eth')],
        ['Firewall protecting Internet ↔ Router with Fibre Optic', b => H.isFirewallProtectingRouter(b) && H.internetUplink(b) && H.internetUplink(b).kind === 'fibre'],
        ['Bonus: Redeploy an edited version of your webpage (v2+)', () => NB.WebStudio.getVersion() >= 2, true]
      ],
      simType: 'office',
      takeaway: 'You designed a real-world secured LAN! One central Router dramatically cuts cable count, servers centralise files and printing, and the Firewall + Fibre gateway safely brings your webpage to every wired and wireless client.',
      quiz: {
        q: 'If 6 computers are connected directly to each other with no router, it takes 15 cables. How many cables do 6 computers need with 1 central router?',
        options: ['6 cables (1 per computer)', '12 cables', '30 cables'],
        correct: 0,
        explain: 'Each computer only needs 1 cable to the central router — 6 computers = 6 cables instead of 15!'
      }
    },

    /* ===================== MISSION 8 (Extension: Lost CSS Packet!) ===================== */
    {
      id: 7,
      title: 'Missing Stylesheet!',
      short: 'Lost Packet',
      time: '~4 min',
      stars: 3,
      code: NB.dc('XFg6R1RD'),
      usesWebStudio: true,
      brief: 'Extension: Your Na<>y Builds site (index.html + style.css) travels across the Internet in 4 numbered packets. Watch what arrives when one packet drops and a spoofed packet hits the Firewall — then recover the missing packet!',
      action: 'Download Website Packets',
      tools: ['move'],
      palette: [],
      zones: [
        { x: 20, y: 50, w: 330, h: 460, label: 'School LAN', net: false },
        { x: 370, y: 50, w: 570, h: 460, label: 'Internet Cloud (Multiple Routers)', net: true }
      ],
      starter: () => ({
        devices: [
          D('pc1', 'pc', 95, 280, 'Your PC', true),
          D('r0', 'router', 210, 280, 'School Router', true),
          D('fw', 'firewall', 310, 280, 'Firewall', true),
          D('ra', 'router', 480, 140, 'Router A', true),
          D('rb', 'router', 480, 420, 'Router B', true),
          D('rc', 'router', 680, 140, 'Router C', true),
          D('rd', 'router', 680, 420, 'Router D', true),
          D('ws', 'web', 865, 280, 'Web Server', true)
        ],
        links: [
          L('pc1', 'r0', 'eth', { locked: true }),
          L('r0', 'fw', 'eth', { locked: true }),
          L('fw', 'ra', 'fibre', { locked: true }),
          L('fw', 'rb', 'fibre', { locked: true }),
          L('ra', 'rc', 'fibre', { locked: true }),
          L('rb', 'rd', 'fibre', { locked: true }),
          L('ra', 'rd', 'fibre', { locked: true }),
          L('rb', 'rc', 'fibre', { locked: true }),
          L('rc', 'ws', 'fibre', { locked: true }),
          L('rd', 'ws', 'fibre', { locked: true })
        ]
      }),
      ghosts: [],
      checks: [
        ['Download the website packets across the Internet', (b, meta) => !!meta.sent],
        ['Identify & resend the lost style.css packet (Packet 3)', (b, meta) => !!meta.resent],
        ['Confirm your styled website loads completely', (b, meta) => !!meta.recovered]
      ],
      simType: 'lostpacket',
      takeaway: 'Files are split into numbered packets that can take different routes and arrive out of order. If a packet (like style.css) is lost, the protocol asks the Web Server to resend just that missing packet!',
      quiz: {
        q: 'Why can packets from the same webpage arrive at your computer in the wrong order?',
        options: [
          'Each packet can travel along a different route through routers across the Internet',
          'The Web Server always sends pages backwards',
          'Ethernet cables scramble the order of letters'
        ],
        correct: 0,
        explain: 'Routers choose the best available path for each packet, so packets take different routes and are reassembled using their packet numbers!'
      }
    }
  ];
})();
