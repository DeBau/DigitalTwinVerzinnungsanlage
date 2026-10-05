import * as THREE from 'three';
import { $, fuell, himmel, renderer, scene, sun } from './szene.js';
import { PERSON } from '../anlage/werker.js';
import { bodenMesh } from '../anlage/halle.js';
import { BAND, BAND2, KURVE } from '../anlage/baender.js';
import { ST } from '../anlage/pruefstation.js';
import { deckel } from '../anlage/abdeckung.js';
import { schlitten } from '../anlage/portal.js';
import { SCHRANK } from '../anlage/schaltschrank.js';
import { koerbe } from '../anlage/koerbe.js';
import { groesse } from '../ui/ansicht.js';
import { t } from './sprache.js';

// Qualität: Ist der Rechner zu langsam (z. B. Onboard-Grafik), werden Auflösung und Schattenkarte reduziert
// ----------------------------------------------------------------------------
// Grafikregelung (wie in Spielen): misst laufend die Bildzeit und schaltet Qualitätsstufen,
// damit es auf jeder Grafik flüssig läuft. „Auto“ regelt, Hoch/Mittel/Niedrig sind fest.
// ----------------------------------------------------------------------------
export const STUFEN = [
  { name: 'Hoch', pr: 1, schattenAlle: 2, sm: 2048, lambert: false, schatten: true, nurBoden: false },
  { name: 'Hoch−', pr: 1, schattenAlle: 4, sm: 1024, lambert: false, schatten: true, nurBoden: false },
  { name: 'Mittel', pr: 0.85, schattenAlle: -1, sm: 2048, lambert: true, schatten: true, nurBoden: true },     // -1: Schatten fester Teile einmal vorberechnet
  { name: 'Niedrig', pr: 0.7, schattenAlle: -1, sm: 2048, lambert: true, schatten: true, nurBoden: true },
  { name: 'Minimal', pr: 0.55, schattenAlle: 0, sm: 1024, lambert: true, schatten: false, nurBoden: true },
];
const DYN_WURZELN = () => [schlitten, deckel, BAND.anschlag, BAND.vereinzeler, ...(BAND.stopperStangen || []), ...KURVE.rollen, ST.kipper, ST.zylBody, ST.zylStange, ST.rinneGruppe, ...BAND.trommeln, ...BAND2.trommeln, ...SCHRANK.tueren, ...koerbe.map(k => k.g), PERSON?.g].filter(Boolean);
export const Q = { modus: 'auto', stufe: 0, gesperrt: new Set(), t: 0, n: 0, zuletzt: performance.now(), ruhe: 0, gutSeit: 0 };
try { const m = localStorage.getItem('zinnbad-grafik'); if (m) Q.modus = m; } catch { /* kein Speicher */ }
// Standard ↔ Lambert: Lambert-Kopien, Laufzeitwerte (Farbe, Leuchten, Deckkraft) werden jedes Bild übernommen
const LAMBERT = new Map();
const lambertVon = (m) => {
  if (m.type !== 'MeshStandardMaterial') return m;
  if (!LAMBERT.has(m)) {
    const l = new THREE.MeshLambertMaterial({ color: m.color, map: m.map, emissive: m.emissive, emissiveIntensity: m.emissiveIntensity, transparent: m.transparent, opacity: m.opacity, side: m.side, alphaMap: m.alphaMap, alphaTest: m.alphaTest, depthWrite: m.depthWrite, polygonOffset: m.polygonOffset, polygonOffsetFactor: m.polygonOffsetFactor, polygonOffsetUnits: m.polygonOffsetUnits });
    l.userData.std = m; LAMBERT.set(m, l);
  }
  return LAMBERT.get(m);
};
// Entfernter Korb: Lambert-Kopie seines Materials freigeben (sonst wächst die Liste, die jedes Bild abgeglichen wird)
window.__lambertFreigeben = (m) => { const l = LAMBERT.get(m); if (l) { l.dispose(); LAMBERT.delete(m); } };
function materialienSetzen(lambert) {
  scene.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material)) return;
    if (lambert) o.material = lambertVon(o.material);
    else if (o.material.userData.std) o.material = o.material.userData.std;
  });
}
export function lambertAbgleich() {
  for (const [m, l] of LAMBERT) {
    l.color.copy(m.color); l.emissive.copy(m.emissive); l.emissiveIntensity = m.emissiveIntensity; l.opacity = m.opacity;
  }
  // Schütz-Anzeigen werden zur Laufzeit umgehängt
  if (STUFEN[Q.stufe].lambert) for (const m of SCHRANK.qa) m.material = lambertVon(m.material);
}
export function stufeSetzen(i) {
  const alt = STUFEN[Q.stufe], s2 = STUFEN[i];
  Q.stufe = i;
  if (s2.lambert !== alt.lambert) materialienSetzen(s2.lambert);
  window.__lambertAktiv = s2.lambert ? lambertVon : null;   // neue Körbe gleich passend erzeugen
  himmel.intensity = s2.lambert ? 1.6 : 0.35;                // Ersatz für das Umgebungslicht der Spiegelung
  fuell.intensity = s2.lambert ? 0.9 : 0.55;
  if (s2.schatten !== renderer.shadowMap.enabled || s2.nurBoden !== alt.nurBoden) {
    renderer.shadowMap.enabled = s2.schatten;
    scene.traverse((o) => { if (o.isMesh) { if (o.userData.empf === undefined) o.userData.empf = o.receiveShadow; o.receiveShadow = s2.nurBoden ? o === bodenMesh : o.userData.empf; if (o.material) o.material.needsUpdate = true; } });
  }
  // vorberechnete Schatten: bewegte Baugruppen werfen dann keinen Schatten (sonst stünde er falsch)
  const statisch = s2.schattenAlle < 0;
  for (const w of DYN_WURZELN()) w.traverse((o) => { if (o.isMesh) { if (o.userData.wirft === undefined) o.userData.wirft = o.castShadow; o.castShadow = statisch ? false : o.userData.wirft; } });
  if (sun.shadow.mapSize.x !== s2.sm) { sun.shadow.mapSize.set(s2.sm, s2.sm); sun.shadow.map?.dispose(); sun.shadow.map = null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, s2.pr));
  groesse();
  renderer.shadowMap.needsUpdate = true;
  $('btn-grafik').textContent = Q.modus === 'auto' ? t`Grafik: Auto (${t(s2.name)})` : t`Grafik: ${t(s2.name)}`;
}
export function qualitaetPruefen() {
  const jetzt = performance.now(), dt = jetzt - Q.zuletzt; Q.zuletzt = jetzt;
  if (Q.modus !== 'auto' || dt > 250 || document.hidden) return;   // Tab im Hintergrund/Hänger nicht werten
  Q.t += dt; Q.n++;
  if (Q.ruhe > 0) { Q.ruhe -= dt; Q.t = 0; Q.n = 0; return; }    // nach einer Umschaltung kurz abwarten
  if (Q.t < 1500) return;
  const ms = Q.t / Q.n; Q.t = 0; Q.n = 0;
  if (ms > 1000 / 48 && Q.stufe < STUFEN.length - 1) {            // unter 48 fps: runter, bei großem Abstand gleich mehrere Stufen
    const fps = 1000 / ms, sprung = fps < 22 ? 3 : fps < 32 ? 2 : 1;
    for (let i = Q.stufe; i < Q.stufe + sprung; i++) Q.gesperrt.add(i);
    stufeSetzen(Math.min(STUFEN.length - 1, Q.stufe + sprung)); Q.ruhe = 1200; Q.gutSeit = 0;
    try { localStorage.setItem('zinnbad-auto-stufe', Q.stufe); } catch { /* kein Speicher */ }
  } else if (ms < 1000 / 57) {                                      // läuft an der Bildwiederholrate: nach 10 s eine Stufe hoch probieren
    Q.gutSeit += 1500;
    if (Q.gutSeit > 10000 && Q.stufe > 0 && !Q.gesperrt.has(Q.stufe - 1)) { stufeSetzen(Q.stufe - 1); Q.ruhe = 1200; Q.gutSeit = 0; try { localStorage.setItem('zinnbad-auto-stufe', Q.stufe); } catch { /* */ } }
  } else Q.gutSeit = 0;
}
$('btn-grafik').onclick = () => {
  const folge = ['auto', 'hoch', 'mittel', 'niedrig'];
  Q.modus = folge[(folge.indexOf(Q.modus) + 1) % folge.length];
  try { localStorage.setItem('zinnbad-grafik', Q.modus); } catch { /* kein Speicher */ }
  Q.gesperrt.clear(); Q.gutSeit = 0; Q.ruhe = 1200;
  stufeSetzen({ auto: Q.stufe, hoch: 0, mittel: 2, niedrig: 3 }[Q.modus]);
};
