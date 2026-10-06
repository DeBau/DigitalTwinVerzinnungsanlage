import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { V, box, zyl } from '../core/geometrie.js';
import { label } from '../core/beschriftung.js';
import { sensorLed } from '../core/leds.js';
import { leitung, rohr as starrRohr } from '../bauteile/leitungen.js';
import { steckerWinkel } from '../bauteile/stecker.js';
import { KLICK, PULT_TASTER } from './register.js';
import { profil, stellfuss } from '../bauteile/aluprofil.js';
import { BAND, BAND_Y } from './baender.js';
import { B2x, b2g } from './band2.js';

// Sprühkühlung (Abschrecken mit Wasser): Edelstahltunnel mit Lamellenvorhängen, Sprührohre oben und unten,
// Wasser läuft durch Korb und Drahtgurt in die Auffangwanne → Tank mit Umwälzpumpe −MA3 (−QA7),
// Sprühventil −MB13, Dampfabzug. Danach Luftmesser −MB14 (bläst das Wasser ab). Pyrometer −BT2 am Kühlplatz.
export const KUEHL = { x0: 1000, x1: 1600, kegel: [], luftschleier: null, dampfTakt: 0, wasserSaeule: null, mb18Zeiger: null, ablassHebel: null };
{
  const zc = B2x((KUEHL.x0 + KUEHL.x1) / 2), L = KUEHL.x1 - KUEHL.x0, H = 330, yU = BAND_Y - 60;
  // Gehäuse: Seitenwände (vorn mit Schauglas), Dach mit Abzug, Lamellenvorhänge an Ein- und Auslauf
  // Rückwand voll, Vorderwand mit Ausschnitt für das Schauglas (y BAND_Y+70…+210, z ±130)
  // Wände enden 3 mm unter dem Dach, darauf liegen die Dachrandprofile (keine gemeinsame Oberkante)
  box(3, H - 3, L, M.edelstahl, 152, yU + (H - 3) / 2, zc, b2g);
  {
    const wy0 = BAND_Y + 70, wy1 = BAND_Y + 210, wz = 130;
    box(3, wy0 - yU, L, M.edelstahl, -152, (yU + wy0) / 2, zc, b2g);
    box(3, yU + H - 3 - wy1, L, M.edelstahl, -152, (wy1 + yU + H - 3) / 2, zc, b2g);
    for (const s2 of [-1, 1]) box(3, wy1 - wy0, L / 2 - wz, M.edelstahl, -152, (wy0 + wy1) / 2, zc + s2 * (wz + (L / 2 - wz) / 2), b2g);
  }
  for (const sx of [-1, 1]) {
    box(30, 3, L - 2, M.edelstahl, sx * 138, yU + H - 1.5, zc, b2g);                              // Dachrandprofile unter dem Dach
  }
  box(310, 3, L, M.edelstahl, 0, yU + H + 1.5, zc, b2g);                                          // Dach
  for (const sx of [-1, 1]) for (const dz of [-L / 2, L / 2]) box(8, H + 10, 8, M.edelstahl, sx * 152, yU + H / 2 + 1, zc + dz, b2g);   // Kantenprofile
  const glas = new THREE.MeshLambertMaterial({ color: 0x9fb4c0, transparent: true, opacity: 0.18, depthWrite: false });
  box(4, 140, 260, glas, -153.5, BAND_Y + 140, zc, b2g);                                         // Schauglas (Bedienerseite)
  // Rahmen des Schauglases: steht vor der Wand, Querstücke zwischen den Pfosten
  box(6, 150, 8, M.edelstahl, -155.5, BAND_Y + 140, zc - 135, b2g); box(6, 150, 8, M.edelstahl, -155.5, BAND_Y + 140, zc + 135, b2g);
  box(6, 8, 262, M.edelstahl, -155.5, BAND_Y + 213, zc, b2g); box(6, 8, 262, M.edelstahl, -155.5, BAND_Y + 67, zc, b2g);
  const lamelle = new THREE.MeshStandardMaterial({ color: 0x6f8a96, roughness: 0.35, metalness: 0 });   // PVC-Streifenvorhang
  for (const dz of [-L / 2 + 2, L / 2 - 2]) for (let i = 0; i < 7; i++) box(36, 190, 2, lamelle, -129 + i * 43, BAND_Y + 145, zc + dz, b2g);
  // Abluftstutzen mit Wrasenrohr nach oben
  zyl(52, 50, M.edelstahl, 60, yU + H + 27, zc, null, b2g, 24);                                 // Abluftstutzen
  starrRohr([V(60, yU + H + 50, zc), V(60, yU + H + 130, zc), V(560, yU + H + 130, zc), V(560, yU + H + 1100, zc)], M.verzinkt, 50, 75, b2g);   // Wrasenrohr nach hinten, dann hoch
  // Sprührohre (oben quer über dem Band, unten unter dem Obertrum) mit Flachstrahldüsen
  const rohr = M.edelstahl, duese = new THREE.MeshStandardMaterial({ color: 0x2f5fa8, roughness: 0.4 });
  const kegelMat = new THREE.MeshBasicMaterial({ color: 0xd8ecff, transparent: true, opacity: 0.28, depthWrite: false });
  const kegelGeo = new THREE.ConeGeometry(38, 150, 16, 1, true);
  for (const dz of [-180, 0, 180]) {
    zyl(10, 300, rohr, 0, BAND_Y + 225, zc + dz, 'x', b2g, 12);
    for (const dx of [-90, -30, 30, 90]) {
      zyl(6, 14, duese, dx, BAND_Y + 210, zc + dz, null, b2g, 10);
      const k = new THREE.Mesh(kegelGeo, kegelMat); k.position.set(dx, BAND_Y + 128, zc + dz); k.visible = false; b2g.add(k); KUEHL.kegel.push(k);
    }
  }
  zyl(10, 300, rohr, 0, BAND_Y - 40, zc, 'x', b2g, 12);                                            // Unterdüsenrohr
  for (const dx of [-60, 0, 60]) zyl(6, 12, duese, dx, BAND_Y - 28, zc, null, b2g, 10);
  zyl(14, L - 40, rohr, 175, BAND_Y + 225, zc, 'z', b2g, 12);                                     // Verteilerrohr hinten (außen)
  for (const dz of [-180, 0, 180]) zyl(8, 30, rohr, 160, BAND_Y + 225, zc + dz, 'x', b2g, 10);     // Durchführungen
  // Auffangwanne unter dem Band mit Ablauf zum Tank
  box(292, 4, L + 72, M.edelstahl, 0, BAND_Y - 150, zc, b2g);                                     // Wannenboden zwischen den Wänden
  for (const sx of [-1, 1]) box(4, 70, L + 80, M.edelstahl, sx * 150, BAND_Y - 117, zc, b2g);
  for (const dz of [-1, 1]) box(292, 70, 4, M.edelstahl, 0, BAND_Y - 117, zc + dz * (L + 76) / 2, b2g);
  const wasser = new THREE.MeshStandardMaterial({ color: 0x2b5f7a, roughness: 0.1, metalness: 0.2 });
  box(292, 2, L + 72, wasser, 0, BAND_Y - 140, zc, b2g);
  zyl(18, 120, M.edelstahl, 120, BAND_Y - 160, zc - 200, 'x', b2g, 12);
  // Tank mit Umwälzpumpe −MA3 hinter dem Band, Leitung über Sprühventil −MB13 zum Verteilerrohr
  // Tank 160 tief direkt hinter dem Band (lokal x 180…340 = Welt z 1180…1340): weiter hinten stünde er auf der Kabelbrücke (bis z = 1170)
  const tz = zc + 60;
  box(160, 300, 360, M.edelstahl, 260, 160, tz, b2g);
  box(164, 6, 364, M.edelstahl, 260, 313, tz, b2g);
  zyl(45, 50, new THREE.MeshStandardMaterial({ color: 0x2f5fa8, roughness: 0.45 }), 300, 341, tz - 80, null, b2g, 24);   // Pumpengehäuse auf der Tankplatte
  zyl(55, 140, M.anthrazit, 300, 436, tz - 80, null, b2g, 24);                                     // Pumpenmotor darüber
  box(60, 30, 60, M.anthrazit, 300, 521, tz - 80, b2g);                                             // Klemmenkasten
  starrRohr([V(240, 335, tz - 80), V(200, 335, tz - 80), V(200, BAND_Y + 225, tz - 80), V(182, BAND_Y + 225, tz - 80)], new THREE.MeshStandardMaterial({ color: 0x2f5fa8, roughness: 0.4 }), 12, 30, b2g);
  const ventil = new THREE.Group(); ventil.position.set(200, BAND_Y + 120, tz - 80); b2g.add(ventil);
  box(50, 40, 50, M.messing, 0, 0, 0, ventil);
  box(36, 44, 36, M.kunststoff, 0, 42, 0, ventil);                                                 // Magnetspule −MB13
  const vled = sensorLed(ventil, -19, 52, 0, 'MB13_Spruehwasser', 1, 4, 5); vled.emissive.setHex(0xffb000);
  KUEHL.ventilLed = vled;
  label('Sprühventil −MB13', ventil, 0, 90, 0, 'klein');
  label('Kühlwassertank, Umwälzpumpe −MA3', b2g, 260, 580, tz - 80, 'klein');
  tankAusruestung(tz);
  label('Sprühkühlung (Abschrecken)', b2g, 0, yU + H + 90, zc, 'cyl');
  // Pyrometer −BT2 mit Spülluftvorsatz, misst durch die Rückwand auf den Korb am Kühlplatz
  const p = new THREE.Group(); p.position.set(185, BAND_Y + 140, B2x(1300)); b2g.add(p);
  box(40, 6, 60, M.anthrazit, 0, -20, 0, p);
  zyl(10, 90, M.edelstahl, -10, 0, 0, 'x', p, 16);
  zyl(12, 14, M.edelstahl, 32, 0, 0, 'x', p, 16);
  zyl(8, 30, M.messing, -60, 0, 0, 'x', p, 12);                                                    // Spülluftvorsatz
  label('−BT2 Pyrometer Korbtemperatur', p, 0, 60, 0, 'klein');
  BAND.bt2Stecker = anlage.worldToLocal((p.updateMatrixWorld(true), p.localToWorld(V(48, 0, 0))));
  // Luftmesser −MB14 am Auslauf (lokal: x quer, +x = Rückseite, z = Förderrichtung):
  //  Standgestell aus Profil 45x45 auf Stellfüßen über dem Band, oben Luftmesserdüse (Alu-Strangpressprofil,
  //  Schlitz 0,05 mm) quer über dem Band, 30° gegen die Förderrichtung geneigt; unten zweite Düse zwischen
  //  Ober- und Untertrum, an den Seitenprofilen verschraubt, bläst durch den Drahtgurt nach oben.
  //  Magnetventil −MB14 (2/2-Wege NC, G1/2) am hinteren Pfosten, Druckluft über Fallleitung mit Kugelhahn.
  const lz = B2x(1690), XP = 200, YO = BAND_Y + 262, YK = BAND_Y + 190;
  for (const sx of [-1, 1]) { profil(45, 45, YO - 22.5 - 52, 'y', sx * XP, (YO - 22.5 + 52) / 2, lz, b2g); stellfuss(sx * XP, lz, b2g); }   // Pfosten enden an der Unterkante des Querträgers
  profil(45, 45, 2 * XP + 45, 'x', 0, YO, lz, b2g);                                                   // Querträger
  for (const sx of [-1, 1]) box(20, 6, 40, M.deckel, sx * 161, YK + 16, lz, b2g);                     // Halter der Düse (Endkappe steht 1 mm vor)
  for (const sx of [-1, 1]) box(6, YO - 22 - YK - 16, 30, M.deckel, sx * 170, (YO - 22 + YK + 16) / 2, lz, b2g);
  const luftduese = (y, L, kipp, aufwaerts) => {
    const d = new THREE.Group(); d.position.set(0, y, lz); d.rotation.x = kipp; b2g.add(d);
    zyl(15, L, M.alu, 0, 0, 0, 'x', d, 20);                                                           // Druckkammer
    const lippe = box(L - 4, 6, 30, M.alu, 0, aufwaerts ? 14 : -14, -10, d); lippe.rotation.x = aufwaerts ? 0.9 : -0.9;
    box(L - 10, 1.5, 3, M.schwarz, 0, aufwaerts ? 25 : -25, -19, d);                                  // Düsenschlitz
    for (const sx of [-1, 1]) zyl(17, 6, M.anthrazit, sx * (L / 2 + 3), 0, 0, 'x', d, 20);            // Endkappen
    return d;
  };
  luftduese(YK, 300, -0.52, false);                                                                       // oben, bläst schräg nach unten gegen die Förderrichtung
  luftduese(BAND_Y - 40, 168, 0.52, true);                                                                // unten zwischen den Trums
  for (const sx of [-1, 1]) box(4, 30, 40, M.deckel, sx * 85, BAND_Y - 40, lz, b2g);                  // Winkel an den Seitenprofilen
  // Ventil −MB14 am hinteren Pfosten mit Spule und LED
  const mb14 = new THREE.Group(); mb14.position.set(XP + 40, BAND_Y + 120, lz); b2g.add(mb14);
  box(40, 36, 44, M.messing, 0, 0, 0, mb14);
  box(34, 40, 34, M.kunststoff, 0, 38, 0, mb14);                                                    // Magnetspule
  box(20, 26, 10, M.kunststoff, 0, 38, -22, mb14);                                                  // Gerätestecker
  KUEHL.blasLed = sensorLed(mb14, -18, 50, -10, 'MB14_Luftmesser', 1, 4, 5); KUEHL.blasLed.emissive.setHex(0xffb000);
  box(14, 30, 30, M.deckel, -27, 0, 0, mb14);                                                      // Halter am Pfosten
  const luft = new THREE.MeshStandardMaterial({ color: 0x2f7fd0, roughness: 0.45 });                 // PU-Schlauch blau
  // Druckluft: Fallleitung (Alu) mit Kugelhahn hinter dem Gestell → Ventil
  zyl(11, 2600 - (BAND_Y + 230), M.alu, XP + 130, (2600 + BAND_Y + 230) / 2, lz, null, b2g, 12);
  zyl(14, 36, M.messing, XP + 130, BAND_Y + 260, lz, null, b2g, 6);
  box(60, 7, 12, M.rot, XP + 130 + 26, BAND_Y + 272, lz, b2g);
  leitung([V(XP + 130, BAND_Y + 230, lz), V(XP + 130, BAND_Y + 120, lz), V(XP + 60, BAND_Y + 120, lz)], luft, 6, 30, b2g);
  // Ventil → obere Düse (Endkappe hinten) und über eine Schottverschraubung im Seitenprofil → untere Düse
  leitung([V(XP + 40, BAND_Y + 140, lz + 22), V(XP + 40, BAND_Y + 140, lz + 45), V(XP + 40, YK, lz + 90), V(158, YK, lz + 90), V(158, YK, lz)], luft, 4, 25, b2g);   // PU 8×1,25
  leitung([V(XP + 40, BAND_Y + 100, lz + 22), V(XP + 40, BAND_Y + 100, lz + 80), V(XP + 40, BAND_Y - 40, lz + 80), V(140, BAND_Y - 40, lz + 80), V(140, BAND_Y - 40, lz)], luft, 4, 25, b2g);
  zyl(9, 12, M.stahl, 136, BAND_Y - 40, lz, 'x', b2g, 6);                                             // Schottverschraubung
  // Ventilkabel am Pfosten hinunter in den Kabelkanal von Band 2
  leitung([V(XP + 40, BAND_Y + 38, lz - 27), V(XP + 40, BAND_Y + 38, lz - 55), V(160, BAND_Y + 38, lz - 55), V(160, BAND_Y - 34, lz - 55)], M.kabelGrau, 2.6, 14, b2g);
  KUEHL.luftschleier = new THREE.Mesh(new THREE.PlaneGeometry(240, 180), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }));
  KUEHL.luftschleier.position.set(0, BAND_Y + 95, lz - 40); KUEHL.luftschleier.rotation.x = 0.5; KUEHL.luftschleier.visible = false; b2g.add(KUEHL.luftschleier);
  label('Luftmesser −MB14', b2g, 0, YO + 60, lz, 'klein');
}

// Ausrüstung des Kühlwassertanks (lokal wie oben: Tank x 180…340, y 10…316, z tz ± 180; Rückseite x = 340,
//  Stirnseite z = tz + 180): Schauglas-Standrohr mit Wassersäule, Grenzschalter −BG38 (Min) und −BG39 (Max),
//  Ablasshahn unten an der Stirnseite (anklickbar), Radarsensor −BL2 im Deckel, Frischwasser-Fallleitung mit Kugelhahn,
//  Magnetventil −MB17 und Regelventil −MB18 (Stellantrieb mit Stellungsanzeige)
function tankAusruestung(tz) {
  const zs = tz + 180, hY = (proz) => 16 + 2.8 * proz;                                          // Füllstand in % → Höhe im Tank
  const wasserMat = new THREE.MeshStandardMaterial({ color: 0x3d8fc4, roughness: 0.15, metalness: 0 });
  const glas = new THREE.MeshLambertMaterial({ color: 0xcfe2ea, transparent: true, opacity: 0.25, depthWrite: false });
  // Rückseite des Tanks (x = 340, frei zugänglich): Schauglas-Standrohr mit Marken bei Min und Max,
  // Grenzschalter Endress+Hauser Liquiphant FTL31 seitlich eingeschraubt (Schwinggabel waagerecht im Tank):
  // Sechskant G3/4, Edelstahlgehäuse, Deckel mit LEDs grün (Betrieb) und gelb (Schaltzustand), M12-Winkelstecker nach unten
  const xs = 340, sz = tz + 140, sx = xs + 26;
  for (const y of [hY(0), hY(100)]) { zyl(7, 26, M.edelstahl, xs + 13, y, sz, 'x', b2g, 12); zyl(10, 14, M.edelstahl, sx, y, sz, null, b2g, 12); }
  zyl(9, hY(100) - hY(0) - 14, glas, sx, (hY(0) + hY(100)) / 2, sz, null, b2g, 16);
  const saeule = zyl(6, 1, wasserMat, sx, hY(0) + 7, sz, null, b2g, 12);
  saeule.userData.dyn = true; saeule.castShadow = false;
  KUEHL.wasserSaeule = { m: saeule, y0: hY(0) + 7, h: hY(100) - hY(0) - 14 };
  for (const p of [25, 50, 75, 90]) box(2, 1.5, p === 50 || p === 75 ? 8 : 14, p === 50 || p === 75 ? M.schwarz : M.rot, xs + 1.5, hY(p), sz - 16, b2g);
  const liquiphant = (z, proz, signal, name) => {
    const y = hY(proz);
    zyl(18, 12, M.edelstahl, xs + 6, y, z, 'x', b2g, 6);                                        // Sechskant SW 32
    zyl(14, 62, M.edelstahl, xs + 43, y, z, 'x', b2g, 20);                                       // Gehäuse
    zyl(14.5, 8, M.pvcHell, xs + 78, y, z, 'x', b2g, 20);                                        // Deckel (Kunststoff, transparent für die LEDs)
    const gruen = sensorLed(b2g, xs + 82.5, y + 5, z - 4, '', 1.2, 3, 3); gruen.emissive.setHex(0x22dd55); gruen.emissiveIntensity = 1.6;
    const led = sensorLed(b2g, xs + 82.5, y + 5, z + 4, signal, 1.2, 3, 3); led.emissive.setHex(0xffc400);
    const a = steckerWinkel(b2g, V(xs + 82, y, z), '+x', '-y');
    label(name, b2g, xs + 50, y + 30, z, 'klein');
    return { led, a };
  };
  const bg39 = liquiphant(tz + 95, 90, 'BG39_Wasser_Max_frei', '−BG39 Max (Liquiphant FTL31)');
  const bg38 = liquiphant(tz + 20, 25, 'BG38_Wasser_Min', '−BG38 Min (Liquiphant FTL31)');
  KUEHL.bg38Led = bg38.led; KUEHL.bg39Led = bg39.led;
  // Ablasshahn DN15 unten an der Stirnseite: Kugelhahn mit rotem Hebel (zu = quer zum Rohr, auf = längs)
  const hx = 214, hy = 34;
  zyl(9, 40, M.edelstahl, hx, hy, zs + 20, 'z', b2g, 12);
  box(26, 26, 30, M.messing, hx, hy, zs + 50, b2g);
  zyl(9, 30, M.edelstahl, hx, hy, zs + 78, 'z', b2g, 12);
  zyl(3, 12, M.stahl, hx, hy + 18, zs + 50, null, b2g, 8);
  const hebel = new THREE.Group(); hebel.position.set(hx, hy + 25, zs + 50); hebel.userData.dyn = true; b2g.add(hebel);
  box(90, 5, 12, M.rot, 40, 0, 0, hebel);
  KUEHL.ablassHebel = hebel;
  const klick = new THREE.Mesh(new THREE.BoxGeometry(110, 50, 110), KLICK);
  klick.position.set(hx, hy + 10, zs + 55); klick.userData = { art: 'ablass', taster: 'ablass' }; b2g.add(klick);
  PULT_TASTER.push({ key: 'ablass', kappe: klick, art: 'ablass' });
  label('Ablasshahn (anklickbar)', b2g, hx, hy + 55, zs + 95, 'klein');
  // Radar-Füllstandssensor −BL2 Endress+Hauser Micropilot FMR20B (80 GHz, 4…20 mA) im Deckel:
  // Einschraubstutzen 1½", Gehäuse PVDF mit Antenne nach unten, Typschild, M12-Winkelstecker oben
  const ux = 228, uz = tz + 130;
  zyl(26, 10, M.edelstahl, ux, 321, uz, null, b2g, 24);                                            // Stutzen
  zyl(24, 8, M.edelstahl, ux, 330, uz, null, b2g, 6);                                              // Kontermutter
  zyl(30, 96, M.kunststoff, ux, 382, uz, null, b2g, 28);                                           // Gehäuse
  zyl(31, 10, M.blau, ux, 425, uz, null, b2g, 28);                                                 // Kopfring (E+H-Blau)
  zyl(12, 10, M.kunststoff, ux, 435, uz, null, b2g, 16);
  box(1.5, 30, 26, M.blech, ux + 30.5, 385, uz, b2g);                                              // Typschild
  const bl2 = steckerWinkel(b2g, V(ux, 440, uz), '+y', '-x');
  label('−BL2 Füllstand (Micropilot FMR20B, Radar)', b2g, ux, 500, uz, 'klein');
  // Frischwasser-Fallleitung (Edelstahl DN15) von der Hallendecke in den Deckel
  const fx = 300, fz = tz + 60, YD = 2600;
  zyl(20, 6, M.edelstahl, fx, 319, fz, null, b2g, 16);                                             // Einschweißstutzen
  zyl(11, YD - 322, M.edelstahl, fx, (YD + 322) / 2, fz, null, b2g, 12);
  zyl(15, 34, M.messing, fx, 1250, fz, null, b2g, 6);                                              // Kugelhahn (Absperrung von Hand)
  box(60, 7, 12, M.rot, fx + 26, 1262, fz, b2g);
  // Magnetventil −MB17 (2/2 NC): Messingkörper in der Leitung, Spule zur Stirnseite, LED im Gerätestecker
  const mb17 = new THREE.Group(); mb17.position.set(fx, 980, fz); b2g.add(mb17);
  box(44, 48, 44, M.messing, 0, 0, 0, mb17);
  box(36, 40, 40, M.kunststoff, 0, 0, 42, mb17);
  box(26, 22, 12, M.kunststoff, 0, -6, 67, mb17);
  KUEHL.mb17Led = sensorLed(mb17, 0, 8, 73.5, 'MB17_Nachspeisen', 4, 4, 1.5); KUEHL.mb17Led.emissive.setHex(0xffb000);
  label('Magnetventil −MB17', mb17, 0, 50, 60, 'klein');
  // Regelventil −MB18: Ventilkörper in der Leitung, Joch mit Spindel, Stellantrieb 24 V (Stellsignal und
  //  Rückmeldung 0…10 V), Stellungsanzeige am Joch (Zeiger wandert mit der Spindel)
  const mb18 = new THREE.Group(); mb18.position.set(fx, 600, fz); b2g.add(mb18);
  zyl(26, 60, M.anthrazit, 0, 0, 0, null, mb18, 20);
  for (const y of [-34, 34]) zyl(22, 8, M.anthrazit, 0, y, 0, null, mb18, 6);                     // Flansche
  zyl(18, 20, M.anthrazit, 0, 0, 30, 'z', mb18, 16);
  for (const dx of [-14, 14]) zyl(3, 60, M.stahl, dx, 0, 70, 'z', mb18, 8);                        // Jochstangen
  zyl(2.5, 60, M.stahl, 0, 0, 70, 'z', mb18, 8);                                                   // Spindel
  box(70, 64, 70, M.blau, 0, 0, 135, mb18);                                                        // Stellantrieb
  box(30, 18, 3, M.schwarz, 0, 18, 171.5, mb18);
  box(2, 24, 50, M.blech, 24, 0, 70, mb18);                                                        // Skala 0…100 % (zur Rückseite)
  for (let i = 0; i <= 4; i++) box(1.2, i % 2 ? 6 : 12, 1.2, M.schwarz, 25.5, 6, 48 + i * 11, mb18);
  const zeiger = box(4, 10, 4, M.gelb, 17, -4, 48, mb18); zeiger.userData.dyn = true;
  KUEHL.mb18Zeiger = { m: zeiger, z0: 48, hub: 44 };
  label('Regelventil −MB18', mb18, 0, 60, 135, 'klein');
  label('Frischwasser', b2g, fx, 1330, fz, 'klein');
  // Leitungen an der Fallleitung hinunter, über den Deckel nach vorn und in den Kabelkanal von Band 2 (lokal x = 160)
  const zuKanal = (y, z) => [V(165, y, z), V(165, 262, z)];
  leitung([V(fx, 974, fz + 73), V(fx, 974, fz + 105), V(fx, 330, fz + 105), ...zuKanal(330, fz + 105)], M.kabelGrau, 2.6, 14, b2g);
  leitung([V(fx, 568, fz + 135), V(fx, 334, fz + 135), ...zuKanal(334, fz + 135)], M.kabelGrau, 2.6, 14, b2g);
  leitung([bl2, ...zuKanal(bl2.y, uz)], M.kabelGrau, 2.6, 14, b2g);
  // Liquiphant: Stecker nach unten, Leitung mit Tropfschlaufe nach oben über den Deckel
  for (const s of [bg39, bg38]) leitung([s.a, V(s.a.x, s.a.y - 46, s.a.z), V(s.a.x + 46, s.a.y - 46, s.a.z), V(s.a.x + 46, 362, s.a.z), ...zuKanal(362, s.a.z)], M.kabelGrau, 2.2, 12, b2g);
}
