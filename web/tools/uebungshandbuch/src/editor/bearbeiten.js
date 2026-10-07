// Editor-Kern: Eigenschaften übernehmen, Drehen, Löschen, Radieren.
import { ED, markiertId } from './status.js';
import { STRICHFELD, art, bauteil } from './registry.js';
import { gruppeVon } from './bausteine.js';
import { clearSel, markiertesElement, markiertesObjekt, objById, trefferBei } from './auswahl.js';
import { inkSVG } from './zeichnen.js';
import { refreshTpl } from './anzeige.js';
import { aendere, saveSketch } from './verlauf.js';

// Eingabe im Eigenschaftsfeld übernehmen. f ist das Feld (data-prop), v der neue Wert.
export function applyProp(f, v){
  if (SCHRIFTFELD[f]) { setzeSchriftfeld(f, v); return; }
  if (!setzeFeld(f, v)) return;
  saveSketch(); ED.svg.querySelector(".ink").innerHTML = inkSVG(ED.data, true, ED.key);
}
export const SCHRIFTFELD = {mt: "title", mn: "name", md: "datum"};   // Feld → Eintrag in data.meta
// Feld im Eigenschaftsbereich → Eigenschaft des markierten Elements je Art. Bausteine: o[Feld] oder Haken setze
export const FELDNAME = {t: {tv: "v", ts: "s", sc: "c"}, s: STRICHFELD, c: {cv: "v", cst: "st"}};
export const ZAHLFELD = ["ts", "sw"];   // Schriftgröße und Strichstärke sind Zahlen
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
  const m = ED.markiert, el = markiertesElement();
  if (!el) return false;
  const name = (FELDNAME[m.art] || {})[f];
  if (name) { el[name] = ZAHLFELD.includes(f) ? +v : v; return true; }
  if (m.art !== "o") return false;
  const setze = art(el.k).setze;   // Haken setze: Feld mit eigener Wirkung, z. B. Breite im 10er-Raster
  if (!(setze && setze(el, f, v))) el[f] = v;
  return true;
}
// Baustein id samt Verbindungen entfernen. Der Haken loeschen(o, d) der Gruppe nennt IDs, die mitgehen (z. B. Aktionen),
// und darf vorher Verbindungen in d ergänzen (z. B. Kette schließen).
export function removeObj(id){
  const o = objById(id), loeschen = o && gruppeVon(o).loeschen;
  const weg = new Set([id, ...(loeschen ? loeschen(o, ED.data) : [])]);
  ED.data.o = ED.data.o.filter(p => !weg.has(p.id));
  ED.data.c = ED.data.c.filter(c => !weg.has(c.a) && !weg.has(c.b));
  if (weg.has(markiertId("o"))) clearSel();
}
// Element entfernen je Art der Markierung bzw. des Treffers; das Schriftfeld lässt sich nicht löschen
export const ENTFERNE = {
  o: id => removeObj(id),
  c: i => { ED.data.c.splice(i, 1); },
  s: i => { ED.data.s.splice(i, 1); },
  t: i => { ED.data.t.splice(i, 1); },
};
export function delSel(){
  const m = ED.markiert, weg = m && markiertesElement() && ENTFERNE[m.art];
  if (weg) aendere(() => { weg(m.id); clearSel(); });
}
export function turnSel(a){
  const o = markiertesObjekt(); if (!o || !bauteil(o.k) || art(o.k).drehbar === false) return;
  aendere(() => { if (a === "rot") o.rot = ((o.rot || 0) + 90) % 360; else o.flip = !o.flip; });
}
export function eraseAt(e){
  const el = document.elementFromPoint(e.clientX, e.clientY); if (!el) return;
  const t = trefferBei(el);
  if (t) aendere(() => { ENTFERNE[t.art](t.id); });
}
