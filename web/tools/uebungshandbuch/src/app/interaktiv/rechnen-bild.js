/* ---------- Interaktive Erklärungen: Zahlenstrahl für das Rechnen ---------- */
// Zeichnet einen Zahlenstrahl von „von“ bis „bis“ mit Teilstrichen, Marken (Operanden, Ergebnis), einem Band (z. B. MIN bis MAX)
// und einem Bogen für den Überlauf: Liegt das richtige Ergebnis rechts oder links außerhalb, zeigt ein Pfeil, wo das Bitmuster landet.
// daten: {von, bis, striche: [{v, text}], marken: [{v, text, oben, reihe, klasse}], band: {von, bis}, bogen: {von, nach}}
import { iaSvg, iaText } from './basis.js';

const RS_LINKS = 46, RS_RECHTS = 434, RS_Y = 74, RS_AUSSEN = 40;

function rsX(d, v){
  if (v > d.bis) return RS_RECHTS + RS_AUSSEN;
  if (v < d.von) return RS_LINKS - RS_AUSSEN;
  return RS_LINKS + (v - d.von) / (d.bis - d.von) * (RS_RECHTS - RS_LINKS);
}
function rsStrich(d, s){
  const x = rsX(d, s.v).toFixed(1);
  return `<line x1="${x}" y1="${RS_Y - 5}" x2="${x}" y2="${RS_Y + 5}" class="rs-strich"/>` + iaText(+x, RS_Y + 19, s.text, "rs-zahl");
}
// Marke: Dreieck am Strahl, Text darüber (oben) oder darunter, in zwei Reihen gegen Überlappen
function rsMarke(d, m){
  const x = rsX(d, m.v), y = m.oben ? RS_Y - 8 : RS_Y + 8, richtung = m.oben ? -1 : 1;
  const ty = m.oben ? RS_Y - 16 - m.reihe * 15 : RS_Y + 36 + m.reihe * 15;
  const spitze = `<path d="M${x.toFixed(1)} ${RS_Y + richtung * 2} l-5 ${richtung * 8} h10 z" class="rs-marke ${m.klasse || ""}"/>`;
  const anker = x > RS_RECHTS ? "end" : x < RS_LINKS ? "start" : "middle";   // außen: Text nach innen, damit er nicht abgeschnitten wird
  const tx = {end: x + 8, start: x - 8, middle: x}[anker];
  return spitze + iaText(tx, ty, m.text, `rs-text ${m.klasse || ""}`, anker) + `<line x1="${x.toFixed(1)}" y1="${y}" x2="${x.toFixed(1)}" y2="${ty + (m.oben ? 3 : -11)}" class="rs-faden"/>`;
}
function rsBand(d){
  if (!d.band) return "";
  const x1 = rsX(d, d.band.von), x2 = rsX(d, d.band.bis);
  return `<rect x="${x1.toFixed(1)}" y="${RS_Y - 6}" width="${Math.max(2, x2 - x1).toFixed(1)}" height="12" rx="3" class="rs-band"/>`;
}
function rsBogen(d){
  if (!d.bogen) return "";
  const x1 = rsX(d, d.bogen.von), x2 = rsX(d, d.bogen.nach), unten = RS_Y + 66;
  return `<path d="M${x1.toFixed(1)} ${RS_Y + 6} C${x1.toFixed(1)} ${unten} ${x2.toFixed(1)} ${unten} ${x2.toFixed(1)} ${RS_Y + 12}" class="rs-bogen"/>`
    + `<path d="M${x2.toFixed(1)} ${RS_Y + 10} l-5 9 h10 z" class="rs-spitze"/>` + iaText((x1 + x2) / 2, unten - 2, "Überlauf: Das Bitmuster läuft herum", "rs-text warn");
}
export function reStrahlSVG(d){
  const aussen = `<line x1="${RS_LINKS - RS_AUSSEN}" y1="${RS_Y}" x2="${RS_RECHTS + RS_AUSSEN}" y2="${RS_Y}" class="rs-aussen"/>`;
  const strahl = `<line x1="${RS_LINKS}" y1="${RS_Y}" x2="${RS_RECHTS}" y2="${RS_Y}" class="rs-linie"/>`;
  const inhalt = aussen + rsBand(d) + strahl + d.striche.map(s => rsStrich(d, s)).join("") + rsBogen(d) + d.marken.map(m => rsMarke(d, m)).join("");
  return iaSvg(RS_RECHTS + RS_AUSSEN + 10, d.bogen ? 160 : 136, inhalt, "Zahlenstrahl");
}
