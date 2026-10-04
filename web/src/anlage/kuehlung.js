import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { V, box, zyl } from '../core/geometrie.js';
import { label } from '../core/beschriftung.js';
import { sensorLed } from '../core/leds.js';
import { leitung } from '../bauteile/leitungen.js';
import { profil, stellfuss } from '../bauteile/aluprofil.js';
import { BAND, BAND_Y } from './baender.js';
import { B2x, b2g } from './band2.js';

// Sprühkühlung (Abschrecken mit Wasser): Edelstahltunnel mit Lamellenvorhängen, Sprührohre oben und unten,
// Wasser läuft durch Korb und Drahtgurt in die Auffangwanne → Tank mit Umwälzpumpe −MA3 (−QA7),
// Sprühventil −MB13, Dampfabzug. Danach Luftmesser −MB14 (bläst das Wasser ab). Pyrometer −BT2 am Kühlplatz.
export const KUEHL = { x0: 1000, x1: 1600, kegel: [], luftschleier: null, dampfTakt: 0 };
{
  const zc = B2x((KUEHL.x0 + KUEHL.x1) / 2), L = KUEHL.x1 - KUEHL.x0, H = 330, yU = BAND_Y - 60;
  // Gehäuse: Seitenwände (vorn mit Schauglas), Dach mit Abzug, Lamellenvorhänge an Ein- und Auslauf
  // Rückwand voll, Vorderwand mit Ausschnitt für das Schauglas (y BAND_Y+70…+210, z ±130)
  box(3, H, L, M.edelstahl, 152, yU + H / 2, zc, b2g);
  {
    const wy0 = BAND_Y + 70, wy1 = BAND_Y + 210, wz = 130;
    box(3, wy0 - yU, L, M.edelstahl, -152, (yU + wy0) / 2, zc, b2g);
    box(3, yU + H - wy1, L, M.edelstahl, -152, (wy1 + yU + H) / 2, zc, b2g);
    for (const s2 of [-1, 1]) box(3, wy1 - wy0, L / 2 - wz, M.edelstahl, -152, (wy0 + wy1) / 2, zc + s2 * (wz + (L / 2 - wz) / 2), b2g);
  }
  for (const sx of [-1, 1]) {
    box(30, 3, L, M.edelstahl, sx * 138, yU + H, zc, b2g);
  }
  box(310, 3, L, M.edelstahl, 0, yU + H + 1.5, zc, b2g);                                          // Dach
  for (const sx of [-1, 1]) for (const dz of [-L / 2, L / 2]) box(8, H + 10, 8, M.edelstahl, sx * 152, yU + H / 2, zc + dz, b2g);   // Kantenprofile
  const glas = new THREE.MeshLambertMaterial({ color: 0x9fb4c0, transparent: true, opacity: 0.18, depthWrite: false });
  box(4, 140, 260, glas, -153.5, BAND_Y + 140, zc, b2g);                                         // Schauglas (Bedienerseite)
  box(6, 150, 8, M.edelstahl, -154, BAND_Y + 140, zc - 134, b2g); box(6, 150, 8, M.edelstahl, -154, BAND_Y + 140, zc + 134, b2g);
  box(6, 8, 276, M.edelstahl, -154, BAND_Y + 213, zc, b2g); box(6, 8, 276, M.edelstahl, -154, BAND_Y + 67, zc, b2g);
  const lamelle = new THREE.MeshStandardMaterial({ color: 0x6f8a96, roughness: 0.35, metalness: 0 });   // PVC-Streifenvorhang
  for (const dz of [-L / 2 + 2, L / 2 - 2]) for (let i = 0; i < 7; i++) box(36, 190, 2, lamelle, -129 + i * 43, BAND_Y + 145, zc + dz, b2g);
  // Abluftstutzen mit Wrasenrohr nach oben
  zyl(52, 50, M.edelstahl, 60, yU + H + 27, zc, null, b2g, 24);                                 // Abluftstutzen
  leitung([V(60, yU + H + 50, zc), V(60, yU + H + 130, zc), V(560, yU + H + 130, zc), V(560, yU + H + 1100, zc)], M.verzinkt, 50, 90, b2g);   // Wrasenrohr nach hinten, dann hoch
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
  box(300, 4, L + 80, M.edelstahl, 0, BAND_Y - 150, zc, b2g);
  for (const sx of [-1, 1]) box(4, 70, L + 80, M.edelstahl, sx * 150, BAND_Y - 117, zc, b2g);
  for (const dz of [-1, 1]) box(300, 70, 4, M.edelstahl, 0, BAND_Y - 117, zc + dz * (L + 80) / 2, b2g);
  const wasser = new THREE.MeshStandardMaterial({ color: 0x2b5f7a, roughness: 0.1, metalness: 0.2 });
  box(292, 2, L + 72, wasser, 0, BAND_Y - 140, zc, b2g);
  zyl(18, 120, M.edelstahl, 120, BAND_Y - 160, zc - 200, 'x', b2g, 12);
  // Tank mit Umwälzpumpe −MA3 hinter dem Band, Leitung über Sprühventil −MB13 zum Verteilerrohr
  const tz = zc + 60;
  box(320, 300, 360, M.edelstahl, 340, 160, tz, b2g);
  box(324, 6, 364, M.edelstahl, 340, 313, tz, b2g);
  zyl(55, 140, M.anthrazit, 300, 380, tz - 80, null, b2g, 24);                                     // Pumpenmotor
  zyl(45, 50, new THREE.MeshStandardMaterial({ color: 0x2f5fa8, roughness: 0.45 }), 300, 290 + 45, tz - 80, null, b2g, 24);   // Pumpengehäuse
  box(60, 30, 60, M.anthrazit, 300, 465, tz - 80, b2g);                                             // Klemmenkasten
  leitung([V(240, 335, tz - 80), V(200, 335, tz - 80), V(200, BAND_Y + 225, tz - 80), V(182, BAND_Y + 225, tz - 80)], new THREE.MeshStandardMaterial({ color: 0x2f5fa8, roughness: 0.4 }), 12, 30, b2g);
  const ventil = new THREE.Group(); ventil.position.set(200, BAND_Y + 120, tz - 80); b2g.add(ventil);
  box(50, 40, 50, M.messing, 0, 0, 0, ventil);
  box(36, 44, 36, M.kunststoff, 0, 42, 0, ventil);                                                 // Magnetspule −MB13
  const vled = sensorLed(ventil, -19, 52, 0, 'MB13_Spruehwasser', 1, 4, 5); vled.emissive.setHex(0xffb000);
  KUEHL.ventilLed = vled;
  label('Sprühventil −MB13', ventil, 0, 90, 0, 'klein');
  label('Tank, Umwälzpumpe −MA3', b2g, 340, 520, tz - 80, 'klein');
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
  for (const sx of [-1, 1]) { profil(45, 45, YO - 22 - 52, 'y', sx * XP, (YO - 22 + 52) / 2, lz, b2g); stellfuss(sx * XP, lz, b2g); }
  profil(45, 45, 2 * XP + 45, 'x', 0, YO, lz, b2g);                                                   // Querträger
  for (const sx of [-1, 1]) box(20, 6, 40, M.deckel, sx * 160, YK + 16, lz, b2g);                     // Halter der Düse
  for (const sx of [-1, 1]) box(6, YO - 22 - YK - 16, 30, M.deckel, sx * 170, (YO - 22 + YK + 16) / 2, lz, b2g);
  const luftduese = (y, L, kipp, aufwaerts) => {
    const d = new THREE.Group(); d.position.set(0, y, lz); d.rotation.x = kipp; b2g.add(d);
    zyl(15, L, M.alu, 0, 0, 0, 'x', d, 20);                                                           // Druckkammer
    const lippe = box(L, 6, 30, M.alu, 0, aufwaerts ? 14 : -14, -10, d); lippe.rotation.x = aufwaerts ? 0.9 : -0.9;
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
  zyl(11, 2600 - (BAND_Y + 230), M.alu, XP + 110, (2600 + BAND_Y + 230) / 2, lz, null, b2g, 12);
  zyl(14, 36, M.messing, XP + 110, BAND_Y + 260, lz, null, b2g, 6);
  box(60, 7, 12, M.rot, XP + 110 + 26, BAND_Y + 272, lz, b2g);
  leitung([V(XP + 110, BAND_Y + 230, lz), V(XP + 110, BAND_Y + 120, lz), V(XP + 60, BAND_Y + 120, lz)], luft, 6, 30, b2g);
  // Ventil → obere Düse (Endkappe hinten) und über eine Schottverschraubung im Seitenprofil → untere Düse
  leitung([V(XP + 40, BAND_Y + 140, lz + 22), V(XP + 40, BAND_Y + 140, lz + 40), V(XP + 40, YK, lz + 40), V(158, YK, lz + 40), V(158, YK, lz)], luft, 6, 25, b2g);
  leitung([V(XP + 40, BAND_Y + 100, lz + 22), V(XP + 40, BAND_Y + 100, lz + 50), V(XP + 40, BAND_Y - 40, lz + 50), V(140, BAND_Y - 40, lz + 50), V(140, BAND_Y - 40, lz)], luft, 6, 25, b2g);
  zyl(9, 12, M.stahl, 136, BAND_Y - 40, lz, 'x', b2g, 6);                                             // Schottverschraubung
  // Ventilkabel am Pfosten hinunter in den Kabelkanal von Band 2
  leitung([V(XP + 40, BAND_Y + 38, lz - 27), V(XP + 40, BAND_Y + 38, lz - 50), V(160, BAND_Y + 38, lz - 50), V(160, BAND_Y - 34, lz - 50)], M.kabelGrau, 2.6, 14, b2g);
  KUEHL.luftschleier = new THREE.Mesh(new THREE.PlaneGeometry(240, 180), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }));
  KUEHL.luftschleier.position.set(0, BAND_Y + 95, lz - 40); KUEHL.luftschleier.rotation.x = 0.5; KUEHL.luftschleier.visible = false; b2g.add(KUEHL.luftschleier);
  label('Luftmesser −MB14', b2g, 0, YO + 60, lz, 'klein');
}
