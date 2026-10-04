// ============================================================================
//  Digitaler Zwilling – Zinnbad
//  3D-Anlage (Profilrahmen, Linearachse, ISO-Zylinder mit Nutsensoren,
//  Ventilinsel, Energiekette, Bandförderer, beheiztes Zinnbad, Umhausung),
//  Verhaltensmodell (Pneumatik mit Schaltverzug, Beschleunigung und
//  Endlagendämpfung, Sensoren mit Schaltpunkt und Hysterese, Prozesswerte),
//  Demo-SPS (Schrittkette im Browser) und Kopplung an
//  die Zwilling-Bridge (PLCSIM Advanced) per WebSocket.
//  Alle Maße im Modell in Millimetern.
// ============================================================================
// Module in der Reihenfolge, in der die Anlage aufgebaut wird
import './signale.js';
import './logik/zustand.js';
import './core/szene.js';
import './core/texturen.js';
import './core/materialien.js';
import './core/geometrie.js';
import './core/format.js';
import './core/beschriftung.js';
import './bauteile/aluprofil.js';
import './anlage/register.js';
import './anlage/werker.js';
import './core/leds.js';
import './bauteile/nutsensor.js';
import './bauteile/leitungen.js';
import './bauteile/stecker.js';
import './bauteile/zylinder.js';
import './anlage/halle.js';
import './anlage/baender.js';
import './bauteile/foerderer.js';
import './anlage/band1.js';
import './bauteile/lichtschranke.js';
import './anlage/rollenkurve.js';
import './anlage/band2.js';
import './anlage/kuehlung.js';
import './anlage/pruefstation.js';
import './anlage/zinnbad.js';
import './anlage/abdeckung.js';
import './anlage/portal.js';
import './anlage/pneumatik.js';
import './anlage/verdrahtung.js';
import './anlage/pruefstation-peripherie.js';
import './anlage/umhausung.js';
import './anlage/schaltschrank.js';
import './anlage/kabelbruecke.js';
import './anlage/befehlsgeraete.js';
import './anlage/koerbe.js';
import './ui/ansicht.js';
import './ui/bedienung.js';
import './ui/ereignisse.js';
import './logik/eingaenge.js';
import './logik/demo-sps.js';
import './logik/pneumatik-modell.js';
import './logik/prozess.js';
import './logik/band2.js';
import './logik/pruefstation.js';
import './ui/visualisierung.js';
import './ui/diagramm.js';
import './ui/signalmonitor.js';
import './ui/status.js';
import './ui/bridge.js';
import './core/grafik.js';
import './ui/beschriftung.js';
import './core/zusammenfassen.js';
import * as THREE from 'three';
import { ZYL, st } from './logik/zustand.js';
import { KAMERA, TAKT, anlage, camera, controls, labelRenderer, renderer, scene, sun } from './core/szene.js';
import { M } from './core/materialien.js';
import { ledsAktualisieren } from './core/leds.js';
import { BAND, BAND2, KURVE } from './anlage/baender.js';
import { MM8, MULDE, ST } from './anlage/pruefstation.js';
import { schrankAktualisieren, spsLedsAktualisieren } from './anlage/schaltschrank.js';
import { koerbe } from './anlage/koerbe.js';
import { ereignis } from './ui/ereignisse.js';
import { eingang } from './logik/eingaenge.js';
import { demo, demoSps } from './logik/demo-sps.js';
import { prozess } from './logik/prozess.js';
import { visual } from './ui/visualisierung.js';
import { wzAufzeichnen } from './ui/diagramm.js';
import { monitorAktualisieren, monitorAufbauen } from './ui/signalmonitor.js';
import { modusSetzen } from './ui/status.js';
import { eingaengeSenden, verbinden } from './ui/bridge.js';
import { Q, STUFEN, lambertAbgleich, qualitaetPruefen } from './core/grafik.js';
import { beschriftungOrdnen } from './ui/beschriftung.js';

// ----------------------------------------------------------------------------
// Hauptschleife
// ----------------------------------------------------------------------------
monitorAufbauen();
modusSetzen('demo', false);
verbinden();
setTimeout(() => { if (st.modus === 'demo' && !st.plcVerbunden) { demo.auto = true; ereignis('Demo: Automatik EIN'); } }, 1500);

// Testzugang (Konsole): __zwilling.sim(30) rechnet 30 s Anlagenzeit ohne Darstellung
window.__zwilling = { renderer, sun, st, ZYL, demo, koerbe, scene, anlage, THREE, eingang, BAND, BAND2, KURVE, MM8, MULDE, ST, M, camera, cam(px, py, pz, tx, ty, tz) { KAMERA.bewegt = true; camera.position.set(px, py, pz); controls.target.set(tx, ty, tz); }, sim(sek) {
  for (let t = 0; t < sek; t += 0.01) { if (st.modus === 'demo') demoSps(0.01); prozess(0.01); }
} };


const uhr = new THREE.Clock();
// Zeitmessung je Abschnitt (nur aktiv, wenn window.__zeiten gesetzt ist – Diagnose)
const ZM = (name, f) => { if (!window.__zeiten) return f(); const t = performance.now(); f(); const d = performance.now() - t; const z = window.__zeiten; z[name] = Math.max(z[name] || 0, d); };
renderer.setAnimationLoop(() => {
  const dt = Math.min(uhr.getDelta(), 0.05);
  // Feste Teilschritte, damit Pneumatik und Sensoren auch bei langsamen Bildraten sauber schalten
  const n = Math.max(1, Math.ceil(dt / 0.01));
  ZM('prozess', () => { if (!st.pause) for (let i = 0; i < n; i++) { if (st.modus === 'demo') demoSps(dt / n); prozess(dt / n); } });
  ZM('visual', () => visual(dt));
  ZM('schrank', () => { schrankAktualisieren(dt); spsLedsAktualisieren(dt); });
  ZM('monitor', () => { if (TAKT.bild % 6 === 3) monitorAktualisieren(); wzAufzeichnen(dt); eingaengeSenden(false); });
  controls.update();
  qualitaetPruefen();
  ZM('leds', () => { ledsAktualisieren(); if (STUFEN[Q.stufe].lambert) lambertAbgleich(); });
  const sa = STUFEN[Q.stufe].schattenAlle;
  if (sa > 0) renderer.shadowMap.needsUpdate = TAKT.bild % sa === 0;      // sa < 0: bleibt stehen (einmal berechnet)
  TAKT.bild++;
  ZM('render', () => renderer.render(scene, camera));
  ZM('labels', () => labelRenderer.render(scene, camera));
  ZM('ordnen', () => beschriftungOrdnen());
});
