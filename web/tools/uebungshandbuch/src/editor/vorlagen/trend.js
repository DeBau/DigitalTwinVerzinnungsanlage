// Vorlage Trendaufzeichnung: Formular mit zwei Diagrammen über der Zeit, oben Istwert x und Sollwert w, unten die
// Stellgröße y. Gezeichnet wird frei mit Stift, Linie und Text; Fangpunkte sind die Teilstriche der Achsen.
// Größe, Einheit und Skala der Achsen trägt man links ein (Haken seitenleiste und eingabe); sie stehen in
// data.meta.achsen und erscheinen über den Haken hintergrund auf dem Blatt. Der leere Vordruck hat Schreiblinien.
import { esc } from '../../app/basis.js';
import { ED } from '../status.js';
import { registriereVorlage } from '../registry.js';
import { G, G2, TX, snap } from '../vorlagen-svg.js';
import { FARBEN } from '../eigenschaften.js';
import { aendere, beginne } from '../verlauf.js';
import { TREND_WERKZEUGE, TREND_ZEIGER, trendAnleitung, trendSchrittEnde } from './trend-striche.js';

// Diagramme: linke Kante x0, rechte Kante x1, 16 Zeitspalten; je Diagramm Oberkante y0, Höhe h, 8 Zeilen
export const TREND = {x0: 80, x1: 965, spalten: 16, diagramme: [
  {y0: 40, h: 380, zeilen: 8, symbol: "x, w", n: 1, jeder: 1},
  {y0: 470, h: 130, zeilen: 8, symbol: "y", n: 2, jeder: 2},   // jeder: Zahl an jedem wievielten Teilstrich
]};
export const spaltenBreite = () => (TREND.x1 - TREND.x0) / TREND.spalten;
export const zeilenHoehe = dg => dg.h / dg.zeilen;
// Legende: Farben wie die Stifte der Werkzeugleiste
export const LEGENDE = [["Istwert x", FARBEN[0][0]], ["Sollwert w", FARBEN[1][0]], ["Stellgröße y", FARBEN[2][0]]];

/* ---------- Vordruck ---------- */
export function diagramm(dg){
  const {x0, x1, spalten} = TREND, unten = dg.y0 + dg.h;
  let s = `<path d="M${x0} ${dg.y0}V${unten}H${x1}" stroke="${G}" stroke-width="1.3" fill="none"/>`;
  for (let i = 1; i <= dg.zeilen; i++) s += `<path d="M${x0} ${unten - i * zeilenHoehe(dg)}H${x1}" stroke="${G2}" stroke-width=".5"/>`;
  for (let i = 1; i <= spalten; i++) s += `<path d="M${x0 + i * spaltenBreite()} ${dg.y0}V${unten}" stroke="${G2}" stroke-width=".5"/>`;
  return s + kopfzeile(dg);
}
// Über dem Diagramm: Formelzeichen, Größe und Einheit mit Schreiblinie
export function kopfzeile(dg){
  const y = dg.y0 - 12, linie = (a, b) => `<path d="M${a} ${y + 2}H${b}" stroke="${G2}" stroke-width=".7"/>`;
  return TX(TREND.x0, y, 12, dg.symbol, "start", "#555", 700) + TX(125, y, 10, "Größe:") + linie(160, 360)
    + TX(375, y, 10, "Einheit:") + linie(415, 520);
}
export function legende(){
  return LEGENDE.map(([t, c], i) => {
    const x = 640 + i * 110;
    return `<path d="M${x} 24H${x + 22}" stroke="${c}" stroke-width="2.4"/>` + TX(x + 28, 28, 10, t, "start", "#555");
  }).join("");
}
export const trendBlatt = () => TREND.diagramme.map(diagramm).join("") + legende() + TX(TREND.x1, 627, 11, "t in s", "end", "#555", 600);

/* ---------- Achsenfelder ---------- */
// Felder je Diagramm n: Größe gn, Einheit en, Skala von an bis bn; dazu die Zeitachse bis t
export const ACHSFELDER = [
  ["Oberes Diagramm (x, w)", [["g1", "Größe", "z. B. Temperatur"], ["e1", "Einheit", "z. B. °C"], ["a1", "Skala von", "0"],
    ["b1", "Skala bis", "z. B. 80"]]],
  ["Unteres Diagramm (y)", [["g2", "Größe", "z. B. Heizleistung"], ["e2", "Einheit", "%"], ["a2", "Skala von", "0"],
    ["b2", "Skala bis", "100"]]],
  ["Zeitachse", [["t", "Ende in s", "z. B. 160"]]],
];
export const achsen = d => (d && d.meta && d.meta.achsen) || {};
export const achsFeld = ([f, lbl, ph]) => `<label class="prop">${lbl}<input type="text" data-tr="${f}" `
  + `value="${esc(achsen(ED.data)[f] || "")}" placeholder="${esc(ph)}" autocomplete="off"></label>`;
export const achsenHTML = () => ACHSFELDER.map(([titel, felder]) =>
  `<div class="palg"><div class="palh">${titel}</div>` + felder.map(achsFeld).join("") + `</div>`).join("");
// Haken eingabe: Achsenfeld übernehmen; leere Einträge entfallen. Tippen in einem Feld ist ein Verlaufsschritt,
// er endet beim Verlassen des Felds oder beim nächsten Klick aufs Blatt (trendSchrittEnde).
export function achsEingabe(e){
  const f = e.target.dataset && e.target.dataset.tr;
  if (!f) return false;
  beginne("trend:" + f);
  e.target.addEventListener("focusout", trendSchrittEnde, {once: true});
  aendere(d => {
    const m = d.meta = d.meta || {}, a = m.achsen = m.achsen || {};
    a[f] = e.target.value.trim();
    if (!a[f]) delete a[f];
    if (!Object.keys(a).length) delete m.achsen;
    if (!Object.keys(m).length) delete d.meta;
  });
  return true;
}
// Nach Rückgängig und Wiederholen: Felder ohne Fokus zeigen wieder die Werte aus meta.achsen der Zeichnung im Editor
export function achsFelderFuellen(d){
  if (d !== ED.data) return;
  const a = achsen(d);
  document.querySelectorAll("#editor [data-tr]").forEach(el => {
    if (el !== document.activeElement) el.value = a[el.dataset.tr] || "";
  });
}

/* ---------- Eingetragene Achsen auf dem Blatt (Haken hintergrund) ---------- */
export const zahl = v => String(+v.toFixed(2)).replace(".", ",");
export const istZahl = v => v !== undefined && v !== "" && !isNaN(+String(v).replace(",", "."));
export const alsZahl = v => +String(v).replace(",", ".");
export const SCHRIFT_WERT = "#17212B";
// Werte an den Teilstrichen von a bis b, n Teile
export const teilung = (a, b, n) => Array.from({length: n + 1}, (_, i) => alsZahl(a) + (alsZahl(b) - alsZahl(a)) * i / n);
export function skalaY(dg, a, b){
  if (!istZahl(a) || !istZahl(b)) return "";
  return teilung(a, b, dg.zeilen).map((v, i) => i % dg.jeder ? ""
    : TX(TREND.x0 - 6, dg.y0 + dg.h - i * zeilenHoehe(dg) + 4, 9.5, zahl(v), "end", SCHRIFT_WERT)).join("");
}
export function skalaT(dg, t){
  if (!istZahl(t)) return "";
  return teilung(0, t, TREND.spalten).map((v, i) =>
    TX(TREND.x0 + i * spaltenBreite(), dg.y0 + dg.h + 13, 9.5, zahl(v), "middle", SCHRIFT_WERT)).join("");
}
export function achsenSVG(d){
  const a = achsen(d), wert = (x, y, v) => v ? TX(x, y, 11, v, "start", SCHRIFT_WERT, 600) : "";
  return TREND.diagramme.map(dg => wert(163, dg.y0 - 12, a["g" + dg.n]) + wert(418, dg.y0 - 12, a["e" + dg.n])
    + skalaY(dg, a["a" + dg.n], a["b" + dg.n]) + skalaT(dg, a.t)).join("");
}

/* ---------- Fangen ---------- */
// Im Diagramm fängt ein Punkt auf dem nächsten Schnittpunkt der Teilstriche, außerhalb im 10er-Raster.
// Beim Band fängt y feiner (BAND_TEILE je Zeile), damit auch ein schmales Toleranzband wie ±2 °C geht.
export const BAND_TEILE = 4;
export const bandAktiv = () => ED.tool === "band"
  || !!(ED.drag && ED.drag.kind === "h" && ED.data.s[ED.drag.i] && ED.data.s[ED.drag.i].k === "band");
export function trendFang([x, y]){
  const dg = TREND.diagramme.find(q => y >= q.y0 - 10 && y <= q.y0 + q.h + 10);
  if (!dg || x < TREND.x0 - 10 || x > TREND.x1 + 10) return snap([x, y]);
  const teile = bandAktiv() ? BAND_TEILE : 1, zeilen = dg.zeilen * teile, zh = zeilenHoehe(dg) / teile;
  const sw = spaltenBreite(), i = Math.round((x - TREND.x0) / sw), j = Math.round((y - dg.y0) / zh);
  const begrenzt = (v, max) => Math.max(0, Math.min(max, v));
  return [+(TREND.x0 + begrenzt(i, TREND.spalten) * sw).toFixed(2), +(dg.y0 + begrenzt(j, zeilen) * zh).toFixed(2)];
}

registriereVorlage("trend", {
  n: "Trendaufzeichnung", d: "Istwert, Sollwert und Stellgröße über der Zeit", einblattig: true,
  body: trendBlatt,
  hilfe: "<p><b>Achsen</b> links eintragen: Größe, Einheit und Skala. Die Linien rasten auf den Teilstrichen ein.</p>"
    + "<p><b>Farben</b> wie in der Legende: Istwert schwarz, Sollwert blau, Stellgröße rot.</p>"
    + "<p><b>Kurve</b> setzt Punkte mit glatter Linie, <b>Band</b> zeichnet ein Toleranzband oder die Hysterese.</p>",
  werkzeugleiste: {nachLinie: TREND_WERKZEUGE},
  zeiger: TREND_ZEIGER,
  anleitung: trendAnleitung,
  seitenleiste: achsenHTML,
  eingabe: achsEingabe,
  hintergrund: d => { achsFelderFuellen(d); return achsenSVG(d); },
  fangPunkt: trendFang,
  werkzeugWechsel: trendSchrittEnde,
});
