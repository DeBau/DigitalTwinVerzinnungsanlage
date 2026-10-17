import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { HALLE, TEX, canvasTextur } from '../core/texturen.js';
import { M } from '../core/materialien.js';
import { box, mesh, zyl } from '../core/geometrie.js';

// ----------------------------------------------------------------------------
// Hallenboden mit Markierung
// ----------------------------------------------------------------------------
export const bodenMesh = mesh(new THREE.PlaneGeometry(HALLE.b, HALLE.t), M.boden, anlage, false);
bodenMesh.position.z = HALLE.z;
bodenMesh.rotation.x = -Math.PI / 2;
export const UMH = { x0: -980, x1: 1520, z0: -600, z1: 600, h: 1950 };
// Absicherung um Band 1, Rollenkurve, Band 2 und Kipper: vorn Lichtvorhang −BG20 (SICK deTec4) vom Sender an der linken
// Eckpfosten der Umhausung über eine Umlenkspiegelsäule vor den Bändern zum Empfänger vor der Ausschussbox;
// hinten fester Schutzgitterzaun von der rechten Eckpfosten der Umhausung hinter Band 2 bis auf dieselbe Höhe.
// Pfade in mm (x, z). Strahlen 450 … 1650 mm im Raster 30 mm.
export const LV = { systeme: [[[-1000, 645], [-1000, 1790], [3820, 1790]]], y0: 450, n: 41, dy: 30 };
// Zaun hinten (z = UMH.z0): Durchlass Band 1 mit Antrieb −MA1 (x von … bis, Pfostenmitten), Schutztür (Scharnier, Schließseite)
// rechts: Zaunseite bei x = 2050 – Durchgang ≥ 600 mm neben dem Abstreifzylinder −MM4 (bis x ≈ 1400) in den vorderen Bereich
// Schutztür an der Ecke (von hinten gesehen ganz links): Scharnier bei 1150, Schließseite am Eckpfosten
// hinterBand2: Zaunlinie hinter Band 2 (Gang bis zur Kabelwanne hinter Band 2), kamera: Abschlusselement bei x = ende
// von der Zaunlinie bis vor die Kabelwanne der Prüfstation (z 1155, sie läuft unter dem Gitter hindurch) neben dem Kamerastativ – dort bleibt nur der Durchlass
// für Vibrorinne und Prüfband
export const ZAUN = { durchlass: [-230, 330], tuer: [1150, 2050], rechts: 2050, hinterBand2: 300, ende: 3820, kamera: 1190 };
// Industriehalle: Betonsockel, Sandwichpaneele, HEB-Stützen, Fachwerkbinder, LED-Hallenstrahler, Lichtband
{
  const { b, t, h, z } = HALLE, x0 = -b / 2, x1 = b / 2, z0 = z - t / 2, z1 = z + t / 2;
  const paneel = canvasTextur(256, 256, (g, w, hh) => {
    g.fillStyle = '#c4c7c5'; g.fillRect(0, 0, w, hh);                     // Sandwichpaneel grauweiß (≈ RAL 9002)
    for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(x, 0, 14, hh); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x + 30, 0, 2, hh); }
  }, true);
  const sockel = canvasTextur(256, 128, (g, w, hh) => {
    g.fillStyle = '#8a8c89'; g.fillRect(0, 0, w, hh);                     // Betonsockel
    for (let i = 0; i < 3000; i++) { const v = 50 + Math.random() * 40 | 0; g.fillStyle = `rgba(${v},${v},${v},0.25)`; g.fillRect(Math.random() * w, Math.random() * hh, 2, 2); }
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 0, 2, hh);
  }, true);
  // Halle: Lambert-Materialien (große Bildflächen, keine Spiegelungen nötig)
  const wand = new THREE.MeshLambertMaterial({ map: paneel });
  const beton = new THREE.MeshLambertMaterial({ map: sockel });
  const dach = new THREE.MeshLambertMaterial({ color: 0x9aa0a3, side: THREE.DoubleSide });   // Trapezblech hellgrau
  const stahl = new THREE.MeshLambertMaterial({ color: 0x34475c });   // RAL 5014-ähnlich, gedeckt
  const wandFl = (w, hh, x, y, zz, ry, mat, rx, ry2) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), mat.clone());
    m.material.map = mat.map.clone(); m.material.map.needsUpdate = true; m.material.map.repeat.set(rx, ry2);
    m.position.set(x, y, zz); m.rotation.y = ry; m.receiveShadow = true; anlage.add(m);
  };
  const S = 1200;                                                        // Höhe Betonsockel
  for (const [w, x, zz, ry] of [[b, 0, z0, 0], [b, 0, z1, Math.PI], [t, x0, z, Math.PI / 2], [t, x1, z, -Math.PI / 2]]) {
    wandFl(w, S, x, S / 2, zz, ry, beton, w / 3000, 1);
    wandFl(w, h - S, x, S + (h - S) / 2, zz, ry, wand, w / 1600, 1);
  }
  const decke = new THREE.Mesh(new THREE.PlaneGeometry(b, t), dach); decke.rotation.x = Math.PI / 2; decke.position.set(0, h, z); anlage.add(decke);
  // Lichtband in der Rückwand
  const lichtband = new THREE.MeshBasicMaterial({ color: 0xdfe8ee });
  const lb = new THREE.Mesh(new THREE.PlaneGeometry(b * 0.8, 900), lichtband); lb.position.set(0, 5600, z0 + 5); anlage.add(lb);
  // Stützen HEB 300 und Fachwerkbinder
  const heb = (x, zz) => {
    box(300, h, 20, stahl, x, h / 2, zz - 140); box(300, h, 20, stahl, x, h / 2, zz + 140); box(12, h, 260, stahl, x, h / 2, zz);
  };
  for (let x = x0 + 600; x <= x1 - 600; x += 6000) { heb(x, z0 + 300); heb(x, z1 - 300); }
  for (let x = x0 + 600; x <= x1 - 600; x += 6000) {
    box(200, 200, t - 600, stahl, x, h - 1300, z);                                 // Untergurt
    box(200, 200, t - 600, stahl, x, h - 150, z);                                  // Obergurt
    for (let zz = z0 + 600; zz < z1 - 600; zz += 1500) { const d = box(120, 1500, 120, stahl, x, h - 725, zz + 750); d.rotation.x = ((zz / 1500) | 0) % 2 ? 0.75 : -0.75; }
  }
  // LED-Hallenstrahler
  const led = new THREE.MeshBasicMaterial({ color: 0xfff6e8 });
  for (let x = x0 + 3600; x < x1 - 2000; x += 6000) for (let zz = z0 + 3000; zz < z1 - 1000; zz += 4500) {
    zyl(260, 120, M.anthrazit, x, h - 1700, zz, null, anlage, 24);
    zyl(240, 6, led, x, h - 1763, zz, null, anlage, 24);
    zyl(6, 1600, M.stahl, x, h - 850, zz, null, anlage, 8);
  }
  // Bodenmarkierung Fahrweg (gelb)
  for (const zz of [3300, 5900]) { const m = box(b - 1200, 1, 100, M.gelb, 0, 0.6, zz); m.castShadow = false; }
}
// Gelb-schwarze Bodenmarkierung (Warnband 60 mm) rund um den abgesicherten Bereich, 120 mm außerhalb von Zaun,
// Lichtvorhang-Säulen und der offenen Seite zum Prüfband (Umlauf gegen den Uhrzeigersinn von oben gesehen)
export const MARKIERUNG = [[-1120, -720], [2170, -720], [2170, 180], [3940, 180], [3940, 1910], [-1120, 1910]];
MARKIERUNG.forEach(([ax, az], i) => {
  const [bx, bz] = MARKIERUNG[(i + 1) % MARKIERUNG.length], L = Math.hypot(bx - ax, bz - az) + 60;   // Ecken überlappen
  const m = box(L, 1, 60, M.warn, (ax + bx) / 2, 0.6, (az + bz) / 2); m.castShadow = false; m.rotation.y = -Math.atan2(bz - az, bx - ax);
  m.material = M.warn.clone(); m.material.map = TEX.warnband.clone(); m.material.map.needsUpdate = true; m.material.map.repeat.set(L / 240, 1);
});

