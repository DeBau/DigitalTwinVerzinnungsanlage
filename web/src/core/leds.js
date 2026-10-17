import * as THREE from 'three';

// LEDs: Platzhalter mit einem „Material-Stellvertreter“ (color, emissive, emissiveIntensity).
// Beim Start werden alle LEDs je Baugruppe zu einem InstancedMesh zusammengefasst (ein Draw-Call),
// die Farbe je LED folgt jedes Bild dem Stellvertreter.
export const LED_LISTE = [];
export const LED_GEO = new THREE.BoxGeometry(1, 1, 1);
const LED_PLATZ = new THREE.MeshBasicMaterial({ color: 0x222222 });
export function sensorLed(parent, x, y, z, signal, w = 4, h = 1.6, d = 3.6) {
  const mat = { color: new THREE.Color(0x4a3d16), emissive: new THREE.Color(0xffb000), emissiveIntensity: 0 };
  const led = new THREE.Mesh(LED_GEO, LED_PLATZ);
  led.position.set(x, y, z); led.scale.set(w, h, d);
  led.userData.led = mat;
  parent.add(led);
  LED_LISTE.push(led);
  return mat;
}
export const LED_GRUPPEN = [];
const _ledFarbe = new THREE.Color();
export function ledsAktualisieren() {
  for (const g of LED_GRUPPEN) {
    g.proxys.forEach((m, i) => {
      const k = Math.min(1, m.emissiveIntensity / 1.6);
      _ledFarbe.copy(m.color).multiplyScalar(0.8).lerp(m.emissive, k);
      if (k > 0) _ledFarbe.multiplyScalar(1 + 0.6 * k);
      g.im.setColorAt(i, _ledFarbe);
    });
    g.im.instanceColor.needsUpdate = true;
  }
}
