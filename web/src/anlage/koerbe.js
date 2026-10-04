import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { anlage } from '../core/szene.js';
import { TEX } from '../core/texturen.js';
import { M } from '../core/materialien.js';
import { V, box, cached, mesh, zyl } from '../core/geometrie.js';

// ----------------------------------------------------------------------------
// Materialkörbe: Edelstahl-Drahtkorb (Werkstückträgerkorb), wie für Tauch- und Reinigungsprozesse üblich:
//  Randrahmen und Eckstäbe Rundstahl Ø6, Drahtgitter Ø2,5 mit 13 mm Masche (punktgeschweißt),
//  Lochblech-Zwischenboden mit 6 × 6 Aufnahmen Ø9 (Teilung 15) und Ablauflöchern Ø4, Kufen aus Flachstahl
//  mit PU-Stoßpuffern (Teilung im Stau 150 mm), Tragbügel Ø10 bei 158 mm mit Stützstreben. Oben offen.
//  Kleinteile: Rohrkabelschuhe Cu (Rohr Ø8, Lasche 12 mm mit Loch Ø5), stehen mit dem Rohr in der Aufnahme.
// Die Geometrie wird einmal aufgebaut und je Material verschmolzen (gruppeVerschmelzen), alle Körbe teilen sie:
//  je Korb 4 Draw-Calls (Draht, Blech/Kufen, Puffer, Teile als InstancedMesh).
// Dazu Tropfen und Dämpfe.
// ----------------------------------------------------------------------------
export const KUPFER = new THREE.Color(0xb8743f), ZINN_FARBE = new THREE.Color(0xdfe4e8);
export const TEILE_RASTER = 6, TEILE_JE_KORB = TEILE_RASTER * TEILE_RASTER;   // 36 Teile je Korb
const TEIL_TEILUNG = 15, LOCHBLECH_Y = 40;                                        // Aufnahmeraster, Oberkante Zwischenboden
const drahtMat = new THREE.MeshStandardMaterial({ color: 0xc3c9ce, metalness: 0.85, roughness: 0.32 });   // Draht elektropoliert
const pufferMat = new THREE.MeshStandardMaterial({ color: 0x24272a, metalness: 0.0, roughness: 0.8 });    // PU-Puffer
export const koerbe = [];
let korbNr = 0;
export function korbNrZuruecksetzen() { korbNr = 0; }
// Direkte Kind-Meshes einer Gruppe je Material zu einem Mesh zusammenfassen (z. B. Korb: Rahmen, Gitter, Bügel)
function gruppeVerschmelzen(g) {
  const je = new Map();
  for (const k of g.children) if (k.isMesh && !k.isInstancedMesh && k.children.length === 0) { if (!je.has(k.material)) je.set(k.material, []); je.get(k.material).push(k); }
  for (const [m, liste] of je) {
    if (liste.length < 2) continue;
    const uv = !!(m.map || m.alphaMap || m.roughnessMap);
    const geos = liste.map(k => {
      k.updateMatrix();
      const geo = (k.geometry.index ? k.geometry.toNonIndexed() : k.geometry.clone());
      for (const n of Object.keys(geo.attributes)) if (n !== 'position' && n !== 'normal' && !(uv && n === 'uv')) geo.deleteAttribute(n);
      geo.applyMatrix4(k.matrix); geo.clearGroups();
      return geo;
    });
    const merged = mergeGeometries(geos, false);
    geos.forEach(x => x.dispose());
    if (!merged) continue;
    for (const k of liste) g.remove(k);
    const mm = new THREE.Mesh(merged, m); mm.castShadow = liste.some(k => k.castShadow); mm.receiveShadow = true;
    g.add(mm);
  }
}
// Rundstab von a nach b (Radius r; offene Enden beim dünnen Draht sparen Dreiecke)
const _y = new THREE.Vector3(0, 1, 0);
function stab(a, b, r, mat, g, seg = 6, offen = true) {
  const d = new THREE.Vector3().subVectors(b, a), len = d.length();
  const m = mesh(cached(`stab${r}|${len.toFixed(1)}|${seg}|${offen}`, () => new THREE.CylinderGeometry(r, r, len, seg, 1, offen)), mat, g, true);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(_y, d.normalize());
  return m;
}
function kugel(p, r, mat, g) { const m = mesh(cached(`kugel${r}`, () => new THREE.SphereGeometry(r, 10, 6)), mat, g, true); m.position.copy(p); return m; }
// Rohrkabelschuh Cu (ähnlich DIN 46235), Achse lokal y, Mitte im Ursprung (−18 … +18):
//  Rohr Ø8/Ø6 × 16, flachgequetschter Übergang, Lasche 12 × 1,6 mit Loch Ø5; Lasche bündig mit der Rohrunterseite (lokal +z)
export function teilGeometrie() {
  return cached('kabelschuh', () => {
    const rohr = new THREE.LatheGeometry([new THREE.Vector2(3, 0), new THREE.Vector2(3, -16), new THREE.Vector2(4, -16), new THREE.Vector2(4, 0)], 12);
    const ueb = new THREE.CylinderGeometry(4, 4, 4, 12, 1, true); ueb.translate(0, 2, 0);
    const p = ueb.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) > 3) { p.setX(i, p.getX(i) * 1.5); p.setZ(i, 3.2 + p.getZ(i) * 0.2); }
    ueb.computeVertexNormals();
    const form = new THREE.Shape();
    form.moveTo(-6, 4); form.lineTo(6, 4); form.lineTo(6, 14); form.absarc(0, 14, 6, 0, Math.PI, false); form.lineTo(-6, 4);
    const loch = new THREE.Path(); loch.absarc(0, 14, 2.5, 0, Math.PI * 2, true); form.holes.push(loch);
    const lasche = new THREE.ExtrudeGeometry(form, { depth: 1.6, bevelEnabled: false, curveSegments: 8 }); lasche.translate(0, 0, 2.4);
    const teile = [rohr, ueb, lasche].map(x => { const n = x.index ? x.toNonIndexed() : x; for (const a of Object.keys(n.attributes)) if (a !== 'position' && a !== 'normal') n.deleteAttribute(a); return n; });
    const geo = mergeGeometries(teile, false); geo.translate(0, -2, 0);
    return geo;
  });
}
// Lochblech-Zwischenboden 100 × 100 × 1,5: Aufnahmen Ø9 im Raster, dazwischen Ablauflöcher Ø4 (Zinn und Wasser laufen ab)
function lochblech() {
  const f = new THREE.Shape(); f.moveTo(-50, -50); f.lineTo(50, -50); f.lineTo(50, 50); f.lineTo(-50, 50); f.lineTo(-50, -50);
  const h = (TEILE_RASTER - 1) / 2;
  const loch = (x, y, r) => { const p = new THREE.Path(); p.absarc(x, y, r, 0, Math.PI * 2, true); f.holes.push(p); };
  for (let i = 0; i < TEILE_RASTER; i++) for (let j = 0; j < TEILE_RASTER; j++) loch((i - h) * TEIL_TEILUNG, (j - h) * TEIL_TEILUNG, 4.5);
  for (let i = 0; i < TEILE_RASTER - 1; i++) for (let j = 0; j < TEILE_RASTER - 1; j++) loch((i - h + 0.5) * TEIL_TEILUNG, (j - h + 0.5) * TEIL_TEILUNG, 2);
  const geo = new THREE.ExtrudeGeometry(f, { depth: 1.5, bevelEnabled: false, curveSegments: 4 });
  geo.rotateX(-Math.PI / 2);                                                    // liegt waagrecht, Dicke nach oben
  return geo;
}
// Korb-Bausatz einmal erzeugen und je Material verschmelzen
function korbBausatz() {
  return cached('korbBausatz', () => {
    const g = new THREE.Group();
    const R = 52, Y0 = 9, Y1 = 87;                                              // Mittellinie Randrahmen, Boden-/Oberrahmen
    // Randrahmen oben/unten und Eckstäbe Rundstahl Ø6
    for (const y of [Y0, Y1]) for (const s of [-1, 1]) { stab(V(-R, y, s * R), V(R, y, s * R), 3, drahtMat, g, 8, false); stab(V(s * R, y, -R), V(s * R, y, R), 3, drahtMat, g, 8, false); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { stab(V(sx * R, Y0, sz * R), V(sx * R, Y1, sz * R), 3, drahtMat, g, 8, false); for (const y of [Y0, Y1]) kugel(V(sx * R, y, sz * R), 3, drahtMat, g); }
    // Drahtgitter Ø2,5: senkrechte Drähte innen am Rahmen, waagrechte Drähte außen aufgeschweißt
    const T = 13, rw = 1.25;
    for (let i = 1; i <= 7; i++) {
      const q = -R + i * T;
      for (const s of [-1, 1]) {
        stab(V(s * (R - 1.5), Y0, q), V(s * (R - 1.5), Y1, q), rw, drahtMat, g);    // Seitenwände x = ±R
        stab(V(q, Y0, s * (R - 1.5)), V(q, Y1, s * (R - 1.5)), rw, drahtMat, g);    // Stirnwände z = ±R
      }
      stab(V(q, Y0 - 1.5, -R), V(q, Y0 - 1.5, R), rw, drahtMat, g);                // Boden in beide Richtungen
      stab(V(-R, Y0 + 1, q), V(R, Y0 + 1, q), rw, drahtMat, g);
    }
    for (let j = 1; j <= 6; j++) {
      const y = Y0 + j * (Y1 - Y0) / 7;
      for (const s of [-1, 1]) {
        stab(V(s * (R + 1), y, -R), V(s * (R + 1), y, R), rw, drahtMat, g);
        stab(V(-R, y, s * (R + 1)), V(R, y, s * (R + 1)), rw, drahtMat, g);
      }
    }
    // Zwischenboden: Lochblech auf zwei Tragstäben Ø4
    const lb = mesh(cached('lochblech', lochblech), M.edelstahl, g, true); lb.position.y = LOCHBLECH_Y - 1.5;
    for (const s of [-1, 1]) stab(V(-R + 1, LOCHBLECH_Y - 3.5, s * 32), V(R - 1, LOCHBLECH_Y - 3.5, s * 32), 2, drahtMat, g, 8);
    // Kufen Flachstahl 8 × 6 mit Stegen, PU-Stoßpuffer vorn/hinten (Gesamtlänge 150 = Teilung im Stau)
    for (const sx of [-1, 1]) {
      box(8, 6, 126, M.edelstahl, sx * 38, 3, 0, g);
      for (const sz of [-1, 1]) {
        box(6, 4, 6, M.edelstahl, sx * 38, 7, sz * 50, g);                            // Steg zum Bodenrahmen (schmaler als die Kufe)
        box(14, 14, 3, M.edelstahl, sx * 38, 8, sz * 62, g);                          // Halteplatte Puffer (0,5 mm vor dem Kufenende)
        const p = mesh(cached('puffer', () => new THREE.CylinderGeometry(6, 7, 12, 14)), pufferMat, g, true);
        p.rotation.x = sz * Math.PI / 2; p.position.set(sx * 38, 8, sz * 69);          // reicht bis z = ±75
      }
    }
    // Tragbügel: Bügel Ø10 bei 158 (liegt in den Hakenmulden), Streben Ø8 zum Oberrahmen, Diagonalstreben Ø5
    for (const sz of [-1, 1]) {
      stab(V(0, Y1, sz * 49), V(0, 158, sz * 49), 4, M.stahl, g, 10, false);
      kugel(V(0, 158, sz * 49), 5, M.stahl, g);
      for (const sx of [-1, 1]) stab(V(0, 130, sz * 49), V(sx * R, Y1, sz * R), 2.5, M.stahl, g, 8, false);
      zyl(5.6, 8, M.stahl, 0, 158, sz * 44, 'z', g, 12);                             // Anschläge im Haken (enden 1 mm vor dem Bügelende)
      box(14, 4, 10, M.stahl, 0, Y1 + 3, sz * 50, g);                                // Schweißlasche am Rahmen
    }
    zyl(5, 98, M.stahl, 0, 158, 0, 'z', g, 16);
    gruppeVerschmelzen(g);
    return g.children.map(c => ({ geo: c.geometry, mat: c.material, schatten: c.castShadow }));
  });
}
// Aufnahmeplätze der Teile; nach x sortiert, damit beim Kippen (zur +x-Seite) die vorderen Plätze zuerst leer werden
function teilPlaetze() {
  return cached('teilPlaetze', () => {
    const h = (TEILE_RASTER - 1) / 2, liste = [];
    for (let i = 0; i < TEILE_RASTER; i++) for (let j = 0; j < TEILE_RASTER; j++) liste.push([(i - h) * TEIL_TEILUNG, (j - h) * TEIL_TEILUNG]);
    return liste.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  });
}
export function kipperKorb() { return koerbe.find(k => k.zustand === 'kipper'); }
export function korbErzeugen(z) {
  const g = new THREE.Group(); g.userData.dyn = true;
  for (const { geo, mat, schatten } of korbBausatz()) { const m = new THREE.Mesh(geo, mat); m.castShadow = schatten; m.receiveShadow = true; g.add(m); }
  // Teile auf festen Plätzen: Rohr steckt in der Aufnahme, Lasche nach oben (fluchtet in Korb-x, minimal verdreht)
  const teilMat = new THREE.MeshStandardMaterial({ color: KUPFER.clone(), metalness: 0.85, roughness: 0.3 });
  const im = new THREE.InstancedMesh(teilGeometrie(), teilMat, TEILE_JE_KORB);
  const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
  teilPlaetze().forEach(([x, zz], i) => {
    e.set(0, (Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.04); q.setFromEuler(e);
    im.setMatrixAt(i, mt.compose(p.set(x, LOCHBLECH_Y + 2, zz), q, s));
  });
  im.castShadow = false; im.receiveShadow = true; im.computeBoundingSphere(); g.add(im);
  const teileMesh = [im];                                                        // count = Teile noch im Korb
  if (window.__lambertAktiv) g.traverse((o) => { if (o.isMesh) { o.material = window.__lambertAktiv(o.material); o.receiveShadow = false; } });
  anlage.add(g);
  const k = { nr: ++korbNr, z, x: 0, temp: 20, geprueft: false, pruefung: null, zustand: 'band', fertig: false, tauch: 0, tropf: 0, imBad: false, getaucht: false, beschichtung: 0, g, teilMat, teileMesh, tropfenTakt: 0 };
  koerbe.push(k);
  return k;
}
korbErzeugen(-150);

export const tropfen = [];
const tropfGeo = new THREE.SphereGeometry(3, 8, 6);
export function tropfenErzeugen(x, y, z) {
  const m = new THREE.Mesh(tropfGeo, M.zinn);
  m.position.set(x + (Math.random() - 0.5) * 90, y, z + (Math.random() - 0.5) * 90);
  anlage.add(m);
  tropfen.push({ m, v: 0 });
}
export const daempfe = [];
export const rauchMat = new THREE.SpriteMaterial({ map: TEX.rauch, transparent: true, depthWrite: false, opacity: 0.5 });
export function korbEntfernen(k) {
  k.g.parent?.remove(k.g);
  koerbe.splice(koerbe.indexOf(k), 1);
}
