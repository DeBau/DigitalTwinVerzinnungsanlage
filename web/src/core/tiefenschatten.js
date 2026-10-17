import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { camera, renderer, scene } from './szene.js';

// ----------------------------------------------------------------------------
// Tiefenschatten (Ambient Occlusion, GTAO): Verschattung in Ecken, Nuten, Spalten und unter Bauteilen.
// Ein-/ausschaltbar (unten in der Leiste), Zustand je Browser gemerkt, Standard aus – kostet etwa
// eine zweite Szenendarstellung je Bild. Szene in Metern: Radius 12 cm passt zu Profilen und Geräten.
// ----------------------------------------------------------------------------
const SPEICHER = 'zinnbad-tiefenschatten';
export const TS = { an: false, composer: null, gtao: null, w: 0, h: 0, pr: 0 };
window.__tiefenschatten = TS;                            // Diagnose in der Konsole
try { TS.an = localStorage.getItem(SPEICHER) === '1'; } catch { /* kein Speicher */ }

// Für die Tiefen-/Normalen-Darstellung der Verschattung zählen nur feste, sichtbare Flächen: durchsichtige Scheiben
// (Umhausung, Lichtvorhang, Schauglas) und unsichtbare Klickflächen würden sonst wie massive Körper verschatten.
const unsichtbar = (m) => (Array.isArray(m) ? m.every(unsichtbar) : !m.visible || m.transparent || m.opacity < 1);
// Der Hallenhintergrund (Verlaufstextur) gehört nicht in diesen Durchgang: Er stünde dort als dunkle „Fläche“ mit
// unsinnigen Normalen und würde als tiefe Verschattung ins Bild kommen.
class Tiefenschatten extends GTAOPass {
  overrideVisibility() {
    super.overrideVisibility();                          // merkt sich alle Sichtbarkeiten (blendet Punkte/Linien aus)
    this.scene.traverse((o) => { if (o.visible && o.material && unsichtbar(o.material)) o.visible = false; });
    this.hintergrund = this.scene.background; this.scene.background = null;
  }
  restoreVisibility() {
    super.restoreVisibility();
    this.scene.background = this.hintergrund;
  }
}
function aufbauen() {
  const ziel = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });   // MSAA wie ohne Nachbearbeitung
  TS.composer = new EffectComposer(renderer, ziel);
  TS.composer.addPass(new RenderPass(scene, camera));
  TS.gtao = new Tiefenschatten(scene, camera, 1, 1);
  TS.gtao.normalMaterial.side = THREE.DoubleSide;        // Rohre, Leitungen und Bleche, deren Vorderseite von der Kamera weg zeigt
  TS.gtao.updateGtaoMaterial({ radius: 0.12, distanceExponent: 1.5, thickness: 1, scale: 1.25, samples: 16, distanceFallOff: 1, screenSpaceRadius: false });
  TS.gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
  TS.gtao.blendIntensity = 1;
  TS.composer.addPass(TS.gtao);
  TS.composer.addPass(new OutputPass());                 // Tone Mapping (AgX) und sRGB wie beim direkten Zeichnen
}
// Größe und Pixelverhältnis folgen dem Renderer (die Grafikautomatik ändert das Pixelverhältnis)
function abgleichen(z) {
  const g = renderer.getSize(new THREE.Vector2()), pr = renderer.getPixelRatio();
  if (g.x === z.w && g.y === z.h && pr === z.pr) return;
  z.w = g.x; z.h = g.y; z.pr = pr;
  z.composer.setPixelRatio(pr);
  z.composer.setSize(g.x, g.y);
}
// Kantenglättung (MSAA) je Grafikstufe: Der Canvas hat selbst keine, sie ließe sich dort nicht mehr umschalten
// (und kostet Onboard-Grafik bis zu 40 % Bildrate). Stufen mit Kantenglättung zeichnen in ein Zwischenbild
// mit MSAA; Tone Mapping (AgX) und sRGB kommen danach wie beim direkten Zeichnen (OutputPass).
const KG = new Map();                                    // Abtastungen → { composer, ziel, w, h, pr }
function kantenglaettung(samples) {
  if (!KG.has(samples)) {
    const ziel = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples });
    const composer = new EffectComposer(renderer, ziel);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new OutputPass());
    KG.set(samples, { composer, ziel, w: 0, h: 0, pr: 0 });
  }
  return KG.get(samples);
}
// Zeichenziel der Szene (zum Vorübersetzen): In ein Zwischenbild gezeichnet brauchen die Materialien eigene Shader
// ohne Tone Mapping – welches Zwischenbild, ist dafür egal.
export const zeichenziel = (samples) => (TS.an || samples ? kantenglaettung(samples || 4).ziel : null);
export function szeneZeichnen(samples = 0) {
  if (TS.an) {
    if (!TS.composer) aufbauen();
    abgleichen(TS);
    TS.composer.render();
    return;
  }
  if (!samples) { renderer.render(scene, camera); return; }
  const z = kantenglaettung(samples);
  abgleichen(z);
  z.composer.render();
}

// Ein/aus (Grafik-Fenster), Zustand je Browser gemerkt
export function tiefenschattenSetzen(an) {
  TS.an = an;
  try { localStorage.setItem(SPEICHER, an ? '1' : '0'); } catch { /* kein Speicher */ }
}
