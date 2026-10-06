/* Strompfadseiten: senkrechte Ketten aus Schaltzeichen zwischen Potenzialschienen oder einer SPS-Baugruppe.
   Eine Spalte ist ein Strompfad. Dieselbe Zeichnung dient für Steuerstromkreise und für die Ein- und Ausgangsseiten.
   Unter Spulen steht der Kontaktspiegel, auf Kanalseiten darunter das Signal mit Kommentar aus der Signalliste.
   Analogkanäle bekommen zusätzlich den zweiten Leiter (Rückleiter oder Speisung) und den Schirm (analog.js). */
import { BLAU, GRAU, SCHMAL, absatz, linie, punkt, text, umbrechen, kasten } from '../symbole/grund.js';
import { SYM } from '../symbole/iec60617.js';
import { SPALTE, X0, X1, spalteVon, spaltenMitte } from './blatt.js';
import { analogLeiter, analogModulAnschluss, speisung } from './analog.js';
import { grauerText, setze, verweis } from './elemente.js';
import { kontaktspiegel } from './kontaktspiegel.js';
import { merke, merkeSignal, verweisZu } from './querverweise.js';

const SCHIENE = 64, SCHIENE2 = 80, MODUL = {y: 36, h: 50}, LUECKE = 16, START_MARKE = 112;
const UNTEN = {kanal: 520, pfad: 700};   // Höhe der unteren Schiene bzw. der Baugruppe
const istPotenzial = name => name && !name.startsWith("−");

/* ---------- Schienen und Marken ---------- */
function schiene(ctx, name, y){
  const hier = {seite: ctx.seite.nr, spalte: 0};
  if (ctx.seite.quelle) merke(ctx.schreiben, name, {...hier, rolle: "haupt"});
  const herkunft = ctx.seite.quelle ? `von ${ctx.seite.quelle}` : "";
  return linie(`M${X0 + 4} ${y}H${X1 - 4}`, 1.6) + text(X0 + 6, y - 4, name, {g: 9.5, w: 600, schrift: SCHMAL})
    + verweis(X0 + 26 + name.length * 4, y - 4, verweisZu(ctx.lesen, name, hier), "start")
    + (herkunft ? grauerText(X0 + 60, y - 4, herkunft, "start") : "");
}

// Marke am Pfadanfang oder Pfadende: Potenzial oder Anschluss eines Geräts.
// Ein Potenzial wird hier definiert (Ziel für Verweise) oder verweist auf den Ort, an dem es definiert ist.
function marke(ctx, name, x, y, definiert){
  const hier = {seite: ctx.seite.nr, spalte: spalteVon(x)};
  if (definiert && istPotenzial(name)) merke(ctx.schreiben, name, {...hier, rolle: "haupt"});
  const ziel = definiert && istPotenzial(name) ? "" : verweisZu(ctx.lesen, name.split(":")[0], hier);
  return `<g class="sp-bmk" data-bmk="${name.split(":")[0]}">`
    + text(x, y, name, {a: "middle", g: 8.5, w: 600, schrift: SCHMAL}) + "</g>" + verweis(x, y + 10, ziel, "middle");
}

/* ---------- Ein Strompfad ---------- */
function pfadTitel(x, t){
  const zeilen = umbrechen(t, SPALTE - 10, 8).slice(0, 2);
  return absatz(x, 40, zeilen, {a: "middle", g: 8, f: GRAU});
}

const modulOben = s => s.modul && s.modul.lage === "oben";

function startHoehe(s, pfad){
  if (pfad.von || pfad.erde || pfad.frei) return START_MARKE;
  if (modulOben(s)) return MODUL.y + MODUL.h;
  return s.oben2 ? SCHIENE2 : SCHIENE;
}

function kopf(ctx, pfad, x){
  const s = ctx.seite, d = pfad.definiert || "bis";
  if (pfad.von) return marke(ctx, pfad.von, x, 98, d === "von");
  if (pfad.erde || pfad.frei || modulOben(s)) return "";
  return punkt(x, SCHIENE) + linie(`M${x} ${SCHIENE}V${startHoehe(s, pfad)}`);
}

// Rückleiter eines Sensors (BU) zur M-Schiene; ohne Schiene nur als Beschriftung
function sensorRueckleiter(ctx, x, y){
  if (ctx.seite.oben2) return linie(`M${x - 24} ${y + 40}V${SCHIENE2}`) + punkt(x - 24, SCHIENE2);
  return text(x - 27, y + 52, "M", {a: "end", g: 7.5, f: GRAU});
}

// Kabelname neben der Leitung hinter einem Steckverbinder
const kabel = (x, y, name) => name ? text(x + 6, y + 10, name, {g: 7.5, f: GRAU, schrift: SCHMAL}) : "";

function glieder(ctx, pfad, x, y){
  let s = "";
  const spulen = [], lage = {};
  for (const g of pfad.glieder) {
    s += linie(`M${x} ${y}V${y + LUECKE}`);
    y += LUECKE;
    const teil = setze(ctx, g, x, y);
    s += teil.svg + (teil.sym.bu ? sensorRueckleiter(ctx, x, y) : "") + kabel(x, y + teil.h, g.kabel);
    if (teil.sym.rolle === "haupt") spulen.push(g.bmk);
    if (teil.sym.rueck) lage.geraet = {y, sym: teil.sym, bmk: g.bmk};
    if (teil.sym.rolle === "klemme" && !lage.klemme) lage.klemme = y;
    if (g.sym === "geraet" && !lage.geraetPE) lage.geraetPE = y;
    y += teil.h;
  }
  return {svg: s, spulen, y, lage};
}

function ende(ctx, pfad, x, y, unten){
  const d = pfad.definiert || "bis";
  if (pfad.bis) return linie(`M${x} ${y}V${y + 12}`) + marke(ctx, pfad.bis, x, y + 24, d === "bis");
  if (pfad.erde) return punkt(x, unten) + linie(`M${x} ${unten}V${unten + 20}`) + SYM.erde.zeichne(x, unten + 20, {})
    + text(x + 14, unten + 40, "−XPE", {g: 8.5, w: 600, schrift: SCHMAL});
  return linie(`M${x} ${y}V${unten}`) + (ctx.seite.unten ? punkt(x, unten) : "");
}

// Schutzleiter eines Geräts im Strompfad (zum Beispiel Vibrorinne): kurzer Abgang rechts mit Klemme
function schutzleiter(ctx, pfad, x, lage){
  if (!pfad.peKlemme || !lage.geraetPE) return "";
  const y = lage.geraetPE + 30;
  merke(ctx.schreiben, pfad.peKlemme, {seite: ctx.seite.nr, spalte: spalteVon(x), rolle: "klemme"});
  return `<path d="M${x + 34} ${y}H${x + 52}" stroke="#17212B" stroke-width="1.4" stroke-dasharray="10 3"/>`
    + text(x + 55, y + 3, `PE ${pfad.peKlemme}`, {g: 7.5, f: GRAU, schrift: SCHMAL});
}

function zeichnePfad(ctx, pfad, unten){
  const x = spaltenMitte(pfad.spalte);
  let s = kopf(ctx, pfad, x);
  if (!ctx.seite.signaltext && pfad.titel) s += pfadTitel(x, pfad.titel);
  const teil = glieder(ctx, pfad, x, startHoehe(ctx.seite, pfad));
  s +=teil.svg + ende(ctx, pfad, x, teil.y, unten) + schutzleiter(ctx, pfad, x, teil.lage);
  if (pfad.kanal && pfad.kanal.analog) s += analogLeiter(ctx, pfad, x, teil.lage, unten) + speisung(ctx, pfad, x, teil.lage);
  return {svg: s, spulen: teil.spulen, x};
}

/* ---------- SPS-Baugruppe über oder unter den Pfaden ---------- */
function modulKasten(ctx, unten){
  const m = ctx.seite.modul, n = m.kanaele.length, oben = m.lage === "oben";
  const y = oben ? MODUL.y : unten, x0 = X0 + SPALTE + 4, breite = SPALTE * n - 8;
  let s = kasten(x0, y, breite, MODUL.h, "#F7F9FB");
  m.kanaele.forEach((k, i) => {
    const x = spaltenMitte(i + 1), anschluss = oben ? y + MODUL.h : y;
    merkeSignal(ctx.schreiben, k.signal, {seite: ctx.seite.nr, spalte: i + 1});
    s += linie(`M${x} ${anschluss}V${oben ? anschluss - 8 : anschluss + 8}`)
      + text(x, y + 30, `%${k.adr}`, {a: "middle", g: 9.5, w: 600, schrift: SCHMAL})
      + grauerText(x, oben ? y + 14 : y + 44, `Kanal ${k.modul.kanal}` + (k.modul.pin ? `, Pin ${k.modul.pin}` : ""))
      + (k.analog ? analogModulAnschluss(k, x, anschluss, oben) : "");
  });
  return s + modulBeschriftung(ctx, m, y);
}

// Kennzeichen, Steckplatz und Versorgung der Baugruppe links neben dem Kasten
function modulBeschriftung(ctx, m, y){
  const x = X0 + 8, b = m.baugruppe, hier = {seite: ctx.seite.nr, spalte: 0};
  let s = `<g class="sp-bmk" data-bmk="−KF1">${text(x, y + 12, "−KF1", {g: 10, w: 600, schrift: SCHMAL})}</g>`
    + verweis(x + 34, y + 12, verweisZu(ctx.lesen, "−KF1", hier), "start");
  s += absatz(x, y + 24, [`Steckplatz ${b.platz}`, ...umbrechen(b.name, SPALTE - 14, 7.5)], {g: 7.5, f: GRAU});
  const versorgung = m.typ === "DQ" ? `Lastgruppe L+ an ${m.versorgung}` : `L+ an ${m.versorgung}, M an M`;
  return s + text(x, y + 62, versorgung, {g: 7.5, w: 600, f: BLAU})
    + verweis(x, y + 72, verweisZu(ctx.lesen, m.versorgung, hier), "start");
}

/* ---------- Signal und Kommentar unter dem Pfad ---------- */
function signalText(k, x, y){
  const tag = k.signal.split("_")[0], kommentar = k.info ? k.info.k : "Signal fehlt in der Signalliste";
  const zusatz = k.analog ? [k.an, k.analog.text] : [];
  return text(x - SPALTE / 2 + 6, y, k.signal, {g: 7.8, w: 600, k: "sig", attr: `data-tag="${tag}" tabindex="0"`, schrift: SCHMAL})
    + absatz(x - SPALTE / 2 + 6, y + 11, umbrechen([...zusatz, kommentar].join(". "), SPALTE - 12, 7.2).slice(0, 10), {g: 7.2, f: GRAU});
}

/* ---------- Ganze Seite ---------- */
export function pfadInhalt(ctx){
  const s = ctx.seite, unten = s.signaltext ? UNTEN.kanal : UNTEN.pfad;
  let svg = "";
  if (s.oben) svg += schiene(ctx, s.oben, SCHIENE);
  if (s.oben2) svg += schiene(ctx, s.oben2, SCHIENE2);
  if (s.unten) svg += schiene(ctx, s.unten, unten);
  if (s.modul) svg += modulKasten(ctx, unten);
  for (const pfad of s.pfade) {
    const teil = zeichnePfad(ctx, pfad, unten);
    let tiefe = unten + (s.modul && s.modul.lage === "unten" ? 62 : 14);
    for (const bmk of teil.spulen) {
      const spiegel = kontaktspiegel(ctx, bmk, teil.x, tiefe);
      svg += spiegel.svg;
      tiefe += spiegel.h + (spiegel.h ? 8 : 0);
    }
    svg += teil.svg + (pfad.kanal ? signalText(pfad.kanal, teil.x, tiefe + 6) : "");
  }
  return svg;
}
