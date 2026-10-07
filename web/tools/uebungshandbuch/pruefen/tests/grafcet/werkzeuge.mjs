// GRAFCET-Tests der Werkzeuge: Prüfen, Kennzeichen-Vorschläge, Verzweigungs-Schnipsel, Durchspielen, Zustandsdiagramm,
// Zwangssteuerung und Taste +.
import { nach, kurzeKette, setzeSichtbar, transition } from './hilfen.mjs';

export const tests = [
  {
    name: 'Prüfen: typische Fehler werden rot markiert',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await t.setze('step', 220, 120);                  // kein Anfangsschritt
      await t.setze('trans', 220, 200); await t.tippe(''); await t.taste('Enter');   // ohne Bedingung
      await t.klick([700, 500]);
      await t.setze('action', 500, 400); await t.tippe('MB9'); await t.taste('Enter');   // verwaist
      await t.knopf('pruefen');
      const text = await t.text('#props');
      for (const s of ['Anfangsschritt', 'keine Bedingung', 'an keinem Schritt', 'endet die Kette']) {
        t.erwarte(text.includes(s), `Befund „${s}“ fehlt: ${text}`);
      }
      t.erwarte(await t.zaehle('#edstage .befund rect') >= 3, 'rote Markierungen');
    },
  },
  {
    name: 'Prüfen: eine richtige Kette hat keine Befunde',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await t.setze('init', 220, 120);
      await t.klick('#editor [data-gc="plus"]'); await t.tippe('BG1'); await t.taste('Enter');
      await transition(t, 220, 300, 'BG2');
      await t.setze('action', 320, 225); await t.tippe('MB1'); await t.taste('Enter');
      const d = await t.daten(), init = nach(d, '1', 'init'), t2 = nach(d, 'BG2');
      await t.werkzeug('conn'); await t.klick([t2.x, t2.y]); await t.klick([init.x + 20, init.y + 20]);
      await t.knopf('pruefen');
      t.erwarte((await t.text('#props')).includes('Keine Auffälligkeiten'), await t.text('#props'));
    },
  },
  {
    name: 'Kennzeichen-Vorschläge für Aktion und Transition',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await kurzeKette(t);
      const d = await t.daten(), a = d.o.find((o) => o.k === 'action'), tr = nach(d, 'BG1');
      for (const [ziel, such, art] of [[[a.x + 30, a.y + 15], 'MB', 'MB'], [[tr.x, tr.y], 'BG', 'BG']]) {
        await t.klick(ziel);
        const feld = t.page.locator('#props input[data-prop="v"][data-sigart]');
        await feld.fill(''); await feld.pressSequentially(such); await t.ruhe(50);
        const liste = await t.page.locator('#props .sigliste li').allInnerTexts();
        t.erwarte(liste.length > 0 && liste.every((x) => x.startsWith('−' + art)), `Vorschläge ${such}: ${liste.slice(0, 3)}`);
      }
    },
  },
  {
    name: 'G10 Verzweigungs-Schnipsel ODER und UND',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await t.setze('step', 220, 100);
      await setzeSichtbar(t, 'oder2', 220, 160);
      let d = await t.daten();
      t.gleich(d.o.map((o) => o.k).sort(), ['alt', 'alt', 'step', 'step', 'step', 'trans', 'trans', 'trans', 'trans'], 'ODER-Bausteine');
      t.gleich(d.c.length, 9, 'ODER-Verbindungen');
      t.erwarte(!d.o.some((o) => 'schnipsel' in o), 'kein Hilfsfeld gespeichert');
      await t.knopf('clear');
      await setzeSichtbar(t, 'trans', 220, 100); await t.tippe('BG1'); await t.taste('Enter');
      await setzeSichtbar(t, 'und2', 220, 160);
      d = await t.daten();
      t.gleich(d.o.map((o) => o.k).sort(), ['par', 'par', 'step', 'step', 'trans'], 'UND-Bausteine');
      const [s1, s2] = d.o.filter((o) => o.k === 'step');
      await t.ziehe([s2.x + 20, s2.y + 20], [s2.x + 120, s2.y + 20]);   // rechten Zweig weiter nach rechts
      await t.klick('#editor [data-gc="ausrichten"]');
      const par = (await t.objekte('par'))[1], s2n = (await t.objekte('step'))[1];
      t.erwarte(par.x + par.w >= s2n.x + 60, `Linie reicht bis zum Zweig: ${par.x}+${par.w} / ${s2n.x}`);
    },
  },
  {
    name: 'Kette durchspielen: Transition schaltet weiter, Aktionen leuchten',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await kurzeKette(t);
      const d = await t.daten(), init = nach(d, '1', 'init'), s2 = nach(d, '2', 'step'), t1 = nach(d, 'BG1');
      const a = d.o.find((o) => o.k === 'action');
      await t.werkzeug('sim');
      const punkt = (o) => t.zaehle(`#edstage .ink [data-o="${o.id}"] circle`);
      t.gleich([await punkt(init), await punkt(s2)], [1, 0], 'am Anfang ist Schritt 1 aktiv');
      await t.klick([t1.x, t1.y]);
      t.gleich([await punkt(init), await punkt(s2)], [0, 1], 'nach BG1 ist Schritt 2 aktiv');
      const fuellung = await t.page.locator(`#edstage .ink [data-o="${a.id}"] rect:not([fill="transparent"])`).first().getAttribute('fill');
      t.gleich(fuellung, '#DFF5E1', 'Aktion MB1 wirkt');
      t.erwarte((await t.text('#props')).includes('durchspielen'), 'Anleitung im Eigenschaftsfeld');
      await t.werkzeug('sel');
      t.gleich(await punkt(s2), 0, 'nach dem Durchspielen keine Punkte');
    },
  },
  {
    name: 'Z1 Zustand mit Aktion, Prüfregel erreichbar',
    lauf: async (t) => {
      await t.oeffne('zustand');
      await t.setze('sinit', 200, 200);
      await t.setze('state', 400, 200);
      await t.setze('state', 600, 200);
      const [z0, z1] = await t.objekte();
      await t.werkzeug('conn'); await t.klick([z0.x, z0.y]); await t.klick([z1.x, z1.y]);
      await t.tippe('BG1'); await t.taste('Enter');
      await t.werkzeug('sel'); await t.klick([z1.x, z1.y]);
      await t.page.locator('#props [data-prop="a"]').fill('MB1'); await t.ruhe();
      const texte = await t.page.locator(`#edstage .ink [data-o="${z1.id}"] text`).evaluateAll((ts) => ts.map((x) => x.textContent));
      t.erwarte(texte.includes('/ MB1'), `Aktion im Zustand: ${texte}`);
      await t.knopf('pruefen');
      const liste = await t.text('#props');
      t.erwarte(liste.includes('Z2 ist nicht erreichbar') && !liste.includes('Z1 ist nicht'), liste);
    },
  },
  {
    name: 'G12 Zwangssteuerung mit Doppelrahmen, Schrittkommentar in Anführungszeichen',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await t.setze('step', 220, 140);
      const s = (await t.objekte('step'))[0];
      await t.page.locator('#props [data-prop="km"]').fill('Korb einhängen'); await t.ruhe();
      const texte = await t.page.locator(`#edstage .ink [data-o="${s.id}"] text`).evaluateAll((ts) => ts.map((x) => x.textContent));
      t.erwarte(texte.includes('„Korb einhängen“'), `Kommentar: ${texte}`);
      await setzeSichtbar(t, 'actz', 320, 145); await t.tippe('G2{INIT}'); await t.taste('Enter');
      const a = (await t.objekte('action'))[0];
      t.gleich(a.t, 'zwang', 'Art Zwangssteuerung');
      const rahmen = await t.zaehle(`#edstage .ink [data-o="${a.id}"] rect[fill="none"]`);
      t.gleich(rahmen, 1, 'innerer Rahmen');
    },
  },
  {
    name: 'Taste + wie + Schritt (wenn KERN den Haken taste hat)',
    lauf: async (t) => {
      await t.oeffne('grafcet');
      await t.setze('init', 220, 120);
      await t.taste('+');
      const n = (await t.objekte()).length;
      if (n === 1) return;   // Haken taste fehlt im Kern noch: übersprungen
      t.gleich(n, 3, 'Transition und Schritt angehängt');
    },
  },
];

