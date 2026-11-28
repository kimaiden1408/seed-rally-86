# Round 48: source and tests

Laid on round 47 (`../round47`, live since 28 November 2026). Not yet published.

1. **Real roads' lanes and lines, as the map and the country have them.**
   - Each country's markings: which side traffic keeps to, the colours of the centre line, median line and edge lines
     (yellow where the country paints them yellow), broken patterns in and out of towns, warning lines, single or
     double lines where neither way may pass, edge lines, and lane widths by road class.
   - Countries come from the map (a new course asks which country it is in; the game's own courses now carry it).
   - Lanes each way from the map's tags. A road with an odd number of lanes and no direction gets its extra lane
     uphill where it climbs (a climbing lane: two up, one down). On the flat, North American towns get a turn lane in
     the middle instead.
   - Where passing is allowed: as the map says, else by sight distance (MUTCD) over crests and across bends. Solid,
     broken, the country's line for limited sight, mixed solid and broken, warning lines.
   - The map's other roads are laid over the land so it can't show through, and carry their own lines.
2. **Real roads' heights, laid as a road is built.** The smoothest line that stays near the ground where the ground
   can be trusted (a Whittaker smoother with robust passes), held to its class's grade and crest limits. A
   there-and-back's turn meets the road at its grades. No snow in real tunnels.
3. **The game's three courses** brought up to date with the map's lane tags and their country.

## What is here

- `patches/r48.py`: the patch script, applied to the round 47 builds.
- `patches/t48/`:
  - `rw_lane.js`: the countries' rules, the lanes pass, the painter, the other roads' ribbons and lines, and the pack
    updater.
  - `rw_elev.js`: the heights.
- `build48.sh`: both builds from round 47's, and the game's courses from `work/r48/packs`. `notes/stamps48.txt`.
- `harness/`:
  - `elev48.js`: heights, land over the road, steps at its edges (with `DRIVE=1`, the crew driver).
  - `ride48.js`: the game's car driven steadily down the road, with damage on: jolts, suspension speeds, time in the
    air, tyres.
  - `drive48.js`: the crew driver, two paces.
  - `netcov48.js`: the other roads' ribbons against the land, round 47's and round 48's.
  - `enrich48.js`: the courses brought up to date from the map.
  - `pack48.js`: a course made from the map in the page (the Korean course).
  - `sweep48.js`, `spot48.js`, `xs48.js`: pictures, and a cross-section's numbers.
  - `art48t.js`: the artifact offline.
- `results/`: what they printed; the heights chart; pictures of each course's lines, before and after.

The write-up is the project doc `claude/lanes-and-heights-2026-11.md`.
