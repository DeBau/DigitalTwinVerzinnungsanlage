/* Deckblatt des Schaltplans: Titel, Kennzahlen, eine schlichte Übersichtsskizze der Anlage mit den Ortskennzeichen
   und die Liste der Orte. Die Skizze ist eine Tabelle aus Kästen, Bändern und Steuerstellen. */
import { BLAU, GRAU, SCHMAL, kasten, kreis, linie, text } from '../symbole/grund.js';
import { X0, X1 } from './blatt.js';

const STATION = "#EEF3F9", SCHRANK = "#FFF4D6";

// Skizze in Blattkoordinaten: Kästen [x, y, Breite, Höhe, Titel, Ort, Farbe]
const KAESTEN = [
  [660, 300, 78, 56, "Schaltschrank", "+A1", SCHRANK], [752, 312, 64, 34, "Bedienpult", "+P1", SCHRANK],
  [880, 352, 112, 48, "Zinnbad", "+F2", STATION], [1032, 432, 118, 64, "Prüfstation", "+F6", STATION],
];
// Bänder [x1, x2, y, Titel, Ort, Förderrichtung]; die Rollenkurve verbindet Band 1 und Band 2
const BAENDER = [[700, 1000, 470, "Band 1", "+F3", 1], [700, 1000, 530, "Band 2, Kühlung", "+F5", -1]];
const pfeil = (x, y, r) => linie(`M${x} ${y}h${24 * r}m${-6 * r} -4l${6 * r} 4l${-6 * r} 4`, 1);
const STEUERSTELLEN = [["+S10", 712, 446], ["+S20", 712, 560], ["+S30", 1040, 552], ["+S40", 1040, 420], ["+S50", 1110, 420]];

function kaesten(){
  return KAESTEN.map(([x, y, b, h, titel, ort, farbe]) => kasten(x, y, b, h, farbe)
    + text(x + b / 2, y + h / 2 - 2, titel, {a: "middle", g: 9, w: 600, schrift: SCHMAL})
    + text(x + b / 2, y + h / 2 + 11, ort, {a: "middle", g: 8.5, f: BLAU, schrift: SCHMAL})).join("");
}

function baender(){
  const band = ([x1, x2, y, titel, ort, r]) => kasten(x1, y - 8, x2 - x1, 16, "#fff")
    + text(x1 + 8, y + 4, `${titel}  ${ort}`, {g: 8.5, schrift: SCHMAL}) + pfeil(r > 0 ? x2 - 40 : x2 - 16, y, r);
  const kurve = linie("M1000 470C1032 470 1032 530 1000 530", 2) + text(1040, 512, "Rollenkurve +F4", {g: 8.5, schrift: SCHMAL});
  return BAENDER.map(band).join("") + kurve;
}

function portal(){   // Portal +F1 über Band 1 und Zinnbad
  return linie("M860 330H1010M870 330V462M1000 330V462", 2.2) + text(866, 322, "Portal +F1", {g: 8.5, w: 600, schrift: SCHMAL})
    + linie("M936 330V350", 1) + kasten(926, 342, 20, 8, "#fff");
}

function steuerstellen(){
  return STEUERSTELLEN.map(([ort, x, y]) => kreis(x, y, 4.5, "#fff", 1.1) + text(x + 8, y + 3, ort, {g: 7.5, f: GRAU, schrift: SCHMAL})).join("");
}

function skizze(){
  return text(660, 286, "Übersicht der Anlage", {g: 11, w: 600, schrift: SCHMAL}) + linie("M738 328H752", 1)
    + kaesten() + baender() + portal() + steuerstellen();
}

function kennzahl(x, y, zahl, wort){
  return kasten(x, y, 150, 74, "#F4F7FA") + text(x + 75, y + 40, String(zahl), {a: "middle", g: 28, w: 600, schrift: SCHMAL, f: BLAU})
    + text(x + 75, y + 60, wort, {a: "middle", g: 9, f: GRAU});
}

function kennzahlen(ctx){
  const m = ctx.modell, anzahl = test => m.kanaele.filter(test).length;
  const zahlen = [[ctx.seiten.length, "Seiten"], [m.geraete.size, "Betriebsmittel"], [m.klemmen.length, "Klemmen"],
    [anzahl(k => k.typ === "DI"), "Digitaleingänge"], [anzahl(k => k.typ === "DQ"), "Digitalausgänge"],
    [anzahl(k => k.typ[0] === "A") + m.profinet.length, "Analog- und Antriebsworte"]];
  return zahlen.map(([z, w], i) => kennzahl(110 + (i % 3) * 165, 290 + Math.floor(i / 3) * 92, z, w)).join("");
}

function orte(ctx){
  let s = text(110, 595, "Ortskennzeichen", {g: 12, w: 600, schrift: SCHMAL});
  Object.entries(ctx.modell.plan.orte).forEach(([k, t], i) => {
    const x = 110 + Math.floor(i / 5) * 270, y = 620 + (i % 5) * 26;
    s += text(x, y, k, {g: 10, w: 600, schrift: SCHMAL}) + text(x + 46, y, t, {g: 9.5});
  });
  return s;
}

export function deckblatt(ctx){
  const meta = ctx.modell.plan.meta;
  return linie(`M${X0} 250H${X1}`, .8) + text(110, 150, "Schaltplan der Anlage", {g: 54, w: 600, schrift: SCHMAL})
    + text(112, 192, meta.anlage, {g: 20, f: GRAU}) + text(112, 222, meta.norm, {g: 10, f: GRAU})
    + kennzahlen(ctx) + skizze() + linie(`M${X0} 570H${X1}`, .8) + orte(ctx);
}
