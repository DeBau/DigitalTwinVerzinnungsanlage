// Erzeugt docs/uebungshandbuch.html aus src/ (Seite, Styles, ES-Module ab src/main.js), uebungen/Lxx/ (je Übung ein Ordner), stil.js und signale.csv.
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

// Übungen: je Übung ein Ordner uebungen/Lxx mit
//   uebung.js   Stammdaten (JS-Datenausdruck, darf T(head, rows) nutzen)
//   quiz.js     Kurz-Checks {ein:[…], aus:[…]} (JS-Datenausdruck, optional)
//   texte.json  ausführliche Aufgabenbeschreibung und Fachwissen (optional)
// uebung.js und quiz.js kommen als Quelltext in die Seite, texte.json als JSON.
const udir = path.join(hier, 'uebungen');
const datei = (id, name) => `uebungen/${id}/${name}`;
const liesUebung = (id, name) => {   // Datei eines Übungsordners ohne Kopfkommentar; fehlt sie: null
  const p = path.join(udir, id, name);
  return existsSync(p) ? ohneKopf(readFileSync(p, 'utf8')) : null;
};
const SHEETS = [], QUIZ = {}, texte = {}, sheetQuellen = [], quizQuellen = [];
for (const id of readdirSync(udir).filter((n) => /^L\d\d$/.test(n)).sort()) {
  const u = liesUebung(id, 'uebung.js');
  const sheet = u && auswerten(datei(id, 'uebung.js'), u, ['T', (head, rows) => ({ head, rows })]);
  if (!u) warn('Datei fehlt', datei(id, 'uebung.js'), 'jeder Übungsordner braucht Stammdaten');
  if (sheet) { SHEETS.push(sheet); sheetQuellen.push(u); }
  if (sheet && sheet.id !== id) warn('Datenformat', datei(id, 'uebung.js'), `id „${sheet.id}“ passt nicht zum Ordner`);

  const q = liesUebung(id, 'quiz.js'), checks = q && auswerten(datei(id, 'quiz.js'), q);
  if (checks) { QUIZ[id] = checks; quizQuellen.push(` ${id}:${q}`); }

  const t = liesUebung(id, 'texte.json');
  if (t) try { texte[id] = JSON.parse(t); }
  catch (e) { warn('Datei nicht lesbar', datei(id, 'texte.json'), `JSON-Fehler: ${e.message}`); }
}
const uebungen = '[\n' + sheetQuellen.join(',\n\n') + '\n]';
const quiz = '({\n' + quizQuellen.join(',\n') + '\n})';

// Programmierrichtlinien einzeln mit Übung, ab der sie gelten: stil.js (fehlt die Datei, bleibt STIL leer)
const sdatei = path.join(hier, 'stil.js');
let stil = existsSync(sdatei) ? ohneKopf(readFileSync(sdatei, 'utf8')).replace(/;\s*$/, '') : '[]';
const STIL = auswerten('stil.js', stil);
if (!STIL) stil = '[]';

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
  for (const [i, f] of Object.entries(s.fw || {})) if (!s.auf || !s.auf[+i] || !Array.isArray(f) || f.some(n => !(texte[id]?.wissen || [])[n])) warn('Datenformat', `${id} fw.${i}`, 'kein passender Aufgabenschritt in auf oder Fachwissen-Nummer fehlt in texte');
  (s.tpls || []).forEach((d) => { if ((d.fw || []).some((n) => !(texte[id]?.wissen || [])[n])) warn('Datenformat', `${id} tpls ${d.id} fw`, 'Fachwissen-Nummer fehlt in texte'); });
  for (const [i, h] of Object.entries(s.hilfe || {})) if (!s.auf || !s.auf[+i] || !Array.isArray(h)) warn('Datenformat', `${id} hilfe.${i}`, 'kein passender Aufgabenschritt in auf oder keine Liste');
  (s.ergebnis || []).forEach((e, i) => { if (!e || !e.n || !ART.includes(e.a)) warn('Datenformat', `${id} ergebnis[${i}]`, 'n fehlt oder a nicht in ' + ART.join(', ')); });
}
for (const [id, t] of Object.entries(texte)) {
  const wo = datei(id, 'texte.json');
  if (!IDS.has(id)) warn('Verweis auf fehlende Übung', wo, 'keine Übung mit dieser id');
  walk(wo, t);
  (t.wissen || []).forEach((w, i) => {
    if (!w.q || !String(w.q).trim()) warn('Wissenskarte ohne Siemens-Quelle', `${wo} wissen[${i}]`, `„${w.t}“ ohne q`);
    else if (!/siemens\.(cloud|com)/.test(w.q)) warn('Wissenskarte ohne Siemens-Quelle', `${wo} wissen[${i}]`, `„${w.t}“: q ohne Link auf siemens.cloud oder siemens.com`);
  });
}
for (const [id, q] of Object.entries(QUIZ)) {
  if (!IDS.has(id)) warn('Verweis auf fehlende Übung', datei(id, 'quiz.js'), 'keine Übung mit dieser id');
  walk(datei(id, 'quiz.js'), q);
}
(Array.isArray(STIL) ? STIL : []).forEach((r, i) => {
  if (!r || !IDS.has(r.ab)) warn('Datenformat', `stil.js [${i}]`, `ab „${r && r.ab}“ ist keine Übung`);
  walk(`stil.js [${i}]`, r);
});

// Texte des Skizzen-Editors: String-Literale in src/editor/** (ohne Kommentare, ohne ${…}) auf Gedankenstrich und Sie-Form
function editorDateien(ordner) {
  return readdirSync(ordner, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? editorDateien(path.join(ordner, e.name))
    : e.name.endsWith('.js') ? [path.join(ordner, e.name)] : []);
}
const ohneKommentare = (q) => q.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'`\\])\/\/.*$/gm, '$1');
const STRICH_EDITOR = [/ – /, /—/, /\d–\d/];   // „ - “ ist im Quelltext meist ein Minus
const LITERAL = /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g;
for (const datei of editorDateien(path.join(src, 'editor'))) {
  const wo = path.relative(src, datei).replace(/\\/g, '/');
  for (const m of ohneKommentare(readFileSync(datei, 'utf8')).matchAll(LITERAL)) {
    const p = prosa(m[0].slice(1, -1).replace(/\$\{[^}]*\}/g, ' '));
    for (const rx of STRICH_EDITOR) { const t = rx.exec(p); if (t) { warn('Editor: Gedankenstrich', wo, kurz(p, t.index, t[0].length)); break; } }
    const sie = RX_SIE.exec(p); if (sie) warn('Editor: Sie-Form', wo, kurz(p, sie.index, sie[0].length));
  }
}
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
