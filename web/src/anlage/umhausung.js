import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { box, cached, mesh, zyl } from '../core/geometrie.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { label, platte, tafel } from '../core/beschriftung.js';
import { profil, stellfuss } from '../bauteile/aluprofil.js';
import { LICHTVORHANG, PULT_TASTER } from './register.js';
import { werkerLaden } from './werker.js';
import { LV, UMH, ZAUN } from './halle.js';
import { paneel, schutzzaun, zaunTuer } from '../bauteile/schutzzaun.js';

// Schutztür hinten: Flügel (dreht um das Scharnier), LEDs am Zuhaltemodul, Klickflächen
export const TUER = { fluegel: null, ledVerriegelt: null, ledOffen: null, klick: [] };
import { dummy } from './pneumatik.js';

// ----------------------------------------------------------------------------
// Schutzzaun mit Tür, Lichtvorhang, Signalsäule
// ----------------------------------------------------------------------------
{
  const { x0, x1, z0, z1, h } = UMH;
  // Schutzgitterzaun (schutzzaun.js) statt Umhausung: links, hinten und rechts um Portal und Zinnbad, rechts weiter
  // hinter Band 2 bis zur Ausschussbox. Hinten ein Durchlass für Band 1 mit Antrieb −MA1 (Paneel darüber) und die
  // Schutztür mit Sicherheitsschalter und Zuhaltung −BG41. Vorn schließt der Lichtvorhang −BG20 an.
  schutzzaun([[x0, 560], [x0, z0], [ZAUN.durchlass[0], z0]]);
  paneel(ZAUN.durchlass[0], z0, ZAUN.durchlass[1], z0, 800);                                // über dem Banddurchlass
  schutzzaun([[ZAUN.durchlass[1], z0], [ZAUN.tuer[0], z0]]);
  Object.assign(TUER, zaunTuer(ZAUN.tuer[0], ZAUN.tuer[1], z0));
  for (const k of TUER.klick) { k.userData = { art: 'tuer' }; PULT_TASTER.push({ key: 'tuer', kappe: k, art: 'hit' }); }
  label('Schutztür, Sicherheitsschalter mit Zuhaltung −BG41, Türanforderung −SF49', anlage, ZAUN.tuer[1] - 60, 2150, z0 - 40, 'klein');
  schutzzaun([[ZAUN.rechts, z0], [ZAUN.rechts, ZAUN.hinterBand2], [ZAUN.ende, ZAUN.hinterBand2], [ZAUN.ende, ZAUN.kamera]]);
  // Lichtvorhang an der Front
  // Sicherheitslichtvorhang −BG20 (Sender/Empfänger), Schutzfeld 450…1650 mm über dem Band (Band und Körbe darunter)
  // Lichtvorhang −BG20: zwei Systeme mit Umlenkspiegel (Pfade in halle.js, LV). Bauart SICK deTec4 Core (gelbes
  // Strangpressprofil, rotes Frontfenster zur Gegenstelle) auf Gerätesäule, Umlenkspiegelsäule SICK PNS.
  const lvGelb = new THREE.MeshStandardMaterial({ color: 0xf2c200, roughness: 0.45, metalness: 0.05 });
  const fenster = new THREE.MeshStandardMaterial({ color: 0x301010, emissive: 0xff2a1f, emissiveIntensity: 0.25, roughness: 0.1 });
  const spiegelMat = new THREE.MeshStandardMaterial({ color: 0xdfe8ee, metalness: 1, roughness: 0.05 });
  const fuss = (g) => {                                                                     // Fußplatte mit Schwerlastdübeln
    box(160, 8, 160, M.anthrazit, 0, 4, 0, g);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) zyl(6, 4, M.stahl, sx * 62, 10, sz * 62, null, g, 6);
  };
  const gruppe = ([x, z], richtung) => {                                                    // lokal +z = richtung
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(richtung[0], richtung[1]); anlage.add(g); return g;
  };
  const geraet = (pos, richtung, sender) => {                                                // Sender/Empfänger, Frontfenster in Richtung
    const g = gruppe(pos, richtung); fuss(g);
    box(60, 1800, 60, M.alu, 0, 908, -45, g);                                               // Gerätesäule hinter dem Gerät
    box(64, 12, 64, M.kunststoff, 0, 1814, -45, g);
    const saeule = box(40, 1500, 36, lvGelb, 0, 950, 0, g);
    saeule.userData = { art: 'lichtvorhang' };
    PULT_TASTER.push({ key: 'lv', kappe: saeule, art: 'hit' });
    box(42, 30, 38, M.kunststoff, 0, 185, 0, g); box(42, 30, 38, M.kunststoff, 0, 1715, 0, g);
    box(30, 1440, 4, fenster, 0, 950, 18.5, g).castShadow = false;
    for (const y of [420, 1480]) box(30, 24, 30, M.verzinkt, 0, y, -27, g);               // Schwenkhalter an der Säule
    const led = new THREE.MeshStandardMaterial({ color: 0x113311, emissive: 0x22dd55, emissiveIntensity: 1.6 });
    box(10, 10, 4, led, 0, 1680, 19, g); LICHTVORHANG.leds.push(led);
    zyl(6, 14, M.stahl, 0, 163, 0, null, g, 14);                                            // M12-Anschluss unten
    platte(tafel('deTec4' + (sender ? 'S' : 'E'), 30, 12, (c) => { c.fillStyle = '#f2c200'; c.fillRect(0, 0, 30, 12); c.fillStyle = '#1a4b9b'; c.font = '700 5px Arial'; c.fillText('SICK', 1.5, 5.6); c.fillStyle = '#222'; c.font = '600 3.2px Arial'; c.fillText('deTec4', 15, 5.4); c.fillText(sender ? 'Sender' : 'Empfänger', 1.5, 10.5); }, 10), 30, 12, g, 0, 1630, 18.7);
  };
  // Umlenkspiegelsäule SICK PM4-A192110000000 nach Datenblatt/Maßzeichnung: runde Grundplatte Ø 195 mit drei Bodenankern
  // (120°), Stellschrauben und Libelle, Ausrichtplatte mit Feinjustierrad (PA6) und Marken −45°/0°/45°, Säulenprofil
  // 136 × 75,7 (L1 = 1864, Alu pulverbeschichtet) mit durchgehendem Spiegel 125 × 1852 (L3) in der flachen Front,
  // abnehmbare Endkappe (ABS); Gesamthöhe L2 = 1924,5. Die Säule ist so gedreht, dass die Spiegelnormale (lokal +z)
  // die Winkelhalbierende der Strahlen ist; die Spiegelfläche liegt auf der Strahlachse.
  const PM4 = { b: 136, t: 75.7, L1: 1864, L2: 1924.5, L3: 1852, grund: 20, ausricht: 13.4 };
  const pm4Mat = new THREE.MeshStandardMaterial({ color: 0xd6d8d9, roughness: 0.5, metalness: 0.15 });   // pulverbeschichtet hellgrau
  const pm4Profil = cached('pm4Profil', () => {
    // Querschnitt: flache Spiegelseite vorn (z = 0), Rücken mit großen Radien, Spiegelnut 125 breit
    const { b, t } = PM4, r = 24, s2 = new THREE.Shape();
    s2.moveTo(-b / 2, 0); s2.lineTo(-62.5, 0); s2.lineTo(-62.5, -2); s2.lineTo(62.5, -2); s2.lineTo(62.5, 0); s2.lineTo(b / 2, 0);
    s2.lineTo(b / 2, -t + r); s2.quadraticCurveTo(b / 2, -t, b / 2 - r, -t); s2.lineTo(-b / 2 + r, -t); s2.quadraticCurveTo(-b / 2, -t, -b / 2, -t + r); s2.closePath();
    const geo = new THREE.ExtrudeGeometry(s2, { depth: PM4.L1, bevelEnabled: false, curveSegments: 6 });
    geo.rotateX(-Math.PI / 2);                                                               // Extrusion → +y, Form-y → −z
    geo.scale(1, 1, -1);                                                                    // Spiegelseite nach +z
    return geo;
  });
  const spiegel = (pos, rein, raus) => {
    const n = [raus[0] - rein[0], raus[1] - rein[1]], l = Math.hypot(...n), g = gruppe(pos, [n[0] / l, n[1] / l]);
    const y0 = PM4.grund + PM4.ausricht, zm = -PM4.t / 2;                                   // Profilunterkante, Säulenmitte (Drehachse)
    zyl(97.5, PM4.grund, pm4Mat, 0, PM4.grund / 2, zm, null, g, 40);                         // Grundplatte Ø 195
    for (let i = 0; i < 3; i++) {
      const w = Math.PI / 2 + i * 2 * Math.PI / 3, x = Math.cos(w) * 78, z = zm + Math.sin(w) * 78;
      zyl(6.8, 4, M.stahl, x, PM4.grund + 2, z, null, g, 6);                                // Bodenanker (Bohrung Ø 13,7)
      const w2 = w + Math.PI / 3; zyl(4, 8, M.stahl, Math.cos(w2) * 82, PM4.grund + 4, zm + Math.sin(w2) * 82, null, g, 6);   // Stellschrauben
    }
    zyl(6, 3, M.kunststoff, -60, PM4.grund + 1.5, zm - 45, null, g, 16);                     // Libelle
    zyl(72, PM4.ausricht, pm4Mat, 0, PM4.grund + PM4.ausricht / 2, zm, null, g, 40);          // Ausrichtplatte
    zyl(16, 12, M.kunststoff, 80, PM4.grund + 7, zm, null, g, 20);                           // Feinjustierrad (PA6)
    for (const w of [-Math.PI / 4, 0, Math.PI / 4]) box(1.2, 0.6, 8, M.schwarz, Math.sin(w) * 68, y0 + 0.3, zm + Math.cos(w) * 68, g);   // Marken −45°/0°/45°
    mesh(pm4Profil, pm4Mat, g).position.y = y0;                                               // Säulenprofil
    box(125, PM4.L3, 1.5, spiegelMat, 0, y0 + PM4.L1 / 2, -1.2, g).castShadow = false;        // Spiegel in der Nut
    mesh(cached('pm4Kappe', () => new RoundedBoxGeometry(PM4.b + 2, PM4.L2 - PM4.L1 - y0, PM4.t + 2, 2, 6)), M.kunststoff, g)
      .position.set(0, y0 + PM4.L1 + (PM4.L2 - PM4.L1 - y0) / 2, zm);                       // Endkappe (ABS)
    platte(tafel('pm4', 40, 10, (c) => { c.fillStyle = '#d6d8d9'; c.fillRect(0, 0, 40, 10); c.fillStyle = '#1a4b9b'; c.font = '700 5px Arial'; c.fillText('SICK', 2, 7); c.fillStyle = '#222'; c.font = '600 3.4px Arial'; c.fillText('PM4', 22, 7); }, 10), 40, 10, g, 0, y0 + 60, -PM4.t - 0.3, Math.PI);
    label('Umlenkspiegelsäule SICK PM4', g, 0, 2050, 0, 'klein');
  };
  const richtung = (a, b) => { const d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(...d); return [d[0] / l, d[1] / l]; };
  const schenkel = [];
  for (const pfad of LV.systeme) {
    for (let i = 0; i + 1 < pfad.length; i++) schenkel.push([pfad[i], pfad[i + 1]]);
    geraet(pfad[0], richtung(pfad[0], pfad[1]), true);
    for (let i = 1; i + 1 < pfad.length; i++) spiegel(pfad[i], richtung(pfad[i - 1], pfad[i]), richtung(pfad[i], pfad[i + 1]));
    const e = pfad.length - 1; geraet(pfad[e], richtung(pfad[e], pfad[e - 1]), false);
  }
  // Strahlen je Schenkel (Raster 30 mm), beim Eingriff ausgeblendet
  const strahlen = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.8, 0.8, 1, 4), new THREE.MeshBasicMaterial({ color: 0xff3b2f, transparent: true, opacity: 0.07, depthWrite: false }), LV.n * schenkel.length);
  let n = 0;
  for (const [[ax, az], [bx, bz]] of schenkel) for (let i = 0; i < LV.n; i++) {
    dummy.position.set((ax + bx) / 2, LV.y0 + i * LV.dy, (az + bz) / 2);
    dummy.rotation.set(az === bz ? 0 : Math.PI / 2, 0, az === bz ? Math.PI / 2 : 0); dummy.scale.set(1, Math.hypot(bx - ax, bz - az), 1);
    dummy.updateMatrix(); strahlen.setMatrixAt(n++, dummy.matrix);
  }
  dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1);
  anlage.add(strahlen); LICHTVORHANG.strahlen = strahlen; LICHTVORHANG.n = n;
  werkerLaden();
  label('Lichtvorhang −BG20 (anklicken = Person geht durch)', anlage, LV.systeme[0][0][0], 1990, LV.systeme[0][0][1], 'klein');
}
// Signalsäule auf dem vorderen linken Zaunpfosten
export const SAEULE = [];
{
  // Bauart WERMA KombiSIGN 71 (Ø 70 mm) auf dem vorderen linken Zaunpfosten: Fuß mit Aluminiumrohr, Anschlusselement, Fresnel-Lichtelemente, Abdeckkappe
  const g = new THREE.Group(); g.position.set(UMH.x0, 2014, 560); anlage.add(g);                      // auf dem vorderen linken Zaunpfosten
  const dreh = (key, pkte, seg = 24) => cached(key, () => new THREE.LatheGeometry(pkte.map(([r, y]) => new THREE.Vector2(r, y)), seg));
  box(70, 6, 70, M.kunststoff, 0, 3, 0, g);                                               // Montagefuß
  mesh(dreh('ksFuss', [[0, 6], [34, 6], [35, 10], [24, 26], [14, 30], [0, 30]]), M.kunststoff, g);
  zyl(12.5, 60, M.alu, 0, 60, 0, null, g, 16);                                            // Rohr Ø 25
  mesh(dreh('ksAnschluss', [[0, 90], [30, 90], [35, 93], [35, 112], [33, 114], [0, 114]]), M.kunststoff, g);
  // Fresnel-Lichtelement: gerippte Linse 53 mm hoch, Rastring grau
  const linse = dreh('ksLinse', (() => { const p = [[0, 0], [33.5, 0]]; for (let y = 3; y <= 50; y += 3.2) p.push([34.6, y], [33.8, y + 1.6]); p.push([33.5, 53], [0, 53]); return p; })());
  [['PF1_Automatik', 0x2fd36b], ['PF4_Korb', 0xffb01a], ['PF3_Fuellhoehe', 0xff3b2f]].forEach(([sig, farbe], i) => {
    const mat = new THREE.MeshStandardMaterial({ color: farbe, transparent: true, opacity: 0.6, roughness: 0.18, emissive: farbe, emissiveIntensity: 0 });
    const m = mesh(linse, mat, g); m.position.y = 114 + i * 58;
    zyl(35, 5, M.pvc, 0, 114 + i * 58 + 55.5, 0, null, g);
    SAEULE.push({ signal: sig, mat });
  });
  mesh(dreh('ksKappe', [[0, 288], [35, 288], [35, 296], [31, 302], [18, 305], [0, 306]]), M.pvc, g);
  label('Signalsäule (PF1 · PF4 · PF3)', g, 0, 350, 0, 'klein');
}
