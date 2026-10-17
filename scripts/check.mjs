import { chromium } from 'playwright-core';
import { lightTimeMinutes } from '../orbit.js';

const url = process.env.URL || 'http://localhost:5173';
const errors = [];

// the orbital math must give the known landing-day value (11 min 22 s)
const landing = lightTimeMinutes(Date.UTC(2021, 1, 18, 20, 55));
if (Math.abs(landing - 11.37) > 0.15) errors.push(`orbit: landing-day light time ${landing.toFixed(2)} min, expected 11.37`);

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
  if (cards.length !== 4 || bad.length) errors.push(`mission: the 4 values did not load: ${bad.map(c => c.id).join(', ') || 'cards missing'}`);
  const light = cards.find(c => c.id === 'lighttime');
  if (light && !(light.value > 3 && light.value < 23)) errors.push(`mission: light time out of range (${light.value})`);

  // cameras: 4 dots with their name; each opens a real photo
  await page.waitForFunction(() => document.querySelectorAll('.cam:not([hidden])').length === 4, null, { timeout: 10000 });
  const names = await page.$$eval('.cam', cs => cs.map(c => `${c.dataset.cam}:${c.querySelector('b').textContent}`));
  console.log('[cam] dots:', names.join(', '));
  await page.hover('.cam[data-cam=mastcam]', { force: true });
  await page.screenshot({ path: 'check-hover.png' });
  for (const id of ['mastcam', 'navcam', 'hazcam', 'watson']) {
    await page.waitForSelector(`.cam[data-cam=${id}]:not([hidden])`);
    await page.click(`.cam[data-cam=${id}]`, { force: true });
    await page.waitForSelector('#photo:not([hidden])[data-state=ok]', { timeout: 25000 });
    await page.waitForTimeout(3200); // let the reveal finish
    const info = await page.$eval('#photo', p => ({ w: p.querySelector('img').naturalWidth, cap: p.querySelector('figcaption').textContent, src: p.querySelector('img').src }));
    console.log(`[cam] ${id}: ${info.w}px | ${info.cap}`);
    if (info.w < 800 || !/Sol \d+ · (today|\d+ days? ago)/.test(info.cap)) errors.push(`photo: ${id} did not open a valid photo (${info.w}px, "${info.cap}")`);
    await page.screenshot({ path: `check-photo-${id}.png` });
    if (id === 'mastcam') {
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(() => document.querySelector('#photo figcaption em').textContent.startsWith('2/') && document.querySelector('#photo').dataset.state === 'ok', null, { timeout: 25000 });
      await page.waitForTimeout(3200);
      await page.click('#photo img');
      if (!(await page.$eval('#photo', p => p.classList.contains('zoom')))) errors.push('photo: click does not enlarge');
      await page.waitForTimeout(3200);
      await page.screenshot({ path: 'check-photo-zoom.png' });
    }
    await page.keyboard.press('Escape');
    if (!(await page.$eval('#photo', p => p.hidden))) errors.push(`photo: Esc does not close (${id})`);
  }

  // rock collision: park the rover 0.8 m from the nearest big rock edge, drive straight into it, it must stop outside the rock
  const hit = await page.evaluate(() => {
    const rock = window.__rocks.reduce((m, r) => (r.r > m.r ? r : m));
    window.__rover.position.set(rock.x, 0, rock.z + rock.r + 1.4 + 0.8);
    return rock;
  });
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(5000);
  await page.keyboard.up('KeyW');
  const gap = await page.evaluate(({ x, z, r }) => Math.hypot(window.__rover.position.x - x, window.__rover.position.z - z) - r, hit);
  console.log(`[rover] gap to rock center-to-edge ${gap.toFixed(2)} m (min 1.4)`);
  if (gap < 1.35 || gap > 1.6) errors.push(`collision: rover did not stop at a rock (gap ${gap.toFixed(2)} m)`);
  await page.evaluate(() => window.__rover.position.set(0, 0, 10));
  await page.waitForTimeout(500);
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(4000);
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(1500);
  const steered = await page.evaluate(() => { const a = []; window.__rover.traverse(n => { if (n.name === 'Wheels_objs') n.children.forEach(g => a.push(+g.rotation.y.toFixed(2))); }); return a; });
  console.log('[rover] wheel steer angles while turning:', steered.join(' '));
  if (steered.filter(v => Math.abs(v) > 0.2).length !== 4) errors.push('wheels: the 4 corner wheels did not steer');
  await page.keyboard.up('KeyD');
  await page.waitForTimeout(2500);
  console.log('[rover] pos', await page.evaluate(() => window.__rover.position.toArray().map(v => v.toFixed(1)).join(',')));
  await page.screenshot({ path: 'check.png' });

  // the T key hides and shows the panel again
  const hidden = () => page.$eval('#mcc', e => e.hidden);
  await page.keyboard.press('KeyT');
  if (!(await hidden())) errors.push('mission: T does not hide the panel');
  await page.keyboard.press('KeyT');
  if (await hidden()) errors.push('mission: T does not show the panel again');
} catch (e) { ready = false; errors.push(`load: ${e.message.split('\n')[0]}`); await page.screenshot({ path: 'check.png' }); }
await browser.close();
console.log(errors.length ? errors.join('\n') : 'no errors');
console.log('screenshot: check.png');
process.exit(errors.length || !ready ? 1 : 0);
