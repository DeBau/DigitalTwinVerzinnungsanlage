// Editor-Kern: Bausteine erzeugen und setzen, Ketten fortsetzen, Andocken, Hilfslinien, Verbinden.
import { PH } from './svg.js';
import { ED } from './status.js';
import { BLK, FIXED, PC, art } from './registry.js';
import { snap } from './vorlagen-svg.js';
import { bbox, ctr, fam } from './bausteine.js';
import { clearSel, objById, uid } from './auswahl.js';
import { andockPunkt, andockStelle, ausrichten, kettenQuelle } from './kette.js';
import { connGeom } from './zeichnen.js';
import { renderInk } from './anzeige.js';
import { saveSketch, snapshot } from './verlauf.js';
import { editConnLabel, editObjLabel } from './beschriften.js';
import { setTool } from './werkzeuge.js';

export function nextLabel(l){   // -QA1 → nächste freie Nummer
  const m = /^(.*?)(\d+)$/.exec(l); if (!m || l.includes(":")) return l;
  const used = ED.data.o.map(o => o.v || "").filter(v => v.startsWith(m[1])).map(v => parseInt(v.slice(m[1].length), 10)).filter(n => !isNaN(n));
  return used.length ? m[1] + (Math.max(...used) + 1) : l;
}
// Neues Objekt der Palettenart k mit der Mitte bei [px, py]. Lage und Vorgaben setzt der Haken neu der Bausteinart.
export function makeObj(k, [px, py]){
  const mk = BLK[k] && BLK[k].mk;
  if (mk) k = mk.k || k;
  if (PC[k]) return neuesBauteil(k, mk, px, py);
  const o = {id: uid(), k}, a = BLK[k];
  if (a && a.neu) a.neu(o, [px, py], mk);
  else if (k === "box") { o.x = px - 55; o.y = py - 25; o.v = ""; }
  else if (k === "no" || k === "nc" || k === "coil" || k === "lamp") { o.x = px; o.y = py - 30; o.v = {no:"-SF1", nc:"-SF2", coil:"-QA1", lamp:"-PF1"}[k]; }
  else if (k === "state" || k === "sinit") { o.x = px; o.y = py; o.v = "Z" + ED.data.o.filter(q => q.k === "state" || q.k === "sinit").length; }
  else { o.x = px; o.y = py; }
  [o.x, o.y] = snap([o.x, o.y]);
  return o;
}
export function neuesBauteil(k, mk, px, py){
  const pc = PC[k], o = {id: uid(), ...(pc.def || {}), ...(mk || {})};
  o.k = k;
  o.v = nextLabel(pc.lbl || "");
  if (pc.neu) pc.neu(o, [px, py]);
  else if (k === "rail") { o.w = 400; o.x = px - 200; o.y = py; }
  else { o.x = px - (pc.bx || 0) - pc.w / 2; o.y = py - pc.h / 2; }
  [o.x, o.y] = snap([o.x, o.y]);
  return o;
}
export function smartPos(o){
  if (ED.key === "stromlauf" && fam(o) === "elektro") o.x = 40 + Math.max(1, Math.min(20, Math.round((o.x - 40) / 46))) * 46;
  const dock = andockStelle(o), marks = [];
  if (dock) { o.x += dock.sx; o.y += dock.sy; }
  if (ED.dock && !dock) {
    const c = ctr(o); let gx = null, gy = null, bx = 12, by = 12;
    for (const p of ED.data.o) { if (p.id === o.id) continue; const q = ctr(p), dx = q[0] - c[0], dy = q[1] - c[1];
      if (Math.abs(dx) < bx && Math.abs(dx) > 0) { bx = Math.abs(dx); gx = [dx, q]; } else if (dx === 0) { bx = 0; gx = [0, q]; }
      if (Math.abs(dy) < by && Math.abs(dy) > 0) { by = Math.abs(dy); gy = [dy, q]; } else if (dy === 0) { by = 0; gy = [0, q]; } }
    if (gx && !(dock && dock.sx)) { o.x += gx[0]; const c2 = ctr(o); marks.push(`<path d="M${c2[0]} ${Math.min(c2[1], gx[1][1]) - 30}V${Math.max(c2[1], gx[1][1]) + 30}" stroke="#2F80ED" stroke-width="1" stroke-dasharray="4 4"/>`); }
    if (gy && !(dock && dock.sy)) { o.y += gy[0]; const c2 = ctr(o); marks.push(`<path d="M${Math.min(c2[0], gy[1][0]) - 30} ${c2[1]}H${Math.max(c2[0], gy[1][0]) + 30}" stroke="#2F80ED" stroke-width="1" stroke-dasharray="4 4"/>`); }
  }
  if (dock) {
    const map = Object.fromEntries(ED.data.o.map(p => [p.id, p])); map[o.id] = o;
    const gm = connGeom({a: dock.a, b: dock.b}, map, []);
    if (gm) marks.push(`<path d="${gm.d}" fill="none" stroke="#2F80ED" stroke-width="2.5" stroke-dasharray="6 4"/>`);
    const p = andockPunkt(map[dock.a], map[dock.b]);
    marks.push(`<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="#2F80ED" fill-opacity=".25" stroke="#2F80ED" stroke-width="1.5"/>`);
  }
  return {dock, marks: marks.join("")};
}
export function avoidBreak(o){   // Bausteine nicht in Schriftfeld/Rand am Blattende legen – sonst auf das nächste Blatt
  if (FIXED[ED.key]) return;
  for (let i = 0; i < 4; i++) { const b = bbox(o), k = Math.floor((b.y + b.h + 80) / PH), B = k * PH;
    if (k >= 1 && b.y < B + 70 && b.y + b.h > B - 80) o.y += B + 70 - b.y; else break; }
}
export const linked = (a, b) => ED.data.c.some(c => (c.a === a && c.b === b) || (c.a === b && c.b === a));
export function placeObj(k, pt){
  const A = kettenQuelle(k), o = makeObj(k, pt);
  let dock = null;
  if (A) ausrichten(o, A, pt); else dock = smartPos(o).dock;
  avoidBreak(o);
  snapshot(); ED.data.o.push(o);
  if (A) ED.data.c.push({a: A.id, b: o.id, v: ""});
  else if (dock && !linked(dock.a, dock.b)) ED.data.c.push({a: dock.a, b: dock.b, v: ""});
  ED.sel = o.id; ED.selC = null; saveSketch(); setTool("sel");
  const b = art(o.k).beschriftung;
  if ((b && b.sofort) || o.k === "box") editObjLabel(o);   // z. B. Transition: Bedingung gleich eintragen
}
export function connectPorts(a, pa, b, pb){
  if (a === b && pa === pb) return;
  if (a.startsWith("_") && b.startsWith("_")) return;
  if (ED.data.c.some(c => (c.a === a && c.pa === pa && c.b === b && c.pb === pb) || (c.a === b && c.pa === pb && c.b === a && c.pb === pa))) return;
  snapshot(); ED.data.c.push({a, pa, b, pb, v: ""}); clearSel(); ED.selC = ED.data.c.length - 1; saveSketch(); renderInk();
}
export function connect(a, b){
  const A = objById(a); if (!A || (a === b && fam(A) !== "zustand")) return;
  if (ED.data.c.some(c => c.a === a && c.b === b)) return;
  snapshot(); ED.data.c.push({a, b, v: ""}); ED.selC = ED.data.c.length - 1; ED.sel = null; saveSketch(); renderInk();
  if (fam(A) === "zustand" && A.k !== "start") editConnLabel(ED.data.c.length - 1);
}
