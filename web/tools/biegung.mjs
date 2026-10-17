// Prüfwerkzeug: listet alle fest verlegten Leitungen, deren Bögen enger sind als der Mindestbiegeradius
// (BIEGEFAKTOR × Außendurchmesser, siehe src/bauteile/leitungen.js).
//   node tools/biegung.mjs
// Je Zeile: erster Punkt der Leitung, Eckpunkt, Leitungsradius, Soll- und erreichter Biegeradius (mm, Koordinaten des Elternobjekts).
import { chromium } from 'playwright-core';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const dir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--use-angle=d3d11', '--allow-file-access-from-files'],
});
const page = await browser.newPage();
const fehler = [];
page.on('pageerror', (e) => fehler.push(e.stack));
await page.goto(pathToFileURL(path.join(dir, 'index.html')).href);
await page.waitForFunction(() => window.__zwilling, null, { timeout: 30000 }).catch(() => {});
const f = (v) => `(${v.x.toFixed(0)},${v.y.toFixed(0)},${v.z.toFixed(0)})`;
const liste = await page.evaluate(() => (window.__biegung || []).map((b) => ({ ...b, punkt: { ...b.punkt }, start: { ...b.start } })));
for (const b of liste) console.log(`start${f(b.start)}  @${f(b.punkt)}  r=${b.r} soll=${b.soll} ist=${b.ist}`);
console.log(`${liste.length} zu enge Bögen`);
if (fehler.length) console.log(fehler.join('\n'));
await browser.close();
