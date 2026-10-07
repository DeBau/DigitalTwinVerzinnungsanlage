// Abnahmetest der Datenprüfung (editor/datenpruefung.js): Eine präparierte Skizze im Speicher führt keinen Code aus.
// Die Startdaten schreiben Code in Bausteinart, Koordinaten, Farben, Strichstärke, Anschluss, Texte, Schriftfeld,
// Zeitstempel und in den Namen einer früheren Übung. Jeder Code setzt window.__boese.
const fremd = (t) => t.page.evaluate(() => ({
  boese: window.__boese ?? null,
  on: [...document.querySelectorAll('*')].flatMap((e) => [...e.attributes].filter((a) => /^on/i.test(a.name)).map((a) => e.tagName + ' ' + a.name)),
  elemente: document.querySelectorAll('#app svg img, #app svg script, #editor img, #editor script, #print img, #print script').length,
}));
async function sauber(t, wo) {
  t.gleich(await fremd(t), { boese: null, on: [], elemente: 0 }, wo);
}

export const tests = [
  {
    name: 'Sicherheit: präparierte Skizze in Kacheln, Editor, Aus früherer Übung und Druck',
    daten: 'sicherheit',
    lauf: async (t) => {
      await t.page.evaluate(() => { location.hash = '#/vorlagen'; }); await t.ruhe();
      await sauber(t, 'Kacheln');
      await t.oeffne('grafcet');
      t.gleich(await t.page.$$eval('#edstage .ink [data-o]', (gs) => gs.map((g) => g.dataset.o).sort()), ['o1', 'o3'],
        'gültige Bausteine bleiben, ungültige fallen weg');
      t.erwarte((await t.text('#edstage .ink')).includes('<img src=x'), 'Text bleibt sichtbar als Text');
      await sauber(t, 'Editor');
      await t.knopf('take');
      t.gleich(await t.zaehle('#editor .takemenu [data-ed="takeit"]'), 1, 'Eintrag der früheren Übung');
      await t.klick('#editor .takemenu [data-ed="takeit"]');
      await sauber(t, 'Aus früherer Übung');
      await t.drucke();
      await sauber(t, 'Druck');
      await t.knopf('close'); await t.oeffne('stromlauf');
      await sauber(t, 'Stromlaufplan');
    },
  },
];
