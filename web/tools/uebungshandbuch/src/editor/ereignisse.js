// Editor-Kern: Listener des Editor-Dialogs (Palette ziehen, Klicks, Eigenschaftsfeld, Tastatur, Schließen).
import { $, $$ } from '../app/basis.js';
import { ED } from './status.js';
import { PC, art, vorlage } from './registry.js';
import { anySel, clearSel, objById } from './auswahl.js';
import { deDate } from './blaetter.js';
import { istSignalFeld, schliesseListe, signalEingabe, signalTaste, signalWahl } from './signalfeld.js';
import { lastProp, setLastProp, updateProps } from './eigenschaften.js';
import { renderInk, sizeSVG } from './anzeige.js';
import { pruefeSkizze, waehleBefund, zeigeBefunde } from './pruefung.js';
import { aendere, redo, saveSketch, snapshot, takeMenu, takeSketch, undo } from './verlauf.js';
import { editConnLabel, editObjLabel, editTextItem, newline } from './beschriften.js';
import { setTool, svgPt } from './werkzeuge.js';
import { applyProp, delSel, turnSel } from './bearbeiten.js';
import { placeObj } from './andocken.js';
import { edMove } from './zeiger.js';
import { doPrint, sketchPage } from '../app/druck.js';
import { route } from '../app/router.js';

export let palDrag = null;   // Ziehen aus der Palette: {k, x, y, on}
export const overSheet = e => {
  const r = ED.svg && $("#edstage").getBoundingClientRect();
  return r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
};
// Nach Abbruch zurück zum Auswählen, in Vorlagen ohne Palette beim bisherigen Werkzeug bleiben
export const werkzeugNachAbbruch = () => setTool(vorlage(ED.key).gruppen ? "sel" : ED.tool);

/* ---------- Ziehen aus der Palette ---------- */
export function paletteDruecken(e){
  const pb = e.target.closest("[data-place]");
  if (pb && e.button === 0) { e.preventDefault(); palDrag = {k: pb.dataset.place, x: e.clientX, y: e.clientY, on: false}; }
}
export function paletteZiehen(e){
  if (!palDrag || !ED.svg) return;
  if (!palDrag.on && Math.hypot(e.clientX - palDrag.x, e.clientY - palDrag.y) > 6) {   // erst ab 6 px ist es Ziehen
    palDrag.on = true; ED.dnd = true; ED.place = palDrag.k; setTool("place"); document.body.classList.add("dnd");
  }
  if (palDrag.on) { if (overSheet(e)) edMove(e); else $(".ghost", ED.svg).innerHTML = ""; }
}
export function paletteLoslassen(e){
  if (!palDrag) return;
  const d = palDrag;
  palDrag = null; document.body.classList.remove("dnd");
  if (!d.on) return;
  ED.skipClick = true; ED.extraY = 0;
  if (overSheet(e)) placeObj(d.k, svgPt(ED.svg, e)); else werkzeugNachAbbruch();
  ED.dnd = false;
}

/* ---------- Klicks ---------- */
// Knöpfe mit data-ed: Aktion je Name
export const AKTIONEN = {
  undo: () => undo(),
  redo: () => redo(),
  pruefen: () => zeigeBefunde(pruefeSkizze()),
  befund: t => waehleBefund(+t.dataset.n),
  take: t => takeMenu(t),
  takeit: t => takeSketch(t.dataset.from),
  rot: () => { if (ED.sel && PC[objById(ED.sel).k]) turnSel("rot"); },
  flip: () => { if (ED.sel && PC[objById(ED.sel).k]) turnSel("flip"); },
  sfzu: () => { ED.selF = false; updateProps("neu"); },
  heute: () => { const f = $('#props [data-prop="md"]'); if (f) { snapshot(); f.value = deDate(Date.now()); applyProp("md", f.value); } },
  del: () => delSel(),
  grid: t => { ED.grid = !ED.grid; t.setAttribute("aria-pressed", ED.grid); },
  dock: t => { ED.dock = !ED.dock; t.setAttribute("aria-pressed", ED.dock); },
  clear: () => {
    if (!(ED.data.s.length || ED.data.t.length || ED.data.o.length) || !confirm("Die ganze Skizze löschen?")) return;
    snapshot(); ED.data = {s:[], t:[], o:[], c:[]}; clearSel(); saveSketch(); renderInk();
  },
  print: () => doPrint(sketchPage(ED.scope, ED.key, true)),
  close: () => $("#editor").close(),
};
export function klick(e){
  if (ED.skipClick) { ED.skipClick = false; if (e.target.closest("[data-place]")) return; }   // Klick nach Ziehen aus der Palette
  const pb = e.target.closest("[data-place]");
  if (pb) { ED.place = pb.dataset.place; setTool("place"); return; }
  const v = vorlage(ED.key);
  if (v.klick && v.klick(e)) return;   // Haken klick: Bedienelemente der Vorlage, z. B. Werkzeuge der Seitenleiste
  const sy = e.target.closest("[data-sym]");
  if (sy) { zeichenEinfuegen(sy.dataset.sym); return; }
  const t = e.target.closest("[data-tool],[data-w],[data-ed]");
  if (!t) return;
  if (t.dataset.tool) { if (t.dataset.color) ED.color = t.dataset.color; setTool(t.dataset.tool); }
  if (t.dataset.w) { ED.w = +t.dataset.w; $$("#editor [data-w]").forEach(b => b.setAttribute("aria-pressed", b === t)); }
  const a = AKTIONEN[t.dataset.ed];
  if (a) a(t);
}
// Zeichenleiste (·, +, ¬ …): Zeichen ins zuletzt benutzte Feld an der Schreibmarke einfügen
export function zeichenEinfuegen(zeichen){
  const el = lastProp;
  if (!el || !el.isConnected || (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA")) return;
  const a = el.selectionStart ?? el.value.length, b = el.selectionEnd ?? a;
  el.value = el.value.slice(0, a) + zeichen + el.value.slice(b);
  el.focus(); el.setSelectionRange(a + zeichen.length, a + zeichen.length);
  applyProp(el.dataset.prop, el.value);
}

/* ---------- Eigenschaftsfeld ---------- */
export function feldGeaendert(e){
  const f = e.target.dataset && e.target.dataset.prop, o = ED.sel && objById(ED.sel);
  if (!f || !o || !(art(o.k).umbau || []).includes(f)) return;   // Haken umbau: diese Felder ändern das Eigenschaftsfeld
  applyProp(f, e.target.value); updateProps("neu");
  const again = $(`#props [data-prop="${f}"]`); if (again) again.focus();
}

/* ---------- Tastatur ---------- */
export function tasteImFeld(e){
  if (e.key !== "Enter" || !e.target.dataset.prop) return;
  e.preventDefault();
  if (e.target.tagName === "TEXTAREA" && (e.altKey || e.shiftKey || e.ctrlKey)) {   // neue Zeile
    newline(e.target); e.target.rows = e.target.value.split("\n").length; applyProp(e.target.dataset.prop, e.target.value);
  }
  else $("#edstage").focus({preventScroll: true});
}
export function beschrifteMarkiertes(){
  const o = ED.sel && objById(ED.sel);
  if (o) editObjLabel(o);
  else if (ED.selT !== null) editTextItem(ED.selT);
  else if (ED.selC !== null) editConnLabel(ED.selC);
}
// Esc: angefangene Linie (ED.pend) verwerfen, sonst Markierung und Werkzeug aufheben; true, wenn etwas zu tun war
export function abbrechen(e){
  if (!ED.svg) return false;
  if (ED.pend) { e.preventDefault(); ED.pend = null; $(".ghost", ED.svg).innerHTML = ""; updateProps(true); return true; }
  if (ED.place || ED.from || anySel()) { e.preventDefault(); clearSel(); ED.from = null; werkzeugNachAbbruch(); return true; }
  return false;
}
export function verschiebeMarkiertes(key){
  const dx = {ArrowLeft: -10, ArrowRight: 10}[key] || 0, dy = {ArrowUp: -10, ArrowDown: 10}[key] || 0;
  if (ED.sel) { const o = objById(ED.sel); o.x += dx; o.y += dy; }
  else if (ED.selS !== null) ED.data.s[ED.selS].p = ED.data.s[ED.selS].p.map(([x, y]) => [x + dx, y + dy]);
  else { const t = ED.data.t[ED.selT]; t.x += dx; t.y += dy; }
}
export function taste(e){
  if (e.target.matches("input,select,textarea")) { if (!signalTaste(e)) tasteImFeld(e); return; }
  const strg = e.ctrlKey || e.metaKey;
  if ((e.key === "Enter" || e.key === "F2") && anySel() && !ED.selF) { e.preventDefault(); beschrifteMarkiertes(); return; }
  if (strg && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); return; }
  if (strg && e.key.toLowerCase() === "a") { e.preventDefault(); return; }
  if (!strg && !e.altKey && ED.sel && ["r", "m"].includes(e.key.toLowerCase())) { e.preventDefault(); turnSel(e.key.toLowerCase() === "r" ? "rot" : "flip"); return; }
  if (e.key === "Escape" && abbrechen(e)) return;
  if ((e.key === "Delete" || e.key === "Backspace") && anySel()) { e.preventDefault(); delSel(); return; }
  if (e.key.startsWith("Arrow") && (ED.sel || ED.selS !== null || ED.selT !== null)) {
    e.preventDefault(); aendere(() => verschiebeMarkiertes(e.key));
  }
}

// Seiteneffekte: Listener des Editor-Dialogs. main.js ruft init() in der ursprünglichen Reihenfolge auf.
export function init(){
  const dlg = $("#editor");
  addEventListener("resize", () => { if (ED.svg) sizeSVG(); });
  dlg.addEventListener("pointerdown", paletteDruecken);
  dlg.addEventListener("selectstart", e => { if (!e.target.closest || !e.target.closest("input,textarea")) e.preventDefault(); });
  document.addEventListener("pointermove", paletteZiehen);
  document.addEventListener("pointerup", paletteLoslassen);
  dlg.addEventListener("click", klick);
  dlg.addEventListener("focusin", e => { if (e.target.dataset && e.target.dataset.prop) { snapshot(); setLastProp(e.target); } });
  dlg.addEventListener("input", e => {
    const f = e.target.dataset && e.target.dataset.prop;
    if (istSignalFeld(e.target)) signalEingabe(e.target);   // Minuszeichen, Vorschlagsliste
    if (f) applyProp(f, e.target.value);
  });
  dlg.addEventListener("focusout", e => { if (istSignalFeld(e.target)) schliesseListe(e.target); });
  dlg.addEventListener("change", feldGeaendert);
  dlg.addEventListener("pointerdown", e => { if (e.target.closest(".sym")) e.preventDefault(); signalWahl(e); });   // Fokus im Feld lassen
  dlg.addEventListener("keydown", taste);
  dlg.addEventListener("cancel", abbrechen);   // Esc im Dialog: erst abbrechen, erst dann schließen
  dlg.addEventListener("close", () => { ED.svg = null; ED.sim = {on: false, st: {}, pos: {}}; route(); });
}
