import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { box, cached, mesh, zyl } from '../core/geometrie.js';

// ----------------------------------------------------------------------------
// Bausteine: Aluprofil (Nut 8), ISO-Profilzylinder, Nutsensor, Schlauch
// ----------------------------------------------------------------------------
// Querschnitt Strukturprofil Raster 45, Nut 10 (Bauart Bosch Rexroth / item): T-Nut mit Öffnung 10,2 mm,
// Nutsteg 4,3 mm, Hinterschnitt 16,4 mm, Nutgrund mit Fasen; Ecken gefast, Kernbohrung je Rasterfeld
export function profilForm(w, h, modul, mitBohrung) {
  const s = new THREE.Shape(), c = Math.min(2.5, w * 0.06);
  const o = 5.1, l = 4.3, u = 8.2, d = 12, f = 4;
  const mitten = (L) => { const a = []; for (let p = -L / 2 + modul / 2; p < L / 2; p += modul) a.push(p); return a; };
  const mx = mitten(w), my = mitten(h);
  // Nut als Punktfolge relativ zur Kante: q = Lage entlang der Kante (Laufrichtung), t = Tiefe nach innen
  const nut = (q, r) => [[q - o * r, 0], [q - o * r, l], [q - u * r, l], [q - u * r, l + 3], [q - f * r, d], [q + f * r, d], [q + u * r, l + 3], [q + u * r, l], [q + o * r, l], [q + o * r, 0]];
  s.moveTo(-w / 2 + c, -h / 2);
  for (const x of mx) for (const [q, t] of nut(x, 1)) s.lineTo(q, -h / 2 + t);
  s.lineTo(w / 2 - c, -h / 2); s.lineTo(w / 2, -h / 2 + c);
  for (const y of my) for (const [q, t] of nut(y, 1)) s.lineTo(w / 2 - t, q);
  s.lineTo(w / 2, h / 2 - c); s.lineTo(w / 2 - c, h / 2);
  for (const x of [...mx].reverse()) for (const [q, t] of nut(x, -1)) s.lineTo(q, h / 2 - t);
  s.lineTo(-w / 2 + c, h / 2); s.lineTo(-w / 2, h / 2 - c);
  for (const y of [...my].reverse()) for (const [q, t] of nut(y, -1)) s.lineTo(-w / 2 + t, q);
  s.lineTo(-w / 2, -h / 2 + c); s.closePath();
  if (mitBohrung) for (const x of mx) for (const y of my) s.holes.push(new THREE.Path().absarc(x, y, 4.2, 0, Math.PI * 2, true));
  return s;
}
// Strukturprofil (z. B. 45x45, 45x90) mit Endkappen
export function profil(w, h, len, achse, x, y, z, parent = anlage, kappen = true) {
  const geo = cached(`p${w}|${h}|${len}`, () => {
    const g = new THREE.ExtrudeGeometry(profilForm(w, h, 45, true), { depth: len, bevelEnabled: false, curveSegments: 6 });
    g.translate(0, 0, -len / 2);
    return g;
  });
  const g = new THREE.Group();
  g.position.set(x, y, z);
  if (achse === 'x') g.rotation.y = Math.PI / 2;
  if (achse === 'y') g.rotation.x = -Math.PI / 2;
  parent.add(g);
  mesh(geo, M.profil, g);
  // Endkappen 0,3 mm hinter der Stirnfläche im Profil (durch Nuten und Kernbohrung sichtbar). Vorstehende Kappen
  // ragten in Fußplatten und Querprofile hinein und flackerten dort mit deren Oberflächen.
  if (kappen) { for (const s of [-1, 1]) box(w - 0.6, h - 0.6, 2, M.kunststoff, 0, 0, s * (len / 2 - 1.3), g); PROFIL_ENDEN.push({ g, w, h, len }); }
  return g;
}
// ----------------------------------------------------------------------------
// Freie Profilenden bekommen eine aufgesteckte schwarze Abdeckkappe (PA, 4 mm vor der Stirnfläche).
// Ob ein Ende frei ist, prüft ein kurzer Strahl je Rasterfeld aus der Stirnfläche heraus: Trifft keiner innerhalb
// von 15 mm ein anderes Bauteil (Fußplatte, Querprofil, Winkel, Boden …), ist das Ende frei.
// Aufruf einmal nach dem Aufbau der Szene, vor dem Zusammenfassen der Meshes.
// ----------------------------------------------------------------------------
const PROFIL_ENDEN = [];
export function freieProfilendenAbdecken(wurzel) {
  wurzel.updateMatrixWorld(true);
  const kugeln = [];                                                       // Weltkugeln aller Meshes (Vorauswahl je Ende)
  wurzel.traverse((o) => {
    if (!o.isMesh || !o.visible || !o.geometry) return;
    if (!o.geometry.boundingSphere) o.isInstancedMesh ? o.computeBoundingSphere() : o.geometry.computeBoundingSphere();
    const k = o.isInstancedMesh ? o.boundingSphere : o.geometry.boundingSphere;
    if (k) kugeln.push({ o, s: k.clone().applyMatrix4(o.matrixWorld) });   // leere Geometrie (z. B. Türschlauch vor dem Öffnen): ohne Kugel
  });
  const ray = new THREE.Raycaster(), p = new THREE.Vector3(), dir = new THREE.Vector3();
  for (const { g, w, h, len } of PROFIL_ENDEN) {
    const mm = g.matrixWorld.getMaxScaleOnAxis();                          // Welt (m) je mm
    ray.far = 15 * mm;
    const eigene = new Set(); g.traverse((o) => eigene.add(o));
    for (const s of [-1, 1]) {
      const mitte = g.localToWorld(new THREE.Vector3(0, 0, s * len / 2));
      const kandidaten = kugeln.filter(({ o, s: k }) => !eigene.has(o) && k.distanceToPoint(mitte) < Math.max(w, h) * mm).map(k => k.o);
      dir.set(0, 0, s).transformDirection(g.matrixWorld);
      const punkte = [[0, 0], [-w / 4, -h / 4], [w / 4, -h / 4], [-w / 4, h / 4], [w / 4, h / 4]];
      const belegt = kandidaten.length && punkte.some(([u, v]) => {
        ray.set(g.localToWorld(p.set(u, v, s * (len / 2 + 0.2))), dir);
        return ray.intersectObjects(kandidaten, false).length > 0;
      });
      if (!belegt) box(w - 0.4, h - 0.4, 4, M.kunststoff, 0, 0, s * (len / 2 + 2), g);   // Abdeckkappe
    }
  }
}
export function stellfuss(x, z, parent = anlage) {
  zyl(28, 10, M.kunststoff, x, 5, z, null, parent);
  zyl(8, 38, M.stahl, x, 29, z, null, parent, 12);                                 // Spindel endet in der Mutter
  zyl(14, 8, M.stahl, x, 46, z, null, parent, 6);
}

