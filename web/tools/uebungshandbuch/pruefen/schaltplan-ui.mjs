// Bilder der Schaltplan-Ansicht im Handbuch: hell, dunkel, schmal und gezoomt (Sichtprüfung):
//   node web/tools/uebungshandbuch/pruefen/schaltplan-ui.mjs <Zielordner>
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { starte, ruhe } from './browser.mjs';

const hier = path.dirname(fileURLToPath(import.meta.url));
const html = pathToFileURL(path.resolve(hier, '../../../../docs/uebungshandbuch.html')).href + '#/schaltplan/31';
const [ziel = '.'] = process.argv.slice(2);
const browser = await starte();
const FAELLE = [['ui-hell', 'light', 1600, 1000], ['ui-dunkel', 'dark', 1600, 1000], ['ui-schmal', 'light', 420, 900]];
for (const [name, farbe, breite, hoehe] of FAELLE) {
  const ctx = await browser.newContext({ viewport: { width: breite, height: hoehe }, colorScheme: farbe });
  const page = await ctx.newPage();
  await page.goto(html); await page.waitForSelector('#sp-blatt svg'); await ruhe(page, 200);
  await page.screenshot({ path: path.join(ziel, name + '.png') });
  if (name === 'ui-hell') {
    await page.locator('#sp-blatt').hover();
    for (let i = 0; i < 4; i++) await page.mouse.wheel(0, -200);
    await ruhe(page, 200);
    await page.screenshot({ path: path.join(ziel, 'ui-zoom.png') });
  }
  await ctx.close();
}
await browser.close();
