// Prüfwerkzeug: öffnet index.html in Chrome, meldet Konsolenfehler und speichert Screenshots.
//   node tools/shot.mjs <ausgabeordner> [name=px,py,pz,tx,ty,tz ...] [--sim=Sekunden] [--qual=Hoch]
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const dir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const out = args.find((a) => !a.includes('=') && !a.startsWith('--')) || 'shots';
const sim = Number((args.find((a) => a.startsWith('--sim=')) || '--sim=0').slice(6));
const views = args.filter((a) => a.includes('=') && !a.startsWith('--')).map((a) => {
  const [name, v] = a.split('=');
  return { name, v: v.split(',').map(Number) };
});
if (!views.length) views.push({ name: 'gesamt', v: null });
await mkdir(out, { recursive: true });

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--allow-file-access-from-files'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const fehler = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') fehler.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => fehler.push(`[pageerror] ${e.message}`));
await page.addInitScript(() => { try { localStorage.setItem('zinnbad-grafik', 'hoch'); } catch {} });
await page.goto(pathToFileURL(path.join(dir, 'index.html')).href);
try { await page.waitForFunction(() => window.__zwilling, null, { timeout: 30000 }); } catch { console.log(fehler.join(String.fromCharCode(10))); await browser.close(); process.exit(1); }
// (Grafikstufe wird vor dem Laden gesetzt)
await page.waitForTimeout(2500);
if (sim) await page.evaluate((s) => window.__zwilling.sim(s), sim);
for (const { name, v } of views) {
  if (v) await page.evaluate((v) => window.__zwilling.cam(...v), v);
  await page.waitForTimeout(1200);
  await page.locator('#viewport').screenshot({ path: path.join(out, `${name}.png`) });
}
if (args.includes('--ereignisse')) console.log(await page.evaluate(() => [...document.querySelectorAll('#events li span')].map((s) => s.textContent).reverse().join(String.fromCharCode(10))));
console.log(fehler.length ? fehler.join('\n') : 'Keine Konsolenfehler.');
await browser.close();
