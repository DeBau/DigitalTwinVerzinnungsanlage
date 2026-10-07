// Editor-Kern: Tastatur im Editor. Kürzel am Blatt (Werkzeuge, Verlauf, Verschieben, Löschen), Tasten in Eingabefeldern,
// Esc (schließt den Editor nie) und die Übersicht der Kürzel („?“). Der Listener sitzt in ereignisse.js.
// Reihenfolge: Eingabefeld, Haken taste der Vorlage, dann die Kern-Kürzel in TASTENSCHRITTE. „+“ und „N“ bleiben frei.
import { $ } from '../app/basis.js';
import { ED, markiertId } from './status.js';
import { vorlage } from './registry.js';
import { anySel, clearSel, markiertesElement } from './auswahl.js';
import { signalTaste } from './signalfeld.js';
import { updateProps } from './eigenschaften.js';
import { aendere, redo, undo } from './verlauf.js';
import { newline } from './beschriften.js';
import { fokusAufsBlatt, setTool } from './werkzeuge.js';
import { applyProp, delSel, turnSel } from './bearbeiten.js';
import { AUSWAHL } from './zeiger.js';

// Nach Abbruch zurück zum Auswählen, in Vorlagen ohne Palette beim bisherigen Werkzeug bleiben
export const werkzeugNachAbbruch = () => setTool(vorlage(ED.key).gruppen ? "sel" : ED.tool);

/* ---------- Eingabefeld ---------- */
// Esc verlässt das Feld, Enter übernimmt, Alt/Umschalt/Strg+Enter beginnt im mehrzeiligen Feld eine neue Zeile
export function tasteImFeld(e){
  if (e.key === "Escape") { e.preventDefault(); fokusAufsBlatt(); return; }
  if (e.key !== "Enter" || !e.target.dataset.prop) return;
  e.preventDefault();
  if (e.target.tagName === "TEXTAREA" && (e.altKey || e.shiftKey || e.ctrlKey)) {
    newline(e.target); e.target.rows = e.target.value.split("\n").length; applyProp(e.target.dataset.prop, e.target.value);
  }
  else fokusAufsBlatt();
}

/* ---------- Esc ---------- */
// Offenes Menü bzw. Übersicht schließen, angefangene Eingabe der Vorlage (ED.vorlage.angefangen) verwerfen, sonst
// Markierung und Werkzeug aufheben. true, wenn etwas zu tun war
export function abbrechen(e){
  if (!ED.svg) return false;
  const offen = $("#editor .takemenu") || $("#editor .kuerzel");
  if (offen) { offen.remove(); return true; }
  if (ED.vorlage.angefangen) {
    e.preventDefault(); ED.vorlage.angefangen = null; $(".ghost", ED.svg).innerHTML = ""; updateProps(true);
    return true;
  }
  if (ED.place || ED.verbindenVon || anySel()) {
    e.preventDefault(); clearSel(); ED.verbindenVon = null; werkzeugNachAbbruch();
    return true;
  }
  return false;
}

/* ---------- Verschieben ---------- */
// Pfeiltasten verschieben Bausteine, Texte und Striche um 10, mit Umschalt um 1
export const verschiebeXY = (el, dx, dy) => { el.x += dx; el.y += dy; };
export const VERSCHIEBE = {o: verschiebeXY, t: verschiebeXY, s: (st, dx, dy) => { st.p = st.p.map(([x, y]) => [x + dx, y + dy]); }};
export const PFEILE = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]};
export function verschiebeMarkiertes(key, schritt = 10){
  const [rx, ry] = PFEILE[key];
  VERSCHIEBE[ED.markiert.art](markiertesElement(), rx * schritt, ry * schritt);
}

/* ---------- Kürzel ---------- */
// Werkzeugtasten; eine Taste wirkt nur, wenn die Werkzeugleiste das Werkzeug hat
export const WERKZEUGTASTEN = {v: "sel", p: "pen", l: "line", t: "text", e: "erase", c: "conn"};
// Strg+Z nimmt zurück, Strg+Y und Strg+Umschalt+Z wiederholen
export const VERLAUFSTASTEN = {z: () => undo(), y: () => redo(), "Umschalt+z": () => redo()};
export const DREHTASTEN = {r: "rot", m: "flip"};   // nur bei markiertem Baustein
export const ohneZusatz = e => !e.ctrlKey && !e.metaKey && !e.altKey;
export function rasterUmschalten(){
  ED.grid = !ED.grid;
  const b = $('#editor [data-ed="grid"]'); if (b) b.setAttribute("aria-pressed", ED.grid);
}
export function werkzeugTaste(e){
  const t = ohneZusatz(e) && !e.shiftKey && WERKZEUGTASTEN[e.key.toLowerCase()];
  if (!t || !$(`#editor .edbar [data-tool="${t}"]`)) return false;
  setTool(t);
  return true;
}
export function beschrifteMarkiertes(){
  const m = ED.markiert, beschrifte = m && AUSWAHL[m.art] && AUSWAHL[m.art].beschriften;
  if (beschrifte) beschrifte(m.id);
}
// Schritte der Tastatur am Blatt; der erste, der true zurückgibt, hat die Taste verbraucht (danach preventDefault)
export const TASTENSCHRITTE = [
  e => { const v = vorlage(ED.key); return !!(v.taste && v.taste(e)); },   // Haken taste: Tasten der Vorlage zuerst
  e => (e.key === "Enter" || e.key === "F2") && anySel() && ED.markiert.art !== "f" && (beschrifteMarkiertes(), true),
  e => { const f = (e.ctrlKey || e.metaKey) && VERLAUFSTASTEN[(e.shiftKey ? "Umschalt+" : "") + e.key.toLowerCase()];
    return !!f && (f(), true); },
  e => (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a",   // Strg+A markiert keinen Seitentext
  e => { const d = ohneZusatz(e) && markiertId("o") && DREHTASTEN[e.key.toLowerCase()]; return !!d && (turnSel(d), true); },
  e => e.key === "Escape" && (abbrechen(e), true),   // Esc schließt den Editor nie (nur „Fertig“)
  e => e.key === " ",   // Leertaste löst keinen Knopf aus und rollt das Blatt nicht
  e => (e.key === "Delete" || e.key === "Backspace") && anySel() && (delSel(), true),
  e => !!PFEILE[e.key] && anySel() && !!VERSCHIEBE[ED.markiert.art]
    && (aendere(() => verschiebeMarkiertes(e.key, e.shiftKey ? 1 : 10)), true),
  e => ohneZusatz(e) && !e.shiftKey && e.key.toLowerCase() === "g" && (rasterUmschalten(), true),
  e => e.key === "?" && (kuerzelUmschalten(), true),
  werkzeugTaste,
];
export function taste(e){
  if (e.target.matches && e.target.matches("input,select,textarea")) { if (!signalTaste(e)) tasteImFeld(e); return; }
  if (TASTENSCHRITTE.some(schritt => schritt(e))) e.preventDefault();
}

/* ---------- Übersicht „?“ ---------- */
export const KUERZEL = [
  ["V", "Auswählen"], ["P", "Stift"], ["L", "Linie"], ["T", "Text"], ["E", "Radierer"], ["C", "Verbinden (mit Palette)"],
  ["G", "Raster fangen an oder aus"], ["Pfeiltasten", "Markiertes um 10 verschieben"], ["Umschalt+Pfeil", "um 1 verschieben"],
  ["R, M", "Bauteil drehen, spiegeln"], ["Enter, F2", "Markiertes beschriften"], ["Entf", "Markiertes löschen"],
  ["Strg+Z", "Rückgängig"], ["Strg+Y, Strg+Umschalt+Z", "Wiederholen"], ["Esc", "abbrechen, Markierung aufheben"],
  ["?", "diese Übersicht ein oder aus"],
];
export const KUERZEL_HTML = `<div class="kuerzel" role="dialog" aria-label="Tastenkürzel"><b>Tastenkürzel</b><dl>`
  + KUERZEL.map(([k, t]) => `<dt><kbd>${k}</kbd></dt><dd>${t}</dd>`).join("")
  + `</dl><p>Ein Klick oder Esc schließt die Übersicht.</p></div>`;
export function kuerzelUmschalten(){
  const alt = $("#editor .kuerzel"); if (alt) { alt.remove(); return; }
  const ed = $("#editor .ed"); if (!ed) return;
  ed.insertAdjacentHTML("beforeend", KUERZEL_HTML);
  $("#editor .kuerzel").addEventListener("click", e => e.currentTarget.remove());
}
