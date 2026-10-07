// GRAFCET-Tests an Verzweigungen: „+ Schritt“ nach einer Zusammenführung, Neu nummerieren, Prüfregel Linienart,
// Rücksprung an den Zweigen vorbei.
import { setzeSichtbar, transition } from './hilfen.mjs';

// Arten der Kette ab A: A und die n ersten Kettennachfolger (ohne Aktionen)
async function kettenArten(t, A, n) {
  const d = await t.daten(), arten = [];
  for (let o = A, i = 0; o && i <= n; i++) {
    arten.push(o.k);
    const c = d.c.find((c) => c.a === o.id && d.o.find((p) => p.id === c.b).k !== 'action');
    o = c && d.o.find((p) => p.id === c.b);
  }
  return arten;
}
// Unterste Linie der Art k markieren und „+ Schritt“ drücken
async function plusNachLinie(t, k) {
  const linie = (await t.objekte(k)).sort((a, b) => b.y - a.y)[0];
  await t.klick([linie.x + 10, linie.y + (k === 'par' ? 2 : 0)]);
  await t.klick('#editor [data-gc="plus"]'); await t.tippe('BG9'); await t.taste('Enter');
  return linie;
}
// Prüfen drücken; Text des Eigenschaftsfelds
async function befunde(t) { await t.knopf('pruefen'); return t.text('#props'); }

export const tests = [
  {
    name: '+ Schritt nach der ODER-Zusammenführung: erst Schritt, dann Transition',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await t.setze('init', 220, 100);
      await setzeSichtbar(t, 'oder2', 220, 170);
      const linie = await plusNachLinie(t, 'alt');
      t.gleich(await kettenArten(t, linie, 2), ['alt', 'step', 'trans'], 'nach der ODER-Zusammenführung');
      const text = await befunde(t);
      t.erwarte(!text.includes('direkt'), `Wechsel von Schritt und Transition verletzt: ${text}`);
    },
  },
  {
    name: '+ Schritt nach der UND-Zusammenführung: erst Transition, dann Schritt',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await t.setze('init', 220, 100);
      await transition(t, 220, 170, 'BG1');
      await setzeSichtbar(t, 'und2', 220, 200);
      const linie = await plusNachLinie(t, 'par');
      t.gleich(await kettenArten(t, linie, 2), ['par', 'trans', 'step'], 'nach der UND-Zusammenführung');
      const text = await befunde(t);
      t.erwarte(!text.includes('direkt'), `Wechsel von Schritt und Transition verletzt: ${text}`);
    },
  },
  {
    name: 'Neu nummerieren zählt Zeile für Zeile, Zweige von links',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await t.setze('init', 220, 100);
      await t.klick('#editor [data-gc="plus"]'); await t.tippe('BG1'); await t.taste('Enter');
      await setzeSichtbar(t, 'oder2', 220, 270);
      await plusNachLinie(t, 'alt');
      await t.klick('#editor [data-gc="nummern"]');
      const schritte = [...await t.objekte('init'), ...await t.objekte('step')].sort((a, b) => a.y - b.y || a.x - b.x);
      t.gleich(schritte.map((o) => o.v), ['1', '2', '3', '4', '5'], 'Nummern von oben nach unten, links vor rechts');
    },
  },
];
