# Perseverance Rover: Mars landscape (Vite + Three.js)

## Context
Empty folder. Create `perseverance-rover/` with a cinematic Martian landscape: dunes, rocks, a caramel dusty sky, a warm afternoon sun with soft shadows and both moons (Phobos and Deimos). Something visible in under 5 minutes after approval, then iterative improvements verified with `npm run check`.

## Phase 1: something visible (<5 min)
1. `mkdir perseverance-rover`, enter it. Write `package.json` by hand (avoids the interactive `npm create vite`), then `npm i three` and `npm i -D vite playwright-core`.
2. Files (minimal):
   - `index.html`: full-screen canvas, loads `/main.js`.
   - `main.js`: the whole scene.
   - `scripts/check.mjs`: the check.
3. Start `npm run dev` in the background (port 5173) and report the URL as soon as it responds.

### Scene (`main.js`, a single file)
- **Dunes**: large subdivided `PlaneGeometry`, heights from 2D value noise in JS (ridges with `abs`/`1-abs` for a dune look) + vertex color by height (rust orange to ochre). `MeshStandardMaterial`, receives and casts shadows.
- **Rocks**: ~120 noise-deformed `IcosahedronGeometry`, random scale/rotation (fixed seed), resting on the terrain height.
- **Sky**: large `ShaderMaterial` sphere (BackSide): caramel gradient (darker amber zenith, dusty pastel horizon) + warm halo around the sun. Caramel `scene.fog` for distant dust.
- **Afternoon sun**: low `DirectionalLight` (~12 degrees), warm color, soft shadows with a high `shadow.radius`; faint caramel/orange `HemisphereLight` as fill.
- **Moons**: 2 noisy spheres (Phobos larger and irregular, Deimos smaller and smoother) at different sky heights, no fog.
- **Dust**: `Points` drifting slowly near the camera.
- `window.__ready = true` after the first frames.

## Phase 2: `npm run check` (`scripts/check.mjs`)
- `playwright-core` with `chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] })`: uses the installed Chrome, no browser downloads.
- Opens `http://localhost:5173`, listens to `console` (error/warning), `pageerror` and `requestfailed`, waits for `window.__ready`, saves `check.png` (1280x720) and lists the errors; exit code 1 on errors or if never ready.
- If the server does not respond, it fails with a clear message (it does not start it).

## Phase 3: self-annealing (max 5 rounds)
Each round: `npm run check` -> read console errors -> open `check.png` -> compare against the list (dunes, rocks, caramel dusty sky, warm sun with soft shadows, 2 visible moons) -> apply the smallest fix based on the evidence -> repeat.
Done when: 0 console errors and the screenshot shows everything requested. If something is still missing after 5 rounds, report exactly what.

## Verification
- `curl -s localhost:5173` returns 200 with the server running.
- `npm run check` exits 0 and `check.png` is reviewed visually.
- The URL is handed over to view in the browser.

## Later additions (done)
NASA Perseverance model driven with WASD (slope physics, wheel tracks, spinning wheels, rock collision), mission control HUD (T toggles it), and camera hotspots that open real Mars photos.
