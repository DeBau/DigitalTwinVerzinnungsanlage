/* Übersichtsseiten des Schaltplans: Deckblatt, Hinweise mit Legende, SPS-Aufbau, PROFINET, Feldverteiler, Ventilinseln.
   Jede Seite ist eine kleine Funktion in der Tabelle BLOECKE. */
import { BLAU, GRAU, SCHMAL, TINTE, absatz, kasten, linie, text, umbrechen } from '../symbole/grund.js';
import { SYM } from '../symbole/iec60617.js';
import { X0, X1, spalteVon, ueberschrift } from './blatt.js';
import { annahme, verweis } from './elemente.js';
import { fundstellen, hauptort, merke, merkeSignal, verweisText } from './querverweise.js';

// Verweis auf die wichtigste Fundstelle eines Kennzeichens, leer, wenn sie auf dieser Seite liegt
function zielVon(ctx, bmk){
  const ziel = hauptort(ctx.lesen, bmk) || fundstellen(ctx.lesen, bmk)[0];
  return ziel && ziel.seite !== ctx.seite.nr ? verweisText(ziel) : "";
}
const kennzeichen = (bmk, x, y, opt = {}) => `<g class="sp-bmk" data-bmk="${bmk}">`
  + text(x, y, bmk, {g: 10, w: 600, schrift: SCHMAL, ...opt}) + "</g>";
const kuerzen = (t, n) => t.length > n ? t.slice(0, n - 1) + "…" : t;
const merkeHier = (ctx, bmk, x, rolle) => merke(ctx.schreiben, bmk, {seite: ctx.seite.nr, spalte: spalteVon(x), rolle});

/* ---------- Deckblatt ---------- */
function kennzahl(x, y, zahl, wort){
  return kasten(x, y, 150, 74, "#F4F7FA") + text(x + 75, y + 40, String(zahl), {a: "middle", g: 28, w: 600, schrift: SCHMAL, f: BLAU})
    + text(x + 75, y + 60, wort, {a: "middle", g: 9, f: GRAU});
}

function zeichenReihe(y){   // Schmuckleiste aus echten Schaltzeichen
  const reihe = ["nh", "tno", "sens", "spule", "lamp", "mbv", "sicherung", "ls1"];
  return reihe.map((k, i) => SYM[k].zeichne(130 + i * 120, y, {an: SYM[k].an || [], variante: "ind"})).join("");
}

function deckblatt(ctx){
  const m = ctx.modell, meta = m.plan.meta;
  const zahlen = [[ctx.seiten.length, "Seiten"], [m.geraete.size, "Betriebsmittel"], [m.kanaele.filter(k => k.typ === "DI").length, "Digitaleingänge"],
    [m.kanaele.filter(k => k.typ === "DQ").length, "Digitalausgänge"], [m.kanaele.filter(k => k.typ[0] === "A").length, "Analogwerte"],
    [m.profinet.length, "PROFINET-Worte"]];
  let s = linie(`M${X0} 250H${X1}`, .8) + text(110, 150, "Schaltplan der Anlage", {g: 54, w: 600, schrift: SCHMAL});
  s += text(112, 192, meta.anlage, {g: 20, f: GRAU}) + text(112, 222, meta.norm, {g: 10, f: GRAU});
  zahlen.forEach(([z, w], i) => { s += kennzahl(110 + i * 165, 300, z, w); });
  s += zeichenReihe(440) + linie(`M${X0} 560H${X1}`, .8);
  const orte = Object.entries(m.plan.orte);
  s += text(110, 595, "Ortskennzeichen", {g: 12, w: 600, schrift: SCHMAL});
  orte.forEach(([k, t], i) => {
    const x = 110 + Math.floor(i / 5) * 270, y = 620 + (i % 5) * 26;
    s += text(x, y, k, {g: 10, w: 600, schrift: SCHMAL}) + text(x + 46, y, t, {g: 9.5});
  });
  return s;
}

/* ---------- Hinweise und Legende ---------- */
const LEGENDE = ["tno", "tnc", "nh", "key", "sw", "tnol", "no", "nc", "hk", "temp", "niveau", "sens", "geber", "lvh", "spule",
  "mbv", "ssr", "sirelais", "lamp", "mu", "poti", "stell", "klemme", "port", "sicherung", "ls1", "k1", "netzteil", "dose", "motor1"];

const BEISPIEL = {sens: "ind", geber: "A", mu: "ϑ"};   // Variante, mit der ein Zeichen in der Legende erscheint

function legende(){
  let s = text(640, 60, "Legende der Schaltzeichen (IEC 60617)", {g: 14, w: 600, schrift: SCHMAL});
  LEGENDE.forEach((k, i) => {
    const sym = SYM[k], x = 680 + (i % 5) * 100, y = 82 + Math.floor(i / 5) * 106;
    s += sym.zeichne(x, y, {an: sym.an || [], variante: BEISPIEL[k] || ""});
    s += absatz(x, y + 76, umbrechen(sym.name, 92, 7.5), {a: "middle", g: 7.5, f: GRAU});
  });
  return s;
}

function hinweise(ctx){
  let s = text(X0 + 20, 60, "Hinweise", {g: 20, w: 600, schrift: SCHMAL}), y = 92;
  for (const [titel, inhalt] of ctx.modell.plan.hinweise) {
    const zeilen = umbrechen(inhalt, 540, 9.5);
    s += text(X0 + 20, y, titel, {g: 11, w: 600, schrift: SCHMAL}) + absatz(X0 + 20, y + 16, zeilen, {g: 9.5});
    y += 30 + zeilen.length * 12;
  }
  s += text(X0 + 20, y + 6, "Querverweis", {g: 9, w: 600}) + verweis(X0 + 110, y + 6, "/21.3", "start")
    + text(X0 + 150, y + 6, "Seite 21, Spalte 3", {g: 9, f: GRAU});
  s += annahme(X0 + 20, y + 24, "start") + text(X0 + 110, y + 24, "Angabe ergänzt, nicht aus der Anlage", {g: 9, f: GRAU});
  return s + legende();
}

/* ---------- SPS-Übersicht ---------- */
function baugruppe(ctx, [platz, name, bestell, start], i){
  const x = 80 + i * 118, y = 130, seiten = kanalSeiten(ctx, platz);
  let s = kasten(x, y, 104, 300, platz === 1 ? "#EEF3F9" : "#fff") + text(x + 52, y - 10, `Steckplatz ${platz}`, {a: "middle", g: 9, f: GRAU});
  s += absatz(x + 8, y + 24, umbrechen(name, 90, 10), {g: 10, w: 600, schrift: SCHMAL}) + text(x + 8, y + 270, bestell, {g: 7, f: GRAU});
  if (start && start !== "PROFINET") s += text(x + 8, y + 90, `ab %${start}`, {g: 9, f: TINTE});
  seiten.forEach((nr, j) => { s += verweis(x + 8, y + 120 + j * 14, `/${nr}.0`, "start"); });
  return s;
}

// Seiten mit den Kanälen einer Baugruppe
const kanalSeiten = (ctx, platz) => ctx.seiten.filter(s => s.modul && s.modul.baugruppe.platz === platz).map(s => s.nr);

function sps(ctx){
  merkeHier(ctx, "−KF1", 200, "haupt");
  merkeHier(ctx, "−KF1.0", 120, "haupt");
  let s = ueberschrift("SPS-Übersicht −KF1", "S7-1500, Baugruppenträger mit Systemstromversorgung, CPU und E/A-Baugruppen");
  s += ctx.modell.plan.sps.map((b, i) => baugruppe(ctx, b, i)).join("");
  s += kennzeichen("−KF1", 80, 470) + text(130, 470, "CPU 1516-3 PN/DP, PROFINET an X1", {g: 10});
  s += verweis(390, 470, zielVon(ctx, "−TA2"), "start") + text(80, 492, "Freie Kanäle (Reserve): " + ctx.modell.plan.kanaele.reserve.join(", "), {g: 9, f: GRAU});
  return s + annahme(80, 510, "start") + text(150, 510, "Frontstecker-Pins nach Formel, am Gerätehandbuch prüfen", {g: 8, f: GRAU});
}

/* ---------- PROFINET ---------- */
function teilnehmer(ctx, bmk, x, y, ip){
  if (bmk !== "−KF1") merkeHier(ctx, bmk, x, bmk === "−PF10" ? "haupt" : "geraet");
  return kasten(x, y, 130, 54, "#F4F7FA") + kennzeichen(bmk, x + 10, y + 20) + text(x + 10, y + 36, ip, {g: 8.5, f: GRAU})
    + verweis(x + 120, y + 20, zielVon(ctx, bmk), "end");
}

function profinet(ctx){
  const kette = ctx.modell.plan.profinet;
  let s = ueberschrift("PROFINET", "Linie von der CPU über die Umrichter, Bediengerät an Port 2");
  const reihe = ["−KF1", "−TA2", "−TA3", "−TA4", "−TA5"];
  reihe.forEach((bmk, i) => { s += teilnehmer(ctx, bmk, 70 + i * 200, 120, kette.find(e => e[0] === bmk)[3]); });
  s += linie(`M200 147H${70 + 4 * 200}`) + teilnehmer(ctx, "−PF10", 70, 220, "192.168.0.10") + linie("M135 174V220");
  s += text(70, 320, "Telegramm 1 der Umrichter (Standardtelegramm)", {g: 12, w: 600, schrift: SCHMAL});
  ctx.modell.profinet.forEach((k, i) => {
    const x = 70 + Math.floor(i / 8) * 540, y = 344 + (i % 8) * 22;
    merkeSignal(ctx.schreiben, k.signal, {seite: ctx.seite.nr, spalte: spalteVon(x)});
    s += text(x, y, `%${k.adr}`, {g: 9.5, w: 600, schrift: SCHMAL}) + text(x + 70, y, k.signal, {g: 9, k: "sig", attr: `data-tag="${k.signal.split("_")[0]}"`})
      + text(x + 200, y, kuerzen(k.info ? k.info.k : "", 72), {g: 8, f: GRAU});
  });
  return s + annahme(70, 540, "start") + text(140, 540, "IP-Adressen", {g: 8, f: GRAU});
}

/* ---------- Feldverteiler und Ventilinseln ---------- */
function verteiler(ctx, bmk, ports, x, y){
  merkeHier(ctx, bmk, x, "haupt");
  let s = kasten(x, y, 500, 40 + ports.length * 20, "#fff") + kennzeichen(bmk, x + 12, y + 22);
  const geraet = ctx.modell.geraete.get(bmk);
  s += text(x + 70, y + 22, geraet ? geraet.text : "", {g: 9, f: GRAU});
  ports.forEach((belegt, i) => {
    const py = y + 46 + i * 20, liste = belegt ? belegt.split(" / ") : [];
    s += text(x + 12, py, `X${i}`, {g: 9, w: 600}) + (liste.length ? "" : text(x + 60, py, "frei", {g: 8.5, f: GRAU}));
    liste.forEach((b, j) => { s += kennzeichen(b, x + 60 + j * 130, py, {g: 9}) + verweis(x + 116 + j * 130, py, zielVon(ctx, b), "start"); });
  });
  return s;
}

function feldverteiler(ctx){
  const liste = Object.entries(ctx.modell.plan.feldverteiler);
  let s = ueberschrift("Feldverteiler M12", "Pin 1 L+ (braun), Pin 2 Signal 2 (weiß), Pin 3 M (blau), Pin 4 Signal 1 (schwarz)");
  liste.forEach(([bmk, ports], i) => { s += verteiler(ctx, bmk, ports, 60 + (i % 2) * 560, 110 + Math.floor(i / 2) * 230); });
  return s;
}

function insel(ctx, bmk, plaetze, x, y){
  merkeHier(ctx, bmk, x, "haupt");
  const geraet = ctx.modell.geraete.get(bmk);
  let s = kasten(x, y, 1060, 40 + plaetze.length * 20, "#fff") + kennzeichen(bmk, x + 12, y + 22) + text(x + 70, y + 22, geraet.text, {g: 9, f: GRAU});
  plaetze.forEach(([platz, s14, s12, antrieb], i) => {
    const py = y + 46 + i * 20;
    s += text(x + 12, py, `Platz ${platz}`, {g: 9, w: 600}) + text(x + 380, py, antrieb, {g: 9});
    [[s14, "14"], [s12, "12"]].forEach(([mb, nr], j) => {
      if (mb) s += text(x + 90 + j * 140, py, nr, {g: 8, f: GRAU}) + kennzeichen(mb, x + 106 + j * 140, py, {g: 9})
        + verweis(x + 160 + j * 140, py, zielVon(ctx, mb), "start");
    });
  });
  return s;
}

function ventilinseln(ctx){
  let s = ueberschrift("Ventilinseln", "Spule 14 schaltet die Arbeitsstellung, Spule 12 die Grundstellung (Anschlüsse nach ISO 11727)"), y = 110;
  for (const [bmk, plaetze] of Object.entries(ctx.modell.plan.ventilinseln)) {
    s += insel(ctx, bmk, plaetze, 60, y);
    y += 70 + plaetze.length * 20;
  }
  return s;
}

export const BLOECKE = {deckblatt, hinweise, sps, profinet, feldverteiler, ventilinseln};
