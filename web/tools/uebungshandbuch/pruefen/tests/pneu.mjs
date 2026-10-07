// Abnahmetests des Pakets PNEU: Pneumatikschaltplan (Leitungen, Simulation, Symbole, Prüfen) und Weg-Schritt-Diagramm.
// Startdaten in daten/pneu-*.json. Koordinaten sind Blattkoordinaten.

// Abschnitte [x1, y1, x2, y2] eines Pfads aus M/L-Befehlen
function abschnitte(d) {
  const p = d.replace(/^M/, '').split('L').map((q) => q.trim().split(/[\s,]+/).map(Number));
  return p.slice(1).map((q, i) => [...p[i], ...q]);
}
// Liegen zwei Abschnitte deckungsgleich übereinander (gleiche Gerade, Überlappung länger als 1)?
function deckungsgleich([a1, b1, a2, b2], [c1, d1, c2, d2]) {
  const ueber = (u1, u2, v1, v2) => Math.min(Math.max(u1, u2), Math.max(v1, v2)) - Math.max(Math.min(u1, u2), Math.min(v1, v2)) > 1;
  if (b1 === b2 && d1 === d2 && b1 === d1) return ueber(a1, a2, c1, c2);
  if (a1 === a2 && c1 === c2 && a1 === c1) return ueber(b1, b2, d1, d2);
  return false;
}
// Pfade der Leitungen auf dem Blatt
const BLAU = '#2F80ED';
// Farbe der Leitung i (blau = führt Druck in der Simulation)
const farbe = (t, i) => t.page.$eval(`#edstage .ink [data-c="${i}"] > path`, (p) => p.getAttribute('stroke'));
// Texte im Symbol des Bausteins id
const texte = (t, id) => t.page.$$eval(`#edstage .ink [data-o="${id}"] text`, (ts) => ts.map((x) => x.textContent));
const leitungen = (t) => t.page.$$eval('#edstage .ink [data-c] > path:first-child', (ps) => ps.map((p) => p.getAttribute('d')));

export const tests = [
  {
    name: 'P1 Leitungen verschiedener Anschlüsse liegen nie deckungsgleich',
    daten: 'pneu-gekreuzt',
    lauf: async (t) => {
      await t.oeffne('pneumatik');
      const wege = (await leitungen(t)).map(abschnitte);
      t.gleich(wege.length, 2, 'zwei Leitungen');
      for (const a of wege[0]) for (const b of wege[1]) t.erwarte(!deckungsgleich(a, b), `deckungsgleich: ${a} und ${b}`);
    },
  },
  {
    name: 'P2 Simulation: Klick auf gespiegeltes Ventil schaltet die angeklickte Seite',
    daten: 'pneu-gespiegelt',
    lauf: async (t) => {
      await t.oeffne('pneumatik');
      await t.werkzeug('sim');
      t.gleich(await farbe(t, 2), BLAU, 'Grundstellung: B belüftet');
      await t.klick([525, 410]);   // sichtbar rechts = Spule 14 (gespiegelt)
      t.gleich(await farbe(t, 1), BLAU, 'nach Klick auf Spule 14: A belüftet');
      t.erwarte(await farbe(t, 2) !== BLAU, 'B entlüftet');
    },
  },
  {
    name: 'P3 Steueranschlüsse 14/12/10 nach ISO 11727 aus den Schaltwegen',
    daten: 'pneu-symbole',
    lauf: async (t) => {
      await t.oeffne('pneumatik');
      const nr = async (id) => (await texte(t, id)).filter((x) => /^1[024]$/.test(x)).sort();
      t.gleich(await nr('b'), ['10', '12'], '3/2 NC, zwei Magnete');
      t.gleich(await nr('c'), ['10'], '3/2 NO, Magnet links');
      t.gleich(await nr('a'), ['12'], '2/2 NC, Magnet links');
      t.gleich(await nr('d'), ['12', '14'], '5/2 bistabil');
    },
  },
  {
    name: 'P4 Federraum des einfachwirkenden Zylinders als offener Anschluss',
    daten: 'pneu-symbole',
    lauf: async (t) => {
      await t.oeffne('pneumatik');
      const wege = await t.page.$$eval('#edstage .ink [data-o="f"] path', (ps) => ps.map((p) => p.getAttribute('d')));
      t.erwarte(wege.includes('M170 380V388'), 'offener Stummel am Federraum fehlt');
      t.erwarte(!wege.some((d) => d.includes('H174')), 'Sperrstrich am Federraum');
    },
  },
  {
    name: 'P6 Spulennamen an 14 und 12 am Ventil',
    daten: 'pneu-symbole',
    lauf: async (t) => {
      await t.oeffne('pneumatik');
      t.erwarte((await texte(t, 'd')).includes('−MB4'), 'Spule 12 −MB4 am Ventil');
      await t.klick([130, 230]);
      t.erwarte((await t.text('#props')).includes('Spule 14'), 'Feld Spule 14');
      t.erwarte((await t.text('#props')).includes('Spule 12'), 'Feld Spule 12');
      await t.klick('#props [data-prop="spl"]');
      await t.page.fill('#props [data-prop="spl"]', '');
      await t.tippe('-MB7');
      const v = (await t.objekte('v52'))[0];
      t.gleich(v.spl, '−MB7', 'Spule 14 gespeichert, Minuszeichen gesetzt');
      t.erwarte((await texte(t, 'd')).includes('−MB7'), 'Spule 14 am Ventil gezeichnet');
    },
  },
  {
    name: 'P5 Andocken über Anschlüsse: Drossel rastet über Anschluss 4 ein und ist verbunden',
    daten: 'pneu-ventil',
    lauf: async (t) => {
      await t.oeffne('pneumatik');
      await t.setze('drv', 495, 300);   // Anschluss 1 der Drossel 10 neben und 50 über Anschluss 4 (480, 380)
      const d = await t.daten(), drv = d.o.find((o) => o.k === 'drv');
      t.gleich(drv.x + 20, 480, 'Drossel auf der Flucht von Anschluss 4');
      t.gleich(d.c.map((c) => [c.a, c.pa, c.b === drv.id, c.pb]), [['v', '4', true, '1']], 'Leitung 4 → 1');
      t.erwarte((await t.text('#editor')).includes('Andocken rastet'), 'Hinweis der Palette nennt das Andocken');
    },
  },
];
