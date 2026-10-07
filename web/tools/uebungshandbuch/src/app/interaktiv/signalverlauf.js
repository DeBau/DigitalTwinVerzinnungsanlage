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
