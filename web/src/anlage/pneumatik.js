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
// (Fallleitung in Flucht mit dem Eingang der Wartungseinheit: ein einziger Bogen nach unten/vorn)
zyl(11, 1960, M.alu, -830, 640 + 980, -170, null);
zyl(14, 40, M.messing, -830, 760, -170, null, anlage, 6);
box(70, 8, 14, M.rot, -795, 772, -170);
for (const y of [1000, 1500, 2000]) box(30, 20, 120, M.deckel, -830, y, -230);
leitung([[-830, 640, -170], [-830, 580, -170], [-772, 580, -170]], druckluftMat, 5, 30);
// Wartungseinheit → Ventilinsel: hoch, vor der Ventilinsel herüber und von vorn in den Anschluss 1
leitung([[-620, 580, -170], [-580, 580, -170], [-580, 840, -170], [-580, 840, -90], [-752, 840, -90], [-752, 840, -164]], druckluftMat, 4, 30);

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
  // oben schräg auf die Zylinderachse, darüber entlang und senkrecht in die Anschlüsse
  leitung([q.p4, V(q.p4.x, 1440, q.p4.z), V(A.x, 1440, A.z), A], ZYL.MM3.matA, 3, 30);
  leitung([q.p2, V(q.p2.x, 1456, q.p2.z), V(q.p2.x + 60, 1456, B.z), V(B.x, 1456, B.z), B], ZYL.MM3.matB, 3, 30);
  for (const x of [-500, -300]) box(16, 8, 30, M.kunststoff, x, 1452, B.z);
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
    leitung([p, V(p.x, 1480 + k * 10, p.z), V(-775 + k * 12, 1480 + k * 10, p.z), V(-775 + k * 12, 1480 + k * 10, -250)], mat, 3, 30);
  });
}
// Kabelkanäle (PVC, mit Deckel) an den Portalsäulen
function kabelkanal(x, z, y0, y1, b = 60, t = 60) {
  box(b, y1 - y0, t, M.pvc, x, (y0 + y1) / 2, z);
  box(b + 4, y1 - y0, 3, M.pvcHell, x, (y0 + y1) / 2, z + t / 2 + 1.5);
}
const RINNE_Y = 2150;
kabelkanal(-775, -260, 1000, RINNE_Y - 30);
kabelkanal(835, -260, 560, RINNE_Y - 30);                                       // endet über −XD2: Leitungen treten unten gerade aus
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
    // im Kanal hinunter, unten heraus, in eigener Höhe zum Zylinder und von oben in den Anschluss
    const z1 = -175 - k * 5, yh = 510 + k * 12;
    leitung([V(835, 900, -250 + k * 8), V(835, yh, -250 + k * 8), V(835, yh, z1), V(ziel.x, yh, z1), V(ziel.x, yh, ziel.z), ziel], mat, 3, 30);
  });
}
// Ventilinsel-Multipolleitung in den Kanal
leitung([[-744, 868, -143], [-744, 820, -143], [-860, 820, -143], [-860, 900, -143], [-860, 900, -260], [-775, 900, -260], [-775, 1060, -260]], M.kabel, 4, 25);
// Heizungsleitung (Last) vom Bad in den Kanal
leitung([[BAD_X + 120, 120, -170], [BAD_X + 120, 120, -235], [835, 120, -235], [835, 600, -235]], M.kabel, 5, 35);

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
  // aus der Querwanne nach unten, unter der Wanne nach vorn vor die Grundplatte, zwischen oberer Lagereinheit (x ≤ 85) und Kettenrinne (x ≥ 104) hinunter
  for (const [ziel, mat, sp] of [[A, ZYL.MM2.matA, SPUR.MM2A], [B, ZYL.MM2.matB, SPUR.MM2B]]) {
    leitung([...wannenWeg(sp, 2.8), V(sp.ab, 1515, sp.z), V(sp.ab, 1515, -30), V(sp.ab, ziel.y, -30), V(sp.ab, ziel.y, ziel.z), ziel], mat, 2.8, 8, schlitten);
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
