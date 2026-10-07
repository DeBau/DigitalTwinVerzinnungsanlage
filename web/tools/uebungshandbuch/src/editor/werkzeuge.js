// Editor-Kern: Werkzeug wählen, Mauspunkt in Blattkoordinaten, Fangen.
import { $, $$ } from '../app/basis.js';
import { ED } from './status.js';
import { vorlage } from './registry.js';
import { snap } from './vorlagen-svg.js';
import { updateProps } from './eigenschaften.js';
import { renderInk } from './anzeige.js';

// Werkzeuge mit eigenem Zeiger: das Blatt bekommt eine CSS-Klasse gleichen Namens (styles/07-editor.css).
// sim gehört zur Pneumatik-Simulation.
export const BLATTKLASSEN = ["erase", "text", "sel", "conn", "place", "sim"];
export function setTool(t){
  ED.vorlage.angefangen = null;
  const v = vorlage(ED.key);
  if (v.werkzeugWechsel) v.werkzeugWechsel(t);   // Haken werkzeugWechsel: Vorlage räumt eigene Werkzeuge auf
  ED.tool = t; if (t !== "place") ED.place = null; if (t !== "conn") ED.verbindenVon = null;
  const gedrueckt = b => b.dataset.tool === t && (!b.dataset.color || b.dataset.color === ED.color);
  $$("#editor [data-tool]").forEach(b => b.setAttribute("aria-pressed", gedrueckt(b)));
  $$("#editor [data-place]").forEach(b => b.setAttribute("aria-pressed", b.dataset.place === ED.place));
  if (ED.svg) { BLATTKLASSEN.forEach(c => ED.svg.classList.toggle(c, t === c)); $(".ghost", ED.svg).innerHTML = ""; renderInk(); }
  updateProps(true);
}
// Tasten wieder ans Blatt geben (#edstage), ohne zu rollen
export const fokusAufsBlatt = () => { const st = document.querySelector("#edstage"); if (st) st.focus({preventScroll: true}); };
// Zeigerposition von e in Blattkoordinaten, auf 0,1 gerundet
export function blattPunkt(svg, e){
  const p = svg.createSVGPoint();
  p.x = e.clientX; p.y = e.clientY;
  const q = p.matrixTransform(svg.getScreenCTM().inverse());
  return [Math.round(q.x*10)/10, Math.round(q.y*10)/10];
}
// Punkt fangen: im Raster, die Vorlage kann eigene Fangpunkte haben (Haken fangPunkt)
export function fangen(pt){
  if (!ED.grid) return [Math.round(pt[0]), Math.round(pt[1])];
  const v = vorlage(ED.key);
  if (v.fangPunkt) return v.fangPunkt(pt);
  return snap(pt);
}
