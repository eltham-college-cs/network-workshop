# Year 8 Network Builder Workshop (Eltham College)

An interactive networking lab for Year 8 Computing: 8 core missions, 7 Pro missions for the consolidation lesson, and an embedded **Na<>y Builds Web Studio**.

## What is in it
- **Core missions (1-8, about 35 min):** build LANs, add Wi-Fi and a print server, build and deploy a web page, firewall duty, fault finding, an open design brief and a lost packet.
- **Pro missions (1-7, about 30-35 min):** each one follows **Predict -> Test -> Justify**. Pupils answer a prediction before the first test, and write a short justification (checked for key ideas) to earn the code word. Justifications are saved in the Passport so they can be copied into books.
- **Web Studio** (Missions 4, 5, 7, 8) with three ways to build:
  - **Guided:** 5 levels with goals, two-step hints and "Check my page", in the style of Na<>y Builds. Levels 1-4 unlock deploy; level 5 is a bonus.
  - **Paste:** paste a whole page downloaded from Na<>y Builds. The body goes into index.html and any `<style>` rules into style.css.
  - **Independent:** no levels or hints, with 6 stretch goals. For extension.
- **Deploy and load (Mission 4):** the pupil's own code crosses the network in numbered packets, then every client loads it. One Wi-Fi client loses a style.css packet and one client starts unconnected.
- **Firewall duty (Mission 5):** allow or block 8 packets, then choose the reason.
- **Firewall rule builder (Pro 5):** sentence rules, first match wins, 6 traffic tests.
- **Classroom tools:** countdown timer, layout hints, Passport, light/dark mode, Teacher Mode.

## Missions
| Core | Mission |
|---|---|
| 1 | Save Your Homework |
| 2 | Wired vs. Wireless |
| 3 | Share the Printer |
| 4 | Build, Deploy & Load |
| 5 | Stop the Defacement! (Firewall duty) |
| 6 | IT Support: Break It, Fix It |
| 7 | Design the New Wing |
| 8 | Missing Stylesheet! |

| Pro | Mission | Reinforces |
|---|---|---|
| 1 | On a Budget | cost as a drawback; cable trade-offs |
| 2 | Single Point of Failure | relying on one server |
| 3 | Two Sites, One School | LAN vs WAN, ISP |
| 4 | Outbreak! | malware spreading; isolation; firewall |
| 5 | Write the Firewall Rules | allow/block rules, rule order |
| 6 | Bottleneck | shared links, bandwidth |
| 7 | Boss: The Troubleshooter | three hidden faults |

## Links
- `index.html` : core missions. Missions unlock in order.
- `index.html#pro` : opens on Pro Mission 1. The first Pro mission is always unlocked, so the consolidation lesson does not depend on earlier progress.
- `index.html#teacher` : Teacher Mode, everything unlocked.

Progress is saved in the browser on that computer only.

## Running locally
No build step. Open `index.html` in Chrome or Edge, or serve the folder:

```bash
python3 -m http.server 8000
```

## Files
- `js/devices.js` device icons · `js/missions.js` core missions and graph helpers · `js/pro.js` Pro missions
- `js/webstudio.js` Web Studio · `js/duty.js` firewall duty and rule builder · `js/app.js` engine
