/* ---------- Interaktive Erklärungen: Analogwert, Sätze in Worten und Begriffe ---------- */
// Erklärt den Stand der Erklärung „analog“ (analog.js) je Ansicht: Weg vom Sensor zum Rohwert (je Bereich),
// Umrechnen (je Rechenweg), NORM_X und SCALE_X, Prüfen mit Testumschaltung.
// e: {z, k} mit k aus anKette bzw. anPruefen und den Zahlen als Text.
import { zfZahlText } from './zahl-modell.js';
import { AN_NENN, anHex } from './analog-modell.js';

const anZahl = v => zfZahlText(v).replace("-", "−");
const anKomma = (v, stellen) => v.toFixed(stellen).replace(".", ",").replace("-", "−");
const anGroesse = e => `${e.z.n.sensor} misst ${anKomma(e.z.wert, 1)} ${e.z.n.einheit}`;
const anStromText = e => `${anKomma(e.k.strom, 2)} mA`;

/* ---------- Kette: je Bereich des Rohwerts ---------- */
const AN_SATZ_KETTE = {
  "Nennbereich": e => `${anGroesse(e)}. Der Messumformer macht daraus ${anStromText(e)}. Die Baugruppe wandelt 4 bis 20 mA in 0 bis ${AN_NENN}, hier <b>${anZahl(e.k.roh)}</b>. Das ist der <b>Nennbereich</b>: Mit diesem Wert rechnest du weiter.`,
  "Übersteuerung": e => `${anGroesse(e)}, mehr als das Messbereichsende ${e.z.n.bis} ${e.z.n.einheit}. ${anStromText(e)} sind noch messbar, der Rohwert <b>${anZahl(e.k.roh)}</b> liegt in der <b>Übersteuerung</b>. Der Sensor ist dafür nicht ausgelegt: Werte außerhalb des Nennbereichs verwendest du nicht.`,
  "Überlauf": e => `${anGroesse(e)}. Der Strom ${anStromText(e)} liegt über 22,81 mA. Die Baugruppe meldet <b>Überlauf: 32767 (16#7FFF)</b>. Das ist kein Messwert mehr.`,
  "Untersteuerung": e => `${anGroesse(e)}, weniger als der Messbereichsanfang. ${anStromText(e)} liegen unter 4 mA, der Rohwert <b>${anZahl(e.k.roh)}</b> ist negativ (<b>Untersteuerung</b>). Deshalb liest du den Analogwert als Int: Ein Word kennt keine negativen Zahlen.`,
  "Unterlauf": e => `${anGroesse(e)}. Der Strom ${anStromText(e)} liegt unter 1,185 mA. Die Baugruppe meldet <b>Unterlauf: −32768 (16#8000)</b>. Das ist kein Messwert mehr.`,
};
export function anSatzKette(e){
  if (e.z.drahtbruch) return `Die Leitung ist unterbrochen, es fließt <b>kein Strom</b>. Ist die Diagnose Drahtbruch freigegeben, meldet die Baugruppe <b>32767 (16#7FFF)</b>, so wie der Zwilling. Rechnest du blind um, wären das rund ${Math.round(e.z.n.bis * 32767 / AN_NENN)} ${e.z.n.einheit}. Deshalb prüfst du den Rohwert, bevor du ihn verwendest.`;
  return AN_SATZ_KETTE[e.bereich.name](e);
}

/* ---------- Umrechnen: je Rechenweg ---------- */
const AN_SATZ_WEG = {
  "Real": e => `${anZahl(e.z.roh)} × ${e.z.n.bis} / ${AN_NENN} = <b>${zfZahlText(e.k.wert)} ${e.z.n.einheit}</b>. Erst in Real wandeln, dann multiplizieren, dann teilen: So passt das Zwischenergebnis (${zfZahlText(e.k.schritte[1].out)}) sicher hinein, und die Nachkommastellen bleiben erhalten.`,
  "Int, erst mal": e => e.k.falsch
    ? `${anZahl(e.z.roh)} × ${e.z.n.bis} = ${anZahl(e.k.schritte[0].exakt)} passt nicht in Int (bis 32767). Die MUL-Box meldet <b>ENO = FALSE</b>, und alles danach ist falsch. Rechne in Real.`
    : `Bei so kleinen Rohwerten geht es in Int gerade noch gut. Ab dem Rohwert ${Math.floor(32767 / e.z.n.bis) + 1} läuft das Produkt über, und die Nachkommastellen fehlen immer. Rechne in Real.`,
  "Int, erst durch": e => `${anZahl(e.z.roh)} / ${AN_NENN} ergibt in Int <b>${anZahl(e.k.schritte[0].out)}</b>, denn die Ganzzahldivision schneidet den Rest ab. Danach × ${e.z.n.bis} = ${anZahl(e.k.wert)}. Das Ergebnis kann so im Nennbereich nur 0 oder ${e.z.n.bis} sein. Rechne in Real.`,
};
export const anSatzWeg = e => AN_SATZ_WEG[e.z.weg](e);

/* ---------- NORM_X und SCALE_X ---------- */
export function anSatzNorm(e){
  const ausserhalb = e.z.roh < 0 || e.z.roh > AN_NENN ? ` Der Rohwert liegt außerhalb von 0 bis ${AN_NENN}: NORM_X liefert dann einen Wert unter 0.0 oder über 1.0. Prüfe den Rohwert deshalb vorher.` : "";
  return `NORM_X: ${anZahl(e.z.roh)} / ${AN_NENN} = <b>${zfZahlText(e.k.norm)}</b> (Anteil am Bereich). SCALE_X: ${zfZahlText(e.k.norm)} × ${e.z.n.bis}.0 = <b>${zfZahlText(e.k.wert)} ${e.z.n.einheit}</b>. Dasselbe Ergebnis wie deine Formel, nur mit fertigen Anweisungen.${ausserhalb}`;
}

/* ---------- Prüfen mit Testumschaltung ---------- */
export function anSatzPruefen(e){
  const {z, k} = e, quelle = z.test ? `Testbetrieb: Der FB rechnet mit ${z.s.testRoh} = ${anZahl(k.roh)}, nicht mit ${z.n.sensor}.` : `Normalbetrieb: Der FB rechnet mit ${z.s.roh} = ${anZahl(k.roh)} (${z.n.sensor}).`;
  if (!k.gueltig) return `${quelle} Der Rohwert liegt außerhalb von 0 bis ${AN_NENN} (${anHex(k.roh)}): <b>${z.s.gueltig} = FALSE</b>, also auch ${z.s.ok} = FALSE, obwohl ${z.s.wert} ${zfZahlText(k.wert)} zeigt.`;
  const lage = k.ok ? "liegt im Bereich" : "liegt nicht im Bereich";
  return `${quelle} ${zfZahlText(k.wert)} ${z.n.einheit} ${lage} ${z.n.min} bis ${z.n.max} ${z.n.einheit}: <b>${z.s.ok} = ${k.ok ? "TRUE" : "FALSE"}</b>.`;
}

export const AN_BEGRIFFE = [
  ["Analogwert", "Ein Signal, das sich stetig ändert, z. B. Temperatur oder Füllstand. Ein Binärsignal kennt nur 0 und 1."],
  ["Messumformer", "Macht aus dem Sensorsignal ein genormtes Signal, hier 4 bis 20 mA. 4 mA ist der Messbereichsanfang, 20 mA das Messbereichsende."],
  ["Rohwert", "Die ganze Zahl, die die Analogeingabebaugruppe auf das Eingangswort legt. Nennbereich 0 bis 27648. Datentyp Int, weil er negativ sein kann."],
  ["Übersteuerung, Überlauf", "Über 27648 ist der Wert außerhalb des Nennbereichs (Übersteuerung bis 32511). 32767 (16#7FFF) heißt Überlauf, bei freigegebener Diagnose auch Drahtbruch."],
  ["Untersteuerung, Unterlauf", "Unter 0 liegt der Strom unter 4 mA (Untersteuerung bis −4864). −32768 (16#8000) heißt Unterlauf."],
  ["Drahtbruch", "Die Leitung zum Sensor ist unterbrochen. Weil 4 bis 20 mA bei 0 nicht 0 mA ist, erkennt die Baugruppe das: Es fließt gar kein Strom."],
  ["Normieren, Skalieren", "NORM_X rechnet einen Wert in seinen Anteil 0.0 bis 1.0 um. SCALE_X rechnet den Anteil auf einen Bereich um, z. B. 0.0 bis 400.0 °C."],
  ["Testumschaltung", "Statische Variablen im FB: statTestMode wählt, ob der FB mit dem Testwert statTestRaw rechnet oder mit dem Eingang. So testest du Werte, die du am Analogeingang nicht vorgeben kannst."],
];
