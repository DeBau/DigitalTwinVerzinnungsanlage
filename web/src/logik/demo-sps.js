import { NOT_HALT, QUITT, st } from './zustand.js';
import { eingang } from './eingaenge.js';

// ----------------------------------------------------------------------------
// Demo-SPS – Schrittkette im Browser, wenn keine SPS gekoppelt ist
// ----------------------------------------------------------------------------
export const demo = { hand8: false, kurve: { rechts: false, links: false, nachlauf: 0 }, ps: { kip: false, kt: 0, gekippt: false, nachlauf: 0, bg32Alt: false, niOAlt: false, ausblasZeiten: [], mulde: 0, voPruef: false, voKip: false, voPb: false }, nh: { aktiv: [], erst: null, quittiertAn: null, freiAlt: true }, b2: { mulde: false, rechts: false, links: false, nachlauf: 0, trig: false, tt: 0, geprueft: false }, hand5: false, hand6: false, schritt: 1, auto: false, t: 0, korbFertig: false, mitKorb: false, sf1Alt: false, warten: false,
  band: { rechts: false, links: false, nachlauf: 0, abgabe: 0, anschlagAuf: false, bg11Aus: 0, uebNach: 0, steht: 0 }, bad: { heiz: false, fuell: false }, kw: { i: 0 } };
// Telegramm 1: 16#047F = Betrieb, 16#047E = AUS1, aus der Einschaltsperre (ZSW1.6) erst mit AUS1 = 0;
// Störungen quittiert ein Quittiertaster über STW1.7
function telegramm(A, name, vor, zurueck, nsoll = 0x4000) {
  const quitt = QUITT.some(q => eingang(q.signal)), sperre = (eingang(name + '_ZSW1') & 0x0040) !== 0;
  A[name + '_STW1'] = ((vor || zurueck) && !sperre ? 0x047F : 0x047E) | (quitt ? 0x0080 : 0);
  A[name + '_NSOLL_A'] = zurueck ? -nsoll : nsoll;
}
export function demoSps(dt) {
  const E = eingang, A = st.demoAusgaenge;
  const frei = E('KF2_NotHalt_OK'), dauer = E('SA1_Dauerbetrieb'), hand = E('SA3_Handbetrieb');
  // Not-Halt-Meldungen (Meldekontakte Öffner, 1 = entriegelt): betätigte Taster und Erstwert für HMI/Meldezeile
  demo.nh.aktiv = NOT_HALT.filter(n => !E(n.signal));
  if (!demo.nh.aktiv.length && frei) demo.nh.erst = null;
  else if (!demo.nh.erst && demo.nh.aktiv.length) demo.nh.erst = demo.nh.aktiv[0];
  // Ort der Quittierung: welcher Quittiertaster (−SF4, −SF41…−SF44) beim Wiederanlauf von −KF2 gedrückt war
  if (frei && !demo.nh.freiAlt) demo.nh.quittiertAn = QUITT.find(q => E(q.signal)) || null;
  demo.nh.freiAlt = frei;
  const stop = st.sf2Oeffner ? !E('SF2_Stop') : E('SF2_Stop');
  const sf1 = E('SF1_Start'), startFlanke = sf1 && !demo.sf1Alt && frei && !hand; demo.sf1Alt = sf1;
  // Automatik: START → Zyklen wiederholen, bis STOP (laufender Korb wird fertig).
  // Einzel: jedes START fährt genau einen Zyklus. Hand (Schaltschranktür): Kette ruht in Schritt 1.
  if (!frei) { demo.auto = false; demo.warten = true; }
  if (startFlanke && dauer) { demo.auto = true; demo.warten = false; }
  if (stop || !dauer || hand) demo.auto = false;
  // Im Betrieb mit PLCSIM rechnet die Kette nur für den Übungsumfang „Verzinnen: Portal automatisch“. Das Portal
  // braucht dann weder START noch −SA1 (die gehören deinem Programm): es fährt, sobald −KF2 frei ist und nicht Hand.
  if (st.modus === 'sps') { demo.auto = frei && !hand; demo.warten = !frei; }
  const handStart = startFlanke && !dauer;
  if (handStart) demo.warten = false;
  if (hand) demo.schritt = 1;
  if (!E('BG11_Korb')) demo.korbFertig = false;

  const grund = E('BG2_MM1_geloest') && E('BG4_MM2_unten') && E('BG5_MM3_Band') && E('BG8_MM4_zu');
  const bed = grund && E('BG9_Temperatur') && E('BG10_Fuellhoehe') && E('BG40_Korb_am_Anschlag') && !demo.korbFertig;   // −BG40: Korb liegt am Anschlag an
  const weiter = frei && !demo.warten && !hand;

  const alt = demo.schritt;
  // Schritte 11…14: Grundstellungsfahrt. Nach Handbetrieb, Betriebsartwechsel oder abgebrochenem
  // Zyklus steht die Anlage irgendwo; START fährt sie zuerst zurück (heben, zum Band und Bad zu,
  // senken, lösen). Ein dabei abgelegter Korb gilt wie bei Schritt 10 als fertig und fährt ab.
  if (weiter) switch (demo.schritt) {
    case 1:
      if (bed && (demo.auto || handStart)) demo.schritt = 2;
      else if (!grund && (demo.auto || handStart)) {
        demo.mitKorb = E('BG1_MM1_eingehaengt');
        demo.schritt = !(E('BG5_MM3_Band') && E('BG8_MM4_zu')) ? (E('BG3_MM2_oben') ? 12 : 11) : !E('BG4_MM2_unten') ? 13 : 14;
      }
      break;
    case 11: if (E('BG3_MM2_oben')) demo.schritt = 12; break;
    case 12: if (E('BG5_MM3_Band') && E('BG8_MM4_zu') && (!demo.mitKorb || E('BG15_MM5_offen'))) demo.schritt = 13; break;
    case 13: if (E('BG4_MM2_unten')) demo.schritt = 14; break;
    case 14: if (E('BG2_MM1_geloest')) { demo.schritt = 1; demo.korbFertig = demo.korbFertig || demo.mitKorb; } break;
    // Anheben und Absenken am Übergabeplatz nur mit offenem Anschlag (−BG15): sonst hängen die Korbpuffer unter dem Hebel
    case 2: if (E('BG1_MM1_eingehaengt') && E('BG15_MM5_offen')) demo.schritt = 3; break;
    case 3: if (E('BG3_MM2_oben')) demo.schritt = 4; break;
    case 4: if (E('BG6_MM3_Bad')) demo.schritt = 5; break;
    case 5: if (E('BG7_MM4_offen')) demo.schritt = 6; break;
    case 6: if (E('BG4_MM2_unten') && demo.t >= st.tauchSoll) demo.schritt = 7; break;
    case 7: if (E('BG3_MM2_oben') && demo.t >= st.tropfSoll) demo.schritt = 8; break;
    case 8: if (E('BG5_MM3_Band') && E('BG8_MM4_zu') && E('BG15_MM5_offen')) demo.schritt = 9; break;
    case 9: if (E('BG4_MM2_unten')) demo.schritt = 10; break;
    case 10: if (E('BG2_MM1_geloest')) { demo.schritt = 1; demo.korbFertig = true; } break;
  }
  if (demo.schritt !== alt) demo.t = 0;
  if (weiter && ((demo.schritt === 6 && E('BG4_MM2_unten')) || (demo.schritt === 7 && E('BG3_MM2_oben')))) demo.t += dt;

  const s = demo.schritt;
  A.MB1_Einhaengen = s === 2;
  A.MB4_Anheben = s === 3 || s === 7 || s === 11;
  A.MB5_Zinnbad = s === 4;
  A.MB8_Oeffnen = s === 5;
  A.MB3_Senken = s === 6 || s === 9 || s === 13;
  A.MB6_Foerderband = s === 8 || s === 12;
  A.MB7_Schliessen = s === 8 || s === 12;
  A.MB2_Loesen = s === 10 || s === 14;
  if (hand) {
    // Handbetrieb: Tippbetrieb je Ventilspule, mit Verriegelungen
    const H = (n) => E(n);
    const mm2Oben = E('BG3_MM2_oben');
    A.MB1_Einhaengen = H('SF11_MM1_Einhaengen');
    A.MB2_Loesen = H('SF12_MM1_Loesen') && (E('BG4_MM2_unten') && E('BG5_MM3_Band'));        // nur über dem Band abgesenkt lösen
    A.MB3_Senken = H('SF13_MM2_Senken') && (E('BG5_MM3_Band') || (E('BG6_MM3_Bad') && E('BG7_MM4_offen')));
    A.MB4_Anheben = H('SF14_MM2_Anheben');
    A.MB5_Zinnbad = H('SF15_MM3_Zinnbad') && mm2Oben;
    A.MB6_Foerderband = H('SF16_MM3_Band') && mm2Oben;
    A.MB7_Schliessen = H('SF17_MM4_Schliessen') && !(E('BG6_MM3_Bad') && !mm2Oben);
    A.MB8_Oeffnen = H('SF18_MM4_Oeffnen');
  }
  A.PF7_Handbetrieb = hand;
  A.PF1_Automatik = demo.auto;
  A.PF2_Temperatur = E('BG9_Temperatur');
  A.PF3_Fuellhoehe = !E('BG10_Fuellhoehe');
  A.PF4_Korb = E('BG40_Korb_am_Anschlag') && !demo.auto;
  A.PF5_Quittieren = !frei && (performance.now() % 1000 < 500);
  for (const q of QUITT) A[q.pf] = A.PF5_Quittieren;                  // Leuchttaster −SF41…−SF44: eigene Ausgänge, gleiche Blinklogik
  A.PF6_VorOrt = E('SA2_VorOrt');

  // Band (wirkt nur bei Übungsumfang „SPS steuert“)
  const b = demo.band, bg11 = E('BG11_Korb'), bg12 = E('BG12_Bandanfang'), bg40 = E('BG40_Korb_am_Anschlag');
  b.bg11Aus = bg11 ? 0 : b.bg11Aus + dt;
  const motorOk = frei && E('FA1_Motorschutz');
  if (E('SA2_VorOrt')) {
    // Vor-Ort: Rechts/Links mit Selbsthaltung, Halt (Öffner) und gegenseitiger Verriegelung
    if (!E('SF7_Band_Halt') || !motorOk) b.rechts = b.links = false;
    else if (E('SF5_Band_Rechts') && !b.links) b.rechts = true;
    else if (E('SF6_Band_Links') && !b.rechts) b.links = true;
    b.anschlagAuf = false; b.nachlauf = 0; b.abgabe = 0;
  } else {
    b.links = false;
    // Erst Band stoppen, dann Anschlag öffnen: Korb am Haken über dem Übergabeplatz (Schritte 2, 3, 9, 10) → Band aus;
    // der Anschlag öffnet, wenn das Band 0,5 s steht (ausgelaufen), und bleibt offen, bis der fertige Korb abgefahren ist
    const korbAmPlatz = s === 2 || s === 3 || s === 9 || s === 10 || (s >= 13 && demo.mitKorb);
    const imZyklus = (s >= 2 && s <= 10) || (s >= 11 && demo.mitKorb);
    if (imZyklus && (b.anschlagAuf || b.steht > 0.5)) b.anschlagAuf = true;
    if (demo.korbFertig && bg11 && demo.schritt === 1) b.anschlagAuf = true;   // fertigen Korb abfahren lassen
    if (!imZyklus && b.bg11Aus > 0.5) b.anschlagAuf = false;
    if (bg12) b.nachlauf = 12;                                                 // Zufuhr: Band ist 1,5 m lang
    if (b.anschlagAuf) b.abgabe = 18;                                          // Abgabe: fertigen Korb bis ans Bandende (Rollenkurve) bringen
    b.nachlauf = Math.max(0, b.nachlauf - dt);
    b.abgabe = Math.max(0, b.abgabe - dt);
    const korbWartet = bg40 && !demo.korbFertig && !bg12;                     // neuer Korb liegt am Anschlag an (−BG40, unabhängig von der Bandgeschwindigkeit)
    // Übergabe Band 1 → Rollenkurve: Band 1 läuft mit, solange die Kurve den Korb übernimmt (−BG13 oder −BG35 belegt);
    // 1 s Nachlauf überbrückt die Lücke zwischen den Strahlen (Korb zwischen −BG13 und −BG35)
    if (E('BG13_Bandende') || E('BG35_Kurve_Anfang')) b.uebNach = 1;
    b.uebNach = Math.max(0, b.uebNach - dt);
    const uebergabe1 = demo.kurve.rechts && b.uebNach > 0;
    const einlauf = bg11 && !bg40 && !demo.korbFertig;                       // Korb unter −BG11, liegt noch nicht an: weiterfördern
    const hakenImKorb = E('BG5_MM3_Band') && !E('BG3_MM2_oben') && !E('BG2_MM1_geloest');   // Band steht, solange der Haken im Korb ist
    b.rechts = motorOk && !hakenImKorb && !korbAmPlatz && (b.abgabe > 0 || (b.nachlauf > 0 && !korbWartet) || einlauf || uebergabe1);   // Stauband: wartender Korb rutscht am Anschlag
  }
  b.steht = b.rechts || b.links ? 0 : b.steht + dt;
  A.QA1_Band_Rechts = b.rechts;
  A.QA2_Band_Links = b.links;
  A.MB9_Anschlag_auf = b.anschlagAuf;
  A.MB10_Vereinzeler_zu = !E('SA2_VorOrt') && (demo.schritt !== 1 || bg11 || !E('BG14_MM5_zu'));   // nächsten Korb erst bei geschlossenem Anschlag
  // Rollenkurve −MA6 und Band 2 (wirken nur bei Übungsumfang „SPS steuert“)
  {
    const k = demo.kurve, okK = frei && E('FA7_Motorschutz3');
    if (E('SA5_VorOrt3')) {
      // Vor-Ort −S30: Rechts/Links mit Selbsthaltung, Halt (Öffner), gegenseitig verriegelt
      if (!E('SF32_Kurve_Halt') || !okK) k.rechts = k.links = false;
      else if (E('SF30_Kurve_Rechts') && !k.links) k.rechts = true;
      else if (E('SF31_Kurve_Links') && !k.rechts) k.links = true;
    } else if (hand) {
      // Handbetrieb (Schaltschranktür): Rollenkurve steht, bedient wird sie nur über die Vor-Ort-Steuerstelle −S30
      k.nachlauf = 0;
      k.rechts = k.links = false;
    } else {
      k.links = false;
      // Korb wartet am Ende von Band 1 oder ist in der Kurve: Kurve läuft mit Nachlauf (Kurvenweg 660 mm ≈ 6 s)
      if (E('BG13_Bandende') || E('BG35_Kurve_Anfang') || E('BG36_Kurve_Ende')) k.nachlauf = 8;
      k.nachlauf = Math.max(0, k.nachlauf - dt);
      // Korb am Kurvenende hält vor der Übergabe, bis Band 2 läuft und am Anfang frei ist
      const amEndeWarten = E('BG36_Kurve_Ende') && (E('BG21_B2_Anfang') || !demo.b2.rechts);
      k.rechts = okK && k.nachlauf > 0 && !amEndeWarten;
    }
    A.QA10_Kurve_Rechts = k.rechts && !k.links;
    A.QA11_Kurve_Links = k.links && !k.rechts;
    A.PF9_VorOrt3 = E('SA5_VorOrt3');
  }
  {
    const q = demo.b2, okB2 = frei && E('FA5_Motorschutz2');
    const T2 = E('BT2_Korbtemperatur') / 27648 * 400;
    const kuehlHalt = E('BG22_B2_Kuehlung') && T2 > 60;
    // Übergabe auf die Kippmulde (Handshake): Korb am Bandende (−BG24), Mulde unten (−BG30) und leer (−BG37/−BG33 frei)
    // → Band 2 und Muldenrollen −MA7 laufen gemeinsam, bis der Korb über −BG37 am Endanschlag −BG33 ankommt (nicht bei Vor-Ort −S40)
    if (E('BG24_B2_Ende') && E('BG30_MM8_unten') && !E('BG37_Kipper_Einlauf') && !E('BG33_Kipper_Korb') && !E('SA6_VorOrt4')) q.mulde = true;
    if (E('BG33_Kipper_Korb') || !E('BG30_MM8_unten') || E('SA6_VorOrt4')) q.mulde = false;
    const uebergabe = (q.mulde || (E('BG37_Kipper_Einlauf') && E('BG30_MM8_unten') && !E('BG33_Kipper_Korb'))) && !E('SA6_VorOrt4') && E('FA8_Motorschutz4');
    if (E('SA4_VorOrt2')) {
      if (!E('SF25_B2_Halt') || !okB2) q.rechts = q.links = false;
      else if (E('SF23_B2_Rechts') && !q.links) q.rechts = true;
      else if (E('SF24_B2_Links') && !q.rechts) q.links = true;
    } else {
      q.links = false;
      if (E('BG21_B2_Anfang') || E('BG22_B2_Kuehlung') || E('BG36_Kurve_Ende') || uebergabe) q.nachlauf = 25;
      q.nachlauf = Math.max(0, q.nachlauf - dt);
      const amEndeWarten = E('BG24_B2_Ende') && !uebergabe && !E('BG21_B2_Anfang') && !E('BG22_B2_Kuehlung');
      q.rechts = okB2 && q.nachlauf > 0 && !kuehlHalt && !amEndeWarten;
    }
    A.QA5_B2_Rechts = q.rechts; A.QA6_B2_Links = q.links;
    A.QA7_Pumpe = E('BG22_B2_Kuehlung') && T2 > 40 && E('BG38_Wasser_Min');   // Abschrecken, solange der Korb heiß ist; Trockenlaufschutz −BG38
    A.MB13_Spruehwasser = A.QA7_Pumpe;
    A.MB14_Luftmesser = q.rechts;                                        // Luftmesser bläst, solange Band 2 vorwärts läuft
    A.PF8_VorOrt2 = E('SA4_VorOrt2');
    // Prüfstation: Kippen, Vibrorinne/Prüfband mit Nachlauf, Kamera je Teil, Ausblasen nach Laufzeit (Schieberegister)
    const p = demo.ps, okM = frei && E('FA8_Motorschutz4');
    // Muldenrollen −MA7: Übernahme von Band 2 (Handshake: Band 2 und Mulde laufen gemeinsam), dann bis −BG33 (Nachlauf höchstens 6 s)
    if (uebergabe) p.mulde = 6;
    p.mulde = E('BG33_Kipper_Korb') ? 0 : Math.max(0, p.mulde - dt);
    A.QA12_Mulde_Vor = okM && E('BG30_MM8_unten') && (uebergabe || p.mulde > 0);
    A.QA13_Mulde_Zurueck = false;
    if (!p.kip && E('BG33_Kipper_Korb') && E('BG37_Kipper_Einlauf') && E('BG30_MM8_unten') && !p.gekippt && frei) { p.kip = true; p.kt = 0; }
    // Ausschüttzeit 3,5 s ab −BG31, damit der Korb ganz leer wird
    if (p.kip) { p.kt = E('BG31_MM8_gekippt') ? p.kt + dt : 0; if (p.kt > 3.5) { p.kip = false; p.gekippt = true; p.nachlauf = 40; } }
    if (!E('BG33_Kipper_Korb')) p.gekippt = false;
    A.MB15_Kippen = p.kip;
    p.nachlauf = Math.max(0, p.nachlauf - dt);
    A.QA8_Vibro = p.nachlauf > 0 && !E('BG34_KLT_voll') && frei;
    A.QA9_Pruefband = A.QA8_Vibro;
    const bg32 = E('BG32_Teil_Pruefplatz');
    A.KF10_Kamera_Trigger = bg32 && !p.bg32Alt; p.bg32Alt = bg32;
    if (E('BG29_Pruefung_niO') && !p.niOAlt) p.ausblasZeiten.push(1.3);          // 200 mm bis zur Düse bei 150 mm/s
    p.niOAlt = E('BG29_Pruefung_niO');
    // Laufzeit bis zur Düse: am Umrichter −TA5 mit der Istdrehzahl (NIST_A), sonst mit Nenngeschwindigkeit
    const vPb = st.antrieb.TA5 === 'fu' ? Math.max(0, E('TA5_NIST_A')) / 0x4000 : (A.QA9_Pruefband ? 1 : 0);
    p.ausblasZeiten = p.ausblasZeiten.map(t => t - vPb * dt);
    A.MB16_Ausblasen = p.ausblasZeiten.some(t => t < 0.12 && t > -0.12);
    p.ausblasZeiten = p.ausblasZeiten.filter(t => t > -0.2);
  }
  if (hand) {
    // Handbetrieb MM5/MM6 (monostabile Ventile): Selbsthaltung, „öffnen“ setzt, „schließen“ setzt zurück
    if (E('SF19_MM5_Oeffnen')) demo.hand5 = true;
    if (E('SF20_MM5_Schliessen')) demo.hand5 = false;
    if (E('SF21_MM6_Schliessen')) demo.hand6 = true;
    if (E('SF22_MM6_Oeffnen')) demo.hand6 = false;
    A.MB9_Anschlag_auf = demo.hand5;
    A.MB10_Vereinzeler_zu = demo.hand6;
    if (E('SF28_MM8_Kippen')) demo.hand8 = true;
    if (E('SF29_MM8_Zurueck')) demo.hand8 = false;
    A.MB15_Kippen = demo.hand8;
    A.QA8_Vibro = A.QA9_Pruefband = false;
    A.QA12_Mulde_Vor = A.QA13_Mulde_Zurueck = false;
  } else { demo.hand5 = false; demo.hand6 = true; demo.hand8 = false; }   // beim Umschalten auf Hand bleibt der Vereinzeler zu
  // Vor-Ort-Steuerstelle −S40 (Schlüssel −SA6): Automatik der Prüfstation ruht
  {
    const p = demo.ps, okM = frei && E('FA8_Motorschutz4');
    if (E('SA6_VorOrt4')) {
      p.kip = false; p.nachlauf = 0; p.mulde = 0;
      // Vibrorinne + Prüfband: EIN −SF34 mit Selbsthaltung, AUS −SF35 (Öffner)
      if (!E('SF35_Pruef_Halt') || !frei) p.voPruef = false;
      else if (E('SF34_Pruef_Ein')) p.voPruef = true;
      A.QA8_Vibro = A.QA9_Pruefband = p.voPruef;
      // Muldenrollen tippen, nur mit Kipper unten
      A.QA12_Mulde_Vor = okM && E('BG30_MM8_unten') && E('SF36_Mulde_Vor') && !E('SF37_Mulde_Zurueck');
      A.QA13_Mulde_Zurueck = okM && E('BG30_MM8_unten') && E('SF37_Mulde_Zurueck') && !E('SF36_Mulde_Vor');
      // Kipper: 5/2 monostabil → Selbsthaltung; Kippen nur mit Korb am Endanschlag −BG33 oder ohne Korb an der Übergabe (−BG24 frei)
      if (E('SF38_Kipper_Kippen') && (E('BG33_Kipper_Korb') || !E('BG24_B2_Ende'))) p.voKip = true;
      if (E('SF39_Kipper_Zurueck') || !frei) p.voKip = false;
      A.MB15_Kippen = p.voKip;
    } else { p.voPruef = false; p.voKip = false; }
    A.PF11_VorOrt4 = E('SA6_VorOrt4');
  }
  // Vor-Ort-Steuerstelle −S50 Prüfband (Schlüssel −SA7, Vorrang vor −S40): EIN −SF45 mit Selbsthaltung, AUS −SF46 (Öffner)
  {
    const p = demo.ps;
    if (E('SA7_VorOrt5')) {
      if (!E('SF46_Pruefband_Aus') || !frei) p.voPb = false;
      else if (E('SF45_Pruefband_Ein')) p.voPb = true;
      A.QA9_Pruefband = p.voPb;
    } else p.voPb = false;
    A.PF16_VorOrt5 = E('SA7_VorOrt5');
  }

  // Antriebe am Umrichter: dieselben Fahrbefehle als Telegramm 1 (wirken nur, wenn der Antrieb auf „Umrichter“ steht)
  telegramm(A, 'TA2', A.QA1_Band_Rechts, A.QA2_Band_Links);
  telegramm(A, 'TA3', A.QA5_B2_Rechts, A.QA6_B2_Links);
  telegramm(A, 'TA4', A.QA10_Kurve_Rechts, A.QA11_Kurve_Links);
  // Prüfband: an −S50 Drehzahl vom Potentiometer −SF47 (0…27648 = 0…100 %)
  telegramm(A, 'TA5', A.QA9_Pruefband, false, E('SA7_VorOrt5') ? Math.round(E('SF47_Pruefband_Drehzahl') / 27648 * 0x4000) : 0x4000);

  // Zinnbad (wirkt nur bei „SPS regelt“): Zweipunktregler 275/285 °C, Nachfüllen 50 → 80 %
  const T = E('BT1_Temperatur') / 27648 * 400, L = E('BL1_Fuellstand') / 27648 * 100;
  if (T < 275) demo.bad.heiz = true;
  if (T > 285) demo.bad.heiz = false;
  if (L < 50) demo.bad.fuell = true;
  if (L > 80) demo.bad.fuell = false;
  A.TB1_Heizung = demo.bad.heiz && frei;
  A.MB11_Nachfuellen = demo.bad.fuell;

  // Kühlwassertank (wirkt nur bei „SPS regelt“): PI-Regler auf 70 % über das Regelventil −MB18,
  // Magnetventil −MB17 gibt frei, solange der Regler Wasser fordert und −BG39 frei ist (Max nicht erreicht)
  const W = E('BL2_Wasserstand') / 27648 * 100, kw = demo.kw, KP = 8, TI = 40;
  const e = 70 - W;
  kw.i = Math.max(0, Math.min(100, kw.i + KP * e / TI * dt));          // Anti-Windup: I-Anteil begrenzt
  const y = Math.max(0, Math.min(100, KP * e + kw.i));
  A.MB17_Nachspeisen = y > 0.5 && E('BG39_Wasser_Max_frei');
  A.MB18_Regelventil = Math.round(y / 100 * 27648);
}

