/* ---------- Interaktive Erklärungen: Speicheraufbau (Modell, reine Funktionen) ---------- */
// Ein Speicherbereich (I, Q, M) als Bytes mit Adresse. Darüber liegen Wörter und Doppelwörter, nach S7-Regel Big Endian:
// Das Byte mit der niedrigeren Adresse ist das höherwertige (TIA-Hilfe V21 „L: Laden (S7-1500)“: L MD10 lädt MB10 in
// Bit 31 bis 24 und MB13 in Bit 7 bis 0; Programmierleitfaden 2.6.3).
// sp = {bereich, basis, start, n, ueberlappung, bytes: {Adresse: Wert}, wahl: {bits, adr}}
// Fenster: ab start n Byte (1 Byte, 2 Wort, 4 Doppelwort, 8 LWord). start ist basis, basis + 1, basis + 2 oder die
// Adresse des Operanden (Überlappung ausprobieren). Anfangs so breit wie der Operand, mindestens ein Byte.
import { zfAusBytes, zfBytes } from './zahl-modell.js';

export const ZS_KURZ = {8: "B", 16: "W", 32: "D"};
export const ZS_BREITEN = [2, 4, 8];
export const zsFensterBytes = sp => sp.n;
const zsPasst = (sp, adr, bits) => adr >= sp.start && adr + bits / 8 <= sp.start + zsFensterBytes(sp);

// Startadressen zum Umschalten; dazu die des Operanden, falls er sonst nicht ins Fenster passt
export function zsStarts(sp){
  return [...new Set([sp.basis, sp.basis + 1, sp.basis + 2, sp.start])].sort((a, b) => a - b);
}
// Fenster so legen, dass der Operand (adr, bits) ganz zu sehen ist
export function zsOperandZeigen(sp, adr, bits){
  sp.n = Math.max(sp.n, bits / 8);
  if (!zsPasst(sp, adr, bits)) sp.start = adr;
}
export function zsNeu(bereich, adr, bits){
  const sp = {bereich, basis: adr - adr % 4, start: adr, n: bits / 8, ueberlappung: false, bytes: {}, wahl: {bits, adr}};
  zsOperandZeigen(sp, adr, bits);
  return sp;
}

/* ---------- Lesen und Schreiben (Big Endian) ---------- */
export const zsByte = (sp, adr) => sp.bytes[adr] || 0;
export function zsLesen(sp, adr, bits){
  return zfAusBytes(Array.from({length: bits / 8}, (_, k) => zsByte(sp, adr + k)));
}
export function zsSchreiben(sp, adr, bits, m){
  for (const b of zfBytes(m, bits, adr)) sp.bytes[b.adresse] = b.wert;
}
export function zsBitKippen(sp, adr, bit){ sp.bytes[adr] = zsByte(sp, adr) ^ (1 << bit); }

/* ---------- Ebenen im Fenster ---------- */
// versatz: Wörter, die ein Byte versetzt beginnen (Überlappung, z. B. %IW1 = %IB1 + %IB2)
const ZS_EBENEN = [
  {bits: 64},
  {bits: 32},
  {bits: 16},
  {bits: 16, versatz: 1, nur: sp => sp.ueberlappung},
  {bits: 8},
];
function zsFelder(sp, e){
  const felder = [], schritt = e.versatz ? 2 : e.bits / 8, n = zsFensterBytes(sp);
  for (let k = e.versatz || 0; k + e.bits / 8 <= n; k += schritt) felder.push({adr: sp.start + k, bits: e.bits, spalte: k});
  return felder;
}
export const zsZeilen = sp => ZS_EBENEN.filter(e => !e.nur || e.nur(sp)).map(e => ({...e, felder: zsFelder(sp, e)}))
  .filter(e => e.felder.length);

/* ---------- Beziehung zur gewählten Ebene ---------- */
const zsEnde = f => f.adr + f.bits / 8;
export const zsGleich = (a, b) => a.adr === b.adr && a.bits === b.bits;
export const zsDrin = (f, w) => f.adr >= w.adr && zsEnde(f) <= zsEnde(w);
export const zsTeilweise = (f, w) => !zsDrin(f, w) && !zsDrin(w, f) && f.adr < zsEnde(w) && w.adr < zsEnde(f);
// Bit hi bis lo, die das Feld f in der gewählten Ebene w belegt
export function zsBitsIn(f, w){
  const hi = w.bits - 1 - 8 * (f.adr - w.adr);
  return {hi, lo: hi - f.bits + 1};
}
// "hoeher", "nieder" oder "" (mittlere Teile eines Doppel- oder LWorts)
export function zsWertigkeit(f, w){
  const anzahl = w.bits / f.bits, pos = (f.adr - w.adr) / (f.bits / 8);
  return pos === 0 ? "hoeher" : pos === anzahl - 1 ? "nieder" : "";
}
// Bitnummer in der gewählten Ebene für Byte adr, Bit j; null, wenn das Byte nicht dazugehört
export function zsBitNr(w, adr, j){
  return adr >= w.adr && adr < zsEnde(w) ? (zsEnde(w) - 1 - adr) * 8 + j : null;
}
