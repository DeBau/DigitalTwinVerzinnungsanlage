/* ---------- Interaktive Erklärungen: Rechnen, Satz in Worten und Hinweise ---------- */
// Erklärt das Ergebnis der Erklärung „rechnen“ (rechnen.js) in einem Satz, je Art (rechnen, runden, vergleich, bereich)
// und je Fall aus rechnen-modell.js (ok, ueberlauf, div0, mod0, nurGanz, ungenau, en0).
// e: {z, r, a, b, min, max, out} mit Zahlen als Text (wie im Programmstatus).
import { esc } from '../basis.js';
import { RE_TYPEN } from './rechnen-modell.js';
import { zfGenau } from './zahl-modell.js';

export const RE_ZEICHEN_TEXT = {ADD: "+", SUB: "−", MUL: "×", DIV: "/", MOD: "MOD"};

// Die Bedeutungen (name-a, name-b, name-q) gelten nur für die erste Anweisung, für die der Platzhalter geschrieben ist
const reMitNamen = e => e.z.op === e.z.ops[0];
function reNamen(e){
  const n = e.z.namen;
  return n.a && n.b && reMitNamen(e) ? `${n.a} ${RE_ZEICHEN_TEXT[e.z.op]} ${n.b}: ` : "";
}
const reEinheit = e => e.z.namen.q && reMitNamen(e) ? ` ${e.z.namen.q}` : "";
function reDivRest(e){
  const {z, r} = e;
  if (z.op !== "DIV" || !RE_TYPEN[z.typ].ganz || z.w.a % z.w.b === 0) return "";
  return ` Der Rest ${z.w.a % z.w.b} wird abgeschnitten, ihn liefert MOD. Das genaue Ergebnis wäre ${zfGenau(z.w.a / z.w.b)}, die Ganzzahldivision liefert ${r.out}.`;
}
const RE_SATZ_RECHNEN = {
  ok: e => `${reNamen(e)}${e.a} ${RE_ZEICHEN_TEXT[e.z.op]} ${e.b} = <b>${e.out}</b>${reEinheit(e)}.${reDivRest(e)}${e.z.op === "MOD" ? ` MOD liefert den Rest der Ganzzahldivision ${e.a} / ${e.b}.` : ""}`,
  ueberlauf: e => RE_TYPEN[e.z.typ].ganz
    ? `${e.a} ${RE_ZEICHEN_TEXT[e.z.op]} ${e.b} = ${e.r.exakt} passt nicht in ${e.z.typ} (${RE_TYPEN[e.z.typ].min} bis ${RE_TYPEN[e.z.typ].max}). <b>ENO = FALSE.</b> Am Ausgang steht dann ${e.out}: Im Zweierkomplement läuft das Bitmuster herum. Diesen Wert beobachtet man an der CPU, die TIA-Hilfe legt ihn nicht fest. Er ist auf jeden Fall falsch. Nimm einen größeren Datentyp oder werte ENO aus.`
    : `Das Ergebnis passt nicht in Real (bis ±3.402823e38). <b>ENO = FALSE.</b>`,
  div0: e => RE_TYPEN[e.z.typ].ganz
    ? `Division durch 0: Laut TIA-Hilfe bleibt <b>ENO = TRUE</b> und OUT ist 0. Du merkst den Fehler also nicht an ENO. Prüfe den Teiler vorher, z. B. <code>IF ${e.z.scl.b} &lt;&gt; 0 THEN …</code>`
    : `Division durch 0: Laut TIA-Hilfe bleibt <b>ENO = TRUE</b>. OUT ist keine gültige Zahl (NaN, Bitmuster 16#7FC0_0000, in der Hilfe als 2143289344 angegeben). Prüfe den Teiler vorher.`,
  mod0: () => "MOD durch 0: Die TIA-Hilfe legt das Ergebnis nicht fest. Prüfe den Teiler vorher.",
  nurGanz: () => "MOD gibt es nur für Ganzzahlen (Int, DInt). Wähle oben Int oder DInt.",
  ungenau: e => `${e.a} ${RE_ZEICHEN_TEXT[e.z.op]} ${e.b} ergibt richtig ${zfGenau(+e.r.exakt)}. Real speichert <b>${zfGenau(e.r.out)}</b>. Real hat nur etwa 6 bis 7 gültige Stellen (TIA-Hilfe: 6, Programmierleitfaden: 7), sicher sind 6, und jedes Zwischenergebnis wird gerundet. ENO bleibt TRUE: Ungenauigkeit ist kein Fehler.`,
  en0: () => "EN = 0: Die Box wird nicht bearbeitet. OUT behält seinen alten Wert, ENO ist 0.",
};
const RE_REGEL_RUNDEN = {
  ROUND: "ROUND rundet zur nächsten Ganzzahl. Liegt der Wert genau in der Mitte (x.5), nimmt TIA die gerade Zahl: 2.5 wird 2, 3.5 wird 4.",
  TRUNC: "TRUNC schneidet die Nachkommastellen ab, ohne zu runden. Bei negativen Zahlen geht es also Richtung 0.",
  CEIL: "CEIL nimmt die nächste Ganzzahl, die größer oder gleich ist (aufrunden).",
  FLOOR: "FLOOR nimmt die nächste Ganzzahl, die kleiner oder gleich ist (abrunden).",
};
function reSatzRunden(e){
  const {z, r} = e;
  if (r.fall === "en0") return RE_SATZ_RECHNEN.en0();
  const eingabe = r.eingang !== z.w.a ? ` Real speichert die Eingabe als ${zfGenau(r.eingang)}.` : "";
  const fehler = r.fall === "ueberlauf" ? ` Das Ergebnis passt nicht in ${z.typ}: <b>ENO = FALSE</b>.` : "";
  return `${z.op}(${e.a}) = <b>${e.out}</b>. ${RE_REGEL_RUNDEN[z.op]}${eingabe}${fehler}`;
}
function reSatzVergleich(e){
  const {z, r} = e, real = z.typ === "Real";
  const herkunft = z.herkunft ? ` ${z.herkunft}` : "";
  const warnung = real ? " Vergleiche Real nie mit ==: Schon kleinste Rundungsfehler machen das Ergebnis FALSE. Die TIA-Hilfe empfiehlt dafür IN_RANGE mit einer kleinen Toleranz." : "";
  const gespeichert = real ? ` Gespeichert sind ${zfGenau(Math.fround(z.w.a))} und ${zfGenau(Math.fround(z.w.b))}.` : "";
  return `${e.a} ${esc(z.vgl)} ${e.b} ist <b>${r.out ? "TRUE" : "FALSE"}</b>.${gespeichert}${herkunft}${warnung}`;
}
function reSatzBereich(e){
  const {r} = e;
  return `${e.min} &lt;= ${e.a} und ${e.a} &lt;= ${e.max}: <b>${r.out ? "TRUE" : "FALSE"}</b>. IN_RANGE prüft, ob VAL zwischen MIN und MAX liegt (die Grenzen gehören dazu).${e.z.herkunft ? " " + e.z.herkunft : ""}`;
}
export const RE_SATZ = {
  rechnen: e => RE_SATZ_RECHNEN[e.r.fall](e),
  runden: reSatzRunden,
  vergleich: reSatzVergleich,
  bereich: reSatzBereich,
};
// Kurzer Hinweis unter der SCL-Zeile
export const RE_SCL_HINWEIS = {
  rechnen: "In SCL gibt es ENO nur, wenn du in den Bausteineigenschaften „ENO automatisch setzen“ einschaltest. Sonst merkst du einen Überlauf dort nicht.",
  runden: "Den Datentyp des Ergebnisses bestimmt die Variable links. Du kannst ihn auch angeben, z. B. TRUNC_INT oder CEIL_REAL.",
  vergleich: "In SCL schreibst du für „gleich“ ein einfaches = (FUP: CMP ==).",
  bereich: "IN_RANGE gibt es nur in FUP und KOP. In SCL schreibst du die beiden Vergleiche aus.",
};
export const RE_BEGRIFFE = [
  ["EN und ENO", "EN (Freigabeeingang) startet die Box. ENO (Freigabeausgang) meldet, ob sie fehlerfrei gerechnet hat. ENO = FALSE heißt: Das Ergebnis taugt nichts."],
  ["Überlauf", "Das Ergebnis passt nicht in den Wertebereich des Datentyps, z. B. 10 × 3600 = 36000 in Int (bis 32767)."],
  ["Ganzzahldivision", "Bei Int und DInt liefert DIV nur den ganzzahligen Anteil, der Rest wird abgeschnitten. Den Rest liefert MOD."],
  ["Gleitpunktzahl (Real)", "Zahl mit Komma, gespeichert nach IEEE 754 in 32 Bit. Real hat nur etwa 6 bis 7 gültige Stellen (TIA-Hilfe: 6, Programmierleitfaden: 7), sicher sind 6."],
  ["Wertebereich", "Int: −32768 bis 32767. DInt: −2147483648 bis 2147483647. Real: bis etwa ±3.402823e38."],
];
