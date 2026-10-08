import * as THREE from 'three';

// ----------------------------------------------------------------------------
// Gebrauchsspuren: Die Anlage soll aussehen wie eine gepflegte Anlage im Einsatz, nicht wie neu.
// Alles wird im Shader aus der Weltposition berechnet (keine UVs nötig, nahtlos über zusammengefasste Meshes,
// keine zusätzlichen Draw Calls):
//   - Rauheit fleckig (matte und speckige Stellen, Griffspuren)
//   - Farbe leicht ungleichmäßig (Lack und Eloxal nicht perfekt gleichmäßig)
//   - Verschmutzung in Bodennähe (dunkler und matter)
//   - Anlauffarben am Edelstahlrand des Zinnbads
// Dazu gezielte Abnutzung an Teilen, die ein Material mit abnutzen(material, art) markiert haben (ABNUTZUNG).
// Stärke 0 schaltet alles ab, 1 ist der Normalwert.
// ----------------------------------------------------------------------------
export const GEBRAUCH = {
  staerke: { value: 1 },
  waerme: { value: new THREE.Vector3(1e6, 1e6, 1e6) },   // Mitte der Badöffnung in Metern (wird beim Aufbau gesetzt)
  kurve: { value: new THREE.Vector4(1e6, 1e6, 0, 0) },   // Rollenkurve: Mittelpunkt x/z, Radius der Mittellinie, Kufenabstand von der Mitte (m)
  rollenJeRad: { value: 1 },                              // Rollenkurve: Tragrollen je Radiant (jede Rolle sieht etwas anders aus)
};

// Arten gezielter Abnutzung. Beim Zusammenfassen wandert die Art als Eckenwert „gebrauchArt“ mit (core/eckenwerte.js).
export const ABNUTZUNG = {
  schiene: 1,         // Seitenführung: Körbe schleifen entlang, waagrechte Riefen und dunkler Abrieb
  schieneKurve: 2,    // Seitenführung außen in der Kurve: Körbe werden angedrückt, am stärksten
  kurvenrolle: 3,     // Tragrolle der Kurve: blanke Laufspuren der Kufen, Ablagerung am Rand, Umfangsriefen
};
export function abnutzen(m, art) {
  m.userData.abnutzung = ABNUTZUNG[art];
  return m;
}

const VERTEX_KOPF = `
varying vec3 vGebrauch;
attribute float gebrauchArt;
varying float vGebrauchArt;`;
const VERTEX_WELT = `
vec4 gebrauchWelt = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
gebrauchWelt = instanceMatrix * gebrauchWelt;
#endif
vGebrauch = (modelMatrix * gebrauchWelt).xyz;
vGebrauchArt = gebrauchArt;`;

const FRAGMENT_KOPF = `
varying vec3 vGebrauch;
uniform float gebrauchStaerke;
uniform vec3 gebrauchWaerme;
uniform vec4 gebrauchKurve;
uniform float gebrauchRollenJeRad;
uniform float gebrauchArtMaterial;
varying float vGebrauchArt;
float gebrauchHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float gebrauchRauschen(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(gebrauchHash(i), gebrauchHash(i + vec3(1, 0, 0)), f.x), mix(gebrauchHash(i + vec3(0, 1, 0)), gebrauchHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(gebrauchHash(i + vec3(0, 0, 1)), gebrauchHash(i + vec3(1, 0, 1)), f.x), mix(gebrauchHash(i + vec3(0, 1, 1)), gebrauchHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
// Bodennähe: 1 am Boden, 0 ab 40 cm, mit unruhigem Rand
float gebrauchBoden() { return (1.0 - smoothstep(0.0, 0.4, vGebrauch.y + 0.1 * gebrauchRauschen(vGebrauch * 6.0))) * (0.5 + 0.5 * gebrauchRauschen(vGebrauch * 14.0)); }
// Riefen mit Frequenz f (je Meter) ausblenden, wenn sie feiner als ein Pixel werden (sonst flimmern sie aus der Entfernung)
float gebrauchScharf(float x, float f) { return 1.0 - smoothstep(0.25, 0.6, fwidth(x) * f); }`;

// Seitenführung: waagrechte Riefen (fein und einzelne tiefe), blank geschliffen, dazu dunkler Abrieb von den Körben.
// Längs der Schiene genügt x + z als grobe Koordinate (die Riefen laufen waagrecht, egal wie die Schiene liegt).
const SCHIENE = `
float gebrauchSchiene = gebrauchArtWert > 0.5 && gebrauchArtWert < 2.5 ? gebrauchStaerke * (gebrauchArtWert > 1.5 ? 1.0 : 0.6) : 0.0;
float gebrauchRiefe = 0.0, gebrauchBelag = 0.0, gebrauchSpur = 0.0;
if (gebrauchSchiene > 0.0) {
  float l = gp.x + gp.z;
  float fein = smoothstep(0.55, 0.85, gebrauchRauschen(vec3(l * 5.0, gp.y * 900.0, 0.0))) * gebrauchScharf(gp.y, 900.0);
  float mittel = smoothstep(0.6, 0.85, gebrauchRauschen(vec3(l * 3.0, gp.y * 400.0, 2.0))) * gebrauchScharf(gp.y, 400.0);
  float tief = smoothstep(0.6, 0.85, gebrauchRauschen(vec3(l * 1.5, gp.y * 180.0, 5.0)));
  gebrauchRiefe = gebrauchSchiene * max(max(0.7 * fein, 0.9 * mittel), tief);
  gebrauchBelag = gebrauchSchiene * smoothstep(0.42, 0.68, gebrauchRauschen(vec3(l * 4.0, gp.y * 150.0, 9.0)));   // lange Abriebstreifen
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.03, 0.03, 0.028), clamp(0.85 * gebrauchBelag, 0.0, 0.85));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0), 0.75 * gebrauchRiefe);
}`;

// Kurvenrolle: Die Kufen der Körbe laufen in zwei Spuren (Abstand von der Mittellinie gebrauchKurve.w). Dort blank
// mit Umfangsriefen, an den Spurrändern dunkle Ablagerung. Alles hängt nur vom Abstand zum Kurvenmittelpunkt ab,
// ist also drehsymmetrisch um die Rollenachse und bleibt beim Drehen stehen.
const ROLLE = `
if (gebrauchRolle > 0.0) {
  vec2 r = gp.xz - gebrauchKurve.xy;
  float nr = floor(atan(r.y, r.x) * gebrauchRollenJeRad);                       // Nummer der Rolle (Grenzen liegen zwischen den Rollen)
  float zufall = gebrauchHash(vec3(nr, 3.7, 1.3)), zufall2 = gebrauchHash(vec3(nr, 8.1, 4.2));
  float d = abs(length(r) - gebrauchKurve.z) - gebrauchKurve.w + (zufall - 0.5) * 0.008;   // Abstand zur Kufenspur, je Rolle etwas versetzt
  float spur = 1.0 - smoothstep(0.006, 0.013, abs(d));
  float rand = smoothstep(0.01, 0.013, abs(d)) * (1.0 - smoothstep(0.014, 0.02 + 0.008 * zufall2, abs(d)));
  float ringe = smoothstep(0.55, 0.85, gebrauchRauschen(vec3(d * 1500.0, nr, 0.5))) * gebrauchScharf(d, 1500.0);
  gebrauchSpur = gebrauchRolle * spur;
  gebrauchBelag = gebrauchRolle * rand * (0.3 + 0.5 * zufall2);
  gebrauchRiefe = gebrauchSpur * ringe * 0.6;
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.045, 0.04), 0.6 * gebrauchBelag);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95), 0.2 * gebrauchSpur + 0.4 * gebrauchRiefe);
}`;

// Farbe: Staub/Schmutz (bräunlich grau) in Bodennähe, als senkrechte Läufer und als Flecken; dazu helle Kratzer
// im Lack und leichte Wolken. Schmutz wird zur Schmutzfarbe gemischt: Dunkles wird staubig heller, Helles dunkler.
const FARBE = `
vec3 gp = vGebrauch;
float gebrauchArtWert = max(vGebrauchArt, gebrauchArtMaterial);
float gebrauchRolle = abs(gebrauchArtWert - 3.0) < 0.5 ? gebrauchStaerke : 0.0;
float gebrauchAllg = gebrauchRolle > 0.0 ? 0.0 : gebrauchStaerke;      // Rollen drehen sich: dort keine ortsfesten Flecken
float gebrauchWolke = gebrauchRauschen(gp * 3.0) - 0.5;
float gebrauchLaeufer = smoothstep(0.55, 0.9, gebrauchRauschen(gp * vec3(60.0, 1.5, 60.0))) * (1.0 - 0.6 * smoothstep(0.3, 1.5, gp.y));
float gebrauchFleck = smoothstep(0.58, 0.72, gebrauchRauschen(gp * 9.0 + 7.3)) * (0.5 + 0.5 * gebrauchRauschen(gp * 45.0));
float gebrauchSchmutz = clamp(gebrauchAllg * (0.45 * gebrauchBoden() + 0.18 * gebrauchLaeufer + 0.15 * gebrauchFleck), 0.0, 0.7);
float gebrauchKratzer = gebrauchAllg * smoothstep(0.6, 0.75, gebrauchRauschen(gp * 4.0 + 3.1))
  * max(smoothstep(0.93, 0.97, gebrauchRauschen(gp * vec3(260.0, 18.0, 18.0))), smoothstep(0.93, 0.97, gebrauchRauschen(gp * vec3(18.0, 18.0, 260.0))));
diffuseColor.rgb *= 1.0 + 0.12 * gebrauchAllg * gebrauchWolke;
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.13, 0.115, 0.09), gebrauchSchmutz);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.4), clamp(0.4 * gebrauchKratzer, 0.0, 0.4));
${SCHIENE}
${ROLLE}`;

// Rauheit: Schmutz und Kratzer matt, Wolken wechselnd stumpf und speckig; Schleifstellen blank, Riefen stumpf
const RAUHEIT = `
roughnessFactor = mix(roughnessFactor + 0.2 * gebrauchAllg * gebrauchWolke, 0.95, max(gebrauchSchmutz, 0.5 * gebrauchKratzer));
roughnessFactor = mix(roughnessFactor, 0.2, 0.4 * gebrauchSpur);                    // Laufspur der Rollen leicht blank
roughnessFactor = mix(roughnessFactor, 0.55, gebrauchRiefe);
roughnessFactor = mix(roughnessFactor, 0.85, gebrauchBelag);
roughnessFactor = clamp(roughnessFactor, 0.04, 1.0);`;

// Anlauffarben: strohgelb bis bronze am Rand der Badöffnung, nur auf Metall.
// Vorher: Schmutz und Abrieb auf Metall sind nicht metallisch (sonst färben sie nur den Spiegel ein)
const WAERME = `
metalnessFactor *= 1.0 - 0.85 * max(gebrauchSchmutz, gebrauchBelag);
{
  vec3 d = abs(vGebrauch - gebrauchWaerme);
  float rand = max(d.x, d.z);
  float zone = (1.0 - smoothstep(0.125, 0.18, rand)) * (1.0 - smoothstep(0.0, 0.03, d.y));
  vec3 anlauf = mix(vec3(0.85, 0.7, 0.45), vec3(0.6, 0.42, 0.3), smoothstep(0.125, 0.16, rand));
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * anlauf, gebrauchStaerke * 0.5 * zone * metalnessFactor);
}`;

function shaderErweitern(shader, art) {
  shader.uniforms.gebrauchStaerke = GEBRAUCH.staerke;
  shader.uniforms.gebrauchWaerme = GEBRAUCH.waerme;
  shader.uniforms.gebrauchKurve = GEBRAUCH.kurve;
  shader.uniforms.gebrauchRollenJeRad = GEBRAUCH.rollenJeRad;
  shader.uniforms.gebrauchArtMaterial = { value: art };
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\n${VERTEX_KOPF}`)
    .replace('#include <project_vertex>', `#include <project_vertex>\n${VERTEX_WELT}`);
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>\n${FRAGMENT_KOPF}`)
    .replace('#include <color_fragment>', `#include <color_fragment>\n${FARBE}`)
    .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${RAUHEIT}`)   // nur Standard
    .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>\n${WAERME}`);    // nur Standard
}

const GEEIGNET = new Set(['MeshStandardMaterial', 'MeshPhysicalMaterial', 'MeshLambertMaterial']);
const geeignet = (m) => GEEIGNET.has(m.type) && !m.transparent && !m.userData.ohneGebrauch && !m.userData.gebrauch;

// Ein Material bekommt die Gebrauchsspuren; ein vorhandener Shader-Umbau (z. B. Eckenwerte) bleibt davor
export function gebrauchAnwenden(m) {
  if (!geeignet(m)) return;
  const vorher = m.onBeforeCompile, schluessel = m.customProgramCacheKey();
  const art = m.userData.abnutzung || 0;
  m.onBeforeCompile = (shader, renderer) => { vorher.call(m, shader, renderer); shaderErweitern(shader, art); };
  m.customProgramCacheKey = () => `${schluessel}|gebrauch`;
  m.userData.gebrauch = true;
  m.needsUpdate = true;
}

// Alle Meshes der Szene (Figuren mit Skelett ausgenommen)
export function gebrauchsspurenAnwenden(wurzel) {
  wurzel.traverse((o) => {
    if (!o.isMesh || o.isSkinnedMesh) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) gebrauchAnwenden(m);
  });
}

// ----------------------------------------------------------------------------
// Gebrauchsspuren auf bedruckten Fronten (Canvas der Bedienpanels): um jedes Bedienelement ein speckiger,
// abgegriffener Hof (nach unten verschoben, von dort kommt die Hand), Fingerabdrücke, feine Kratzer vom Ring weg.
// punkte: [x, y, r, haeufigkeit] in Frontkoordinaten (Mitte 0, y nach oben, mm); haeufigkeit 0 … 1.
// Fester Zufall je Front, damit die Spuren bei jedem Laden gleich aussehen.
// ----------------------------------------------------------------------------
function zufall(saat) {
  let s = saat;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}
function hof(c, x, y, r, h) {
  const gr = c.createRadialGradient(x, y + r * 0.5, r * 0.6, x, y + r * 0.5, r * 2.6);
  gr.addColorStop(0, `rgba(70,62,50,${0.3 * h})`); gr.addColorStop(1, 'rgba(70,62,50,0)');
  c.fillStyle = gr; c.fillRect(x - r * 3, y - r * 3, r * 6, r * 7);
}
function fingerabdruecke(c, x, y, r, h, z) {
  for (let i = 0; i < 3 + 5 * h; i++) {
    const w = z() * Math.PI * 2, a = r * (1.1 + z() * 1.2);
    c.fillStyle = `rgba(55,50,42,${0.08 + 0.1 * z()})`;
    c.beginPath(); c.ellipse(x + Math.cos(w) * a, y + Math.sin(w) * a * 0.8 + r * 0.4, 3 + z() * 2.5, 4 + z() * 3, z() * Math.PI, 0, 7); c.fill();
  }
}
function ringkratzer(c, x, y, r, h, z) {
  c.lineWidth = 0.35;
  for (let i = 0; i < 4 + 10 * h; i++) {
    const w = z() * Math.PI * 2, a = r * (1.0 + z() * 0.3), l = 2 + z() * 7;
    c.strokeStyle = z() < 0.6 ? `rgba(255,255,255,${0.35 + 0.3 * z()})` : 'rgba(40,40,40,0.35)';
    c.beginPath(); c.moveTo(x + Math.cos(w) * a, y + Math.sin(w) * a);
    c.lineTo(x + Math.cos(w + 0.3 * (z() - 0.5)) * (a + l), y + Math.sin(w + 0.3 * (z() - 0.5)) * (a + l)); c.stroke();
  }
}
export function frontAbnutzen(c, w, h, punkte, saat = 1) {
  const z = zufall(saat * 7919 + 1);
  for (const [px, py, r, haeufigkeit = 1] of punkte) {
    const x = px + w / 2, y = h / 2 - py;
    hof(c, x, y, r, haeufigkeit);
    fingerabdruecke(c, x, y, r, haeufigkeit, z);
    ringkratzer(c, x, y, r, haeufigkeit, z);
  }
  // Untere Kante: dort liegt die Hand auf (leicht schmutzig), dazu vereinzelte Kratzer über die Front
  const gr = c.createLinearGradient(0, h, 0, h * 0.75);
  gr.addColorStop(0, 'rgba(70,62,50,0.22)'); gr.addColorStop(1, 'rgba(70,62,50,0)');
  c.fillStyle = gr; c.fillRect(0, h * 0.75, w, h * 0.25);
  c.lineWidth = 0.3;
  for (let i = 0; i < 14; i++) {
    const x = z() * w, y = z() * h, l = 5 + z() * 25, wi = z() * Math.PI;
    c.strokeStyle = `rgba(255,255,255,${0.2 + 0.25 * z()})`;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(wi) * l, y + Math.sin(wi) * l); c.stroke();
  }
}
