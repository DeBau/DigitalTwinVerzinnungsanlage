import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { V, box, cached, mesh, zyl } from '../core/geometrie.js';
import { label, platte, tafel } from '../core/beschriftung.js';
import { profil } from '../bauteile/aluprofil.js';
import { KLICK, KNEBEL, PULT_LAMPEN, PULT_TASTER } from './register.js';
import { kabel } from './verdrahtung.js';
import { t as tr } from '../core/sprache.js';

// 3D-Bedienpult und Vor-Ort-Steuerstelle (alle Taster/Schalter anklickbar)
//  art 'tast' = Taster (solange gedrückt), 'notHalt' = rastend (Klick drücken / Klick entriegeln), 'wahl' = Wahl-/Schlüsselschalter
export function tafelText(c, t, x, y, size, gewicht = 600, farbe = '#2a3038') { c.fillStyle = farbe; c.font = `${gewicht} ${size}px "IBM Plex Sans Condensed", Arial`; c.textAlign = 'center'; c.fillText(t, x, y); }
// Befehlsgeräte Ø22 (Bauart SIEMENS SIRIUS ACT 3SU1, Metall): verchromter Frontring Ø 30 mit Fase, Druckknopf
// flach im Ring, Not-Halt-Pilz Ø 40 mit Drehentriegelung, Knebel mit Griffmulde, Leuchtmelder mit Linse.
// Geometrie als Drehteile (Achse z), gemeinsam gecacht.
const drehZ = (key, pkte, seg = 28) => cached(key, () => { const g = new THREE.LatheGeometry(pkte.map(([r, y]) => new THREE.Vector2(r, y)), seg); g.rotateX(Math.PI / 2); return g; });
const chrom = new THREE.MeshStandardMaterial({ color: 0xdfe3e6, metalness: 1, roughness: 0.18 });
function frontring(t, x = 0, y = 0) {
  const m = mesh(drehZ('3suRing', [[11.6, 0], [15, 0], [15, 3.2], [13.6, 5.6], [12.2, 6], [11.6, 6]]), chrom, t);
  m.position.set(x, y, 0);
  return m;
}
export function drucktaster(parent, x, y, key, farbe, symbol) {
  const t = new THREE.Group(); t.position.set(x, y, 0); parent.add(t);
  frontring(t);
  const mat = new THREE.MeshStandardMaterial({ color: farbe, roughness: 0.3, emissive: farbe, emissiveIntensity: 0 });
  const kappe = mesh(drehZ('3suKnopf', [[0, -3], [11.2, -3], [11.2, 2.6], [10.6, 3.2], [0, 3.4]]), mat, t);   // Druckknopf (leicht gewölbt)
  kappe.position.z = 4;
  if (symbol) box(symbol === '|' ? 2.4 : 9, symbol === '|' ? 9 : 2.4, 0.6, M.schwarz, 0, 0, 7.5, t);
  kappe.userData = { taster: key, art: 'tast' };
  PULT_TASTER.push({ key, kappe, z0: kappe.position.z, art: 'tast', mat });
  return mat;
}
function notHaltTaster(parent, x, y, key) {
  const t = new THREE.Group(); t.position.set(x, y, 0); parent.add(t);
  zyl(30, 1.4, M.gelb, 0, 0, 0.7, 'z', t, 48);                                       // gelbes Hinweisschild Ø 60
  mesh(drehZ('3suNhKragen', [[11, 0], [15, 0], [15, 6], [12.5, 8], [11, 8]]), M.schwarz, t);   // Kragen (Drehentriegelung)
  const kappe = mesh(drehZ('3suPilz', [[0, -12], [9, -12], [9, -6], [19.5, -6], [20, -3.5], [19, 1], [14, 4.4], [0, 5.6]], 36), M.rot, t);   // Pilzkopf Ø 40
  kappe.position.z = 19;
  kappe.userData = { taster: key, art: 'notHalt' };
  PULT_TASTER.push({ key, kappe, z0: kappe.position.z, art: 'notHalt' });
  const hit = zyl(30, 34, KLICK, 0, 0, 14, 'z', t, 16); hit.castShadow = false;
  hit.userData = { taster: key, art: 'notHalt' };
  PULT_TASTER.push({ key, kappe: hit, art: 'hit' });
}
export function wahlschalter(parent, x, y, key, schluessel) {
  const t = new THREE.Group(); t.position.set(x, y, 0); parent.add(t);
  frontring(t);
  mesh(drehZ(schluessel ? '3suSchloss' : '3suKnebelfuss', [[0, 3], [11.4, 3], [11.4, 8], [10.4, 9], [0, 9]]), schluessel ? chrom : M.schwarz, t);
  const knebel = new THREE.Group(); knebel.position.set(0, 0, 12); t.add(knebel);
  if (schluessel) {
    box(1.6, 7, 1, M.schwarz, 0, 0, -2.4, knebel);                                    // Schlüsselkanal
    box(3, 14, 5, M.messing, 0, 0, 2, knebel);                                       // Schlüsselbart/-hals
    box(14, 13, 3, M.kunststoff, 0, 13, 4, knebel);                                  // Schlüsselreide
  } else {
    box(8, 26, 9, M.schwarz, 0, 0, 3.5, knebel);                                     // Knebelgriff
    box(3, 3, 1, M.stahl, 0, 10, 8.4, knebel);                         // Stellungsmarke
  }
  const hit = zyl(20, 30, KLICK, 0, 0, 12, 'z', t, 16); hit.castShadow = false;     // unsichtbare Griffzone
  hit.userData = { taster: key, art: 'wahl' };
  PULT_TASTER.push({ key, kappe: hit, art: 'wahl' });
  KNEBEL.push({ key, knebel });
}
export function meldeleuchte(parent, x, y, signal, farbe) {
  const t = new THREE.Group(); t.position.set(x, y, 0); parent.add(t);
  frontring(t);
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(farbe).multiplyScalar(0.35), emissive: farbe, emissiveIntensity: 0, roughness: 0.2 });
  mesh(drehZ('3suLinse', [[0, 1], [11.4, 1], [11.4, 6.4], [9, 7.6], [0, 8]]), mat, t);   // Linse (Fresnel, leicht gewölbt)
  PULT_LAMPEN.push({ signal, mat });
}
// Bedienpult am Bandanfang (Säule 90x90, Pultgehäuse geneigt)
{
  const g = new THREE.Group(); g.position.set(-650, 0, 860); anlage.add(g);
  // Rittal Tragarmsystem CP 60: Standrohr Ø60 mit Fußplatte, Gelenk, Komfort-Bediengehäuse (Alu-Rahmen, RAL 7035)
  zyl(30, 900, M.rittalAlu, 0, 462, -40, null, g, 32);
  box(260, 12, 260, M.anthrazit, 0, 6, -40, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) zyl(7, 4, M.stahl, sx * 100, 14, -40 + sz * 100, null, g, 6);
  zyl(42, 30, M.anthrazit, 0, 25, -40, null, g, 32);                                    // Fußflansch
  box(90, 60, 90, M.anthrazit, 0, 935, -40, g);                                         // Gelenkkupplung
  const kopf = new THREE.Group(); kopf.position.set(0, 1010, 0); kopf.rotation.x = -0.55; g.add(kopf);
  // Front 440 × 360: drei Felder, Beschriftung ≥ 9 mm unter den Frontringen, Überschriften zwischen den Trennlinien
  box(440, 360, 110, M.rittal, 0, 0, -55, kopf);
  for (const sy of [-1, 1]) box(448, 12, 116, M.rittalAlu, 0, sy * 180, -55, kopf);     // Alu-Rahmenprofile oben/unten
  for (const sx of [-1, 1]) box(10, 376, 120, M.anthrazit, sx * 224, 0, -55, kopf);    // Eckstücke/Seitenteile anthrazit (stehen 2 mm über die Rahmenprofile)
  const W = 440, H = 360, k = 1.6, R1 = 115, R2 = 0, R3 = -112;
  platte(tafel('pultFront2', W, H, (c) => {
    c.fillStyle = '#c9cdd2'; c.fillRect(0, 0, W, H);
    const T = (t, x, y, s = 10, gw = 600) => tafelText(c, t, x + W / 2, H / 2 - y, s, gw);
    const linie = (y) => { c.strokeStyle = '#2a3038'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(14, H / 2 - y); c.lineTo(W - 14, H / 2 - y); c.stroke(); };
    linie(50); linie(-55);
    T(tr('EINZEL        AUTO'), -30, R1 + 30, 9.5);
    T(tr('NOT-HALT') + '  −SF0', -150, R1 - 53); T(tr('BETRIEBSART') + '  −SA1', -30, R1 - 53); T(tr('QUITTIEREN') + '  −SF4', 90, R1 - 53);
    T(tr('BETRIEB'), 0, 32, 12, 700);
    T('START  −SF1', -110, R2 - 40); T('STOP  −SF2', 20, R2 - 40); T(tr('Anlage läuft'), 150, R2 - 37, 9.5); T('−PF1', 150, R2 - 49, 8.5, 500);
    T(tr('MELDUNGEN'), 0, -76, 12, 700);
    [['Temperatur', '−PF2'], ['Füllhöhe unterschr.', '−PF3'], ['Korb vorhanden', '−PF4'], ['Handbetrieb', '−PF7']].forEach(([a, b], i) => { T(tr(a), -150 + i * 100, R3 - 38, 9.5); T(b, -150 + i * 100, R3 - 51, 8.5, 500); });
  }, k), W, H, kopf, 0, 0, 0.5);
  notHaltTaster(kopf, -150, R1, 'sf0');
  wahlschalter(kopf, -30, R1, 'sa1');
  const q = drucktaster(kopf, 90, R1, 'sf4', 0x3d8de0);
  PULT_LAMPEN.push({ signal: 'PF5_Quittieren', mat: q });
  drucktaster(kopf, -110, R2, 'sf1', 0x23a35a, '|');
  drucktaster(kopf, 20, R2, 'sf2', 0xd42a1f, '-');
  meldeleuchte(kopf, 150, R2, 'PF1_Automatik', 0xf4f7fb);
  [['PF2_Temperatur', 0xffae1a], ['PF3_Fuellhoehe', 0xff3b2f], ['PF4_Korb', 0x3be27a], ['PF7_Handbetrieb', 0xffae1a]].forEach(([sig, f], i) => meldeleuchte(kopf, -150 + i * 100, R3, sig, f));
  label('Bedienpult Rittal CP (Taster anklickbar)', kopf, 0, 215, 0, 'klein');
}
// Vor-Ort-Steuerstellen (Rittal-Befehlsgerätegehäuse auf Ständer außerhalb der Schutzumhausung)
// k.ry: Drehung um die Hochachse (Front zeigt bei 0 nach +z)
// k.zeilen: Tasterzeilen [{ key, x, farbe, text, bmk }] – ohne Angabe eine Zeile LINKS / HALT / RECHTS.
//   Je weitere Zeile wird das Gehäuse 64 mm höher (Unterkante bleibt bei 1000 mm). k.W: Gehäusebreite (Standard 190).
// k.leitung === false: Leitung wird woanders verlegt; Rückgabe: Fußpunkt der Säule (Leitungsaustritt) in Anlagenkoordinaten
export function vorOrtStation(pos, bmk, k) {
  const g = new THREE.Group(); g.position.copy(pos); g.rotation.y = k.ry || 0; anlage.add(g);
  const W0 = (x, y, z) => V(x, y, z).applyAxisAngle(V(0, 1, 0), k.ry || 0).add(pos);   // lokal → anlage
  const zeilen = k.zeilen || [[
    { key: k.links, x: -60, farbe: 0x23a35a, text: '◀ LINKS', bmk: k.linksT },
    { key: k.halt, x: 0, farbe: 0xd42a1f, text: 'HALT', bmk: k.haltT },
    { key: k.rechts, x: 60, farbe: 0x23a35a, text: 'RECHTS ▶', bmk: k.rechtsT },
  ]];
  const W = k.W || 190, H = 330 + (zeilen.length - 1) * 64, YM = 1000 + H / 2;
  profil(45, 45, 990, 'y', 0, 505, 0, g);
  box(160, 10, 160, M.anthrazit, 0, 5, 0, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) zyl(6, 4, M.stahl, sx * 60, 12, sz * 60, null, g, 6);
  box(W, H, 95, M.rittal, 0, YM, 50, g);
  box(60, 40, 10, M.anthrazit, 0, 1000, 20, g);
  zyl(9, 14, M.kunststoff, 0, 993, 75, null, g, 16);
  const f = new THREE.Group(); f.position.set(0, YM, 98); g.add(f);                   // Frontplatte 0,5 mm vor dem Gehäuse
  const zy = (i) => H / 2 - 143 - i * 64;                                         // Tastermitte der Zeile i
  platte(tafel('vorOrt_' + bmk, W, H, (c) => {
    c.fillStyle = '#d2d4cf'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#e9eaea'; c.fillRect(8, 8, W - 16, H - 16);
    const T = (t, x, y, sz = 10, gw = 600) => tafelText(c, t, x + W / 2, H / 2 - y, sz, gw);
    T(tr('VOR-ORT') + '  −' + bmk, 0, H / 2 - 20, 12, 700);
    T('0         1', -45, H / 2 - 37, 9.5); T(tr('Schlüssel') + ' −' + k.saT, -45, H / 2 - 97, 8.5, 500); T(tr('aktiv') + ' −' + k.pfT, 45, H / 2 - 97, 8.5, 500);
    zeilen.forEach((z, i) => z.forEach((t) => { T(tr(t.text), t.x, zy(i) - 28, 8.5); T('−' + t.bmk, t.x, zy(i) - 39, 8, 500); }));
    T(tr('NOT-HALT') + ' −' + k.nhT, -40, -H / 2 + 22, 8.5); T(tr('QUITT.') + ' −' + k.qT, 55, -H / 2 + 47, 8.5); T(tr('Rückstellen'), 55, -H / 2 + 36, 7.5, 500);
  }, 4), W, H, f, 0, 0, 0);
  wahlschalter(f, -45, H / 2 - 67, k.sa, true);
  meldeleuchte(f, 45, H / 2 - 67, k.pf, 0xf4f7fb);
  zeilen.forEach((z, i) => z.forEach((t) => drucktaster(f, t.x, zy(i), t.key, t.farbe, t.sym || '-')));
  notHaltTaster(f, -40, -H / 2 + 77, k.nh);
  const q = drucktaster(f, 55, -H / 2 + 77, k.q, 0x3d8de0);               // Leuchttaster mit eigenem Ausgang k.pfQ
  PULT_LAMPEN.push({ signal: k.pfQ, mat: q });
  label('Vor-Ort-Steuerstelle −' + bmk, g, 0, 1000 + H + 40, 50, 'klein');
  // Leitung: unter dem Gehäuse in die Säule, am Fuß heraus und am Boden zum Schaltschrank
  const fuss = W0(0, 14, -26), zBoden = fuss.z;
  if (k.leitung !== false) kabel([W0(0, 986, 75), W0(0, 945, 75), W0(0, 945, -26), fuss, V(-1220 + k.dx, 14, zBoden), V(-1220 + k.dx, 14, -60)], anlage, M.kabelGrau, 3.5);
  else kabel([W0(0, 986, 75), W0(0, 945, 75), W0(0, 945, -26), fuss], anlage, M.kabelGrau, 3.5);
  return fuss;
}
// −S10 hinten am Bandanfang beim Antrieb −MA1 (außerhalb der Umhausung), Front nach hinten zum Werker
const VORORT = new THREE.Vector3(420, 0, -1080);
vorOrtStation(VORORT, 'S10', { ry: Math.PI, sa: 'sa2', saT: 'SA2', pf: 'PF6_VorOrt', pfT: 'PF6', links: 'sf6', linksT: 'SF6', halt: 'sf7', haltT: 'SF7', rechts: 'sf5', rechtsT: 'SF5', nh: 'sf8', nhT: 'SF8', q: 'sf41', qT: 'SF41', pfQ: 'PF12_Quitt_S10', dx: 0 });
vorOrtStation(new THREE.Vector3(2420, 0, 1980), 'S20', { sa: 'sa4', saT: 'SA4', pf: 'PF8_VorOrt2', pfT: 'PF8', links: 'sf24', linksT: 'SF24', halt: 'sf25', haltT: 'SF25', rechts: 'sf23', rechtsT: 'SF23', nh: 'sf9', nhT: 'SF9', q: 'sf42', qT: 'SF42', pfQ: 'PF13_Quitt_S20', dx: 6 });
vorOrtStation(new THREE.Vector3(-480, 0, 1760), 'S30', { sa: 'sa5', saT: 'SA5', pf: 'PF9_VorOrt3', pfT: 'PF9', links: 'sf31', linksT: 'SF31', halt: 'sf32', haltT: 'SF32', rechts: 'sf30', rechtsT: 'SF30', nh: 'sf10', nhT: 'SF10', q: 'sf43', qT: 'SF43', pfQ: 'PF14_Quitt_S30', dx: 12 });
// −S40 an der Entleer- und Prüfstation: Bedienerseite (+z) zwischen Kipper und Ausschussbehälter, Blick auf Mulde, Rinne und Prüfband.
// Leitung über den Kabelkanal der Prüfstation (pruefstation-peripherie.js)
export const S40_POS = new THREE.Vector3(3480, 0, 2000);
export const S40_FUSS = vorOrtStation(S40_POS, 'S40', {
  sa: 'sa6', saT: 'SA6', pf: 'PF11_VorOrt4', pfT: 'PF11', nh: 'sf33', nhT: 'SF33', q: 'sf44', qT: 'SF44', pfQ: 'PF15_Quitt_S40', leitung: false, W: 210,
  zeilen: [
    [{ key: 'sf34', x: -50, farbe: 0x23a35a, sym: '|', text: 'PRÜFUNG EIN', bmk: 'SF34' }, { key: 'sf35', x: 50, farbe: 0xd42a1f, text: 'PRÜFUNG AUS', bmk: 'SF35' }],
    [{ key: 'sf37', x: -50, farbe: 0x23a35a, text: '◀ MULDE ZURÜCK', bmk: 'SF37' }, { key: 'sf36', x: 50, farbe: 0x23a35a, text: 'MULDE VOR ▶', bmk: 'SF36' }],
    [{ key: 'sf38', x: -50, farbe: 0xf4f6f8, sym: '|', text: 'KIPPEN', bmk: 'SF38' }, { key: 'sf39', x: 50, farbe: 0x2b2f34, sym: '|', text: 'KIPPER ZURÜCK', bmk: 'SF39' }],
  ],
});
