// Erzeugt docs/uebungshandbuch.html aus vorlage.html, uebungen.js und signale.csv.
//   node web/tools/uebungshandbuch/build.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const hier = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(hier, '../../..');

// signale.csv ist bewusst ohne Umlaute (Excel-fest); für die Anzeige werden die vorkommenden Wörter zurückgewandelt.
const UM = {"Ausblasduese": "Ausblasdüse", "Ausschussbehaelter": "Ausschussbehälter", "Buegel": "Bügel", "Einhaengezylinder": "Einhängezylinder", "Foerderband": "Förderband", "Foerderrichtung": "Förderrichtung", "Fuellhoehe": "Füllhöhe", "Fuellstand": "Füllstand", "Kuehlplatz": "Kühlplatz", "Kuehlwassertank": "Kühlwassertank", "Oeffner": "Öffner", "Pruefband": "Prüfband", "Pruefstation": "Prüfstation", "Rueckmeldung": "Rückmeldung", "Schaltschranktuer": "Schaltschranktür", "Schliesser": "Schließer", "Schluesselschalter": "Schlüsselschalter", "Schuetz": "Schütz", "Spruehkuehlung": "Sprühkühlung", "Spruehventil": "Sprühventil", "Stellungsrueckmeldung": "Stellungsrückmeldung", "Uebergabe": "Übergabe", "Uebergabeplatz": "Übergabeplatz", "Umwaelzpumpe": "Umwälzpumpe", "Wendeschuetz": "Wendeschütz", "Zinn-Nachfuelleinrichtung": "Zinn-Nachfülleinrichtung", "betaetigt": "betätigt", "blaest": "bläst", "buendig": "bündig", "eingehaengt": "eingehängt", "einhaengen": "einhängen", "faehrt": "fährt", "geloest": "gelöst", "gueltig": "gültig", "laeuft": "läuft", "loesen": "lösen", "oeffnen": "öffnen", "oeffnet": "öffnet", "schliessen": "schließen", "schliesst": "schließt", "ueber": "über", "uebernommen": "übernommen", "vorwaerts": "vorwärts", "zurueck": "zurück", "Loesen": "Lösen", "Oeffnen": "Öffnen", "Schliessen": "Schließen", "Einhaengen": "Einhängen"};
const umlaut = (t) => t.replace(/[A-Za-zÄÖÜäöüß-]+/g, (w) => UM[w] || w).replace(/ Grad C/g, ' °C').replace(/\.\.\./g, '…');

const sig = {};
for (const line of readFileSync(path.join(repo, 'signale.csv'), 'utf8').split(/\r?\n/)) {
  if (!line || line.startsWith('#') || line.startsWith('Name;')) continue;
  const [n, a, ...k] = line.split(';');
  if (!a) continue;
  (sig[n.split('_')[0]] ||= []).push({ n, a, k: umlaut(k.join(';')) });
}

const uebungen = readFileSync(path.join(hier, 'uebungen.js'), 'utf8').replace(/^\/\/.*\r?\n/, '').trim();
// Ausführliche Aufgabenbeschreibung und Fachwissen: je Übung eine Datei texte/Lxx.json
const tdir = path.join(hier, 'texte'), texte = {};
if (existsSync(tdir)) for (const f of readdirSync(tdir)) if (/^L\d\d\.json$/.test(f)) texte[f.slice(0, 3)] = JSON.parse(readFileSync(path.join(tdir, f), 'utf8'));

const html = readFileSync(path.join(hier, 'vorlage.html'), 'utf8')
  .replace('__SIG__', () => JSON.stringify(sig))
  .replace('__SHEETS__', () => uebungen)
  .replace('__TEXTE__', () => JSON.stringify(texte));
writeFileSync(path.join(repo, 'docs', 'uebungshandbuch.html'), html);
console.log('docs/uebungshandbuch.html erzeugt');
