# Round 49: source and tests

Laid on round 48 (`../round48`, not yet published). Not yet published.

1. **Real circuits as they are built** (`rw_race.js`).
   - The track is one wide surface. Its width is the map's where the map has one, a published figure where it has
     none (Inje Speedium, 14 m), else FIA Appendix O's: 12 m for a circuit and its pit lane, about 8 m for karting,
     10 m for dirt and rallycross.
   - Continuous white edge lines, 13 cm. A paved verge 1.2 m wide beyond each line (0.5 m on a street circuit).
   - Kerbs laid by rule from each corner's shape: inside at the apex, outside at the exit, at the entry of tight
     corners. Red and white, sloped, ribbed in the physics, slippery when wet.
   - Grass run-off to a guard rail, with no ditch, crown or rocks. Gravel beds and paved run-off where the map has them.
     Guard rails where the map has none.
   - The line's curvature spread along it where the map's points are sparse (no kinks), moved 1.2 m at most.
   - The racing line the rival crews follow keeps 3.3 m from walls and barriers beside a circuit's track.
2. **The road's own crossfall.** Measured across the road from the elevation model where it is a survey's (zoom 14 or
   finer: Belgium, Germany, France, Monaco), every 4 m. Elsewhere, as roads and circuits are designed. A road's is
   held to its class's maximum plus 3 %; a fast road's turns over no faster than AASHTO allows.
3. **Width changes and lane changes** tapered at the road's own speed (MUTCD's merging taper; a circuit's 1 m in
   20 m), centred where the map changes width.
4. **Five circuits among the game's courses**: Nürburgring Nordschleife, GP-Strecke and 24 Hours circuit,
   Spa-Francorchamps, Inje Speedium. The game's three earlier courses carry their measured crossfall now.
5. **Fixes**: a wall with no area that took every point for inside it (every car at Inje was thrown off at 3.1 km);
   side roads that took the roadside down beside the course; bridge piers on the course; buildings narrowing a
   circuit; the route planner on circuits (private tracks, pit lanes, one-way); the A8's crossfall flip.

## What is here

- `patches/r49.py`: the patch script, applied to the round 48 builds.
- `patches/t49/rw_race.js`: circuits' widths, tapers, kerbs, rails, run-off surfaces, the line's smoothing, the
  racing line's room, the crossfall (measured and designed) and its limits.
- `build49.sh`: both builds from round 48's, and the game's courses from `work/r49/packs`. `notes/stamps49.txt`.
- `notes/`:
  - `presets49.txt`, `presets49.js`: the five circuits among the game's courses.
  - `widths49.txt`: published widths set on a course where the map has none (Inje), with the source.
  - `wp_*.txt`: the points each circuit was made from (`harness/pack48.js`).
- `harness/`:
  - `circ49.js`: a course as built: widths against the map's tags, tapers, kerbs, rails, crossfall, heights, land
    over the road, meshes, surfaces.
  - `ride49.js`: the game's car driven steadily round, with damage on (also off-centre, over the kerbs, with the bank
    or kerbs taken out).
  - `drive49.js`: the crew driver, two paces; where each blow fell; a trace against its racing line.
  - `enrich49.js`: older courses brought up to date with the measured crossfall.
  - `widths49.js`: published widths onto a course.
  - `waypoints49.py`: the circuits' points from the map's ways.
  - `art49t.js`: the artifact offline.
  - `probes49/`: the probes used to find the faults (the wall with no area, the side road's step, the circuits'
    kinks, the run-off's levels).
- `results/`: what they printed; pictures.

The write-up is the project doc `claude/real-circuits-2026-11.md`.
