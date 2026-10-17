import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { V, box, zyl } from '../core/geometrie.js';
import { label } from '../core/beschriftung.js';
import { anbauT, bodenstuetze, kabelrinne, kantenschutz } from '../bauteile/kabelrinne.js';
import { B2 } from './baender.js';
import { TRASSE, zurTrasse } from './kabeltrasse.js';

// ----------------------------------------------------------------------------
// Kabelwanne gelocht 100 × 60 hinter Band 2 und an der Prüfstation (Teil der Kabeltrasse, kabeltrasse.js)
//  Nur gerade Wannen, waagrecht und senkrecht. Prüfstation: tief (Boden 80) vom rechten Ende unter dem Schutzzaun
//  hindurch bis vor den Kipper, dort eine senkrechte Wanne auf Bandhöhe (Boden 310). Hinter Band 2 läuft sie hinter dem
//  Kühlwassertank vorbei (Wandkonsolen an der Tankrückwand, sonst Bodenstützen) bis zum Bandanfang, dort eine senkrechte
//  Wanne nach unten und flach (Boden 55) innen an der Rollenkurve vorbei in die Wanne zwischen Band 1 und Zinnbad.
//  Wo die Leitungen über ein Wannenende in die senkrechte Wanne gehen, sitzt Kantenschutz auf der Blechkante; die
//  senkrechte Wanne steht um den Biegeradius (TRASSE.rBogen) versetzt auf einem eigenen Steher, die Leitungen gehen
//  frei im Bogen von der einen in die andere Wanne. Unten laufen sie von der senkrechten in die waagrechte Wanne.
//  Trennsteg bei u = TRASSE.steg: dahinter (zur Hallenseite) die Motorleitungen.
// ----------------------------------------------------------------------------
const T = TRASSE, zW = T.z - T.B / 2, zV = T.z + T.B / 2;            // Wannenwand hinten / vorn
const steg = T.steg, R = T.rBogen;
// Senkrechte Wanne: Boden in der Ebene x = x0, Leitungen auf der Seite s (±1 in x), von y0 nach oben (L lang),
// angeschraubt an einen Steher (C-Profil 41 × 41 mit Fußplatte) hinter dem Wannenboden
function senkrecht(x0, y0, L, s) {
  const g = kabelrinne(V(0, 0, 0), 0, { L, B: T.B, H: T.H, trennsteg: -s * steg });
  g.position.set(x0, y0, T.z);
  g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, 1, 0), V(s, 0, 0), V(0, 0, -s)));
  g.updateMatrixWorld(true);
  const xs = x0 - s * 21.5, h = y0 + L - 6;
  box(100, 6, 100, M.verzinkt, xs, 3, T.z);
  for (const dz of [-36, 36]) zyl(7, 3, M.stahl, xs, 7.5, T.z + dz, null, undefined, 6);
  box(41, h, 41, M.verzinkt, xs, 6 + h / 2, T.z);
  for (const y of [y0 + 20, y0 + L - 20]) zyl(4, 3, M.stahl, x0 + s * 1.5, y, T.z, 'x', undefined, 6);   // Schrauben im Wannenboden
  for (const y of [y0, y0 + L]) kantenschutz(x0, y, T.z, 'z', T.B, [s, 0, 0], T.H);                                     // an beiden Enden
}
// Prüfstation (tief), senkrechte Wanne vor dem Kipper
kabelrinne(V(T.xStufe, T.yPruef, T.z), 0, { L: T.xEnde - T.xStufe, B: T.B, H: T.H, enden: [0, T.xEnde - T.xStufe], trennsteg: steg });
senkrecht(T.xStufe, T.yPruef + R, T.yHinten - T.yPruef - 2 * R, 1);
for (const x of [3050, 3650, 4200, 4660]) bodenstuetze(x, T.z, T.yPruef, 'z', 112, [zW, zV]);
label('Kabelwanne Prüfstation', anlage, 4300, T.yPruef + 120, zW, 'klein');
// Hinter Band 2 (Bandhöhe): an beiden Enden Kantenschutz, die senkrechten Wannen stehen um R versetzt davor
kabelrinne(V(T.xFall + R, T.yHinten, T.z), 0, { L: T.xStufe - T.xFall - 2 * R, B: T.B, H: T.H, trennsteg: steg });
for (const x of [T.xFall + R, T.xStufe - R]) kantenschutz(x, T.yHinten, T.z, 'z', T.B, [0, 1, 0], T.H);
senkrecht(T.xFall, T.yUnten + R, T.yHinten - T.yUnten - 2 * R, -1);
for (const x of [560, 900, 1650, 2000, 2350, 2700]) bodenstuetze(x, T.z, T.yHinten, 'z', 112, [zW, zV]);
for (const x of [1210, 1330, 1420]) {                                  // Wandkonsolen an der Tankrückwand (Tank x 1180 … 1540)
  box(30, 50, 4, M.verzinkt, x, T.yHinten - 25, 1178);
  box(30, 6, 1176 - zW + 4, M.verzinkt, x, T.yHinten - 3, (1176 + zW - 4) / 2);
  zyl(4, 3, M.stahl, x, T.yHinten - 35, 1174.5, 'z', undefined, 6);
}
label('Kabelwanne hinter Band 2', anlage, 1900, T.yHinten + 110, zW, 'klein');
// Flach am Boden zur Wanne zwischen Band 1 und Zinnbad (Anbau an deren Seitenwand bei x = xRI + 100), hinten mit Endstück
// unter der senkrechten Wanne
const X_RI = T.xRI + 100;
const flach = kabelrinne(V(X_RI, T.yUnten, T.z), 0, { L: T.xFall - X_RI, B: T.B, H: T.H, enden: [T.xFall - X_RI], trennsteg: steg });
anbauT(flach, 30, T.B, T.H);                                            // Verbindungswinkel innen am Anfang (lokal 0 … 30)
bodenstuetze(340, T.z, T.yUnten, 'z', 112, [zW, zV]);

// Punkt aus b2g-Koordinaten in Anlagenkoordinaten und umgekehrt
export const ausB2 = (p) => V(B2.xm + p.z, p.y, B2.z - p.x);
export const inB2 = (p) => V(B2.z - p.z, p.y, p.x - B2.xm);
// Leitung eines Geräts an Band 2 in die Trasse legen: pkte (lokal b2g) enden über der Wanne
export function inWanneB2(pkte, mat = M.kabelGrau, r = 2.6, art) {
  zurTrasse(pkte.map(ausB2), mat, r, { art });
}
