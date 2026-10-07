// Stromfluss-Simulation im Stromlaufplan (Werkzeug „Simulation“, Muster wie die Pneumatik-Simulation).
// Ein Netz verbindet Anschlüsse: Leitungen, Kettenverbindungen, automatische Leitungen zu L+ und M und die
// geschlossenen Kontakte. Eine Spule zieht an, wenn A1 am Potenzial L+ und A2 an M liegt; alle Kontakte mit ihrem
// Kennzeichen schalten mit, so hält eine Selbsthaltung von selbst. Taster sind tastend, Schalter und Not-Halt rastend.
// Leitungen mit L+ werden rot, mit M blau unterlegt. Zustand: ED.sim = {on, st: {Kennzeichen: betätigt}, aktiv}.
import { IC } from '../../app/basis.js';
import { PH, SVGT } from '../svg.js';
import { ED } from '../status.js';
import { art } from '../registry.js';
import { istSchiene, portsOf, simOn, virtuelleSchienen, wireD, wireEnds } from '../bauteile.js';
import { umrissVon } from '../bausteine.js';
import { clearSel, objById } from '../auswahl.js';
import { kettenLeitung, pageCount, verbindungsWeg } from '../zeichnen.js';
import { renderInk } from '../anzeige.js';
import { SPULEN } from './elektro-kennzeichen.js';
import { autoLeitungen } from './elektro-pfade.js';

export const STROM_PLUS = "#D64541", STROM_MINUS = "#2F80ED", AN = "#27AE60";

/* ---------- Netz ---------- */
// Vereinigungsmengen über Knotennamen "id:Anschluss" bzw. "pot:L+" für Schienen
export function neuesNetz(){
  const p = new Map();
  const f = a => { while (p.has(a)) a = p.get(a); return a; };
  return {f, u: (a, b) => { const x = f(a), y = f(b); if (x !== y) p.set(x, y); }};
}
export const knoten = (o, n) => istSchiene(o) ? "pot:" + o.v : o.id + ":" + n;
const name = (o, i) => (portsOf(o)[i] || {}).n;
// Feste Verbindungen: Leitungen, Kettenverbindungen, automatische Leitungen
function verbindeFest(d, cs, objs, netz){
  cs.forEach(c => {
    const A = objs[c.a], B = objs[c.b];
    if (!A || !B) return;
    if (c.pa !== undefined || c.pb !== undefined) { netz.u(knoten(A, c.pa), knoten(B, c.pb)); return; }
    const e = kettenLeitung(c, objs);
    if (e) netz.u(knoten(A, e[0].n), knoten(B, e[1].n));
  });
  autoLeitungen(d, cs).forEach(({o, p, y}) => netz.u(knoten(o, p.n), y % PH === 70 ? "pot:L+" : "pot:M"));
}

// Bausteine nach ID samt den virtuellen Schienen L+ und M auf jedem Blatt
export function objekteVon(d){
  const objs = Object.fromEntries((d.o || []).map(o => [o.id, o]));
  virtuelleSchienen("stromlauf", pageCount("stromlauf", d)).forEach(r => { objs[r.id] = r; });
  return objs;
}

/* ---------- Verhalten der Bauteile ---------- */
// Geschlossene Wege [Anschlussindex, Anschlussindex] je Bausteinart; z = {betaetigt, an (Spule des Kennzeichens)}
const WEG = [[0, 1]], ZWEI = [[0, 1], [2, 3]];
const wenn = (b, wege = WEG) => b ? wege : [];
export const SCHALTET = {
  no: z => wenn(z.an), nc: z => wenn(!z.an),
  tno: z => wenn(z.betaetigt), tnc: z => wenn(!z.betaetigt), estop: z => wenn(!z.betaetigt), estop2: z => wenn(!z.betaetigt, ZWEI),
  key: z => wenn(z.betaetigt), lsw: z => wenn(z.betaetigt), sens: z => wenn(z.betaetigt, [[0, 2]]), msk: z => wenn(!z.betaetigt),
  term: () => WEG, fuse: () => WEG,
  sr: z => wenn(z.an, [[6, 9], [7, 10]]),   // Freigabe 13/14 und 23/24
};
// Wie ein Bauteil bedient wird: tastend (nur solange gedrückt) oder rastend (Klick schaltet um)
export const BEDIENUNG = {tno: "tastend", tnc: "tastend", estop: "rastend", estop2: "rastend", key: "rastend",
  lsw: "rastend", sens: "rastend", msk: "rastend"};
export const kennung = o => o.v || o.id;
const zustand = (o, aktiv) => ({betaetigt: !!ED.sim.st[kennung(o)], an: aktiv.has(o.v)});
// Netz bei Zustand z(o) → {betaetigt, an} der Bauteile
export function netzAus(d, cs, objs, z){
  const netz = neuesNetz();
  verbindeFest(d, cs, objs, netz);
  (d.o || []).forEach(o => (SCHALTET[o.k] ? SCHALTET[o.k](z(o)) : [])
    .forEach(([i, j]) => netz.u(knoten(o, name(o, i)), knoten(o, name(o, j)))));
  return netz;
}
// Verbraucher (Spule, Ventilspule, Leuchte): A1 bzw. X1 an L+ und A2 bzw. X2 an M
export const VERBRAUCHER = [...SPULEN, "mbv", "lamp"];
const gespeist = (o, netz, a, b) => netz.f(knoten(o, a)) === netz.f("pot:L+") && netz.f(knoten(o, b)) === netz.f("pot:M");
// Sicherheitsrelais: versorgt, und beide Kanäle S11–S12, S21–S22 geschlossen
const srAn = (o, netz) => gespeist(o, netz, "A1", "A2")
  && netz.f(knoten(o, "S11")) === netz.f(knoten(o, "S12")) && netz.f(knoten(o, "S21")) === netz.f(knoten(o, "S22"));
// Zeitrelais: an = gespeist (anzugsverzögert erst nach o.t Sekunden, abfallverzögert noch o.t Sekunden danach).
// ED.sim.zeit[id] = {gespeist, seit}: letzter Wechsel; ein Wecker zeichnet neu, wenn die Zeit abläuft.
export const VERZOEGERT = {
  zan: (g, vorbei) => g && vorbei,
  zab: (g, vorbei) => g || !vorbei,
};
function zeitrelais(o, g){
  const Z = ED.sim.zeit || (ED.sim.zeit = {}), jetzt = Date.now(), t = 1000 * (parseFloat(o.t) || 3);
  const z = Z[o.id] || (Z[o.id] = {gespeist: false, seit: -Infinity});
  if (z.gespeist !== g) { z.gespeist = g; z.seit = jetzt; }
  const rest = z.seit + t - jetzt;
  if (rest > 0) setTimeout(() => { if (simOn()) renderInk(); }, rest + 30);
  return VERZOEGERT[o.k](g, rest <= 0);
}
function eingeschaltet(d, netz){
  const an = new Set();
  (d.o || []).forEach(o => {
    const g = VERBRAUCHER.includes(o.k) && gespeist(o, netz, name(o, 0), name(o, 1));
    if (VERZOEGERT[o.k] ? zeitrelais(o, g) : g) an.add(o.v || o.id);
    if (o.k === "sr" && srAn(o, netz)) an.add(o.v || o.id);
  });
  return an;
}
// Bis sich nichts mehr ändert: Kontakte hängen von den Spulen ab, die Spulen vom Netz. Start mit dem alten Zustand.
export function simuliere(d, cs, objs){
  let aktiv = ED.sim.aktiv || new Set(), netz = null;
  for (let i = 0; i < 12; i++) {
    const a = aktiv;
    netz = netzAus(d, cs, objs, o => zustand(o, a));
    const neu = eingeschaltet(d, netz), gleich = neu.size === aktiv.size && [...neu].every(v => aktiv.has(v));
    aktiv = neu;
    if (gleich) break;
  }
  ED.sim.aktiv = aktiv;
  return netz;
}

/* ---------- Zeichnen ---------- */
const band = (pfad, farbe) => farbe ? `<path class="strom" d="${pfad}" fill="none" stroke="${farbe}" stroke-width="7" `
  + `stroke-opacity=".35" stroke-linejoin="round" pointer-events="none"/>` : "";
// Unterlegte Leitungen und Kontakte (Haken hintergrund, nur während der Simulation)
export function stromSVG(d, cs, objs){
  const netz = simuliere(d, cs, objs), plus = netz.f("pot:L+"), minus = netz.f("pot:M");
  const farbe = k => { const r = netz.f(k); return r === plus ? STROM_PLUS : r === minus ? STROM_MINUS : null; };
  let s = cs.map(c => {
    const gm = verbindungsWeg(c, objs, cs), A = objs[c.a];
    if (!gm || !A) return "";
    const e = c.pa === undefined && c.pb === undefined ? kettenLeitung(c, objs) : wireEnds(c, objs);
    return e ? band(gm.d, farbe(knoten(A, c.pa ?? e[0].n))) : "";
  }).join("");
  s += autoLeitungen(d, cs).map(({o, p, y}) => band(`M${p.x} ${y}V${p.y}`, farbe(knoten(o, p.n)))).join("");
  (d.o || []).forEach(o => (SCHALTET[o.k] ? SCHALTET[o.k](zustand(o, ED.sim.aktiv)) : []).forEach(([i, j]) => {
    const p = portsOf(o)[i], q = portsOf(o)[j];
    s += band(wireD(p, q), farbe(knoten(o, p.n)));
  }));
  if (plus === minus) s += SVGT(500, 40, "Kurzschluss: L+ und M sind ohne Verbraucher verbunden", "middle", 13, 700, STROM_PLUS);
  return s;
}
// Haken zusatz: angezogene Spule grün, Leuchte gelb, betätigtes Bedienteil grün umrandet
export function simZusatz(o){
  if (!simOn() || ED.key !== "stromlauf") return "";
  const b = umrissVon(o), an = ED.sim.aktiv && ED.sim.aktiv.has(o.v || o.id);
  if (o.k === "lamp" && an) return `<circle cx="${o.x}" cy="${o.y + 30}" r="12" fill="#F2C94C" fill-opacity=".7"/>`;
  if (VERBRAUCHER.includes(o.k) && an) {
    return `<rect x="${o.x - 15}" y="${o.y + 18}" width="30" height="24" fill="${AN}" fill-opacity=".45"/>`;
  }
  if (BEDIENUNG[o.k] && ED.sim.st[kennung(o)]) {
    return `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="4" fill="none" stroke="${AN}" stroke-width="2"/>`;
  }
  return "";
}

/* ---------- Bedienen ---------- */
export const simKnopf = () => `<button type="button" class="tool" data-tool="sim" `
  + `title="Taster anklicken und sehen, welche Spulen anziehen und wo Strom fließt">${IC.play}Simulation</button>`;
export function simWechsel(t){
  if (t === "sim" && !simOn()) { clearSel(); ED.sim = {on: true, st: {}, pos: {}, aktiv: new Set()}; }
  else if (t !== "sim" && simOn()) ED.sim = {on: false, st: {}, pos: {}};
}
// Bedienteil, dessen Betätiger (Pilzkopf, Kasten I> ϑ, Schlüssel …) links vor der Trefferfläche bei pt liegt
const betaetigerBei = ([x, y]) => (ED.data.o || []).find(o => BEDIENUNG[o.k] && !o.rot && !o.flip
  && o.x - (art(o.k).links || 34) <= x && x <= o.x && o.y <= y && y <= o.y + 60);
// Klick auf ein Bedienteil oder seinen Betätiger: rastend umschalten, tastend bis zum Loslassen drücken
export function simUnten(e, pt){
  if (ED.tool !== "sim") return false;
  const h = e.target.closest("[data-o]"), getroffen = h && objById(h.dataset.o);
  const o = getroffen && BEDIENUNG[getroffen.k] ? getroffen : pt && betaetigerBei(pt);
  const bedienung = o && BEDIENUNG[o.k];
  if (!bedienung) return true;
  const k = kennung(o);
  ED.sim.st[k] = bedienung === "tastend" ? true : !ED.sim.st[k];
  if (bedienung === "tastend") addEventListener("pointerup", () => { ED.sim.st[k] = false; renderInk(); }, {once: true});
  renderInk();
  return true;
}
export const STROM_ANLEITUNG = `<div class="props"><div class="palh">Simulation</div><p class="small" style="margin:0 0 6px">`
  + `Taster anklicken: Sie schalten, solange du drückst. Not-Halt, Schalter, Sensoren und Motorschutz rasten bei jedem `
  + `Klick um. Eine Spule zieht an, wenn A1 an L+ und A2 an M liegt, und alle Kontakte mit ihrem Kennzeichen schalten mit.`
  + `</p><p class="small muted" style="margin:0">Rot: Potenzial L+, blau: Potenzial M. Zum Bearbeiten „Auswählen“ wählen.</p></div>`;
