import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { box, zyl } from '../core/geometrie.js';
import { canvasTextur } from '../core/texturen.js';

// ----------------------------------------------------------------------------
// Schutzgitterzaun industriell (Bauart Axelent X-Guard / Troax): Pfosten 60 × 40 mit Fußplatte und zwei Bodenankern,
// Gitterpaneele mit Rahmen aus Rechteckrohr 20 × 20 und Drahtgitter 20 × 100 mm (Draht Ø 3), alles RAL 9005 schwarz,
// Paneele 150 mm über dem Boden (Reinigung), Oberkante 1950. Paneelbreite höchstens 1500, Feld gleichmäßig geteilt.
// ----------------------------------------------------------------------------
export const H0 = 150, H1 = 1950, PFOSTEN = 2000;
export const schwarz = new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.55, metalness: 0.2 });
const gelb = new THREE.MeshStandardMaterial({ color: 0xf2c200, roughness: 0.45 });
const gitter = canvasTextur(64, 128, (g, w, h) => {
  g.clearRect(0, 0, w, h); g.fillStyle = '#1b1d20';
  g.fillRect(0, 0, 6, h); g.fillRect(0, 0, w, 3);                          // eine Masche 20 × 100 mm je Kachel (32 × 160 → 64 × 128 px)
}, true);
export const GITTER = new THREE.MeshStandardMaterial({ map: gitter, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.2 });

function pfosten(x, z, ry) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; anlage.add(g);
  box(150, 8, 100, schwarz, 0, 4, 0, g);                                   // Fußplatte
  for (const sx of [-1, 1]) zyl(6, 5, M.stahl, sx * 52, 10.5, 0, null, g, 6);   // Bodenanker
  box(60, PFOSTEN, 40, gelb, 0, 8 + PFOSTEN / 2, 0, g);                     // Pfosten (gelb, Paneele schwarz)
  box(62, 6, 42, M.kunststoff, 0, 8 + PFOSTEN + 3, 0, g);                   // Abdeckkappe
}
export function paneel(ax, az, bx, bz, y0 = H0, y1 = H1) {
  const L = Math.hypot(bx - ax, bz - az), g = new THREE.Group();
  g.position.set((ax + bx) / 2, 0, (az + bz) / 2); g.rotation.y = -Math.atan2(bz - az, bx - ax); anlage.add(g);
  const w = L - 60 - 10, h = y1 - y0, ym = (y0 + y1) / 2;                   // 5 mm Luft zu jedem Pfosten
  for (const sy of [-1, 1]) box(w, 20, 20, schwarz, 0, ym + sy * (h / 2 - 10), 0, g);   // Rahmen oben/unten
  for (const sx of [-1, 1]) box(20, h - 40, 20, schwarz, sx * (w / 2 - 10), ym, 0, g);   // Rahmen seitlich
  for (const sx of [-1, 1]) for (const y of h > 800 ? [y0 + 200, y1 - 200] : [ym]) box(16, 40, 30, schwarz, sx * (w / 2 + 5), y, 0, g);   // Befestigungswinkel am Pfosten
  const geo = new THREE.PlaneGeometry(w - 40, h - 40), uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w - 40) / 20, uv.getY(i) * (h - 40) / 100);
  const m = new THREE.Mesh(geo, GITTER); m.position.y = ym; m.receiveShadow = true; g.add(m);
}
// Zaun entlang eines Polygonzugs [[x, z], …] (mm, Anlagenkoordinaten)
export function schutzzaun(pfad, maxBreite = 1500) {
  const punkte = [pfad[0]];
  for (let i = 1; i < pfad.length; i++) {
    const [ax, az] = pfad[i - 1], [bx, bz] = pfad[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / maxBreite));
    for (let k = 1; k <= n; k++) punkte.push([ax + (bx - ax) * k / n, az + (bz - az) * k / n]);
  }
  punkte.forEach(([x, z], i) => {
    const [px, pz] = punkte[Math.min(i + 1, punkte.length - 1)], [qx, qz] = punkte[Math.max(i - 1, 0)];
    pfosten(x, z, -Math.atan2(pz - qz, px - qx));
    if (i) paneel(punkte[i - 1][0], punkte[i - 1][1], x, z);
  });
}
// Drehflügeltür im Zaun zwischen den Pfosten bei xA (Scharnier) und xB (Schließseite) auf der Linie z, öffnet nach −z.
// Sicherheitsschalter mit Zuhaltung (Bauart Euchner MGB2: Zuhaltemodul am Pfosten, Griffmodul mit Riegel am Flügel,
// Bedienmodul mit Türanforderung). Rückgabe: { fluegel, ledVerriegelt, ledOffen, klick[] }
export function zaunTuer(xA, xB, z) {
  const fluegel = new THREE.Group(); fluegel.position.set(xA + 35, 0, z); anlage.add(fluegel);
  const w = xB - xA - 70, h = H1 - H0, ym = (H0 + H1) / 2;
  for (const sy of [-1, 1]) box(w, 30, 20, schwarz, w / 2, ym + sy * (h / 2 - 15), 0, fluegel);   // Rahmen oben/unten
  for (const sx of [0, 1]) box(30, h - 60, 20, schwarz, sx * (w - 15) + (sx ? 0 : 15), ym, 0, fluegel);   // Rahmen seitlich
  box(w - 60, 30, 20, schwarz, w / 2, 1050, 0, fluegel);                               // Querriegel
  const geo = new THREE.PlaneGeometry(w - 60, h - 60), uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w - 60) / 20, uv.getY(i) * (h - 60) / 100);
  const m = new THREE.Mesh(geo, GITTER); m.position.set(w / 2, ym, 0); fluegel.add(m);
  for (const y of [H0 + 250, H1 - 250]) { zyl(12, 90, M.stahl, -12, y, 0, null, fluegel, 16); box(40, 60, 8, M.stahl, 8, y, -14, fluegel); }   // Scharniere
  // Griffmodul (Flügel, außen −z): Gehäuse, Türgriff, Riegel greift ins Zuhaltemodul
  const gm = new THREE.Group(); gm.position.set(w - 25, 1050, -32); fluegel.add(gm);
  box(46, 200, 34, M.anthrazit, 0, 0, 0, gm);
  box(14, 120, 30, M.stahl, -8, 0, -30, gm);                                           // Türgriff
  for (const y of [-55, 55]) box(14, 14, 20, M.stahl, -8, y, -12, gm);
  box(30, 20, 30, M.stahl, 30, 40, 0, gm);                                             // Riegel
  // Zuhaltemodul am Schließpfosten (außen), Bedienmodul mit Türanforderung darunter
  const zm = new THREE.Group(); zm.position.set(xB - 30 - 23, 1050, z - 32); anlage.add(zm);
  box(46, 200, 34, M.anthrazit, 0, 0, 0, zm);
  box(42, 60, 2, new THREE.MeshStandardMaterial({ color: 0x1d6fbf, roughness: 0.4 }), 0, 50, -17.5, zm);   // Beschriftungsfeld
  const ledVerriegelt = new THREE.MeshStandardMaterial({ color: 0x113311, emissive: 0x22dd55, emissiveIntensity: 1.6 });
  const ledOffen = new THREE.MeshStandardMaterial({ color: 0x332a00, emissive: 0xffb000, emissiveIntensity: 0 });
  box(8, 8, 3, ledVerriegelt, -10, 85, -18, zm); box(8, 8, 3, ledOffen, 10, 85, -18, zm);
  box(46, 90, 34, M.anthrazit, 0, -150, 0, zm);                                        // Bedienmodul
  const taster = zyl(11, 8, new THREE.MeshStandardMaterial({ color: 0x3d8de0, emissive: 0x3d8de0, emissiveIntensity: 0.4 }), 0, -150, -20, 'z', zm, 20);
  zyl(14, 3, M.stahl, 0, -150, -17.5, 'z', zm, 20);
  zyl(7, 12, M.kunststoff, 0, -205, 0, null, zm, 12);                                  // M12-Anschluss unten
  return { fluegel, ledVerriegelt, ledOffen, klick: [taster, ...gm.children] };
}
