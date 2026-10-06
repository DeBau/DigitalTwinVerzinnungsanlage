/* Hauptstromkreis: Einspeisung mit Sammelschiene und Abgänge zu Motoren und Heizung (dreipolig).
   Je Seite bis zu drei Abgänge nebeneinander. Der Schutzleiter läuft rechts neben den Polen (x + 70). */
import { GRAU, SCHMAL, kreis, linie, punkt, text } from '../symbole/grund.js';
import { SYM } from '../symbole/iec60617.js';
import { X0, X1, spalteVon } from './blatt.js';
import { beschriftung, setze, verweis } from './elemente.js';
import { fundstellen, hauptort, kontakte, merke, verweisText, verweisZu } from './querverweise.js';

export const LEITER = [["L1", 50], ["L2", 62], ["L3", 74], ["N", 86], ["PE", 98]];
const PE_X = 70, START = 150, LUECKE = 22, POLE = [-20, 0, 20];
const PE_ANSCHLUSS = {klemme3: [8, 16], umrichter: [45, 45], motor3: [0, null]};   // PE kommt an / geht weiter

function schienen(ctx, quelle){
  return LEITER.map(([name, y]) => {
    const hier = {seite: ctx.seite.nr, spalte: 0};
    if (quelle) merke(ctx.schreiben, name, {...hier, rolle: "haupt"});
    const strich = name === "PE" ? ` stroke-dasharray="12 4"` : "";
    return `<path d="M${X0 + 4} ${y}H${X1 - 4}" stroke="#17212B" stroke-width="1.6"${strich}/>`
      + text(X0 + 6, y - 2.5, name, {g: 8.5, w: 600, schrift: SCHMAL}) + verweis(X0 + 40, y - 2.5, verweisZu(ctx.lesen, name, hier), "start");
  }).join("");
}

// Wendeschaltung: zwei Schütze, beide im Index als Hauptkontakte
function wendeSetzen(ctx, g, x, y){
  const [a, b] = g.bmk.split("/");
  for (const [bmk, px] of [[a, x], [b, x - 90]]) {
    merke(ctx.schreiben, bmk, {seite: ctx.seite.nr, spalte: spalteVon(px), rolle: "kontakt", an: "1/2 3/4 5/6", sym: "wende"});
  }
  // Kennzeichen von Schütz b über seiner Wirklinie, damit es die gestrichelte Linie nicht überdeckt
  return {svg: SYM.wende.zeichne(x, y, {}) + beschriftung(ctx, a, x + 82, y + 54, {a: "start", zeichenX: x})
    + beschriftung(ctx, b, x - 128, y + 36, {a: "end", zeichenX: x - 90}), h: SYM.wende.h};
}

function abgangSetzen(ctx, abgang, x){
  let y = START, peY = LEITER[4][1], s = POLE.map((d, i) => punkt(x + d, LEITER[i][1]) + linie(`M${x + d} ${LEITER[i][1]}V${y}`)).join("");
  s += text(x + 82, 128, abgang.titel, {g: 11, w: 600, schrift: SCHMAL});
  abgang.glieder.forEach((g, i) => {
    if (i) {
      s += POLE.map(d => linie(`M${x + d} ${y}V${y + LUECKE}`)).join("");
      y += LUECKE;
    }
    const teil = g.sym === "wende" ? wendeSetzen(ctx, g, x, y)
      : setze(ctx, {...g, anText: g.sym === "schuetz3" ? "1/2 3/4 5/6" : ""}, x, y);
    const pe = PE_ANSCHLUSS[g.sym], ohnePE = g.sym === "klemme3" && !g.nummern[3];
    if (pe && !ohnePE) {
      s += linie(`M${x + PE_X} ${peY}V${y + pe[0]}`) + (peY === LEITER[4][1] ? punkt(x + PE_X, peY) : "");
      if (pe[1] !== null) peY = y + pe[1];
    }
    s += teil.svg + spiegelText(ctx, g, x, y, teil.h);
    y += teil.h;
  });
  return s;
}

// Kontakte eines Motorschutzschalters oder Umrichters als kurze Liste unter dem Kennzeichen
function spiegelText(ctx, g, x, y, h){
  if (!["ms3", "umrichter"].includes(g.sym)) return "";
  return kontakte(ctx.lesen, g.bmk).map((e, i) => {
    const zy = y + h / 2 + 26 + i * 10;
    return text(x + 82, zy, e.an, {g: 7.5, f: GRAU}) + verweis(x + 120, zy, verweisText(e), "start");
  }).join("");
}

export function leistungInhalt(ctx){
  const breite = (X1 - X0) / 3;
  return schienen(ctx, false) + ctx.seite.abgaenge.map((a, i) => abgangSetzen(ctx, a, X0 + breite * i + 175)).join("");
}

/* ---------- Einspeisung ---------- */
function einspeisungKette(ctx){
  const x = 200;
  let s = text(x + 25, 52, "Einspeisung 3/N/PE AC 400/230 V 50 Hz, TN-S", {a: "middle", g: 11, w: 600, schrift: SCHMAL});
  s += text(x + 25, 66, "Vorsicherung 35 A gG bauseits (angenommen)", {a: "middle", g: 8, f: GRAU});
  const x0 = setze(ctx, {sym: "klemme3", bmk: "−X0", nummern: ["L1", "L2", "L3", "PE"]}, x, 90);
  const qb = setze(ctx, {sym: "qs3", bmk: "−QB1"}, x, 150);
  s += x0.svg + qb.svg + POLE.map(d => linie(`M${x + d} ${114}V${150}`)).join("");
  s += linie(`M${x + 50} 90V98M${x + 50} 106V110`) + kreis(x + 50, 102, 4) + text(x + 50, 86, "N", {a: "middle", g: 7.5, f: GRAU});
  return {svg: s, x};
}

function sammelschiene(ctx, x){
  const y0 = 300, leitungen = LEITER.map(([name], i) => [name, y0 + i * 16]);
  let s = "";
  leitungen.forEach(([name, y], i) => {
    merke(ctx.schreiben, name, {seite: ctx.seite.nr, spalte: 1, rolle: "haupt"});
    const vonX = i < 3 ? x + POLE[i] : name === "N" ? x + 50 : x + PE_X;
    const vonY = i < 3 ? 210 : name === "N" ? 110 : 102;
    const strich = name === "PE" ? ` stroke-dasharray="12 4"` : "";
    s += linie(`M${vonX} ${vonY}V${y}`) + punkt(vonX, y)
      + `<path d="M${vonX} ${y}H${X1 - 30}" stroke="#17212B" stroke-width="2"${strich}/>` + text(X1 - 26, y + 3, name, {g: 9, w: 600});
  });
  return s + linie(`M${x + PE_X} 90V102`);
}

function abgangsListe(ctx){
  const zeilen = [...ctx.modell.leistung.map(a => [a.glieder[0].bmk, a.titel]),
    ["−FA3", "Netzteil 24 V"], ["−FA4", "Verteilung 230 V"], ["−FA9", "Vibrorinne"]];
  let s = text(480, 410, "Abgänge von der Sammelschiene", {g: 11, w: 600, schrift: SCHMAL});
  zeilen.forEach(([bmk, titel], i) => {
    const y = 432 + i * 17, ziel = verweisText(hauptort(ctx.lesen, bmk) || (ctx.lesen.orte.get(bmk) || [])[0]);
    s += `<g class="sp-bmk" data-bmk="${bmk}">${text(480, y, bmk, {g: 9.5, w: 600, schrift: SCHMAL})}</g>`
      + text(560, y, titel, {g: 9}) + verweis(780, y, ziel, "start");
  });
  return s;
}

export function einspeisungInhalt(ctx){
  const kette = einspeisungKette(ctx);
  return kette.svg + sammelschiene(ctx, kette.x) + abgangsListe(ctx);
}
