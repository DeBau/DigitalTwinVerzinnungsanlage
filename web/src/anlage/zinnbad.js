import * as THREE from 'three';
import { FUELL_MIN, TEMP_SOLL, st } from '../logik/zustand.js';
import { anlage } from '../core/szene.js';
import { TEX, canvasTextur } from '../core/texturen.js';
import { M } from '../core/materialien.js';
import { box, mesh, zyl } from '../core/geometrie.js';
import { label, schildPlatte } from '../core/beschriftung.js';
import { SENSOREN } from './register.js';
import { sensorLed } from '../core/leds.js';

// ----------------------------------------------------------------------------
// Zinnbad: isolierter Tiegel, Randabsaugung, Regler, Sensoren
// ----------------------------------------------------------------------------
export const BAD_X = 430, RAND_Y = 420, TIEGEL_BODEN = 230, OEFF = 250;
export const bad = new THREE.Group();
anlage.add(bad);
box(352, 70, 352, M.anthrazit, BAD_X, 35, 0, bad);
for (const sx of [-1, 1]) for (const sz of [-1, 1]) {                                 // Stellfüße M12 mit Gelenkteller
  zyl(17, 6, M.kunststoff, BAD_X + sx * 150, 3, sz * 150, null, bad, 16);
  zyl(6, 8, M.stahl, BAD_X + sx * 150, 8, sz * 150, null, bad, 8);
}
// Lüftungsschlitze der Heizkammer (seitlich) und Typschild
for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) box(1.5, 8, 90, M.schwarz, BAD_X + sx * 170.6, 110 + i * 16, 60, bad);

// Edelstahlrand mit Öffnung
const rb = (340 - OEFF) / 2;
// Gehäuse als Hülle mit Öffnung (Wände bis knapp unter den Rand, damit keine Flächen zusammenfallen)
const WAND_H = RAND_Y - 13 - 64;
box(340, WAND_H, rb, M.anthrazit, BAD_X, 64 + WAND_H / 2, -(OEFF / 2 + rb / 2), bad);
box(340, WAND_H, rb, M.anthrazit, BAD_X, 64 + WAND_H / 2, OEFF / 2 + rb / 2, bad);
box(rb, WAND_H, OEFF, M.anthrazit, BAD_X - (OEFF / 2 + rb / 2), 64 + WAND_H / 2, 0, bad);
box(rb, WAND_H, OEFF, M.anthrazit, BAD_X + OEFF / 2 + rb / 2, 64 + WAND_H / 2, 0, bad);
box(OEFF, TIEGEL_BODEN - 64, OEFF, M.anthrazit, BAD_X, (TIEGEL_BODEN + 64) / 2, 0, bad);
box(340, 12, rb, M.edelstahl, BAD_X, RAND_Y - 6, -(OEFF / 2 + rb / 2), bad);
box(340, 12, rb, M.edelstahl, BAD_X, RAND_Y - 6, OEFF / 2 + rb / 2, bad);
box(rb, 12, OEFF, M.edelstahl, BAD_X - (OEFF / 2 + rb / 2), RAND_Y - 6, 0, bad);
box(rb, 12, OEFF, M.edelstahl, BAD_X + OEFF / 2 + rb / 2, RAND_Y - 6, 0, bad);
// Innenwände des Tiegels (sichtbar bei geöffneter Abdeckung)
const innen = new THREE.MeshStandardMaterial({ color: 0x4d545b, metalness: 0.8, roughness: 0.45, side: THREE.BackSide });
// Tiegel-Innenseite 2 mm eingerückt und unterhalb des Randes (verhindert Flackern durch gleiche Ebenen)
const TIEGEL_OBEN = RAND_Y - 15, TIEGEL_UNTEN = TIEGEL_BODEN + 2;
const tiegel = mesh(new THREE.BoxGeometry(OEFF - 4, TIEGEL_OBEN - TIEGEL_UNTEN, OEFF - 4), innen, bad, false);
tiegel.position.set(BAD_X, (TIEGEL_OBEN + TIEGEL_UNTEN) / 2, 0);
export const zinn = mesh(new THREE.PlaneGeometry(OEFF - 6, OEFF - 6), M.zinn, bad, false);
zinn.userData.dyn = true;
zinn.rotation.x = -Math.PI / 2; zinn.position.x = BAD_X;
export const zinnY = () => 270 + 1.5 * st.fuell;
// Warnschilder und Typschild
schildPlatte(TEX.heiss, 70, 61, bad, BAD_X - 80, 300, 170.6);
schildPlatte(TEX.heiss, 70, 61, bad, BAD_X + 170.6, 300, 60, Math.PI / 2);
schildPlatte(TEX.schild('Sn 99,3 · max. 300 °C', '#d8dcdf', '#1b232c', 320, 48), 120, 18, bad, BAD_X - 80, 250, 170.6);
// Temperaturregler mit Anzeige
const reglerTex = canvasTextur(256, 128, () => {});
export function reglerZeichnen() {
  const c = reglerTex.userData.canvas, g = c.getContext('2d');
  g.fillStyle = '#101214'; g.fillRect(0, 0, 256, 128);
  g.fillStyle = st.temp >= TEMP_SOLL ? '#ff4a2a' : '#ffb01a';
  g.font = '600 64px "IBM Plex Mono", Consolas, monospace'; g.textAlign = 'right'; g.textBaseline = 'middle';
  g.fillText(String(Math.round(st.temp)), 200, 52);
  g.font = '500 28px "IBM Plex Mono", monospace'; g.fillStyle = '#7ad16b'; g.fillText('SP 280', 200, 104);
  g.fillStyle = '#9aa3ab'; g.font = '500 22px Arial'; g.textAlign = 'left'; g.fillText('°C', 206, 40);
  g.fillStyle = st.heizung ? '#ff4a2a' : '#3a2020'; g.beginPath(); g.arc(226, 100, 8, 0, 7); g.fill();
  reglerTex.needsUpdate = true;
}
// Regler im Format 96 x 48 (DIN, z. B. JUMO dTRON 316): Frontrahmen, zweizeilige LED-Anzeige (Ist rot, Soll grün), 4 Tasten
box(110, 70, 8, M.anthrazit, BAD_X + 80, 300, 174, bad);                                 // Einbaukonsole
box(96, 48, 6, M.kunststoff, BAD_X + 80, 300, 181, bad);                                 // Frontrahmen
schildPlatte(reglerTex, 70, 35, bad, BAD_X + 80, 304, 184.2);
for (let i = 0; i < 4; i++) box(9, 5, 2, M.schwarz, BAD_X + 53 + i * 18, 280.5, 184.5, bad);
schildPlatte(TEX.schild('JUMO dTRON 316', '#202326', '#cfd4d8', 256, 32), 40, 5, bad, BAD_X + 61, 330, 178.2);
// Hauptschalter und Betriebsleuchte Heizung
zyl(14, 6, M.gelb, BAD_X + 150, 230, 173, 'z', bad, 20); zyl(9, 10, M.rot, BAD_X + 150, 230, 180, 'z', bad, 20); box(4, 22, 6, M.rot, BAD_X + 150, 230, 186, bad);
schildPlatte(TEX.schild('Lötbad 25 kg · 3,5 kW · 400 V 3~', '#d8dcdf', '#1b232c', 384, 40), 110, 12, bad, BAD_X - 80, 220, 170.6);
// Randabsaugung an der Rückseite mit Abluftkanal
box(300, 54, 40, M.edelstahl, BAD_X, RAND_Y + 27, -150, bad);
for (let i = 0; i < 7; i++) box(30, 8, 1, M.schwarz, BAD_X - 120 + i * 40, RAND_Y + 34, -129.6, bad);
box(160, 60, 70, M.edelstahl, BAD_X, RAND_Y + 30, -200, bad);
zyl(45, 400, M.edelstahl, BAD_X, RAND_Y + 30, -400, 'z', bad, 32);       // Abluftkanal nach hinten durch die Rückwand
zyl(47, 16, M.edelstahl, BAD_X, RAND_Y + 30, -560, 'z', bad, 32);
zyl(45, 900, M.edelstahl, BAD_X, RAND_Y + 30 + 405, -650, null, bad, 32);
zyl(47, 16, M.edelstahl, BAD_X, RAND_Y + 30, -650, null, bad, 32);
label('Randabsaugung', bad, BAD_X, RAND_Y + 110, -200, 'klein');
// Thermoelement −BG9 (Anschlusskopf) und Niveauelektrode −BG10
{
  zyl(4, 210, M.stahl, BAD_X - 100, RAND_Y - 50, -105, null, bad, 12);
  zyl(14, 26, M.edelstahl, BAD_X - 100, RAND_Y + 68, -105, null, bad, 24);
  zyl(16, 10, M.edelstahl, BAD_X - 100, RAND_Y + 86, -105, null, bad, 24);
  zyl(5, 14, M.kunststoff, BAD_X - 84, RAND_Y + 70, -105, 'x', bad, 12);
  const mat = sensorLed(bad, BAD_X - 100, RAND_Y + 92, -105, 'BG9_Temperatur', 6, 2, 6);
  SENSOREN.push({ signal: 'BG9_Temperatur', mat, div: label('−BG9 Temperatur', bad, BAD_X - 100, RAND_Y + 130, -105, 'klein') });
  for (const dx of [-5, 5]) zyl(2.5, 180, M.stahl, BAD_X + 100 + dx, 270 + 1.5 * FUELL_MIN + 90, -105, null, bad, 10);
  box(36, 30, 30, M.kunststoff, BAD_X + 100, RAND_Y + 70, -105, bad);
  const mat2 = sensorLed(bad, BAD_X + 100, RAND_Y + 86, -105, 'BG10_Fuellhoehe', 6, 2, 6);
  SENSOREN.push({ signal: 'BG10_Fuellhoehe', mat: mat2, div: label('−BG10 Füllhöhe', bad, BAD_X + 100, RAND_Y + 130, -105, 'klein') });
}
const glut = new THREE.PointLight(0xff8a3a, 0, 0.8);
glut.position.set(BAD_X, RAND_Y + 120, 0);
glut.visible = false;   // Glut wird über das Zinnmaterial (emissive) dargestellt, eine Punktlichtquelle wäre zu teuer
bad.add(glut);

