import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { V, box, cached, mesh, zyl } from '../core/geometrie.js';
import { label, platte, tafel } from '../core/beschriftung.js';
import { t as tr } from '../core/sprache.js';
import { profil, stellfuss } from '../bauteile/aluprofil.js';
import { profilZylinder, steckverschraubung } from '../bauteile/zylinder.js';
import { stecker } from '../bauteile/stecker.js';
import { SENSOREN } from './register.js';
import { sensorLed } from '../core/leds.js';
import { leitung } from '../bauteile/leitungen.js';
import { BAND_Y } from './baender.js';
import { teilGeometrie } from './koerbe.js';
import { lichtschranke } from '../bauteile/lichtschranke.js';

// ----------------------------------------------------------------------------
// Entleer- und Prüfstation hinter Band 2:
//  Korbkipper −MM8 (Kippmulde mit angetriebenen Rollen, eigener Antrieb −MA7 über −QA12/−QA13, Motorschutz −FA8) → Trichter → Vibrorinne −MA4 (−QA8)
//  → Prüfband −MA5 (−QA9) → Lichtschranke −BG32 + Keyence-Kamera −KF10 (jedes Teil einzeln) → Ausblasdüse −MB16
//  (n.i.O. in den roten Ausschussbehälter) → i.O. in den blauen KLT am Bandende (−BG34 voll).
// ----------------------------------------------------------------------------
export const ST = {
  z: 1520, kipX: 3005, kipY: 400, korbX: 2925,                         // Kippachse P (Wellenmitte), Korbmitte am Endanschlag
  bg37X: 2885,                                                          // Strahl −BG37 Einlauf Mulde (Mulde lokal x = −120, in Grundstellung)
  trX: 3160, trY: 372, rinne0: 3150, rinne1: 3600, rinneY: 262, band0: 3620, band1: 4420, bandY: 236,
  kamX: 3850, duesX: 4050, kltX: 4700, kltVoll: 144, klt: 0, aus: 0, kltTausch: 0,
  teile: [], trichter: [], g: null, kipper: null, zylBody: null, zylStange: null, vBand: 0, vRinne: 0, rinneZeit: 0,
  trig: false, pruefT: 0, ergebnis: null, ergebnisT: 0, blasen: 0, kipBefehl: false, kipFertig: false, korbSumme: new Map(),
  kamLicht: null, ausschussPlane: null, kltPlane: null, rinneGruppe: null,
  ans: {}, zeichnen: [], mm8: null,                                     // Anschlusspunkte / Zeichen-Hooks der Peripherie
  vorOrt: { pruef: false, kip: false },                                 // Vor-Ort −S40 im Bandmodul „automatisch“: Selbsthaltungen
};
// Rollenantrieb der Kippmulde −MA7 (Wendeschützkombination −QA12 vor / −QA13 zurück, Motorschutz −FA8), Geschwindigkeit wie Band 2
export const MULDE = { v: 0, vSoll: 120, a: 300, wende: 0, weg: 0 };
// −MM8: ISO 15552 Ø50 / Hub 200, 5/2-Ventil monostabil (Federrückstellung = Mulde unten)
export const MM8 = { kurz: 'MM8', aus: 'MB15_Kippen', ein: null, mono: true, s0: 'BG30_MM8_unten', s1: 'BG31_MM8_gekippt', hub: 200, zeit: 2.0, x: 0, ventil: -1, v: 0, verz: 0, an0: true, an1: false };
Object.defineProperty(MM8, 'pos', { get() { return this.x / this.hub; } });
// ----------------------------------------------------------------------------
// Korbkipper −MM8 – Auslegung (Maße in mm, Ebene x/y, Kippachse parallel z)
//  Kippachse P (3005 | 400): durchgehende Welle Ø30 in zwei Stehlagern UCP206 (Lagerböcke z = ±145),
//  10 mm über der Korboberkante und 55 mm hinter der Korbstirn → die Mulde schwenkt über die Achse.
//  Schwerkraft wirkt in jeder Stellung (lokal) in +x/+y: der Korb liegt am Endanschlag und unter den
//  Niederhaltern (Formschluss am Korbrand), er kann nicht herausfallen. Abnehmen: 70 mm zurückziehen, anheben.
//  Antrieb: ISO-15552-Zylinder Ø50, Hub 200, Lagerauge am Boden im Lagerbock C (2560 | 140) auf dem
//  hinteren Längsträger, Gabelkopf am Hebel r = 112,8 (Klemmnabe auf dem Wellenende, Ebene z = +210).
//  Bolzenabstand C–L: eingefahren 418 = 40 (Lagerauge) + 296 (Zylinder 96 + Hub) + 40 (Stange) + 42 (Gabelkopf),
//  ausgefahren 618. Hebelwinkel in Ruhe −176,7°; Kippwinkel aus der Geometrie (Tabelle Abstand → Winkel):
//  Hub 200 → 126°. Übertragungswinkel Stange/Hebel ≥ 27° in beiden Endlagen: Moment ≥ 1180 N · 0,113 m
//  · sin 27° ≈ 60 Nm (6 bar) gegen ca. 30 Nm Lastmoment (Mulde ≈ 30 kg + Korb); Abluftdrosseln beidseitig,
//  weil das Lastmoment nach ca. 50° das Vorzeichen wechselt (Zylinder bremst die überkippende Mulde).
//  Die Mulde bleibt in jedem Winkel innerhalb R ≈ 205 um P und damit frei vom Kopf von Band 2 (Trommel ≥ 217).
// ----------------------------------------------------------------------------
export const KIP = { r: 112.8, th0: -176.68 * Math.PI / 180, C: V(2560, 140, 0), d0: 418, zh: 210 };
const hebelPunkt = (phi) => V(ST.kipX + KIP.r * Math.cos(KIP.th0 - phi), ST.kipY + KIP.r * Math.sin(KIP.th0 - phi), 0);
const KIP_TAB = [];
for (let p = -0.05; p <= 2.45; p += 0.002) KIP_TAB.push([hebelPunkt(p).distanceTo(KIP.C), p]);
// Kolbenweg (mm) → Kippwinkel (rad), aus dem Bolzenabstand C–L interpoliert
export function kippWinkel(hubMm) {
  const d = KIP.d0 + hubMm;
  let i = KIP_TAB.findIndex(t => t[0] >= d); if (i < 1) i = 1;
  const [d0, p0] = KIP_TAB[i - 1], [d1, p1] = KIP_TAB[i];
  return p0 + (p1 - p0) * (d - d0) / ((d1 - d0) || 1);
}
export const KIPP_WINKEL = kippWinkel(MM8.hub);                                   // ≈ 2,2 rad (126°)
// Kipper zeichnen: Mulde drehen, Zylinder um C schwenken, Kolbenstange um den Kolbenweg ausfahren
export const KIPPER_NACHFUEHREN = [];                                            // bewegte Leitungen (nur bei Winkeländerung neu)
let phiAlt = NaN;
export function kipperKinematik(hubMm) {
  const phi = kippWinkel(hubMm);
  ST.kipper.rotation.z = -phi;
  const L = hebelPunkt(phi), C = KIP.C;
  ST.zylBody.rotation.z = Math.atan2(L.y - C.y, L.x - C.x);
  ST.zylStange.position.x = Math.hypot(L.x - C.x, L.y - C.y);                     // = d0 + Kolbenweg
  if (Math.abs(phi - phiAlt) > 1e-4) {
    phiAlt = phi;
    ST.kipper.updateMatrixWorld(true); ST.zylBody.updateMatrixWorld(true);
    for (const f of KIPPER_NACHFUEHREN) f(phi);
  }
  return phi;
}
// Trichter: rechteckiger Pyramidenstumpf (Ober- und Unterkante versetzt), Edelstahl
function trichterGeo(o, u) {
  const p = [[o.x0, o.y, o.z0], [o.x1, o.y, o.z0], [o.x1, o.y, o.z1], [o.x0, o.y, o.z1], [u.x0, u.y, u.z0], [u.x1, u.y, u.z0], [u.x1, u.y, u.z1], [u.x0, u.y, u.z1]];
  const pos = [];
  for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0]]) pos.push(...p[a], ...p[b], ...p[b + 4], ...p[a], ...p[b + 4], ...p[a + 4]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  return g;
}
{
  const z = ST.z, P = V(ST.kipX, ST.kipY, z), zh = z + KIP.zh;
  // --- Grundgestell (Aluprofil 45x45 auf Stellfüßen, mit Bodendübeln verankert) ---
  profil(45, 45, 445, 'z', P.x, 72.5, z + 27.5);                                  // Querträger unter den Lagerböcken
  profil(45, 45, 467, 'x', 2749, 72.5, zh);                                       // hinterer Längsträger (trägt den Zylinderbock)
  profil(45, 45, 80, 'x', 2942.5, 72.5, z - 170);                                 // vorderer Ausleger
  for (const [x, zz] of [[P.x, z - 170], [P.x, z + 225], [2535, zh], [2770, zh], [2925, z - 170]]) {
    stellfuss(x, zz); box(70, 4, 70, M.anthrazit, x, 2, zz);
    for (const s of [-1, 1]) zyl(5, 4, M.stahl, x + s * 26, 4, zz + s * 26, null, anlage, 8);   // Bodendübel
  }
  for (const sz of [-1, 1]) {                                                       // Lagerböcke
    const zz = z + sz * 145;
    profil(45, 45, 258, 'y', P.x, 95 + 129, zz);
    for (const sx of [-1, 1]) { box(40, 6, 40, M.anthrazit, P.x + sx * 42.5, 98, zz); box(6, 34, 40, M.anthrazit, P.x + sx * 25.5, 118, zz); }   // Winkel 40x40 Profil–Querträger (Schenkel steht auf dem Fuß)
    box(150, 10, 70, M.anthrazit, P.x, 358, zz);                                    // Kopfplatte
    // Stehlager UCP206 (Achshöhe 36,5): Fuß, Gehäuse, Innenring, Schmiernippel, Schrauben
    box(130, 14, 38, M.anthrazit, P.x, 370, zz);
    zyl(40, 36, M.anthrazit, P.x, P.y, zz, 'z', anlage, 28);
    zyl(22, 42, M.stahl, P.x, P.y, zz, 'z', anlage, 24);
    zyl(3, 10, M.messing, P.x, P.y + 44, zz, null, anlage, 8);
    for (const sx of [-1, 1]) zyl(6, 10, M.schwarz, P.x + sx * 52, 380, zz, null, anlage, 6);
  }
  profil(45, 45, 245, 'z', P.x, 160, z);                                          // Querstrebe zwischen den Lagerböcken (unter dem Schwenkbereich)
  // Lagerbock der Schwenkbefestigung von −MM8 (Gabel, Bolzen Ø12 sichtbar)
  box(110, 10, 80, M.anthrazit, KIP.C.x, 100, zh);
  for (const s of [-1, 1]) { box(50, 46, 8, M.anthrazit, KIP.C.x, 128, zh + s * 22); zyl(14, 10, M.anthrazit, KIP.C.x, KIP.C.y, zh + s * 22, 'z', anlage, 20); }
  zyl(6, 60, M.stahl, KIP.C.x, KIP.C.y, zh, 'z', anlage, 12);                                       // Bolzen endet in den Sicherungsringen
  for (const s of [-1, 1]) zyl(8, 3, M.schwarz, KIP.C.x, KIP.C.y, zh + s * 31.5, 'z', anlage, 12);   // Sicherungsringe

  // --- Kippmulde (dreht um P): Wangen 8 mm, Rollenbahn, Endanschlag mit Schurre, Niederhalter, Seitenführungen ---
  const k = new THREE.Group(); k.position.copy(P); anlage.add(k); ST.kipper = k;
  const wange = (loch) => cached('kipWange' + loch, () => {
    const s = new THREE.Shape();
    s.moveTo(-165, -5); s.lineTo(-42, -5); s.lineTo(-24, 18);
    s.absarc(0, 0, 30, Math.PI * 0.82, -Math.PI * 0.3, true);
    s.lineTo(-8, -140); s.lineTo(-135, -140); s.lineTo(-165, -100); s.closePath();
    s.holes.push(new THREE.Path().absarc(0, 0, 15.5, 0, Math.PI * 2, true));
    if (loch) s.holes.push(new THREE.Path().absarc(ST.bg37X - ST.kipX, -100 + 50, 7, 0, Math.PI * 2, true));   // Durchbruch Ø14 für −BG37
    const g = new THREE.ExtrudeGeometry(s, { depth: 8, bevelEnabled: false, curveSegments: 10 }); g.translate(0, 0, -4);
    return g;
  });
  const pe = new THREE.MeshStandardMaterial({ color: 0xeceae2, roughness: 0.6 });   // PE-UHMW
  for (const sz of [-1, 1]) {
    mesh(wange(sz < 0), M.anthrazit, k).position.z = sz * 92;
    zyl(30, 16, M.anthrazit, 0, 0, sz * 104, 'z', k, 24);                          // Klemmnabe auf der Welle
    for (const a of [0.5, 2.6, 4.7]) zyl(3.5, 3, M.schwarz, 22 * Math.cos(a), 22 * Math.sin(a), sz * 113.5, 'z', k, 8);
    box(140, 18, 8, pe, -95, -86, sz * 84, k);                                     // Seitenführung für Kufen und Korb
    box(71, 5, 35, M.edelstahl, -59.5, -4.5, sz * 70.5, k);                        // Niederhalter: greift 3 mm über den Korbrand
    box(71, 15, 5, M.edelstahl, -59.5, -14.5, sz * 85.5, k);                       // Steg unter dem Niederhalter
  }
  zyl(15, 405, M.stahl, 0, 0, 27.5, 'z', k, 24);                                   // Kippwelle Ø30 (z −175 … +230)
  for (const sz of [-1, 1]) zyl(22, 12, M.stahl, 0, 0, sz * 172, 'z', k, 20);     // Stellringe außen an den Lagern
  for (const x of [-150, -122, -94, -66, -38]) {
    zyl(13, 172, M.stahl, x, -113, 0, 'z', k, 20);                                // Tragrolle Ø26, Oberkante = Bandhöhe
    zyl(4, 200, M.stahl, x, -113, 0, 'z', k, 8);                                   // Achse
    zyl(14, 5, M.schwarz, x, -113, 102, 'z', k, 16);                               // Kettenrad (Rollenkette 3/8")
  }
  for (const x of [-120, -55]) box(30, 12, 176, M.anthrazit, x, -134, 0, k);      // Quertraversen
  box(10, 147, 176, M.edelstahl, -18, -23.5, 0, k);                               // Endanschlag, über den Korbrand als Schurre verlängert
  for (const sz of [-1, 1]) box(2, 30, 30, M.schwarz, -24, -75, sz * 30, k);     // Gummipuffer (Korbstirn liegt an)
  // Korb am Endanschlag −BG33: induktiver Sensor M12 durch den Endanschlag
  zyl(6, 40, M.stahl, -2, -60, -45, 'x', k, 14);                                  // Sensor endet im Endanschlag
  zyl(7.5, 4, M.stahl, -10, -60, -45, 'x', k, 6);
  { const mat = sensorLed(k, 18, -54, -45, 'BG33_Kipper_Korb', 2, 1.4, 3); SENSOREN.push({ signal: 'BG33_Kipper_Korb', mat, div: label('−BG33', k, 10, -30, -60, 'klein') }); }
  // Einlauf Mulde −BG37: Reflexionslichtschranke schwenkt mit der Mulde (Leitung mit −BG33 über die Schleppschleife).
  //  Sensor auf einem Haltewinkel außen an der vorderen Wange, Strahl 50 mm über den Tragrollen quer durch eine Bohrung
  //  in der Wange; Reflektor R-2 innen auf der hinteren Wange über der PE-Seitenführung (außerhalb der Korbbahn).
  //  Außen an der hinteren Wange ist kein Platz (Kettenschutz, Schneckengetriebemotor). Strahl 45 mm hinter dem Muldenanfang:
  //  1, sobald der Korb in die Mulde einläuft, und bis zum Endanschlag (−BG33), auch gekippt (der Korb liegt fest in der Mulde).
  {
    const gm = new THREE.Group(); gm.position.set(ST.bg37X - ST.kipX, -100 - BAND_Y, 0); gm.rotation.y = Math.PI / 2; k.add(gm);
    ST.bg37 = lichtschranke(0, 'BG37_Kipper_Einlauf', '−BG37 Einlauf Mulde', { parent: gm, seite: 1, montage: 'wange', xs: 110, xb: 98, xr: 86 });
  }
  // Rollenantrieb −MA7: Schneckengetriebemotor auf der Rückseite, Rollenkette unter Kettenschutz; eigene Wendeschützkombination −QA12/−QA13
  box(145, 90, 16, M.gelb, -92, -90, 106, k);                                     // Kettenschutz
  box(56, 56, 46, M.anthrazit, -128, -60, 137, k);                                // Schneckengetriebe
  zyl(28, 100, M.anthrazit, -128, -2, 137, null, k, 24);                          // Motor
  zyl(29, 18, M.schwarz, -128, 56, 137, null, k, 24);                             // Lüfterhaube
  box(30, 34, 22, M.anthrazit, -100, 0, 137, k);                                  // Klemmenkasten
  label('Muldenantrieb −MA7', k, -128, 80, 150, 'klein');
  // Hebel auf dem Wellenende (Klemmnabe), Gabelkopfbolzen sichtbar
  zyl(26, 30, M.anthrazit, 0, 0, KIP.zh, 'z', k, 24);
  const hb = new THREE.Group(); hb.rotation.z = KIP.th0; k.add(hb);
  box(KIP.r, 36, 15, M.anthrazit, KIP.r / 2, 0, KIP.zh, hb);
  zyl(18, 17, M.anthrazit, KIP.r, 0, KIP.zh, 'z', hb, 20);
  zyl(6, 52, M.stahl, KIP.r, 0, KIP.zh, 'z', hb, 12);                              // Bolzen Ø12 Gabelkopf
  for (const s of [-1, 1]) zyl(8, 3, M.schwarz, KIP.r, 0, KIP.zh + s * 25, 'z', hb, 12);
  label('Korbkipper −MM8', k, -90, 120, 0, 'cyl');

  // --- Schwenkzylinder −MM8 (dreht um C), Kolbenstange mit Gabelkopf (Ursprung = Bolzen L) ---
  const zg = new THREE.Group(); zg.position.set(KIP.C.x, KIP.C.y, zh); anlage.add(zg); ST.zylBody = zg;
  zyl(16, 34, M.deckel, 0, 0, 0, 'z', zg, 20);                                    // Lagerauge am Zylinderboden
  box(26, 30, 34, M.deckel, 24, 0, 0, zg);
  ST.mm8 = profilZylinder(zg, {
    laenge: 96 + MM8.hub, bohrung: 50, position: V(40, 0, 0), name: '−MM8 Kippen', seite: 1,
    sensoren: [{ x: 32, signal: 'BG30_MM8_unten', text: '−BG30' }, { x: 96 + MM8.hub - 32, signal: 'BG31_MM8_gekippt', text: '−BG31' }],
  });
  const sg = new THREE.Group(); zg.add(sg); ST.zylStange = sg;
  zyl(10, MM8.hub + 70, M.stahl, -50 - (MM8.hub + 70) / 2, 0, 0, 'x', sg, 16);     // Kolbenstange Ø20 (Rest steckt im Rohr)
  zyl(13, 8, M.stahl, -46, 0, 0, 'x', sg, 6);                                     // Kontermutter M16x1,5
  box(18, 30, 32, M.stahl, -33, 0, 0, sg);                                        // Gabelkopf (ISO 8140)
  for (const s of [-1, 1]) { box(34, 30, 7, M.stahl, -10, 0, s * 12, sg); zyl(15, 9, M.stahl, 0, 0, s * 12, 'z', sg, 20); }
  kipperKinematik(0);

  // --- Trichter mit eigenem Gestell, Prallblech und seitlichen Abweisblechen ---
  const O = { x0: 3040, x1: 3280, z0: z - 95, z1: z + 95, y: ST.trY }, U = { x0: 3155, x1: 3205, z0: z - 25, z1: z + 25, y: 296 };
  const triMat = new THREE.MeshStandardMaterial({ color: 0xb4bbc1, metalness: 0.85, roughness: 0.3, side: THREE.DoubleSide });
  const tri = new THREE.Mesh(trichterGeo(O, U), triMat); tri.castShadow = true; tri.receiveShadow = true; anlage.add(tri);
  for (const s of [-1, 1]) { box(O.x1 - O.x0 + 36, 4, 18, M.edelstahl, (O.x0 + O.x1) / 2, O.y + 2, z + s * 104); box(18, 4, 190, M.edelstahl, s < 0 ? O.x0 - 9 : O.x1 + 9, O.y + 2, z); }   // Randflansch
  box(4, 150, 226, M.edelstahl, O.x1 + 20, O.y + 75, z);                         // Prallblech (stößt außen an den Randflansch)
  for (const s of [-1, 1]) box(O.x1 + 16 - 3075, 95, 4, M.edelstahl, (3075 + O.x1 + 16) / 2, O.y + 47, z + s * 115);   // Abweisbleche außen am Randflansch
  for (const x of [3105, 3265]) for (const s of [-1, 1]) { profil(45, 45, 322.5, 'y', x, 161.25, z + s * 125); box(90, 6, 90, M.anthrazit, x, 3, z + s * 125); }   // Pfosten enden unter dem Querprofil
  for (const s of [-1, 1]) { profil(45, 45, 206, 'x', 3185, 345, z + s * 125); box(206, 4, 52, M.anthrazit, 3185, 369.5, z + s * 121); }   // Auflage Randflansch
  label('Trichter', anlage, ST.trX, O.y + 170, z + 120, 'klein');
}
{
  const z = ST.z, A = ST.ans;
  // --- Vibrorinne −MA4: elektromagnetischer Linearförderer (Nutzmasse auf schrägen Blattfederpaketen,
  //     Gegenschwingmasse auf Gummipuffern), Edelstahl-Förderrinne mit Auslauflippe über den Bandanfang ---
  const rg = new THREE.Group(); anlage.add(rg); ST.rinneGruppe = rg;
  const R0 = ST.rinne0, R1 = ST.rinne1, RL = R1 - R0, rx = (R0 + R1) / 2, yb = ST.rinneY - 6;   // Rinnenboden (Teilauflage)
  box(RL + 30, 3, 56, M.edelstahl, rx + 15, yb - 1.5, z, rg);                     // Boden, 30 mm Auslauflippe
  for (const s of [-1, 1]) box(RL, 26, 2, M.edelstahl, rx, yb + 13, z + s * 29, rg);
  box(2, 26, 60, M.edelstahl, R0 - 1, yb + 13, z, rg);                            // Rückwand am Einlauf
  box(440, 20, 50, M.alu, rx, yb - 13, z, rg);                                    // Rinnenträger
  for (const x of [rx - 180, rx + 180]) for (const s of [-1, 1]) zyl(3.5, 3, M.schwarz, x, yb + 0.5, z + s * 18, null, rg, 8);
  box(400, 30, 72, M.festoAlu, rx, 218, z, rg);                                   // Nutzmasse
  box(70, 8, 60, M.stahl, rx, 199, z, rg);                                        // Magnetanker
  const spule = new THREE.MeshStandardMaterial({ color: 0xb06a2c, metalness: 0.6, roughness: 0.4 });
  box(70, 40, 60, M.anthrazit, rx, 167, z);                                       // Magnetkern (Luftspalt 8 mm)
  box(78, 22, 66, spule, rx, 162, z);                                             // Spule
  for (const x of [rx - 150, rx + 150]) for (const s of [-1, 1]) {                // Blattfederpakete, 20° geneigt
    const f = box(6, 46, 30, M.schwarz, x, 175, z + s * 24); f.rotation.z = -0.35;
    box(26, 12, 34, M.stahl, x + 8, 197, z + s * 24); box(26, 12, 34, M.stahl, x - 8, 153, z + s * 24);
  }
  box(420, 32, 96, M.anthrazit, rx, 131, z);                                      // Gegenschwingmasse
  platte(tafel('vibroTyp', 60, 18, (c) => { c.fillStyle = '#d9dcdf'; c.fillRect(0, 0, 60, 18); c.fillStyle = '#111'; c.font = '700 5px Arial'; c.fillText(tr('Linearförderer') + ' −MA4', 3, 7); c.font = '500 3.6px Arial'; c.fillText(tr('230 V · 50 Hz · 100 Hz Schwingung'), 3, 13); }, 8), 60, 18, anlage, rx + 120, 131, z - 48.2, Math.PI);
  for (const x of [rx - 180, rx + 180]) for (const s of [-1, 1]) zyl(13, 12, M.schwarz, x, 109, z + s * 34, null, anlage, 16);   // Gummipuffer
  box(460, 8, 130, M.anthrazit, rx, 99, z);                                       // Grundplatte
  for (const s of [-1, 1]) profil(45, 45, 460, 'x', rx, 72.5, z + s * 45);
  for (const x of [rx - 200, rx + 200]) for (const s of [-1, 1]) stellfuss(x, z + s * 45);
  label('Vibrorinne −MA4', anlage, rx, ST.rinneY + 90, z, 'klein');
  A.ma4 = V(rx - 100, 131, z - 48);                                               // Anschluss Magnet (Stecker vorn)

  // --- Prüfband −MA5: Gurtförderer 100 mm, Alu-Seitenprofile, Gleitbett, Umlenkung Ø36, Seitenführungen ---
  const B0 = ST.band0, B1 = ST.band1, BL = B1 - B0, bx = (B0 + B1) / 2, yB = ST.bandY;
  const gurtMat = new THREE.MeshStandardMaterial({ color: 0x1f6b3a, roughness: 0.7 });             // grüner PVC-Gurt (Kontrast für die Kamera)
  for (const s of [-1, 1]) box(BL, 50, 10, M.profil, bx, yB - 27, z + s * 57);
  box(BL - 40, 6, 100, M.alu, bx, yB - 5, z);                                     // Gleitbett
  box(BL - 36, 2, 100, gurtMat, bx, yB - 1, z);                                    // Obertrum
  box(BL - 36, 2, 100, gurtMat, bx, yB - 39, z);                                   // Untertrum
  for (const x of [B0 + 18, B1 - 18]) { zyl(20, 96, gurtMat, x, yB - 20, z, 'z', anlage, 24); zyl(8, 126, M.stahl, x, yB - 20, z, 'z', anlage, 12); }   // Umlenkung 2 mm innerhalb der Gurtkante
  // Seitenführungen (Edelstahl), Lücken für Lichtschranke, Düse und Ausschleusung
  const fuehrung = (s, luecken) => {
    let x0 = B0 + 10;
    for (const [a, b] of [...luecken, [B1 - 10, B1 - 10]]) {
      if (a - x0 > 5) { box(a - x0, 26, 3, M.edelstahl, (a + x0) / 2, yB + 15, z + s * 52); for (let x = x0 + 40; x < a - 20; x += 220) box(14, 30, 6, M.alu, x, yB + 10, z + s * 56); }
      x0 = b;
    }
  };
  fuehrung(-1, [[ST.kamX - 38, ST.kamX - 22], [ST.duesX - 14, ST.duesX + 14]]);
  fuehrung(1, [[ST.kamX - 38, ST.kamX - 22], [ST.duesX - 45, ST.duesX + 45]]);
  for (const x of [B0 + 80, bx, B1 - 80]) {
    for (const s of [-1, 1]) { profil(45, 45, yB - 52 - 50, 'y', x, 50 + (yB - 102) / 2, z + s * 57); stellfuss(x, z + s * 57); }
    profil(45, 45, 69, 'z', x, 110, z);
  }
  // Getriebemotor am Antriebsende (Bedienerseite)
  box(60, 70, 56, M.anthrazit, B1 - 18, yB - 20, z - 90);
  zyl(34, 120, M.anthrazit, B1 - 18, yB - 20, z - 178, 'z', anlage, 24);
  zyl(35, 14, M.schwarz, B1 - 18, yB - 20, z - 245, 'z', anlage, 24);
  box(40, 26, 50, M.anthrazit, B1 - 18, yB + 27, z - 170);
  A.ma5 = V(B1 - 18, yB + 40, z - 170);
  label('Prüfband −MA5', anlage, bx - 200, yB + 60, z + 70, 'klein');
  // Reflexionslichtschranke −BG32 am Prüfplatz: Sensor vorn, Reflektor hinten, Strahl 6 mm über dem Gurt
  {
    const x = ST.kamX - 30;
    box(30, 6, 30, M.alu, x, yB - 2, z - 70);                                    // Haltewinkel am Seitenprofil
    box(20, 31.5, 11, M.keyence, x, yB + 14, z - 70);
    const mat = sensorLed(anlage, x - 4, yB + 30.5, z - 70, 'BG32_Teil_Pruefplatz', 3, 0.8, 3);
    SENSOREN.push({ signal: 'BG32_Teil_Pruefplatz', mat, div: label('−BG32', anlage, x, yB + 60, z - 80, 'klein') });
    box(30, 6, 30, M.alu, x, yB - 2, z + 70);
    box(3, 30, 28, M.rot, x, yB + 14, z + 70);                                   // Reflektor
    stecker(anlage, V(x, yB - 2, z - 70), '-y');
    A.bg32 = V(x, yB - 2 - 32, z - 70);
  }
  // Keyence CV-X −KF10: Kamera CA-H500C mit Objektiv und Ringlicht CA-DRW an einem verschraubten Stativ (Profil 45x90)
  {
    const cx = ST.kamX + 60, cz = z - 190;
    box(180, 12, 180, M.anthrazit, cx, 6, cz);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) zyl(7, 6, M.stahl, cx + sx * 70, 15, cz + sz * 70, null, anlage, 6);   // Schwerlastanker
    profil(90, 45, 790, 'y', cx, 12 + 395, cz);
    for (const s of [-1, 1]) { const w = box(8, 120, 70, M.anthrazit, cx + s * 49, 70, cz); void w; }   // Fußwinkel
    box(60, 60, 60, M.alu, cx, 780, cz);                                          // Kreuzklemmstück
    profil(45, 45, 230, 'z', cx, 780, z - 95);                                     // Ausleger
    box(70, 30, 40, M.alu, ST.kamX + 30, 780, z + 2);                             // Kamerahalter (steht 2 mm vor dem Auslegerende)
    zyl(10, 120, M.stahl, ST.kamX, 710, z, null, anlage, 12);
    const k2 = new THREE.Group(); k2.position.set(ST.kamX, 615, z); anlage.add(k2);
    box(44, 70, 44, new THREE.MeshStandardMaterial({ color: 0x3a3e43, roughness: 0.5, metalness: 0.3 }), 0, 0, 0, k2);
    box(46, 10, 46, M.schwarz, 0, -36, 0, k2);
    for (const sx of [-1, 1]) zyl(5, 10, M.stahl, sx * 10, 40, 0, null, k2, 10);
    platte(tafel('keyenceCA', 40, 10, (c) => { c.fillStyle = '#3a3e43'; c.fillRect(0, 0, 40, 10); c.fillStyle = '#e8eaec'; c.font = '700 5px Arial'; c.textAlign = 'center'; c.fillText('KEYENCE', 20, 6); c.font = '500 2.6px Arial'; c.fillText('CA-H500C', 20, 9.2); }, 8), 40, 10, k2, 0, 15, -22.2, Math.PI);
    zyl(15, 44, M.alu, 0, -63, 0, null, k2, 24);
    zyl(16.5, 10, M.schwarz, 0, -56, 0, null, k2, 24);
    zyl(16.5, 6, M.schwarz, 0, -78, 0, null, k2, 24);
    const rl = new THREE.Group(); rl.position.y = -260; k2.add(rl);                                 // Ringlicht 120 mm über dem Gurt
    const gehM = new THREE.MeshStandardMaterial({ color: 0x2b2d30, roughness: 0.5, side: THREE.DoubleSide });
    rl.add(new THREE.Mesh(new THREE.CylinderGeometry(55, 55, 16, 40, 1, true), gehM));
    rl.add(new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 16, 24, 1, true), gehM));
    const dk = new THREE.Mesh(new THREE.RingGeometry(24, 55, 40), gehM); dk.rotation.x = -Math.PI / 2; dk.position.y = 8; rl.add(dk);
    ST.kamLicht = new THREE.MeshStandardMaterial({ color: 0xc8ccd0, emissive: 0xf4f8ff, emissiveIntensity: 0, roughness: 0.6, side: THREE.DoubleSide });
    const df = new THREE.Mesh(new THREE.RingGeometry(26, 53, 40), ST.kamLicht); df.rotation.x = Math.PI / 2; df.position.y = -8; rl.add(df);
    for (const sx of [-1, 1]) box(6, 230, 6, M.anthrazit, sx * 40, 120, 0, rl);                      // Halter Ringlicht
    label('Keyence CV-X Kamera −KF10', k2, 0, 90, 0, 'klein');
    // Kamera- und Ringlichtleitung über den Ausleger zur Säule
    leitung([V(ST.kamX + 10, 660, z), V(ST.kamX + 10, 780, z), V(cx - 10, 800, z - 60), V(cx - 10, 800, cz + 25)], M.kabel, 3, 20);
    A.kf10 = V(cx - 10, 800, cz + 25);
  }
  // Ausblasdüse −MB16: Flachstrahldüse vorn am Seitenprofil, bläst n.i.O.-Teile durch die Lücke hinten auf die Rutsche
  {
    const x = ST.duesX;
    box(28, 10, 30, M.alu, x, yB - 2, z - 72);
    box(16, 18, 26, M.alu, x, yB + 10, z - 70);
    zyl(3, 16, M.messing, x, yB + 7, z - 50, 'z', anlage, 10);                    // Düsenspitze
    const p = new THREE.Group(); p.position.set(x, yB + 10, z - 83); p.rotation.x = -Math.PI / 2; anlage.add(p); steckverschraubung(p, 0, 0, 0, 3);
    A.duese = V(x, yB + 10, z - 98);
    label('Ausblasdüse −MB16', anlage, x, yB + 70, z - 80, 'klein');
    // Rutsche (Edelstahl, Seitenwände) vom Gurt in den Ausschussbehälter
    const L = 150, neig = 0.42;
    const ru = new THREE.Group(); ru.position.set(x, yB - 4, z + 62); ru.rotation.x = neig; anlage.add(ru);
    box(110, 2, L, M.edelstahl, 0, 0, L / 2, ru);
    for (const s of [-1, 1]) box(2, 30, L, M.edelstahl, s * 55, 15, L / 2, ru);
    for (const s of [-1, 1]) box(4, 40, 30, M.alu, s * 50, -10, 10, ru);          // Befestigung am Seitenprofil
    const rot = new THREE.MeshStandardMaterial({ color: 0xc23a2a, roughness: 0.6 });
    kltKasten(x, z + 260, 300, 400, 147, rot);                                    // Ausschuss-KLT 400x300x147 (rot)
    ST.ausschussPlane = fuellFlaeche(x, z + 260, 286, 386, 0xb8743f);
    label('Ausschuss n.i.O.', anlage, x, 230, z + 260, 'klein');
  }
  // KLT 6147 (600x400x147,5) für i.O.-Teile auf einem Transportroller am Pufferplatz; Füllstand −BG34 (Ultraschall)
  {
    const blau = new THREE.MeshStandardMaterial({ color: 0x2f5fa8, roughness: 0.6 });
    const kx = ST.kltX + 40;
    box(610, 14, 410, M.anthrazit, kx, 68, z);                                     // Transportroller
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      box(30, 12, 30, M.stahl, kx + sx * 270, 55, z + sz * 170);
      zyl(25, 18, M.schwarz, kx + sx * 270, 25, z + sz * 170, 'z', anlage, 16);   // Lenkrolle Ø50
    }
    kltKasten(kx, z, 600, 400, 147, blau, 75);
    for (const s of [-1, 1]) box(80, 20, 4, M.schwarz, kx + s * 0, 200, z + s * 202);   // Griffmulden
    ST.kltPlane = fuellFlaeche(kx, z, 580, 380, 0xdfe4e8, 75);
    label('KLT i.O.-Teile', anlage, kx, 300, z, 'klein');
    // Pufferplatz: Bodenmarkierung und Anschlagwinkel
    for (const s of [-1, 1]) { box(700, 1, 40, M.gelb, kx + 20, 0.5, z + s * 250); box(40, 1, 540, M.gelb, kx + 20 + s * 350, 0.5, z); }
    box(10, 60, 300, M.anthrazit, kx + 330, 30, z);
    // −BG34: Ultraschallsensor M18 über dem KLT an einem Galgen (Säule vorn), misst die Schütthöhe
    const px = kx - 100, pz = z - 255;
    box(120, 10, 120, M.anthrazit, px, 5, pz);
    profil(45, 45, 425, 'y', px, 222.5, pz);                                       // Säule endet unter dem Ausleger
    profil(45, 45, 300, 'z', px, 457.5, pz + 127.5);
    box(30, 30, 40, M.alu, px, 430, z);
    zyl(9, 60, M.stahl, px, 400, z, null, anlage, 16);
    zyl(11, 5, M.stahl, px, 420, z, null, anlage, 6);
    const mat = sensorLed(anlage, px, 433, z - 21, 'BG34_KLT_voll', 4, 3, 1);
    SENSOREN.push({ signal: 'BG34_KLT_voll', mat, div: label('−BG34 KLT voll', anlage, px, 520, z, 'klein') });
    stecker(anlage, V(px, 445, z), '+y');
    A.bg34 = V(px, 477, z);
  }
  // Teile (Instanzen, Rohrkabelschuh wie im Korb) – Farbe je Teil: Zinn oder Kupfer; KLT voll = 4 Körbe à 36 Teile
  ST.im = new THREE.InstancedMesh(teilGeometrie(), new THREE.MeshStandardMaterial({ metalness: 0.85, roughness: 0.25 }), 400);
  ST.im.count = 0; ST.im.castShadow = false; ST.im.frustumCulled = false; anlage.add(ST.im);   // Instanzen wandern: Hüllkugel wäre sonst veraltet
  ST.im.setColorAt(0, new THREE.Color());
}
// KLT/Behälter: offener Kasten (Boden + 4 Wände), Füllstand als Fläche
// Boden und Stirnwände liegen zwischen den Längswänden – keine zwei Teile teilen sich eine Außenfläche (Flackern)
function kltKasten(x, z, w, d, h, mat, y0 = 0) {
  box(w - 12, 6, d - 12, mat, x, y0 + 3, z);
  for (const s of [-1, 1]) { box(w - 12, h, 6, mat, x, y0 + h / 2, z + s * (d / 2 - 3)); box(6, h, d, mat, x + s * (w / 2 - 3), y0 + h / 2, z); }
}
function fuellFlaeche(x, z, w, d, farbe, y0 = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d), new THREE.MeshStandardMaterial({ color: farbe, metalness: 0.8, roughness: 0.35 }));
  m.position.set(x, y0 + 8, z); m.visible = false; m.userData.dyn = true; m.userData.y0 = y0; anlage.add(m); return m;
}

