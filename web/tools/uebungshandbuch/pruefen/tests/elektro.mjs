// Abnahmetests des Pakets ELEKTRO: Stromlaufplan (stromlauf) und Hauptstromkreis (leistung).
// Strompfad n liegt bei x = 40 + n · 46, L+ bei y = 70, M bei y = 590 (Blatt 1).
const PFAD = (n) => 40 + n * 46;

// Senkrechte automatische Leitungen als [x, y1, y2]
async function autoLeitungen(t) {
  return t.page.$$eval('#edstage .ink path.autoleitung', (ps) => ps.map((p) => p.getAttribute('d'))
    .map((d) => d.match(/-?[\d.]+/g).map(Number)));
}
// Texte im SVG eines Bausteins
const texte = (t, id) => t.page.$$eval(`#edstage .ink [data-o="${id}"] text`, (ts) => ts.map((x) => x.textContent));
// Baustein setzen und die Auswahl aufheben; liefert das neue Objekt
async function setzeEinzeln(t, k, x, y) {
  const vorher = new Set((await t.objekte()).map((o) => o.id));
  await t.setze(k, x, y); await t.taste('Escape');
  return (await t.objekte()).find((o) => !vorher.has(o.id));
}
// Steuerstromkreis mit Selbsthaltung: Not-Halt, Aus, Ein, Spule −QA1 in Pfad 1, Haltekontakt −QA1 in Pfad 2 verdrahtet
export async function selbsthaltung(t) {
  await t.oeffne('stromlauf');
  for (const [k, y] of [['estop', 120], ['tnc', 220], ['tno', 320], ['coil', 450]]) await t.setze(k, PFAD(1), y);
  await t.taste('Escape');
  await t.setze('no', PFAD(2), 320); await t.taste('Escape');
  await t.werkzeug('conn');
  await t.klick([PFAD(2), 290]); await t.klick([PFAD(1), 290]);
  await t.klick([PFAD(2), 350]); await t.klick([PFAD(1), 350]);
  await t.werkzeug('sel');
}
// Auswahl aufheben, damit der nächste Baustein keine Kette fortsetzt
const lose = (t) => t.taste('Escape');

export const tests = [
  {
    name: 'E1 automatische Leitungen nur am Kettenanfang und Kettenende',
    lauf: async (t) => {
      await t.oeffne('stromlauf');
      await t.setze('estop', PFAD(1), 120);
      await t.setze('coil', PFAD(1), 250);
      await lose(t);
      await t.setze('no', PFAD(2), 330);   // freier Kontakt: bleibt offen
      await lose(t);
      const al = await autoLeitungen(t);
      t.gleich(al.length, 2, 'zwei automatische Leitungen (L+ oben, M unten)');
      t.erwarte(al.every(([x]) => x === PFAD(1)), 'nur im Strompfad 1');
      t.gleich(al.map(([, y]) => y).sort((a, b) => a - b), [70, 590], 'zu L+ und zu M');
    },
  },
  {
    name: 'E1 keine automatische Leitung durch ein Bauteil',
    lauf: async (t) => {
      await t.oeffne('stromlauf');
      await t.setze('lamp', PFAD(3), 110);   // einzelnes Bauteil oben im Pfad
      await lose(t);
      await t.setze('tno', PFAD(3), 360);
      await t.setze('coil', PFAD(3), 470);
      await lose(t);
      const al = (await autoLeitungen(t)).filter(([x]) => x === PFAD(3));
      t.gleich(al.map(([, y]) => y), [590], 'nur die Leitung unten zu M, oben läge die Leuchte im Weg');
    },
  },
  {
    name: '8 Schaltzeichen aus symbole/iec60617.js',
    lauf: async (t) => {
      await t.oeffne('stromlauf');
      await setzeEinzeln(t, 'tno', PFAD(2), 200);
      const d = await t.page.$eval('#edstage .ink [data-o] path', (p) => p.getAttribute('stroke-width'));
      t.gleich(d, '1.4', 'Strichstärke der Bibliothek');
    },
  },
  {
    name: 'E2 Ordnungsziffern je Gerät, A1/A2 an der Spule',
    lauf: async (t) => {
      await t.oeffne('stromlauf');
      const spule = await setzeEinzeln(t, 'coil', PFAD(1), 400);
      const a = await setzeEinzeln(t, 'no', PFAD(2), 200);
      const b = await setzeEinzeln(t, 'nc', PFAD(3), 200);
      const c = await setzeEinzeln(t, 'no', PFAD(4), 200);
      t.gleich([a.v, b.v, c.v], ['−QA1', '−QA1', '−QA1'], 'Kontakte übernehmen die Spule');
      const nr = async (o) => (await texte(t, o.id)).filter((x) => /^\d\d$/.test(x));
      t.gleich(await nr(a), ['13', '14'], '1. Kontakt Schließer');
      t.gleich(await nr(b), ['21', '22'], '2. Kontakt Öffner');
      t.gleich(await nr(c), ['33', '34'], '3. Kontakt Schließer');
      t.erwarte((await texte(t, spule.id)).includes('A1'), 'A1 an der Spule');
      const tnc = await setzeEinzeln(t, 'tnc', PFAD(6), 200);
      t.gleich(await nr(tnc), ['11', '12'], 'Taster Öffner allein: 11/12');
    },
  },
  {
    name: 'E2 dreipolig 1 bis 6',
    lauf: async (t) => {
      await t.oeffne('leistung');
      const k = await setzeEinzeln(t, 'k3', 300, 300);
      t.gleich((await texte(t, k.id)).filter((x) => /^\d$/.test(x)).sort(), ['1', '2', '3', '4', '5', '6'], 'Polnummern');
    },
  },
  {
    name: 'E3 Kennzeichen je Art fortlaufend',
    lauf: async (t) => {
      await t.oeffne('stromlauf');
      const folge = [['coil', 1, 450], ['coil', 2, 450], ['no', 3, 200], ['tno', 4, 200], ['tno', 5, 200], ['lamp', 6, 200],
        ['term', 7, 200], ['term', 8, 200], ['lsw', 9, 200], ['estop', 10, 200]];
      const v = [];
      for (const [k, n, y] of folge) v.push((await setzeEinzeln(t, k, PFAD(n), y)).v);
      t.gleich(v, ['−QA1', '−QA2', '−QA2', '−SF1', '−SF2', '−PF1', '−X1:1', '−X1:2', '−BG1', '−SF3'], 'Kennzeichen');
      const g = [];
      for (const [k, x, y] of [['di8', 600, 120], ['dq8', 600, 260], ['sr', 600, 420]]) g.push((await setzeEinzeln(t, k, x, y)).v);
      t.gleich(g, ['−KF1', '−KF1', '−KF2'], 'SPS −KF1, Sicherheitsrelais −KF2');
    },
  },
  {
    name: 'E3 Vorschläge aus der Signalliste',
    lauf: async (t) => {
      await t.oeffne('stromlauf');
      await t.setze('tno', PFAD(2), 200);
      t.gleich(await t.page.$eval('#props input[data-prop="v"]', (e) => e.dataset.sigart), 'SF', 'Kennbuchstaben SF');
    },
  },
  {
    name: 'E4 Motor mit PE, Umrichter-PE heißt PE',
    lauf: async (t) => {
      await t.oeffne('leistung');
      const m = await setzeEinzeln(t, 'm3', 200, 400);
      const fu = await setzeEinzeln(t, 'fu', 200, 220);
      t.erwarte((await texte(t, m.id)).includes('PE'), 'PE am Motor');
      const tf = await texte(t, fu.id);
      t.erwarte(tf.filter((x) => x === 'PE').length === 2 && !tf.includes('PE2'), `Umrichter: ${tf.join(' ')}`);
      await t.werkzeug('conn');
      await t.klick([fu.x + 100, fu.y + 90]);
      await t.klick([m.x + 100, m.y]);
      const c = (await t.daten()).c.at(-1);
      t.gleich([c.pa, c.pb], ['PE2', 'PE'], 'Schutzleiter Umrichter → Motor verdrahtet');
    },
  },
  {
    name: 'E5 Querverbindung über den Anschlüssen, Abzweigpunkte an angedockten Verbindungen',
    lauf: async (t) => {
      await selbsthaltung(t);
      const wege = await t.page.$$eval('#edstage .ink [data-c] path:first-child', (ps) => ps.map((p) => p.getAttribute('d')));
      const quer = wege.filter((d) => d.includes(String(PFAD(2))));
      t.gleich(quer.length, 2, 'zwei Querverbindungen');
      for (const d of quer) {
        const ys = new Set(d.match(/-?[\d.]+/g).filter((_, i) => i % 2).map(Number));
        t.gleich(ys.size, 1, `waagrecht auf Anschlusshöhe: ${d}`);
      }
      const punkte = await t.page.$$eval('#edstage .ink circle[r="2.8"]', (cs) => cs.map((c) => [+c.getAttribute('cx'), +c.getAttribute('cy')]));
      for (const y of [290, 350]) t.erwarte(punkte.some(([x, py]) => x === PFAD(1) && py === y), `Abzweigpunkt bei ${y}`);
    },
  },
  {
    name: 'E6 Kennzeichen weicht dem Nachbarpfad aus, Pfadbreite umschaltbar',
    lauf: async (t) => {
      await selbsthaltung(t);
      const halt = (await t.objekte('no'))[0];
      const lage = await t.page.$eval(`#edstage .ink [data-o="${halt.id}"]`, (g) => [...g.querySelectorAll('text')]
        .filter((x) => x.textContent === '−QA1').map((x) => [+x.getAttribute('x'), x.getAttribute('text-anchor')])[0]);
      t.erwarte(lage[0] > PFAD(2) && lage[1] === 'start', `Kennzeichen rechts vom Haltekontakt: ${lage}`);
      await t.klick('#editor [data-pfadbreite]');
      const d = await t.daten();
      t.gleich(d.meta.pfadbreite, 60, 'Breite in meta');
      t.gleich(d.o.filter((o) => o.k === 'no').map((o) => o.x), [40 + 2 * 60], 'Haltekontakt bleibt in Pfad 2');
      t.gleich(await t.page.$eval('#editor [data-pfadbreite]', (k) => k.getAttribute('aria-pressed')), 'true', 'Knopf gedrückt');
      await t.taste('Control+z');
      t.gleich((await t.objekte('no'))[0].x, PFAD(2), 'Rückgängig');
    },
  },
  {
    name: 'E7 Not-Halt zweikanalig 11/12 und 21/22',
    lauf: async (t) => {
      await t.oeffne('stromlauf');
      const o = await setzeEinzeln(t, 'estop2', PFAD(3), 200);
      const nr = (await texte(t, o.id)).filter((x) => /^\d\d$/.test(x)).sort();
      t.gleich(nr, ['11', '12', '21', '22'], 'Anschlüsse beider Kanäle');
      t.gleich(await t.zaehle(`#edstage .ink [data-o="${o.id}"] path[fill="#C0392B"]`), 1, 'ein Pilztaster');
      t.gleich(o.v, '−SF1', 'Kennzeichen −SF');
    },
  },
];
