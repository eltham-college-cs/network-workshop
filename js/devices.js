/* Device catalogue & crisp SVG icon templates for Year 8 Network Builder */
window.NB = window.NB || {};
NB.dc = e => [...atob(e)].map(c => String.fromCharCode(c.charCodeAt(0) ^ 23)).reverse().join('');
/* Address modes: #demo (teacher demo for slides: nothing saved, core missions open, starts at the firewall),
   #core (pupil link with the Pro missions hidden), #teacher or #teacher_code (everything unlocked), #pro. */
NB.MODE = (location.hash || '').slice(1).toLowerCase();
NB.DEMO = NB.MODE === 'demo';

NB.DEVICES = {
  pc: {
    name: 'Desktop PC',
    role: 'Client',
    isClient: true,
    color: '#3D8BFF',
    svg: `
      <rect x="-26" y="-24" width="52" height="34" rx="7" fill="#3D8BFF" stroke="#1B2440" stroke-width="3"/>
      <rect x="-20" y="-18" width="40" height="22" rx="3" fill="#CFE6FF" stroke="#1B2440" stroke-width="2"/>
      <rect x="-7" y="10" width="14" height="7" fill="#1B2440"/>
      <rect x="-18" y="16" width="36" height="5" rx="2.5" fill="#1B2440"/>
    `
  },
  laptop: {
    name: 'Laptop',
    role: 'Client',
    isClient: true,
    color: '#00A896',
    svg: `
      <rect x="-23" y="-22" width="46" height="30" rx="6" fill="#00A896" stroke="#1B2440" stroke-width="3"/>
      <rect x="-17" y="-16" width="34" height="19" rx="2.5" fill="#DDF8EE" stroke="#1B2440" stroke-width="2"/>
      <path d="M-29 10 L29 10 L25 18 L-25 18 Z" fill="#00A896" stroke="#1B2440" stroke-width="3" stroke-linejoin="round"/>
      <line x1="-8" y1="14" x2="8" y2="14" stroke="#1B2440" stroke-width="2" stroke-linecap="round"/>
    `
  },
  phone: {
    name: 'Phone / Tablet',
    role: 'Client',
    isClient: true,
    color: '#22C493',
    svg: `
      <rect x="-15" y="-25" width="30" height="48" rx="7" fill="#22C493" stroke="#1B2440" stroke-width="3"/>
      <rect x="-10" y="-18" width="20" height="31" rx="2.5" fill="#DDF8EE" stroke="#1B2440" stroke-width="2"/>
      <circle cx="0" cy="18" r="2.2" fill="#1B2440"/>
    `
  },
  router: {
    name: 'Router',
    role: 'Gateway',
    isClient: false,
    color: '#FF8A3D',
    svg: `
      <line x1="-15" y1="-10" x2="-21" y2="-28" stroke="#1B2440" stroke-width="3.2" stroke-linecap="round"/>
      <line x1="15" y1="-10" x2="21" y2="-28" stroke="#1B2440" stroke-width="3.2" stroke-linecap="round"/>
      <circle cx="-21" cy="-28" r="3" fill="#FFC83D" stroke="#1B2440" stroke-width="2"/>
      <circle cx="21" cy="-28" r="3" fill="#FFC83D" stroke="#1B2440" stroke-width="2"/>
      <rect x="-28" y="-12" width="56" height="28" rx="9" fill="#FF8A3D" stroke="#1B2440" stroke-width="3"/>
      <circle cx="-15" cy="2" r="3.5" fill="#DDF8EE" stroke="#1B2440" stroke-width="1.8"/>
      <circle cx="-3" cy="2" r="3.5" fill="#FFC83D" stroke="#1B2440" stroke-width="1.8"/>
      <circle cx="9" cy="2" r="3.5" fill="#CFE6FF" stroke="#1B2440" stroke-width="1.8"/>
      <rect x="17" y="-3" width="6" height="10" rx="2" fill="#1B2440"/>
    `
  },
  firewall: {
    name: 'Firewall',
    role: 'Security',
    isClient: false,
    color: '#E23D63',
    svg: `
      <rect x="-26" y="-22" width="52" height="42" rx="8" fill="#E23D63" stroke="#1B2440" stroke-width="3"/>
      <line x1="-26" y1="-8" x2="26" y2="-8" stroke="#1B2440" stroke-width="2.2"/>
      <line x1="-26" y1="6" x2="26" y2="6" stroke="#1B2440" stroke-width="2.2"/>
      <line x1="-8" y1="-22" x2="-8" y2="-8" stroke="#1B2440" stroke-width="2.2"/>
      <line x1="10" y1="-22" x2="10" y2="-8" stroke="#1B2440" stroke-width="2.2"/>
      <line x1="0" y1="-8" x2="0" y2="6" stroke="#1B2440" stroke-width="2.2"/>
      <line x1="-10" y1="6" x2="-10" y2="20" stroke="#1B2440" stroke-width="2.2"/>
      <line x1="10" y1="6" x2="10" y2="20" stroke="#1B2440" stroke-width="2.2"/>
      <path d="M0 -18 L15 -11 V1 C15 10 8 16 0 19 C-8 16 -15 10 -15 1 V-11 Z" fill="#FFC83D" stroke="#1B2440" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M-5 0 L-1 4 L7 -5" fill="none" stroke="#1B2440" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    `
  },
  file: {
    name: 'File Server',
    role: 'Server',
    isClient: false,
    color: '#7C4DFF',
    svg: `
      <rect x="-22" y="-27" width="44" height="52" rx="8" fill="#7C4DFF" stroke="#1B2440" stroke-width="3"/>
      <rect x="-15" y="-19" width="30" height="9" rx="2.5" fill="#F0E9FF" stroke="#1B2440" stroke-width="2"/>
      <rect x="-15" y="-5" width="30" height="9" rx="2.5" fill="#F0E9FF" stroke="#1B2440" stroke-width="2"/>
      <circle cx="9" cy="-14.5" r="2.2" fill="#16B383"/>
      <circle cx="9" cy="-0.5" r="2.2" fill="#FFC83D"/>
      <text x="0" y="18" text-anchor="middle" font-size="12" font-weight="900" fill="#FFFFFF" font-family="Nunito, sans-serif">FILE</text>
    `
  },
  print: {
    name: 'Print Server',
    role: 'Server',
    isClient: false,
    color: '#9C51FF',
    svg: `
      <rect x="-22" y="-27" width="44" height="52" rx="8" fill="#9C51FF" stroke="#1B2440" stroke-width="3"/>
      <rect x="-15" y="-19" width="30" height="9" rx="2.5" fill="#F0E9FF" stroke="#1B2440" stroke-width="2"/>
      <rect x="-15" y="-5" width="30" height="9" rx="2.5" fill="#F0E9FF" stroke="#1B2440" stroke-width="2"/>
      <circle cx="9" cy="-14.5" r="2.2" fill="#16B383"/>
      <text x="0" y="18" text-anchor="middle" font-size="11" font-weight="900" fill="#FFFFFF" font-family="Nunito, sans-serif">PRINT</text>
    `
  },
  web: {
    name: 'Web Server',
    role: 'Server',
    isClient: false,
    color: '#5B4BFF',
    svg: `
      <rect x="-24" y="-27" width="48" height="52" rx="8" fill="#5B4BFF" stroke="#1B2440" stroke-width="3"/>
      <circle cx="0" cy="-8" r="12" fill="#CFE6FF" stroke="#1B2440" stroke-width="2.2"/>
      <ellipse cx="0" cy="-8" rx="6" ry="12" fill="none" stroke="#1B2440" stroke-width="1.8"/>
      <line x1="-12" y1="-8" x2="12" y2="-8" stroke="#1B2440" stroke-width="1.8"/>
      <text x="0" y="18" text-anchor="middle" font-size="11" font-weight="900" fill="#FFFFFF" font-family="Nunito, sans-serif">WEB</text>
    `
  },
  printer: {
    name: 'Shared Printer',
    role: 'Device',
    isClient: false,
    color: '#FF5D8F',
    svg: `
      <rect x="-16" y="-24" width="32" height="14" rx="3" fill="#FFFFFF" stroke="#1B2440" stroke-width="2.6"/>
      <rect x="-26" y="-12" width="52" height="24" rx="7" fill="#FF5D8F" stroke="#1B2440" stroke-width="3"/>
      <rect x="-15" y="4" width="30" height="16" rx="2.5" fill="#FFFFFF" stroke="#1B2440" stroke-width="2.6"/>
      <line x1="-9" y1="10" x2="9" y2="10" stroke="#1B2440" stroke-width="2" stroke-linecap="round"/>
      <line x1="-9" y1="15" x2="5" y2="15" stroke="#1B2440" stroke-width="2" stroke-linecap="round"/>
      <circle cx="16" cy="-4" r="3" fill="#FFC83D" stroke="#1B2440" stroke-width="1.5"/>
    `
  },
  internet: {
    name: 'Internet Cloud',
    role: 'WAN',
    isClient: false,
    color: '#FFFFFF',
    svg: `
      <path d="M-24 14 H24 C34 14 40 7 40 -1 C40 -9 34 -15 25 -15 C23 -25 13 -31 2 -31 C-9 -31 -18 -24 -20 -14 C-31 -14 -39 -6 -39 2 C-39 9 -32 14 -24 14 Z"
            fill="#FFFFFF" stroke="#1B2440" stroke-width="3.2" stroke-linejoin="round"/>
      <text x="0" y="1" text-anchor="middle" font-size="11" font-weight="900" fill="#2B2F86" font-family="Nunito, sans-serif">INTERNET</text>
    `
  }
};
