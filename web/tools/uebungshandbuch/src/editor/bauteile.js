/* ---------- Bauteile mit Anschlüssen: Stromlauf, Geräte, Hauptstromkreis, Pneumatik (ISO 1219) ---------- */
import { INK, PH, SVGT, arrowHead, clamp } from './svg.js';
import { ED } from './status.js';
import { PC, PORTS2, VRAIL } from './registry.js';

export const SK = `stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
export const PP = d => `<path d="${d}" ${SK}/>`;
export const PD = d => `<path d="${d}" ${SK} stroke-dasharray="3 2.5"/>`;
export const LB = (x, y, t, a="end") => t ? SVGT(x, y, t, a, 12, 600) : "";
export const PN = (x, y, t, a="start") => SVGT(x, y, t, a, 8.5, 500, "#5A6672");
export const BLUE = "#2F80ED";
export const simOn = () => typeof ED !== "undefined" && ED.sim && ED.sim.on;
export const pressed = (o, p) => simOn() && ED.sim.P && ED.sim.P.has(o.id + ":" + p);
export const posOf = o => simOn() && ED.sim.pos[o.id] !== undefined ? ED.sim.pos[o.id] : 0;
export const vstate = o => simOn() && ED.sim.st[o.id] || (o.k === "v53" ? "center" : "rest");

/* Wegeventile nach ISO 1219: quadratische Schaltstellungen 40 × 40, Anschlüsse im 10er-Raster */
export const VB = 40;
export const VALVE = {
  v22: {n: 2, rest: 1, ports: [["2", 20, "u"], ["1", 20, "d"]]},
  v32: {n: 2, rest: 1, ports: [["2", 20, "u"], ["1", 10, "d"], ["3", 30, "d"]]},
  v52: {n: 2, rest: 1, ports: [["4", 10, "u"], ["2", 30, "u"], ["5", 10, "d"], ["1", 20, "d"], ["3", 30, "d"]]},
  v53: {n: 3, rest: 1, ports: [["4", 10, "u"], ["2", 30, "u"], ["5", 10, "d"], ["1", 20, "d"], ["3", 30, "d"]]}
};
export const vIdx = (o, s) => o.k === "v53" ? ({act: 0, center: 1, b: 2}[s] ?? 1) : (s === "act" ? 0 : 1);
export function vPairs(o, s){
  if (o.k === "v22") { const nc = (o.gs || "nc") === "nc"; return (s === "act") === nc ? [["1","2"]] : []; }   // 2/2: Durchgang oder gesperrt
  if (o.k === "v32") { const nc = (o.gs || "nc") === "nc"; return s === "act" ? (nc ? [["1","2"]] : [["2","3"]]) : (nc ? [["2","3"]] : [["1","2"]]); }
  if (o.k === "v52") return s === "act" ? [["1","4"],["2","3"]] : [["1","2"],["4","5"]];
  return s === "act" ? [["1","4"],["2","3"]] : s === "b" ? [["1","2"],["4","5"]] : [];
}
export function vBox(o, i){   // Durchflusswege (Pfeil vom Druck- bzw. Arbeitsanschluss weg) und Sperren eines Kästchens
  const V = VALVE[o.k], at = n => V.ports.find(p => p[0] === n);
  let pairs;
  if (o.k === "v53" && i === 1) pairs = [];
  else pairs = vPairs(o, o.k === "v53" ? (i === 0 ? "act" : "b") : (i === 0 ? "act" : "rest"));
  const used = new Set(pairs.flat());
  const dir = ([a, b]) => a === "1" ? [at(a), at(b)] : b === "1" ? [at(b), at(a)] : (b === "3" || b === "5") ? [at(a), at(b)] : [at(b), at(a)];
  return {flows: pairs.map(dir), blocked: V.ports.filter(p => !used.has(p[0]))};
}
export const thin = `stroke="${INK}" stroke-width="1.3" fill="none" stroke-linecap="round"`;
export function actuator(kind, ex, cy, dir){   // ex = Außenkante des äußeren Kästchens, dir −1 links, +1 rechts
  const X = d => ex + dir * d;
  if (kind === "feder") return `<path d="M${ex} ${cy}L${X(3)} ${cy-7}L${X(7)} ${cy+7}L${X(11)} ${cy-7}L${X(15)} ${cy+7}L${X(19)} ${cy-7}L${X(22)} ${cy}" ${thin}/>`;
  if (kind === "taster") return `<path d="M${ex} ${cy}H${X(14)}M${X(14)} ${cy-8}V${cy+8}" ${thin}/><path d="M${X(14)} ${cy-8}A8 8 0 0 ${dir < 0 ? 0 : 1} ${X(14)} ${cy+8}" ${thin}/>`;
  if (kind === "hebel") return `<path d="M${ex} ${cy}H${X(6)}L${X(16)} ${cy-12}" ${thin}/><circle cx="${X(17.5)}" cy="${cy-14}" r="2.8" fill="${INK}"/>`;
  const x0 = Math.min(ex, X(12));
  let s = `<rect x="${x0}" y="${cy-9}" width="12" height="18" fill="#fff" ${thin}/><path d="M${x0} ${cy+9}L${x0+12} ${cy-9}" ${thin}/>`;
  if (kind === "magp") { const x1 = Math.min(X(12), X(24)); s += `<rect x="${x1}" y="${cy-9}" width="12" height="18" fill="#fff" ${thin}/><path d="M${X(14)} ${cy}L${X(22)} ${cy-5}V${cy+5}Z" fill="${INK}"/>`; }
  return s;
}
export const actW = k => k === "magp" ? 24 : k === "feder" ? 22 : k === "mag" ? 12 : 18;
export function drawValve(o){
  const V = VALVE[o.k], x = o.x, y = o.y, s = vstate(o), shift = (V.rest - vIdx(o, s)) * VB, by = y + 10;
  let g = "";
  for (let i = 0; i < V.n; i++) {
    const bx = x + 30 + i * VB + shift, c = vBox(o, i);
    g += `<rect x="${bx}" y="${by}" width="${VB}" height="${VB}" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`;
    c.flows.forEach(([p, q]) => { const x1 = bx + p[1], y1 = p[2] === "u" ? by + 2 : by + VB - 2, x2 = bx + q[1], y2 = q[2] === "u" ? by + 2 : by + VB - 2;
      g += `<path d="M${x1} ${y1}L${x2} ${y2}" ${thin}/>` + arrowHead(x1, y1, x2, y2); });
    c.blocked.forEach(p => { const px = bx + p[1], top = p[2] === "u", y0 = top ? by : by + VB, y1 = top ? by + 9 : by + VB - 9;
      g += `<path d="M${px} ${y0}V${y1}M${px-5} ${y1}H${px+5}" ${thin}/>`; });
  }
  const el = x + 30 + shift, er = x + 30 + V.n * VB + shift, cy = y + 30, al = o.al || "mag", ar = o.ar || (o.k === "v53" ? "mag" : "feder");
  g += actuator(al, el, cy, -1) + actuator(ar, er, cy, 1);
  if (o.k === "v53") g += actuator("feder", el - actW(al), cy, -1) + actuator("feder", er + actW(ar), cy, 1);
  if (al === "mag" || al === "magp") g += PN(el - actW(al) / 2, y + 17, "14", "middle");
  if (ar === "mag" || ar === "magp") g += PN(er + actW(ar) / 2, y + 17, "12", "middle");
  const rx = x + 30 + V.rest * VB;
  V.ports.forEach(([n, dx, d]) => { const px = rx + dx; g += d === "u" ? PP(`M${px} ${y}V${y+10}`) + PN(px + 3, y + 7, n) : PP(`M${px} ${y+50}V${y+60}`) + PN(px + 3, y + 59, n); });
  const lx = Math.min(el - actW(al) - (o.k === "v53" ? 22 : 0), x + 30) - 4;
  return g + LB(lx, y + 34, o.v);
}
export function cylinder(o, single){
  const x = o.x, y = o.y, p = posOf(o), px = x + 16 + p * 88, f = n => n.toFixed(1);
  let s = "";
  if (simOn()) { if (pressed(o, "A")) s += `<rect x="${x+3}" y="${y+13}" width="${f(px - x - 3)}" height="24" fill="${BLUE}" fill-opacity=".2"/>`;
    if (!single && pressed(o, "B")) s += `<rect x="${f(px)}" y="${y+13}" width="${f(x + 117 - px)}" height="24" fill="${BLUE}" fill-opacity=".2"/>`; }
  s += `<rect x="${x}" y="${y+10}" width="120" height="30" fill="none" stroke="${INK}" stroke-width="1.6"/>`;
  s += `<rect x="${f(px - 2)}" y="${y+11}" width="4" height="28" fill="${INK}"/>`;                                     // Kolben
  if (o.mk === "ja") s += `<rect x="${f(px - 7)}" y="${y+13}" width="3" height="24" fill="${INK}"/>`;                       // Magnetkolben
  if (!single && o.dp) { const cu = (cx, d) => `<rect x="${cx}" y="${y+19}" width="7" height="12" fill="#fff" ${thin}/>` + (o.dp === "einst" ? `<path d="M${cx-4} ${y+34}L${cx+11} ${y+16}" ${thin}/>` + arrowHead(cx-4, y+34, cx+11.5, y+15.5, 4.5) : "");
    s += cu(x + 3, 1) + cu(x + 108, -1); }                                                                                   // Endlagendämpfung
  s += `<path d="M${f(px)} ${y+22}H${f(px + 112)}V${y+28}H${f(px)}" fill="#fff" stroke="${INK}" stroke-width="1.4"/>`;   // Kolbenstange
  s += `<rect x="${x+118}" y="${y+20}" width="4" height="10" fill="${INK}"/>`;                                            // Stangendichtung
  if (single) { const a = px + 5, b = x + 116, n = 7, st = (b - a) / n; let z = `M${f(a)} ${y+25}`;
    for (let i = 1; i < n; i++) z += `L${f(a + st*i)} ${i % 2 ? y+15 : y+35}`; s += `<path d="${z}L${f(b)} ${y+25}" ${thin}/>`;
    s += `<path d="M${x+110} ${y+40}V${y+46}M${x+106} ${y+46}H${x+114}" ${thin}/>`; }                                    // Entlüftung Federraum
  s += PP(`M${x+10} ${y+40}V${y+60}`) + PN(x + 13, y + 57, "A");
  if (!single) s += PP(`M${x+110} ${y+40}V${y+60}`) + PN(x + 113, y + 57, "B");
  const sens = (sx, t, on) => t ? `<path d="M${sx} ${y+10}V${y+4}" ${thin}/><rect x="${sx-6}" y="${y-4}" width="12" height="8" rx="1.5" fill="${on ? "#2E7D4F" : "#fff"}" ${thin}/>` + PN(sx, y - 7, t, "middle") : "";
  s += sens(x + 16, o.s1, simOn() && p < .02) + sens(x + 104, o.s2, simOn() && p > .98);
  return s + LB(x - 6, y + 30, o.v);
}
/* Drehen (o.rot = 0/90/180/270) und Spiegeln (o.flip) um die Bauteilmitte – Schrift bleibt aufrecht */
export const DIRV = {u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0]};
export function xform(o){
  const pc = PC[o.k]; if (!pc || o.k === "rail") return null;
  const r = (((o.rot || 0) % 360) + 360) % 360, f = o.flip ? -1 : 1; if (!r && f === 1) return null;
  const x0 = o.x + (pc.bx || 0), cx = x0 + pc.w / 2, cy = o.y + pc.h / 2, c = Math.round(Math.cos(r * Math.PI / 180)), sn = Math.round(Math.sin(r * Math.PI / 180));
  const pt = (x, y) => { const dx = (x - cx) * f, dy = y - cy; return [cx + dx*c - dy*sn, cy + dx*sn + dy*c]; };
  const dir = d => { const [vx, vy] = DIRV[d], ux = vx * f, wx = ux*c - vy*sn, wy = ux*sn + vy*c; return wx > .5 ? "r" : wx < -.5 ? "l" : wy > .5 ? "d" : "u"; };
  return {r, f, c, cx, cy, x0, pt, dir};
}
export function portsOf(o){
  if (!o) return [];
  const P = PC[o.k] ? PC[o.k].ports : PORTS2[o.k];
  if (!P) return [];
  const X = xform(o);
  return (typeof P === "function" ? P(o) : P).map(([n, dx, dy, d]) => { if (!X) return {n, x: o.x + dx, y: o.y + dy, d}; const [x, y] = X.pt(o.x + dx, o.y + dy); return {n, x: Math.round(x), y: Math.round(y), d: X.dir(d)}; });
}
export const portCap = o => !!o && (o.k === "rail" || portsOf(o).length > 0);
export function nearestPort(o, pt){ if (o.k === "rail") return "~"; let b = null; for (const p of portsOf(o)) { const d = Math.hypot(p.x - pt[0], p.y - pt[1]); if (!b || d < b.d) b = {n: p.n, d}; } return b ? b.n : null; }
export function vrails(key, n){ const r = []; (VRAIL[key] || []).forEach(([v, y, x, w]) => { for (let i = 0; i < n; i++) r.push({id: `_${v}@${i}`, k: "rail", v, x, y: y + i*PH, w, virt: true}); }); return r; }
export function wireD(a, b){
  if ((a.d === "u" || a.d === "d") && (b.d === "u" || b.d === "d") && Math.abs(a.x - b.x) < 1) return `M${a.x} ${a.y}V${b.y}`;
  const st = 14, ext = p => [p.x + (p.d === "r" ? st : p.d === "l" ? -st : 0), p.y + (p.d === "d" ? st : p.d === "u" ? -st : 0)];
  const A = ext(a), B = ext(b), va = a.d === "u" || a.d === "d", vb = b.d === "u" || b.d === "d";
  let mid;
  if (va && vb) { const my = Math.round((A[1] + B[1]) / 20) * 10 + (Math.round(a.x / 20) % 4) * 10 - 10; mid = [[A[0], my], [B[0], my]]; }   // je Anschluss eigene Querhöhe: verschiedene Potenziale liegen nie übereinander
  else if (!va && !vb) { const mx = Math.round((A[0] + B[0]) / 20) * 10 + (Math.round(a.y / 20) % 4) * 10 - 10; mid = [[mx, A[1]], [mx, B[1]]]; }
  else if (va) mid = [[A[0], B[1]]]; else mid = [[B[0], A[1]]];
  return "M" + [[a.x, a.y], A, ...mid, B, [b.x, b.y]].map(p => p.join(" ")).join("L");
}
export function wireEnds(c, objs){
  const A = objs[c.a], B = objs[c.b]; if (!A || !B) return null;
  const pa = A.k === "rail" ? null : portsOf(A).find(p => p.n === c.pa), pb = B.k === "rail" ? null : portsOf(B).find(p => p.n === c.pb);
  if ((!pa && A.k !== "rail") || (!pb && B.k !== "rail") || (!pa && !pb)) return null;
  const onRail = (r, p) => ({x: clamp(p.x, r.x, r.x + (r.w || 400)), y: r.y, d: p.y > r.y ? "d" : "u", rail: true});
  return [pa || onRail(A, pb), pb || onRail(B, pa)];
}
