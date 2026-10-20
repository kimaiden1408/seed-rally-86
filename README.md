# Seed Rally 86: website version

Anyone with the link can play every mode: single stages, full rallies, and races against friends. Nobody needs an
account; each player types a name.

## How it runs

- **The game page** is on GitHub Pages: `https://kimaiden1408.github.io/seed-rally-86/`. It's always on and opens
  straight away. Single stages and full rallies run entirely in the browser.
- **The race server** runs the race rooms, the players' names and the shared board of stage times. It's on Render's
  free plan, which sleeps after 15 minutes with nobody playing. The first player after that wakes it: for up to a
  minute the race menu says "Waking up the race server", and then races and the shared board come on by themselves.
  Single stages and rallies don't wait for it.

## The files

- `index.html`: the game. `index.html.br` and `index.html.gz` are the same page compressed, which the server sends to
  save data.
- `config.js`: the address of the race server, for the page on GitHub Pages.
- `server.js` and `package.json`: the race server. It needs one library, `ws`.
- `render.yaml`: settings for Render, so the server sets itself up.

## Setting up the race server (once)

1. Go to [render.com](https://render.com) and sign up with your GitHub account.
2. Click **New**, then **Blueprint**.
3. If Render asks, let it see your GitHub repositories. Click **Connect** next to `seed-rally-86`.
4. Type any name for the blueprint, for example `seed-rally-86`, and click **Deploy Blueprint**.
5. Wait a few minutes, until the service shows **Live**. Check its address on the service's page.
   - If it's `https://seed-rally-86-races.onrender.com`, you're done.
   - If it's different, put the new address in `config.js`: on GitHub, open `config.js`, click the pencil, change the
     address, and click **Commit changes**. The page picks it up within a minute.

## Good to know about the free plan

- **The board can be wiped.** The free server's disk is wiped whenever it sleeps or restarts. Each player's browser
  keeps that player's own times and puts them back on the board the next time they play, so only the times of players
  who don't come back are lost.
- **Data allowance.** Render's free plan includes 5 GB of data a month. The game page comes from GitHub, so it doesn't
  count. A race of four uses about 10 MB per player per hour, so 5 GB covers hundreds of hours of racing.
- To have the race server always awake, with the board kept for good, switch the service to a paid instance on Render
  ($7 a month) and add a 1 GB disk ($0.25 a month) with the mount path `/var/data`. Then, under **Environment**, add a
  variable named `DATA_DIR` with the value `/var/data`.

Prices and limits are Render's and GitHub's as of October 2026 and may change.

## Updating the game

Replace `index.html` on GitHub with the new one, together with `index.html.br` and `index.html.gz` if you have new
ones. GitHub Pages shows the new page within a minute or two, and Render restarts the server with it by itself. If the
compressed copies don't match the page, the server ignores them and compresses the page itself.

## Try it on your own computer

1. Install Node.js (version 18 or newer) from [nodejs.org](https://nodejs.org).
2. Open a terminal in this folder and run `npm install`, then `npm start`.
3. Open `http://localhost:8080`. The page the server sends talks to that server, whatever `config.js` says.

## Server settings

All optional. On Render, add them under **Environment**.

| Name | What it does | Default |
| --- | --- | --- |
| `PORT` | The port the server listens on. Hosts set this themselves. | `8080` |
| `DATA_DIR` | The folder where the board and the names are saved. | a `data` folder next to `server.js` |
| `MAX_PLAYERS` | How many pages may be connected at once. | `500` |

## How it works

- Each browser makes a secret key the first time it opens the game and keeps it. The server knows the player by an id
  worked out from that key, so nobody can post times under someone else's name. There are no passwords.
- Race codes are not secret: anyone who knows a code can join that race, as with the race list.
- Each page sends its car's position about 15 times a second while racing, and the server passes it on to the others in
  the same race. A page whose connection drops keeps its place for 20 seconds, so a short drop doesn't end the race.
