/* ---------- Vorlagen: Daten und Speicherschlüssel ---------- */
// Grundfunktionen der Vorlagen zum Ausfüllen (Feld tpls in uebungen/Lxx/uebung.js): Zeilen, Spalten, Schlüssel, Fortschreibungen.
// Darstellung: uebung.js (Tabelle), vorlage-stand.js (Karte), vorlage-popup.js (Popup).
import { SHEETS } from './daten.js';
import { BY, S, chips, esc, qt, sheetPos } from './basis.js';

// Eine Vorlage d: {id, cap, phase, head, muster, rows, inputs, leer, erweitert}. Ohne tpls wird das alte tpl zur Vorlage
// mit der id "tpl" und behält seine alten Speicherschlüssel Lxx:t<r>_<c> (alt: true).
export const tplsOf = s => s && s.tpls && s.tpls.length ? s.tpls : s && s.tpl ? [{...s.tpl, id: "tpl", phase: s.tplPhase === 2 ? 2 : 4, alt: true}] : [];
export const tplKey = (id, d, r, c) => d.alt ? `${id}:t${r}_${c}` : `${id}:t:${d.id}:${r}_${c}`;
// Zeilen: feste linke Spalten aus rows, dazu leer komplett leere Zeilen
export const tplRows = d => [...(d.rows || []), ...Array.from({length: +d.leer || 0}, () => [])];
export const tplNIn = (d, r, head) => r.length ? (head.length - r.length > 0 ? head.length - r.length : +d.inputs || 0) : head.length;
// Virtuelle Vorlage "pruefprotokoll": das Prüfprotokoll aus Phase 5 (pr), nur lesend in bezug und Mappe
export const PRUEF = "pruefprotokoll";
export const tplFind = ref => { const [von, id] = String(ref || "").split(":"), ex = BY[von];
  if (ex && id === PRUEF && ex.pr && ex.pr.length) return {ex, d: {id: PRUEF, cap: `Prüfprotokoll ${von}`, phase: 5, virtuell: true}};
  const d = ex && tplsOf(ex).find(x => x.id === id); return d ? {ex, d} : null; };
export const prViewHTML = ex => `<div class="tw"><table class="tplt ro"><thead><tr><th style="width:5%">Nr.</th><th>Prüffall</th><th style="width:14%">Ergebnis</th><th>Beobachtung</th></tr></thead><tbody>${ex.pr.map((c, i) => { const v = S.get(`${ex.id}:p${i}`);
  return `<tr><td>${i+1}</td><td>${chips(qt(c))}</td><td>${v === "ok" ? "bestanden" : v === "bad" ? "nicht bestanden" : "offen"}</td><td class="wert">${esc(S.get(`${ex.id}:b${i}`) || "")}</td></tr>`; }).join("")}</tbody></table></div>`;
// Teile eines fortgeschriebenen Dokuments in SHEETS-Reihenfolge: Ursprung, dann alle Erweiterungen vor Position bis
export function tplTeile(ref, bis = Infinity){
  const o = tplFind(ref); if (!o) return [];
  const out = [o], p0 = sheetPos(o.ex.id);
  SHEETS.forEach((ex, i) => { if (i > p0 && i < bis) tplsOf(ex).forEach(d => { if (d.erweitert === ref) out.push({ex, d}); }); });
  return out;
}
export const tplHead = (ex, d) => d.head || ((tplFind(d.erweitert) || {}).d || {}).head || [];
export const tplHasData = (id, d) => tplRows(d).some((r, ri) => Array.from({length: tplNIn(d, r, tplHead(BY[id], d))}, (_, ci) => S.get(tplKey(id, d, ri, ci))).some(v => String(v ?? "").trim()));
