import * as THREE from 'three';
import { M } from '../core/materialien.js';
import { box } from '../core/geometrie.js';
import { platte } from '../core/beschriftung.js';
import { canvasTextur } from '../core/texturen.js';
import { KLICK, PULT_TASTER } from './register.js';

// ----------------------------------------------------------------------------
// BCD-Geräte am Bedienpult (L09): dreistellige Ziffernanzeige −PG1 (%QW6) und
// Daumenradschalter −SF48 Tauchzeit (%IW12), je Dekade vier Leitungen 8-4-2-1
// ----------------------------------------------------------------------------
export const BCD = { anzeige: null, rad: null, zuletzt: '' };
export const DEKADEN = ['H', 'Z', 'E'];
const ZEICHEN = new THREE.MeshStandardMaterial({ color: 0xf2f4f6, roughness: 0.5 });

const ziffernFont = (h) => `700 ${Math.round(h)}px "Courier New", monospace`;
// Anzeige: rote Siebensegmentziffern, unbeleuchtete Segmente schwach sichtbar; null = Stelle dunkel (Tetrade über 9)
function anzeigeZeichnen(c, w, h, ziffern) {
  c.fillStyle = '#160807'; c.fillRect(0, 0, w, h);
  c.font = ziffernFont(h * 0.86); c.textAlign = 'center'; c.textBaseline = 'middle';
  ziffern.forEach((z, i) => {
    const x = w * (i + 0.5) / 3;
    c.fillStyle = '#3b1311'; c.fillText('8', x, h / 2 + 2);
    if (z !== null) { c.fillStyle = '#ff3b26'; c.fillText(String(z), x, h / 2 + 2); }
  });
}
// Daumenrad: weiße Ziffern auf schwarzen Rädchen
function radZeichnen(c, w, h, ziffern) {
  c.fillStyle = '#101214'; c.fillRect(0, 0, w, h);
  c.font = ziffernFont(h * 0.8); c.textAlign = 'center'; c.textBaseline = 'middle';
  ziffern.forEach((z, i) => {
    const x = w * (i + 0.5) / 3;
    c.fillStyle = '#2a2e33'; c.fillRect(x - w / 7, 2, w / 3.5, h - 4);
    c.fillStyle = '#f2f4f6'; c.fillText(String(z), x, h / 2 + 2);
  });
}
const neuZeichnen = (tex, zeichnen, ziffern) => {
  const c = tex.userData.canvas;
  zeichnen(c.getContext('2d'), c.width, c.height, ziffern);
  tex.needsUpdate = true;
};

export function ziffernanzeige(parent, x, y) {
  box(64, 28, 6, M.schwarz, x, y, 3, parent);                                    // Einbaurahmen
  BCD.anzeige = canvasTextur(192, 72, (c, w, h) => anzeigeZeichnen(c, w, h, [0, 0, 0]));
  platte(new THREE.MeshBasicMaterial({ map: BCD.anzeige, toneMapped: false }), 56, 21, parent, x, y, 6.2);
}
// Je Dekade eine Taste + über und − unter dem Ziffernfenster (anklickbar, art 'daumenrad')
export function daumenradschalter(parent, x, y) {
  box(46, 44, 8, M.schwarz, x, y, 4, parent);
  BCD.rad = canvasTextur(138, 54, (c, w, h) => radZeichnen(c, w, h, [0, 1, 0]));
  platte(new THREE.MeshBasicMaterial({ map: BCD.rad, toneMapped: false }), 39, 15, parent, x, y, 8.2);
  DEKADEN.forEach((stelle, i) => {
    for (const schritt of [1, -1]) {
      const xs = x + (i - 1) * 13, ys = y + schritt * 14.5;
      box(10, 8, 3, M.anthrazit, xs, ys, 9.5, parent);
      box(4.6, 1.2, 0.4, ZEICHEN, xs, ys, 11.2, parent);                       // „−“, mit Querstrich „+“
      if (schritt > 0) box(1.2, 4.6, 0.4, ZEICHEN, xs, ys, 11.2, parent);
      const hit = box(12, 10, 8, KLICK, xs, ys, 10, parent); hit.castShadow = false;
      hit.userData = { taster: 'daumenrad', art: 'daumenrad', stelle, schritt };
      PULT_TASTER.push({ key: 'daumenrad', kappe: hit, art: 'daumenrad' });
    }
  });
}
// Anzeige und Rädchen nachführen (nur bei Änderung neu zeichnen)
export function bcdZeichnen(anzeige, rad) {
  const k = anzeige.join() + '|' + rad.join();
  if (!BCD.anzeige || k === BCD.zuletzt) return;
  BCD.zuletzt = k;
  neuZeichnen(BCD.anzeige, anzeigeZeichnen, anzeige);
  neuZeichnen(BCD.rad, radZeichnen, rad);
}
