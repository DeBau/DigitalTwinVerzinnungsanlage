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
// Baustein k aus der Palette setzen; die Palette ist länger als das Fenster, deshalb erst hinscrollen
async function setze(t, k, x, y) {
  await t.page.locator(`#editor [data-place="${k}"]`).scrollIntoViewIfNeeded();
  await t.setze(k, x, y);
}
// Baustein setzen und die Auswahl aufheben; liefert das neue Objekt
async function setzeEinzeln(t, k, x, y) {
  const vorher = new Set((await t.objekte()).map((o) => o.id));
  await setze(t, k, x, y); await t.taste('Escape');
  return (await t.objekte()).find((o) => !vorher.has(o.id));
}
// Steuerstromkreis mit Selbsthaltung: Not-Halt, Aus, Ein, Spule −QA1 in Pfad 1, Haltekontakt −QA1 in Pfad 2 verdrahtet
export async function selbsthaltung(t) {
  await t.oeffne('stromlauf');
  for (const [k, y] of [['estop', 120], ['tnc', 220], ['tno', 320], ['coil', 450]]) await setze(t, k, PFAD(1), y);
  await t.taste('Escape');
  await setze(t, 'no', PFAD(2), 320); await t.taste('Escape');
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
      await setze(t, 'estop', PFAD(1), 120);
      await setze(t, 'coil', PFAD(1), 250);
      await lose(t);
      await setze(t, 'no', PFAD(2), 330);   // freier Kontakt: bleibt offen
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
      await setze(t, 'lamp', PFAD(3), 110);   // einzelnes Bauteil oben im Pfad
      await lose(t);
      await setze(t, 'tno', PFAD(3), 360);
      await setze(t, 'coil', PFAD(3), 470);
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
    name: 'E3 Motorschutz-Öffner und Sicherung zählen gemeinsam −FA',
    lauf: async (t) => {
      await t.oeffne('stromlauf');
      const v = [];
      for (const [k, n] of [['msk', 2], ['fuse', 4], ['msk', 6]]) v.push((await setzeEinzeln(t, k, PFAD(n), 200)).v);
      t.gleich(v, ['−FA1', '−FA2', '−FA3'], 'keine doppelten −FA');
    },
  },
  {
    name: 'E3 Vorschläge aus der Signalliste',
    lauf: async (t) => {
      await t.oeffne('stromlauf');
      await setze(t, 'tno', PFAD(2), 200);
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
      const punkte = await t.page.$$eval('#edstage .ink circle[r="2.8"]',
        (cs) => cs.map((c) => [+c.getAttribute('cx'), +c.getAttribute('cy')]));
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
    name: 'Breite Pfade gesperrt, solange ein Pfad über 15 belegt ist',
    lauf: async (t) => {
      await t.oeffne('stromlauf');
      const sp = await setzeEinzeln(t, 'coil', PFAD(18), 300);
      await t.klick('#editor [data-pfadbreite]');
      const d = await t.daten();
      t.gleich(d.meta && d.meta.pfadbreite, undefined, 'Breite bleibt 46');
      t.gleich(d.o.find((o) => o.id === sp.id).x, PFAD(18), 'Spule bleibt in Pfad 18');
      t.erwarte((await t.text('#props')).includes('Pfad 16 bis 18 ist belegt'), 'Hinweis im Eigenschaftsfeld');
      t.gleich(await t.page.$eval('#editor [data-pfadbreite]', (k) => k.getAttribute('aria-pressed')), 'false', 'Knopf nicht gedrückt');
    },
  },
  {
    name: 'Kennzeichen in Pfad 1 bleibt im Rahmen',
    lauf: async (t) => {
      await t.oeffne('stromlauf');
      const o = await setzeEinzeln(t, 'estop', PFAD(1), 200);
      const lage = await t.page.$eval(`#edstage .ink [data-o="${o.id}"]`, (g, v) => [...g.querySelectorAll('text')]
        .filter((x) => x.textContent === v).map((x) => [+x.getAttribute('x'), x.getAttribute('text-anchor')])[0], o.v);
      t.erwarte(lage[0] > PFAD(1) && lage[1] === 'start', `Kennzeichen rechts statt über dem Rahmen: ${lage}`);
    },
  },
  {
    name: 'Klemmenplan ohne doppelte Einträge bei alten Zeichnungen',
    daten: 'elektro-klemme-doppelt',
    lauf: async (t) => {
      await t.oeffne('stromlauf');
      const zeilen = await t.page.$$eval('#props table.klemmenplan tbody tr',
        (rs) => rs.map((r) => [...r.cells].map((c) => c.textContent)));
      t.gleich(zeilen.map((z) => z.slice(0, 3)), [['-X1:1', 'L+', '-MB1:A1']], 'Ventilspule nur einmal');
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
  {
    name: 'E9 Simulation: Selbsthaltung, Aus-Taster, Not-Halt rastend, Kurzschluss',
    lauf: async (t) => {
      await selbsthaltung(t);
      await t.werkzeug('sim');
      const spuleAn = async () => t.zaehle('#edstage .ink rect[fill="#27AE60"]');
      t.gleich(await spuleAn(), 0, 'Spule anfangs aus');
      t.erwarte(await t.zaehle('#edstage .ink path.strom') > 0, 'Potenzial L+ und M unterlegt');
      await t.klick([PFAD(1) - 10, 320]);   // Ein-Taster −SF3 drücken und loslassen
      t.gleich(await spuleAn(), 1, 'Spule hält sich selbst');
      await t.klick([PFAD(1) - 10, 220]);   // Aus-Taster −SF2
      t.gleich(await spuleAn(), 0, 'Aus-Taster schaltet ab');
      await t.klick([PFAD(1) - 10, 120]);   // Not-Halt rastet ein
      await t.klick([PFAD(1) - 10, 320]);
      t.gleich(await spuleAn(), 0, 'Not-Halt gedrückt: Spule bleibt aus');
      await t.klick([PFAD(1) - 10, 120]);   // Not-Halt entriegeln
      await t.klick([PFAD(1) - 10, 320]);
      t.gleich(await spuleAn(), 1, 'nach dem Entriegeln wieder einschaltbar');
      t.gleich(await t.zaehle('#edstage .ink text:has-text("Kurzschluss")'), 0, 'kein Kurzschluss');
      await t.werkzeug('sel');
      t.gleich(await t.zaehle('#edstage .ink path.strom'), 0, 'ohne Simulation keine Unterlegung');
    },
  },
  {
    name: 'E9 Simulation: Pilzkopf und Kasten des Motorschutzes anklickbar',
    lauf: async (t) => {
      await selbsthaltung(t);
      const ms = await setzeEinzeln(t, 'msk', PFAD(4), 200);
      const nh = (await t.objekte('estop'))[0];
      await t.werkzeug('sim');
      const betaetigt = () => t.zaehle('#edstage .ink rect[stroke="#27AE60"]');
      // Klickfläche reicht links bis vor den Betätiger, auch neben die gezeichneten Striche
      await t.klick([nh.x - 32, nh.y + 44]);   // unter dem roten Pilzkopf
      t.gleich(await betaetigt(), 1, 'Not-Halt über den Pilzkopf betätigt');
      await t.klick([ms.x - 40, ms.y + 44]);   // unter dem Kasten I> ϑ
      t.gleich(await betaetigt(), 2, 'Motorschutz über den Kasten ausgelöst');
      await t.klick([nh.x - 28, nh.y + 29]);   // auf den Pilzkopf
      t.gleich(await betaetigt(), 1, 'Not-Halt entriegelt');
    },
  },
  {
    name: 'E8 Kontaktspiegel unter der Spule, Querverweis am Kontakt',
    lauf: async (t) => {
      await selbsthaltung(t);
      await setzeEinzeln(t, 'nc', PFAD(5), 200);   // Öffner −QA1 in Pfad 5
      const spiegel = await t.page.$$eval('#edstage .ink g.spiegel text',
        (ts) => ts.map((x) => [x.textContent, x.getAttribute('text-anchor')]));
      t.gleich(spiegel, [['2', 'end'], ['5', 'start']], 'Schließer in Pfad 2 links, Öffner in Pfad 5 rechts');
      const verweise = await t.page.$$eval('#edstage .ink text', (ts) => ts.map((x) => x.textContent).filter((x) => x.startsWith('/')));
      t.gleich(verweise.sort(), ['/1', '/1'], 'beide Kontakte verweisen auf Pfad 1');
    },
  },
  {
    name: 'E10 Prüfen: Kurzschluss, Verriegelung, Kontakt ohne Spule, offene Anschlüsse, Motor ohne PE',
    lauf: async (t) => {
      const befunde = async () => {
        await t.knopf('pruefen');
        return t.page.$$eval('#props .befunde li', (ls) => ls.map((l) => l.textContent));
      };
      await selbsthaltung(t);
      t.gleich((await befunde()).filter((b) => b.includes('Fehler')), [], 'Selbsthaltung ohne Fehler');
      for (const [k, y] of [['nc', 390], ['coil', 480]]) await setze(t, k, PFAD(4), y);   // −QA2, verriegelt durch −QA1
      await t.taste('Escape');
      for (const [k, y] of [['tnc', 200], ['term', 300]]) await setze(t, k, PFAD(7), y);   // Kurzschluss ohne Verbraucher
      await t.taste('Escape');
      await setze(t, 'no', PFAD(9), 200);
      await t.page.fill('#props input[data-prop="v"]', '−QA9');   // Kontakt ohne Spule
      await t.taste('Escape');
      const b = (await befunde()).join(' | ');
      for (const teil of ['Kurzschluss', 'gegenseitige Verriegelung', 'keine Spule', 'ist offen']) {
        t.erwarte(b.includes(teil), `Befund „${teil}“ fehlt: ${b}`);
      }
      t.erwarte(await t.zaehle('#edstage .befund rect') > 0, 'rote Markierung auf dem Blatt');
      await t.knopf('close');
      await t.oeffne('leistung');
      await setzeEinzeln(t, 'm3', 300, 300);
      t.erwarte((await befunde()).some((x) => x.includes('Schutzleiter PE')), 'Motor ohne PE');
    },
  },
  {
    name: 'Prüfen: Kurzschluss über Tasterkombination, Spule hinter eigenem Öffner',
    lauf: async (t) => {
      await t.oeffne('stromlauf');
      await setzeEinzeln(t, 'coil', PFAD(1), 450);   // −QA1
      for (const [k, y] of [['tno', 200], ['nc', 300]]) await setze(t, k, PFAD(3), y);   // −SF1 und Öffner −QA1 in Reihe
      await lose(t);
      await setzeEinzeln(t, 'coil', PFAD(5), 450);   // −QA2
      await setzeEinzeln(t, 'nc', PFAD(5), 300);     // eigener Öffner −QA2 im selben Pfad
      await t.knopf('pruefen');
      const b = (await t.page.$$eval('#props .befunde li', (ls) => ls.map((l) => l.textContent))).join(' | ');
      t.erwarte(b.includes('Kurzschluss: L+ ist mit −SF1 betätigt'), `Kurzschluss beim Drücken von −SF1: ${b}`);
      t.erwarte(b.includes('hinter ihrem eigenen Öffner −QA2'), `eigener Öffner: ${b}`);
    },
  },
  {
    name: 'Prüfen: Wendeschaltung ohne Phasentausch und ohne Verriegelung',
    lauf: async (t) => {
      await t.oeffne('stromlauf');
      await setzeEinzeln(t, 'coil', PFAD(1), 450);
      await setzeEinzeln(t, 'coil', PFAD(3), 450);
      await t.knopf('close');
      await t.oeffne('leistung');
      const k1 = await setzeEinzeln(t, 'k3', 200, 300), k2 = await setzeEinzeln(t, 'k3', 500, 300);
      const m = await setzeEinzeln(t, 'm3', k1.x + 55, k1.y + 135);   // dockt unter −QA1 an
      await t.werkzeug('conn');
      await t.klick([k1.x + 10, 50]); await t.klick([k1.x + 10, k1.y]);   // −QA1 an L1, L2, L3
      await t.werkzeug('sel');
      const verdrahte = async (tauschen) => {
        if (tauschen) await t.klick('#editor [data-pole="tauschen"]');
        await t.werkzeug('conn');
        await t.klick([k2.x + 10, 50]); await t.klick([k2.x + 10, k2.y]);
        if (tauschen) await t.klick('#editor [data-pole="tauschen"]');
        await t.klick([k2.x + 10, k2.y + 60]); await t.klick([m.x + 10, m.y]);
        await t.werkzeug('sel');
      };
      const befunde = async () => {
        await t.knopf('pruefen');
        return (await t.page.$$eval('#props .befunde li', (ls) => ls.map((l) => l.textContent))).join(' | ');
      };
      t.erwarte(!(await befunde()).includes('Wendeschaltung'), 'ein Schütz am Motor: keine Wendeschaltung');
      await verdrahte(false);
      let b = await befunde();
      t.erwarte(b.includes('−QA1 und −QA2 lassen −MA1 gleich herum drehen'), `ohne Phasentausch: ${b}`);
      t.erwarte(b.includes('Wendeschaltung −QA1 und −QA2 ohne Verriegelung'), `ohne Verriegelung: ${b}`);
      for (let i = 0; i < 2; i++) await t.taste('Control+z');   // beide Verbindungen von −QA2
      t.gleich((await t.daten()).c.filter((c) => c.a === k2.id || c.b === k2.id).length, 0, 'K2 wieder unverdrahtet');
      await verdrahte(true);
      b = await befunde();
      t.erwarte(!b.includes('gleich herum') && b.includes('ohne Verriegelung'), `mit Phasentausch: ${b}`);
    },
  },
  {
    name: 'E11 dreipolig verdrahten, Phasen tauschen, dreipolig andocken',
    lauf: async (t) => {
      await t.oeffne('leistung');
      const leitungen = async (id) => (await t.daten()).c.filter((c) => c.b === id || c.a === id)
        .map((c) => (c.a === id ? `${c.pa}-${c.b}:${c.pb}` : `${c.a}:${c.pa}-${c.pb}`)).sort();
      const k1 = await setzeEinzeln(t, 'k3', 200, 300);
      await t.werkzeug('conn');
      await t.klick([k1.x + 10, 50]); await t.klick([k1.x + 10, k1.y]);
      t.gleich(await leitungen(k1.id), ['_L1@0:~-1', '_L2@0:~-3', '_L3@0:~-5'], 'ein Verbinden, drei Pole');
      await t.werkzeug('sel');
      const k2 = await setzeEinzeln(t, 'k3', 500, 300);
      await t.klick('#editor [data-pole="tauschen"]');
      await t.werkzeug('conn');
      await t.klick([k2.x + 10, 50]); await t.klick([k2.x + 10, k2.y]);
      t.gleich(await leitungen(k2.id), ['_L1@0:~-5', '_L2@0:~-3', '_L3@0:~-1'], 'L1 und L3 getauscht');
      await t.werkzeug('sel');
      // „L1 ↔ L3“ ist noch an: Andocken verbindet trotzdem Pol für Pol
      t.gleich(await t.page.$eval('#editor [data-pole="tauschen"]', (k) => k.getAttribute('aria-pressed')), 'true', 'Tauschen an');
      const m = await setzeEinzeln(t, 'm3', k1.x + 55, k1.y + 135);
      t.gleich([m.x, m.y], [k1.x, k1.y + 80], 'Motor dockt unter dem Schütz an');
      t.gleich(await leitungen(m.id), [`${k1.id}:2-U1`, `${k1.id}:4-V1`, `${k1.id}:6-W1`], 'drei Leitungen 1:1 beim Andocken');
    },
  },
  {
    name: 'E12 Klemmenplan, Zeitrelais anzugsverzögert, Hilfsschütz, mechanische Verriegelung',
    lauf: async (t) => {
      await t.oeffne('stromlauf');
      for (const [k, y] of [['term', 120], ['key', 220], ['zan', 330], ['term', 440]]) await setze(t, k, PFAD(2), y);
      await t.page.fill('#props [data-prop="v"]', '−X1:2');   // untere Klemme
      await t.taste('Escape');
      const zeilen = await t.page.$$eval('#props table.klemmenplan tbody tr',
        (rs) => rs.map((r) => [...r.cells].map((c) => c.textContent)));
      t.gleich(zeilen[0].slice(0, 3), ['−X1:1', 'L+', '−SF1:13'], 'Klemme 1: oben L+, unten Schlüsselschalter');
      t.gleich(zeilen[1].slice(0, 3), ['−X1:2', '−KF2:A2', 'M'], 'Klemme 2: oben Zeitrelais, unten M');
      await t.klick([PFAD(2), 360]);
      await t.page.fill('#props [data-prop="t"]', '0.4');
      await t.taste('Escape');
      await t.werkzeug('sim');
      await t.klick([PFAD(2) - 10, 250]);   // Schlüsselschalter rastet ein
      const an = () => t.zaehle('#edstage .ink rect[fill="#27AE60"]');
      t.gleich(await an(), 0, 'Zeitrelais zieht nicht sofort an');
      await t.ruhe(700);
      t.gleich(await an(), 1, 'nach der Verzögerung angezogen');
      await t.werkzeug('sel');
      const kh = await setzeEinzeln(t, 'khs', PFAD(6), 300);
      t.gleich(kh.v, '−KF3', 'Hilfsschütz −KF, nach dem Zeitrelais');
      const mv = await setzeEinzeln(t, 'mv', PFAD(6) + 20, 330);
      t.gleich(await t.zaehle(`#edstage .ink [data-o="${mv.id}"] path`), 2, 'Verriegelung: Wirklinie und Dreiecke');
    },
  },
];
