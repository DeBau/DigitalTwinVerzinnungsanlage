// Die reinen Schaltplan-Module (Modell, Zeichnung, Schaltzeichen) in Node laden: esbuild bündelt sie zu einem
// ES-Modul im Speicher. Genutzt von build.mjs (Prüfung der Plandaten) und pruefen/tests/schaltplan.mjs.
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const hier = path.dirname(fileURLToPath(import.meta.url));

export async function ladeSchaltplan(esbuild) {
  const eingang = `export { aufbereiten, pruefe } from './src/schaltplan/modell.js';
export { zeichnePlan } from './src/schaltplan/plan.js';
export { SYM } from './src/symbole/iec60617.js';`;
  const ergebnis = await esbuild.build({
    stdin: { contents: eingang, resolveDir: hier, sourcefile: 'schaltplan-node.js' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'error',
  });
  const datei = path.join(mkdtempSync(path.join(tmpdir(), 'schaltplan-')), 'schaltplan.mjs');
  writeFileSync(datei, ergebnis.outputFiles[0].text);
  return import(pathToFileURL(datei).href);
}
