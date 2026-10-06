import { tw } from './svg.js';
import { BLK, PC } from './registry.js';
import { xform } from './bauteile.js';

export const R = {state:36, sinit:36, start:8, sum:15};
export const isAct = o => !!o && (o.k === "action" || o.k === "actionq");
export const atype = o => o.k === "actionq" ? "q" : (o.t || "kont");
export const hasMark = o => isAct(o) && (["akt","deakt","ereig"].includes(atype(o)) || (atype(o) === "kont" && (o.b || o.hb)));
export const isActKey = k => BLK[k] && (k === "action" || k === "actionq" || (BLK[k].mk && BLK[k].mk.k === "action"));
export const ACT_T = {kont:"kontinuierlich wirkend", akt:"speichernd bei Aktivierung ↑", deakt:"speichernd bei Deaktivierung ↓", ereig:"speichernd bei Ereignis", q:"mit Bestimmungszeichen (IEC 61131-3)"};
export const aw = o => Math.max(90, Math.round((tw(o.v || "Aktion") + 26 + (isAct(o) && atype(o) === "q" ? 30 : 0)) / 10) * 10);
export const bw = o => Math.max(110, Math.round((tw(o.v || "Block") + 30) / 10) * 10);
export const fam = o => o && BLK[o.k] ? BLK[o.k].g : null;
export function bbox(o){
  if (typeof PC !== "undefined" && PC[o.k]) { const pc = PC[o.k]; if (o.k === "rail") return {x: o.x, y: o.y - 6, w: o.w || 400, h: 12};
    if (o.k === "insel") return {x: o.x, y: o.y, w: +o.fw || 360, h: +o.fh || 120};
    const X = xform(o), b = {x: o.x + (pc.bx || 0), y: o.y, w: pc.w, h: pc.h}; if (!X || X.c) return b;   // 0°/180°: gleicher Umriss
    return {x: X.cx - pc.h / 2, y: X.cy - pc.w / 2, w: pc.h, h: pc.w}; }
  switch (o.k) {
    case "init": case "step": case "macro": return {x:o.x, y:o.y, w:40, h:40};
    case "ref": return {x:o.x-10, y:o.y, w:24 + tw(o.v || "Ziel"), h:36};
    case "trans": return {x:o.x-16, y:o.y-9, w:32 + (o.v ? tw(o.v) + 12 : 70), h:18};
    case "action": case "actionq": { const m = hasMark(o) ? 20 : 0; return {x:o.x, y:o.y - m, w:aw(o), h:30 + m}; }
    case "alt": return {x:o.x, y:o.y-5, w:o.w||200, h:10};
    case "par": return {x:o.x, y:o.y-5, w:o.w||200, h:15};
    case "state": case "sinit": case "start": case "sum": { const r = R[o.k]; return {x:o.x-r, y:o.y-r, w:2*r, h:2*r}; }
    case "no": case "nc": case "coil": case "lamp": return {x:o.x-22, y:o.y, w:44, h:60};
    case "box": return {x:o.x, y:o.y, w:bw(o), h:50};
  }
  return {x:o.x, y:o.y, w:20, h:20};
}
export const ctr = o => { if (o.k === "trans") return [o.x, o.y]; const b = bbox(o); return [b.x + b.w/2, b.y + b.h/2]; };
