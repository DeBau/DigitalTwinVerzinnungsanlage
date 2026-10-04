import * as THREE from 'three';
import { SIGNALE } from '../signale.js';
import { FUELL_MIN, NOT_HALT, TEMP_SOLL, notHaltText, st } from '../logik/zustand.js';
import { anlage } from '../core/szene.js';
import { TEX, canvasTextur } from '../core/texturen.js';
import { M } from '../core/materialien.js';
import { V, box, cached, mesh, zyl } from '../core/geometrie.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { fmt0 } from '../core/format.js';
import { label, platte, schildPlatte, tafel } from '../core/beschriftung.js';
import { sensorLed } from '../core/leds.js';
import { buendel, leitung } from '../bauteile/leitungen.js';
import { BAND, BAND2, KURVE, LS_POS } from './baender.js';
import { MULDE, ST } from './pruefstation.js';
import { dummy, rohrNeu } from './pneumatik.js';
import { drucktaster, meldeleuchte, tafelText, wahlschalter } from './befehlsgeraete.js';
import { koerbe } from './koerbe.js';
import { ausgang, eingang, korbAmPyrometer } from '../logik/eingaenge.js';
import { demo } from '../logik/demo-sps.js';

// ----------------------------------------------------------------------------
// Schaltschrank −A1 (800 x 2000 x 400) mit Tür, Montageplatte und Ausrüstung
// Geräte nach Herstellermaßen (SIMATIC S7-1500, SITOP, SIRIUS, 5SL, 8WH),
// Kennzeichnung nach IEC 81346, Aderfarben nach EN 60204-1
// ----------------------------------------------------------------------------
export const SCHRANK = { g: null, tueren: [], uebergang: [], hmiTex: null, hmiTakt: 0, tuerE: -1, auf: 0, ziel: 0, labels: [], licht: null, leuchte: null, diLeds: [], dqLeds: [], cpuTex: null, cpuLeds: {}, qa: [], tb1Led: null };
{
  const g = new THREE.Group(); g.position.set(-1500, 0, -280); anlage.add(g); SCHRANK.g = g;
  const W = 800, D = 400;
  const lbl = (t, x, y, z) => { const d = label(t, g, x, y, z, 'klein schrank'); SCHRANK.labels.push(d); return d; };

  // --- Gehäuse (Stahlblech RAL 7035, Sockel RAL 7022) ---
  box(W, 100, D, M.anthrazit, 0, 50, 0, g);
  box(W - 8, 4, D - 8, M.blech, 0, 102, 0, g);                                   // Bodenblech mit Kabeleinführung
  box(W, 2000, 4, M.blech, 0, 1100, -198, g);
  for (const sx of [-1, 1]) box(4, 1992, D, M.blech, sx * 398, 1100, 0, g);
  box(W, 4, D, M.blech, 0, 2098, 0, g);
  // VX25-Rahmen: 16-fach abgekantetes Profil mit Systemlochung im 25-mm-Raster (Textur), Dachblech mit Überstand
  const rahmenMat = (nx, ny) => {
    const t = canvasTextur(32, 64, (c) => {
      c.fillStyle = '#d2d4cf'; c.fillRect(0, 0, 32, 64);
      c.fillStyle = '#2a2d30'; c.fillRect(6, 10, 7, 14); c.fillRect(19, 10, 7, 14); c.fillRect(6, 40, 7, 14); c.fillRect(19, 40, 7, 14);
      c.fillStyle = 'rgba(0,0,0,0.15)'; c.fillRect(0, 0, 2, 64); c.fillRect(30, 0, 2, 64);
    }, true);
    t.repeat.set(nx, ny);
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, metalness: 0.05 });
  };
  const rahmenV = rahmenMat(1, 1992 / 50), rahmenH = rahmenMat((W - 56) / 32, 0.5);
  for (const sx of [-1, 1]) box(24, 1992, 24, rahmenV, sx * 384, 1100, 186, g);  // Rahmenprofil vorne
  for (const y of [116, 2084]) box(W - 56, 24, 23, rahmenH, 0, y, 185.5, g);
  box(W + 6, 3, D + 6, M.blech, 0, 2101.5, 0, g);                                 // Dachblech
  // Hauptschalter −QB1 seitlich (Not-Aus-Farben, abschließbar)
  const QZ = -108.5;                                   // Achse der Schalterwelle (s. −QB1)
  box(5, 120, 120, M.gelb, 402.5, 1780, QZ, g);
  zyl(20, 14, M.rot, 412, 1780, QZ, 'x', g, 28);
  const knebel = box(12, 22, 100, M.rot, 424, 1780, QZ, g); knebel.rotation.x = Math.PI / 2;
  platte(tafel('qb1', 100, 26, (c) => {
    c.fillStyle = '#f0b400'; c.fillRect(0, 0, 100, 26); c.fillStyle = '#111'; c.font = '700 9px Arial'; c.textAlign = 'center';
    c.fillText('0', 18, 17); c.fillText('I', 82, 17);
  }, 4), 100, 26, g, 405.2, 1710, QZ, Math.PI / 2);
  // Flanschplatte oben mit Kabelverschraubungen (Leitungen aus der Gitterrinne)
  box(260, 5, 120, M.blech, 0, 2102.5, -60, g);

  // --- Montageplatte (verzinkt) ---
  box(700, 1880, 3, M.verzinkt, 0, 1100, -170, g);
  const PF = -168.5;                                   // Vorderkante Montageplatte

  // --- Verdrahtungskanäle 60 x 80 mit geschlitzten Wänden und Deckel ---
  const finger = [];                                   // [x, y, z, rotZ]
  const kanalGrau = new THREE.MeshStandardMaterial({ color: 0x9ea3a6, roughness: 0.62 });
  const kanalH = (cx, cy, L) => {                      // waagrecht
    box(L, 60, 2, kanalGrau, cx, cy, PF + 1, g);
    for (let x = cx - L / 2 + 4; x <= cx + L / 2 - 4; x += 12) for (const s of [-1, 1]) finger.push([x, cy + s * 28.75, PF + 40, 0]);
    box(L - 8, 64, 2.5, M.pvcHell, cx, cy, PF + 80.6, g);
  };
  const kanalV = (cx, cy, L) => {                      // senkrecht
    box(60, L, 2, kanalGrau, cx, cy, PF + 1, g);
    for (let y = cy - L / 2 + 4; y <= cy + L / 2 - 4; y += 12) for (const s of [-1, 1]) finger.push([cx + s * 28.75, y, PF + 40, 1]);
    box(64, L, 2.5, M.pvcHell, cx, cy, PF + 81.25, g);
  };
  for (const sx of [-1, 1]) kanalV(sx * 320, 1105, 1770);
  const KANAL_Y = [1960, 1600, 1250, 920, 600, 330];
  for (const y of KANAL_Y) kanalH(0, y, 580);
  {
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(7, 2.5, 76), kanalGrau, finger.length);
    finger.forEach(([x, y, z, r], i) => { dummy.position.set(x, y, z); dummy.rotation.set(0, 0, r ? Math.PI / 2 : 0); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); });
    dummy.rotation.set(0, 0, 0);
    im.castShadow = true; im.receiveShadow = true; g.add(im);
  }

  // --- Hutschienen TH35-7,5 (gelocht) ---
  const thForm = new THREE.Shape();
  [[-17.5, 7.5], [-12.5, 7.5], [-12.5, 1], [12.5, 1], [12.5, 7.5], [17.5, 7.5], [17.5, 6.5], [13.5, 6.5], [13.5, 0], [-13.5, 0], [-13.5, 6.5], [-17.5, 6.5]]
    .forEach(([a, b], i) => i ? thForm.lineTo(a, b) : thForm.moveTo(a, b));
  const schiene = (y, x0, x1) => {
    const geo = new THREE.ExtrudeGeometry(thForm, { depth: x1 - x0, bevelEnabled: false });
    const m = mesh(geo, M.verzinkt, g); m.rotation.y = Math.PI / 2; m.position.set(x0, y, PF + 0.01);
    m.rotation.order = 'YXZ';
    // Shape-x = Höhe (y), Shape-y = Tiefe (z): Achsen tauschen
    m.geometry.rotateZ(Math.PI / 2); m.geometry.scale(-1, 1, 1); m.geometry.computeVertexNormals();
  };

  // --- Adern: senkrecht von der Geräteklemme in den Kanal (Kanalmitte) ---
  const FARBE = { dc: 0x1d3f8f, ac: 0x1b1b1b, n: 0x6fb7e6, pe: 0x3fae49, rot: 0xc8281f, weiss: 0xe8e8e8 };
  const draehte = new Map();
  const draht = (farbe, x, y0, y1, z) => {
    if (!draehte.has(farbe)) draehte.set(farbe, []);
    draehte.get(farbe).push([x, (y0 + y1) / 2, z, Math.abs(y1 - y0)]);
  };
  const kanalUeber = (y) => KANAL_Y.filter(k => k > y).sort((a, b) => a - b)[0];
  const kanalUnter = (y) => KANAL_Y.filter(k => k < y).sort((a, b) => b - a)[0];
  // Klemmen oben/unten an einem Gerät verdrahten: xs = Klemmenpositionen
  const adernMat = new Map();
  const aderMat = (f) => { if (!adernMat.has(f)) adernMat.set(f, new THREE.MeshStandardMaterial({ color: f, roughness: 0.5 })); return adernMat.get(f); };
  // Ader von der Klemme zum Kanal; liegt die Klemme vor der Kanaltiefe, biegt die Ader vor dem Kanal nach hinten ab
  const ader = (f, x, y0, yk, z) => {
    if (z <= PF + 72) { draht(f, x, y0, yk, z); return; }
    const s = Math.sign(yk - y0), yRand = yk - s * 30, zk = PF + 40 + ((x * 7.3) % 28 + 28) % 28;
    ab.add([[x, y0, z], [x, yRand - s * 16, z], [x, yRand - s * 4, zk], [x, yk, zk]], aderMat(f), 0.9, 8);
  };
  const anschliessen = (xs, yOben, yUnten, z, farbeOben, farbeUnten = farbeOben) => {
    xs.forEach((x, i) => {
      if (farbeOben) ader(Array.isArray(farbeOben) ? farbeOben[i] : farbeOben, x, yOben, kanalUeber(yOben), z);
      if (farbeUnten) ader(Array.isArray(farbeUnten) ? farbeUnten[i] : farbeUnten, x, yUnten, kanalUnter(yUnten), z);
    });
  };
  const ab = buendel(g);                               // gebogene Adern (Frontstecker), Leitungen

  const grau = new THREE.MeshStandardMaterial({ color: 0xbfc3c6, roughness: 0.5 });            // SIRIUS hellgrau
  const grauDunkel = new THREE.MeshStandardMaterial({ color: 0x6b7075, roughness: 0.5 });
  const weiss = new THREE.MeshStandardMaterial({ color: 0xe9eae7, roughness: 0.45 });          // 5SL
  const s7 = new THREE.MeshStandardMaterial({ color: 0x353a3f, roughness: 0.48, metalness: 0.1 }); // SIMATIC anthrazit
  const schraube = (x, y, z) => { zyl(2.6, 1.2, M.stahl, x, y, z, 'z', g, 12); box(3.6, 0.7, 0.6, M.schwarz, x, y, z + 0.7, g); };
  const text = (c, t, x, y, size, farbe = '#1b1f23', gewicht = 600, ausr = 'left') => { c.fillStyle = farbe; c.font = `${gewicht} ${size}px Arial`; c.textAlign = ausr; c.fillText(t, x, y); };
  const led = (x, y, z, farbe, w = 2.4, h = 1.6) => { const m = sensorLed(g, x, y, z, '', w, h, 0.8); m.emissive.setHex(farbe); m.color.setHex(farbe).multiplyScalar(0.12); return m; };

  // ===== Reihe A (Schiene y = 1780): Einspeisung, Schutzorgane, Netzteil =====
  const YA = 1780;
  schiene(YA, -290, 290);
  // −X0 Einspeiseklemmen 16 mm² (L1 L2 L3 N PE) mit Abdeckung
  [[0x9a9fa3, FARBE.ac], [0x9a9fa3, FARBE.ac], [0x9a9fa3, FARBE.ac], [0x2f6fb5, FARBE.n], [0x3fae49, FARBE.pe]].forEach(([f, a], i) => {
    const x = -284 + i * 12.2;
    box(12, 66, 52, new THREE.MeshStandardMaterial({ color: f, roughness: 0.5 }), x, YA, PF + 7.5 + 26, g);
    if (i === 4) box(12.6, 8, 53.6, M.gelb, x, YA + 12, PF + 7.5 + 26, g);
    zyl(3, 1, M.stahl, x, YA + 26, PF + 59.6, 'z', g, 10); zyl(3, 1, M.stahl, x, YA - 26, PF + 59.6, 'z', g, 10);
    draht(a, x, YA + 33, 1960, PF + 40);                                    // Zuleitung von oben
  });
  lbl('−X0 Einspeisung 400 V', -260, YA + 60, PF + 70);
  // −QB1 Lasttrennschalter 3LD am rechten Schienenende, Verlängerungswelle zum Seitengriff
  box(72, 96, 80, grauDunkel, 250, YA, PF + 7.5 + 40, g);
  box(14, 40, 40, M.schwarz, 289, YA, PF + 60, g);                         // Wellenkupplung
  zyl(4, 104, M.stahl, 344, YA, PF + 60, 'x', g, 12);
  anschliessen([230, 250, 270], YA + 48, YA - 48, PF + 60, FARBE.ac);
  lbl('−QB1 Hauptschalter', 250, YA + 70, PF + 95);
  // −FA1 Motorschutzschalter 3RV2011 (45 x 97 x 97)
  {
    const x = -202;
    box(45, 97, 70, grau, x, YA, PF + 7.5 + 35, g);
    box(45, 60, 27, grau, x, YA, PF + 7.5 + 83.5, g);
    platte(tafel('3rv', 45, 60, (c) => {
      c.fillStyle = '#c3c7ca'; c.fillRect(0, 0, 45, 60);
      text(c, 'SIEMENS', 3, 6, 3.6, '#00877c', 700);
      text(c, '3RV2011-1EA10', 3, 56, 3, '#333', 500);
      c.fillStyle = '#f2f2f0'; c.beginPath(); c.arc(33, 13, 6, 0, 7); c.fill();
      c.strokeStyle = '#333'; c.lineWidth = 0.4; for (let i = 0; i < 9; i++) { const a = Math.PI * (0.8 + i * 0.175); c.beginPath(); c.moveTo(33 + Math.cos(a) * 4.5, 13 + Math.sin(a) * 4.5); c.lineTo(33 + Math.cos(a) * 6, 13 + Math.sin(a) * 6); c.stroke(); }
      text(c, '2,8–4 A', 27, 23, 2.6, '#333', 500);
    }), 45, 60, g, x, YA, PF + 97.6);
    zyl(13, 6, M.schwarz, x, YA - 4, PF + 100.5, 'z', g, 28);              // Drehantrieb
    box(4, 22, 3, M.schwarz, x, YA - 4, PF + 104.5, g);
    box(2, 9, 1, weiss, x, YA + 4, PF + 106.2, g);
    for (const dx of [-15, 0, 15]) { schraube(x + dx, YA + 41, PF + 71); schraube(x + dx, YA - 41, PF + 71); }
    anschliessen([x - 15, x, x + 15], YA + 48, YA - 48, PF + 60, FARBE.ac);
    lbl('−FA1 Motorschutz Band', x, YA + 70, PF + 100);
  }
  // −FA5 Motorschutz Band 2, −FA6 Motorschutz Pumpe, −FA8 Motorschutz Muldenantrieb −MA7 (3RV2, vereinfacht)
  for (const [x, name] of [[90, '−FA5 Motorschutz Band 2'], [140, '−FA6 Motorschutz Pumpe'], [189, '−FA8 Motorschutz Mulde']]) {
    box(45, 97, 70, grau, x, YA, PF + 7.5 + 35, g);
    box(45, 60, 27, grau, x, YA, PF + 7.5 + 83.5, g);
    zyl(13, 6, M.schwarz, x, YA - 4, PF + 100.5, 'z', g, 28);
    box(4, 22, 3, M.schwarz, x, YA - 4, PF + 104.5, g);
    for (const dx of [-15, 0, 15]) { schraube(x + dx, YA + 41, PF + 71); schraube(x + dx, YA - 41, PF + 71); }
    anschliessen([x - 15, x, x + 15], YA + 48, YA - 48, PF + 60, FARBE.ac);
    lbl(name, x, x > 160 ? YA - 62 : YA + (x > 100 ? 92 : 70), PF + 100);
  }
  // −FA2 LS 5SL6316-7 C16 3-polig (54 x 90 x 70) und −FA3/−FA4 5SL6106-7 B6 (18 x 90 x 70)
  const ls = (x, pole, typ, name) => {
    const w = pole * 18 - 0.4;
    box(w, 90, 45, weiss, x, YA, PF + 7.5 + 22.5, g);
    box(w, 45, 25, weiss, x, YA, PF + 7.5 + 57.5, g);
    platte(tafel('5sl' + pole + typ, w, 45, (c) => {
      c.fillStyle = '#e9eae7'; c.fillRect(0, 0, w, 45);
      for (let p = 0; p < pole; p++) {
        const x0 = p * 18;
        text(c, 'SIEMENS', x0 + 2, 5, 2.4, '#00877c', 700);
        text(c, typ, x0 + 2, 41, 3.4, '#222', 700);
        c.fillStyle = '#3d9a4a'; c.fillRect(x0 + 11, 34, 4, 3);
      }
    }), w, 45, g, x, YA, PF + 90.1);
    for (let p = 0; p < pole; p++) box(8, 12, 12, grauDunkel, x - w / 2 + 9 + p * 18, YA + 5, PF + 95, g);   // Kipphebel
    if (pole > 1) box(w - 8, 3, 4, grauDunkel, x, YA + 9, PF + 101, g);           // Kopplungsbügel
    for (let p = 0; p < pole; p++) { const xp = x - w / 2 + 9 + p * 18; schraube(xp, YA + 40, PF + 53); schraube(xp, YA - 40, PF + 53); }
    const xs = Array.from({ length: pole }, (_, p) => x - w / 2 + 9 + p * 18);
    anschliessen(xs, YA + 45, YA - 45, PF + 45, FARBE.ac);
    lbl(name, x, YA + (pole > 1 ? 85 : 70), PF + 95);
  };
  ls(-148, 3, 'C16', '−FA2 LS C16 Heizung');
  ls(-111, 1, 'B6', '−FA3 LS B6');
  ls(-92.6, 1, 'B6', '−FA4 LS B6');
  // −TA1 SITOP PSU8200 24 V / 10 A (50 x 125 x 125)
  {
    const x = -50;
    box(50, 125, 121, M.alu, x, YA, PF + 7.5 + 60.5, g);
    for (let i = 0; i < 9; i++) box(51, 2, 70, M.schwarz, x, YA - 40 + i * 10, PF + 60, g);     // Lüftungsschlitze seitlich (0,5 mm über das Gehäuse)
    platte(tafel('sitop', 50, 125, (c) => {
      c.fillStyle = '#3a3f44'; c.fillRect(0, 0, 50, 125);
      c.fillStyle = '#2c3034'; c.fillRect(0, 0, 50, 22); c.fillRect(0, 103, 50, 22);
      text(c, 'SIEMENS', 4, 32, 4, '#c9ced2', 700);
      text(c, 'SITOP', 4, 44, 5.2, '#ffffff', 700);
      text(c, 'PSU8200', 4, 51, 3.4, '#c9ced2', 500);
      text(c, '24 V / 10 A', 4, 60, 3.4, '#c9ced2', 500);
      text(c, 'DC OK', 30, 72, 2.6, '#c9ced2', 500);
      text(c, '24…28,8 V', 4, 92, 2.6, '#c9ced2', 500);
      text(c, 'L  N  PE', 4, 6, 2.6, '#c9ced2', 500);
      text(c, '+  +  −  −', 4, 122, 2.6, '#c9ced2', 500);
    }), 50, 125, g, x, YA, PF + 128.6);
    const ok = led(x + 15, YA - 6, PF + 129, 0x22dd55); ok.emissiveIntensity = 1.8;
    zyl(3, 2, M.stahl, x - 12, YA - 22, PF + 129.2, 'z', g, 12);         // Poti
    for (let i = 0; i < 4; i++) { schraube(x - 17 + i * 11, YA - 53, PF + 129.2); if (i < 3) schraube(x - 17 + i * 11, YA + 53, PF + 129.2); }
    anschliessen([x - 17, x - 6, x + 5], YA + 63, 0, PF + 110, [FARBE.ac, FARBE.n, FARBE.pe], null);
    anschliessen([x - 17, x - 6, x + 5, x + 16], 0, YA - 63, PF + 110, null, [FARBE.dc, FARBE.dc, FARBE.dc, FARBE.dc]);
    lbl('−TA1 Netzteil 24 V DC / 10 A', x, YA + 95, PF + 125);
  }
  // −XD9 Servicesteckdose 5TE6800 (45 TE breit)
  {
    const x = 20;
    box(53, 85, 45, grau, x, YA, PF + 30, g);
    box(45, 45, 25, grau, x, YA, PF + 65, g);
    zyl(16, 3, M.kunststoff, x, YA, PF + 78.5, 'z', g, 28);
    for (const dx of [-4.75, 4.75]) zyl(2.4, 1, M.schwarz, x + dx, YA, PF + 80.1, 'z', g, 10);
    anschliessen([x - 10, x + 10], YA + 43, 0, PF + 40, [FARBE.ac, FARBE.n], null);
    lbl('−XD9 Servicesteckdose', x, YA + 70, PF + 70);
  }
  // Abgang 400 V und 24 V in den rechten Kanal ist Teil der Kanalverdrahtung (nicht einzeln gezeichnet)

  // ===== Reihe B (Profilschiene y = 1420): SIMATIC S7-1500 =====
  const YB = 1420, MH = 147, MT = 129;
  {
    // Profilschiene 6ES7590-1AE80 (482,6 mm), Aluminium mit Nuten
    const L = 482.6, x0 = -280;
    box(L, 155, 10, M.alu, x0 + L / 2, YB, PF + 5, g);
    for (const dy of [-40, 40]) box(L, 3, 1, M.schwarz, x0 + L / 2, YB + dy, PF + 10.2, g);
    for (let x = x0 + 20; x < x0 + L; x += 45) { schraube(x, YB + 68, PF + 10.6); schraube(x, YB - 68, PF + 10.6); }
    zyl(3, 8, M.messing, x0 + L - 12, YB - 62, PF + 14, 'z', g, 8);       // Erdungsschraube
  }
  const MZ = PF + 10;                                   // Rückseite der Baugruppen
  const s7Modul = (x0, w, key, zeichnen) => {
    const xm = x0 + w / 2;
    box(w - 0.6, MH, MT - 4, s7, xm, YB, MZ + (MT - 4) / 2, g);
    // Frontklappe mit Scharnier unten, leicht abgesetzt
    box(w - 3, MH - 30, 4, s7, xm, YB - 10, MZ + MT - 2, g);
    platte(tafel(key, w - 0.6, MH, zeichnen, 8), w - 0.6, MH, g, xm, YB, MZ + MT + 0.15);
    for (let i = 0; i < 5; i++) box(w - 10, 1.6, 12, M.schwarz, xm, YB + MH / 2 + 0.2, MZ + 20 + i * 18, g);  // Lüftungsschlitze oben (Teilung 18)
    return xm;
  };
  const s7Kopf = (c, w, titel) => {
    c.fillStyle = '#353a3f'; c.fillRect(0, 0, w, MH);
    c.fillStyle = '#2a2e32'; c.fillRect(0, 0, w, 20);
    text(c, 'SIEMENS', 2.5, 6, 3.4, '#cfd4d8', 700);
    c.fillStyle = '#41464c'; c.fillRect(1.5, 20, w - 3, MH - 30);               // Frontklappe
    c.strokeStyle = '#24282c'; c.lineWidth = 0.5; c.strokeRect(1.5, 20, w - 3, MH - 30);
    text(c, titel, 2.5, MH - 3, 2.6, '#cfd4d8', 600);
  };
  const statusLeds = (xm, w) => {
    const leds = {};
    [['run', 0x22dd55], ['err', 0xff3b2f], ['mt', 0xffb000]].forEach(([k, f], i) => { leds[k] = led(xm - w / 2 + 4 + i * 6.5, YB + MH / 2 - 13, MZ + MT + 0.6, f, 4, 2); });
    return leds;
  };
  // PM 1507 70 W
  {
    const x0 = -278, w = 50;
    const xm = s7Modul(x0, w, 'pm1507', (c, ww) => {
      s7Kopf(c, ww, 'PM 70W 120/230VAC');
      text(c, 'RUN ERROR MAINT', 2.5, 18, 2, '#9aa1a8', 500);
      c.fillStyle = '#f1f2ef'; c.fillRect(6, 30, ww - 12, 70);
      text(c, 'PM 1507', 9, 40, 3.4, '#222', 700);
      text(c, '6EP1332-4BA00', 9, 47, 2.4, '#333', 500);
      text(c, '24 V DC / 3 A', 9, 54, 2.4, '#333', 500);
      c.fillStyle = '#1b1e21'; c.fillRect(ww / 2 - 6, 105, 12, 7);                   // EIN/AUS-Schalter
      text(c, 'I   O', ww / 2 - 4.5, 103, 2.2, '#cfd4d8', 600);
    });
    statusLeds(xm, w).run.emissiveIntensity = 1.6;
    anschliessen([xm - 10, xm, xm + 10], 0, YB - MH / 2, MZ + 100, null, [FARBE.ac, FARBE.n, FARBE.pe]);
    lbl('PM 1507 Laststromversorgung', xm, YB + 105, MZ + MT + 10);
  }
  // CPU 1516-3 PN/DP mit Display
  let cpuX;
  {
    const x0 = -227, w = 70;
    cpuX = s7Modul(x0, w, 'cpu1516', (c, ww) => {
      s7Kopf(c, ww, 'CPU 1516-3 PN/DP');
      text(c, 'RUN/STOP ERROR MAINT', 2.5, 18, 2, '#9aa1a8', 500);
      c.fillStyle = '#111417'; c.fillRect(8, 24, ww - 16, 44);                        // Displayrahmen
      // Bedientasten: 4 Pfeile + ESC + OK
      c.fillStyle = '#2a2e32';
      for (const [x, y] of [[ww / 2, 76], [ww / 2, 90], [ww / 2 - 8, 83], [ww / 2 + 8, 83]]) { c.beginPath(); c.arc(x, y, 3.2, 0, 7); c.fill(); }
      c.fillRect(8, 95, 14, 6); c.fillRect(ww - 22, 95, 14, 6);
      text(c, 'ESC', 10.5, 99.5, 2.4, '#cfd4d8', 600); text(c, 'OK', ww - 18, 99.5, 2.4, '#cfd4d8', 600);
      c.fillStyle = '#cfd4d8';
      for (const [x, y, r] of [[ww / 2, 76, 0], [ww / 2, 90, Math.PI], [ww / 2 - 8, 83, -Math.PI / 2], [ww / 2 + 8, 83, Math.PI / 2]]) {
        c.save(); c.translate(x, y); c.rotate(r); c.beginPath(); c.moveTo(0, -1.4); c.lineTo(1.3, 0.8); c.lineTo(-1.3, 0.8); c.fill(); c.restore();
      }
      c.fillStyle = '#f1f2ef'; c.fillRect(6, 106, ww - 12, 22);
      text(c, 'SIMATIC S7-1500', 8, 112, 2.8, '#222', 700);
      text(c, '6ES7516-3AN02-0AB0', 8, 118, 2.4, '#333', 500);
      text(c, 'X1 PN · X2 PN · X3 DP', 8, 124, 2.4, '#333', 500);
    });
    SCHRANK.cpuLeds = statusLeds(cpuX, w);
    SCHRANK.cpuTex = canvasTextur(320, 240, () => {});
    const disp = platte(new THREE.MeshBasicMaterial({ map: SCHRANK.cpuTex, toneMapped: false }), w - 18, 42, g, cpuX, YB + MH / 2 - 46, MZ + MT + 0.3);
    disp.receiveShadow = false;
    // Versorgung 24 V (Stecker unten) und PROFINET X1 P1 nach unten in den Kanal
    anschliessen([cpuX - 22, cpuX - 16], 0, YB - MH / 2, MZ + 90, null, [FARBE.dc, FARBE.dc]);
    box(14, 10, 16, M.kunststoff, cpuX + 14, YB - MH / 2 - 5, MZ + 100, g);   // RJ45-Stecker (FastConnect)
    ab.add([[cpuX + 14, YB - MH / 2 - 10, MZ + 100], [cpuX + 14, YB - 120, MZ + 100], [cpuX + 14, YB - 120, PF + 55], [cpuX + 14, 1250, PF + 55]], M.kabelGruen, 3, 14);
    lbl('−KF1 CPU 1516-3 PN/DP', cpuX, YB + 125, MZ + MT + 10);
  }
  // DI 32x24VDC HF und DQ 32x24VDC/0.5A ST, Kanal-LEDs zeigen die echten Signale
  const ioModul = (x0, liste, titel, bestell, name, dy) => {
    const w = 35;
    const xm = s7Modul(x0, w, titel, (c, ww) => {
      s7Kopf(c, ww, titel.split(' ')[0] + ' 32');
      c.fillStyle = '#f1f2ef'; c.fillRect(14, 24, ww - 17, 106);                     // Beschriftungsstreifen
      for (let i = 0; i < 32; i++) {
        const sp = i < 16 ? 0 : 1, z = i % 16;
        text(c, `.${i % 8}`, 15 + sp * 9, 29 + z * 6.2, 2.1, '#333', 500);
        c.fillStyle = '#1d2024'; c.fillRect(3 + sp * 5, 25.6 + z * 6.2, 3.2, 2.6);
      }
      text(c, titel.replace('/0.5A ST', '').replace(' HF', ''), 14.5, 126, 1.9, '#222', 600);
      text(c, bestell, 14.5, 128.8, 1.6, '#555', 500);
    });
    const leds = statusLeds(xm, w); leds.run.emissiveIntensity = 1.6;
    for (let i = 0; i < 32; i++) {
      const sp = i < 16 ? 0 : 1, z = i % 16;
      const m = led(xm - w / 2 + 4.9 + sp * 5, YB + MH / 2 - 26.9 - z * 6.2, MZ + MT + 0.5, 0x22dd55, 3, 2.4);
      liste.push(m);
    }
    // Frontstecker 40-polig: Adern unten heraus, nach hinten in den Kanal
    for (let i = 0; i < 16; i++) {
      const x = xm - 12 + i * 1.6, zf = MZ + MT - 18 - (i % 3) * 4;
      ab.add([[x, YB - MH / 2 + 4, zf], [x, YB - MH / 2 - 22 - (i % 4) * 3, zf], [x, YB - MH / 2 - 22 - (i % 4) * 3, PF + 30 + (i % 5) * 9], [x, 1250, PF + 30 + (i % 5) * 9]], new THREE.MeshStandardMaterial({ color: FARBE.dc, roughness: 0.5 }), 0.8, 6);
    }
    lbl(name, xm, YB + 105 + dy, MZ + MT + 10);
  };
  ioModul(-157, SCHRANK.diLeds, 'DI 32x24VDC HF', '6ES7521-1BL00-0AB0', 'DI 32 (%I0.0–%I3.7)', 30);
  ioModul(-122, SCHRANK.dqLeds, 'DQ 32x24VDC/0.5A ST', '6ES7522-1BL01-0AB0', 'DQ 32 (%Q0.0–%Q3.7)', 0);
  ioModul(-87, SCHRANK.diLeds, 'DI 32x24VDC HF', '6ES7521-1BL00-0AB0', 'DI 32 (%I4.0–%I7.7)', 60);
  ioModul(-17, SCHRANK.dqLeds, 'DQ 32x24VDC/0.5A ST', '6ES7522-1BL01-0AB0', 'DQ 32 (%Q4.0–%Q7.7)', 30);
  ioModul(18, SCHRANK.diLeds, 'DI 32x24VDC HF', '6ES7521-1BL00-0AB0', 'DI 32 (%I8.0–%I11.7)', 90);
  // AI 8xU/I/RTD/TC ST: Temperatur −BT1 (%IW64) und Füllstand −BL1 (%IW66)
  {
    const w = 35, xm = s7Modul(-52, w, 'AI 8xU/I/RTD/TC ST', (c, ww) => {
      s7Kopf(c, ww, 'AI 8');
      c.fillStyle = '#f1f2ef'; c.fillRect(14, 24, ww - 17, 106);
      ['CH0 BT1', 'CH1 BL1', 'CH2', 'CH3', 'CH4', 'CH5', 'CH6', 'CH7'].forEach((t, i) => text(c, t, 15, 32 + i * 11, 2.1, '#333', 500));
      text(c, 'AI 8xU/I/RTD/TC', 14.5, 126, 1.9, '#222', 600);
      text(c, '6ES7531-7KF00-0AB0', 14.5, 128.8, 1.6, '#555', 500);
    });
    statusLeds(xm, w).run.emissiveIntensity = 1.6;
    for (let i = 0; i < 6; i++) ab.add([[xm - 8 + i * 3, YB - MH / 2 + 4, MZ + MT - 20], [xm - 8 + i * 3, YB - MH / 2 - 24, MZ + MT - 20], [xm - 8 + i * 3, YB - MH / 2 - 24, PF + 40 + i * 6], [xm - 8 + i * 3, 1250, PF + 40 + i * 6]], i < 4 ? M.kabelGrau : aderMat(FARBE.dc), 0.9, 6);
    lbl('AI 8 (%IW64 BT1, %IW66 BL1)', xm, YB + 120, MZ + MT + 10);
  }
  lbl('Reserve 20 %', 128, YB, MZ + 20);

  // ===== Reihe C (Schiene y = 1085): Schütze, Halbleiterrelais, Sicherheitsrelais, Koppelrelais =====
  const YC = 1085;
  schiene(YC, -290, 290);
  // SIRIUS 3RT2015 Baugröße S00 (45 x 57,5 x 73)
  const schuetz = (x, key, name, oben = true, unten = true) => {
    box(45, 57.5, 50, grau, x, YC, PF + 7.5 + 25, g);
    box(36, 40, 23, grau, x, YC, PF + 7.5 + 61.5, g);
    platte(tafel('3rt' + key, 36, 40, (c) => {
      c.fillStyle = '#c3c7ca'; c.fillRect(0, 0, 36, 40);
      text(c, 'SIEMENS', 2, 5, 3, '#00877c', 700);
      c.fillStyle = '#f1f2ef'; c.fillRect(3, 24, 30, 12);
      text(c, key, 5, 32, 4, '#222', 700);
      text(c, '3RT2015-1BB41', 2, 21, 2.2, '#333', 500);
    }), 36, 40, g, x, YC, PF + 80.6);
    const anzeige = box(8, 5, 2, M.schwarz, x + 10, YC + 7, PF + 81.5, g);       // Schaltstellungsanzeige
    for (const dx of [-14, 0, 14]) { schraube(x + dx, YC + 24, PF + 58.5); schraube(x + dx, YC - 24, PF + 58.5); }
    if (oben) anschliessen([x - 14, x, x + 14], oben === true ? YC + 29 : oben, 0, PF + 50, FARBE.ac, null);
    if (unten) anschliessen([x - 14, x, x + 14], 0, unten === true ? YC - 29 : unten, PF + 50, null, FARBE.ac);
    draht(FARBE.dc, x + 19, YC + 29, kanalUeber(YC), PF + 52);                   // Spule A1
    if (name) lbl(name, x, YC - 60, PF + 90);
    return anzeige;
  };
  // Wendeschützkombination −QA1/−QA2 (mechanische Verriegelung 3RA2924 dazwischen), −QA3 Heizungsschütz
  // Wendekombination 3RA2315 (Baugröße S00): −QA1 Rechtslauf, −QA2 Linkslauf, seitliche mechanische Verriegelung,
  // Verdrahtungsbausatz: oben Einspeisebrücke (parallel), unten Abgangsbrücke mit Phasentausch L1↔L3
  SCHRANK.qa = [schuetz(-262, 'QA1', null, YC + 39, false), schuetz(-214, 'QA2', null, false, YC - 39), schuetz(-160, 'QA3', '−QA3 Heizung')];
  box(3, 44, 66, M.kunststoff, -238, YC, PF + 7.5 + 33, g);                         // mechanische Verriegelung 3RA2924
  const bruecke = (y, key, tausch, xc = -238) => {
    box(93, 10, 16, M.kunststoff, xc, y, PF + 55, g);
    platte(tafel('wende' + key, 93, 10, (c) => {
      c.fillStyle = '#2a2e33'; c.fillRect(0, 0, 93, 10);
      c.strokeStyle = '#d0a020'; c.lineWidth = 0.9;
      for (let i = 0; i < 3; i++) {
        const a = 10 + i * 14, b = 58 + (tausch ? (2 - i) : i) * 14;
        c.beginPath(); c.moveTo(a, tausch ? 7 : 3); c.lineTo(b, tausch ? 3 : 7); c.stroke();
      }
      c.fillStyle = '#e6e9ec'; c.font = '600 2.6px Arial'; c.fillText(tausch ? '3RA2923 L1↔L3' : '3RA2923', 34, 9.3);
    }), 93, 10, g, xc, y, PF + 63.1);
  };
  bruecke(YC + 34, 'oben', false);
  bruecke(YC - 34, 'unten', true);
  // Band 2: Wendekombination −QA5/−QA6, Lüfterschütz −QA7
  SCHRANK.qa.push(schuetz(30, 'QA5', null, YC + 39, false), schuetz(78, 'QA6', null, false, YC - 39), schuetz(132, 'QA7', '−QA7 Pumpe Sprühkühlung'));
  box(3, 44, 66, M.kunststoff, 54, YC, PF + 7.5 + 33, g);
  bruecke(YC + 34, 'oben', false, 54);
  bruecke(YC - 34, 'unten', true, 54);
  lbl('−QA5/−QA6 Wendekombination Band 2', 54, YC - 62, PF + 90);
  // Muldenantrieb −MA7: Wendekombination −QA12 (vor) / −QA13 (zurück), mechanisch verriegelt
  SCHRANK.qa.push(schuetz(180, 'QA12', null, YC + 39, false), schuetz(228, 'QA13', null, false, YC - 39));
  box(3, 44, 66, M.kunststoff, 204, YC, PF + 7.5 + 33, g);
  bruecke(YC + 34, 'oben', false, 204);
  bruecke(YC - 34, 'unten', true, 204);
  lbl('−QA12/−QA13 Wendekombination Mulde', 204, YC - 62 - 22, PF + 90);
  // Keyence CV-X Bildverarbeitungs-Controller (auf der Montageplatte rechts neben der S7-Profilschiene), Kamerakabel und E/A zur SPS
  {
    const x = 246, YC = 1420;
    box(80, 150, 120, new THREE.MeshStandardMaterial({ color: 0x2f3236, roughness: 0.45, metalness: 0.2 }), x, YC + 10, PF + 7.5 + 60, g);
    platte(tafel('cvx', 80, 150, (c) => {
      c.fillStyle = '#2f3236'; c.fillRect(0, 0, 80, 150);
      c.fillStyle = '#e8eaec'; c.font = '700 7px Arial'; c.fillText('KEYENCE', 6, 14);
      c.font = '700 9px Arial'; c.fillText('CV-X', 6, 30);
      c.font = '500 4px Arial'; c.fillText('Vision System', 6, 37);
      c.fillStyle = '#16181a'; for (let i = 0; i < 4; i++) c.fillRect(8 + i * 17, 60, 12, 10);        // Kameraanschlüsse
      c.fillStyle = '#9aa3ab'; c.font = '500 3.4px Arial'; c.fillText('CAMERA 1   2   3   4', 6, 77);
      c.fillStyle = '#16181a'; c.fillRect(8, 95, 26, 12); c.fillRect(40, 95, 30, 12);
      c.fillStyle = '#9aa3ab'; c.fillText('ETHERNET', 8, 112); c.fillText('I/O', 50, 112);
    }, 4), 80, 150, g, x, YC + 10, PF + 128.1);
    for (let i = 0; i < 3; i++) { const m = led(x + 25 + i * 8, YC + 70, PF + 128.6, [0x22dd55, 0xffb000, 0xff3b2f][i], 3, 2); if (!i) m.emissiveIntensity = 1.6; }
    ab.add([[x - 27, YC - 6, PF + 128], [x - 27, YC - 6, PF + 140], [x - 27, YC - 90, PF + 140], [x - 27, YC - 90, PF + 50], [x - 27, kanalUnter(YC), PF + 50]], M.kabelGrau, 3, 12);
    lbl('−KF10 Keyence CV-X Controller', x, YC + 100, PF + 130);
  }
  lbl('−QA1/−QA2 Wendekombination Band (rechts | links)', -238, YC - 62, PF + 90);
  // −TB1 Halbleiterrelais 3RF2 mit Kühlkörper (22,5 mm)
  {
    const x = -112;
    box(45, 100, 36, M.alu, x, YC, PF + 7.5 + 18, g);
    for (let i = 0; i < 8; i++) box(1.6, 102, 24, M.alu, x - 19.5 + i * 5.6, YC, PF + 50, g);   // Kühlrippen (1 mm über das Gehäuse)
    box(22.5, 80, 30, grauDunkel, x, YC, PF + 77, g);
    platte(tafel('3rf', 22.5, 80, (c) => {
      c.fillStyle = '#6b7075'; c.fillRect(0, 0, 22.5, 80);
      text(c, 'SIEMENS', 2, 6, 2.6, '#e6e9ec', 700);
      text(c, '3RF2', 2, 40, 4, '#ffffff', 700);
      text(c, '20 A', 2, 46, 2.6, '#e6e9ec', 500);
    }), 22.5, 80, g, x, YC, PF + 92.1);
    SCHRANK.tb1Led = led(x + 6, YC + 22, PF + 92.5, 0xffb000, 3, 3);
    anschliessen([x - 5, x + 5], YC + 50, YC - 50, PF + 80, FARBE.ac);
    lbl('−TB1 Halbleiterrelais Heizung', x, YC - 70, PF + 100);
  }
  // −KF2 Sicherheitsrelais SIRIUS 3SK1 (22,5 x 100 x 120)
  {
    const x = -72;
    box(22.5, 100, 115, grau, x, YC, PF + 7.5 + 57.5, g);
    platte(tafel('3sk', 22.5, 100, (c) => {
      c.fillStyle = '#c3c7ca'; c.fillRect(0, 0, 22.5, 100);
      c.fillStyle = '#f0b400'; c.fillRect(0, 12, 22.5, 3);
      text(c, 'SIEMENS', 2, 7, 2.6, '#00877c', 700);
      text(c, '3SK1111', 2, 50, 3, '#222', 700);
      text(c, 'DEVICE  IN  OUT', 1.5, 26, 1.7, '#333', 500);
    }), 22.5, 100, g, x, YC, PF + 122.6);
    for (let i = 0; i < 3; i++) { const m = led(x - 6 + i * 6, YC + 28, PF + 123, 0x22dd55, 3, 2); m.emissiveIntensity = 1.6; }
    anschliessen([x - 6, x, x + 6], YC + 50, YC - 50, PF + 100, FARBE.dc);
    lbl('−KF2 Sicherheitsrelais', x, YC + 75, PF + 125);
  }
  // −KF3…−KF6 Koppelrelais 3RQ3 (6,2 mm)
  for (let i = 0; i < 4; i++) {
    const x = -48 + i * 6.4;
    box(6.2, 90, 75, grau, x, YC, PF + 7.5 + 37.5, g);
    box(4.4, 12, 1, new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.4 }), x, YC + 25, PF + 83, g);
    anschliessen([x], YC + 45, YC - 45, PF + 60, FARBE.dc);
  }
  lbl('−KF3…−KF6 Koppelrelais', -38, YC + 72, PF + 90);

  // ===== Reihe D (Schiene y = 760): Reihenklemmen 8WH (5,2 mm) =====
  const YD = 760;
  schiene(YD, -290, 290);
  const klForm = new THREE.Shape();
  [[0, -29], [30, -29], [30, -21], [40, -14], [46, -8], [46, 8], [40, 14], [30, 21], [30, 29], [0, 29]].forEach(([zz, yy], i) => i ? klForm.lineTo(zz, yy) : klForm.moveTo(zz, yy));
  const klGeo = new THREE.ExtrudeGeometry(klForm, { depth: 5, bevelEnabled: false });
  klGeo.translate(0, 0, -2.5); klGeo.rotateY(-Math.PI / 2);                      // Shape-x → z (Tiefe), Extrusion → x
  const klemmen = [];
  let kx = -280, gruppenNr = 0;
  const gruppe = (name, typen) => {
    const x0 = kx;
    box(9, 40, 38, M.anthrazit, kx + 4.5, YD, PF + 7.5 + 19, g); kx += 10;       // Endhalter
    typen.forEach((t) => { klemmen.push([kx + 2.6, t]); kx += 5.2; });
    box(1.8, 56, 44, grau, kx + 0.9, YD, PF + 7.5 + 22, g); kx += 2;           // Abschlussplatte
    box(kx - x0 - 12, 5, 5, weiss, (x0 + kx) / 2 + 3, YD + 2, PF + 7.5 + 48.5, g); // Markierungsträger
    lbl(name, (x0 + kx) / 2, YD + 45 + (gruppenNr++ % 2) * 22, PF + 60);
    kx += 8;
  };
  gruppe('−X1 400 V', ['g', 'g', 'g', 'b', 'pe', 'pe']);
  gruppe('−X2 24 V DC', ['g', 'g', 'g', 'g', 'b', 'b', 'b', 'b']);
  gruppe('−X3 Eingänge', Array(16).fill('g'));
  gruppe('−X4 Ausgänge', Array(16).fill('g'));
  gruppe('−X5 Feld', ['g', 'g', 'g', 'g', 'b', 'b', 'pe', 'pe']);
  const kFarben = { g: 0xa9aeb2, b: 0x2f6fb5, pe: 0x3fae49 };
  for (const [typ, farbe] of Object.entries(kFarben)) {
    const liste = klemmen.filter(k => k[1] === typ);
    const im = new THREE.InstancedMesh(klGeo, new THREE.MeshStandardMaterial({ color: farbe, roughness: 0.5 }), liste.length);
    liste.forEach(([x], i) => { dummy.position.set(x, YD, PF + 7.5); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); });
    im.castShadow = true; im.receiveShadow = true; g.add(im);
    if (typ === 'pe') for (const [x] of liste) box(5.2, 5, 30.4, M.gelb, x, YD + 12, PF + 7.5 + 15.2, g);
    // Federkraftanschlüsse (Betätigungsöffnungen)
    const off = new THREE.InstancedMesh(cached('klOff', () => new THREE.BoxGeometry(2.6, 4, 1)), M.schwarz, liste.length * 2);
    liste.forEach(([x], i) => { for (const s of [0, 1]) { dummy.position.set(x, YD + (s ? 17 : -17), PF + 7.5 + 35.6); dummy.updateMatrix(); off.setMatrixAt(2 * i + s, dummy.matrix); } });
    g.add(off);
  }
  klemmen.forEach(([x, t]) => {
    const f = t === 'b' ? FARBE.dc : t === 'pe' ? FARBE.pe : FARBE.dc;
    draht(f, x, YD + 29, kanalUeber(YD), PF + 33);
    draht(t === 'pe' ? FARBE.pe : FARBE.dc, x, YD - 29, kanalUnter(YD), PF + 33);
  });
  // Querbrücken (rot +24 V, blau 0 V)
  const xs = (i0, i1) => [klemmen[i0][0], klemmen[i1][0]];
  for (const [[a, b], m] of [[xs(6, 9), M.rot], [xs(10, 13), new THREE.MeshStandardMaterial({ color: 0x2f6fb5, roughness: 0.5 })]]) box(b - a + 4, 3, 3, m, (a + b) / 2, YD, PF + 7.5 + 42, g);
  // Rollenkurve −MA6: Wendekombination −QA10/−QA11 (3RT2015, mechanisch verriegelt) und Motorschutz −FA7 rechts neben den Klemmen
  {
    const sch = (x, key) => {
      box(45, 57.5, 50, grau, x, YD, PF + 7.5 + 25, g);
      box(36, 40, 23, grau, x, YD, PF + 7.5 + 61.5, g);
      platte(tafel('3rt' + key, 36, 40, (c) => {
        c.fillStyle = '#c3c7ca'; c.fillRect(0, 0, 36, 40);
        text(c, 'SIEMENS', 2, 5, 3, '#00877c', 700);
        c.fillStyle = '#f1f2ef'; c.fillRect(3, 24, 30, 12);
        text(c, key, 5, 32, 4, '#222', 700);
        text(c, '3RT2015-1BB41', 2, 21, 2.2, '#333', 500);
      }), 36, 40, g, x, YD, PF + 80.6);
      const anzeige = box(8, 5, 2, M.schwarz, x + 10, YD + 7, PF + 81.5, g);
      for (const dx of [-14, 0, 14]) { schraube(x + dx, YD + 24, PF + 58.5); schraube(x + dx, YD - 24, PF + 58.5); }
      anschliessen([x - 14, x, x + 14], YD + 29, YD - 29, PF + 50, FARBE.ac);
      return anzeige;
    };
    SCHRANK.qa.push(sch(150, 'QA10'), sch(198, 'QA11'));
    box(3, 44, 66, M.kunststoff, 174, YD, PF + 7.5 + 33, g);                     // mechanische Verriegelung 3RA2924
    lbl('−QA10/−QA11 Wendekombination Rollenkurve', 174, YD - 62, PF + 90);
    const x = 258;                                                               // −FA7 Motorschutz 3RV2 (vereinfacht)
    box(45, 97, 70, grau, x, YD, PF + 7.5 + 35, g);
    box(45, 60, 27, grau, x, YD, PF + 7.5 + 83.5, g);
    zyl(13, 6, M.schwarz, x, YD - 4, PF + 100.5, 'z', g, 28);
    box(4, 22, 3, M.schwarz, x, YD - 4, PF + 104.5, g);
    for (const dx of [-15, 0, 15]) { schraube(x + dx, YD + 41, PF + 71); schraube(x + dx, YD - 41, PF + 71); }
    anschliessen([x - 15, x, x + 15], YD + 48, YD - 48, PF + 60, FARBE.ac);
    lbl('−FA7 Motorschutz Rollenkurve', x, YD + 70, PF + 100);
  }

  // ===== PE-Schiene, Schirmschiene mit Zugentlastung =====
  box(420, 14, 6, new THREE.MeshStandardMaterial({ color: 0xc87533, metalness: 0.9, roughness: 0.3 }), 0, 450, PF + 25, g);
  for (const x of [-200, 200]) box(16, 24, 22, M.kunststoff, x, 450, PF + 11, g);
  for (let x = -180; x <= 180; x += 30) { zyl(3, 5, M.stahl, x, 450, PF + 30.5, 'z', g, 6); draht(FARBE.pe, x, 457, 600, PF + 33); }
  lbl('−XPE Schutzleiterschiene', 0, 485, PF + 40);
  box(420, 10, 10, M.verzinkt, 0, 230, PF + 40, g);
  for (const x of [-200, 200]) box(16, 30, 30, M.kunststoff, x, 230, PF + 15, g);
  [M.kabelGrau, M.kabel, M.kabelOrange, M.kabelGrau, M.kabel, M.kabelGrau, M.kabelOrange, M.kabelGrau, M.kabel, M.kabelGrau].forEach((mat, i) => {
    const x = -180 + i * 40;
    box(16, 12, 16, M.stahl, x, 240, PF + 50, g);                                 // Schirmklammer
    ab.add([[x, 104, PF + 50], [x, 330, PF + 50]], mat, 4.5, 10);                 // Leitung von unten durch Bodenblech bis in den Kanal
  });
  lbl('Schirmauflage / Zugentlastung', 0, 275, PF + 60);
  // Eingeführte Leitungen von oben (Gitterrinne): durch die Flanschplatte in den linken Senkrechtkanal
  [[M.kabel, -90, 6], [M.kabelGrau, -62, 4.5], [M.kabelGrau, -40, 4.5], [M.kabelGruen, -20, 3.5], [M.kabelOrange, 2, 5], [M.kabelGrau, 22, 4.5]].forEach(([mat, dx, r], i) => {
    zyl(r + 4, 16, M.kunststoff, dx, 2112, -60, null, g, 16);                   // Kabelverschraubung
    zyl(r + 5.5, 4, M.kunststoff, dx, 2098, -60, null, g, 6);                    // Gegenmutter
    ab.add([[dx, 2160, -60], [dx, 2040 - i * 6, -60], [dx, 2040 - i * 6, PF + 30 + i * 8], [-320, 2040 - i * 6, PF + 30 + i * 8], [-320, 1900, PF + 30 + i * 8]], mat, r, 25);
  });

  // Adern erzeugen (Instanzen)
  for (const [farbe, liste] of draehte) {
    const im = new THREE.InstancedMesh(cached('draht', () => new THREE.CylinderGeometry(0.9, 0.9, 1, 6)), new THREE.MeshStandardMaterial({ color: farbe, roughness: 0.5 }), liste.length);
    liste.forEach(([x, y, z, l], i) => { dummy.position.set(x, y, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, l, 1); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); });
    dummy.scale.set(1, 1, 1);
    im.castShadow = true;
    g.add(im);
  }
  ab.fertig();

  // Schaltschrankleuchte (LED, Türkontakt) unter dem Dach
  SCHRANK.leuchte = box(400, 16, 30, new THREE.MeshStandardMaterial({ color: 0xf4f6f8, emissive: 0xffffff, emissiveIntensity: 0 }), 0, 2070, 120, g);
  SCHRANK.licht = new THREE.PointLight(0xffffff, 0, 2.2); SCHRANK.licht.position.set(0, 1900, 150); g.add(SCHRANK.licht);

  // Doppeltür (2 × 400): links Tableau Handbetrieb, rechts SIMATIC HMI TP1200 Comfort
  // Innen: Kontaktelemente, Türkanal, Wellschlauch-Türübergang am Scharnier (folgt der Türbewegung)
  const adernBlau = new THREE.MeshStandardMaterial({ color: FARBE.dc, roughness: 0.5 });
  const tuerSeite = (s) => {                                              // s = −1 links (Scharnier links), +1 rechts
    const t = new THREE.Group(); t.position.set(s * W / 2, 0, D / 2); g.add(t);
    const xm = -s * 200;                                                  // Türmitte in Türkoordinaten
    box(396, 1990, 22, M.blech, -s * 200, 1100, 11, t);
    for (const y of [300, 1100, 1900]) zyl(8, 60, M.anthrazit, -s * 2, y, 11, null, t, 16);   // Scharniere
    box(30, 760, 24, M.pvc, -s * 40, 1170, -12, t);                       // Türkanal am Scharnier (endet vor dem Rahmenprofil)
    const dichtung = new THREE.MeshStandardMaterial({ color: 0x5d6266, roughness: 0.9 });
    for (const sy of [-1, 1]) box(372, 10, 6, dichtung, -s * 200, 1100 + sy * 970, -3, t);   // PU-Dichtung
    for (const dx of [12, 388]) box(10, 1930, 6, dichtung, -s * dx, 1100, -3, t);
    for (const sy of [-1, 1]) box(380, 22, 18, M.blech, -s * 200, 1100 + sy * 960, -9, t); // Türversteifung (Abkantung)
    return { t, xm };
  };
  const L = tuerSeite(-1), R = tuerSeite(1);
  SCHRANK.tueren = [L.t, R.t];
  // Filterlüfter (Zuluft unten links, Abluft oben rechts)
  for (const [tt, xm, y] of [[L.t, L.xm, 420], [R.t, R.xm, 1850]]) {
    box(204, 204, 12, M.blech, xm, y, 28, tt);
    for (let i = 0; i < 12; i++) box(170, 4, 3, M.anthrazit, xm, y - 82 + i * 15, 35, tt);
  }
  // Schwenkhebelgriff an der rechten Tür (Mittelverschluss), Drehriegel links innen
  {
    const griff = mesh(cached('komfortgriff', () => new RoundedBoxGeometry(34, 170, 10, 2, 5)), M.schwarz, R.t); griff.position.set(-34, 1100, 27);
    const hebel = mesh(cached('komfortHebel', () => new RoundedBoxGeometry(26, 120, 12, 2, 4)), M.kunststoff, R.t); hebel.position.set(-34, 1090, 36);
    box(16, 30, 2, M.schwarz, -34, 1060, 42.2, R.t);                                  // Griffmulde
    zyl(7, 3, M.stahl, -34, 1158, 33.5, 'z', R.t, 16);                                // Schließeinsatz (Doppelbart)
    box(1.6, 8, 1, M.schwarz, -34, 1158, 35.2, R.t);
  }
  const blitzTex = canvasTextur(128, 112, (c) => {
    c.fillStyle = '#f2b705'; c.strokeStyle = '#111'; c.lineWidth = 8; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(64, 8); c.lineTo(122, 106); c.lineTo(6, 106); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#111'; c.beginPath(); c.moveTo(70, 34); c.lineTo(48, 72); c.lineTo(64, 72); c.lineTo(54, 98); c.lineTo(82, 60); c.lineTo(66, 60); c.lineTo(76, 34); c.closePath(); c.fill();
  });
  schildPlatte(blitzTex, 90, 79, L.t, L.xm, 1600, 22.3);
  schildPlatte(TEX.schild('−A1  Schaltschrank Zinnbad', '#d5d8d4', '#1b232c', 420, 56), 260, 35, L.t, L.xm, 1720, 22.3);

  // --- Linke Tür: Tableau Handbetrieb ---
  const TAB = V(L.xm, 1180, 22);
  {
    const f = new THREE.Group(); f.position.copy(TAB); L.t.add(f);
    // Platte 260 × 420: Beschriftung mit ≥ 12 mm Abstand unter dem Frontring (Ø38) der Befehlsgeräte
    const TW = 260, TH = 700, ZEILE = (i) => 185 - i * 78, XA = -20, XB = 75;   // 7 Zeilen gleichmäßig verteilt
    box(TW, TH, 3, M.anthrazit, 0, 0, 1.5, f);
    platte(tafel('tuerTableau5', TW, TH, (c) => {
      c.fillStyle = '#c9cdd2'; c.fillRect(0, 0, TW, TH);
      const T = (t, x, y, sz = 10, gw = 600) => tafelText(c, t, x + TW / 2, TH / 2 - y, sz, gw);
      T('HANDBETRIEB  −A1', 0, 326, 12, 700);
      T('AUTO        HAND', -60, 294, 9); T('−SA3', -60, 232, 9, 500); T('Hand aktiv', 60, 232, 9, 500); T('−PF7', 60, 221, 8.5, 500);
      c.strokeStyle = '#7d8790'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(12, TH / 2 - 212); c.lineTo(TW - 12, TH / 2 - 212); c.stroke();
      [['−MM1', 'einhängen', 'lösen'], ['−MM2', 'senken', 'anheben'], ['−MM3', 'zum Bad', 'zum Band'], ['−MM4', 'Bad zu', 'Bad auf'], ['−MM5', 'öffnen', 'schließen'], ['−MM6', 'schließen', 'öffnen'], ['−MM8', 'kippen', 'zurück']].forEach(([z, a, b], i) => {
        const y = ZEILE(i);
        T(z, -100, y - 4, 11, 700); T(a, XA, y - 36, 8.5); T(b, XB, y - 36, 8.5);
      });
    }, 4), TW, TH, f, 0, 0, 3.2);
    const ff = new THREE.Group(); ff.position.z = 3.2; f.add(ff);
    wahlschalter(ff, -60, 268, 'sa3');
    meldeleuchte(ff, 60, 268, 'PF7_Handbetrieb', 0xffae1a);
    const tasten = [['sf11', 'sf12'], ['sf13', 'sf14'], ['sf15', 'sf16'], ['sf17', 'sf18'], ['sf19', 'sf20'], ['sf21', 'sf22'], ['sf28', 'sf29']];
    tasten.forEach(([a, b], i) => { const y = ZEILE(i); drucktaster(ff, XA, y, a, 0xf4f6f8, '|'); drucktaster(ff, XB, y, b, 0x2b2f34, '|'); });
    label('Tableau Handbetrieb (anklickbar)', f, 0, 390, 10, 'klein');
    // Rückseite: Befestigungsadapter + Kontaktelemente, Adern zum Türkanal
    const geraete = [[-60, 268], [60, 268], ...[0, 1, 2, 3, 4, 5, 6].flatMap(i => [[XA, ZEILE(i)], [XB, ZEILE(i)]])];
    for (const [dx, dy] of geraete) {
      const x = TAB.x + dx, y = TAB.y + dy;
      box(30, 30, 8, M.kunststoff, x, y, -4, L.t);                        // Befestigungsadapter
      box(10, 40, 30, grau, x - 6, y, -23, L.t);                          // Kontaktelement 1S
      box(10, 40, 30, grau, x + 6, y, -23, L.t);
      const vy = dx > 0 ? 2.5 : 0;                                       // rechte Gerätespalte: Adern 2,5 mm höher, sonst liegen sie in denen der linken
      for (const dz of [-3, 3]) leitung([[x - 12, y + 14, -23 + dz], [x - 12, y + 26 + vy, -23 + dz], [-L.xm * 0 + 52, y + 26 + vy + dz, -23 + dz]], adernBlau, 0.9, 6, L.t);
    }
  }
  box(320, 420, 24, M.anthrazit, L.xm, 600, -12, L.t);                    // Schaltplantasche
  box(296, 360, 6, weiss, L.xm, 610, -26.5, L.t);

  // --- Rechte Tür: SIMATIC HMI TP1200 Comfort (Front 330 × 241, Einbautiefe 63) ---
  const HMI = V(R.xm, 1330, 22);
  SCHRANK.hmiTex = canvasTextur(800, 500, () => {});            // gezeichnet in 1280 × 800-Koordinaten, skaliert
  {
    const f = new THREE.Group(); f.position.copy(HMI); R.t.add(f);
    box(330, 241, 7, new THREE.MeshStandardMaterial({ color: 0x2c3034, roughness: 0.35, metalness: 0.2 }), 0, 0, 3.5, f);
    platte(tafel('tp1200', 330, 241, (c) => {
      c.fillStyle = '#2c3034'; c.fillRect(0, 0, 330, 241);
      c.fillStyle = '#e8ecef'; c.font = '700 7px Arial'; c.fillText('SIEMENS', 14, 231);
      c.fillStyle = '#9aa3ab'; c.font = '600 5px Arial'; c.textAlign = 'right'; c.fillText('SIMATIC HMI', 316, 231);
    }, 3), 330, 241, f, 0, 0, 7.05);
    const disp = platte(new THREE.MeshBasicMaterial({ map: SCHRANK.hmiTex, toneMapped: false }), 261, 163, f, 0, 9, 7.2);
    disp.receiveShadow = false;
    box(306, 220, 56, M.anthrazit, 0, 0, -28, f);                          // Gehäuse hinter der Tür
    for (const [x, y] of [[-150, 100], [150, 100], [-150, -100], [150, -100]]) box(14, 20, 10, M.kunststoff, x, y, -5, f);   // Spannklemmen
    box(14, 11, 16, M.kunststoff, -100, -114, -36, f);                     // PROFINET X1 P1 (RJ45)
    box(16, 10, 14, M.gelb, -70, -114, -36, f);                            // 24-V-Stecker
    label('HMI TP1200 Comfort −PF10 (PROFINET)', f, 0, 160, 10, 'klein');
    // Leitungen hinten: PROFINET grün, 24 V blau/rot, zum Türkanal am Scharnier (x = +40 in Türkoordinaten)
    const X = HMI.x, Y = HMI.y;
    leitung([[X - 100, Y - 120, -36], [X - 100, Y - 150, -36], [-40, Y - 150, -36], [-40, 1300, -20]], M.kabelGruen, 3, 12, R.t);
    for (const [dx, mat, dy] of [[-73, adernBlau, 0], [-67, new THREE.MeshStandardMaterial({ color: FARBE.rot, roughness: 0.5 }), 2.5]]) leitung([[X + dx, Y - 119, -36], [X + dx, Y - 160 - dy, -36], [-44 + (dx + 70), Y - 160 - dy, -36], [-44 + (dx + 70), 1300, -20]], mat, 1, 8, R.t);   // zwei Höhen, sonst liegen die Adern ineinander
  }
  // Türübergänge: Wellschlauch vom Türkanal (unten) zur Schrankseite, dann in die Senkrechtkanäle
  const welle = new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.75 });
  SCHRANK.uebergang = [[L.t, -1], [R.t, 1]].map(([tt, s]) => {
    const A = V(-s * 40, 890, -13), B = V(s * 368, 860, 150);
    leitung([B, V(B.x, B.y, PF + 50), V(s * 335, B.y, PF + 50)], welle, 9, 20, g);                   // fest: in den Kanal
    const m = mesh(new THREE.BufferGeometry(), welle, g); m.userData.dyn = true;
    return { tt, A, B, m };
  });
  // HMI-Leitungen im Schrank: rechter Kanal → Kanal unter der S7 → CPU X1 P2
  ab.add([[335, 870, PF + 52], [320, 870, PF + 52], [320, 1250, PF + 52], [cpuX + 28, 1250, PF + 52], [cpuX + 28, YB - MH / 2 - 14, PF + 52], [cpuX + 28, YB - MH / 2 - 14, MZ + 100], [cpuX + 28, YB - MH / 2 - 4, MZ + 100]], M.kabelGruen, 3, 14);
  box(14, 10, 16, M.kunststoff, cpuX + 28, YB - MH / 2 - 5, MZ + 100, g);              // RJ45 X1 P2
  lbl('PROFINET X1 P2 → HMI', cpuX + 28, YB - MH / 2 - 40, MZ + 110);
  label('Schaltschrank −A1', g, 0, 2230, 200, 'cyl');
}
export function schrankAktualisieren(dt) {
  SCHRANK.auf += Math.max(-dt * 1.4, Math.min(dt * 1.4, SCHRANK.ziel - SCHRANK.auf));
  const e = SCHRANK.auf * SCHRANK.auf * (3 - 2 * SCHRANK.auf);
  SCHRANK.tueren[0].rotation.y = -1.75 * e;
  SCHRANK.tueren[1].rotation.y = 1.75 * e;
  if (Math.abs(e - SCHRANK.tuerE) > 1e-4) {
    // Wellschlauch-Türübergang folgt der Tür
    SCHRANK.tuerE = e;
    SCHRANK.g.updateMatrixWorld(true);
    for (const u of SCHRANK.uebergang) {
      const a = SCHRANK.g.worldToLocal(u.tt.localToWorld(u.A.clone()));
      const innen = V(0, 0, -1).applyQuaternion(u.tt.quaternion);
      // Schlauch läuft dicht am Scharnier vorbei (dort bewegt sich die Tür am wenigsten)
      const sx = Math.sign(u.B.x), scharnier = V(sx * (400 - 30), 835, 200 - 12);
      const k = new THREE.CatmullRomCurve3([a, a.clone().addScaledVector(innen, 22).add(V(0, -20, 0)), scharnier, u.B.clone().add(V(0, -15, 22)), u.B], false, 'centripetal');
      rohrNeu(u.m, k, 40, 9, 10);
    }
  }
  SCHRANK.hmiTakt -= dt;
  if (SCHRANK.hmiTakt <= 0) { SCHRANK.hmiTakt = 1; hmiZeichnen(); }
  SCHRANK.licht.intensity = 0.9 * e;
  SCHRANK.licht.visible = e > 0.01;                                     // aus = nicht im Shader (spart Rechenzeit je Pixel)
  SCHRANK.leuchte.material.emissiveIntensity = 1.2 * e;
  const sichtbar = SCHRANK.auf > 0.6;
  for (const d of SCHRANK.labels) d.hidden = !sichtbar;
  // Schaltstellungsanzeige der Schütze (gelb = angezogen), Reihenfolge wie SCHRANK.qa: QA1 QA2 QA3 QA5 QA6 QA7 QA12 QA13 QA10 QA11
  const an = [BAND.wende > 0 || BAND.v > 1, BAND.wende < 0 || BAND.v < -1, st.kf2 && (st.betriebBad === 'sps' || st.heizung), BAND2.wende > 0 || BAND2.v > 1, BAND2.wende < 0 || BAND2.v < -1, BAND2.pumpe > 0.5, MULDE.wende > 0 || MULDE.v > 1, MULDE.wende < 0 || MULDE.v < -1, KURVE.wende > 0 || KURVE.v > 1, KURVE.wende < 0 || KURVE.v < -1];
  SCHRANK.qa.forEach((m, i) => { m.material = an[i] ? M.gelb : M.schwarz; });
  // Halbleiterrelais: Dauer-Ein beim Aufheizen, an der Sollwertgrenze taktet der Regler langsam (Schwingungspaketsteuerung)
  SCHRANK.tb1Led.emissiveIntensity = st.heizU ? 1.8 : 0;
}
// Prozessbild auf dem HMI TP1200 Comfort (1280 × 800)
const SCHRITT_TEXT = ['', 'Grundstellung', 'MM1 einhängen', 'MM2 anheben', 'MM3 zum Bad', 'Bad öffnen', 'Tauchen', 'Abtropfen', 'Zum Band / Bad zu', 'Absenken', 'Korb lösen'];
function hmiZeichnen() {
  const c = SCHRANK.hmiTex.userData.canvas, x = c.getContext('2d');
  x.setTransform(800 / 1280, 0, 0, 500 / 800, 0, 0);
  const E = eingang, A = ausgang;
  x.fillStyle = '#e9edf1'; x.fillRect(0, 0, 1280, 800);
  x.fillStyle = '#1f3b57'; x.fillRect(0, 0, 1280, 70);
  x.fillStyle = '#fff'; x.font = '600 34px Arial'; x.textAlign = 'left'; x.fillText('Zinnbad – Übersicht', 24, 47);
  x.textAlign = 'right'; x.font = '500 28px Arial'; x.fillText(new Date().toLocaleTimeString('de-DE'), 1256, 46);
  const feld = (tx, ty, w, h, titel) => { x.fillStyle = '#fff'; x.fillRect(tx, ty, w, h); x.strokeStyle = '#b8c2cc'; x.lineWidth = 2; x.strokeRect(tx, ty, w, h); x.fillStyle = '#4a5866'; x.font = '600 22px Arial'; x.textAlign = 'left'; x.fillText(titel, tx + 14, ty + 30); };
  const lampe = (lx, ly, an, farbe = '#2fb35c') => { x.fillStyle = an ? farbe : '#c9d1d8'; x.beginPath(); x.arc(lx, ly, 13, 0, 7); x.fill(); x.strokeStyle = '#7d8a96'; x.lineWidth = 2; x.stroke(); };
  const txt = (t, tx, ty, sz = 24, farbe = '#1b232c', gw = 500, ausr = 'left') => { x.fillStyle = farbe; x.font = `${gw} ${sz}px Arial`; x.textAlign = ausr; x.fillText(t, tx, ty); };
  // Betriebsart
  feld(20, 90, 400, 300, 'Betrieb');
  const hand = E('SA3_Handbetrieb'), auto = E('SA1_Dauerbetrieb');
  txt(hand ? 'HAND (Schaltschrank)' : auto ? 'AUTOMATIK' : 'EINZELZYKLUS', 40, 160, 34, hand ? '#c27a00' : '#1f3b57', 700);
  lampe(55, 210, A('PF1_Automatik')); txt('Anlage läuft', 85, 219);
  lampe(55, 255, E('BG11_Korb')); txt('Korb am Übergabeplatz', 85, 264);
  txt(st.modus === 'demo' ? `Schritt ${demo.schritt}: ${SCHRITT_TEXT[demo.schritt] || ''}` : 'Schritt: siehe SPS', 40, 315, 26, '#1b232c', 600);
  txt(`Verzinnt: ${st.verzinnt}`, 40, 360, 26);
  // Zinnbad
  feld(440, 90, 400, 300, 'Zinnbad');
  const T = E('BT1_Temperatur') / 27648 * 400, F = E('BL1_Fuellstand') / 27648 * 100;
  txt(`${T.toFixed(0)} °C`, 460, 175, 64, T >= TEMP_SOLL ? '#c0392b' : '#c27a00', 700);
  txt(`Füllstand ${F.toFixed(0)} %`, 460, 230, 28, F < FUELL_MIN ? '#c0392b' : '#1b232c', 600);
  x.fillStyle = '#d9e0e6'; x.fillRect(460, 255, 360, 26); x.fillStyle = '#8b97a3'; x.fillRect(460, 255, 3.6 * Math.min(100, F), 26);
  lampe(475, 320, st.heizU, '#e5532b'); txt('Heizung −TB1', 505, 329);
  lampe(475, 360, E('BG9_Temperatur')); txt('−BG9 ok', 505, 369);
  lampe(680, 320, st.betriebBad === 'sps'); txt('SPS regelt', 710, 329, 22);
  lampe(680, 360, E('BG10_Fuellhoehe')); txt('−BG10 ok', 710, 369, 22);
  // Endlagen
  feld(860, 90, 400, 300, 'Endlagen');
  [['MM1', 'BG1_MM1_eingehaengt', 'BG2_MM1_geloest', 'ein', 'gelöst'], ['MM2', 'BG3_MM2_oben', 'BG4_MM2_unten', 'oben', 'unten'], ['MM3', 'BG5_MM3_Band', 'BG6_MM3_Bad', 'Band', 'Bad'], ['MM4', 'BG7_MM4_offen', 'BG8_MM4_zu', 'auf', 'zu'], ['MM5', 'BG14_MM5_zu', 'BG15_MM5_offen', 'zu', 'auf'], ['MM6', 'BG16_MM6_zu', 'BG17_MM6_offen', 'zu', 'auf']].forEach(([n, a, b, ta, tb], i) => {
    const y = 140 + i * 42;
    txt('−' + n, 880, y + 9, 24, '#1b232c', 700);
    lampe(985, y, E(a), '#e3a100'); txt(ta, 1005, y + 8, 20);
    lampe(1120, y, E(b), '#e3a100'); txt(tb, 1140, y + 8, 20);
  });
  // Band
  feld(20, 410, 1240, 250, 'Förderband');
  x.fillStyle = '#3a4047'; x.fillRect(80, 530, 1120, 34);
  for (const k of koerbe) if (k.zustand === 'band') { const px = 640 + (k.z - 150) / 950 * 560; x.fillStyle = k.fertig ? '#c9cfd5' : '#b8743f'; x.fillRect(px - 36, 480, 72, 50); x.strokeStyle = '#4a5866'; x.strokeRect(px - 36, 480, 72, 50); }
  for (const [sig, t] of [['BG12_Bandanfang', 'BG12'], ['BG11_Korb', 'BG11'], ['BG13_Bandende', 'BG13']]) { const z = LS_POS[sig], px = 640 + (z - 150) / 950 * 560; lampe(px, 588, E(sig), '#e3a100'); txt(t, px, 620, 18, '#1b232c', 600, 'center'); }
  const pfeil = BAND.v > 1 ? '→  vorwärts' : BAND.v < -1 ? '←  rückwärts' : 'Halt';
  txt(`Band: ${pfeil}   ${Math.abs(BAND.v).toFixed(0)} mm/s   Weg ${(BAND.weg / 1000).toFixed(2)} m`, 40, 465, 24, '#1b232c', 600);
  lampe(860, 456, E('SA2_VorOrt'), '#2f7fd0'); txt('Vor-Ort aktiv', 885, 465, 22);
  lampe(1060, 456, st.betriebBand === 'sps', '#2f7fd0'); txt('SPS steuert', 1085, 465, 22);
  const kp = korbAmPyrometer(), b2n = koerbe.filter(k => k.zustand === 'band2').length, kn = koerbe.filter(k => k.zustand === 'kurve').length;
  const ri = (v) => (v > 1 ? '→' : v < -1 ? '←' : 'Halt');
  txt(`Kurve: ${ri(KURVE.v)} ${kn} · Band 2: ${ri(BAND2.v)} ${b2n} · Mulde: ${ri(MULDE.v)} · Kühlplatz ${kp ? fmt0.format(kp.temp) + ' °C' : '–'} · Sprühen ${BAND2.spruehen > 0.5 ? 'EIN' : 'AUS'} · KLT ${ST.klt}/${ST.kltVoll} · Ausschuss ${ST.aus}`, 40, 650, 21, '#1b232c', 600);
  // Meldezeile
  // Not-Halt: Meldekontakte (Öffner, 1 = entriegelt) zeigen, welcher Taster betätigt ist
  const nh = !E('KF2_NotHalt_OK'), betaetigt = NOT_HALT.filter(n => !E(n.signal));
  const nhText = betaetigt.length ? `NOT-HALT ${notHaltText(betaetigt)} – entriegeln und quittieren (${[...new Set(betaetigt.map(n => n.quitt))].join(' / ')})`
    : !E('BG20_Lichtvorhang_frei') ? 'Lichtvorhang −BG20 unterbrochen – Schutzfeld räumen und quittieren (−SF4)' : 'NOT-HALT entriegelt – quittieren (−SF4 oder Vor-Ort −SF41…−SF44)';
  const rot = nh || betaetigt.length > 0;
  x.fillStyle = rot ? '#c0392b' : st.letzteStoerung ? '#f6d9a8' : '#dfe6ec'; x.fillRect(0, 680, 1280, 120);
  if (rot) txt(nhText, 24, 750, betaetigt.length > 2 ? 22 : 30, '#fff', 600);
  else txt(st.letzteStoerung ? `${st.letzteStoerung.zeit}  ${st.letzteStoerung.text}` : 'Keine Störung', 24, 750, 30, '#1b232c', 600);
  SCHRANK.hmiTex.needsUpdate = true;
}
// Kanal-LEDs der DI/DQ-Baugruppen aus den Signalen (Adresse %I/%Q Byte.Bit)
const adrCache = new Map();
function adrIndex(a) {
  if (!adrCache.has(a)) { const m = /^%?\s*([IQEA])\s*(\d+)\.([0-7])$/i.exec(a || ''); adrCache.set(a, m ? +m[2] * 8 + +m[3] : -1); }
  return adrCache.get(a);
}
let cpuTakt = 0;
export function spsLedsAktualisieren(dt) {
  if (SCHRANK.auf < 0.05) return;
  const di = new Array(96).fill(false), dq = new Array(64).fill(false);
  for (const s of SIGNALE) {
    const i = adrIndex(s.adresse);
    if (i < 0 || i > 95 || (s.richtung !== 'eingang' && i > 63)) continue;
    if (s.richtung === 'eingang') di[i] = !!eingang(s.name); else dq[i] = ausgang(s.name);
  }
  SCHRANK.diLeds.forEach((m, i) => { m.emissiveIntensity = di[i] ? 2 : 0; });
  SCHRANK.dqLeds.forEach((m, i) => { m.emissiveIntensity = dq[i] ? 2 : 0; });
  const run = st.modus === 'demo' || (st.plcVerbunden && st.plcZustand === 'Run');
  SCHRANK.cpuLeds.run.emissive.setHex(run ? 0x22dd55 : 0xffb000);
  SCHRANK.cpuLeds.run.emissiveIntensity = 1.8;
  cpuTakt -= dt;
  if (cpuTakt > 0) return;
  cpuTakt = 0.5;
  // Display CPU 1516 (320 x 240): Kopfzeile, Betriebszustand, Menüsymbole
  const c = SCHRANK.cpuTex.userData.canvas, x = c.getContext('2d');
  const zust = st.modus === 'demo' ? 'RUN' : (run ? 'RUN' : 'STOP');
  x.fillStyle = '#f2f4f5'; x.fillRect(0, 0, 320, 240);
  x.fillStyle = '#2d6f8f'; x.fillRect(0, 0, 320, 44);
  x.fillStyle = '#fff'; x.font = '600 22px Arial'; x.textAlign = 'left'; x.fillText('PLC_Zinnbad', 12, 30);
  x.textAlign = 'right'; x.font = '500 18px Arial'; x.fillText(new Date().toLocaleTimeString('de-DE').slice(0, 5), 308, 29);
  x.fillStyle = run ? '#1f9a4c' : '#e39b00'; x.fillRect(12, 58, 296, 58);
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = '700 38px Arial'; x.fillText(zust, 160, 101);
  x.fillStyle = '#1b232c'; x.font = '500 17px Arial'; x.fillText(st.modus === 'demo' ? 'Demo: Steuerung im Browser' : 'PLCSIM Advanced', 160, 142);
  const symb = ['Übersicht', 'Diagnose', 'Einstell.', 'Module', 'Display'];
  symb.forEach((t, i) => {
    const xx = 12 + i * 60;
    x.fillStyle = i === 0 ? '#2d6f8f' : '#cfd6db'; x.fillRect(xx, 162, 52, 48);
    x.fillStyle = i === 0 ? '#fff' : '#41505c'; x.fillRect(xx + 18, 174, 16, 20);
    x.fillStyle = '#41505c'; x.font = '500 11px Arial'; x.fillText(t, xx + 26, 226);
  });
  SCHRANK.cpuTex.needsUpdate = true;
}
