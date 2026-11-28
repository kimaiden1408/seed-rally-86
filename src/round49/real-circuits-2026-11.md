# Real circuits and the road's own crossfall (round 49, November 2026)

**Status: built and tested, not live.** Waiting for the user's word before anything is published. Round 48 is not live
either.

- **Private test copy** updated: version `1795875113-038a`, checked by hash (`index.html` and the eight courses).
- **Source and tests**: `src/round49/` on the branch `round49` of `kimaiden1408/seed-rally-86` (made from `round48`),
  commit `481a94d`. `main`, which serves the website, is unchanged.

- **Website build C48A**: `index.html`, 7,639,053 bytes, sha256 `927f2cfd...`, on round 48's CC74.
  - `real/`: the game's eight courses. The five circuits are new; the three earlier courses carry the road's measured
    crossfall now (`xs`, `xd`, `xz` added, every other field as it was). `server.js` unchanged.
- **Game artifact build 5A9A**: `index.html`, 5,822,012 bytes, sha256 `39695e99...`, on round 48's 5329.
  - `real/` as on the website.
- **Seeded stages unchanged**: stage hash `fa8afef7b331` on both builds.
- **Race Friends version 10**: pages of round 48 and round 49 can't race together. Real courses are laid differently.

Request (28 November 2026, 19:33): make lane changes smooth and natural, as in real life. Real circuits (the
Nürburgring Nordschleife with the GP-Strecke and the 24 Hours circuit, Spa-Francorchamps, Inje Speedium) aren't
accurate: roads too narrow, maybe taken as a single lane; real widths and details missing. Implement real road width,
bank and details 1:1, so every road drives as the real one does.

## What changed

**A circuit's track is one wide surface** (`rw_race.js`). Before, a raceway was read as a lane of an ordinary road.
- **Width**:
  - the map's (`width`, `width:carriageway`, `est_width`) where it has one: the Nordschleife's ways carry 7.4 to 12 m;
  - a published figure where the map has none: Inje Speedium, 14 m (Hyundai N's track information for its races
    there; set on the course with its source, `notes/widths49.txt`);
  - else as FIA Appendix O builds circuits: 12 m for a circuit (7.3) and its pit lane (7.9); about 8 m for karting
    and 10 m for dirt and rallycross tracks.
- **White lines**: continuous, 13 cm (FIA 7.6: at least 10 cm), at the track's edges, broken only across a junction.
- **A paved verge** 1.2 m wide beyond each line, where the kerbs lie. A street circuit (a course mostly on public
  roads, such as Monaco's raceway pieces) has 0.5 m and its barriers at the edge.
- **Kerbs** (the map has none, so they are laid by rule from each corner's shape): corners tighter than 350 m that
  turn 15 degrees or more get one inside about the apex, one outside where the corner opens out, and one at the entry
  of a corner tighter than 80 m. Red and white blocks 1 m long, rising to 4 cm at an apex and 3 cm elsewhere, ribbed
  in the physics, slippery when wet (painted). None at junctions, on bridges or in tunnels.
- **Run-off**: grass out to the guard rail, falling about 2 %, with no ditch, crown or rocks. Gravel beds where the
  map has them (`natural=shingle`, `raceway=gravel_trap`): loose, the car sinks and slows. Paved run-off where the map
  has paving.
- **Guard rails** where the map has none (its own rails, walls and fences are kept): 2.2 m past the verge on a track
  narrower than 11 m, 5.5 m otherwise.
- **The asphalt**: a circuit's even surface, with no repair patches, few cracks, no dusty edges and no farm mud.
- **Heights**: a circuit's own grade and crest limits (20 % and a 70 m crest where the land's model is a survey's).

**A circuit's line, without kinks.** The map draws a circuit as straight runs between points every 15 to 30 m. Where
two of its points stood close in a bend, the arc rounded between them was squeezed: at Inje, 20 degrees turned in 6 m
(an 8 m radius in a 60 m corner). The line's curvature is now spread along it (a Gaussian over 5 m), and the line is
laid out again and pulled back onto the map's line. It moved 0.47 to 0.95 m at most on the five circuits (never more
than 1.2 m; 0.5 m on a street circuit). At Inje the largest jump in curvature from one 2 m point to the next fell
from 0.29 to 0.03 (1/m), and that bend's tightest radius went from 8 m to 37 m.

**The road's own crossfall.**
- **Measured** where the elevation model is a survey's (Mapterhorn's tiles at zoom 14 or finer: national lidar or
  photogrammetry in Belgium, Germany, France and Monaco). The fall across the road is read every 4 m along the map's
  line, from a point some way right of it to one as far left, within the road's edges. Bridges and tunnels are left
  out. The pack carries it (`xs`). The median of five readings is taken.
  - A circuit keeps what was measured, up to 25 % (the Karussell's concrete).
  - A road keeps it where it is within 5 % of its design, up to its class's design maximum plus 3 % (7 % in towns,
    8 % on motorways and trunk roads, 10 % elsewhere). On the Col de Turini a tenth of the road read 12 % or more,
    where its bends are built to 7 %: the readings, a metre or two either side of a narrow road's mapped line, take in
    the cut or bank beside it.
  - On a motorway, a trunk road or a road of 90 km/h or more, the crossfall turns over no faster than AASHTO's
    relative gradient (0.47 % at 90 km/h to 0.35 % at 130). The A8's measured fall flipped 6.8 % in 18 m before, and a
    car at 110 km/h went light over it.
- **Designed** where nothing was measured:
  - a road: superelevated into its bends for its speed (AASHTO method 5);
  - a circuit: 1.5 % toward the bend it is in or coming to, plus 3.5 times its curvature, at most 6 % (FIA 7.5: 1.5
    to 3 % on straights, no more than 10 % in curves).

**Width changes and lane changes.**
- Each change of width is a taper at the road's own rate. Outside circuits that is MUTCD's merging taper in metric
  form: 0.62 × the speed in km/h metres for each metre of width at 70 km/h and over, the speed squared over 155 below,
  12 to 75 m a metre. On a circuit, 1 m in 20 m (FIA).
- The taper is centred where the map changes width, half before and half after.
- A narrower stretch too short for the road to taper down to it and back keeps the narrower of its two sides' widths:
  the road keeps its width and only its lines change. So does a narrower stretch 12 m long or less (a link or a piece
  of a junction mapped as its own way). Not where the map gives the width itself, nor on a circuit's own track, whose
  sections the map measures. Short wide spikes are taken out.
- Round 48's French test course with a climbing lane (Turini with two long ways given three lanes):
  - the lane was added over about 35 m, all before the point where the map adds it; now over about 130 m, centred on
    it (steepest taper 0.45 → 0.08 m of width a metre);
  - where the overtaking lane changes sides through a short stretch the map gives one lane each way, the road
    narrowed from 9 to 8.4 m and back; now it stays 9 m.
- At Monaco, two quay roads between the circuit's own pieces (the Route de la Piscine and the Quai Antoine 1er, 60 to
  80 m each), which the map gives as 5.5 m residential streets, are now as wide as the circuit either side of them.
- The painted width eases the same way. A road pinched by buildings narrows at 1 in 12 at the steepest.

**The five circuits among the game's courses** (made from the map with `harness/pack48.js`; the points they were made
from are in `notes/wp_*.txt`):

| Circuit | Lap on the map's line | Published | Track width | Rise | Steepest grade | Crossfall |
|---|---|---|---|---|---|---|
| Nürburgring Nordschleife (1 lap) | 20.77 km | 20.832 km | the map's, 7.4 to 12 m | 292 m | 15.4 % (Hohe Acht) | measured on 99 %: median 3.6 %, steepest 17.3 % in the Karussell |
| Nürburgring GP-Strecke (3 laps) | 5.12 km | 5.148 km | 12 m | 55.8 m (published 56 m) | 9.6 % | measured on 98 %: median 3.0 %, steepest 10.2 % at the Goodyear-Kehre |
| Nürburgring 24 Hours circuit (1 lap) | 25.34 km | 25.378 km | both of the above | 292 m | 15.5 % | measured on 99 % |
| Circuit de Spa-Francorchamps (3 laps) | 7.00 km | 7.004 km | 12 m | 102.2 m (published 102.2 m) | 15.2 % (Raidillon) | measured on all of it: median 3.2 %, steepest 7.6 % at La Source |
| Inje Speedium (3 laps) | 3.95 km | 3.908 km | 14 m | 49.6 m | 16.6 % | designed (Korea's land model is 30 m): median 2.1 %, at most 6 % |

- Inje's 3.95 km is the length of the map's own line for its full course.
- The 24 Hours lap starts on the GP straight just past where the link from the Nordschleife joins it. On the map that
  link meets the straight about 50 m after the GP's start line; a lap from there would run back along the straight.

**The route planner on circuits** (a player's own circuit course, and these):
- A raceway is the cheapest way (0.9 of its length), and its private access costs nothing extra.
- A pit lane costs four times its length: it is taken only for a point placed on it.
- Driving a circuit against its one-way costs six times its length. A course can still be made the wrong way round,
  from points placed that way.
- A point more than 6 m off the map's ways is snapped again after its own cells are fetched. On a circuit the map is
  fetched along every leg, because the routing service's guide line runs round private tracks on public roads.

**Faults found on the way, fixed.**
- **Every car at Inje was thrown off at 3.1 km** (on round 48's page too). A wall the map draws with two of its points
  in one place made a box with no area. The physics' test of a point in a box took every point anywhere for inside it,
  and put the car out of a wall 14 m deep. A box with no area now holds nothing, and such walls are not made.
- **A side road beside the course** (a service road along the Nordschleife at Hohenrain) came down to its land as it
  went along, and the course's roadside beside it was taken down with it: a step of up to a metre at the track's edge.
  A side road now keeps level with the course's edge until it is clear of it (and of a circuit's run-off). A circuit's
  run-off beside it stays as laid, and the bales closing it stand behind the run-off.
- **A bridge pier stood in the middle of the GP's start straight** (a bridge crossing it at a shallow angle). Piers are
  kept off the course.
- **A building narrowed Spa to 5 m.** Buildings never narrow a circuit's track below its painted width.
- **The planner took the Nordschleife off the track** onto service roads, and closed the 24 Hours lap through the pit
  lane and back along the straight (see above).
- **The rival crews' racing line** runs within the road's edges less half a car. A crew cuts a long bend by about
  1.5 m inside it (it steers for a point ahead), and on the 24 Hours layout met the end of the underpass wall on the
  link to the Nordschleife every lap. On a circuit's track the line now keeps 3.3 m from any wall, barrier or building
  beside it. Elsewhere, and on seeded stages, it is as before.

## Tests

All on this machine, in headless Chrome with software rendering. The drives and measurements below ran on the
builds just before the last change (the width rule for short narrower stretches). That change leaves every course
but Monaco as it was, checked point by point; Monaco was run again on the final builds, as were Race Friends, the
seeded stages and the artifact offline.

**A car round each circuit** (`ride49`): the game's car and physics, damage on, a steady driver on the road's middle,
at most 110 km/h and slow enough for each bend (3 m/s² across).

| Circuit | Distance | Hardest jolt | Hits, time in the air, tyre damage |
|---|---|---|---|
| Inje, 3 laps | 11.84 km | 0.63 g | none |
| GP-Strecke, 3 laps | 15.37 km | 0.44 g | none |
| Spa, 3 laps | 21.01 km | 0.38 g | none |
| Nordschleife, 1 lap | 20.77 km | 0.49 g | none |
| 24 Hours, 1 lap | 25.34 km | 0.45 g | none |

- Before the wall fix, every driver lost the car at Inje's 3.1 km, at any speed and anywhere across the road.
- 5.6 m off the middle, so one side's wheels run over the white line, the kerbs and the verge (8 % of the wheels'
  steps on the kerbs' paint): Spa and the GP-Strecke, 3 laps each, on either side. No hits, no tyre damage; 0.39 to
  0.56 g; up to 0.6 s with the car off the ground over 21 km, in short hops.

**The game's other courses**, the same driver (90 km/h; the A8 130), against round 48's:

| Course | Round 48 | Round 49 |
|---|---|---|
| Turini | 1.37 g, 3 light wall touches | 1.40 g, 2 |
| Bollène | 0.74 g | 0.73 g |
| Korea, route 44 | 0.77 g | 0.56 g |
| Monaco, 3 laps | 1.05 g | 0.72 g |
| A8 at 130 km/h | 0.68 g | 0.25 g |

All finished, with no tyre damage. The A8 was 0.94 g in this round before the crossfall turnover limit.

**The crew driver** (the rival crews' AI, damage on, pace 0.9; one run each):

| Circuit | Time | What it hit |
|---|---|---|
| GP-Strecke, 3 laps | 472 s | nothing |
| Inje, 3 laps | 385 s | 2 light floor touches at the line |
| Nordschleife | 572 s | 1 rail touch, 1 floor touch (26 rail touches before its line kept off the walls) |
| 24 Hours | 709 s | 1 rail touch (before: out, after hitting the underpass wall at 4.5 km) |
| Spa, 3 laps | 621 s | off at Speaker's Corner in its third lap (a wall at the far side of the run-off) |

Harder runs (pace 1.0, more mistakes): the 24 Hours finished after a wall at 8.5 km and an off at 12.3 km; Spa ended
against a rail at 11.9 km. These come from its own driving as much as from the track. Results: `results/crew*.txt`.

**The circuits as built** (`circ49`, every point):
- Kerbs: Nordschleife 104 runs (3.8 km) left, 94 (3.4 km) right; Spa 23 and 23; GP 22 and 21; Inje 28 and 26.
- Run-off, from the asphalt's edge to the end of the run-off (`runoff49`):

  | Circuit | Falls under 3 % | 3 to 6 % | 6 to 10 % | Over 10 % |
  |---|---|---|---|---|
  | Spa | 79 % | 19 % | 0.9 % | 0.2 % |
  | GP-Strecke | 76 % | 19 % | 0.8 % | 1.6 % (mostly on its bridge) |
  | Inje | 62 % | 33 % | 3 % | 0.4 % |
  | Nordschleife | 53 % | 40 % | 5 % | 1 % |

- The grass at the asphalt's edge: within 3 cm of it at half the points, 3 to 8 cm below it at the other half.
- Land over the road: at most 1 sample of 8,000 to 124,000 on any of the ten courses measured (the eight and two
  players' courses, the A8 and Korea's route 44).

**Other checks:**
- **Seeded stages** unchanged: `fa8afef7b331`, website and artifact builds.
- **Race Friends** (`mp46`, the final build):
  - Inje, 5 laps: the same hash `4466b3e` on both pages.
  - The host's own Korean course: sent page to page, `da1d94b6`. The host left and the race went on.
  - Monaco 3 laps: `7eb853ab`. A seeded stage: `67440cba`.
  - No errors.
- **The artifact offline** (`art49t`): eight courses listed; each laid out and drawn with no network requests and no
  errors. Inje 7.7 s, Spa 8.2 s, GP 8.0 s, Nordschleife 12.0 s, 24 Hours 14.6 s from the click, a 1.5 s wait
  included (laying out alone 0.3, 0.7, 0.7, 1.0 and 2.0 s).
- **Pictures** (`results/*.jpg`): Inje's bends that were kinked, the Karussell, the Hohenrain spot.

## Limits, plainly

- **Widths**:
  - Spa and the GP-Strecke are 12 m all round. That is FIA's minimum for a new circuit; neither the map nor a
    published source I found gives their widths. Real widths vary (their start straights are wider).
  - Inje is 14 m all round, from one published figure.
  - The Nordschleife's are the map's width tags, the mappers' own measurements.
- **Lengths** on the map's lines differ from the published ones by −0.5 % (GP) to +1.1 % (Inje).
- **Monaco's streets** (a street circuit among the game's courses since round 46) still take their widths from their
  traffic lanes as round 48 laid them: a one-way street is one lane, 3 to 3.6 m (the Avenue de Monte-Carlo, the Place
  du Casino), where the race uses the street from kerb to kerb. The map gives no widths there. Only its own raceway
  pieces and the two quay roads between them are a circuit's width.
- **Kerbs** are placed by rule, not where the real ones are; their shape is generic (no sausage kerbs or rumble
  strips of the real types).
- **Not built**: tyre walls, catch and debris fences, grid boxes, pit lane markings and boxes, start lights, marshal
  posts, advertising.
- **Inje's heights and crossfall** come from the 30 m global land model: its banking is the design rule, not measured.
- **Measured crossfall** where the map's line runs off the road's middle reads the land beside it. Roads are held to
  their class's maximum plus 3 %. Circuits are trusted up to 25 %: the Karussell's 17 % is real; some of the
  Nordschleife's other readings over 10 % (318 points of 10,385) may be overstated.
- **The run-off** falls 3 to 6 % at a fifth to two fifths of the points, not 2 %, and steeper in a few spots where the
  land drops away right beside it (Spa at Speaker's Corner, Inje at 1.6 km, the Nordschleife at Hocheichen). The grass
  sits up to 8 cm below the asphalt's edge at half the points.
- **The crew AI** still cuts long bends by about 1.5 m. On circuits its line now keeps clear of walls; its harder runs
  still crash now and then.
- **The 24 Hours lap** starts about 50 m past the GP's line (see above).
- **Lane changes** follow the speed rules above everywhere; a real road's own taper may be longer or shorter.
- **Test harness**: a "reading 'y'" error in the car physics is logged when a test lays a new course while the last
  run's car is still being stepped, as in round 48. The game's menus never do that.
- **Not tested** on a real GPU, a phone, or with real players.

## Files

- `src/round49/` on GitHub (branch `round49`; to `main` when published):
  - `patches/r49.py`: the patch script.
  - `patches/t49/rw_race.js`.
  - `build49.sh` and `notes/stamps49.txt`; `notes/presets49.*`, `notes/widths49.txt`, `notes/wp_*.txt`.
  - `harness/`: this round's tests (`circ49`, `ride49`, `drive49`, `enrich49`, `widths49`, `waypoints49`,
    `art49t`) and `probes49/`.
  - `results/`: what they printed, and pictures.
- Local builds: `work/site49/`, `work/art49/`; courses in `work/r49/packs/`.
