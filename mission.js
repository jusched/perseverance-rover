import { lightTimeMinutes } from './orbit.js';

const LANDING = Date.UTC(2021, 1, 18, 20, 55);
const NASA = 'NASA/JPL-Caltech · MMGIS M20 waypoints';
const nf = d => v => v.toLocaleString('es', { minimumFractionDigits: d, maximumFractionDigits: d });

const CARDS = [
  {
    id: 'odometer', name: 'Distancia recorrida', unit: 'km', provider: NASA, fmt: nf(2), pick: p => p.dist_total_m / 1000,
    say: v => `Equivale a ${nf(0)(v * 1000 / 400)} vueltas a una pista de atletismo desde el aterrizaje.`,
  },
  {
    id: 'elevation', name: 'Elevación', unit: 'm', provider: NASA, fmt: nf(0), pick: p => p.elev_geoid,
    say: (v, pts) => `${v >= pts[0].y ? 'Ha subido' : 'Ha bajado'} ${nf(0)(Math.abs(v - pts[0].y))} m desde que aterrizó en el cráter Jezero.`,
  },
  {
    id: 'tilt', name: 'Inclinación', unit: '°', provider: NASA, fmt: nf(1), pick: p => p.tilt,
    say: v => `En su última parada el terreno era ${v < 5 ? 'casi plano' : 'una pendiente notable'}; con demasiada inclinación el rover podría volcar.`,
  },
  {
    id: 'lighttime', name: 'Luz Tierra–Marte', unit: 'min', provider: 'Calculado en vivo · elementos keplerianos JPL', fmt: nf(2),
    say: v => `Una orden tarda ${Math.floor(v)} min ${Math.round((v % 1) * 60)} s en llegar al rover y la respuesta otro tanto: por eso se maneja con planes, no con joystick.`,
  },
];

const panel = document.createElement('aside');
panel.id = 'mcc';
panel.innerHTML = `<h1>CONTROL DE MISIÓN <span>T · ocultar</span></h1>` + CARDS.map(c => `
  <section class="card" data-id="${c.id}" data-state="loading" data-value="">
    <h2>${c.name}<em>CARGANDO</em></h2>
    <div class="row"><div class="val"><b>—</b><i>${c.unit}</i></div><canvas width="320" height="80"></canvas></div>
    <p class="say"></p><footer>${c.provider}</footer>
  </section>`).join('');
document.body.appendChild(panel);
addEventListener('keydown', e => { if (e.code === 'KeyT' && !e.repeat) panel.hidden = !panel.hidden; });

const $ = (c, sel) => panel.querySelector(`[data-id=${c.id}] ${sel}`);
const el = c => panel.querySelector(`[data-id=${c.id}]`);

function chart(c, pts) {
  const cv = $(c, 'canvas'), g = cv.getContext('2d'), { width: w, height: h } = cv;
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)], [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  const X = x => 4 + (w - 8) * (x - x0) / ((x1 - x0) || 1), Y = y => h - 8 - (h - 16) * (y - y0) / ((y1 - y0) || 1);
  g.clearRect(0, 0, w, h);
  g.beginPath();
  pts.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](X(p.x), Y(p.y)));
  g.strokeStyle = '#ffb25c'; g.lineWidth = 2; g.stroke();
  g.lineTo(X(x1), h); g.lineTo(X(x0), h); g.fillStyle = 'rgba(255,178,92,.16)'; g.fill();
  const last = pts[pts.length - 1];
  g.beginPath(); g.arc(X(last.x), Y(last.y), 4, 0, 7); g.fillStyle = '#fff3d6'; g.fill();
}

function show(c, v, pts, sol) {
  const card = el(c);
  card.dataset.state = 'ok';
  card.dataset.value = String(v);
  $(c, 'b').textContent = c.fmt(v);
  $(c, 'em').textContent = sol ? `SOL ${sol}` : 'EN VIVO';
  $(c, '.say').textContent = c.say(v, pts);
  chart(c, pts);
}

function fail(c, msg) {
  el(c).dataset.state = 'error';
  $(c, 'em').textContent = 'SIN DATOS';
  $(c, '.say').textContent = msg;
}

// los 3 datos reales de la mision salen del mismo archivo de waypoints (via proxy de Vite por CORS)
fetch('/mmgis/M20_waypoints.json')
  .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
  .then(({ features }) => {
    const props = features.map(f => f.properties).sort((a, b) => a.sol - b.sol);
    for (const c of CARDS.filter(c => c.pick)) {
      const pts = props.map(p => ({ x: p.sol, y: c.pick(p) })).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
      if (!pts.length) { fail(c, 'El archivo no trae este campo.'); continue; }
      const last = pts[pts.length - 1];
      show(c, last.y, pts, last.x);
    }
  })
  .catch(e => CARDS.filter(c => c.pick).forEach(c => fail(c, `No se pudo leer el archivo de la NASA (${e.message}).`)));

// tiempo de luz: serie semanal desde el aterrizaje, el ultimo punto es "ahora"
const light = CARDS[3], DAY = 86400000;
const series = [];
for (let t = LANDING; t < Date.now(); t += 7 * DAY) series.push({ x: t, y: lightTimeMinutes(t) });
const tick = () => {
  const now = Date.now();
  series.push({ x: now, y: lightTimeMinutes(now) });
  show(light, series[series.length - 1].y, series);
  series.pop();
};
tick();
setInterval(tick, 1000);
