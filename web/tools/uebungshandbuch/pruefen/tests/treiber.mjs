// Treiber für die Abnahmetests der Skizzen-Editoren (lauf.mjs). Ein Treiber bedient eine frische Seite nur über
// DOM, Maus und Tastatur. Im Bündel gibt es kein globales ED: Den Zustand liest der Treiber aus dem DOM und aus
// localStorage["uebh2:<scope>:sk:<key>"]. Koordinaten sind Blattkoordinaten (Breite 1000, wie im SVG der Zeichnung).
import { neueSeite, ruhe } from '../browser.mjs';

export class Fehlschlag extends Error {}

export async function neuerTreiber(browser, url, vorher) {
  const { ctx, page, meldungen } = await neueSeite(browser, url, { vorher });
  return new Treiber(ctx, page, meldungen);
}

export class Treiber {
  constructor(ctx, page, meldungen) { Object.assign(this, { ctx, page, meldungen, scope: 'frei', key: null }); }
  async schliessen() { await this.ctx.close(); }
  ruhe(ms = 30) { return ruhe(this.page, ms); }

  /* ---------- Bedienen ---------- */
  // Editor der Vorlage key öffnen: scope "frei" (Seite Vorlagen) oder eine Übung, z. B. "L17"
  async oeffne(key, scope = 'frei') {
    Object.assign(this, { key, scope });
    const ziel = scope === 'frei' ? '#/vorlagen' : `#/${scope}/2`;
    await this.page.evaluate((h) => { location.hash = h; }, ziel); await this.ruhe();
    await this.page.locator(`.btn[data-act="sk-open"][data-scope="${scope}"][data-key="${key}"]`).first().click();
    await this.ruhe(50);
  }
  // Blattpunkt [x, y] in Bildschirmpunkte umrechnen
  async punkt(x, y) {
    return this.page.evaluate(([x, y]) => {
      const svg = document.querySelector('#edstage svg'), p = svg.createSVGPoint(); p.x = x; p.y = y;
      const q = p.matrixTransform(svg.getScreenCTM()); return [q.x, q.y];
    }, [x, y]);
  }
  // Ziel: Blattpunkt [x, y] oder CSS-Selektor
  async ort(ziel) {
    if (Array.isArray(ziel)) return this.punkt(...ziel);
    const b = await this.page.locator(ziel).first().boundingBox();
    if (!b) throw new Fehlschlag(`nicht sichtbar: ${ziel}`);
    return [b.x + b.width / 2, b.y + b.height / 2];
  }
  async klick(ziel, { doppelt = false } = {}) {
    const [x, y] = await this.ort(ziel);
    if (doppelt) await this.page.mouse.dblclick(x, y); else await this.page.mouse.click(x, y);
    await this.ruhe();
  }
  async ziehe(von, nach, schritte = 8) {
    const [a, b] = [await this.ort(von), await this.ort(nach)];
    await this.page.mouse.move(...a); await this.page.mouse.down();
    for (let i = 1; i <= schritte; i++) {
      const f = i / schritte;
      await this.page.mouse.move(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f); await this.ruhe(5);
    }
    await this.page.mouse.up(); await this.ruhe();
  }
  // Baustein k aus der Palette an Blattpunkt (x, y) setzen
  async setze(k, x, y) {
    await this.klick(`#editor [data-place="${k}"]`);
    await this.klick([x, y]);
  }
  werkzeug(name) { return this.klick(`#editor .edbar [data-tool="${name}"]`); }
  knopf(name) { return this.klick(`#editor [data-ed="${name}"]`); }
  async taste(k) { await this.page.keyboard.press(k); await this.ruhe(); }
  async tippe(text) { await this.page.keyboard.type(text); await this.ruhe(); }

  /* ---------- Lesen ---------- */
  // Gespeicherte Zeichnung {s, t, o, c, meta} der geöffneten Vorlage (oder von scope/key), null wenn leer
  daten(key = this.key, scope = this.scope) {
    return this.page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), `uebh2:${scope}:sk:${key}`);
  }
  async objekte(k) { const d = await this.daten(); return ((d && d.o) || []).filter((o) => !k || o.k === k); }
  zaehle(sel) { return this.page.locator(sel).count(); }
  // Sichtbarer Text; SVG-Elemente haben kein innerText, dort zählt textContent
  text(sel) { return this.page.locator(sel).first().evaluate((el) => el.innerText ?? el.textContent); }
  // Druckansicht der geöffneten Skizze als HTML von #print
  async drucke() {
    await this.knopf('print'); await this.ruhe(200);
    return this.page.evaluate(() => document.querySelector('#print').innerHTML);
  }
  bild(sel = '#editor') { return this.page.locator(sel).first().screenshot({ animations: 'disabled' }); }

  /* ---------- Erwarten ---------- */
  erwarte(bedingung, text) { if (!bedingung) throw new Fehlschlag(text); }
  gleich(ist, soll, text) {
    const a = JSON.stringify(ist), b = JSON.stringify(soll);
    if (a !== b) throw new Fehlschlag(`${text}: ist ${a}, soll ${b}`);
  }
}
