import * as THREE from 'three';
import { anlage, camera, labelRenderer } from '../core/szene.js';
import { LABELS } from '../core/beschriftung.js';
import { bodenMesh } from '../anlage/halle.js';

// Beschriftung: verdeckte Schilder ausblenden, überlappende nach Wichtigkeit ausdünnen
const verdecker = [];
let ordnenTakt = 0;
const _rc = new THREE.Raycaster(), _lp = new THREE.Vector3();
_rc.firstHitOnly = true;
// Verdeckung: nur gegen die zusammengefassten, BVH-beschleunigten Bauteile prüfen (nicht gegen Person/Gurte),
// je Durchlauf ein Teil der Schilder (Rundlauf); Überlappung nur alle 10 Bilder (Layout-Abfrage ist teuer)
let ordnenIndex = 0;
const verdecktCache = new Map();
export function beschriftungOrdnen() {
  if (labelRenderer.domElement.hidden) return;
  if (!verdecker.length) anlage.traverse(o => { if (o.isMesh && o.geometry.boundsTree && o !== bodenMesh) verdecker.push(o); });
  const n = Math.min(LABELS.length, 20);
  for (let i = 0; i < n; i++) {
    const l = LABELS[(ordnenIndex + i) % LABELS.length];
    if (l.div.hidden) continue;
    l.obj.getWorldPosition(_lp);
    const abstand = _lp.distanceTo(camera.position);
    _rc.set(camera.position, _lp.sub(camera.position).normalize());
    _rc.far = abstand - 0.01;
    verdecktCache.set(l, _rc.intersectObjects(verdecker, false).length > 0);
  }
  ordnenIndex = (ordnenIndex + n) % Math.max(1, LABELS.length);
  if ((ordnenTakt = (ordnenTakt + 1) % 10) !== 0) return;
  // Erst alle Maße lesen, dann alle Klassen setzen. 'weg' ist nur visibility und
  // ändert kein Layout, deshalb ist das erlaubt - und wichtig: ein Lesen direkt
  // nach einem Schreiben lässt den Browser das Layout neu rechnen, sonst also
  // einmal je Schild statt einmal für den ganzen Durchgang.
  const sichtbar = [], weg = [];
  for (const l of LABELS) {
    const d = l.div;
    if (d.hidden || d.style.display === 'none') continue;
    if (verdecktCache.get(l)) { weg.push(d); continue; }
    l.obj.getWorldPosition(_lp);
    sichtbar.push({ d, r: d.getBoundingClientRect(), p: l.prio + (d.classList.contains('on') ? 0.5 : 0) - _lp.distanceTo(camera.position) * 0.01 });
  }
  sichtbar.sort((a, b) => b.p - a.p);
  const belegt = [];
  for (const s of sichtbar) {
    const r = s.r;
    if (belegt.some(b => r.left < b.right + 2 && r.right > b.left - 2 && r.top < b.bottom + 1 && r.bottom > b.top - 1)) weg.push(s.d);
    else { belegt.push(r); s.d.classList.remove('weg'); }
  }
  for (const d of weg) d.classList.add('weg');
}

