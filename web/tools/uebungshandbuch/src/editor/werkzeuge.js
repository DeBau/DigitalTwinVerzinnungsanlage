// Editor-Kern: Werkzeug wählen, Mauspunkt in Blattkoordinaten, Fangen.
import { CYL } from '../app/daten.js';
import { $, $$ } from '../app/basis.js';
import { ED } from './status.js';
import { snap } from './vorlagen-svg.js';
import { simOn } from './bauteile.js';
import { simCompute, simStep } from './zeichnen.js';
import { clearSel } from './auswahl.js';
import { updateProps } from './eigenschaften.js';
import { renderInk } from './anzeige.js';

export function setTool(t){
  ED.pend = null;
  ED.wsPreset = null; $$("#editor [data-ws]").forEach(x => x.setAttribute("aria-pressed", "false"));
  if (t === "sim" && !simOn()) { clearSel(); ED.sim = {on: true, st: {}, pos: {}, t: 0}; simCompute(); requestAnimationFrame(simStep); }
  else if (t !== "sim" && simOn()) ED.sim = {on: false, st: {}, pos: {}};
  ED.tool = t; if (t !== "place") ED.place = null; if (t !== "conn") ED.from = null;
  $$("#editor [data-tool]").forEach(b => b.setAttribute("aria-pressed", b.dataset.tool === t && (!b.dataset.color || b.dataset.color === ED.color)));
  $$("#editor [data-place]").forEach(b => b.setAttribute("aria-pressed", b.dataset.place === ED.place));
  if (ED.svg) { ["erase","text","sel","conn","place","sim"].forEach(c => ED.svg.classList.toggle(c, t === c)); $(".ghost", ED.svg).innerHTML = ""; renderInk(); }
  updateProps(true);
}
export function svgPt(svg, e){ const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(svg.getScreenCTM().inverse()); return [Math.round(q.x*10)/10, Math.round(q.y*10)/10]; }
export const wsRows = () => (CYL[ED.scope] || ["","","",""]).length + 2;
export function snapW(pt){
  if (!ED.grid) return [Math.round(pt[0]), Math.round(pt[1])];
  if (ED.key === "wegschritt") { const j = ED.data.s.find(q => q.k === "vk" && Math.hypot(q.p[0][0] - pt[0], q.p[0][1] - pt[1]) < 12); if (j) return [...j.p[0]]; }
  if (ED.key === "wegschritt") {   // im Diagramm immer auf einen Eckpunkt: Schrittgrenze × Stellung 1 oder 0
    const rows = (CYL[ED.scope] || ["","","",""]).length + 2, xs = 150, cw = (975 - 150) / 12, yTop = 74, yEnd = 74 + rows * 62;
    if (pt[0] >= xs - 30 && pt[0] <= 990 && pt[1] >= yTop - 10 && pt[1] <= yEnd + 10) {
      const c = Math.max(0, Math.min(12, Math.round((pt[0] - xs) / cw)));
      const lv = []; for (let i = 0; i < rows; i++) lv.push(yTop + i*62 + 16, yTop + i*62 + 50);
      const ny = lv.reduce((a, v) => Math.abs(v - pt[1]) < Math.abs(a - pt[1]) ? v : a, lv[0]);
      return [+(xs + c*cw).toFixed(2), ny];
    }
    return [Math.round(pt[0]/10)*10, Math.round(pt[1]/10)*10];
  }
  return snap(pt);
}
