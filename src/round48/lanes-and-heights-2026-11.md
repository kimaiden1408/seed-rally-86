# Real roads' lanes, lines and heights (round 48, November 2026)

**Status: built and tested, not live.** Waiting for the user's word before anything is published.

- **Private test copy** updated: version `1795859141-b3a3`, checked by hash (`index.html` and the three courses).
- **Source and tests**: `src/round48/` on the branch `round48` of `kimaiden1408/seed-rally-86`, commit `c017d26`.
  `main`, which serves the website, is unchanged.

- **Website build CC74**: `index.html`, 7,598,004 bytes, sha256 `5111a02d...`, on round 47's 9814.
  - `real/`: the game's three courses, updated with the map's lane tags and their country. `server.js` unchanged.
- **Game artifact build 5329**: `index.html`, 5,780,963 bytes, sha256 `6d815d6c...`, on round 47's 2DCF.
  - `real/` as on the website.
- **Seeded stages unchanged**: stage hash `fa8afef7b331` on both builds.
- **Race Friends version 9**: pages of round 47 and round 48 can't race together. A real course's heights and lanes
  are laid differently now.

Requests (28 November 2026):
- 16:10: make every road's type, width and lanes accurate. Mountain roads in particular have unique lanes: uphill
  2 lanes and downhill 1, 3 in all. Implement all roads and lanes accurately, including centre lines, oncoming lanes,
  and right-hand and left-hand traffic.
- 16:22: also fix:
  - raw, spiky road elevation changes;
  - uneven road geometry that wrecks the tyres;
  - terrain covering the road.

## What changed

**Each country's road markings** (`rw_lane.js`). The country comes from the map:
- a new course asks Overpass which country it is in;
- the game's own courses now carry it (`cc`);
- older saved courses are placed by a rough map of countries.

The rules cover:
- which side traffic keeps to;
- the colour of the line between the two directions, the median line and the edge lines;
- the broken-line pattern in and out of towns, for lane lines, and on motorways;
- the warning line before a no-passing stretch;
- single or double lines where neither direction may pass;
- edge lines;
- the narrowest road that gets a centre line;
- lane widths by road class.

Countries:

| Country | Driving side | Lines |
|---|---|---|
| France, Monaco | right | White. Centre 3 m / 10 m, in towns 1.5 m / 5 m. Warning and limited-sight line 3 m / 1.33 m. Edge lines 3 m / 3.5 m; a motorway's hard shoulder 39 m / 13 m. |
| USA, Canada | right | Yellow centre line, broken 10 ft / 30 ft. Double yellow where neither way may pass, and on undivided roads with two or more lanes each way. Solid plus broken where one way may pass. Yellow left edge on one-way and divided roads. A two-way turn lane on a three-lane road on the flat in a town. |
| Korea | right | Yellow centre: broken, solid, solid plus broken, or double. White lane lines, solid in tunnels and on bridges. Neighbouring lane lines' dashes staggered on ordinary roads with three or more lanes each way. Expressways have a white line on the median side. |
| Japan | left | White centre: solid where the lanes are 3 m or wider, broken where narrower. Yellow where passing is not allowed. |
| Britain, Ireland | left | Double white lines where neither way may pass. Hazard warning lines 6 m / 3 m. Ireland has yellow edge lines. |
| Germany, Austria, Switzerland | right | Broken 6 m / 12 m, in towns 3 m / 6 m. Warning line 6 m / 3 m. Double solid on undivided roads with two or more lanes each way. |
| Others | | Italy; Norway and Finland (yellow centre); Sweden; China and Taiwan (yellow centre); Latin America (yellow centre); Australia, New Zealand (yellow no-passing lines), South Africa (yellow edge); other left-hand countries. |

Every other country gets the common Vienna Convention practice: white lines, broken 3 m / 9 m.

**Lanes from the map, each way.**
- The map's tags are kept and used:
  - lanes each way (`lanes:forward` / `lanes:backward`);
  - a turn lane in the middle (`lanes:both_ways`);
  - overtaking (`overtaking`, its forward and backward forms);
  - painted or not (`lane_markings`);
  - the middle line (`divider`);
  - lanes' widths (`width:lanes`).
- Which way the course runs on each map way is worked out, so "forward" lanes are the right ones. One-way roads
  driven against their direction (a closed course) keep the traffic's markings.
- **The 2-up, 1-down climbing lane**: a two-way road the map gives an odd number of lanes, without saying which way
  they go, gets its extra lane uphill if its stretch climbs 3.5 % or more. On the flat:
  - North American towns get a turn lane in the middle instead;
  - elsewhere the extra lane goes along the way.
- **Where the extra lane goes across the road**: the side with fewer lanes keeps a full lane of its class's width.
  The other side takes the rest, so an added lane tapers in as the road widens. Its lane line appears once the new
  lane is 1.8 m wide. The middle line moves over smoothly across 50 m.
- **A two-way main road mapped as one lane** is read as one lane each way. Korea's map often tags a road with one
  lane each way as `lanes=1`. Route 44 over Hangyeryeong does. Exceptions:
  - countries where main roads really are single-track (Britain, Ireland, the Nordic countries, Australia, New
    Zealand);
  - a road the map gives a width under 4.5 m.
- **Lane widths** follow the country and road class where the map gives no width. Examples: France's 3.5 m on main
  roads, Germany's 3.75 m on motorways, America's 3.65 m.

**Where passing is allowed: the centre line's kind.**
- Where the map says, as it says.
- Otherwise by sight. Each way, along the course's own line, from an eye 1.07 m over the road to an object 1.07 m
  over it (MUTCD's 3.5 ft):
  - over crests;
  - across the inside of bends, as far as the land allows (the elevation model) and as far as trees or buildings
    beside the road allow (by the land's kind);
  - against the passing sight distance for the speed the road is driven at. That speed is its limit, or less where
    its bends need it (3 m/s² across). Distances from MUTCD table 3B-1, 137 m to 366 m.
- Solid where sight is under a third of that distance.
- On a winding road with limited sight: France's dissuasion line, Britain's hazard warning line, the Nordic
  warning line. In countries without such a line, solid.
- In a European town: broken, except where sight is that short.
- Passing stretches under 120 m are dropped, and no-passing stretches are made at least 150 m (MUTCD).
- A warning line goes before each solid stretch where the country paints one: 60 m outside towns, 30 m in them.
- The side with two lanes of a three-lane road never crosses. Its single lane may cross only in America.
- No passing in tunnels.

**The lines, drawn.** They have their own mesh, white and yellow (one draw call). Each dash has its true length
wherever it falls between the road's 1 m rows. A broken line starts with a full dash.
- Edge lines:
  - on motorways, trunk, main and secondary roads (secondary from 5.5 m wide);
  - on tertiary and unclassified roads from 5.5 m wide, where the country's look paints them;
  - broken across junction mouths;
  - solid in tunnels.
- No lines on gravel, roundabouts, a there-and-back's turning place, or within 4 m of the start and finish lines.
- Lines show in winter, unless the road lies under snow, as before.

**The map's other roads: no land showing through them.**
- Before, each was a ribbon from its two edges, each on the land. The land between, laid coarser, stood up through
  it: on 16 % of the ribbon's triangles in Monaco.
- Now each cross-section has three points (edges and middle):
  - each is as high as the highest land under it there, and halfway to the next cross-section;
  - both are raised where the land halfway out stands over the line between them;
  - where an edge stands clear of the land, a skirt is turned down under it.
- The land is read from the roadside strip near the course, and from the land grid further out (quicker).
- These roads now carry their own lines, by the same country rules:
  - the centre line of a two-way trunk, main, secondary or tertiary road wide enough for one (doubled or solid with
    two or more lanes each way);
  - the lane lines of a one-way road.
- New courses keep each of these roads' lanes and whether it is one-way. The game's courses were updated with them.

**The road's heights, laid as a road is built** (`rw_elev.js`, in place of round 46's). The elevation model's heights
along the map's line are where the ground is, not quite where the road is. The old way smoothed them over about 30 m
and clamped the grade. Its clamps left creases, and its smoothing kept the model's bumps.

Now the height line is the smoothest one that stays near the ground where the ground can be trusted:
- **Smoothing**: a penalty on each point's change of grade (a Whittaker smoother, solved in one pass). It is
  stiffer for faster classes: 300 m wavelengths on a motorway, 125 m on a tertiary road.
- **How much each height counts**:
  - less where the hillside across the road is steep, because the map's line a few metres off the road's bench reads
    metres high or low;
  - not at all on a bridge, or in a tunnel and 12 m past its portals.
- **Four passes.** The first is stiff, for the trend. Each after it drops the heights that stand further off the
  line than their error allows: a cutting, an embankment, or a viaduct or tunnel the map doesn't have.
- **Class limits**, at least as gentle as these (design manuals ask for gentler still):

  | Class | Steepest grade | Least crest or hollow radius |
  |---|---|---|
  | Motorway | 7.5 % | 2,500 m |
  | Main road | 12 % | 600 m |
  | Tertiary | 16 % | 220 m |
  | Track | 24 % | 60 m |

  Where the line breaks one of these, the ground there counts for less and the line is stiffer. It is then laid
  again, up to six times. A last clamp takes what is left, eased over 40 m.
- **A there-and-back's turn** follows a curve that leaves the road at its grade and meets it again at its grade.
  Before, there was a 9 % crease where the turn began.

**Snow kept out of real tunnels.** The country's snow along the road stops at the portals. A winter A8 had snow
patches inside its tunnel.

**The game's three courses** were brought up to date from the map: their ways' lane tags, their other roads' lanes and
one-way-ness, and their country (France, Monaco). Only those were added. Every other field of each file is as it was.

## Tests

All on this machine, in headless Chrome with software rendering. The final builds unless said.

**Courses tested:**
- the game's three: Turini, Bollène, Monaco;
- the A8 (a player's course from round 47);
- a new Korean course, made from the map by the round 48 page: route 44 over Hangyeryeong, 9.7 km. Its country
  came back as Korea.

**Road heights**, on each course's own points:

| Course | Round 47: sharpest change of grade over 2 m (radius) | Round 48 | Round 47: over 10 m | Round 48 |
|---|---|---|---|---|
| Turini | 8.8 % (23 m); 98 points over 1 % | 0.7 % (290 m); none over 1 % | 11.5 %; 95 points over 5 % | 3.5 %; none over 5 % |
| Bollène | 4.9 %; 45 over 1 % | 0.7 %; none | 9.4 %; 44 over 5 % | 3.5 %; none |
| Monaco | 1.2 % | 0.5 % | 2.3 % | 2.6 % |
| A8 motorway | 3.4 % (59 m); 12 over 1 % | 0.1 %; none | 7.0 %; 7 over 5 % | 0.3 % |
| Korea, route 44 | 12.6 % (16 m); 79 over 1 %, 25 over 4 % | 0.3 %; none | 18.2 %; 22 over 10 % | 1.7 %; none |

- Steepest grades now: Turini 19.5 %, Bollène 19.6 %, A8 6.6 %, Korea 12 %. Round 47: 22 %, 17.8 %, 6.5 %, 10 %.
- Round 47's Korean road ran a straight 10 % ramp up to 9 m under the land, where its clamp met a steep stretch.
- Chart: `results/profile_before_after.png`.

**A car down the middle of the road** (`ride48`). The game's own car and physics, driven by a steady driver, with
damage on:
- steering to the road's line ahead;
- at most 90 km/h (the A8 130), and slow enough for each bend (3 m/s² across).

Round 47 and round 48 ran with the same driver.

| Course | Round 47 | Round 48 |
|---|---|---|
| Korea, route 44 | 2.8 s airborne in all; hardest jolt 3.4 g | never airborne; 0.8 g |
| Turini | stuck at 7.45 km of 12 after a 3.1 g jolt | finished, 12 km; 1.6 g |
| A8 at 130 km/h | 1.44 g; fastest suspension 1.35 m/s | 0.68 g; 0.64 m/s |
| Bollène | 0.72 g | 0.74 g |
| Monaco, 3 laps | 1.13 g | 1.05 g |

- Hardest jolt is the body's vertical acceleration over 50 ms.
- Korea and Turini were run on the final build. Bollène, Monaco and the A8 were run on the round 48 build before its
  last two changes (no snow in tunnels, the one-lane reading). Neither changes those roads' shape.
- No tyre or rim was damaged in any of these runs, on either build. At up to 150 km/h on the two mountain courses:
  Korea 2.9 s airborne and 3.2 g before, none and 0.7 g now.

**The crew driver** (the rival crews' AI, damage on, one run each, pace 0.9 and a harder 1.0). Its offs, rolls,
wall hits and punctures come from its own driving more than from the road. Both builds have a run or two that ended
off the road. Results are in `results/crew_*.txt`. It was not a fair test of the road and is not counted here.

**Land over the road.**
- **The course's own road**: the land and the roadside strip against the drawn road, every 0.5 m across it at every
  point. 16,000 to 96,000 samples a course. The land was over the road nowhere, on round 47 or round 48. The strip
  was over it at one sample in three of the courses, by more than 2 cm.
- **The other roads**, every upward-facing triangle checked against the land at its middle and the middles of its
  sides:

  | Course | Round 47: land over by more than 1 cm | Over 10 cm | Round 48: over 1 cm | Over 10 cm |
  |---|---|---|---|---|
  | Monaco | 2,780 of 17,452 (16 %) | 1,576 | 34 of 34,642 (0.1 %) | 3 |
  | Turini | 1,187 of 11,487 (10 %) | 393 | 8 of 22,849 | 0 |
  | Korea | 20 of 2,755 | 5 | 0 of 5,510 | 0 |

**Lanes laid** (the lanes each way, and the middle line's kind, at each point of the course):
- **Turini**: every point 1 + 1.
  - Middle line: dissuasion line both ways 69 %, solid 26 %, mixed solid and broken 3 %, broken 1 %.
- **Monaco**: 1 + 1 on 56 %, one-way 44 % (100 points driven against a one-way street's direction).
  - Middle line on its two-way streets: solid 66 %, broken 25 %, warning lines 5 %, mixed 3 %.
- **A8**: 2 to 4 lanes one-way, 8 at its toll plaza. No middle line.
  - Lane lines 3 m / 10 m. Hard-shoulder line 39 m / 13 m; median edge solid.
- **Korea**: 1 + 1 all the way (with the one-lane reading above).
  - Yellow middle line: solid 93 %, mixed 7 %.
- **Three-lane test copies** (test inputs, not real roads): Turini with two of its long ways set to 3 lanes:
  - one without directions, which got 2 + 1 uphill;
  - one tagged 1 forward / 2 backward, laid as tagged.

  The same copy was laid under Korea's, Britain's and America's rules too. Pictures (`results/climb_lines.jpg`)
  show:
  - France: the continuous line and the extra lane's dashed line on the right side;
  - Korea: yellow;
  - Britain: driving on the left with double white lines;
  - America: double yellow.

**Pictures**: driver's-eye views every few hundred metres of each course (`results/lines_*.jpg`). Round 47's, for
comparison: `results/before_turini_r47.jpg`, `results/before_monaco_r47.jpg`.

**Other checks:**
- **Race Friends** (`mp46`, the final build):
  - Turini: same hash `704ca84f` on both pages.
  - The host's own Korean course: sent page to page, `da1d94b6` on all three pages. The host left and the race went
    on.
  - Monaco 3 laps: `549bdb1e`.
  - A seeded stage: `67440cba`.
  - No errors.
- **The Real roads tab** (`ui46`): a course made on the map, built (one new network request, the country query),
  kept and laid out. The Korean words show. No errors.
- **The artifact offline** (`art48t`): the three courses laid out with no network requests and no errors.
- **Build time** (the second of two runs each, this machine):

  | Course | Laying out, round 47 → round 48 | Drawing | Triangles in the view drawn |
  |---|---|---|---|
  | Turini | 0.18 s → 0.28 s | 3.9 s → 4.0 s | about the same |
  | Monaco | 0.23 s → 0.20 s | 1.9 s → 2.0 s (the other roads and the real-road scenery: 0.38 s → 0.49 s) | 161,000 → 216,000 |
  | Korea | 0.42 s → 0.51 s | 2.9 s → 2.6 s | 430,000 → 516,000 (its road now two lanes wide) |

  The extra laying-out time is the sight-distance pass. Monaco's extra triangles are its other roads' ribbons (three
  points across instead of two, with skirts) and their lines.

## Limits, plainly

- **Lanes come from the map.**
  - A road mapped with two lanes but a climbing lane on the ground has no climbing lane in the game. Only an odd lane
    count, or lanes tagged each way, gives one.
  - Turn lanes at junctions, arrows, stop and give-way lines, bus, cycle and parking lanes, hatched areas, chevrons
    and road studs are not drawn.
- **Passing by sight**:
  - Uses MUTCD's distances in every country.
  - The "a third of the distance" line between solid and the limited-sight line is this game's choice, made to look
    like French and British winding roads. It is not from their manuals.
  - The roadside's clearance (trees, buildings) is by the land's kind, not the map's own trees and walls.
- **Country rules**:
  - France's, America's and Japan's line widths and some of Korea's come from their standards.
  - Korea's dash lengths (3 m / 5 m, expressways 10 m / 10 m) are assumed, not confirmed from the manual.
  - The other countries' patterns are their usual practice, not checked against their manuals.
- **The one-lane reading** of two-way main roads is a rule of thumb. A real single-track main road outside the
  countries listed will be drawn two lanes wide.
- **Heights**:
  - A real road steeper than its class's limit is held to that limit, so the land takes up the difference.
  - The road is still only as good as the elevation model under it (coarser in Korea than in France).
- **The course's own edges**: where the land rises steeply right at the edge (a side road above, a hillside cut),
  the bank is as before.
- **The crew AI** still crashes on narrow mountain roads, as before; this round did not change its driving.
- **Test harness**: a crash in the car physics was logged when a test put a new course in place while a run was still
  going on the last one. Round 47's build does the same. The game's menus never do that.
- **Not tested** on a real GPU, a phone, real players, or a real Korean, Japanese, British or American course other
  than the one Korean course above.

## Files

- `src/round48/` on GitHub (branch `round48`; to `main` when published):
  - `patches/r48.py`: the patch script.
  - `patches/t48/rw_lane.js`, `rw_elev.js`.
  - `build48.sh` and `notes/stamps48.txt`.
  - `harness/`: this round's tests (`elev48`, `ride48`, `drive48`, `netcov48`, `enrich48`, `pack48`, `sweep48`,
    `spot48`, `xs48`, `art48t`).
  - `results/`: what they printed, the chart and pictures.
- Local builds: `work/site48/`, `work/art48/`; courses in `work/r48/packs/`.
