// Vorlage Hauptstromkreis (L1, L2, L3, N, PE): Schutzschalter, Schütze, Motoren, Umrichter und die Potenzialschiene.
// Die Schienen der Vorlage sind virtuelle Potenzialschienen (Haken schienen), Leitungen docken an beliebiger Stelle an.
import { INK, SVGT } from '../svg.js';
import { BAUSTEIN, SAMPLE, fuelle, registriereBauteile, registriereGruppe, registriereVorlage } from '../registry.js';
import { G, TX, grid } from '../vorlagen-svg.js';
import { LB, PD, PN, PP, SK } from '../bauteile.js';
import { setzeBreite } from '../bausteine.js';
import { textFeld } from '../eigenschaften.js';

export const LEITER = [["L1",50],["L2",70],["L3",90],["N",110],["PE",130]];
export function leistungBlatt(){
  let r = "";
  LEITER.forEach(([n, y]) => { r += `<path d="M60 ${y}H975" stroke="${G}" stroke-width="2" ${n === "PE" ? 'stroke-dasharray="10 4"' : ""}/>` + TX(50, y + 4, 12, n, "end", "#555", 600); });
  return grid(10, "#EEF1F3", 40, 150, 975, 620) + r + TX(975, 38, 9, "3/N/PE AC 400/230 V 50 Hz", "end");
}
registriereVorlage("leistung", {
  n: "Hauptstromkreis", d: "L1, L2, L3, N, PE – Schütze, Wendeschützschaltung, Motorschutz, Motoren, Umrichter",
  gruppen: ["leistung", "geraete", "elektro"], schienen: [["L1",50,60,915], ["L2",70,60,915], ["L3",90,60,915], ["N",110,60,915], ["PE",130,60,915]],
  body: leistungBlatt,
});
registriereGruppe("leistung", {
  name: "Hauptstromkreis",
  hinweis: "Bauteile setzen und mit Verbinden Anschluss für Anschluss verdrahten: erst den Anschluss am einen, dann am anderen Bauteil anklicken – auch direkt auf die Schienen L1, L2, L3, N, PE. Wendeschützschaltung: zwei Schütze, beim zweiten L1 und L3 tauschen.",
});

// Potenzialschiene: waagrechte Linie der Länge w; Leitungen docken irgendwo an (Anschluss „~“), nicht drehbar
export const SCHIENE = {
  schiene: true, drehbar: false,
  umriss: o => ({x: o.x, y: o.y - 6, w: o.w || 400, h: 12}),
  neu(o, [px, py]){ o.w = 400; o.x = px - 200; o.y = py; },
  setze: setzeBreite,
  felder: o => textFeld("v", "Potenzial, z. B. L+, M, L1, PE", BAUSTEIN.rail.lbl, o.v) + textFeld("w", "Länge", "", o.w || 400),
};
registriereBauteile({
  /* Hauptstromkreis – drei Pole bei 10/30/50 */
  ls3:{g:"leistung", n:"Leitungsschutzschalter 3-polig", lbl:"-FA2", w:60, h:60, anschluesse:[["1",10,0,"u"],["3",30,0,"u"],["5",50,0,"u"],["2",10,60,"d"],["4",30,60,"d"],["6",50,60,"d"]],
    zeichne:o => [10,30,50].map(d => PP(`M${o.x+d} ${o.y}V${o.y+20}M${o.x+d} ${o.y+60}V${o.y+42}L${o.x+d-11} ${o.y+21}M${o.x+d-3} ${o.y+17}L${o.x+d+3} ${o.y+23}M${o.x+d+3} ${o.y+17}L${o.x+d-3} ${o.y+23}`)).join("") + PD(`M${o.x+4} ${o.y+31}H${o.x+46}`) + LB(o.x-4, o.y+35, o.v)},
  ms3:{g:"leistung", n:"Motorschutzschalter", lbl:"-FA1", w:90, h:60, anschluesse:[["1",10,0,"u"],["3",30,0,"u"],["5",50,0,"u"],["2",10,60,"d"],["4",30,60,"d"],["6",50,60,"d"]],
    zeichne:o => [10,30,50].map(d => PP(`M${o.x+d} ${o.y}V${o.y+20}M${o.x+d} ${o.y+60}V${o.y+42}L${o.x+d-11} ${o.y+21}M${o.x+d-3} ${o.y+17}L${o.x+d+3} ${o.y+23}M${o.x+d+3} ${o.y+17}L${o.x+d-3} ${o.y+23}`)).join("") + PD(`M${o.x+4} ${o.y+31}H${o.x+62}`)
      + `<rect x="${o.x+62}" y="${o.y+21}" width="26" height="20" fill="#fff" ${SK}/>` + SVGT(o.x+75, o.y+35, "I> ϑ", "middle", 9, 600) + LB(o.x-4, o.y+35, o.v)},
  k3:{g:"leistung", n:"Schütz 3-polig (Hauptkontakte)", lbl:"-QA1", w:60, h:60, anschluesse:[["1",10,0,"u"],["3",30,0,"u"],["5",50,0,"u"],["2",10,60,"d"],["4",30,60,"d"],["6",50,60,"d"]],
    zeichne:o => [10,30,50].map(d => PP(`M${o.x+d} ${o.y}V${o.y+20}M${o.x+d} ${o.y+60}V${o.y+42}L${o.x+d-11} ${o.y+21}`) + `<path d="M${o.x+d-3.5} ${o.y+20}A3.5 3.5 0 0 0 ${o.x+d+3.5} ${o.y+20}" ${SK}/>`).join("") + PD(`M${o.x+4} ${o.y+31}H${o.x+46}`) + LB(o.x-4, o.y+35, o.v)},
  qs3:{g:"leistung", n:"Hauptschalter 3-polig", lbl:"-QB1", w:60, h:60, anschluesse:[["1",10,0,"u"],["3",30,0,"u"],["5",50,0,"u"],["2",10,60,"d"],["4",30,60,"d"],["6",50,60,"d"]],
    zeichne:o => [10,30,50].map(d => PP(`M${o.x+d} ${o.y}V${o.y+20}M${o.x+d} ${o.y+60}V${o.y+42}L${o.x+d-11} ${o.y+21}M${o.x+d-4} ${o.y+20}H${o.x+d+4}`)).join("") + PD(`M${o.x+4} ${o.y+31}H${o.x+64}`) + PP(`M${o.x+64} ${o.y+25}V${o.y+37}`) + LB(o.x-4, o.y+35, o.v)},
  m3:{g:"leistung", n:"Drehstrommotor", lbl:"-MA1", w:60, h:80, anschluesse:[["U1",10,0,"u"],["V1",30,0,"u"],["W1",50,0,"u"]],
    zeichne:o => PP(`M${o.x+10} ${o.y}V${o.y+43}M${o.x+30} ${o.y}V${o.y+30}M${o.x+50} ${o.y}V${o.y+43}`) + `<circle cx="${o.x+30}" cy="${o.y+52}" r="22" fill="#fff" ${SK}/>` + SVGT(o.x+30, o.y+54, "M", "middle", 15, 600) + SVGT(o.x+30, o.y+68, "3~", "middle", 10, 500)
      + PN(o.x+12, o.y+10, "U1") + PN(o.x+32, o.y+10, "V1") + PN(o.x+52, o.y+10, "W1") + LB(o.x-4, o.y+56, o.v)},
  fu:{g:"leistung", n:"Frequenzumrichter", lbl:"-TA2", w:80, h:90, anschluesse:[["L1",10,0,"u"],["L2",30,0,"u"],["L3",50,0,"u"],["PE",70,0,"u"],["U",10,90,"d"],["V",30,90,"d"],["W",50,90,"d"],["PE2",70,90,"d"]],
    zeichne:o => `<rect x="${o.x}" y="${o.y+15}" width="80" height="60" fill="#fff" ${SK}/>` + PP(`M${o.x} ${o.y+75}L${o.x+80} ${o.y+15}` + [10,30,50,70].map(d => `M${o.x+d} ${o.y}V${o.y+15}M${o.x+d} ${o.y+75}V${o.y+90}`).join(""))
      + SVGT(o.x+18, o.y+36, "~", "middle", 14, 600) + SVGT(o.x+62, o.y+66, "~", "middle", 14, 600) + ["L1","L2","L3","PE"].map((n, i) => PN(o.x+12+i*20, o.y+9, n)).join("") + ["U","V","W","PE"].map((n, i) => PN(o.x+12+i*20, o.y+87, n)).join("") + LB(o.x-4, o.y+48, o.v)},
  rail:{g:"leistung", n:"Potenzialschiene", lbl:"L+", w:400, h:0, ...SCHIENE,
    zeichne:o => `<path d="M${o.x} ${o.y}H${o.x+(o.w||400)}" stroke="${INK}" stroke-width="2.2" ${o.v === "PE" ? 'stroke-dasharray="10 4"' : ""}/>` + LB(o.x-6, o.y+4, o.v)}
});
fuelle(SAMPLE, {rail: [{k: "rail", x: 4, y: 10, v: "", w: 70}, "0 0 78 20", ""]});
