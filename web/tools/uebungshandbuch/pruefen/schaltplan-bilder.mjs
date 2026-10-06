// Screenshots ausgewählter Schaltplan-Seiten zur Sichtprüfung:
//   node web/tools/uebungshandbuch/pruefen/schaltplan-bilder.mjs <Zielordner> [Seite …]
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { starte, neueSeite } from './browser.mjs';

const hier = path.dirname(fileURLToPath(import.meta.url));
const html = pathToFileURL(path.resolve(hier, '../../../../docs/uebungshandbuch.html')).href;
const [ziel = '.', ...nummern] = process.argv.slice(2);
const browser = await starte();
const { page, meldungen } = await neueSeite(browser, html + '#/schaltplan/1');
for (const nr of nummern.length ? nummern : ['1']) {
  await page.evaluate(n => { location.hash = '#/schaltplan/' + n; }, nr);
  await page.waitForSelector('#sp-blatt svg');
  await page.locator('#sp-blatt').screenshot({ path: path.join(ziel, `seite-${String(nr).padStart(2, '0')}.png`) });
}
if (meldungen.length) console.log(meldungen.join('\n'));
await browser.close();
