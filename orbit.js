const D = Math.PI / 180;
const LIGHT_MIN_PER_AU = 499.004784 / 60;

// Approximate JPL Keplerian elements (Standish, valid 1800-2050): [value, rate per century]
// a (AU), e, I, L, longitude of perihelion, ascending node (degrees)
const EARTH = [[1.00000261, 0.00000562], [0.01671123, -0.00004392], [-0.00001531, -0.01294668], [100.46457166, 35999.37244981], [102.93768193, 0.32327364], [0, 0]];
const MARS = [[1.52371034, 0.00001847], [0.0933941, 0.00007882], [1.84969142, -0.00813131], [-4.55343205, 19140.30268499], [-23.94362959, 0.44441088], [49.55953891, -0.29257343]];

function position(elements, T) {
  const [a, e, I, L, wbar, node] = elements.map(([v, rate]) => v + rate * T);
  const M = (L - wbar) * D, ecc = Math.atan2(Math.sin(M), Math.cos(M));
  let E = ecc;
  for (let k = 0; k < 8; k++) E -= (E - e * Math.sin(E) - ecc) / (1 - e * Math.cos(E));
  const xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const [cw, sw] = [Math.cos((wbar - node) * D), Math.sin((wbar - node) * D)];
  const [co, so, ci, si] = [Math.cos(node * D), Math.sin(node * D), Math.cos(I * D), Math.sin(I * D)];
  return [
    (cw * co - sw * so * ci) * xp + (-sw * co - cw * so * ci) * yp,
    (cw * so + sw * co * ci) * xp + (-sw * so + cw * co * ci) * yp,
    sw * si * xp + cw * si * yp,
  ];
}

// minutes light takes to travel between Mars and Earth at instant `ms` (epoch milliseconds)
export function lightTimeMinutes(ms) {
  const T = (ms / 86400000 + 2440587.5 - 2451545) / 36525;
  const [ex, ey, ez] = position(EARTH, T), [mx, my, mz] = position(MARS, T);
  return Math.hypot(mx - ex, my - ey, mz - ez) * LIGHT_MIN_PER_AU;
}
