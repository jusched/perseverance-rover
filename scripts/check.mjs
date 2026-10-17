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
