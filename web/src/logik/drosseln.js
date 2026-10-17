// ----------------------------------------------------------------------------
// Drosselrückschlagventile: je Zylinder eines für Ausfahren und eines für Einfahren
// (Abluftdrosselung – das Ventil an Anschluss B bremst das Ausfahren, das an A das Einfahren).
// Öffnung 0…100 %: 50 % = Nennfahrzeit, 100 % = doppelt so schnell, 0 % = zu, der Zylinder steht.
// ----------------------------------------------------------------------------
export const DROSSEL_GRUND = 50;
export const DROSSEL_ZYL = ['MM1', 'MM2', 'MM3', 'MM4', 'MM5', 'MM6', 'MM8'];
export const DROSSEL = Object.fromEntries(DROSSEL_ZYL.map(k => [k, { aus: DROSSEL_GRUND, ein: DROSSEL_GRUND }]));

const SPEICHER = 'zinnbad-drosseln';
try {
  const gespeichert = JSON.parse(localStorage.getItem(SPEICHER) || '{}');
  for (const k of DROSSEL_ZYL) for (const r of ['aus', 'ein']) {
    const w = gespeichert[k]?.[r];
    if (Number.isFinite(w)) DROSSEL[k][r] = Math.max(0, Math.min(100, w));
  }
} catch { /* kein Speicher – Grundeinstellung */ }

export function drosselSpeichern() {
  try { localStorage.setItem(SPEICHER, JSON.stringify(DROSSEL)); } catch { /* kein Speicher */ }
}
// Geschwindigkeitsfaktor: richtung > 0 = Ausfahren, sonst Einfahren
export function drosselFaktor(kurz, richtung) {
  const d = DROSSEL[kurz];
  return d ? (richtung > 0 ? d.aus : d.ein) / DROSSEL_GRUND : 1;
}
