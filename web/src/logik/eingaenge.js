import { FUELL_MIN, KW, NOT_HALT, QUITT, TEMP_SOLL, WASSER_MAX, WASSER_MIN, ZYL_LISTE, st } from './zustand.js';
import { BAND, BAND2, KURVE, LS_POS, STOPPER, TROMMEL_R } from '../anlage/baender.js';
import { MM8, ST } from '../anlage/pruefstation.js';
import { kipperKorb, koerbe } from '../anlage/koerbe.js';
import { UMRICHTER, nistA, zsw1 } from './umrichter.js';

// ----------------------------------------------------------------------------
// Signale lesen
// ----------------------------------------------------------------------------
export function ausgang(name) {
  return st.modus === 'sps' ? !!st.spsAusgaenge[name] : !!st.demoAusgaenge[name];
}
// Ventile, Schütze und das Halbleiterrelais hängen hinter dem Sicherheitsrelais −KF2:
// bei Not-Halt sind sie spannungslos, auch wenn die SPS den Ausgang noch setzt
const KF2_GESCHALTET = /^(MB\d+|QA\d+|TB\d)_/;
export function wirksam(name) { return ausgang(name) && (st.kf2 || !KF2_GESCHALTET.test(name)); }
// Wortausgänge (%QW, Int −32768…32767), z. B. das Telegramm zu einem Umrichter
export function ausgangWort(name) {
  const v = st.modus === 'sps' ? st.spsAusgaenge[name] : st.demoAusgaenge[name];
  return typeof v === 'number' ? v : 0;
}
export const istAnalog = (s) => /^%?\s*[IEQA]W/i.test(s.adresse || '');
const alsInt = (w) => (w << 16) >> 16;                 // 16 Bit als INT (die Bridge schreibt −32768…32767)
// Lichtschranken: 1, solange der Korbkörper (110 mm, ±55 um die Korbmitte) den Strahl an der Stelle LS_POS unterbricht
function korbAn(z0, b = 55) { return koerbe.some(k => k.zustand === 'band' && Math.abs(k.z - z0) < b); }
function korbAmBand() { return korbAn(LS_POS.BG11_Korb); }
function korb2An(x0, b = 55) { return koerbe.some(k => k.zustand === 'band2' && Math.abs(k.x - x0) < b); }
// Kurve: Bogenlänge s, über die Stoßstellen hinaus fortgesetzt (Korb noch auf Band 1 bzw. schon auf Band 2)
const kurvenS = (k) => k.zustand === 'kurve' ? k.s : k.zustand === 'band' ? k.z - KURVE.zA : k.zustand === 'band2' ? KURVE.L + k.x - KURVE.R : NaN;
function korbKurveAn(s0, b = 55) { return koerbe.some(k => Math.abs(kurvenS(k) - s0) < b); }
// −BG24 sitzt fest am Kopf von Band 2: sieht auch den Korb, der schon von den Muldenrollen gezogen wird (Mulde unten)
function korbBandEnde() { const k = kipperKorb(), x = LS_POS.BG24_B2_Ende; return korb2An(x) || (!!k && MM8.pos < 0.02 && Math.abs(k.kx - x) < 55); }
// −BG37 schwenkt mit der Mulde: sieht den Korb in jeder Kippstellung
function korbMuldeEinlauf() { const k = kipperKorb(); return !!k && Math.abs(k.kx - ST.bg37X) < 55; }
export function korbAmPyrometer() { return koerbe.find(k => k.zustand === 'band2' && Math.abs(k.x - 1300) < 60); }
function geber2Phase(versatz) { const n = BAND2.weg / (GEBER.mmProUmdrehung / GEBER.impulse) + versatz; return n - Math.floor(n); }
// Inkrementalgeber −BG18 an der Umlenktrommel: 10 Impulse je Umdrehung, Spur B um 1/4 Impuls versetzt
const GEBER = { impulse: 10, mmProUmdrehung: 2 * Math.PI * (TROMMEL_R + 3) };
function geberPhase(versatz) { const n = BAND.weg / (GEBER.mmProUmdrehung / GEBER.impulse) + versatz; return n - Math.floor(n); }
const analog = (v, max) => Math.round(Math.max(0, Math.min(1, v / max)) * 27648);
function rohEingang(name) {
  const tg = /^(TA\d)_(ZSW1|NIST_A)$/.exec(name);                  // Telegramm 1 der Umrichter
  if (tg && UMRICHTER[tg[1]]) return tg[2] === 'ZSW1' ? alsInt(zsw1(UMRICHTER[tg[1]])) : nistA(UMRICHTER[tg[1]]);
  for (const n of NOT_HALT) if (name === n.signal) return !st.notHalt[n.key];     // Meldekontakt Öffner: 1 = entriegelt
  for (const q of QUITT) if (name === q.signal) return st.bedien[q.key];          // Quittiertaster (Schließer)
  for (const c of ZYL_LISTE) {
    if (name === c.s0) return c.an0;
    if (name === c.s1) return c.an1;
  }
  switch (name) {
    case 'BG9_Temperatur': return st.temp >= TEMP_SOLL;
    case 'BG10_Fuellhoehe': return st.fuell >= FUELL_MIN;
    case 'BG11_Korb': return korbAmBand();
    case 'BG40_Korb_am_Anschlag': return BAND.anschlagDruck > STOPPER.BG40_AB;   // Leiste −MM5 eingedrückt: Korb liegt an
    case 'BG12_Bandanfang': return korbAn(LS_POS.BG12_Bandanfang);
    case 'BG13_Bandende': return korbAn(LS_POS.BG13_Bandende);
    case 'SF1_Start': return st.bedien.sf1;
    case 'SF2_Stop': return st.sf2Oeffner ? !st.bedien.sf2 : st.bedien.sf2;
    case 'SA3_Handbetrieb': return st.sa3;
    case 'SF11_MM1_Einhaengen': return st.bedien.sf11;
    case 'SF12_MM1_Loesen': return st.bedien.sf12;
    case 'SF13_MM2_Senken': return st.bedien.sf13;
    case 'SF14_MM2_Anheben': return st.bedien.sf14;
    case 'SF15_MM3_Zinnbad': return st.bedien.sf15;
    case 'SF16_MM3_Band': return st.bedien.sf16;
    case 'SF17_MM4_Schliessen': return st.bedien.sf17;
    case 'SF18_MM4_Oeffnen': return st.bedien.sf18;
    case 'KF2_NotHalt_OK': return st.kf2;
    case 'SA1_Dauerbetrieb': return st.sa1;
    case 'SA2_VorOrt': return st.sa2;
    case 'SF5_Band_Rechts': return st.bedien.sf5;
    case 'SF6_Band_Links': return st.bedien.sf6;
    case 'SF7_Band_Halt': return !st.bedien.sf7;
    case 'FA1_Motorschutz': return st.fa1Ok;
    case 'BG14_MM5_zu': return BAND.anschlagPos < 0.08;
    case 'BG15_MM5_offen': return BAND.anschlagPos > 0.92;
    case 'BG16_MM6_zu': return BAND.vereinzelerPos < 0.08;
    case 'BG17_MM6_offen': return BAND.vereinzelerPos > 0.92;
    case 'BG18_Geber_A': return geberPhase(0) < 0.5;
    case 'BG18_Geber_B': return geberPhase(0.25) < 0.5;
    case 'BG18_Geber_N': { const u = BAND.weg / GEBER.mmProUmdrehung; return u - Math.floor(u) < 0.05; }
    case 'SF19_MM5_Oeffnen': return st.bedien.sf19;
    case 'SF20_MM5_Schliessen': return st.bedien.sf20;
    case 'SF21_MM6_Schliessen': return st.bedien.sf21;
    case 'SF22_MM6_Oeffnen': return st.bedien.sf22;
    case 'SF28_MM8_Kippen': return st.bedien.sf28;
    case 'SF29_MM8_Zurueck': return st.bedien.sf29;
    case 'BG20_Lichtvorhang_frei': return !st.eingriff;
    case 'BG21_B2_Anfang': return korb2An(LS_POS.BG21_B2_Anfang);
    case 'BG22_B2_Kuehlung': return korb2An(LS_POS.BG22_B2_Kuehlung);
    case 'BG32_Teil_Pruefplatz': return ST.teile.some(t => t.zustand === 'band' && Math.abs(t.x - ST.kamX) < 8);
    case 'BG30_MM8_unten': return MM8.an0;
    case 'BG31_MM8_gekippt': return MM8.an1;
    case 'BG33_Kipper_Korb': { const k = kipperKorb(); return !!k && k.kx >= ST.korbX - 2; }
    case 'BG34_KLT_voll': return ST.klt >= ST.kltVoll;
    case 'BG37_Kipper_Einlauf': return korbMuldeEinlauf();
    case 'BG24_B2_Ende': return korbBandEnde();
    case 'BG35_Kurve_Anfang': return korbKurveAn(LS_POS.BG35_Kurve_Anfang);
    case 'BG36_Kurve_Ende': return korbKurveAn(LS_POS.BG36_Kurve_Ende);
    case 'SA5_VorOrt3': return st.sa5;
    case 'SF30_Kurve_Rechts': return st.bedien.sf30;
    case 'SF31_Kurve_Links': return st.bedien.sf31;
    case 'SF32_Kurve_Halt': return !st.bedien.sf32;
    case 'FA7_Motorschutz3': return st.fa7Ok;
    case 'SA6_VorOrt4': return st.sa6;
    case 'SF34_Pruef_Ein': return st.bedien.sf34;
    case 'SF35_Pruef_Halt': return !st.bedien.sf35;
    case 'SF36_Mulde_Vor': return st.bedien.sf36;
    case 'SF37_Mulde_Zurueck': return st.bedien.sf37;
    case 'SF38_Kipper_Kippen': return st.bedien.sf38;
    case 'SF39_Kipper_Zurueck': return st.bedien.sf39;
    case 'SA7_VorOrt5': return st.sa7;
    case 'SF45_Pruefband_Ein': return st.bedien.sf45;
    case 'SF46_Pruefband_Aus': return !st.bedien.sf46;
    case 'SF47_Pruefband_Drehzahl': return analog(st.pbPoti, 1);
    case 'FA8_Motorschutz4': return st.fa8Ok;
    case 'BG27_Geber2_A': return geber2Phase(0) < 0.5;
    case 'BG27_Geber2_B': return geber2Phase(0.25) < 0.5;
    case 'BG27_Geber2_N': { const u = BAND2.weg / GEBER.mmProUmdrehung; return u - Math.floor(u) < 0.05; }
    case 'BG28_Pruefung_iO': return ST.ergebnisT > 0 && ST.ergebnis === 'iO';
    case 'BG29_Pruefung_niO': return ST.ergebnisT > 0 && ST.ergebnis === 'niO';
    case 'SA4_VorOrt2': return st.sa4;
    case 'SF23_B2_Rechts': return st.bedien.sf23;
    case 'SF24_B2_Links': return st.bedien.sf24;
    case 'SF25_B2_Halt': return !st.bedien.sf25;
    case 'FA5_Motorschutz2': return st.fa5Ok;
    case 'BT2_Korbtemperatur': { const k = korbAmPyrometer(); return analog(k ? k.temp : 25, 400); }
    case 'BT1_Temperatur': return analog(st.temp, 400);
    case 'BL1_Fuellstand': return analog(st.fuell, 100);
    case 'BL2_Wasserstand': return analog(st.wasser, 100);
    case 'MB18_Stellung': return analog(KW.y, 1);
    case 'BG38_Wasser_Min': return st.wasser >= WASSER_MIN;
    case 'BG39_Wasser_Max_frei': return st.wasser < WASSER_MAX;       // MAX-Sicherheit: Gabel frei = 1
    default: return false;
  }
}
export function eingang(name) {
  return name in st.force ? st.force[name] : rohEingang(name);
}

