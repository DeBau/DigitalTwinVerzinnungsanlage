import { SIGNALE } from '../signale.js';
import { VERSION } from '../version.js';
import { st } from '../logik/zustand.js';
import { ereignis } from './ereignisse.js';
import { eingang } from '../logik/eingaenge.js';
import { monitorAufbauen } from './signalmonitor.js';
import { modusSetzen, statusAnzeigen } from './status.js';
import { t } from '../core/sprache.js';

// ----------------------------------------------------------------------------
// Verbindung zur Bridge
// ----------------------------------------------------------------------------
const WS_URL = (location.protocol.startsWith('http') && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(location.host))
  ? `ws://${location.host}/ws` : 'ws://localhost:8181/ws';
let ws = null;
let letzteEingaenge = '';
let gemeldeterModus = null;
export function verbinden() {
  // Die Betriebsart geht schon beim Verbinden mit: Steuern darf nur eine Registerkarte im Modus PLCSIM
  try { ws = new WebSocket(WS_URL + '?modus=' + st.modus); } catch { setTimeout(verbinden, 3000); return; }
  gemeldeterModus = st.modus;
  ws.onopen = () => { st.bridgeOffen = true; letzteEingaenge = ''; statusAnzeigen(); };
  ws.onclose = () => {
    st.bridgeOffen = false; st.plcVerbunden = false; st.plcZustand = 'getrennt'; st.steuernd = true;
    statusAnzeigen();
    setTimeout(verbinden, 2000);
  };
  ws.onerror = () => {};
  ws.onmessage = (ev) => {
    let m; try { m = JSON.parse(ev.data); } catch { return; }
    const stand = (v) => String(v || '').split('.').slice(0, 2).join('.');   // Haupt.Neben – Fehlerbehebungen (x.y.Z) passen zusammen
    if (m.typ === 'hallo' && stand(m.version) !== stand(VERSION)) {
      // Seite und Bridge aus verschiedenen Ständen: Bridge neu bauen, sonst fehlen ihr Neuerungen der Seite
      ereignis(t`Bridge ${m.version ? 'v' + m.version : t('(alte Version)')} passt nicht zum Zwilling v${VERSION}: Bridge\\build.bat ausführen und die Bridge neu starten.`, 'err');
    }
    if (m.typ === 'hallo' && Array.isArray(m.signale) && m.signale.length) {
      SIGNALE.splice(0, SIGNALE.length, ...m.signale);
      const fehlend = ['MB1_Einhaengen', 'MB3_Senken', 'BG1_MM1_eingehaengt', 'BG11_Korb', 'SF1_Start']
        .filter(n => !SIGNALE.some(s => s.name === n));
      if (fehlend.length) ereignis(t`signale.csv: Namen nicht gefunden: ${fehlend.join(', ')}`, 'err');
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
          : 'Nur Beobachten: eine andere Registerkarte im Modus PLCSIM steuert die Anlage. Diese hier sendet keine Eingänge mehr.', m.steuernd ? 'ok' : 'err');
      }
      st.steuernd = m.steuernd; st.offeneZwillinge = m.offen;
      letzteEingaenge = '';
      statusAnzeigen();
    }
  };
}
export function eingaengeSenden(erzwingen) {
  if (!ws || ws.readyState !== 1) return;
  if (st.modus !== gemeldeterModus) {            // Betriebsart umgeschaltet: Bridge vergibt die Steuerung neu
    gemeldeterModus = st.modus;
    ws.send(JSON.stringify({ typ: 'modus', modus: st.modus }));
  }
  if (st.modus !== 'sps' || !st.steuernd) return;
  const werte = {};
  for (const s of SIGNALE) if (s.richtung === 'eingang') werte[s.name] = eingang(s.name);
  const txt = JSON.stringify(werte);
  if (!erzwingen && txt === letzteEingaenge) return;
  letzteEingaenge = txt;
  ws.send(JSON.stringify({ typ: 'eingaenge', werte }));
}
setInterval(() => eingaengeSenden(true), 500);

