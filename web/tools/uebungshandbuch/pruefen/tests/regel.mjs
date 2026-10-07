// Abnahmetests des Pakets REGEL: Regelkreis, Trendaufzeichnung, Kästchenraster.
// Koordinaten sind Blattkoordinaten (1000 × 707 je Blatt).

// Zahl der Texte mit genau diesem Inhalt im Element sel
const texte = (t, sel, inhalt) => t.page.evaluate(([s, i]) =>
  [...document.querySelectorAll(`${s} text`)].filter((e) => e.textContent === i).length, [sel, inhalt]);
// Texte mit diesem Inhalt auf Blatt n (0, 1 …) im Vorgedruckten des ersten SVG unter sel
const blattTexte = (t, sel, n, inhalt) => texte(t, `${sel} .tpl > g[transform="translate(0 ${n * 707})"]`, inhalt);
// IDs, die in einem SVG mehrfach vorkommen
const doppelteIds = (t, sel) => t.page.evaluate((s) => [...document.querySelectorAll(s)].flatMap((svg) => {
  const ids = [...svg.querySelectorAll('[id]')].map((e) => e.id);
  return ids.filter((id, i) => ids.indexOf(id) !== i);
}), sel);

export const tests = [
  {
    name: 'R1 Vordruck nur auf Blatt 1, IDs eindeutig',
    daten: 'regel-zwei-blaetter',
    lauf: async (t) => {
      await t.oeffne('regelkreis');
      t.gleich(await blattTexte(t, '#edstage', 0, 'Bedeutung in dieser Übung'), 1, 'Vordruck auf Blatt 1 im Editor');
      t.gleich(await blattTexte(t, '#edstage', 1, 'Bedeutung in dieser Übung'), 0, 'Vordruck auf Blatt 2 im Editor');
      t.gleich(await doppelteIds(t, '#edstage svg'), [], 'doppelte IDs im Editor');
      await t.drucke();
      t.gleich(await t.zaehle('#print section.land'), 2, 'zwei Druckblätter');
      t.gleich(await blattTexte(t, '#print section.land:nth-of-type(2)', 1, 'Bedeutung in dieser Übung'), 0, 'Druck Blatt 2');
      t.gleich(await blattTexte(t, '#print section.land:nth-of-type(1)', 0, 'Bedeutung in dieser Übung'), 1, 'Druck Blatt 1');
      t.gleich(await doppelteIds(t, '#print svg'), [], 'doppelte IDs im Druck');
    },
  },
];
