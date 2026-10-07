/* ---------- Interaktive Erklärungen: Bitmuster verknüpfen, schieben, rotieren (Modell, reine Funktionen) ---------- */
// Wortverknüpfungen AND, OR, XOR verknüpfen Bit für Bit. SHL, SHR, ROL, ROR verschieben um N Stellen (TIA-Hilfe V21, SCL):
// SHL/SHR füllen frei werdende Stellen mit 0; ist N größer als die Bitbreite, wird um alle Stellen geschoben (Ergebnis 0).
// ROL/ROR füllen mit den hinausgeschobenen Bits; N größer als die Bitbreite rotiert trotzdem um N Stellen.
// SHR füllt nur bei Werten ohne Vorzeichen mit 0, hier gibt es nur Byte und Word.
import { zfBit } from './zahl-modell.js';

export const BM_LOGIK = {
  AND: (x, y) => x && y,
  OR: (x, y) => x || y,
  XOR: (x, y) => x !== y,
};
// Quellbit für Zielbit i (null: nachgeschobene 0)
const BM_QUELLE = {
  SHL: (i, n) => i - n >= 0 ? i - n : null,
  SHR: (i, n, b) => i + n < b ? i + n : null,
  ROL: (i, n, b) => ((i - n) % b + b) % b,
  ROR: (i, n, b) => (i + n) % b,
};
// Bits, die beim Rotieren am anderen Ende wieder hereinkommen
const BM_RUND = {
  ROL: (i, n, b) => i < n % b,
  ROR: (i, n, b) => i >= b - n % b,
};
export const bmIstSchieben = op => op in BM_QUELLE;

const bmAusBits = bits => bits.reduce((u, an, i) => u + (an ? 2 ** i : 0), 0);

// Ergebnis bitweise: [{an, geaendert}] je Bit (Index = Bitnummer) und das Bitmuster u
export function bmVerknuepfen(op, a, maske, bits){
  const liste = Array.from({length: bits}, (_, i) => {
    const an = BM_LOGIK[op](!!zfBit(a, i), !!zfBit(maske, i));
    return {an: an ? 1 : 0, geaendert: (an ? 1 : 0) !== zfBit(a, i)};
  });
  return {u: bmAusBits(liste.map(x => x.an)), bits: liste};
}

// Schieben/Rotieren: je Zielbit {an, quelle (Bitnummer oder null), rund}, dazu die herausgefallenen Bits [{i, an}]
export function bmSchieben(op, a, n, bits){
  const liste = Array.from({length: bits}, (_, i) => {
    const quelle = BM_QUELLE[op](i, n, bits);
    return {an: quelle === null ? 0 : zfBit(a, quelle), quelle, rund: !!(BM_RUND[op] && BM_RUND[op](i, n, bits))};
  });
  const benutzt = new Set(liste.map(x => x.quelle));
  const raus = Array.from({length: bits}, (_, i) => i).filter(i => !benutzt.has(i)).map(i => ({i, an: zfBit(a, i)}));
  return {u: bmAusBits(liste.map(x => x.an)), bits: liste, raus};
}
