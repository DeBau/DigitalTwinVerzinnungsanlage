import * as THREE from 'three';

// ----------------------------------------------------------------------------
// Eckenwerte: Farbe, Rauheit und Metallanteil stehen beim Zusammenfassen an jeder Ecke statt im Material.
// So kommen Teile, die sich nur darin unterscheiden, in ein gemeinsames Mesh (ein Draw Call statt vieler).
// Gilt nur für nicht leuchtende, nicht transparente Standardmaterialien – deren Werte ändern sich nie.
// ----------------------------------------------------------------------------
export const eckenwerteMoeglich = (m) => m.type === 'MeshStandardMaterial' && !m.transparent && m.emissive?.getHex() === 0;

// Was übrig bleibt, muss gleich sein: Texturen, Seiten, Versatz
export const oberflaeche = (m) => [m.map?.uuid, m.roughnessMap?.uuid, m.bumpMap?.uuid, m.normalMap?.uuid, m.alphaMap?.uuid,
  m.alphaTest, m.side, m.envMapIntensity, m.flatShading, m.polygonOffset, m.polygonOffsetFactor, m.polygonOffsetUnits].join('|');

// Shader: Rauheit und Metallanteil aus dem Eckenattribut „rauMetall“ statt aus dem Material
function shaderErweitern(shader) {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nattribute vec2 rauMetall;\nvarying vec2 vRauMetall;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRauMetall = rauMetall;');
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying vec2 vRauMetall;')
    .replace('#include <roughnessmap_fragment>', THREE.ShaderChunk.roughnessmap_fragment.replace('= roughness;', '= vRauMetall.x;'))
    .replace('#include <metalnessmap_fragment>', THREE.ShaderChunk.metalnessmap_fragment.replace('= metalness;', '= vRauMetall.y;'));
}

const MATERIALIEN = new Map();
export function eckenMaterial(m) {
  const key = oberflaeche(m);
  if (!MATERIALIEN.has(key)) {
    const e = m.clone();
    e.color.set(0xffffff);
    e.vertexColors = true;
    e.onBeforeCompile = shaderErweitern;
    e.customProgramCacheKey = () => 'eckenwerte';
    MATERIALIEN.set(key, e);
  }
  return MATERIALIEN.get(key);
}

// Hängt Farbe (linear) und Rauheit/Metallanteil des Materials an jede Ecke der Geometrie
export function eckenwerteAnhaengen(g, m) {
  const n = g.attributes.position.count;
  const farbe = new Float32Array(n * 3), rauMetall = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    m.color.toArray(farbe, i * 3);
    rauMetall[i * 2] = m.roughness;
    rauMetall[i * 2 + 1] = m.metalness;
  }
  g.setAttribute('color', new THREE.BufferAttribute(farbe, 3));
  g.setAttribute('rauMetall', new THREE.BufferAttribute(rauMetall, 2));
}
