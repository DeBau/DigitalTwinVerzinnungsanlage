import { st } from '../logik/zustand.js';
import { $ } from '../core/szene.js';
import { demo } from '../logik/demo-sps.js';

export function modusSetzen(m, manuell) {
  if (m !== st.modus) { demo.auto = false; demo.schritt = 1; }
  st.modus = m;
  if (manuell) st.modusManuell = true;
  $('mode-sps').setAttribute('aria-pressed', m === 'sps');
  $('mode-demo').setAttribute('aria-pressed', m === 'demo');
  $('mode-hint').textContent = m === 'sps'
    ? 'PLCSIM Advanced: Die Ventile und Leuchten schaltet dein TIA-Programm. Endlagen, BG9–BG11 und die Taster gehen in die Eingänge der virtuellen CPU.'
    : 'Demo: Eine Schrittkette im Browser steuert die Anlage. SA1 auf AUTO: START −SF1 fährt Zyklen, bis STOP −SF2. SA1 auf EINZEL: jedes START ein Zyklus. Handbetrieb über die Schaltschranktür.';
  statusAnzeigen();
}
export function statusAnzeigen() {
  const nurSehen = st.bridgeOffen && !st.steuernd;
  $('dot-bridge').className = 'dot ' + (!st.bridgeOffen ? 'bad' : nurSehen ? 'warn' : 'ok');
  $('txt-bridge').textContent = !st.bridgeOffen ? 'Bridge nicht erreichbar'
    : nurSehen ? 'Bridge verbunden · nur Beobachten' : 'Bridge verbunden';
  $('dot-plc').className = 'dot ' + (!st.plcVerbunden ? 'bad' : st.plcZustand === 'Run' ? 'ok' : 'warn');
  $('txt-plc').textContent = 'PLCSIM Advanced: ' + (st.plcVerbunden ? st.plcZustand : 'nicht verbunden');
  $('txt-plc-detail').textContent = st.bridgeOffen ? (st.plcText || '') : 'start.bat ausführen, dann verbindet sich die Seite automatisch.';
  $('offline-banner').hidden = !(st.modus === 'sps' && (nurSehen || !(st.bridgeOffen && st.plcVerbunden)));
  $('offline-text').textContent = !st.bridgeOffen
    ? 'Bridge nicht erreichbar. Ausgänge bleiben auf dem letzten Stand.'
    : nurSehen
      ? 'Nur Beobachten: Diese Seite ist ' + st.offeneZwillinge + '× geöffnet, gesteuert wird von der zuletzt geöffneten Registerkarte. Schließe die anderen oder lade diese Seite neu, um hier zu steuern.'
      : (st.plcText || 'Instanz nicht verbunden.');
}

