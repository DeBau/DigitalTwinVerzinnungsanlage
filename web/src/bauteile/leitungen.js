import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { box, mesh } from '../core/geometrie.js';

// ----------------------------------------------------------------------------
// Leitungen und Schläuche
//  leitung()  fest verlegt: gerade Strecken, an jeder Ecke ein echter Kreisbogen
//  schlauch() frei hängend/bewegt: glatte Kurve durch Stützpunkte
// Biegeradius: mindestens BIEGEFAKTOR × Außendurchmesser (PUR-Leitungen fest verlegt 5 × D,
// PU-Schläuche liegen mit 5 × D ebenfalls über dem Mindestradius). Ist eine Strecke für den
// Bogen zu kurz, wird er enger – das landet in BIEGUNG_ZU_ENG (Prüfung beim Entwickeln).
// Querschnitt: gleichmäßig viele Seiten, Ringe nur dort, wo die Leitung sich biegt.
// ----------------------------------------------------------------------------
export const BIEGEFAKTOR = 5;
export const BIEGUNG_ZU_ENG = [];
globalThis.__biegung = BIEGUNG_ZU_ENG;
const BOGEN_SCHRITT = Math.PI / 14;              // höchstens ~13° je Ring im Bogen
const v3 = (p) => p.isVector3 ? p.clone() : new THREE.Vector3(...p);
const seiten = (r) => r < 1.2 ? 6 : r < 3.5 ? 8 : 10;          // Umfang: dünne Leitungen brauchen wenig Ecken

// Kurzer Versatz (Hin- und Rückrichtung gleich, Zwischenstück kürzer als zwei Bögen): eine echte Leitung
// knickt dort nicht zweimal rechtwinklig, sondern zieht in einem flachen S hinüber. Die beiden Ecken
// rücken dazu auf den Nachbarstrecken auseinander, bis beide Bögen mit Radius R Platz haben.
function sVersatz(P, R) {
  for (let j = 1; j < P.length - 2; j++) {
    const u = P[j].clone().sub(P[j - 1]), w = P[j + 2].clone().sub(P[j + 1]);
    const Lv = u.length(), Ln = w.length(); u.normalize(); w.normalize();
    const quer = P[j + 1].clone().sub(P[j]), h = quer.length();
    if (u.dot(w) < 0.999 || h >= 2 * R || Math.abs(quer.dot(u)) > 0.01 * h) continue;
    // Platz auf den Nachbarstrecken: Endstrecken ganz, innere Strecken zur Hälfte (der Nachbarbogen braucht den Rest)
    const frei = Math.min(Lv * (j === 1 ? 1 : 0.5), Ln * (j + 2 === P.length - 1 ? 1 : 0.5));
    // kleinster Versatz s, bei dem beide Bögen den Radius R erreichen – sonst der mit dem größten Radius
    let s = 0, best = 0;
    for (let k = 1; k <= 200; k++) {
      const sk = frei * k / 200, tan = Math.tan(Math.atan2(h, 2 * sk) / 2);
      const Rk = Math.min(R, Math.min(frei - sk, Math.hypot(h, 2 * sk) / 2) / tan);
      if (Rk > best + 1e-6) { best = Rk; s = sk; }
      if (Rk >= R) break;
    }
    if (s > 0) { P[j].addScaledVector(u, -s); P[j + 1].addScaledVector(w, s); }
  }
}
// Mittellinie einer rechtwinklig (oder schräg) verlegten Leitung: Ecken als Kreisbögen mit Radius R
function mittellinie(pts, R, r, pruefen = true) {
  const P = [];
  for (const p of pts.map(v3)) if (!P.length || p.distanceTo(P[P.length - 1]) > 0.05) P.push(p);
  // Punkte auf einer Geraden entfernen
  for (let i = P.length - 2; i > 0; i--) {
    const a = P[i].clone().sub(P[i - 1]).normalize(), b = P[i + 1].clone().sub(P[i]).normalize();
    if (a.dot(b) > 0.99999) P.splice(i, 1);
  }
  if (P.length < 2) return P;
  sVersatz(P, R);
  const n = P.length;
  const L = [], D = [];
  for (let i = 0; i < n - 1; i++) { const d = P[i + 1].clone().sub(P[i]); L.push(d.length()); D.push(d.normalize()); }
  // gewünschte Tangentenlänge je Ecke, dann auf die verfügbare Streckenlänge kürzen
  const th = [], t = [];
  for (let i = 1; i < n - 1; i++) {
    th[i] = Math.min(Math.acos(THREE.MathUtils.clamp(D[i - 1].dot(D[i]), -1, 1)), Math.PI - 0.02);
    t[i] = R * Math.tan(th[i] / 2);
  }
  const f = [];
  for (let j = 0; j < n - 1; j++) {
    const frei = L[j], bedarf = (t[j] || 0) + (t[j + 1] || 0);    // an den Enden darf der Bogen direkt am Knickschutz beginnen
    f[j] = bedarf > frei ? frei / bedarf : 1;
  }
  const Q = [P[0]];
  for (let i = 1; i < n - 1; i++) {
    const ti = t[i] * Math.min(f[i - 1], f[i]), Ri = ti / Math.tan(th[i] / 2);
    if (pruefen && Ri < R * 0.98) BIEGUNG_ZU_ENG.push({ punkt: P[i].clone(), start: P[0].clone(), soll: R, ist: Math.round(Ri * 10) / 10, r });
    const u = D[i - 1], w = D[i];
    const a = P[i].clone().addScaledVector(u, -ti);
    const nrm = w.clone().addScaledVector(u, -u.dot(w)).normalize();
    const C = a.clone().addScaledVector(nrm, Ri);
    const m = Math.max(2, Math.ceil(th[i] / BOGEN_SCHRITT));
    if (a.distanceTo(Q[Q.length - 1]) > 0.05) Q.push(a);
    for (let k = 1; k <= m; k++) {
      const phi = th[i] * k / m;
      Q.push(C.clone().addScaledVector(nrm, -Ri * Math.cos(phi)).addScaledVector(u, Ri * Math.sin(phi)));
    }
  }
  if (P[n - 1].distanceTo(Q[Q.length - 1]) > 0.05) Q.push(P[n - 1]);
  return Q;
}

// Rohr um eine Mittellinie; Rahmen per Parallelverschiebung (keine Verdrehung wie bei Frenet)
function rohrGeometrie(Q, r, rad = seiten(r)) {
  const n = Q.length, pos = new Float32Array(n * rad * 3), nor = new Float32Array(n * rad * 3);
  const T = [], N = new THREE.Vector3(), B = new THREE.Vector3(), q = new THREE.Quaternion(), d = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const t = i === 0 ? Q[1].clone().sub(Q[0]) : i === n - 1 ? Q[i].clone().sub(Q[i - 1])
      : Q[i].clone().sub(Q[i - 1]).normalize().add(Q[i + 1].clone().sub(Q[i]).normalize());
    T.push(t.normalize());
  }
  N.set(0, 1, 0); if (Math.abs(T[0].y) > 0.9) N.set(1, 0, 0);
  N.addScaledVector(T[0], -N.dot(T[0])).normalize();
  for (let i = 0; i < n; i++) {
    if (i) { q.setFromUnitVectors(T[i - 1], T[i]); N.applyQuaternion(q); N.addScaledVector(T[i], -N.dot(T[i])).normalize(); }
    B.crossVectors(T[i], N);
    for (let k = 0; k < rad; k++) {
      const w = k / rad * Math.PI * 2, o = (i * rad + k) * 3;
      d.copy(N).multiplyScalar(Math.cos(w)).addScaledVector(B, Math.sin(w));
      nor[o] = d.x; nor[o + 1] = d.y; nor[o + 2] = d.z;
      pos[o] = Q[i].x + r * d.x; pos[o + 1] = Q[i].y + r * d.y; pos[o + 2] = Q[i].z + r * d.z;
    }
  }
  const idx = new (n * rad > 65535 ? Uint32Array : Uint16Array)((n - 1) * rad * 6);
  let o = 0;
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < rad; k++) {
    // Umlaufsinn passend zu den Normalen (nach außen): sonst ist die Innenseite die Vorderseite, man sähe die hintere
    // Rohrwand von innen, und Tiefenschatten (Normalen zeigen von der Kamera weg) würden das Rohr schwarz färben
    const a = i * rad + k, b = i * rad + (k + 1) % rad, c = a + rad, e = b + rad;
    idx[o++] = a; idx[o++] = b; idx[o++] = c; idx[o++] = b; idx[o++] = e; idx[o++] = c;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  return g;
}
// Glatte Kurve durch Stützpunkte, gleichmäßig nach Bogenlänge abgetastet (feste Anzahl → Puffer wiederverwendbar)
export function kurvenRohr(kurve, r, n) {
  return rohrGeometrie(kurve.getSpacedPoints(n), r);
}
const glatt = (pts) => new THREE.CatmullRomCurve3(pts.map(v3), false, 'centripetal');
const ringe = (kurve) => THREE.MathUtils.clamp(Math.round(kurve.getLength() / 12), 16, 100);   // etwa alle 12 mm ein Ring

// Schlauch / Kabel frei durch Stützpunkte (seg: feste Ringzahl für bewegte Schläuche, sonst nach Länge)
export function schlauch(pts, mat, r = 3, parent = anlage, seg) {
  const k = glatt(pts);
  const m = mesh(kurvenRohr(k, r, seg || ringe(k)), mat, parent);
  m.userData.rohr = { r };
  return m;
}
// Fest verlegte Leitung: R ist der gewünschte Biegeradius, mindestens faktor × D (Standard BIEGEFAKTOR; hochflexible
// PUR-Sensorleitungen dürfen als Ausnahme enger gebogen werden)
export function leitung(pts, mat, r = 3, R = 35, parent = anlage, faktor = BIEGEFAKTOR) {
  return mesh(rohrGeometrie(mittellinie(pts, Math.max(R, faktor * 2 * r), r), r), mat, parent);
}
// Starres Rohr bzw. Wellschlauch (Blech, Kupfer, Kunststoff-Wellrohr): Bogenradius wie angegeben
export function rohr(pts, mat, r, R, parent = anlage) {
  return mesh(rohrGeometrie(mittellinie(pts, R, r, false), r), mat, parent);
}
// Mehrere Rohr-Geometrien zu einer zusammenfassen (statische Leitungsbündel, spart Draw-Calls)
function zusammenfuegen(geos) {
  let nv = 0, ni = 0;
  for (const g of geos) { nv += g.attributes.position.count; ni += g.index.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), idx = new Uint32Array(ni);
  let ov = 0, oi = 0;
  for (const g of geos) {
    pos.set(g.attributes.position.array, ov * 3); nor.set(g.attributes.normal.array, ov * 3);
    const I = g.index.array;
    for (let i = 0; i < I.length; i++) idx[oi + i] = I[i] + ov;
    ov += g.attributes.position.count; oi += I.length; g.dispose();
  }
  const r = new THREE.BufferGeometry();
  r.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  r.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  r.setIndex(new THREE.BufferAttribute(idx, 1));
  return r;
}
// Sammler: Leitungen je Material sammeln und am Ende als ein Mesh je Material erzeugen
// (Einzeladern im Schaltschrank: mindestens 4 × D, Mantelleitungen BIEGEFAKTOR × D)
export function buendel(parent = anlage) {
  const map = new Map();
  return {
    add(pts, mat, r, R = 20) {
      if (!map.has(mat)) map.set(mat, []);
      map.get(mat).push(rohrGeometrie(mittellinie(pts, Math.max(R, (r > 1.2 ? BIEGEFAKTOR : 4) * 2 * r), r), r, r < 1.2 ? 6 : 8));
    },
    fertig() { for (const [mat, geos] of map) mesh(zusammenfuegen(geos), mat, parent); map.clear(); },
  };
}
// Schlauchhalter / Kabelbinder an einer Stelle
export function halter(x, y, z, achse = 'y', parent = anlage) {
  const m = box(achse === 'y' ? 14 : 10, achse === 'y' ? 10 : 14, 26, M.kunststoff, x, y, z, parent);
  return m;
}
