// Hilfen für die GRAFCET-Tests: Umriss der Bausteine wie im Editor, Setzen, Verbindungen als Paare von Arten.
// Koordinaten sind Blattkoordinaten.

// Umriss wie umrissVon für die Bausteine, die die Tests setzen
export const UMRISS = {
  init: (o) => [o.x, o.y, 40, 40],
  step: (o) => [o.x, o.y, 40, 40],
  trans: (o) => [o.x - 16, o.y - 9, 32, 18],
  action: (o) => [o.x, o.y, 90, 30],
};
export const umriss = (o) => (UMRISS[o.k] || ((p) => [p.x, p.y, 20, 20]))(o);
export const schneiden = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];

// Baustein setzen, dessen Paletteneintrag weiter unten in der Leiste liegt
export async function setzeSichtbar(t, k, x, y) {
  await t.page.locator(`#editor [data-place="${k}"]`).scrollIntoViewIfNeeded();
  await t.setze(k, x, y);
}
// Transition setzen und ihre Bedingung tippen
export async function transition(t, x, y, text) {
  await t.setze('trans', x, y);
  await t.tippe(text); await t.taste('Enter');
}
// Verbindungen der Zeichnung als ["init>trans", …] (Arten von a und b)
export async function verbindungen(t) {
  const d = await t.daten(), k = Object.fromEntries(d.o.map((o) => [o.id, o.k]));
  return d.c.map((c) => `${k[c.a]}>${k[c.b]}`);
}
// Baustein mit Kennzeichen v
export const nach = (d, v, k = null) => d.o.find((o) => o.v === v && (!k || o.k === k));

// Kette 1, BG1, 2 mit Aktion MB1 (Anfangsschritt bei 200, 100)
export async function kurzeKette(t) {
  await t.setze('init', 220, 120);
  await transition(t, 220, 190, 'BG1');
  await t.setze('step', 220, 240);
  await t.setze('action', 320, 245);
  await t.tippe('MB1'); await t.taste('Enter');
}
// Pfade der Verbindungslinien (erster Pfad je Verbindung)
export const wege = (t) => t.page.locator('#edstage .ink [data-c] > path:first-child')
  .evaluateAll((ps) => ps.map((p) => p.getAttribute('d')));
