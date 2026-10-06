// Editor-Kern: Eigenschaften übernehmen, Drehen, Löschen, Radieren.
import { ED } from './status.js';
import { STRICHFELD, art, bauteil } from './registry.js';
import { gruppeVon } from './bausteine.js';
import { objById } from './auswahl.js';
import { inkSVG } from './zeichnen.js';
import { refreshTpl, renderInk } from './anzeige.js';
import { aendere, saveSketch } from './verlauf.js';

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
// Baustein id samt Verbindungen entfernen. Der Haken loeschen(o, d) der Gruppe nennt IDs, die mitgehen (z. B. Aktionen),
// und darf vorher Verbindungen in d ergänzen (z. B. Kette schließen).
export function removeObj(id){
  const o = objById(id), loeschen = o && gruppeVon(o).loeschen;
  const weg = new Set([id, ...(loeschen ? loeschen(o, ED.data) : [])]);
  ED.data.o = ED.data.o.filter(p => !weg.has(p.id));
  ED.data.c = ED.data.c.filter(c => !weg.has(c.a) && !weg.has(c.b));
  if (weg.has(ED.sel)) ED.sel = null;
}
export function delSel(){
  if (ED.sel) aendere(() => removeObj(ED.sel));
  else if (ED.selC !== null && ED.data.c[ED.selC]) aendere(d => { d.c.splice(ED.selC, 1); ED.selC = null; });
  else if (ED.selS !== null && ED.data.s[ED.selS]) aendere(d => { d.s.splice(ED.selS, 1); ED.selS = null; });
  else if (ED.selT !== null && ED.data.t[ED.selT]) aendere(d => { d.t.splice(ED.selT, 1); ED.selT = null; });
}
export function turnSel(a){
  const o = objById(ED.sel); if (!o || !bauteil(o.k) || art(o.k).drehbar === false) return;
  aendere(() => { if (a === "rot") o.rot = ((o.rot || 0) + 90) % 360; else o.flip = !o.flip; });
}
export function eraseAt(e){
  const el = document.elementFromPoint(e.clientX, e.clientY); if (!el) return;
  const go = el.closest("[data-o]"), gc = el.closest("[data-c]");
  if (go) aendere(() => removeObj(go.dataset.o));
  else if (gc) aendere(d => { d.c.splice(+gc.dataset.c, 1); });
  else if (el.dataset.i !== undefined) aendere(d => { d.s.splice(+el.dataset.i, 1); });
  else if (el.dataset.ti !== undefined) aendere(d => { d.t.splice(+el.dataset.ti, 1); });
}
