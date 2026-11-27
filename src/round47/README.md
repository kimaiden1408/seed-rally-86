# Round 47: source and tests

Three things, laid on round 46 (`../round46`, live since 28 November 2026):

1. **Lap timing on real circuits, as racing sims do it.** Three sectors a lap, the clock showing the lap's own time,
   a lap box under it (lap n of N, the sectors coloured purple for the race's best, green for a personal best and
   yellow for slower, last and best lap, total, the circuit's record kept on the page), a popup at each line with its
   gap to the best, and a running delta to the best lap. In Race Friends, a timing tower (position, lap, last lap,
   best lap, gap) from the line times each page sends, the fastest lap of the race in its feed, and each driver's
   best lap in the results.
2. **Real roads' structures built as games build them.**
   - A tunnel is a tube of its own: a bored vault where the land over it is deep, a cut-and-cover box where it is
     shallow, with gutters, raised walkways, tiled lower walls, lamps, jet fans in long ones, emergency signs, and a
     concrete portal at each end fitted into the cutting, its top following the land.
   - The land over a tunnel is the map's own, drawn by the roadside strip (finer than the grid), with the grid cut out
     under it. Where the map's land is too low over the tube, a crest of soil is made up over it, falling to the land
     at a bank's slope. Where there's no room for that bank, the box's concrete walls and roof show.
   - Inside the tube the ground is its floor, for the cameras, the wheels and anything that falls. The light dims
     inside and the engine's echo grows.
   - The map's walls and houses are no longer solids inside or over a tunnel, or on the road itself.
   - A reset in a tunnel puts the car back where it is, not at the tunnel's mouth.
   - A modern bridge (a motorway's, a trunk or main road's, or any over 60 m long) is concrete. Its girder is as deep
     as its spans need, each pier is one or two columns on a footing under a cap, and its abutments are concrete.
   - A road's grade is held to what its class is built to: 6.5 % for a motorway, 7.5 % for a trunk road, 10 % for a
     main road.
3. **The map maker.**
   - Its tiles now load when the page comes from the race server. That server sends every page with no referrer,
     which OpenStreetMap's tile servers refuse.
   - A route is found through a routing service first (OpenStreetMap's own car routing, else the routing project's
     server). The map's roads along that route are then fetched in one query. The old way, cell by cell, is only the
     fallback.
   - A newer route stops the older one's queries.
   - A search gives up after two minutes with a message, instead of waiting forever.
   - The artifact links to the website's map (`#real=new`).

## What is here

- `patches/r47.py`: the patch script, applied to the round 46 builds.
- `patches/t47/`:
  - `rw_lap.js`: the timing.
  - `rw_lap_i18n.js`: the new words in the other six languages.
  - `rw_tun.js`: the tunnels.
  - `rw_br.js`: the modern bridges.
- `build47.sh`, `notes/stamps47.txt`: the build, its stamps and hashes.
- `harness/`: this round's tests. The others are in `../round46/harness`, and `lib46.js` here replaces that one: it
  also lets the routing services' answers through the test's disk cache.
  - `lap47.js`: a circuit's laps through the page's own timing.
  - `tower47.js`: the race's timing tower.
  - `struct47.js`: pictures of every tunnel, bridge, overpass and motorway on a course.
  - `tuprobe47.js`: tunnel depths.
  - `route47.js`: the map from the race server, with tile referrers and route times.
  - `mapnew47.js`: the website at `#real=new`, and the artifact's link to it.
  - `art47t.js`: the artifact page offline.
- `results/`: what the tests printed on the final builds, and pictures.
