# Round 46: source and tests

Real roads: a course laid from the live map on any road in the world, point to point, there and back, or a circuit
of laps, with the land, the buildings, the roads and railways around it, its tunnels, bridges and overpasses, and
motorways with their lanes, lines and steel rails. The game's own three real courses (Col de Turini, La Bollène there
and back, the Monaco streets circuit). Real courses in Race Friends: the host picks one, and a course the host made
is sent from page to page.

**Not published when this was committed** (28 November 2026): the game page in this repository is still round 41
(build 6E9C). Round 46 is laid on round 45 (`../round45`), which is laid on rounds 44 and 43; none of them is
published.

## What is here

- `patches/r46.py`: the patch script, applied to a round 45 build of the page (113 exact replacements).
- `patches/t46/`: the real-roads code put into the page.
  - `rw_core.js`: the course laid from a map pack (the line, widths, lanes and road classes, bridges, tunnels and
    their cover, side roads, solids, the land and the sea).
  - `rw_net.js`: the map pack made from the live map (OpenStreetMap through Overpass, place names through Nominatim,
    heights from terrain tiles).
  - `rw_page.js`, `rw_draw.js`, `rw_ui.js`: the stage made from a pack, what is drawn, and the Real roads tab and map.
  - `rw_mp.js`: real courses in Race Friends.
  - `rw_i18n.js`: the words in the other six languages.
- `build46.sh`, `notes/stamps46.txt`: the build, its stamps and hashes. Website build 1782, artifact build 6D3E.
- `real/`: the game's own courses as packs. They go beside the page as `real/*.json`.
- `test/a8.json`: a course made on the map (8.4 km of the A8 near Monaco), used by the tests as a player's own course.
- `server.js`: the race server with one addition. It serves `real/*.json`, so the page the server sends (on Render,
  or run at home) can open the game's own courses too.
- `harness/`: the tests.
  - `mp46.js`: Race Friends on real courses, two and three pages through a race server run locally.
  - `ui46.js`: the tab and the map as a player uses them.
  - `art46.js`: the artifact's page, offline.
  - `crewbatch46.js`, `crew46.js`: the crew driver round each course.
  - `costs46.js`, `perf46.js`: draw costs.
  - `views46.js`, `shot46.js`: pictures.
  - `stagehash46.js`: the seeded stages unchanged. It needs `../round43/harness/lib.js` beside it as `lib.js`.
  - `pack46.js`, `circuit46.js`, `real46.js`, `lib46.js`: packs from the map, and the map services' answers kept on
    disk so tests repeat.
- `results/`: what the tests printed on the final builds, and pictures.

## To rebuild

Build rounds 43 to 45 as their READMEs say, then `sh build46.sh`.

## To publish (only when asked)

On the website:

1. Put `work/site46/index.html`, `index.html.br` and `index.html.gz` in the repository's root.
2. Put the three packs in a `real/` folder there.
3. Replace `server.js` with this one.

In the artifact: its `index.html` and the same `real/*.json`.

Pages of round 41 and of this round can't race each other (Race Friends version 7).

## Known limits

See the project note `claude/real-roads-2026-11.md`.
