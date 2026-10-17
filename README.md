# Perseverance Rover

Real NASA data, made playable. Drive NASA's official Perseverance model across a cinematic Martian landscape, read live mission data in plain language, and "take photos" with the rover's cameras that open real images from Mars, some of them taken today.

Built with Vite and Three.js. No frameworks, no backend.

## Real NASA data, made accessible

Everything the mission control shows and every photo the cameras open is real. Nothing is mocked or invented.

| You see | What it really is | How it is made accessible |
|---|---|---|
| **Distance driven**, e.g. 45.22 km | The cumulative odometry from NASA's Perseverance waypoints: 706 stops, from sol 13 to today | Charted over the whole mission, and translated: "That is 113 laps of a running track since landing." |
| **Elevation**, e.g. -1,937 m | Elevation of each waypoint over Mars's reference surface | "Climbed 632 m since landing in Jezero Crater." |
| **Tilt**, e.g. 9.6° | How much the rover was tilted at each stop | "At its last stop the terrain was a noticeable slope; too much tilt could tip the rover over." |
| **Earth–Mars light time**, e.g. 12.84 min | Computed live from JPL orbital elements, updated every second | "A command takes 12 min 51 s to reach the rover and the reply takes as long: that is why it is driven with plans, not a joystick." |
| **Camera photos** | Raw images from the Mars 2020 raw images API, from the latest days | Hand-picked for color, horizon, the arm over the ground and close-up rocks, each labeled with camera, sol and how many days ago it was taken |

The 3D model is NASA's official Perseverance model, scaled to its real size (about 3 m long). The photos come straight from NASA's servers.

Why it matters: these datasets are public but usually live in JSON files and image archives that are hard to read. Here a number like "45,223 m of odometry" becomes laps around a track, tilt becomes the feeling of climbing a dune, and light time becomes the reason a rover cannot be steered live.

## What it does

- **Martian landscape**: procedural dunes and rocks, a caramel dusty sky, a low afternoon sun with soft shadows, floating dust, and both moons (Phobos and Deimos).
- **Drive the real rover**:
  - `W` / `S` drive forward and backward, `A` / `D` turn.
  - Slope physics: climbing slows you down, descending pushes you, steep slopes make you roll.
  - Each wheel spins with the distance its side travels, and the four corner wheels steer.
  - Wheels leave tracks in the sand.
  - Big rocks block you.
  - A chase camera follows the rover.
- **Mission control** (`T` shows or hides it): the four values above, each with a name, unit, provider, a chart of the whole mission and a plain-language sentence.
- **Camera photos**: four glowing dots sit on the rover's Mastcam-Z, NavCam, front Hazcam and WATSON. Hover to see the name. Click for a shutter sound, an iris and a flash, then the photo "develops" on screen.
  - Click the photo to enlarge it, `←` / `→` browse more photos from that camera, `Esc` returns to the game.

## Impact

This is a demo and an educational toy, not a science tool. What it adds:

- It puts real data in context: you can see 45 km of driving as a trail of tracks, feel what a 10° tilt is, and understand that a command to the rover takes about 13 minutes to arrive.
- It makes raw NASA imagery approachable: about 570 candidate photos were reviewed and the best were kept, favoring horizons, the arm over the ground and close-up rocks.
- It shows that a rich, interactive 3D scene, live data and a self-checking test loop fit in about 600 lines with no dependencies beyond Three.js and Vite.

## Data sources and credits

| What | Source |
|---|---|
| Rover 3D model | [NASA-3D-Resources](https://github.com/nasa/NASA-3D-Resources), Mars 2020 Perseverance Rover |
| Waypoints (distance, elevation, tilt) | NASA/JPL-Caltech MMGIS, `M20_waypoints.json` |
| Photos | NASA/JPL-Caltech Mars 2020 raw images API |
| Light time | Computed with approximate JPL Keplerian elements (Standish, valid 1800–2050); checked against the known 11 min 22 s on landing day |

Images and the model belong to NASA/JPL-Caltech. The photos are loaded directly from NASA's servers, not stored in this repo.

## What is in this repo

| Path | Purpose |
|---|---|
| `main.js` | The scene: terrain, rocks, sky, moons, dust, rover, driving, physics, tracks |
| `mission.js` | Mission control panel |
| `orbit.js` | Earth–Mars light-time calculation |
| `cameras.js` | Camera dots and the photo viewer |
| `photos.js` | The hand-picked photo list (camera, sol, time, URL) |
| `scripts/check.mjs` | The automated check (see below) |
| `vite.config.js` | Dev-server proxy for the NASA waypoints file |
| `public/models/` | The NASA rover model (`.glb`) |
| `public/draco/` | Draco decoder needed to read the model |
| `PLAN.md` | The original plan |

## Run it locally

Requirements: Node.js 18 or newer, and Google Chrome (only for the check).

```bash
git clone https://github.com/jusched/perseverance-rover.git
cd perseverance-rover
npm install
npm run dev
```

Open http://localhost:5173.

Controls: `W A S D` drive, `T` toggle mission control, click a glowing dot to take a photo, `←` `→` browse, click the photo to enlarge, `Esc` back to the game.

Note: the mission data goes through a dev-server proxy because NASA's waypoints file does not allow browser requests from other origins (CORS). It works with `npm run dev`. A static deployment would need its own proxy for that one file.

## The check

With the dev server running, in another terminal:

```bash
npm run check
```

It opens the page in headless Chrome and:

- fails on any console error or warning,
- confirms the four mission values loaded with real numbers and that `T` hides and shows the panel,
- clicks each of the four cameras and confirms a real photo opens (also tests arrows, enlarge and `Esc`),
- drives the rover into a rock and confirms it stops outside it,
- confirms the corner wheels steer,
- verifies the light-time math against the landing day (11 min 22 s),
- saves screenshots: `check.png`, `check-hover.png`, `check-photo-*.png` and `check-photo-zoom.png`.

No browsers are downloaded: it uses your installed Chrome. If you do not have it, use Edge: `CHANNEL=msedge npm run check`.

## Known limits

- Only Mastcam-Z and WATSON give true color. NavCam and Hazcam images have a greenish or sepia tint.
- The photo list is fixed. "N days ago" updates with the date, but new photos need to be picked by hand.
- The rover drives at 8 m/s and slopes weigh 2.5 times Martian gravity, so it feels good to play. The real rover moves at centimeters per second.
- Rocks collide as invisible circles, so the edge is approximate.
