import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { box, zyl } from '../core/geometrie.js';
import { profil, stellfuss } from '../bauteile/aluprofil.js';
import { profilZylinder } from '../bauteile/zylinder.js';
import { BAD_X, RAND_Y } from './zinnbad.js';

// ----------------------------------------------------------------------------
// Abdeckung mit Abstreifzylinder −MM4 (Führungsschienen auf dem Badrand)
// ----------------------------------------------------------------------------
// Profilschienenführung Baugröße 15 auf beiden Badseiten, weitergeführt auf dem Gestell von −MM4.
// Hub 320: Deckelmitte BAD_X (zu) … BAD_X + 320 (offen), Führungswagen bei ±105, Abstreifdichtungen bis ±132.
// Die Schiene trägt die Wagen in beiden Endlagen; die Endanschläge sitzen 1 mm hinter den Dichtungen und
// bleiben unter der Deckelplatte (Unterkante FS_OBEN + 9).
const FS_Z = 161, FS_OBEN = RAND_Y + 13;
for (const sz of [-1, 1]) {
  box(628, 13, 15, M.stahl, BAD_X + 160, RAND_Y + 6.5, sz * FS_Z);                                    // x BAD_X − 154 … BAD_X + 474
  for (let x = BAD_X - 124; x <= BAD_X + 456; x += 60) zyl(3.3, 1, M.schwarz, x, FS_OBEN + 0.5, sz * FS_Z, null, anlage, 10);
  for (const x of [BAD_X - 140, BAD_X + 460]) box(14, 20, 30, M.anthrazit, x, RAND_Y + 10, sz * FS_Z);     // Endanschläge mit Puffer
  profil(45, 45, 750, 'x', 980, RAND_Y - 22.5, sz * FS_Z);                                               // Tragprofil neben dem Bad
}
// Gestell für Führung und −MM4: 4 Stützen, Querträger, Aufnahmeplatte
for (const x of [1000, 1330]) for (const sz of [-1, 1]) { profil(45, 45, RAND_Y - 45 - 50, 'y', x, (RAND_Y - 45 + 50) / 2, sz * FS_Z); stellfuss(x, sz * FS_Z); }
for (const x of [1000, 1330]) profil(45, 45, 2 * FS_Z - 45, 'z', x, 318, 0);
box(380, 6, 120, M.deckel, 1165, 343.5, 0);
export const deckel = new THREE.Group();
anlage.add(deckel);
box(300, 10, 2 * FS_Z + 40, M.edelstahl, 0, FS_OBEN + 14, 0, deckel);
for (const sz of [-1, 1]) for (const sx of [-1, 1]) {
  box(42, 15, 34, M.stahl, sx * 105, FS_OBEN + 1.5, sz * FS_Z, deckel);                        // Führungswagen
  box(6, 9, 30, M.kunststoff, sx * 105 + sx * 24, FS_OBEN, sz * FS_Z, deckel);                  // Abstreifdichtung
  zyl(2.5, 6, M.messing, sx * 105 - sx * 24, FS_OBEN + 5, sz * FS_Z, 'x', deckel, 8);           // Schmiernippel (über den Schienenkappen)
}
box(240, 6, 6, M.edelstahl, 0, FS_OBEN + 22, 0, deckel);
for (const sz of [-1, 1]) box(12, 30, 12, M.edelstahl, 0, FS_OBEN + 34, sz * 60, deckel);
box(240, 10, 12, M.edelstahl, 0, FS_OBEN + 52, 0, deckel);                                      // Griffleiste
// Mitnehmer an einer Konsole vor der Deckelkante. Bauraum lokal x 173…203: in der Endlage „zu“ 3 mm neben dem
// Badgehäuse (x BAD_X + 170, sonst steckt der Mitnehmer unter Randhöhe in dessen Wand), in „offen“ 6 mm vor dem
// Lagerdeckel von −MM4 – daher kurzes Ausgleichsstück statt Ausgleichskupplung mit Kontermutter
box(35, 10, 70, M.deckel, 165.5, FS_OBEN + 14, 0, deckel);                                      // Konsole
box(10, 80, 70, M.deckel, 178, 405, 0, deckel);                                                  // Mitnehmer
zyl(12, 14, M.stahl, 190, 380, 0, 'x', deckel, 6);                                               // Ausgleichsstück (Schlüsselfläche)
zyl(9, 3, M.schwarz, 198.5, 380, 0, 'x', deckel, 16);
zyl(8, 375, M.stahl, 200 + 187.5, 380, 0, 'x', deckel);
export const mm4 = profilZylinder(anlage, {
  laenge: 400, bohrung: 40, position: new THREE.Vector3(1360, 380, 0), rotation: new THREE.Euler(0, Math.PI, 0),
  name: '−MM4 Abstreifen', fuesse: true, seite: -1, drossel: 'MM4',
  sensoren: [{ x: 40, signal: 'BG7_MM4_offen', text: '−BG7', dir: -1 }, { x: 360, signal: 'BG8_MM4_zu', text: '−BG8', dir: 1 }],
});

