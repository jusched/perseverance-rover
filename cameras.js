import * as THREE from 'three';
import PHOTOS from './photos.js';

// model part -> real camera (the photos in photos.js come from that camera)
const CAMERAS = [
  { id: 'mastcam', name: 'Mastcam-Z', part: 'Mastcam_Z_cams', nudge: [-13, -4] }, // both sit on the mast head: spread apart on screen
  { id: 'navcam', name: 'NavCam', part: 'NavCams', nudge: [13, -4] },
  { id: 'hazcam', name: 'Front Hazcam', part: 'hazcams_front' },
  { id: 'watson', name: 'WATSON', part: 'WATSON' },
];

const ago = utc => {
  const d = Math.floor((Date.now() - Date.parse(utc)) / 86400000);
  return d <= 0 ? 'today' : d === 1 ? '1 day ago' : `${d} days ago`;
};

// synthesized shutter click: two noise bursts, no audio files
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
  } catch { /* no audio: the flash is enough */ }
};

const fx = document.createElement('div');
fx.id = 'shutter';
fx.innerHTML = '<i></i><i></i><b></b>';
const photo = document.createElement('div');
photo.id = 'photo';
photo.hidden = true;
photo.innerHTML = `<figure>
  <button class="x" aria-label="Close">✕</button>
  <div class="frame"><img alt=""><div class="wait"></div></div>
  <figcaption><span class="cam-name"></span> · Sol <span class="sol"></span> · <span class="ago"></span><em></em></figcaption>
  <p>← → more photos from this camera · click the photo to enlarge · Esc back to game</p>
</figure>`;
document.body.append(fx, photo);
const img = photo.querySelector('img'), $ = s => photo.querySelector(s);

let list = [], idx = 0, token = 0, busy = false;

function show(i) {
  idx = (i + list.length) % list.length;
  const p = list[idx], mine = ++token;
  photo.dataset.state = 'loading';
  $('.wait').textContent = `Receiving image from ${p.camera}…`;
  $('.cam-name').textContent = p.camera;
  $('.sol').textContent = p.sol;
  $('.ago').textContent = ago(p.utc);
  $('em').textContent = `${idx + 1}/${list.length}`;
  img.classList.remove('develop');
  img.onload = () => {
    if (mine !== token) return;
    photo.dataset.state = 'ok';
    void img.offsetWidth; // restarts the reveal animation
    img.classList.add('develop');
  };
  img.onerror = () => { if (mine === token) { photo.dataset.state = 'error'; $('.wait').textContent = 'The image did not arrive. Try another with ← →'; } };
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

// glowing dots over the model parts; `rover` must already contain the model
export function initCameras(rover, camera, model) {
  rover.updateMatrixWorld(true);
  const dots = CAMERAS.map(c => {
    const node = model.getObjectByName(c.part);
    if (!node) { console.warn(`[rover] part not found: ${c.part}`); return null; }
    const local = rover.worldToLocal(new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3()));
    const el = document.createElement('button');
    el.className = 'cam'; el.dataset.cam = c.id;
    el.innerHTML = `<span class="tip"><b>${c.name}</b><small>${c.part}</small></span>`;
    el.addEventListener('click', () => open(c.id));
    document.body.appendChild(el);
    return { el, local, nudge: c.nudge ?? [0, 0] };
  }).filter(Boolean);
  console.log('[rover] cameras ready:', CAMERAS.map(c => `${c.name} -> ${c.part}`).join(', '));
  const v = new THREE.Vector3();
  return () => {
    for (const d of dots) {
      v.copy(d.local); rover.localToWorld(v).project(camera);
      d.el.hidden = v.z > 1 || !photo.hidden;
      d.el.style.translate = `${(v.x * 0.5 + 0.5) * innerWidth + d.nudge[0]}px ${(-v.y * 0.5 + 0.5) * innerHeight + d.nudge[1]}px`;
    }
  };
}
