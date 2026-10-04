import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { V, box, mesh, zyl } from '../core/geometrie.js';
import { label } from '../core/beschriftung.js';
import { profil, stellfuss } from '../bauteile/aluprofil.js';
import { getriebemotor } from '../bauteile/foerderer.js';
import { lichtschranke } from '../bauteile/lichtschranke.js';
import { BAND_Y, KURVE, LS_POS } from './baender.js';

// ----------------------------------------------------------------------------
// Rollenkurve −MA6: angetriebene 90°-Kurvenrollenbahn zwischen Band 1 und Band 2
// (Bauart wie Interroll-Kurvenmodule, für die kleinen Körbe verkleinert):
//  - 14 konische Tragrollen (Ø24 innen → Ø43 außen, Kegelspitze im Kurvenmittelpunkt, dadurch
//    gleiche Winkelgeschwindigkeit über die Bahnbreite – der Korb dreht sich mit der Kurve um 90°)
//  - Rundriemenköpfe am Außenende, PU-Rundriemen Ø5 von Rolle zu Rolle („Pass-on“)
//  - Aufsteckgetriebemotor außen in Kurvenmitte, treibt die mittlere Rolle über einen Rundriemen
//  - gebogene Seitenwangen (Stahl verzinkt), Seitenführungen (Edelstahl) an Haltern,
//    zwei Stützen mit Traverse und Stellfüßen, Lichtschranken −BG35 (Anfang) und −BG36 (Ende)
// Lokales Koordinatensystem an der Stelle θ (0 … π/2): +z = Förderrichtung, +x = zum Kurvenmittelpunkt
// ----------------------------------------------------------------------------
const { R, zA } = KURVE;
export const kurveGruppe = new THREE.Group(); anlage.add(kurveGruppe);
// Punkt auf der Mittellinie und Fahrtrichtung bei Bogenlänge s
export function kurvenPunkt(s) {
  const t = s / R;
  return { x: R - R * Math.cos(t), z: zA + R * Math.sin(t), winkel: t };
}
function rahmen(t, parent = kurveGruppe) {
  const g = new THREE.Group();
  g.position.set(R - R * Math.cos(t), 0, zA + R * Math.sin(t)); g.rotation.y = t;
  parent.add(g);
  return g;
}
// Kreisringsektor (Viertelkreis um den Kurvenmittelpunkt) als Blech/Leiste: Radien r0…r1, Höhe y0…y0 + h
function ringSektor(r0, r1, y0, h, mat) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r1, Math.PI, 1.5 * Math.PI, false);
  s.absarc(0, 0, r0, 1.5 * Math.PI, Math.PI, true);
  const geo = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 40 });
  geo.rotateX(-Math.PI / 2);                                                  // Form (x, y) → Welt (x, −z), Extrusion → +y
  const m = mesh(geo, mat, kurveGruppe);
  m.position.set(R, y0, zA);
  return m;
}
const RI = 125, RA = 105;                                                     // Rollenkörper lokal x = +125 (innen) … −105 (außen)
{
  // Seitenwangen (Stahlblech 5 mm, gebogen) und Seitenführungen
  for (const sx of [-1, 1]) {
    ringSektor(R + sx * 127.5 - 2.5 + 0, R + sx * 127.5 + 2.5, BAND_Y - 80, 74, M.verzinkt);
    ringSektor(R + sx * 70 - 2, R + sx * 70 + 2, BAND_Y + 21, 22, M.edelstahl);
  }
  // Konische Tragrollen: Kegelspitze im Kurvenmittelpunkt; die Achse ist so geneigt, dass die Oberkante waagrecht liegt
  const N = 14, dT = Math.PI / 2 / N;
  const rIn = 12, rAus = rIn * (R + RA) / (R - RI);                           // Ø24 innen, Ø43 außen
  const neig = Math.atan((rAus - rIn) / (RI + RA));
  const abstand = (RI * (rAus - rIn) + rIn * (RI + RA)) / Math.hypot(RI + RA, rAus - rIn);   // Achse → Oberkante
  const kegel = new THREE.CylinderGeometry(rAus, rIn, RI + RA, 24, 1);        // oben = außen (nach Drehung lokal −x)
  const rolleMat = new THREE.MeshStandardMaterial({ color: 0xc9ced3, metalness: 0.85, roughness: 0.28 });
  const riemenMat = new THREE.MeshStandardMaterial({ color: 0xd8692a, roughness: 0.45 });   // PU-Rundriemen orange
  const koepfe = [];
  for (let i = 0; i < N; i++) {
    const t = (i + 0.5) * dT, g = rahmen(t);
    const kipp = new THREE.Group(); kipp.position.y = BAND_Y - 1 - abstand; kipp.rotation.z = neig; g.add(kipp);
    const dreh = new THREE.Group(); kipp.add(dreh);
    const k = mesh(kegel, rolleMat, dreh); k.rotation.z = Math.PI / 2; k.position.x = (RI - RA) / 2;
    zyl(4, 262, M.stahl, 0, 0, 0, 'x', dreh, 8);                              // Sechskantachse in den Seitenwangen
    zyl(15, 16, M.kunststoff, -RA - 11, 0, 0, 'x', dreh, 16);                 // Rundriemenkopf PA (zwei Rillen)
    for (const dx of [-5, 5]) zyl(15.6, 2, M.schwarz, -RA - 11 + dx, 0, 0, 'x', dreh, 16);
    for (const sx of [-1, 1]) zyl(7, 4, M.schwarz, sx * 132, 0, 0, 'x', kipp, 6);   // Achsmutter außen an der Wange
    KURVE.rollen.push(dreh);
    kurveGruppe.updateMatrixWorld(true);
    koepfe.push([-5, 5].map(dx => kurveGruppe.worldToLocal(dreh.localToWorld(V(-RA - 11 + dx, 0, 0)))));
  }
  // Rundriemen von Rolle zu Rolle (abwechselnd in Rille 1 und 2): Ober- und Untertrum
  const trum = (a, b) => {
    const d = b.clone().sub(a), m = mesh(new THREE.CylinderGeometry(2.5, 2.5, d.length(), 6), riemenMat, kurveGruppe, false);
    m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
  };
  for (let i = 0; i + 1 < N; i++) {
    const r = i % 2, a = koepfe[i][r], b = koepfe[i + 1][r];
    for (const dy of [-15.5, 15.5]) trum(a.clone().add(V(0, dy, 0)), b.clone().add(V(0, dy, 0)));
  }
  // Halter der Seitenführungen
  for (const t of [0.3, 0.785, 1.27]) {
    const g = rahmen(t);
    for (const sx of [-1, 1]) {
      box(4, 80, 30, M.anthrazit, sx * 134.5, BAND_Y + 2, 0, g);
      box(30, 4, 30, M.anthrazit, sx * 121.5, BAND_Y + 44, 0, g);
      zyl(5, 30, M.stahl, sx * 120, BAND_Y + 31, 0, null, g, 12);
      zyl(5, 48, M.stahl, sx * 96, BAND_Y + 32, 0, 'x', g, 12);
      zyl(8, 10, M.kunststoff, sx * 77, BAND_Y + 32, 0, 'x', g, 16);
    }
  }
  // Stützen: je zwei Profile 45 × 45 mit Stellfüßen, Traverse unter den Wangen und Querstrebe unten
  for (const t of [0.39, 1.2]) {
    const g = rahmen(t);
    for (const sx of [-1, 1]) { profil(45, 45, BAND_Y - 80 - 45 - 52, 'y', sx * 127.5, (BAND_Y - 80 - 45 + 52) / 2, 0, g); stellfuss(sx * 127.5, 0, g); }
    profil(45, 45, 300, 'x', 0, BAND_Y - 80 - 22.5, 0, g);
    profil(45, 45, 210, 'x', 0, 120, 0, g);
  }
  // Antrieb: Aufsteckgetriebemotor außen an der mittleren Rolle, Rundriemen von der Antriebsscheibe zum Rollenkopf
  {
    const iM = 7, t = (iM + 0.5) * dT, g = rahmen(t);
    const yS = 205;                                                            // Antriebswelle unter den Rollen
    const halter = new THREE.Group(); halter.position.y = yS - (BAND_Y - 3 - 36); g.add(halter);
    kurveGruppe.updateMatrixWorld(true);
    KURVE.motor = getriebemotor(halter, 0, -1, 'Antrieb Rollenkurve −MA6');
    zyl(10, 60, M.stahl, -142, yS, 0, 'x', g, 16);                              // Welle durch die Außenwange
    zyl(16, 14, M.kunststoff, -RA - 11, yS, 0, 'x', g, 16);                    // Rundriemenscheibe
    box(10, 60, 70, M.anthrazit, -137, yS + 10, 0, g);                         // Lagerplatte an der Wange
    const kopf = koepfe[iM][0];
    const unten = kurveGruppe.worldToLocal(g.localToWorld(V(-RA - 11 - 5, yS, 0)));
    for (const dz of [-16, 16]) {
      const a = unten.clone().add(V(0, 0, 0)), b = kopf.clone();
      const d = V(Math.sin(t) * dz, 0, Math.cos(t) * dz);
      trum(a.add(d), b.add(d));
    }
    label('Rollenkurve −MA6 (90°, konische Rollen, Rundriemen)', g, 0, BAND_Y + 200, 0, 'klein');
  }
  // Lichtschranken am Kurvenanfang und -ende: Haltewinkel außen an den gebogenen Seitenwangen zwischen zwei Tragrollen,
  // Strahl radial durch die Korbmitte (Sensor außen, Reflektor innen), über der Seitenführung
  for (const [sig, txt] of [['BG35_Kurve_Anfang', '−BG35 Kurve Anfang'], ['BG36_Kurve_Ende', '−BG36 Kurve Ende']]) {
    const g = rahmen(LS_POS[sig] / R);
    kurveGruppe.updateMatrixWorld(true);
    lichtschranke(0, sig, txt, { parent: g });
  }
}
