import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { V, box, cached, mesh, zyl } from '../core/geometrie.js';
import { dekor, platte, tafel } from '../core/beschriftung.js';
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
// Linearführung HIWIN: 2 × Profilschiene HGR15 auf der Traversen-Vorderseite (z −215), mittig über den Nuten 10
// (Raster 45 → y = 1250 ± 22,5). Befestigung je Bohrung mit Zylinderschraube DIN 912 M4×16 in der Flachsenkung
// (Ø 7,5 × 5,3) und Nutenstein Nut 10 M4 im Profil. Teilung P = 60, Randabstand E = 20, L = 23 × 60 + 2 × 20 = 1420.
export const HG = { y: [PORTAL_Y - 22.5, PORTAL_Y + 22.5], z: PORTAL_Z + 45, L: 1420, xm: 30, P: 60, E: 20, wagenX: 70 };
// Querschnitt (u = quer, v = Höhe über Anschraubfläche) entlang der Fahrachse x extrudieren: u → y, v → +z, Länge → x
function hgGeo(key, punkte, len) {
  return cached(key, () => {
    const sh = new THREE.Shape(); punkte.forEach(([u, v], i) => i ? sh.lineTo(u, v) : sh.moveTo(u, v)); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false });
    g.translate(0, 0, -len / 2);
    g.applyMatrix4(new THREE.Matrix4().makeBasis(V(0, 1, 0), V(0, 0, 1), V(1, 0, 0)));
    return g;
  });
}
const HGR15 = [[-7.5, 0], [7.5, 0], [7.5, 7.5], [6.4, 8.8], [7.5, 10.1], [7.5, 13.2], [5.7, 15], [-5.7, 15], [-7.5, 13.2], [-7.5, 10.1], [-6.4, 8.8], [-7.5, 7.5]];
{
  const nB = Math.round((HG.L - 2 * HG.E) / HG.P) + 1, n = nB * 2;
  const senk = new THREE.InstancedMesh(new THREE.CylinderGeometry(3.75, 3.75, 0.6, 16), dekor(M.schwarz.clone()), n);
  const kopf = new THREE.InstancedMesh(new THREE.CylinderGeometry(3.4, 3.4, 0.5, 16), dekor(M.stahl.clone()), n);
  const ix = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.5, 1.5, 0.3, 6), dekor(M.schwarz.clone()), n);
  const stein = new THREE.InstancedMesh(new THREE.BoxGeometry(20, 16, 4.5), M.verzinkt, n);
  const d = new THREE.Object3D();
  let i = 0;
  for (const y of HG.y) {
    mesh(hgGeo('hgr15|' + HG.L, HGR15, HG.L), M.stahl, anlage).position.set(HG.xm, y, HG.z);
    for (let k = 0; k < nB; k++, i++) {
      const x = HG.xm - HG.L / 2 + HG.E + k * HG.P;
      d.rotation.set(Math.PI / 2, 0, 0);
      for (const [m, z] of [[senk, 15.2], [kopf, 15.75], [ix, 16.15]]) { d.position.set(x, y, HG.z + z); d.updateMatrix(); m.setMatrixAt(i, d.matrix); }
      d.rotation.set(0, 0, 0); d.position.set(x, y, HG.z - 4.3 - 2.25); d.updateMatrix(); stein.setMatrixAt(i, d.matrix);   // Nutenstein hinter dem Nutsteg
    }
  }
  for (const m of [senk, kopf, ix, stein]) anlage.add(m);
}
export const mm3 = profilZylinder(anlage, {
  laenge: 540, bohrung: 40, position: new THREE.Vector3(-660, 1330, PORTAL_Z), name: '−MM3 Verschieben', fuesse: true, drossel: 'MM3',
  sensoren: [{ x: 60, signal: 'BG5_MM3_Band', text: '−BG5', dir: -1 }, { x: 480, signal: 'BG6_MM3_Bad', text: '−BG6', dir: 1 }],
});
// Endanschläge der Verschiebeachse: unter der Traverse (oben sitzt −MM3), je ein Anschlagwinkel Alu 12/15 mm mit
// 2 × DIN 912 M6 und Nutensteinen Nut 10 in den unteren Nuten (z = −260 ± 22,5). Darin ein Industrie-Stoßdämpfer
// M14×1 (Hub 12, Aufprallkappe Ø 12) mit zwei Kontermuttern. Er trifft die gehärtete Anschlagleiste an der Kante der
// Schlittenplatte (y 1170, z −177) genau in der Endlage: Band (Schlitten x 0) bzw. Bad (Schlitten x 430).
export const ANSCHLAG = { y: 1170, z: -177, leiste: 121 };
for (const [kontakt, s] of [[-ANSCHLAG.leiste, -1], [430 + ANSCHLAG.leiste, 1]]) {
  const x = (d) => kontakt + s * d;                              // d = Abstand von der Kontaktfläche nach außen
  const { y, z } = ANSCHLAG;
  zyl(6, 6, M.schwarz, x(3), y, z, 'x', anlage, 16);             // Aufprallkappe
  zyl(2.5, 12, M.stahl, x(12), y, z, 'x', anlage, 10);           // Kolbenstange
  zyl(7, 58, M.stahl, x(47), y, z, 'x', anlage, 16);             // Gewindekörper M14×1
  zyl(5, 4, M.anthrazit, x(78), y, z, 'x', anlage, 12);          // Endkappe mit Einstellung
  for (const d of [32, 53]) zyl(11, 6, M.stahl, x(d), y, z, 'x', anlage, 6);   // Kontermuttern SW 19
  box(15, 43, 40, M.deckel, x(42.5), 1171.5, z, anlage);         // senkrechter Schenkel mit Gewindebohrung
  box(35, 12, 135, M.deckel, x(42.5), 1199, -227.5, anlage);     // waagrechter Schenkel an der Traversenunterseite
  for (const zz of [-282.5, -237.5]) {
    zyl(5, 6, M.stahl, x(42.5), 1190, zz, null, anlage, 12);       // DIN 912 M6
    zyl(2.5, 1, M.schwarz, x(42.5), 1186.5, zz, null, anlage, 6);
    box(20, 4.5, 16, M.verzinkt, x(42.5), 1205 + 4.3 + 2.25, zz, anlage);   // Nutenstein im Profil
  }
}
// Kettenwanne hinter der Traverse
export const KETTE = { xa: -100, y: 1313, z: -345, R: 38, glied: 22 };
box(1394, 4, 44, M.profil, -100, 1303, KETTE.z);                                              // Boden endet zwischen den Wangen
for (const sz of [-1, 1]) box(1400, 22, 3, M.profil, -100, 1316, KETTE.z + sz * 22);              // Wangen stehen auf dem Boden
// Konsolwinkel L 40×40×4 mit Nutensteinen in der hinteren Traversennut, Wanne darauf verschraubt
for (const x of [-700, -300, 150, 560]) {
  box(30, 57, 4, M.deckel, x, 1268.5, -307);                                        // senkrechter Schenkel an der Traverse, endet unter dem waagrechten
  box(30, 4, 70, M.deckel, x, 1299, -340);                                          // waagrechter Schenkel unter der Wanne
  for (const y of [1255, 1285]) zyl(4, 2, M.stahl, x, y, -310, 'z', anlage, 8);      // Schrauben in die Nutensteine
}

// Schlitten (bewegt mit −MM3)
export const schlitten = new THREE.Group();
anlage.add(schlitten);
// Führungswagen HIWIN HGH15CA (H 28, W 34, L 61,4): Stahlkörper L1 39,4, Kopfstücke mit Umlenkung, Abstreifdichtungen,
// Schmiernippel M4 an einem Ende. Die Schlittenplatte liegt auf der Wagenoberseite (z −215 + 28 = −187) und ist
// mit 4 × DIN 912 M4 je Wagen von vorn in die Gewinde des Wagens geschraubt.
{
  const koerper = hgGeo('hgh15k', [[-17, 4.3], [-8, 4.3], [-8, 15.5], [8, 15.5], [8, 4.3], [17, 4.3], [17, 28], [-17, 28]], 39.4);
  const kopfst = hgGeo('hgh15e', [[-16.4, 5], [-8.2, 5], [-8.2, 15.7], [8.2, 15.7], [8.2, 5], [16.4, 5], [16.4, 26.4], [-16.4, 26.4]], 9.5);
  const dicht = hgGeo('hgh15d', [[-16, 5.2], [-7.7, 5.2], [-7.7, 15.3], [7.7, 15.3], [7.7, 5.2], [16, 5.2], [16, 26], [-16, 26]], 1.5);
  const logo = tafel('hiwin', 22, 6, (c) => { c.fillStyle = '#16191c'; c.fillRect(0, 0, 22, 6); c.fillStyle = '#e8eaec'; c.font = '700 4.6px Arial'; c.textAlign = 'center'; c.fillText('HIWIN', 11, 4.7); }, 10);
  for (const sx of [-1, 1]) for (const y of HG.y) {
    const w = new THREE.Group(); w.position.set(sx * HG.wagenX, y, HG.z); schlitten.add(w);
    mesh(koerper, M.stahl, w);
    for (const e of [-1, 1]) {
      mesh(kopfst, M.schwarz, w).position.x = e * (19.7 + 4.75);
      mesh(dicht, M.anthrazit, w).position.x = e * (19.7 + 9.5 + 0.75);
      for (const u of [-11, 11]) zyl(1.4, 1, M.stahl, e * 30.7, u, 16, 'x', w, 6);     // Schrauben der Dichtung
    }
    zyl(2.5, 6, M.messing, 33.7 * sx, 0, 20, 'x', w, 8);                                // Schmiernippel (außen)
    platte(logo, 9, 4, w, -sx * 30.8, 0, 22, -sx * Math.PI / 2);                       // Typschild am inneren Kopfstück
    for (const a of [-13, 13]) for (const b of [-13, 13]) {
      zyl(3.5, 4, M.stahl, sx * HG.wagenX + a, y + b, -165, 'z', schlitten, 12);         // DIN 912 M4 auf der Platte
      zyl(1.5, 1, M.schwarz, sx * HG.wagenX + a, y + b, -162.6, 'z', schlitten, 6);
    }
  }
}
box(230, 220, 20, M.deckel, 0, PORTAL_Y, -177, schlitten);                           // X-Schlittenplatte 20 mm (z −187 … −167)
for (const sx of [-1, 1]) {                                                       // gehärtete Anschlagleisten an der Plattenkante
  box(6, 30, 20, M.anthrazit, sx * 118, ANSCHLAG.y, ANSCHLAG.z, schlitten);
  for (const dy of [-9, 9]) zyl(2.5, 1, M.stahl, sx * 121.5, ANSCHLAG.y + dy, ANSCHLAG.z, 'x', schlitten, 8);
}
box(200, 12, 117.5, M.deckel, 0, 1307, -245.75, schlitten);                     // Kopfplatte, stirnseitig an der Schlittenplatte
box(30, 44, 40, M.deckel, -85, 1335, PORTAL_Z, schlitten);
zyl(8, 520, M.stahl, -100 - 260, 1330, PORTAL_Z, 'x', schlitten);
zyl(14, 22, M.stahl, -112, 1330, PORTAL_Z, 'x', schlitten, 24);                 // Ausgleichskupplung
zyl(11, 6, M.stahl, -126, 1330, PORTAL_Z, 'x', schlitten, 6);
box(20, 96, 20, M.deckel, 60, 1361, -295, schlitten);
box(24, 8, 60, M.deckel, 60, 1409, -320, schlitten);
// Konsole: zwei trapezförmige Seitenwangen (220 hoch an der Schlittenplatte, 380 an der Z-Grundplatte) und ein Querschott
// bilden mit beiden Platten einen geschlossenen Kasten
{
  const s = new THREE.Shape();
  s.moveTo(-167, 1140); s.lineTo(-167, 1360); s.lineTo(-57, 1440); s.lineTo(-57, 1060); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 15, bevelEnabled: false });
  for (const x of [115, -100]) { const w = mesh(geo, M.deckel, schlitten); w.rotation.y = -Math.PI / 2; w.position.x = x; }
  box(200, 15, 110, M.deckel, 0, 1147.5, -112, schlitten);                     // Querschott
}
box(310, 510, 20, M.deckel, 5, 1245, -47, schlitten);                             // Z-Grundplatte 20 mm (x −150 … 160, y 990 … 1500)
for (const x of [-135, 145]) for (const y of [1080, 1250, 1420]) zyl(4.5, 2, M.stahl, x, y, -36, 'z', schlitten, 12);
// Unterer Führungsblock: zwei Linearkugellager, Durchgang Kolbenstange, −MM2 über die Deckelgewinde M8 aufgeschraubt
box(190, 40, 72, M.deckel, 0, 1016, -1, schlitten);
for (const sx of [-1, 1]) {
  for (const y of [995, 1037]) zyl(10.5, 2, M.schwarz, sx * 62, y, 0, null, schlitten, 20);   // Abstreifdichtungen
  zyl(2, 5, M.messing, sx * 62, 1016, 37, 'z', schlitten, 6);                                 // Schmiernippel
}
for (const sx of [-1, 1]) for (const sy of [-1, 1]) zyl(3.5, 3, M.stahl, sx * 85, 1016 + sy * 12, 36, 'z', schlitten, 8);
// Führungseinheit für −MM2: Linear-Kugelbuchsen in Alu-Gehäuseeinheiten (Flanschfuß an der Schlittenplatte), Führungsstangen Ø 16 h6
for (const sx of [-1, 1]) for (const y of [1300]) {                                 // obere Lagereinheiten (unten: Führungsblock)
  box(46, 52, 8, M.festoAlu, sx * 62, y, -33, schlitten);                                        // Flanschfuß
  box(22, 52, 22, M.festoAlu, sx * 62, y, -18, schlitten);                                       // Steg
  zyl(15, 54, M.festoAlu, sx * 62, y, 0, null, schlitten, 24);                                   // Gehäuse um die Kugelbuchse (1 mm über den Steg)
  for (const dy of [-27, 27]) zyl(10.5, 2, M.schwarz, sx * 62, y + dy, 0, null, schlitten, 20);  // Abstreifdichtungen
  zyl(2, 5, M.messing, sx * 62, y, 16, 'z', schlitten, 6);                                        // Schmiernippel
  for (const dx of [-17, 17]) for (const dy of [-18, 18]) zyl(3, 1.5, M.schwarz, sx * 62 + dx, y + dy, -28.3, 'z', schlitten, 8);
}
export const mm2 = profilZylinder(schlitten, {
  laenge: 440, bohrung: 50, position: new THREE.Vector3(0, 1480, 0), rotation: new THREE.Euler(0, 0, -Math.PI / 2), name: '−MM2 Tauchen', drossel: 'MM2',
  sensoren: [{ x: 40, signal: 'BG3_MM2_oben', text: '−BG3', dir: -1 }, { x: 400, signal: 'BG4_MM2_unten', text: '−BG4', dir: 1 }],
});

// Hubteil (bewegt mit −MM2): Joch, Stange, Führungsstangen, Hakengreifer mit −MM1
export const haken = new THREE.Group();
schlitten.add(haken);
zyl(10, 560, M.stahl, 0, 604 + 280, 0, null, haken);
zyl(15, 10, M.stahl, 0, 638, 0, null, haken, 6);                                // Kontermutter
zyl(16, 26, M.stahl, 0, 617, 0, null, haken, 24);                               // Ausgleichskupplung
zyl(11, 5, M.schwarz, 0, 632, 0, null, haken, 16);
// Mitnehmerschwert (Alu-Profil 20×30) auf der Adapterplatte: holt das bewegte Ende der Hub-Energiekette von unten ab
box(50, 8, 40, M.deckel, 125, 608, -12, haken);                                   // Fußwinkel
box(8, 30, 12, M.deckel, 105, 627, -12, haken);                                   // Rippe Fußwinkel
profil(30, 20, 468, 'y', 125, 846, -12, haken);
for (const sx of [-1, 1]) zyl(8, 760, M.stahl, sx * 62, 604 + 380, 0, null, haken);
// Hakeneinheit unter dem Joch: Schwenkhaken mit Drehpunkt
//  - Hakenträger: EINE Platte 20 mm (Joch und Adapter in einem Teil), darin Führungsstangen und Kolbenstange;
//    darunter zwei Lagerwangen 10 mm, die BEIDE Drehpunkte tragen – Hakenwelle (P, Gleitlager) und
//    Zylinderschwenkbolzen (C, mit Distanzhülsen). Ein Kraftfluss: Haken → Wangen → Platte → Stangen.
//  - Hakenkörper: Welle, zwei J-Haken (z = ±30) mit Sitzmulde und Sicherungsnase, Hebel nach oben (Länge 45)
//  - −MM1 Kompaktzylinder Ø25 / Hub 25 mit Schwenkbefestigung (Lagerbock, Drehpunkt C) und Gabelkopf am Hebel (L)
//  Einfahren (−BG1) zieht den Hebel nach rechts → Haken schwenkt unter den Bügel (eingehängt),
//  Ausfahren (−BG2) drückt den Hebel nach links → Haken schwenkt frei (gelöst).
const HK = { P: V(40, 500, 0), C: V(200, 545, 0), hebel: 45, d0: 160 };
box(345, 20, 110, M.blau, 77.5, 594, 0, haken);                                   // Hakenträger x −95 … 250, y 584 … 604
for (const sx of [-1, 1]) for (const sz of [-1, 1]) zyl(4.5, 2, M.stahl, sx * 62 + sx * 18, 605, sz * 18, null, haken, 12);   // Klemmschrauben Führungsstangen
{
  const s = new THREE.Shape();                                                    // Kontur der Lagerwange (x, y)
  s.moveTo(15, 584); s.lineTo(224, 584); s.lineTo(224, 528); s.lineTo(176, 524);
  s.lineTo(78, 506); s.lineTo(64, 484); s.lineTo(18, 484); s.closePath();
  s.holes.push(new THREE.Path().absarc(HK.P.x, HK.P.y, 11, 0, Math.PI * 2, true));
  // Sichtfenster auf −MM1 und den Haken: ausgefräst bis auf 10 mm Rand, Augen um P (Lager) und C (Bolzen) bleiben stehen
  const f = new THREE.Path(), ecke = [[25, 574], [173, 574], [173, 534], [80, 516], [62, 524], [25, 526]];
  ecke.forEach(([x, y], i) => i ? f.lineTo(x, y) : f.moveTo(x, y)); f.closePath();
  s.holes.push(f);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 10, bevelEnabled: false, curveSegments: 16 });
  for (const sz of [-1, 1]) {
    const w = mesh(geo, M.blau, haken); w.position.z = sz > 0 ? 42 : -52;
    for (const x of [35, 120, 205]) zyl(4.5, 2, M.stahl, x, 605, sz * 47, null, haken, 12);   // Schrauben Wange → Platte (von oben)
    zyl(10.8, 12, M.messing, HK.P.x, HK.P.y, sz * 47, 'z', haken, 24);            // Gleitlagerbuchse in der Wange
    zyl(14, 1.5, M.messing, HK.P.x, HK.P.y, sz * 52.75, 'z', haken, 24);          // Bund der Buchse außen an der Wange
    zyl(7, 34, M.stahl, HK.C.x, HK.C.y, sz * 24.5, 'z', haken, 16);               // Distanzhülse zum Lagerauge
    zyl(7, 3, M.schwarz, HK.C.x, HK.C.y, sz * 53.5, 'z', haken, 16);              // Sicherungsring Bolzen C
  }
}
zyl(4, 108, M.stahl, HK.C.x, HK.C.y, 0, 'z', haken, 12);                          // Bolzen Drehpunkt C durch beide Wangen
// Hakenkörper (dreht um P)
export const hakenKoerper = new THREE.Group(); hakenKoerper.position.copy(HK.P); haken.add(hakenKoerper);
zyl(6, 114, M.stahl, 0, 0, 0, 'z', hakenKoerper, 20);                            // Hakenwelle
for (const sz of [-1, 1]) zyl(7.5, 3, M.schwarz, 0, 0, sz * 55, 'z', hakenKoerper, 16);   // vor dem Buchsenbund   // Sicherungsringe
for (const sz of [-30, 30]) {
  box(14, 74, 8, M.edelstahl, 0, -30, sz, hakenKoerper);                         // Schenkel (Nabe an der Welle)
  zyl(10, 10, M.edelstahl, 0, 0, sz, 'z', hakenKoerper, 20);                     // Nabe steht 1 mm über den Schenkel
  box(43, 8, 8, M.edelstahl, -28.5, -63, sz, hakenKoerper);                      // Boden mit Sitzmulde (stößt an den Schenkel)
  box(27, 4, 8, M.edelstahl, -20.5, -57, sz, hakenKoerper);                      // Muldenrand rechts (Oberkante 445)
  box(6, 16, 8, M.edelstahl, -53, -59, sz, hakenKoerper);                        // Sicherungsnase (Oberkante 449)
}
box(12, 56, 10, M.edelstahl, 0, 22, 0, hakenKoerper);                             // Hebel
zyl(4, 22, M.stahl, 0, HK.hebel, 0, 'z', hakenKoerper, 12);                       // Bolzen Gabelkopf
// −MM1 (dreht um C)
export const mm1Piv = new THREE.Group(); mm1Piv.position.copy(HK.C); haken.add(mm1Piv);
zyl(9, 14, M.deckel, 0, 0, 0, 'z', mm1Piv, 20);                                   // Lagerauge am Zylinderboden
export const mm1 = profilZylinder(mm1Piv, {
  laenge: 100, bohrung: 25, position: V(-12, 0, 0), rotation: new THREE.Euler(Math.PI / 2, Math.PI, 0), name: '−MM1 Einhängen', seite: -1, drossel: 'MM1',
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

