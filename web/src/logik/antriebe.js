import { QUITT, st } from './zustand.js';
import { ausgangWort } from './eingaenge.js';
import { FU_BEZUG, UMRICHTER, umrichterSchritt } from './umrichter.js';
import { ereignis } from '../ui/ereignisse.js';
import { t } from '../core/sprache.js';

// ----------------------------------------------------------------------------
// Förderer am Umrichter (Übungsumfang → Antriebe): Band 1 −TA2, Band 2 −TA3, Rollenkurve −TA4, Prüfband −TA5
// ----------------------------------------------------------------------------
export const amUmrichter = (name) => st.antrieb[name] === 'fu';
// Zyklischer Datenaustausch mit der SPS: in der Demo immer, mit PLCSIM nur bei Verbindung und CPU in RUN
export const feldbusAktiv = () => st.modus === 'demo' || (st.plcVerbunden && st.plcZustand === 'Run');

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
  const vorher = fu.stoerung;
  const n = umrichterSchritt(fu, stw, nsoll, dt, { sto: !st.kf2, feldbusAus: vZiel === null && !feldbusAktiv() });
  if (!vorher && fu.stoerung?.nr === 'F01910') ereignis(t`Umrichter −${name}: Störung F01910 Feldbus-Sollwert-Timeout (kein Datenaustausch mit der SPS), Schnellhalt AUS3`, 'err');
  return n * fu.vBezug;
}
