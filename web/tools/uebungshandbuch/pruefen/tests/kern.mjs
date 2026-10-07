// Abnahmetests des Editor-Kerns (Paket KERN). Rauchtest: öffnen und schließen, Baustein setzen und speichern,
// Rückgängig mit Strg+Z. Danach je Punkt K1, K2 … die Tests aus WELLE1.md.

// Anfangsschritt setzen und das Beschriftungsfeld schließen
async function anfangsschritt(t, x = 200, y = 150) {
  await t.setze('init', x, y);
  await t.taste('Escape');
}
// Schriftfeld öffnen und den Namen eintippen
async function nameEintragen(t, name) {
  await t.werkzeug('sel');
  await t.klick('#edstage [data-sf]');
  await t.klick('#props [data-prop="mn"]');
  await t.tippe(name);
}
const lage = async (t) => (await t.objekte()).map((o) => [o.x, o.y]);

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
  /* ---------- K1 Rückgängig ---------- */
  {
    name: 'K1 Fokus im Feld ohne Eingabe ist kein Verlaufsschritt',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await anfangsschritt(t);
      await t.werkzeug('sel');
      await t.klick('#edstage [data-sf]');
      await t.klick('#props [data-prop="mn"]');
      await t.klick([600, 300]);
      await t.knopf('undo');
      t.gleich(await t.daten(), null, 'ein Rückgängig nimmt das Setzen zurück');
    },
  },
  {
    name: 'K1 Tippen im Feld ist ein Schritt, Rückgängig zeigt das Schriftfeld neu',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await anfangsschritt(t);
      await nameEintragen(t, 'Mia');
      t.gleich((await t.daten()).meta, { name: 'Mia' }, 'Name gespeichert');
      t.erwarte((await t.text('#edstage .tpl')).includes('Mia'), 'Name im Schriftfeld');
      await t.knopf('undo');
      const d = await t.daten();
      t.gleich([d.meta, d.o.length], [undefined, 1], 'Name weg, Anfangsschritt bleibt');
      t.erwarte(!(await t.text('#edstage .tpl')).includes('Mia'), 'Schriftfeld ohne Namen');
    },
  },
  {
    name: 'K1 Alles leeren behält das Schriftfeld, Rückgängig holt alles zurück',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await anfangsschritt(t);
      await nameEintragen(t, 'Mia');
      await t.knopf('clear');
      const d = await t.daten();
      t.gleich([d.o.length, d.meta], [0, { name: 'Mia' }], 'leer, Name bleibt');
      await t.knopf('undo');
      t.gleich((await t.objekte()).length, 1, 'Anfangsschritt wieder da');
    },
  },
  {
    name: 'K1 Ziehen ist ein Schritt',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await anfangsschritt(t);
      const vorher = await lage(t);
      await t.werkzeug('sel');
      await t.ziehe([200, 150], [420, 330], 12);
      t.erwarte(JSON.stringify(await lage(t)) !== JSON.stringify(vorher), 'Baustein bewegt');
      await t.taste('Control+z');
      t.gleich(await lage(t), vorher, 'ein Strg+Z stellt die Lage wieder her');
    },
  },
];
