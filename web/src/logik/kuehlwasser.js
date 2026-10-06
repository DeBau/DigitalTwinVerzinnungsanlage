import { KW, WASSER_MIN, WASSER_SAUG, st } from './zustand.js';
import { ausgangWort, wirksam } from './eingaenge.js';
import { BAND2 } from '../anlage/baender.js';
import { KUEHL } from '../anlage/kuehlung.js';
import { koerbe } from '../anlage/koerbe.js';
import { ereignis } from '../ui/ereignisse.js';

// ----------------------------------------------------------------------------
// Kühlwassertank der Sprühkühlung (ca. 17 l): Verbrauch beim Abschrecken, Ablasshahn, Nachspeisung
// über Magnetventil −MB17 (Absperrung) und Regelventil −MB18 in Reihe, Trockenlauf der Pumpe −MA3.
// Übungsumfang „automatisch“: der Niveauregler am Tank speist zwischen 55 und 75 % nach und sperrt die
// Pumpe unter −BG38. „SPS regelt“: −MB17/−MB18 kommen aus dem Programm, der Trockenlaufschutz auch.
// ----------------------------------------------------------------------------
const ZULAUF = 1.5;          // %/s bei −MB17 offen und −MB18 100 % (Leitungsdruck konstant)
const STELLZEIT = 8;         // s für 0…100 % am Regelventil
export function kuehlwasser(dt) {
  const auto = st.betriebWasser === 'auto';
  // Nachspeisung
  let yZiel;
  if (auto) {
    if (st.wasser < 55) KW.regelEin = true;
    if (st.wasser > 75) KW.regelEin = false;
    KW.mb17 = KW.regelEin && st.kf2;
    yZiel = KW.regelEin ? 1 : 0;
  } else {
    KW.mb17 = wirksam('MB17_Nachspeisen');                                  // hinter −KF2: bei Not-Halt zu
    yZiel = Math.max(0, Math.min(1, ausgangWort('MB18_Regelventil') / 27648));
  }
  const schritt = dt / STELLZEIT;
  KW.y += Math.max(-schritt, Math.min(schritt, yZiel - KW.y));
  KW.zulauf = KW.mb17 ? ZULAUF * KW.y : 0;
  if (!auto && KW.mb17 && KW.y < 0.02) {
    KW.ohneFluss += dt;
    if (KW.ohneFluss > 10) { ereignis('Nachspeisen: −MB17 ist offen, aber das Regelventil −MB18 steht auf 0 % – es fließt kein Wasser', '', 'kwOhneFluss'); KW.ohneFluss = 0; }
  } else KW.ohneFluss = 0;

  // Trockenlaufschutz im Niveauregler: Pumpe unter −BG38 gesperrt, frei ab 5 % darüber
  if (auto) {
    if (st.wasser < WASSER_MIN) KW.sperre = true;
    if (st.wasser > WASSER_MIN + 5) KW.sperre = false;
    if (KW.sperre && BAND2.pumpe > 0.5) {
      BAND2.pumpe = 0;
      if (!KW.sperreGemeldet) ereignis('Trockenlaufschutz −BG38: Umwälzpumpe −MA3 gesperrt, bis der Tank nachgespeist ist');
      KW.sperreGemeldet = true;
    }
    if (!KW.sperre) KW.sperreGemeldet = false;
  } else KW.sperre = false;
  if (!BAND2.pumpe) BAND2.spruehen = 0;
  // Unter dem Saugstutzen zieht die Pumpe Luft: kein Sprühwasser
  const trocken = BAND2.pumpe > 0.5 && st.wasser < WASSER_SAUG;
  if (trocken) {
    BAND2.spruehen = 0;
    if (!KW.trocken) ereignis('Umwälzpumpe −MA3 läuft trocken: Kühlwassertank leer, kein Sprühwasser', 'err');
  }
  KW.trocken = trocken;

  // Verbrauch: Sprühnebel und nasse Körbe tragen Wasser aus, heiße Körbe verdampfen zusätzlich
  let heiss = 0;
  for (const k of koerbe) if (k.zustand === 'band2' && k.x > KUEHL.x0 && k.x < KUEHL.x1) heiss += Math.max(0, k.temp - 100);
  KW.verbrauch = BAND2.spruehen > 0.5 ? 0.3 + heiss / 300 * 0.5 : 0;
  KW.ablauf = st.ablass ? 1.2 * Math.sqrt(Math.max(0, st.wasser) / 100) : 0;   // Ablasshahn: Ausfluss nach Torricelli
  st.wasser += (KW.zulauf - KW.verbrauch - KW.ablauf) * dt;
  if (st.wasser < 0) st.wasser = 0;
  if (st.wasser > 100) {
    st.wasser = 100;
    ereignis(auto ? 'Kühlwassertank läuft über' : 'Kühlwassertank läuft über: Nachspeisung nicht rechtzeitig geschlossen (−BG39)', 'err', 'kwUeberlauf');
  }
}
