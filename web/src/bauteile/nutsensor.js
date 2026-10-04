import * as THREE from 'three';
import { M } from '../core/materialien.js';
import { cached, mesh, zyl } from '../core/geometrie.js';
import { label } from '../core/beschriftung.js';
import { SENSOREN } from '../anlage/register.js';
import { sensorLed } from '../core/leds.js';
import { schlauch } from './leitungen.js';

// Nutsensor (Festo SMT-8M-A, von oben einlegbar, Kabel 2,5 m PUR mit M12-Stecker) in einer T-Nut des Zylinders.
// Gehäuse: 24,5 mm lang, unten in der Nut, oben flach gewölbt (≈ 1 mm über dem Profil), Klemmschraube (Innensechskant)
// an der Stirnseite gegenüber dem Kabelabgang, gelbe Schaltanzeige-LED oben am Kabelende.
// nut 'oben': linke obere Nut (Anschlussseite, Kabel läuft neben der Steckverschraubung über den Deckel),
// nut 'seite': Seitennut (+z oder −z). Das Kabel liegt in der Nut bis zum Zylinderboden (x = 0)
// und tritt dort aus. SENSOR_AUSTRITT merkt sich Austrittspunkt und Gruppe für die Verdrahtung.
export const SENSOR_AUSTRITT = {};
export const NUT_OBEN = 0.27;    // obere Nuten des DSBC-Profils bei ±0,27·E neben den Anschlüssen
const smtGeo = () => cached('smt8m', () => {
  // Querschnitt (z quer, y hoch; y = 0 Profiloberfläche), extrudiert entlang x
  const s = new THREE.Shape();
  s.moveTo(-1.9, -3.8); s.lineTo(1.9, -3.8); s.lineTo(1.9, -1.4); s.lineTo(2.9, -1.0); s.lineTo(2.9, 0.2);
  s.quadraticCurveTo(2.6, 1.2, 0, 1.3); s.quadraticCurveTo(-2.6, 1.2, -2.9, 0.2);
  s.lineTo(-2.9, -1.0); s.lineTo(-1.9, -1.4); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 24.5, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.3, bevelSegments: 1, curveSegments: 4 });
  g.rotateY(Math.PI / 2); g.translate(-12.25, 0, 0);
  return g;
});
const kappeGeo = () => cached('smtKappe', () => {
  // LED-Kappe am Kabelende: etwas erhaben, Kabeltülle
  const g = new THREE.CylinderGeometry(2.3, 2.6, 5, 10);
  g.rotateZ(Math.PI / 2);
  return g;
});
export function nutSensor(parent, x, a, kap, signal, text, nut, seite) {
  const ng = new THREE.Group(); parent.add(ng);
  if (nut === 'seite') ng.rotation.x = seite * Math.PI / 2;
  else ng.position.z = -a * NUT_OBEN;                                              // obere Nut neben dem Anschluss
  const yo = a / 2;
  const k = mesh(smtGeo(), M.kunststoff, ng); k.position.set(x, yo, 0);             // Sensorgehäuse
  const t = mesh(kappeGeo(), M.kunststoff, ng); t.position.set(x - 13.5, yo - 0.4, 0);   // Kabeltülle
  // Schaltanzeige: gelbe LED oben auf dem Gehäuse. Sie muss über die Wölbung des
  // Gehäuses (y = 1,3) hinausstehen, sonst ist von der Endlagenmeldung nichts zu sehen.
  const mat = sensorLed(ng, x - 9, yo + 1.95, 0, signal, 3.6, 1.5, 2.9);
  zyl(1.2, 0.6, M.stahl, x + 9.5, yo + 1.2, 0, null, ng, 6);                      // Klemmschraube M2,5
  zyl(0.55, 0.7, M.schwarz, x + 9.5, yo + 1.3, 0, null, ng, 6);
  const yk = a / 2 - 2.6, yd = a / 2 + 1.5 + 2.6;
  schlauch([[x - 15.5, yo - 0.5, 0], [x - 21, yk, 0], [kap + 8, yk, 0], [kap + 1, yd - 0.8, 0], [kap - 6, yd, 0], [-6, yd, 0], [-14, yd - 3, 0]], M.kabelGrau, 1.6, ng, 48);
  SENSOR_AUSTRITT[signal] = { grp: ng, p: new THREE.Vector3(-14, yd - 3, 0), weiter: new THREE.Vector3(-30, yd - 3, 0) };
  const div = label(text, ng, x, a / 2 + 18, 0, 'klein');
  SENSOREN.push({ signal, mat, div });
}
