// Editor-Kern: Werkzeug wählen, Mauspunkt in Blattkoordinaten, Fangen.
import { $, $$ } from '../app/basis.js';
import { ED } from './status.js';
import { VORL } from './registry.js';
import { snap } from './vorlagen-svg.js';
import { simOn } from './bauteile.js';
import { clearSel } from './auswahl.js';
import { simCompute, simStep } from './zeichnen.js';
import { updateProps } from './eigenschaften.js';
import { renderInk } from './anzeige.js';

export function setTool(t){
  ED.pend = null;
  const v = VORL[ED.key];
  if (v && v.werkzeugWechsel) v.werkzeugWechsel(t);   // Haken werkzeugWechsel: Vorlage räumt eigene Werkzeuge auf
  if (t === "sim" && !simOn()) { clearSel(); ED.sim = {on: true, st: {}, pos: {}, t: 0}; simCompute(); requestAnimationFrame(simStep); }
  else if (t !== "sim" && simOn()) ED.sim = {on: false, st: {}, pos: {}};
  ED.tool = t; if (t !== "place") ED.place = null; if (t !== "conn") ED.from = null;
  $$("#editor [data-tool]").forEach(b => b.setAttribute("aria-pressed", b.dataset.tool === t && (!b.dataset.color || b.dataset.color === ED.color)));
  $$("#editor [data-place]").forEach(b => b.setAttribute("aria-pressed", b.dataset.place === ED.place));
  if (ED.svg) { ["erase","text","sel","conn","place","sim"].forEach(c => ED.svg.classList.toggle(c, t === c)); $(".ghost", ED.svg).innerHTML = ""; renderInk(); }
  updateProps(true);
}
export function svgPt(svg, e){ const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(svg.getScreenCTM().inverse()); return [Math.round(q.x*10)/10, Math.round(q.y*10)/10]; }
// Punkt fangen: im Raster, die Vorlage kann eigene Fangpunkte haben (Haken fangPunkt)
export function snapW(pt){
  if (!ED.grid) return [Math.round(pt[0]), Math.round(pt[1])];
  const v = VORL[ED.key];
  if (v && v.fangPunkt) return v.fangPunkt(pt);
  return snap(pt);
}
