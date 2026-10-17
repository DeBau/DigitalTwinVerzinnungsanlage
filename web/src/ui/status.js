import { st } from '../logik/zustand.js';
import { $ } from '../core/szene.js';
import { demo } from '../logik/demo-sps.js';
import { SPRACHE, t } from '../core/sprache.js';

// Statustexte der Bridge (C#, immer deutsch): nach Muster übersetzen, Instanzname und Fehlertext bleiben
const BRIDGE_MUSTER = [
  [/^Instanz '(.*)' - (\S+)$/, (m) => t`Instanz '${m[1]}' - ${m[2]}`],
  [/^Instanz '(.*)' ist ausgeschaltet$/, (m) => t`Instanz '${m[1]}' ist ausgeschaltet`],
  [/^Instanz '(.*)' nicht gefunden \(([\s\S]*)\)$/, (m) => t`Instanz '${m[1]}' nicht gefunden (${m[2]})`],
];
function bridgeText(text) {
  if (!text || SPRACHE === 'de') return text;
  for (const [re, f] of BRIDGE_MUSTER) { const m = text.match(re); if (m) return f(m); }
  return t(text);              // feste Texte („Noch keine Verbindung“ …), Ausnahmetexte bleiben wie sie sind
}

export function modusSetzen(m, manuell) {
  if (m !== st.modus) { demo.auto = false; demo.schritt = 1; }
  st.modus = m;
  if (manuell) st.modusManuell = true;
  $('mode-sps').setAttribute('aria-pressed', m === 'sps');
  $('mode-demo').setAttribute('aria-pressed', m === 'demo');
  $('mode-hint').textContent = m === 'sps'
    ? t('PLCSIM Advanced: Die Ventile und Leuchten schaltet dein TIA-Programm. Endlagen, BG9–BG11 und die Taster gehen in die Eingänge der virtuellen CPU.')
    : t('Demo: Eine Schrittkette im Browser steuert die Anlage. SA1 auf AUTO: START −SF1 fährt Zyklen, bis STOP −SF2. SA1 auf EINZEL: jedes START ein Zyklus. Handbetrieb über die Schaltschranktür.');
  statusAnzeigen();
}
export function statusAnzeigen() {
  const nurSehen = st.bridgeOffen && !st.steuernd;
  $('dot-bridge').className = 'dot ' + (!st.bridgeOffen ? 'bad' : nurSehen ? 'warn' : 'ok');
  const demoOhneBridge = st.modus === 'demo' && !st.bridgeOffen;
  $('dot-bridge').className = 'dot ' + (demoOhneBridge ? 'aus' : !st.bridgeOffen ? 'bad' : nurSehen ? 'warn' : 'ok');
  $('txt-bridge').textContent = t(demoOhneBridge ? 'Bridge nicht verbunden (Demo)' : !st.bridgeOffen ? 'Bridge nicht erreichbar'
    : nurSehen ? 'Bridge verbunden · nur Beobachten' : 'Bridge verbunden');
  $('dot-plc').className = 'dot ' + (!st.plcVerbunden ? 'bad' : st.plcZustand === 'Run' ? 'ok' : 'warn');
  $('txt-plc').textContent = 'PLCSIM Advanced: ' + t(st.plcVerbunden ? st.plcZustand : 'nicht verbunden');
  $('txt-plc-detail').textContent = st.bridgeOffen ? bridgeText(st.plcText || '')
    : t(st.modus === 'demo' ? 'Für PLCSIM Advanced: start.bat ausführen und oben „PLCSIM Advanced“ wählen.' : 'start.bat ausführen, dann verbindet sich die Seite automatisch.');
  $('offline-banner').hidden = !(st.modus === 'sps' && (nurSehen || !(st.bridgeOffen && st.plcVerbunden)));
  $('offline-text').textContent = !st.bridgeOffen
    ? t('Bridge nicht erreichbar. Ausgänge bleiben auf dem letzten Stand.')
    : nurSehen
      ? t`Nur Beobachten: Diese Seite ist ${st.offeneZwillinge}× geöffnet, gesteuert wird von der zuletzt geöffneten Registerkarte im Modus PLCSIM. Schließe die anderen oder lade diese Seite neu, um hier zu steuern.`
      : (bridgeText(st.plcText) || t('Instanz nicht verbunden.'));
}
