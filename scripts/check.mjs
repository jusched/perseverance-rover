import { chromium } from 'playwright-core';
import { lightTimeMinutes } from '../orbit.js';

const url = process.env.URL || 'http://localhost:5173';
const errors = [];

// el calculo orbital debe dar el valor conocido del aterrizaje (11 min 22 s)
const landing = lightTimeMinutes(Date.UTC(2021, 1, 18, 20, 55));
if (Math.abs(landing - 11.37) > 0.15) errors.push(`orbit: tiempo de luz al aterrizaje ${landing.toFixed(2)} min, esperado 11.37`);

const browser = await chromium.launch({
  channel: process.env.CHANNEL || 'chrome', headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', m => m.text().startsWith('[rover]') && console.log(m.text()));
page.on('console', m => ['error', 'warning'].includes(m.type()) && errors.push(`console.${m.type()}: ${m.text()}`));
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
page.on('requestfailed', r => errors.push(`requestfailed: ${r.url()}`));
let ready = true;
try {
  await page.goto(url, { timeout: 15000 });
  await page.waitForFunction(() => window.__ready, null, { timeout: 30000 });
  await page.waitForFunction(() => document.querySelectorAll('#mcc .card:not([data-state=loading])').length === 4, null, { timeout: 20000 });

  const cards = await page.$$eval('#mcc .card', cs => cs.map(c => ({ id: c.dataset.id, state: c.dataset.state, value: Number(c.dataset.value), text: c.querySelector('b').textContent })));
  for (const c of cards) console.log(`[data] ${c.id}: ${c.state} ${c.text} (${c.value})`);
  const bad = cards.filter(c => c.state !== 'ok' || !Number.isFinite(c.value) || c.value === 0);
  if (cards.length !== 4 || bad.length) errors.push(`mission: no cargaron los 4 datos: ${bad.map(c => c.id).join(', ') || 'faltan tarjetas'}`);
  const light = cards.find(c => c.id === 'lighttime');
  if (light && !(light.value > 3 && light.value < 23)) errors.push(`mission: tiempo de luz fuera de rango (${light.value})`);

  // camaras: 4 puntos con su nombre; cada uno abre una foto real
  await page.waitForFunction(() => document.querySelectorAll('.cam:not([hidden])').length === 4, null, { timeout: 10000 });
  const names = await page.$$eval('.cam', cs => cs.map(c => `${c.dataset.cam}:${c.querySelector('b').textContent}`));
  console.log('[cam] puntos:', names.join(', '));
  await page.hover('.cam[data-cam=mastcam]', { force: true });
  await page.screenshot({ path: 'check-hover.png' });
  for (const id of ['mastcam', 'navcam', 'hazcam', 'watson']) {
    await page.waitForSelector(`.cam[data-cam=${id}]:not([hidden])`);
    await page.click(`.cam[data-cam=${id}]`, { force: true });
    await page.waitForSelector('#photo:not([hidden])[data-state=ok]', { timeout: 25000 });
    await page.waitForTimeout(3200); // deja terminar el revelado
    const info = await page.$eval('#photo', p => ({ w: p.querySelector('img').naturalWidth, cap: p.querySelector('figcaption').textContent, src: p.querySelector('img').src }));
    console.log(`[cam] ${id}: ${info.w}px | ${info.cap}`);
    if (info.w < 800 || !/Sol \d+ · (hoy|hace \d+ días?)/.test(info.cap)) errors.push(`foto: ${id} no abrió una foto válida (${info.w}px, "${info.cap}")`);
    await page.screenshot({ path: `check-photo-${id}.png` });
    if (id === 'mastcam') {
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(() => document.querySelector('#photo figcaption em').textContent.startsWith('2/') && document.querySelector('#photo').dataset.state === 'ok', null, { timeout: 25000 });
      await page.waitForTimeout(3200);
      await page.click('#photo img');
      if (!(await page.$eval('#photo', p => p.classList.contains('zoom')))) errors.push('foto: el clic no amplía');
      await page.waitForTimeout(3200);
      await page.screenshot({ path: 'check-photo-zoom.png' });
    }
    await page.keyboard.press('Escape');
    if (!(await page.$eval('#photo', p => p.hidden))) errors.push(`foto: Esc no cierra (${id})`);
  }

  await page.keyboard.down('KeyW');
  await page.waitForTimeout(4000);
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(1500);
  await page.keyboard.up('KeyD');
  await page.waitForTimeout(2500);
  console.log('[rover] pos', await page.evaluate(() => window.__rover.position.toArray().map(v => v.toFixed(1)).join(',')));
  await page.screenshot({ path: 'check.png' });

  // la tecla T oculta y vuelve a mostrar el panel
  const hidden = () => page.$eval('#mcc', e => e.hidden);
  await page.keyboard.press('KeyT');
  if (!(await hidden())) errors.push('mission: T no oculta el panel');
  await page.keyboard.press('KeyT');
  if (await hidden()) errors.push('mission: T no vuelve a mostrar el panel');
} catch (e) { ready = false; errors.push(`load: ${e.message.split('\n')[0]}`); await page.screenshot({ path: 'check.png' }); }
await browser.close();
console.log(errors.length ? errors.join('\n') : 'sin errores');
console.log('captura: check.png');
process.exit(errors.length || !ready ? 1 : 0);
