import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { box, mesh, zyl } from '../core/geometrie.js';
import { canvasTextur } from '../core/texturen.js';

// ----------------------------------------------------------------------------
// Kabelrinne gelocht, Stahl bandverzinkt (Bauart OBO MKS / Niedax RL), mit Montagematerial
//   Boden mit versetzten Langlöchern 7 × 25, Seitenwände mit einer Reihe Langlöcher, Bördelrand oben,
//   Trennsteg (Starkstrom getrennt von Signal/Druckluft), Endstück, seitlicher Abgang für ein Anbau-T.
// Lokale Lage: Rinnenachse lokal x von 0 bis L, quer lokal z (±B/2), Bodenoberseite bei lokal y = 0.
// ----------------------------------------------------------------------------
const RASTER = 50;                                         // Lochteilung in mm (eine Texturkachel)
const lochBoden = canvasTextur(128, 128, (g) => {
  g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#000';
  const loch = (x, y) => { g.beginPath(); g.roundRect(x - 9, y - 32, 18, 64, 9); g.fill(); };   // 7 × 25 mm quer zur Achse
  loch(32, 64); loch(96, 0); loch(96, 128);                // versetzt
}, true);
const lochSeite = canvasTextur(128, 154, (g) => {
  g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 154); g.fillStyle = '#000';
  g.beginPath(); g.roundRect(64 - 23, 77 - 9, 46, 18, 9); g.fill();   // 18 × 7 mm in Wandmitte
}, true);
const blech = (map) => new THREE.MeshStandardMaterial({ color: 0xc3cacf, metalness: 0.75, roughness: 0.42, alphaMap: map, alphaTest: 0.5, side: THREE.DoubleSide });
const M_BODEN = blech(lochBoden), M_SEITE = blech(lochSeite);
const M_BLECH = new THREE.MeshStandardMaterial({ color: 0xc3cacf, metalness: 0.75, roughness: 0.42, side: THREE.DoubleSide });

// Blechfläche (Ebene) mit Lochbild im festen Raster: u entlang der Achse, v quer bzw. über die Höhe
function flaeche(w, h, mat, parent, rasterV) {
  const geo = new THREE.PlaneGeometry(w, h);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / RASTER, rasterV ? uv.getY(i) * h / RASTER : uv.getY(i));
  return mesh(geo, mat, parent);
}

// abgang: [{ seite: ±1, von, bis }] Ausschnitt in der Seitenwand (lokal z = seite · B/2) für ein Anbau-T
// enden: [0 | L] Stellen mit Endstück; trennsteg: lokal z des Trennstegs
export function kabelrinne(pos, ry, { L, B = 100, H = 60, abgang = [], enden = [], trennsteg }) {
  const g = new THREE.Group(); g.position.copy(pos); g.rotation.y = ry; anlage.add(g);
  const boden = flaeche(L, B, M_BODEN, g, true);
  boden.rotation.x = -Math.PI / 2; boden.position.set(L / 2, 0, 0);
  for (const s of [-1, 1]) {
    // Seitenwand in Stücken zwischen den Ausschnitten
    const aus = abgang.filter((a) => a.seite === s).sort((a, b) => a.von - b.von);
    let x = 0;
    for (const a of [...aus, { von: L, bis: L }]) {
      if (a.von - x > 1) {
        const w = flaeche(a.von - x, H, M_SEITE, g, false);
        w.position.set((x + a.von) / 2, H / 2, s * B / 2);
        zyl(2.2, a.von - x, M.verzinkt, (x + a.von) / 2, H - 1, s * (B / 2 - 1.6), 'x', g, 8);   // Bördelrand nach innen
      }
      x = a.bis;
    }
    for (const a of aus) for (const xe of [a.von, a.bis]) box(1.5, H, 3, M.verzinkt, xe, H / 2, s * B / 2, g);   // umgebördelte Schnittkante
  }
  for (const xe of enden) {                                                       // Endstück, eingesteckt und verschraubt
    const e = mesh(new THREE.PlaneGeometry(B, H), M_BLECH, g); e.position.set(xe, H / 2, 0); e.rotation.y = Math.PI / 2;
    for (const s of [-1, 1]) zyl(3.5, 2, M.stahl, xe + (xe ? -1.5 : 1.5), H / 2, s * (B / 2 - 12), 'x', g, 6);
  }
  if (trennsteg !== undefined) {                                                  // Trennsteg mit Bodenklammern
    const t = mesh(new THREE.PlaneGeometry(L - 4, H - 10), M_BLECH, g); t.position.set(L / 2, (H - 10) / 2, trennsteg);
    for (let xk = 150; xk < L - 50; xk += 500) box(12, 6, 10, M.verzinkt, xk, 3, trennsteg, g);
  }
  g.updateMatrixWorld(true);
  return g;
}

// Anbau-T: Verbindungswinkel innen in beiden Ecken zwischen abgehender Rinne (Ende bei lokal x) und Hauptrinne
export function anbauT(rinne, x, B = 60, H = 60) {
  for (const s of [-1, 1]) {
    box(30, H - 8, 1.5, M.verzinkt, x - 15, H / 2, s * (B / 2 - 1.5), rinne);
    for (const dy of [-12, 12]) zyl(3.5, 2, M.stahl, x - 15, H / 2 + dy, s * (B / 2 - 3), 'z', rinne, 6);
  }
}

// Wandausleger (C-Profil 41 × 21, Kopfplatte) an einem senkrechten Alu-Profil: Kopfplatte an der Profilfläche x = xw,
// Arm in Richtung r (±1 in x) mit Länge l, Oberkante bei y; Befestigung mit Hammerkopfschrauben in der Nut.
// kanten: x der Rinnenhalteklammern (Rinnenkanten)
export function wandausleger(xw, y, z, r, l, kanten = []) {
  // Kopfplatte reicht von der Armunterkante nach oben, die Schrauben sitzen im Profil (Profil beginnt über dem Stellfuß)
  box(6, 90, 45, M.verzinkt, xw + r * 3, y + 20, z);
  for (const dy of [15, 50]) { zyl(8, 1.5, M.stahl, xw + r * 6.75, y + dy, z, 'x', anlage, 12); zyl(6.5, 1.5, M.stahl, xw + r * 8.25, y + dy, z, 'x', anlage, 6); }   // flacher Kopf, die Rinne liegt daneben
  auslegerArm(xw + r * 6, y, z, 'x', r, l, kanten);
}
// Arm aus C-Profil 41 × 21 von (xs, zs) in Richtung r entlang achse, Schlitz nach unten, Kunststoff-Endkappe
function auslegerArm(xs, y, zs, achse, r, l, kanten) {
  const inX = achse === 'x', mx = inX ? xs + r * l / 2 : xs, mz = inX ? zs : zs + r * l / 2;
  const [w, d] = inX ? [l, 41] : [41, l];
  box(w, 21, d, M.verzinkt, mx, y - 10.5, mz);
  box(inX ? l : 22, 1, inX ? 22 : l, M.schwarz, mx, y - 21.2, mz);
  box(inX ? 3 : 41, 21, inX ? 41 : 3, M.kunststoff, inX ? xs + r * (l + 1.5) : mx, y - 10.5, inX ? mz : zs + r * (l + 1.5));
  for (const k of kanten) box(inX ? 14 : 30, 5, inX ? 30 : 14, M.verzinkt, inX ? k : mx, y + 2.5, inX ? mz : k);   // Rinnenhalteklammer
}
// Bodenstütze: Fußplatte mit vier Schwerlastdübeln, Stiel (C-Profil 41 × 41) bis unter den Ausleger, Ausleger mittig
// quer unter der Rinne (achse 'x': Rinne läuft in z, 'z': Rinne läuft in x), Oberkante bei y
export function bodenstuetze(x, z, y, achse, l, kanten = []) {
  box(100, 6, 100, M.verzinkt, x, 3, z);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { zyl(7, 3, M.stahl, x + sx * 36, 7.5, z + sz * 36, null, anlage, 6); zyl(4, 5, M.stahl, x + sx * 36, 11.5, z + sz * 36, null, anlage, 8); }
  const h = y - 21 - 6;
  box(41, h, 41, M.verzinkt, x, 6 + h / 2, z);
  box(1, h, 22, M.schwarz, x + 20.8, 6 + h / 2, z);                               // Profilschlitz
  if (achse === 'x') auslegerArm(x - l / 2, y, z, 'x', 1, l, kanten);
  else auslegerArm(x, y, z - l / 2, 'z', 1, l, kanten);
}

// Reduzierstück (einseitig) für eine Rinne in Richtung +z: Innenseite gerade bei x = xi, Außenseite schräg von xa0 (bei z0)
// auf xa1 (bei z1); Boden gelocht, Seiten und Trennsteg (von steg0 auf steg1) mit Bördelrand bzw. glatt
export function reduzierstueck({ y, xi, xa0, xa1, z0, z1, H = 60, steg0, steg1 }) {
  const g = new THREE.Group(); g.position.y = y; anlage.add(g);
  const form = new THREE.Shape([new THREE.Vector2(xi, -z0), new THREE.Vector2(xa0, -z0), new THREE.Vector2(xa1, -z1), new THREE.Vector2(xi, -z1)]);
  const geo = new THREE.ShapeGeometry(form);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, -p.getY(i) / RASTER, p.getX(i) / RASTER);     // Lochbild quer wie in der Rinne
  const boden = mesh(geo, M_BODEN, g); boden.rotation.x = -Math.PI / 2;               // Shape-y = −z → nach Drehung z
  const wand = (xa, za, xb, zb, mat, h, rand) => {
    const L = Math.hypot(xb - xa, zb - za), w = flaeche(L, h, mat, g, false);
    w.position.set((xa + xb) / 2, h / 2, (za + zb) / 2); w.rotation.y = -Math.atan2(zb - za, xb - xa);
    if (rand) { const b = zyl(2.2, L, M.verzinkt, 0, 0, 0, 'x', g, 8); b.position.copy(w.position).setY(H - 1); b.rotation.set(0, w.rotation.y, Math.PI / 2, 'YXZ'); }
  };
  wand(xi, z0, xi, z1, M_SEITE, H, true);
  wand(xa0, z0, xa1, z1, M_SEITE, H, true);
  if (steg0 !== undefined) wand(steg0, z0, steg1, z1, M_BLECH, H - 10, false);
  return g;
}
