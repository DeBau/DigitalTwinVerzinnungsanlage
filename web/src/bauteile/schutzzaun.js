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
// Drehflügeltür im Zaun zwischen dem Scharnierpfosten bei xA und dem Eckpfosten bei xB (Linie z), öffnet nach −z (außen).
// Scharnierachse 35 mm vor der Zaunlinie und 10 mm neben dem Flügel: so schwenkt der Flügel bis 92° frei am Pfosten vorbei.
// Zuhaltung −BG41: SICK TR10 Lock TR10-SRM01C (6054758, RFID, Ruhestrom), Maße nach SICK-Datenblatt TR10-SRM01C
// (Maßzeichnung Sensor S. 4, Betätiger und Befestigungswinkel S. 5): Sensor 45 × 140 × 50 senkrecht flach auf dem
// Eckpfosten, Riegelbolzen Ø 9,525 oben 25 mm vor der Montagefläche, fährt 10 mm in den Betätiger. Betätigerkopf
// 40 × 40 auf dem Befestigungswinkel (3 mm, Schenkel 47, Kopfmitte 31,5 vor der Winkelfläche) an der Schließkante des
// Flügels: beim Schließen gleitet der Kopf von vorn über den Sensor (Anfahrrichtung frontal).
// Türanforderung −SF49 darunter in einem schmalen Aufbaugehäuse (40 breit wie der Pfosten, 2 Befehlsstellen Ø 22 untereinander).
// Rückgabe: { fluegel, ledVerriegelt, ledOffen, klick[], riegelStellen(k) } mit k = 0 Bolzen eingefahren … 1 ausgefahren
const TR10 = { y: 1290, b: 45, h: 140, t: 50, bolzen: 25, kopf: 40, kh: 16, luft: 2, winkel: 31.5 };
export function zaunTuer(xA, xB, z) {
  const fluegel = new THREE.Group(); fluegel.position.set(xA + 45, 0, z - 35); anlage.add(fluegel);
  tuerFluegel(fluegel, xB - xA - 70);
  scharniere(fluegel, xA, z);
  const kante = xB - 35;                                                                // Schließkante des Flügels (15 mm Spalt zum Pfosten)
  const tg = new THREE.Group(); tg.position.set(kante - fluegel.position.x, 0, 35); fluegel.add(tg);   // lokal: x ab Kante, z ab Zaunlinie
  const griff = tuerGriff(tg);
  betaetiger(tg);
  const s = tr10Sensor(kante + TR10.winkel, z - 30);
  const bg = bediengehaeuse(xB, z - 30);                                         // mittig auf dem Eckpfosten, bündig mit seinen Kanten
  return { fluegel, ledVerriegelt: s.led, ledOffen: bg.ledOffen, klick: [bg.taster, ...griff], riegelStellen: s.stellen };
}
// Flügel lokal: Rahmen 30 × 20 von x = −10 bis w − 10, Ebene z = 35 (Zaunlinie), Gitter wie die Paneele
function tuerFluegel(g, w) {
  const h = H1 - H0, ym = (H0 + H1) / 2, xm = -10 + w / 2, zf = 35;
  for (const sy of [-1, 1]) box(w, 30, 20, schwarz, xm, ym + sy * (h / 2 - 15), zf, g);   // Rahmen oben/unten
  for (const x of [5, w - 25]) box(30, h - 60, 20, schwarz, x, ym, zf, g);               // Rahmen seitlich
  box(w - 60, 30, 20, schwarz, xm, 1050, zf, g);                                       // Querriegel
  const geo = new THREE.PlaneGeometry(w - 60, h - 60), uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w - 60) / 20, uv.getY(i) * (h - 60) / 100);
  const m = new THREE.Mesh(geo, GITTER); m.position.set(xm, ym, zf); g.add(m);
}
// Scharniere: Bolzen in der Drehachse, Lappen am Flügel oben, Lappen am Pfosten (Außenseite) darunter
function scharniere(g, xA, z) {
  for (const y of [H0 + 250, H1 - 250]) {
    zyl(12, 120, M.stahl, 0, y, 0, null, g, 16);                                         // Bolzen Ø 24
    box(40, 55, 25, M.stahl, 15, y + 30, 12.5, g);                                       // Flügellappen bis zum Rahmen
    box(35, 55, 15, M.stahl, xA + 30, y - 30, z - 27.5);                                 // Pfostenlappen
  }
}
// Bügelgriff (Profilgriff Ø 20, Stützweite 160) außen auf dem Schließholm des Flügels
function tuerGriff(tg) {
  const teile = [920, 1080].map((y) => box(14, 14, 32, M.stahl, -15, y, -26, tg));      // Stützen
  teile.push(zyl(10, 190, M.stahl, -15, 1000, -50, null, tg, 16));
  return teile;
}
// Betätiger TR10 Lock: Haltewinkel (Alu-Vierkant 20 × 57,5) auf dem Schließholm, SICK-Befestigungswinkel an seiner
// Stirnseite (fluchtend mit der Flügelkante), Kopf 40 × 40 mittig über dem Riegelbolzen des Sensors
function betaetiger(tg) {
  const { y, kopf, kh, luft } = TR10, zk = -55, yk = y + luft + kh / 2;
  box(20, 55, 57.5, M.alu, -10, y - 7.5, -38.75, tg);                                    // Haltewinkel bis vor den Sensor
  box(3, 47, 25, M.stahl, 1.5, y + luft + kh - 23.5, zk, tg);                             // Befestigungswinkel: Schenkel …
  box(8.5, 3, 25, M.stahl, 7.25, y + luft + kh - 1.5, zk, tg);                            // … und Steg zum Kopf
  box(kopf, kh, kopf, gelb, 11.5 + kopf / 2, yk, zk, tg);                                // Betätigerkopf (RFID)
  box(10, 1, 8, new THREE.MeshStandardMaterial({ color: 0x1d6fbf, roughness: 0.4 }), 11.5 + kopf / 2, yk + kh / 2 + 0.5, zk - 12, tg);   // Pfeilmarke
}
// Sensor TR10 Lock flach auf dem Eckpfosten: x = Bolzenmitte, zf = Pfostenfläche; Rücken schwarz, Front gelb, oben
// 50 tief, unten auf 32 verjüngt; Riegelbolzen bewegt (dyn), LED STATUS grün
function tr10Sensor(x, zf) {
  const g = new THREE.Group(); g.position.set(x, 0, zf); anlage.add(g);
  const { y, b, h, t } = TR10;
  box(b, h, 32, schwarz, 0, y - h / 2, -16, g);
  box(b, 85, t - 32, gelb, 0, y - 42.5, -32 - (t - 32) / 2, g);
  zyl(4.8, 23, M.kunststoff, 0, y - h - 11.5, -16, null, g, 12);                          // Kabelverschraubung
  zyl(3.25, 55, M.kunststoff, 0, y - h - 50, -16, null, g, 8);                            // Leitung Ø 6,5 ins Bediengehäuse (M20 oben)
  const led = new THREE.MeshStandardMaterial({ color: 0x113311, emissive: 0x22dd55, emissiveIntensity: 1.6 });
  box(14, 4, 2, led, 0, y - 60, -t - 0.5, g);                                             // STATUS
  box(14, 4, 2, M.kunststoff, 0, y - 70, -t - 0.5, g);                                    // DIAG
  const bolzen = zyl(4.76, 12, M.stahl, 0, y - 6, -TR10.bolzen, null, g, 12);
  bolzen.userData.dyn = true;
  return { led, stellen: (k) => { bolzen.position.y = y - 6 + 10 * k; } };
}
// Schmales Aufbaugehäuse (grau, 40 × 130 × 55) flach und bündig auf dem Eckpfosten, Mitte x: zwei Befehlsstellen Ø 22
// untereinander – oben Leuchtmelder gelb (Zuhaltung entriegelt), unten Leuchtdrucktaster blau Türanforderung −SF49
function bediengehaeuse(x, zf) {
  const g = new THREE.Group(); g.position.set(x, 1010, zf); anlage.add(g);
  box(40, 130, 55, new THREE.MeshStandardMaterial({ color: 0x9a9fa4, roughness: 0.5 }), 0, 0, -27.5, g);
  const ledOffen = new THREE.MeshStandardMaterial({ color: 0x332a00, emissive: 0xffb000, emissiveIntensity: 0 });
  for (const yy of [30, -30]) zyl(14.5, 3, M.stahl, 0, yy, -56.5, 'z', g, 24);             // Frontringe Ø 29
  zyl(11, 6, ledOffen, 0, 30, -60, 'z', g, 20);
  const taster = zyl(11, 8, new THREE.MeshStandardMaterial({ color: 0x3d8de0, emissive: 0x3d8de0, emissiveIntensity: 0.4 }), 0, -30, -61, 'z', g, 20);
  return { ledOffen, taster };
}
