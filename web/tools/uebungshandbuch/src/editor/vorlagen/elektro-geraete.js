// Gruppe Geräte und SPS des Stromlaufplans: SPS-Baugruppen DI 8 und DQ 8, Netzteil, Sicherheitsrelais.
// Geräte werden Anschluss für Anschluss verdrahtet (Werkzeug Verbinden). Lage: o.x, o.y ist die linke obere Ecke.
import { kasten, linie, nummer, text } from '../../symbole/grund.js';
import { registriereBauteile, registriereGruppe } from '../registry.js';
import { LB } from '../bauteile.js';
import { kennzeichen } from './elektro-kennzeichen.js';

registriereGruppe("geraete", {
  name: "Geräte und SPS",
  hinweis: "Geräte setzen und mit Verbinden verdrahten, z. B. den Sensorausgang BK auf einen Eingang der DI-Baugruppe.",
  kennzeichen,
});

// Anschlussstummel nach oben (dy 0) oder unten (dy = Höhe) mit Nummer innen am Kasten
const stummel = (o, dx, dy, n, h) => dy
  ? linie(`M${o.x + dx} ${o.y + h - 10}V${o.y + h}`) + nummer(o.x + dx, o.y + h - 14, n, "middle")
  : linie(`M${o.x + dx} ${o.y}V${o.y + 10}`) + nummer(o.x + dx, o.y + 20, n, "middle");
// Versorgung L+ und M links an einer SPS-Baugruppe
const versorgung = o => linie(`M${o.x} ${o.y + 25}H${o.x + 10}M${o.x} ${o.y + 45}H${o.x + 10}`)
  + nummer(o.x + 1, o.y + 21, "L+") + nummer(o.x + 1, o.y + 41, "M");
const SPS_VERSORGUNG = [["L+", 0, 25, "l"], ["M", 0, 45, "l"]];
const ACHT = Array.from({length: 8}, (_, i) => i);

// SPS-Baugruppe mit 8 Kanälen: art "DI" (Eingänge oben, %I) oder "DQ" (Ausgänge unten, %Q)
function spsBaugruppe(kanal, n, oben){
  const dy = oben ? 0 : 70, adresse = oben ? "%I" : "%Q";
  return {g: "geraete", n, lbl: "−KF1", kennbuchstaben: ["KF"], w: 200, h: 70, def: {b: "0"},
    feldliste: [["b", `Byte-Adresse (${adresse}…)`]],
    anschluesse: [...ACHT.map(i => [kanal + i, 40 + i * 20, dy, oben ? "u" : "d"]), ...SPS_VERSORGUNG],
    zeichne: o => kasten(o.x + 10, o.y + 10, 180, 50) + versorgung(o)
      + ACHT.map(i => stummel(o, 40 + i * 20, dy, "." + i, 70)).join("")
      + nummer(o.x + 14, o.y + (oben ? 22 : 55), `${adresse}${o.b ?? 0}`)
      + text(o.x + 18, o.y + (oben ? 52 : 26), `${o.v || ""}  ${kanal} 8 × 24 V DC`, {g: 10.5, w: 600})};
}
// Netzteil: L, N, PE oben, + und − unten
const NETZTEIL = [["L", 30, 0, "u"], ["N", 50, 0, "u"], ["PE", 70, 0, "u"], ["+", 40, 70, "d"], ["−", 60, 70, "d"]];
const netzteil = o => kasten(o.x + 10, o.y + 10, 80, 50) + linie(`M${o.x + 10} ${o.y + 60}L${o.x + 90} ${o.y + 10}`)
  + NETZTEIL.map(([n, dx, dy]) => linie(`M${o.x + dx} ${o.y + (dy ? 60 : 0)}V${o.y + (dy ? 70 : 10)}`)
    + nummer(o.x + dx + 3, o.y + (dy ? 68 : 8), n)).join("")
  + text(o.x + 28, o.y + 32, "~", {a: "middle", g: 14, w: 600}) + text(o.x + 72, o.y + 52, "=", {a: "middle", g: 14, w: 600})
  + LB(o.x + 6, o.y + 40, o.v);
// Sicherheitsrelais: Versorgung, zwei Kanäle S11/S12 und S21/S22, Start S34, Freigabekontakte 13/14 und 23/24
const SICHERHEITSRELAIS = [["A1", 30, 0, "u"], ["S11", 60, 0, "u"], ["S12", 80, 0, "u"], ["S21", 110, 0, "u"],
  ["S22", 130, 0, "u"], ["S34", 160, 0, "u"], ["13", 180, 0, "u"], ["23", 200, 0, "u"], ["A2", 30, 80, "d"],
  ["14", 180, 80, "d"], ["24", 200, 80, "d"]];
const sicherheitsrelais = o => kasten(o.x + 10, o.y + 10, 200, 60)
  + text(o.x + 110, o.y + 44, "Sicherheitsrelais", {a: "middle", g: 11, w: 600}) + LB(o.x + 6, o.y + 44, o.v)
  + SICHERHEITSRELAIS.map(([n, dx, dy]) => stummel(o, dx, dy, n, 80)).join("");

registriereBauteile({
  di8: spsBaugruppe("DI", "SPS-Eingänge DI 8", true),
  dq8: spsBaugruppe("DQ", "SPS-Ausgänge DQ 8", false),
  ps: {g: "geraete", n: "Netzteil 24 V DC", lbl: "−TA1", w: 100, h: 70, anschluesse: NETZTEIL, zeichne: netzteil},
  sr: {g: "geraete", n: "Sicherheitsrelais", lbl: "−KF2", kennbuchstaben: ["KF"], w: 220, h: 80,
    anschluesse: SICHERHEITSRELAIS, zeichne: sicherheitsrelais},
});
