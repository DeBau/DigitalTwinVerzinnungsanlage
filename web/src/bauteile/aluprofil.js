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
  if (kappen) for (const s of [-1, 1]) box(w - 0.6, h - 0.6, 2, M.kunststoff, 0, 0, s * (len / 2 + 1), g);
  return g;
}
export function stellfuss(x, z, parent = anlage) {
  zyl(28, 10, M.kunststoff, x, 5, z, null, parent);
  zyl(8, 40, M.stahl, x, 30, z, null, parent, 12);
  zyl(14, 8, M.stahl, x, 46, z, null, parent, 6);
}

