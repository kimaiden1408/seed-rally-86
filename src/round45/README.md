# Round 45: source and tests

A backfire's flame at the tailpipe(s) of the pipe it is in, each bank's pulses and pops kept to its own pipe in the
sound, and what a crossover does to the flow worked out from the engine's pulses.

**Not published when this was committed** (27 November 2026): the game page in this repository is still round 41
(build 6E9C). Round 45 is laid on round 44 (`../round44`), which is laid on round 43; none of the three is published.

## What is here

- `patches/r45.py`: the patch script, applied to a round 44 build of the page (42 exact replacements).
- `patches/t45/ex45.js`: the pulses' figure for a layout of pipes (`ex45Psi`), and which open ends light for a pop in
  each bank (`ex45FlameOf`).
- `build45.sh`, `notes/stamps45.txt`: the build, its stamps and hashes. Website build 7381, artifact build B554.
- `harness/`: `fire45.js` (bank separation in the sound, pops by pipe, flames by layout, flow by layout),
  `pops45.js` (overrun pops counted by pipe), `drive45.js` (in the page: pops shown through the game's own loop),
  `under45.js` (pictures with a flame lit). The rest are in `../round43/harness` and `../round44/harness`.
- `results/`: what the tests printed on the website build, and a picture.

## To rebuild

Build rounds 43 and 44 as their READMEs say, then `sh build45.sh`.

## Known limits

See the project note `claude/backfire-and-flow-by-pipe-2026-11.md`.
