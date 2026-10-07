// Abnahmetests des Pakets REGEL: Regelkreis, Trendaufzeichnung, Kästchenraster.
// Koordinaten sind Blattkoordinaten (1000 × 707 je Blatt).

// Zahl der Texte mit genau diesem Inhalt im Element sel
const texte = (t, sel, inhalt) => t.page.evaluate(([s, i]) =>
  [...document.querySelectorAll(`${s} text`)].filter((e) => e.textContent === i).length, [sel, inhalt]);
// Texte mit diesem Inhalt auf Blatt n (0, 1 …) im Vorgedruckten des ersten SVG unter sel
const blattTexte = (t, sel, n, inhalt) => texte(t, `${sel} .tpl > g[transform="translate(0 ${n * 707})"]`, inhalt);
// IDs, die in einem SVG mehrfach vorkommen
const doppelteIds = (t, sel) => t.page.evaluate((s) => [...document.querySelectorAll(s)].flatMap((svg) => {
  const ids = [...svg.querySelectorAll('[id]')].map((e) => e.id);
  return ids.filter((id, i) => ids.indexOf(id) !== i);
}), sel);

// Ist das Muster des Regelkreises im ersten SVG unter sel zu sehen?
const musterSichtbar = (t, sel) => t.page.evaluate((s) => {
  const g = document.querySelector(`${s} .rk-muster`);
  return !!g && getComputedStyle(g).display !== 'none';
}, sel);

// Punkte des Pfeils i aus dem Pfad im Editor (pfadD: "Mx yLx y…")
const pfeilPunkte = (t, i) => t.page.evaluate((n) => document.querySelector(`#edstage .ink [data-c="${n}"] path`)
  .getAttribute('d').slice(1).split('L').map((q) => q.split(' ').map(Number)), i);
// Schneidet ein Abschnitt des Zugs das Innere des Rechtecks r?
const kreuzt = (p, r) => p.slice(1).some((q, i) => {
  const a = p[i], x1 = Math.min(a[0], q[0]), x2 = Math.max(a[0], q[0]), y1 = Math.min(a[1], q[1]), y2 = Math.max(a[1], q[1]);
  return x1 < r.x + r.w - 1 && x2 > r.x + 1 && y1 < r.y + r.h - 1 && y2 > r.y + 1;
});
// Kein Pfeil der Zeichnung kreuzt einen Block (Blöcke ohne Typ, Breite aus dem SVG)
async function keineKreuzung(t) {
  const boxen = await t.page.evaluate(() => [...document.querySelectorAll('#edstage .ink [data-o] rect[height="60"]')]
    .map((r) => ({x: +r.getAttribute('x'), y: +r.getAttribute('y'), w: +r.getAttribute('width'), h: 60})));
  const n = (await t.daten()).c.length;
  for (let i = 0; i < n; i++) {
    const p = await pfeilPunkte(t, i);
    t.erwarte(!boxen.some((b) => kreuzt(p, b)), `Pfeil ${i} kreuzt einen Block: ${JSON.stringify(p)}`);
  }
}
// Baustein setzen und ein sofort geöffnetes Beschriftungsfeld schließen
async function setzeRuhig(t, k, x, y) { await t.setze(k, x, y); await t.taste('Escape'); }
async function verbinde(t, von, nach) { await t.werkzeug('conn'); await t.klick(von); await t.klick(nach); }

export const tests = [
  {
    name: 'R1 Vordruck nur auf Blatt 1, IDs eindeutig',
    daten: 'regel-zwei-blaetter',
    lauf: async (t) => {
      await t.oeffne('regelkreis');
      t.gleich(await blattTexte(t, '#edstage', 0, 'Bedeutung in dieser Übung'), 1, 'Vordruck auf Blatt 1 im Editor');
      t.gleich(await blattTexte(t, '#edstage', 1, 'Bedeutung in dieser Übung'), 0, 'Vordruck auf Blatt 2 im Editor');
      t.gleich(await doppelteIds(t, '#edstage svg'), [], 'doppelte IDs im Editor');
      await t.drucke();
      t.gleich(await t.zaehle('#print section.land'), 2, 'zwei Druckblätter');
      t.gleich(await blattTexte(t, '#print section.land:nth-of-type(2)', 1, 'Bedeutung in dieser Übung'), 0, 'Druck Blatt 2');
      t.gleich(await blattTexte(t, '#print section.land:nth-of-type(1)', 0, 'Bedeutung in dieser Übung'), 1, 'Druck Blatt 1');
      t.gleich(await doppelteIds(t, '#print svg'), [], 'doppelte IDs im Druck');
    },
  },
  {
    name: 'R2 Muster verschwindet mit dem ersten Baustein',
    lauf: async (t) => {
      await t.oeffne('regelkreis');
      t.erwarte(await musterSichtbar(t, '#edstage'), 'Muster im leeren Editor sichtbar');
      await t.setze('sum', 300, 550);
      t.erwarte(!(await musterSichtbar(t, '#edstage')), 'Muster nach dem Setzen ausgeblendet');
      await t.taste('Escape');
      await t.taste('Control+z');
      t.erwarte(await musterSichtbar(t, '#edstage'), 'Muster nach Rückgängig wieder da');
      await t.setze('sum', 300, 550);
      await t.knopf('close');
      t.erwarte(!(await musterSichtbar(t, '.th[data-key="regelkreis"]')), 'Kachel mit Baustein ohne Muster');
      await t.klick('.btn[data-act="sk-print"][data-key="regelkreis"][data-with="0"]');
      t.erwarte(await musterSichtbar(t, '#print'), 'leerer Vordruck druckt das Muster');
    },
  },
  {
    name: 'R3 Pfeile mit Vorschlägen, Rückführung unten, Verzweigung',
    lauf: async (t) => {
      await t.oeffne('regelkreis');
      await setzeRuhig(t, 'sig', 100, 200);
      await setzeRuhig(t, 'sum', 200, 200);
      await setzeRuhig(t, 'box', 340, 200);
      await setzeRuhig(t, 'box', 560, 200);
      await setzeRuhig(t, 'box', 460, 320);
      t.gleich((await t.objekte('sig')).map((o) => o.v), ['w'], 'erstes Signal heißt w');
      await verbinde(t, [100, 200], [200, 200]);
      await verbinde(t, [200, 200], [340, 200]);
      await verbinde(t, [340, 200], [560, 200]);
      await verbinde(t, [560, 200], [460, 320]);
      await verbinde(t, [460, 320], [200, 200]);
      const d = await t.daten();
      t.gleich(d.c.map((c) => c.v), ['', 'e', '', '', 'x'], 'Namen an den Pfeilen');
      const zurueck = await pfeilPunkte(t, 4), ende = zurueck[zurueck.length - 1];
      t.gleich(ende, [200, 215], 'Rückführung endet unten an der Summierstelle');
      await keineKreuzung(t);
      await setzeRuhig(t, 'sig', 800, 200);
      await verbinde(t, [560, 200], [800, 200]);
      t.gleich((await t.objekte('abzw')).length, 1, 'zweiter Pfeil aus der Strecke setzt eine Verzweigung');
      t.gleich((await t.objekte('sig')).map((o) => o.v), ['w', 'x'], 'zweites Signal heißt x');
      t.gleich(await t.zaehle('#edstage .ink [data-o] circle[r="3.5"]'), 1, 'Verzweigung als gefüllter Punkt');
      t.gleich(await texte(t, '#edstage .ink', '−'), 1, 'Minus an der Summierstelle');
    },
  },
  {
    name: 'R3 Muster übernehmen ergibt Bausteine ohne Kreuzungen',
    lauf: async (t) => {
      await t.oeffne('regelkreis');
      await t.klick('#editor [data-rk="muster"]');
      const d = await t.daten();
      t.gleich([d.o.length, d.c.length], [9, 9], 'Muster als Bausteine');
      await keineKreuzung(t);
      t.erwarte(!(await musterSichtbar(t, '#edstage')), 'graues Muster danach ausgeblendet');
    },
  },
  {
    name: 'T1 Trend: Fangraster gleich Achsenteilung, Achsenfelder, Legende',
    lauf: async (t) => {
      await t.oeffne('trend');
      for (const [f, v] of [['g1', 'Temperatur'], ['e1', '°C'], ['a1', '0'], ['b1', '80'], ['t', '160']]) {
        await t.klick(`#editor [data-tr="${f}"]`); await t.tippe(v);
      }
      const a = (await t.daten()).meta.achsen;
      t.gleich(a, {g1: 'Temperatur', e1: '°C', a1: '0', b1: '80', t: '160'}, 'Achsen gespeichert');
      for (const s of ['Temperatur', '°C', '80', '40', '160', '10']) t.gleich(await texte(t, '#edstage .ink', s) >= 1, true, `Wert ${s}`);
      for (const s of ['Istwert x', 'Sollwert w', 'Stellgröße y']) t.gleich(await texte(t, '#edstage .tpl', s), 1, `Legende ${s}`);
      await t.werkzeug('line');
      await t.ziehe([100, 100], [300, 250]);
      const p = (await t.daten()).s[0].p;
      t.gleich(p, [[80, 87.5], [301.25, 230]], 'Linie rastet auf den Teilstrichen');
      await t.knopf('close');
      await t.oeffne('trend');
      t.gleich(await t.page.inputValue('#editor [data-tr="b1"]'), '80', 'Feld nach erneutem Öffnen');
    },
  },
  {
    name: 'T2 Kästchenraster im Druck echt 5 mm',
    lauf: async (t) => {
      await t.oeffne('raster');
      await t.drucke();
      // Druckbereich A4 quer mit 8 mm Rand: 281 × 194 mm bei 96 px je Zoll
      await t.page.setViewportSize({width: Math.round(281 / 25.4 * 96), height: Math.round(194 / 25.4 * 96)});
      await t.page.emulateMedia({media: 'print'});
      const mm = await t.page.evaluate(() => {
        const svg = document.querySelector('#print svg'), d = svg.querySelector('.tpl path').getAttribute('d');
        const xs = [...d.matchAll(/M([\d.]+) 15V/g)].map((m) => +m[1]);
        return (xs[1] - xs[0]) * svg.getScreenCTM().a * 25.4 / 96;
      });
      t.erwarte(Math.abs(mm - 5) < 0.05, `Kästchen im Druck ${mm.toFixed(2)} mm statt 5 mm`);
    },
  },
  {
    name: 'R4 Übertragungsglieder mit Piktogramm, PID_Compact-Hinweise',
    lauf: async (t) => {
      await t.oeffne('regelkreis');
      for (const k of ['P', 'I', 'PT1', 'PT2', 'Tt', 'PI', 'PID', '2P']) {
        t.gleich(await t.zaehle(`#editor [data-place="glied_${k}"]`), 1, `Palette ${k}`);
      }
      await setzeRuhig(t, 'glied_PT1', 400, 200);
      t.gleich((await t.objekte('box')).map((o) => o.typ), ['PT1'], 'Glied als Block mit typ');
      t.gleich(await t.zaehle('#edstage .ink [data-o] rect[width="80"][height="60"]'), 1, 'Glied 80 × 60');
      await t.werkzeug('sel'); await t.klick([400, 200]);
      await t.page.selectOption('#props select[data-prop="typ"]', 'PID'); await t.ruhe();
      t.gleich((await t.objekte('box')).map((o) => o.typ), ['PID'], 'Verhalten umgestellt');
      t.erwarte((await t.text('#props')).includes('PID_Compact'), 'Hinweis auf PID_Compact beim PID-Regler');
      await setzeRuhig(t, 'sig', 200, 200);
      await t.werkzeug('sel'); await t.klick([200, 200]);
      t.erwarte((await t.text('#props')).includes('Setpoint'), 'Signal nennt die PID_Compact-Namen');
      t.gleich(await texte(t, '#edstage .ink', 'PID_Compact: Setpoint'), 1, 'Hinweis am Signal w');
    },
  },
  {
    name: '6c Regelkreis ausprobieren: Simulation mit Sollwertsprung, Kp und Tn',
    lauf: async (t) => {
      await t.oeffne('regelkreis');
      await t.klick('#editor [data-rk="sim"]');
      t.gleich(await t.zaehle('#props #rk-sim-bild .rk-linie'), 0, 'vor dem Sprung keine Kurven');
      await t.klick('#editor [data-rk="sprung"]');
      t.gleich(await t.zaehle('#props #rk-sim-bild .rk-linie'), 3, 'w, x und y nach dem Sollwertsprung');
      t.erwarte((await t.text('#rk-sim-text')).includes('Regeldifferenz ist am Ende weg'), 'PI regelt aus');
      await t.page.selectOption('#props select[data-rks="regler"]', 'P'); await t.ruhe();
      const vorher = await t.text('#rk-sim-text');
      t.erwarte(vorher.includes('bleibt eine Regeldifferenz'), `P lässt eine Regeldifferenz: ${vorher}`);
      await t.page.fill('#props input[data-rks="kp"]', '8'); await t.ruhe();
      const rest = (s) => +s.match(/von (-?[\d,]+) %/)[1].replace(',', '.');
      t.erwarte(rest(await t.text('#rk-sim-text')) < rest(vorher), 'größeres Kp, kleinere Regeldifferenz');
      t.gleich(await t.daten(), null, 'Simulation speichert nichts');
      await t.klick('#editor [data-rk="simzu"]');
      t.gleich(await t.zaehle('#props #rk-sim-bild'), 0, 'Simulation geschlossen');
    },
  },
];
