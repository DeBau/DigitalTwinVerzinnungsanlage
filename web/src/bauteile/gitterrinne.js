import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { V, box, zyl } from '../core/geometrie.js';

// ----------------------------------------------------------------------------
// Gitterrinne (Stahldraht Ø 4,4 verzinkt, Maschenweite 50) mit Aussparungen im Boden für Leitungsabgänge
// Lokale Lage: Rinnenachse x von 0 bis L, Boden bei y = 0 (Querstäbe darunter), Seiten bis y = h, quer z ±b/2.
//   lage:       Drehung der lokalen Achsen in die Anlage (Matrix4, null = waagrecht entlang x)
//   aussparung: [{ x0, x1, z0, z1, kante }] Bodendrähte und Querstäbe herausgeschnitten; Kantenschutz auf der Kante
//               kante (x0 oder x1), über die die Leitungen nach unten laufen
// ----------------------------------------------------------------------------
const MASCHE = 50;
// Strecke a…e ohne die Lücken [[l0, l1], …]
function ohne(a, e, luecken) {
  const teile = [];
  let p = a;
  for (const [l0, l1] of luecken.sort((u, w) => u[0] - w[0])) { if (l0 > p) teile.push([p, l0]); p = Math.max(p, l1); }
  if (e > p) teile.push([p, e]);
  return teile;
}
// Steigrinne: lokal x nach oben, Boden an der Wand (Ebene x = konst.), zur Seite s·x offen, quer = Welt-z
export const steigend = (s) => new THREE.Matrix4().makeBasis(V(0, 1, 0), V(s, 0, 0), V(0, 0, -s));

export function gitterrinne(pos, L, { b = 200, h = 60, lage = null, aussparung = [] } = {}) {
  const g = new THREE.Group(); g.position.copy(pos); if (lage) g.quaternion.setFromRotationMatrix(lage); anlage.add(g);
  const draht = (x0, x1, y, z) => zyl(2.2, x1 - x0, M.verzinkt, (x0 + x1) / 2, y, z, 'x', g, 6);
  for (const z of [-b / 2, -b / 4, 0, b / 4, b / 2]) {
    for (const [a, e] of ohne(0, L, aussparung.filter(s => z > s.z0 && z < s.z1).map(s => [s.x0, s.x1]))) draht(a, e, 0, z);
  }
  for (const s of [-1, 1]) for (const y of [h / 2, h]) draht(0, L, y, s * b / 2);
  // Querstäbe unter dem Boden, in Aussparungen unterbrochen; Seitenbügel
  const staebe = [];
  for (let x = 0; x <= L; x += MASCHE) {
    for (const [a, e] of ohne(-b / 2, b / 2, aussparung.filter(s => x > s.x0 && x < s.x1).map(s => [s.z0, s.z1]))) staebe.push([x, a, e]);
  }
  const boden = new THREE.InstancedMesh(new THREE.BoxGeometry(4, 4, 1), M.verzinkt, staebe.length);
  staebe.forEach(([x, a, e], i) => boden.setMatrixAt(i, new THREE.Matrix4().compose(V(x, -2, (a + e) / 2), new THREE.Quaternion(), V(1, 1, e - a))));
  const n = Math.floor(L / MASCHE) + 1;
  const seite = new THREE.InstancedMesh(new THREE.BoxGeometry(4, h, 4), M.verzinkt, 2 * n);
  for (let i = 0; i < n; i++) for (const s of [0, 1]) seite.setMatrixAt(2 * i + s, new THREE.Matrix4().makeTranslation(i * MASCHE, h / 2, (s ? 1 : -1) * b / 2));
  boden.castShadow = seite.castShadow = true;
  g.add(boden, seite);
  // Kantenschutz: U-Profil (EPDM schwarz) von oben auf die Kante gesteckt, über die die Leitungen hinunterlaufen,
  // umschließt Querstab und Drahtenden von der Drahtoberkante bis unter den Stab
  for (const s of aussparung) box(9, 12, s.z1 - s.z0, M.schwarz, s.kante, -1.4, (s.z0 + s.z1) / 2, g);
  g.updateMatrixWorld(true);
  return g;
}
