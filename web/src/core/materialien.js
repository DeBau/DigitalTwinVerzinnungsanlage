import * as THREE from 'three';
import { TEX } from './texturen.js';

// ----------------------------------------------------------------------------
// Materialien
// ----------------------------------------------------------------------------
export const M = {
  // Aluminium-Strukturprofil, natur eloxiert (E6/EV1), leicht gebürstet
  profil: new THREE.MeshStandardMaterial({ color: 0xc4c9ce, metalness: 0.75, roughness: 0.42, roughnessMap: TEX.gebuerstet }),
  zylinder: new THREE.MeshStandardMaterial({ color: 0xcfd4d9, metalness: 0.75, roughness: 0.32, roughnessMap: TEX.gebuerstet }),
  deckel: new THREE.MeshStandardMaterial({ color: 0xa3aab1, metalness: 0.7, roughness: 0.38 }),
  blech: new THREE.MeshStandardMaterial({ color: 0xd2d4cf, metalness: 0.05, roughness: 0.55 }),   // RAL 7035 pulverbeschichtet
  anthrazit: new THREE.MeshStandardMaterial({ color: 0x383e44, metalness: 0.1, roughness: 0.55 }), // RAL 7016
  stahl: new THREE.MeshStandardMaterial({ color: 0xe6e9ec, metalness: 1.0, roughness: 0.14 }),
  edelstahl: new THREE.MeshStandardMaterial({ color: 0xb4bbc1, metalness: 0.9, roughness: 0.3, roughnessMap: TEX.gebuerstet }),
  schwarz: new THREE.MeshStandardMaterial({ color: 0x1c1f22, metalness: 0.3, roughness: 0.5 }),                // brüniert / Schrauben
  kunststoff: new THREE.MeshStandardMaterial({ color: 0x26292d, metalness: 0.0, roughness: 0.62 }),
  messing: new THREE.MeshStandardMaterial({ color: 0xc9a54a, metalness: 0.9, roughness: 0.3 }),
  blau: new THREE.MeshStandardMaterial({ color: 0x2a5f97, metalness: 0.5, roughness: 0.4 }),       // blau eloxiert
  gelb: new THREE.MeshStandardMaterial({ color: 0xf0b400, metalness: 0.05, roughness: 0.48 }),
  rot: new THREE.MeshStandardMaterial({ color: 0xc8281f, metalness: 0.05, roughness: 0.42 }),
  kette: new THREE.MeshStandardMaterial({ color: 0x24272b, metalness: 0.0, roughness: 0.68 }),
  pc: new THREE.MeshLambertMaterial({ color: 0xe4eef3, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false }),   // günstig: große Fläche
  boden: new THREE.MeshStandardMaterial({ map: TEX.boden, color: 0x365c42, roughness: 0.42, metalness: 0, envMapIntensity: 0.12 }),   // Epoxid Industrie-Grün (≈ RAL 6011), seidenmatt – hebt sich von Alu und Anthrazit ab
  warn: new THREE.MeshStandardMaterial({ map: TEX.warnband, roughness: 0.7 }),
  band: new THREE.MeshStandardMaterial({ map: TEX.band, roughness: 0.85 }),
  zinn: new THREE.MeshStandardMaterial({ map: TEX.zinn, color: 0xffffff, metalness: 1.0, roughness: 0.16, emissive: 0xff6a1a, emissiveIntensity: 0 }),
  kabel: new THREE.MeshStandardMaterial({ color: 0x232629, roughness: 0.55 }),
  kabelGrau: new THREE.MeshStandardMaterial({ color: 0x8a9196, roughness: 0.5 }),               // PUR-Sensorleitung
  kabelOrange: new THREE.MeshStandardMaterial({ color: 0xd9731f, roughness: 0.5 }),             // Schleppkettenleitung
  kabelGruen: new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.5 }),              // PROFINET
  verzinkt: new THREE.MeshStandardMaterial({ color: 0xbcc4ca, metalness: 0.8, roughness: 0.4 }),
  pvc: new THREE.MeshStandardMaterial({ color: 0x9ea4a9, metalness: 0.0, roughness: 0.6 }),
  pvcHell: new THREE.MeshStandardMaterial({ color: 0xbfc4c8, metalness: 0.0, roughness: 0.55 }),
  alu: new THREE.MeshStandardMaterial({ color: 0xd0d5da, metalness: 0.8, roughness: 0.32 }),
  ifm: new THREE.MeshStandardMaterial({ color: 0xec6a12, roughness: 0.5 }),                // ifm-Orange (PA)
  keyence: new THREE.MeshStandardMaterial({ color: 0x2b2d30, roughness: 0.45 }),           // PBT schwarz
  rittal: new THREE.MeshStandardMaterial({ color: 0xd2d4cf, roughness: 0.5, metalness: 0.05 }),  // RAL 7035
  rittalAlu: new THREE.MeshStandardMaterial({ color: 0xc8ccd0, metalness: 0.85, roughness: 0.3 }),
  qsBlau: new THREE.MeshStandardMaterial({ color: 0x1d6fbf, metalness: 0.0, roughness: 0.42 }),   // Lösering QS (POM blau)
  festoAlu: new THREE.MeshStandardMaterial({ color: 0xc3c8cd, metalness: 0.8, roughness: 0.35 }),
};
