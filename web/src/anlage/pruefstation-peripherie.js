import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { TEX } from '../core/texturen.js';
import { M } from '../core/materialien.js';
import { V, box, mesh, zyl } from '../core/geometrie.js';
import { label, platte, tafel } from '../core/beschriftung.js';
import { t as tr } from '../core/sprache.js';
import { sensorLed } from '../core/leds.js';
import { BRUECKE, lage } from './kabelbruecke.js';
import { profil } from '../bauteile/aluprofil.js';
import { halter, leitung, schlauch } from '../bauteile/leitungen.js';
import { stecker, steckerWinkel } from '../bauteile/stecker.js';
import { steckverschraubung } from '../bauteile/zylinder.js';
import { SENSOR_AUSTRITT } from '../bauteile/nutsensor.js';
import { VENTIL_LEDS, inAnlage, rohrNeu } from './pneumatik.js';
import { FELD_LEDS, feldverteiler, kabel, zumPort } from './verdrahtung.js';
import { KIPPER_NACHFUEHREN, MM8, ST } from './pruefstation.js';
import { S40_FUSS } from './befehlsgeraete.js';
import { KLICK, PULT_TASTER } from './register.js';

// ----------------------------------------------------------------------------
// Peripherie der Entleer- und Prüfstation (Kipper −MM8 … KLT)
//  Druckluft: Fallleitung Hallennetz mit Kugelhahn → Wartungseinheit −AZ2 (Filterregler, Einschaltventil)
//    → Ventilinsel −QM4 (−MB15 5/2 monostabil für −MM8, −MB16 3/2 NC für die Ausblasdüse), beide auf einer
//    Montageplatte am vorderen Lagerbock. Schläuche Ø8 zu −MM8 über den Querträger und den hinteren Längsträger,
//    am Zylinder Drosselrückschlagventile (Abluftdrosselung); Schlauch Ø6 zur Düse im Kabelkanal.
//  Elektrik: Feldverteiler −XD5 (8 x M12) an einer Säule vor der Vibrorinne:
//    X0 −BG30, X1 −BG31 (Nutsensoren, Schleppbogen am schwenkenden Zylinder), X2 −BG33 (auf der Mulde,
//    Schleppschleife an der Kippachse), X3 −BG32, X4 −BG34, X5 −QM4 (−MB15 Pin 4 / −MB16 Pin 2),
//    X6 −BG37 (Lichtschranke Einlauf Mulde, schwenkt mit, eigene Schleppschleife neben −BG33).
//  Kabelkanal 60x40 auf Ständern vor der Station, an seinem Anfang über eine Kabelbrücke in die
//  vorhandene Kabelbrücke zum Schaltschrank: Sammelleitung −XD5, Muldenantrieb −MA7 (−QA12/−QA13), Steuergerät −MA4,
//  Motor −MA5, Kameraleitung −KF10 und die Steuerleitung der Vor-Ort-Steuerstelle −S40 (am Boden unter dem Prüfband).
//  Bewegte Leitungen werden nur neu berechnet, wenn sich der Kippwinkel ändert (KIPPER_NACHFUEHREN).
// ----------------------------------------------------------------------------
const z = ST.z, A = ST.ans;
const KX0 = 2880, KX1 = 4600, KZ = z - 270, KY = 150, KI = KZ + 12;   // Kabelkanal, Leitungsebene im Kanal
anlage.updateMatrixWorld(true);

// --- Kabelkanal auf Ständern, Kabelbrücke zur vorhandenen Brücke ---
box(KX1 - KX0, 40, 60, M.pvc, (KX0 + KX1) / 2, KY, KZ);
box(KX1 - KX0 + 4, 3, 64, M.pvcHell, (KX0 + KX1) / 2, KY + 21.5, KZ);
for (const x of [2930, 3380, 3760, 4250, 4560]) {
  profil(45, 45, 124, 'y', x, 62, KZ + 50); box(80, 6, 80, M.anthrazit, x, 3, KZ + 50);     // Ständer endet unter dem Halter
  box(20, 50, 6, M.anthrazit, x, KY - 5, KZ + 33); box(20, 6, 62, M.anthrazit, x, KY - 23, KZ - 1);   // Kanalhalter (Schenkel stoßen aneinander)
}
label('Kabelkanal Prüfstation', anlage, 3600, KY + 50, KZ - 40, 'klein');
{
  const prof = [[-110, 0], [110, 0], [60, 28], [-60, 28]];
  const weg = [[2750, 1060], [KX0 + 10, 1060], [KX0 + 10, KZ - 10]];                 // stößt am Ende der Kabelbrücke (x = 2750) an
  const pos = [], uv = [], idx = [];
  let lauf = 0;
  weg.forEach((p, i) => {
    const d0 = i > 0 ? new THREE.Vector2(p[0] - weg[i - 1][0], p[1] - weg[i - 1][1]).normalize() : null;
    const d1 = i < weg.length - 1 ? new THREE.Vector2(weg[i + 1][0] - p[0], weg[i + 1][1] - p[1]).normalize() : null;
    const t = (d0 && d1) ? d0.clone().add(d1).normalize() : (d0 || d1), n = new THREE.Vector2(t.y, -t.x);
    const k = (d0 && d1) ? 1 / Math.max(0.3, n.dot(new THREE.Vector2(d1.y, -d1.x))) : 1;
    if (i) lauf += Math.hypot(p[0] - weg[i - 1][0], p[1] - weg[i - 1][1]);
    for (const [u, v] of prof) { pos.push(p[0] + n.x * u * k, v + 0.5, p[1] + n.y * u * k); uv.push((lauf + u * 0.6) / 110, 0.5); }
  });
  for (let i = 0; i < weg.length - 1; i++) for (let j = 0; j < 4; j++) { const a = i * 4 + j, b = i * 4 + (j + 1) % 4; idx.push(a, a + 4, b, b, a + 4, b + 4); }
  idx.push(8, 9, 10, 8, 10, 11);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const mat = M.warn.clone(); mat.map = TEX.warnband.clone(); mat.map.needsUpdate = true; mat.side = THREE.DoubleSide;
  mesh(geo, mat, anlage, false);
}
// Leitung aus dem Kanal (Abgang am Kanalanfang) in die Kabelbrücke bis zum Schaltschrank
let nSchrank = 0;
function zumSchrank(weg, mat, r) {
  const i = nSchrank++, x = KX0 + 8 + i * 6, d = lage();
  kabel([...weg, V(x, KY, KI), V(x, 14, KI), V(x, 14, BRUECKE.z + d), V(BRUECKE.x + d, 14, BRUECKE.z + d), V(BRUECKE.x + d, 14, -60)], anlage, mat, r, 20, false);
}

// --- Druckluft: Fallleitung, Wartungseinheit −AZ2, Ventilinsel −QM4 auf Montageplatte am vorderen Lagerbock ---
const druck = new THREE.MeshStandardMaterial({ color: 0x2f7fd0, roughness: 0.45 });
const matA = new THREE.MeshStandardMaterial({ color: 0x2f7fd0, roughness: 0.42, emissive: 0x3d9bff, emissiveIntensity: 0 });
const matB = new THREE.MeshStandardMaterial({ color: 0x1e5fa6, roughness: 0.42, emissive: 0x3d9bff, emissiveIntensity: 0 });
const matD = new THREE.MeshStandardMaterial({ color: 0x2f7fd0, roughness: 0.42, emissive: 0x3d9bff, emissiveIntensity: 0 });
ST.zeichnen.push(() => {
  matA.emissiveIntensity = MM8.ventil > 0 ? 0.9 : 0;
  matB.emissiveIntensity = MM8.ventil < 0 && MM8.x > 0.5 ? 0.9 : 0;
  matD.emissiveIntensity = ST.blasen ? 0.9 : 0;
});
box(230, 230, 5, M.deckel, 3000, 250, 1350);                                       // Montageplatte am Lagerbock
for (const [x, y] of [[2895, 145], [3105, 145], [2895, 355], [3105, 355]]) zyl(4, 3, M.schwarz, x, y, 1346.5, 'z', anlage, 8);
{
  const FX = 2800, FZ = 1323.5;
  zyl(11, 1900, M.alu, FX, 700 + 950, FZ, null);                                 // Fallleitung Hallennetz
  zyl(14, 40, M.messing, FX, 740, FZ, null, anlage, 6);                           // Kugelhahn
  box(70, 8, 14, M.rot, FX + 35, 752, FZ);
  label('Druckluft 6 bar (Hallennetz)', anlage, FX, 900, FZ - 20, 'klein');
  leitung([V(FX, 720, FZ), V(FX, 270, FZ), V(2873, 270, FZ)], druck, 4.5, 30);
}
const wg = new THREE.Group(); wg.position.set(2930, 250, 1347.5); anlage.add(wg);
box(44, 60, 44, M.zylinder, 0, 20, -24, wg);                                       // Filterregler
zyl(16, 50, new THREE.MeshStandardMaterial({ color: 0xcfe3ef, transparent: true, opacity: 0.45, roughness: 0.1 }), 0, -35, -24, null, wg);
zyl(13, 18, M.kunststoff, 0, 59, -24, null, wg, 16);
zyl(16, 8, M.deckel, 0, 22, -50, 'z', wg, 24);                                    // Manometer
zyl(13, 1, M.pvcHell, 0, 22, -54.5, 'z', wg, 24);
box(26, 40, 40, M.blau, 37, 20, -24, wg);                                          // Einschaltventil (Handschieber)
box(10, 12, 50, M.kunststoff, 37, 46, -24, wg);
for (const s of [-1, 1]) box(10, 44, 44, M.deckel, s * 27, 20, -24, wg);          // Modulverbinder
label('Wartungseinheit −AZ2', wg, 0, 110, -30, 'klein');
const QY = 280;                                                                     // Ventilinsel auf Höhe des Wartungseinheit-Ausgangs (P-Schlauch gerade)
const qg = new THREE.Group(); qg.position.set(3060, QY, 1347.5); anlage.add(qg);
box(100, 30, 40, M.festoAlu, 0, -10, -20, qg);                                     // Anschlussplatte
const QP = {};
[['MB15_Kippen', -22, '−MB15', '5/2 Kippen'], ['MB16_Ausblasen', 22, '−MB16', '3/2 Düse']].forEach(([sig, dx, bmk, txt]) => {
  box(30, 46, 36, M.festoAlu, dx, 28, -20, qg);
  box(28, 26, 30, M.kunststoff, dx, 64, -18, qg);                                 // Magnetkopf
  box(14, 10, 12, M.schwarz, dx, 82, -18, qg);                                    // Handhilfsbetätigung
  const led = sensorLed(qg, dx + 8, 72, -33.6, sig, 4, 3, 1); led.emissive.setHex(0xffb000);
  VENTIL_LEDS.push({ signal: sig, mat: led });
  platte(tafel('spule4' + bmk, 22, 9, (c) => { c.fillStyle = '#f2f3f1'; c.fillRect(0, 0, 22, 9); c.fillStyle = '#111'; c.textAlign = 'center'; c.font = '700 4.6px Arial'; c.fillText(bmk, 11, 6.2); }, 10), 22, 9, qg, dx - 2, 58, -33.3, Math.PI);
  label(`${bmk} ${txt}`, qg, dx, 125 + (dx > 0 ? 18 : 0), -20, 'klein');
  QP[sig] = (sig === 'MB15_Kippen' ? [-7, 7] : [0]).map((ox) => {
    const p = new THREE.Group(); p.position.set(dx + ox, -25, -20); p.rotation.x = Math.PI; qg.add(p); steckverschraubung(p, 0, 0, 0, 3.4);
    return V(3060 + dx + ox, QY - 40, 1347.5 - 20);
  });
});
{ const p = new THREE.Group(); p.position.set(-50, -10, -20); p.rotation.z = Math.PI / 2; qg.add(p); steckverschraubung(p, 0, 0, 0, 4); }   // Anschluss 1 (P)
for (const dz of [-12, -28]) zyl(5, 18, M.messing, 40, -34, dz, null, qg, 12);     // Schalldämpfer 3/5
const MULTIPOL = steckerWinkel(qg, V(50, -10, -20), '+x', '-y').add(qg.position);   // Multipolanschluss M12 (8-polig) an der Endplatte, gewinkelt
label('Ventilinsel −QM4', qg, 0, 108, -20, 'klein');
leitung([V(2996, 270, 1323.5), V(3008, 270, 1327.5)], druck, 4, 10);             // Wartungseinheit → P
// −MM8: Drosselrückschlagventile (Abluftdrosselung) auf den Anschlüssen, Schlauch B am Zylinderrohr entlang
const zg = ST.zylBody, mm = ST.mm8, gx = 40;
const grla = (p) => {
  box(14, 16, 12, M.festoAlu, gx + p.x, p.y + 8, p.z, zg);
  const klick = new THREE.Mesh(new THREE.BoxGeometry(34, 36, 40), KLICK);      // anklickbar: öffnet die Drosseln von −MM8
  klick.position.set(gx + p.x, p.y + 8, p.z + 6); klick.userData = { art: 'drossel', taster: 'MM8' }; zg.add(klick);
  PULT_TASTER.push({ key: 'drosselMM8', kappe: klick, art: 'drossel' });
  zyl(3.5, 8, M.blau, gx + p.x, p.y + 20, p.z, null, zg, 10);                     // Drosselschraube
  zyl(4.5, 10, M.stahl, gx + p.x, p.y + 8, p.z + 11, 'z', zg, 10);                 // Steckanschluss seitlich
  return V(gx + p.x, p.y + 8, p.z + 16);
};
const TA = grla(mm.portA), TBp = grla(mm.portB);
const TB = V(70, TBp.y, TBp.z + 30);                                               // Abstand für den Bogen aus dem Steckanschluss
leitung([TBp, V(TBp.x, TBp.y, TB.z), TB], matB, 3, 14, zg);
for (const x of [140, 240]) box(8, 6, 26, M.kunststoff, x, TB.y - 4, TB.z - 8, zg);  // Schlauchclips
// Schlauchführung: Ventilinsel → am Querträger entlang nach hinten → hinterer Längsträger → Schlauchhalter vor C
const KL = [V(2640, 75, 1778), V(2640, 83, 1790)];                                 // Festpunkte (Schlauchhalter)
QP.MB15_Kippen.forEach((p, i) => {
  const zr = 1778 + i * 12;
  leitung([p, V(p.x, 75 + i * 8, p.z), V(p.x, 75 + i * 8, zr), V(2640, 75 + i * 8, zr), KL[i]], i ? matB : matA, 3, 20);
});
for (const x of [2700, 2850, 2960]) halter(x, 90, 1784, 'y');
for (const zz of [1450, 1600, 1720]) halter(3037, 90, zz, 'y');
// Schlauch Ø6 zur Ausblasdüse im Kabelkanal
{
  const p = QP.MB16_Ausblasen[0], d = A.duese;
  leitung([p, V(p.x, 205, p.z), V(p.x, 205, KI - 10), V(p.x, KY, KI - 10), V(d.x, KY, KI - 10), V(d.x, 205, KI - 10), V(d.x, 205, d.z - 80), V(d.x, d.y, d.z - 30), d], matD, 2.6, 16);
}

// --- Bewegte Leitungen (Schleppbögen) ---
const DYN = [];
function bewegt(mat, r, punkte) {
  const m = schlauch(punkte(), mat, r, anlage, 48); m.userData.dyn = true;
  DYN.push({ m, r, punkte });
}
const neu = () => { for (const d of DYN) rohrNeu(d.m, new THREE.CatmullRomCurve3(d.punkte(), false, 'centripetal'), 48, d.r); };
const zW = (v) => inAnlage(zg, v), kW = (v) => inAnlage(ST.kipper, v);
// Schläuche A/B: vom Schlauchhalter in einem Bogen auf die Oberseite des schwenkenden Zylinders
bewegt(matA, 3, () => { const t = zW(TA), t1 = zW(V(TA.x, TA.y, TA.z + 30)); return [KL[0], V(KL[0].x - 25, KL[0].y + 10, KL[0].z), V((KL[0].x + t.x) / 2 + 20, (KL[0].y + t.y) / 2 - 10, t.z + 38), t1, t]; });
bewegt(matB, 3, () => { const t = zW(TB), t1 = zW(V(TB.x - 30, TB.y, TB.z)); return [KL[1], V(KL[1].x - 25, KL[1].y + 10, KL[1].z), V((KL[1].x + t.x) / 2 + 10, (KL[1].y + t.y) / 2 - 20, t.z + 30), t1, t]; });
// Nutsensoren −BG30/−BG31: Austritt am Zylinderboden, Bogen zum Festpunkt am Lagerbock
const F3 = { BG30_MM8_unten: V(2500, 110, 1700), BG31_MM8_gekippt: V(2500, 116, 1694) };
for (const sig of ['BG30_MM8_unten', 'BG31_MM8_gekippt']) {
  const a = SENSOR_AUSTRITT[sig], f = F3[sig];
  bewegt(M.kabelGrau, 2.4, () => { const e = inAnlage(a.grp, a.p), w = inAnlage(a.grp, a.weiter); return [e, w, V((w.x + f.x) / 2 - 10, (w.y + f.y) / 2 - 15, (w.z + f.z) / 2), V(f.x, f.y + 20, f.z), f]; });
}
box(20, 14, 30, M.kunststoff, 2500, 103, 1697);                                    // Kabelschelle
// −BG33 (vorn) und Rollenantrieb (hinten): auf der Mulde zur Kippachse, Schleppschleife zum Lagerbock
leitung([V(23, -60, -45), V(47, -60, -45), V(47, -60, -104), V(-35, -60, -104), V(-35, -30, -118)], M.kabelGrau, 2.4, 10, ST.kipper);
leitung([V(-100, 17, 137), V(-100, 90, 137), V(-35, 90, 119), V(-35, -30, 119)], M.kabel, 3.5, 12, ST.kipper);
// −BG37 (vorn außen an der Wange): Stecker nach außen, am Haltewinkel entlang zur Kippachse
{ const a = steckerWinkel(ST.kipper, V(-120, -50, -120), '-z', '+x'); leitung([a, V(-70, a.y, a.z), V(-47, -50, -124)], M.kabelGrau, 2.4, 10, ST.kipper); }
const FB = V(2958, 330, 1402), FM = V(2962, 330, 1638), FB37 = V(2944, 330, 1402);
bewegt(M.kabelGrau, 2.4, () => { const q = kW(V(-35, -30, -118)), q1 = kW(V(-35, -14, -124)); return [q, q1, V((q.x + FB.x) / 2 - 25, Math.min(q.y, FB.y) - 25, FB.z), V(FB.x, FB.y + 25, FB.z), FB]; });
bewegt(M.kabel, 3.5, () => { const q = kW(V(-35, -30, 119)), q1 = kW(V(-35, -45, 119)); return [q, q1, V((q.x + FM.x) / 2 - 25, Math.min(q.y, FM.y) - 25, FM.z), V(FM.x, FM.y + 25, FM.z), FM]; });
bewegt(M.kabelGrau, 2.4, () => { const q = kW(V(-47, -50, -124)), q1 = kW(V(-30, -50, -124)); return [q, q1, V((q.x + FB37.x) / 2 - 25, Math.min(q.y, FB37.y) - 25, FB37.z), V(FB37.x, FB37.y + 25, FB37.z), FB37]; });
for (const f of [FB, FM, FB37]) box(14, 20, 10, M.kunststoff, f.x, f.y - 6, f.z);       // Zugentlastung am Lagerbock
KIPPER_NACHFUEHREN.push(neu);

// --- Feldverteiler −XD5 und Steuergerät der Vibrorinne an Säulen vor der Rinne ---
for (const x of [3300, 3450]) { profil(45, 45, 420, 'y', x, 210, KZ + 55); box(90, 6, 90, M.anthrazit, x, 3, KZ + 55); }
const XD5 = feldverteiler(3450, 330, KZ + 32.5, Math.PI, '−XD5 Feldverteiler Prüfstation', [
  ['BG30_MM8_unten'], ['BG31_MM8_gekippt'], ['BG33_Kipper_Korb'], ['BG32_Teil_Pruefplatz'], ['BG34_KLT_voll'], ['MB15_Kippen', 'MB16_Ausblasen'], ['BG37_Kipper_Einlauf'], null]);
for (let i = FELD_LEDS.length - 1; i >= 0; i--) if (/^MB1[56]_/.test(FELD_LEDS[i].signal)) VENTIL_LEDS.push(...FELD_LEDS.splice(i, 1));   // Ausgänge: LED folgt dem Ausgang
// zuXD: im Kanal bis unter die Port-Spalte, dort schräg auf die Steigposition der eigenen Lage (vorn = äußere Lage)
// und senkrecht aus dem Kanal; zumPort führt die Leitung dann in ihrer Lage vor dem Verteiler zum Port
const zuXD = (weg, port) => {
  const P = XD5.ports[port], x = P.p.x, zr = KI - (3 - P.zei) * 6, von = weg[weg.length - 1].x < x ? -1 : 1;
  zumPort([...weg, V(x + von * 50, KY, KI), V(x, KY, zr), V(x, 215, zr)], P);
};
const imKanal = (x) => [V(x, 75, KI), V(x, KY, KI)];
// −BG30/−BG31: am hinteren Längsträger und am Querträger entlang nach vorn in den Kanal
[['BG30_MM8_unten', 0], ['BG31_MM8_gekippt', 1]].forEach(([sig, port]) => {
  const f = F3[sig], x = 2966 + port * 5;
  zuXD([f, V(x, 75, f.z), ...imKanal(x)], port);
});
zuXD([FB, V(2958, 75, FB.z), ...imKanal(2958)], 2);                               // −BG33
zuXD([FB37, V(2944, 75, FB37.z), ...imKanal(2944)], 6);                           // −BG37
zuXD([A.bg32, V(A.bg32.x, 75, A.bg32.z), ...imKanal(A.bg32.x)], 3);
zuXD([A.bg34, V(A.bg34.x, 510, A.bg34.z), V(A.bg34.x, 510, z - 255), V(4690, 510, z - 255), V(4690, KY, z - 255), V(4590, KY, KI)], 4);
for (const y of [300, 200]) halter(4690, y, z - 255, 'z');
zuXD([MULTIPOL, V(MULTIPOL.x, KY + 50, MULTIPOL.z), V(MULTIPOL.x, KY + 50, KI), V(MULTIPOL.x, KY, KI)], 5);   // −QM4 Multipol
// Sammelleitung −XD5, Steuergerät −MA4, Motoren, Kamera → Kanal → Kabelbrücke → Schaltschrank
{ const s = XD5.sammel; zumSchrank([s, V(s.x, KY, s.z)], M.kabelGrau, 4); }
{
  const gx2 = 3300, gz = KZ + 55 - 22.5 - 35;
  box(110, 150, 70, M.rittal, gx2, 335, gz);
  platte(tafel('vibroSteuer', 70, 34, (c) => { c.fillStyle = '#2b2d30'; c.fillRect(0, 0, 70, 34); c.fillStyle = '#7fe08a'; c.font = '700 9px monospace'; c.fillText('078 %', 8, 16); c.fillStyle = '#e8eaec'; c.font = '500 4.5px Arial'; c.fillText(tr('Schwingförderer') + ' −MA4', 8, 28); }, 8), 70, 34, anlage, gx2, 360, gz - 35.2, Math.PI);
  for (const dx of [-25, 0, 25]) zyl(6, 10, M.kunststoff, gx2 + dx, 255, gz, null, anlage, 10);   // Kabelverschraubungen
  label('Steuergerät Vibrorinne −MA4', anlage, gx2, 440, gz, 'klein');
  stecker(anlage, A.ma4, '-z');
  kabel([V(A.ma4.x, 250, gz), V(A.ma4.x, 215, gz), V(A.ma4.x, 215, 1340), V(A.ma4.x, A.ma4.y, 1340), V(A.ma4.x, A.ma4.y, A.ma4.z - 32)], anlage, M.kabel, 3.5, 20, false);
  zumSchrank([V(gx2 + 25, 250, gz), V(gx2 + 25, KY, gz)], M.kabel, 4);
}
zumSchrank([FM, V(2962, 75, FM.z), ...imKanal(2962)], M.kabel, 3.5);                         // Muldenantrieb −MA7 (−QA12/−QA13, −FA8)
zumSchrank([A.ma5, V(A.ma5.x, A.ma5.y + 50, A.ma5.z), V(A.ma5.x, A.ma5.y + 50, KZ - 12), V(A.ma5.x, KY, KZ - 12)], M.kabel, 4.5);
zumSchrank([A.kf10, V(A.kf10.x, KY, A.kf10.z), V(A.kf10.x, KY, KI)], M.kabelGruen, 3.5);   // Keyence-Kabel an der Stativsäule nach unten zum Controller im Schrank
for (const y of [200, 320]) halter(A.kf10.x, y, A.kf10.z + 4, 'y');
// Vor-Ort-Steuerstelle −S40: aus dem Säulenfuß am Boden unter dem Prüfband (zwischen den Beinen) zum Kanal, dort hoch in den Kanal
{ const f = S40_FUSS, x = 3720; zumSchrank([f, V(x, 14, f.z), V(x, 14, KI), V(x, KY, KI)], M.kabelGrau, 3.5); for (const zz of [1500, 1800]) box(24, 6, 30, M.kunststoff, x, 4, zz); }
