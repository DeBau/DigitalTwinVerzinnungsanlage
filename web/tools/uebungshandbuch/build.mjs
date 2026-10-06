// Erzeugt docs/uebungshandbuch.html aus src/ (Seite, Styles, ES-Module ab src/main.js), uebungen.js, quiz.js, stil.js, texte/*.json und signale.csv.
//   node web/tools/uebungshandbuch/build.mjs
// Prüft dabei die Inhalte und meldet Auffälligkeiten als Warnung (der Build bricht nicht ab).
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { waechter } from './waechter.mjs';
import { leseSignale } from './signale.mjs';
import { ladeSchaltplan } from './schaltplan-node.mjs';

const hier = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(hier, '../../..');

/* ---------- Warnungen ---------- */
const WARN = {};
const warn = (kat, wo, text) => { (WARN[kat] ||= []).push(`${wo}: ${text}`); };

const sig = leseSignale(repo);

// Quelltext: src/seite.html, die Styles aus src/styles in fester Reihenfolge (src/reihenfolge.json)
// und die ES-Module ab src/main.js, gebündelt mit esbuild (liegt in web/node_modules).
const src = path.join(hier, 'src'), folge = JSON.parse(readFileSync(path.join(src, 'reihenfolge.json'), 'utf8'));
const lies = (...t) => readFileSync(path.join(src, ...t), 'utf8');
let esbuild;
try { esbuild = await import('esbuild'); }
catch { console.error('esbuild fehlt. Einmal ausführen: cd web && npm ci'); process.exit(1); }
const wache = waechter(path.join(src, 'main.js'));
if (wache.length) { console.error('Modulprüfung fehlgeschlagen:\n  ' + wache.join('\n  ')); process.exit(1); }
const bündel = await esbuild.build({
  entryPoints: [path.join(src, 'main.js')], bundle: true, write: false, format: 'iife', target: 'es2022',
  charset: 'utf8', legalComments: 'none', treeShaking: false, minify: false, logLevel: 'error',
});
const skript = bündel.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const vorlage = lies('seite.html')
  .replace(/<!--@CSS-->\r?\n/, () => folge.css.map((n) => lies('styles', n + '.css')).join(''))
  .replace(/<!--@JS-->\r?\n/, () => skript);
const ohneKopf = (t) => t.replace(/^(\s*\/\/.*\r?\n)+/, '').trim();   // führende Kommentarzeilen weg
const auswerten = (datei, text, ...arg) => {   // JS-Datenausdruck auswerten, Fehler mit Dateiname melden
  try { return new Function(...arg.map((a) => a[0]), 'return ' + text)(...arg.map((a) => a[1])); }
  catch (e) { warn('Datei nicht lesbar', datei, e.message); return null; }
};

// Übungen
const uebungen = ohneKopf(readFileSync(path.join(hier, 'uebungen.js'), 'utf8'));
const SHEETS = auswerten('uebungen.js', uebungen, ['T', (head, rows) => ({ head, rows })]) || [];

// Kurz-Checks: quiz.js (fehlt die Datei, bleibt QUIZ leer)
const qdatei = path.join(hier, 'quiz.js');
let quiz = existsSync(qdatei) ? ohneKopf(readFileSync(qdatei, 'utf8')).replace(/;\s*$/, '') : '({})';
const QUIZ = auswerten('quiz.js', quiz);
if (!QUIZ) quiz = '({})';

// Programmierrichtlinien einzeln mit Übung, ab der sie gelten: stil.js (fehlt die Datei, bleibt STIL leer)
const sdatei = path.join(hier, 'stil.js');
let stil = existsSync(sdatei) ? ohneKopf(readFileSync(sdatei, 'utf8')).replace(/;\s*$/, '') : '[]';
const STIL = auswerten('stil.js', stil);
if (!STIL) stil = '[]';

// Ausführliche Aufgabenbeschreibung und Fachwissen: je Übung eine Datei texte/Lxx.json
const tdir = path.join(hier, 'texte'), texte = {};
if (existsSync(tdir)) for (const f of readdirSync(tdir)) if (/^L\d\d\.json$/.test(f)) {
  try { texte[f.slice(0, 3)] = JSON.parse(readFileSync(path.join(tdir, f), 'utf8')); }
  catch (e) { warn('Datei nicht lesbar', `texte/${f}`, `JSON-Fehler: ${e.message}`); }
}

/* ---------- Prüfungen ---------- */
const EXTRA = auswerten('src/app/daten.js (EXTRA)', (lies('app', 'daten.js').match(/\nexport const EXTRA = (\{[\s\S]*?\n\});/) || [, '{}'])[1]) || {};
const IDS = new Set(SHEETS.map((s) => s.id));
const kurz = (t, i, n) => '„' + (i > 30 ? '…' : '') + t.slice(Math.max(0, i - 30), i + n + 30).replace(/\s+/g, ' ') + (i + n + 30 < t.length ? '…' : '') + '“';
const prosa = (t) => String(t).replace(/<(code|pre)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
const STRICH = [/ – /, /—/, / -- /, / - /, /\d–\d/];
const RX_SIE = /(?<![\wÄÖÜäöüß])(Sie|Ihr|Ihre|Ihren|Ihrem|Ihrer|Ihres|Ihnen)(?![\wÄÖÜäöüß])/;   // Handbuch ist in Du-Form
const RX_SIG =/−([A-Z]{1,3}\d{1,2})(?![\d_])/g;

function text(wo, t, quelle) {   // eine Zeichenkette prüfen: Gedankenstriche, Übungsverweise, Kennzeichen
  if (typeof t !== 'string' || /^\s*[–-]\s*$/.test(t)) return;   // leerer Platzhalter „–“ ist ein Datenwert
  const p = prosa(t);
  for (const rx of STRICH) { const m = rx.exec(p); if (m) { warn('Gedankenstrich', wo, kurz(p, m.index, m[0].length)); break; } }
  { const m = RX_SIE.exec(p); if (m) warn('Sie-Form', wo, kurz(p, m.index, m[0].length)); }   // Satzanfang „Sie“ für Dinge kann falsch positiv sein
  for (const m of p.matchAll(/\bL(\d\d)\b/g)) if (!IDS.has(m[0])) warn('Verweis auf fehlende Übung', wo, `${m[0]} in ${kurz(p, m.index, 3)}`);
  if (quelle) return;
  for (const m of t.matchAll(RX_SIG)) if (!sig[m[1]] && !EXTRA[m[1]]) warn('Unbekanntes Kennzeichen', wo, `−${m[1]} (weder in signale.csv noch in EXTRA)`);
}
function walk(wo, v, quelle) {
  if (typeof v === 'string') return text(wo, v, quelle);
  if (Array.isArray(v)) return v.forEach((x, i) => walk(`${wo}[${i}]`, x, quelle));
  if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(wo ? `${wo}.${k}` : k, x, quelle || k === 'q');
}

const TYPEN = ['erkunden', 'programmieren', 'auslegen', 'projekt'], ART = ['neu', 'erweitert', 'übernommen', 'umgebaut'];
for (const s of SHEETS) {
  const { id } = s;
  for (const [k, v] of Object.entries(s)) if (!['id', 'bild', 'sig', 'repo', 'vor'].includes(k)) walk(`${id} ${k}`, v);
  for (const v of String(s.vor || '').match(/L\d\d/g) || []) if (!IDS.has(v)) warn('Verweis auf fehlende Übung', `${id} vor`, v);
  // Zielzuordnung (nur wenn die Übung Zuordnungen nutzt)
  const zu = [...(s.pr || []), ...(s.lf || [])].filter((e) => Array.isArray(e));
  if (zu.length) {
    const gedeckt = new Set(zu.flatMap((e) => e[1] || []));
    (s.ziele || []).forEach((z, i) => { if (!gedeckt.has(i)) warn('Lernziel ohne Prüfpunkt/Leitfrage', `${id} ziele[${i}]`, kurz(prosa(z), 0, 40)); });
    gedeckt.forEach((i) => { if (!(i >= 0 && i < (s.ziele || []).length)) warn('Datenformat', `${id} pr/lf`, `Zielindex ${i} gibt es nicht (0 bis ${(s.ziele || []).length - 1})`); });
  }
  if (s.typ && !TYPEN.includes(s.typ)) warn('Datenformat', `${id} typ`, `„${s.typ}“ unbekannt (${TYPEN.join(', ')})`);
  for (const [i, h] of Object.entries(s.hilfe || {})) if (!s.auf || !s.auf[+i] || !Array.isArray(h)) warn('Datenformat', `${id} hilfe.${i}`, 'kein passender Aufgabenschritt in auf oder keine Liste');
  (s.ergebnis || []).forEach((e, i) => { if (!e || !e.n || !ART.includes(e.a)) warn('Datenformat', `${id} ergebnis[${i}]`, 'n fehlt oder a nicht in ' + ART.join(', ')); });
}
for (const [id, t] of Object.entries(texte)) {
  if (!IDS.has(id)) warn('Verweis auf fehlende Übung', `texte/${id}.json`, 'keine Übung mit dieser id');
  walk(`texte/${id}.json`, t);
  (t.wissen || []).forEach((w, i) => {
    if (!w.q || !String(w.q).trim()) warn('Wissenskarte ohne Siemens-Quelle', `texte/${id}.json wissen[${i}]`, `„${w.t}“ ohne q`);
    else if (!/siemens\.(cloud|com)/.test(w.q)) warn('Wissenskarte ohne Siemens-Quelle', `texte/${id}.json wissen[${i}]`, `„${w.t}“: q ohne Link auf siemens.cloud oder siemens.com`);
  });
}
for (const [id, q] of Object.entries(QUIZ || {})) {
  if (!IDS.has(id)) warn('Verweis auf fehlende Übung', `quiz.js ${id}`, 'keine Übung mit dieser id');
  walk(`quiz.js ${id}`, q);
}
(Array.isArray(STIL) ? STIL : []).forEach((r, i) => {
  if (!r || !IDS.has(r.ab)) warn('Datenformat', `stil.js [${i}]`, `ab „${r && r.ab}“ ist keine Übung`);
  walk(`stil.js [${i}]`, r);
});

// Schaltplan der Anlage: schaltplan.json (fehlt die Datei, bleibt der Plan leer). Geprüft wird mit denselben Modulen wie im Browser.
const pdatei = path.join(hier, 'schaltplan.json');
let plan = existsSync(pdatei) ? readFileSync(pdatei, 'utf8') : 'null';
try {
  const daten = JSON.parse(plan);
  if (daten) {
    const sp = await ladeSchaltplan(esbuild);
    for (const f of sp.pruefe(sp.aufbereiten(daten, sig), sp.SYM)) warn('Schaltplan', 'schaltplan.json', f);
    walk('schaltplan.json', {hinweise: daten.hinweise}, true);   // Kennzeichen prüft der Plan selbst
  }
} catch (e) { warn('Datei nicht lesbar', 'schaltplan.json', e.message); plan = 'null'; }

/* ---------- Ausgabe ---------- */
const html = vorlage
  .replace('__SIG__', () => JSON.stringify(sig))
  .replace('__SHEETS__', () => uebungen)
  .replace('__QUIZ__', () => quiz)
  .replace('__STIL__', () => stil)
  .replace('__PLAN__', () => plan)
  .replace('__TEXTE__', () => JSON.stringify(texte));
writeFileSync(path.join(repo, 'docs', 'uebungshandbuch.html'), html);
console.log('docs/uebungshandbuch.html erzeugt');

const kats = Object.keys(WARN);
for (const k of kats) { console.warn(`\n[${k}]`); for (const w of WARN[k]) console.warn('  ' + w); }
console.log(`\nPrüfung: ${kats.reduce((a, k) => a + WARN[k].length, 0)} Warnungen` + (kats.length ? ' (' + kats.map((k) => `${k}: ${WARN[k].length}`).join(', ') + ')' : ''));
