import * as THREE from 'three';
import { $, ANSICHT, KAMERA, anlage, ansichtPos, ansichtSetzen, camera, controls, host, labelRenderer, renderer } from '../core/szene.js';
import { SCHRANK } from '../anlage/schaltschrank.js';
import { SPRACHE, t } from '../core/sprache.js';


// ----------------------------------------------------------------------------
// Größe / Ansicht / Klick auf das Bedienpult
// ----------------------------------------------------------------------------
export function groesse() {
  const w = host.clientWidth, h = host.clientHeight;
  renderer.setSize(w, h, false);
  renderer.domElement.style.width = w + 'px';
  renderer.domElement.style.height = h + 'px';
  labelRenderer.setSize(w, h);
  camera.aspect = w / Math.max(h, 1);
  camera.updateProjectionMatrix();
  if (!KAMERA.bewegt) ansichtSetzen(ANSICHT.gesamt, true);
}
new ResizeObserver(groesse).observe(host);
groesse();

// Kameraflug zu einer Ansicht (weich, ca. 0,8 s); jede eigene Mausbewegung bricht ihn ab
const FLUG = { t: 1, von: new THREE.Vector3(), nach: new THREE.Vector3(), zielVon: new THREE.Vector3(), zielNach: new THREE.Vector3(), id: 0 };
function flugSchritt(jetzt) {
  FLUG.t = Math.min(1, (jetzt - FLUG.start) / 800);
  const e = FLUG.t < 0.5 ? 4 * FLUG.t ** 3 : 1 - (-2 * FLUG.t + 2) ** 3 / 2;
  camera.position.lerpVectors(FLUG.von, FLUG.nach, e);
  controls.target.lerpVectors(FLUG.zielVon, FLUG.zielNach, e);
  if (FLUG.t < 1) FLUG.id = requestAnimationFrame(flugSchritt);
}
export function fliegen(pos, ziel) {
  cancelAnimationFrame(FLUG.id);
  FLUG.von.copy(camera.position); FLUG.nach.copy(pos);
  FLUG.zielVon.copy(controls.target); FLUG.zielNach.copy(ziel);
  FLUG.start = performance.now(); FLUG.t = 0;
  FLUG.id = requestAnimationFrame(flugSchritt);
}
controls.addEventListener('start', () => cancelAnimationFrame(FLUG.id));
function ansichtFliegen(key) {
  const a = ANSICHT[key];
  KAMERA.bewegt = key !== 'gesamt';
  fliegen(ansichtPos(a, true), a.ziel);
  wahl.value = key;
}

// Auswahlliste der festen Ansichten, nach Gruppen
const wahl = $('ansicht-wahl');
{
  const gruppen = new Map();
  for (const [key, a] of Object.entries(ANSICHT)) {
    if (!gruppen.has(a.gruppe)) { const og = document.createElement('optgroup'); og.label = t(a.gruppe); gruppen.set(a.gruppe, og); wahl.append(og); }
    gruppen.get(a.gruppe).append(new Option(t(a.name), key));
  }
  wahl.value = 'gesamt';
}
wahl.onchange = () => ansichtFliegen(wahl.value);
$('btn-cam').onclick = () => ansichtFliegen('gesamt');

// Doppelklick: Drehpunkt auf das getroffene Bauteil legen
const _ray = new THREE.Raycaster(); _ray.firstHitOnly = true;
renderer.domElement.addEventListener('dblclick', (e) => {
  const r = renderer.domElement.getBoundingClientRect();
  _ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
  const hit = _ray.intersectObject(anlage, true).find((h) => h.object.visible && h.object.material?.visible !== false);
  if (!hit) return;
  KAMERA.bewegt = true;
  const versatz = hit.point.clone().sub(controls.target);
  fliegen(camera.position.clone().add(versatz.multiplyScalar(0.5)), hit.point);
});

// Legende Maussteuerung (Zustand je Browser gemerkt)
const legende = $('legende'), hilfeBtn = $('btn-hilfe');
function legendeZeigen(an) {
  legende.hidden = !an; hilfeBtn.setAttribute('aria-pressed', an);
  try { localStorage.setItem('zinnbad-legende', an ? '1' : '0'); } catch { /* kein Speicher */ }
}
try { if (localStorage.getItem('zinnbad-legende') === '0') legendeZeigen(false); } catch { /* kein Speicher */ }
hilfeBtn.onclick = () => legendeZeigen(legende.hidden);
$('legende-zu').onclick = () => legendeZeigen(false);
// „Verschieben“ heißt in der Legende die Ansicht schieben, sonst der Zylinder −MM3: eigener Schlüssel
if (SPRACHE !== 'de') $('legende-pan').textContent = t('Ansicht verschieben');
$('btn-schrank').onclick = (e) => {
  SCHRANK.ziel = SCHRANK.ziel ? 0 : 1;
  e.currentTarget.setAttribute('aria-pressed', SCHRANK.ziel === 1);
  e.currentTarget.textContent = t(SCHRANK.ziel ? 'Schaltschrank schließen' : 'Schaltschrank öffnen');
  if (SCHRANK.ziel) ansichtFliegen('schrank');
};
// ----------------------------------------------------------------------------
// Seitenleiste: ein-/ausblenden und Bereiche auf-/zuklappen (Zustand je Browser gemerkt)
// ----------------------------------------------------------------------------
const seite = $('side'), seiteBtn = $('btn-side');
function merke(k, v) { try { localStorage.setItem(k, v); } catch { /* kein Speicher */ } }
function gemerkt(k) { try { return localStorage.getItem(k); } catch { return null; } }
function seiteZeigen(an) {
  seite.hidden = !an;
  document.querySelector('.app').classList.toggle('seite-zu', !an);
  seiteBtn.setAttribute('aria-pressed', an);
  merke('zinnbad-seite', an ? '1' : '0');
  groesse();                                   // 3D-Bild auf die neue Breite bringen
}
seiteBtn.onclick = () => seiteZeigen(seite.hidden);
$('side-zu').onclick = () => seiteZeigen(false);
if (gemerkt('zinnbad-seite') === '0') seiteZeigen(false);

const bereiche = [...seite.querySelectorAll('details.sec, details.sub')];
for (const d of bereiche) {
  const stand = gemerkt('zinnbad-' + d.id);
  if (stand !== null) d.open = stand === '1';
  d.addEventListener('toggle', () => { merke('zinnbad-' + d.id, d.open ? '1' : '0'); alleBeschriften(); });
}
const alleBtn = $('side-alle');
function alleBeschriften() {
  alleBtn.textContent = t(bereiche.some(d => d.open) ? 'Alle zuklappen' : 'Alle aufklappen');
}
alleBtn.onclick = () => {
  const auf = !bereiche.some(d => d.open);
  for (const d of bereiche) d.open = auf;
};
alleBeschriften();

$('btn-labels').onclick = (e) => {
  const an = e.currentTarget.getAttribute('aria-pressed') !== 'true';
  e.currentTarget.setAttribute('aria-pressed', an);
  labelRenderer.domElement.hidden = !an;
};
