// Editor-Kern: Eigenschaften übernehmen, Drehen, Löschen, Radieren.
import { ED } from './status.js';
import { PC, STRICHFELD, art } from './registry.js';
import { objById } from './auswahl.js';
import { inkSVG } from './zeichnen.js';
import { refreshTpl, renderInk } from './anzeige.js';
import { saveSketch, snapshot } from './verlauf.js';

// Eingabe im Eigenschaftsfeld übernehmen. f ist das Feld (data-prop), v der neue Wert.
export function applyProp(f, v){
  if (f === "cst") { leitungsart(v); return; }
  if (SCHRIFTFELD[f]) { setzeSchriftfeld(f, v); return; }
  if (!setzeFeld(f, v)) return;
  saveSketch(); ED.svg.querySelector(".ink").innerHTML = inkSVG(ED.data, true, ED.key);
}
export const SCHRIFTFELD = {mt: "title", mn: "name", md: "datum"};   // Feld → Eintrag in data.meta
export const TEXTFELD = {tv: "v", ts: "s", sc: "c"};                  // Feld → Eigenschaft des markierten Texts
export function leitungsart(v){
  const c = ED.data.c[ED.selC];
  if (c) { c.st = v; saveSketch(); renderInk(); }
}
// Leere Einträge entfallen, damit wieder Name aus „Meine Daten“ und Änderungsdatum gelten
export function setzeSchriftfeld(f, v){
  const m = ED.data.meta = ED.data.meta || {};
  m[SCHRIFTFELD[f]] = v;
  Object.keys(m).forEach(k => { if (!m[k]) delete m[k]; });
  if (!Object.keys(m).length) delete ED.data.meta;
  saveSketch(); refreshTpl();
}
// Feld am markierten Element setzen; false, wenn nichts Passendes markiert ist
export function setzeFeld(f, v){
  const t = ED.selT !== null && ED.data.t[ED.selT], st = ED.selS !== null && ED.data.s[ED.selS];
  if (f === "cv") { const c = ED.data.c[ED.selC]; if (c) c.v = v; return true; }
  if (t && TEXTFELD[f]) { t[TEXTFELD[f]] = f === "ts" ? +v : v; return true; }
  if (st && STRICHFELD[f]) { st[STRICHFELD[f]] = f === "sw" ? +v : v; return true; }
  const o = objById(ED.sel);
  if (!o) return false;
  if (f === "w") { const w = parseInt(v, 10); if (w >= 40) o.w = Math.round(w/10)*10; }   // Breite im 10er-Raster
  else if (!(art(o.k).setze && art(o.k).setze(o, f, v))) o[f] = v;   // Haken setze: Feld mit eigener Wirkung
  return true;
}
export function removeObj(id){ ED.data.o = ED.data.o.filter(o => o.id !== id); ED.data.c = ED.data.c.filter(c => c.a !== id && c.b !== id); if (ED.sel === id) ED.sel = null; }
export function delSel(){
  if (ED.sel) { snapshot(); removeObj(ED.sel); }
  else if (ED.selC !== null && ED.data.c[ED.selC]) { snapshot(); ED.data.c.splice(ED.selC, 1); ED.selC = null; }
  else if (ED.selS !== null && ED.data.s[ED.selS]) { snapshot(); ED.data.s.splice(ED.selS, 1); ED.selS = null; }
  else if (ED.selT !== null && ED.data.t[ED.selT]) { snapshot(); ED.data.t.splice(ED.selT, 1); ED.selT = null; }
  else return;
  saveSketch(); renderInk();
}
export function turnSel(a){
  const o = objById(ED.sel); if (!o || !PC[o.k] || PC[o.k].drehbar === false) return;
  snapshot(); if (a === "rot") o.rot = ((o.rot || 0) + 90) % 360; else o.flip = !o.flip;
  saveSketch(); renderInk();
}
export function eraseAt(e){
  const el = document.elementFromPoint(e.clientX, e.clientY); if (!el) return;
  const go = el.closest("[data-o]"), gc = el.closest("[data-c]");
  if (go) { snapshot(); removeObj(go.dataset.o); }
  else if (gc) { snapshot(); ED.data.c.splice(+gc.dataset.c, 1); }
  else if (el.dataset.i !== undefined) { snapshot(); ED.data.s.splice(+el.dataset.i, 1); }
  else if (el.dataset.ti !== undefined) { snapshot(); ED.data.t.splice(+el.dataset.ti, 1); }
  else return;
  saveSketch(); renderInk();
}
