/* ---------- Interaktive Erklärungen: Analogwert wie die S7-1500 (Modell, reine Funktionen) ---------- */
// Weg eines Messwerts: Messgröße (z. B. °C) → Messumformer 4 bis 20 mA → Analogeingabebaugruppe → Rohwert (Int).
// Darstellung der Analogwerte nach Siemens-Funktionshandbuch S7-1500/ET 200MP „Analogwertverarbeitung“, Strommessbereich
// 4 bis 20 mA: Nennbereich 0 bis 27648 (4 bis 20 mA), Übersteuerung bis 32511 (22,81 mA), darüber Überlauf 32767 (16#7FFF);
// Untersteuerung bis −4864 (1,185 mA), darunter Unterlauf −32768 (16#8000). Drahtbruch bei freigegebener Diagnose: 32767.
// Umrechnen in Real: jedes Zwischenergebnis wird mit Math.fround auf Real (32 Bit) gerundet.
// NORM_X und SCALE_X nach TIA-Hilfe V21: OUT = (VALUE − MIN) / (MAX − MIN) und OUT = VALUE × (MAX − MIN) + MIN.

export const AN_NENN = 27648;
const AN_MA_ANFANG = 4, AN_MA_SPANNE = 16;

// Bereiche des Rohwerts von oben nach unten: [Name, kleinster Rohwert, größter Rohwert, Strom von, Strom bis, gültig]
export const AN_BEREICHE = [
  {name: "Überlauf", von: 32767, bis: 32767, ma: "über 22,81 mA", gueltig: false},
  {name: "Übersteuerung", von: 27649, bis: 32511, ma: "20 bis 22,81 mA", gueltig: false},
  {name: "Nennbereich", von: 0, bis: 27648, ma: "4 bis 20 mA", gueltig: true},
  {name: "Untersteuerung", von: -4864, bis: -1, ma: "1,185 bis 4 mA", gueltig: false},
  {name: "Unterlauf", von: -32768, bis: -32768, ma: "unter 1,185 mA", gueltig: false},
];
const AN_UEBERSTEUERT = 32511, AN_UNTERSTEUERT = -4864;

export const anBereich = roh => AN_BEREICHE.find(b => roh >= b.von && roh <= b.bis)
  || (roh > AN_UEBERSTEUERT ? AN_BEREICHE[0] : AN_BEREICHE[4]);

/* ---------- Messgröße → Strom → Rohwert ---------- */
// Strom des Messumformers; unter 0 mA geht es nicht
export const anStrom = (wert, bis) => Math.max(0, AN_MA_ANFANG + AN_MA_SPANNE * wert / bis);
// Rohwert aus dem Strom; über der Übersteuerung Überlauf, unter der Untersteuerung Unterlauf
export function anRohAusStrom(ma){
  const roh = Math.round((ma - AN_MA_ANFANG) / AN_MA_SPANNE * AN_NENN);
  if (roh > AN_UEBERSTEUERT) return 32767;
  if (roh < AN_UNTERSTEUERT) return -32768;
  return roh;
}
// Kette für die Anzeige: {strom, roh}; Drahtbruch: kein Strom, die Baugruppe meldet 32767 (Diagnose freigegeben)
export function anKette(wert, bis, drahtbruch){
  if (drahtbruch) return {strom: 0, roh: 32767};
  const strom = anStrom(wert, bis);
  return {strom, roh: anRohAusStrom(strom)};
}
export const anHex = roh => "16#" + (roh & 0xFFFF).toString(16).toUpperCase().padStart(4, "0");

/* ---------- Umrechnen: drei Rechenwege ---------- */
const f = Math.fround;
const anInt = v => v >= -32768 && v <= 32767;
// Richtig: erst in Real wandeln, dann multiplizieren, dann teilen
function anWegReal(roh, bis){
  const r = f(roh), mal = f(r * f(bis)), wert = f(mal / f(AN_NENN));
  return {wert, schritte: [
    {anw: "INT_TO_REAL", rechnung: `${roh}`, out: r, ok: true},
    {anw: "MUL Real", rechnung: `× ${bis}.0`, out: mal, ok: true},
    {anw: "DIV Real", rechnung: `/ ${AN_NENN}.0`, out: wert, ok: true},
  ]};
}
// Falsch: in Int erst multiplizieren; das Zwischenergebnis passt nicht in Int (ENO = FALSE)
function anWegIntMal(roh, bis){
  const exakt = roh * bis, mal = Number(BigInt.asIntN(16, BigInt(exakt))), ok = anInt(exakt);
  const wert = Math.trunc(mal / AN_NENN);
  return {wert, falsch: !ok, schritte: [
    {anw: "MUL Int", rechnung: `${roh} × ${bis}`, out: mal, ok, exakt},
    {anw: "DIV Int", rechnung: `/ ${AN_NENN}`, out: wert, ok: true},
  ]};
}
// Falsch: in Int erst teilen; die Ganzzahldivision schneidet ab, fast alles wird 0
function anWegIntDurch(roh, bis){
  const durch = Math.trunc(roh / AN_NENN), wert = durch * bis;
  return {wert, falsch: wert !== roh * bis / AN_NENN, schritte: [
    {anw: "DIV Int", rechnung: `${roh} / ${AN_NENN}`, out: durch, ok: true},
    {anw: "MUL Int", rechnung: `× ${bis}`, out: wert, ok: anInt(wert)},
  ]};
}
export const AN_WEGE = {Real: anWegReal, "Int, erst mal": anWegIntMal, "Int, erst durch": anWegIntDurch};

/* ---------- NORM_X und SCALE_X ---------- */
export function anNormScale(roh, bis){
  const norm = f(f(roh - 0) / f(AN_NENN - 0));
  const wert = f(f(norm * f(bis - 0)) + 0);
  return {norm, wert};
}

/* ---------- Prüfen wie in BathMonitor ---------- */
// Testumschaltung, Gültigkeit (Nennbereich), Umrechnen, Grenzwerte
export function anPruefen(p){
  const roh = p.test ? p.testRoh : p.eingang;
  const gueltig = roh >= 0 && roh <= AN_NENN;
  const wert = anWegReal(roh, p.bis).wert;
  const ok = gueltig && wert >= f(p.min) && wert <= f(p.max);
  return {roh, gueltig, wert, ok};
}
