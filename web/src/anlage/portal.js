import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { V, box, zyl } from '../core/geometrie.js';
import { profil } from '../bauteile/aluprofil.js';
import { profilZylinder } from '../bauteile/zylinder.js';

// ----------------------------------------------------------------------------
// Portal: Säulen 90x90, Traverse mit Linearführung, Verschiebezylinder −MM3
// ----------------------------------------------------------------------------
export const PORTAL_Y = 1250, PORTAL_Z = -260;
for (const x of [-700, 760]) {
  profil(90, 90, PORTAL_Y - 45 - 15 - 2, 'y', x, (PORTAL_Y - 45 + 15 - 2) / 2, PORTAL_Z);   // Säule endet unter der Traverse (Endkappe 2 mm)
  box(180, 15, 180, M.deckel, x, 7.5, PORTAL_Z);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) zyl(7, 6, M.stahl, x + sx * 70, 18, PORTAL_Z + sz * 70, null, anlage, 6);
  // Knotenbleche Säule/Traverse
  for (const sz of [-1, 1]) box(120, 150, 4, M.deckel, x, PORTAL_Y - 60, PORTAL_Z + sz * 47);     // Knotenbleche vorn/hinten über Säule und Traverse
}
profil(90, 90, 1550, 'x', 30, PORTAL_Y, PORTAL_Z);
for (const y of [PORTAL_Y - 25, PORTAL_Y + 25]) box(1440, 15, 15, M.stahl, 30, y, PORTAL_Z + 52);
export const mm3 = profilZylinder(anlage, {
  laenge: 540, bohrung: 40, position: new THREE.Vector3(-660, 1330, PORTAL_Z), name: '−MM3 Verschieben', fuesse: true,
  sensoren: [{ x: 60, signal: 'BG5_MM3_Band', text: '−BG5', dir: -1 }, { x: 480, signal: 'BG6_MM3_Bad', text: '−BG6', dir: 1 }],
});
// Endanschläge der Verschiebeachse mit Industrie-Stoßdämpfern
for (const [x, dir] of [[-158, 1], [578, -1]]) {
  box(30, 56, 50, M.anthrazit, x, 1322, -185);
  zyl(6, 34, M.stahl, x + dir * 31, 1330, -170, 'x', anlage, 16);
  zyl(9, 6, M.schwarz, x + dir * 50, 1330, -170, 'x', anlage, 16);
}
// Kettenwanne hinter der Traverse
export const KETTE = { xa: -100, y: 1313, z: -345, R: 38, glied: 22 };
box(1400, 4, 44, M.profil, -100, 1303, KETTE.z);
for (const sz of [-1, 1]) box(1400, 26, 3, M.profil, -100, 1314, KETTE.z + sz * 22);
for (const x of [-700, -300, 150, 560]) box(20, 6, 50, M.deckel, x, 1300, -320);

// Schlitten (bewegt mit −MM3)
export const schlitten = new THREE.Group();
anlage.add(schlitten);
for (const sx of [-1, 1]) for (const y of [PORTAL_Y - 25, PORTAL_Y + 25]) box(48, 26, 22, M.anthrazit, sx * 70, y, PORTAL_Z + 70, schlitten);
box(230, 200, 15, M.deckel, 0, PORTAL_Y, PORTAL_Z + 88, schlitten);
for (const sx of [-1, 1]) box(4, 20, 30, M.schwarz, sx * 117, 1330, -170, schlitten);       // Anschlagleisten
box(200, 12, 125, M.deckel, 0, 1307, PORTAL_Z + 18, schlitten);
box(30, 44, 40, M.deckel, -85, 1335, PORTAL_Z, schlitten);
zyl(8, 520, M.stahl, -100 - 260, 1330, PORTAL_Z, 'x', schlitten);
zyl(14, 22, M.stahl, -112, 1330, PORTAL_Z, 'x', schlitten, 24);                 // Ausgleichskupplung
zyl(11, 6, M.stahl, -126, 1330, PORTAL_Z, 'x', schlitten, 6);
box(20, 96, 20, M.deckel, 60, 1361, -295, schlitten);
box(24, 8, 60, M.deckel, 60, 1409, -320, schlitten);
box(160, 40, 125, M.deckel, 0, 1170, -102, schlitten);
box(170, 470, 10, M.deckel, 0, 1262, -42, schlitten);
// Führungseinheit für −MM2: Linear-Kugelbuchsen in Alu-Gehäuseeinheiten (Flanschfuß an der Schlittenplatte), Führungsstangen Ø 16 h6
for (const sx of [-1, 1]) for (const y of [1080, 1300]) {
  box(46, 52, 8, M.festoAlu, sx * 62, y, -33, schlitten);                                        // Flanschfuß
  box(22, 52, 22, M.festoAlu, sx * 62, y, -18, schlitten);                                       // Steg
  zyl(15, 52, M.festoAlu, sx * 62, y, 0, null, schlitten, 24);                                   // Gehäuse um die Kugelbuchse
  for (const dy of [-27, 27]) zyl(10.5, 2, M.schwarz, sx * 62, y + dy, 0, null, schlitten, 20);  // Abstreifdichtungen
  zyl(2, 5, M.messing, sx * 62, y, 16, 'z', schlitten, 6);                                        // Schmiernippel
  for (const dx of [-17, 17]) for (const dy of [-18, 18]) zyl(3, 1.5, M.schwarz, sx * 62 + dx, y + dy, -28.3, 'z', schlitten, 8);
}
export const mm2 = profilZylinder(schlitten, {
  laenge: 440, bohrung: 50, position: new THREE.Vector3(0, 1480, 0), rotation: new THREE.Euler(0, 0, -Math.PI / 2), name: '−MM2 Tauchen',
  sensoren: [{ x: 40, signal: 'BG3_MM2_oben', text: '−BG3', dir: -1 }, { x: 400, signal: 'BG4_MM2_unten', text: '−BG4', dir: 1 }],
});

// Hubteil (bewegt mit −MM2): Joch, Stange, Führungsstangen, Hakengreifer mit −MM1
export const haken = new THREE.Group();
schlitten.add(haken);
zyl(10, 560, M.stahl, 0, 604 + 280, 0, null, haken);
zyl(15, 10, M.stahl, 0, 638, 0, null, haken, 6);                                // Kontermutter
zyl(16, 26, M.stahl, 0, 617, 0, null, haken, 24);                               // Ausgleichskupplung
zyl(11, 5, M.schwarz, 0, 632, 0, null, haken, 16);
box(190, 14, 70, M.blau, 0, 597, 0, haken);
for (const sx of [-1, 1]) zyl(8, 760, M.stahl, sx * 62, 604 + 380, 0, null, haken);
// Hakeneinheit unter dem Joch: Schwenkhaken mit Drehpunkt
//  - Adapterplatte am Joch, darunter zwei Lagerböcke mit Gleitlagern für die Hakenwelle (Drehpunkt P)
//  - Hakenkörper: Welle, zwei J-Haken (z = ±30) mit Sitzmulde und Sicherungsnase, Hebel nach oben (Länge 45)
//  - −MM1 Kompaktzylinder Ø25 / Hub 25 mit Schwenkbefestigung (Lagerbock, Drehpunkt C) und Gabelkopf am Hebel (L)
//  Einfahren (−BG1) zieht den Hebel nach rechts → Haken schwenkt unter den Bügel (eingehängt),
//  Ausfahren (−BG2) drückt den Hebel nach links → Haken schwenkt frei (gelöst).
const HK = { P: V(40, 500, 0), C: V(200, 545, 0), hebel: 45, d0: 160 };
box(300, 12, 110, M.blau, 100, 584, 0, haken);                                    // Adapterplatte am Joch
for (const x of [-30, 60, 230]) for (const sz of [-1, 1]) zyl(4.5, 3, M.schwarz, x, 576.5, sz * 42, null, haken, 12);
for (const sz of [-1, 1]) {                                                       // Lagerböcke der Hakenwelle
  box(34, 90, 10, M.blau, HK.P.x, 533, sz * 47, haken);
  zyl(11, 12, M.messing, HK.P.x, HK.P.y, sz * 47, 'z', haken, 24);                // Gleitlagerbuchse
}
for (const sz of [-1, 1]) box(28, 40, 6, M.blau, HK.C.x + 4, 558, sz * 13, haken); // Lagerbock Zylinderboden
zyl(4, 34, M.stahl, HK.C.x, HK.C.y, 0, 'z', haken, 12);                           // Bolzen Drehpunkt C
// Hakenkörper (dreht um P)
export const hakenKoerper = new THREE.Group(); hakenKoerper.position.copy(HK.P); haken.add(hakenKoerper);
zyl(6, 102, M.stahl, 0, 0, 0, 'z', hakenKoerper, 20);                            // Hakenwelle
for (const sz of [-1, 1]) zyl(7.5, 3, M.schwarz, 0, 0, sz * 53.5, 'z', hakenKoerper, 16);   // Sicherungsringe
for (const sz of [-30, 30]) {
  box(14, 74, 8, M.edelstahl, 0, -30, sz, hakenKoerper);                         // Schenkel (Nabe an der Welle)
  zyl(10, 8, M.edelstahl, 0, 0, sz, 'z', hakenKoerper, 20);
  box(56, 8, 8, M.edelstahl, -22, -63, sz, hakenKoerper);                        // Boden mit Sitzmulde x −10…6
  box(28, 4, 8, M.edelstahl, -20, -57, sz, hakenKoerper);                        // Muldenrand rechts (Oberkante 445)
  box(6, 16, 8, M.edelstahl, -53, -59, sz, hakenKoerper);                        // Sicherungsnase (Oberkante 449)
}
box(12, 56, 10, M.edelstahl, 0, 22, 0, hakenKoerper);                             // Hebel
zyl(4, 22, M.stahl, 0, HK.hebel, 0, 'z', hakenKoerper, 12);                       // Bolzen Gabelkopf
// −MM1 (dreht um C)
export const mm1Piv = new THREE.Group(); mm1Piv.position.copy(HK.C); haken.add(mm1Piv);
zyl(9, 14, M.deckel, 0, 0, 0, 'z', mm1Piv, 20);                                   // Lagerauge am Zylinderboden
export const mm1 = profilZylinder(mm1Piv, {
  laenge: 100, bohrung: 25, position: V(-12, 0, 0), rotation: new THREE.Euler(Math.PI / 2, Math.PI, 0), name: '−MM1 Einhängen', seite: -1,
  sensoren: [{ x: 30, signal: 'BG1_MM1_eingehaengt', text: '−BG1' }, { x: 70, signal: 'BG2_MM1_geloest', text: '−BG2' }],
});
export const mm1Stange = new THREE.Group(); mm1Piv.add(mm1Stange);                     // Kolbenstange + Gabelkopf, Ende bei −d
zyl(5, 110, M.stahl, 55, 0, 0, 'x', mm1Stange, 16);
box(22, 16, 22, M.stahl, 4, 0, 0, mm1Stange);                                     // Gabelkopf
zyl(7, 5, M.stahl, 18, 0, 0, 'x', mm1Stange, 6);                                  // Kontermutter
// Kinematik: Kolbenweg → Abstand C–L → Hakenwinkel θ (Tabelle) und Zylinderneigung
const hebelPunkt = (th) => V(HK.P.x - HK.hebel * Math.sin(th), HK.P.y + HK.hebel * Math.cos(th), 0);
const HK_TAB = [];
for (let th = -0.3; th <= 1.0; th += 0.002) HK_TAB.push([hebelPunkt(th).distanceTo(HK.C), th]);
HK_TAB.sort((a, b) => a[0] - b[0]);
export function hakenKinematik(hubMm) {
  const d = HK.d0 + hubMm;
  let i = HK_TAB.findIndex(t => t[0] >= d); if (i < 1) i = 1;
  const [d0, t0] = HK_TAB[i - 1], [d1, t1] = HK_TAB[i];
  const th = t0 + (t1 - t0) * (d - d0) / ((d1 - d0) || 1);
  hakenKoerper.rotation.z = th;
  const L = hebelPunkt(th);
  mm1Piv.rotation.z = Math.atan2(-(L.y - HK.C.y), -(L.x - HK.C.x));
  mm1Stange.position.x = -d;
}
hakenKinematik(25);

