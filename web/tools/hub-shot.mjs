// Prüfwerkzeug Hubeinheit: Schlitten auf Bandseite, Hub oben/unten, feste Kamerapositionen relativ zum Schlitten
import { chromium } from 'playwright-core';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
const dir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = process.argv[2];
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
const err = []; p.on('pageerror', e => err.push(e.message));
await p.addInitScript(() => { try { localStorage.setItem('zinnbad-grafik', 'hoch'); } catch {} });
await p.goto(pathToFileURL(path.join(dir, 'index.html')).href);
await p.waitForFunction(() => window.__zwilling, null, { timeout: 30000 });
await p.waitForTimeout(2500);
await p.evaluate(() => { document.querySelectorAll('.css2d, #hilfe, .hilfe').forEach(e => e.style.display = 'none'); });
const views = {
  schraeg: [-0.45, 1.45, 0.75, 0.06, 1.05, -0.1],
  rechts: [0.85, 1.25, 0.35, 0.12, 1.15, -0.05],
  gesamt: [0.9, 1.5, 1.3, 0.05, 0.95, -0.1],
  hintenrechts: [0.7, 1.55, -0.75, 0.05, 1.2, -0.2],
  wanne: [0.55, 1.85, 0.45, 0.07, 1.5, -0.18],
  anschlagL: [-0.02, 1.03, 0.12, -0.15, 1.18, -0.2],
  anschlagR: [0.35, 1.06, 0.1, 0.57, 1.18, -0.2],
  schiene: [0.75, 1.15, -0.02, 0.3, 1.25, -0.2],
  haken: [0.42, 0.66, 0.42, 0.1, 0.54, 0],
  hakenhinten: [-0.2, 0.62, 0.38, 0.1, 0.54, 0],
  vorn: [0.05, 1.05, 1.3, 0.05, 1.0, -0.1],
};
for (const [stell, mm2] of [['oben', 0], ['unten', 1]]) {
  await p.evaluate((mm2) => {
    const z = window.__zwilling; z.demo.auto = false;
    window.__mm2 = mm2;
    if (!window.__fix) {                                     // Positionen festhalten (Steuerung läuft weiter, wirkt aber nicht)
      window.__fix = true;
      Object.defineProperty(z.ZYL.MM3, 'x', { get: () => 0, set() {}, configurable: true });
      Object.defineProperty(z.ZYL.MM2, 'x', { get: () => window.__mm2 * 300, set() {}, configurable: true });
    }
  }, mm2);
  await p.waitForTimeout(600);
  for (const [n, v] of Object.entries(views)) {
    if (stell === 'unten' && !['gesamt', 'rechts', 'haken', 'hakenhinten'].includes(n)) continue;
    await p.evaluate((v) => window.__zwilling.cam(...v), v);
    await p.waitForTimeout(900);
    await p.locator('#viewport').screenshot({ path: path.join(out, `${n}-${stell}.png`) });
  }
}
console.log(err.join('\n') || 'Keine Fehler.');
await b.close();
