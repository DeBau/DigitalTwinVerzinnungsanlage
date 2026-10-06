// Gemeinsamer Browserstart für die Prüfwerkzeuge des Übungshandbuchs: feste Umgebung, damit zwei Läufe vergleichbar sind.
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';

const KANDIDATEN = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];

export async function starte() {
  const executablePath = KANDIDATEN.find((p) => existsSync(p));
  if (!executablePath) throw new Error('Weder Chrome noch Edge gefunden.');
  return chromium.launch({ executablePath, args: ['--allow-file-access-from-files', '--force-device-scale-factor=1', '--font-render-hinting=none', '--disable-gpu', '--disable-lcd-text', '--disable-partial-raster', '--force-color-profile=srgb'] });
}

// Neue Seite mit leerem localStorage, fester Uhr und festem Zufall.
export async function neueSeite(browser, url, { vorher } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1, colorScheme: 'light', reducedMotion: 'reduce',
    locale: 'de-DE', timezoneId: 'Europe/Berlin',
  });
  const page = await ctx.newPage();
  const meldungen = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') meldungen.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => meldungen.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', (r) => meldungen.push(`[requestfailed] ${r.url()}`));
  const t0 = new Date('2026-10-06T10:00:00+02:00');
  await page.clock.install({ time: t0 });
  await page.clock.pauseAt(t0);
  await page.addInitScript((daten) => {
    let s = 20261006;
    Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
    window.print = () => {};
    window.confirm = () => true;
    window.alert = () => {};
    if (daten && !sessionStorage.getItem('__vorher')) {
      for (const [k, v] of Object.entries(daten)) localStorage.setItem(k, v);
      sessionStorage.setItem('__vorher', '1');
    }
  }, vorher || null);
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await page.clock.runFor(50);
  return { ctx, page, meldungen };
}

const takt = (page) => page.evaluate(() => new Promise((r) => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); }));
// Uhr vorspulen und offene Ereignisse (z. B. close eines Dialogs) abarbeiten lassen
export const ruhe = async (page, ms = 50) => {
  await takt(page); await page.clock.runFor(Math.max(ms, 400)); await takt(page); await takt(page);
  await page.evaluate(() => document.fonts.ready);
};
