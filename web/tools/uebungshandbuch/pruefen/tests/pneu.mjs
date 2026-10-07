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
// Meldet der Endlagensensor n in der Simulation 1? (Signalliste im Eigenschaftsfeld)
const meldet = async (t, n) => (await t.text('#simstatus')).includes(`${n} 1`);
// Linke bzw. rechte Betätigung des Ventils mit der linken oberen Ecke (x, y) und Breite w anklicken
const links = (t, x, y) => t.klick([x + 15, y + 30]);
const rechts = (t, x, y, w = 140) => t.klick([x + w - 15, y + 30]);
const leitungen = (t) => t.page.$$eval('#edstage .ink [data-c] > path:first-child', (ps) => ps.map((p) => p.getAttribute('d')));
// Schnelleingabe des Weg-Schritt-Diagramms: Feld leeren, Ablauf eintragen, „Diagramm zeichnen“; Rückgabe: Hinweistext
async function schnelleingabe(t, text) {
  await t.page.fill('#editor [data-wsablauf]', text);
  await t.klick('#editor [data-wsablaufknopf]');
  return t.text('#editor [data-wsablaufhinweis]');
}
const wsStriche = async (t) => ((await t.daten()) || {s: []}).s;

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
    name: 'P1 Leitungen laufen nicht durch Kennzeichen',
    daten: 'pneu-kennzeichen',
    lauf: async (t) => {
      await t.oeffne('pneumatik');
      const r = await t.page.$$eval('#edstage .ink [data-o="d"] text', (ts) => {
        const b = ts.find((x) => x.textContent === '−RZ1').getBBox(); return [b.x, b.y, b.width, b.height];
      });
      t.erwarte(r[2] > 10, 'Kennzeichen −RZ1 gezeichnet');
      const schneidet = ([x1, y1, x2, y2]) => Math.max(x1, x2) > r[0] && Math.min(x1, x2) < r[0] + r[2]
        && Math.max(y1, y2) > r[1] && Math.min(y1, y2) < r[1] + r[3];
      const [weg] = (await leitungen(t)).map(abschnitte);
      t.erwarte(!weg.some(schneidet), `Leitung ${weg.join(' | ')} läuft durch −RZ1 ${r.map(Math.round)}`);
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
    name: 'P6 Beschriftungen am gedrehten und gespiegelten Ventil liegen nicht auf den Kästchen, Schwenkantrieb luftig',
    daten: 'pneu-gedreht',
    lauf: async (t) => {
      await t.oeffne('pneumatik');
      for (const id of ['a', 'b', 'c', 'd']) {
        const ueber = await t.page.$eval(`#edstage .ink [data-o="${id}"]`, (g) => {
          const r = (e) => e.getBoundingClientRect(), schnitt = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
            && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
          const kaesten = [...g.querySelectorAll('rect[width="40"][height="40"]')].map(r);
          return [...g.querySelectorAll('text')].filter((x) => kaesten.some((k) => schnitt(r(x), k))).map((x) => x.textContent);
        });
        t.gleich(ueber, [], `Ventil ${id}: Texte auf den Kästchen`);
      }
      t.erwarte((await texte(t, 'd')).includes('−QM4'), 'Kennzeichen am gedrehten Ventil');
      const [l, r] = await t.page.$$eval('#edstage .ink [data-o="r"] text', (ts) => ['−BG14', '−BG15']
        .map((n) => ts.find((x) => x.textContent === n).getBBox()).map((b) => ({x: b.x, width: b.width})));
      t.erwarte(r.x - (l.x + l.width) >= 30, `−BG14 und −BG15 am Schwenkantrieb zu eng: Abstand ${r.x - l.x - l.width}`);
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
  {
    name: 'W3 Signalgebertext bleibt in seiner Zeile, nicht in der Kopfzeile',
    daten: 'ws-signale',
    lauf: async (t) => {
      await t.oeffne('wegschritt');
      const ys = await t.page.$$eval('#edstage .ink text', (ts) => ts.filter((x) => /BG/.test(x.textContent))
        .map((x) => [x.textContent, +x.getAttribute('y')]));
      t.gleich(ys.length, 3, 'drei Signalgeber beschriftet');
      for (const [n, y] of ys) t.erwarte(y - 8 >= 74, `${n} ragt in die Kopfzeile (Grundlinie ${y})`);
      const zeile = (y) => Math.floor((y - 74) / 62);
      t.gleich(zeile(ys.find(([n]) => n === '−BG4')[1] - 8), zeile(186), '−BG4 in der Zeile seines Punkts');
    },
  },
  {
    name: 'W4 Hinweis auf die zurückgezogene VDI 3260',
    lauf: async (t) => {
      await t.page.evaluate(() => { location.hash = '#/vorlagen'; }); await t.ruhe();
      t.erwarte((await t.text('#app, body')).includes('nach der zurückgezogenen VDI 3260'), 'Vorlagenbeschreibung');
      await t.oeffne('wegschritt');
      t.erwarte((await t.text('#editor')).includes('nach der zurückgezogenen VDI 3260'), 'Hilfe der Seitenleiste');
    },
  },
  {
    name: 'P7 Antrieb −MM2 aus der Anlage: Zylinder, Ventil, Spulen, Sensoren, Abluftdrosselung verdrahtet',
    lauf: async (t) => {
      await t.oeffne('pneumatik');
      await t.klick('#editor [data-pneu="antrieb"]');
      await t.klick('#props [data-antrieb="MM2"]');
      const d = await t.daten(), k = (art) => d.o.filter((o) => o.k === art);
      const [z] = k('zyl2'), [v] = k('v52'), drv = k('drv');
      t.gleich([z.v, z.s1, z.s2], ['−MM2', '−BG3', '−BG4'], 'Zylinder mit Endlagen');
      t.gleich([v.al, v.ar, v.spl, v.spr], ['mag', 'mag', '−MB3', '−MB4'], '5/2 bistabil, −MB3 an 14, −MB4 an 12');
      t.gleich(drv.length, 2, 'zwei Drosselrückschlagventile');
      const hat = (a, pa, b, pb) => d.c.some((c) => c.a === a && c.pa === pa && c.b === b && c.pb === pb);
      const zuA = drv.find((x) => hat(x.id, '2', z.id, 'A')), zuB = drv.find((x) => hat(x.id, '2', z.id, 'B'));
      t.erwarte(zuA && hat(v.id, '4', zuA.id, '1'), 'Abluftdrosselung A: 4 → 1, 2 → A');
      t.erwarte(zuB && hat(v.id, '2', zuB.id, '1'), 'Abluftdrosselung B: 2 → 1, 2 → B');
      t.gleich(d.c.length, 5, 'mit Quelle an 1 fünf Leitungen');
    },
  },
  {
    name: 'P9 Drossel mit Öffnung und Richtung bestimmt die Hubzeit, Sensoren melden',
    daten: 'pneu-drossel',
    lauf: async (t) => {
      await t.oeffne('pneumatik');
      await t.werkzeug('sim');
      await links(t, 70, 300); await links(t, 380, 300);   // beide ausfahren
      await t.ruhe(1500);
      t.erwarte(await meldet(t, '−BG2x'), '−MM1 (Drosseln 100 %) nach 1,5 s vorn');
      t.erwarte(await meldet(t, '−BG2y'), '−MM2 fährt frei aus: Zuluft durch die Drossel an A ist frei (1 → 2)');
      await rechts(t, 70, 300); await rechts(t, 380, 300);   // beide einfahren
      await t.ruhe(1500);
      t.erwarte(await meldet(t, '−BG1x'), '−MM1 nach 1,5 s hinten');
      t.erwarte(!(await meldet(t, '−BG1y')), '−MM2 noch unterwegs: Abluft an A gedrosselt auf 20 %');
      await t.ruhe(6000);
      t.erwarte(await meldet(t, '−BG1y'), '−MM2 kommt gedrosselt doch an');
      t.erwarte(await t.zaehle('#simstatus svg.wegzeit polyline') === 2, 'Weg-Zeit-Diagramm mit zwei Antrieben');
    },
  },
  {
    name: 'P9 Bewegung nur bei entlüfteter Gegenkammer, 5/3 Mitte hält Druck, Taster tastend',
    daten: 'pneu-sim',
    lauf: async (t) => {
      await t.oeffne('pneumatik');
      await t.werkzeug('sim');
      await links(t, -10, 300); await t.ruhe(1500);
      t.erwarte(!(await meldet(t, '−BG2')), 'B hinter geschlossenem Kugelhahn: −MM1 steht');
      await t.klick([180, 160]); await t.ruhe(1500);   // Kugelhahn auf: B entlüftet über den Schalldämpfer
      t.erwarte(await meldet(t, '−BG2'), 'nach dem Öffnen fährt −MM1 aus');
      await links(t, 400, 300); await t.ruhe(500);
      await links(t, 400, 300); await t.ruhe(1500);   // nach 0,5 s in die Mitte
      t.gleich(await farbe(t, 4), BLAU, '5/3 Mitte gesperrt: Kammer A hält den Druck');
      t.erwarte(!(await meldet(t, '−BG6')), 'in der Mitte bleibt −MM3 stehen');
      const [x, y] = await t.punkt(695, 330);
      await t.page.mouse.move(x, y); await t.page.mouse.down(); await t.ruhe(100);
      t.gleich(await farbe(t, 7), BLAU, 'Taster gedrückt: Druck an −MM4');
      await t.page.mouse.up(); await t.ruhe(100);
      t.erwarte(await farbe(t, 7) !== BLAU, 'Taster losgelassen: Ventil fällt zurück');
    },
  },
  {
    name: 'P9 Bistabiles Ventil: Spulen nur während des Impulses 1, Schaltstellung getrennt',
    daten: 'pneu-symbole',
    lauf: async (t) => {
      await t.oeffne('pneumatik');
      await t.werkzeug('sim');
      const spule = async (n) => (await t.text('#simstatus')).match(new RegExp(`${n} ([01])`))[1];
      const stellung = () => t.text('#simstatus [data-simstellung]');
      t.gleich([await spule('−MB3'), await spule('−MB4')], ['0', '0'], 'Ruhe: beide Spulen 0');
      t.erwarte((await stellung()).includes('−QM1: 12'), 'Grundstellung 12');
      const [x, y] = await t.punkt(75, 230);
      await t.page.mouse.move(x, y); await t.page.mouse.down(); await t.ruhe(100);
      t.gleich([await spule('−MB3'), await spule('−MB4')], ['1', '0'], 'Impuls auf −MB3');
      await t.page.mouse.up(); await t.ruhe(100);
      t.gleich([await spule('−MB3'), await spule('−MB4')], ['0', '0'], 'nach dem Impuls beide 0');
      t.erwarte((await stellung()).includes('−QM1: 14'), 'Stellung 14 bleibt');
      t.gleich(await spule('−MB14'), '0', 'monostabil in Ruhe 0');
    },
  },
  {
    name: 'P9 Im Stillstand schreibt die Simulation die Signalanzeige nicht neu',
    daten: 'pneu-symbole',
    lauf: async (t) => {
      await t.oeffne('pneumatik');
      await t.werkzeug('sim');
      await t.ruhe(300);
      await t.page.evaluate(() => {   // Änderungen zählen; die Uhr der Seite steht, ruhe lässt sie laufen
        window.simstatusAenderungen = 0;
        new MutationObserver((m) => { window.simstatusAenderungen += m.length; })
          .observe(document.querySelector('#simstatus'), { childList: true, subtree: true, characterData: true });
      });
      await t.ruhe(600);
      t.gleich(await t.page.evaluate(() => window.simstatusAenderungen), 0, 'keine Änderung an #simstatus im Stillstand');
    },
  },
  {
    name: 'P8 Prüfen: offene Anschlüsse, Versorgung an 3, ohne Ventil, Zuluftdrosselung, doppelt, beide Sensoren',
    daten: 'pneu-pruefen',
    lauf: async (t) => {
      await t.oeffne('pneumatik');
      await t.knopf('pruefen');
      const text = await t.text('#props');
      for (const s of ['Anschluss 1 ist offen', 'Versorgung hängt an 3', 'Kein Wegeventil', 'Zuluftdrosselung',
        '−MB1 kommt 2-mal vor', '−MM1 kommt 2-mal vor', 'vordere Endlage fehlt',
        '−MM9: Sensor für die hintere Endlage fehlt', '−MM9: Sensor für die vordere Endlage fehlt'])
        t.erwarte(text.includes(s), `Befund fehlt: ${s}`);
      t.erwarte(await t.zaehle('#edstage .befund rect') >= 5, 'rote Markierungen auf dem Blatt');
    },
  },
  {
    name: 'P8 Prüfen: ein Antrieb aus der Anlage ist fehlerfrei',
    lauf: async (t) => {
      await t.oeffne('pneumatik');
      await t.klick('#editor [data-pneu="antrieb"]');
      await t.klick('#props [data-antrieb="MM3"]');
      await t.knopf('pruefen');
      const text = await t.text('#props');
      t.erwarte(!text.includes('Fehler') && !text.includes('Hinweis'), `unerwartete Befunde: ${text}`);
    },
  },
  {
    name: 'W1 Schnelleingabe zeichnet Funktions- und Signallinien mit den Sensoren der Anlage',
    lauf: async (t) => {
      await t.oeffne('wegschritt');
      await t.klick('#editor [data-wsablauf]');
      await t.tippe('MM2-, MM3+, MM2+, t = 10 s, MM2-, MM3-, MM2+');
      await t.klick('#editor [data-wsablaufknopf]');
      const s = (await t.daten()).s, art = (k) => s.filter((x) => x.k === k);
      t.gleich(art('sig').map((x) => x.lbl), ['−BG3', '−BG6', '−BG4', '−BG3', '−BG5'], 'Signalgeber aus der Anlage');
      t.gleich(art('sig').filter((x) => x.tz).map((x) => x.tz), ['t = 10 s'], 'Zeitglied an der Wartezeit');
      t.gleich(art('st').map((x) => x.lbl), ['−SF1'], 'Start');
      t.gleich(art('eq').length, 1, 'Zyklusende');
      t.erwarte(art('l').length >= 8, 'Funktionslinien für −MM2 und −MM3');
      t.erwarte(art('l').every((x) => x.p.every(([px]) => px >= 150 && px <= 150 + 7 * 68.75 + 1)), 'Linien in den Schritten 1 bis 7');
    },
  },
  {
    name: 'W1 Schnelleingabe lehnt eine Wartezeit am Anfang und zwei Zeiten hintereinander ab',
    lauf: async (t) => {
      await t.oeffne('wegschritt');
      t.erwarte((await schnelleingabe(t, 't = 5 s, MM2-, MM2+')).includes('beginnt mit dem Start'), 'Zeit am Anfang');
      t.gleich((await wsStriche(t)).length, 0, 'nichts gezeichnet');
      t.erwarte((await schnelleingabe(t, 'MM2-, t = 2 s, t = 3 s, MM2+')).includes('folgt direkt auf eine Wartezeit'),
        'zwei Zeiten hintereinander');
      t.gleich((await wsStriche(t)).length, 0, 'nichts gezeichnet');
      await schnelleingabe(t, 'MM2-, t = 5 s, MM2+');
      t.gleich((await wsStriche(t)).filter((x) => x.tz).map((x) => x.tz), ['t = 5 s'], 'Zeit nach einer Bewegung');
    },
  },
  {
    name: 'W1 Schnelleingabe lehnt einen Antrieb ab, den die Anlage nicht hat',
    lauf: async (t) => {
      await t.oeffne('wegschritt');
      for (const mm of ['MM9', 'MM7']) {
        const hinweis = await schnelleingabe(t, `MM2-, ${mm}+, MM2+`);
        t.erwarte(hinweis.includes(`−${mm} gibt es an der Anlage nicht`) && hinweis.includes('−MM8'), `${mm}: ${hinweis}`);
      }
      t.gleich((await wsStriche(t)).length, 0, 'nichts gezeichnet');
    },
  },
  {
    name: 'W1 Schnelleingabe: Feld über die volle Breite, Start-Beschriftung nicht auf der Funktionslinie',
    lauf: async (t) => {
      await t.oeffne('wegschritt');
      const breite = async (sel) => (await t.page.locator(sel).boundingBox()).width;
      t.erwarte(await breite('#editor [data-wsablauf]') > 200, 'Eingabefeld zu schmal');
      t.erwarte(await breite('#editor [data-wsablaufknopf]') > 200, 'Knopf unter dem Feld über die volle Breite');
      t.page.on('dialog', (d) => d.accept());   // „Vorhandene Linien ersetzen?“
      const starts = [];
      for (const ablauf of ['MM5+, MM2+, MM2-, MM5-', 'MM2-, MM2+']) {
        await schnelleingabe(t, ablauf);
        starts.push(JSON.stringify((await wsStriche(t)).find((x) => x.k === 'st').p));
        const ueber = await t.page.evaluate(() => {
          const sf = [...document.querySelectorAll('#edstage .ink text')].find((x) => x.textContent === '−SF1').getBBox();
          const im = (x, y) => x > sf.x && x < sf.x + sf.width && y > sf.y && y < sf.y + sf.height;
          // Funktionslinien: dicke Linien (stroke-width 2.8); Punkte entlang jeder Linie prüfen
          return [...document.querySelectorAll('#edstage .ink path[stroke-width="2.8"]')].some((p) => {
            const n = p.getTotalLength();
            for (let i = 0; i <= 50; i++) { const q = p.getPointAtLength(n * i / 50); if (im(q.x, q.y)) return true; }
            return false;
          });
        });
        t.erwarte(!ueber, `−SF1 liegt auf einer Funktionslinie (${ablauf})`);
      }
      t.erwarte(starts[0] !== starts[1], 'zweiter Ablauf ersetzt den ersten');
    },
  },
  {
    name: 'W1 Nach erfolgreicher Eingabe verschwindet die alte Fehlermeldung',
    lauf: async (t) => {
      await t.oeffne('wegschritt');
      t.erwarte((await schnelleingabe(t, 'MM2 vor')).includes('verstehe ich nicht'), 'Fehler bei MM2 vor');
      const hinweis = await schnelleingabe(t, 'MM2-, MM3+');
      t.erwarte(!hinweis.includes('verstehe ich nicht') && hinweis.includes('fährt aus'), `alter Fehler steht noch: ${hinweis}`);
      const farbe = await t.page.$eval('#editor [data-wsablaufhinweis]', (p) => p.style.color);
      t.gleich(farbe, '', 'Ausgangsfarbe');
    },
  },
  {
    name: 'W2 Bedeutung 1/0 vorbelegt, Prüfung: Auslöser und Grundstellung',
    daten: 'ws-fehler',
    lauf: async (t) => {
      await t.oeffne('wegschritt');
      const vordruck = await t.page.$eval('#edstage .tpl', (g) => g.textContent);
      t.erwarte(vordruck.includes('unten') && vordruck.includes('oben'), '−MM2: 1 = unten, 0 = oben');
      await t.knopf('pruefen');
      const text = await t.text('#props');
      t.erwarte(text.includes('keinen Auslöser'), 'Bewegung ohne Auslöser');
      t.erwarte(text.includes('nicht in der Grundstellung'), 'Zyklus endet nicht in Grundstellung');
    },
  },
  {
    name: 'W2 Schnelleingabe ergibt ein fehlerfreies Diagramm',
    lauf: async (t) => {
      await t.oeffne('wegschritt');
      await t.klick('#editor [data-wsablauf]');
      await t.tippe('MM1+ MM2-, MM3+, MM1- MM2+, MM3-');
      await t.klick('#editor [data-wsablaufknopf]');
      t.gleich((await t.daten()).s.filter((x) => x.k === 'vk').length, 2, 'zwei Sensoren lösen über UND aus');
      await t.knopf('pruefen');
      t.erwarte((await t.text('#props')).includes('Keine Auffälligkeiten'), await t.text('#props'));
    },
  },
  {
    name: 'W2 Bedeutung von 1 neben der Zeile eintragen',
    lauf: async (t) => {
      await t.oeffne('wegschritt');
      await t.werkzeug('sel');
      await t.klick([100, 146]);   // Zeile −MM2, oberes Drittel: Bedeutung von 1
      await t.tippe('gesenkt'); await t.taste('Enter');
      const d = await t.daten();
      t.gleich(d.meta.bed[1][0], 'gesenkt', 'Bedeutung gespeichert');
      t.erwarte((await t.page.$eval('#edstage .tpl', (g) => g.textContent)).includes('gesenkt'), 'Bedeutung im Vordruck');
    },
  },
];
