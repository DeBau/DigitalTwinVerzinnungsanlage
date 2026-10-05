import { st } from './zustand.js';
import { BAND, BAND2, KORB_TEILUNG, KURVE } from '../anlage/baender.js';
import { koerbe } from '../anlage/koerbe.js';
import { ereignis } from '../ui/ereignisse.js';
import { t } from '../core/sprache.js';
import { wirksam } from './eingaenge.js';

// ----------------------------------------------------------------------------
// Rollenkurve −MA6 (90°-Kurvenrollenbahn zwischen Band 1 und Band 2)
// Körbe in der Kurve: zustand 'kurve', k.s = Bogenlänge der Korbmitte auf der Mittellinie (0 … KURVE.L).
// Übergabebereich: Korbmitte ±60 mm um die Stoßstelle. Dort liegt der Korb auf beiden Förderern und
// bewegt sich nur, wenn beide in dieselbe Richtung laufen (mit der langsameren Geschwindigkeit).
// Wegkoordinate entlang der Linie: Band 1 z, Kurve zA + s, Band 2 zA + L + (x − R) – Abstand 150 mm (Stoßpuffer).
// ----------------------------------------------------------------------------
export const UEBERGABE = 60;
export function gemeinsam(a, b) { return a > 0 && b > 0 ? Math.min(a, b) : a < 0 && b < 0 ? Math.max(a, b) : 0; }
export const kurvenKoerbe = () => koerbe.filter(k => k.zustand === 'kurve');
// Geschwindigkeit eines Korbs auf Band 1 bzw. Band 2 (im Übergabebereich gemeinsam mit der Kurve)
export function vBand1(k) { return k.z > KURVE.zA - UEBERGABE ? gemeinsam(BAND.v, KURVE.v) : BAND.v; }
export function vBand2(k) { return k.x < KURVE.R + UEBERGABE ? gemeinsam(KURVE.v, BAND2.v) : BAND2.v; }
function vKurve(k) { return k.s < UEBERGABE ? gemeinsam(BAND.v, KURVE.v) : k.s > KURVE.L - UEBERGABE ? gemeinsam(KURVE.v, BAND2.v) : KURVE.v; }
// Grenze für den vordersten Korb auf Band 1 (z) und den hintersten auf Band 2 (x): Abstand zu den Körben in der Kurve
export function kurveEinlauf() { const s = Math.min(...kurvenKoerbe().map(k => k.s)); return KURVE.zA + s - KORB_TEILUNG; }
export function kurveAuslauf() { const s = Math.max(...kurvenKoerbe().map(k => k.s)); return KURVE.R + s - KURVE.L + KORB_TEILUNG; }
// Korb steht im Übergabebereich am Kurvenende und wartet auf Band 2
export const wartetAufBand2 = () => kurvenKoerbe().some(k => k.s > KURVE.L - UEBERGABE - 1);
function kurvenGrenzen() {
  const kk = kurvenKoerbe().sort((a, b) => b.s - a.s), m = new Map();
  let vorne = Math.min(...koerbe.filter(k => k.zustand === 'band2').map(k => KURVE.L + k.x - KURVE.R));
  for (const k of kk) { m.set(k, { max: vorne - KORB_TEILUNG, min: -Infinity }); vorne = k.s; }
  let hinten = Math.max(...koerbe.filter(k => k.zustand === 'band').map(k => k.z - KURVE.zA));
  for (const k of [...kk].reverse()) { m.get(k).min = hinten + KORB_TEILUNG; hinten = k.s; }
  return { kk, m };
}
let blockT = 0;
export function rollenkurveZuruecksetzen() { Object.assign(KURVE, { v: 0, wende: 0 }); KURVE.vorOrt.r = KURVE.vorOrt.l = false; blockT = 0; }
export function rollenkurve(dt) {
  const auto = st.betriebBand === 'auto' && !st.sa3;                 // Handbetrieb −SA3: SPS-Ausgänge (Kurve nur über −S30, kein Tableau-Taster)
  // Übergänge: Korbmitte über die Stoßstelle Band 1 → Kurve bzw. (rückwärts) Band 2 → Kurve
  for (const k of koerbe) {
    if (k.zustand === 'band' && k.z >= KURVE.zA) { k.zustand = 'kurve'; k.s = k.z - KURVE.zA; }
    else if (k.zustand === 'band2' && k.x < KURVE.R) { k.zustand = 'kurve'; k.s = KURVE.L + k.x - KURVE.R; }
  }
  const { kk, m } = kurvenGrenzen();
  // Antrieb −MA6 über Wendeschützkombination −QA10/−QA11, Motorschutz −FA7
  const vo = KURVE.vorOrt;
  if (st.sa5) {
    if (auto) {                                                      // Vor-Ort-Steuerstelle −S30 (bei „SPS“ wertet die SPS sie aus)
      if (st.bedien.sf32 || !st.kf2 || !st.fa7Ok) vo.r = vo.l = false;
      else if (st.bedien.sf30 && !vo.l) vo.r = true;
      else if (st.bedien.sf31 && !vo.r) vo.l = true;
      KURVE.wende = vo.r ? 1 : vo.l ? -1 : 0;
    }
  } else vo.r = vo.l = false;
  if (auto && !st.sa5) {
    // Bandmodul automatisch: Kurve läuft, solange ein Korb in der Kurve weiterkann oder einer an Band 1 übergeben wird;
    // ein Korb am Kurvenende wird nur übergeben, wenn Band 2 läuft
    const einlauf = kurveEinlauf();
    const vonBand1 = koerbe.some(k => k.zustand === 'band' && k.z > KURVE.zA - UEBERGABE - 1 && k.z < einlauf - 0.5);
    const inKurve = kk.some(k => k.s < m.get(k).max - 0.5 && !(k.s > KURVE.L - UEBERGABE - 1 && BAND2.wende <= 0));
    const anBand2 = koerbe.some(k => k.zustand === 'band2' && k.x < KURVE.R + UEBERGABE && BAND2.wende > 0);   // Korb noch im Übergabebereich
    KURVE.wende = (vonBand1 || inKurve || anBand2) && st.kf2 && st.fa7Ok ? 1 : 0;
  } else if (!auto) {
    let r = wirksam('QA10_Kurve_Rechts'), l = wirksam('QA11_Kurve_Links');
    if (r && l) { ereignis('Wendeschütz Rollenkurve: Rechts- und Linkslauf gleichzeitig angesteuert (mechanisch verriegelt)', 'err', 'wende3'); r = KURVE.wende > 0; l = KURVE.wende < 0; }
    KURVE.wende = st.fa7Ok ? (r ? 1 : l ? -1 : 0) : 0;
  }
  KURVE.v += Math.max(-KURVE.a * dt, Math.min(KURVE.a * dt, KURVE.wende * KURVE.vSoll - KURVE.v));
  KURVE.weg += KURVE.v * dt;
  // Körbe in der Kurve bewegen, Übergabe an Band 2 bzw. (rückwärts) an Band 1
  for (const k of kk) {
    const g = m.get(k);
    k.s = Math.max(Math.min(k.s, g.min), Math.min(Math.max(k.s, g.max), k.s + vKurve(k) * dt));
    if (k.s >= KURVE.L) { k.zustand = 'band2'; k.x = KURVE.R + k.s - KURVE.L; }
    else if (k.s < 0) { k.zustand = 'band'; k.z = KURVE.zA + k.s; }
  }
  // Hinweise im Übungsumfang „SPS“: Korb hängt an einer Übergabe, weil nur ein Förderer läuft
  if (!auto) {
    const einlauf = kurveEinlauf();
    const haengt = koerbe.find(k => (k.zustand === 'band' && k.z > KURVE.zA - UEBERGABE && k.z < einlauf - 0.5 && (BAND.v > 1) !== (KURVE.v > 1))
      || (k.zustand === 'kurve' && k.s < UEBERGABE && (BAND.v > 1) !== (KURVE.v > 1))
      || (k.zustand === 'kurve' && k.s > KURVE.L - UEBERGABE && KURVE.v > 1 && BAND2.v < 1));
    blockT = haengt ? blockT + dt : 0;
    if (blockT > 4) {
      const ende = haengt.zustand === 'kurve' && haengt.s > KURVE.L / 2;
      ereignis(ende ? t`Korb ${haengt.nr} hängt an der Übergabe Rollenkurve → Band 2: Band 2 (−QA5) läuft nicht mit`
        : t`Korb ${haengt.nr} hängt an der Übergabe Band 1 → Rollenkurve: beide Förderer (−QA1 und −QA10) müssen laufen`, 'err', 'uebergabe');
      blockT = 0;
    }
  } else blockT = 0;
}
