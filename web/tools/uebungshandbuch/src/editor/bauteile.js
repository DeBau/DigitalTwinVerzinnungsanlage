// Editor-Kern: Hilfen für Bauteile mit Anschlüssen (bauteil: true): Strichstile, Drehen und Spiegeln, Anschlüsse,
// Potenzialschienen, Leitungsführung, Zustand der Simulation. Benutzt von den Vorlagen und vom Zeichnen.
import { esc } from '../app/basis.js';
import { INK, PH, SVGT, clamp } from './svg.js';
import { ED } from './status.js';
import { art, bauteil, vorlage } from './registry.js';
import { pfadD } from './spuren.js';

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
// pt bildet einen Punkt ab, zurueck rechnet einen Blattpunkt in die ungedrehte Lage zurück, dir eine Anschlussrichtung.
export function drehung(o){
  const pc = bauteil(o.k);
  if (!pc || pc.drehbar === false) return null;
  const r = (((o.rot || 0) % 360) + 360) % 360, f = o.flip ? -1 : 1;
  if (!r && f === 1) return null;
  const x0 = o.x + (pc.bx || 0), cx = x0 + pc.w / 2, cy = o.y + pc.h / 2;
  const c = Math.round(Math.cos(r * Math.PI / 180)), sn = Math.round(Math.sin(r * Math.PI / 180));
  const pt = (x, y) => { const dx = (x - cx) * f, dy = y - cy; return [cx + dx*c - dy*sn, cy + dx*sn + dy*c]; };
  const zurueck = (x, y) => { const u = x - cx, v = y - cy; return [cx + (u*c + v*sn) * f, cy - u*sn + v*c]; };
  const dir = d => {
    const [vx, vy] = DIRV[d], ux = vx * f, wx = ux*c - vy*sn, wy = ux*sn + vy*c;
    return wx > .5 ? "r" : wx < -.5 ? "l" : wy > .5 ? "d" : "u";
  };
  return {r, f, c, cx, cy, x0, pt, zurueck, dir};
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
// spuren (spuren.js) ist die Spurbelegung der Zeichnung: Das Querstück weicht auf eine freie Spur aus, damit Leitungen
// verschiedener Netze nie deckungsgleich liegen. Netz ist der Startanschluss a (seine Lage auf dem Blatt).
export function wireD(a, b, spuren){
  const punkte = ohneGeradePunkte([[a.x, a.y], ...leitungsKnicke(a, b), [b.x, b.y]]);
  return pfadD(spuren ? spuren.knick(punkte, `${a.x},${a.y}`) : punkte);
}
// Textanker auf der Gegenseite (gespiegelte Schrift)
export const ANKER_SPIEGEL = {start: "end", end: "start", middle: "middle"};
const ANTEIL_LINKS = {start: 0, middle: .5, end: 1};   // Anteil der Textbreite links vom Anker
// Kennzeichen (Text o.v) aller Bauteile in objs als gesperrte Flächen in spuren melden: Leitungen laufen nicht hindurch.
export function kennzeichenSperren(spuren, objs){
  Object.values(objs).forEach(o => { const r = kennzeichenFlaeche(o); if (r) spuren.sperre(...r); });
}
// Anschlüsse aller Bauteile in objs als kleine gesperrte Flächen: Querstücke laufen nicht über fremde Klemmen.
// Das erste und das letzte Stück einer Leitung hängen am Anschluss und bleiben (knickeWeg in spuren.js).
export function anschlussSperren(spuren, objs){
  Object.values(objs).filter(o => !istSchiene(o)).forEach(o => portsOf(o).forEach(p => spuren.sperre(p.x - 4, p.y - 4, 8, 8)));
}
// Rechteck [x, y, w, h] um das Kennzeichen von o. Ort und Anker liest es aus dem gezeichneten Symbol (Haken zeichne),
// gedreht wie das Bauteil; die Schrift bleibt aufrecht. null, wenn o kein Kennzeichen zeichnet.
export function kennzeichenFlaeche(o){
  const b = bauteil(o.k), text = `>${esc(o.v)}</text>`;
  const svg = b && b.zeichne && o.v ? b.zeichne(o, false) : "", ende = svg.indexOf(text);
  if (ende < 0) return null;
  const m = /<text x="([-\d.]+)" y="([-\d.]+)" text-anchor="(\w+)"/.exec(svg.slice(svg.lastIndexOf("<text", ende)));
  if (!m) return null;
  const X = drehung(o), [x, y] = X ? X.pt(+m[1], +m[2]) : [+m[1], +m[2]], w = String(o.v).length * 7 + 2;
  const anker = X && X.f * X.c < 0 ? ANKER_SPIEGEL[m[3]] : m[3];   // wie gedreht() in zeichnen.js
  return [x - w * ANTEIL_LINKS[anker], y - 10, w, 13];
}
const senkrecht = q => q.d === "u" || q.d === "d";
// Innere Eckpunkte der Leitung von a nach b, Querstück auf halbem Weg im 10er-Raster
export function leitungsKnicke(a, b){
  if (senkrecht(a) && senkrecht(b) && Math.abs(a.x - b.x) < 1) return [];
  const A = versetzt(a, 14), B = versetzt(b, 14), mitte = (u, v) => Math.round((u + v) / 20) * 10;
  if (senkrecht(a) && senkrecht(b)) { const my = mitte(A[1], B[1]); return [A, [A[0], my], [B[0], my], B]; }
  if (!senkrecht(a) && !senkrecht(b)) { const mx = mitte(A[0], B[0]); return [A, [mx, A[1]], [mx, B[1]], B]; }
  return [A, senkrecht(a) ? [A[0], B[1]] : [B[0], A[1]], B];
}
// Punkte, die auf einer Geraden zwischen ihren Nachbarn liegen (oder doppelt sind), fallen weg
export function ohneGeradePunkte(p){
  const gerade = (a, m, b) => (Math.abs(a[0] - m[0]) < .5 && Math.abs(m[0] - b[0]) < .5)
    || (Math.abs(a[1] - m[1]) < .5 && Math.abs(m[1] - b[1]) < .5);
  return p.filter((m, i) => i === 0 || i === p.length - 1 || !gerade(p[i - 1], m, p[i + 1]));
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
  const e = [pa || onRail(A, pb), pb || onRail(B, pa)];
  if (art(A.k).g === "elektro" && art(B.k).g === "elektro") querUeber(e[0], e[1]);
  return e;
}
// Querverbindung im Strompfad: Zwischen zwei senkrechten Anschlüssen nebeneinander läuft die Leitung waagrecht über
// den Anschluss (gleiche Höhe: beide; sonst der obere, wenn er nach unten zeigt, bzw. der untere nach oben)
export function querUeber(p, q){
  if (Math.abs(p.x - q.x) < 1 || !senkrecht(p) || !senkrecht(q)) return;
  const zu = (a, b) => { a.d = b.x > a.x ? "r" : "l"; };
  if (Math.abs(p.y - q.y) < 1) { zu(p, q); zu(q, p); return; }
  const [oben, unten] = p.y < q.y ? [p, q] : [q, p];
  if (oben.d === "d") zu(oben, unten); else if (unten.d === "u") zu(unten, oben);
}
