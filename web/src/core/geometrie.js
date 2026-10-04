import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { anlage } from './szene.js';

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
const geoCache = new Map();
export function cached(key, fn) { if (!geoCache.has(key)) geoCache.set(key, fn()); return geoCache.get(key); }

export function mesh(geo, mat, parent = anlage, schatten = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = schatten; m.receiveShadow = true;
  parent.add(m);
  return m;
}
// Quader mit gebrochenen Kanten (Fase/Radius wie gefertigt, fängt Glanzlichter)
export function box(w, h, d, mat, x, y, z, parent = anlage) {
  // Fase nur bei Teilen ab 12 mm (kleine Teile: normaler Quader, spart Dreiecke)
  const r = Math.min(1.2, Math.min(w, h, d) * 0.18);
  const m = mesh(cached(`b${w}|${h}|${d}`, () => Math.min(w, h, d) < 12 ? new THREE.BoxGeometry(w, h, d) : new RoundedBoxGeometry(w, h, d, 1, r)), mat, parent);
  m.position.set(x, y, z);
  return m;
}
export function zyl(r, len, mat, x, y, z, achse, parent = anlage, seg = 32) {
  seg = Math.min(seg, r < 4 ? 8 : r < 10 ? 12 : r < 25 ? 16 : r < 60 ? 24 : 32);   // Segmente nach Größe
  const m = mesh(cached(`c${r}|${len}|${seg}`, () => new THREE.CylinderGeometry(r, r, len, seg)), mat, parent);
  if (achse === 'x') m.rotation.z = Math.PI / 2;
  if (achse === 'z') m.rotation.x = Math.PI / 2;
  m.position.set(x, y, z);
  return m;
}
