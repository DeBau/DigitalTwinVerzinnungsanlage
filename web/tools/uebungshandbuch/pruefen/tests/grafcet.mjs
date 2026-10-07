// Abnahmetests des Pakets GRAFCET (vorlagen/grafcet.js, vorlagen/zustand.js, avoidBreak, routeV).
// Koordinaten sind Blattkoordinaten. Hilfen unten: Umriss der Bausteine wie im Editor, Verbindungen als Paare von Arten.

// Umriss wie umrissVon für die Bausteine, die die Tests setzen
const UMRISS = {
  init: (o) => [o.x, o.y, 40, 40],
  step: (o) => [o.x, o.y, 40, 40],
  trans: (o) => [o.x - 16, o.y - 9, 32, 18],
  action: (o) => [o.x, o.y, 90, 30],
};
const umriss = (o) => (UMRISS[o.k] || ((p) => [p.x, p.y, 20, 20]))(o);
const schneiden = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];

// Transition setzen und ihre Bedingung tippen
async function transition(t, x, y, text) {
  await t.setze('trans', x, y);
  await t.tippe(text); await t.taste('Enter');
}
// Verbindungen der Zeichnung als ["init>trans", …] (Arten von a und b)
async function verbindungen(t) {
  const d = await t.daten(), k = Object.fromEntries(d.o.map((o) => [o.id, o.k]));
  return d.c.map((c) => `${k[c.a]}>${k[c.b]}`);
}
// Baustein mit Kennzeichen v
const nach = (d, v, k = null) => d.o.find((o) => o.v === v && (!k || o.k === k));

// Kette 1, BG1, 2 mit Aktion MB1 (Anfangsschritt bei 200, 100)
async function kurzeKette(t) {
  await t.setze('init', 220, 120);
  await transition(t, 220, 190, 'BG1');
  await t.setze('step', 220, 240);
  await t.setze('action', 320, 245);
  await t.tippe('MB1'); await t.taste('Enter');
}

export const tests = [
  {
    name: 'G1 Seitenumbruch: Bausteine liegen nicht übereinander',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await t.setze('init', 200, 560);
      await transition(t, 220, 640, 'BG1');
      await t.setze('step', 220, 680);
      await transition(t, 220, 720, 'BG2');
      await t.setze('step', 220, 750);
      const os = await t.objekte();
      t.gleich(os.length, 5, 'fünf Bausteine');
      for (let i = 0; i < os.length; i++) for (let j = i + 1; j < os.length; j++) {
        t.erwarte(!schneiden(umriss(os[i]), umriss(os[j])), `${os[i].k} ${os[i].v} liegt auf ${os[j].k} ${os[j].v}`);
      }
      const ys = os.map((o) => o.y);
      t.erwarte(ys.every((y, i) => i === 0 || y > ys[i - 1]), `Reihenfolge von oben nach unten: ${ys}`);
    },
  },
  {
    name: 'G2 Schritt nach Schritt setzt eine Transition dazwischen',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await t.setze('init', 200, 100);
      await transition(t, 220, 190, 'BG1');
      await t.setze('step', 220, 240);
      await t.setze('step', 220, 300);
      t.gleich((await t.objekte('trans')).length, 2, 'Transitionen');
      t.gleich(await verbindungen(t), ['init>trans', 'trans>step', 'step>trans', 'trans>step'], 'Kette');
      const [, s2, s3] = [...await t.objekte('init'), ...await t.objekte('step')];
      t.erwarte(s3.y - s2.y >= 100, `Abstand der Schritte ${s3.y - s2.y}`);
    },
  },
  {
    name: 'G2 Transition nach Transition wird abgelehnt',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await t.setze('init', 200, 100);
      await transition(t, 220, 190, 'BG1');
      await transition(t, 220, 260, 'BG2');
      t.gleich(await verbindungen(t), ['init>trans'], 'nur die erste Transition hängt an der Kette');
      t.erwarte((await t.text('#props')).includes('folgt immer ein Schritt'), 'Hinweis im Eigenschaftsfeld');
    },
  },
  {
    name: 'G2 Verbinden: Schritt mit Schritt bekommt Transition, Transition mit Transition nicht',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await t.setze('step', 200, 100);
      await t.klick([700, 500]);   // Markierung aufheben
      await t.setze('step', 400, 300);
      const [a, b] = await t.objekte('step');
      await t.werkzeug('conn');
      await t.klick(`[data-o="${a.id}"]`); await t.klick(`[data-o="${b.id}"]`);
      t.gleich(await verbindungen(t), ['step>trans', 'trans>step'], 'Transition eingefügt');
      await t.werkzeug('sel'); await t.klick([700, 500]);
      await transition(t, 600, 100, 'BG1'); await t.klick([700, 500]);
      await transition(t, 600, 300, 'BG2');
      const [, x, y] = await t.objekte('trans');
      await t.werkzeug('conn');
      await t.klick(`[data-o="${x.id}"]`); await t.klick(`[data-o="${y.id}"]`);
      t.gleich((await verbindungen(t)).length, 2, 'keine Verbindung Transition mit Transition');
      t.erwarte((await t.text('#props')).includes('folgt immer ein Schritt'), 'Hinweis im Eigenschaftsfeld');
    },
  },
  {
    name: 'G3 Aktionen ziehen mit ihrem Schritt mit, mit Umschalt die ganze Kette',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await kurzeKette(t);
      const d0 = await t.daten(), s2 = nach(d0, '2', 'step'), a0 = d0.o.find((o) => o.k === 'action');
      await t.ziehe([s2.x + 20, s2.y + 20], [s2.x + 120, s2.y + 60]);
      const d1 = await t.daten(), a1 = d1.o.find((o) => o.k === 'action'), s2n = nach(d1, '2', 'step');
      t.erwarte(s2n.x - s2.x === 100, 'Schritt verschoben');
      t.gleich([a1.x - a0.x, a1.y - a0.y], [s2n.x - s2.x, s2n.y - s2.y], 'Aktion mitgezogen');
      t.gleich(nach(d1, 'BG1').y, nach(d0, 'BG1').y, 'Transition bleibt ohne Umschalt');
      const i0 = nach(d1, '1', 'init');
      await t.page.keyboard.down('Shift');
      await t.ziehe([i0.x + 20, i0.y + 20], [i0.x + 60, i0.y + 50]);
      await t.page.keyboard.up('Shift');
      const d2 = await t.daten();
      const weg = (o) => { const n = d2.o.find((p) => p.id === o.id); return [n.x - o.x, n.y - o.y]; };
      t.erwarte(weg(i0)[0] === 40, 'Anfangsschritt verschoben');
      for (const o of d1.o) t.gleich(weg(o), weg(i0), `${o.k} ${o.v} mit Umschalt mitgezogen`);
    },
  },
];
