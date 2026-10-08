/* ---------- Interaktive Erklärungen: Zahlenstrahl für das Rechnen ---------- */
// Zeichnet einen Zahlenstrahl von „von“ bis „bis“ mit Teilstrichen, Marken (Operanden, Ergebnis), einem Band (z. B. MIN bis MAX)
// und einem Bogen für den Überlauf: Liegt das richtige Ergebnis rechts oder links außerhalb, zeigt ein Pfeil, wo das Bitmuster landet.
// daten: {von, bis, striche: [{v, text}], marken: [{v, text, oben, klasse}], band: {von, bis}, bogen: {von, nach}}
// Beschriftungen überlappen nie: Jede Marke bekommt die erste Reihe (und Ausrichtung), in der ihr Text keinen anderen Text,
// keinen Faden und nicht den Bogen kreuzt. Marken mit gleichem Wert auf derselben Seite teilen sich eine Beschriftung.
// Zahlen an Teilstrichen, die eine Marke unten oder den Bogen berühren, entfallen.
import { iaSvg, iaText } from './basis.js';

const RS_LINKS = 46, RS_RECHTS = 434, RS_AUSSEN = 40, RS_BREITE = RS_RECHTS + RS_AUSSEN + 10;
const RS_REIHE = 15, RS_ZEICHEN = 7.2, RS_LUFT = 6, RS_MAX_REIHEN = 6;

function rsX(d, v){
  if (v > d.bis) return RS_RECHTS + RS_AUSSEN;
  if (v < d.von) return RS_LINKS - RS_AUSSEN;
  return RS_LINKS + (v - d.von) / (d.bis - d.von) * (RS_RECHTS - RS_LINKS);
}
const rsTextBreite = text => String(text).length * RS_ZEICHEN;

/* ---------- Beschriftungen ohne Überlappen ---------- */
// Gleicher Wert, gleiche Seite: eine Marke mit beiden Texten (z. B. IN1 und IN2 beide 80)
function rsZusammen(marken){
  const gruppen = new Map();
  for (const m of marken) {
    const schluessel = `${m.oben}|${m.v}`, g = gruppen.get(schluessel);
    if (g) { g.text += ` · ${m.text}`; g.klasse = g.klasse || m.klasse; }
    else gruppen.set(schluessel, {...m});
  }
  return [...gruppen.values()];
}
const RS_ANKER = {middle: (x, b) => [x - b / 2, x + b / 2], end: (x, b) => [x - 4 - b, x - 4], start: (x, b) => [x + 4, x + 4 + b]};
const rsUeber = ([a, b], [c, e]) => a < e + RS_LUFT && c < b + RS_LUFT;
const rsIn = (x, [a, b]) => x > a - 2 && x < b + 2;
// Kollision mit den schon gesetzten Marken derselben Seite und mit den senkrechten Linien des Bogens
function rsStoesst(k, gesetzt, boegen){
  return boegen.some(x => rsIn(x, k.raum)) || k.raum[0] < 2 || k.raum[1] > RS_BREITE - 2
    || gesetzt.some(g => (g.reihe === k.reihe && rsUeber(g.raum, k.raum)) || (g.reihe < k.reihe && rsIn(k.x, g.raum))
      || (g.reihe > k.reihe && rsIn(g.x, k.raum)));
}
function rsSetzen(m, gesetzt, boegen){
  const breite = rsTextBreite(m.text);
  for (let reihe = 0; reihe < RS_MAX_REIHEN; reihe++) for (const anker of Object.keys(RS_ANKER)) {
    const k = {...m, reihe, anker, raum: RS_ANKER[anker](m.x, breite)};
    if (!rsStoesst(k, gesetzt, boegen)) return k;
  }
  return {...m, reihe: RS_MAX_REIHEN, anker: "middle", raum: RS_ANKER.middle(m.x, breite)};
}
function rsReihen(marken, boegen){
  const gesetzt = [];
  for (const m of [...marken].sort((a, b) => a.x - b.x)) gesetzt.push(rsSetzen(m, gesetzt, boegen));
  return gesetzt;
}
const rsAnzahl = gesetzt => gesetzt.length ? Math.max(...gesetzt.map(g => g.reihe)) + 1 : 0;

/* ---------- Zeichnen ---------- */
// Lage: y ist die Höhe des Strahls, darunter Teilstrich-Zahlen, Beschriftungen unten, dann der Bogen
function rsLage(oben, unten, bogen){
  const y = oben ? 34 + (oben - 1) * RS_REIHE : 20, reiheUnten = r => y + 36 + r * RS_REIHE;
  const yBogen = reiheUnten(unten) - 4, hoehe = bogen ? yBogen + 24 : unten ? reiheUnten(unten - 1) + 8 : y + 28;
  return {y, reiheUnten, yBogen, hoehe};
}
function rsStrich(d, s, l, frei){
  const x = rsX(d, s.v), zahl = frei(x, rsTextBreite(s.text)) ? iaText(x, l.y + 19, s.text, "rs-zahl") : "";
  return `<line x1="${x.toFixed(1)}" y1="${l.y - 5}" x2="${x.toFixed(1)}" y2="${l.y + 5}" class="rs-strich"/>` + zahl;
}
function rsMarke(m, l){
  const r = m.oben ? -1 : 1, ty = m.oben ? l.y - 16 - m.reihe * RS_REIHE : l.reiheUnten(m.reihe), x = m.x.toFixed(1);
  const tx = {middle: m.x, end: m.x - 4, start: m.x + 4}[m.anker];
  const spitze = `<path d="M${x} ${l.y + r * 2} l-5 ${r * 8} h10 z" class="rs-marke ${m.klasse || ""}"/>`;
  const faden = `<line x1="${x}" y1="${l.y + r * 10}" x2="${x}" y2="${ty + (m.oben ? 3 : -11)}" class="rs-faden"/>`;
  return spitze + faden + iaText(tx, ty, m.text, `rs-text ${m.klasse || ""}`, m.anker);
}
function rsBand(d, l){
  if (!d.band) return "";
  const x1 = rsX(d, d.band.von), x2 = rsX(d, d.band.bis);
  return `<rect x="${x1.toFixed(1)}" y="${l.y - 6}" width="${Math.max(2, x2 - x1).toFixed(1)}" height="12" rx="3" class="rs-band"/>`;
}
// Bogen unter allen Beschriftungen: senkrecht hinunter, waagerecht hinüber, mit Pfeil wieder hinauf
function rsBogen(d, l){
  if (!d.bogen) return "";
  const x1 = rsX(d, d.bogen.von), x2 = rsX(d, d.bogen.nach), s = Math.sign(x2 - x1) || 1, yb = l.yBogen;
  const pfad = `M${x1.toFixed(1)} ${l.y + 6} V${yb - 8} Q${x1.toFixed(1)} ${yb} ${(x1 + 8 * s).toFixed(1)} ${yb} H${(x2 - 8 * s).toFixed(1)}`
    + ` Q${x2.toFixed(1)} ${yb} ${x2.toFixed(1)} ${yb - 8} V${l.y + 16}`;
  return `<path d="${pfad}" class="rs-bogen"/><path d="M${x2.toFixed(1)} ${l.y + 10} l-5 9 h10 z" class="rs-spitze"/>`
    + iaText((x1 + x2) / 2, yb + 16, "Überlauf: Das Bitmuster läuft herum", "rs-text warn");
}
export function reStrahlSVG(d){
  const boegen = d.bogen ? [rsX(d, d.bogen.von), rsX(d, d.bogen.nach)] : [];
  const marken = rsZusammen(d.marken).map(m => ({...m, x: rsX(d, m.v)}));
  const oben = rsReihen(marken.filter(m => m.oben), []), unten = rsReihen(marken.filter(m => !m.oben), boegen);
  const l = rsLage(rsAnzahl(oben), rsAnzahl(unten), !!d.bogen);
  const senkrecht = [...boegen, ...unten.map(m => m.x)];
  const frei = (x, b) => !senkrecht.some(s => rsIn(s, [x - b / 2, x + b / 2]));
  const aussen = `<line x1="${RS_LINKS - RS_AUSSEN}" y1="${l.y}" x2="${RS_RECHTS + RS_AUSSEN}" y2="${l.y}" class="rs-aussen"/>`;
  const strahl = `<line x1="${RS_LINKS}" y1="${l.y}" x2="${RS_RECHTS}" y2="${l.y}" class="rs-linie"/>`;
  const inhalt = aussen + rsBand(d, l) + strahl + d.striche.map(s => rsStrich(d, s, l, frei)).join("") + rsBogen(d, l)
    + [...oben, ...unten].map(m => rsMarke(m, l)).join("");
  return iaSvg(RS_BREITE, l.hoehe, inhalt, "Zahlenstrahl");
}
