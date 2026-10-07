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
  /* ---------- K2 Wiederholen ---------- */
  {
    name: 'K2 Strg+Y und Strg+Umschalt+Z wiederholen, Knöpfe passend aktiv',
    lauf: async (t) => {
      const aus = async (ed) => t.page.locator(`#editor [data-ed="${ed}"]`).getAttribute('aria-disabled');
      await t.oeffne('grafcet');
      t.gleich([await aus('undo'), await aus('redo')], ['true', 'true'], 'frisch geöffnet beide aus');
      await anfangsschritt(t);
      t.gleich([await aus('undo'), await aus('redo')], ['false', 'true'], 'nach Setzen nur Rückgängig');
      await t.taste('Control+z');
      t.gleich([await aus('undo'), await aus('redo')], ['true', 'false'], 'nach Rückgängig nur Wiederholen');
      await t.taste('Control+y');
      t.gleich((await t.objekte()).length, 1, 'Strg+Y holt den Schritt zurück');
      await t.taste('Control+z');
      await t.taste('Control+Shift+Z');
      t.gleich((await t.objekte()).length, 1, 'Strg+Umschalt+Z holt den Schritt zurück');
      await t.taste('Control+z');
      await t.knopf('redo');
      t.gleich((await t.objekte()).length, 1, 'Knopf Wiederholen');
      await t.setze('init', 500, 150);
      t.gleich(await aus('redo'), 'true', 'neue Änderung leert Wiederholen');
    },
  },
  /* ---------- K9 Esc ---------- */
  {
    name: 'K9 Esc schließt den Editor nie, nur Fertig',
    lauf: async (t) => {
      const offen = async () => t.zaehle('#editor[open]');
      await t.oeffne('grafcet');
      for (let i = 0; i < 3; i++) await t.taste('Escape');
      t.gleich(await offen(), 1, 'nach dreimal Esc offen');
      await anfangsschritt(t);
      await t.werkzeug('sel');
      await t.klick([200, 150]);
      await t.taste('Escape');
      await t.taste('Escape');
      t.gleich(await offen(), 1, 'nach Esc mit Markierung offen');
      await t.klick('#edstage [data-sf]');
      await t.klick('#props [data-prop="mn"]');
      await t.taste('Escape');
      await t.taste('Escape');
      t.gleich(await offen(), 1, 'nach Esc im Feld offen');
      await t.knopf('take');
      await t.taste('Escape');
      t.gleich([await offen(), await t.zaehle('#editor .takemenu')], [1, 0], 'Esc schließt nur das Menü');
      await t.knopf('close');
      t.gleich(await offen(), 0, 'Fertig schließt');
    },
  },
  /* ---------- K10 Fokus ---------- */
  {
    name: 'K10 nach Klick auf Knopf oder Feld kommen Tasten im Editor an',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await anfangsschritt(t);
      await t.werkzeug('sel');
      await t.knopf('grid');
      const raster = () => t.page.locator('#editor [data-ed="grid"]').getAttribute('aria-pressed');
      const vorher = await raster();
      await t.taste('Space');
      t.gleich(await raster(), vorher, 'Leertaste löst den Knopf nicht erneut aus');
      await t.klick('#edstage [data-sf]');
      await t.klick('#props [data-prop="mn"]');
      await t.klick('#props [data-ed="sfzu"]');
      await t.klick([200, 150]);
      await t.taste('Delete');
      t.gleich(await t.daten(), null, 'Entf löscht den markierten Schritt');
      await t.setze('init', 300, 150);
      await t.taste('Escape');
      await t.klick([300, 150]);
      await t.klick('#props textarea, #props input');
      await t.klick([300, 150]);
      await t.taste('Delete');
      t.gleich(await t.daten(), null, 'Entf nach Klick ins Feld und zurück aufs Blatt');
    },
  },
  /* ---------- K6 ein Zeiger ---------- */
  {
    name: 'K6 Zwei-Finger-Geste malt nicht und bricht den Strich ab',
    lauf: async (t) => {
      await t.oeffne('trend');
      await t.werkzeug('pen');
      const a = await t.punkt(300, 300), b = await t.punkt(600, 300);
      await t.page.evaluate(([a, b]) => {
        const svg = document.querySelector('#edstage svg');
        const ev = (typ, id, [x, y], primaer) => svg.dispatchEvent(new PointerEvent(typ, {pointerId: id, clientX: x, clientY: y,
          pointerType: 'touch', isPrimary: primaer, bubbles: true, cancelable: true, buttons: 1}));
        ev('pointerdown', 11, a, true); ev('pointermove', 11, [a[0] + 30, a[1] + 20], true);
        ev('pointerdown', 12, b, false);
        ev('pointermove', 11, [a[0] + 80, a[1] + 60], true); ev('pointermove', 12, [b[0] - 50, b[1] + 40], false);
        ev('pointerup', 12, b, false); ev('pointermove', 11, [a[0] + 120, a[1] + 90], true); ev('pointerup', 11, a, true);
      }, [a, b]);
      await t.ruhe();
      t.gleich(await t.daten(), null, 'kein Strich gespeichert');
      t.gleich(await t.zaehle('#edstage .ink path'), 0, 'kein Strich auf dem Blatt');
      await t.ziehe([300, 400], [500, 450]);
      t.gleich(((await t.daten()) || {s: []}).s.length, 1, 'danach malt ein Finger wieder');
    },
  },
  /* ---------- K7 Speicher ---------- */
  {
    name: 'K7 Freihandstrich vereinfacht und ganzzahlig',
    lauf: async (t) => {
      await t.oeffne('trend');
      await t.werkzeug('pen');
      await t.ziehe([200, 300], [700, 300], 40);
      const [st] = (await t.daten()).s;
      t.erwarte(st.p.length <= 3, `gerader Strich mit wenigen Punkten (${st.p.length})`);
      t.erwarte(st.p.flat().every(Number.isInteger), 'nur ganze Zahlen');
    },
  },
  {
    name: 'K7 voller Speicher zeigt eine Warnung',
    lauf: async (t) => {
      await t.oeffne('trend');
      await t.page.evaluate(() => {
        const alt = Storage.prototype.setItem;
        Storage.prototype.setItem = function (k, v) {
          if (k.includes(':sk:') && !window.__frei) throw new DOMException('voll', 'QuotaExceededError');
          return alt.call(this, k, v);
        };
      });
      await t.werkzeug('pen');
      await t.ziehe([200, 300], [500, 400]);
      t.erwarte(await t.page.locator('#edwarn').isVisible(), 'Warnung sichtbar');
      t.erwarte((await t.text('#edwarn')).startsWith('Speicher voll'), 'Warntext');
      await t.page.evaluate(() => { window.__frei = true; });
      await t.ziehe([200, 450], [500, 500]);
      t.erwarte(!(await t.page.locator('#edwarn').isVisible()), 'Warnung weg, wenn das Speichern wieder klappt');
    },
  },
];
