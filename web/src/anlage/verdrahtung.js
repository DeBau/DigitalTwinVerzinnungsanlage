import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { V, box, cached, mesh, zyl } from '../core/geometrie.js';
import { label, platte, tafel } from '../core/beschriftung.js';
import { sensorLed } from '../core/leds.js';
import { BRUECKE, lage } from './kabelbruecke.js';
import { SENSOR_AUSTRITT } from '../bauteile/nutsensor.js';
import { leitung, schlauch } from '../bauteile/leitungen.js';
import { stecker } from '../bauteile/stecker.js';
import { B2, BAND, BAND_Y, KURVE, LS_POS } from './baender.js';
import { B1_MOTOR, QM2 } from './band1.js';
import './rollenkurve.js';
import { B2_MOTOR } from './band2.js';
import { BAD_X, RAND_Y, bad } from './zinnbad.js';
import { KETTE, haken, schlitten } from './portal.js';
import { HK1, dummy, inAnlage } from './pneumatik.js';

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
export function kabel(pts, parent = anlage, mat = M.kabelGrau, r = 2.4, R = 14, binder = true) {
  const P = pts.map(p => p.isVector3 ? p.clone() : V(...p));
  leitung(P, mat, r, R, parent);
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
  platte(tafel('ifmLogo', 30, 10, (c) => { c.fillStyle = '#ec6a12'; c.fillRect(0, 0, 30, 10); c.fillStyle = '#fff'; c.font = '700 7px Arial'; c.textAlign = 'center'; c.fillText('ifm', 15, 7.8); }, 6), 24, 8, g, 0, 73, 26.1);
  for (const yy of [-81, 81]) zyl(4.2, 2, M.stahl, 0, yy, 27, 'z', g, 12);         // Befestigung mit Nutenstein
  const ports = [];
  belegung.forEach((b, i) => {
    const sp = i < 4 ? 0 : 1, zei = i % 4;
    const xx = sp ? 13 : -13, yy = 54 - zei * 34, lx = xx + (sp ? 11 : -11);
    zyl(9.5, 2, M.ifm, xx, yy, 31, 'z', g, 20);                                    // Buchsensockel
    zyl(7.5, 5, M.stahl, xx, yy, 32.5, 'z', g, 18);                                // M12-Buchse (Gewinde vernickelt)
    const l4 = sensorLed(g, lx, yy + 5, 30.4, '', 3, 2.4, 0.8);
    const l2 = sensorLed(g, lx, yy - 1, 30.4, '', 3, 2.4, 0.8);
    platte(tafel('port' + i, 9, 5, (c) => { c.fillStyle = '#e8eaeb'; c.fillRect(0, 0, 9, 5); c.fillStyle = '#222'; c.font = '700 3.6px Arial'; c.textAlign = 'center'; c.fillText(`X${i}`, 4.5, 3.8); }), 9, 5, g, lx, yy - 9, 30.2);
    if (b) {
      stecker(g, V(xx, yy, 35), '+z', true);
      FELD_LEDS.push({ signal: b[0], mat: l4 });
      if (b[1]) FELD_LEDS.push({ signal: b[1], mat: l2 });
      const pL = g.localToWorld(V(xx, yy, 72)), aL = g.localToWorld(V(xx, yy, 72 + 14 + zei * 9));
      ports.push({ p: anlage.worldToLocal(pL), a: anlage.worldToLocal(aL), zei });
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
// Letztes Stück zum Port: vor die Steckerebene, seitlich auf Höhe des Ports, gerade in den Stecker
export function zumPort(weg, port, parent = anlage) {
  const pts = weg.map(v => v.clone());
  const n = port.a.clone().sub(port.p).normalize();
  const ax = Math.abs(n.x) > 0.5 ? 'x' : 'z', other = ax === 'x' ? 'z' : 'x';
  const add = (v) => { if (v.distanceTo(pts[pts.length - 1]) > 1) pts.push(v.clone()); };
  const c = pts[pts.length - 1].clone();
  c[ax] = port.a[ax]; add(c);
  c[other] = port.a[other]; add(c);
  c.y = port.a.y; add(c);
  add(port.p);
  kabel(pts, parent);
}

const XD1 = feldverteiler(-655, 1000, -260, Math.PI / 2, '−XD1 Feldverteiler Portal', [
  ['BG1_MM1_eingehaengt', 'BG2_MM1_geloest'], ['BG3_MM2_oben'], ['BG4_MM2_unten'], ['BG5_MM3_Band'],
  ['BG6_MM3_Bad'], null, null, null]);
const XD2 = feldverteiler(760, 560, -215, 0, '−XD2 Feldverteiler Bad', [
  ['BG7_MM4_offen'], ['BG8_MM4_zu'], ['BG9_Temperatur'], ['BG10_Fuellhoehe'], null, null, null, null]);

// Sammelleitungen (M23, 12-adrig) in die Kabelkanäle an den Säulen → Gitterrinne → Schaltschrank
{
  const s = XD1.sammel;
  kabel([s, V(s.x, 840, s.z), V(s.x, 840, -320), V(-775, 840, -320), V(-775, 840, -260), V(-775, 1000, -260)], anlage, M.kabelGrau, 4);
  const t = XD2.sammel;
  kabel([t, V(t.x, 400, t.z), V(835, 400, t.z), V(835, 400, -260), V(835, 470, -260)], anlage, M.kabelGrau, 4);
}

// −MM3 (Traverse): Austritt am Zylinderboden, über die Traverse nach vorn, an der Säule hinunter zu −XD1
[['BG5_MM3_Band', 3, -690, -209], ['BG6_MM3_Bad', 4, -684, -203]].forEach(([sig, port, x, z]) => {
  const [e, w] = austritt(sig);
  zumPort([e, w, V(x, w.y, w.z), V(x, 1301, w.z), V(x, 1301, z), V(x, 1120, z), V(-560 + (port - 3) * 8, 1120, z)], XD1.ports[port]);
});

// −MM2 (am Schlitten): Austritt oben am Zylinderboden, nach hinten zur Energiekette
const KETTE_KABEL = [];            // Leitungen in der Kette: Querversatz dz
[['BG3_MM2_oben', -8], ['BG4_MM2_unten', -2]].forEach(([sig, dz], k) => {
  const [e, w] = austritt(sig, schlitten);
  const yo = 1528 + k * 7;
  kabel([e, w, V(w.x, yo, w.z), V(w.x, yo, -300 + dz), V(30, yo, -300 + dz), V(30, yo, KETTE.z + dz), V(30, 1389, KETTE.z + dz), V(52, 1389, KETTE.z + dz)], schlitten);
  KETTE_KABEL.push({ dz, port: XD1.ports[1 + k] });
});
// −MM1 (am Haken): beide Sensoren auf einen M12-Y-Verteiler unter der Adapterplatte, von dort ein Spiralkabel nach oben
const Y_VERT = V(238, 560, -30);                        // im Haken
box(18, 30, 24, M.ifm, Y_VERT.x, Y_VERT.y, Y_VERT.z, haken);                     // ifm Y-Verteiler EBC114
label('Y-Verteiler BG1/BG2', haken, Y_VERT.x, Y_VERT.y - 70, Y_VERT.z, 'klein');
[['BG1_MM1_eingehaengt', -6], ['BG2_MM1_geloest', 6]].forEach(([sig, dz]) => {
  const [e, w] = austritt(sig, haken);
  const zp = Y_VERT.z + dz;
  stecker(haken, V(Y_VERT.x, Y_VERT.y - 15, zp), '-y');
  kabel([e, w, V(w.x, 495, w.z), V(w.x, 495, zp), V(Y_VERT.x, 495, zp), V(Y_VERT.x, Y_VERT.y - 15 - 32, zp)], haken, M.kabelGrau, 1.6, 8, false);
});
stecker(haken, V(Y_VERT.x + 9, Y_VERT.y, Y_VERT.z), '+x');
// Sensorleitung −BG1/−BG2: vom Y-Verteiler über den Mitnehmer in die Hub-Energiekette,
// am Schlitten weiter nach oben in die waagrechte Kette zu −XD1
const SPIRAL_K = { cx: 290, cz: -30 };
box(30, 10, 30, M.deckel, SPIRAL_K.cx, 1144, SPIRAL_K.cz, schlitten);
kabel([V(SPIRAL_K.cx, 1196, SPIRAL_K.cz), V(SPIRAL_K.cx, 1440, SPIRAL_K.cz), V(SPIRAL_K.cx, 1440, -300 + 4), V(30, 1440, -300 + 4), V(30, 1440, KETTE.z + 4), V(30, 1389, KETTE.z + 4), V(52, 1389, KETTE.z + 4)], schlitten);
KETTE_KABEL.push({ dz: 4, port: XD1.ports[0] });
// in der Rinne hinunter zum Festpunkt der Hub-Energiekette
kabel([V(SPIRAL_K.cx, 1190, SPIRAL_K.cz), V(HK1.x - 10, 1120, HK1.zF - 8), V(HK1.x - 10, 900, HK1.zF - 8), V(HK1.x - 10, HK1.yA + 8, HK1.zF - 8)], schlitten, M.kabelGrau, 2.2, 20, false);
// am Hubteil: vom Mitnehmer hinunter zum Y-Verteiler
kabel([V(HK1.x - 10, HK1.yC0, HK1.zM - 8), V(HK1.x - 56, HK1.yC0 - 16, HK1.zM - 18), V(Y_VERT.x + 46, Y_VERT.y + 44, Y_VERT.z + 12), V(Y_VERT.x + 9 + 32, Y_VERT.y, Y_VERT.z)], haken, M.kabelGrau, 2.2, 16, false);

// Festseite der Energiekette: aus der Kettenwanne hinter der Traverse zu −XD1
KETTE_KABEL.forEach(({ dz, port }, k) => {
  const z = KETTE.z + dz, x = -640 + k * 6;
  zumPort([V(KETTE.xa - 10, 1313, z), V(x, 1313, z), V(x, 1340, z), V(x, 1340, -312 + k * 0), V(x, 1105 - k * 6, -312), V(-548 - k * 6, 1105 - k * 6, -312)], port);
});

// −MM4 (Gestell rechts): am Zylinderboden heraus, hinter dem Gestell zu −XD2
[['BG7_MM4_offen', 0, 318], ['BG8_MM4_zu', 1, 324]].forEach(([sig, port, y]) => {
  const [e, w] = austritt(sig);
  const x = 1392 + port * 6;
  zumPort([e, w, V(x, w.y, w.z), V(x, y, w.z), V(x, y, -200), V(747, y, -200)], XD2.ports[port]);
});
// −BG9 Thermoelement und −BG10 Niveauelektrode: M12-Stecker am Anschlusskopf, hinter dem Bad entlang zu −XD2
{
  stecker(bad, V(BAD_X - 77, RAND_Y + 70, -105), '+x');
  zumPort([V(BAD_X - 77 + 32, RAND_Y + 70, -105), V(BAD_X - 30, RAND_Y + 70, -105), V(BAD_X - 30, RAND_Y + 112, -105), V(540, RAND_Y + 112, -105), V(540, RAND_Y + 112, -192), V(540, 330, -192), V(747, 330, -192)], XD2.ports[2]);
  stecker(bad, V(BAD_X + 118, RAND_Y + 70, -105), '+x');
  zumPort([V(BAD_X + 118 + 32, RAND_Y + 70, -105), V(588, RAND_Y + 70, -105), V(588, RAND_Y + 70, -198), V(588, 336, -198), V(747, 336, -198)], XD2.ports[3]);
}
// Lichtschranken −BG11…−BG13: Stecker hinten am Sensor, senkrecht in den Kabelkanal am Bandgestell
{
  for (const sig of ['BG12_Bandanfang', 'BG11_Korb', 'BG13_Bandende']) {
    const p = BAND.stecker[sig];
    stecker(anlage, p, '-x', false);
    kabel([V(p.x - 31, p.y, p.z), V(-165, p.y, p.z), V(-165, 262, p.z)], anlage, M.kabelGrau, 2.2, 10, false);
  }
  // Inkrementalgeber −BG18: Leitung nach oben, unter dem Band hindurch in den Kanal (direkt auf −X5, nicht über Feldverteiler)
  { const g = BAND.geberStecker; stecker(anlage, g, '+y'); kabel([V(g.x, g.y + 32, g.z), V(g.x, g.y + 50, g.z), V(-165, g.y + 50, g.z), V(-165, 262, g.z)], anlage, M.kabelGrau, 2.8, 14); }
  // Band 2: Kabelkanal auf der Rückseite, Lichtschranken −BG21…−BG24, Pyrometer −BT2, Luftmesser −MB14 → Kanal → Kabelbrücke
  {
    const zk = B2.z - 160;
    const xk = B2.x0 + 80;
    box(B2.x1 - xk - 80, 30, 30, M.pvc, (xk + B2.x1 - 80) / 2, 250, zk);
    box(B2.x1 - xk - 80, 3, 34, M.pvcHell, (xk + B2.x1 - 80) / 2, 266.5, zk);
    for (const x of [600, 1100, 1700, 2300]) box(6, 26, 24, M.anthrazit, x, 250, zk + 14);
    for (const sig of ['BG21_B2_Anfang', 'BG22_B2_Kuehlung', 'BG24_B2_Ende']) {
      const q = BAND.stecker[sig];
      stecker(anlage, q, '-z', false);
      kabel([V(q.x, q.y, q.z - 31), V(q.x, q.y, zk), V(q.x, 262, zk)], anlage, M.kabelGrau, 2.2, 10, false);
    }
    const b = BAND.bt2Stecker;
    kabel([b, V(b.x, b.y, zk), V(b.x, 262, zk)], anlage, M.kabelGrau, 2.6, 10, false);
    [M.kabelGrau, M.kabelGrau, M.kabelGrau].forEach((mat, i) => { const d = lage(); kabel([V(xk + 10 + i * 6, 240, zk), V(xk + 10 + i * 6, 14, zk), V(xk + 10 + i * 6, 14, BRUECKE.z + d), V(BRUECKE.x + d, 14, BRUECKE.z + d), V(BRUECKE.x + d, 14, -60)], anlage, mat, 2.4, 20, false); });
    const m = B2_MOTOR.abgang, mb = m[m.length - 1];
    { const d = lage(); kabel([...m, V(mb.x, 14, BRUECKE.z + d), V(BRUECKE.x + d, 14, BRUECKE.z + d), V(BRUECKE.x + d, 14, -60)], anlage, M.kabel, 4.5, 30, false); }
    const g2 = BAND.geber2Stecker;
    stecker(anlage, g2, '+y');
    { const d = lage(); kabel([V(g2.x, g2.y + 32, g2.z), V(g2.x, g2.y + 50, g2.z), V(g2.x + 60, g2.y + 50, g2.z), V(g2.x + 60, 14, g2.z), V(g2.x + 60, 14, BRUECKE.z + d), V(BRUECKE.x + d, 14, BRUECKE.z + d), V(BRUECKE.x + d, 14, -60)], anlage, M.kabelGrau, 2.8, 14); }
  }
  // Rollenkurve −MA6: Lichtschranken −BG35/−BG36 (Stecker hinten am Sensor, radial nach außen) und Motorleitung
  //   am Boden zur Kabelbrücke und direkt auf −X5 bzw. −X1
  ['BG35_Kurve_Anfang', 'BG36_Kurve_Ende'].forEach((sig, i) => {
    const p = BAND.stecker[sig], t = LS_POS[sig] / KURVE.R;
    const d = V(-Math.cos(t), 0, Math.sin(t));
    stecker(anlage, p, '+y', false).quaternion.setFromUnitVectors(V(0, 1, 0), d);
    const e = p.clone().addScaledVector(d, 31), f = e.clone().addScaledVector(d, 25);
    const lg = lage();
    kabel([e, f, V(f.x, 14, f.z), V(f.x, 14, BRUECKE.z + lg), V(BRUECKE.x + lg, 14, BRUECKE.z + lg), V(BRUECKE.x + lg, 14, -60)], anlage, M.kabelGrau, 2.2, 14, false);
  });
  { const m = KURVE.motor.abgang, mb = m[m.length - 1], d = lage(); kabel([...m, V(mb.x, 14, BRUECKE.z + d), V(BRUECKE.x + d, 14, BRUECKE.z + d), V(BRUECKE.x + d, 14, -60)], anlage, M.kabel, 4.5, 30, false); }
  // Feldverteiler −XD3 am Bandgestell (+x): Endlagen −BG14…−BG17 der Stopperzylinder
  const XD3 = feldverteiler(132.5, 250, -460, Math.PI / 2, '−XD3 Feldverteiler Band', [['BG14_MM5_zu'], ['BG15_MM5_offen'], ['BG16_MM6_zu'], ['BG17_MM6_offen'], null, null, null, null]);
  ['BG14_MM5_zu', 'BG15_MM5_offen', 'BG16_MM6_zu', 'BG17_MM6_offen'].forEach((sig, i) => {
    // Nutsensorkabel unter der Zylinderkonsole nach außen, je eine eigene Lage am Band entlang zu −XD3
    const e = BAND.sensorAus[sig], y = 288 - i * 5, xl = 232 + i * 5, yl = 175 - i * 8;
    zumPort([e, V(e.x, yl, e.z), V(xl, yl, e.z), V(xl, yl, -420), V(xl, y, -420)], XD3.ports[i]);
  });
  { const t = XD3.sammel; kabel([t, V(t.x, 110, t.z), V(-160, 110, t.z), V(-160, 236, t.z)], anlage, M.kabelGrau, 4); }
  // Ventilinsel −QM2: Multipolleitung unter dem Band hindurch in den Kanal, Schläuche zu Anschlag und Vereinzeler
  kabel([V(156, 189, QM2.z), V(156, 150, QM2.z), V(-160, 150, QM2.z), V(-160, 236, QM2.z)], anlage, M.kabel, 3.5);
  const druck = new THREE.MeshStandardMaterial({ color: 0x2f7fd0, roughness: 0.42 });
  // je Ventil 2/4 auf Kolben-/Stangenseite des ADN (QS-6 nach −z); −MB9 außen am Vereinzeler vorbei
  for (const sig of ['MB9_Anschlag_auf', 'MB10_Vereinzeler_zu']) {
    QM2[sig].forEach((P, i) => {
      const Z = BAND.stopperAnschluss[sig][i], xh = sig === 'MB9_Anschlag_auf' ? 216 + i * 6 : 198 + i * 6;
      leitung([P, V(xh, P.y, P.z), V(xh, Z.y, P.z), V(xh, Z.y, Z.z - 20), V(Z.x, Z.y, Z.z - 20), Z], druck, 2.4, 12);
    });
  }
  // Druckluftversorgung −QM2 von der Wartungseinheit am Portal (Schlauch am Boden in Schutzschlauch)
  leitung([V(-625, 580, -170), V(-625, 14, -170), V(186, 14, -170), V(186, 14, QM2.z), V(186, 190, QM2.z)], new THREE.MeshStandardMaterial({ color: 0x1d2126, roughness: 0.8 }), 6, 30);
  // Sammelleitungen am Kanalende: senkrecht hinunter, am Boden in die Kabelbrücke zum Schaltschrank
  [M.kabelGrau, M.kabelGrau, M.kabelGrau, M.kabel].forEach((mat, i) => {
    const dx = -168 + i * 6, d = lage();
    kabel([V(dx, 240, BRUECKE.z + d), V(dx, 14, BRUECKE.z + d), V(BRUECKE.x + d, 14, BRUECKE.z + d), V(BRUECKE.x + d, 14, -60)], anlage, mat, 2.4, 20, false);
  });
  // Bandmotor: Leitung vom Klemmenkasten zum Boden und in die Kabelbrücke
  { const k = B1_MOTOR.abgang, kb = k[k.length - 1], d = lage(); kabel([...k, V(kb.x, 14, BRUECKE.z + d), V(BRUECKE.x + d, 14, BRUECKE.z + d), V(BRUECKE.x + d, 14, -60)], anlage, M.kabel, 4.5, 30, false); }
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
}

