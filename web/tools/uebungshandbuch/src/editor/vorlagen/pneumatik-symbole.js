// Pneumatik-Symbole nach ISO 1219: Wegeventile mit Betätigungen, Zylinder, Entlüftungsdreiecke.
// Benutzt von vorlagen/pneumatik.js (Bauteile) und pneumatik-simulation.js (Schaltstellungen).
import { INK, SVGT, arrowHead } from '../svg.js';
import { ED } from '../status.js';
import { BLUE, DIRV, LB, PN, PP, SK, portsOf, pressed, simOn } from '../bauteile.js';

// Stellung von Kolben bzw. Schwenkantrieb (0 bis 1) und Schaltstellung eines Ventils, solange die Simulation läuft
export const posOf = o => simOn() && ED.sim.pos[o.id] !== undefined ? ED.sim.pos[o.id] : 0;
export const vstate = o => simOn() && ED.sim.st[o.id] || VALVE[o.k].grund;

/* ---------- Wegeventile ---------- */
// Quadratische Schaltstellungen VB × VB, Anschlüsse im 10er-Raster: [Name, x im Kästchen, u oben / d unten].
// kaesten: Schaltstellung je Kästchen von links; grund: Grundstellung; wege: verbundene Anschlüsse je Schaltstellung.
// Stromlos offene Ventile (gs: "no") tauschen act und rest.
export const VB = 40;
const P5 = [["4", 10, "u"], ["2", 30, "u"], ["5", 10, "d"], ["1", 20, "d"], ["3", 30, "d"]];
export const VALVE = {
  v22: {kaesten: ["act", "rest"], grund: "rest", ports: [["2", 20, "u"], ["1", 20, "d"]],
    wege: {act: [["1", "2"]], rest: []}},
  v32: {kaesten: ["act", "rest"], grund: "rest", ports: [["2", 20, "u"], ["1", 10, "d"], ["3", 30, "d"]],
    wege: {act: [["1", "2"]], rest: [["2", "3"]]}},
  v52: {kaesten: ["act", "rest"], grund: "rest", ports: P5,
    wege: {act: [["1", "4"], ["2", "3"]], rest: [["1", "2"], ["4", "5"]]}},
  v53: {kaesten: ["act", "center", "b"], grund: "center", ports: P5,
    wege: {act: [["1", "4"], ["2", "3"]], center: [], b: [["1", "2"], ["4", "5"]]}},
};
export const GEGENSTELLUNG = {act: "rest", rest: "act"};
// Verbundene Anschlüsse von Ventil o in Schaltstellung s
export function vPairs(o, s){
  const no = o.gs === "no" && GEGENSTELLUNG[s];
  return VALVE[o.k].wege[no || s] || [];
}
// Schaltstellung, die die Betätigung rechts herstellt (5/3: b, sonst Grundstellung rest)
export const rechteStellung = o => o.k === "v53" ? "b" : "rest";
// Steueranschluss nach ISO 11727: 1 und der Anschluss, mit dem 1 in dieser Stellung verbunden ist; 10, wenn 1 sperrt
export function steuerNr(o, s){
  const weg = vPairs(o, s).find(p => p.includes("1"));
  return weg ? "1" + weg.find(n => n !== "1") : "10";
}
// Durchflusswege (Pfeil vom Druck- bzw. Arbeitsanschluss weg) und Sperren des Kästchens i
export function vBox(o, i){
  const V = VALVE[o.k], at = n => V.ports.find(p => p[0] === n), pairs = vPairs(o, V.kaesten[i]);
  const used = new Set(pairs.flat()), ablass = n => n === "3" || n === "5";
  const dir = ([a, b]) => a === "1" || ablass(b) ? [at(a), at(b)] : [at(b), at(a)];
  return {flows: pairs.map(dir), blocked: V.ports.filter(p => !used.has(p[0]))};
}
export const thin = `stroke="${INK}" stroke-width="1.3" fill="none" stroke-linecap="round"`;
// Betätigungen: Breite w und Symbol an der Außenkante ex, X(d) = Punkt d nach außen
export const BETAETIGUNG = {
  feder: {w: 22, zeichne: (X, ex, cy) => `<path d="M${ex} ${cy}`
    + [3, 7, 11, 15, 19].map((d, i) => `L${X(d)} ${cy + (i % 2 ? 7 : -7)}`).join("")
    + `L${X(22)} ${cy}" ${thin}/>`},
  taster: {w: 18, zeichne: (X, ex, cy, dir) => `<path d="M${ex} ${cy}H${X(14)}M${X(14)} ${cy-8}V${cy+8}" ${thin}/>`
    + `<path d="M${X(14)} ${cy-8}A8 8 0 0 ${dir < 0 ? 0 : 1} ${X(14)} ${cy+8}" ${thin}/>`},
  hebel: {w: 18, zeichne: (X, ex, cy) => `<path d="M${ex} ${cy}H${X(6)}L${X(16)} ${cy-12}" ${thin}/>`
    + `<circle cx="${X(17.5)}" cy="${cy-14}" r="2.8" fill="${INK}"/>`},
  mag: {w: 12, spule: true, zeichne: (X, ex, cy) => magnet(Math.min(ex, X(12)), cy)},
  magp: {w: 24, spule: true, zeichne: (X, ex, cy) => magnet(Math.min(ex, X(12)), cy)
    + `<rect x="${Math.min(X(12), X(24))}" y="${cy-9}" width="12" height="18" fill="#fff" ${thin}/>`
    + `<path d="M${X(14)} ${cy}L${X(22)} ${cy-5}V${cy+5}Z" fill="${INK}"/>`},
};
const magnet = (x0, cy) => `<rect x="${x0}" y="${cy-9}" width="12" height="18" fill="#fff" ${thin}/>`
  + `<path d="M${x0} ${cy+9}L${x0+12} ${cy-9}" ${thin}/>`;
// Betätigung kind an der Außenkante ex, dir −1 links, +1 rechts
export const actuator = (kind, ex, cy, dir) => BETAETIGUNG[kind].zeichne(d => ex + dir * d, ex, cy, dir);
export const actW = k => BETAETIGUNG[k].w;
export const istSpule = k => !!BETAETIGUNG[k].spule;
// Betätigung links und rechts, Vorgabe Magnet links, rechts Feder (5/3: Magnet)
export const betaetigung = o => ({al: o.al || "mag", ar: o.ar || (o.k === "v53" ? "mag" : "feder")});

export function drawValve(o){
  const V = VALVE[o.k], n = V.kaesten.length, s = vstate(o), shift = (V.kaesten.indexOf(V.grund) - V.kaesten.indexOf(s)) * VB;
  const el = o.x + 30 + shift, er = el + n * VB, {al, ar} = betaetigung(o);
  const lx = Math.min(el - actW(al) - (o.k === "v53" ? 22 : 0), o.x + 30) - 4;
  return V.kaesten.map((_, i) => ventilKasten(o, i, el + i * VB, o.y + 10)).join("")
    + ventilBetaetigung(o, el, er) + ventilAnschluesse(o) + LB(lx, o.y + 34, o.v);
}
// Kästchen i mit Durchflusspfeilen und Sperren, linke obere Ecke (bx, by)
export function ventilKasten(o, i, bx, by){
  const c = vBox(o, i), py = p => p[2] === "u" ? by + 2 : by + VB - 2;
  let g = `<rect x="${bx}" y="${by}" width="${VB}" height="${VB}" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`;
  c.flows.forEach(([p, q]) => {
    g += `<path d="M${bx + p[1]} ${py(p)}L${bx + q[1]} ${py(q)}" ${thin}/>` + arrowHead(bx + p[1], py(p), bx + q[1], py(q));
  });
  c.blocked.forEach(p => {
    const px = bx + p[1], top = p[2] === "u", y0 = top ? by : by + VB, y1 = top ? by + 9 : by + VB - 9;
    g += `<path d="M${px} ${y0}V${y1}M${px-5} ${y1}H${px+5}" ${thin}/>`;
  });
  return g;
}
// Betätigungen links (el) und rechts (er), 5/3 mit Zentrierfedern; Spulen mit Steueranschluss (ISO 11727) und Namen
export function ventilBetaetigung(o, el, er){
  const {al, ar} = betaetigung(o), cy = o.y + 30;
  let g = actuator(al, el, cy, -1) + actuator(ar, er, cy, 1);
  if (o.k === "v53") g += actuator("feder", el - actW(al), cy, -1) + actuator("feder", er + actW(ar), cy, 1);
  if (istSpule(al)) g += spuleText(o, el - actW(al) / 2, steuerNr(o, "act"), o.spl, el - 1, "end");
  if (istSpule(ar)) g += spuleText(o, er + actW(ar) / 2, steuerNr(o, rechteStellung(o)), o.spr, er + 1, "start");
  return g;
}
// Steueranschluss über der Spule (Mitte x), Name der Spule (z. B. −MB3) darunter, von der Kästchenkante xn nach außen
const spuleText = (o, x, nr, name, xn, anker) => PN(x, o.y + 17, nr, "middle")
  + (name ? SVGT(xn, o.y + 53, name, anker, 9.5, 600) : "");
// Anschlussstummel mit Namen am Kästchen der Grundstellung
export function ventilAnschluesse(o){
  const V = VALVE[o.k], rx = o.x + 30 + V.kaesten.indexOf(V.grund) * VB, y = o.y;
  return V.ports.map(([n, dx, d]) => d === "u" ? PP(`M${rx + dx} ${y}V${y+10}`) + PN(rx + dx + 3, y + 7, n)
    : PP(`M${rx + dx} ${y+50}V${y+60}`) + PN(rx + dx + 3, y + 59, n)).join("");
}

/* ---------- Zylinder ---------- */
const eineStelle = n => n.toFixed(1);
export function cylinder(o, single){
  const x = o.x, y = o.y, px = x + 16 + posOf(o) * 88;
  let s = zylinderDruck(o, single, px);
  s += `<rect x="${x}" y="${y+10}" width="120" height="30" fill="none" stroke="${INK}" stroke-width="1.6"/>`;
  s += `<rect x="${eineStelle(px - 2)}" y="${y+11}" width="4" height="28" fill="${INK}"/>`;              // Kolben
  if (o.mk === "ja") s += `<rect x="${eineStelle(px - 7)}" y="${y+13}" width="3" height="24" fill="${INK}"/>`;   // Magnetkolben
  if (!single && o.dp) s += daempfung(o, x + 3) + daempfung(o, x + 108);                         // Endlagendämpfung
  s += `<path d="M${eineStelle(px)} ${y+22}H${eineStelle(px + 112)}V${y+28}H${eineStelle(px)}" fill="#fff" `
    + `stroke="${INK}" stroke-width="1.4"/>`;                                                       // Kolbenstange
  s += `<rect x="${x+118}" y="${y+20}" width="4" height="10" fill="${INK}"/>`;                       // Stangendichtung
  if (single) s += federraum(o, px);
  s += PP(`M${x+10} ${y+40}V${y+60}`) + PN(x + 13, y + 57, "A");
  if (!single) s += PP(`M${x+110} ${y+40}V${y+60}`) + PN(x + 113, y + 57, "B");
  return s + endlagen(o) + LB(x - 6, y + 30, o.v);
}
// Blaue Kammern, solange die Simulation Druck meldet
function zylinderDruck(o, single, px){
  if (!simOn()) return "";
  const x = o.x, y = o.y;
  const kammer = (a, b) => `<rect x="${eineStelle(a)}" y="${y+13}" width="${eineStelle(b - a)}" height="24" fill="${BLUE}" `
    + `fill-opacity=".2"/>`;
  return (pressed(o, "A") ? kammer(x + 3, px) : "") + (!single && pressed(o, "B") ? kammer(px, x + 117) : "");
}
const daempfung = (o, cx) => `<rect x="${cx}" y="${o.y+19}" width="7" height="12" fill="#fff" ${thin}/>`
  + (o.dp === "einst" ? `<path d="M${cx-4} ${o.y+34}L${cx+11} ${o.y+16}" ${thin}/>` + arrowHead(cx-4, o.y+34, cx+11.5, o.y+15.5, 4.5) : "");
// Feder im Stangenraum und Entlüftung des Federraums als offener Anschluss (ohne Sperrstrich)
function federraum(o, px){
  const x = o.x, y = o.y, a = px + 5, b = x + 116, n = 7, st = (b - a) / n;
  let z = `M${eineStelle(a)} ${y+25}`;
  for (let i = 1; i < n; i++) z += `L${eineStelle(a + st*i)} ${i % 2 ? y+15 : y+35}`;
  return `<path d="${z}L${eineStelle(b)} ${y+25}" ${thin}/>` + PP(`M${x+110} ${y+40}V${y+48}`);
}
// Endlagensensoren s1 (hinten, Stellung 0) und s2 (vorn, Stellung 1) bei x + xa und x + xb; grün, wenn der Antrieb dort steht
export function endlagen(o, xa = 16, xb = 104){
  const p = posOf(o), y = o.y;
  const sens = (sx, t, on) => t ? `<path d="M${sx} ${y+10}V${y+4}" ${thin}/><rect x="${sx-6}" y="${y-4}" width="12" height="8" rx="1.5" `
    + `fill="${on ? "#2E7D4F" : "#fff"}" ${thin}/>` + PN(sx, y - 7, t, "middle") : "";
  return sens(o.x + xa, o.s1, simOn() && p < .02) + sens(o.x + xb, o.s2, simOn() && p > .98);
}
// Freie Entlüftungen 3 und 5 eines Wegeventils bekommen ihr Dreieck (Haken zusatz; belegt(n): Anschluss n ist verdrahtet)
export function entlueftung(o, belegt){
  return portsOf(o).map(q => {
    if ((q.n !== "3" && q.n !== "5") || belegt(q.n)) return "";
    const [dx, dy] = DIRV[q.d];
    return `<path d="M${q.x} ${q.y}L${q.x + dx*9 - dy*5} ${q.y + dy*9 - dx*5}L${q.x + dx*9 + dy*5} ${q.y + dy*9 + dx*5}Z" ${SK}/>`;
  }).join("");
}
