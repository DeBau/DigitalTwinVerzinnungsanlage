// Editor-Kern: Verlauf (edit, Transaktionen, Rückgängig, Wiederholen), Speichern, Kopie aus einer früheren Übung.
import { SHEETS } from '../app/daten.js';
import { $, BY, S, esc } from '../app/basis.js';
import { ED } from './status.js';
import { VORL } from './registry.js';
import { clearSel } from './auswahl.js';
import { deDate, skKey } from './blaetter.js';
import { updateProps } from './eigenschaften.js';
import { refreshTpl, renderInk } from './anzeige.js';
import { befundeWeg } from './pruefung.js';

/* ---------- Verlauf: ED.hist (Rückgängig) und ED.zukunft (Wiederholen), je ein JSON-Stand ---------- */
// Stand vor einer Änderung ablegen. Eine neue Änderung leert ED.zukunft.
export function ablegen(stand){
  ED.hist.push(stand);
  if (ED.hist.length > 80) ED.hist.shift();
  ED.zukunft = [];
  verlaufKnoepfe();
}
// Knöpfe Rückgängig und Wiederholen passend zu den Stapeln (aria-disabled, bleiben fokussierbar)
export function verlaufKnoepfe(){
  const aus = {undo: !ED.hist.length && !ED.tx, redo: !ED.zukunft.length};   // offene Transaktion: schon geändert
  for (const [ed, inaktiv] of Object.entries(aus)) {
    const b = document.querySelector(`#editor [data-ed="${ed}"]`);
    if (b) b.setAttribute("aria-disabled", inaktiv);
  }
}
// Übergang: Stand merken, auch wenn danach nichts geändert wird. Neue Aufrufer nehmen aendere().
export function snapshot(){ ablegen(JSON.stringify(ED.data)); }
// Eine Änderung als ein Verlaufsschritt. aenderung(d) ändert die Zeichnung d oder gibt eine neue zurück.
// Nur bei echter Änderung (JSON-Vergleich): Verlauf, speichern, Schriftfeld (wenn meta anders), Zeichnung neu.
// Während einer offenen Transaktion (beginne) entsteht der Verlaufsschritt erst bei schliesse().
// Gibt true zurück, wenn sich etwas geändert hat.
export function aendere(aenderung, {ohneRender = false} = {}){
  const vorher = JSON.stringify(ED.data), metaVorher = JSON.stringify(ED.data.meta);
  const neu = aenderung(ED.data);
  if (neu) ED.data = neu;
  if (JSON.stringify(ED.data) === vorher) return false;
  if (!ED.tx) ablegen(vorher);
  befundeWeg();   // Markierungen der Prüfung gelten nur für den geprüften Stand
  saveSketch();
  if (JSON.stringify(ED.data.meta) !== metaVorher) refreshTpl();
  if (!ohneRender) renderInk();
  if (ED.tx) verlaufKnoepfe();
  return true;
}
// Transaktion für Ziehen und Tippen: alle aendere() bis schliesse() ergeben einen Verlaufsschritt.
// schluessel nennt, was gerade bearbeitet wird (z. B. "feld:v"). Derselbe Schlüssel öffnet nicht neu.
export function beginne(schluessel){
  if (ED.tx && ED.tx.schluessel === schluessel) return;
  schliesse();
  ED.tx = {schluessel, vorher: JSON.stringify(ED.data)};
}
export function schliesse(){
  const tx = ED.tx;
  ED.tx = null;
  if (tx && JSON.stringify(ED.data) !== tx.vorher) ablegen(tx.vorher);
}
// Offene Transaktion verwerfen: Zeichnung wie bei beginne, kein Verlaufsschritt (z. B. Zwei-Finger-Geste beim Ziehen)
export function verwirf(){
  const tx = ED.tx;
  ED.tx = null;
  if (!tx || JSON.stringify(ED.data) === tx.vorher) return;
  ED.data = JSON.parse(tx.vorher);
  saveSketch(); renderInk();
}
export const kannUndo = () => ED.hist.length > 0;
export const kannRedo = () => ED.zukunft.length > 0;
// Fehlende Listen einer geladenen Zeichnung anlegen
export const mitListen = d => { d.s ||= []; d.t ||= []; d.o ||= []; d.c ||= []; return d; };
// Zeichnung unter uebh2:<scope>:sk:<key> speichern; eine leere Zeichnung löscht den Eintrag
export function saveSketch(){
  const d = ED.data;
  d.ts = Date.now();
  S.set(skKey(ED.scope, ED.key), (d.s.length || d.t.length || d.o.length || d.meta) ? d : null);
}
// Stand aus von holen, den aktuellen nach nach legen (Rückgängig: hist → zukunft, Wiederholen umgekehrt)
export function holeStand(von, nach){
  schliesse();
  if (!von.length) return;
  nach.push(JSON.stringify(ED.data));
  ED.data = JSON.parse(von.pop());
  befundeWeg(); clearSel(); saveSketch(); refreshTpl(); renderInk(); verlaufKnoepfe();
}
export const undo = () => holeStand(ED.hist, ED.zukunft);
export const redo = () => holeStand(ED.zukunft, ED.hist);
/* Zeichnung aus einer anderen Übung übernehmen: Kopie, das Original bleibt unverändert */
export function takeList(){
  const all = S.all(), suf = ":sk:" + ED.key, out = [];
  Object.entries(all).forEach(([k, d]) => {
    if (!k.endsWith(suf) || !d) return;
    const sc = k.slice(0, -suf.length);
    if (sc === ED.scope) return;
    const n = (d.o || []).length + (d.s || []).length + (d.t || []).length;
    if (n) out.push({sc, n, ts: d.ts || 0});
  });
  const ord = sc => { const i = SHEETS.findIndex(x => x.id === sc); return i < 0 ? 999 : i; };
  return out.sort((a, b) => ord(a.sc) - ord(b.sc));
}
// Eintrag im Menü „Aus früherer Übung“
export function takeEintrag(x){
  const name = BY[x.sc] ? `${x.sc} ${esc(BY[x.sc].t)}` : "Freie Zeichnung (Vorlagen)";
  return `<button type="button" role="menuitem" data-ed="takeit" data-from="${x.sc}"><b>${name}</b>`
    + `<span>${x.n} Elemente${x.ts ? " · geändert " + deDate(x.ts) : ""}</span></button>`;
}
export const TAKE_HINWEIS = `<p>Die Kopie ersetzt die Zeichnung dieser Übung. Das Original bleibt unverändert, `
  + `Rückgängig holt den alten Stand zurück.</p>`;
export const TAKE_LEER = `<p>Noch keine andere Übung hat eine Zeichnung dieser Art. Sobald Sie z. B. in L08 einen Plan `
  + `gezeichnet haben, erscheint er hier.</p>`;
// Menü öffnen bzw. schließen; ein Klick außerhalb schließt es
export function takeMenu(btn){
  const old = $("#editor .takemenu"); if (old) { old.remove(); return; }
  const list = takeList(), m = document.createElement("div");
  m.className = "takemenu"; m.setAttribute("role", "menu");
  m.innerHTML = `<div class="tmh">${VORL[ED.key].n} aus einer anderen Übung kopieren</div>`
    + (list.length ? list.map(takeEintrag).join("") + TAKE_HINWEIS : TAKE_LEER);
  btn.parentElement.appendChild(m);
  const off = e => {
    if (m.contains(e.target) || e.target === btn || btn.contains(e.target)) return;
    m.remove(); document.removeEventListener("pointerdown", off, true);
  };
  document.addEventListener("pointerdown", off, true);
}
export function takeSketch(sc){
  const src = S.get(skKey(sc, ED.key)); $("#editor .takemenu")?.remove(); if (!src) return;
  const has = ED.data.s.length || ED.data.t.length || ED.data.o.length;
  const frage = `Die Zeichnung dieser Übung wird durch die Kopie aus ${sc} ersetzt. Mit Rückgängig kommen Sie zurück. Fortfahren?`;
  if (has && !confirm(frage)) return;
  const d = mitListen(JSON.parse(JSON.stringify(src)));
  if (d.meta) { delete d.meta.title; delete d.meta.datum; }   // Titel und Datum gehören zur neuen Übung
  clearSel(); aendere(() => d); updateProps(true);
}
