import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { V } from '../core/geometrie.js';
import { istSensor, leitung, SENSOR_FAKTOR } from '../bauteile/leitungen.js';
import { kantenschutz } from '../bauteile/kabelrinne.js';

// ----------------------------------------------------------------------------
// Kabeltrasse zum Schaltschrank (ersetzt die Kabelbrücke am Boden)
//  Gelochte Kabelwannen 100 × 60, alle Leitungen laufen darin zum Schrank:
//  Prüfstation (tief, unter dem Zaun hindurch) → Steigstück → hinter Band 2 auf Bandhöhe → Fallstück am Bandanfang
//  → flach innen an der Rollenkurve vorbei → Wanne zwischen Band 1 und Zinnbad nach hinten → hinter der Portalsäule
//  Querwanne nach links → seitlich durch die Sockelblende in den Schaltschrank.
//  Die Leitungen liegen in festen Spuren (u quer zur Wanne) und Lagen (v über dem Wannenboden): Wer weiter vorn im
//  Verlauf (vom Schrank aus gesehen weiter weg) eingelegt wird, liegt unten. In den Bögen laufen alle Leitungen
//  konzentrisch (über Kantenschutz in senkrechte Wannen R 60, Ecken in der Ebene R 100), so kreuzt keine eine andere.
//  Motorleitungen liegen hinter dem Trennsteg (u < steg).
// Die Leitungen werden erst gebaut, wenn alle Geräte eingetragen sind (trasseBauen, aus trasse-bauen.js).
// ----------------------------------------------------------------------------
export const TRASSE = {
  B: 100, H: 60, z: 1105,                          // Wannenmitte hinter Band 2 und an der Prüfstation
  yPruef: 80, yHinten: 310, yUnten: 55,            // Bodenhöhen: Prüfstation (unter dem Zaun), hinter Band 2, am Boden
  xEnde: 4740, xStufe: 2860, xFall: 461,           // rechtes Ende, Steigstück vor dem Kipper, Fallstück am Bandanfang
  xRI: 193, zQuer: -405, xSchrank: -1096,           // Wanne Band 1/Bad (Mitte), Querwanne, Ende an der Sockelblende
  steg: -13, lokalRI: 33,                          // Trennsteg (u); darüber liegen in der Wanne Band 1/Bad die Leitungen vor Ort
  rBogen: 60, rEcke: 100,                          // Biegeradius am Wannenboden: Übergang waagrecht/senkrecht, Ecken in der Ebene
};
const T = TRASSE;
const SIGNAL = [44, 34, 24, 14, 4, -6], LEISTUNG = [-19, -29, -39];
const SIGNAL_PRUEF = [14, 4, -6], LEISTUNG_PRUEF = [-19, -29];   // vorn in der Wanne an der Prüfstation: Leitungen vor Ort, hinten der Schlauch zur Düse
export const PRUEF_SPUR = { lokal: [47, 42, 37, 32, 27, 22], schlauch: -39 };

// Mittellinie auf dem Wannenboden in Flussrichtung (zum Schrank): Eckpunkte (Schnittpunkte der Geraden), je Abschnitt
// die Seite, auf der die Leitungen liegen, und je Ecke der Bogenradius der Mittellinie
const PUNKTE = [
  V(T.xEnde, T.yPruef, T.z), V(T.xStufe, T.yPruef, T.z), V(T.xStufe, T.yHinten, T.z), V(T.xFall, T.yHinten, T.z),
  V(T.xFall, T.yUnten, T.z), V(T.xRI, T.yUnten, T.z), V(T.xRI, T.yUnten, T.zQuer), V(T.xSchrank - 60, T.yUnten, T.zQuer),
];
const BODEN = [V(0, 1, 0), V(1, 0, 0), V(0, 1, 0), V(-1, 0, 0), V(0, 1, 0), V(0, 1, 0), V(0, 1, 0)];
const RADIUS = [0, T.rBogen, T.rBogen, T.rBogen, T.rBogen, T.rEcke, T.rEcke, 0];
const ABSCHNITTE = BODEN.map((n, i) => {
  const a = PUNKTE[i], d = PUNKTE[i + 1].clone().sub(a), L = d.length();
  return { a, d: d.normalize(), n, l: n.clone().cross(d), L, von: RADIUS[i], bis: RADIUS[i + 1] };
});
let s0 = 0;
for (const A of ABSCHNITTE) { A.s = s0; s0 += A.L; }
const S_PRUEF = ABSCHNITTE[1].s, S_QUER = ABSCHNITTE[6].s;

// Versatz einer Leitung (Spur u, Lage v) gegenüber der Mittellinie im Abschnitt A
const versatz = (A, u, v) => A.l.clone().multiplyScalar(u).addScaledVector(A.n, v);
// Bogen der versetzten Leitung an Ecke i: konzentrisch zur Mittellinie (Radius R ± Versatz zur Bogeninnenseite)
function bogen(i, u, v, n = 12) {
  const d1 = ABSCHNITTE[i - 1].d, d2 = ABSCHNITTE[i].d, R = RADIUS[i];
  const o1 = versatz(ABSCHNITTE[i - 1], u, v), a = o1.dot(d2), rho = R - a;
  const O = PUNKTE[i].clone().addScaledVector(d1, -R).addScaledVector(d2, R).add(o1).addScaledVector(d2, -a);
  const pts = [];
  for (let k = 0; k <= n; k++) {
    const phi = k / n * Math.PI / 2;
    pts.push(O.clone().addScaledVector(d2, -rho * Math.cos(phi)).addScaledVector(d1, rho * Math.sin(phi)));
  }
  return pts;
}
// Nächster Punkt auf den waagrechten Abschnitten: Abschnittsnummer, Lauflänge t im Abschnitt und Querlage u
function projektion(p) {
  let best = null;
  ABSCHNITTE.forEach((A, i) => {
    if (A.n.y < 0.5) return;
    const t = THREE.MathUtils.clamp(p.clone().sub(A.a).dot(A.d), 0, A.L), q = A.a.clone().addScaledVector(A.d, t);
    const dist = q.distanceTo(p);
    if (!best || dist < best.dist - 1e-6) best = { i, t, s: A.s + t, dist, u: p.clone().sub(q).dot(A.l) };
  });
  return best;
}

const EINTRAEGE = [];
// Leitung in die Trasse legen: weg endet über der Einlegestelle (Anlagenkoordinaten). Von dort waagrecht über die Spur,
// hinunter auf die Lage und in der Trasse zum Schrank. art 'leistung': hinter den Trennsteg; spur: feste Spur u;
// hinten: kommt von hinten in die Ecke Wanne Band 1/Bad → Querwanne (−MA1), weg endet über dem Rinnenboden
export function zurTrasse(weg, mat, r, { art = 'signal', spur, hinten = false } = {}) {
  EINTRAEGE.push({ weg: weg.map((p) => p.clone()), mat, r, art, spur, hinten });
}

// Spurvergabe: in Flussrichtung sortiert, jede Leitung auf die Spur mit der niedrigsten Lage (bei Gleichstand die
// nächstgelegene), darüber liegt sie bis zum Schrank
function spurenVergeben() {
  for (const e of EINTRAEGE) {
    Object.assign(e, projektion(e.weg[e.weg.length - 1]));
    if (e.hinten) Object.assign(e, { i: 6, t: 0, s: S_QUER + T.rEcke, u: e.spur });
  }
  EINTRAEGE.sort((a, b) => a.s - b.s);
  const lagen = new Map();
  let maxRI = 0;
  for (const e of EINTRAEGE) {
    const pruef = e.s < S_PRUEF;
    const spuren = e.spur !== undefined ? [e.spur] : e.art === 'leistung' ? (pruef ? LEISTUNG_PRUEF : LEISTUNG) : (pruef ? SIGNAL_PRUEF : SIGNAL);
    let wahl = null;
    for (const u of spuren) {
      const h = lagen.get(u) || 0;
      if (!wahl || h < wahl.h - 0.1 || (Math.abs(h - wahl.h) <= 0.1 && Math.abs(u - e.u) < Math.abs(wahl.u - e.u))) wahl = { u, h };
    }
    e.spurU = wahl.u; e.v = wahl.h + e.r;
    lagen.set(wahl.u, wahl.h + 2 * e.r);
    if (e.s < S_QUER) maxRI = Math.max(maxRI, wahl.h + 2 * e.r);
  }
  if (maxRI > T.lokalRI) console.warn(`Kabeltrasse: Lagen in der Wanne Band 1/Bad ${maxRI.toFixed(1)} mm hoch (Platz ${T.lokalRI} mm)`);
}

// Weiter in der Trasse ab Abschnitt i, Lauflänge t: gerade, durch alle folgenden Bögen bis ans Ende
function weiter(e, i, t) {
  const A = ABSCHNITTE[i], pts = [A.a.clone().addScaledVector(A.d, t).add(versatz(A, e.spurU, e.v))];
  for (let k = i + 1; k < ABSCHNITTE.length; k++) pts.push(...bogen(k, e.spurU, e.v));
  const Z = ABSCHNITTE[ABSCHNITTE.length - 1];
  pts.push(PUNKTE[PUNKTE.length - 1].clone().add(versatz(Z, e.spurU, e.v)));
  return pts;
}
// Zeichnen: Zuleitung mit dem Biegeradius der Leitung bis hinter den Bogen in die Lage, ab dort in der Trasse
// (Bögen als Punktfolge, die Leitung folgt ihr ohne eigenen Radius)
function legen(e) {
  const sensor = istSensor(e.mat, e.r), Rz = sensor ? SENSOR_FAKTOR * 2 * e.r : Math.max(14, 10 * e.r);
  const A = ABSCHNITTE[e.i], E = e.weg[e.weg.length - 1];
  if (e.hinten) {                                                    // von hinten: hinunter auf die Lage, nach vorn in die Spur der Querwanne
    const z = T.zQuer + e.spurU, y = T.yUnten + e.v;
    leitung([...e.weg, V(E.x, y, E.z), V(E.x, y, z), V(E.x - Rz, y, z)], e.mat, e.r, Rz, anlage);
    leitung([V(E.x - Rz, y, z), PUNKTE[PUNKTE.length - 1].clone().setY(y).setZ(z)], e.mat, e.r, 1, anlage, 0);
    return;
  }
  // Einlegestelle zwischen den Bögen, mit Platz für den eigenen Bogen der Zuleitung
  const t = THREE.MathUtils.clamp(e.t, A.von, Math.max(A.von, A.L - A.bis - Rz));
  const P = A.a.clone().addScaledVector(A.d, t).add(versatz(A, e.spurU, e.v)), ueber = V(P.x, E.y, P.z);
  // kurzer Versatz zur Spur: schräg hinunter statt zwei enger Bögen
  const zu = ueber.distanceTo(E) > 2 * Rz ? [...e.weg, ueber] : [...e.weg];
  if (Math.abs(e.u) > T.B / 2) {                                     // kommt von außen über die Seitenwand: Kantenschutz auf der Wand
    const k = A.a.clone().addScaledVector(A.d, (e.t + t) / 2).addScaledVector(A.l, Math.sign(e.u) * T.B / 2).addScaledVector(A.n, T.H);
    kantenschutz(k.x, k.y, k.z, Math.abs(A.d.x) > 0.5 ? 'x' : 'z', 40);
  }
  leitung([...zu, P, P.clone().addScaledVector(A.d, Rz)], e.mat, e.r, Rz, anlage, sensor ? SENSOR_FAKTOR : undefined);
  leitung(weiter(e, e.i, t + Rz), e.mat, e.r, 1, anlage, 0);
}

export function trasseBauen() {
  spurenVergeben();
  for (const e of EINTRAEGE) legen(e);
}
