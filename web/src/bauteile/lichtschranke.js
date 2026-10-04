import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { V, box, cached, mesh, zyl } from '../core/geometrie.js';
import { label, platte, tafel } from '../core/beschriftung.js';
import { SENSOREN } from '../anlage/register.js';
import { sensorLed } from '../core/leds.js';
import { BAND, BAND_Y } from '../anlage/baender.js';

// Keyence PZ-G (Quaderbauform 11 x 31,5 x 20 mm): Reflexionslichtschranke PZ-G61CN mit Reflektor R-2
// oder Reflexionstaster PZ-G41CN (ohne Reflektor). Linse an der Stirnseite, Kontroll-LEDs oben (orange Ausgang,
// grün Stabilität), zwei Befestigungsbohrungen M3 quer, M8-Steckeranschluss hinten. Halter: Edelstahl-Winkel.
// parent/Lage: Gruppe mit lokaler Förderrichtung +z, Förderebene (Gurt-/Rollenoberkante) bei BAND_Y; seite = Seite des Sensors (−1 = lokal −x)
// Montage außerhalb der Förderbahn: Strahl quer zur Förderrichtung in Höhe hy über der Förderebene (Korbkörper, über der
// Seitenführung, unter dem Bügel). Sensor auf einem Haltewinkel am Seitenprofil (montage 'profil': Winkel in der Profilnut
// außen bei |x| = xb, Sensor neben dem Winkel, Stecker frei nach außen) bzw. an der Muldenwange (montage 'wange':
// Winkel außen auf der Wange, Strahl durch eine Bohrung; Reflektor innen auf der Gegenwange hinter der Seitenführung).
export const LS_STRAHLEN = [];
const LINSE = new THREE.MeshStandardMaterial({ color: 0x2a0d0b, roughness: 0.05, metalness: 0.2 });
// Gehäuse: Quader mit abgerundeter Oberseite zur Linse hin (Seitenprofil x/y, Dicke 11 in z)
const pzGeo = () => cached('pzG', () => {
  const s = new THREE.Shape();
  s.moveTo(-10, -15.75); s.lineTo(10, -15.75); s.lineTo(10, 12.5); s.quadraticCurveTo(10, 15.75, 6.5, 15.75); s.lineTo(-10, 15.75); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 10, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 1, curveSegments: 4 });
  g.translate(0, 0, -5);
  return g;
});
// Reflektor R-2: rotes Tripelprisma-Feld im schwarzen Rahmen
const reflektorTafel = () => tafel('r2', 30, 44, (c) => {
  c.fillStyle = '#7d0f0a'; c.fillRect(0, 0, 30, 44);
  for (let y = 0; y < 46; y += 2.6) for (let x = (y / 2.6) % 2 ? 1.5 : 0; x < 31; x += 3) {
    c.fillStyle = ((x + y) * 7) % 3 < 1.5 ? '#d8261b' : '#a3170f';
    c.beginPath(); c.moveTo(x, y - 1.5); c.lineTo(x + 1.4, y + 0.8); c.lineTo(x - 1.4, y + 0.8); c.closePath(); c.fill();
  }
}, 10);
export function lichtschranke(z, signal, text, { parent = anlage, seite = -1, reflektor = true, hy = 50, xs = 112, xb = 134.5, xr = 119, montage = 'profil' } = {}) {
  const ls = new THREE.Group(); ls.position.z = z; parent.add(ls);
  if (seite > 0) ls.rotation.y = Math.PI;
  const y = BAND_Y + hy, wange = montage === 'wange';
  // Sensorseite: Haltewinkel (Edelstahl) mit seitlichem Schenkel, der Sensor ist mit zwei M3-Schrauben quer daran verschraubt
  if (wange) {
    box(4, 50, 30, M.edelstahl, -xb, y, -24, ls);
    for (const dy of [-15, 15]) zyl(4.5, 3, M.schwarz, -xb - 3.5, y + dy, -24, 'x', ls, 6);
  } else {
    box(4, 110, 30, M.edelstahl, -xb, BAND_Y + 15, -24, ls);                       // Schenkel in der Profilnut (außen)
    for (const dy of [-30, -12]) zyl(4.5, 3, M.schwarz, -xb - 3, BAND_Y + dy, -24, 'x', ls, 6);   // Nutenstein-Schrauben
  }
  { const x0 = -Math.max(xb, xs + 10), x1 = -Math.min(xb, xs - 8); box(x1 - x0, 44, 3, M.edelstahl, (x0 + x1) / 2, y - 2, -7, ls); }
  const k = mesh(pzGeo(), M.keyence, ls); k.position.set(-xs, y + 2.5, 0);           // Sensorgehäuse, Linse auf Strahlhöhe
  box(1, 13, 8, LINSE, -xs + 10.4, y, 0, ls);                                      // Linse
  box(0.6, 15, 9.4, M.kunststoff, -xs + 10.1, y, 0, ls);
  box(7, 1, 7, new THREE.MeshStandardMaterial({ color: 0xd9d4c8, roughness: 0.3, transparent: true, opacity: 0.85 }), -xs - 1, y + 18.4, 0, ls);   // Anzeigefenster
  for (const sy of [-1, 1]) for (const sz of [-1, 1]) zyl(1.9, 1, M.stahl, -xs + 4, y - 6 + sy * 6.5, sz * 5.6, 'z', ls, 8);   // Befestigungsbohrungen M3 mit Schrauben
  platte(tafel('keyence', 18, 7, (c) => {
    c.fillStyle = '#2b2d30'; c.fillRect(0, 0, 18, 7); c.fillStyle = '#e8eaec'; c.font = '700 3px Arial'; c.textAlign = 'center'; c.fillText('KEYENCE', 9, 3.2);
    c.font = '400 1.8px Arial'; c.fillText(reflektor ? 'PZ-G61CN' : 'PZ-G41CN', 9, 5.9);
  }, 12), 18, 7, ls, -xs, y + 8, 5.65);
  const mat = sensorLed(ls, -xs - 3, y + 18.6, 0, signal, 2.4, 0.6, 2.4);
  const pwr = sensorLed(ls, -xs + 1, y + 18.6, 0, '', 2.4, 0.6, 2.4); pwr.emissive.setHex(0x22dd55); pwr.emissiveIntensity = 1.6;
  if (reflektor) {                                                                  // Reflektor R-2
    if (!wange) {                                                                   // Z-Winkel: Schenkel in der Profilnut, Steg, Reflektorblech
      box(4, 120, 30, M.edelstahl, xb, BAND_Y + 20, 0, ls);
      for (const dy of [-30, -12]) zyl(4.5, 3, M.schwarz, xb + 3, BAND_Y + dy, 0, 'x', ls, 6);
      box(xb - 2 - (xr + 5), 3, 30, M.edelstahl, (xb - 2 + xr + 5) / 2, BAND_Y + 78.5, 0, ls);
      box(3, BAND_Y + 80 - (y - 28), 30, M.edelstahl, xr + 3.5, (BAND_Y + 80 + y - 28) / 2, 0, ls);
    }
    box(4, 52, 36, M.kunststoff, xr, y, 0, ls);
    platte(reflektorTafel(), 30, 44, ls, xr - 2.1, y, 0, -Math.PI / 2);
    for (const sy of [-1, 1]) zyl(2.2, 1.5, M.stahl, xr - 2, y + sy * 24, 0, 'x', ls, 8);
  }
  const div = label(text, ls, -xs - 5, y + 62, 0, 'klein');
  SENSOREN.push({ signal, mat, div });
  const lx = -xs + 10.4, rx = reflektor ? xr - 2.1 : lx + 70;
  const strahl = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, rx - lx, 6), new THREE.MeshBasicMaterial({ color: 0xff3b2f, transparent: true, opacity: 0.5 }));
  strahl.rotation.z = Math.PI / 2; strahl.position.set((lx + rx) / 2, y, 0); ls.add(strahl);
  LS_STRAHLEN.push({ signal, mat: strahl.material });
  ls.updateMatrixWorld(true);
  BAND.stecker[signal] = anlage.worldToLocal(ls.localToWorld(V(-xs - 10, y, 0)));
  BAND.stecker[signal].seite = seite;
  return ls;
}
