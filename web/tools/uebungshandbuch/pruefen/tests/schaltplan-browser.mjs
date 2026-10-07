// Bedientest des Schaltplans im Browser (nach dem Build):
//   node web/tools/uebungshandbuch/pruefen/tests/schaltplan-browser.mjs
// Blättern, Querverweis per Klick und per Tastatur, Fundstellen, Suche (Kennzeichen, Adresse, Potenzial, Gerät),
// Zoom und Einpassen, Inhaltsverzeichnis ausblenden, Druckdialog, keine Konsolenfehler.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { neueSeite, ruhe, starte } from '../browser.mjs';

const hier = path.dirname(fileURLToPath(import.meta.url));
const html = pathToFileURL(path.resolve(hier, '../../../../../docs/uebungshandbuch.html')).href;
const fehler = [];
const pruefe = (bedingung, meldung) => { if (!bedingung) fehler.push(meldung); };

const browser = await starte();
const { page, meldungen } = await neueSeite(browser, html + '#/schaltplan/1');
const hash = () => page.evaluate(() => location.hash);
const gehe = async h => { await page.evaluate(z => { location.hash = z; }, h); await ruhe(page); };
const treffer = async q => { await page.fill('#sp-suche', q); await ruhe(page); return page.locator('#sp-treffer a').count(); };

await page.waitForSelector('#sp-blatt svg');
pruefe((await page.locator('.sp-seiten a').count()) > 50, 'Inhaltsverzeichnis fehlt');
// Seite mit den Schützen −QA1/−QA2 über das Inhaltsverzeichnis finden, nicht über eine feste Nummer
const q2 = await page.locator('.sp-seiten a', { hasText: 'Ausgänge %Q2.0' }).getAttribute('data-nr');
await gehe('#/schaltplan/' + q2);

await page.keyboard.press('ArrowRight'); await ruhe(page);
pruefe(await hash() === `#/schaltplan/${+q2 + 1}`, `Pfeil rechts: ${await hash()}`);
await page.keyboard.press('ArrowLeft'); await ruhe(page);

const ref = page.locator('#sp-blatt [data-ref]').first(), ziel = await ref.getAttribute('data-ref');
await ref.click(); await ruhe(page);
pruefe(await hash() === '#/schaltplan/' + ziel.replace('.', '/'), `Verweis ${ziel} springt nach ${await hash()}`);
pruefe(await page.locator('.sp-markiert').count() === 1, 'Zielspalte nicht markiert');

await gehe('#/schaltplan/' + q2);
const tastRef = page.locator('#sp-blatt [data-ref]').nth(1), tastZiel = await tastRef.getAttribute('data-ref');
pruefe(await tastRef.getAttribute('tabindex') === '0', 'Querverweis ist nicht per Tab erreichbar');
await tastRef.focus(); await page.keyboard.press('Enter'); await ruhe(page);
pruefe(await hash() === '#/schaltplan/' + tastZiel.replace('.', '/'), `Enter auf Verweis ${tastZiel}: ${await hash()}`);

await gehe('#/schaltplan/' + q2);
await page.locator('#sp-blatt [data-bmk="−QA1"]').first().click(); await ruhe(page);
pruefe((await page.locator('#sp-treffer a').count()) >= 3, 'Fundstellen von −QA1 fehlen');

pruefe(await treffer('BG14') >= 1, 'Suche nach BG14 ohne Treffer');
pruefe(await treffer('%I4.0') >= 1, 'Suche nach %I4.0 ohne Treffer');
pruefe(await treffer('L+S') >= 1, 'Suche nach dem Potenzial L+S ohne Treffer');
pruefe(await treffer('Lichtvorhang') >= 1, 'Suche nach der Gerätebeschreibung Lichtvorhang ohne Treffer');

const transform = () => page.locator('#sp-blatt svg').evaluate(e => e.style.transform);
await page.click('[data-sp="rein"]'); await ruhe(page);
pruefe((await transform()).includes('scale(1.25)'), `Zoom +: ${await transform()}`);
await page.keyboard.press('0'); await ruhe(page);
pruefe((await transform()).includes('scale(1)'), `Einpassen: ${await transform()}`);
await page.locator('#sp-blatt').hover();
await page.mouse.wheel(0, -200); await ruhe(page);
pruefe(!(await transform()).includes('scale(1)'), 'Mausrad zoomt nicht');

await page.click('[data-sp="leiste"]'); await ruhe(page);
pruefe(await page.locator('.sp.sp-ohne-leiste').count() === 1, 'Inhaltsverzeichnis lässt sich nicht ausblenden');
await page.click('[data-sp="leiste"]'); await ruhe(page);

await page.click('[data-sp="drucken"]'); await ruhe(page);
pruefe(await page.locator('#dlg[open] form').count() === 1, 'Druckdialog öffnet nicht');
await page.fill('#dlg [name="von"]', '6'); await page.fill('#dlg [name="bis"]', '8');
await page.click('#dlg button[value="ok"]'); await ruhe(page, 100);
pruefe(await page.locator('#print section.sp-druck').count() === 3, 'Druck enthält nicht 3 Seiten');

pruefe(meldungen.length === 0, 'Konsole: ' + meldungen.join(' | '));
await browser.close();
if (fehler.length) { console.log(fehler.join('\n')); process.exit(1); }
console.log('✓ Bedientest Schaltplan bestanden');
