# Perseverance Rover: paisaje de Marte (Vite + Three.js)

## Context
Carpeta vacia. Se crea `perseverance-rover/` con un paisaje marciano estilo pelicula: dunas, rocas, cielo caramelo con polvo, sol de tarde calido con sombras suaves y las 2 lunas (Fobos y Deimos). Algo visible en <5 min tras aprobar, luego mejoras iterativas verificadas con `npm run check`.

## Fase 1: algo visible (<5 min)
1. `mkdir perseverance-rover`, entrar. `package.json` escrito a mano (evita el CLI interactivo de `npm create vite`), `npm i three` y `npm i -D vite playwright-core`.
2. Archivos (minimos):
   - `index.html`: canvas full-screen, carga `/main.js`.
   - `main.js`: toda la escena.
   - `scripts/check.mjs`: el check.
3. Arrancar `npm run dev` en background (puerto 5173, `--host` no necesario) y avisarte la URL en cuanto responda.

### Escena (`main.js`, un solo archivo)
- **Dunas**: `PlaneGeometry` grande subdividida, alturas por ruido de valor 2D en JS (crestas con `abs`/`1-abs` para look de duna) + color vertex por altura (naranja oxido a ocre). `MeshStandardMaterial`, recibe y proyecta sombras.
- **Rocas**: ~120 `IcosahedronGeometry` deformadas con ruido, escala/rotacion aleatoria (seed fija), asentadas sobre la altura del terreno. Un `InstancedMesh` si hace falta rendimiento.
- **Cielo**: esfera grande con `ShaderMaterial` (BackSide): degradado caramelo (cenit mas oscuro ambar, horizonte pastel polvoriento) + halo calido alrededor del sol. `scene.fog` color caramelo para el polvo en la distancia.
- **Sol de tarde**: `DirectionalLight` baja (~12 grados), color calido, `PCFSoftShadowMap`, `shadow.radius` alto para sombras suaves; `HemisphereLight` tenue caramelo/naranja para relleno.
- **Lunas**: 2 esferas con ruido (Fobos mas grande e irregular, Deimos mas pequena y lisa), `MeshBasicMaterial`/standard ligero, colocadas en el cielo a distinta altura, sin fog.
- **Polvo**: `Points` con partículas lentas a la deriva cerca de la camara.
- Camara baja, `OrbitControls` (de `three/examples/jsm`) limitado para que no baje del suelo. `window.__ready = true` tras el primer frame.

## Fase 2: `npm run check` (`scripts/check.mjs`)
- `playwright-core` con `chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] })` : usa el Chrome ya instalado, no descarga navegadores.
- Abre `http://localhost:5173`, escucha `console` (error/warning), `pageerror` y `requestfailed`, espera `window.__ready` (timeout 15 s), 1 s extra, guarda `check.png` (1280x720) y lista los errores; exit code 1 si hay errores o no hay ready.
- Si el server no responde, falla con mensaje claro (no lo arranca).

## Fase 3: self-annealing (max 5 rondas)
Cada ronda: `npm run check` -> leer errores de consola -> abrir `check.png` con Read -> comparar con lista (dunas, rocas, cielo caramelo con polvo, sol calido con sombras suaves, 2 lunas visibles) -> aplicar el arreglo mas pequeno con la evidencia -> repetir.
Mejoras previstas en orden: composicion de camara para que ambas lunas queden en cuadro, contraste de sombras, polvo/fog, detalle de dunas (ripples), variedad de rocas, tone mapping (`ACESFilmic`) para el look cine.
Listo cuando: 0 errores en consola y la captura muestra todo lo pedido. Si tras 5 rondas falta algo, se reporta exactamente que.

## Verificacion
- `curl -s localhost:5173` responde 200 con el server en marcha.
- `npm run check` sale con 0 y `check.png` revisado visualmente.
- Se te entrega la URL para verlo en tu navegador.

## Supuestos / lo que no se hace
- Sin rover modelado (no se pidio), sin tests unitarios (el check es la verificacion), sin postprocesado pesado.
- Si Chrome no esta instalado en tu Windows, el check fallaria; en ese caso se prueba `channel: 'msedge'` (Edge viene con Windows).
