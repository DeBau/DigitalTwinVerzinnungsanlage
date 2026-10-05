import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { $, anlage } from './szene.js';
import { KNEBEL, PULT_TASTER } from '../anlage/register.js';
import { LED_GEO, LED_GRUPPEN, LED_LISTE } from './leds.js';
import { bodenMesh } from '../anlage/halle.js';
import { BAND, BAND2, KURVE } from '../anlage/baender.js';
import { ST } from '../anlage/pruefstation.js';
import { deckel } from '../anlage/abdeckung.js';
import { haken, hakenKoerper, mm1Piv, mm1Stange, schlitten } from '../anlage/portal.js';
import { SCHRANK } from '../anlage/schaltschrank.js';
import { Q, STUFEN, stufeSetzen } from './grafik.js';
import { t } from './sprache.js';

// ----------------------------------------------------------------------------
// Leistung: unbewegte Teile je Material und Raumbereich (1,8 m) zu einem Mesh zusammenfassen.
// Bewegte Baugruppen (Schlitten, Haken, Türen, Trommeln …) werden in sich zusammengefasst.
// Teile mit eigener Bewegung, Klickfläche, Materialwechsel oder neu berechneter Geometrie bleiben einzeln.
// ----------------------------------------------------------------------------
function szeneZusammenfassen() {
  const wurzeln = [anlage, schlitten, haken, deckel, hakenKoerper, mm1Piv, mm1Stange, BAND.anschlag, BAND.vereinzeler, ...BAND.stopperStangen, ...KURVE.rollen, ST.kipper, ST.zylBody, ST.zylStange, ST.rinneGruppe,
    ...BAND.trommeln, ...BAND2.trommeln, ...SCHRANK.tueren, ...KNEBEL.map(k => k.knebel)];
  const wurzelSet = new Set(wurzeln);
  const einzeln = new Set([bodenMesh, ...PULT_TASTER.map(t => t.kappe), ...SCHRANK.qa]);
  // kleine bedruckte Schilder (≤ 512 px) in einen gemeinsamen Textur-Atlas packen
  {
    const A = 4096, PAD = 6, liste = [];
    anlage.traverse((o) => { if (o.isMesh && o.material.userData?.tafel && !o.userData.dyn) { const cv = o.material.map.userData.canvas; if (cv.width <= 512 && cv.height <= 512) liste.push(o); } });
    const platz = new Map();
    const cvs = document.createElement('canvas'); cvs.width = cvs.height = A;
    const ctx = cvs.getContext('2d');
    let x = 0, y = 0, zeile = 0, voll = false;
    for (const o of liste) {
      const cv = o.material.map.userData.canvas;
      if (!platz.has(cv)) {
        const w = cv.width + 2 * PAD, h = cv.height + 2 * PAD;
        if (x + w > A) { x = 0; y += zeile; zeile = 0; }
        if (y + h > A) { voll = true; break; }
        ctx.drawImage(cv, x + PAD, y + PAD);
        // Randpixel nach außen ziehen (verhindert Farbsäume durch Mipmaps)
        ctx.drawImage(cv, 0, 0, cv.width, 1, x + PAD, y, cv.width, PAD); ctx.drawImage(cv, 0, cv.height - 1, cv.width, 1, x + PAD, y + PAD + cv.height, cv.width, PAD);
        platz.set(cv, { x: x + PAD, y: y + PAD, w: cv.width, h: cv.height });
        x += w; zeile = Math.max(zeile, h);
      }
    }
    if (!voll && liste.length) {
      const tex = new THREE.CanvasTexture(cvs); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
      const atlasMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.05, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
      for (const o of liste) {
        const r = platz.get(o.material.map.userData.canvas);
        const g = o.geometry.clone(), uv = g.attributes.uv;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, (r.x + uv.getX(i) * r.w) / A, 1 - (r.y + (1 - uv.getY(i)) * r.h) / A);
        o.geometry = g; o.material = atlasMat;
      }
    }
  }
  // gleiche Materialien vereinheitlichen (nur nicht leuchtende, nicht transparente – die ändern sich nie)
  const kanon = new Map();
  anlage.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material)) return;
    for (let x = o; x; x = x.parent) if (x.userData.dyn) return;     // Körbe usw. behalten eigene Materialien
    const m = o.material;
    if (m.transparent || !m.emissive || m.emissive.getHex() !== 0 || m.type !== 'MeshStandardMaterial') return;
    const key = [m.color.getHex(), m.roughness, m.metalness, m.map?.uuid, m.roughnessMap?.uuid, m.alphaMap?.uuid, m.alphaTest, m.side, m.envMapIntensity, m.flatShading].join('|');
    if (!kanon.has(key)) kanon.set(key, m); else o.material = kanon.get(key);
  });
  const gruppen = new Map();
  const inv = new THREE.Matrix4(), mat = new THREE.Matrix4(), c = new THREE.Vector3();
  anlage.updateMatrixWorld(true);
  const sammeln = (o, wurzel) => {
    for (const k of [...o.children]) {
      if (k.userData.dyn && !wurzelSet.has(k)) continue;              // eigenständig bewegt (Körbe, Schläuche …)
      if (wurzelSet.has(k)) { sammeln(k, k); continue; }
      if (k.isMesh && !k.isInstancedMesh && !k.isSkinnedMesh && !Array.isArray(k.material) && !k.material.transparent
          && k.children.length === 0 && !einzeln.has(k) && !k.userData.dyn && k.userData.art === undefined && k.userData.taster === undefined && k.visible) {
        const g = k.geometry, m = k.material;
        if (!g.attributes.position || !g.attributes.normal) continue;
        const uv = !!(m.map || m.bumpMap || m.roughnessMap || m.alphaMap) && !!g.attributes.uv;
        if ((m.map || m.bumpMap || m.roughnessMap || m.alphaMap) && !g.attributes.uv) continue;
        inv.copy(wurzel.matrixWorld).invert();
        mat.multiplyMatrices(inv, k.matrixWorld);
        if (!g.boundingSphere) g.computeBoundingSphere();
        c.copy(g.boundingSphere.center).applyMatrix4(mat);
        const zelle = wurzel === anlage ? `${Math.floor(c.x / 4000)}|${Math.floor(c.z / 4000)}` : '';
        const key = `${wurzel.uuid}|${m.uuid}|${zelle}|${uv}|${!!g.index}`;
        if (!gruppen.has(key)) gruppen.set(key, { wurzel, m, teile: [], schatten: false });
        const e = gruppen.get(key);
        e.teile.push({ k, mat: mat.clone(), uv });
        e.schatten ||= k.castShadow;
        continue;
      }
      if (!k.isMesh && !k.isCSS2DObject && !k.isLight && !k.isSprite) sammeln(k, wurzel);
    }
  };
  // LEDs je Wurzel (nächster bewegter Vorfahr oder anlage) zu InstancedMesh
  const wurzelVon = (o) => { for (let x = o.parent; x; x = x.parent) if (wurzelSet.has(x) || x === anlage || (x.userData.dyn && x !== anlage)) return x; return anlage; };
  const ledJe = new Map();
  for (const led of LED_LISTE) {
    if (!led.parent) continue;
    const w = wurzelVon(led);
    if (!ledJe.has(w)) ledJe.set(w, []);
    ledJe.get(w).push(led);
  }
  for (const [w, liste] of ledJe) {
    const im = new THREE.InstancedMesh(LED_GEO, new THREE.MeshBasicMaterial({ toneMapped: false }), liste.length);
    inv.copy(w.matrixWorld).invert();
    liste.forEach((led, i) => { mat.multiplyMatrices(inv, led.matrixWorld); im.setMatrixAt(i, mat); im.setColorAt(i, led.userData.led.color); led.parent.remove(led); });
    im.castShadow = false; im.receiveShadow = false;
    w.add(im);
    LED_GRUPPEN.push({ im, proxys: liste.map(l => l.userData.led) });
  }
  sammeln(anlage, anlage);
  let vorher = 0, nachher = 0;
  for (const e of gruppen.values()) {
    vorher += e.teile.length;
    if (e.teile.length < 2) { nachher++; continue; }
    const geos = e.teile.map(({ k, mat, uv }) => {
      let g = k.geometry.clone();
      for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal' && !(uv && n === 'uv')) g.deleteAttribute(n);
      g.morphAttributes = {};
      g.applyMatrix4(mat);
      if (mat.determinant() < 0) {                                    // gespiegelte Teile: Umlaufsinn korrigieren
        if (g.index) { const I = g.index.array; for (let i = 0; i < I.length; i += 3) { const t = I[i + 1]; I[i + 1] = I[i + 2]; I[i + 2] = t; } }
        else for (const n of Object.keys(g.attributes)) { const a = g.attributes[n], sz = a.itemSize, A = a.array; for (let i = 0; i < a.count; i += 3) for (let j = 0; j < sz; j++) { const t = A[(i + 1) * sz + j]; A[(i + 1) * sz + j] = A[(i + 2) * sz + j]; A[(i + 2) * sz + j] = t; } }
      }
      g.clearGroups();
      return g;
    });
    const merged = mergeGeometries(geos, false);
    geos.forEach(g => g.dispose());
    if (!merged) { nachher += e.teile.length; continue; }
    for (const { k } of e.teile) k.parent.remove(k);
    const m = new THREE.Mesh(merged, e.m);
    m.castShadow = e.schatten; m.receiveShadow = true;
    e.wurzel.add(m);
    if (e.wurzel === anlage) merged.computeBoundsTree();
    nachher++;
  }
  console.info(`Szene zusammengefasst: ${vorher} Teile → ${nachher} Meshes`);
}
szeneZusammenfassen();
if (Q.modus !== 'auto') stufeSetzen({ hoch: 0, mittel: 2, niedrig: 3 }[Q.modus]);
else {
  // zuletzt im Auto-Modus gefundene Stufe gleich verwenden (kein Umschalten beim Start)
  let start = 0; try { start = +(localStorage.getItem('zinnbad-auto-stufe') || 0); } catch { /* */ }
  if (start > 0 && start < STUFEN.length) stufeSetzen(start); else $('btn-grafik').textContent = t`Grafik: Auto (${t('Hoch')})`;
}
