import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { box, mesh } from '../core/geometrie.js';

// Schlauch / Kabel entlang Stützpunkten
export function schlauch(pts, mat, r = 3, parent = anlage, seg = 64) {
  const kurve = new THREE.CatmullRomCurve3(pts.map(p => p.isVector3 ? p : new THREE.Vector3(...p)), false, 'centripetal');
  const m = mesh(new THREE.TubeGeometry(kurve, Math.min(seg, 32), r, r < 3 ? 5 : 7), mat, parent);
  m.userData = { r, seg };
  return m;
}
function schlauchNeu(m, pts) {
  m.geometry.dispose();
  const kurve = new THREE.CatmullRomCurve3(pts.map(p => p.isVector3 ? p : new THREE.Vector3(...p)), false, 'centripetal');
  m.geometry = new THREE.TubeGeometry(kurve, m.userData.seg, m.userData.r, 8);
}
// Rechtwinklige Leitungsführung mit Biegeradius (Schläuche/Leitungen wie verlegt)
function orthoKurve(pts, R = 35) {
  const P = pts.map(p => p.isVector3 ? p.clone() : new THREE.Vector3(...p));
  const pfad = new THREE.CurvePath();
  let cur = P[0];
  for (let i = 1; i < P.length - 1; i++) {
    const din = P[i].clone().sub(P[i - 1]), dout = P[i + 1].clone().sub(P[i]);
    const r = Math.min(R, din.length() / 2, dout.length() / 2);
    din.normalize(); dout.normalize();
    const a = P[i].clone().addScaledVector(din, -r), e = P[i].clone().addScaledVector(dout, r);
    if (cur.distanceTo(a) > 0.01) pfad.add(new THREE.LineCurve3(cur, a));
    pfad.add(new THREE.QuadraticBezierCurve3(a, P[i].clone(), e));
    cur = e;
  }
  pfad.add(new THREE.LineCurve3(cur, P[P.length - 1]));
  return pfad;
}
export function leitung(pts, mat, r = 3, R = 35, parent = anlage) {
  const k = orthoKurve(pts, R);
  return mesh(new THREE.TubeGeometry(k, Math.max(12, Math.round(k.getLength() / 25)), r, r < 3 ? 5 : 7), mat, parent);
}
// Mehrere Rohr-Geometrien zu einer zusammenfassen (statische Leitungsbündel, spart Draw-Calls)
function zusammenfuegen(geos) {
  let nv = 0, ni = 0;
  for (const g of geos) { nv += g.attributes.position.count; ni += g.index.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), idx = new Uint32Array(ni);
  let ov = 0, oi = 0;
  for (const g of geos) {
    pos.set(g.attributes.position.array, ov * 3); nor.set(g.attributes.normal.array, ov * 3);
    const I = g.index.array;
    for (let i = 0; i < I.length; i++) idx[oi + i] = I[i] + ov;
    ov += g.attributes.position.count; oi += I.length; g.dispose();
  }
  const r = new THREE.BufferGeometry();
  r.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  r.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  r.setIndex(new THREE.BufferAttribute(idx, 1));
  return r;
}
// Sammler: Leitungen je Material sammeln und am Ende als ein Mesh je Material erzeugen
export function buendel(parent = anlage) {
  const map = new Map();
  return {
    add(pts, mat, r, R = 20) {
      const k = orthoKurve(pts, R);
      if (!map.has(mat)) map.set(mat, []);
      map.get(mat).push(new THREE.TubeGeometry(k, Math.max(6, Math.round(k.getLength() / 20)), r, r < 2 ? 4 : 6));
    },
    fertig() { for (const [mat, geos] of map) mesh(zusammenfuegen(geos), mat, parent); map.clear(); },
  };
}
// Schlauchhalter / Kabelbinder an einer Stelle
export function halter(x, y, z, achse = 'y', parent = anlage) {
  const m = box(achse === 'y' ? 14 : 10, achse === 'y' ? 10 : 14, 26, M.kunststoff, x, y, z, parent);
  return m;
}
