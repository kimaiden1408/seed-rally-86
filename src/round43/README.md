# Round 43: source and tests

The exhaust's fittings as choices (flex joint, hangers, joints, bends), the exhaust's sound from the pipe as it is
drawn (a chain of sections, `PipeNet`), and seats and brackets where the running gear meets the shell.

**Not published yet when this was committed** (26 November 2026): the game page in this repository is still round 41
(build 6E9C). These files make round 43's pages from the published round 41 ones.

## What is here

- `patches/r43.py`: the patch script. Exact replacements on a build of the page; each must match once.
- `patches/t43/ex43.js`: the fittings drawn, the pipe measured (`ex43Geo`), the chain made (`ex43Net`), the Workshop's rows.
- `patches/t43/pipenet.js`: the chain of sections inside the engine's sound.
- `patches/t43/mech43.js`, `mech43call.txt`: seats and brackets (`mech43Feet`) and the line that calls it.
- `patches/t43/i18n43.py`: 30 new texts in six languages.
- `stock43.json`: each entered car's pipe as measured from its drawn car (made by `harness/geo43.js`), built into the page.
- `build43.sh`, `notes/stamps43.txt`: the build and its stamps and hashes.
- `harness/`: tests that run a built page in headless Chrome (`lib.js` serves the 3D library from disk).

## To rebuild

1. In a working folder: `patches/`, `harness/` and `build43.sh` as here; `stock43.json` at `work/r43/stock43c.json`.
2. The published pages: this repository's `index.html` at commit `15188e1` as `work/site41.html`; the Claude artifact's
   files in `work/art41/` (`index.html`, sha256 `eda6caab...`, and its seven `.js` files).
3. `npm i puppeteer-core three@0.128.0`, then `sh build43.sh`. Website build D324, artifact build 220C.

## Tests

Each takes a built page: `node harness/bld43.js work/site43/index.html`.

- `net43check.js`: the chain against the textbook (expansion chamber, side pipe, the old single tube).
- `chk43.js`: every end of the running gear touches another part or the shell.
- `bld43.js`: builds across bodies and exhausts: the pipe unbroken to the tailpipe, the sound finite.
- `snd43.js` with `spec1.json`, `stock43.js`: the exhaust's level in bands for builds, and for every entered car.
- `ws43.js`, `drive43.js`: the Workshop's Exhaust tab and a short drive in the page.
- `hash43.js`: every car's physics set-up, to show the driving is untouched.
