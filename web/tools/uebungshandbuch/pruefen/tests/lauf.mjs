// Abnahmetests der Skizzen-Editoren gegen docs/uebungshandbuch.html.
//   node web/tools/uebungshandbuch/pruefen/tests/lauf.mjs [paket …] [--nur text] [--bauen]
// paket: Dateiname ohne .mjs in diesem Ordner (kern, grafcet, elektro, pneu, regel); ohne Angabe alle.
// --nur text: nur Tests, deren Name text enthält. --bauen: vorher build.mjs ausführen.
// Eine Testdatei exportiert tests = [{name, daten?, lauf: async (t) => …}]. daten nennt eine Datei in daten/ mit
// localStorage-Einträgen {"uebh2:frei:sk:grafcet": "…JSON…"}, die vor dem Laden gesetzt werden. t ist ein Treiber
// (treiber.mjs). Ein Test schlägt fehl bei einer Ausnahme und bei pageerror oder console.error auf der Seite.
// Exit-Code 1, sobald ein Test fehlschlägt.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { starte } from '../browser.mjs';
import { neuerTreiber } from './treiber.mjs';

const hier = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(hier, '../../../../..');
// Eigenständige Skripte ohne Export tests (laufen für sich): die Schaltplan-Tests
const KEINE_TESTS = new Set(['lauf.mjs', 'treiber.mjs', 'schaltplan.mjs', 'schaltplan-browser.mjs']);

const argv = process.argv.slice(2);
const nurIndex = argv.indexOf('--nur');
const nur = nurIndex >= 0 ? argv[nurIndex + 1] : null;
const pakete = argv.filter((a, i) => !a.startsWith('--') && !(nurIndex >= 0 && i === nurIndex + 1));
const allePakete = readdirSync(hier).filter((f) => f.endsWith('.mjs') && !KEINE_TESTS.has(f)).map((f) => f.slice(0, -4));

// Startdaten aus daten/<name>.json, Werte als Text wie in localStorage
function startdaten(name) {
  if (!name) return null;
  const datei = path.join(hier, 'daten', `${name}.json`);
  if (!existsSync(datei)) throw new Error(`Startdaten fehlen: ${datei}`);
  const roh = JSON.parse(readFileSync(datei, 'utf8'));
  return Object.fromEntries(Object.entries(roh).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]));
}

async function einTest(browser, url, test) {
  const t = await neuerTreiber(browser, url, startdaten(test.daten));
  try {
    await test.lauf(t);
    const fehler = t.meldungen.filter((m) => m.startsWith('[pageerror]') || m.startsWith('[error]'));
    if (fehler.length) throw new Error('Meldungen der Seite: ' + fehler.join(' | '));
    return null;
  } catch (e) {
    return e.message;
  } finally {
    await t.schliessen();
  }
}

async function main() {
  if (argv.includes('--bauen')) execFileSync(process.execPath, [path.join(hier, '../../build.mjs')], { stdio: 'inherit' });
  const url = pathToFileURL(path.join(repo, 'docs', 'uebungshandbuch.html')).href;
  const auswahl = pakete.length ? pakete : allePakete;
  const browser = await starte();
  let gut = 0, schlecht = 0;
  try {
    for (const p of auswahl) {
      const { tests } = await import(pathToFileURL(path.join(hier, `${p}.mjs`)).href);
      for (const test of tests.filter((x) => !nur || x.name.includes(nur))) {
        const fehler = await einTest(browser, url, test);
        if (fehler) schlecht++; else gut++;
        console.log(`${fehler ? 'FEHLER' : 'ok    '} ${p}: ${test.name}${fehler ? '\n         ' + fehler : ''}`);
      }
    }
  } finally { await browser.close(); }
  console.log(`\n${gut} bestanden, ${schlecht} fehlgeschlagen`);
  if (schlecht) process.exitCode = 1;
}
await main();
