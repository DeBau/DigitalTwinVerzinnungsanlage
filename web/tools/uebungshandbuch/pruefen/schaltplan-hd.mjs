// Alle Schaltplan-Seiten in doppelter Auflösung als Bild (Sichtprüfung):
//   node web/tools/uebungshandbuch/pruefen/schaltplan-hd.mjs <Zielordner> [von] [bis]
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { starte, neueSeite } from './browser.mjs';

const hier = path.dirname(fileURLToPath(import.meta.url));
const html = pathToFileURL(path.resolve(hier, '../../../../docs/uebungshandbuch.html')).href;
const [ziel = '.', von = '1', bis = '999'] = process.argv.slice(2);
const browser = await starte();
const { page, meldungen } = await neueSeite(browser, html + '#/schaltplan/1');
await page.waitForSelector('#sp-blatt svg');
await page.setViewportSize({ width: 2400, height: 1700 });
const gesamt = await page.locator('.sp-seiten a').count();
for (let nr = +von; nr <= Math.min(+bis, gesamt); nr++) {
  await page.evaluate(n => { location.hash = '#/schaltplan/' + n; }, nr);
  await page.waitForSelector('#sp-blatt svg');
  // Blatt groß über die Seite legen: gleiche Schriften wie im Handbuch, doppelte Auflösung
  await page.locator('#sp-blatt').evaluate(e => { e.style.cssText = 'position:fixed;left:0;top:0;width:2376px;padding:0;border:0;z-index:99999'; });
  await page.locator('#sp-blatt svg').screenshot({ path: path.join(ziel, `s${String(nr).padStart(2, '0')}.png`) });
}
if (meldungen.length) console.log(meldungen.join('\n'));
await browser.close();
