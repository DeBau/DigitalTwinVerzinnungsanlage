import { QUITT, st } from './zustand.js';
import { ausgangWort } from './eingaenge.js';
import { FU_BEZUG, UMRICHTER, umrichterSchritt } from './umrichter.js';

// ----------------------------------------------------------------------------
// Förderer am Umrichter (Übungsumfang → Antriebe): Band 1 −TA2, Band 2 −TA3, Rollenkurve −TA4, Prüfband −TA5
// ----------------------------------------------------------------------------
export const amUmrichter = (name) => st.antrieb[name] === 'fu';

// Ein Rechenschritt des Umrichters, Ergebnis = Bandgeschwindigkeit in mm/s.
// vZiel = null: das Telegramm kommt von der SPS (Übungsumfang „SPS steuert“).
// Sonst führt das Bandmodul den Umrichter selbst über dasselbe Telegramm: vZiel ist die gewünschte
// Geschwindigkeit, aus der Einschaltsperre geht es mit AUS1 = 0, Störungen quittiert ein Quittiertaster.
export function umrichterFahren(name, dt, vZiel) {
  const fu = UMRICHTER[name];
  let stw, nsoll;
  if (vZiel === null) {
    stw = ausgangWort(name + '_STW1'); nsoll = ausgangWort(name + '_NSOLL_A');
  } else {
    const ein = vZiel !== 0 && fu.zustand !== 'S1', quitt = QUITT.some(q => st.bedien[q.key]);
    stw = (ein ? 0x047F : 0x047E) | (quitt ? 0x0080 : 0);
    nsoll = Math.round(vZiel / fu.vBezug * FU_BEZUG);
  }
  return umrichterSchritt(fu, stw, nsoll, dt, { sto: !st.kf2 }) * fu.vBezug;
}
