import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { V, box, zyl } from '../core/geometrie.js';
import { label, platte, tafel } from '../core/beschriftung.js';
import { SENSOREN } from './register.js';
import { sensorLed } from '../core/leds.js';
import { drosselVentil, steckverschraubung } from '../bauteile/zylinder.js';
import { schlauch } from '../bauteile/leitungen.js';
import { B1, BAND, BAND_Y, LS_POS, STOPPER } from './baender.js';
import { getriebemotor, gurtband, inkrementalgeber } from '../bauteile/foerderer.js';
import { lichtschranke } from '../bauteile/lichtschranke.js';

// --- Band 1 ---
const b1g = new THREE.Group(); b1g.position.z = B1.zm; anlage.add(b1g);
const B1z = (z) => z - B1.zm;                                          // Welt-z → lokal
{
  const r = gurtband(b1g, B1.L, {
    beine: [-700, 0, 700, 900].map(B1z), stuetzrollen: [-400, 400, 850].map(B1z),
    fuehrung: [[B1z(-790), B1z(B1.z1 + 15)]], halter: [-760, -380, 380, 760, 1050].map(B1z), welleKopf: -1, welleEnde: 1,   // letzter Halter hinter dem Winkel von −BG13
  });
  Object.assign(B1, r);
  BAND.trommeln = r.trommeln;
}
// Antrieb am Bandanfang (+x, Motor zur Bandmitte), Geber an der Kopftrommel (−x)
export const B1_MOTOR = getriebemotor(b1g, -B1.TZ, 1, 'Antrieb Band 1 −MA1');
BAND.geberStecker = inkrementalgeber(b1g, B1.trommeln[1], -1, '−BG18 Inkrementalgeber 10 Imp/U');

// Anschlag am Übergabeplatz und Vereinzeler: Schwenkhebel-Stopper seitlich (+x) über der Seitenführung.
// Drahtgurt → kein Hubstopper von unten durch den Gurt möglich. Der Hebel (Flachstahl 16 × 12) liegt in einer Ebene
// quer zum Band (Drehachse parallel zur Förderrichtung) und schwenkt zum Öffnen um 49° nach oben – er fährt dabei
// nie in einen Korb und greift beim Vereinzeler in die 40-mm-Lücke zwischen den Korbkörpern.
// Der Korb läuft mit der Stirnwand (Höhe 48…64 über dem Gurt) gegen eine gedämpfte Anschlagleiste (PE-UHMW auf
// Alu-Träger, zwei Führungsbolzen, Stoßdämpfer M12 × 1 wie Festo YSR-12 neben dem Korb, Resthub 3 mm bis zum Hebel).
// Antrieb: Kompaktzylinder Festo ADN-20-40 senkrecht auf der Konsole, Gabelkopf SG-M8 mit Bolzen in der Kulisse
// (Langloch) der Kurbel r = 35 – der Zylinder steht fest, Schläuche und Nutsensoren bleiben in Ruhe.
// Konsole (Alu 8 mm): Adapterplatte an der Profilnut (Nutensteine M6), Kopfplatte mit Lagerlaschen und Bolzen Ø10,
// Zylinderkonsole mit Rippe. Endlagen über Nutsensoren SMT-8M (Kolbenmagnet) in den Nuten der Zylinder-Außenseite.
// Lokale z: Anschlagfläche in Ruhe bei z = 0 (Welt za), Leiste 0…7, Hebel 10…22, Bolzenköpfe bis 25. Die Leiste sitzt auf den
// Führungsbolzen und wird vom Korb um den Resthub (STOPPER.HUB) gegen den Dämpfer gedrückt, die Muttern heben dabei vom Hebel ab.
// −MM5 hat zusätzlich die Abfrage −BG40: Schaltfahne (Stahl) auf dem Alu-Träger über den Hebel hinaus, davor ein induktiver
// Sensor M8 (bündig, sn 1,5 mm) im Winkel auf dem Hebel – meldet erst, wenn die Leiste eingedrückt ist (Korb liegt an).
const HEBEL = { x: 155, y: 356, r: 35, winkel: 48.8 * Math.PI / 180, zylX: 190, zm: 16 };   // Hub 40 = r · tan 48,8°
BAND.stopperStangen = []; BAND.stopperLeisten = []; BAND.stopperAnschluss = {};
function bandAnschlag(za, name, sigZu, sigOffen, txtZu, txtOffen, ventil, abfrage) {
  const H = HEBEL, zm = H.zm, xc = H.zylX;
  const fest = new THREE.Group(); fest.position.set(0, 0, za); anlage.add(fest);
  // Konsole (Alu eloxiert anthrazit)
  box(8, 144, 36, M.anthrazit, 136.5, 266, zm, fest);                                            // Adapterplatte an der Profilnut
  for (const y of [228, 272]) for (const dz of [-8, 8]) zyl(5, 4, M.schwarz, 142.5, y, zm + dz, 'x', fest, 6);
  box(9.5, 8, 36, M.anthrazit, 145.25, 334, zm, fest);                                            // Kopfplatte (stößt an die Adapterplatte)
  for (const dz of [-9, 9]) box(28, 40, 4, M.anthrazit, H.x, 352, zm + dz, fest);                 // Lagerlaschen
  zyl(5, 28, M.stahl, H.x, H.y, zm, 'z', fest, 12);                                               // Lagerbolzen Ø10
  for (const dz of [-14.5, 14.5]) zyl(8, 3, M.stahl, H.x, H.y, zm + dz, 'z', fest, 6);            // Kopf / Mutter
  box(65.5, 8, 36, M.anthrazit, 173.25, 198, zm, fest);                                           // Zylinderkonsole (stößt an die Adapterplatte)
  box(48, 18, 6, M.anthrazit, 164.5, 185, zm, fest);                                              // Rippe
  // Kompaktzylinder ADN-20-40 (Profil 36 × 36), Deckel Druckguss, Anschlüsse G1/8 mit QS-6 nach −z
  box(34, 66, 34, M.zylinder, xc, 240, zm, fest);
  for (const y of [206, 274]) box(36, 8, 36, M.deckel, xc, y, zm, fest);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) zyl(1.6, 1, M.schwarz, xc + sx * 13, 278.5, zm + sz * 13, null, fest, 6);
  zyl(7, 4, M.deckel, xc, 280, zm, null, fest, 16);                                              // Lagerbund
  for (const dz of [-10, 10]) box(0.8, 64, 3, M.schwarz, xc + 17.1, 240, zm + dz, fest);         // Sensornuten
  platte(tafel('adn20', 30, 9, (c) => { c.fillStyle = '#c4c9ce'; c.fillRect(0, 0, 30, 9); c.fillStyle = '#1d1f22'; c.font = '700 4px Arial'; c.fillText('FESTO', 1.5, 4); c.font = '500 2.6px Arial'; c.fillText('ADN-20-40-A-P-A', 1.5, 7.6); }, 10), 30, 9, fest, xc, 246, zm + 17.3, 0);
  // Anschlüsse mit Drosselrückschlagventilen (Abluftdrosselung), Steckanschluss nach −z
  const anschluss = [], kurz = name.match(/MM\d/)[0];
  for (const y of [214, 266]) {
    const p = new THREE.Group(); p.position.set(xc, y, zm - 18); p.rotation.x = -Math.PI / 2; fest.add(p);
    const oeffnung = drosselVentil(p, 0, 0, 0, 3.2, kurz);
    anschluss.push(V(xc, y, za + zm - 18 - oeffnung.y));
  }
  BAND.stopperAnschluss[ventil] = anschluss;                                                       // [Kolbenseite, Stangenseite]
  // Nutsensoren SMT-8M: „zu“ oben (Stange aus), „offen“ unten; Kabel in der Nut nach unten, an der Konsole vorbei
  [[sigZu, txtZu, 262, zm + 10], [sigOffen, txtOffen, 218, zm - 10]].forEach(([sig, txt, y, z]) => {
    box(2.6, 24.5, 4.6, M.kunststoff, xc + 18.4, y, z, fest);
    const mat = sensorLed(fest, xc + 20.3, y + 9, z, sig, 1.6, 3.4, 3);   // Schaltanzeige, steht über das Gehäuse hinaus
    zyl(1.1, 0.6, M.stahl, xc + 19.8, y - 9, z, 'x', fest, 6);
    schlauch([[xc + 18.6, y - 12.5, z], [xc + 19.5, y - 16, z], [xc + 19.5, 205, z], [xc + 19.5, 196, z]], M.kabelGrau, 1.6, fest, 24);
    SENSOREN.push({ signal: sig, mat, div: label(txt, fest, xc + 40, y, z, 'klein') });
    BAND.sensorAus[sig] = V(xc + 19.5, 196, za + z);
  });
  label(name, fest, 120, BAND_Y + 140, zm, 'cyl');
  // Kolbenstange mit Gabelkopf; der Bolzen läuft in der Kulisse der Kurbel (bewegt sich senkrecht)
  const stange = new THREE.Group(); fest.add(stange); BAND.stopperStangen.push(stange);
  zyl(4, 64, M.stahl, xc, 294, zm, null, stange, 16);
  zyl(6.5, 4, M.stahl, xc, 324, zm, null, stange, 6);                                            // Kontermutter
  box(16, 8, 26, M.stahl, xc, 330, zm, stange);                                                   // Gabelkopf SG-M8
  for (const dz of [-11, 11]) box(16, 30, 4, M.stahl, xc, 349, zm + dz, stange);
  zyl(4, 30, M.stahl, xc, H.y, zm, 'z', stange, 12);                                              // Bolzen Ø8
  for (const dz of [-14, 14]) zyl(5, 1, M.schwarz, xc, H.y, zm + dz, 'z', stange, 10);           // Sicherungsringe
  // Schwenkhebel (Drehpunkt im Ursprung): Arm nach −x über das Band, Kurbel mit Kulisse nach +x
  const hebel = new THREE.Group(); hebel.position.set(H.x, H.y, 0); fest.add(hebel);
  // (Teile stoßen aneinander statt sich zu überlappen; Nabe und Dämpferaufnahme stehen 1 mm über – keine gleichen Ebenen)
  box(195, 16, 12, M.verzinkt, -97.5, 0, zm, hebel);                                              // Arm (bis zur Kurbel)
  zyl(13, 14, M.verzinkt, 0, 0, zm, 'z', hebel, 24);                                              // Nabe
  box(24, 24, 12, M.verzinkt, 12, 0, zm, hebel);                                                  // Kurbel
  for (const sy of [-1, 1]) box(38, 7.5, 12, M.verzinkt, 43, sy * 8.25, zm, hebel);              // Kulisse (Langloch 9)
  box(6, 24, 12, M.verzinkt, 65, 0, zm, hebel);
  box(24, 24, 14, M.verzinkt, -91, 0, zm, hebel);                                                 // Aufnahme Stoßdämpfer
  // gedämpfte Anschlagleiste (eigene Gruppe: wird vom Korb eingedrückt)
  const leiste = new THREE.Group(); hebel.add(leiste); BAND.stopperLeisten.push(leiste);
  box(122, 16, 4, M.alu, -142, 0, 5, leiste);                                                     // Alu-Träger
  box(100, 16, 3, M.gelb, -150, 0, 1.5, leiste);                                                  // PE-UHMW-Leiste
  for (const x of [-185, -120]) { zyl(3, 20, M.stahl, x, 0, 13, 'z', leiste, 10); zyl(5, 3, M.stahl, x, 0, 23.5, 'z', leiste, 10); }   // Bolzen endet in der Mutter
  zyl(2, 4, M.stahl, -91, 0, 8.5, 'z', leiste, 8);                                                // Kolbenstange Dämpfer (liegt am Träger an)
  zyl(6, 34, M.schwarz, -91, 0, 39, 'z', hebel, 16);                                              // Dämpferkörper M12 × 1
  zyl(9, 4, M.stahl, -91, 0, 24, 'z', hebel, 6);                                                  // Kontermutter
  zyl(4, 3, M.messing, -91, 0, 57.5, 'z', hebel, 10);                                             // Stellschraube Dämpfung
  if (abfrage) {
    // Schaltfahne über dem Arm; Sensor M8 × 1 (Stirnfläche bei z = 11, Fahne in Ruhe 4 mm davor) im Haltewinkel auf dem Arm
    const xs = -150, ys = 22;
    box(14, 22, 2, M.stahl, xs, 19, 6, leiste);                                                   // Schaltfahne
    box(16, 3, 30, M.anthrazit, xs, 9.5, 27, hebel);                                              // Haltewinkel: Fuß auf dem Arm
    box(16, 22, 3, M.anthrazit, xs, 22, 21.5, hebel);                                             //   Schenkel mit Bohrung
    zyl(4, 30, M.stahl, xs, ys, 26, 'z', hebel, 12);                                              // Gewindehülse
    for (const z of [18.75, 24.25]) zyl(7, 2.5, M.stahl, xs, ys, z, 'z', hebel, 6);               // Muttern
    zyl(4.2, 8, M.kunststoff, xs, ys, 45, 'z', hebel, 12);                                        // Endkappe mit Kabelabgang
    const mat = sensorLed(hebel, xs, ys + 4.4, 45, abfrage.sig, 2.4, 1, 3);
    SENSOREN.push({ signal: abfrage.sig, mat, div: label(abfrage.txt, hebel, xs, 60, 30, 'klein') });
    // PUR-Leitung auf dem Arm zur Drehachse, im Bogen (R ≈ 16) senkrecht nach unten; auf der Achse geht sie in die feste
    // Verlegung über (die Achse bewegt sich nicht)
    schlauch([[xs, ys, 49], [xs, ys, 56], [-110, 20, 62], [-48, 20, 55], [-20, 20, 51], [-4, 13, 50], [0, 4, 50], [0, 0, 50]], M.kabelGrau, 2.4, hebel, 32);
    BAND.abfrageAus = V(H.x, H.y, za + 50);
  }
  hebel.userData.stellen = (pos) => {
    const w = H.winkel * pos;
    hebel.rotation.z = -w;                                                                        // Arm schwenkt nach oben
    stange.position.y = -H.r * Math.tan(w);                                                       // Bolzen folgt der Kulisse
  };
  hebel.userData.druecken = (d) => { leiste.position.z = d; };                                   // Leiste eingedrückt (mm)
  return hebel;
}
BAND.anschlag = bandAnschlag(STOPPER.MM5, '−MM5 Anschlag', 'BG14_MM5_zu', 'BG15_MM5_offen', '−BG14', '−BG15', 'MB9_Anschlag_auf',
  { sig: 'BG40_Korb_am_Anschlag', txt: '−BG40 Korb liegt an' });                                 // eingedrückt bei 55: Korb bei 0
BAND.vereinzeler = bandAnschlag(STOPPER.MM6, '−MM6 Vereinzeler', 'BG16_MM6_zu', 'BG17_MM6_offen', '−BG16', '−BG17', 'MB10_Vereinzeler_zu');   // eingedrückt bei −95: nächster Korb bei −150

// Lichtschranken (Sensor auf der Bedienerseite −x, Reflektor gegenüber); −BG13 kurz vor der Umlenktrommel, Haltewinkel vor dem Flanschlager
lichtschranke(LS_POS.BG11_Korb, 'BG11_Korb', '−BG11');
lichtschranke(LS_POS.BG12_Bandanfang, 'BG12_Bandanfang', '−BG12 Bandanfang');
lichtschranke(LS_POS.BG13_Bandende, 'BG13_Bandende', '−BG13 Band 1 Ende');
// Stirnanschlag am Bandanfang (das Bandende übergibt an die Rollenkurve)
for (const zs of [-801]) {
  const s = Math.sign(zs);
  box(150, 40, 6, M.edelstahl, 0, BAND_Y + 24, zs);
  for (const sx of [-1, 1]) { box(57.5, 10, 6, M.edelstahl, sx * 103.75, BAND_Y + 40, zs); box(4, 70, 30, M.anthrazit, sx * 134.5, BAND_Y + 10, zs - s * 6); }   // Lasche endet am Winkel
  box(146, 30, 4, new THREE.MeshStandardMaterial({ color: 0x2a2e33, roughness: 0.8 }), 0, BAND_Y + 24, zs - s * 4);
}
// Kabelkanal am Bandgestell (Bedienerseite −x), Abgang bei z = 1060 senkrecht in die Kabelbrücke.
// Oberkante 227,5: unter Flanschlager, Lagerschrauben und Geberwelle der Kopftrommel (Achse 261) hindurch.
export const KANAL1 = { y: 211, oben: 227.5, unten: 196 };
{
  const z0 = -790, z1 = 1070, L = z1 - z0;
  box(30, 30, L, M.pvc, -160, KANAL1.y, (z0 + z1) / 2);
  box(34, 3, L, M.pvcHell, -160, KANAL1.oben, (z0 + z1) / 2);
  for (const z of [-600, -250, 250, 600, 900]) box(24, 26, 6, M.anthrazit, -146, KANAL1.y, z);
}
// Ventilinsel Band −QM2 (2 x 5/2-Wegeventil monostabil) für Anschlag −MB9 und Vereinzeler −MB10
export const QM2 = { z: -220, leds: [] };
{
  // Zwei Einzelventile Festo VUVG-L14-M52 (5/2 monostabil, Breite 14 mm) auf Verteilerleiste mit Versorgung 1 unten,
  // Arbeitsanschlüsse 2/4 an der Ventilfront (QS-4), Spule mit LED und Beschriftungsschild, Ventilstecker M8 mit Kabel
  const g = new THREE.Group(); g.position.set(134.5, 250, QM2.z); anlage.add(g);
  box(4, 140, 110, M.verzinkt, 2, 0, 0, g);                                                   // Montageblech
  box(48, 20, 74, M.festoAlu, 33, -35, 0, g);                                                 // Verteilerleiste
  for (const dz of [-30, 30]) zyl(2.6, 1.5, M.stahl, 57.6, -35, dz, 'x', g, 6);
  const pv = new THREE.Group(); pv.position.set(51.5, -45, 0); pv.rotation.x = Math.PI; g.add(pv);
  steckverschraubung(pv, 0, 0, 0, 4.6);                                                      // Versorgung 1 von unten
  zyl(5, 14, M.kunststoff, 20, -32, 44, 'z', g, 10);                                          // Schalldämpfer 3/5
  box(30, 16, 46, M.kunststoff, 21.5, -53, 0, g);                                             // Multipol-Anschlussbox
  [['MB9_Anschlag_auf', -15], ['MB10_Vereinzeler_zu', 15]].forEach(([sig, dz]) => {
    box(26, 70, 14, M.festoAlu, 24, 10, dz, g);                                               // Ventilkörper
    box(28, 24, 14, M.kunststoff, 25, 57, dz, g);                                             // Spule
    zyl(2, 1.4, M.qsBlau, 37.6, 36, dz, 'x', g, 8);                                           // Handhilfsbetätigung
    zyl(3.4, 9, M.kunststoff, 25, 73.5, dz, null, g, 10);                                     // Ventilstecker M8
    schlauch([[25, 78, dz], [25, 86, dz], [10, 86, dz], [6, 70, dz], [6, -40, dz], [10, -45, dz * 0.6]], M.kabel, 1.6, g, 20);
    const m = sensorLed(g, 39.2, 64, dz, sig, 0.8, 3, 3.4); m.emissive.setHex(0xffb000);
    const bmk = sig === 'MB9_Anschlag_auf' ? '−MB9' : '−MB10';
    platte(tafel('spule2' + bmk, 12, 9, (cc) => { cc.fillStyle = '#f2f3f1'; cc.fillRect(0, 0, 12, 9); cc.fillStyle = '#111'; cc.textAlign = 'center'; cc.font = '700 3px Arial'; cc.fillText(bmk, 6, 4.4); cc.font = '400 2.2px Arial'; cc.fillText('VUVG-L14', 6, 7.6); }, 12), 12, 9, g, 39.2, 53, dz, Math.PI / 2);
    QM2.leds.push({ signal: sig, mat: m });
    label(sig === 'MB9_Anschlag_auf' ? '−MB9 (MM5)' : '−MB10 (MM6)', g, 40, 95, dz, 'klein');
    QM2[sig] = [-8, 8].map((dy) => { const p = new THREE.Group(); p.position.set(37, 15 + dy, dz); p.rotation.z = -Math.PI / 2; g.add(p); steckverschraubung(p, 0, 0, 0, 3.2); return V(134.5 + 52, 250 + 15 + dy, QM2.z + dz); });
  });
  label('Ventilinsel Band −QM2', g, 22, 130, 0, 'klein');
}

