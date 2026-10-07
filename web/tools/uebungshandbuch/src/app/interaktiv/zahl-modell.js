/* ---------- Interaktive Erklärungen: Zahlenformate (Modell, reine Funktionen) ---------- */
// Ein Wert ist immer ein Bitmuster u: eine Zahl ohne Vorzeichen mit 8, 16 oder 32 Bit. Der Datentyp sagt, wie man es liest
// (TIA-Hilfe V21, Datentypen BYTE, WORD, DWORD, INT, DINT, REAL; BCD16 laut „Explizite Konvertierung von INT/WORD“).
// Ganzzahlen bleiben exakt (höchstens 32 Bit, also unter 2^53), Real wird über Float32 nach IEEE 754 gelesen und geschrieben.
// Adressen wie %IW0: Big Endian, das Byte mit der kleineren Nummer ist das höherwertige (TIA-Hilfe AWL „L: Laden“).

const ZF_PUFFER = new DataView(new ArrayBuffer(4));
export function zfRealAusMuster(u){ ZF_PUFFER.setUint32(0, u); return ZF_PUFFER.getFloat32(0); }
export function zfMusterAusReal(x){ ZF_PUFFER.setFloat32(0, x); return ZF_PUFFER.getUint32(0); }

export const zfStellen = bits => 2 ** bits;
export const zfBit = (u, i) => Math.floor(u / 2 ** i) % 2;
export const zfKippen = (u, i) => zfBit(u, i) ? u - 2 ** i : u + 2 ** i;
export const zfKuerzen = (u, bits) => u % zfStellen(bits);
const zfVorzeichen = (u, bits) => u >= 2 ** (bits - 1) ? u - zfStellen(bits) : u;
const zfZweier = (v, bits) => v < 0 ? v + zfStellen(bits) : v;

/* ---------- BCD16: höchste Tetrade Vorzeichen (0000 + oder 1111 −), darunter drei Ziffern 0 bis 9 ---------- */
export const zfTetrade = (u, i) => Math.floor(u / 16 ** i) % 16;
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
  return (v < 0 ? 15 : 0) * 4096 + ziffern[0] * 256 + ziffern[1] * 16 + ziffern[2];
}

/* ---------- Datentypen ---------- */
// art: bitfolge (ohne Vorzeichen gelesen), ganzzahl (Zweierkomplement), real (IEEE 754), bcd
export const ZF_TYPEN = {
  Byte:  {bits: 8,  art: "bitfolge", min: 0, max: 255},
  Word:  {bits: 16, art: "bitfolge", min: 0, max: 65535},
  DWord: {bits: 32, art: "bitfolge", min: 0, max: 4294967295},
  USInt: {bits: 8,  art: "bitfolge", min: 0, max: 255},
  UInt:  {bits: 16, art: "bitfolge", min: 0, max: 65535},
  UDInt: {bits: 32, art: "bitfolge", min: 0, max: 4294967295},
  SInt:  {bits: 8,  art: "ganzzahl", min: -128, max: 127},
  Int:   {bits: 16, art: "ganzzahl", min: -32768, max: 32767},
  DInt:  {bits: 32, art: "ganzzahl", min: -2147483648, max: 2147483647},
  Real:  {bits: 32, art: "real", min: -3.402823e38, max: 3.402823e38},
  BCD16: {bits: 16, art: "bcd", min: -999, max: 999},
};
const ZF_LESEN = {
  bitfolge: (u) => u,
  ganzzahl: (u, t) => zfVorzeichen(u, t.bits),
  real: (u) => zfRealAusMuster(u),
  bcd: (u) => zfBcdWert(u),
};
const ZF_SCHREIBEN = {
  bitfolge: (v) => v,
  ganzzahl: (v, t) => zfZweier(v, t.bits),
  real: (v) => zfMusterAusReal(v),
  bcd: (v) => zfBcdMuster(v),
};
export const zfLesen = (typ, u) => ZF_LESEN[ZF_TYPEN[typ].art](u, ZF_TYPEN[typ]);
export const zfSchreiben = (typ, v) => ZF_SCHREIBEN[ZF_TYPEN[typ].art](v, ZF_TYPEN[typ]);

/* ---------- Eingabe lesen: dezimal, 16#… oder 2#… (Unterstriche erlaubt) ---------- */
// Ergebnis {u} oder {fehler: Text}. 16# und 2# geben das Bitmuster direkt an.
const ZF_BASIS = [[/^16#([0-9a-f_]+)$/i, 16], [/^2#([01_]+)$/, 2]];
function zfMusterText(text, bits){
  for (const [rx, basis] of ZF_BASIS) {
    const m = rx.exec(text); if (!m) continue;
    const u = parseInt(m[1].replace(/_/g, ""), basis);
    return u < zfStellen(bits) ? {u} : {fehler: `Das Bitmuster ist breiter als ${bits} Bit.`};
  }
  return null;
}
function zfDezimalText(typ, text){
  const t = ZF_TYPEN[typ], v = Number(text.replace(",", "."));
  if (text === "" || !Number.isFinite(v)) return {fehler: "Das ist keine Zahl. Beispiele: 255, -1, 16#00FF, 2#1010."};
  if (t.art !== "real" && !Number.isInteger(v)) return {fehler: `${typ} kennt keine Nachkommastellen. Nimm dafür Real.`};
  if (v < t.min || v > t.max) return {fehler: `${typ} geht nur von ${zfZahlText(t.min)} bis ${zfZahlText(t.max)}.`};
  return {u: zfSchreiben(typ, v)};
}
export function zfParsen(typ, roh){
  const text = String(roh).trim().replace(/\s/g, "");
  return zfMusterText(text, ZF_TYPEN[typ].bits) || zfDezimalText(typ, text);
}

/* ---------- +1 und −1 ---------- */
// Ergebnis {u, meldung}: meldung ist null, "ueberlauf", "unterlauf", "ungenau", "bcdGrenze" oder "bcdUngueltig"
const ZF_SCHRITT = {
  bitfolge: zfSchrittGanz, ganzzahl: zfSchrittGanz,
  real(typ, u, d){
    const alt = zfLesen(typ, u), neu = Math.fround(alt + d);
    return {u: zfMusterAusReal(neu), meldung: neu === alt && Number.isFinite(alt) ? "ungenau" : null};
  },
  bcd(typ, u, d){
    const alt = zfLesen(typ, u);
    if (alt === null) return {u, meldung: "bcdUngueltig"};
    const neu = alt + d, t = ZF_TYPEN[typ];
    return neu < t.min || neu > t.max ? {u, meldung: "bcdGrenze"} : {u: zfBcdMuster(neu), meldung: null};
  },
};
function zfSchrittGanz(typ, u, d){
  const t = ZF_TYPEN[typ], neu = zfLesen(typ, u) + d;
  const meldung = neu > t.max ? "ueberlauf" : neu < t.min ? "unterlauf" : null;
  return {u: (u + d + zfStellen(t.bits)) % zfStellen(t.bits), meldung};
}
export const zfSchritt = (typ, u, d) => ZF_SCHRITT[ZF_TYPEN[typ].art](typ, u, d);

/* ---------- Schreibweisen wie in TIA ---------- */
function zfGruppen(ziffern, laenge){
  const teile = [];
  for (let i = ziffern.length; i > 0; i -= laenge) teile.unshift(ziffern.slice(Math.max(0, i - laenge), i));
  return teile.join("_");
}
export const zfBinaer = (u, bits) => "2#" + zfGruppen(u.toString(2).padStart(bits, "0"), 4);
export const zfHex = (u, bits) => "16#" + zfGruppen(u.toString(16).toUpperCase().padStart(bits / 4, "0"), 4);
// Zahl wie im Programmstatus: Ganzzahl ohne Tausenderzeichen, Real mit Punkt und höchstens 7 gültigen Stellen
export function zfZahlText(v){
  if (v === null || v === undefined) return "ungültig";
  if (Number.isNaN(v)) return "NaN";
  if (!Number.isFinite(v)) return v > 0 ? "+Inf" : "-Inf";
  if (Number.isInteger(v) && Math.abs(v) < 1e15) return String(v);
  const kurz = Number(v.toPrecision(7));
  return Math.abs(kurz) >= 1e7 || (kurz !== 0 && Math.abs(kurz) < 1e-4) ? kurz.toExponential().replace(/e\+?/, "e") : String(kurz);
}
// Gespeicherter Real-Wert mit mehr Stellen, damit man sieht, was wirklich im Speicher steht
export const zfGenau = x => Number.isFinite(x) ? String(Number(x.toPrecision(15))) : zfZahlText(x);

/* ---------- Real: Vorzeichen, Exponent, Mantisse ---------- */
const ZF_REAL_ART = [
  [t => t.exponent === 255 && t.mantisse === 0, "unendlich"],
  [t => t.exponent === 255, "nan"],
  [t => t.exponent === 0 && t.mantisse === 0, "null"],
  [t => t.exponent === 0, "denormal"],
  [() => true, "normal"],
];
export function zfRealTeile(u){
  const t = {vorzeichen: zfBit(u, 31), exponent: Math.floor(u / 2 ** 23) % 256, mantisse: u % 2 ** 23};
  t.art = ZF_REAL_ART.find(([pruefe]) => pruefe(t))[1];
  t.faktor = 1 + t.mantisse / 2 ** 23;
  return t;
}
// Rolle eines Bits im Datentyp: Vorzeichen, Exponent, Mantisse (Real) oder Vorzeichen (Int, DInt)
const ZF_ROLLE = {
  ganzzahl: (i, bits) => i === bits - 1 ? "vz" : "",
  real: i => i === 31 ? "vz" : i >= 23 ? "exp" : "man",
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
  return Array.from({length: bits / 8}, (_, k) => ({adresse: start + k, wert: Math.floor(u / 2 ** (bits - 8 * (k + 1))) % 256}));
}
