import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { computeBoundsTree, acceleratedRaycast } from '../lib/three-mesh-bvh.module.js';
import { t } from './sprache.js';

// BVH-beschleunigtes Raycasting (Beschriftung, Klick auf Befehlsgeräte)
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

// ----------------------------------------------------------------------------
// Renderer, Kamera, Licht
// ----------------------------------------------------------------------------
export const $ = (id) => document.getElementById(id);
export const host = $('viewport');
// Ohne WebGL 2 (alter Treiber, Hardwarebeschleunigung aus, Remote-Desktop) gibt es keine 3D-Darstellung
if (!document.createElement('canvas').getContext('webgl2')) {
  window.zwillingFehler?.(t('3D-Darstellung nicht möglich'), t('Browser oder Grafiktreiber stellen kein WebGL 2 bereit. Aktuellen Chrome, Edge oder Firefox verwenden, den Grafiktreiber aktualisieren und in den Browsereinstellungen die Hardwarebeschleunigung einschalten.'));
  throw new Error('WebGL 2 nicht verfügbar');
}
export const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));   // Qualitätsautomatik regelt bei Bedarf herunter
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;                 // Schattenkarte nur jedes 2. Bild neu (s. Hauptschleife)
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.05;
host.appendChild(renderer.domElement);

export const labelRenderer = new CSS2DRenderer();
Object.assign(labelRenderer.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
host.appendChild(labelRenderer.domElement);

export const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
const umgebungBerechnen = () => { scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; };
umgebungBerechnen();
scene.environmentIntensity = 0.75;

// Grafiktreiber-Reset (Treiberupdate, Standby, GPU überlastet): three.js baut den Kontext selbst neu auf,
// was nur auf der Grafikkarte entstanden ist (Umgebungslicht, Schattenkarte), wird hier neu berechnet.
// Die Anlage rechnet in der Zwischenzeit weiter, nur das Bild steht.
let neuLadenHinweis = 0;
renderer.domElement.addEventListener('webglcontextlost', () => {
  window.zwillingFehler?.(t('3D-Darstellung unterbrochen'), t('Der Grafiktreiber hat die Darstellung zurückgesetzt. Sie wird wiederhergestellt, die Anlage läuft weiter.'));
  neuLadenHinweis = setTimeout(() => window.zwillingFehler?.(t('3D-Darstellung unterbrochen'), t('Der Grafiktreiber stellt die Darstellung nicht wieder her. Bitte die Seite neu laden (F5).')), 8000);
});
renderer.domElement.addEventListener('webglcontextrestored', () => {
  clearTimeout(neuLadenHinweis);
  scene.environment?.dispose();
  umgebungBerechnen();
  renderer.shadowMap.needsUpdate = true;
  window.zwillingFehler?.('');
});
// Hallenhintergrund: heller Verlauf wie Hallenwand/Hallendach, Dunst in der Tiefe
{
  const c = document.createElement('canvas'); c.width = 4; c.height = 256;
  const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#16191c'); gr.addColorStop(0.55, '#262b30'); gr.addColorStop(1, '#1d2125');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  scene.background = t;
  scene.fog = new THREE.Fog(0x23272b, 8, 22);
}

// Near 5 cm statt 3 cm: feinere Tiefenauflösung in der Ferne (bei 9 m ≈ 0,1 mm), damit knapp
// voreinander liegende Flächen (Schilder, Frontplatten) nicht flackern
export const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 40);

// Feste Ansichten (Meter): pos = Kamera, ziel = Drehpunkt; gruppe/name für die Auswahlliste
const A = (gruppe, name, px, py, pz, tx, ty, tz) => ({ gruppe, name, pos: new THREE.Vector3(px, py, pz), ziel: new THREE.Vector3(tx, ty, tz) });
export const ANSICHT = {
  gesamt: A('Übersicht', 'Gesamtanlage', 3.3, 2.5, 5.2, 1.0, 0.55, 0.9),
  linie: A('Übersicht', 'Linie von oben', 2.0, 4.6, 4.6, 1.9, 0.3, 1.0),
  schrank: A('Übersicht', 'Schaltschrank −A1', -1.02, 1.22, 2.75, -1.5, 1.1, -0.3),
  uebergabe: A('Teilprozesse', 'Band 1 · Übergabeplatz', 0.62, 1.05, 1.15, 0.0, 0.4, 0.0),
  portal: A('Teilprozesse', 'Portal · Haken −MM1/−MM2/−MM3', 0.35, 1.55, 1.9, 0.15, 1.0, -0.15),
  bad: A('Teilprozesse', 'Zinnbad (Blick ins Bad)', 1.05, 1.15, 1.05, 0.40, 0.42, 0),
  pneumatik: A('Teilprozesse', 'Pneumatik · Ventilinsel −QM1', -0.15, 1.25, 0.95, -0.66, 0.85, -0.2),
  kurve: A('Teilprozesse', 'Rollenkurve −MA6', -0.75, 1.15, 2.45, 0.15, 0.3, 1.35),
  kuehlung: A('Teilprozesse', 'Band 2 · Sprühkühlung', 1.45, 1.1, 2.75, 1.3, 0.45, 1.52),
  kuehlwasser: A('Teilprozesse', 'Kühlwassertank · Nachspeisung', 1.95, 1.05, 0.35, 1.3, 0.45, 1.2),
  kipper: A('Teilprozesse', 'Korbkipper −MM8', 2.7, 1.15, 2.75, 3.0, 0.4, 1.52),
  pruefung: A('Teilprozesse', 'Vibrorinne · Prüfband · Kamera', 3.45, 1.25, 2.85, 3.85, 0.35, 1.52),
  klt: A('Teilprozesse', 'Ausschleusen · KLT', 4.55, 1.05, 2.65, 4.45, 0.2, 1.6),
  pult: A('Steuerstellen', 'Bedienpult (START/STOP/NOT-HALT)', -0.35, 1.55, 1.95, -0.65, 1.05, 0.86),
  s10: A('Steuerstellen', 'Vor-Ort −S10 Band 1 (Antrieb)', 1.45, 1.55, -2.1, 0.3, 0.8, -0.95),
  s30: A('Steuerstellen', 'Vor-Ort −S30 Rollenkurve', -0.36, 1.35, 2.75, -0.48, 1.165, 1.81),
  s20: A('Steuerstellen', 'Vor-Ort −S20 Band 2', 2.54, 1.35, 2.95, 2.42, 1.165, 2.03),
  s40: A('Steuerstellen', 'Vor-Ort −S40 Prüfstation', 3.72, 1.55, 3.55, 3.42, 1.05, 2.0),
  s50: A('Steuerstellen', 'Vor-Ort −S50 Prüfband', 4.43, 1.35, 3.0, 4.31, 1.165, 2.13),
};
export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 0.25;
controls.maxDistance = 9;
export const KAMERA = { bewegt: false };       // true: Benutzer hat die Ansicht selbst gewählt
export const TAKT = { bild: 0 };                // Bildzähler (Hauptschleife)
controls.addEventListener('start', () => { KAMERA.bewegt = true; });
// Schmale Fenster: weiter zurück, damit die Ansicht ins Bild passt
export function ansichtPos(a, anpassen) {
  const k = anpassen ? Math.min(2.2, Math.max(1, 1.25 / camera.aspect)) : 1;
  return a.ziel.clone().add(a.pos.clone().sub(a.ziel).multiplyScalar(k));
}
export function ansichtSetzen(a, anpassen) {
  camera.position.copy(ansichtPos(a, anpassen));
  controls.target.copy(a.ziel);
}

// Hallenbeleuchtung: Hallenlicht von oben (Schatten), Aufhellung von der Gegenseite
export const himmel = new THREE.HemisphereLight(0xf4f6f8, 0x2a2e33, 0.35);
scene.add(himmel);
export const sun = new THREE.DirectionalLight(0xfff6ea, 2.1);
sun.target.position.set(1.3, 0, 0.7); scene.add(sun.target);
sun.position.set(1.3 + 1.6, 4.2, 0.7 + 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -3.9, right: 3.9, top: 3.9, bottom: -3.9, near: 1, far: 10 });
sun.shadow.bias = -0.00015;
sun.shadow.normalBias = 0.0015;
sun.shadow.radius = 3;
scene.add(sun);
export const fuell = new THREE.DirectionalLight(0xe8f0ff, 0.55);
fuell.position.set(-2.5, 2.5, -1.5);
scene.add(fuell);

export const anlage = new THREE.Group();
anlage.scale.setScalar(0.001);
scene.add(anlage);

