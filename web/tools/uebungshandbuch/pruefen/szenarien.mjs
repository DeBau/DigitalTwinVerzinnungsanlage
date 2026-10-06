// Szenarien für den Vorher-nachher-Vergleich. Jedes Szenario bedient die Seite nur über DOM, Maus und Tastatur,
// damit es mit dem alten (ein Skript) und dem neuen (Module) Stand gleich läuft.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neueSeite, ruhe } from './browser.mjs';

const hier = path.dirname(fileURLToPath(import.meta.url));
export const VORLAGEN = ['grafcet', 'zustand', 'wegschritt', 'stromlauf', 'leistung', 'pneumatik', 'regelkreis', 'trend', 'raster'];
export const beispielDatei = (name) => path.join(hier, 'beispiele', `${name}.json`);

// Sammler: hält DOM-Ausschnitte und Screenshots je Name.
export class Sammler {
  constructor() { this.dom = {}; this.png = {}; }
  async dom_(page, name, sel = '#app') {
    this.dom[name] = await page.evaluate((s) => { const el = document.querySelector(s); return el ? el.innerHTML : '(fehlt)'; }, sel);
  }
  async bild(page, name, sel) {
    await ruhe(page, 20);
    this.png[name] = sel ? await page.locator(sel).first().screenshot({ animations: 'disabled' }) : await page.screenshot({ animations: 'disabled' });
  }
}

const hash = async (page, h) => { await page.evaluate((x) => { location.hash = x; }, h); await ruhe(page, 30); };
const editorDom = async (page, S, name, bild = false) => {
  await S.dom_(page, `${name}.ink`, '#edstage .ink');
  await S.dom_(page, `${name}.props`, '#props');
  if (bild) await S.bild(page, name, '#editor');
};
export async function oeffne(page, scope, key) {
  if (scope === 'frei') await hash(page, '#/vorlagen'); else await hash(page, `#/${scope}/2`);
  await page.locator(`.btn[data-act="sk-open"][data-scope="${scope}"][data-key="${key}"]`).first().click();
  await ruhe(page, 50);
}
async function blatt(page) { const b = await page.locator('#edstage svg').boundingBox(); return { b, pt: (fx, fy) => [b.x + b.width * fx, b.y + b.height * fy] }; }
async function ziehe(page, a, z, schritte = 6) {
  await page.mouse.move(a[0], a[1]); await page.mouse.down();
  for (let i = 1; i <= schritte; i++) { await page.mouse.move(a[0] + (z[0] - a[0]) * i / schritte, a[1] + (z[1] - a[1]) * i / schritte); await ruhe(page, 5); }
  await page.mouse.up(); await ruhe(page, 30);
}

// A: alle Seiten der App
export async function seiten(browser, url, S, ids) {
  const { ctx, page, meldungen } = await neueSeite(browser, url);
  const ziele = ['#/', '#/vorlagen', '#/signale', '#/anlage', '#/richtlinien', '#/konzept', '#/bewertung', '#/bewertung/L05'];
  for (const id of ids) for (let p = 1; p <= 6; p++) ziele.push(`#/${id}/${p}`);
  const mitBild = new Set(['#/', '#/vorlagen', '#/signale', '#/richtlinien', '#/bewertung/L05', '#/L01/1', '#/L12/1', '#/L12/2', '#/L12/4', '#/L12/5', '#/L12/6', '#/L32/2']);
  for (const z of ziele) {
    await hash(page, z);
    await S.dom_(page, `A ${z}`);
    if (mitBild.has(z)) { await page.evaluate(() => scrollTo(0, 0)); await S.bild(page, `A ${z}`); }
  }
  // Interaktionen in einer Übung: Phase 4 Prüfpunkte, Quiz, Hilfe, Variablen
  await hash(page, '#/L12/2');
  for (const sel of ['[data-act="hilfe"]', '[data-act="var-import"]', '[data-act="var-add"]']) {
    const n = await page.locator(sel).count(); if (n) { await page.locator(sel).first().click(); await ruhe(page); await S.dom_(page, `A L12/2 ${sel}`); }
  }
  await hash(page, '#/L12/1');
  { const n = await page.locator('[data-act="quiz"]').count(); if (n) { await page.locator('[data-act="quiz"]').first().click(); await ruhe(page); await S.dom_(page, 'A L12/1 quiz'); } }
  await hash(page, '#/L12/5');
  { const n = await page.locator('[data-set]').count(); for (let i = 0; i < Math.min(n, 4); i++) { await page.locator('[data-set]').nth(i).click(); await ruhe(page); } await S.dom_(page, 'A L12/5 set'); }
  await page.locator('[data-act="print"]').first().click().catch(() => {}); await ruhe(page, 100); await S.dom_(page, 'A L12 print', '#print');
  await S.dom_(page, 'A L12 dlg', '#dlg');
  await ctx.close();
  return meldungen;
}

// B: leere Vorlage, jeden Baustein setzen, Werkzeuge benutzen
export async function leer(browser, url, S, key, scope = 'frei') {
  const { ctx, page, meldungen } = await neueSeite(browser, url);
  const P = `B ${scope}:${key}`;
  await hash(page, scope === 'frei' ? '#/vorlagen' : `#/${scope}/2`);
  await S.dom_(page, `${P} kacheln`);
  await oeffne(page, scope, key);
  await S.dom_(page, `${P} editor`, '#editor'); await S.bild(page, `${P} editor`, '#editor');
  const { pt } = await blatt(page);
  const places = await page.locator('#editor [data-place]').count();
  for (let i = 0; i < places; i++) {
    await page.locator('#editor [data-place]').nth(i).click(); await ruhe(page, 20);
    const col = i % 7, row = Math.floor(i / 7);
    const [x, y] = pt(0.08 + col * 0.12, 0.1 + (row % 7) * 0.11 + Math.floor(row / 7) * 0.03);
    await page.mouse.move(x, y); await ruhe(page, 10);
    await S.dom_(page, `${P} geist ${i}`, '#edstage .ghost');
    await page.mouse.click(x, y); await ruhe(page, 30);
    await editorDom(page, S, `${P} setze ${i}`);
  }
  if (places) {   // Ziehen aus der Palette
    const q = await page.locator('#editor [data-place]').first().boundingBox();
    await ziehe(page, [q.x + q.width / 2, q.y + q.height / 2], pt(0.5, 0.86), 10);
    await editorDom(page, S, `${P} gezogen`);
  }
  const ws = await page.locator('#editor [data-ws]').count();
  for (let i = 0; i < ws; i++) {
    await page.locator('#editor [data-ws]').nth(i).click(); await ruhe(page, 20);
    await editorDom(page, S, `${P} ws ${i} gewählt`);
    const fx = 0.2 + (i % 5) * 0.12, fy = 0.15 + (i % 4) * 0.2;
    await page.mouse.click(...pt(fx, fy)); await ruhe(page, 20);
    await page.mouse.move(...pt(fx + 0.06, fy + 0.08)); await ruhe(page, 20);
    await S.dom_(page, `${P} ws ${i} geist`, '#edstage .ghost');
    await page.mouse.click(...pt(fx + 0.06, fy + 0.08)); await ruhe(page, 20);
    await page.mouse.dblclick(...pt(fx + 0.06, fy + 0.08)).catch(() => {}); await ruhe(page, 20);
    await page.keyboard.press('Escape'); await ruhe(page, 20);
    if (!(await page.locator('#editor[open]').count())) await oeffne(page, scope, key);
    await editorDom(page, S, `${P} ws ${i}`);
  }
  // Freie Werkzeuge
  const werkzeuge = await page.locator('#editor .edbar [data-tool]').evaluateAll((els) => els.map((e, i) => [i, e.dataset.tool]));
  for (const [i, t] of werkzeuge) {
    if (t === 'sim' || t === 'sel' || t === 'conn') continue;
    await page.locator('#editor .edbar [data-tool]').nth(i).click(); await ruhe(page, 20);
    const fy = 0.55 + (i % 4) * 0.08;
    if (t === 'text') { await page.mouse.click(...pt(0.62, fy)); await ruhe(page); await page.keyboard.type('Text −BG9'); await page.keyboard.press('Enter'); await ruhe(page); }
    else await ziehe(page, pt(0.6, fy), pt(0.78, fy + 0.05));
    await editorDom(page, S, `${P} werkzeug ${i} ${t}`);
  }
  await page.locator('#editor [data-ed="undo"]').click(); await ruhe(page);
  await editorDom(page, S, `${P} undo`, true);
  await page.locator('#editor [data-ed="close"]').click(); await ruhe(page);
  await S.dom_(page, `${P} gespeichert`, '#app');
  await ctx.close();
  return meldungen;
}

// C: Beispielzustand laden, alles anklicken, Tasten, Drucken; D: Simulation
export async function beispiel(browser, url, S, name) {
  const datei = beispielDatei(name);
  if (!existsSync(datei)) return [`Beispiel ${name} fehlt`];
  const ls = JSON.parse(readFileSync(datei, 'utf8'));
  const { scope, key } = ls.__ziel;
  delete ls.__ziel;
  const { ctx, page, meldungen } = await neueSeite(browser, url, { vorher: ls });
  const P = `C ${name}`;
  await hash(page, scope === 'frei' ? '#/vorlagen' : `#/${scope}/2`);
  await S.dom_(page, `${P} kacheln`); await S.bild(page, `${P} kachel`, `.sk:has([data-key="${key}"][data-scope="${scope}"])`);
  await oeffne(page, scope, key);
  await S.dom_(page, `${P} editor`, '#editor'); await S.bild(page, `${P} editor`, '#editor');
  const conn = page.locator('#editor .edbar [data-tool="conn"]');
  if (await conn.count()) { await conn.click(); await ruhe(page); await editorDom(page, S, `${P} verbinden`, true); await page.locator('#editor .edbar [data-tool="sel"]').click(); await ruhe(page); }
  const ids = await page.locator('#edstage .ink [data-o]').evaluateAll((els) => [...new Set(els.map((e) => e.dataset.o))]);
  for (const id of ids) {
    const el = page.locator(`#edstage .ink [data-o="${id}"]`).first();
    const b = await el.boundingBox().catch(() => null); if (!b) continue;
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await ruhe(page, 20);
    await editorDom(page, S, `${P} wähle ${id}`);
  }
  // Tasten am zuletzt gewählten Objekt
  for (const k of ['r', 'm', 'ArrowRight', 'ArrowDown', 'Delete', 'Control+z', 'Control+z', 'Escape']) {
    await page.keyboard.press(k); await ruhe(page, 20);
    if (!(await page.locator('#editor[open]').count())) { await S.dom_(page, `${P} taste ${k} geschlossen`); await oeffne(page, scope, key); }
    await editorDom(page, S, `${P} taste ${k}`);
  }
  // Ziehen eines Objekts und Doppelklick
  if (ids.length) {
    const b = await page.locator(`#edstage .ink [data-o="${ids[0]}"]`).first().boundingBox().catch(() => null);
    if (b) {
      await ziehe(page, [b.x + b.width / 2, b.y + b.height / 2], [b.x + b.width / 2 + 60, b.y + b.height / 2 + 40]);
      await editorDom(page, S, `${P} objekt gezogen`);
      await page.mouse.dblclick(b.x + b.width / 2 + 60, b.y + b.height / 2 + 40); await ruhe(page);
      await S.dom_(page, `${P} doppelklick`, '#editor');
      await page.keyboard.type('Neu'); await page.keyboard.press('Enter'); await ruhe(page);
      await editorDom(page, S, `${P} beschriftet`);
    }
  }
  // Verbindungen und Texte anklicken
  for (const sel of ['[data-c]', '[data-ti]', '[data-i]']) {
    const n = Math.min(await page.locator(`#edstage .ink ${sel}`).count(), 6);
    for (let i = 0; i < n; i++) {
      const b = await page.locator(`#edstage .ink ${sel}`).nth(i).boundingBox().catch(() => null); if (!b) continue;
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await ruhe(page, 20);
      await editorDom(page, S, `${P} klick ${sel} ${i}`);
    }
  }
  // Schriftfeld
  const sf = page.locator('#edstage [data-sf]').first();
  if (await sf.count()) { await sf.click().catch(() => {}); await ruhe(page); await editorDom(page, S, `${P} schriftfeld`); }
  // Simulation
  const sim = page.locator('#editor .edbar [data-tool="sim"]');
  if (await sim.count()) {
    await sim.click(); await ruhe(page, 100); await editorDom(page, S, `${P} sim an`);
    for (const id of ids) {
      const b = await page.locator(`#edstage .ink [data-o="${id}"]`).first().boundingBox().catch(() => null); if (!b) continue;
      for (const fx of [0.15, 0.85]) {
        await page.mouse.click(b.x + b.width * fx, b.y + b.height / 2); await ruhe(page, 300);
        await S.dom_(page, `${P} sim ${id} ${fx}`, '#edstage .ink');
      }
    }
    await page.clock.runFor(3000); await ruhe(page);
    await editorDom(page, S, `${P} sim ende`, true);
    await page.locator('#editor .edbar [data-tool="sel"]').click(); await ruhe(page);
  }
  // Aus früherer Übung
  const take = page.locator('#editor [data-ed="take"]');
  if (await take.count()) { await take.click(); await ruhe(page); await S.dom_(page, `${P} take`, '#editor .takewrap'); await page.keyboard.press('Escape'); await ruhe(page); }
  if (!(await page.locator('#editor[open]').count())) await oeffne(page, scope, key);
  await page.locator('#editor [data-ed="print"]').click(); await ruhe(page, 200);
  await S.dom_(page, `${P} druck editor`, '#print');
  await page.locator('#editor [data-ed="close"]').click(); await ruhe(page);
  for (const w of ['0', '1']) {
    const b = page.locator(`[data-act="sk-print"][data-scope="${scope}"][data-key="${key}"][data-with="${w}"]`).first();
    if (await b.count()) { await b.click(); await ruhe(page, 200); await S.dom_(page, `${P} druck ${w}`, '#print'); }
  }
  await page.emulateMedia({ media: 'print' }); await ruhe(page);
  await S.bild(page, `${P} druckbild`);
  await page.emulateMedia({ media: 'screen' });
  // Alles leeren
  await oeffne(page, scope, key);
  const clr = page.locator('#editor [data-ed="clear"]');
  if (await clr.count()) { await clr.click(); await ruhe(page); await editorDom(page, S, `${P} geleert`); await page.locator('#editor [data-ed="undo"]').click(); await ruhe(page); await editorDom(page, S, `${P} geleert undo`); }
  await ctx.close();
  return meldungen;
}
