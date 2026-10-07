// Abnahmetests des Pakets PNEU: Pneumatikschaltplan (Leitungen, Simulation, Symbole, Prüfen) und Weg-Schritt-Diagramm.
// Startdaten in daten/pneu-*.json. Koordinaten sind Blattkoordinaten.

// Abschnitte [x1, y1, x2, y2] eines Pfads aus M/L-Befehlen
function abschnitte(d) {
  const p = d.replace(/^M/, '').split('L').map((q) => q.trim().split(/[\s,]+/).map(Number));
  return p.slice(1).map((q, i) => [...p[i], ...q]);
}
// Liegen zwei Abschnitte deckungsgleich übereinander (gleiche Gerade, Überlappung länger als 1)?
function deckungsgleich([a1, b1, a2, b2], [c1, d1, c2, d2]) {
  const ueber = (u1, u2, v1, v2) => Math.min(Math.max(u1, u2), Math.max(v1, v2)) - Math.max(Math.min(u1, u2), Math.min(v1, v2)) > 1;
  if (b1 === b2 && d1 === d2 && b1 === d1) return ueber(a1, a2, c1, c2);
  if (a1 === a2 && c1 === c2 && a1 === c1) return ueber(b1, b2, d1, d2);
  return false;
}
// Pfade der Leitungen auf dem Blatt
const leitungen = (t) => t.page.$$eval('#edstage .ink [data-c] > path:first-child', (ps) => ps.map((p) => p.getAttribute('d')));

export const tests = [
  {
    name: 'P1 Leitungen verschiedener Anschlüsse liegen nie deckungsgleich',
    daten: 'pneu-gekreuzt',
    lauf: async (t) => {
      await t.oeffne('pneumatik');
      const wege = (await leitungen(t)).map(abschnitte);
      t.gleich(wege.length, 2, 'zwei Leitungen');
      for (const a of wege[0]) for (const b of wege[1]) t.erwarte(!deckungsgleich(a, b), `deckungsgleich: ${a} und ${b}`);
    },
  },
];
