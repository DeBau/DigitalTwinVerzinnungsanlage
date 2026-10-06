import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { TEX } from '../core/texturen.js';
import { M } from '../core/materialien.js';
import { mesh } from '../core/geometrie.js';
import { label } from '../core/beschriftung.js';

// Kabelbrücke am Boden: Schaltschrank → Bedienpult → Bandantrieb / Lichtschranken
// Trapezquerschnitt entlang des Verlegeweges geführt, an der Ecke auf Gehrung (45°) gestoßen
//
// Jede Leitung bekommt eine eigene Lage quer in der Brücke (6 mm Abstand, mittig).
// Die Deckfläche ist nur ±60 mm breit, von dort fällt die Schräge bis ±110 ab:
// was weiter außen verlegt wird, schaut seitlich unter der Abdeckung heraus.
export const BRUECKE = { x: -1250, z: 1060, y: 14 };
const LAGEN = 22;
let nLage = 0;
export function lage() {
  const n = nLage++;
  if (n >= LAGEN) console.warn('Kabelbrücke: mehr Leitungen (' + (n + 1) + ') als Lagen (' + LAGEN + ')');
  return (n - (LAGEN - 1) / 2) * 6;                     // −63 … +63 mm quer (außen unter der Schräge, dort noch 26 mm hoch)
}
{
  const profil = [[-110, 0], [110, 0], [60, 28], [-60, 28]];
  const weg = [[-1250, -80], [-1250, 1060], [2750, 1060]];
  const pos = [], uv = [], idx = [];
  const n = weg.length;
  const quer = weg.map((p, i) => {
    const d0 = i > 0 ? new THREE.Vector2(p[0] - weg[i - 1][0], p[1] - weg[i - 1][1]).normalize() : null;
    const d1 = i < n - 1 ? new THREE.Vector2(weg[i + 1][0] - p[0], weg[i + 1][1] - p[1]).normalize() : null;
    const t = (d0 && d1) ? d0.clone().add(d1).normalize() : (d0 || d1);
    const nrm = new THREE.Vector2(t.y, -t.x);                             // Querrichtung
    const k = (d0 && d1) ? 1 / Math.max(0.3, nrm.dot(new THREE.Vector2(d1.y, -d1.x))) : 1;   // Gehrungsfaktor
    return { p, nrm, k };
  });
  let lauf = 0;
  quer.forEach((q, i) => {
    if (i) lauf += Math.hypot(q.p[0] - weg[i - 1][0], q.p[1] - weg[i - 1][1]);
    for (const [u, v] of profil) {
      pos.push(q.p[0] + q.nrm.x * u * q.k, v + 0.5, q.p[1] + q.nrm.y * u * q.k);
      uv.push((lauf + u * 0.6) / 110, 0.5);
    }
  });
  const m = profil.length;
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < m; j++) {
    const a = i * m + j, b = i * m + (j + 1) % m, c = (i + 1) * m + j, d = (i + 1) * m + (j + 1) % m;
    idx.push(a, c, b, b, c, d);
  }
  for (const i of [0, n - 1]) { const o = i * m; idx.push(...(i ? [o, o + 1, o + 2, o, o + 2, o + 3] : [o, o + 2, o + 1, o, o + 3, o + 2])); }   // Stirnseiten
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mat = M.warn.clone(); mat.map = TEX.warnband.clone(); mat.map.needsUpdate = true;
  mat.side = THREE.DoubleSide;
  mesh(geo, mat, anlage, false);
  label('Kabelbrücke', anlage, -900, 60, 1060, 'klein');
}
