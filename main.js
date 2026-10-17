import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import './mission.js';

const SUN = new THREE.Vector3(-0.75, 0.16, -0.65).normalize();
const FOG = 0xd9a066;

// ruido de valor 2D
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const vnoise = (x, y) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
const fbm = (x, y) => { let s = 0, a = 0.5; for (let i = 0; i < 4; i++) { s += a * vnoise(x, y); x *= 2; y *= 2; a *= 0.5; } return s; };
const height = (x, z) => {
  const w = fbm(x * 0.008, z * 0.008) * 40;
  const ridge = 1 - Math.abs(2 * vnoise(x * 0.018 + w * 0.05, z * 0.012 + w * 0.03) - 1);
  return ridge * ridge * 9 + fbm(x * 0.03, z * 0.03) * 3 + Math.sin((x + w) * 0.9) * 0.05;
};

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(FOG, 0.0042);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 4000);
const camY = height(0, 30) + 2.2;
camera.position.set(0, camY, 30);
camera.lookAt(-12, camY + 7, -50);

// luz
const sun = new THREE.DirectionalLight(0xffb066, 3.4);
sun.position.copy(SUN).multiplyScalar(200);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 1, far: 500 });
sun.shadow.radius = 5;
sun.shadow.bias = -0.0004;
scene.add(sun, new THREE.HemisphereLight(0xf0b780, 0xa05a38, 1.3));

// terreno
const geo = new THREE.PlaneGeometry(1400, 1400, 320, 320);
geo.rotateX(-Math.PI / 2);
const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
const lo = new THREE.Color(0x8c3f20), hi = new THREE.Color(0xd08545), c = new THREE.Color();
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i), z = pos.getZ(i), h = height(x, z);
  pos.setY(i, h);
  c.lerpColors(lo, hi, Math.min(1, h / 11 + (vnoise(x * 0.5, z * 0.5) - 0.5) * 0.25));
  col.set([c.r, c.g, c.b], i * 3);
}
geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
geo.computeVertexNormals();
const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
ground.receiveShadow = true;
scene.add(ground);

// rocas
const rockMat = new THREE.MeshStandardMaterial({ color: 0x6b3a28, roughness: 0.95, flatShading: true });
const bases = Array.from({ length: 6 }, (_, k) => {
  const g = new THREE.IcosahedronGeometry(1, 2), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = 0.65 + vnoise(v.x * 1.7 + k * 9, v.y * 1.7 + v.z * 1.3) * 0.7;
    p.setXYZ(i, v.x * n, v.y * n * 0.7, v.z * n);
  }
  g.computeVertexNormals();
  return g;
});
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (let i = 0; i < 160; i++) {
  const x = (rnd() - 0.5) * 360, z = 20 - rnd() * 330, s = 0.25 + Math.pow(rnd(), 3) * 3.2;
  const r = new THREE.Mesh(bases[i % 6], rockMat);
  r.position.set(x, height(x, z) + s * 0.15, z);
  r.scale.setScalar(s); r.rotation.set(rnd() * 3, rnd() * 6, rnd() * 3);
  r.castShadow = r.receiveShadow = true;
  scene.add(r);
}

// cielo caramelo con sol
const sky = new THREE.Mesh(new THREE.SphereGeometry(2500, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { sun: { value: SUN } },
  vertexShader: 'varying vec3 d; void main(){ d = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `varying vec3 d; uniform vec3 sun;
    void main(){
      float h = clamp(d.y, 0., 1.);
      vec3 col = mix(vec3(.93,.66,.40), vec3(.62,.36,.20), pow(h, .45));
      float s = max(dot(normalize(d), sun), 0.);
      col += vec3(1.,.55,.2) * pow(s, 6.) * .5 + vec3(1.,.75,.4) * pow(s, 60.) * .8;
      col += vec3(1.,.95,.8) * smoothstep(.9994, .9998, s) * 4.;
      col = mix(col, vec3(.85,.6,.38), smoothstep(.12, 0., h) * .5);
      gl_FragColor = vec4(col, 1.);
    }`,
}));
scene.add(sky);
const skyEnv = new THREE.PMREMGenerator(renderer).fromScene(new THREE.Scene().add(new THREE.Mesh(sky.geometry, sky.material)), 0, 0.1, 5000).texture;

// lunas
const moon = (dir, r, color, sx, sy, sz, k) => {
  const g = new THREE.IcosahedronGeometry(1, 4), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = 1 + (vnoise(v.x * 3 + k, v.y * 3 + v.z * 2) - 0.5) * 0.12;
    p.setXYZ(i, v.x * sx * n, v.y * sy * n, v.z * sz * n);
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.2, fog: false }));
  m.position.copy(dir.normalize().multiplyScalar(1800)); m.scale.setScalar(r);
  scene.add(m);
};
moon(new THREE.Vector3(0.3, 0.3, -0.9), 75, 0xa08672, 1.2, 0.95, 1, 1);    // Fobos
moon(new THREE.Vector3(-0.05, 0.5, -0.85), 32, 0xb09a88, 1, 0.9, 0.95, 5); // Deimos

// polvo
const dot = (() => { const c = document.createElement("canvas"); c.width = c.height = 32; const g = c.getContext("2d"), r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, "#fff"); r.addColorStop(1, "#fff0"); g.fillStyle = r; g.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
const N = 700, dp = new Float32Array(N * 3);
const scatter = (i, x, z) => dp.set([x, height(x, z) + 0.5 + rnd() * 14, z], i * 3);
for (let i = 0; i < N; i++) scatter(i, (rnd() - 0.5) * 120, 10 + (rnd() - 0.5) * 120);
const dust = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(dp, 3)),
  new THREE.PointsMaterial({ color: 0xf0c890, size: 0.5, map: dot, alphaTest: 0.01, transparent: true, opacity: 0.8, depthWrite: false }));
scene.add(dust);

// rover Perseverance (modelo oficial NASA), tamaño real ~3 m de largo
const ROVER_LENGTH = 3;
const rover = new THREE.Group();
rover.position.set(0, height(0, 10), 10);
scene.add(rover);
window.__rover = rover;
let roverReady = false;
new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/')).loadAsync('/models/perseverance.glb').then(({ scene: model }) => {
  const cams = [];
  model.traverse(o => {
    if (o.isMesh) {
      o.castShadow = o.receiveShadow = true;
      for (const m of [o.material].flat()) { m.envMap = skyEnv; m.envMapIntensity = 0.8; }
    }
    if (/cam|lens/i.test(o.name) && !/^\d/.test(o.name)) cams.push(o.name);
  });
  console.log('[rover] camera parts:', [...new Set(cams)].join(', '));
  // el modelo no trae convencion de eje: largo = eje mayor, frente = lado de las hazcams delanteras
  const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
  const alongX = size.x > size.z;
  const hc = new THREE.Box3().setFromObject(model.getObjectByName('hazcams_front')).getCenter(new THREE.Vector3());
  const sign = Math.sign(alongX ? hc.x - ctr.x : hc.z - ctr.z);
  const inner = new THREE.Group();
  model.position.set(-ctr.x, -box.min.y, -ctr.z);
  inner.add(model);
  inner.scale.setScalar(ROVER_LENGTH / (alongX ? size.x : size.z));
  inner.rotation.y = alongX ? sign * Math.PI / 2 : (sign > 0 ? Math.PI : 0);
  console.log(`[rover] model size ${size.toArray().map(v => v.toFixed(2))} alongX=${alongX} frontSign=${sign} scale=${inner.scale.x.toFixed(3)}`);
  rover.add(inner);
  roverReady = true;
});

// huellas: un sello oscuro por rueda cada 0.3 m recorridos
const TRACKS = 4000;
const tracks = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.45, 0.32).rotateX(-Math.PI / 2),
  new THREE.MeshStandardMaterial({ color: 0x4a2010, roughness: 1, transparent: true, opacity: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), TRACKS);
tracks.count = 0; tracks.frustumCulled = false; tracks.receiveShadow = true;
scene.add(tracks);
const WHEELS = [-1.15, 1.15].flatMap(x => [-1.1, 0, 1.1].map(z => new THREE.Vector3(x, 0, z)));
let stamps = 0, sinceStamp = 0;
const stamp = new THREE.Matrix4(), sp = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
function leaveTracks() {
  for (const w of WHEELS) {
    rover.localToWorld(sp.copy(w));
    sp.y = height(sp.x, sp.z) + 0.03;
    tracks.setMatrixAt(stamps++ % TRACKS, stamp.compose(sp, rover.quaternion, one));
  }
  tracks.count = Math.min(stamps, TRACKS);
  tracks.instanceMatrix.needsUpdate = true;
}

// manejo WASD + camara de seguimiento
const keys = new Set();
addEventListener('keydown', e => keys.add(e.code));
addEventListener('keyup', e => keys.delete(e.code));
const MAX_SPEED = 8, TURN = 1, G = 3.71 * 2.5; // m/s, rad/s (mucho mas rapido que el rover real), gravedad marciana x2.5 para que la pendiente se note
let heading = 0, speed = 0, camSnap = true;
const fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(), t1 = new THREE.Vector3(), t2 = new THREE.Vector3();
const basis = new THREE.Matrix4(), targetQ = new THREE.Quaternion(), camGoal = new THREE.Vector3(), look = new THREE.Vector3(), lookGoal = new THREE.Vector3();
function drive(dt) {
  const throttle = keys.has('KeyW') - keys.has('KeyS'), steer = keys.has('KeyA') - keys.has('KeyD');
  heading += steer * TURN * dt;
  fwd.set(-Math.sin(heading), 0, -Math.cos(heading));
  right.set(Math.cos(heading), 0, -Math.sin(heading));
  // pendiente al frente: subir frena, bajar empuja; sin acelerar, el rover rueda y se frena solo
  const q = rover.position, slope = (height(q.x + fwd.x, q.z + fwd.z) - height(q.x - fwd.x, q.z - fwd.z)) / 2;
  speed += (throttle * MAX_SPEED - speed) * (throttle ? 2 : 0.6) * dt - G * slope / Math.hypot(1, slope) * dt;
  speed = THREE.MathUtils.clamp(speed, -MAX_SPEED * 1.5, MAX_SPEED * 1.5);
  rover.position.addScaledVector(fwd, speed * dt);
  // terreno bajo las 4 esquinas: altura media y inclinacion
  const p = rover.position, d = 1.4, hAt = (v, k) => height(p.x + v.x * d * k, p.z + v.z * d * k);
  const hF = hAt(fwd, 1), hB = hAt(fwd, -1), hR = hAt(right, 1), hL = hAt(right, -1);
  p.y = (hF + hB + hR + hL) / 4 + 0.05;
  t1.copy(fwd).multiplyScalar(2 * d).setY(hF - hB);
  t2.copy(right).multiplyScalar(2 * d).setY(hR - hL);
  up.crossVectors(t2, t1).normalize();
  t1.addScaledVector(up, -t1.dot(up)).normalize();
  basis.makeBasis(t2.crossVectors(t1, up), up, t1.negate());
  targetQ.setFromRotationMatrix(basis);
  rover.quaternion.slerp(targetQ, camSnap ? 1 : Math.min(1, 6 * dt));
  if ((sinceStamp += Math.abs(speed) * dt) > 0.3) { sinceStamp = 0; leaveTracks(); }
  // camara detras y arriba, mirando al frente
  camGoal.copy(p).addScaledVector(fwd, -9).setY(p.y + 3.2);
  camGoal.y = Math.max(camGoal.y, height(camGoal.x, camGoal.z) + 1.2);
  lookGoal.copy(p).addScaledVector(fwd, 30).setY(p.y + 5.3);
  const k = camSnap ? 1 : 1 - Math.exp(-3 * dt);
  camera.position.lerp(camGoal, k);
  look.lerp(lookGoal, k);
  camera.lookAt(look);
  camSnap = false;
}
camSnap = true;

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
scene.add(sun.target);
let last = performance.now();
let frames = 0;
renderer.setAnimationLoop(() => {
  const now = performance.now(), dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  drive(dt);
  // el sol y su sombra siguen al rover; el polvo se recicla alrededor de el
  sun.target.position.copy(rover.position);
  sun.position.copy(rover.position).addScaledVector(SUN, 200);
  for (let i = 0; i < N; i++) {
    const dx = dp[i * 3] - rover.position.x, dz = dp[i * 3 + 2] - rover.position.z;
    if (Math.abs(dx) > 60 || Math.abs(dz) > 60) scatter(i, dp[i * 3] - Math.sign(dx) * (Math.abs(dx) > 60) * 120, dp[i * 3 + 2] - Math.sign(dz) * (Math.abs(dz) > 60) * 120);
  }
  dust.geometry.attributes.position.needsUpdate = true;
  renderer.render(scene, camera);
  if (roverReady && ++frames === 3) window.__ready = true;
});
