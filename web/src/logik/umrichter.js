// ----------------------------------------------------------------------------
// Frequenzumrichter SINAMICS G120 (PROFINET) an den Förderern
// Standardtelegramm 1: SPS → Umrichter STW1 + NSOLL_A, Umrichter → SPS ZSW1 + NIST_A.
// Das Telegramm ist dasselbe, mit dem ein TO_SpeedAxis (MC_Power, MC_MoveVelocity, MC_Halt,
// MC_Reset) oder SinaSpeed einen echten G120 fährt. Drehzahlen in Bezug auf die Bezugsdrehzahl
// p2000: 16#4000 = 100 % = 1500 1/min = Bandgeschwindigkeit wie am Netz mit Schütz.
// ----------------------------------------------------------------------------

export const FU_BEZUG = 0x4000;
// Antriebsparameter wie im Umrichter (für alle gleich), Zeiten jeweils von 0 auf Bezugsdrehzahl
export const FU = {
  nMax: 1.5,            // p1082 Maximaldrehzahl 2250 1/min
  hochlauf: 0.3,        // p1120 Hochlaufzeit [s] (der TO bringt sein eigenes Fahrprofil mit)
  ruecklauf: 0.3,       // p1121 Rücklaufzeit [s]
  aus3: 0.1,            // p1135 AUS3-Rücklaufzeit [s] (Schnellhalt)
  auslauf: 2.5,         // Bremsbeschleunigung beim Austrudeln (Impulssperre) in Bezug/s – Reibung von Gurt und Getriebe
  toleranz: 0.03,       // p2163 Soll-Ist-Abweichung für ZSW1.8 (3 %)
};
// Die Umrichter der Anlage: Kennzeichen, Motor, Förderer, Bandgeschwindigkeit bei 100 % (mm/s), Schütze im Schützbetrieb;
// negSperre = p1110 negative Drehrichtung gesperrt (das Prüfband fördert nur vorwärts)
export const UMRICHTER_DATEN = [
  { name: 'TA2', motor: '−MA1', foerderer: 'Band 1', vBezug: 100, schuetz: '−QA1/−QA2' },
  { name: 'TA3', motor: '−MA2', foerderer: 'Band 2', vBezug: 120, schuetz: '−QA5/−QA6' },
  { name: 'TA4', motor: '−MA6', foerderer: 'Rollenkurve', vBezug: 110, schuetz: '−QA10/−QA11' },
  { name: 'TA5', motor: '−MA5', foerderer: 'Prüfband', vBezug: 150, schuetz: '−QA9', negSperre: true },
];

// Zustände nach PROFIdrive: S1 Einschaltsperre, S2 Einschaltbereit, S3 Betriebsbereit, S4 Betrieb,
// S5 Ausschalten (AUS1/AUS3 mit Rampe bis Stillstand)
export const ZUSTAND_TEXT = {
  S1: 'S1 Einschaltsperre', S2: 'S2 Einschaltbereit', S3: 'S3 Betriebsbereit', S4: 'S4 Betrieb',
  AUS1: 'S5 Ausschalten (AUS1)', AUS3: 'S5 Schnellhalt (AUS3)',
};

function umrichterNeu() {
  return { zustand: 'S1', n: 0, nRfg: 0, stoerung: null, warnung: null, stwAlt: 0, stwGueltig: 0, nsollGueltig: 0, sto: false, stw: 0, nsoll: 0, ziel: 0, motorHeiss: false, aus2: false,
    hand: false, handEin: false, handSoll: 0, panelQuitt: false,         // HAND = Führung über das Bedienpanel IOP-2
    iop: { seite: 0, meldung: '', meldungT: 0 } };                       // Anzeige des Bedienpanels
}
export const UMRICHTER = Object.fromEntries(UMRICHTER_DATEN.map(d => [d.name, { ...d, ...umrichterNeu() }]));
export const UMRICHTER_LISTE = Object.values(UMRICHTER);
export function umrichterZuruecksetzen() { for (const fu of UMRICHTER_LISTE) Object.assign(fu, umrichterNeu()); }

const bit = (w, b) => ((w >> b) & 1) === 1;

// Störung im Umrichter auslösen (Fenster „Umrichter“): Überlast Leistungsteil, sofort quittierbar
export function ueberlastAusloesen(fu) { if (!fu.stoerung) fu.stoerung = { nr: 'F30005', text: 'Leistungsteil Überlast I2t' }; }

// Ein Rechenschritt. stw = STW1 (0…65535), nsoll = NSOLL_A (−32768…32767), sto = Safe Torque Off
// über −KF2 angewählt, feldbusAus = kein zyklischer Datenaustausch mit der SPS (Verbindung weg oder CPU in STOP).
// Der Kaltleiter im Motor (fu.motorHeiss) meldet die Warnung A07910 und löst F07011 aus.
export function umrichterSchritt(fu, stw, nsoll, dt, { sto, feldbusAus = false }) {
  const uebertemp = fu.motorHeiss;
  fu.warnung = uebertemp ? { nr: 'A07910', text: 'Motorübertemperatur' } : null;
  // HAND (Taste HAND/AUTO am Bedienpanel): das Panel führt, das Telegramm der SPS wird nicht beachtet.
  // Aus der Einschaltsperre geht es auch hier nur über AUS1 = 0, das erledigt das Panel selbst.
  if (fu.hand) {
    stw = fu.handEin && fu.zustand !== 'S1' ? 0x047F : 0x047E;
    nsoll = Math.round(fu.handSoll * FU_BEZUG);
  }
  // Quittieren am Panel wirkt wie eine Flanke an STW1.7
  if (fu.panelQuitt) { fu.panelQuitt = false; fu.stwAlt &= ~0x0080; stw |= 0x0080 | (fu.hand ? 0 : 0x0400); }
  stw &= 0xFFFF;
  fu.stw = stw; fu.nsoll = nsoll;
  // Ohne Führung durch die SPS (STW1.10 = 0) ignoriert der Umrichter die Prozessdaten vom Feldbus
  // und arbeitet mit den zuletzt übernommenen weiter (Betriebsanleitung CU240E-2, Steuerwort 1)
  if (!fu.hand) {
    if (bit(stw, 10)) { fu.stwGueltig = stw; fu.nsollGueltig = nsoll; } else { stw = fu.stwGueltig; nsoll = fu.nsollGueltig; }
  }
  // Feldbusüberwachung (p2040): ohne Datenaustausch Störung F01910 mit Reaktion AUS3 (Schnellhalt);
  // quittieren lässt sie sich erst, wenn die SPS wieder Daten schickt
  if (feldbusAus && !fu.hand && !fu.stoerung) fu.stoerung = { nr: 'F01910', text: 'Feldbus: Sollwert-Timeout', aus3: true };
  const ein = bit(stw, 0), aus2 = !bit(stw, 1), aus3 = !bit(stw, 2), freigabe = bit(stw, 3);
  const quittFlanke = bit(stw, 7) && !bit(fu.stwAlt, 7);
  fu.stwAlt = stw;
  fu.aus2 = aus2;

  if (uebertemp && !fu.stoerung) fu.stoerung = { nr: 'F07011', text: 'Motorübertemperatur' };
  // Quittieren (Flanke STW1.7): nur wenn die Ursache weg ist; danach Einschaltsperre
  const ursacheDa = (fu.stoerung?.nr === 'F07011' && uebertemp) || (fu.stoerung?.nr === 'F01910' && feldbusAus);
  if (fu.stoerung && quittFlanke && !ursacheDa) { fu.stoerung = null; fu.zustand = 'S1'; }

  // STO hat Vorrang: Impulse sofort gesperrt, danach Einschaltsperre (AUS1 muss erst wieder 0 sein)
  fu.sto = sto;
  const puls = ['S4', 'AUS1', 'AUS3'].includes(fu.zustand);
  if (sto || aus2 || (fu.stoerung && !(fu.stoerung.aus3 && puls))) fu.zustand = 'S1';
  else if (fu.stoerung) fu.zustand = 'AUS3';                              // Störreaktion AUS3: Schnellhalt, danach Impulssperre
  else switch (fu.zustand) {
    case 'S1': if (!ein && !aus3) fu.zustand = 'S2'; break;
    case 'S2': if (aus3) fu.zustand = 'S1'; else if (ein) fu.zustand = 'S3'; break;
    case 'S3':
      if (aus3) fu.zustand = 'S1';
      else if (!ein) fu.zustand = 'S2';
      else if (freigabe) fu.zustand = 'S4';
      break;
    case 'S4':
      if (aus3) fu.zustand = 'AUS3';
      else if (!ein) fu.zustand = 'AUS1';
      else if (!freigabe) fu.zustand = 'S3';          // Impulssperre: Motor trudelt aus
      break;
    case 'AUS1':
      if (aus3) fu.zustand = 'AUS3';
      else if (ein && freigabe && Math.abs(fu.n) > 1e-3) fu.zustand = 'S4';   // Wiedereinschalten während des Rücklaufs
      break;
  }

  const pulse = fu.zustand === 'S4' || fu.zustand === 'AUS1' || fu.zustand === 'AUS3';
  if (pulse) {
    // Hochlaufgeber: STW1.4 = 0 setzt den Ausgang auf 0, STW1.5 = 0 hält ihn an, STW1.6 = 0 Sollwert 0
    let ziel = 0;
    if (fu.zustand === 'S4' && bit(stw, 6)) {
      ziel = nsoll / FU_BEZUG * (bit(stw, 11) ? -1 : 1);
      ziel = Math.max(fu.negSperre ? 0 : -FU.nMax, Math.min(FU.nMax, ziel));
    }
    fu.ziel = ziel;
    const zeit = fu.zustand === 'AUS3' ? FU.aus3 : Math.abs(ziel) > Math.abs(fu.nRfg) && Math.sign(ziel) !== -Math.sign(fu.nRfg) ? FU.hochlauf : FU.ruecklauf;
    if (fu.zustand === 'S4' && !bit(stw, 4)) fu.nRfg = 0;
    else if (fu.zustand !== 'S4' || bit(stw, 5)) {
      const schritt = dt / Math.max(zeit, 1e-3);
      fu.nRfg += Math.max(-schritt, Math.min(schritt, ziel - fu.nRfg));
    }
    fu.n = fu.nRfg;
    // AUS1/AUS3 am Ende der Rampe: Impulse sperren
    if (fu.zustand !== 'S4' && Math.abs(fu.n) < 1e-3) { fu.n = fu.nRfg = 0; fu.zustand = fu.zustand === 'AUS1' ? 'S2' : 'S1'; }
  } else {
    fu.ziel = 0;
    // Impulssperre: Motor trudelt mit der Reibung von Gurt und Getriebe aus
    const schritt = FU.auslauf * dt;
    fu.n = Math.abs(fu.n) <= schritt ? 0 : fu.n - Math.sign(fu.n) * schritt;
    fu.nRfg = fu.n;
  }
  return fu.n;
}

// Zustandswort 1 (r2089[0])
export function zsw1(fu) {
  const z = fu.zustand, n = fu.n;
  let w = 0;
  const setze = (b, v) => { if (v) w |= 1 << b; };
  setze(0, ['S2', 'S3', 'S4', 'AUS1', 'AUS3'].includes(z));         // einschaltbereit
  setze(1, ['S3', 'S4', 'AUS1', 'AUS3'].includes(z));               // betriebsbereit
  setze(2, z === 'S4');                                               // Betrieb freigegeben
  setze(3, !!fu.stoerung);                                            // Störung wirksam
  setze(4, !fu.aus2);                                                 // kein AUS2 aktiv (STO zählt nicht dazu)
  setze(5, z !== 'AUS3');                                             // kein AUS3 aktiv
  setze(6, z === 'S1');                                               // Einschaltsperre aktiv
  setze(7, !!fu.warnung);                                             // Warnung wirksam
  setze(8, Math.abs(fu.ziel - n) <= FU.toleranz);                      // Drehzahl-Soll-Ist-Abweichung im Toleranzbereich
  setze(9, !fu.hand);                                                 // Führung gefordert (nicht in HAND am Panel)
  setze(10, Math.abs(n) >= 1 - 1e-3);                                 // Vergleichswert (p2141 = Bezugsdrehzahl) erreicht
  setze(11, true);                                                    // I-, M- oder P-Grenze nicht erreicht
  setze(12, z === 'S4' || z === 'AUS1' || z === 'AUS3');            // Haltebremse offen
  setze(13, fu.warnung?.nr !== 'A07910');                             // keine Warnung Motorübertemperatur
  setze(14, n > 1e-3);                                                // Motor dreht rechts
  setze(15, true);                                                    // keine Warnung Überlast Umrichter
  return w;
}

// NIST_A, auf den Wertebereich eines INT begrenzt
export function nistA(fu) {
  return Math.max(-32768, Math.min(32767, Math.round(fu.n * FU_BEZUG)));
}
