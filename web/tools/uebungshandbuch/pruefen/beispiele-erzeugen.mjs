// Erzeugt einmalig die Beispielzeichnungen pruefen/beispiele/*.json aus einem Build (Referenz).
//   node web/tools/uebungshandbuch/pruefen/beispiele-erzeugen.mjs docs/uebungshandbuch.ref.html
// Nutzt dafür die globalen Funktionen des alten Ein-Skript-Stands (ED, PC, portsOf, saveSketch).
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { starte, neueSeite, ruhe } from './browser.mjs';
import { VORLAGEN, beispielDatei, oeffne } from './szenarien.mjs';

const datei = path.resolve(process.argv[2] || 'docs/uebungshandbuch.ref.html');
const url = pathToFileURL(datei).href;
const browser = await starte();
mkdirSync(path.dirname(beispielDatei('x')), { recursive: true });
const ziele = [...VORLAGEN.map((key) => ({ name: key, scope: 'frei', key })), { name: 'L16-wegschritt', scope: 'L16', key: 'wegschritt' }, { name: 'L12-grafcet', scope: 'L12', key: 'grafcet' }];
for (const { name, scope, key } of ziele) {
  const { ctx, page, meldungen } = await neueSeite(browser, url);
  await oeffne(page, scope, key);
  const b = await page.locator('#edstage svg').boundingBox();
  const pt = (fx, fy) => [b.x + b.width * fx, b.y + b.height * fy];
  const n = await page.locator('#editor [data-place]').count();
  for (let i = 0; i < n; i++) {
    await page.locator('#editor [data-place]').nth(i).click(); await ruhe(page, 20);
    const col = i % 6, row = Math.floor(i / 6);
    await page.mouse.click(...pt(0.07 + col * 0.14, 0.08 + (row % 6) * 0.13)); await ruhe(page, 30);
  }
  const ws = await page.locator('#editor [data-ws]').count();
  for (let i = 0; i < ws; i++) {
    await page.locator('#editor [data-ws]').nth(i).click(); await ruhe(page, 20);
    const fx = 0.15 + (i % 6) * 0.11, fy = 0.12 + (i % 5) * 0.16;
    await page.mouse.click(...pt(fx, fy)); await ruhe(page, 20);
    await page.mouse.click(...pt(fx + 0.07, fy + 0.1)); await ruhe(page, 20);
    await page.mouse.dblclick(...pt(fx + 0.07, fy + 0.1)); await ruhe(page, 20);
    await page.keyboard.press('Escape'); await ruhe(page, 20);
    if (!(await page.locator('#editor[open]').count())) await oeffne(page, scope, key);
  }
  const json = await page.evaluate((k) => {
    const d = ED.data, os = d.o;
    if (os.length < 6) { const ks = Object.keys(BLK).filter((x) => !BLK[x].hide && (PAL[k] || []).includes(BLK[x].g)); ks.forEach((x, j) => { for (let r = 0; r < 3; r++) os.push(makeObj(x, [140 + r * 260, 160 + j * 170])); }); }
    os.forEach((o, i) => { if (PC[o.k] && o.k !== 'rail') { if (i % 4 === 1) o.rot = 90; if (i % 5 === 2) o.flip = true; if (i % 9 === 3) o.rot = 180; } o.v ||= i % 3 ? o.v : 'B' + i; });
    const mitP = os.filter((o) => portsOf(o).length), ohne = os.filter((o) => !portsOf(o).length && o.k !== 'rail');
    for (let i = 0; i + 1 < mitP.length; i++) { const a = portsOf(mitP[i]), z = portsOf(mitP[i + 1]); d.c.push({ a: mitP[i].id, pa: a[a.length - 1].n, b: mitP[i + 1].id, pb: z[0].n, v: '' }); }
    if (mitP.length && vrails(k, 1).length) { const r = vrails(k, 1)[0], p = portsOf(mitP[0]); d.c.push({ a: r.id, pa: '~', b: mitP[0].id, pb: p[0].n, v: '' }); }
    for (let i = 0; i + 1 < ohne.length; i++) d.c.push({ a: ohne[i].id, b: ohne[i + 1].id, v: i % 2 ? '−BG' + i : '' });
    if (ohne.length > 2) d.c.push({ a: ohne[ohne.length - 1].id, b: ohne[0].id, v: 'zurück' });
    if (!FIXED[k]) os.slice(-2).forEach((o) => { o.y += PH; });
    d.s.push({ c: '#17212B', w: 2.2, p: [[100, 120], [140, 150], [190, 130], [230, 160]] });
    d.s.push({ c: '#0E4C92', w: 1.4, k: 'l', p: [[300, 500], [420, 500]] });
    d.s.push({ c: '#C0392B', w: 4, k: 'r', p: [[500, 450], [600, 520]] });
    d.t.push({ x: 640, y: 300, v: 'Notiz −BG9', c: '#0E4C92', s: 14 });
    d.meta = { title: 'Prüfzeichnung ' + k, name: 'Azubi Test', datum: '06.10.2026' };
    saveSketch();
    const o = {}; for (let i = 0; i < localStorage.length; i++) { const x = localStorage.key(i); o[x] = localStorage.getItem(x); }
    return o;
  }, key);
  json.__ziel = { scope, key };
  writeFileSync(beispielDatei(name), JSON.stringify(json, null, 1));
  console.log(name, 'Objekte', JSON.parse(json[`uebh2:${scope}:sk:${key}`] || '{"o":[]}').o.length, meldungen.length ? meldungen.join(' | ') : '');
  await ctx.close();
}
await browser.close();
