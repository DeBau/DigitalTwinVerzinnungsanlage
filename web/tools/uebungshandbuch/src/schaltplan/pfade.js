/* Strompfadseiten: senkrechte Ketten aus Schaltzeichen zwischen Potenzialschienen oder einer SPS-Baugruppe.
   Eine Spalte ist ein Strompfad. Dieselbe Zeichnung dient für Steuerstromkreise und für die Ein- und Ausgangsseiten.
   Unter Spulen steht der Kontaktspiegel, auf Kanalseiten darunter das Signal mit Kommentar aus der Signalliste. */
import { BLAU, GRAU, SCHMAL, absatz, linie, punkt, text, umbrechen, kasten } from '../symbole/grund.js';
import { SPALTE, X0, X1, spalteVon, spaltenMitte } from './blatt.js';
import { beschriftung, grauerText, setze, verweis } from './elemente.js';
import { kontakte, merke, merkeSignal, verweisText, verweisZu } from './querverweise.js';

const SCHIENE = 64, SCHIENE2 = 80, MODUL_OBEN = [36, 86], LUECKE = 16;
const istPotenzial = name => name && !name.startsWith("−");

/* ---------- Schienen und Beschriftungen ---------- */
function schiene(ctx, name, y){
  const hier = {seite: ctx.seite.nr, spalte: 0};
  if (ctx.seite.quelle) merke(ctx.schreiben, name, {...hier, rolle: "haupt"});
  const herkunft = ctx.seite.quelle ? `von ${ctx.seite.quelle}` : "";
  return linie(`M${X0 + 4} ${y}H${X1 - 4}`, 1.6) + text(X0 + 6, y - 4, name, {g: 9.5, w: 600, schrift: SCHMAL})
    + verweis(X0 + 26 + name.length * 4, y - 4, verweisZu(ctx.lesen, name, hier), "start")
    + (herkunft ? grauerText(X0 + 60, y - 4, herkunft, "start") : "");
}

// Beschriftung für Pfadanfang (von) oder Pfadende (bis): Potenzial oder Anschluss eines Geräts
function marke(ctx, name, x, y){
  const hier = {seite: ctx.seite.nr, spalte: spalteVon(x)};
  const bmk = name.split(":")[0];
  if (istPotenzial(name) && ctx.bisSchreibt) merke(ctx.schreiben, name, {...hier, rolle: "haupt"});
  const ziel = ctx.bisSchreibt && istPotenzial(name) ? "" : verweisZu(ctx.lesen, bmk, hier);
  return text(x, y, name, {a: "middle", g: 8.5, w: 600, schrift: SCHMAL}) + verweis(x, y + 10, ziel, "middle");
}

/* ---------- Kontaktspiegel unter einer Spule ---------- */
// Art eines Kontakts aus seinen Anschlüssen: 1/2 3/4 5/6 = Hauptkontakte, x1/x2 = Öffner, x3/x4 = Schließer
function kontaktArt(an){
  const erste = String(an).split("/")[0];
  if (/^[135]$/.test(erste)) return "haupt";
  return erste.endsWith("1") ? "nc" : "no";
}

function kontaktBild(x, y, an){
  if (kontaktArt(an) === "nc") return linie(`M${x} ${y}V${y + 3}H${x + 3}M${x} ${y + 11}V${y + 8}L${x + 4} ${y + 2}`, 1);
  return linie(`M${x} ${y}V${y + 3}M${x} ${y + 11}V${y + 8}L${x - 4} ${y + 2}`, 1);
}

function kontaktspiegel(ctx, bmk, x, y){
  const liste = kontakte(ctx.lesen, bmk);
  let s = "";
  liste.forEach((e, i) => {
    const zy = y + i * 13;
    const refX = Math.max(x + 6, x - 18 + String(e.an).length * 4.2 + 6);
    s += kontaktBild(x - 26, zy, e.an) + text(x - 18, zy + 9, e.an, {g: 7.5, f: GRAU}) + verweis(refX, zy + 9, verweisText(e), "start");
  });
  return {svg: liste.length ? linie(`M${x - 34} ${y - 4}H${x + 34}`, .6) + s : "", h: liste.length * 13};
}

/* ---------- Ein Strompfad ---------- */
function pfadTitel(x, t){
  const zeilen = umbrechen(t, SPALTE - 10, 8).slice(0, 2);
  return absatz(x, 40, zeilen, {a: "middle", g: 8, f: GRAU});
}

function startHoehe(ctx, pfad){
  const s = ctx.seite;
  if (pfad.von) return 112;
  if (s.modul && s.modul.lage === "oben") return MODUL_OBEN[1];
  return s.oben2 ? SCHIENE2 : SCHIENE;
}

function kopf(ctx, pfad, x){
  const s = ctx.seite;
  if (pfad.von) return marke(ctx, pfad.von, x, 98);
  if (s.modul && s.modul.lage === "oben") return "";
  return punkt(x, SCHIENE) + linie(`M${x} ${SCHIENE}V${startHoehe(ctx, pfad)}`);
}

function sensorRueckleiter(ctx, x, y){   // BU des Sensors zu M
  if (ctx.seite.oben2) return linie(`M${x - 24} ${y + 40}V${SCHIENE2}`) + punkt(x - 24, SCHIENE2);
  return text(x - 27, y + 43, "M", {a: "end", g: 7.5, f: GRAU});
}

function zeichnePfad(ctx, pfad){
  const x = spaltenMitte(pfad.spalte), unten = ctx.unten;
  let y = startHoehe(ctx, pfad), s = kopf(ctx, pfad, x);
  if (!ctx.seite.signaltext && pfad.titel) s += pfadTitel(x, pfad.titel);
  const spulen = [];
  for (const g of pfad.glieder) {
    s += linie(`M${x} ${y}V${y + LUECKE}`);
    y += LUECKE;
    const teil = setze(ctx, g, x, y);
    s += teil.svg + (teil.sym.bu ? sensorRueckleiter(ctx, x, y) : "");
    if (teil.sym.rolle === "haupt") spulen.push(g.bmk);
    y += teil.h;
  }
  ctx.bisSchreibt = true;
  if (pfad.bis) s += linie(`M${x} ${y}V${y + 12}`) + marke(ctx, pfad.bis, x, y + 24);
  else s += linie(`M${x} ${y}V${unten}`) + (ctx.seite.unten ? punkt(x, unten) : "");
  ctx.bisSchreibt = false;
  return {svg: s, spulen, x};
}

/* ---------- SPS-Baugruppe über oder unter den Pfaden ---------- */
function modulKasten(ctx){
  const m = ctx.seite.modul, n = m.kanaele.length, oben = m.lage === "oben";
  const y = oben ? MODUL_OBEN[0] : ctx.unten, h = 50, x0 = X0 + SPALTE + 4, breite = SPALTE * n - 8;
  let s = kasten(x0, y, breite, h, "#F7F9FB");
  m.kanaele.forEach((k, i) => {
    const x = spaltenMitte(i + 1), anschluss = oben ? y + h : y;
    merkeSignal(ctx.schreiben, k.signal, {seite: ctx.seite.nr, spalte: i + 1});
    s += linie(`M${x} ${anschluss}V${oben ? anschluss - 8 : anschluss + 8}`)
      + text(x, y + 30, `%${k.adr}`, {a: "middle", g: 9.5, w: 600, schrift: SCHMAL})
      + grauerText(x, oben ? y + 14 : y + 44, `Kanal ${k.modul.kanal}` + (k.modul.pin ? `, Pin ${k.modul.pin}` : ""));
  });
  return s + modulBeschriftung(ctx, m, y);
}

function modulBeschriftung(ctx, m, y){
  const x = X0 + 8, b = m.baugruppe, hier = {seite: ctx.seite.nr, spalte: 0};
  let s = `<g class="sp-bmk" data-bmk="−KF1">${text(x, y + 12, "−KF1", {g: 10, w: 600, schrift: SCHMAL})}</g>`
    + verweis(x + 34, y + 12, verweisZu(ctx.lesen, "−KF1", hier), "start");
  s += absatz(x, y + 24, [`Steckplatz ${b.platz}`, ...umbrechen(b.name, SPALTE - 14, 7.5)], {g: 7.5, f: GRAU});
  if (m.typ === "DQ") s += text(x, y + 58, `Lastgruppe an ${m.versorgung}`, {g: 7.5, w: 600, f: BLAU});
  return s;
}

/* ---------- Signal und Kommentar unter dem Pfad ---------- */
function signalText(k, x, y){
  const tag = k.signal.split("_")[0], kommentar = k.info ? k.info.k : "Signal fehlt in der Signalliste";
  const zusatz = k.typ === "AI" || k.typ === "AQ" ? [k.an] : [];
  return text(x - SPALTE / 2 + 6, y, k.signal, {g: 7.8, w: 600, k: "sig", attr: `data-tag="${tag}" tabindex="0"`, schrift: SCHMAL})
    + absatz(x - SPALTE / 2 + 6, y + 11, [...zusatz, ...umbrechen(kommentar, SPALTE - 12, 7.2)].slice(0, 9), {g: 7.2, f: GRAU});
}

/* ---------- Ganze Seite ---------- */
export function pfadInhalt(ctx){
  const s = ctx.seite;
  ctx.unten = s.signaltext ? 520 : 700;
  let svg = "";
  if (s.oben) svg += schiene(ctx, s.oben, SCHIENE);
  if (s.oben2) svg += schiene(ctx, s.oben2, SCHIENE2);
  if (s.unten) svg += schiene(ctx, s.unten, ctx.unten);
  if (s.modul) svg += modulKasten(ctx);
  for (const pfad of s.pfade) {
    const teil = zeichnePfad(ctx, pfad);
    let tiefe = ctx.unten + (s.modul && s.modul.lage === "unten" ? 62 : 14);
    for (const bmk of teil.spulen) {
      const spiegel = kontaktspiegel(ctx, bmk, teil.x, tiefe);
      svg += spiegel.svg;
      tiefe += spiegel.h + (spiegel.h ? 8 : 0);
    }
    svg += teil.svg + (pfad.kanal ? signalText(pfad.kanal, teil.x, tiefe + 6) : "");
  }
  return svg;
}
