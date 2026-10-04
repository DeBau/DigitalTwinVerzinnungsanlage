import { SIGNALE } from '../signale.js';
import { st } from '../logik/zustand.js';
import { ereignis } from './ereignisse.js';
import { eingang } from '../logik/eingaenge.js';
import { monitorAufbauen } from './signalmonitor.js';
import { modusSetzen, statusAnzeigen } from './status.js';

// ----------------------------------------------------------------------------
// Verbindung zur Bridge
// ----------------------------------------------------------------------------
const WS_URL = (location.protocol.startsWith('http') && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(location.host))
  ? `ws://${location.host}/ws` : 'ws://localhost:8181/ws';
let ws = null;
let letzteEingaenge = '';
export function verbinden() {
  try { ws = new WebSocket(WS_URL); } catch { setTimeout(verbinden, 3000); return; }
  ws.onopen = () => { st.bridgeOffen = true; letzteEingaenge = ''; statusAnzeigen(); };
  ws.onclose = () => {
    st.bridgeOffen = false; st.plcVerbunden = false; st.plcZustand = 'getrennt'; st.steuernd = true;
    statusAnzeigen();
    setTimeout(verbinden, 2000);
  };
  ws.onerror = () => {};
  ws.onmessage = (ev) => {
    let m; try { m = JSON.parse(ev.data); } catch { return; }
    if (m.typ === 'hallo' && Array.isArray(m.signale) && m.signale.length) {
      SIGNALE.splice(0, SIGNALE.length, ...m.signale);
      const fehlend = ['MB1_Einhaengen', 'MB3_Senken', 'BG1_MM1_eingehaengt', 'BG11_Korb', 'SF1_Start']
        .filter(n => !SIGNALE.some(s => s.name === n));
      if (fehlend.length) ereignis('signale.csv: Namen nicht gefunden: ' + fehlend.join(', '), 'err');
      monitorAufbauen();
    } else if (m.typ === 'status') {
      st.plcVerbunden = m.verbunden; st.plcZustand = m.zustand; st.plcText = m.text;
      if (m.verbunden && !st.modusManuell && st.modus !== 'sps') modusSetzen('sps', false);
      statusAnzeigen();
    } else if (m.typ === 'ausgaenge') {
      st.spsAusgaenge = m.werte || {};
    } else if (m.typ === 'rolle') {
      // Nur ein Zwilling stellt die Eingaenge. Sonst wuerden sich zwei offene
      // Registerkarten gegenseitig ueberschreiben und jedes Bit wuerde zappeln.
      if (m.steuernd !== st.steuernd) {
        ereignis(m.steuernd
          ? 'Diese Registerkarte steuert die Anlage.'
          : 'Nur Beobachten: eine neuere Registerkarte steuert die Anlage. Diese hier sendet keine Eingänge mehr.', m.steuernd ? 'ok' : 'err');
      }
      st.steuernd = m.steuernd; st.offeneZwillinge = m.offen;
      letzteEingaenge = '';
      statusAnzeigen();
    }
  };
}
export function eingaengeSenden(erzwingen) {
  if (!ws || ws.readyState !== 1 || st.modus !== 'sps' || !st.steuernd) return;
  const werte = {};
  for (const s of SIGNALE) if (s.richtung === 'eingang') werte[s.name] = eingang(s.name);
  const txt = JSON.stringify(werte);
  if (!erzwingen && txt === letzteEingaenge) return;
  letzteEingaenge = txt;
  ws.send(JSON.stringify({ typ: 'eingaenge', werte }));
}
setInterval(() => eingaengeSenden(true), 500);

