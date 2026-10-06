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
// quer zum Band (Drehachse parallel zur Förderrichtung) und schwenkt zum Öffnen um 90° senkrecht nach oben. Dann steht er
// ganz neben dem Korb: An −MM5 kann der Korb angehoben und wieder abgesetzt werden, ohne dass die Puffer unten am Korb
// unter dem Hebel hängen bleiben. Der Vereinzelerhebel greift in die 50-mm-Lücke zwischen den Korbkörpern.
// Der Korb läuft mit der Stirnwand (Höhe 48…64 über dem Gurt) gegen eine feste Anschlagleiste (PE-UHMW auf Alu-Träger,
// versenkt verschraubt). Bei 0,1 m/s und rund 5 kg Korbmasse braucht es keinen Dämpfer.
// Antrieb: pneumatischer Schwenkantrieb 90° (Drehflügel, wie Festo DSM-16) vor dem Hebel auf einer Alu-Konsole an der
// Profilnut; seine Welle ist die Hebelachse (Klemmnabe). Endlagen über zwei induktive Sensoren M8 an einer Schaltnocke
// auf der Welle (Sensorhalter vorn am Antrieb, „zu“ bei +x, „offen“ bei −y) – sie fragen die Welle ab, nicht den Hebel.
// −MM5 hat zusätzlich −BG40: induktiver Sensor M12, bündig in der Anschlagleiste vor dem Eckstab des Korbs
// (Rundstahl Ø6 bei Welt x = +52), meldet, wenn der Korb anliegt.
// Lokale z: Anschlagfläche bei z = 0 (Welt za), PE 0…3, Alu-Träger 3…7, Arm 7…19, Nabe 4…20; Antrieb davor bei z −56…−10.
const H = { x: STOPPER.X, y: STOPPER.Y, zm: 13 };
BAND.stopperNocken = []; BAND.stopperAnschluss = {};
// versatz: Abgänge der Endlagenleitungen um so viel nach außen versetzt – je Antrieb eigene Lagen in der Kabelrinne
// darunter, die Leitungen fallen senkrecht hinein
function bandAnschlag(za, name, sigZu, sigOffen, txtZu, txtOffen, ventil, abfrage, versatz = 0) {
  const fest = new THREE.Group(); fest.position.set(0, 0, za); anlage.add(fest);
  const kurz = name.match(/MM\d/)[0];
  // Konsole (Alu eloxiert anthrazit): Adapterplatte an der Profilnut, Tragplatte unter dem Antrieb mit Rippe
  box(8, 132, 64, M.anthrazit, 136.5, 260, -24, fest);                                          // y 194…326, z −56…8
  for (const y of [222, 290]) for (const z of [-44, -4]) zyl(5, 4, M.schwarz, 142.5, y, z, 'x', fest, 6);
  box(42, 8, 46, M.anthrazit, 161.5, H.y - 26, -33, fest);                                     // Tragplatte x 140,5…182,5, y 326…334
  box(36, 30, 6, M.anthrazit, 158.5, H.y - 45, -33, fest);                                     // Rippe
  // Schwenkantrieb: Gehäuse mit Deckeln, Typschild, Welle Ø10 bis in die Klemmnabe des Hebels
  box(44, 44, 38, M.festoAlu, H.x, H.y, -33, fest);                                            // z −52…−14
  for (const z of [-54, -12]) box(46, 46, 4, M.deckel, H.x, H.y, z, fest);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) zyl(1.8, 1, M.schwarz, H.x + sx * 18, H.y + sy * 18, -56.5, 'z', fest, 6);
  zyl(5, 18, M.stahl, H.x, H.y, -1, 'z', fest, 12);                                            // Welle z −10…8
  zyl(4, 10, M.stahl, H.x, H.y, -61, 'z', fest, 12);                                           // Wellenende für die Schaltnocke
  platte(tafel('dsm16', 30, 9, (c) => { c.fillStyle = '#c4c9ce'; c.fillRect(0, 0, 30, 9); c.fillStyle = '#1d1f22'; c.font = '700 4px Arial'; c.fillText('FESTO', 1.5, 4); c.font = '500 2.6px Arial'; c.fillText('DSM-16-90-P-A-B', 1.5, 7.6); }, 10), 30, 9, fest, H.x + 22.3, H.y, -33, Math.PI / 2);
  // Anschlüsse vorn (oben) mit Drosselrückschlagventilen (Abluftdrosselung), Steckanschluss nach −z
  const anschluss = [];
  for (const dx of [-14, 8]) {
    const p = new THREE.Group(); p.position.set(H.x + dx, H.y + 14, -56); p.rotation.x = -Math.PI / 2; fest.add(p);
    const oeffnung = drosselVentil(p, 0, 0, 0, 3.2, kurz);
    anschluss.push(V(H.x + dx, H.y + 14, za - 56 - oeffnung.y));
  }
  BAND.stopperAnschluss[ventil] = anschluss;
  // Schaltnocke auf der Welle (dreht mit dem Antrieb) und Sensorhalter mit den Endlagensensoren M8
  const nocke = new THREE.Group(); nocke.position.set(H.x, H.y, -62); fest.add(nocke); BAND.stopperNocken.push(nocke);
  zyl(12, 3, M.stahl, 0, 0, 0, 'z', nocke, 20);
  box(10, 7, 3, M.stahl, 16, 0, 0, nocke);                                                     // Nocke bis r = 21
  box(58, 58, 3, M.anthrazit, H.x + 27, H.y - 27, -66.5, fest);                                // Sensorhalter
  [[sigZu, txtZu, 1, 0], [sigOffen, txtOffen, 0, -1]].forEach(([sig, txt, rx, ry]) => {
    const P = (r) => [H.x + rx * r, H.y + ry * r, -61.5], achse = rx ? 'x' : null;
    zyl(4, 30, M.stahl, ...P(37), achse, fest, 12);                                            // Gewindehülse M8, Stirnfläche bei r = 22
    zyl(6.5, 2.5, M.stahl, ...P(30), achse, fest, 6);                                          // Mutter
    zyl(4.2, 6, M.kunststoff, ...P(55), achse, fest, 12);                                      // Endkappe mit Kabelabgang
    const [lx, ly] = P(55);
    const mat = sensorLed(fest, lx + (rx ? 0 : 4.4), ly + (rx ? 4.4 : 0), -61.5, sig, rx ? 2.4 : 1, rx ? 1 : 2.4, 3);
    SENSOREN.push({ signal: sig, mat, div: label(txt, fest, lx + 25, ly - (rx ? 0 : 20), -61.5, 'klein') });
    // Leitung an der Konsole vorbei nach unten (dort übernimmt die Verdrahtung)
    // beide Leitungen eines Antriebs unter der Konsole nebeneinander (6 mm), die von −MM5 12 mm weiter außen: jede
    // fällt senkrecht in ihre eigene Lage der Kabelrinne. „zu“ läuft dazu unter dem eigenen Sensor zurück nach innen.
    const xa = (rx ? H.x + 6 : H.x) + versatz;
    const weg = rx ? [[H.x + 58, H.y, -61.5], [H.x + 63, H.y - 6, -61.5], [H.x + 64, H.y - 36, -61.5], [xa, H.y - 76, -61.5], [xa, H.y - 90, -61.5]] : [[H.x, H.y - 58, -61.5], [H.x, H.y - 64, -61.5], [xa, H.y - 72, -61.5]];
    schlauch([...weg, [xa, 215, -61.5], [xa, 196, -61.5]], M.kabelGrau, 1.6, fest, 24);
    BAND.sensorAus[sig] = V(xa, 196, za - 61.5);
  });
  label(name, fest, 120, BAND_Y + 140, H.zm, 'cyl');
  // Schwenkhebel (Drehpunkt im Ursprung): Arm nach −x über das Band, Klemmnabe auf der Welle, feste Anschlagleiste
  const hebel = new THREE.Group(); hebel.position.set(H.x, H.y, 0); fest.add(hebel);
  box(195, 16, 12, M.verzinkt, -97.5, 0, H.zm, hebel);                                          // Arm z 7…19
  zyl(14, 16, M.verzinkt, 0, 0, 12, 'z', hebel, 24);                                           // Klemmnabe z 4…20
  box(10, 6, 16, M.verzinkt, 0, 15, 12, hebel);                                                // Klemmschlitz
  zyl(2.5, 14, M.stahl, 0, 15, 12, 'x', hebel, 8);                                             // Klemmschraube
  box(130, 16, 4, M.alu, -130, 0, 5, hebel);                                                   // Alu-Träger z 3…7
  box(110, 16, 3, M.gelb, -140, 0, 1.5, hebel);                                                // PE-UHMW-Leiste z 0…3
  if (abfrage) {
    // −BG40: M12 durch Leiste, Träger und Arm, Stirnfläche 0,5 mm hinter der Anschlagfläche, Mutter hinter dem Arm
    const xs = -103;
    zyl(6, 44, M.stahl, xs, 0, 22.5, 'z', hebel, 16);                                          // Gewindehülse z 0,5…44,5
    zyl(9.5, 3, M.stahl, xs, 0, 20.5, 'z', hebel, 6);                                          // Mutter
    zyl(7, 9, M.kunststoff, xs, 0, 49, 'z', hebel, 14);                                        // M12-Stecker
    const mat = sensorLed(hebel, xs, 6.3, 42, abfrage.sig, 2.4, 1, 3);
    SENSOREN.push({ signal: abfrage.sig, mat, div: label(abfrage.txt, hebel, xs, 40, 30, 'klein') });
    // PUR-Leitung über den Arm zur Drehachse, im Bogen senkrecht nach unten; auf der Achse geht sie in die feste
    // Verlegung über (die Achse bewegt sich nicht)
    schlauch([[xs, 0, 53.5], [xs, 0, 59], [xs + 12, 12, 60], [-40, 14, 52], [-14, 14, 46], [-3, 9, 42], [0, 3, 42], [0, 0, 42]], M.kabelGrau, 2.4, hebel, 32);
    BAND.abfrageAus = V(H.x, H.y, za + 42);
  }
  // pos 0 = zu, 1 = offen (90°); ein abgerissener Hebel bleibt verbogen hochgeklappt, die Welle (Nocke) folgt weiter dem Antrieb
  hebel.userData.stellen = (pos, defekt) => {
    const w = STOPPER.WINKEL * pos;
    nocke.rotation.z = -w;
    hebel.rotation.set(defekt ? 0.05 : 0, defekt ? -0.04 : 0, -(defekt ? STOPPER.DEFEKT : w));
  };
  return hebel;
}
BAND.anschlag = bandAnschlag(STOPPER.MM5, '−MM5 Anschlag', 'BG14_MM5_zu', 'BG15_MM5_offen', '−BG14', '−BG15', 'MB9_Anschlag_auf',
  { sig: 'BG40_Korb_am_Anschlag', txt: '−BG40 Korb liegt an' }, 12);                               // Anschlagfläche z = 55: Korb bei 0
BAND.vereinzeler = bandAnschlag(STOPPER.MM6, '−MM6 Vereinzeler', 'BG16_MM6_zu', 'BG17_MM6_offen', '−BG16', '−BG17', 'MB10_Vereinzeler_zu');   // z = −105: nächster Korb bei −160

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
export const QM2 = { z: 300, leds: [] };                   // vorn: von der Umhausungsfront aus frei zugänglich
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

