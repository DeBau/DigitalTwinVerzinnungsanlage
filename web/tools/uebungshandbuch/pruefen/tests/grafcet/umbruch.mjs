// GRAFCET-Tests am Seitenumbruch: Die L17-Kette mit „+ Schritt“ über zwei Blätter, Aktionen an den Schritten am
// Blattende. Nichts liegt auf Rand oder Schriftfeld, nichts auf den Verweisen der Abbruchstelle, im Druck ist kein
// Text abgeschnitten.
import { schneiden, umriss } from './hilfen.mjs';

const PH = 707;   // Blatthöhe
const BED = ['−SF1 · −KF2', '−BG1 · −BG15', '−BG3', '−BG6', '−BG7', '−BG4 · 10s/X6', '−BG3 · 10s/X7', '−BG8',
  '−BG4'];
// Liegt der Umriss [x, y, w, h] im Bereich um ein Blattende (80 darüber bis 70 darunter)?
const amUmbruch = ([, y, , h]) => [1, 2, 3].some((k) => y < k * PH + 70 && y + h > k * PH - 80);
// Liegt der Kasten [x, y, w, h] im Rahmen seines Blatts (15 bis 692) und nicht auf dem Schriftfeld (ab x 555, y 632)?
function imRahmen([x, y, w, h]) {
  const oben = Math.floor(y / PH) * PH;
  return y >= oben + 15 && y + h <= oben + 692 && !(x + w > 555 && y + h > oben + 632);
}
// Blattpunkt y ins Bild scrollen
const zeige = (t, y) => t.page.evaluate((y) => {
  const st = document.querySelector('#edstage'), svg = st.querySelector('svg');
  st.scrollTop = Math.max(0, y * svg.getBoundingClientRect().height / svg.viewBox.baseVal.height - 200);
}, y);
// Kasten der Verweistexte an Abbruchstellen („von …“, „→ …“) in Blattkoordinaten
const verweise = (t) => t.page.locator('#edstage .ink [data-c] text').evaluateAll((ts) => ts
  .filter((x) => /^(von |→ )/.test(x.textContent)).map((x) => { const b = x.getBBox(); return [b.x, b.y, b.width, b.height]; }));
// Druckansicht messen (#print ist nur in der Druckansicht sichtbar): je Blatt die Zahl der sichtbaren Texte und die
// Texte, deren Kasten über den Ausschnitt des Blatts ragt
async function druckTexte(t) {
  await t.drucke(); await t.page.emulateMedia({ media: 'print' });
  const blaetter = await t.page.locator('#print svg').evaluateAll((svgs) => svgs.map((svg) => {
    const v = svg.viewBox.baseVal, unten = v.y + v.height;
    const ts = [...svg.querySelectorAll('text')].map((x) => [x.textContent, x.getBBox()])
      .filter(([, b]) => b.height && b.y < unten && b.y + b.height > v.y);
    return {texte: ts.length, angeschnitten: ts.filter(([, b]) => b.y < v.y || b.y + b.height > unten).map(([s]) => s)};
  }));
  await t.page.emulateMedia({ media: 'screen' });
  return blaetter;
}

// Anfangsschritt, 9 × „+ Schritt“, Aktionen an Schritt 6 und 7
async function l17Kette(t) {
  await t.oeffne('grafcet', 'L17');
  await t.setze('init', 200, 80);
  for (const b of BED) { await t.klick('#editor [data-gc="plus"]'); await t.tippe(b); await t.taste('Enter'); }
  for (const v of ['6', '7']) {
    const s = (await t.objekte('step')).find((o) => o.v === v);
    await zeige(t, s.y); await t.klick([s.x + 20, s.y + 20]);
    await t.setze('action', s.x + 110, s.y + 20); await t.tippe('−MB' + v); await t.taste('Enter');
  }
  return t.daten();
}

export const tests = [
  {
    name: 'Seitenumbruch: L17-Kette über zwei Blätter, Aktionen bleiben am Schritt, Druck ohne Anschnitt',
    lauf: async (t) => {
      const d = await l17Kette(t), os = d.o;
      t.gleich(os.filter((o) => o.k === 'step').length, 9, 'Schritte 2 bis 10');
      for (const o of os) t.erwarte(!amUmbruch(umriss(o)), `${o.k} ${o.v} liegt am Blattende bei y ${o.y}`);
      for (let i = 0; i < os.length; i++) for (let j = i + 1; j < os.length; j++) {
        t.erwarte(!schneiden(umriss(os[i]), umriss(os[j])), `${os[i].k} ${os[i].v} liegt auf ${os[j].k} ${os[j].v}`);
      }
      for (const v of ['6', '7']) {
        const s = os.find((o) => o.k === 'step' && o.v === v), a = os.find((o) => o.v === '−MB' + v);
        t.gleich([a.x - s.x, a.y - s.y], [70, 5], `Aktion −MB${v} neben Schritt ${v}`);
      }
      const texte = await verweise(t);
      t.erwarte(texte.length >= 2, `Verweise an der Abbruchstelle: ${texte.length}`);
      for (const b of texte) {
        t.erwarte(imRahmen(b), `Verweis auf dem Rand oder Schriftfeld bei y ${b[1]}`);
        for (const o of os) t.erwarte(!schneiden(b, umriss(o)), `Verweis bei y ${b[1]} liegt auf ${o.k} ${o.v}`);
      }
      await t.klick('#editor [data-gc="ausrichten"]');
      t.gleich((await t.objekte()).map((o) => [o.x, o.y]), os.map((o) => [o.x, o.y]), 'Kette ausrichten hält den Umbruch ein');
      const blaetter = await druckTexte(t);
      t.gleich(blaetter.length, 2, 'zwei Blätter im Druck');
      t.erwarte(blaetter.every((b) => b.texte > 5), `Texte je Blatt: ${blaetter.map((b) => b.texte)}`);
      t.gleich(blaetter.flatMap((b) => b.angeschnitten), [], 'angeschnittene Texte im Druck');
    },
  },
];
