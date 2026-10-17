import * as THREE from 'three';
import { M } from '../core/materialien.js';
import { cached, mesh } from '../core/geometrie.js';

// Drehteil um die y-Achse aus Profilpunkten [r, y] (r in mm), gecacht
const dreh = (key, pkte, seg) => cached(key, () => new THREE.LatheGeometry(pkte.map(([r, y]) => new THREE.Vector2(r, y)), seg));
// Rändelmutter: Zylinder mit Rändelung (abwechselnd Rippen), vernickeltes Messing
const raendel = (r) => cached('raendel' + r, () => {
  const seg = 28, pts = [];
  for (let i = 0; i < seg; i++) { const a = i / seg * Math.PI * 2, rr = i % 2 ? r : r * 0.94; pts.push(new THREE.Vector2(Math.cos(a) * rr, Math.sin(a) * rr)); }
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: 8, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.4, bevelSegments: 1 });
  g.rotateX(-Math.PI / 2); g.translate(0, 0.5, 0);
  return g;
});
// M8/M12-Steckverbinder gerade (Bauart ifm EVC: Rändelmutter, Griffkörper TPU mit Griffmulden, Knickschutz),
// Achse entlang dir ('x','y','z' mit Vorzeichen), Länge 33 mm ab Buchse
export function stecker(parent, p, dir, gross = false) {
  const g = new THREE.Group(); g.position.copy(p); parent.add(g);
  const r = gross ? 7.5 : 5;
  if (dir[1] === 'x') g.rotation.z = dir[0] === '-' ? Math.PI / 2 : -Math.PI / 2;
  else if (dir[1] === 'z') g.rotation.x = dir[0] === '-' ? -Math.PI / 2 : Math.PI / 2;
  else if (dir[0] === '-') g.rotation.x = Math.PI;
  mesh(raendel(r), M.stahl, g);                                                    // Rändelmutter
  const k = r / 7.5;
  mesh(dreh('stGriff' + r, [[0, 9], [5.6 * k, 9], [6.6 * k, 10], [6.8 * k, 13], [6.2 * k, 17], [6.2 * k, 20], [6.8 * k, 24], [6.4 * k, 26.5], [4.8 * k, 28], [4.2 * k, 33], [0, 33]], 16), M.kunststoff, g);
  return g;
}
// M8/M12-Steckverbinder gewinkelt (Bauart ifm EVW): Rändelmutter entlang dir, Kabelabgang um 90° nach abgang.
// Gibt den Kabelaustritt (Koordinaten von parent) zurück – dort beginnt die Leitung in Richtung abgang.
const ACHSE = { '+x': [1, 0, 0], '-x': [-1, 0, 0], '+y': [0, 1, 0], '-y': [0, -1, 0], '+z': [0, 0, 1], '-z': [0, 0, -1] };
export function steckerWinkel(parent, p, dir, abgang, gross = false) {
  const g = new THREE.Group(); g.position.copy(p); parent.add(g);
  const a = new THREE.Vector3(...ACHSE[dir]), b = new THREE.Vector3(...ACHSE[abgang]);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), a);
  const r = gross ? 7.5 : 5, k = r / 7.5;
  const ende = 19 * k + 4 + 6.4 * k - 2.4;                                         // Kopf endet knapp hinter dem Kabelabgang (M12: 27)
  mesh(raendel(r), M.stahl, g);                                                    // Rändelmutter
  mesh(dreh('stWKopf' + r, [[0, 9], [5.6 * k, 9], [6.6 * k, 10], [6.8 * k, 13], [6.8 * k, ende - 2], [6.2 * k, ende], [0, ende]], 16), M.kunststoff, g);
  const arm = new THREE.Group(); arm.position.set(0, 19 * k + 4, 0); g.add(arm);
  arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().applyQuaternion(g.quaternion.clone().invert()));
  mesh(dreh('stWArm' + r, [[0, 0], [6.4 * k, 0], [6.4 * k, 13], [5.4 * k, 15], [4.8 * k, 18], [4.2 * k, 24], [0, 24]], 16), M.kunststoff, arm);
  return p.clone().addScaledVector(a, 19 * k + 4).addScaledVector(b, 24);
}
