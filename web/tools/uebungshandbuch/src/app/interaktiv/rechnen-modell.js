/* ---------- Interaktive Erklärungen: Rechnen wie die S7-1500 (Modell, reine Funktionen) ---------- */
// Regeln laut TIA-Hilfe V21 (FUP/SCL, Datentypen):
// - ADD, SUB, MUL, DIV: ENO = FALSE, wenn das Ergebnis außerhalb des Wertebereichs von OUT liegt.
// - DIV durch 0: ENO bleibt TRUE. Int: OUT = 0. Real: OUT = 2143289344 als Bitmuster (16#7FC0_0000, ungültige Zahl NaN).
// - Ganzzahldivision liefert den ganzzahligen Anteil, MOD den Rest; bei negativem Dividenden ist der Rest negativ.
// - ROUND rundet zur nächsten Ganzzahl, bei genau .5 zur geraden Zahl. TRUNC schneidet ab, CEIL rundet auf, FLOOR ab.
// - Real hat 32 Bit (IEEE 754): Jedes Zwischenergebnis wird mit Math.fround auf Real gerundet.
// - IN_RANGE: MIN <= VAL und VAL <= MAX. Real-Werte nicht mit CMP == vergleichen, besser IN_RANGE.
// Ganzzahlen exakt mit BigInt; beim Überlauf zeigt OUT das Bitmuster, das im Zweierkomplement übrig bleibt (BigInt.asIntN).

export const RE_TYPEN = {
  Int:  {bits: 16, ganz: true, min: -32768, max: 32767},
  DInt: {bits: 32, ganz: true, min: -2147483648, max: 2147483647},
  Real: {bits: 32, ganz: false, min: -3.402823e38, max: 3.402823e38},
};
export const RE_ZEICHEN = {ADD: "+", SUB: "-", MUL: "*", DIV: "/", MOD: "MOD"};
const RE_GANZ = {
  ADD: (a, b) => a + b,
  SUB: (a, b) => a - b,
  MUL: (a, b) => a * b,
  DIV: (a, b) => a / b,   // BigInt: schneidet zur Null hin ab
  MOD: (a, b) => a % b,   // BigInt: Rest hat das Vorzeichen des Dividenden
};
const RE_KOMMA = {ADD: (a, b) => a + b, SUB: (a, b) => a - b, MUL: (a, b) => a * b, DIV: (a, b) => a / b};
export const RE_NAN_MUSTER = 2143289344;

// Ergebnis: {out, eno, fall, exakt}. out null = laut Hilfe nicht festgelegt. fall: ok, ueberlauf, div0, mod0, ungenau, nurGanz
function reGanz(op, typ, a, b){
  const t = RE_TYPEN[typ];
  if (op === "DIV" && b === 0) return {out: 0, eno: true, fall: "div0", exakt: null};
  if (op === "MOD" && b === 0) return {out: null, eno: null, fall: "mod0", exakt: null};
  const exakt = RE_GANZ[op](BigInt(a), BigInt(b));
  const passt = exakt >= BigInt(t.min) && exakt <= BigInt(t.max);
  return {out: Number(BigInt.asIntN(t.bits, exakt)), eno: passt, fall: passt ? "ok" : "ueberlauf", exakt: exakt.toString()};
}
function reKomma(op, a, b){
  if (!RE_KOMMA[op]) return {out: null, eno: null, fall: "nurGanz", exakt: null};
  if (b === 0) return {out: NaN, eno: true, fall: "div0", exakt: null};
  const out = Math.fround(RE_KOMMA[op](Math.fround(a), Math.fround(b))), exakt = RE_KOMMA[op](a, b);
  if (!Number.isFinite(out)) return {out, eno: false, fall: "ueberlauf", exakt: String(exakt)};
  return {out, eno: true, fall: out === exakt ? "ok" : "ungenau", exakt: String(exakt)};
}
export function reRechnen(op, typ, a, b){
  return RE_TYPEN[typ].ganz ? reGanz(op, typ, a, b) : reKomma(op, a, b);
}

/* ---------- Runden: Eingang Real, Ergebnis im gewählten Datentyp ---------- */
function reRundenGerade(x){
  const unten = Math.floor(x), rest = x - unten;
  if (rest !== 0.5) return Math.round(x);
  return unten % 2 === 0 ? unten : unten + 1;
}
export const RE_RUNDEN = {ROUND: reRundenGerade, TRUNC: Math.trunc, CEIL: Math.ceil, FLOOR: Math.floor};
export function reRunden(op, typ, a){
  const x = Math.fround(a), r = RE_RUNDEN[op](x) + 0, t = RE_TYPEN[typ];   // + 0 macht aus −0 eine 0
  if (!t.ganz) return {out: r, eno: true, fall: "ok", eingang: x};
  const passt = r >= t.min && r <= t.max;
  return {out: passt ? r : null, eno: passt, fall: passt ? "ok" : "ueberlauf", eingang: x};
}

/* ---------- Vergleichen ---------- */
export const RE_VERGLEICH = {
  "==": (a, b) => a === b, "<>": (a, b) => a !== b, ">": (a, b) => a > b,
  "<": (a, b) => a < b, ">=": (a, b) => a >= b, "<=": (a, b) => a <= b,
};
const reAlsTyp = (typ, x) => RE_TYPEN[typ].ganz ? x : Math.fround(x);
export function reVergleichen(typ, a, b){
  const x = reAlsTyp(typ, a), y = reAlsTyp(typ, b);
  return Object.fromEntries(Object.entries(RE_VERGLEICH).map(([k, f]) => [k, f(x, y)]));
}
export function reImBereich(typ, min, wert, max){
  const [lo, v, hi] = [min, wert, max].map(x => reAlsTyp(typ, x));
  return lo <= v && v <= hi;
}

/* ---------- Eingabe ---------- */
// Text → Zahl im Datentyp oder {fehler}. Komma oder Punkt als Dezimalzeichen.
export function reParsen(typ, roh){
  const text = String(roh).trim().replace(",", "."), v = Number(text), t = RE_TYPEN[typ];
  if (text === "" || !Number.isFinite(v)) return {fehler: "Das ist keine Zahl."};
  if (t.ganz && !Number.isInteger(v)) return {fehler: `${typ} kennt keine Nachkommastellen.`};
  if (v < t.min || v > t.max) return {fehler: `${typ} geht nur von ${t.min} bis ${t.max}.`};
  return {wert: v};
}
