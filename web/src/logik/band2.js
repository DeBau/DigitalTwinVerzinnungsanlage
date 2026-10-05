import { st } from './zustand.js';
import { fmt0 } from '../core/format.js';
import { BAND2, KORB_TEILUNG } from '../anlage/baender.js';
import { E2 } from '../anlage/band2.js';
import { KUEHL } from '../anlage/kuehlung.js';
import { MM8, MULDE, ST } from '../anlage/pruefstation.js';
import { TEILE_JE_KORB, kipperKorb, koerbe } from '../anlage/koerbe.js';
import { ereignis } from '../ui/ereignisse.js';
import { t } from '../core/sprache.js';
import { wirksam } from './eingaenge.js';
import { UEBERGABE, gemeinsam, kurveAuslauf, rollenkurve, vBand2, wartetAufBand2 } from './rollenkurve.js';


let blockMulde = 0;
// Rollenkurve −MA6 und Band 2: Kühlstrecke (−MA3, −BT2), Kamera-Prüfplatz (−KF10), Entnahme am Bandende
export function uebergabeUndBand2(dt) {
  const auto = st.betriebBand === 'auto' && !st.sa3;
  rollenkurve(dt);
  const b2 = koerbe.filter(k => k.zustand === 'band2');
  // Band 2: Antrieb
  const temp = (k) => k.temp;
  let vZiel;
  if (st.sa4) {
    const vo = BAND2.vorOrt;                                         // Vor-Ort-Steuerstelle −S20 (in beiden Übungsumfängen bei Schlüssel = 1 über SPS/Bandmodul)
    if (auto) {
      if (st.bedien.sf25 || !st.kf2 || !st.fa5Ok) vo.r = vo.l = false;
      else if (st.bedien.sf23 && !vo.l) vo.r = true;
      else if (st.bedien.sf24 && !vo.r) vo.l = true;
      BAND2.wende = vo.r ? 1 : vo.l ? -1 : 0;
    }
  } else BAND2.vorOrt.r = BAND2.vorOrt.l = false;
  if (auto && !st.sa4) {
    const kuehl = b2.find(k => Math.abs(k.x - 1300) < 55 && temp(k) > 60);
    const g = band2Grenzen(b2);
    const kipFrei = !kipperKorb() && MM8.an0;
    const bedarf = b2.some(k => k.x < g.get(k).max - 0.5) || wartetAufBand2() || (kipFrei && !st.sa6 && b2.some(k => k.x >= E2 - 1)) || (kipperKorb() && kipperKorb().kx < E2 + UEBERGABE);
    BAND2.wende = bedarf && !kuehl && st.kf2 ? 1 : 0;
    const imTunnel = b2.some(k => k.x > KUEHL.x0 && k.x < KUEHL.x1 && temp(k) > 45);
    BAND2.pumpe = imTunnel ? 1 : 0; BAND2.spruehen = imTunnel ? 1 : 0;
    BAND2.blasen = BAND2.v > 1 && b2.some(k => k.x > 1550 && k.x < 1850) ? 1 : 0;
  } else if (!auto) {
    let r = wirksam('QA5_B2_Rechts'), l = wirksam('QA6_B2_Links');
    if (r && l) { ereignis('Wendeschütz Band 2: Rechts- und Linkslauf gleichzeitig angesteuert', 'err', 'wende2'); r = BAND2.wende > 0; l = BAND2.wende < 0; }
    BAND2.wende = st.fa5Ok ? (r ? 1 : l ? -1 : 0) : 0;
    BAND2.pumpe = wirksam('QA7_Pumpe') && st.fa5Ok ? 1 : 0;
    BAND2.spruehen = wirksam('MB13_Spruehwasser') && BAND2.pumpe ? 1 : 0;   // ohne Pumpe kein Druck
    BAND2.blasen = wirksam('MB14_Luftmesser') ? 1 : 0;
  }
  if (auto && st.sa4) BAND2.pumpe = BAND2.spruehen = BAND2.blasen = 0;
  vZiel = BAND2.wende * BAND2.vSoll;
  BAND2.v += Math.max(-BAND2.a * dt, Math.min(BAND2.a * dt, vZiel - BAND2.v));
  BAND2.weg += BAND2.v * dt;
  const g2 = band2Grenzen(b2);
  for (const k of b2) {
    const g = g2.get(k);
    k.x = Math.max(Math.min(k.x, g.min), Math.min(Math.max(k.x, g.max), k.x + vBand2(k) * dt));
    // Übergabe auf die Kippmulde: nur wenn Band 2 UND die Muldenrollen −MA7 vorwärts laufen und die Mulde unten und leer ist
    if (k.x >= E2 - 0.5 && BAND2.v > 1 && MULDE.v > 1 && !kipperKorb() && MM8.pos < 0.02) {
      k.zustand = 'kipper'; k.kx = E2; k.rest = TEILE_JE_KORB; k.entleert = false;
      if (k.temp > 60) ereignis(t`Korb ${k.nr} kommt mit ${fmt0.format(k.temp)} °C zum Kipper (nicht ausreichend abgeschreckt)`, 'err');
      ST.kipper.add(k.g);
    }
  }
  // Korb auf der Mulde: im Übergabebereich (Korbmitte < E2 + 60) gemeinsam mit Band 2, danach nur von den Muldenrollen bewegt
  const kk = kipperKorb();
  if (kk && MM8.pos < 0.02) {
    const v = kk.kx < E2 + UEBERGABE ? gemeinsam(BAND2.v, MULDE.v) : MULDE.v;
    kk.kx = Math.max(E2, Math.min(ST.korbX, kk.kx + v * dt));
  }
  // Hinweis im Übungsumfang „SPS“: Korb hängt an der Übergabe Band 2 → Mulde, weil nur ein Förderer läuft
  if (!auto) {
    const amEnde = !kk && MM8.pos < 0.02 ? b2.find(k => k.x >= E2 - 1 && BAND2.v > 1 && MULDE.v < 1) : null;
    const haengt = amEnde || (kk && MM8.pos < 0.02 && kk.kx < E2 + UEBERGABE && (BAND2.v > 1) !== (MULDE.v > 1) ? kk : null);
    blockMulde = haengt ? blockMulde + dt : 0;
    if (blockMulde > 4) { ereignis(t`Korb ${haengt.nr} hängt an der Übergabe Band 2 → Kippmulde: Band 2 (−QA5) und Muldenrollen (−QA12) müssen laufen`, 'err', 'uebergabeMulde'); blockMulde = 0; }
  } else blockMulde = 0;
  // Abkühlen: an Luft langsam (Korb voller Teile, ca. 3 min), im Sprühwasser schnell (Abschrecken, ca. 4 s);
  // gesprühte Körbe sind nass, das Luftmesser bläst sie trocken, an Luft trocknen sie nur langsam
  for (const k of koerbe) {
    const imSpray = k.zustand === 'band2' && k.x > KUEHL.x0 + 40 && k.x < KUEHL.x1 - 40 && BAND2.spruehen > 0.5;
    if (k.zustand !== 'haken' || !k.imBad) k.temp += (20 - k.temp) * Math.min(1, dt / (imSpray ? 4 : 180));
    if (imSpray) k.nass = 1;
    else if (k.nass > 0) {
      const amMesser = k.zustand === 'band2' && Math.abs(k.x - 1690) < 70 && BAND2.blasen > 0.5;
      k.nass = Math.max(0, k.nass - dt * (amMesser ? 1.2 : 0.01));
    }
  }
}
// Abstand auf Band 2: der Korb ist in der Kurve um 90° gedreht, die Kufen liegen in Förderrichtung (Teilung 150 mm)
function band2Grenzen(liste) {
  const m = new Map(), vor = [...liste].sort((a, b) => b.x - a.x);
  let vorne = kipperKorb() ? kipperKorb().kx : Infinity;               // Korb, der noch im Übergabebereich der Mulde steht
  for (const k of vor) { m.set(k, { max: Math.min(vorne - KORB_TEILUNG, E2), min: -Infinity }); vorne = k.x; }
  let hinten = kurveAuslauf() - KORB_TEILUNG;
  for (const k of [...vor].reverse()) { m.get(k).min = hinten + KORB_TEILUNG; hinten = k.x; }
  return m;
}
