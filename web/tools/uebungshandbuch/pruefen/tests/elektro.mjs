// Abnahmetests des Pakets ELEKTRO: Stromlaufplan (stromlauf) und Hauptstromkreis (leistung).
// Strompfad n liegt bei x = 40 + n · 46, L+ bei y = 70, M bei y = 590 (Blatt 1).
const PFAD = (n) => 40 + n * 46;

// Senkrechte automatische Leitungen als [x, y1, y2]
async function autoLeitungen(t) {
  return t.page.$$eval('#edstage .ink path.autoleitung', (ps) => ps.map((p) => p.getAttribute('d'))
    .map((d) => d.match(/-?[\d.]+/g).map(Number)));
}
// Auswahl aufheben, damit der nächste Baustein keine Kette fortsetzt
const lose = (t) => t.taste('Escape');

export const tests = [
  {
    name: 'E1 automatische Leitungen nur am Kettenanfang und Kettenende',
    lauf: async (t) => {
      await t.oeffne('stromlauf');
      await t.setze('estop', PFAD(1), 120);
      await t.setze('coil', PFAD(1), 250);
      await lose(t);
      await t.setze('no', PFAD(2), 330);   // freier Kontakt: bleibt offen
      await lose(t);
      const al = await autoLeitungen(t);
      t.gleich(al.length, 2, 'zwei automatische Leitungen (L+ oben, M unten)');
      t.erwarte(al.every(([x]) => x === PFAD(1)), 'nur im Strompfad 1');
      t.gleich(al.map(([, y]) => y).sort((a, b) => a - b), [70, 590], 'zu L+ und zu M');
    },
  },
  {
    name: 'E1 keine automatische Leitung durch ein Bauteil',
    lauf: async (t) => {
      await t.oeffne('stromlauf');
      await t.setze('lamp', PFAD(3), 110);   // einzelnes Bauteil oben im Pfad
      await lose(t);
      await t.setze('tno', PFAD(3), 360);
      await t.setze('coil', PFAD(3), 470);
      await lose(t);
      const al = (await autoLeitungen(t)).filter(([x]) => x === PFAD(3));
      t.gleich(al.map(([, y]) => y), [590], 'nur die Leitung unten zu M, oben läge die Leuchte im Weg');
    },
  },
];
