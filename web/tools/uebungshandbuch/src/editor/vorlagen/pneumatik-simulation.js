// Pneumatik-Simulation: Druck von den Quellen über Leitungen und Ventile verteilen, Zylinder fahren lassen,
// Ventile per Klick schalten. Die Bauteile beschreiben ihr Verhalten im Haken sim(o, stellung, hatDruck) ihres Bausteineintrags.
// Benutzt von vorlagen/pneumatik.js (Werkzeug „Simulation“).
import { ED } from '../status.js';
import { art, bauteil } from '../registry.js';
import { drehung, pressed, simOn } from '../bauteile.js';
import { clearSel, objById } from '../auswahl.js';
import { zeichnungSVG } from '../zeichnen.js';
import { VALVE, vstate } from './pneumatik-symbole.js';

export function simCompute(){
  const d = ED.data, adj = new Map(), add = (a, b) => { if (!adj.has(a)) adj.set(a, []); if (!adj.has(b)) adj.set(b, []); adj.get(a).push(b); adj.get(b).push(a); };
  d.c.forEach(c => { if (c.pa !== undefined && c.pb !== undefined) add(c.a + ":" + c.pa, c.b + ":" + c.pb); });
  const roots = [];
  d.o.forEach(o => { const pc = art(o.k); if (!pc.sim) return; const r = pc.sim(o, ED.sim.st[o.id], () => false);
    (r.pairs || []).forEach(([p, q]) => add(o.id + ":" + p, o.id + ":" + q)); (r.src || []).forEach(p => roots.push(o.id + ":" + p)); });
  let P = new Set();
  for (let pass = 0; pass < 8; pass++) {   // gerichtete Wege hängen vom Druck ab: wiederholen, bis sich nichts mehr ändert
    const dir = new Map();
    d.o.forEach(o => { const pc = art(o.k); if (!pc.sim) return; const r = pc.sim(o, ED.sim.st[o.id], q => P.has(o.id + ":" + q));
      (r.dir || []).forEach(([p, q]) => { const a = o.id + ":" + p; if (!dir.has(a)) dir.set(a, []); dir.get(a).push(o.id + ":" + q); }); });
    const N = new Set(), st = [...roots];
    while (st.length) { const n = st.pop(); if (N.has(n)) continue; N.add(n); (adj.get(n) || []).forEach(m => st.push(m)); (dir.get(n) || []).forEach(m => st.push(m)); }
    const same = N.size === P.size && [...N].every(n => P.has(n)); P = N; if (same) break;
  }
  ED.sim.P = P;
}
export function simStep(t){
  if (!simOn()) return;
  const dt = Math.min(.05, (t - (ED.sim.t || t)) / 1000); ED.sim.t = t;
  let moving = false;
  ED.data.o.forEach(o => { if (!["zyl1","zyl2","rot"].includes(o.k)) return;
    const A = pressed(o, "A"), B = o.k !== "zyl1" && pressed(o, "B"), p = ED.sim.pos[o.id] || 0;
    const dir = o.k === "zyl1" ? (A ? 1 : -1) : (A && !B ? 1 : B && !A ? -1 : 0), np = Math.max(0, Math.min(1, p + dir * dt / 1.2));
    if (np !== p) { ED.sim.pos[o.id] = np; moving = true; } });
  if (moving && ED.svg) ED.svg.querySelector(".ink").innerHTML = zeichnungSVG(ED.data, true, ED.key);
  requestAnimationFrame(simStep);
}
// Klick auf ein Bauteil in der Simulation: Kugelhahn auf/zu, Wegeventil links bzw. rechts betätigen
export function simClick(o, pt){
  if (o.k === "kh") ED.sim.st[o.id] = (ED.sim.st[o.id] || o.zu || "auf") === "auf" ? "zu" : "auf";
  else if (VALVE[o.k]) ED.sim.st[o.id] = neueStellung(o, linkeSeite(o, pt));
  else return;
  simCompute(); ED.svg.querySelector(".ink").innerHTML = zeichnungSVG(ED.data, true, ED.key);
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
  if (mono) return links ? (s === "act" ? "rest" : "act") : s;
  return links ? "act" : "rest";
}

export const SIM_ANLEITUNG = `<div class="props"><div class="palh">Simulation</div><p class="small" style="margin:0 0 6px">Auf die Betätigung <b>links</b> oder <b>rechts</b> eines Ventils klicken: Es schaltet um. Druckführende Leitungen werden blau, Zylinder fahren, Endlagensensoren leuchten grün.</p><p class="small muted" style="margin:0">Monostabile Ventile fallen beim zweiten Klick in die Grundstellung zurück. Zum Bearbeiten „Auswählen“ wählen.</p></div>`;
// Simulation starten, wenn das Werkzeug gewählt wird, und beim Verlassen beenden
export function simulationWechsel(t){
  if (t === "sim" && !simOn()) { clearSel(); ED.sim = {on: true, st: {}, pos: {}, t: 0}; simCompute(); requestAnimationFrame(simStep); }
  else if (t !== "sim" && simOn()) ED.sim = {on: false, st: {}, pos: {}};
}
export function simulationKlick(e, pt){
  if (ED.tool !== "sim") return false;
  const h = e.target.closest("[data-o]");
  if (h) simClick(objById(h.dataset.o), pt);
  return true;
}
