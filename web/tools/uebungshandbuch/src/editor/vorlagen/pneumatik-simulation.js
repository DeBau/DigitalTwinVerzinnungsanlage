// Pneumatik-Simulation: Druck von den Quellen über Leitungen und Ventile verteilen, Entlüftung zu den freien Anschlüssen
// 3 und 5 und den Schalldämpfern, Zylinder fahren lassen, Ventile per Klick schalten. Die Bauteile beschreiben ihr Verhalten
// im Haken sim(o, stellung, hatDruck, belegt) → {src, pairs, dir, ablass} und Drosseln im Haken drossel(o) → {frei, f}.
// Ein Antrieb bewegt sich nur, wenn eine Kammer Druck hat und die andere entlüften kann; eingeschlossene Luft (z. B. 5/3
// Mitte gesperrt) hält den Druck. Die Hubzeit hängt von den Drosseln an den Kammern ab. Benutzt von vorlagen/pneumatik.js.
import { ED } from '../status.js';
import { art, bauteil } from '../registry.js';
import { drehung, simOn } from '../bauteile.js';
import { clearSel, objById } from '../auswahl.js';
import { zeichnungSVG } from '../zeichnen.js';
import { ANTRIEB_ARTEN, VALVE, vstate } from './pneumatik-symbole.js';
import { istBistabil, simStatusZeigen, wegZeitMerken } from './pneumatik-simstatus.js';

export const HUBZEIT = 1.2;   // Sekunden für einen ganzen Hub ohne Drossel
const knoten = (o, p) => o.id + ":" + p;
// Ungerichteter Graph: Leitungen und die Wege, die die Bauteile in ihrer Stellung öffnen
function simGraph(d){
  const adj = new Map(), add = (a, b) => { for (const [x, y] of [[a, b], [b, a]]) (adj.get(x) || adj.set(x, []).get(x)).push(y); };
  d.c.forEach(c => { if (c.pa !== undefined && c.pb !== undefined) add(c.a + ":" + c.pa, c.b + ":" + c.pb); });
  const roots = [];
  simTeile(d).forEach(([o, r]) => {
    (r.pairs || []).forEach(([p, q]) => add(knoten(o, p), knoten(o, q)));
    (r.src || []).forEach(p => roots.push(knoten(o, p)));
  });
  return {adj, roots};
}
// Bauteile mit Haken sim und ihr Ergebnis; hat(o, p) sagt, ob Anschluss p Druck hat
function simTeile(d, hat = () => false){
  const belegt = new Set(d.c.flatMap(c => [c.a + ":" + c.pa, c.b + ":" + c.pb]));
  return d.o.filter(o => art(o.k).sim)
    .map(o => [o, art(o.k).sim(o, ED.sim.st[o.id], p => hat(o, p), p => belegt.has(knoten(o, p)))]);
}
// Alle Knoten, die von start aus über adj und die gerichteten Wege dir erreichbar sind
function erreichbar(start, adj, dir = new Map()){
  const N = new Set(), st = [...start];
  while (st.length) {
    const n = st.pop();
    if (N.has(n)) continue;
    N.add(n); st.push(...(adj.get(n) || []), ...(dir.get(n) || []));
  }
  return N;
}
// Druck P und Entlüftung E neu berechnen. Gerichtete Wege hängen vom Druck ab: wiederholen, bis sich nichts mehr ändert.
export function simCompute(){
  const d = ED.data, {adj, roots} = simGraph(d), alt = ED.sim.P || new Set();
  let P = new Set(), ablass = [];
  for (let pass = 0; pass < 8; pass++) {
    const dir = new Map(), hat = (o, p) => P.has(knoten(o, p));
    ablass = [];
    simTeile(d, hat).forEach(([o, r]) => {
      (r.dir || []).forEach(([p, q]) => (dir.get(knoten(o, p)) || dir.set(knoten(o, p), []).get(knoten(o, p))).push(knoten(o, q)));
      (r.ablass || []).forEach(p => ablass.push(knoten(o, p)));
    });
    const N = erreichbar(roots, adj, dir), gleich = N.size === P.size && [...N].every(n => P.has(n));
    P = N;
    if (gleich) break;
  }
  const E = erreichbar(ablass, adj);
  alt.forEach(n => { if (!E.has(n)) P.add(n); });   // eingeschlossene Luft hält den Druck
  Object.assign(ED.sim, {P, E, netz: leitungsNetze(d)});
}
// Leitungsnetz je Anschluss: alle Anschlüsse, die nur über Leitungen (ohne Bauteile) verbunden sind
export function leitungsNetze(d){
  const adj = new Map(), add = (a, b) => (adj.get(a) || adj.set(a, []).get(a)).push(b);
  d.c.forEach(c => {
    if (c.pa === undefined || c.pb === undefined) return;
    add(c.a + ":" + c.pa, c.b + ":" + c.pb); add(c.b + ":" + c.pb, c.a + ":" + c.pa);
  });
  const netz = new Map();
  adj.forEach((_, n) => { if (!netz.has(n)) { const N = [...erreichbar([n], adj)]; N.forEach(m => netz.set(m, N)); } });
  return netz;
}
export const hatDruck = (o, p) => ED.sim.P.has(knoten(o, p));
export const entlueftet = (o, p) => ED.sim.E.has(knoten(o, p)) && !hatDruck(o, p);
// Geschwindigkeitsfaktor der Drosseln am Anschluss p: fuellen = Luft strömt zur Kammer, sonst von ihr weg
export function drosselFaktor(o, p, fuellen){
  return (ED.sim.netz.get(knoten(o, p)) || []).reduce((f, n) => {
    const [id, q] = n.split(":"), dr = objById(id), h = dr && art(dr.k).drossel;
    if (!h) return f;
    const {frei, f: g} = h(dr), gedrosselt = !frei || (q === frei) !== fuellen;   // frei = Anschluss, zu dem Luft frei strömt
    return gedrosselt ? Math.min(f, g) : f;
  }, 1);
}
// Richtung (+1 aus, −1 ein, 0 steht) und Geschwindigkeitsfaktor eines Antriebs
export function bewegung(o){
  const feder = !bauteil(o.k).anschluesse.some(a => a[0] === "B");
  const A = hatDruck(o, "A"), entB = feder || entlueftet(o, "B");
  if (A && entB) return [1, Math.min(drosselFaktor(o, "A", true), feder ? 1 : drosselFaktor(o, "B", false))];
  if (feder ? entlueftet(o, "A") : hatDruck(o, "B") && entlueftet(o, "A")) {
    return [-1, Math.min(drosselFaktor(o, "A", false), feder ? 1 : drosselFaktor(o, "B", true))];
  }
  return [0, 0];
}
export function simStep(t){
  if (!simOn()) return;
  const dt = Math.min(.05, (t - (ED.sim.t || t)) / 1000);
  ED.sim.t = t;
  let moving = false;
  ED.data.o.filter(o => ANTRIEB_ARTEN.includes(o.k)).forEach(o => {
    const [r, f] = bewegung(o), p = ED.sim.pos[o.id] || 0, np = Math.max(0, Math.min(1, p + r * f * dt / HUBZEIT));
    if (np !== p) { ED.sim.pos[o.id] = np; moving = true; }
  });
  if (moving) neuZeichnen();
  wegZeitMerken(t);
  requestAnimationFrame(simStep);
}
export function neuZeichnen(){
  if (ED.svg) ED.svg.querySelector(".ink").innerHTML = zeichnungSVG(ED.data, true, ED.key);
  simStatusZeigen();
}
// Klick auf ein Bauteil in der Simulation: Kugelhahn auf/zu, Wegeventil links bzw. rechts betätigen.
// Ein Taster wirkt tastend: Er schaltet beim Drücken und fällt beim Loslassen zurück. Beim bistabilen Ventil ist die
// Spule nur 1, solange die Maustaste gedrückt ist (Impuls, ED.sim.impuls); die Stellung bleibt danach.
export function simClick(o, pt){
  if (o.k === "kh") ED.sim.st[o.id] = (ED.sim.st[o.id] || o.zu || "auf") === "auf" ? "zu" : "auf";
  else if (VALVE[o.k]) {
    const links = linkeSeite(o, pt);
    ED.sim.st[o.id] = neueStellung(o, links);
    if (links && o.al === "taster") addEventListener("pointerup", () => tasterLos(o), {once: true});
    if (istBistabil(o)) { ED.sim.impuls = {id: o.id, links}; addEventListener("pointerup", impulsEnde, {once: true}); }
  } else return;
  simCompute(); neuZeichnen();
}
function impulsEnde(){
  if (!simOn()) return;
  ED.sim.impuls = null; simStatusZeigen();
}
export function tasterLos(o){
  if (!simOn()) return;
  ED.sim.st[o.id] = VALVE[o.k].grund; simCompute(); neuZeichnen();
}
// Liegt der Blattpunkt pt auf der linken Seite des ungedrehten, ungespiegelten Ventils?
export function linkeSeite(o, pt){
  const X = drehung(o), [x] = X ? X.zurueck(pt[0], pt[1]) : pt, b = bauteil(o.k);
  return x < o.x + (b.bx || 0) + b.w / 2;
}
// Schaltstellung nach einem Klick links (links = true) oder rechts
export function neueStellung(o, links){
  const s = vstate(o), mono = (o.ar || "feder") === "feder";
  if (o.k === "v53") return links ? (s === "act" ? "center" : "act") : (s === "b" ? "center" : "b");
  if (o.al === "taster") return links ? "act" : s;
  if (mono) return links ? (s === "act" ? "rest" : "act") : s;
  return links ? "act" : "rest";
}

// Simulation starten, wenn das Werkzeug gewählt wird, und beim Verlassen beenden
export function simulationWechsel(t){
  if (t === "sim" && !simOn()) {
    clearSel();
    ED.sim = {on: true, st: {}, pos: {}, t: 0, verlauf: []};
    simCompute(); requestAnimationFrame(simStep);
  } else if (t !== "sim" && simOn()) ED.sim = {on: false, st: {}, pos: {}};
}
export function simulationKlick(e, pt){
  if (ED.tool !== "sim") return false;
  const h = e.target.closest("[data-o]");
  if (h) simClick(objById(h.dataset.o), pt);
  return true;
}
