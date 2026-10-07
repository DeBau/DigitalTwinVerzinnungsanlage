import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { box, cached, mesh, zyl } from '../core/geometrie.js';
import { label, platte, tafel } from '../core/beschriftung.js';
import { profil, stellfuss } from '../bauteile/aluprofil.js';
import { LICHTVORHANG, PULT_TASTER } from './register.js';
import { werkerLaden } from './werker.js';
import { UMH } from './halle.js';
import { dummy } from './pneumatik.js';

// ----------------------------------------------------------------------------
// Umhausung mit Polycarbonat, Lichtvorhang, Signalsäule, Schaltschrank, Bedienpult
// ----------------------------------------------------------------------------
{
  const { x0, x1, z0, z1, h } = UMH;
  // Pfosten durchgehend, Riegel stoßen zwischen den Pfosten an (keine ineinander liegenden Profile – die flackern)
  const xm = (x0 + x1) / 2;
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1], [xm, z0]]) { profil(45, 45, h, 'y', x, h / 2, z); stellfuss(x, z); }
  for (const z of [z0, z1]) profil(45, 45, x1 - x0 + 45, 'x', xm, h + 22.5, z);                         // oberer Rahmen auf den Pfosten, bündig mit den Eckpfosten
  for (const x of [x0, x1]) profil(45, 45, z1 - z0 - 45, 'z', x, h + 22.5, 0);
  for (const [a, b] of [[x0 + 22.5, xm - 22.5], [xm + 22.5, x1 - 22.5]]) profil(45, 45, b - a, 'x', (a + b) / 2, 180, z0);   // Riegel hinten
  for (const x of [x0, x1]) profil(45, 45, z1 - z0 - 45, 'z', x, 180, 0);                               // Riegel seitlich
  // Polycarbonat Rückwand (mit Durchlass für das Band) und Seiten
  const pc = (w, hh, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), M.pc); m.position.set(x, y, z); m.rotation.y = ry; anlage.add(m); };
  pc((x1 - x0) / 2 - 200, h - 210, (x0 + (x0 + x1) / 2 - 200) / 2, 1100, z0, 0);
  pc((x1 - x0) / 2, h - 210, ((x0 + x1) / 2 + x1) / 2, 1100, z0, 0);
  pc(400, h - 760, (x0 + x1) / 2 - 400, 1375, z0, 0);
  pc(z1 - z0, h - 210, x0, 1100, 0, Math.PI / 2);
  pc(z1 - z0, h - 210, x1, 1100, 0, Math.PI / 2);
  // Blech-Sockel
  box(x1 - x0, 160, 2, M.blech, (x0 + x1) / 2 + 0, 90, z0 - 1).scale.x = 1;
  for (const x of [x0, x1]) box(2, 160, z1 - z0, M.blech, x, 90, 0);
  // Lichtvorhang an der Front
  // Sicherheitslichtvorhang −BG20 (Sender/Empfänger), Schutzfeld 450…1650 mm über dem Band (Band und Körbe darunter)
  // Bauart SICK deTec4 Core: Alu-Strangpressprofil gelb pulverbeschichtet, schwarze Endkappen, rotes Frontfenster
  // zur Gegenseite, Status-LEDs oben, Schwenkhalter am Pfosten, Anschluss M12 unten
  const lvGelb = new THREE.MeshStandardMaterial({ color: 0xf2c200, roughness: 0.45, metalness: 0.05 });
  for (const x of [x0 + 45, x1 - 45]) {
    const innen = Math.sign((x0 + x1) / 2 - x);
    const saeule = box(36, 1500, 40, lvGelb, x, 200 + 750, z1);
    saeule.userData = { art: 'lichtvorhang' };
    PULT_TASTER.push({ key: 'lv', kappe: saeule, art: 'hit' });
    box(38, 30, 42, M.kunststoff, x, 185, z1); box(38, 30, 42, M.kunststoff, x, 1715, z1);
    const strip = box(4, 1440, 30, new THREE.MeshStandardMaterial({ color: 0x301010, emissive: 0xff2a1f, emissiveIntensity: 0.25, roughness: 0.1 }), x + innen * 17, 950, z1);
    strip.castShadow = false;
    const led = new THREE.MeshStandardMaterial({ color: 0x113311, emissive: 0x22dd55, emissiveIntensity: 1.6 });
    box(10, 10, 4, led, x, 1680, z1 + 21);
    LICHTVORHANG.leds.push(led);
    for (const y of [420, 1480]) {                                                       // Schwenkhalter
      box(28, 24, 8, M.verzinkt, x - innen * 30, y, z1 - 8);
      zyl(9, 30, M.kunststoff, x - innen * 10, y, z1 - 8, null, anlage, 12);
    }
    zyl(6, 14, M.stahl, x, 163, z1, null, anlage, 14);                                   // M12-Anschluss unten
    platte(tafel('deTec4', 30, 9, (c) => { c.fillStyle = '#f2c200'; c.fillRect(0, 0, 30, 9); c.fillStyle = '#1a4b9b'; c.font = '700 5px Arial'; c.fillText('SICK', 1.5, 5.6); c.fillStyle = '#222'; c.font = '600 3.2px Arial'; c.fillText('deTec4', 15, 5.4); }, 10), 30, 9, anlage, x, 1640, z1 + 20.1);
  }
  const strahlen = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.8, 0.8, x1 - x0 - 130, 4), new THREE.MeshBasicMaterial({ color: 0xff3b2f, transparent: true, opacity: 0.07, depthWrite: false }), 41);
  for (let i = 0; i <= 40; i++) { dummy.position.set((x0 + x1) / 2, 450 + i * 30, z1 + 10); dummy.rotation.set(0, 0, Math.PI / 2); dummy.updateMatrix(); strahlen.setMatrixAt(i, dummy.matrix); }
  dummy.rotation.set(0, 0, 0);
  anlage.add(strahlen); LICHTVORHANG.strahlen = strahlen;
  werkerLaden();
  label('Lichtvorhang −BG20 (anklicken = Person geht durch)', anlage, x0 + 45, 1790, z1, 'klein');
}
// Signalsäule auf dem vorderen linken Pfosten
export const SAEULE = [];
{
  // Bauart WERMA KombiSIGN 71 (Ø 70 mm): Fuß mit Aluminiumrohr, Anschlusselement, Fresnel-Lichtelemente, Abdeckkappe
  const g = new THREE.Group(); g.position.set(UMH.x0, UMH.h + 45, UMH.z1); anlage.add(g);
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
