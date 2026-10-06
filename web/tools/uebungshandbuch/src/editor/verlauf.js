// Editor-Kern: Speichern, Rückgängig und Kopie einer Zeichnung aus einer früheren Übung.
import { SHEETS } from '../app/daten.js';
import { $, BY, S, esc } from '../app/basis.js';
import { ED } from './status.js';
import { VORL } from './registry.js';
import { clearSel } from './auswahl.js';
import { deDate, skKey } from './blaetter.js';
import { updateProps } from './eigenschaften.js';
import { refreshTpl, renderInk } from './anzeige.js';

export function snapshot(){ ED.hist.push(JSON.stringify(ED.data)); if (ED.hist.length > 80) ED.hist.shift(); }
export function saveSketch(){ const d = ED.data; d.ts = Date.now(); S.set(skKey(ED.scope, ED.key), (d.s.length || d.t.length || d.o.length || d.meta) ? d : null); }
export function undo(){ if (!ED.hist.length) return; ED.data = JSON.parse(ED.hist.pop()); clearSel(); saveSketch(); renderInk(); }
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
