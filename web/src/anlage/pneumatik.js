import * as THREE from 'three';
import { ZYL, ZYL_LISTE } from '../logik/zustand.js';
import { anlage } from '../core/szene.js';
import { canvasTextur } from '../core/texturen.js';
import { M } from '../core/materialien.js';
import { V, box, cached, mesh, zyl } from '../core/geometrie.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { dekor, label, platte, tafel } from '../core/beschriftung.js';
import { profil } from '../bauteile/aluprofil.js';
import { sensorLed } from '../core/leds.js';
import { halter, leitung, schlauch } from '../bauteile/leitungen.js';
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
// Multipol-Elektrikanschluss (Sub-D 25-polig) mit Stecker und Leitung nach unten
box(38, 64, 28, M.kunststoff, -44, 12, 50, ventilinsel);
box(30, 20, 3, M.schwarz, -44, 14, 65, ventilinsel);
box(22, 30, 12, M.kunststoff, -44, 10, 71, ventilinsel);
zyl(5, 12, M.kunststoff, -44, -9, 72, null, ventilinsel, 10);                                       // Knickschutz
for (const y of [-2, 22]) zyl(1.6, 3, M.stahl, -44, y, 78, 'z', ventilinsel, 6);                     // Rändelschrauben
platte(tafel('festo', 34, 9, (c) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, 34, 9); c.fillStyle = '#0091dc'; c.font = '700 7px Arial'; c.textAlign = 'center'; c.fillText('FESTO', 17, 7.2); }, 8), 30, 8, ventilinsel, -44, 37, 64.2);
// Versorgung 1 (QS-8) und Abluft 3/5 (Schalldämpfer) an der linken Endplatte
const p1 = new THREE.Group(); p1.position.set(-52, -40, 36); p1.rotation.x = Math.PI / 2; ventilinsel.add(p1);
steckverschraubung(p1, 0, 0, 0, 6);
for (const x of [-38, -28]) { zyl(4.2, 4, M.stahl, x, -40, 38, 'z', ventilinsel, 6); zyl(3.8, 14, M.kunststoff, x, -40, 47, 'z', ventilinsel, 10); }
platte(tafel('vtugTyp', 36, 14, (c) => {
  c.fillStyle = '#e9ecee'; c.fillRect(0, 0, 36, 14); c.fillStyle = '#16191c'; c.font = '700 3.6px Arial'; c.fillText('VTUG-18-VRPT-B1T', 1.5, 4.5);
  c.font = '400 2.6px Arial'; c.fillText('−QM1  4x M52 · 24 V DC', 1.5, 8.2); c.fillText('p 1,5…8 bar', 1.5, 11.6);
}, 10), 36, 14, ventilinsel, -44, -20, 36.2);
export const VENTIL_LEDS = [];
const ventilPorts = [];
const etikett = (bmk, sp) => tafel('spule' + bmk, 14, 8, (cc) => { cc.fillStyle = '#f2f3f1'; cc.fillRect(0, 0, 14, 8); cc.fillStyle = '#111'; cc.textAlign = 'center'; cc.font = '700 3.8px Arial'; cc.fillText(bmk, 7, 4); cc.font = '500 2.4px Arial'; cc.fillText(sp, 7, 7.1); }, 12);
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
platte(tafel('msEM', 30, 8, (c) => { c.fillStyle = '#e9ecee'; c.fillRect(0, 0, 30, 8); c.fillStyle = '#16191c'; c.font = '700 3.4px Arial'; c.fillText('MS6-EM1-1/2', 1.5, 3.6); c.fillStyle = '#c8281f'; c.fillText('0', 22, 3.6); c.fillStyle = '#2f7a3a'; c.fillText('1', 26, 3.6); c.fillStyle = '#16191c'; c.font = '400 2.4px Arial'; c.fillText('Einschaltventil', 1.5, 6.8); }, 10), 30, 8, wartung, -26, -24, 71.2);
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
zyl(11, 1980, M.alu, -805, 620 + 990, -130, null);
zyl(14, 40, M.messing, -805, 760, -130, null, anlage, 6);
box(70, 8, 14, M.rot, -770, 772, -130);
for (const y of [1000, 1500, 2000]) box(30, 20, 120, M.deckel, -805, y, -190);
leitung([[-805, 620, -130], [-805, 580, -130], [-805, 580, -170], [-772, 580, -170]], druckluftMat, 5, 30);
leitung([[-620, 580, -170], [-596, 580, -170], [-596, 780, -170], [-596, 780, -130], [-752, 780, -130], [-752, 840, -130], [-752, 840, -164]], druckluftMat, 4, 30);

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
  for (const [ziel, p, mat, yo] of [[A, q.p4, ZYL.MM3.matA, 1440], [B, q.p2, ZYL.MM3.matB, 1456]]) {
    leitung([p, V(p.x, yo, p.z), V(p.x, yo, -232), V(ziel.x, yo, -232), V(ziel.x, yo, ziel.z), ziel], mat, 3, 30);
  }
  for (const x of [-500, -300]) box(16, 30, 60, M.kunststoff, x, 1440, -232);
}
// −MM1/−MM2 in die Kettenwanne bis zum Festpunkt der Energiekette
[0, 1].forEach((i) => {
  const c = i === 0 ? ZYL.MM1 : ZYL.MM2, q = ventilPorts[i];
  [[q.p4, c.matA, 0], [q.p2, c.matB, 1]].forEach(([p, mat, k]) => {
    const dz = (i * 2 + k) * 6 - 9, yo = 1420 + (i * 2 + k) * 8;
    leitung([p, V(p.x, yo, p.z), V(p.x, yo, KETTE.z + dz), V(p.x, 1310, KETTE.z + dz), V(KETTE.xa, 1310, KETTE.z + dz)], mat, 2.8, 28);
  });
});
// −MM4: hoch in die Gitterrinne, über das Portal und an der rechten Säule im Kabelkanal hinunter
{
  const q = ventilPorts[3];
  [[q.p4, ZYL.MM4.matA], [q.p2, ZYL.MM4.matB]].forEach(([p, mat], k) => {
    leitung([p, V(p.x, 1480 + k * 10, p.z), V(-775 + k * 12, 1480 + k * 10, p.z), V(-775 + k * 12, 1480 + k * 10, -230)], mat, 3, 30);
  });
}
// Kabelkanäle (PVC, mit Deckel) an den Portalsäulen
function kabelkanal(x, z, y0, y1, b = 60, t = 60) {
  box(b, y1 - y0, t, M.pvc, x, (y0 + y1) / 2, z);
  box(b + 4, y1 - y0, 3, M.pvcHell, x, (y0 + y1) / 2, z + t / 2 + 1.5);
}
const RINNE_Y = 2150;
kabelkanal(-775, -260, 1000, RINNE_Y - 30);
kabelkanal(835, -260, 470, RINNE_Y - 30);
// Gitterrinne (verzinkt) über dem Portal vom Schaltschrank bis zur rechten Säule
function gitterrinne(x0, x1, y, z, b = 200, h = 60) {
  const L = x1 - x0, xm = (x0 + x1) / 2;
  for (const dz of [-b / 2, -b / 4, 0, b / 4, b / 2]) zyl(2.2, L, M.verzinkt, xm, y, z + dz, 'x', anlage, 6);
  for (const s of [-1, 1]) for (const dy of [h / 2, h]) zyl(2.2, L, M.verzinkt, xm, y + dy, z + s * b / 2, 'x', anlage, 6);
  const n = Math.floor(L / 50) + 1;
  const boden = new THREE.InstancedMesh(new THREE.BoxGeometry(4, 4, b), M.verzinkt, n);
  const seite = new THREE.InstancedMesh(new THREE.BoxGeometry(4, h, 4), M.verzinkt, 2 * n);
  for (let i = 0; i < n; i++) {
    dummy.position.set(x0 + i * 50, y - 2, z); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); boden.setMatrixAt(i, dummy.matrix);
    for (const s of [0, 1]) { dummy.position.set(x0 + i * 50, y + h / 2, z + (s ? 1 : -1) * b / 2); dummy.updateMatrix(); seite.setMatrixAt(2 * i + s, dummy.matrix); }
  }
  boden.castShadow = seite.castShadow = true;
  anlage.add(boden); anlage.add(seite);
}
export const dummy = new THREE.Object3D();
gitterrinne(-1560, 860, RINNE_Y, -260);
// Leitungen in der Rinne
[[M.kabel, -70, 6], [M.kabelGrau, -50, 4.5], [M.kabelGrau, -36, 4.5], [M.kabelGruen, -22, 3.5], [M.kabelOrange, 2, 5]].forEach(([mat, dz, r]) => {
  zyl(r, 1960, mat, -1560 + 980 + 300, RINNE_Y + r + 1, -260 + dz, 'x');
});
zyl(3, 1440, ZYL.MM4.matA, 120, RINNE_Y + 4, -260 + 40, 'x');
zyl(3, 1440, ZYL.MM4.matB, 120, RINNE_Y + 4, -260 + 50, 'x');
for (let x = -1500; x <= 800; x += 300) box(6, 16, 150, M.kunststoff, x, RINNE_Y + 12, -280);   // Kabelbinder
// Stützen der Rinne auf den Portalsäulen
for (const x of [-700, 760]) { profil(45, 45, RINNE_Y - 1295 - 14, 'y', x, (RINNE_Y + 1295 - 14) / 2, -260); box(70, 8, 230, M.deckel, x, RINNE_Y - 8, -260); }
box(60, 10, 230, M.deckel, -1250, RINNE_Y - 9, -260);
profil(45, 45, RINNE_Y - 2100 - 14, 'y', -1500, (RINNE_Y + 2100 - 14) / 2, -260);
// −MM4-Schläuche aus dem rechten Kanal über das Führungsgestell zum Zylinder
{
  const A = inAnlage(mm4.g, mm4.portA), B = inAnlage(mm4.g, mm4.portB);
  [[A, ZYL.MM4.matA, 0], [B, ZYL.MM4.matB, 1]].forEach(([ziel, mat, k]) => {
    const z1 = -205 - k * 10, y1 = 470 + k * 10;
    leitung([V(835, 480, -230 + k * 8), V(835, 480, z1), V(870, 480, z1), V(870, y1, z1), V(ziel.x, y1, z1), V(ziel.x, y1, ziel.z), ziel], mat, 3, 30);
  });
}
// Ventilinsel-Multipolleitung in den Kanal
leitung([[-744, 868, -143], [-744, 832, -143], [-840, 832, -143], [-840, 960, -143], [-840, 960, -260], [-805, 960, -260], [-790, 1000, -260]], M.kabel, 4, 25);
// Heizungsleitung (Last) vom Bad in den Kanal
leitung([[BAD_X + 120, 120, -170], [BAD_X + 120, 120, -235], [835, 120, -235], [835, 470, -235]], M.kabel, 5, 35);

// vom Kettenmitnehmer (Schlitten) zu −MM2
{
  const A = inSchlitten(mm2.g, mm2.portA), B = inSchlitten(mm2.g, mm2.portB);
  // Querversatz ±11 (die −MM1-Schläuche liegen bei ±4): auf dem freien Stück über der Kette dürfen sich die Schläuche nicht berühren
  for (const [ziel, mat, dz] of [[A, ZYL.MM2.matA, -11], [B, ZYL.MM2.matB, 11]]) {
    schlauch([[60, 1398, KETTE.z + dz], [60, 1430, -300 + dz], [50, 1440, -160 + dz], [ziel.x + 70, ziel.y + 10, ziel.z - 30 + dz], [ziel.x + 18, ziel.y, ziel.z + dz * 0.3], ziel], mat, 2.8, schlitten);
  }
}
// Energiezuführung zum Hubteil (−MM1 und die Geber −BG1/−BG2): vertikale
// Energiekette in einer Führungsrinne am Schlitten. Hub 300 mm, beide
// Druckluftschläuche und die Sensorleitung laufen gemeinsam in EINER Kette.
//
// Gleitende Anordnung mit Festpunkt UNTEN: die Umlenkung wandert mit halbem Hub
// und liegt in jeder Stellung über dem Mitnehmer (200 mm Luft unten, 50 mm oben).
// Hängend mit Festpunkt oben ginge es bei diesem Hub nicht - dort wandert die
// Schlaufe nach unten und würde den Mitnehmer unterlaufen.
profil(45, 45, 235, 'x', 202.5, 1172, -2, schlitten);                            // Ausleger an der Schlittenplatte
export const HK1 = { x: 300, zF: -10, zM: 46, R: 28, yA: 560, yC0: 620, L: 548, glied: 22 };
{
  const yu = 540, yo = 1160, h = yo - yu, yc = (yu + yo) / 2;
  box(4, h, 108, M.blech, HK1.x + 26, yc, 18, schlitten);                        // Rücken der Rinne
  for (const z of [HK1.zF - 24, HK1.zM + 24]) box(32, h, 4, M.blech, HK1.x + 10, yc, z, schlitten);   // Seitenwangen
  for (const y of [1040, 1130]) box(38, 8, 112, M.verzinkt, HK1.x + 8, y, 18, schlitten);             // Traversen zum Ausleger (über dem Kettenweg), 1 mm über die Wangen
  box(26, 18, 40, M.verzinkt, HK1.x, HK1.yA - 12, HK1.zF, schlitten);            // Festpunkt unten
  label('Energiekette Hub −MM2', schlitten, HK1.x + 60, 1070, 18, 'klein');
}
box(80, 10, 44, M.blau, 262, 614, HK1.zM, haken);                                // Mitnehmer am Hubteil
box(26, 18, 40, M.verzinkt, HK1.x, HK1.yC0, HK1.zM, haken);                      // Kettenanschluss am Mitnehmer
const mm1PortA = inSchlitten(mm1.g, mm1.portA), mm1PortB = inSchlitten(mm1.g, mm1.portB);
// Zuleitung am Schlitten: Ventilinsel → Ausleger → Rinne hinunter zum Festpunkt
for (const [ziel, mat] of [[mm1PortA, ZYL.MM1.matA], [mm1PortB, ZYL.MM1.matB]]) {
  const dz = ziel === mm1PortA ? -4 : 4;                                        // beide Schläuche nebeneinander, nicht ineinander
  schlauch([[60, 1398, KETTE.z + dz], [80, 1430, -300 + dz], [250, 1420, -60 + dz], [292, 1270, 20 + dz], [HK1.x, 1150, HK1.zF + dz], [HK1.x, 900, HK1.zF + dz], [HK1.x, HK1.yA + 6, HK1.zF + dz]], mat, 2.4, schlitten, 56);
}
// Am Hubteil: vom Mitnehmer zu den Anschlüssen von −MM1 (fährt mit, keine Nachführung nötig)
for (const [ziel, mat] of [[mm1PortA, ZYL.MM1.matA], [mm1PortB, ZYL.MM1.matB]]) {
  const dz = ziel === mm1PortA ? -5 : 5;
  schlauch([[HK1.x - 4, HK1.yC0, HK1.zM + dz], [HK1.x - 46, HK1.yC0 - 12, HK1.zM - 6 + dz], [ziel.x + 44, ziel.y + 34, ziel.z + 26], [ziel.x + 10, ziel.y + 8, ziel.z + 12], ziel], mat, 2.4, haken, 40);
}
// Kettenglieder (ein InstancedMesh, wird je Bild nur umgesetzt)
const hubGlieder = new THREE.InstancedMesh(new THREE.BoxGeometry(34, HK1.glied - 2, 18), M.kette, Math.floor(HK1.L / HK1.glied));
hubGlieder.castShadow = true;
schlitten.add(hubGlieder);
let mm1Off = -1;
export function rohrNeu(m, kurve, seg, r, rad) {
  const neu = new THREE.TubeGeometry(kurve, seg, r, rad), alt = m.geometry;
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
      dummy.position.set(x, yB + R * Math.sin(phi), zF + R - R * Math.cos(phi));
      dummy.rotation.set(phi, 0, 0);
    } else { dummy.position.set(x, yB - (s - s1 - s2), zM); dummy.rotation.set(Math.PI, 0, 0); }
    dummy.scale.set(i % 2 ? 1 : 0.94, 1, 1); dummy.updateMatrix(); dummy.scale.set(1, 1, 1);   // Innen-/Außenlaschen
    hubGlieder.setMatrixAt(i, dummy.matrix);
  }
  hubGlieder.instanceMatrix.needsUpdate = true;
}
