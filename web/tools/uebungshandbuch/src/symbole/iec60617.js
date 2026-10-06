/* Schaltzeichen nach IEC 60617 als Tabelle SYM. Ein Eintrag beschreibt ein Zeichen:
     name   Anzeigename (Legende)
     h      Höhe in Zeichnungseinheiten, die Anschlüsse liegen oben (y) und unten (y + h)
     pole   1 = einpolig auf der Mittellinie x, 3 = dreipolig auf x − 20, x und x + 20
     rolle  haupt (Spule, Gerät mit Kontaktspiegel), kontakt (gehört zu einem Gerät), geraet, klemme
     an     Anschlussnummern oben und unten, wenn der Plan keine angibt
     bu     Gerät braucht eine eigene Leitung zu M (Sensor mit drei Leitern)
     pe     dreipoliges Gerät mit Schutzleiteranschluss auf x + 70
     links  Platz links vom Zeichen für das Kennzeichen (Standard 34)
     zeichne(x, y, g)  liefert SVG, g = {an: [oben, unten], variante, text}
   Die Geometrie der Kontakte, Taster und Spulen ist aus dem Skizzen-Editor übernommen (Kopie, keine Neuerfindung). */
import { GRAU, kasten, kreis, linie, nummer, punkt, text, wirklinie, TINTE } from './grund.js';

/* ---------- Bausteine der Zeichen ---------- */
const schliesser = (x, y) => linie(`M${x} ${y}V${y + 20}M${x} ${y + 60}V${y + 42}L${x - 13} ${y + 19}`);
const oeffner = (x, y) => linie(`M${x} ${y}V${y + 20}H${x + 9}M${x} ${y + 60}V${y + 42}L${x + 12} ${y + 16}`);
const hauptkontakt = (x, y) => linie(`M${x} ${y}V${y + 20}M${x} ${y + 60}V${y + 42}L${x - 11} ${y + 21}`)
  + linie(`M${x - 3.5} ${y + 20}A3.5 3.5 0 0 0 ${x + 3.5} ${y + 20}`);
const schutzpol = (x, y) => linie(`M${x} ${y}V${y + 20}M${x} ${y + 60}V${y + 42}L${x - 11} ${y + 21}`)
  + linie(`M${x - 3} ${y + 17}L${x + 3} ${y + 23}M${x + 3} ${y + 17}L${x - 3} ${y + 23}`);
const zuleitung = (x, y, h, oben, unten) => linie(`M${x} ${y}V${y + oben}M${x} ${y + h - unten}V${y + h}`);
const nummern = (x, y, h, g) => nummer(x + 5, y + 11, g.an[0]) + nummer(x + 5, y + h - 3, g.an[1]);

// Betätigungen links vom Kontakt; bx = Ende der Wirklinie, my = Höhe der Wirklinie
const BETAETIGUNG = {
  druck: (bx, my) => linie(`M${bx} ${my - 7}V${my + 7}M${bx} ${my - 7}H${bx - 4}M${bx} ${my + 7}H${bx - 4}`),
  dreh: (bx, my) => linie(`M${bx} ${my - 7}V${my + 7}M${bx} ${my - 7}H${bx - 4}M${bx} ${my + 7}H${bx + 4}`),
  pilz: (bx, my) => `<path d="M${bx} ${my - 9}A9 9 0 0 0 ${bx} ${my + 9}Z" fill="#C0392B" fill-opacity=".85" stroke="${TINTE}" stroke-width="1.3"/>`,
  schluessel: (bx, my) => kreis(bx - 5, my, 4.5, "none") + linie(`M${bx - 9.5} ${my}H${bx - 16}M${bx - 13} ${my}V${my + 4}`),
  temperatur: (bx, my) => kasten(bx - 14, my - 7, 14, 14) + text(bx - 7, my + 4, "ϑ", {a: "middle", g: 10, w: 600}),
  schwimmer: (bx, my) => linie(`M${bx} ${my}H${bx - 4}`) + kreis(bx - 9, my, 5, "none"),
  motorschutz: (bx, my) => kasten(bx - 18, my - 7, 18, 14) + text(bx - 9, my + 3.5, "I>", {a: "middle", g: 8, w: 600}),
  leuchte: (bx, my) => linie(`M${bx} ${my - 7}V${my + 7}M${bx} ${my - 7}H${bx - 4}M${bx} ${my + 7}H${bx - 4}`)
    + kreis(bx - 11, my, 5, "none") + linie(`M${bx - 14.5} ${my - 3.5}L${bx - 7.5} ${my + 3.5}M${bx - 7.5} ${my - 3.5}L${bx - 14.5} ${my + 3.5}`),
};

function kontakt(art, betaetigung){   // Schließer oder Öffner mit Betätigung
  return (x, y, g) => {
    const istNO = art === "no", my = istNO ? y + 31 : y + 29, start = istNO ? x - 7 : x + 5;
    const kontaktbild = istNO ? schliesser(x, y) : oeffner(x, y);
    const betaetigt = betaetigung ? wirklinie(`M${start} ${my}H${x - 24}`) + BETAETIGUNG[betaetigung](x - 24, my) : "";
    return kontaktbild + betaetigt + nummern(x, y, 60, g);
  };
}

function sensorKasten(x, y, inhalt, unten = "BK"){   // Gerät mit drei Leitern: BN oben, BK unten, BU links zu M
  return zuleitung(x, y, 60, 15, 15) + kasten(x - 15, y + 15, 30, 30) + inhalt
    + linie(`M${x - 15} ${y + 40}H${x - 24}`) + nummer(x + 5, y + 11, "BN") + nummer(x + 5, y + 57, unten)
    + nummer(x - 23, y + 37, "BU", "start");
}

// Lichtvorhang: Strahlen zwischen Sender und Empfänger
const strahlen = (x, y) => linie(`M${x - 9} ${y + 24}H${x + 9}M${x - 9} ${y + 30}H${x + 9}M${x - 9} ${y + 36}H${x + 9}`, 1)
  + linie(`M${x + 5} ${y + 21}l4 3l-4 3M${x + 5} ${y + 33}l4 3l-4 3`, 1);

const SENSORART = {mag: "Magnet", ind: "induktiv", opt: "optisch", us: "Ultraschall"};
const raute = (x, y) => linie(`M${x} ${y + 22}L${x + 8} ${y + 30}L${x} ${y + 38}L${x - 8} ${y + 30}Z`);

function geraetKasten(x, y, g, breite = 40){   // Gerät als beschrifteter Kasten
  const t = g.text || g.variante || "";
  return zuleitung(x, y, 60, 15, 15) + kasten(x - breite / 2, y + 15, breite, 30)
    + text(x, y + 34, t, {a: "middle", g: t.length > 7 ? 7 : 8.5, w: 600}) + nummern(x, y, 60, g);
}

/* ---------- Dreipolige Zeichen: Pole auf x − 20, x, x + 20 ---------- */
const POLE = [-20, 0, 20];
const allePole = (x, f) => POLE.map(d => f(x + d)).join("");
const PE_X = 70;   // Schutzleiter rechts neben den Polen

function polNummern(x, y, h, oben, unten){
  return POLE.map((d, i) => nummer(x + d + 4, y + 9, oben[i]) + nummer(x + d + 4, y + h - 3, unten[i])).join("");
}

function wende(x, y){   // Wendeschaltung: Schütz a direkt, Schütz b links daneben mit getauschten Phasen L1 und L3
  const b = [x - 110, x - 90, x - 70];
  const verteilen = linie(`M${x - 20} ${y}V${y + 20}M${x} ${y}V${y + 20}M${x + 20} ${y}V${y + 20}`)
    + linie(`M${x - 20} ${y + 4}H${b[0]}V${y + 20}M${x} ${y + 10}H${b[1]}V${y + 20}M${x + 20} ${y + 16}H${b[2]}V${y + 20}`)
    + punkt(x - 20, y + 4) + punkt(x, y + 10) + punkt(x + 20, y + 16);
  const kontakte = allePole(x, p => hauptkontakt(p, y + 20)) + b.map(p => hauptkontakt(p, y + 20)).join("")
    + wirklinie(`M${x - 31} ${y + 51}H${x + 20}`) + wirklinie(`M${b[0] - 11} ${y + 51}H${b[2]}`);
  const tauschen = linie(`M${b[0]} ${y + 80}V${y + 96}H${x + 20}M${b[1]} ${y + 80}V${y + 90}H${x}M${b[2]} ${y + 80}V${y + 84}H${x - 20}`)
    + linie(`M${x - 20} ${y + 80}V${y + 100}M${x} ${y + 80}V${y + 100}M${x + 20} ${y + 80}V${y + 100}`)
    + punkt(x + 20, y + 96) + punkt(x, y + 90) + punkt(x - 20, y + 84);
  const verriegelung = wirklinie(`M${b[2] + 4} ${y + 58}H${x - 30}`)
    + linie(`M${b[2] + 10} ${y + 54}l4 8l4 -8zM${x - 44} ${y + 54}l4 8l4 -8z`, 1);
  return verteilen + kontakte + tauschen + verriegelung
    + POLE.map((d, i) => nummer(x + d + 4, y + 31, ["1", "3", "5"][i])).join("")
    + b.map((p, i) => nummer(p + 4, y + 31, ["1", "3", "5"][i])).join("");
}

function motor3(x, y){
  const r = 26, cy = y + 52;
  return linie(`M${x - 20} ${y}V${cy - 17}M${x} ${y}V${cy - r}M${x + 20} ${y}V${cy - 17}`) + kreis(x, cy, r)
    + text(x, cy + 3, "M", {a: "middle", g: 15, w: 600}) + text(x, cy + 16, "3~", {a: "middle", g: 9})
    + linie(`M${x + PE_X} ${y}V${cy}H${x + r}`) + polNummern(x, y, 0, ["U1", "V1", "W1"], [])
    + nummer(x + PE_X - 16, cy - 4, "PE");
}

function umrichter(x, y, g){
  return allePole(x, p => linie(`M${p} ${y}V${y + 10}M${p} ${y + 80}V${y + 90}`)) + kasten(x - 50, y + 10, 100, 70)
    + linie(`M${x - 50} ${y + 80}L${x + 50} ${y + 10}`) + text(x - 30, y + 32, "~", {a: "middle", g: 15, w: 600})
    + text(x + 30, y + 72, "~", {a: "middle", g: 15, w: 600}) + text(x + 14, y + 50, g.text || "G120", {a: "middle", g: 8, f: GRAU})
    + linie(`M${x + PE_X} ${y + 45}H${x + 50}`) + punkt(x + PE_X, y + 45)
    + polNummern(x, y, 90, ["L1", "L2", "L3"], ["U2", "V2", "W2"]);
}

function klemme3(x, y, g){
  const nr = g.an || [];
  return allePole(x, p => linie(`M${p} ${y}V${y + 8}M${p} ${y + 16}V${y + 24}`) + kreis(p, y + 12, 4))
    + kreis(x + PE_X, y + 12, 4) + POLE.map((d, i) => nummer(x + d - 4, y + 22, nr[i], "end")).join("")
    + nummer(x + PE_X - 6, y + 22, nr[3], "end");
}

function heizung3(x, y){
  return allePole(x, p => linie(`M${p} ${y}V${y + 12}`) + kasten(p - 5, y + 12, 10, 30) + linie(`M${p} ${y + 42}V${y + 52}`))
    + linie(`M${x - 20} ${y + 52}H${x + 20}`) + punkt(x, y + 52) + text(x + 34, y + 30, "3,5 kW", {g: 8, f: GRAU});
}

function halbleiter3(x, y){
  return allePole(x, p => linie(`M${p} ${y}V${y + 10}M${p} ${y + 50}V${y + 60}`)) + kasten(x - 32, y + 10, 64, 40)
    + linie(`M${x - 8} ${y + 22}L${x + 8} ${y + 30}L${x - 8} ${y + 38}ZM${x + 8} ${y + 22}V${y + 38}`, 1.2)
    + text(x + 22, y + 34, "SSR", {a: "middle", g: 7, f: GRAU});
}

/* ---------- Tabelle der Zeichen ---------- */
export const SYM = {
  no: {name: "Schließer (Hilfskontakt)", h: 60, pole: 1, rolle: "kontakt", an: ["13", "14"], zeichne: kontakt("no")},
  nc: {name: "Öffner (Hilfskontakt)", h: 60, pole: 1, rolle: "kontakt", an: ["21", "22"], zeichne: kontakt("nc")},
  tno: {name: "Taster Schließer", h: 60, pole: 1, rolle: "geraet", an: ["13", "14"], zeichne: kontakt("no", "druck")},
  tnc: {name: "Taster Öffner", h: 60, pole: 1, rolle: "geraet", an: ["21", "22"], zeichne: kontakt("nc", "druck")},
  tnol: {name: "Leuchttaster", h: 60, pole: 1, rolle: "geraet", links: 48, an: ["13", "14"], zeichne: kontakt("no", "leuchte")},
  nh: {name: "Not-Halt-Taster", h: 60, pole: 1, rolle: "geraet", links: 40, an: ["11", "12"], zeichne: kontakt("nc", "pilz")},
  key: {name: "Schlüsselschalter", h: 60, pole: 1, rolle: "geraet", links: 44, an: ["13", "14"], zeichne: kontakt("no", "schluessel")},
  sw: {name: "Wahlschalter", h: 60, pole: 1, rolle: "geraet", an: ["13", "14"], zeichne: kontakt("no", "dreh")},
  hk: {name: "Hilfskontakt Motorschutz", h: 60, pole: 1, rolle: "kontakt", links: 48, an: ["13", "14"], zeichne: kontakt("no", "motorschutz")},
  temp: {name: "Temperaturschalter", h: 60, pole: 1, rolle: "geraet", links: 44, an: ["13", "14"], zeichne: kontakt("no", "temperatur")},
  niveau: {name: "Füllstandsschalter", h: 60, pole: 1, rolle: "geraet", links: 44, an: ["13", "14"], zeichne: kontakt("no", "schwimmer")},
  sens: {name: "Näherungsschalter PNP", h: 60, pole: 1, rolle: "geraet", bu: true, zeichne: (x, y, g) => sensorKasten(x, y, raute(x, y))
    + text(x + 18, y + 44, SENSORART[g.variante] || "", {g: 7, f: GRAU})},
  geber: {name: "Drehgeber", h: 60, pole: 1, rolle: "geraet", bu: true, zeichne: (x, y, g) =>
    sensorKasten(x, y, text(x, y + 35, "G", {a: "middle", g: 13, w: 600}), g.variante)},
  lvh: {name: "Lichtvorhang", h: 60, pole: 1, rolle: "geraet", bu: true, zeichne: (x, y, g) => sensorKasten(x, y, strahlen(x, y), g.an[1] || "OSSD")},
  geraet: {name: "Gerät", h: 60, pole: 1, rolle: "geraet", zeichne: (x, y, g) => geraetKasten(x, y, g)},
  spule: {name: "Spule (Schütz, Relais)", h: 60, pole: 1, rolle: "haupt", an: ["A1", "A2"], zeichne: (x, y, g) =>
    zuleitung(x, y, 60, 18, 18) + kasten(x - 15, y + 18, 30, 24) + nummern(x, y, 60, g)},
  mbv: {name: "Ventilspule", h: 60, pole: 1, rolle: "haupt", an: ["A1", "A2"], zeichne: (x, y, g) =>
    zuleitung(x, y, 60, 18, 18) + kasten(x - 15, y + 18, 30, 24) + linie(`M${x - 15} ${y + 42}L${x + 15} ${y + 18}`) + nummern(x, y, 60, g)},
  ssr: {name: "Halbleiterrelais, Steuerkreis", h: 60, pole: 1, rolle: "haupt", an: ["A1+", "A2−"], zeichne: (x, y, g) =>
    zuleitung(x, y, 60, 18, 18) + kasten(x - 15, y + 18, 30, 24) + linie(`M${x - 6} ${y + 24}L${x + 2} ${y + 32}M${x - 1} ${y + 32}H${x + 2}V${y + 29}`
    + `M${x - 2} ${y + 26}L${x + 6} ${y + 34}M${x + 3} ${y + 34}H${x + 6}V${y + 31}`, 1) + nummern(x, y, 60, g)},
  sirelais: {name: "Sicherheitsrelais", h: 60, pole: 1, rolle: "haupt", an: ["A1", "A2"], zeichne: (x, y, g) =>
    zuleitung(x, y, 60, 12, 12) + kasten(x - 27, y + 12, 54, 36) + text(x, y + 28, "Sicherheit", {a: "middle", g: 7.5, w: 600})
    + text(x, y + 40, g.text || "", {a: "middle", g: 7.5, f: GRAU}) + nummern(x, y, 60, g)},
  lamp: {name: "Leuchtmelder", h: 60, pole: 1, rolle: "geraet", an: ["X1", "X2"], zeichne: (x, y, g) =>
    zuleitung(x, y, 60, 18, 18) + kreis(x, y + 30, 12)
    + linie(`M${x - 8.5} ${y + 21.5}L${x + 8.5} ${y + 38.5}M${x + 8.5} ${y + 21.5}L${x - 8.5} ${y + 38.5}`) + nummern(x, y, 60, g)},
  mu: {name: "Messumformer", h: 60, pole: 1, rolle: "geraet", an: ["+", "−"], zeichne: (x, y, g) =>
    zuleitung(x, y, 60, 16, 16) + kasten(x - 17, y + 16, 34, 28) + text(x - 6, y + 35, g.variante || "", {a: "middle", g: 12, w: 600})
    + linie(`M${x + 2} ${y + 30}H${x + 12}`) + linie(`M${x + 9} ${y + 27}L${x + 12} ${y + 30}L${x + 9} ${y + 33}`, 1) + nummern(x, y, 60, g)},
  poti: {name: "Potentiometer", h: 60, pole: 1, rolle: "geraet", an: ["1", "2"], zeichne: (x, y, g) =>
    zuleitung(x, y, 60, 15, 15) + kasten(x - 5, y + 15, 10, 30) + linie(`M${x + 16} ${y + 20}L${x + 6} ${y + 30}`)
    + linie(`M${x + 6} ${y + 30}l6 -1.5M${x + 6} ${y + 30}l1.5 -6`, 1.2) + nummern(x, y, 60, g)},
  stell: {name: "Stellantrieb Regelventil", h: 60, pole: 1, rolle: "haupt", an: ["Y", "M"], zeichne: (x, y, g) =>
    zuleitung(x, y, 60, 14, 14) + kasten(x - 17, y + 14, 34, 32) + linie(`M${x - 10} ${y + 22}L${x + 10} ${y + 38}V${y + 22}L${x - 10} ${y + 38}Z`, 1.2)
    + nummern(x, y, 60, g)},
  klemme: {name: "Klemme", h: 24, pole: 1, rolle: "klemme", zeichne: (x, y) => zuleitung(x, y, 24, 8, 8) + kreis(x, y + 12, 4)},
  port: {name: "Steckverbinder M12", h: 24, pole: 1, rolle: "klemme", zeichne: (x, y, g) =>
    linie(`M${x} ${y}V${y + 13}M${x - 6} ${y + 9}A6 6 0 0 0 ${x + 6} ${y + 9}M${x} ${y + 15}V${y + 24}`) + nummer(x + 8, y + 18, g.an[0])},
  ls1: {name: "Leitungsschutzschalter", h: 60, pole: 1, rolle: "geraet", an: ["1", "2"], zeichne: (x, y, g) => schutzpol(x, y) + nummern(x, y, 60, g)},
  sicherung: {name: "Sicherung", h: 60, pole: 1, rolle: "geraet", an: ["1", "2"], zeichne: (x, y, g) =>
    linie(`M${x} ${y}V${y + 60}`) + kasten(x - 5, y + 16, 10, 28, "none") + nummern(x, y, 60, g)},
  k1: {name: "Hauptkontakt Schütz", h: 60, pole: 1, rolle: "kontakt", an: ["1", "2"], zeichne: (x, y, g) => hauptkontakt(x, y) + nummern(x, y, 60, g)},
  netzteil: {name: "Netzteil 24 V DC", h: 60, pole: 1, rolle: "haupt", an: ["L", "N"], zeichne: (x, y, g) =>
    zuleitung(x, y, 60, 10, 10) + kasten(x - 22, y + 10, 44, 40) + linie(`M${x - 22} ${y + 50}L${x + 22} ${y + 10}`)
    + text(x - 11, y + 27, "~", {a: "middle", g: 12, w: 600}) + text(x + 11, y + 46, "=", {a: "middle", g: 12, w: 600})
    + linie(`M${x + 22} ${y + 22}H${x + 34}M${x + 22} ${y + 38}H${x + 34}`) + nummer(x + 36, y + 25, "+ L+") + nummer(x + 36, y + 41, "− M")
    + nummern(x, y, 60, g)},
  dose: {name: "Steckdose", h: 60, pole: 1, rolle: "geraet", zeichne: (x, y) =>
    linie(`M${x} ${y}V${y + 22}M${x - 12} ${y + 34}A12 12 0 0 1 ${x + 12} ${y + 34}M${x - 12} ${y + 34}H${x + 12}M${x} ${y + 34}V${y + 60}`)},
  leuchte: {name: "Leuchte", h: 60, pole: 1, rolle: "geraet", an: ["X1", "X2"], zeichne: (x, y, g) => SYM.lamp.zeichne(x, y, g)},
  motor1: {name: "Motor einphasig", h: 60, pole: 1, rolle: "geraet", zeichne: (x, y) =>
    zuleitung(x, y, 60, 16, 16) + kreis(x, y + 30, 14) + text(x, y + 30, "M", {a: "middle", g: 10, w: 600})
    + text(x, y + 39, "1~", {a: "middle", g: 7})},
  /* dreipolig */
  qs3: {name: "Lasttrennschalter", h: 60, pole: 3, rolle: "geraet", zeichne: (x, y) =>
    allePole(x, p => linie(`M${p} ${y}V${y + 20}M${p} ${y + 60}V${y + 42}L${p - 11} ${y + 21}M${p - 4} ${y + 20}H${p + 4}`))
    + wirklinie(`M${x - 26} ${y + 31}H${x + 40}`) + linie(`M${x + 40} ${y + 25}V${y + 37}`) + polNummern(x, y, 60, ["1", "3", "5"], ["2", "4", "6"])},
  ls3: {name: "Leitungsschutzschalter 3-polig", h: 60, pole: 3, rolle: "geraet", zeichne: (x, y) =>
    allePole(x, p => schutzpol(p, y)) + wirklinie(`M${x - 26} ${y + 31}H${x + 16}`) + polNummern(x, y, 60, ["1", "3", "5"], ["2", "4", "6"])},
  ms3: {name: "Motorschutzschalter", h: 60, pole: 3, rolle: "haupt", zeichne: (x, y) =>
    allePole(x, p => schutzpol(p, y)) + wirklinie(`M${x - 26} ${y + 31}H${x + 30}`) + kasten(x + 30, y + 22, 28, 18)
    + text(x + 44, y + 34.5, "I> ϑ", {a: "middle", g: 8, w: 600}) + polNummern(x, y, 60, ["1", "3", "5"], ["2", "4", "6"])},
  schuetz3: {name: "Schütz, Hauptkontakte", h: 60, pole: 3, rolle: "kontakt", zeichne: (x, y) =>
    allePole(x, p => hauptkontakt(p, y)) + wirklinie(`M${x - 31} ${y + 31}H${x + 20}`) + polNummern(x, y, 60, ["1", "3", "5"], ["2", "4", "6"])},
  wende: {name: "Wendeschaltung", h: 100, pole: 3, rolle: "kontakt", zeichne: wende},
  hlr3: {name: "Halbleiterrelais, Lastkreis", h: 60, pole: 3, rolle: "kontakt", zeichne: halbleiter3},
  umrichter: {name: "Frequenzumrichter", h: 90, pole: 3, rolle: "haupt", pe: true, zeichne: umrichter},
  klemme3: {name: "Klemmen 3-polig mit PE", h: 24, pole: 3, rolle: "klemme", pe: true, zeichne: klemme3},
  motor3: {name: "Drehstrommotor", h: 80, pole: 3, rolle: "geraet", pe: true, zeichne: motor3},
  heizung3: {name: "Heizwiderstand 3~", h: 60, pole: 3, rolle: "geraet", zeichne: heizung3},
};

SYM.coil = {...SYM.spule, name: "Schützspule"};   // Kurzname in der Kanalliste

// Zeichen und Variante aus dem Datenwert "sens:mag" bzw. "geraet:OUT0"
export function zeichen(wert){
  const [schluessel, variante = ""] = String(wert).split(":");
  return {sym: SYM[schluessel], schluessel, variante};
}
