import * as THREE from 'three';

export const SENSOREN = [];
export const PULT_TASTER = [];   // anklickbare Befehlsgeräte (Pult, Vor-Ort, Schaltschranktür)
export const PULT_LAMPEN = [];
export const KNEBEL = [];
export const LICHTVORHANG = { leds: [], strahlen: null };
export const KLICK = new THREE.MeshBasicMaterial({ visible: false });   // Klickflächen (nur für den Raycaster)
