/* ---------- Interaktive Erklärungen: Zahlenformate (Modell, reine Funktionen) ---------- */
// Ein Wert ist immer ein Bitmuster: eine Zahl ohne Vorzeichen mit 8, 16, 32 oder 64 Bit. Der Datentyp sagt, wie man es liest
// (TIA-Hilfe V21, Datentypen BYTE bis LWORD, SINT bis ULINT, REAL, LREAL; BCD16 laut „Explizite Konvertierung von INT/WORD“).
// zahl.js rechnet mit BigInt (exakt bis 64 Bit). zfBit, zfKippen, zfKuerzen, zfHex, zfBinaer und zfParsen nehmen auch
// Number (Bitmuster bis 32 Bit, so benutzt sie bitmuster.js) und geben dann wieder Number zurück.
// Real über DataView mit Float32, LReal mit Float64 nach IEEE 754.
// Adressen wie %IW0: Big Endian, das Byte mit der kleineren Nummer ist das höherwertige (TIA-Hilfe AWL „L: Laden“).

const ZF_PUFFER = new DataView(new ArrayBuffer(8));
// Gleitpunktzahlen: Breite des Exponenten und der Mantisse, Basis (TIA-Hilfe REAL, LREAL), Genauigkeit in Stellen
export const ZF_GLEIT = {
  32: {exp: 8, man: 23, bias: 127, stellen: 7, ganzBis: "16777216 = 2<sup>24</sup>",
    lesen: m => { ZF_PUFFER.setUint32(0, Number(m)); return ZF_PUFFER.getFloat32(0); },
    schreiben: x => { ZF_PUFFER.setFloat32(0, x); return BigInt(ZF_PUFFER.getUint32(0)); }},
  64: {exp: 11, man: 52, bias: 1023, stellen: 15, ganzBis: "9007199254740992 = 2<sup>53</sup>",
    lesen: m => { ZF_PUFFER.setBigUint64(0, m); return ZF_PUFFER.getFloat64(0); },
    schreiben: x => { ZF_PUFFER.setFloat64(0, x); return ZF_PUFFER.getBigUint64(0); }},
};

/* ---------- Bits (BigInt oder Number) ---------- */
const zfWieEingabe = (u, m) => typeof u === "bigint" ? m : Number(m);
export const zfStellen = bits => 1n << BigInt(bits);
export const zfBit = (u, i) => Number((BigInt(u) >> BigInt(i)) & 1n);
export const zfKippen = (u, i) => zfWieEingabe(u, BigInt(u) ^ (1n << BigInt(i)));
export const zfKuerzen = (u, bits) => zfWieEingabe(u, BigInt.asUintN(bits, BigInt(u)));

/* ---------- BCD16: höchste Tetrade Vorzeichen (0000 + oder 1111 −), darunter drei Ziffern 0 bis 9 ---------- */
export const zfTetrade = (u, i) => Number((BigInt(u) >> BigInt(4 * i)) & 15n);
export function zfBcdTetraden(u){
  return [3, 2, 1, 0].map(i => {
    const w = zfTetrade(u, i), rolle = i === 3 ? "vorzeichen" : "ziffer";
    return {i, w, rolle, gueltig: rolle === "ziffer" ? w <= 9 : w === 0 || w === 15};
  });
}
export function zfBcdWert(u){
  const t = zfBcdTetraden(u);
  if (t.some(x => !x.gueltig)) return null;
  const betrag = t[1].w * 100 + t[2].w * 10 + t[3].w;
  return t[0].w === 15 ? -betrag : betrag;
}
export function zfBcdMuster(v){
  const b = Math.abs(v), ziffern = [Math.floor(b / 100), Math.floor(b / 10) % 10, b % 10];
  return BigInt((v < 0 ? 15 : 0) * 4096 + ziffern[0] * 256 + ziffern[1] * 16 + ziffern[2]);
}

/* ---------- Datentypen ---------- */
// art: bitfolge (ohne Vorzeichen gelesen), ganzzahl (Zweierkomplement), real (IEEE 754), bcd.
// Ganzzahl-Grenzen als BigInt, Real und BCD als Number (Vergleiche zwischen beiden gehen in JavaScript).
export const ZF_TYPEN = {
  Byte:  {bits: 8,  art: "bitfolge", min: 0n, max: 255n},
  Word:  {bits: 16, art: "bitfolge", min: 0n, max: 65535n},
  DWord: {bits: 32, art: "bitfolge", min: 0n, max: 4294967295n},
  LWord: {bits: 64, art: "bitfolge", min: 0n, max: 18446744073709551615n},
  USInt: {bits: 8,  art: "bitfolge", min: 0n, max: 255n},
  UInt:  {bits: 16, art: "bitfolge", min: 0n, max: 65535n},
  UDInt: {bits: 32, art: "bitfolge", min: 0n, max: 4294967295n},
  ULInt: {bits: 64, art: "bitfolge", min: 0n, max: 18446744073709551615n},
  SInt:  {bits: 8,  art: "ganzzahl", min: -128n, max: 127n},
  Int:   {bits: 16, art: "ganzzahl", min: -32768n, max: 32767n},
  DInt:  {bits: 32, art: "ganzzahl", min: -2147483648n, max: 2147483647n},
  LInt:  {bits: 64, art: "ganzzahl", min: -9223372036854775808n, max: 9223372036854775807n},
  Real:  {bits: 32, art: "real", min: -3.402823e38, max: 3.402823e38},
  LReal: {bits: 64, art: "real", min: -1.7976931348623157e308, max: 1.7976931348623157e308},
  BCD16: {bits: 16, art: "bcd", min: -999, max: 999},
};
const ZF_LESEN = {
  bitfolge: m => m,
  ganzzahl: (m, t) => BigInt.asIntN(t.bits, m),
  real: (m, t) => ZF_GLEIT[t.bits].lesen(m),
  bcd: m => zfBcdWert(m),
};
const ZF_SCHREIBEN = {
  bitfolge: v => BigInt(v),
  ganzzahl: (v, t) => BigInt.asUintN(t.bits, BigInt(v)),
  real: (v, t) => ZF_GLEIT[t.bits].schreiben(v),
  bcd: v => zfBcdMuster(v),
};
// Wert im Datentyp: Ganzzahlen als BigInt, Real als Number, BCD16 als Number oder null (ungültig)
export const zfLesen = (typ, u) => ZF_LESEN[ZF_TYPEN[typ].art](BigInt(u), ZF_TYPEN[typ]);
export const zfSchreiben = (typ, v) => ZF_SCHREIBEN[ZF_TYPEN[typ].art](v, ZF_TYPEN[typ]);

/* ---------- Eingabe lesen ---------- */
// Wie in TIA: dezimal, 16#…, 8#…, 2#…, 10#…, Unterstriche erlaubt, davor optional der Typ (W#16#F0F0, INT#-5, L#275).
// Ergebnis {m: BigInt} oder {fehler: Text}. 16#, 8# und 2# geben das Bitmuster direkt an.
const ZF_PRAEFIX = {
  B: "Byte", BYTE: "Byte", W: "Word", WORD: "Word", DW: "DWord", DWORD: "DWord", LW: "LWord", LWORD: "LWord",
  SINT: "SInt", INT: "Int", DINT: "DInt", L: "DInt", LINT: "LInt", USINT: "USInt", UINT: "UInt", UDINT: "UDInt",
  ULINT: "ULInt", REAL: "Real", LREAL: "LReal", C: "BCD16",
};
const ZF_BASIS = [[/^16#([0-9a-f][0-9a-f_]*)$/i, "0x"], [/^8#([0-7][0-7_]*)$/, "0o"], [/^2#([01][01_]*)$/, "0b"]];
function zfMusterText(text, bits){
  for (const [rx, vorsatz] of ZF_BASIS) {
    const m = rx.exec(text); if (!m) continue;
    const u = BigInt(vorsatz + m[1].replace(/_/g, ""));
    return u < zfStellen(bits) ? {m: u} : {fehler: `Das Bitmuster ist breiter als ${bits} Bit.`};
  }
  return null;
}
const ZF_KEINE_ZAHL = "Das ist keine Zahl. Beispiele: 255, -1, 16#00FF, W#16#00FF, 2#1010.";
const zfBereichFehler = (typ, t) => ({fehler: `${typ} geht nur von ${zfZahlText(t.min)} bis ${zfZahlText(t.max)}.`});
function zfGanzDezimal(typ, text, t){
  if (!/^[+-]?\d+$/.test(text)) return {fehler: Number.isFinite(Number(text)) && text ? `${typ} kennt keine Nachkommastellen. Nimm dafür Real.` : ZF_KEINE_ZAHL};
  const v = BigInt(text);
  return v < t.min || v > t.max ? zfBereichFehler(typ, t) : {m: zfSchreiben(typ, v)};
}
const ZF_DEZIMAL = {
  bitfolge: zfGanzDezimal,
  ganzzahl: zfGanzDezimal,
  real(typ, text, t){
    const v = Number(text);
    if (text === "" || !Number.isFinite(v)) return {fehler: ZF_KEINE_ZAHL};
    return v < t.min || v > t.max ? zfBereichFehler(typ, t) : {m: zfSchreiben(typ, v)};
  },
  bcd(typ, text, t){
    if (!/^[+-]?\d+$/.test(text)) return {fehler: "BCD16 kennt nur ganze Zahlen von -999 bis 999."};
    const v = Number(text);
    return v < t.min || v > t.max ? zfBereichFehler(typ, t) : {m: zfSchreiben(typ, v)};
  },
};
function zfOhnePraefix(typ, text){
  const t = ZF_TYPEN[typ], dezimal = text.replace(/^10#/, "").replace(/_/g, "").replace(",", ".");
  return zfMusterText(text, t.bits) || ZF_DEZIMAL[t.art](typ, dezimal, t);
}
export function zfMusterParsen(typ, roh){
  const text = String(roh).trim().replace(/\s/g, ""), p = /^([a-z]+)#(.+)$/i.exec(text);
  if (!p) return zfOhnePraefix(typ, text);
  const quelle = ZF_PRAEFIX[p[1].toUpperCase()], bits = ZF_TYPEN[typ].bits;
  if (!quelle) return {fehler: `${p[1]}# kenne ich nicht. Beispiele: W#16#F0F0, INT#-5, DW#16#0000_00FF, L#275.`};
  if (ZF_TYPEN[quelle].bits !== bits) return {fehler: `${p[1]}# steht für ${quelle} mit ${ZF_TYPEN[quelle].bits} Bit, hier sind es ${bits} Bit.`};
  return zfOhnePraefix(quelle, p[2]);
}
// Alte Schnittstelle (bitmuster.js): Bitmuster als Number
export function zfParsen(typ, text){
  const r = zfMusterParsen(typ, text);
  return r.fehler ? r : {u: Number(r.m)};
}
// Eingabe für eine Speicherebene (Byte, Word, DWord, LWord): ohne Typ-Präfix gilt -5 als Ganzzahl mit Vorzeichen,
// 1.5 als Real bzw. LReal, sonst die Bitfolge (TIA-Hilfe WORD: „dezimal mit den gleichen Daten wie INT und UINT“)
const ZF_EBENE_TYP = {
  folge: {8: "Byte", 16: "Word", 32: "DWord", 64: "LWord"},
  vz: {8: "SInt", 16: "Int", 32: "DInt", 64: "LInt"},
  gleit: {32: "Real", 64: "LReal"},
};
const ZF_EBENE_ART = [
  [t => /^-\d/.test(t), "vz"],
  [t => !t.includes("#") && /^[+-]?[\d_]*[.,e]/i.test(t), "gleit"],
];
export function zfEbeneParsen(bits, roh){
  const text = String(roh).trim().replace(/\s/g, "");
  const art = (ZF_EBENE_ART.find(([pruefe]) => pruefe(text)) || [null, "folge"])[1];
  return zfMusterParsen(ZF_EBENE_TYP[art][bits] || ZF_EBENE_TYP.folge[bits], text);
}

/* ---------- +1 und −1 ---------- */
// Ergebnis {m, meldung}: meldung ist null, "ueberlauf", "unterlauf", "ungenau", "bcdGrenze" oder "bcdUngueltig"
const ZF_SCHRITT = {
  bitfolge: zfSchrittGanz, ganzzahl: zfSchrittGanz,
  real(typ, m, d){
    const alt = zfLesen(typ, m), neuM = zfSchreiben(typ, alt + d), neu = zfLesen(typ, neuM);
    return {m: neuM, meldung: neu === alt && Number.isFinite(alt) ? "ungenau" : null};
  },
  bcd(typ, m, d){
    const alt = zfLesen(typ, m);
    if (alt === null) return {m, meldung: "bcdUngueltig"};
    const neu = alt + d, t = ZF_TYPEN[typ];
    return neu < t.min || neu > t.max ? {m, meldung: "bcdGrenze"} : {m: zfBcdMuster(neu), meldung: null};
  },
};
function zfSchrittGanz(typ, m, d){
  const t = ZF_TYPEN[typ], neu = zfLesen(typ, m) + BigInt(d);
  const meldung = neu > t.max ? "ueberlauf" : neu < t.min ? "unterlauf" : null;
  return {m: BigInt.asUintN(t.bits, m + BigInt(d)), meldung};
}
export const zfSchritt = (typ, m, d) => ZF_SCHRITT[ZF_TYPEN[typ].art](typ, BigInt(m), d);

/* ---------- Schreibweisen wie in TIA ---------- */
function zfGruppen(ziffern, laenge){
  const teile = [];
  for (let i = ziffern.length; i > 0; i -= laenge) teile.unshift(ziffern.slice(Math.max(0, i - laenge), i));
  return teile.join("_");
}
export const zfBinaer = (u, bits) => "2#" + zfGruppen(BigInt(u).toString(2).padStart(bits, "0"), 4);
export const zfHex = (u, bits) => "16#" + zfGruppen(BigInt(u).toString(16).toUpperCase().padStart(bits / 4, "0"), 4);
// Zahl wie im Programmstatus: Ganzzahl ohne Tausenderzeichen, Real mit Punkt und höchstens 7 (LReal 15) gültigen Stellen
export function zfZahlText(v, stellen = 7){
  if (v === null || v === undefined) return "ungültig";
  if (typeof v === "bigint") return String(v);
  if (Number.isNaN(v)) return "NaN";
  if (!Number.isFinite(v)) return v > 0 ? "+Inf" : "-Inf";
  if (Number.isInteger(v) && Math.abs(v) < 1e15) return String(v);
  const kurz = Number(v.toPrecision(stellen));
  return Math.abs(kurz) >= 10 ** stellen || (kurz !== 0 && Math.abs(kurz) < 1e-4) ? kurz.toExponential().replace(/e\+?/, "e") : String(kurz);
}
// Gespeicherter Gleitpunktwert mit mehr Stellen, damit man sieht, was wirklich im Speicher steht
export const zfGenau = (x, stellen = 15) => Number.isFinite(x) ? String(Number(x.toPrecision(stellen))) : zfZahlText(x);

/* ---------- Real und LReal: Vorzeichen, Exponent, Mantisse ---------- */
const ZF_REAL_ART = [
  [t => t.exponent === t.expMax && t.mantisse === 0, "unendlich"],
  [t => t.exponent === t.expMax, "nan"],
  [t => t.exponent === 0 && t.mantisse === 0, "null"],
  [t => t.exponent === 0, "denormal"],
  [() => true, "normal"],
];
export function zfRealTeile(u, bits = 32){
  const g = ZF_GLEIT[bits], m = BigInt(u), expMax = 2 ** g.exp - 1;
  const t = {...g, bits, expMax, vorzeichen: zfBit(m, bits - 1),
    exponent: Number((m >> BigInt(g.man)) & BigInt(expMax)), mantisse: Number(m & ((1n << BigInt(g.man)) - 1n))};
  t.art = ZF_REAL_ART.find(([pruefe]) => pruefe(t))[1];
  t.faktor = 1 + t.mantisse / 2 ** g.man;
  return t;
}
// Rolle eines Bits im Datentyp: Vorzeichen, Exponent, Mantisse (Real, LReal) oder Vorzeichen (SInt bis LInt)
const ZF_ROLLE = {
  ganzzahl: (i, bits) => i === bits - 1 ? "vz" : "",
  real: (i, bits) => i === bits - 1 ? "vz" : i >= ZF_GLEIT[bits].man ? "exp" : "man",
};
export const zfRolle = (typ, i) => (ZF_ROLLE[ZF_TYPEN[typ].art] || (() => ""))(i, ZF_TYPEN[typ].bits);

/* ---------- Adressen ---------- */
// "IW0", "%QB1", "MD4" → {bereich: "I", breite: "W", start: 0, bits: 16}; sonst null
const ZF_BREITE = {B: 8, W: 16, D: 32};
export function zfAdresse(text){
  const m = /^%?([IQM])([BWD])(\d+)$/.exec(String(text || "").trim().toUpperCase());
  return m ? {bereich: m[1], breite: m[2], start: +m[3], bits: ZF_BREITE[m[2]]} : null;
}
// Bytes von links (höchstwertig) nach rechts: [{adresse: 0, wert}], Big Endian
export function zfBytes(u, bits, start = 0){
  const m = BigInt(u);
  return Array.from({length: bits / 8}, (_, k) => ({adresse: start + k, wert: Number((m >> BigInt(bits - 8 * (k + 1))) & 255n)}));
}
// Umgekehrt: Bytewerte (höchstwertiges zuerst) → Bitmuster
export const zfAusBytes = werte => werte.reduce((m, w) => (m << 8n) | BigInt(w), 0n);
