// Prüfwerkzeug: misst die Darstellungsleistung von index.html in Chrome (ohne Bildsynchronisation).
//   node tools/leistung.mjs [--datei=pfad/zu/index.html]
// Ausgabe: Grafikkarte, Draw Calls, Dreiecke, Bildrate und CPU-Zeit von render() je Grafikstufe.
import { chromium } from 'playwright-core';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const dir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const datei = (process.argv.find((a) => a.startsWith('--datei=')) || '').slice(8) || path.join(dir, 'index.html');
const STUFEN = ['hoch', 'mittel', 'niedrig'];

// Im Browser: Bildrate und mittlere CPU-Zeit je render()-Aufruf über 4 s
function messenImBrowser() {
  const R = window.__zwilling.renderer;
  let cpu = 0, aufrufe = 0;
  const original = R.render.bind(R);
  R.render = (s, c) => { const t = performance.now(); original(s, c); cpu += performance.now() - t; aufrufe++; };
  return new Promise((fertig) => {
    const start = performance.now();
    let bilder = 0;
    const bild = () => {
      bilder++;
      if (performance.now() - start < 4000) { requestAnimationFrame(bild); return; }
      R.render = original;
      fertig({ fps: Math.round(bilder / 4), renderCpuMs: +(cpu / aufrufe).toFixed(1), drawCalls: R.info.render.calls, dreiecke: R.info.render.triangles });
    };
    requestAnimationFrame(bild);
  });
}

async function stufeMessen(browser, stufe) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.addInitScript((s) => { try { localStorage.setItem('zinnbad-grafik', s); localStorage.setItem('zinnbad-tiefenschatten', '0'); } catch { /* */ } }, stufe);
  await page.goto(pathToFileURL(datei).href);
  await page.waitForFunction(() => window.__zwilling, null, { timeout: 30000 });
  await page.waitForTimeout(3000);                       // Shader kompilieren, Anlage anlaufen lassen
  const gpu = await page.evaluate(() => {
    const gl = window.__zwilling.renderer.getContext(), info = gl.getExtension('WEBGL_debug_renderer_info');
    return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : '?';
  });
  const werte = await page.evaluate(messenImBrowser);
  await page.close();
  return { gpu, werte };
}

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--allow-file-access-from-files', '--disable-gpu-vsync', '--disable-frame-rate-limit'],
});
const tabelle = {};
let grafikkarte = '';
for (const stufe of STUFEN) {
  const { gpu, werte } = await stufeMessen(browser, stufe);
  grafikkarte = gpu; tabelle[stufe] = werte;
}
await browser.close();
console.log(grafikkarte);
console.table(tabelle);
