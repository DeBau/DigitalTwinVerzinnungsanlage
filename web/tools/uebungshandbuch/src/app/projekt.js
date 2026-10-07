/* ---------- Seite „Dein Projekt wächst mit“ (#/projekt): Arbeitsergebnisse × Übungen aus dem Feld ergebnis ---------- */
import { SHEETS, STUFEN } from './daten.js';
import { ART, artPill, esc } from './basis.js';
import { app, setNav } from './start.js';

// Gleiche Arbeitsergebnisse heißen in den Übungen nicht immer gleich („FB Indication (InstIndication)“, „Indication“).
// Schlüssel: ohne Klammerzusatz und ohne Bausteinart davor, klein geschrieben.
const BAUART = /^(globaler\s+db|schnittstellen-db|fb|fc|db|ob\s?\d*)\s+/i;
export const ergKey = n => String(n).replace(/\s*\([^)]*\)/g, "").trim().replace(BAUART, "").trim().toLowerCase();
const istBaustein = n => BAUART.test(String(n).trim()) || /plantdata/i.test(n);

// Matrix: je Arbeitsergebnis die Kennzeichen je Übung. Sammelnamen („FB BathMonitor, FB Counting, PlantData“) werden
// aufgeteilt, wenn jeder Teil ein bekanntes Ergebnis ist.
export function ergMatrix(){
  const zeilen = new Map(), bekannt = new Set();
  SHEETS.forEach(s => (s.ergebnis || []).forEach(e => { if (!/,/.test(e.n)) bekannt.add(ergKey(e.n)); }));
  SHEETS.forEach(s => (s.ergebnis || []).forEach(e => {
    const teile = String(e.n).split(/,\s*/), namen = teile.length > 1 && teile.every(t => bekannt.has(ergKey(t))) ? teile : [e.n];
    namen.forEach(n => {
      const k = ergKey(n); if (!zeilen.has(k)) zeilen.set(k, {name: n.replace(/\s*\([^)]*\)/g, "").trim(), baustein: false, zellen: {}});
      const z = zeilen.get(k); if (BAUART.test(n.trim())) z.name = n.replace(/\s*\([^)]*\)/g, "").trim();   // jüngster Name mit Bausteinart
      z.baustein ||= istBaustein(n); z.zellen[s.id] = {a: e.a, h: e.h};
    });
  }));
  return [...zeilen.values()];
}

export function viewProjekt(){
  setNav("projekt");
  const erst = SHEETS[0].id, letzt = SHEETS[SHEETS.length - 1].id, vorl = SHEETS[SHEETS.length - 2].id;   // Projekt wächst bis zur vorletzten, die letzte führt zusammen
  const mx = ergMatrix(), cols = SHEETS.filter(s => s.ergebnis && s.ergebnis.length);
  const tabelle = (rows, titel) => !rows.length ? "" : `<h3 style="margin-top:18px">${titel}</h3><div class="tw"><table class="ergmx"><thead><tr><th>Arbeitsergebnis</th>${cols.map(s => `<th class="vx" style="color:${STUFEN[s.st].c}"><a href="#/${s.id}/6" title="${esc(s.t)}" style="color:inherit;text-decoration:none">${s.id}</a></th>`).join("")}</tr></thead><tbody>${rows.map(z => {
    const ids = cols.map(s => s.id), mit = ids.filter(id => z.zellen[id]), von = ids.indexOf(mit[0]), bis = ids.indexOf(mit[mit.length - 1]);
    return `<tr><td>${esc(z.name)}</td>${cols.map((s, i) => { const c = z.zellen[s.id]; return `<td class="${i >= von && i <= bis ? "on" : ""}"${c && c.h ? ` title="${esc(String(c.h).replace(/<[^>]+>/g, ""))}"` : ""}>${c ? artPill(c.a) : ""}</td>`; }).join("")}</tr>`; }).join("")}</tbody></table></div>`;
  app.innerHTML = `<div class="page"><h1>Dein Projekt wächst mit</h1><p class="lead">Du arbeitest in einem einzigen TIA-Projekt. Dein Projekt wächst von ${erst} bis ${vorl}. In ${letzt} führt ihr im Team eure Projekte zusammen. Jede Übung baut auf dem Stand der vorigen auf.</p>
  <section class="panel"><h2>Regeln für dein Projekt</h2><ul class="prose" style="padding-left:20px;margin:10px 0 0">
    <li>Wie du das Projekt anlegst (CPU 1516-3 PN/DP, Simulation erlauben, Variablentabelle importieren), steht im Repository unter Inbetriebnahme, Abschnitt 2.</li>
    <li>Am Ende jeder Übung sicherst du ein Projektarchiv mit der Übungsnummer im Namen, zum Beispiel <code>Verzinnung_L12.zap</code>. So kommst du jederzeit zu einem Stand zurück, der funktioniert.</li>
    <li>Jeder Baustein, den du änderst, bekommt im Bausteinkopf einen neuen Eintrag in der Änderungstabelle.</li>
    <li>Jeder Ausgang hat zu jedem Zeitpunkt genau eine Schreibstelle. Prüfe das nach jeder Übung in der Querverweisliste.</li>
    <li>Deine Bausteine tauschen Daten über ihre Ein- und Ausgänge oder über den globalen DB <code>PlantData</code> aus. Verschaltet wird beim Aufruf im OB1. Die #stat-Variablen eines anderen Bausteins liest du nie.</li>
    <li>Was du aus früheren Übungen übernimmst, erweiterst oder umbaust, steht in jeder Übung im Schritt Informieren unter „Das bringst du mit“ und im Schritt Bewerten unter „Das nimmst du mit“.</li></ul></section>
  <section class="panel"><h2>Arbeitsergebnisse je Übung</h2><p class="lead">Die Tabelle entsteht aus den Arbeitsergebnissen aller Übungen. Grau hinterlegt ist die Zeit, in der ein Ergebnis in deinem Projekt eine Rolle spielt. Fahre mit der Maus über ein Kennzeichen, um den Hinweis zu sehen.</p>
    <p class="small" style="display:flex;gap:16px;flex-wrap:wrap">${Object.keys(ART).map(a => `<span>${artPill(a)} ${ART[a][1]}</span>`).join("")}</p>
    ${tabelle(mx.filter(z => z.baustein), "Bausteine und Daten")}${tabelle(mx.filter(z => !z.baustein), "Pläne, Listen und weitere Ergebnisse")}</section></div>`;
}
