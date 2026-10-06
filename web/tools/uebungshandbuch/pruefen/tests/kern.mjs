// Rauchtest des Editor-Kerns: öffnen und schließen, Baustein setzen und speichern, Rückgängig mit Strg+Z.
// Die Abnahmetests des Pakets KERN kommen hier dazu.
export const tests = [
  {
    name: 'Editor öffnen und schließen',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      t.gleich(await t.zaehle('#editor[open]'), 1, 'Editor offen');
      t.erwarte(await t.zaehle('#editor [data-place="init"]') === 1, 'Palette mit Anfangsschritt fehlt');
      await t.knopf('close');
      t.gleich(await t.zaehle('#editor[open]'), 0, 'Editor geschlossen');
    },
  },
  {
    name: 'Baustein setzen und gespeichert',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await t.setze('init', 200, 150);
      t.gleich((await t.objekte('init')).length, 1, 'Anfangsschritt in localStorage');
      t.gleich(await t.zaehle('#edstage .ink [data-o]'), 1, 'Anfangsschritt auf dem Blatt');
      await t.knopf('close');
      await t.oeffne('grafcet');
      t.gleich(await t.zaehle('#edstage .ink [data-o]'), 1, 'Anfangsschritt nach erneutem Öffnen');
    },
  },
  {
    name: 'Strg+Z nimmt das Setzen zurück',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await t.setze('init', 200, 150);
      await t.setze('trans', 200, 260);
      t.gleich((await t.objekte()).length, 2, 'zwei Bausteine gesetzt');
      await t.taste('Escape');   // Beschriftungsfeld der Transition ohne Eingabe schließen
      await t.taste('Control+z');
      t.gleich((await t.objekte()).map((o) => o.k), ['init'], 'nach Strg+Z nur der Anfangsschritt');
      await t.taste('Control+z');
      t.gleich(await t.daten(), null, 'nach zweitem Strg+Z leer');
    },
  },
];
