// Bedientest des Schaltplans im Browser (nach dem Build):
//   node web/tools/uebungshandbuch/pruefen/tests/schaltplan-browser.mjs
// Blättern, Querverweis-Sprung, Fundstellen, Suche, Druckdialog, keine Konsolenfehler.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { neueSeite, ruhe, starte } from '../browser.mjs';

const hier = path.dirname(fileURLToPath(import.meta.url));
const html = pathToFileURL(path.resolve(hier, '../../../../../docs/uebungshandbuch.html')).href;
const fehler = [];
const pruefe = (bedingung, meldung) => { if (!bedingung) fehler.push(meldung); };

const browser = await starte();
const { page, meldungen } = await neueSeite(browser, html + '#/schaltplan/29');
const hash = () => page.evaluate(() => location.hash);

await page.waitForSelector('#sp-blatt svg');
pruefe((await page.locator('.sp-inhalt a').count()) > 50, 'Inhaltsverzeichnis fehlt');
await page.keyboard.press('ArrowRight'); await ruhe(page);
pruefe(await hash() === '#/schaltplan/30', `Pfeil rechts: ${await hash()}`);
await page.keyboard.press('ArrowLeft'); await ruhe(page);

const ref = page.locator('#sp-blatt [data-ref]').first(), ziel = await ref.getAttribute('data-ref');
await ref.click(); await ruhe(page);
pruefe(await hash() === '#/schaltplan/' + ziel.replace('.', '/'), `Verweis ${ziel} springt nach ${await hash()}`);
pruefe(await page.locator('.sp-markiert').count() === 1, 'Zielspalte nicht markiert');

await page.evaluate(() => { location.hash = '#/schaltplan/29'; }); await ruhe(page);
await page.locator('#sp-blatt [data-bmk="−QA1"]').first().click(); await ruhe(page);
pruefe((await page.locator('#sp-treffer a').count()) >= 3, 'Fundstellen von −QA1 fehlen');

await page.fill('#sp-suche', 'BG14'); await ruhe(page);
pruefe((await page.locator('#sp-treffer a').count()) >= 1, 'Suche nach BG14 ohne Treffer');
await page.fill('#sp-suche', '%I4.0'); await ruhe(page);
pruefe((await page.locator('#sp-treffer a').count()) >= 1, 'Suche nach %I4.0 ohne Treffer');

await page.click('[data-sp="drucken"]'); await ruhe(page);
pruefe(await page.locator('#dlg[open] form').count() === 1, 'Druckdialog öffnet nicht');
await page.fill('#dlg [name="von"]', '6'); await page.fill('#dlg [name="bis"]', '8');
await page.click('#dlg button[value="ok"]'); await ruhe(page, 100);
pruefe(await page.locator('#print section.sp-druck').count() === 3, 'Druck enthält nicht 3 Seiten');

pruefe(meldungen.length === 0, 'Konsole: ' + meldungen.join(' | '));
await browser.close();
if (fehler.length) { console.log(fehler.join('\n')); process.exit(1); }
console.log('✓ Bedientest Schaltplan bestanden');
