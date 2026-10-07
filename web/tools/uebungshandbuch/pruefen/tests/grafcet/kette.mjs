// GRAFCET-Tests der Kette: Seitenumbruch, Schritt und Transition im Wechsel, Ziehen, Löschen, Einfügen, Aktionen,
// Andocken, Rücksprünge, Teilung und die Knöpfe der Kette.
import { nach, kurzeKette, schneiden, transition, umriss, verbindungen, wege } from './hilfen.mjs';

export const tests = [
  {
    name: 'G1 Seitenumbruch: Bausteine liegen nicht übereinander',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await t.setze('init', 200, 560);
      await transition(t, 220, 640, 'BG1');
      await t.setze('step', 220, 680);
      await t.page.evaluate(() => { document.querySelector('#edstage').scrollTop = 400; });   // Blatt 2 ins Bild
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
  {
    name: 'G4 Schritt löschen nimmt Aktionen mit und schließt die Kette',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await kurzeKette(t);
      await t.klick([220, 240]); await t.setze('trans', 220, 330);   // Schritt 2 markieren, Transition darunter
      await t.tippe('BG2'); await t.taste('Enter');
      await t.setze('step', 220, 380);
      const d0 = await t.daten(), s2 = nach(d0, '2', 'step');
      await t.klick([s2.x + 20, s2.y + 20]);
      await t.taste('Delete');
      const d1 = await t.daten();
      t.gleich(d1.o.map((o) => `${o.k} ${o.v}`), ['init 1', 'trans BG1', 'step 3'], 'Bausteine nach dem Löschen');
      t.gleich(await verbindungen(t), ['init>trans', 'trans>step'], 'Kette geschlossen');
      t.gleich(nach(d1, '3', 'step').y, s2.y, 'Schritt 3 rückt an die Stelle von Schritt 2');
    },
  },
  {
    name: 'G5 Einfügen zwischen zwei Bausteinen, der Rest rückt nach unten',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await kurzeKette(t);
      await t.klick([220, 240]); await transition(t, 220, 330, 'BG2');
      await t.setze('step', 220, 380);
      const d0 = await t.daten(), t1 = nach(d0, 'BG1');
      await t.klick([t1.x, t1.y]);   // Transition BG1 markieren, Schritt einfügen
      await t.setze('step', 520, 400);
      const d1 = await t.daten(), neu = d1.o.find((o) => !d0.o.some((p) => p.id === o.id) && o.k === 'step');
      t.erwarte(neu, 'neuer Schritt');
      t.gleich([neu.x, neu.y], [t1.x - 20, t1.y + 30], 'neuer Schritt unter BG1');
      for (const v of ['2', 'BG2', '3', 'MB1']) t.gleich(nach(d1, v).y - nach(d0, v).y, 100, `${v} rückt nach unten`);
      const k = Object.fromEntries(d1.o.map((o) => [o.id, o.v || o.k]));
      const kette = []; let id = nach(d1, '1').id;
      for (let i = 0; i < 8 && id; i++) {
        kette.push(k[id]);
        const c = d1.c.find((c) => c.a === id && d1.o.find((o) => o.id === c.b).k !== 'action'); id = c && c.b;
      }
      t.gleich(kette, ['1', 'BG1', neu.v, 'trans', '2', 'BG2', '3'], 'Reihenfolge der Kette');
    },
  },
  {
    name: 'G6 Ereignis als Fähnchen, gestapelte Aktionen ohne Kollision, S7-GRAPH gekennzeichnet',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      t.erwarte((await t.text('#editor [data-place="actionq"]')).includes('S7-GRAPH'), 'Palette nennt S7-GRAPH');
      await t.setze('step', 220, 140);
      await t.setze('acte', 320, 145);
      await t.tippe('Z := Z + 1'); await t.taste('Enter');
      const a = (await t.objekte('action'))[0], mx = a.x + 16;
      const pfade = await t.page.locator(`#edstage .ink [data-o="${a.id}"] path`).evaluateAll((ps) => ps.map((p) => p.getAttribute('d')));
      t.erwarte(pfade.includes(`M${mx} ${a.y}V${a.y - 18}H${mx + 8}`), `Fähnchen fehlt: ${pfade}`);
      await t.klick([a.x + 30, a.y + 15]);
      await t.setze('acta', a.x + 30, a.y + 70);   // darunter
      await t.tippe('MB2'); await t.taste('Enter');
      const b = (await t.objekte('action')).find((o) => o.t === 'akt');
      t.gleich([b.x, b.y], [a.x, a.y + 50], 'gestapelt unter der Ereignis-Aktion');
      const linien = await t.page.locator('#edstage .ink [data-c] path').evaluateAll((ps) => ps.map((p) => p.getAttribute('d')));
      t.erwarte(linien.includes(`M${a.x} ${a.y + 30}V${b.y}`), `Stapellinie am linken Rand: ${linien}`);
      await t.klick([b.x + 30, b.y + 15]);
      await t.page.locator('#props [data-prop="t"]').selectOption('q');
      t.erwarte((await t.text('#props')).includes('S7-GRAPH'), 'Eigenschaftsfeld nennt S7-GRAPH');
    },
  },
  {
    name: 'G9 Andocken nur bis 70 Abstand',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await t.setze('step', 200, 100);
      await t.klick([700, 500]);
      await transition(t, 200, 240, 'weit');   // 120 unter dem Schritt: dockt nicht
      t.gleich((await verbindungen(t)).length, 0, 'weit weg ohne Verbindung');
      await t.klick([700, 500]);
      await transition(t, 200, 170, 'nah');    // 50 unter dem Schritt: dockt an
      t.gleich(await verbindungen(t), ['step>trans'], 'nah angedockt');
    },
  },
  {
    name: 'G8 Zwei Rücksprünge liegen nicht deckungsgleich',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await t.setze('init', 220, 120);
      await transition(t, 220, 190, 'BG1');
      await t.setze('step', 220, 240);
      await transition(t, 220, 310, 'BG2');
      await t.setze('step', 220, 340);
      await transition(t, 220, 410, 'BG3');
      const d = await t.daten(), init = nach(d, '1', 'init');
      await t.werkzeug('conn');
      for (const v of ['BG2', 'BG3']) {
        const q = nach(d, v);
        await t.klick([q.x, q.y]); await t.klick([init.x + 20, init.y + 20]);
      }
      const pfade = await wege(t);
      const bahnen = pfade.map((w) => /^M[\d.]+ [\d.]+V[\d.]+H([\d.]+)V/.exec(w)).filter(Boolean).map((m) => +m[1]);
      t.gleich(bahnen.length, 2, `zwei Rücksprünge: ${pfade}`);
      t.erwarte(bahnen[0] !== bahnen[1], `Bahnen deckungsgleich bei x ${bahnen}`);
    },
  },
  {
    name: 'G7 Teilung 100, + Schritt, Kette ausrichten, Neu nummerieren',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await t.setze('init', 220, 120);
      await transition(t, 260, 300, 'BG1');   // Klickhöhe zählt nicht: Teilung
      const [i0, t1] = [...await t.objekte('init'), ...await t.objekte('trans')];
      t.gleich([t1.x, t1.y], [i0.x + 20, i0.y + 70], 'Transition 70 unter dem Anfangsschritt');
      for (const b of ['BG2', 'BG3']) {
        await t.klick('#editor [data-gc="plus"]');
        await t.tippe(b); await t.taste('Enter');
      }
      let d = await t.daten();
      t.gleich([...d.o].sort((a, b) => a.y - b.y).map((o) => `${o.k} ${o.v} ${o.x},${o.y}`), [
        `init 1 ${i0.x},${i0.y}`, `trans BG1 ${t1.x},${t1.y}`, `step 2 ${i0.x},${i0.y + 100}`,
        `trans BG2 ${t1.x},${t1.y + 100}`, `step 3 ${i0.x},${i0.y + 200}`, `trans BG3 ${t1.x},${t1.y + 200}`,
      ], '+ Schritt hängt mit Teilung 100 an');
      const s2 = nach(d, '2', 'step');
      await t.ziehe([s2.x + 20, s2.y + 20], [s2.x + 60, s2.y + 50]);
      await t.klick('#editor [data-gc="ausrichten"]');
      const d2 = await t.daten();
      t.gleich(d2.o.map((o) => [o.x, o.y]), d.o.map((o) => [o.x, o.y]), 'Kette ausgerichtet');
      await t.klick([s2.x + 20, s2.y + 20]); await t.taste('Delete');
      t.gleich((await t.objekte('step')).map((o) => o.v), ['3'], 'Schritt 2 gelöscht');
      await t.klick('#editor [data-gc="nummern"]');
      t.gleich((await t.objekte('step')).map((o) => o.v), ['2'], 'neu nummeriert');
    },
  },
];
