// Dreipolig verdrahten im Hauptstromkreis: Ein Verbinden verbindet alle drei Pole (Gruppen-Haken mehrpolig), auf
// Wunsch mit getauschten Phasen L1 und L3 (Wendeschützschaltung). Dreipolige Bauteile docken untereinander an
// (Gruppen-Haken andocke). Die Pole eines Bauteils nennt sein Eintrag: pole: [[oben …], [unten …]].
// Zustand in ED.vorlage: einpolig (Knopf „3-polig“ aus), tauschen (Knopf „L1 ↔ L3“).
import { ED } from '../status.js';
import { art } from '../registry.js';
import { portsOf } from '../bauteile.js';
import { objById } from '../auswahl.js';

export const POLE_OBEN_UNTEN = [["1", "3", "5"], ["2", "4", "6"]];
const SCHIENEN = ["L1", "L2", "L3"];
// Die drei Pole [[id, Anschluss] ×3] zu Anschluss n von id und die Stelle i des Anschlusses darin; null ohne Pole.
// Eine virtuelle Schiene L1, L2 oder L3 (id "_L2@0") gehört mit den beiden anderen ihres Blatts zusammen.
export function polgruppe(id, n){
  const s = /^_(L[123])@(\d+)$/.exec(id);
  if (s) return {pole: SCHIENEN.map(v => [`_${v}@${s[2]}`, "~"]), i: SCHIENEN.indexOf(s[1])};
  const o = objById(id), g = o && (art(o.k).pole || []).find(t => t.includes(n));
  return g ? {pole: g.map(p => [id, p]), i: g.indexOf(n)} : null;
}
// Gruppen-Haken mehrpolig: alle drei Leitungen, Pol für Pol oder mit L1 ↔ L3 getauscht; null für eine Leitung.
// Getauscht wird nur beim bewussten Verbinden, Andocken (wie.andocken) verbindet immer Pol für Pol.
export function mehrpolig(a, pa, b, pb, wie = {}){
  const A = polgruppe(a, pa), B = polgruppe(b, pb);
  if (ED.vorlage.einpolig || !A || !B) return null;
  const tauschen = ED.vorlage.tauschen && !wie.andocken, ziel = j => (tauschen ? 2 - j : j);
  return [0, 1, 2].map(j => ({a: A.pole[j][0], pa: A.pole[j][1], b: B.pole[ziel(j)][0], pb: B.pole[ziel(j)][1]}));
}

/* ---------- Andocken ---------- */
// Erster Pol oben bzw. unten als Anschluss {n, x, y}
const pol = (o, reihe) => {
  const g = (art(o.k).pole || [])[reihe];
  return g && portsOf(o).find(p => p.n === g[0] && (reihe === 0 ? p.d === "u" : p.d === "d"));
};
// p liegt oben, o hängt darunter: Pole fluchten, 20 Abstand
function darunter(p, o){
  const unten = pol(p, 1), oben = pol(o, 0);
  if (!unten || !oben) return null;
  const dx = unten.x - oben.x, dy = oben.y - unten.y;
  if (Math.abs(dx) > 30 || dy < -10 || dy > 100) return null;
  return {a: p.id, b: o.id, pa: unten.n, pb: oben.n, d: Math.abs(dx) + Math.abs(dy - 20) / 4, sx: dx, sy: 20 - dy};
}
// Gruppen-Haken andocke: o unter oder über einem anderen dreipoligen Bauteil
export function andockeDreipolig(o, andere){
  if (o.rot || o.flip) return null;
  let best = null;
  for (const p of andere) {
    if (p.rot || p.flip) continue;
    const z = darunter(p, o), u = darunter(o, p);
    const kandidat = u && {...u, sx: -u.sx, sy: -u.sy};
    [z, kandidat].forEach(c => { if (c && (!best || c.d < best.d)) best = c; });
  }
  return best;
}

/* ---------- Knöpfe ---------- */
const knopf = (feld, an, text, titel) => `<button type="button" class="tool" data-pole="${feld}" aria-pressed="${an}" `
  + `title="${titel}">${text}</button>`;
export const poleKnoepfe = () => knopf("einpolig", !ED.vorlage.einpolig, "3-polig",
  "Verbinden verbindet alle drei Pole auf einmal") + knopf("tauschen", !!ED.vorlage.tauschen, "L1 ↔ L3",
  "Phasen L1 und L3 tauschen, z. B. beim zweiten Schütz einer Wendeschützschaltung");
// Haken klick der Vorlage: Knöpfe umschalten
export function poleKlick(e){
  const k = e.target.closest && e.target.closest("[data-pole]");
  if (!k) return false;
  const f = k.dataset.pole;
  ED.vorlage[f] = !ED.vorlage[f];
  k.setAttribute("aria-pressed", String(f === "einpolig" ? !ED.vorlage[f] : ED.vorlage[f]));
  return true;
}
