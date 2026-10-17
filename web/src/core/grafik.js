import * as THREE from 'three';
import { $, camera, fuell, himmel, renderer, scene, sun } from './szene.js';
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
import { gebrauchAnwenden } from './gebrauch.js';
import { szeneZeichnen, zeichenziel } from './tiefenschatten.js';

// Qualität: Ist der Rechner zu langsam (z. B. Onboard-Grafik), werden Auflösung und Schattenkarte reduziert
// ----------------------------------------------------------------------------
// Grafikregelung (wie in Spielen): misst laufend die Bildzeit und schaltet Qualitätsstufen,
// damit es auf jeder Grafik flüssig läuft. „Auto“ regelt, Hoch/Mittel/Niedrig sind fest.
// ----------------------------------------------------------------------------
// msaa: Abtastungen der Kantenglättung (0 = keine; kostet Onboard-Grafik bis zu 40 % Bildrate)
export const STUFEN = [
  { name: 'Hoch', pr: 1, schattenAlle: 2, sm: 2048, lambert: false, schatten: true, nurBoden: false, msaa: 4 },
  { name: 'Hoch−', pr: 1, schattenAlle: 4, sm: 1024, lambert: false, schatten: true, nurBoden: false, msaa: 4 },
  { name: 'Mittel', pr: 0.85, schattenAlle: -1, sm: 2048, lambert: true, schatten: true, nurBoden: true, msaa: 2 },     // -1: Schatten fester Teile einmal vorberechnet
  { name: 'Niedrig', pr: 0.7, schattenAlle: -1, sm: 2048, lambert: true, schatten: true, nurBoden: true, msaa: 0 },
  { name: 'Minimal', pr: 0.55, schattenAlle: 0, sm: 1024, lambert: true, schatten: false, nurBoden: true, msaa: 0 },
];
const DYN_WURZELN = () => [schlitten, deckel, BAND.anschlag, BAND.vereinzeler, ...(BAND.stopperNocken || []), ...KURVE.rollen, ST.kipper, ST.zylBody, ST.zylStange, ST.rinneGruppe, ...BAND.trommeln, ...BAND2.trommeln, ...SCHRANK.tueren, ...koerbe.map(k => k.g), PERSON?.g].filter(Boolean);
export const Q = { modus: 'auto', stufe: 0, fpsMax: 0, gesperrt: new Set(), t: 0, n: 0, zaeh: 0, zuletzt: performance.now(), ruhe: 0, gutSeit: 0 };
try { const m = localStorage.getItem('zinnbad-grafik'); if (m) Q.modus = m; } catch { /* kein Speicher */ }
// Bildratenbegrenzung (Grafik-Fenster): 0 = so oft, wie der Monitor anzeigt (144 Hz = 144 Bilder/s), sonst 30 oder 60
export const FPS_WAHL = [0, 60, 30];
try { const f = +localStorage.getItem('zinnbad-fps'); if (FPS_WAHL.includes(f)) Q.fpsMax = f; } catch { /* kein Speicher */ }
export function fpsMaxSetzen(f) {
  Q.fpsMax = f; Q.t = 0; Q.n = 0; Q.zaeh = 0; Q.ruhe = 1200;      // Bildzeiten danach neu werten
  try { localStorage.setItem('zinnbad-fps', f); } catch { /* kein Speicher */ }
}
// Standard ↔ Lambert: Lambert-Kopien, Laufzeitwerte (Farbe, Leuchten, Deckkraft) werden jedes Bild übernommen
const LAMBERT = new Map();
const lambertVon = (m) => {
  if (m.type !== 'MeshStandardMaterial') return m;
  if (!LAMBERT.has(m)) {
    const l = new THREE.MeshLambertMaterial({ color: m.color, vertexColors: m.vertexColors, map: m.map, emissive: m.emissive, emissiveIntensity: m.emissiveIntensity, transparent: m.transparent, opacity: m.opacity, side: m.side, alphaMap: m.alphaMap, alphaTest: m.alphaTest, depthWrite: m.depthWrite, polygonOffset: m.polygonOffset, polygonOffsetFactor: m.polygonOffsetFactor, polygonOffsetUnits: m.polygonOffsetUnits });
    if (m.userData.gebrauch) { l.userData.abnutzung = m.userData.abnutzung; gebrauchAnwenden(l); }
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
// Alle Stufenvarianten (Standard/Lambert, mit/ohne Schatten) beim Start einmal zeichnen: Sonst hängt das Bild beim
// ersten Umschalten bis zu einer halben Sekunde. Nur übersetzen reicht nicht – der Grafiktreiber (ANGLE/Direct3D)
// baut die Shader endgültig erst beim ersten Zeichnen. Dabei alles sichtbar und ohne Sichtfeldprüfung, damit auch
// Ausgeblendetes und Verdecktes dabei ist. Lichter bleiben, wie sie sind: Ihre Anzahl steckt in jedem Shader.
// Das Schranklicht wird zur Laufzeit geschaltet (Türen auf/zu), deshalb beide Zustände. Gezeichnet wird wie im
// Betrieb (mit Kantenglättung über ein Zwischenbild, das braucht eigene Shader ohne Tone Mapping).
// Vor dem Zeichnen übersetzt compileAsync die Shader parallel im Hintergrund (KHR_parallel_shader_compile):
// Synchron hing hier die Seite 20–30 s, und der Browser meldete „Seite reagiert nicht“.
async function allesZeichnen() {
  const zustand = [];
  scene.traverse((o) => { if (o.isLight) return; zustand.push([o, o.visible, o.frustumCulled]); o.visible = true; o.frustumCulled = false; });
  const lichtVorher = SCHRANK.licht.visible;
  try {
    for (const an of [false, true]) {
      SCHRANK.licht.visible = an;
      const msaa = STUFEN[Q.stufe].msaa, vorher = renderer.getRenderTarget();
      renderer.setRenderTarget(zeichenziel(msaa));
      const fertig = renderer.compileAsync(scene, camera);             // übersetzt sofort, wartet dann nur
      renderer.setRenderTarget(vorher);
      try { await fertig; } catch { /* dann eben beim Zeichnen */ }
      renderer.shadowMap.needsUpdate = true;
      szeneZeichnen(msaa);
      await new Promise(r => setTimeout(r));                            // Browser kurz Luft lassen
    }
  } finally {
    SCHRANK.licht.visible = lichtVorher;
    for (const [o, sichtbar, pruefen] of zustand) { o.visible = sichtbar; o.frustumCulled = pruefen; }
  }
}
export async function stufenVorbereiten() {
  for (const i of [2, 3, 4, 0]) { stufeSetzen(i); await allesZeichnen(); }   // Mittel/Niedrig: Lambert mit bzw. ohne Kantenglättung
}
// Ruckeln entsteht schon, wenn einzelne Bilder den Bildtakt verpassen (16 ms, 33 ms, 16 ms …), auch wenn der
// Mittelwert gut aussieht. Gezählt werden deshalb Bilder über 20 ms; ab 8 % davon geht es eine Stufe runter.
// Mit Begrenzung auf 30 Bilder/s gilt der längere Takt (sonst wäre jedes Bild „zäh“).
export function qualitaetPruefen() {
  const jetzt = performance.now(), dt = jetzt - Q.zuletzt; Q.zuletzt = jetzt;
  if (Q.modus !== 'auto' || dt > 250 || document.hidden) return;   // Tab im Hintergrund/Hänger nicht werten
  const ziel = Q.fpsMax || 60;
  Q.t += dt; Q.n++; if (dt > 1200 / ziel) Q.zaeh++;
  if (Q.ruhe > 0) { Q.ruhe -= dt; Q.t = 0; Q.n = 0; Q.zaeh = 0; return; }    // nach einer Umschaltung kurz abwarten
  if (Q.t < 1500) return;
  const ms = Q.t / Q.n, anteilZaeh = Q.zaeh / Q.n; Q.t = 0; Q.n = 0; Q.zaeh = 0;
  if (anteilZaeh > 0.08 && Q.stufe < STUFEN.length - 1) {         // Takt verpasst: runter, bei großem Abstand gleich mehrere Stufen
    const fps = 1000 / ms, sprung = fps < ziel * 0.37 ? 3 : fps < ziel * 0.53 ? 2 : 1;
    for (let i = Q.stufe; i < Q.stufe + sprung; i++) Q.gesperrt.add(i);
    stufeSetzen(Math.min(STUFEN.length - 1, Q.stufe + sprung)); Q.ruhe = 1200; Q.gutSeit = 0;
    try { localStorage.setItem('zinnbad-auto-stufe', Q.stufe); } catch { /* kein Speicher */ }
  } else if (anteilZaeh < 0.02) {                                    // läuft im Takt: nach 10 s eine Stufe hoch probieren
    Q.gutSeit += 1500;
    if (Q.gutSeit > 10000 && Q.stufe > 0 && !Q.gesperrt.has(Q.stufe - 1)) { stufeSetzen(Q.stufe - 1); Q.ruhe = 1200; Q.gutSeit = 0; try { localStorage.setItem('zinnbad-auto-stufe', Q.stufe); } catch { /* */ } }
  } else Q.gutSeit = 0;
}
// Qualität wählen (Grafik-Fenster): 'auto' regelt selbst, die anderen sind feste Stufen
export const MODI = { auto: null, hoch: 0, mittel: 2, niedrig: 3 };
export function qualitaetSetzen(modus) {
  Q.modus = modus;
  try { localStorage.setItem('zinnbad-grafik', modus); } catch { /* kein Speicher */ }
  Q.gesperrt.clear(); Q.gutSeit = 0; Q.ruhe = 1200;
  stufeSetzen(MODI[modus] ?? Q.stufe);
}
