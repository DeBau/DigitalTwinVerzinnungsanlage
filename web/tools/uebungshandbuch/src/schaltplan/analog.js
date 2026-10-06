/* Zweiter Leiter, Schirm und Speisung der Analogkanäle. Die Pfadlinie (x) ist der Hauptleiter, der zweite Leiter
   läuft auf x + 24 parallel dazu, mit eigener Klemme. Welche Anschlüsse das sind, steht in klemmen.js (analogAnschluss).
   Genutzt von pfade.js. */
import { GRAU, SCHMAL, kreis, linie, text } from '../symbole/grund.js';
import { spalteVon } from './blatt.js';
import { verweis } from './elemente.js';
import { merke, verweisZu } from './querverweise.js';

const ABSTAND = 24, MODUL_UNTEN = 86;   // zweiter Leiter rechts der Pfadlinie; Unterkante der oberen Baugruppe

// Anfang des zweiten Leiters am Gerät: oben (2-Leiter-Strom) oder am seitlichen Anschluss des Zeichens
function anfang(k, x, geraet){
  if (k.analog.vonOben) return {svg: linie(`M${x} ${geraet.y - 16}H${x + ABSTAND}`), y: geraet.y - 16};
  const [dx, dy] = geraet.sym.rueck, y = geraet.y + dy;
  return {svg: dx < ABSTAND ? linie(`M${x + dx} ${y}H${x + ABSTAND}`) : "", y};
}

function klemmeSeite(ctx, k, x, y){
  merke(ctx.schreiben, k.klemmeSeite, {seite: ctx.seite.nr, spalte: spalteVon(x), rolle: "klemme"});
  return kreis(x, y + 12, 4) + text(x + 7, y + 15, k.klemmeSeite, {g: 7.5, w: 600, schrift: SCHMAL});
}

// Schirm: gestrichelte Ellipse um beide Leiter, aufgelegt auf PE
function schirm(x, y){
  return `<ellipse cx="${x + ABSTAND / 2}" cy="${y}" rx="${ABSTAND / 2 + 9}" ry="5" fill="none" stroke="#17212B" `
    + `stroke-width=".9" stroke-dasharray="3 2"/>` + text(x - 10, y + 3, "Schirm auf PE", {a: "end", g: 7, f: GRAU});
}

// Zweiter Leiter mit Klemme und Schirm. lage: Höhe des Geräts und der Klemme aus der Pfadzeichnung
export function analogLeiter(ctx, pfad, x, lage, unten){
  const k = pfad.kanal, xs = x + ABSTAND, start = anfang(k, x, lage.geraet), kl = lage.klemme;
  const unterModul = ctx.seite.modul.lage === "unten";
  const [von, bis] = unterModul ? [start.y, unten] : [MODUL_UNTEN, start.y];
  let s = start.svg + linie(`M${xs} ${von}V${kl + 8}M${xs} ${kl + 16}V${bis}`) + klemmeSeite(ctx, k, xs, kl);
  s += unterModul ? schirm(x, (kl + 24 + unten) / 2) : schirm(x, (MODUL_UNTEN + kl) / 2);
  return s;
}

// Anschlussnamen der Baugruppe und zweiter Abgang am Baugruppenkasten
export function analogModulAnschluss(k, x, anschluss, oben){
  const a = k.analog, y = oben ? anschluss - 6 : anschluss + 12;
  return linie(`M${x + ABSTAND} ${anschluss}V${oben ? anschluss - 8 : anschluss + 8}`)
    + text(x - 3, y, a.haupt.baugruppe, {a: "end", g: 7, f: GRAU}) + text(x + ABSTAND + 3, y, a.seite.baugruppe, {g: 7, f: GRAU});
}

// Speisung 24 V eines aktiven Feldgeräts (zum Beispiel Stellantrieb): kurzer Abgang mit Potenzial und Verweis
export function speisung(ctx, pfad, x, lage){
  const pot = (ctx.modell.plan.speisung || {})[pfad.kanal.bmk];
  if (!pot || !lage.geraet || pfad.kanal.typ !== "AQ") return "";   // am Eingang kommt die Speisung von oben
  const y = lage.geraet.y + 40, hier = {seite: ctx.seite.nr, spalte: spalteVon(x)};
  return linie(`M${x + 17} ${y}H${x + 40}`) + text(x + 42, y + 3, `24 V ${pot}`, {g: 7.5, w: 600, schrift: SCHMAL})
    + verweis(x + 42, y + 13, verweisZu(ctx.lesen, pot, hier), "start");
}
