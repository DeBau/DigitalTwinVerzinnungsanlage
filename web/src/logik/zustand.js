import { t } from '../core/sprache.js';

// Zylinder: Stellung 0/1 wie im Weg-Schritt-Diagramm, x = Kolbenweg in mm
// aus = Spule 14 (Kolbenseite belüftet, fährt aus), ein = Spule 12 (Stangenseite, fährt ein)
export const ZYL = {
  MM1: { kurz: 'MM1', aus: 'MB2_Loesen', ein: 'MB1_Einhaengen', s0: 'BG1_MM1_eingehaengt', s1: 'BG2_MM1_geloest', hub: 25, zeit: 0.35, x: 25, ventil: 1 },
  MM2: { kurz: 'MM2', aus: 'MB3_Senken', ein: 'MB4_Anheben', s0: 'BG3_MM2_oben', s1: 'BG4_MM2_unten', hub: 300, zeit: 1.5, x: 300, ventil: 1 },
  MM3: { kurz: 'MM3', aus: 'MB5_Zinnbad', ein: 'MB6_Foerderband', s0: 'BG5_MM3_Band', s1: 'BG6_MM3_Bad', hub: 430, zeit: 2.4, x: 0, ventil: -1 },
  MM4: { kurz: 'MM4', aus: 'MB7_Schliessen', ein: 'MB8_Oeffnen', s0: 'BG7_MM4_offen', s1: 'BG8_MM4_zu', hub: 320, zeit: 1.1, x: 320, ventil: 1 },
};
export const ZYL_LISTE = Object.values(ZYL);
for (const c of ZYL_LISTE) {
  Object.defineProperty(c, 'pos', { get() { return this.x / this.hub; } });
  Object.assign(c, { v: 0, verz: 0, an0: c.x <= 0, an1: c.x >= c.hub });
}
export const SCHALT_EIN = 3.0, SCHALT_AUS = 4.5;   // Schaltpunkt der Nutsensoren vor der Endlage (mm), Hysterese

export const TEMP_SOLL = 250;
export const FUELL_MIN = 40;
export const TAUCH_SOLL = 10;
export const TROPF_SOLL = 10;
// Kühlwassertank der Sprühkühlung: Grenzschalter Liquiphant FTL31 −BG38 (MIN-Sicherheit, Trockenlaufschutz) und −BG39 (MAX-Sicherheit), Saugstutzen der Pumpe
export const WASSER_MIN = 25, WASSER_MAX = 90, WASSER_SAUG = 8;
// Nachspeisung: Magnetventil −MB17 (Absperrung) in Reihe mit dem Regelventil −MB18 (Stellantrieb 0…100 %, Stellzeit 8 s)
export const KW = { y: 0, mb17: false, zulauf: 0, verbrauch: 0, ablauf: 0, regelEin: false, sperre: false, sperreGemeldet: false, trocken: false, ohneFluss: 0 };

// Not-Halt-Taster: harte Abschaltung über −KF2, je Taster ein Meldekontakt (Öffner) auf einen SPS-Eingang
export const NOT_HALT = [
  { key: 'sf0', signal: 'SF0_NotHalt_frei', bmk: '−SF0', ort: 'Bedienpult', quitt: '−SF4' },
  { key: 'sf8', signal: 'SF8_NotHalt_frei', bmk: '−SF8', ort: 'Band 1', quitt: '−SF41' },
  { key: 'sf9', signal: 'SF9_NotHalt_frei', bmk: '−SF9', ort: 'Band 2', quitt: '−SF42' },
  { key: 'sf10', signal: 'SF10_NotHalt_frei', bmk: '−SF10', ort: 'Rollenkurve', quitt: '−SF43' },
  { key: 'sf33', signal: 'SF33_NotHalt_frei', bmk: '−SF33', ort: 'Prüfstation', quitt: '−SF44' },
];
// Quittiertaster (Schließer): alle parallel am Reset-Eingang von −KF2, je Taster ein eigener SPS-Eingang (Ort der Quittierung)
// und ein eigener Ausgang für den Leuchtmelder im Taster (blinkt bei Quittierbedarf)
export const QUITT = [
  { key: 'sf4', signal: 'SF4_Quittieren', bmk: '−SF4', ort: 'am Bedienpult', pf: 'PF5_Quittieren' },
  { key: 'sf41', signal: 'SF41_Quittieren_S10', bmk: '−SF41', ort: 'an −S10', pf: 'PF12_Quitt_S10' },
  { key: 'sf42', signal: 'SF42_Quittieren_S20', bmk: '−SF42', ort: 'an −S20', pf: 'PF13_Quitt_S20' },
  { key: 'sf43', signal: 'SF43_Quittieren_S30', bmk: '−SF43', ort: 'an −S30', pf: 'PF14_Quitt_S30' },
  { key: 'sf44', signal: 'SF44_Quittieren_S40', bmk: '−SF44', ort: 'an −S40', pf: 'PF15_Quitt_S40' },
];
export const notHaltText = (liste) => liste.map(n => `${n.bmk} (${t(n.ort)})`).join(', ');   // Ort in der Sprache der Oberfläche

export const st = {
  modus: 'demo', modusManuell: false,
  bridgeOffen: false, plcVerbunden: false, plcZustand: 'getrennt', plcText: '',
  steuernd: true, offeneZwillinge: 1,     // false = eine andere Registerkarte steuert (nur beobachten)
  spsAusgaenge: {}, demoAusgaenge: {},
  bedien: { sf1: false, sf2: false, sf4: false, sf5: false, sf6: false, sf7: false, sf11: false, sf12: false, sf13: false, sf14: false, sf15: false, sf16: false, sf17: false, sf18: false, sf19: false, sf20: false, sf21: false, sf22: false, sf23: false, sf24: false, sf25: false, sf28: false, sf29: false, sf30: false, sf31: false, sf32: false, sf34: false, sf35: false, sf36: false, sf37: false, sf38: false, sf39: false, sf41: false, sf42: false, sf43: false, sf44: false, sf45: false, sf46: false },
  sf2Oeffner: true,
  force: {},
  temp: 266, heizung: true, fuell: 62,
  betriebBand: 'auto', betriebBad: 'auto', betriebWasser: 'auto',   // Übungsumfang: 'auto' = Anlage regelt selbst, 'sps' = SPS-Programm
  wasser: 70, ablass: false,                               // Kühlwassertank: Füllstand in %, Ablasshahn offen
  antrieb: { TA2: 'schuetz', TA3: 'schuetz', TA4: 'schuetz', TA5: 'schuetz' },   // je Förderer 'schuetz' oder 'fu' = Umrichter (Telegramm 1)
  notHalt: { sf0: false, sf8: false, sf9: false, sf10: false, sf33: false }, kf2: true, sf4Alt: false, eingriff: false,
  sa1: true, sa2: false, sa3: false, sa4: false, sa5: false, sa6: false, sa7: false, fa1Ok: true, fa5Ok: true, fa7Ok: true, fa8Ok: true,
  heizElement: 0.76, heizU: 0, regelEin: false,
  pbPoti: 1,                                               // Drehzahlpotentiometer −SF47 an −S50 (0…1 = 0…100 %)
  zufuhr: true, speed: 1, verzinnt: 0,
  stoerungBis: 0,
};

