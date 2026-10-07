import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { canvasTextur } from '../core/texturen.js';
import { cached, mesh, zyl } from '../core/geometrie.js';

// ----------------------------------------------------------------------------
// Umgebende Produktion (nur Kulisse, ohne Logik): Stanzerei, Bearbeitung, Montage, Lager, Versand, Hallenkran.
// Alles ruht und wirft keinen Schatten; beim Zusammenfassen werden die Teile zu wenigen Meshes.
// Maße in mm, Halle x −11 000 … 11 000, z −7 500 … 10 500. Die Anlage (x −1 500 … 5 000, z −1 200 … 3 000)
// und der Fahrweg davor (z 3 300 … 5 900) bleiben frei.
// ----------------------------------------------------------------------------
const KULISSE = new THREE.Group();
anlage.add(KULISSE);
// Einfacher Quader ohne gebrochene Kanten: Die Kulisse steht 5–10 m entfernt, Fasen wären dort nicht zu sehen
// und kosteten je Quader 108 statt 12 Dreiecke.
function box(w, h, d, mat, x, y, z, parent) {
  const m = mesh(cached(`k${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d)), mat, parent);
  m.position.set(x, y, z);
  return m;
}

const farbe = (color, roughness = 0.55, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const MAT = {
  regalBlau: farbe(0x1f4e8c, 0.5),       // RAL 5010
  traverse: farbe(0xd5602a, 0.5),        // RAL 2001
  holz: farbe(0xb08a5a, 0.85),
  karton: farbe(0xa98457, 0.9),
  kltBlau: farbe(0x2a5f97, 0.6),
  kltGrau: farbe(0x8d959b, 0.6),
  maschine: farbe(0xdfe3e2, 0.45),       // Maschinenverkleidung hellgrau
  fenster: farbe(0x1b2328, 0.15, 0.2),   // Sichtscheibe (dunkel, glänzend)
  coil: farbe(0xc9ced2, 0.25, 1),
  gruen: farbe(0x2e9a4a, 0.4),
  orange: farbe(0xee8a12, 0.4),
  esd: farbe(0x55606a, 0.7),             // ESD-Tischplatte
};
// Schutzzaun-Gitter und Gitterbox-Wände: Draht als Textur, Löcher per alphaTest (bleibt undurchsichtig, also zusammenfassbar)
const gitterTextur = (rgb) => canvasTextur(128, 128, (g, w, h) => {
  g.clearRect(0, 0, w, h); g.fillStyle = rgb;
  for (let i = 0; i < w; i += 16) { g.fillRect(i, 0, 3, h); g.fillRect(0, i, w, 3); }
}, true);
const ZAUN = new THREE.MeshStandardMaterial({ map: gitterTextur('#1c1f22'), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 });
const DRAHT = new THREE.MeshStandardMaterial({ map: gitterTextur('#b9c0c6'), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.8 });

// Gleiche Kulisse bei jedem Start (Prüfbilder, Doku): einfacher Zufallsgenerator mit festem Startwert
let saat = 7;
const zufall = () => (saat = (saat * 16807) % 2147483647) / 2147483647;

function flaeche(w, h, mat, x, y, z, ry, g) {
  const geo = new THREE.PlaneGeometry(w, h), uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 400, uv.getY(i) * h / 400);   // Drahtraster 50 mm
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true;
  g.add(m);
}

// ---------------------------------------------------------------- Ladegut
function europalette(g, x, y, z) {
  box(1200, 22, 800, MAT.holz, x, y + 133, z, g);
  for (const dz of [-350, 0, 350]) box(1200, 78, 100, MAT.holz, x, y + 83, z + dz, g);
  for (const dz of [-350, 0, 350]) box(1200, 22, 100, MAT.holz, x, y + 11, z + dz, g);
}
function gitterbox(g, x, y, z) {
  europalette(g, x, y, z);
  for (const [dx, dz] of [[-600, -400], [600, -400], [-600, 400], [600, 400]]) box(30, 830, 30, M.verzinkt, x + dx, y + 555, z + dz, g);
  for (const s of [-1, 1]) {
    flaeche(1200, 800, DRAHT, x, y + 555, z + s * 400, 0, g);
    flaeche(800, 800, DRAHT, x + s * 600, y + 555, z, Math.PI / 2, g);
  }
  box(1160, 300 + zufall() * 400, 760, MAT.karton, x, y + 300, z, g);       // Inhalt
}
function kartonpalette(g, x, y, z) {
  europalette(g, x, y, z);
  const lagen = 1 + Math.floor(zufall() * 3);
  for (let i = 0; i < lagen; i++) for (const dx of [-300, 300]) for (const dz of [-200, 200]) box(590, 390, 390, MAT.karton, x + dx, y + 150 + i * 400 + 195, z + dz, g);
}
function kltStapel(g, x, y, z, n, mat = MAT.kltBlau) {
  for (let i = 0; i < n; i++) box(600, 270, 400, mat, x, y + 140 + i * 280, z, g);
}

// ---------------------------------------------------------------- Lager
// Palettenregal: Felder à 2 700 mm, Ebenen à 1 500 mm, je Feld zwei Ladeplätze
function palettenregal(g, felder, ebenen) {
  const L = felder * 2700, H = ebenen * 1500 + 300;
  for (let i = 0; i <= felder; i++) {
    const x = -L / 2 + i * 2700;
    for (const dz of [-500, 500]) box(90, H, 70, MAT.regalBlau, x, H / 2, dz, g);
    for (let y = 300; y < H; y += 900) box(40, 40, 1000, MAT.regalBlau, x, y, 0, g);
  }
  for (let e = 0; e < ebenen; e++) {
    const y = e * 1500;                                                      // Ebene 0 steht auf dem Boden
    for (let i = 0; i < felder; i++) {
      const xm = -L / 2 + i * 2700 + 1350;
      if (e) for (const dz of [-500, 500]) box(2610, 110, 50, MAT.traverse, xm, y, dz, g);
      for (const dx of [-660, 660]) {
        const r = zufall();
        if (r < 0.45) gitterbox(g, xm + dx, y + 55, 0); else if (r < 0.85) kartonpalette(g, xm + dx, y + 55, 0);
      }
    }
  }
}
// Fachbodenregal mit Kleinladungsträgern
function fachbodenregal(g, laenge) {
  for (const x of [-laenge / 2, laenge / 2]) for (const dz of [-280, 280]) box(40, 2000, 40, M.verzinkt, x, 1000, dz, g);
  for (let y = 150; y < 2000; y += 450) {
    box(laenge, 25, 600, M.verzinkt, 0, y, 0, g);
    for (let x = -laenge / 2 + 350; x < laenge / 2 - 300; x += 650) if (zufall() < 0.8) kltStapel(g, x, y + 12, 0, 1, zufall() < 0.5 ? MAT.kltBlau : MAT.kltGrau);
  }
}

// ---------------------------------------------------------------- Maschinen
// Schutzzaun um x0 … x1, z0 … z1, vorn offen (Zugang)
function schutzzaun(g, x0, x1, z0, z1) {
  for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) box(60, 2200, 60, M.gelb, x, 1100, z, g);
  flaeche(x1 - x0, 1900, ZAUN, (x0 + x1) / 2, 1150, z0, 0, g);
  for (const x of [x0, x1]) flaeche(z1 - z0, 1900, ZAUN, x, 1150, (z0 + z1) / 2, Math.PI / 2, g);
}
// Stanzautomat mit Coil-Abwickler, Richtapparat, Schaltschrank und Gitterbox für die Stanzteile
function stanzautomat(g) {
  box(1800, 500, 1300, M.anthrazit, 0, 250, 0, g);                       // Unterbau
  box(1500, 1700, 1100, MAT.maschine, 0, 1350, 0, g);                    // Pressenkörper
  box(1700, 700, 1250, MAT.maschine, 0, 2550, 0, g);                     // Kopf
  zyl(450, 220, M.anthrazit, -950, 2550, 0, 'x', g);                     // Schwungrad
  box(1000, 700, 20, MAT.fenster, 0, 1300, 560, g);                      // Sichtfenster Werkzeugraum
  box(700, 2000, 500, M.rittal, 1300, 1000, -300, g);                    // Schaltschrank
  box(300, 400, 150, M.anthrazit, 900, 1450, 650, g);                    // Bedienteil
  box(600, 1100, 600, M.anthrazit, -2000, 550, 0, g);                    // Richtapparat
  box(400, 900, 800, M.anthrazit, -3000, 450, 0, g);                     // Abwickler-Ständer
  zyl(650, 300, MAT.coil, -3000, 1050, 0, 'z', g);                       // Coil
  gitterbox(g, 1500, 0, 1300);
  schutzzaun(g, -3800, 2400, -1700, 1700);
}
// Bearbeitungszentrum mit Späneförderer und Signalsäule
function cnc(g) {
  box(2600, 2300, 1900, MAT.maschine, 0, 1150, 0, g);
  box(1200, 1100, 20, MAT.fenster, -300, 1300, 960, g);                  // Tür mit Sichtscheibe
  box(2620, 250, 1920, M.anthrazit, 0, 2200, 0, g);                      // Dachblende
  box(500, 700, 120, M.anthrazit, 1150, 1450, 1050, g);                  // Bedienpult
  box(1600, 600, 500, M.anthrazit, 300, 300, -1200, g);                  // Späneförderer
  box(700, 700, 700, M.rittal, -1600, 350, -500, g);                     // Kühlschmierstoff
  for (const [i, m] of [M.rot, M.gelb, MAT.gruen].entries()) zyl(40, 90, m, 1200, 2400 + i * 95, 800, null, g);
}
// Montagearbeitsplatz: Tisch, Schubladenschrank, Aufbau mit Greifbehältern und Leuchte, Bildschirm
function werkbank(g) {
  box(1500, 40, 750, MAT.esd, 0, 880, 0, g);
  for (const dx of [-700, 700]) for (const dz of [-330, 330]) box(40, 860, 40, M.verzinkt, dx, 430, dz, g);
  box(500, 700, 650, MAT.kltBlau, 450, 450, 0, g);
  for (const dx of [-700, 700]) box(40, 1100, 40, M.verzinkt, dx, 1450, -330, g);
  box(1440, 40, 300, M.verzinkt, 0, 1450, -200, g);
  for (let x = -600; x <= 600; x += 200) box(180, 120, 240, x % 400 ? MAT.kltBlau : M.gelb, x, 1530, -200, g);
  box(1400, 50, 120, M.anthrazit, 0, 1950, -250, g);                     // Leuchte
  box(520, 330, 40, M.anthrazit, -350, 1150, -250, g);                   // Bildschirm
}
// Gabelstapler (abgestellt, Gabeln unten)
function stapler(g) {
  box(1100, 600, 2000, M.gelb, 0, 600, 0, g);
  box(1100, 700, 500, M.anthrazit, 0, 750, -1050, g);                    // Gegengewicht
  for (const [x, z] of [[-480, 600], [480, 600], [-480, -650], [480, -650]]) zyl(280, 220, M.kunststoff, x, 280, z, 'x', g);
  for (const [x, z] of [[-480, 500], [480, 500], [-480, -800], [480, -800]]) box(60, 1400, 60, M.anthrazit, x, 1600, z, g);
  box(1100, 50, 1400, M.anthrazit, 0, 2320, -150, g);                    // Fahrerschutzdach
  for (const x of [-350, 350]) box(90, 2400, 120, M.anthrazit, x, 1200, 1150, g);
  for (const x of [-250, 250]) box(120, 45, 1150, M.anthrazit, x, 30, 1700, g);
  box(500, 500, 450, M.kunststoff, 0, 1150, -350, g);                    // Sitz
}
function stretchwickler(g) {
  zyl(900, 80, M.anthrazit, 0, 40, 0, null, g);
  box(250, 2600, 250, M.anthrazit, 0, 1300, -1150, g);
  box(400, 500, 300, MAT.maschine, 0, 1100, -950, g);
  kartonpalette(g, 0, 80, 0);
}

// ---------------------------------------------------------------- Halle: Kran, Lüftung, Markierung
function hallenkran() {
  for (const z of [-6850, 9850]) box(22000, 500, 300, M.anthrazit, 0, 6200, z, KULISSE);   // Kranbahnträger
  const x = -5200;
  box(500, 800, 16700, M.gelb, x, 6650, 1500, KULISSE);                   // Brücke
  for (const z of [-6850, 9850]) box(2600, 500, 400, M.gelb, x, 6650, z, KULISSE);           // Kopfträger
  box(1000, 700, 1000, M.anthrazit, x, 6200, -2000, KULISSE);             // Laufkatze
  zyl(10, 2600, M.stahl, x, 4600, -2000, null, KULISSE);
  box(150, 250, 60, M.gelb, x, 3250, -2000, KULISSE);                     // Hakenflasche
}
function lueftung() {
  zyl(350, 22000, M.verzinkt, 0, 7300, -3200, 'x', KULISSE, 16);
  for (let x = -9000; x <= 9000; x += 4500) zyl(250, 400, M.verzinkt, x, 6900, -3200, null, KULISSE, 16);
}
function markierung(x0, z0, x1, z1) {
  for (const [w, d, x, z] of [[x1 - x0, 80, (x0 + x1) / 2, z0], [x1 - x0, 80, (x0 + x1) / 2, z1], [80, z1 - z0, x0, (z0 + z1) / 2], [80, z1 - z0, x1, (z0 + z1) / 2]]) {
    box(w, 1, d, M.gelb, x, 0.6, z, KULISSE);
  }
}

// ---------------------------------------------------------------- Aufstellung
const FUNKTION = { palettenregal, fachbodenregal, stanzautomat, cnc, werkbank, stapler, stretchwickler, gitterbox, kartonpalette };
const AUFSTELLUNG = [
  // [Bauteil, x, z, Drehung (×90°), Zusatzwerte]
  ['palettenregal', -8000, -6400, 0, [2, 3]],
  ['stanzautomat', -1200, -5000, 0],
  ['stanzautomat', 5400, -5000, 0],
  ['cnc', 9600, -4600, -1],
  ['cnc', 9600, -1400, -1],
  ['fachbodenregal', -10450, 300, 1, [3900]],
  ['werkbank', -8000, -1600, 0], ['werkbank', -6200, -1600, 0], ['werkbank', -4400, -1600, 0],
  ['gitterbox', -7000, 800, 0], ['gitterbox', -5600, 800, 0],
  ['stretchwickler', 9300, 1900, 0],
  ['kartonpalette', 7600, 1300, 0], ['kartonpalette', 7600, 2500, 0],
  ['stapler', 6800, 7800, 2],
  ['palettenregal', -4000, 9300, 2, [3, 3]],
  ['gitterbox', 3200, 8500, 0], ['gitterbox', 4600, 8500, 0], ['kartonpalette', 3200, 9600, 0],
];
for (const [name, x, z, viertel, werte = []] of AUFSTELLUNG) {
  const g = new THREE.Group();
  g.position.set(x, 0, z); g.rotation.y = viertel * Math.PI / 2;
  KULISSE.add(g);
  FUNKTION[name](g, ...(werte.length ? werte : [0, 0, 0]));
}
hallenkran();
lueftung();
markierung(-10800, -2700, -3300, 1700);     // Montage
markierung(6400, 700, 10200, 3000);         // Versand
KULISSE.traverse((o) => { if (o.isMesh) o.castShadow = false; });
