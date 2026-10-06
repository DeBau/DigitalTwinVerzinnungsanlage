// Editor-Kern: Bausteine erzeugen und setzen, Ketten fortsetzen, Andocken, Hilfslinien, Verbinden.
import { PH } from './svg.js';
import { ED } from './status.js';
import { BLK, FIXED, PC } from './registry.js';
import { snap } from './vorlagen-svg.js';
import { aw, bbox, ctr, fam, hasMark, isAct, isActKey } from './bausteine.js';
import { connGeom, inPt, outPt } from './zeichnen.js';
import { clearSel, objById, uid } from './auswahl.js';
import { renderInk } from './anzeige.js';
import { saveSketch, snapshot } from './verlauf.js';
import { editConnLabel, editObjLabel } from './beschriften.js';
import { setTool } from './werkzeuge.js';

export function nextLabel(l){   // -QA1 → nächste freie Nummer
  const m = /^(.*?)(\d+)$/.exec(l); if (!m || l.includes(":")) return l;
  const used = ED.data.o.map(o => o.v || "").filter(v => v.startsWith(m[1])).map(v => parseInt(v.slice(m[1].length), 10)).filter(n => !isNaN(n));
  return used.length ? m[1] + (Math.max(...used) + 1) : l;
}
export function makeObj(k, [px, py]){
  const mk = BLK[k] && BLK[k].mk; if (mk) k = mk.k || k;
  if (PC[k]) { const pc = PC[k], o = {id: uid(), ...(pc.def || {}), ...(mk || {})}; o.k = k; o.v = nextLabel(pc.lbl || "");
    if (k === "rail") { o.w = 400; o.x = px - 200; o.y = py; } else { o.x = px - (pc.bx || 0) - pc.w / 2; o.y = py - pc.h / 2; }
    [o.x, o.y] = snap([o.x, o.y]); return o; }
  const o = {id: uid(), k}, nums = ED.data.o.filter(q => q.k === "step" || q.k === "init").map(q => parseInt(q.v, 10)).filter(v => !isNaN(v));
  if (k === "init" || k === "step") { o.x = px - 20; o.y = py - 20; o.v = String(nums.length ? Math.max(...nums) + 1 : 1); }
  else if (k === "action") { Object.assign(o, mk || {t: "kont"}); o.k = "action"; o.x = px - 20; o.y = py - 15; o.v = ""; }
  else if (k === "macro") { o.x = px - 20; o.y = py - 20; o.v = "M" + (ED.data.o.filter(q => q.k === "macro").length + 1); }
  else if (k === "ref") { o.x = px; o.y = py - 15; o.v = ""; }
  else if (k === "alt" || k === "par") { o.x = px - 100; o.y = py; o.w = 200; }
  else if (k === "box") { o.x = px - 55; o.y = py - 25; o.v = ""; }
  else if (k === "no" || k === "nc" || k === "coil" || k === "lamp") { o.x = px; o.y = py - 30; o.v = {no:"-SF1", nc:"-SF2", coil:"-QA1", lamp:"-PF1"}[k]; }
  else if (k === "state" || k === "sinit") { o.x = px; o.y = py; o.v = "Z" + ED.data.o.filter(q => q.k === "state" || q.k === "sinit").length; }
  else { o.x = px; o.y = py; }
  [o.x, o.y] = snap([o.x, o.y]);
  return o;
}
export function chainSource(k){
  const base = (BLK[k] && BLK[k].mk && BLK[k].mk.k) || k; if (PC[base] && !PC[base].bx) return null;
  const A = !ED.dnd && ED.sel && objById(ED.sel);   // beim Ziehen entscheidet die Ablagestelle (Andocken), nicht die Markierung
  if (!A || !(fam(A) === "grafcet" || fam(A) === "elektro") || fam(A) !== BLK[k].g) return null;
  if (isAct(A)) return isActKey(k) ? A : null;
  if (isActKey(k) && A.k !== "trans") { let cur = null, n = 0;   // hat der Schritt schon Aktionen, an die letzte anhängen
    for (let c = ED.data.c.find(c => c.a === A.id && isAct(objById(c.b))); c && n++ < 50; c = ED.data.c.find(q => q.a === cur.id && isAct(objById(q.b)))) cur = objById(c.b);
    return cur || A; }
  return A;
}
export function align(o, A, pt){
  if (isAct(o) && isAct(A)) {
    const right = pt && (pt[0] - (A.x + aw(A))) > (pt[1] - (A.y + 30));
    if (right) { o.x = A.x + aw(A); o.y = A.y; } else { o.x = A.x; o.y = A.y + 30 + (hasMark(o) ? 20 : 0); }
    return;
  }
  if (isAct(o)) { o.x = A.k === "trans" ? A.x + 40 : A.x + 70; o.y = A.k === "trans" ? A.y - 15 : A.y + 5; return; }
  const ax = outPt(A, ctr(o)[0])[0];
  o.x = o.k === "step" || o.k === "init" ? ax - 20 : o.k === "alt" || o.k === "par" ? ax - 100 : ax;
}
/* Andocken: Anschluss in der Nähe eines passenden Anschlusses → ausrichten und beim Loslassen verbinden */
export function dockFor(o){
  const g = fam(o); if (!ED.dock || !(g === "grafcet" || g === "elektro") || (PC[o.k] && !PC[o.k].bx)) return null;
  const others = ED.data.o.filter(p => p.id !== o.id && fam(p) === g && (!PC[p.k] || PC[p.k].bx));
  let best = null; const take = c => { if (!best || c.d < best.d) best = c; };
  if (isAct(o)) {
    for (const p of others) {
      if (["step","init","macro","trans"].includes(p.k)) {
        const px = p.k === "trans" ? p.x + 14 : p.x + 40, py = p.k === "trans" ? p.y : p.y + 20, dx = o.x - px, dy = o.y + 15 - py;
        if (dx >= 0 && dx <= 110 && Math.abs(dy) <= 30) take({a: p.id, b: o.id, d: Math.hypot(dx - 30, dy), sx: 0, sy: -dy});
      } else if (isAct(p)) {
        const rx = p.x + aw(p), by = p.y + 30 + (hasMark(o) ? 20 : 0);
        if (Math.abs(o.x - rx) <= 25 && Math.abs(o.y - p.y) <= 20) take({a: p.id, b: o.id, d: Math.abs(o.x - rx) + Math.abs(o.y - p.y), sx: rx - o.x, sy: p.y - o.y});
        if (Math.abs(o.x - p.x) <= 25 && Math.abs(o.y - by) <= 20) take({a: p.id, b: o.id, d: Math.abs(o.x - p.x) + Math.abs(o.y - by), sx: p.x - o.x, sy: by - o.y});
      }
    }
    return best;
  }
  for (const p of others) {
    if (isAct(p)) continue;
    const po = outPt(p, ctr(o)[0]), oi = inPt(o, po[0]), dy1 = oi[1] - po[1], dx1 = po[0] - oi[0];
    if (dy1 >= 10 && dy1 <= 140 && Math.abs(dx1) <= 30) take({a: p.id, b: o.id, d: Math.abs(dx1) + dy1/4, sx: dx1, sy: 0});
    const oo = outPt(o, ctr(p)[0]), pi = inPt(p, oo[0]), dy2 = pi[1] - oo[1], dx2 = pi[0] - oo[0];
    if (dy2 >= 10 && dy2 <= 140 && Math.abs(dx2) <= 30) take({a: o.id, b: p.id, d: Math.abs(dx2) + dy2/4, sx: dx2, sy: 0});
  }
  return best;
}
/* Hilfslinien: Mitte auf die Mitte eines Nachbarn ziehen */
export function smartPos(o){
  if (ED.key === "stromlauf" && fam(o) === "elektro") o.x = 40 + Math.max(1, Math.min(20, Math.round((o.x - 40) / 46))) * 46;
  const dock = dockFor(o), marks = [];
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
    const B = map[dock.b], A = map[dock.a], p = isAct(B) ? (isAct(A) && B.x < A.x + aw(A) - 1 ? [B.x + 8, B.y] : [B.x, B.y + 15]) : inPt(B, outPt(A, ctr(B)[0])[0]);
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
  const A = chainSource(k), o = makeObj(k, pt);
  let dock = null;
  if (A) align(o, A, pt); else dock = smartPos(o).dock;
  avoidBreak(o);
  snapshot(); ED.data.o.push(o);
  if (A) ED.data.c.push({a: A.id, b: o.id, v: ""});
  else if (dock && !linked(dock.a, dock.b)) ED.data.c.push({a: dock.a, b: dock.b, v: ""});
  ED.sel = o.id; ED.selC = null; saveSketch(); setTool("sel");
  if (o.k === "trans" || o.k === "box" || o.k === "ref" || isAct(o)) editObjLabel(o);
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
