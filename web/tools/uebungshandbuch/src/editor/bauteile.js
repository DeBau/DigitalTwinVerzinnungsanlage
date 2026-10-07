// Editor-Kern: Hilfen für Bauteile mit Anschlüssen (bauteil: true): Strichstile, Drehen und Spiegeln, Anschlüsse,
// Potenzialschienen, Leitungsführung, Zustand der Simulation. Benutzt von den Vorlagen und vom Zeichnen.
import { INK, PH, SVGT, clamp } from './svg.js';
import { ED } from './status.js';
import { art, bauteil, vorlage } from './registry.js';

// Strichstile und Beschriftungen der Bauteilsymbole: Pfad, gestrichelt, Kennzeichen, Anschlussname
export const SK = `stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
export const PP = d => `<path d="${d}" ${SK}/>`;
export const PD = d => `<path d="${d}" ${SK} stroke-dasharray="3 2.5"/>`;
export const LB = (x, y, t, a="end") => t ? SVGT(x, y, t, a, 12, 600) : "";
export const PN = (x, y, t, a="start") => SVGT(x, y, t, a, 8.5, 500, "#5A6672");
export const BLUE = "#2F80ED";
// Simulation (siehe vorlagen/pneumatik-simulation.js): läuft sie, und führt Anschluss p von o Druck?
export const simOn = () => typeof ED !== "undefined" && ED.sim && ED.sim.on;
export const pressed = (o, p) => simOn() && ED.sim.P && ED.sim.P.has(o.id + ":" + p);

/* Drehen (o.rot = 0/90/180/270) und Spiegeln (o.flip) um die Bauteilmitte – Schrift bleibt aufrecht */
export const DIRV = {u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0]};
// Drehung und Spiegelung eines Bauteils; null, wenn es ungedreht ist oder nicht drehbar (drehbar: false).
// pt bildet einen Punkt ab, dir eine Anschlussrichtung.
export function drehung(o){
  const pc = bauteil(o.k);
  if (!pc || pc.drehbar === false) return null;
  const r = (((o.rot || 0) % 360) + 360) % 360, f = o.flip ? -1 : 1;
  if (!r && f === 1) return null;
  const x0 = o.x + (pc.bx || 0), cx = x0 + pc.w / 2, cy = o.y + pc.h / 2;
  const c = Math.round(Math.cos(r * Math.PI / 180)), sn = Math.round(Math.sin(r * Math.PI / 180));
  const pt = (x, y) => { const dx = (x - cx) * f, dy = y - cy; return [cx + dx*c - dy*sn, cy + dx*sn + dy*c]; };
  const dir = d => {
    const [vx, vy] = DIRV[d], ux = vx * f, wx = ux*c - vy*sn, wy = ux*sn + vy*c;
    return wx > .5 ? "r" : wx < -.5 ? "l" : wy > .5 ? "d" : "u";
  };
  return {r, f, c, cx, cy, x0, pt, dir};
}
// Anschlüsse eines Objekts als [{n, x, y, d}] auf dem Blatt, gedreht wie das Bauteil (Haken anschluesse)
export function portsOf(o){
  if (!o) return [];
  const P = art(o.k).anschluesse;
  if (!P) return [];
  const X = drehung(o);
  return (typeof P === "function" ? P(o) : P).map(([n, dx, dy, d]) => {
    if (!X) return {n, x: o.x + dx, y: o.y + dy, d};
    const [x, y] = X.pt(o.x + dx, o.y + dy);
    return {n, x: Math.round(x), y: Math.round(y), d: X.dir(d)};
  });
}
// Potenzialschiene (Bauteil mit schiene: true): Leitungen docken an beliebiger Stelle an, Anschlussname „~“
export const istSchiene = o => !!(o && art(o.k).schiene);
export const portCap = o => !!o && (istSchiene(o) || portsOf(o).length > 0);
// Name des Anschlusses von o, der pt am nächsten liegt
export function nearestPort(o, pt){
  if (istSchiene(o)) return "~";
  let b = null;
  for (const p of portsOf(o)) { const d = Math.hypot(p.x - pt[0], p.y - pt[1]); if (!b || d < b.d) b = {n: p.n, d}; }
  return b ? b.n : null;
}
// Virtuelle Schienen der Vorlage (Haken schienen) auf jedem Blatt. Sie sind Objekte der Bauteilart rail aus vorlagen/leistung.js.
// Offener Sonderfall: Der Kern kennt hier die Bauteilart "rail" beim Namen (siehe src/README.md).
export function virtuelleSchienen(key, n){
  const r = [];
  (vorlage(key).schienen || []).forEach(([v, y, x, w]) => {
    for (let i = 0; i < n; i++) r.push({id: `_${v}@${i}`, k: "rail", v, x, y: y + i*PH, w, virt: true});
  });
  return r;
}
// Leitungsweg zwischen zwei Anschlüssen: erst 14 in Anschlussrichtung hinaus, dann rechtwinklig verbinden.
// spuren (spuren.js) ist die Spurbelegung der Zeichnung, noch unbenutzt.
export function wireD(a, b, spuren){
  if ((a.d === "u" || a.d === "d") && (b.d === "u" || b.d === "d") && Math.abs(a.x - b.x) < 1) return `M${a.x} ${a.y}V${b.y}`;
  const A = versetzt(a, 14), B = versetzt(b, 14), va = a.d === "u" || a.d === "d", vb = b.d === "u" || b.d === "d";
  let mid;
  // je Anschluss eigene Querhöhe bzw. Querlage: verschiedene Potenziale liegen nie übereinander
  const quer = (u, v, lage) => Math.round((u + v) / 20) * 10 + (Math.round(lage / 20) % 4) * 10 - 10;
  if (va && vb) { const my = quer(A[1], B[1], a.x); mid = [[A[0], my], [B[0], my]]; }
  else if (!va && !vb) { const mx = quer(A[0], B[0], a.y); mid = [[mx, A[1]], [mx, B[1]]]; }
  else if (va) mid = [[A[0], B[1]]]; else mid = [[B[0], A[1]]];
  return "M" + [[a.x, a.y], A, ...mid, B, [b.x, b.y]].map(p => p.join(" ")).join("L");
}
// Punkt n weiter in Richtung q.d des Anschlusses q
export function versetzt(q, n){
  const [dx, dy] = DIRV[q.d] || [0, 0];
  return [q.x + dx * n, q.y + dy * n];
}
// Endpunkte einer Leitung c; auf einer Schiene liegt das Ende senkrecht über bzw. unter dem Gegenanschluss
export function wireEnds(c, objs){
  const A = objs[c.a], B = objs[c.b]; if (!A || !B) return null;
  const sA = istSchiene(A), sB = istSchiene(B);
  const pa = sA ? null : portsOf(A).find(p => p.n === c.pa), pb = sB ? null : portsOf(B).find(p => p.n === c.pb);
  if ((!pa && !sA) || (!pb && !sB) || (!pa && !pb)) return null;
  const onRail = (r, p) => ({x: clamp(p.x, r.x, r.x + (r.w || 400)), y: r.y, d: p.y > r.y ? "d" : "u", rail: true});
  return [pa || onRail(A, pb), pb || onRail(B, pa)];
}
