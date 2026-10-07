import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { V, box, cached, mesh, zyl } from '../core/geometrie.js';
import { label, platte, tafel } from '../core/beschriftung.js';
import { sensorLed } from '../core/leds.js';
import { BRUECKE, lage } from './kabelbruecke.js';
import { SENSOR_AUSTRITT } from '../bauteile/nutsensor.js';
import { leitung, schlauch } from '../bauteile/leitungen.js';
import { anbauT, bodenstuetze, kabelrinne, reduzierstueck, wandausleger } from '../bauteile/kabelrinne.js';
import { stecker, steckerWinkel } from '../bauteile/stecker.js';
import { B2, BAND, BAND_Y, KURVE, LS_POS } from './baender.js';
import { B1_MOTOR, KANAL1, QM2 } from './band1.js';
import './rollenkurve.js';
import { B2_MOTOR, b2g } from './band2.js';
import { inB2, inWanneB2 } from './wanne-band2.js';
import { BG9_KOPF, BG10_KOPF, bad } from './zinnbad.js';
import { KETTE, haken, schlitten } from './portal.js';
import { HK1, SPUR, WANNE, dummy, inAnlage, wannenWeg } from './pneumatik.js';

// ----------------------------------------------------------------------------
// Sensorverdrahtung
// Jeder Endschalter hat seine eigene PUR-Leitung mit M12-Stecker auf seinem Port
// am passiven Feldverteiler (8 x M12, je Port zwei Status-LEDs für Pin 4 / Pin 2).
//   −XD1 (linke Portalsäule): BG1/BG2 (Y-Verteiler am Haken), BG3, BG4, BG5, BG6
//   −XD2 (rechte Portalsäule): BG7, BG8, BG9, BG10
//   −BG11 (Lichtschranke Band) direkt über die Kabelbrücke zum Schaltschrank (−X5)
// Leitungen zu bewegten Teilen laufen durch die Energiekette bzw. als Spiralkabel.
// ----------------------------------------------------------------------------
export const FELD_LEDS = [];
anlage.updateMatrixWorld(true);
// Kabel mit Kabelbindern auf geraden Abschnitten
// Sensorleitungen (PUR, M8/M12, graue Leitung bis Ø 6) sind hochflexibel: Biegeradius 2 × D statt BIEGEFAKTOR × D,
// sie liegen damit eng an Steckern, Profilen und in der Rinne an
export const SENSOR_FAKTOR = 2;
const istSensor = (mat, r) => mat === M.kabelGrau && r <= 3;
export function kabel(pts, parent = anlage, mat = M.kabelGrau, r = 2.4, R = 14, binder = true, faktor) {
  const P = pts.map(p => p.isVector3 ? p.clone() : V(...p));
  if (istSensor(mat, r)) { faktor = SENSOR_FAKTOR; R = SENSOR_FAKTOR * 2 * r; }
  leitung(P, mat, r, R, parent, faktor);
  if (!binder) return;
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1], b = P[i], L = a.distanceTo(b);
    if (L < 160) continue;
    const d = b.clone().sub(a).normalize();
    for (let s = 70; s < L - 50; s += 150) {
      const m = mesh(cached('binder' + r, () => new THREE.CylinderGeometry(r + 0.9, r + 0.9, 2.6, 10)), M.schwarz, parent);
      m.position.copy(a).addScaledVector(d, s);
      m.quaternion.setFromUnitVectors(V(0, 1, 0), d);
    }
  }
}
// Austrittspunkt eines Nutsensors im Koordinatensystem von ziel (anlage, schlitten oder haken)
export function austritt(signal, ziel = anlage) {
  const a = SENSOR_AUSTRITT[signal];
  const w = (v) => ziel.worldToLocal(a.grp.localToWorld(v.clone()));
  return [w(a.p), w(a.weiter)];
}
// Feldverteiler: Rückseite bei lokal z = 0 auf dem Profil, Ports zeigen nach +z
export function feldverteiler(x, y, z, ry, name, belegung) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; anlage.add(g);
  box(54, 170, 26, M.ifm, 0, 0, 13, g);                                            // ifm Zentralverteiler, Gehäuse PA orange
  box(48, 150, 4, M.ifm, 0, -6, 28, g);                                             // Frontplatte mit Buchsen
  box(3, 140, 1, M.kunststoff, 0, -8, 30.2, g);                                     // Trennsteg/Beschriftungsnut
  platte(tafel('ifmLogo', 30, 10, (c) => { c.fillStyle = '#ec6a12'; c.fillRect(0, 0, 30, 10); c.fillStyle = '#fff'; c.font = '700 7px Arial'; c.textAlign = 'center'; c.fillText('ifm', 15, 7.8); }, 6), 24, 8, g, 0, 73, 26.3);
  for (const yy of [-81, 81]) zyl(4.2, 2, M.stahl, 0, yy, 30.5, 'z', g, 12);       // Befestigungsschrauben auf der Frontplatte
  const ports = [];
  belegung.forEach((b, i) => {
    const sp = i < 4 ? 0 : 1, zei = i % 4;
    const xx = sp ? 13 : -13, yy = 54 - zei * 34, lx = xx + (sp ? 11 : -11);
    zyl(9.5, 2, M.ifm, xx, yy, 31, 'z', g, 20);                                    // Buchsensockel
    zyl(7.5, 5, M.stahl, xx, yy, 33.5, 'z', g, 18);                                // M12-Buchse (Gewinde vernickelt), beginnt im Sockel
    const l4 = sensorLed(g, lx, yy + 5, 30.4, '', 3, 2.4, 0.8);
    const l2 = sensorLed(g, lx, yy - 1, 30.4, '', 3, 2.4, 0.8);
    platte(tafel('port' + i, 9, 5, (c) => { c.fillStyle = '#e8eaeb'; c.fillRect(0, 0, 9, 5); c.fillStyle = '#222'; c.font = '700 3.6px Arial'; c.textAlign = 'center'; c.fillText(`X${i}`, 4.5, 3.8); }), 9, 5, g, lx, yy - 9, 30.2);
    if (b) {
      stecker(g, V(xx, yy, 35), '+z', true);
      FELD_LEDS.push({ signal: b[0], mat: l4 });
      if (b[1]) FELD_LEDS.push({ signal: b[1], mat: l2 });
      ports.push({ p: anlage.worldToLocal(g.localToWorld(V(xx, yy, STECKER_ENDE))), g, xx, yy, zei });
    } else {
      zyl(8.2, 10, M.kunststoff, xx, yy, 40, 'z', g, 18);                          // Schutzkappe
      ports.push(null);
    }
  });
  zyl(12, 12, M.stahl, 0, -91, 15, null, g, 20);                                   // M23-Sammelanschluss
  zyl(10, 26, M.kunststoff, 0, -110, 15, null, g, 16);
  label(name, g, 0, 112, 20, 'klein');
  g.updateMatrixWorld(true);
  return { g, ports, sammel: anlage.worldToLocal(g.localToWorld(V(0, -123, 15))) };
}
// Letztes Stück zum Port: Die Leitungen eines Verteilers laufen als Bündel senkrecht vor der Frontplatte,
// jede in ihrer Port-Spalte und in eigener Lage (Abstand zur Front), und biegen mit Mindestradius waagrecht
// in ihren Stecker. Die Leitung, die zuerst abbiegt, liegt innen – so kreuzt keine eine andere oder einen Stecker.
const STECKER_ENDE = 72;                                  // Kabelaustritt des M12-Steckers (lokal z)
export function zumPort(weg, port, parent = anlage, r = 2.4) {
  const { g, xx, yy, zei } = port;
  const lokal = (v) => g.worldToLocal(parent.localToWorld(v.clone()));
  const zurueck = (x, y, z) => parent.worldToLocal(g.localToWorld(V(x, y, z)));
  const pts = weg.map(v => v.clone()), W = lokal(pts[pts.length - 1]), vor = lokal(pts[pts.length - 2]);
  const vonOben = W.y > yy, lage = vonOben ? zei : 3 - zei;
  const zL = STECKER_ENDE + SENSOR_FAKTOR * 2 * r + 10 + lage * (2 * r + 1.5);
  // kommt die Leitung ohnehin auf den Verteiler zu, endet ihr letztes Stück gleich in ihrer Lage (kein Zusatzknick)
  const d = W.clone().sub(vor);
  if (Math.abs(d.z) > 0.9 * d.length() || Math.abs(W.z - zL) < 10) pts[pts.length - 1] = zurueck(W.x, W.y, zL);
  else pts.push(zurueck(W.x, W.y, zL));
  kabel([...pts, zurueck(xx, W.y, zL), zurueck(xx, yy, zL), port.p], parent);
}

const XD1 = feldverteiler(-655, 1000, -260, Math.PI / 2, '−XD1 Feldverteiler Portal', [
  ['BG1_MM1_eingehaengt', 'BG2_MM1_geloest'], ['BG3_MM2_oben'], ['BG4_MM2_unten'], ['BG5_MM3_Band'],
  ['BG6_MM3_Bad'], null, null, null]);
// −XD2 an der badseitigen Seitenfläche der rechten Säule (Ports nach −x): Verteiler, Stecker und die Leitungsgassen
// davor liegen hinter z −230 und damit ganz außerhalb des Fahrwegs der Abdeckung (Deckel bis z −181)
const XD2 = feldverteiler(715, 560, -260, -Math.PI / 2, '−XD2 Feldverteiler Bad', [
  ['BG7_MM4_offen'], ['BG8_MM4_zu'], ['BG9_Temperatur'], ['BG10_Fuellhoehe'], null, null, null, null]);

// Sammelleitungen (M23, 12-adrig) in die Kabelkanäle an den Säulen → Gitterrinne → Schaltschrank
{
  const s = XD1.sammel;
  kabel([s, V(s.x, 820, s.z), V(s.x, 820, -340), V(-775, 820, -340), V(-775, 820, -260), V(-775, 1000, -260)], anlage, M.kabelGrau, 4);
  const t = XD2.sammel;
  // hinter der Säule herum und von unten in den Kabelkanal auf ihrer anderen Seite
  kabel([t, V(t.x, 380, t.z), V(t.x, 380, -325), V(835, 380, -325), V(835, 380, -260), V(835, 640, -260)], anlage, M.kabelGrau, 4);
}

// −MM3 (Traverse): Austritt am Zylinderboden nach hinten über das Zylinderende hinaus, in Sensorhöhe nach vorn
// vor die Traverse, an der Säule hinunter zu −XD1
[['BG5_MM3_Band', 3, -706, -190], ['BG6_MM3_Bad', 4, -700, -184]].forEach(([sig, port, x, z]) => {
  const [e] = austritt(sig);
  zumPort([e, V(x, e.y, e.z), V(x, e.y, z), V(x, 1120, z), V(-560 + (port - 3) * 8, 1120, z)], XD1.ports[port]);
});

// −MM2 (am Schlitten): Austritt oben am Zylinderboden, nach hinten zur Energiekette
const KETTE_KABEL = [];            // Leitungen in der Kette: Querversatz dz
// Austritt oben am Zylinderdeckel, von unten in die Querwanne, in der Wanne zur Kette
[['BG3_MM2_oben', SPUR.BG3], ['BG4_MM2_unten', SPUR.BG4]].forEach(([sig, sp], k) => {
  const [e, w] = austritt(sig, schlitten);
  const yc = WANNE.y + 2 + 2.4;
  const hin = sp === SPUR.BG4
    ? [V(w.x, 1516, w.z), V(w.x, 1516, sp.z), V(w.x, yc, sp.z)]                 // vor den Stangen: unter der Wanne nach hinten
    : [V(w.x, yc, w.z), V(w.x, yc, sp.z)];
  const weg = wannenWeg({ ...sp, ab: w.x }, 2.4, 1389).reverse();
  kabel([e, w, ...hin, ...weg.slice(1)], schlitten, M.kabelGrau, 2.4, 5, false);
  KETTE_KABEL.push({ dz: sp.dz, port: XD1.ports[1 + k] });
});
// −MM1 (am Haken): beide Sensoren auf einen M12-Y-Verteiler unter der Adapterplatte, von dort ein Spiralkabel nach oben
const Y_VERT = V(238, 560, -30);                        // im Haken
box(18, 30, 24, M.ifm, Y_VERT.x, Y_VERT.y, Y_VERT.z, haken);                     // ifm Y-Verteiler EBC114
label('Y-Verteiler BG1/BG2', haken, Y_VERT.x, Y_VERT.y - 70, Y_VERT.z, 'klein');
[['BG1_MM1_eingehaengt', -6], ['BG2_MM1_geloest', 6]].forEach(([sig, dz]) => {
  const [e, w] = austritt(sig, haken);
  const zp = Y_VERT.z + dz;
  stecker(haken, V(Y_VERT.x, Y_VERT.y - 15, zp), '-y');
  kabel([e, V(w.x + 12, e.y, e.z), V(w.x + 12, 470, e.z), V(Y_VERT.x, 470, zp), V(Y_VERT.x, Y_VERT.y - 15 - 32, zp)], haken, M.kabelGrau, 1.6, 8, false);
});
stecker(haken, V(Y_VERT.x + 9, Y_VERT.y, Y_VERT.z), '+x');
// Sensorleitung −BG1/−BG2: vom Y-Verteiler am Mitnehmerschwert hoch in die Hub-Energiekette,
// am Schlitten mit den −MM1-Schläuchen an der Plattenkante hoch und in die waagrechte Kette zu −XD1
kabel([...wannenWeg(SPUR.BG1, 2.4, 1389), V(SPUR.BG1.ab, 1062, SPUR.BG1.z), V(SPUR.BG1.ab, 1062, HK1.zF + 10), V(HK1.x + 19, 1062, HK1.zF + 10)], schlitten, M.kabelGrau, 2.4, 10, false);
KETTE_KABEL.push({ dz: -16, port: XD1.ports[0] });
kabel([V(HK1.x + 19, HK1.yC0 - 4, HK1.zM + 8), V(140, HK1.yC0 - 4, HK1.zM + 8), V(140, 640, HK1.zM + 8), V(Y_VERT.x + 9 + 32, 640, Y_VERT.z), V(Y_VERT.x + 9 + 32, Y_VERT.y, Y_VERT.z)], haken, M.kabelGrau, 2.2, 16, false);

// Festseite der Energiekette: in der Kettenwanne bis hinter die Säule, durch eine Kabeltülle im Wannenboden
// senkrecht hinter der Säule hinunter und vor die Säule zu −XD1
box(30, 6, 26, M.kunststoff, -634, 1303, KETTE.z);                                  // Kabeltülle im Wannenboden
KETTE_KABEL.forEach(({ dz, port }, k) => {
  const z = KETTE.z + dz, x = -640 + k * 6;
  zumPort([V(KETTE.xa - 10, 1313, z), V(x, 1313, z), V(x, 1130 - k * 6, z), V(-548 - k * 6, 1130 - k * 6, z)], port);
});

// −MM4 (Gestell rechts): am Zylinderboden heraus, hinter dem Gestell und vor der Säule unter der Abdeckung durch zu −XD2
[['BG7_MM4_offen', 0, 318], ['BG8_MM4_zu', 1, 324]].forEach(([sig, port, y]) => {
  const [e, w] = austritt(sig);
  const x = 1400 + port * 6;
  zumPort([e, w, V(x, w.y, w.z), V(x, y, w.z), V(x, y, -200), V(660, y, -200)], XD2.ports[port]);
});
// −BG9 Thermoelement und −BG10 Niveauelektrode: M12-Stecker unten an den Köpfen hinter dem Bad, tief an der
// Rückwand entlang (außerhalb des Fahrwegs der Abdeckung) und von unten in ihre Gassen vor −XD2
{
  const k9 = BG9_KOPF, k10 = BG10_KOPF;
  stecker(bad, V(k9.x, k9.y - 28, k9.z), '-y');
  zumPort([V(k9.x, k9.y - 60, k9.z), V(k9.x, 210, k9.z), V(580, 210, k9.z)], XD2.ports[2]);
  stecker(bad, V(k10.x, k10.y - 15, k10.z), '-y');
  zumPort([V(k10.x, k10.y - 47, k10.z), V(k10.x, 230, k10.z), V(580, 230, k10.z)], XD2.ports[3]);
}
// Lichtschranken −BG11…−BG13: Stecker hinten am Sensor, senkrecht in den Kabelkanal am Bandgestell
{
  for (const sig of ['BG12_Bandanfang', 'BG11_Korb', 'BG13_Bandende']) {
    const p = BAND.stecker[sig];
    const a = steckerWinkel(anlage, p, '-x', '-y');                               // gewinkelt: Abgang direkt nach unten
    kabel([a, V(a.x, 285, p.z), V(-160, 285, p.z), V(-160, KANAL1.oben - 4, p.z)], anlage, M.kabelGrau, 2.2, 10, false);
  }
  // Inkrementalgeber −BG18: Leitung nach oben, unter dem Band hindurch in den Kanal (direkt auf −X5, nicht über Feldverteiler)
  { const g = BAND.geberStecker, a = steckerWinkel(anlage, g, '+y', '+x'); kabel([a, V(-148, a.y, g.z), V(-148, KANAL1.oben - 4, g.z)], anlage, M.kabelGrau, 2.8, 14); }
  // Band 2: Lichtschranken −BG21…−BG24 und Pyrometer −BT2 → Kabelwanne hinter Band 2 (wanne-band2.js) → Kabelbrücke
  {
    for (const [sig, spur, lage2] of [['BG21_B2_Anfang', 5, 1], ['BG22_B2_Kuehlung', 3, 1], ['BG24_B2_Ende', 0, 0]]) {
      const a = inB2(steckerWinkel(anlage, BAND.stecker[sig], '-z', '+y'));
      const weg = [a, V(a.x, 385, a.z)];
      if (sig === 'BG22_B2_Kuehlung') {                                       // im Kühltunnel: versetzt, durch eine Kabelverschraubung in der Rückwand
        weg.push(V(a.x, 385, a.z + 40));
        box(14, 12, 12, M.kunststoff, 152, 385, a.z + 40, b2g);
      }
      inWanneB2(spur, lage2, weg);
    }
    const b = inB2(BAND.bt2Stecker);                                          // Pyrometer: hinter dem Pumpenkabel vorbei über den Tank
    inWanneB2(4, 0, [b, V(250, b.y, b.z), V(250, b.y, b.z + 10.5), V(250, 420, b.z + 10.5)]);
    const m = B2_MOTOR.abgang, mb = m[m.length - 1];
    { const d = lage(); kabel([...m, V(mb.x, 14, BRUECKE.z + d), V(BRUECKE.x + d, 14, BRUECKE.z + d), V(BRUECKE.x + d, 14, -60)], anlage, M.kabel, 4.5, 30, false); }
    const g2 = BAND.geber2Stecker;
    const a2 = steckerWinkel(anlage, g2, '+y', '+x');
    { const d = lage(); kabel([a2, V(g2.x + 70, a2.y, g2.z), V(g2.x + 70, 14, g2.z), V(g2.x + 70, 14, BRUECKE.z + d), V(BRUECKE.x + d, 14, BRUECKE.z + d), V(BRUECKE.x + d, 14, -60)], anlage, M.kabelGrau, 2.8, 14); }
  }
  // Rollenkurve −MA6: Lichtschranken −BG35/−BG36 (Stecker hinten am Sensor, radial nach außen) und Motorleitung
  //   am Boden zur Kabelbrücke und direkt auf −X5 bzw. −X1
  ['BG35_Kurve_Anfang', 'BG36_Kurve_Ende'].forEach((sig, i) => {
    const p = BAND.stecker[sig], t = LS_POS[sig] / KURVE.R;
    const d = V(-Math.cos(t), 0, Math.sin(t));
    stecker(anlage, p, '+y', false).quaternion.setFromUnitVectors(V(0, 1, 0), d);
    const e = p.clone().addScaledVector(d, 31), f = e.clone().addScaledVector(d, 25);
    const lg = lage();
    // neben der Brücke auf den Boden (nicht auf ihre Schräge) und seitlich darunter in die Lage
    const zf = Math.max(f.z, BRUECKE.z + 125);
    kabel([e, ...(zf > f.z ? [] : [f]), V(f.x, f.y, zf), V(f.x, 2.2, zf), V(f.x, 14, BRUECKE.z + lg), V(BRUECKE.x + lg, 14, BRUECKE.z + lg), V(BRUECKE.x + lg, 14, -60)], anlage, M.kabelGrau, 2.2, 14, false);
  });
  { const m = KURVE.motor.abgang, mb = m[m.length - 1], d = lage(); kabel([...m, V(mb.x, 14, BRUECKE.z + d), V(BRUECKE.x + d, 14, BRUECKE.z + d), V(BRUECKE.x + d, 14, -60)], anlage, M.kabel, 4.5, 30, false); }
  // Eintritt in die Kabelbrücke: auf dem Boden von −z her seitlich unter die Schräge (Kante bei BRUECKE.z − 110),
  // unter der Abdeckung auf die eigene Lage d und darin zum Schaltschrank
  const unterBruecke = (x, r, weg) => { const d = lage(); return [...weg, V(x, r, BRUECKE.z - 75), V(x, 14, BRUECKE.z + d), V(BRUECKE.x + d, 14, BRUECKE.z + d), V(BRUECKE.x + d, 14, -60)]; };
  // Kabelrinne zwischen Band 1 und Zinnbad (gelocht, verzinkt) unten am Bandgestell entlang, von der Umhausungsrückwand
  // bis vor die Kabelbrücke: neben dem Bad 100 × 60, davor (kein Bad mehr) über ein Reduzierstück 150 × 60.
  // Querrinne 60 × 60 unter dem Band zur Portalsäule (Druckluft). −QM2 und −XD3 sitzen vorn, frei zugänglich.
  // Lagen (x, Bandseite → Bad) neben dem Bad: Sensorleitungen −BG17, −BG16, −BG15, −BG14, −BG40 (155…179, je senkrecht
  // unter ihrem Abgang), Druckluft (190), Schläuche −MB9 (200/206), −MB10 (212/218), Trennsteg, −MA1.
  // Hinter −QM2 laufen die Sensorleitungen auf dem Rinnenboden nach außen in die Lagen unter ihren Ports an −XD3
  // (215…239) und steigen dort senkrecht zum Stecker; innen bleiben Multipol −QM2 und Sammelleitung −XD3.
  // Keine Leitung kreuzt eine andere in der Rinne.
  const RI = { x: 193, y: 55, z0: -575, zr: 190, zw: 240, z1: 860, steg: 230, stegW: 278 };   // zr…zw: Reduzierstück
  const QR = { x0: -640, z: -280 };                                                   // Querrinne bis zur Portalsäule
  kabelrinne(V(RI.x, RI.y, RI.z0), -Math.PI / 2, { L: RI.zr - RI.z0, enden: [0], trennsteg: RI.x - RI.steg,
    abgang: [{ seite: 1, von: QR.z - 30 - RI.z0, bis: QR.z + 30 - RI.z0 }] });          // lokal z = +50 ist die Bandseite (x 143)
  reduzierstueck({ y: RI.y, xi: RI.x - 50, xa0: RI.x + 50, xa1: RI.x + 100, z0: RI.zr, z1: RI.zw, steg0: RI.steg, steg1: RI.stegW });
  kabelrinne(V(RI.x + 25, RI.y, RI.zw), -Math.PI / 2, { L: RI.z1 - RI.zw, B: 150, trennsteg: RI.x + 25 - RI.stegW });
  const qr = kabelrinne(V(QR.x0, RI.y, QR.z), 0, { L: RI.x - 50 - QR.x0, B: 60, enden: [0] });
  anbauT(qr, RI.x - 50 - QR.x0);
  wandausleger(132.5, RI.y, 0, 1, 110, [RI.x - 50, RI.x + 50]);                       // an den Bandstützen
  wandausleger(132.5, RI.y, 700, 1, 160, [RI.x - 50, RI.x + 100]);
  bodenstuetze(RI.x, -480, RI.y, 'x', 112, [RI.x - 50, RI.x + 50]);                    // vor der Umhausungsrückwand: keine Bandstütze
  for (const x of [-560, -60]) bodenstuetze(x, QR.z, RI.y, 'z', 76, [QR.z - 30, QR.z + 30]);
  const auf = (r) => RI.y + r;                                                         // Leitung liegt auf dem Rinnenboden
  // aus dem offenen Rinnenende auf den Boden und seitlich unter der Schräge in die Kabelbrücke (Lage d), darin zum Schaltschrank
  const zurBruecke = (x, r) => unterBruecke(x, r, [V(x, auf(r), RI.z1 - 60), V(x, auf(r), RI.z1 + 10), V(x, r, RI.z1 + 70)]);

  // Feldverteiler −XD3 ganz vorn am Bandgestell (+x): Endlagen −BG14…−BG17 der Schwenkantriebe, Korbabfrage −BG40
  const XD3 = feldverteiler(132.5, 250, 470, Math.PI / 2, '−XD3 Feldverteiler Band', [['BG14_MM5_zu'], ['BG15_MM5_offen'], ['BG16_MM6_zu'], ['BG17_MM6_offen'], ['BG40_Korb_am_Anschlag'], null, null, null]);
  // Sensorleitungen (Biegeradius 2 × D, siehe kabel): senkrecht unter dem Abgang in ihre Lage, auf dem
  // Rinnenboden nach vorn, hinter −QM2 nach außen in die Lage unter ihrem Port und dort senkrecht hinauf, mit engem Bogen
  // in den Stecker. Unterer Port = innere Lage, so laufen die Leitungen einer Portreihe ineinander (−BG40 sitzt in der
  // zweiten Reihe weiter hinten und liegt ganz außen).
  const SENS = { BG17_MM6_offen: [155, 215, 3], BG16_MM6_zu: [161, 221, 2], BG15_MM5_offen: [167, 227, 1], BG14_MM5_zu: [173, 233, 0], BG40_Korb_am_Anschlag: [179, 239, 4] };
  for (const [sig, [xr, xp, port]] of Object.entries(SENS)) {
    const p = XD3.ports[port].p, ab = sig === 'BG40_Korb_am_Anschlag';
    const e = ab ? BAND.abfrageAus : BAND.sensorAus[sig];
    const anfang = ab ? [e, V(e.x, e.y - 26, e.z), V(xr, e.y - 56, e.z)] : [e];      // −BG40: von der Drehachse hinter der Konsole in die Lage
    kabel([...anfang, V(xr, auf(2.4), e.z), V(xr, auf(2.4), 330), V(xp, auf(2.4), 440), V(xp, auf(2.4), p.z), V(xp, p.y, p.z), p], anlage, M.kabelGrau, 2.4);
  }
  // Sammelleitung −XD3 (M23) senkrecht in die Rinne; Multipolleitung −QM2 ebenso, vor −XD3 nach außen versetzt
  const t = XD3.sammel;
  kabel([t, V(t.x, auf(4), t.z), ...zurBruecke(t.x, 4)], anlage, M.kabelGrau, 4);
  kabel([V(147, 189, QM2.z), V(147, auf(3.5), QM2.z), V(147, auf(3.5), 380), V(165, auf(3.5), 440), ...zurBruecke(165, 3.5)], anlage, M.kabel, 3.5);
  // Ventilinsel −QM2: je Ventil 2/4 auf die beiden Kammern des Schwenkantriebs (QS-6 nach −z). Die Schläuche gehen vor
  // der Ventilinsel im Bogen hinunter in die Rinne, darin nach hinten und zwischen bzw. hinter den Antrieben hinauf,
  // dann von hinten in die Drosselrückschlagventile. −MB10 (weiter hinten) liegt außen.
  const druck = new THREE.MeshStandardMaterial({ color: 0x2f7fd0, roughness: 0.42 });
  for (const [sig, lagen, zh] of [['MB9_Anschlag_auf', [200, 206], -75], ['MB10_Vereinzeler_zu', [212, 218], -235]]) {
    QM2[sig].forEach((P, i) => {
      const Z = BAND.stopperAnschluss[sig][i], xv = 211 + i * 6, xr = lagen[i];
      leitung([P, V(xv, P.y, P.z), V(xv, 150, P.z), V(xr, auf(2.4), P.z - 40), V(xr, auf(2.4), zh), V(xr, 310, zh), V(Z.x, 370, zh), Z], druck, 2.4, 12);
    });
  }
  // Druckluftversorgung −QM2 (PUN-8) von der Wartungseinheit am Portal: an der Säule hinunter, durch die Querrinne
  // unter dem Band hindurch, in der Rinne nach vorn und vor der Ventilinsel von unten an den Versorgungsanschluss
  const xs = 190;
  leitung([V(-625, 580, -170), V(-625, 160, -170), V(-625, 160, QR.z + 15), V(-625, auf(4), QR.z + 15), V(xs, auf(4), QR.z + 15), V(xs, auf(4), QM2.z - 70), V(xs, 120, QM2.z - 55)], druck, 4, 40);
  schlauch([V(xs, 120, QM2.z - 55), V(xs, 145, QM2.z - 45), V(187, 175, QM2.z - 18), V(186, 186, QM2.z - 3), V(186, 192, QM2.z)], druck, 4);
  // Sammelleitungen am Kanalende (Lichtschranken −BG11…−BG13, Geber −BG18): senkrecht hinunter, am Boden in die Kabelbrücke
  // (Abgang unten aus dem Kanal vor der Brücke, nicht durch ihre Deckfläche)
  [M.kabelGrau, M.kabelGrau, M.kabelGrau, M.kabelGrau].forEach((mat, i) => {
    const dx = -168 + i * 6;
    kabel(unterBruecke(dx, 2.4, [V(dx, KANAL1.unten + 5, 925), V(dx, 2.4, 925)]), anlage, mat, 2.4, 20, false);
  });
  // Bandmotor −MA1: aus dem Klemmenkasten über der Lüfterhaube zur Rinne, hinter dem Trennsteg zur Kabelbrücke
  { const k = B1_MOTOR.abgang; kabel([k[0], k[1], V(237, k[1].y, -500), V(237, auf(4.5), -500), V(237, auf(4.5), RI.zr), V(287, auf(4.5), RI.zw), ...zurBruecke(287, 4.5)], anlage, M.kabel, 4.5, 30, false); }
}
// Energiekette (Kunststoff, Biegeradius R) zwischen Festpunkt xa und Mitnehmer am Schlitten
const KETTEN_L = 2 * 540 - KETTE.xa - 490 + Math.PI * KETTE.R;
const kettenAnzahl = Math.floor(KETTEN_L / KETTE.glied);
const kettenGlieder = new THREE.InstancedMesh(new THREE.BoxGeometry(KETTE.glied - 2, 18, 34), M.kette, kettenAnzahl);
kettenGlieder.castShadow = true;
anlage.add(kettenGlieder);
export function ketteAktualisieren() {
  const xa = KETTE.xa, xc = schlitten.position.x + 60, R = KETTE.R;
  const xb = (KETTEN_L - Math.PI * R + xa + xc) / 2;
  const s1 = xb - xa, s2 = Math.PI * R;
  for (let i = 0; i < kettenAnzahl; i++) {
    const s = (i + 0.5) * KETTE.glied;
    if (s < s1) { dummy.position.set(xa + s, KETTE.y, KETTE.z); dummy.rotation.set(0, 0, 0); }
    else if (s < s1 + s2) {
      const phi = (s - s1) / R;
      dummy.position.set(xb + R * Math.sin(phi), KETTE.y + R - R * Math.cos(phi), KETTE.z);
      dummy.rotation.set(0, 0, phi);
    } else { dummy.position.set(xb - (s - s1 - s2), KETTE.y + 2 * R, KETTE.z); dummy.rotation.set(0, 0, Math.PI); }
    dummy.updateMatrix();
    dummy.scale.set(1, 1, i % 2 ? 1 : 0.94); dummy.updateMatrix(); dummy.scale.set(1, 1, 1);   // Innen-/Außenlaschen
    kettenGlieder.setMatrixAt(i, dummy.matrix);
  }
  kettenGlieder.instanceMatrix.needsUpdate = true;
  kettenGlieder.computeBoundingSphere();                                  // sonst bleibt die Hüllkugel der Startlage und die Kette wird beim Verfahren weggeschnitten
}

