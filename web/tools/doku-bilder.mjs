// Doku-Bilder für docs/bilder/ (1400 × 788, Seitenleiste offen, Grafikstufe Hoch, Tiefenschatten an, Demo ohne SPS).
//   node tools/doku-bilder.mjs [name ...] [--ohne-tiefenschatten]   ohne Namen: alle; z. B. 03-schaltschrank 11-umrichter
// Läuft mit sichtbarem Chrome-Fenster: nur so rendert die Stufe Hoch (Schatten, Schrankleuchte) mit der echten Grafikkarte.
import { chromium } from 'playwright-core';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ziel = path.join(dir, '..', 'docs', 'bilder');
const wahl = process.argv.slice(2).filter(a => !a.startsWith('--'));
const tiefenschatten = !process.argv.includes('--ohne-tiefenschatten');
const browser = await chromium.launch({ headless: false, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--allow-file-access-from-files', '--window-size=1420,900'] });
const fehler = [];

async function seite() {
  const p = await browser.newPage({ viewport: { width: 1400, height: 788 } });
  p.on('pageerror', (e) => fehler.push(e.message));
  await p.addInitScript((ts) => { try { localStorage.setItem('zinnbad-grafik', 'hoch'); localStorage.setItem('zinnbad-tiefenschatten', ts ? '1' : '0'); } catch {} }, tiefenschatten);
  await p.goto(pathToFileURL(path.join(dir, 'index.html')).href);
  await p.waitForFunction(() => window.__zwilling, null, { timeout: 30000 });
  await p.waitForTimeout(2500);
  // Hilfe zu, alle vier Förderer am Umrichter
  await p.evaluate(() => {
    document.getElementById('legende-zu')?.click();
    for (const b of document.querySelectorAll('[data-art=fu]')) b.click();
  });
  return p;
}
const ansicht = async (p, key) => { await p.selectOption('#ansicht-wahl', key); await p.waitForTimeout(1600); };
const welt = (p, x, y, z) => p.evaluate(([x, y, z]) => window.__zwilling.anlage.localToWorld(new window.__zwilling.THREE.Vector3(x, y, z)).toArray(), [x, y, z]);
const speichern = (p, name) => p.screenshot({ path: path.join(ziel, name + '.jpg'), type: 'jpeg', quality: 86 });

// Seitenleiste: nur die genannten Bereiche offen
const bereiche = (p, offen) => p.evaluate((offen) => { for (const d of document.querySelectorAll('#side details.sec')) d.open = offen.includes(d.id); document.getElementById(offen[0])?.scrollIntoView(); }, offen);

const BILDER = {
  // Gesamtansicht nach etwas Betrieb (Körbe auf der Linie)
  '01-gesamtanlage': async (p) => { await p.waitForTimeout(20000); await ansicht(p, 'gesamt'); },
  '02-bedienpult': async (p) => { await p.waitForTimeout(5000); await ansicht(p, 'pult'); },
  '04-zinnbad': async (p) => { await p.waitForTimeout(12000); await ansicht(p, 'bad'); },
  '05-rollenkurve': async (p) => { await p.waitForTimeout(25000); await ansicht(p, 'kurve'); },
  '07-spruehkuehlung': async (p) => { await p.waitForTimeout(30000); await ansicht(p, 'kuehlung'); },
  // Linie von oben, Seitenleiste mit Prozesswerten
  '08-signalmonitor': async (p) => { await p.waitForTimeout(20000); await bereiche(p, ['sec-verbindung', 'sec-prozess']); await ansicht(p, 'linie'); },
  // Weg-Zeit-Diagramm groß mit Drosseln nach einem Zyklus
  '09-weg-zeit-diagramm': async (p) => { await p.waitForTimeout(32000); await bereiche(p, ['sec-prozess', 'sec-diagramm']); await p.click('#btn-wz-gross'); await p.waitForTimeout(1200); },
  // Drosselrückschlagventile am Anschlag −MM5 (Zylinder am Übergabeplatz)
  '10-drosselventile': async (p) => {
    await p.waitForTimeout(5000);
    // Kamera vor die beiden Drosseln von −MM5 (Klickflächen der Ventile), etwas von oben
    await p.evaluate(() => {
      const z = window.__zwilling, T = z.THREE, punkte = [];
      z.scene.updateMatrixWorld(true);
      z.scene.traverse((o) => { if (o.userData.art === 'drossel' && o.userData.taster === 'MM5') punkte.push(o.getWorldPosition(new T.Vector3())); });
      const mitte = punkte.reduce((a, b) => a.add(b), new T.Vector3()).multiplyScalar(1 / punkte.length);
      let zyl = null; z.scene.traverse((o) => { if (!zyl && o.userData.art === 'drossel' && o.userData.taster === 'MM5') zyl = o.parent.getWorldPosition(new T.Vector3()); });
      const r = mitte.clone().sub(zyl).setY(0).normalize(), q = new T.Vector3(-r.z, 0, r.x);   // r: Zylinder → Ventile, q: seitlich
      const kam = mitte.clone().addScaledVector(r, 0.28).addScaledVector(q, -0.05);
      z.cam(kam.x, kam.y, kam.z, mitte.x, mitte.y - 0.02, mitte.z);
    });
    await p.waitForTimeout(1600);
  },
  // Schaltschrank offen: S7-1500, Schütze, Klemmen, unten die Umrichter −TA2…−TA5
  '03-schaltschrank': async (p) => { await p.waitForTimeout(8000); await p.click('#btn-schrank'); await p.waitForTimeout(3500); },
  '06-pruefstation': async (p) => { await p.waitForTimeout(30000); await ansicht(p, 'pruefung'); },
  // Fenster „Umrichter“ mit Rampen: −TA2 nach einigen Fahrten des Bandmoduls
  '11-umrichter': async (p) => {
    await p.waitForTimeout(25000);
    await p.evaluate(() => { document.getElementById('btn-fu').click(); });
    await p.click('#fu-wahl button:nth-child(1)');
    await p.evaluate(() => { const f = document.getElementById('fuf'); f.style.left = '12px'; f.style.top = '8px'; f.style.width = '1030px'; f.style.height = '772px'; });
    await p.waitForTimeout(1500);
  },
  // Nahaufnahme der vier G120 im Schaltschrank
  '12-umrichter-schrank': async (p) => {
    await p.waitForTimeout(8000);
    await p.click('#btn-schrank'); await p.waitForTimeout(3500);
    await p.evaluate(([a, b]) => window.__zwilling.cam(...a, ...b), [await welt(p, -1385, 590, 470), await welt(p, -1374, 470, -230)]);
    await p.waitForTimeout(1600);
  },
  // Vor-Ort-Steuerstelle −S50: Prüfband auf 60 % über das Potentiometer, Seitenleiste mit −S50 offen
  '13-vorort-pruefband': async (p) => {
    await p.evaluate(async () => {
      const z = window.__zwilling, warte = (ms) => new Promise(r => setTimeout(r, ms));
      document.getElementById('sa7').click();
      const r = document.getElementById('sf47'); r.value = 60; r.dispatchEvent(new Event('input'));
      z.st.bedien.sf45 = true; await warte(300); z.st.bedien.sf45 = false;
      for (const d of document.querySelectorAll('#side details.sec')) d.open = d.id === 'sec-vorort';
      document.getElementById('sec-s50').open = true;
      for (const d of document.querySelectorAll('#sec-vorort details.sub')) if (d.id !== 'sec-s50') d.open = false;
      document.getElementById('sec-vorort').scrollIntoView();
    });
    await ansicht(p, 's50');
    await p.waitForTimeout(2500);
  },
  // Kühlwassertank: Nachspeisung über die (Demo-)SPS, Ablasshahn offen, Seitenleiste mit Prozesswerten
  '14-kuehlwassertank': async (p) => {
    await p.evaluate(() => { document.getElementById('kw-sps').click(); document.getElementById('btn-ablass').click(); });
    await p.waitForTimeout(25000);
    await bereiche(p, ['sec-prozess']);
    await ansicht(p, 'kuehlwasser');
  },
};

for (const [name, vorbereiten] of Object.entries(BILDER)) {
  if (wahl.length && !wahl.includes(name)) continue;
  const p = await seite();
  await vorbereiten(p);
  await speichern(p, name);
  console.log('geschrieben:', name + '.jpg');
  await p.close();
}
console.log(fehler.length ? fehler.join('\n') : 'Keine Seitenfehler.');
await browser.close();
