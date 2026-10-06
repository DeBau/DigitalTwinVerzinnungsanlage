// Vorher-nachher-Vergleich des Übungshandbuchs: gleiche Szenarien gegen zwei Builds, DOM exakt, Bilder pixelgenau.
//   node web/tools/uebungshandbuch/pruefen/pruefen.mjs [--ref docs/uebungshandbuch.ref.html] [--neu docs/uebungshandbuch.html] [--aus <ordner>] [--nur A,B,C]
// Exit-Code 1, sobald etwas abweicht oder neue Konsolenmeldungen auftreten.
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { starte } from './browser.mjs';
import { Sammler, VORLAGEN, seiten, leer, beispiel } from './szenarien.mjs';

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const ref = path.resolve(arg('--ref', 'docs/uebungshandbuch.ref.html'));
const neu = path.resolve(arg('--neu', 'docs/uebungshandbuch.html'));
const aus = path.resolve(arg('--aus', path.join(process.env.TEMP || '.', 'uebh-pruefen')));
const nur = new Set((arg('--nur', 'A,B,C')).split(','));
mkdirSync(aus, { recursive: true });

const ids = [...readFileSync(ref, 'utf8').matchAll(/"id":"(L\d\d)"|\bid:\s*"(L\d\d)"/g)].map((m) => m[1] || m[2]);
const IDS = [...new Set(ids)].sort();

async function lauf(datei) {
  const url = pathToFileURL(datei).href, S = new Sammler(), meld = {};
  const browser = await starte();
  try {
    if (nur.has('A')) meld.A = await seiten(browser, url, S, IDS);
    if (nur.has('B')) for (const k of VORLAGEN) meld['B ' + k] = await leer(browser, url, S, k);
    if (nur.has('B')) meld['B L16'] = await leer(browser, url, S, 'wegschritt', 'L16');
    if (nur.has('C')) for (const k of [...VORLAGEN, 'L16-wegschritt', 'L12-grafcet']) meld['C ' + k] = await beispiel(browser, url, S, k);
  } finally { await browser.close(); }
  return { S, meld };
}

// Pixelvergleich ohne Zusatzpakete: beide PNG im Browser dekodieren und zählen.
async function pixel(a, b, name) {
  const browser = await starte(); const page = await browser.newPage();
  const r = await page.evaluate(async ([a, b]) => {
    const lade = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + s; });
    const [A, B] = await Promise.all([lade(a), lade(b)]);
    if (A.width !== B.width || A.height !== B.height) return { n: -1, w: A.width, h: A.height, w2: B.width, h2: B.height };
    const c = (i) => { const cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height; const x = cv.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height); };
    const da = c(A), db = c(B), out = new ImageData(A.width, A.height); let n = 0;
    for (let i = 0; i < da.data.length; i += 4) {
      const d = da.data[i] !== db.data[i] || da.data[i + 1] !== db.data[i + 1] || da.data[i + 2] !== db.data[i + 2];
      if (d) n++; out.data[i] = d ? 255 : da.data[i] * 0.3 + 170; out.data[i + 1] = d ? 0 : da.data[i + 1] * 0.3 + 170; out.data[i + 2] = d ? 0 : da.data[i + 2] * 0.3 + 170; out.data[i + 3] = 255;
    }
    const cv = document.createElement('canvas'); cv.width = A.width; cv.height = A.height; cv.getContext('2d').putImageData(out, 0, 0);
    return { n, diff: cv.toDataURL('image/png').split(',')[1] };
  }, [a.toString('base64'), b.toString('base64')]);
  await browser.close();
  if (r.diff) writeFileSync(path.join(aus, name.replace(/[^\w.-]+/g, '_') + '.diff.png'), Buffer.from(r.diff, 'base64'));
  return r.n;
}

const t0 = Date.now();
const [R, N] = await Promise.all([lauf(ref), lauf(neu)]);
const fehler = [];
const namen = new Set([...Object.keys(R.S.dom), ...Object.keys(N.S.dom)]);
for (const n of namen) {
  const a = R.S.dom[n], b = N.S.dom[n];
  if (a !== b) {
    let i = 0; while (a && b && a[i] === b[i]) i++;
    fehler.push(`DOM ${n}: ${a === undefined ? 'fehlt in ref' : b === undefined ? 'fehlt in neu' : `ab Zeichen ${i}: ref „${a.slice(Math.max(0, i - 60), i + 80)}“ neu „${b.slice(Math.max(0, i - 60), i + 80)}“`}`);
    writeFileSync(path.join(aus, n.replace(/[^\w.-]+/g, '_') + '.ref.txt'), a || ''); writeFileSync(path.join(aus, n.replace(/[^\w.-]+/g, '_') + '.neu.txt'), b || '');
  }
}
const bilder = new Set([...Object.keys(R.S.png), ...Object.keys(N.S.png)]);
for (const n of bilder) {
  const a = R.S.png[n], b = N.S.png[n];
  if (!a || !b) { fehler.push(`Bild ${n}: fehlt in ${a ? 'neu' : 'ref'}`); continue; }
  if (Buffer.compare(a, b) === 0) continue;
  const p = await pixel(a, b, n);
  if (p !== 0) { fehler.push(`Bild ${n}: ${p < 0 ? 'andere Größe' : p + ' Pixel abweichend'}`); writeFileSync(path.join(aus, n.replace(/[^\w.-]+/g, '_') + '.ref.png'), a); writeFileSync(path.join(aus, n.replace(/[^\w.-]+/g, '_') + '.neu.png'), b); }
}
for (const k of new Set([...Object.keys(R.meld), ...Object.keys(N.meld)])) {
  const alt = new Set(R.meld[k] || []);
  for (const m of N.meld[k] || []) if (!alt.has(m)) fehler.push(`Konsole ${k}: neu ${m}`);
  for (const m of R.meld[k] || []) fehler.push(`Konsole ${k} (auch in ref): ${m}`.slice(0, 300));
}
const echte = fehler.filter((f) => !f.includes('(auch in ref)'));
console.log(`Szenarien: ${namen.size} DOM-Ausschnitte, ${bilder.size} Bilder, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
for (const f of fehler) console.log('  ' + f.slice(0, 600));
console.log(echte.length ? `ABWEICHUNGEN: ${echte.length} (Details in ${aus})` : 'Keine Abweichungen.');
process.exit(echte.length ? 1 : 0);
