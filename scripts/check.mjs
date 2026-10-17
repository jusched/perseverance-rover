import { chromium } from 'playwright-core';

const url = process.env.URL || 'http://localhost:5173';
const errors = [];
const browser = await chromium.launch({
  channel: process.env.CHANNEL || 'chrome', headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', m => m.text().startsWith('[rover]') && console.log(m.text()));
page.on('console', m =>['error', 'warning'].includes(m.type()) && errors.push(`console.${m.type()}: ${m.text()}`));
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
page.on('requestfailed', r => errors.push(`requestfailed: ${r.url()}`));
let ready = true;
try {
  await page.goto(url, { timeout: 15000 });
  await page.waitForFunction(() => window.__ready, null, { timeout: 30000 });
  await page.waitForTimeout(1000);
} catch (e) { ready = false; errors.push(`load: ${e.message.split('\n')[0]}`); }
await page.screenshot({ path: 'check.png' });
await browser.close();
console.log(errors.length ? errors.join('\n') : 'sin errores');
console.log('captura: check.png');
process.exit(errors.length || !ready ? 1 : 0);
