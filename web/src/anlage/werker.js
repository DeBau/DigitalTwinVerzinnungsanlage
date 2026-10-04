import * as THREE from 'three';
import XBOT_GLB from '../lib/xbot_glb.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { st } from '../logik/zustand.js';
import { scene } from '../core/szene.js';
import { V } from '../core/geometrie.js';
import { ereignis } from '../ui/ereignisse.js';

export const PERSON = { g: null, zustand: 'weg', z: 1900, x: 1150, mixer: null, walk: null, idle: null, t: 0 };
// Person geht hinein, bleibt stehen, geht wieder hinaus. Unterbrochen ist das Schutzfeld nur, solange der Körper
// die Lichtvorhangebene (z = 600) durchquert. −KF2 bleibt bis zum Quittieren aus (Wiederanlaufsperre).
export function personStarten() {
  if (!PERSON.mixer || PERSON.zustand !== 'weg') return;
  Object.assign(PERSON, { zustand: 'rein', i: 0, weg: [[3400, 1180], [1150, 1180], [1150, 380]] });
  PERSON.x = 3400; PERSON.z = 1180;
  PERSON.g.visible = true;
  ereignis('Ein Werker geht durch den Lichtvorhang in die Anlage');
}
export function personBewegen(dt) {
  const P = PERSON;
  if (!P || P.zustand === 'weg') { st.eingriff = false; return; }
  const v = 1100;                                                  // Gehgeschwindigkeit mm/s (passt zur Laufanimation)
  let geht = true, richtung = P.g.rotation.y;
  if (P.zustand === 'steht') { geht = false; P.t -= dt; if (P.t <= 0) { P.zustand = 'raus'; P.weg = [...P.weg].reverse(); P.i = 0; } }
  else {
    const [zx, zz] = P.weg[Math.min(P.i + 1, P.weg.length - 1)];
    const dx = zx - P.x, dz = zz - P.z, d = Math.hypot(dx, dz), sch = v * dt;
    if (d <= sch) { P.x = zx; P.z = zz; P.i++; if (P.i >= P.weg.length - 1) { if (P.zustand === 'rein') { P.zustand = 'steht'; P.t = 3; } else { P.zustand = 'weg'; P.g.visible = false; } } }
    else { P.x += dx / d * sch; P.z += dz / d * sch; richtung = Math.atan2(dx, dz); }
  }
  // weiches Überblenden Gehen ↔ Stehen, Drehen in Gehrichtung
  const wW = P.walk.getEffectiveWeight();
  P.walk.setEffectiveWeight(wW + ((geht ? 1 : 0) - wW) * Math.min(1, dt * 5));
  P.idle.setEffectiveWeight(1 - P.walk.getEffectiveWeight());
  P.mixer.update(dt);
  let dr = richtung - P.g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr));
  P.g.rotation.y += dr * Math.min(1, dt * 5);
  P.g.position.set(P.x / 1000, 0, P.z / 1000);
  st.eingriff = Math.abs(P.z - 600) < 160;
}

// Werker: geriggtes Menschmodell (Mixamo X Bot) mit Lauf- und Stehanimation, Arbeitsoverall, Warnweste, Helm
export function werkerLaden() {
  const P = new THREE.Group(); P.visible = false; scene.add(P);                 // in Metern direkt in der Szene
  PERSON.g = P;
  const bin = Uint8Array.from(atob(XBOT_GLB), c => c.charCodeAt(0)).buffer;
  new GLTFLoader().parse(bin, '', (gltf) => {
    const m = gltf.scene;
    const bb = new THREE.Box3().setFromObject(m), hoehe = bb.max.y - bb.min.y;
    m.scale.setScalar(1.76 / hoehe);                                           // 1,76 m Körpergröße
    const overall = new THREE.MeshStandardMaterial({ color: 0x2c3f5c, roughness: 0.85 });
    const gelenke = new THREE.MeshStandardMaterial({ color: 0x1d2633, roughness: 0.8 });
    m.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
      o.material = /joint/i.test(o.material.name || o.name) ? gelenke : overall;
    });
    P.add(m);
    P.updateMatrixWorld(true);
    const knochen = (teil) => { let b = null; m.traverse(o => { if (!b && o.isBone && o.name.replace(/[:_]/g, '').toLowerCase().endsWith(teil)) b = o; }); return b; };
    // Warnweste am Brustwirbel, Helm am Kopf (in Weltlage platziert, dann an den Knochen gehängt)
    const brust = knochen('spine2'), kopf = knochen('head');
    if (brust) {
      const w = new THREE.Group(); w.position.copy(brust.getWorldPosition(new THREE.Vector3())).add(V(0, -0.06, 0.01));
      const weste = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.165, 0.42, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xf2a900, roughness: 0.6, emissive: 0x2a1c00, side: THREE.DoubleSide }));
      weste.scale.z = 0.68; weste.castShadow = true; w.add(weste);
      for (const y of [-0.08, 0.06]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.177, 0.17, 0.035, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xdfe4e8, metalness: 0.6, roughness: 0.25, side: THREE.DoubleSide })); r.scale.z = 0.69; r.position.y = y; w.add(r); }
      scene.add(w); brust.attach(w);
    }
    if (kopf) {
      const hm = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.35 });
      const h = new THREE.Group(); h.position.copy(kopf.getWorldPosition(new THREE.Vector3())).add(V(0, 0.115, 0.01));
      const schale = new THREE.Mesh(new THREE.SphereGeometry(0.125, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), hm); schale.scale.set(1, 0.95, 1.12); schale.castShadow = true; h.add(schale);
      const schirm = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.008, 24, 1, false, -Math.PI / 2, Math.PI), hm); schirm.position.set(0, 0.0, 0.035); schirm.scale.z = 1.1; h.add(schirm);
      scene.add(h); kopf.attach(h);
    }
    PERSON.mixer = new THREE.AnimationMixer(m);
    const clip = (n) => gltf.animations.find(a => a.name.toLowerCase() === n);
    PERSON.walk = PERSON.mixer.clipAction(clip('walk')); PERSON.idle = PERSON.mixer.clipAction(clip('idle'));
    PERSON.walk.play(); PERSON.idle.play(); PERSON.idle.setEffectiveWeight(0);
  }, (e) => console.warn('Menschmodell konnte nicht geladen werden', e));
}

