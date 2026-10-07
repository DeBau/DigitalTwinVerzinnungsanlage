/* Kontaktspiegel unter einer Spule: alle Kontakte des Geräts mit Anschlüssen und Fundstelle /Seite.Spalte.
   Reihenfolge: Hauptkontakte, Schließer, Öffner. Jede Zeile beginnt mit einem kleinen Schaltzeichen. */
import { GRAU, linie, text } from '../symbole/grund.js';
import { verweis } from './elemente.js';
import { kontakte, verweisText } from './querverweise.js';

const ZEILE = 13;
const REIHENFOLGE = {haupt: 0, no: 1, nc: 2};

// Art aus den Anschlüssen: 1/2 3/4 5/6 = Hauptkontakte; zweite Zahl endet auf 2 = Öffner, auf 4 = Schließer
export function kontaktArt(an){
  const [erste, zweite = ""] = String(an).split("/");
  if (/^[135]$/.test(erste)) return "haupt";
  return zweite.endsWith("2") ? "nc" : "no";
}

const BILD = {
  no: (x, y) => linie(`M${x} ${y}V${y + 3}M${x} ${y + 11}V${y + 8}L${x - 4} ${y + 2}`, 1),
  nc: (x, y) => linie(`M${x} ${y}V${y + 3}H${x + 3}M${x} ${y + 11}V${y + 8}L${x + 4} ${y + 2}`, 1),
  haupt: (x, y) => linie(`M${x} ${y}V${y + 3}M${x} ${y + 11}V${y + 8}L${x - 4} ${y + 2}`, 1.4),
};

// Dieselbe Fundstelle mit denselben Anschlüssen nur einmal zeigen
function eindeutig(liste){
  const gesehen = new Set();
  return liste.filter(e => {
    const schluessel = `${e.seite}.${e.spalte}:${e.an}`;
    if (gesehen.has(schluessel)) return false;
    gesehen.add(schluessel);
    return true;
  });
}

export function kontaktspiegel(ctx, bmk, x, y){
  const liste = eindeutig(kontakte(ctx.lesen, bmk))
    .sort((a, b) => REIHENFOLGE[kontaktArt(a.an)] - REIHENFOLGE[kontaktArt(b.an)]);
  if (!liste.length) return {svg: "", h: 0};
  let s = linie(`M${x - 34} ${y - 4}H${x + 34}`, .6);
  liste.forEach((e, i) => {
    const zy = y + i * ZEILE, refX = Math.max(x + 6, x - 18 + String(e.an).length * 4.2 + 6);
    s += BILD[kontaktArt(e.an)](x - 26, zy) + text(x - 18, zy + 9, e.an, {g: 7.5, f: GRAU})
      + verweis(refX, zy + 9, verweisText(e), "start");
  });
  return {svg: s, h: liste.length * ZEILE};
}
