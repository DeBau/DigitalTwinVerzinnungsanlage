// Editor-Kern: Verlauf (edit, Transaktionen, Rückgängig, Wiederholen), Speichern, Kopie aus einer früheren Übung.
import { SHEETS } from '../app/daten.js';
import { $, BY, S, esc } from '../app/basis.js';
import { ED } from './status.js';
import { VORL } from './registry.js';
import { clearSel } from './auswahl.js';
import { deDate, skKey } from './blaetter.js';
import { updateProps } from './eigenschaften.js';
import { refreshTpl, renderInk } from './anzeige.js';

/* ---------- Verlauf: ED.hist (Rückgängig) und ED.zukunft (Wiederholen), je ein JSON-Stand ---------- */
// Stand vor einer Änderung ablegen. Eine neue Änderung leert ED.zukunft.
export function ablegen(stand){
  ED.hist.push(stand);
  if (ED.hist.length > 80) ED.hist.shift();
  ED.zukunft = [];
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
  saveSketch();
  if (JSON.stringify(ED.data.meta) !== metaVorher) refreshTpl();
  if (!ohneRender) renderInk();
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
export const kannUndo = () => ED.hist.length > 0;
export const kannRedo = () => ED.zukunft.length > 0;
export function saveSketch(){ const d = ED.data; d.ts = Date.now(); S.set(skKey(ED.scope, ED.key), (d.s.length || d.t.length || d.o.length || d.meta) ? d : null); }
// Stand aus von holen, den aktuellen nach nach legen (Rückgängig: hist → zukunft, Wiederholen umgekehrt)
export function holeStand(von, nach){
  schliesse();
  if (!von.length) return;
  nach.push(JSON.stringify(ED.data));
  ED.data = JSON.parse(von.pop());
  clearSel(); saveSketch(); renderInk();
}
export const undo = () => holeStand(ED.hist, ED.zukunft);
export const redo = () => holeStand(ED.zukunft, ED.hist);
/* Zeichnung aus einer anderen Übung übernehmen: Kopie, das Original bleibt unverändert */
export function takeList(){
  const all = S.all(), suf = ":sk:" + ED.key, out = [];
  Object.entries(all).forEach(([k, d]) => { if (!k.endsWith(suf) || !d) return; const sc = k.slice(0, -suf.length); if (sc === ED.scope) return;
    const n = (d.o || []).length + (d.s || []).length + (d.t || []).length; if (n) out.push({sc, n, ts: d.ts || 0}); });
  const ord = sc => { const i = SHEETS.findIndex(x => x.id === sc); return i < 0 ? 999 : i; };
  return out.sort((a, b) => ord(a.sc) - ord(b.sc));
}
export function takeMenu(btn){
  const old = $("#editor .takemenu"); if (old) { old.remove(); return; }
  const list = takeList(), name = sc => BY[sc] ? `${sc} ${esc(BY[sc].t)}` : "Freie Zeichnung (Vorlagen)";
  const m = document.createElement("div"); m.className = "takemenu"; m.setAttribute("role", "menu");
  m.innerHTML = `<div class="tmh">${VORL[ED.key].n} aus einer anderen Übung kopieren</div>` + (list.length
    ? list.map(x => `<button type="button" role="menuitem" data-ed="takeit" data-from="${x.sc}"><b>${name(x.sc)}</b><span>${x.n} Elemente${x.ts ? " · geändert " + deDate(x.ts) : ""}</span></button>`).join("")
      + `<p>Die Kopie ersetzt die Zeichnung dieser Übung. Das Original bleibt unverändert, Rückgängig holt den alten Stand zurück.</p>`
    : `<p>Noch keine andere Übung hat eine Zeichnung dieser Art. Sobald Sie z. B. in L08 einen Plan gezeichnet haben, erscheint er hier.</p>`);
  btn.parentElement.appendChild(m);
  const off = e => { if (!m.contains(e.target) && e.target !== btn && !btn.contains(e.target)) { m.remove(); document.removeEventListener("pointerdown", off, true); } };
  document.addEventListener("pointerdown", off, true);
}
export function takeSketch(sc){
  const src = S.get(skKey(sc, ED.key)); $("#editor .takemenu")?.remove(); if (!src) return;
  const has = ED.data.s.length || ED.data.t.length || ED.data.o.length;
  if (has && !confirm(`Die Zeichnung dieser Übung wird durch die Kopie aus ${sc} ersetzt. Mit Rückgängig kommen Sie zurück. Fortfahren?`)) return;
  snapshot();
  const d = JSON.parse(JSON.stringify(src)); d.s ||= []; d.t ||= []; d.o ||= []; d.c ||= [];
  if (d.meta) { delete d.meta.title; delete d.meta.datum; }   // Titel und Datum gehören zur neuen Übung
  ED.data = d; clearSel(); saveSketch(); refreshTpl(); renderInk(); updateProps(true);
}
