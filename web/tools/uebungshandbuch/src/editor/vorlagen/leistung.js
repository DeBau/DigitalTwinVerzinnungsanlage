// Vorlage Hauptstromkreis (L1, L2, L3, N, PE): Schutzschalter, Schütze, Motoren, Umrichter und die Potenzialschiene.
// Die Schienen der Vorlage sind virtuelle Potenzialschienen (Haken schienen), Leitungen docken an beliebiger Stelle an.
// Die Schaltzeichen kommen aus symbole/iec60617.js. Dort liegen die drei Pole auf x − 20, x, x + 20; hier liegt das
// Bauteil mit o.x links, die Pole also auf o.x + 10, 30, 50 (Mitte o.x + 30).
import { linie, nummer } from '../../symbole/grund.js';
import { SYM } from '../../symbole/iec60617.js';
import { INK } from '../svg.js';
import { BAUSTEIN, SAMPLE, fuelle, registriereBauteile, registriereGruppe, registriereVorlage } from '../registry.js';
import { G, TX, grid } from '../vorlagen-svg.js';
import { LB } from '../bauteile.js';
import { setzeBreite } from '../bausteine.js';
import { textFeld } from '../eigenschaften.js';
import { kennzeichen } from './elektro-kennzeichen.js';
import { pruefeLeistung } from './elektro-pruefen.js';
import { POLE_OBEN_UNTEN, andockeDreipolig, mehrpolig, poleKlick, poleKnoepfe } from './leistung-pole.js';

export const LEITER = [["L1", 50], ["L2", 70], ["L3", 90], ["N", 110], ["PE", 130]];
export const PE_STRICH = 'stroke-dasharray="10 4"';
export function leistungBlatt(){
  const leiter = ([n, y]) => `<path d="M60 ${y}H975" stroke="${G}" stroke-width="2" ${n === "PE" ? PE_STRICH : ""}/>`
    + TX(50, y + 4, 12, n, "end", "#555", 600);
  return grid(10, "#EEF1F3", 40, 150, 975, 620) + LEITER.map(leiter).join("") + TX(975, 38, 9, "3/N/PE AC 400/230 V 50 Hz", "end");
}
registriereVorlage("leistung", {
  n: "Hauptstromkreis", d: "L1, L2, L3, N, PE: Schütze, Wendeschützschaltung, Motorschutz, Motoren, Umrichter",
  gruppen: ["leistung", "geraete", "elektro"], schienen: LEITER.map(([n, y]) => [n, y, 60, 915]),
  body: leistungBlatt,
  pruefe: pruefeLeistung,
  werkzeugleiste: {get nachVerbinden(){ return poleKnoepfe(); }},
  klick: poleKlick,
});
registriereGruppe("leistung", {
  name: "Hauptstromkreis",
  hinweis: "Bauteile setzen und mit Verbinden Anschluss für Anschluss verdrahten: erst den Anschluss am einen, dann am "
    + "anderen Bauteil anklicken, auch direkt auf die Schienen L1, L2, L3, N, PE. Wendeschützschaltung: zwei Schütze, "
    + "beim zweiten L1 und L3 tauschen.",
  kennzeichen,
  mehrpolig,
  andocke: andockeDreipolig,
});

// Potenzialschiene: waagrechte Linie der Länge w; Leitungen docken irgendwo an (Anschluss „~“), nicht drehbar
export const SCHIENE = {
  schiene: true, drehbar: false,
  umriss: o => ({x: o.x, y: o.y - 6, w: o.w || 400, h: 12}),
  neu(o, [px, py]){ o.w = 400; o.x = px - 200; o.y = py; },
  setze: setzeBreite,
  felder: o => textFeld("v", "Potenzial, z. B. L+, M, L1, PE", BAUSTEIN.rail.lbl, o.v) + textFeld("w", "Länge", "", o.w || 400),
};
const schiene = o => `<path d="M${o.x} ${o.y}H${o.x + (o.w || 400)}" stroke="${INK}" stroke-width="2.2" `
  + `${o.v === "PE" ? PE_STRICH : ""}/>` + LB(o.x - 6, o.y + 4, o.v);

/* ---------- Dreipolige Bauteile: Pole bei 10, 30, 50 ---------- */
export const POLE3 = [["1", 10, 0, "u"], ["3", 30, 0, "u"], ["5", 50, 0, "u"], ["2", 10, 60, "d"], ["4", 30, 60, "d"], ["6", 50, 60, "d"]];
// Dreipoliges Bauteil mit dem Schaltzeichen sym, Kennzeichen links
const dreipolig = (n, lbl, sym, w = 60) => ({g: "leistung", n, lbl, w, h: 60, anschluesse: POLE3, pole: POLE_OBEN_UNTEN,
  zeichne: o => SYM[sym].zeichne(o.x + 30, o.y, {}) + LB(o.x - 4, o.y + 35, o.v)});
// Motor: U1, V1, W1 oben, Schutzleiter PE rechts (x + 100)
const MOTOR = [["U1", 10, 0, "u"], ["V1", 30, 0, "u"], ["W1", 50, 0, "u"], ["PE", 100, 0, "u"]];
// Umrichter: Netz L1, L2, L3 oben, Motor U, V, W unten, Schutzleiter rechts durchgehend (PE oben, PE2 unten)
const UMRICHTER = [["L1", 10, 0, "u"], ["L2", 30, 0, "u"], ["L3", 50, 0, "u"], ["PE", 100, 0, "u"],
  ["U", 10, 90, "d"], ["V", 30, 90, "d"], ["W", 50, 90, "d"], ["PE2", 100, 90, "d"]];
const umrichter = o => SYM.umrichter.zeichne(o.x + 30, o.y, {text: "FU"}) + linie(`M${o.x + 100} ${o.y}V${o.y + 90}`)
  + nummer(o.x + 104, o.y + 9, "PE") + nummer(o.x + 104, o.y + 87, "PE") + LB(o.x - 24, o.y + 48, o.v);

// Angezeigte Namen der Umrichter-Anschlüsse: Motorseite U2, V2, W2, beide Schutzleiter PE
const UMRICHTER_NAME = {U: "U2", V: "V2", W: "W2", PE2: "PE"};
registriereBauteile({
  ls3: dreipolig("Leitungsschutzschalter 3-polig", "−FA2", "ls3"),
  ms3: dreipolig("Motorschutzschalter", "−FA1", "ms3", 90),
  k3: dreipolig("Schütz 3-polig (Hauptkontakte)", "−QA1", "schuetz3"),
  qs3: dreipolig("Hauptschalter 3-polig", "−QB1", "qs3", 72),
  m3: {g: "leistung", n: "Drehstrommotor", lbl: "−MA1", w: 110, h: 80, anschluesse: MOTOR, pole: [["U1", "V1", "W1"]],
    zeichne: o => SYM.motor3.zeichne(o.x + 30, o.y, {}) + LB(o.x - 4, o.y + 56, o.v)},
  fu: {g: "leistung", n: "Frequenzumrichter", lbl: "−TA2", bx: -20, w: 130, h: 90, anschluesse: UMRICHTER, zeichne: umrichter,
    pole: [["L1", "L2", "L3"], ["U", "V", "W"]],
    anschlussName: (o, n) => UMRICHTER_NAME[n] || n},
  rail: {g: "leistung", n: "Potenzialschiene", lbl: "L+", w: 400, h: 0, ...SCHIENE, zeichne: schiene},
});
fuelle(SAMPLE, {rail: [{k: "rail", x: 4, y: 10, v: "", w: 70}, "0 0 78 20", ""]});
