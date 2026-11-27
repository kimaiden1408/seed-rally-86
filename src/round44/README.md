# Round 44: source and tests

Two pipes and what joins them: a pipe from each bank of a vee, flat or W engine (true dual), an H-pipe or an X-pipe
between the two, the Y-pipe as before; and two tailpipes from one pipe. Each is drawn under the car and each is what
the exhaust's sound is made from.

**Not published when this was committed** (27 November 2026): the game page in this repository is still round 41
(build 6E9C). Round 44 is laid on round 43 (`../round43`), which is not published either.

## What is here

- `patches/r44.py`: the patch script, applied to a round 43 build of the page. Exact replacements; each must match
  the stated number of times.
- `patches/t44/ex44.js`: the crossover drawn (`ex44Cross`, `ex44X`), the pipe measured on one side with where the
  crossover is (`ex44Geo`), the two-pipe net made from the one-pipe chain (`ex44Net2`).
- `patches/t44/pipenet2.js`: `PipeNet2`, the net of pipes inside the engine's sound: sources (one a bank), joints of
  any number of pipe ends, capped ends, open ends.
- `stock44.json`: each entered car's pipe as measured from its drawn car (`harness/geo43.js`). Only `galliot_v8`
  differs from round 43's: it now has a pipe a bank.
- `build44.sh`, `notes/stamps44.txt`: the build, its stamps and hashes. Website build 52FE, artifact build 61AF.
- `harness/`: the tests changed or added this round. The rest (`lib.js`, `probe.js`, `under.js`, `hash43.js`,
  `chk43.js`, `ws43.js`, `drive43.js`, `perf43.js`, `net43check.js`) are in `../round43/harness` unchanged: copy that
  folder first and these over it.
- `results/`: what the tests printed on the website build, and a picture of the kinds.

## To rebuild

1. Build round 43 as its README says (`work/site43/index.html`, `work/art43/`).
2. `patches/`, `harness/` and `build44.sh` as here; `stock44.json` at `work/r44/stock44c.json`.
3. `sh build44.sh`.

## Tests

- `net44check.js`: the two-pipe net against cases with known answers (no crossover: two single chains; X-pipe with
  both banks alike: one chain; X-pipe with banks opposite: nothing passes; H-pipe with both banks alike: a capped
  side pipe half the tube's length).
- `bld43.js` with `vars.json` and `vars2.json`: builds across bodies: the pipe unbroken to every tailpipe, a two-pipe
  net where a crossover is drawn, the sound finite.
- `snd43.js` with `spec_v8.json`, `spec_twin.json`, `spec_van.json`: the exhaust's level in bands.
- `ws44.js`: the Workshop's Crossover and Tailpipes rows kept in step.
- `stock44.js`: every entered car's drawn pipe against the table.
- `perf44.js`: what the two-pipe sound costs.

## Known limits

See the project note `claude/h-x-y-pipes-2026-11.md`.
