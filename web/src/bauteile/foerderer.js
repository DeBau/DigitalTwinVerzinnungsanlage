import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { canvasTextur } from '../core/texturen.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { M } from '../core/materialien.js';
import { abnutzen } from '../core/gebrauch.js';
import { V, box, cached, mesh, zyl } from '../core/geometrie.js';
import { label, platte, tafel } from '../core/beschriftung.js';
import { profil, stellfuss } from './aluprofil.js';
import { BAND_Y, TROMMEL_R } from '../anlage/baender.js';

const fuehrungMat = abnutzen(M.edelstahl.clone(), 'schiene');          // Seitenführung mit Schleifspuren der Körbe

// Generischer Gurtbandförderer in lokalen Koordinaten: Förderrichtung +z, Mitte z = 0, Breite x ±110
// Gurt: Flachdrahtgurt Edelstahl 1.4301 (Teilung 12,7 mm, Flachband 1,4 x 8 mm, Querstäbe Ø 2,4 mm, verschweißte Ränder),
// hitzebeständig für heiße Körbe. Antrieb über Kettenräder auf der Antriebswelle (Formschluss in den Gurtmaschen),
// Umlenkung über glatte Umlenkwalze mit Spindelspanner. Der Gurt ist eine geschlossene Schleife: Obertrum auf Gleitleisten,
// tangential in den Halbkreis um Kettenräder/Walze, Untertrum auf Stützrollen zurück.
export const GURT = { t: 8, teilung: 25.4, quer: 14 };              // Gurtdicke, Texturperiode längs (2 Teilungen), quer (Masche)
const TEX_DRAHT = canvasTextur(128, 232, (g, w, h) => {                // Draufsicht 14 x 25,4 mm (weiß = Draht, Lücken per Alpha-Test)
  const px = w / GURT.quer, py = h / GURT.teilung;
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff';
  for (const v of [0, 12.7]) { g.fillRect(0, (v - 1.2) * py, w, 2.4 * py); if (v === 0) g.fillRect(0, h - 1.2 * py, w, 1.2 * py); }   // Querstäbe
  g.fillRect(0, 0, 1.4 * px, 12.7 * py); g.fillRect(w - 0.2 * px, 0, 0.2 * px, 12.7 * py);                                           // Flachband Reihe 1
  g.fillRect(0.9 * px, 12.7 * py, 1.4 * px, 12.7 * py);                                                                              // Reihe 2 (verschachtelt)
}, true);
// Gurtschleife als Band mit Ober-/Unterseite und geschlossenen Rändern; v-Koordinate = Laufweg / Texturperiode
function gurtGeometrie(TZ, yT, Rm, W, t) {
  const pfad = [];                                                     // [y, z, ny, nz, s]
  let s = 0;
  const add = (y, z, ny, nz) => { if (pfad.length) { const p = pfad[pfad.length - 1]; s += Math.hypot(y - p[0], z - p[1]); } pfad.push([y, z, ny, nz, s]); };
  const nb = 18;
  add(yT + Rm, -TZ, 1, 0);
  for (let i = 0; i <= nb; i++) { const a = i / nb * Math.PI; add(yT + Rm * Math.cos(a), TZ + Rm * Math.sin(a), Math.cos(a), Math.sin(a)); }
  for (let i = 0; i <= nb; i++) { const a = Math.PI + i / nb * Math.PI; add(yT + Rm * Math.cos(a), -TZ + Rm * Math.sin(a), Math.cos(a), Math.sin(a)); }
  const pos = [], uv = [], idx = [];
  const lage = (p, d) => [p[0] + p[2] * d, p[1] + p[3] * d];
  // Flächen: außen (+t/2), innen (−t/2); Ränder bei x = ±W/2
  const flaeche = (d, aussen) => {
    const b = pos.length / 3;
    for (const p of pfad) { const [y, z] = lage(p, d); for (const x of [-W / 2, W / 2]) { pos.push(x, y, z); uv.push(x / GURT.quer, p[4] / GURT.teilung); } }
    for (let i = 0; i < pfad.length - 1; i++) { const a = b + 2 * i; aussen ? idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3) : idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  };
  flaeche(t / 2, true); flaeche(-t / 2, false);
  const rand = (x) => {
    const b = pos.length / 3;
    for (const p of pfad) for (const d of [-t / 2, t / 2]) { const [y, z] = lage(p, d); pos.push(x, y, z); uv.push(1 / GURT.quer, p[4] / GURT.teilung); }
    for (let i = 0; i < pfad.length - 1; i++) { const a = b + 2 * i; x > 0 ? idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3) : idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  };
  rand(-W / 2); rand(W / 2);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  return geo;
}
// Kettenrad (Zahnrad für Flachdrahtgurt), Achse x, Fußkreis rf, Kopfkreis rk
const kettenrad = (rk) => cached('kettenrad' + rk, () => {
  const n = 16, s = new THREE.Shape(), rf = rk - 4;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, d = Math.PI / n;
    const p = [[rf, a - d * 0.9], [rk, a - d * 0.35], [rk, a + d * 0.35], [rf, a + d * 0.9]];
    p.forEach(([r, w], j) => (i === 0 && j === 0 ? s.moveTo(r * Math.cos(w), r * Math.sin(w)) : s.lineTo(r * Math.cos(w), r * Math.sin(w))));
  }
  s.closePath();
  s.holes.push(new THREE.Path().absarc(0, 0, 10, 0, Math.PI * 2, true));
  const g = new THREE.ExtrudeGeometry(s, { depth: 8, bevelEnabled: false });
  g.translate(0, 0, -4); g.rotateY(Math.PI / 2);
  return g;
});
export function gurtband(parent, L, opt) {
  const H = L / 2, TZ = H - 30, yT = BAND_Y - 3 - TROMMEL_R;
  const t = GURT.t, rk = BAND_Y - t - yT, Rm = rk + t / 2;               // Kettenrad-/Walzenradius: Obertrum-Oberkante bleibt bei BAND_Y
  const r = { L, H, TZ, trommeln: [], teilung: GURT.teilung };
  for (const sx of [-1, 1]) profil(45, 90, L, 'z', sx * 110, BAND_Y - 50, 0, parent);
  for (const z of opt.beine) {
    for (const sx of [-1, 1]) { profil(45, 45, BAND_Y - 95 - 52, 'y', sx * 110, (BAND_Y - 95 + 52) / 2, z, parent); stellfuss(sx * 110, z, parent); }
    profil(45, 45, 175, 'x', 0, 120, z, parent);
  }
  for (const x of [-62, 0, 62]) box(12, 4, L - 2 * TROMMEL_R - 60, M.edelstahl, x, BAND_Y - t - 2.6, 0, parent);   // Gleitleisten (Flachstahl), 0,6 mm unter der Gurtunterseite (sonst Flackern durch die Gurtmaschen)
  for (const z of [-H * 0.6, 0, H * 0.6]) box(176, 4, 30, M.edelstahl, 0, BAND_Y - t - 6, z, parent);            // Quertraversen
  // Drahtgurt (beide Bänder; opt.draht = false gäbe es nicht mehr): eine Schleife, ein Material je Band
  const tex = TEX_DRAHT.clone(); tex.needsUpdate = true;
  const m = new THREE.MeshStandardMaterial({ color: 0xc4cad0, metalness: 0.85, roughness: 0.35, alphaMap: tex, alphaTest: 0.5, side: THREE.DoubleSide });
  const gurt = new THREE.Mesh(gurtGeometrie(TZ, yT, Rm, 170, t), m);
  gurt.castShadow = true; gurt.receiveShadow = true; parent.add(gurt);
  r.gurtMat = m; r.matOben = r.matUnten = m;
  for (const s of [-1, 1]) {
    const tr = new THREE.Group(); tr.position.set(0, yT, s * TZ); parent.add(tr);
    const lang = (s > 0 ? opt.welleKopf : opt.welleEnde) || 0;          // Wellenverlängerung für Antrieb/Geber (Seite ±1)
    zyl(10, 300 + Math.abs(lang) * 30, M.stahl, lang * 15, 0, 0, 'x', tr, 16);
    if (lang > 0) {                                                      // Antriebswelle: 4 Kettenräder mit Stellringen
      for (const x of [-66, -22, 22, 66]) {
        mesh(kettenrad(rk), M.edelstahl, tr).position.x = x;
        for (const dx of [-6, 6]) zyl(15, 4, M.stahl, x + dx, 0, 0, 'x', tr, 16);
      }
      for (let i = 0; i < 3; i++) { const b = box(2, 4, 6, M.schwarz, 85, Math.cos(i * 2.1) * 14, Math.sin(i * 2.1) * 14, tr); b.rotation.x = -i * 2.1; }
    } else {                                                             // Umlenkwalze (Edelstahlrohr mit Stirnscheiben)
      zyl(rk - 0.5, 168, M.edelstahl, 0, 0, 0, 'x', tr, 32);
      for (const sx of [-1, 1]) zyl(rk - 4, 3, M.stahl, sx * 85.5, 0, 0, 'x', tr, 24);
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; for (const sx of [-1, 1]) { const b = box(2, 5, 12, M.schwarz, sx * 87.5, Math.cos(a) * 16, Math.sin(a) * 16, tr); b.rotation.x = -a; } }
      for (const sx of [-1, 1]) {                                        // Spindelspanner: Spindel vom Lagerschlitten zum Spannwinkel am Profilende
        zyl(5, 40, M.stahl, sx * 138, yT, s * (TZ + 40), 'z', parent, 12);
        box(50, 44, 8, M.anthrazit, sx * 120, yT, s * (H + 6), parent);
        for (const zz of [TZ + 24, H + 13]) zyl(7, 6, M.stahl, sx * 138, yT, s * zz, 'z', parent, 6);
      }
    }
    r.trommeln.push(tr);
    for (const sx of [-1, 1]) {                                          // Flanschlager (2-Loch) auf der Profilaußenseite
      box(10, 70, 40, M.anthrazit, sx * 138, yT, s * TZ, parent);
      zyl(17, 16, M.anthrazit, sx * 151, yT, s * TZ, 'x', parent, 24);
      for (const dy of [-25, 25]) zyl(4.5, 4, M.stahl, sx * 145, yT + dy, s * TZ, 'x', parent, 6);
    }
  }
  for (const z of opt.stuetzrollen) {                                    // Stützrollen Untertrum
    zyl(15, 172, M.edelstahl, 0, BAND_Y - 2 * TROMMEL_R - 22, z, 'x', parent);
    for (const sx of [-1, 1]) box(4, 60, 24, M.anthrazit, sx * 134.5, BAND_Y - 2 * TROMMEL_R + 2, z, parent);
    zyl(5, 270, M.stahl, 0, BAND_Y - 2 * TROMMEL_R - 22, z, 'x', parent, 12);
  }
  for (const sx of [-1, 1]) {                                            // Seitenführungen an Haltern
    for (const [a, b] of opt.fuehrung) box(4, 22, b - a, fuehrungMat, sx * 70, BAND_Y + 32, (a + b) / 2, parent);
    for (const z of opt.halter) {                                        // Abstandshalter: Winkel, Platte, Stift, Stange, Hülse
      box(4, 80, 30, M.anthrazit, sx * 134.5, BAND_Y + 2, z, parent);
      box(32, 4, 30, M.anthrazit, sx * 121.5, BAND_Y + 44, z, parent);    // Platte steht 1 mm über den Winkel
      zyl(5, 26, M.stahl, sx * 120, BAND_Y + 29, z, null, parent, 12);     // Stift endet unter der Platte
      zyl(5, 44, M.stahl, sx * 98, BAND_Y + 32, z, 'x', parent, 12);       // Stange endet in der Hülse
      zyl(8, 10, M.kunststoff, sx * 77, BAND_Y + 32, z, 'x', parent, 16);
      for (const dy of [-22, 22]) zyl(5, 3, M.schwarz, sx * 138, BAND_Y + dy - 10, z, 'x', parent, 6);
    }
  }
  return r;
}
const SEW_LACK = new THREE.MeshStandardMaterial({ color: 0x55616b, roughness: 0.5, metalness: 0.1 });   // RAL 7031 blaugrau
const SEW_GITTER = new THREE.MeshStandardMaterial({ roughness: 0.6, alphaTest: 0.5, color: 0x55616b, side: THREE.DoubleSide, alphaMap: canvasTextur(128, 128, (g) => {
  g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#000';
  for (let r = 20; r < 60; r += 9) { g.beginPath(); g.arc(64, 64, r + 4, 0, 7); g.arc(64, 64, r, 0, 7, true); g.fill(); }
  g.fillStyle = '#fff'; for (let i = 0; i < 8; i++) { g.save(); g.translate(64, 64); g.rotate(i * Math.PI / 4); g.fillRect(-2, 0, 4, 64); g.restore(); }
}) });
// Aufsteckgetriebemotor an einer Trommel: seite = Profilseite (±1), Motor liegt parallel zum Band Richtung Bandmitte
export function getriebemotor(parent, z, seite, text) {
  const gm = new THREE.Group(); gm.position.set(seite * 160, BAND_Y - 3 - TROMMEL_R, z); parent.add(gm);
  const inn = new THREE.Group(); gm.add(inn);
  inn.scale.set(seite, 1, z > 0 ? 1 : -1);                             // Grundform: außen +x, Motor Richtung −z
  const lesbar = inn.scale.x * inn.scale.z > 0;
  // SEW-EURODRIVE Flachgetriebemotor FA27 DRN71 (Aufsteckausführung, Hohlwelle mit Schutzhaube), Lack RAL 7031
  const sew = SEW_LACK;
  mesh(cached('sewFA', () => new RoundedBoxGeometry(70, 124, 116, 2, 9)), sew, inn).position.set(35, 2, 0);   // Getriebegehäuse
  mesh(cached('sewFA2', () => new RoundedBoxGeometry(64, 70, 70, 2, 8)), sew, inn).position.set(37, 30, -80);  // Vorstufe / Motoradapter
  zyl(30, 8, sew, 74, 0, 0, 'x', inn, 28);                                // Lagerdeckel Abtrieb
  zyl(24, 12, sew, 82, 0, 0, 'x', inn, 24);                               // Schutzhaube Hohlwelle
  for (const [y, z] of [[52, 46], [52, -46], [-48, 46], [-48, -46]]) zyl(4.5, 3, M.stahl, 71, y, z, 'x', inn, 6);   // Gehäuseschrauben
  zyl(4, 6, M.messing, 35, 66, 30, null, inn, 6);                          // Entlüftungsventil
  zyl(46, 150, sew, 40, 30, -190, 'z', inn, 32);                          // Drehstrommotor DRN71
  for (let i = 0; i < 18; i++) {                                           // axiale Kühlrippen
    const a = i / 18 * Math.PI * 2;
    if (Math.abs(a - Math.PI / 2) < 0.4) continue;                         // oben: Klemmenkasten
    if (a < 0.4 || a > Math.PI * 2 - 0.4) continue;                         // außen: Typenschildsockel
    const f = box(3, 7, 136, sew, 40 + Math.cos(a) * 48, 30 + Math.sin(a) * 48, -190, inn); f.rotation.z = a - Math.PI / 2;
  }
  box(9, 36, 60, sew, 86.5, 30, -190, inn);                                // angegossener Sockel, glatte Fläche für das Typenschild
  zyl(50, 10, sew, 40, 30, -112, 'z', inn, 32);                            // A-Lagerschild
  zyl(50, 44, sew, 40, 30, -287, 'z', inn, 32);                            // Lüfterhaube
  zyl(45, 1, M.schwarz, 40, 30, -309.2, 'z', inn, 32);                    // dunkler Lüfterraum hinter dem Gitter
  const gitter = new THREE.Mesh(cached('sewGitterGeo', () => new THREE.CircleGeometry(46, 32)), SEW_GITTER);
  gitter.position.set(40, 30, -310.5); gitter.rotation.y = Math.PI; inn.add(gitter);
  box(58, 34, 66, sew, 40, 92, -175, inn);                                 // Klemmenkasten
  box(54, 4, 62, sew, 40, 111, -175, inn);                                 // Deckel
  for (const [dx, dz] of [[-23, -27], [23, -27], [-23, 27], [23, 27]]) zyl(2.4, 2, M.stahl, 40 + dx, 114, -175 + dz, null, inn, 6);
  zyl(9, 6, M.kunststoff, 40, 92, -210, 'z', inn, 6);                       // Kabelverschraubung M20
  zyl(7, 14, M.kunststoff, 40, 92, -218, 'z', inn, 12);
  box(12, 80, 20, M.stahl, 20, -90, 45, inn);                            // Drehmomentstütze (Gummipuffer)
  box(25, 12, 30, M.anthrazit, -12, -126, 45, inn);
  const schild = platte(tafel('motorSEW', 46, 28, (c) => {
    c.fillStyle = '#d8dbde'; c.fillRect(0, 0, 46, 28); c.fillStyle = '#c8102e'; c.font = '700 4px Arial'; c.fillText('SEW', 2, 5);
    c.fillStyle = '#222'; c.font = '600 2.6px Arial'; c.fillText('EURODRIVE', 11, 5);
    c.font = '600 3px Arial'; c.fillText('FA27 DRN71MS4', 2, 10); c.fillText('0,25 kW  S1  IE3', 2, 14.5); c.fillText('400 V Y  0,70 A  50 Hz', 2, 19); c.fillText('i = 40,5   na = 34 1/min', 2, 23.5);
  }, 8), 46, 28, inn, 91.4, 30, -190, Math.PI / 2);
  if (!lesbar) schild.scale.x = -1;                                        // gespiegelter Motor: Schrift trotzdem lesbar
  label(text, inn, 45, 140, -100, 'klein');
  parent.updateMatrixWorld(true);
  // Leitungsabgang: aus der Kabelverschraubung über der Lüfterhaube nach hinten, hinter dem Motor zum Boden
  const L = (x, y, z) => anlage.worldToLocal(inn.localToWorld(V(x, y, z)));
  const klemme = L(40, 92, -226), hinten = L(40, 92, -345);
  return { gm, klemme, abgang: [klemme, L(40, 92, -260), hinten, V(hinten.x, 14, hinten.z)] };
}
// Inkrementalgeber an einer Trommel (Wellenstummel auf Seite seite), Rückgabe: Steckerposition (Welt/anlage)
export function inkrementalgeber(parent, tr, seite, text) {
  // Kübler Sendix 5000 (Ø 58 mm, Klemmflansch, Welle Ø 10, radialer M12-Stecker) mit Federscheibenkupplung
  zyl(10, 30, M.stahl, seite * 160, 0, 0, 'x', tr, 16);
  zyl(12.5, 22, M.alu, seite * 168, 0, 0, 'x', tr, 20);                                    // Kupplung (dreht mit)
  for (const dx of [-5, 5]) zyl(12.8, 1.4, M.schwarz, seite * 168 + dx, 0, 0, 'x', tr, 20);
  for (const dx of [-8, 8]) zyl(2, 4, M.schwarz, seite * 168 + dx, 12.5, 0, null, tr, 6);  // Klemmschrauben
  const g = new THREE.Group(); g.position.copy(tr.position); parent.add(g);
  zyl(18, 4, M.alu, seite * 180, 0, 0, 'x', g, 24);                                       // Zentrierbund Ø 36
  zyl(29, 4, M.alu, seite * 184, 0, 0, 'x', g, 32);                                       // Klemmflansch
  zyl(28.5, 34, M.alu, seite * 203, 0, 0, 'x', g, 32);                                    // Gehäuse
  zyl(27, 3, M.anthrazit, seite * 221.5, 0, 0, 'x', g, 32);                               // Deckel
  zyl(9, 3, M.alu, seite * 200, 29.5, 0, null, g, 6);                                     // Steckersockel
  zyl(8, 7, M.stahl, seite * 200, 33.5, 0, null, g, 16);                                  // M12-Buchse
  platte(tafel('sendix', 36, 16, (c) => {
    c.fillStyle = '#e4e7ea'; c.fillRect(0, 0, 36, 16); c.fillStyle = '#004f9f'; c.font = '700 3.6px Arial'; c.fillText('KÜBLER', 2, 5);
    c.fillStyle = '#1b1f24'; c.font = '600 2.8px Arial'; c.fillText('Sendix 5000', 19.5, 5); c.font = '400 2.4px Arial';
    c.fillText('8.5000.8352.0010', 2, 9); c.fillText('10 Imp/U  ·  5…30 V DC  ·  HTL', 2, 12.5);
  }, 10), 36, 16, g, seite * 223.1, 0, 0, seite * Math.PI / 2);
  box(3, 70, 22, M.edelstahl, seite * 181, 20, 27, g);                                     // Statorwinkel
  box(28.5, 3, 22, M.edelstahl, seite * 165.25, 53, 27, g);                                // Schenkel stößt an den senkrechten
  label(text, g, seite * 200, 85, 0, 'klein');
  g.updateMatrixWorld(true);
  return anlage.worldToLocal(g.localToWorld(V(seite * 200, 37, 0)));
}

