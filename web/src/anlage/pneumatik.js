import * as THREE from 'three';
import { ZYL, ZYL_LISTE } from '../logik/zustand.js';
import { anlage } from '../core/szene.js';
import { canvasTextur } from '../core/texturen.js';
import { M } from '../core/materialien.js';
import { V, box, cached, mesh, zyl } from '../core/geometrie.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { dekor, label, platte, tafel } from '../core/beschriftung.js';
import { t as tr } from '../core/sprache.js';
import { profil } from '../bauteile/aluprofil.js';
import { sensorLed } from '../core/leds.js';
import { halter, kurvenRohr, leitung, schlauch } from '../bauteile/leitungen.js';
import { gitterrinne, steigend } from '../bauteile/gitterrinne.js';
import { steckverschraubung } from '../bauteile/zylinder.js';
import { BAD_X } from './zinnbad.js';
import { mm4 } from './abdeckung.js';
import { KETTE, PORTAL_Z, haken, mm1, mm2, mm3, schlitten } from './portal.js';

// ----------------------------------------------------------------------------
// Pneumatik: Wartungseinheit, Ventilinsel −QM1, Schläuche, Energiekette
// ----------------------------------------------------------------------------
const VI = new THREE.Vector3(-700, 880, PORTAL_Z + 45);      // Montageplatte vorne an der linken Säule
const ventilinsel = new THREE.Group();
ventilinsel.position.copy(VI);
anlage.add(ventilinsel);
// Festo-Ventilinsel VTUG-18 (Rastermaß 18,5 mm): Anschlussplatten (Alu) mit Arbeitsanschlüssen 2/4 an der oberen Stirnseite,
// darauf 5/2-Impulsventile VUVG-B18 mit Vorsteuerköpfen (Spule 14 oben, 12 unten), links Endplatte mit Versorgung 1,
// Abluft 3/5 (Schalldämpfer) und Multipol-Anschluss Sub-D, rechts Endplatte. Montageplatte verzinkt.
const VT = { raster: 18.5, x0: -14.75, ob: 55 };
box(170, 200, 5, M.verzinkt, 0, -10, 2.5, ventilinsel);
for (const sx of [-1, 1]) for (const sy of [-1, 1]) zyl(4, 2, M.stahl, sx * 76, -10 + sy * 90, 5.5, 'z', ventilinsel, 6);   // Befestigung an der Säule
box(40, 110, 30, M.festoAlu, -44, 0, 21, ventilinsel);                                              // linke Endplatte
box(14, 110, 30, M.festoAlu, 57, 0, 21, ventilinsel);                                               // rechte Endplatte
for (const x of [-60, 60]) for (const y of [-45, 45]) zyl(2.8, 2, M.stahl, x, y, 36.5, 'z', ventilinsel, 6);   // Befestigungsschrauben
// Multipol-Elektrikanschluss (Sub-D 25-polig) mit Stecker, Leitung seitlich nach links (über Versorgung 1 und Abluft hinweg)
box(38, 64, 28, M.kunststoff, -44, 12, 50, ventilinsel);
box(30, 20, 3, M.schwarz, -44, 14, 65, ventilinsel);
box(22, 30, 12, M.kunststoff, -44, 10, 71, ventilinsel);
zyl(5, 12, M.kunststoff, -61, 10, 71, 'x', ventilinsel, 10);                                        // Knickschutz
for (const y of [-2, 22]) zyl(1.6, 3, M.stahl, -44, y, 78, 'z', ventilinsel, 6);                     // Rändelschrauben
platte(tafel('festo', 34, 9, (c) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, 34, 9); c.fillStyle = '#0091dc'; c.font = '700 7px Arial'; c.textAlign = 'center'; c.fillText('FESTO', 17, 7.2); }, 8), 30, 8, ventilinsel, -44, 37, 64.2);
// Versorgung 1 (QS-8) unten an der linken Endplatte (Schlauch kommt von unten), Abluft 3/5 (Schalldämpfer) vorn
const p1 = new THREE.Group(); p1.position.set(-52, -55, 29); p1.rotation.x = Math.PI; ventilinsel.add(p1);
steckverschraubung(p1, 0, 0, 0, 6);
for (const x of [-38, -28]) { zyl(4.2, 4, M.stahl, x, -40, 38, 'z', ventilinsel, 6); zyl(3.8, 14, M.kunststoff, x, -40, 47, 'z', ventilinsel, 10); }
platte(tafel('vtugTyp', 36, 14, (c) => {
  c.fillStyle = '#e9ecee'; c.fillRect(0, 0, 36, 14); c.fillStyle = '#16191c'; c.font = '700 3.6px Arial'; c.fillText('VTUG-18-VRPT-B1T', 1.5, 4.5);
  c.font = '400 2.6px Arial'; c.fillText('−QM1  4x M52 · 24 V DC', 1.5, 8.2); c.fillText('p 1,5…8 bar', 1.5, 11.6);
}, 10), 36, 14, ventilinsel, -44, -20, 36.2);
export const VENTIL_LEDS = [];
const ventilPorts = [];
const etikett = (bmk, sp) => tafel('spule' + bmk, 14, 8, (cc) => { cc.fillStyle = '#f2f3f1'; cc.fillRect(0, 0, 14, 8); cc.fillStyle = '#111'; cc.textAlign = 'center'; cc.font = '700 3.8px Arial'; cc.fillText(bmk, 7, 4); cc.font = '500 2.4px Arial'; cc.fillText(tr(sp), 7, 7.1); }, 12);
ZYL_LISTE.forEach((c, i) => {
  const x = VT.x0 + i * VT.raster;
  box(18.2, 110, 30, M.festoAlu, x, 0, 21, ventilinsel);                                            // Anschlussplatte
  box(18, 74, 26, M.festoAlu, x, 0, 49, ventilinsel);                                               // Ventilkörper
  for (const sy of [-1, 1]) {
    zyl(1.4, 1.2, M.stahl, x, sy * 30, 62.4, 'z', ventilinsel, 6);                                   // Ventilschrauben
    zyl(2.4, 1.6, M.qsBlau, x, sy * 18, 62.6, 'z', ventilinsel, 10);                                 // Handhilfsbetätigung
  }
  for (const [y, sig, sp] of [[50, c.aus, 'Spule 14'], [-50, c.ein, 'Spule 12']]) {
    box(18, 26, 32, M.kunststoff, x, y, 52, ventilinsel);                                           // Vorsteuerkopf mit Spule
    const mat = sensorLed(ventilinsel, x, y + Math.sign(y) * 8, 68.3, sig, 4, 3, 1);
    VENTIL_LEDS.push({ signal: sig, mat });
    platte(etikett('−' + sig.split('_')[0], sp), 14, 8, ventilinsel, x, y - Math.sign(y) * 3, 68.2);
  }
  // Arbeitsanschlüsse 4 (vorn) und 2 (hinten) an der oberen Stirnseite der Anschlussplatte, QS-6
  const p4 = steckverschraubung(ventilinsel, x, VT.ob, 29, 4.6), p2 = steckverschraubung(ventilinsel, x, VT.ob, 13, 4.6);
  ventilPorts.push({ p4: VI.clone().add(p4), p2: VI.clone().add(p2) });
});
label('Ventilinsel −QM1', ventilinsel, 0, 110, 40, 'cyl');
// Wartungseinheit Festo MS6: Einschaltventil MS6-EM1 (rot) + Filterregelventil MS6-LFR mit Manometer,
// Anschlussplatten G1/2, Metallbehälterschutz mit Sichtfenster, Halbautomatik-Kondensatablass
const wartung = new THREE.Group();
wartung.position.set(-700, 580, PORTAL_Z + 50);
anlage.add(wartung);
box(150, 100, 4, M.verzinkt, 8, 0, 2, wartung);                                                     // Halteblech an der Säule
for (const x of [-60, 76]) box(10, 40, 36, M.verzinkt, x, 0, 22, wartung);                            // Haltewinkel (stehen 1 mm über die Anschlussplatten)
const msKoerper = cached('ms6', () => new RoundedBoxGeometry(58, 62, 62, 2, 5));
for (const x of [-26, 38]) { const k = mesh(msKoerper, M.festoAlu, wartung); k.position.set(x, 0, 40); }
for (const x of [-60, 6, 72]) box(8, 52, 52, M.deckel, x, 0, 40, wartung);                            // Modulverbinder / Anschlussplatten
zyl(9, 8, M.messing, -68, 0, 40, 'x', wartung, 6); zyl(8, 8, M.messing, 80, 0, 40, 'x', wartung, 6); // Gewindenippel G1/2
// MS6-EM1: roter Drehknopf vorn, Schalldämpfer unten
zyl(18, 4, M.kunststoff, -26, 0, 73, 'z', wartung, 24);
zyl(15, 12, M.rot, -26, 0, 81, 'z', wartung, 24);
box(24, 5, 4, M.rot, -26, 0, 88, wartung);                                                           // Griffsteg
zyl(9, 24, M.kunststoff, -26, -43, 40, null, wartung, 16);
platte(tafel('msEM', 30, 8, (c) => { c.fillStyle = '#e9ecee'; c.fillRect(0, 0, 30, 8); c.fillStyle = '#16191c'; c.font = '700 3.4px Arial'; c.fillText('MS6-EM1-1/2', 1.5, 3.6); c.fillStyle = '#c8281f'; c.fillText('0', 22, 3.6); c.fillStyle = '#2f7a3a'; c.fillText('1', 26, 3.6); c.fillStyle = '#16191c'; c.font = '400 2.4px Arial'; c.fillText(tr('Einschaltventil'), 1.5, 6.8); }, 10), 30, 8, wartung, -26, -24, 71.2);
// MS6-LFR: Federhaube und Stellknopf oben, Filterbehälter mit Metallschutz unten
zyl(22, 22, M.festoAlu, 38, 42, 40, null, wartung, 24);
zyl(21, 26, M.kunststoff, 38, 66, 40, null, wartung, 16);
zyl(17, 3, M.schwarz, 38, 80.5, 40, null, wartung, 16);
zyl(24, 92, M.festoAlu, 38, -77, 40, null, wartung, 24);
box(8, 62, 2, new THREE.MeshStandardMaterial({ color: 0x9fb8c6, roughness: 0.15, metalness: 0.2 }), 38, -74, 63.8, wartung);   // Sichtfenster
zyl(8, 12, M.kunststoff, 38, -129, 40, null, wartung, 12);                                           // Kondensatablass
const manoTex = canvasTextur(256, 256, (g) => {
  g.fillStyle = '#f6f6f2'; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill();
  const w = (v) => Math.PI * 0.75 + v / 16 * Math.PI * 1.5;
  g.strokeStyle = '#2f9a45'; g.lineWidth = 12; g.beginPath(); g.arc(128, 128, 100, w(5), w(7)); g.stroke();
  g.strokeStyle = '#1b1b1b'; g.fillStyle = '#1b1b1b'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '600 24px Arial';
  for (let v = 0; v <= 16; v++) {
    const a = w(v), l = v % 4 ? 10 : 18; g.lineWidth = v % 4 ? 2 : 4;
    g.beginPath(); g.moveTo(128 + Math.cos(a) * (112 - l), 128 + Math.sin(a) * (112 - l)); g.lineTo(128 + Math.cos(a) * 112, 128 + Math.sin(a) * 112); g.stroke();
    if (v % 4 === 0) g.fillText(String(v), 128 + Math.cos(a) * 72, 128 + Math.sin(a) * 72);
  }
  g.font = '600 22px Arial'; g.fillText('bar', 128, 178); g.font = '700 14px Arial'; g.fillStyle = '#0091dc'; g.fillText('FESTO', 128, 92);
  const a = w(6);
  g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; g.beginPath(); g.moveTo(128 - Math.cos(a) * 20, 128 - Math.sin(a) * 20); g.lineTo(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100); g.stroke();
  g.fillStyle = '#1b1b1b'; g.beginPath(); g.arc(128, 128, 9, 0, 7); g.fill();
});
zyl(21, 12, M.kunststoff, 38, 0, 77, 'z', wartung, 24);                                              // Manometergehäuse Ø 40
const mano = new THREE.Mesh(new THREE.CircleGeometry(18, 32), dekor(new THREE.MeshStandardMaterial({ map: manoTex, roughness: 0.15 })));
mano.position.set(38, 0, 83.3); wartung.add(mano);
label('Wartungseinheit 6 bar', wartung, 5, 110, 40, 'klein');
const druckluftMat = new THREE.MeshStandardMaterial({ color: 0x2f7fd0, roughness: 0.45 });
// Druckluft-Fallleitung (Hallennetz) mit Kugelhahn, dann zur Wartungseinheit
// (Fallleitung in Flucht mit dem Eingang der Wartungseinheit: ein einziger Bogen nach unten/vorn).
// Rohrschellen mit kurzem Abstandshalter an der Seitenwand der linken Steigrinne
zyl(11, 1960, M.alu, -830, 640 + 980, -170, null);
zyl(14, 40, M.messing, -830, 760, -170, null, anlage, 6);
box(70, 8, 14, M.rot, -795, 772, -170);
for (const y of [1150, 1550, 1950]) { zyl(13, 14, M.verzinkt, -830, y, -170, null, anlage, 16); box(14, 10, 8, M.verzinkt, -812, y, -165); }
leitung([[-830, 640, -170], [-830, 580, -170], [-772, 580, -170]], druckluftMat, 5, 30);
// Verteilerblock (Alu, 3 × G1/4) an der Innenseite der linken Säule hinter der Wartungseinheit: Eingang vorn oben
// von der Wartungseinheit, Abgang vorn unten zur Ventilinsel −QM1, Abgang unten zur Ventilinsel −QM2 am Band
const VB = V(-640, 700, -235);
box(30, 60, 30, M.festoAlu, VB.x, VB.y, VB.z);
for (const y of [VB.y - 20, VB.y + 20]) zyl(3.2, 2, M.stahl, VB.x + 16, y, VB.z, 'x', anlage, 6);   // Befestigung an der Säule (Nutensteine)
const vbAnschluss = (y, z, rx) => { const f = new THREE.Group(); f.position.set(VB.x, y, z); f.rotation.x = rx; anlage.add(f); steckverschraubung(f, 0, 0, 0, 6); };
vbAnschluss(VB.y + 15, VB.z + 15, Math.PI / 2);
vbAnschluss(VB.y - 15, VB.z + 15, Math.PI / 2);
vbAnschluss(VB.y - 30, VB.z, Math.PI);
export const DRUCK_QM2 = V(VB.x, VB.y - 45, VB.z);                                 // Schlauchende am unteren Abgang
// Wartungseinheit (Ausgang rechts, Steckverschraubung) → Verteilerblock: hoch, nach links und von vorn hinein
{ const f = new THREE.Group(); f.position.set(-616, 580, -170); f.rotation.z = -Math.PI / 2; anlage.add(f); steckverschraubung(f, 0, 0, 0, 6); }
leitung([[-601, 580, -170], [-558, 580, -170], [-558, VB.y + 15, -160], [VB.x, VB.y + 15, -160], [VB.x, VB.y + 15, VB.z + 30]], druckluftMat, 4, 30);
// Verteilerblock → −QM1: nach vorn, über der Wartungseinheit nach links und von unten in den Anschluss 1
// (Spulen und Handhilfsbetätigungen bleiben frei)
leitung([[VB.x, VB.y - 15, VB.z + 30], [VB.x, VB.y - 15, -160], [-752, VB.y - 15, -160], [-752, 740, -160], [-752, 780, -186], [-752, 810, -186]], druckluftMat, 4, 30);

// Pneumatikschläuche: je Zylinder A (Kolbenseite) und B (Stangenseite); leuchten, wenn belüftet
for (const c of ZYL_LISTE) {
  c.matA = new THREE.MeshStandardMaterial({ color: 0x2f7fd0, roughness: 0.42, emissive: 0x3d9bff, emissiveIntensity: 0 });
  c.matB = new THREE.MeshStandardMaterial({ color: 0x1e5fa6, roughness: 0.42, emissive: 0x3d9bff, emissiveIntensity: 0 });
}
anlage.updateMatrixWorld(true);
export const inAnlage = (obj, v) => anlage.worldToLocal(obj.localToWorld(v.clone()));
const inSchlitten = (obj, v) => schlitten.worldToLocal(obj.localToWorld(v.clone()));
// Alle Schläuche verlassen die Ventilinsel nach vorn und laufen senkrecht in Schlauchhaltern nach oben
// Steigleitungen direkt über den Anschlüssen (Anschluss 4 vorn, 2 hinten), Schlauchhalter an Halteleisten vor der Säule
for (const y of [1010, 1130, 1250, 1370]) box(84, 8, 40, M.deckel, VI.x + VT.x0 + 1.5 * VT.raster, y, VI.z + 21);
for (const y of [1010, 1130, 1250, 1370]) for (const q of ventilPorts) halter(q.p4.x, y + 9, VI.z + 21);
// −MM3 auf der Traverse
{
  const A = inAnlage(mm3.g, mm3.portA), B = inAnlage(mm3.g, mm3.portB), q = ventilPorts[2];
  // oben schräg auf die Zylinderachse, so tief wie der Biegeradius es erlaubt entlang und von oben in die Anschlüsse;
  // B liegt in Schlauchhaltern (Alu-Winkel mit Nutenstein in der oberen Zylindernut, Clip oben)
  const yA = A.y + 30, yB = A.y + 46, oben = mm3.g.position.y + 27;
  leitung([q.p4, V(q.p4.x, yA, q.p4.z), V(A.x, yA, A.z), A], ZYL.MM3.matA, 3, 30);
  leitung([q.p2, V(q.p2.x, yB, q.p2.z), V(q.p2.x + 60, yB, B.z), V(B.x, yB, B.z), B], ZYL.MM3.matB, 3, 30);
  for (const x of [-480, -300]) {
    box(10, yB - 4 - oben, 3, M.deckel, x, (yB - 4 + oben) / 2, B.z - 6);
    box(12, 9, 10, M.schwarz, x, yB, B.z);
  }
}
// −MM1/−MM2 in die Kettenwanne bis zum Festpunkt der Energiekette
[0, 1].forEach((i) => {
  const c = i === 0 ? ZYL.MM1 : ZYL.MM2, q = ventilPorts[i];
  [[q.p4, c.matA, 0], [q.p2, c.matB, 1]].forEach(([p, mat, k]) => {
    const dz = (i * 2 + k) * 6 - 9, yo = 1420 + (i * 2 + k) * 8;
    leitung([p, V(p.x, yo, p.z), V(p.x, yo, KETTE.z + dz), V(p.x, 1310, KETTE.z + dz), V(KETTE.xa, 1310, KETTE.z + dz)], mat, 2.8, 28);
  });
});
export const dummy = new THREE.Object3D();
// Gitterrinnen 200 × 60: waagrecht über dem Portal vom Schaltschrank bis zur rechten Säule, senkrecht als Steigrinnen
// an den Außenseiten der Portalsäulen (Boden an der Säule, zur Seite offen). Die Leitungen liegen in der Steigrinne
// nebeneinander auf dem Boden und treten oben durch Aussparungen im Boden der waagrechten Rinne (Kantenschutz) ein,
// am Schrank ebenso nach unten aus.
const RINNE_Y = 2150, RINNE_X0 = -1560;
const aus = (x0, x1, z0, z1, kante) => ({ x0: x0 - RINNE_X0, x1: x1 - RINNE_X0, z0: z0 + 260, z1: z1 + 260, kante: kante - RINNE_X0 });
gitterrinne(V(RINNE_X0, RINNE_Y, -260), 890 - RINNE_X0, { aussparung: [
  aus(-1510, -1310, -310, -210, -1310),                                          // Abgang zum Schaltschrank (Leitungen kommen von rechts)
  aus(-810, -710, -310, -210, -810),                                             // linke Steigrinne (Leitungen gehen nach links ab)
  aus(-710, -610, -210, -160, -610),                                             // Schläuche −MM4 von der Ventilinsel (gehen nach rechts ab)
  aus(790, 890, -310, -160, 790)] });                                            // rechte Steigrinne (Leitungen kommen von links)
const BODEN_L = -749, BODEN_R = 809;                                            // Bodenebene der Steigrinnen (Querstäbe an der Säule)
gitterrinne(V(BODEN_L, 1000, -260), RINNE_Y - 10 - 1000, { lage: steigend(-1) });
gitterrinne(V(BODEN_R, 560, -260), RINNE_Y - 10 - 560, { lage: steigend(1) });   // beginnt über −XD2: Leitungen treten unten aus
// x einer Leitung (Radius r), die in der Steigrinne auf dem Boden liegt
export const amBoden = (seite, r) => seite < 0 ? BODEN_L - 2.2 - r : BODEN_R + 2.2 + r;
// Stützen der Rinne auf den Portalsäulen und auf dem Schaltschrank
for (const x of [-700, 760]) { profil(45, 45, RINNE_Y - 1295 - 14, 'y', x, (RINNE_Y + 1295 - 14) / 2, -260); box(70, 8, 230, M.deckel, x, RINNE_Y - 8, -260); }
box(60, 10, 230, M.deckel, -1250, RINNE_Y - 9, -260);
profil(45, 45, RINNE_Y - 2100 - 14, 'y', -1535, (RINNE_Y + 2100 - 14) / 2, -260);
// Leitungen zum Schaltschrank: jede in eigener Lage z (steigt in der Steigrinne in dieser Lage auf und biegt oben direkt
// ab, so kreuzt keine eine andere), Kabelverschraubung im Schrankdach bei x
export const ZULEITUNG = {
  heizung: { x: -1460, z: -301, r: 5, mat: M.kabel },
  XD2: { x: -1430, z: -289, r: 4, mat: M.kabelGrau },
  QM1: { x: -1400, z: -278, r: 4, mat: M.kabel },
  XD1: { x: -1370, z: -267, r: 4, mat: M.kabelGrau },
};
// Weg ab der Steigrinne (x, Lage z): hoch auf den Rinnenboden, darin zum Schrank und durch die Verschraubung
export function zumSchrank(name, x) {
  const l = ZULEITUNG[name], y = RINNE_Y + 2.2 + l.r;
  return [V(x, y, l.z), V(l.x, y, l.z), V(l.x, 2100, l.z)];
}
// Kabelbinder um die Bündel auf dem Rinnenboden (Lagen z0 … z1)
const binder = (x, z0, z1) => box(5, 14, z1 - z0 + 4, M.kunststoff, x, RINNE_Y + 9, (z0 + z1) / 2);
for (const x of [-1250, -1000]) binder(x, -306, -263);
for (const x of [-500, -200, 100, 400, 700]) { binder(x, -306, -285); binder(x, -205, -183); }
// −MM4: an der Ventilinsel senkrecht hoch in die Rinne, in der Lage der Anschlüsse über das Portal, in der rechten
// Steigrinne hinunter und unten heraus. Unter der Rinne geht der Schlauch über einen Steckverbinder QSS-6 in starres
// PA-Rohr Ø 6 über (nur gerade Stücke, Ecken mit L-Steckverbindern): senkrecht an der Säule (Haltewinkel mit Doppelschelle), waagrecht an der Rückseite des
// Tragprofils (Doppelschellen im Nutenstein, hinter dem Fahrweg des Deckels bis z −181), über dem Anschluss hoch in
// eine Schottverschraubung im Haltewinkel auf dem Profil. Von dort kurzes Schlauchstück von oben in die Drossel.
{
  const q = ventilPorts[3], A = inAnlage(mm4.g, mm4.portA), B = inAnlage(mm4.g, mm4.portB), x = amBoden(1, 3);
  const yT = 397.5, zT = [-192, -206], yS = 453;                                 // Rohrlage am Tragprofil, Oberkante Schottwinkel
  // Doppelschelle (Kunststoff) für beide Rohre mit Schraube; an der Säule auf einem Haltewinkel
  const schelle = (sx, sy, waagrecht) => { box(waagrecht ? 12 : 16, waagrecht ? 16 : 12, 30, M.kunststoff, sx, sy, -199); zyl(3.5, 2, M.stahl, sx, sy, -215, 'z', anlage, 6); };
  box(3, 30, 52, M.verzinkt, 806.5, 480, -212); zyl(4, 2, M.stahl, 809, 480, -228, 'x', anlage, 6);
  schelle(814, 480, false);
  // gerades Rohrstück a…b (Achse x/z, null = y) und L-Verbinder mit Löseringen auf den Schenkeln [Achse, Richtung]
  const gerade = (a, b, achse, mat) => { const m = a.clone().add(b).multiplyScalar(0.5); zyl(3, a.distanceTo(b), mat, m.x, m.y, m.z, achse, anlage, 10); };
  const winkel = (c, ...schenkel) => {
    box(11, 11, 11, M.stahl, c.x, c.y, c.z);
    for (const [ach, s] of schenkel) { const p = c.clone(); p[ach || 'y'] += s * 7; zyl(5, 3, M.qsBlau, p.x, p.y, p.z, ach, anlage, 12); }
  };
  for (const sx of [880, 1150]) schelle(sx, yT, true);
  [[q.p4, A, ZYL.MM4.matA], [q.p2, B, ZYL.MM4.matB]].forEach(([p, ziel, mat], k) => {
    const yR = RINNE_Y + 2.2 + 3, z = zT[k];
    leitung([p, V(p.x, yR, p.z), V(x, yR, p.z), V(x, 660, p.z), V(x, 600, z), V(x, 546, z)], mat, 3, 30);
    zyl(4.6, 20, M.stahl, x, 535, z, null, anlage, 12);                           // Steckverbinder Schlauch → Rohr
    for (const dy of [-9, 9]) zyl(5, 3, M.qsBlau, x, 535 + dy, z, null, anlage, 12);
    // starres Rohr nur gerade, in den Ecken Steck-L-Verbinder QSL-6
    gerade(V(x, 524, z), V(x, yT + 12, z), null, mat); winkel(V(x, yT, z), [null, 1], ['x', 1]);
    gerade(V(x + 12, yT, z), V(ziel.x - 12, yT, z), 'x', mat); winkel(V(ziel.x, yT, z), ['x', -1], [null, 1]);
    gerade(V(ziel.x, yT + 12, z), V(ziel.x, yS - 18, z), null, mat);
    // Schottwinkel am Tragprofil (Nutenstein), Schottverschraubung: unten Rohr, oben Schlauch
    box(12, yS - 380, 3, M.verzinkt, ziel.x, (yS + 380) / 2, -185);
    box(12, 3, 30, M.verzinkt, ziel.x, yS - 1.5, -200);
    for (const [dy, rx] of [[0, 0], [-3, Math.PI]]) { const f = new THREE.Group(); f.position.set(ziel.x, yS + dy, z); f.rotation.x = rx; anlage.add(f); steckverschraubung(f, 0, 0, 0, 4.6); }
    leitung([V(ziel.x, yS + 15, z), V(ziel.x, 500, z), V(ziel.x, 500, ziel.z), ziel], mat, 3, 30);
  });
}
// Ventilinsel-Multipolleitung: über dem Versorgungsschlauch nach links, neben der Montageplatte nach hinten
// (ausnahmsweise Biegeradius 2 × D), von unten in die Steigrinne und auf ihren Boden
{
  const z = ZULEITUNG.QM1.z, x = amBoden(-1, 4);
  leitung([V(-764, 890, -144), V(-795, 890, -144), V(-795, 890, z), V(-795, 1010, z), V(x, 1090, z), ...zumSchrank('QM1', x)], M.kabel, 4, 16, anlage, 2);
}
// Heizungsleitung (Last) vom Bad hinter der rechten Säule herum und von unten in die Steigrinne
{ const x = amBoden(1, 5); leitung([V(BAD_X + 120, 120, -170), V(BAD_X + 120, 120, -330), V(x, 120, -330), V(x, 220, ZULEITUNG.heizung.z), ...zumSchrank('heizung', x)], M.kabel, 5, 35); }

// Kabelwanne zum Hubmodul (Gitterrinne verzinkt wie über dem Portal, 60 × 35 bzw. 48 × 35):
// Steigwanne am Mitnehmer der X-Kette, Längswanne über Traverse und Konsole nach vorn, Querwanne über der
// Z-Grundplatte. Alle Leitungen zum Hubmodul (−MM1, −MM2, −BG1…−BG4) liegen nebeneinander auf dem Wannenboden,
// jede in ihrer eigenen Spur, und verlassen die Wanne nach unten an ihrem Abgang.
// Die Querwanne endet bei z −14: die Führungsstangen (z 0) fahren in der oberen Endlage bis y 1664 hoch.
export const WANNE = { y: 1530, xL: 65, bL: 60, z0: -325, zQ: -38, bQ: 48, x0: -40, x1: 190, h: 35 };
function gitterwanne(achse, a0, a1, y, c, b, h, parent) {
  const L = a1 - a0, m = (a0 + a1) / 2, lang = (q, yy) => achse === 'x' ? zyl(2, L, M.verzinkt, m, yy, c + q, 'x', parent, 6) : zyl(2, L, M.verzinkt, c + q, yy, m, 'z', parent, 6);
  for (const q of [-b / 2, -b / 4, 0, b / 4, b / 2]) lang(q, y);
  for (const s of [-1, 1]) for (const dy of [h / 2, h]) lang(s * b / 2, y + dy);
  for (let t = a0 + 10; t <= a1 - 5; t += 50) {
    if (achse === 'x') { box(4, 4, b, M.verzinkt, t, y - 2, c, parent); for (const s of [-1, 1]) box(4, h, 4, M.verzinkt, t, y + h / 2, c + s * b / 2, parent); }
    else { box(b, 4, 4, M.verzinkt, c, y - 2, t, parent); for (const s of [-1, 1]) box(4, h, 4, M.verzinkt, c + s * b / 2, y + h / 2, t, parent); }
  }
}
{
  const W = WANNE;
  gitterwanne('z', W.z0, W.zQ - W.bQ / 2, W.y, W.xL, W.bL, W.h, schlitten);                  // Längswanne
  gitterwanne('x', W.x0, W.x1, W.y, W.zQ, W.bQ, W.h, schlitten);                             // Querwanne
  // Steigwanne: senkrecht hinter der Kette, Boden in der Ebene z −370, Seiten nach vorn
  const ys = 1419, L = W.y - ys, ym = (ys + W.y) / 2;
  for (const x of [35, 50, 65, 80, 95]) zyl(2, L, M.verzinkt, x, ym, -370, null, schlitten, 6);
  for (const x of [35, 95]) for (const dz of [17, 35]) zyl(2, L, M.verzinkt, x, ym, -370 + dz, null, schlitten, 6);
  for (const y of [ys + 15, ys + 65]) { box(60, 4, 4, M.verzinkt, 65, y, -370, schlitten); for (const x of [35, 95]) box(4, 4, 35, M.verzinkt, x, y, -352.5, schlitten); }
  box(70, 6, 50, M.deckel, 65, ys - 3, -355, schlitten);                                      // y 1413 … 1419 auf dem Mitnehmerarm                                      // Zugentlastungsblech auf dem Mitnehmer
  for (const z of [-345, -335]) box(66, 3, 4, M.kunststoff, 65, ys + 40, z, schlitten);      // Kabelbinder an der Steigwanne
  // Stütze der Längswanne auf der Kopfplatte, Konsolen der Querwanne auf der Z-Grundplatte
  box(20, W.y - 10 - 1313, 20, M.deckel, W.xL, (W.y - 10 + 1313) / 2, -230, schlitten);
  box(70, 6, 30, M.deckel, W.xL, W.y - 7, -230, schlitten);
  for (const x of [-20, 135]) { box(24, W.y - 10 - 1500, 30, M.deckel, x, (W.y - 10 + 1500) / 2, -47, schlitten); box(30, 6, 50, M.deckel, x, W.y - 7, -40, schlitten); }
  label('Kabelwanne Hubmodul', schlitten, 65, 1610, -200, 'klein');
}
// Spuren in der Wanne: x-Spur in der Längswanne, z-Spur in der Querwanne (größere x-Spur biegt weiter hinten ab → keine Kreuzung)
export const SPUR = {
  BG4: { x: 48, z: -20, dz: -2 }, BG3: { x: 42, z: -26, dz: -8 }, BG1: { x: 56, z: -32, dz: -16, ab: 180 },
  MM1B: { x: 64, z: -38, dz: 4, ab: 174 }, MM1A: { x: 72, z: -44, dz: -4, ab: 168 },
  MM2B: { x: 80, z: -50, dz: 11, ab: 98 }, MM2A: { x: 88, z: -56, dz: -11, ab: 92 },
};
// Weg vom Kettenende der X-Kette durch Steigwanne und Längswanne bis zum Abgang in der Querwanne (r = Leitungsradius)
export function wannenWeg(sp, r, yEnde = 1398) {
  const yc = WANNE.y + 2 + r, z = KETTE.z + sp.dz;
  return [V(60, yEnde, z), V(60, 1418, z), V(sp.x, 1446, z), V(sp.x, yc, z), V(sp.x, yc, sp.z), V(sp.ab, yc, sp.z)];
}
// vom Kettenmitnehmer (Schlitten) zu −MM2
{
  const A = inSchlitten(mm2.g, mm2.portA), B = inSchlitten(mm2.g, mm2.portB);
  // aus der Querwanne nach unten, unter der Wanne nach vorn vor die Grundplatte, zwischen oberer Lagereinheit (x ≤ 85) und Kettenrinne (x ≥ 104) hinunter,
  // auf Anschlusshöhe vor der Führungsstange (z 0, Ø16) vorbei nach vorn und von vorn in die Drosselrückschlagventile
  for (const [ziel, mat, sp] of [[A, ZYL.MM2.matA, SPUR.MM2A], [B, ZYL.MM2.matB, SPUR.MM2B]]) {
    const zv = ziel.z + 22;
    leitung([...wannenWeg(sp, 2.8), V(sp.ab, 1515, sp.z), V(sp.ab, 1515, -30), V(sp.ab, ziel.y, -30), V(sp.ab, ziel.y, zv), V(ziel.x, ziel.y, zv), ziel], mat, 2.8, 8, schlitten);
  }
  for (const y of [1200, 1400]) box(14, 8, 12, M.kunststoff, 95, y, -31, schlitten);     // Schlauchhalter x 88 … 102 (Rinne ab x 104), auf der Grundplatte
}
// Energiezuführung zum Hubteil (−MM1 und die Geber −BG1/−BG2): stehende Energiekette in einer
// Rinne an der Z-Grundplatte (x 104 … 146, y 1060 … 1490, zur Außenseite +x offen). Hub 300 mm,
// beide Druckluftschläuche und die Sensorleitung laufen gemeinsam in EINER Kette.
//
// Festpunkt unten in der vorderen Gasse (z 68), bewegtes Ende unten in der hinteren Gasse (z −12)
// am Kopf des Mitnehmerschwerts. Die Umlenkung wandert mit halbem Hub und bleibt immer oberhalb
// y 1060 – weit weg vom Zinnbad. Unter dem Mitnehmer ist die hintere Gasse frei für das Schwert.
export const HK1 = { x: 125, zF: 68, zM: -12, R: 40, yA: 1080, yC0: 1096, L: 528, glied: 22 };
{
  const yu = 1060, yo = 1490, h = yo - yu, yc = (yu + yo) / 2;
  box(2, h, 119, M.blech, 105, yc, 22.5, schlitten);                             // Innenwand
  box(40, h, 2, M.blech, 126, yc, 81, schlitten);                                // Vorderwand (stößt an die Innenwand)
  box(44, 2, 121, M.blech, 124, yo + 1, 22.5, schlitten);                        // Deckel
  box(42, 4, 32, M.blech, 125, yu - 2, 66, schlitten);                           // Boden vordere Gasse (hintere Gasse offen für das Schwert)
  for (const y of [yu + 30, yo - 30]) box(16, 20, 4, M.blech, 114, y, -35, schlitten);   // Befestigungslaschen an der Grundplatte
  box(38, 20, 26, M.verzinkt, HK1.x, HK1.yA - 10, HK1.zF, schlitten);            // Festpunkt
  label('Energiekette Hub −MM2', schlitten, 175, 1300, 30, 'klein');
}
box(38, 20, 24, M.verzinkt, HK1.x, HK1.yC0 - 10, HK1.zM, haken);                 // Kettenanschluss am Schwertkopf
const mm1PortA = inSchlitten(mm1.g, mm1.portA), mm1PortB = inSchlitten(mm1.g, mm1.portB);
// Zuleitung am Schlitten: X-Kette → Kabelwanne → rechts neben der Grundplatte hinunter → seitlich in den Festpunkt
for (const [mat, sp] of [[ZYL.MM1.matA, SPUR.MM1A], [ZYL.MM1.matB, SPUR.MM1B]]) {
  leitung([...wannenWeg(sp, 2.4), V(sp.ab, 1070, sp.z), V(sp.ab, 1070, HK1.zF + sp.dz), V(HK1.x + 19, 1070, HK1.zF + sp.dz)], mat, 2.4, 12, schlitten);
}
for (const y of [1160, 1300, 1440]) { box(4, 24, 30, M.deckel, 162, y, -38, schlitten); box(26, 8, 24, M.kunststoff, 175, y, -38, schlitten); }   // Schlauchhalter an der Plattenkante
// Am Hubteil: vom Kettenanschluss am Schwert entlang hinunter zu −MM1 (fährt mit, keine Nachführung nötig)
for (const [ziel, mat, dx] of [[mm1PortA, ZYL.MM1.matA, 0], [mm1PortB, ZYL.MM1.matB, 6]]) {
  leitung([V(HK1.x + 19, HK1.yC0 - 10, HK1.zM), V(146 + dx, HK1.yC0 - 10, HK1.zM), V(146 + dx, 640, HK1.zM), V(146 + dx, 640, ziel.z), V(ziel.x, 640, ziel.z), ziel], mat, 2.4, 16, haken);
}
for (const y of [700, 820, 940]) box(18, 8, 14, M.kunststoff, 148, y, HK1.zM, haken);
for (const q of [mm1PortA, mm1PortB]) zyl(5.5, 24, M.schwarz, q.x, 594, q.z, null, haken, 12);       // Durchführungstüllen im Hakenträger       // Clips am Schwert
// Kettenglieder (ein InstancedMesh, wird je Bild nur umgesetzt)
const hubGlieder = new THREE.InstancedMesh(new THREE.BoxGeometry(34, HK1.glied - 2, 18), M.kette, Math.floor(HK1.L / HK1.glied));
hubGlieder.castShadow = true;
schlitten.add(hubGlieder);
let mm1Off = -1;
export function rohrNeu(m, kurve, seg, r) {
  const neu = kurvenRohr(kurve, r, seg), alt = m.geometry;
  if (alt.attributes.position && alt.attributes.position.count === neu.attributes.position.count) {
    alt.attributes.position.array.set(neu.attributes.position.array); alt.attributes.position.needsUpdate = true;
    alt.attributes.normal.array.set(neu.attributes.normal.array); alt.attributes.normal.needsUpdate = true;
    alt.computeBoundingSphere();
    neu.dispose();
  } else { alt.dispose(); m.geometry = neu; }
}
export function mm1SchlaeucheAktualisieren() {
  const off = haken.position.y;
  if (Math.abs(off - mm1Off) < 0.5) return;
  mm1Off = off;
  const { x, zF, zM, R, yA, yC0, L, glied } = HK1;
  const yC = yC0 + off;                                  // Mitnehmer am Hubteil
  const yB = (L - Math.PI * R + yA + yC) / 2;            // Umlenkung, wandert mit halbem Hub
  const s1 = yB - yA, s2 = Math.PI * R;
  for (let i = 0; i < hubGlieder.count; i++) {
    const s = (i + 0.5) * glied;
    if (s < s1) { dummy.position.set(x, yA + s, zF); dummy.rotation.set(0, 0, 0); }
    else if (s < s1 + s2) {
      const phi = (s - s1) / R;
      const dir = Math.sign(zM - zF);
      dummy.position.set(x, yB + R * Math.sin(phi), zF + dir * (R - R * Math.cos(phi)));
      dummy.rotation.set(dir * phi, 0, 0);
    } else { dummy.position.set(x, yB - (s - s1 - s2), zM); dummy.rotation.set(Math.PI, 0, 0); }
    dummy.scale.set(i % 2 ? 1 : 0.94, 1, 1); dummy.updateMatrix(); dummy.scale.set(1, 1, 1);   // Innen-/Außenlaschen
    hubGlieder.setMatrixAt(i, dummy.matrix);
  }
  hubGlieder.instanceMatrix.needsUpdate = true;
}
