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
];
