import { CSS2DObject } from 'three/addons/CSS2DRenderer.js';
import * as THREE from 'three';
import { canvasTextur } from './texturen.js';
import { cached } from './geometrie.js';

export const LABELS = [];
export function label(text, obj, x, y, z, klasse = '') {
  const div = document.createElement('div');
  div.className = 'tag3d ' + klasse;
  div.textContent = text;
  const l = new CSS2DObject(div);
  l.position.set(x, y, z);
  obj.add(l);
  LABELS.push({ div, obj: l, prio: klasse.includes('cyl') ? 3 : klasse.includes('schrank') ? 2 : 1 });
  return div;
}
export function schildPlatte(tex, w, h, parent, x, y, z, ry = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }));
  m.position.set(x, y, z); m.rotation.y = ry;
  parent.add(m);
  return m;
}

// Bedruckte Front (Canvas in mm gezeichnet), Material wird je Schlüssel einmal erzeugt
const tafelCache = new Map();
export function tafel(key, w, h, zeichnen, px = 6) {
  if (!tafelCache.has(key)) {
    const t = canvasTextur(Math.round(w * px), Math.round(h * px), (g, W, H) => { g.scale(W / w, H / h); zeichnen(g, w, h); });
    const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.55, metalness: 0.05 }); m.userData.tafel = true;
    tafelCache.set(key, m);
  }
  return tafelCache.get(key);
}
export function platte(mat, w, h, parent, x, y, z, ry = 0) {
  const m = new THREE.Mesh(cached(`pl${w}|${h}`, () => new THREE.PlaneGeometry(w, h)), mat);
  m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true;
  parent.add(m);
  return m;
}
