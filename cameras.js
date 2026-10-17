import * as THREE from 'three';
import PHOTOS from './photos.js';

// pieza del modelo -> camara real (las fotos de photos.js salen de esa camara)
const CAMERAS = [
  { id: 'mastcam', name: 'Mastcam-Z', part: 'Mastcam_Z_cams', nudge: [-13, -4] }, // ambas viven en la cabeza del mastil: se separan en pantalla
  { id: 'navcam', name: 'NavCam', part: 'NavCams', nudge: [13, -4] },
  { id: 'hazcam', name: 'Hazcam delantera', part: 'hazcams_front' },
  { id: 'watson', name: 'WATSON', part: 'WATSON' },
];

const ago = utc => {
  const d = Math.floor((Date.now() - Date.parse(utc)) / 86400000);
  return d <= 0 ? 'hoy' : d === 1 ? 'hace 1 día' : `hace ${d} días`;
};

// click de obturador sintetizado: dos estallidos de ruido, sin archivos de audio
let audio;
const shutterSound = () => {
  try {
    audio ??= new AudioContext();
    for (const at of [0, 0.09]) {
      const n = audio.sampleRate * 0.05, buf = audio.createBuffer(1, n, audio.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3;
      const src = audio.createBufferSource(), gain = audio.createGain();
      gain.gain.value = 0.3; src.buffer = buf; src.connect(gain).connect(audio.destination); src.start(audio.currentTime + at);
    }
  } catch { /* sin audio: el flash basta */ }
};

const fx = document.createElement('div');
fx.id = 'shutter';
fx.innerHTML = '<i></i><i></i><b></b>';
const photo = document.createElement('div');
photo.id = 'photo';
photo.hidden = true;
photo.innerHTML = `<figure>
  <button class="x" aria-label="Cerrar">✕</button>
  <div class="frame"><img alt=""><div class="wait"></div></div>
  <figcaption><span class="cam-name"></span> · Sol <span class="sol"></span> · <span class="ago"></span><em></em></figcaption>
  <p>← → más fotos de esta cámara · clic en la foto para ampliar · Esc volver al juego</p>
</figure>`;
document.body.append(fx, photo);
const img = photo.querySelector('img'), $ = s => photo.querySelector(s);

let list = [], idx = 0, token = 0, busy = false;

function show(i) {
  idx = (i + list.length) % list.length;
  const p = list[idx], mine = ++token;
  photo.dataset.state = 'loading';
  $('.wait').textContent = `Recibiendo imagen de ${p.camera}…`;
  $('.cam-name').textContent = p.camera;
  $('.sol').textContent = p.sol;
  $('.ago').textContent = ago(p.utc);
  $('em').textContent = `${idx + 1}/${list.length}`;
  img.classList.remove('develop');
  img.onload = () => {
    if (mine !== token) return;
    photo.dataset.state = 'ok';
    void img.offsetWidth; // reinicia la animacion de revelado
    img.classList.add('develop');
  };
  img.onerror = () => { if (mine === token) { photo.dataset.state = 'error'; $('.wait').textContent = 'No llegó la imagen. Prueba otra con ← →'; } };
  img.src = p.url;
}

function open(id) {
  if (busy || !photo.hidden) return;
  busy = true;
  list = PHOTOS[id];
  fx.className = '';
  void fx.offsetWidth;
  fx.className = 'go';
  shutterSound();
  setTimeout(() => {
    photo.hidden = false;
    photo.dataset.cam = id;
    document.body.classList.add('photo');
    show(0);
    busy = false;
  }, 380);
}

function close() {
  photo.hidden = true;
  photo.classList.remove('zoom');
  document.body.classList.remove('photo');
  token++;
}

img.addEventListener('click', () => photo.classList.toggle('zoom'));
$('.x').addEventListener('click', close);
addEventListener('keydown', e => {
  if (photo.hidden) return;
  if (e.code === 'Escape') close();
  else if (e.code === 'ArrowRight') show(idx + 1);
  else if (e.code === 'ArrowLeft') show(idx - 1);
});

// puntos que brillan sobre las piezas del modelo; `rover` ya debe tener el modelo dentro
export function initCameras(rover, camera, model) {
  rover.updateMatrixWorld(true);
  const dots = CAMERAS.map(c => {
    const node = model.getObjectByName(c.part);
    if (!node) { console.warn(`[rover] pieza no encontrada: ${c.part}`); return null; }
    const local = rover.worldToLocal(new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3()));
    const el = document.createElement('button');
    el.className = 'cam'; el.dataset.cam = c.id;
    el.innerHTML = `<span class="tip"><b>${c.name}</b><small>${c.part}</small></span>`;
    el.addEventListener('click', () => open(c.id));
    document.body.appendChild(el);
    return { el, local, nudge: c.nudge ?? [0, 0] };
  }).filter(Boolean);
  console.log('[rover] cámaras listas:', CAMERAS.map(c => `${c.name} -> ${c.part}`).join(', '));
  const v = new THREE.Vector3();
  return () => {
    for (const d of dots) {
      v.copy(d.local); rover.localToWorld(v).project(camera);
      d.el.hidden = v.z > 1 || !photo.hidden;
      d.el.style.translate = `${(v.x * 0.5 + 0.5) * innerWidth + d.nudge[0]}px ${(-v.y * 0.5 + 0.5) * innerHeight + d.nudge[1]}px`;
    }
  };
}
