/* ---------- Interaktive Erklärungen: Signalverlauf ---------- */
// Zeichnet ein Zeitdiagramm: je Spur eine Zeile, je Schritt eine Spalte, 1 oben, 0 unten.
// spuren: [{name, werte: [0/1 je Schritt]}]. Gezeigt werden die letzten SV_MAX Schritte.
import { iaSvg, iaText } from './basis.js';

const SV_MAX = 16, SV_LINKS = 92, SV_SPALTE = 30, SV_ZEILE = 38, SV_HUB = 20;

function svPfad(werte, y0){
  const y = w => y0 + (w ? 0 : SV_HUB);
  let d = `M${SV_LINKS} ${y(werte[0])}`;
  werte.forEach((w, i) => {
    const x = SV_LINKS + i * SV_SPALTE;
    if (i && w !== werte[i - 1]) d += ` L${x} ${y(w)}`;
    d += ` L${x + SV_SPALTE} ${y(w)}`;
  });
  return `<path d="${d}" class="sv-kurve"/>`;
}
function svSpur(spur, zeile){
  const y0 = 10 + zeile * SV_ZEILE;
  const grund = `<line x1="${SV_LINKS}" y1="${y0 + SV_HUB}" x2="${SV_LINKS + SV_MAX * SV_SPALTE}" y2="${y0 + SV_HUB}" class="sv-null"/>`;
  return iaText(SV_LINKS - 10, y0 + 15, spur.name, "sv-name", "end") + grund + (spur.werte.length ? svPfad(spur.werte, y0) : "");
}
function svRaster(n, hoehe){
  return Array.from({length: n + 1}, (_, i) => {
    const x = SV_LINKS + i * SV_SPALTE;
    return `<line x1="${x}" y1="4" x2="${x}" y2="${hoehe - 16}" class="sv-raster"/>`;
  }).join("");
}
export function signalverlaufSVG(spuren, beschriftung = "Schritt"){
  const kurz = spuren.map(s => ({...s, werte: s.werte.slice(-SV_MAX)}));
  const n = Math.max(1, ...kurz.map(s => s.werte.length)), hoehe = 26 + spuren.length * SV_ZEILE;
  const fuss = iaText(SV_LINKS + n * SV_SPALTE / 2, hoehe - 2, `${beschriftung} → Zeit`, "sv-fuss");
  const inhalt = svRaster(n, hoehe) + kurz.map(svSpur).join("") + fuss;
  return iaSvg(SV_LINKS + SV_MAX * SV_SPALTE + 10, hoehe, inhalt, "Signalverlauf");
}

/* ---------- Zeitdiagramm über echter Zeit (ms) ---------- */
// spuren: [{name, wechsel: [[t, wert], …]}], Fenster von … bis (ms).
// marken: senkrechte Linien mit Text (z. B. Zyklusanfang), punkte: [{zeile, t}] Dreiecke an einer Spur (z. B. Einlesen).
const ZV_BREITE = 480;
function zvWert(wechsel, t){
  let w = 0;
  for (const [tw, v] of wechsel) { if (tw > t) break; w = v; }
  return w;
}
function zvPfad(wechsel, von, bis, x, y0){
  const y = w => y0 + (w ? 0 : SV_HUB);
  let w = zvWert(wechsel, von), d = `M${x(von)} ${y(w)}`;
  for (const [t, v] of wechsel) {
    if (t <= von || t > bis || v === w) continue;
    d += ` L${x(t)} ${y(w)} L${x(t)} ${y(v)}`; w = v;
  }
  return `<path d="${d} L${x(bis)} ${y(w)}" class="sv-kurve"/>`;
}
function zvSpur(spur, zeile, von, bis, x){
  const y0 = 10 + zeile * SV_ZEILE;
  const grund = `<line x1="${SV_LINKS}" y1="${y0 + SV_HUB}" x2="${SV_LINKS + ZV_BREITE}" y2="${y0 + SV_HUB}" class="sv-null"/>`;
  return iaText(SV_LINKS - 10, y0 + 15, spur.name, "sv-name", "end") + grund + zvPfad(spur.wechsel, von, bis, x, y0);
}
function zvMarke(m, x, hoehe){
  const platz = SV_LINKS + ZV_BREITE - x(m.t) > 90;   // Text nur, wenn er bis zum rechten Rand passt
  return `<line x1="${x(m.t)}" y1="4" x2="${x(m.t)}" y2="${hoehe - 18}" class="sv-marke"/>` + (platz ? iaText(x(m.t) + 3, hoehe - 6, m.text, "sv-fuss", "start") : "");
}
const zvPunkt = (p, x) => { const y = 10 + p.zeile * SV_ZEILE + SV_HUB + 3, px = x(p.t); return `<path d="M${px} ${y} l-4 7 h8 z" class="sv-punkt"/>`; };

export function zeitverlaufSVG({spuren, von, bis, marken = [], punkte = []}){
  const x = t => (SV_LINKS + (t - von) / (bis - von) * ZV_BREITE).toFixed(1);
  const hoehe = 34 + spuren.length * SV_ZEILE;
  const sicht = t => t >= von && t <= bis;
  const inhalt = marken.filter(m => sicht(m.t)).map(m => zvMarke(m, x, hoehe)).join("")
    + spuren.map((s, i) => zvSpur(s, i, von, bis, x)).join("") + punkte.filter(p => sicht(p.t)).map(p => zvPunkt(p, x)).join("");
  return iaSvg(SV_LINKS + ZV_BREITE + 10, hoehe, inhalt, "Signalverlauf über der Zeit");
}

/* ---------- Zeitdiagramm mit einer Wertespur (Rampe) und Zeitachse ---------- */
// Wie zeitverlaufSVG, darunter eine Spur mit einem Zahlenwert über der Zeit (z. B. ET einer IEC-Zeit) und eine Achse in s.
// wert: {name, punkte: [[t, v], …] gerade verbunden (zwei Punkte mit gleichem t = Sprung), max, linie: {v, text} gestrichelt}
// teilung: Abstand der Teilstriche in ms.
const ZW_HOEHE = 56;
function zwWertBei(punkte, t){
  let i = -1;
  while (i + 1 < punkte.length && punkte[i + 1][0] <= t) i++;
  if (i < 0) return punkte.length ? punkte[0][1] : 0;
  const [t0, v0] = punkte[i], naechster = punkte[i + 1];
  if (!naechster || naechster[0] === t0) return v0;
  return v0 + (naechster[1] - v0) * (t - t0) / (naechster[0] - t0);
}
function zwKurve(wert, von, bis, x, y){
  const innen = wert.punkte.filter(([t]) => t > von && t < bis);
  const liste = [[von, zwWertBei(wert.punkte, von)], ...innen, [bis, zwWertBei(wert.punkte, bis)]];
  return `<path d="${liste.map(([t, v], i) => `${i ? "L" : "M"}${x(t)} ${y(v)}`).join(" ")}" class="sv-rampe"/>`;
}
function zwSpur(wert, y0, von, bis, x){
  const y = v => (y0 + ZW_HOEHE - v / wert.max * ZW_HOEHE).toFixed(1), rechts = SV_LINKS + ZV_BREITE;
  const grund = `<line x1="${SV_LINKS}" y1="${y(0)}" x2="${rechts}" y2="${y(0)}" class="sv-null"/>`;
  const l = wert.linie;
  const linie = l ? `<line x1="${SV_LINKS}" y1="${y(l.v)}" x2="${rechts}" y2="${y(l.v)}" class="sv-grenze"/>` + iaText(SV_LINKS - 10, +y(l.v) + 4, l.text, "sv-fuss", "end") : "";
  return iaText(SV_LINKS - 10, y0 + ZW_HOEHE, wert.name, "sv-name", "end") + grund + linie + zwKurve(wert, von, bis, x, y);
}
function zwAchse(von, bis, x, y0, teilung){
  let svg = `<line x1="${SV_LINKS}" y1="${y0}" x2="${SV_LINKS + ZV_BREITE}" y2="${y0}" class="sv-achse"/>`;
  for (let t = Math.ceil(von / teilung) * teilung; t <= bis; t += teilung) {
    const s = (t / 1000).toLocaleString("de-DE");
    svg += `<line x1="${x(t)}" y1="${y0}" x2="${x(t)}" y2="${y0 + 4}" class="sv-achse"/>` + iaText(x(t), y0 + 15, `${s} s`, "sv-fuss");
  }
  return svg;
}
export function zeitverlaufWertSVG({spuren, wert, von, bis, marken = [], teilung = 1000}){
  const x = t => (SV_LINKS + (t - von) / (bis - von) * ZV_BREITE).toFixed(1);
  const yWert = 10 + spuren.length * SV_ZEILE + 8, yAchse = yWert + ZW_HOEHE + 8, hoehe = yAchse + 36;
  const inhalt = marken.filter(m => m.t >= von && m.t <= bis).map(m => zvMarke(m, x, hoehe)).join("")
    + spuren.map((s, i) => zvSpur(s, i, von, bis, x)).join("") + zwSpur(wert, yWert, von, bis, x) + zwAchse(von, bis, x, yAchse, teilung);
  return iaSvg(SV_LINKS + ZV_BREITE + 10, hoehe, inhalt, "Signalverlauf über der Zeit");
}

/* ---------- Signalverlauf je Schritt mit einer Zahlenzeile ---------- */
// Wie signalverlaufSVG, darunter eine Zeile mit einer Zahl je Schritt (z. B. Zählerstand CV). zahlen: {name, werte: [Zahl je Schritt]}
function szZeile(zahlen, y){
  const werte = zahlen.werte.slice(-SV_MAX);
  const felder = werte.map((w, i) => {
    const neu = i && w !== werte[i - 1] ? " neu" : "";
    return iaText(SV_LINKS + i * SV_SPALTE + SV_SPALTE / 2, y, String(w), `sv-zahl${neu}`);
  }).join("");
  return iaText(SV_LINKS - 10, y, zahlen.name, "sv-name", "end") + felder;
}
export function signalverlaufZahlenSVG(spuren, zahlen, beschriftung = "Schritt"){
  const kurz = spuren.map(s => ({...s, werte: s.werte.slice(-SV_MAX)}));
  const n = Math.max(1, zahlen.werte.slice(-SV_MAX).length), yZahl = 10 + spuren.length * SV_ZEILE + 14, hoehe = yZahl + 26;
  const fuss = iaText(SV_LINKS + n * SV_SPALTE / 2, hoehe - 2, `${beschriftung} → Zeit`, "sv-fuss");
  const inhalt = svRaster(n, hoehe) + kurz.map(svSpur).join("") + szZeile(zahlen, yZahl) + fuss;
  return iaSvg(SV_LINKS + SV_MAX * SV_SPALTE + 10, hoehe, inhalt, "Signalverlauf mit Zählerstand");
}
