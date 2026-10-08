/* ---------- Interaktive Erklärungen: Bilder für den Analogwert ---------- */
// anKetteSVG: Sensor → Messumformer → Analogeingabebaugruppe → Eingangswort, mit Messwert, Strom und Rohwert.
// anSkalaSVG: die Bereiche des Rohwerts (Unterlauf bis Überlauf) als Band, nicht maßstäblich, mit Marke für den Rohwert.
// anKennlinieSVG: die Gerade Rohwert → Messgröße mit Nennbereich und Punkt für den aktuellen Rohwert.
import { iaSvg, iaText } from './basis.js';
import { AN_BEREICHE, AN_NENN, anBereich, anHex } from './analog-modell.js';
import { zfZahlText } from './zahl-modell.js';

const anZahl = v => zfZahlText(v).replace("-", "−");
const anKomma = (v, stellen) => v.toFixed(stellen).replace(".", ",").replace("-", "−");

/* ---------- Kette ---------- */
const AK_KAESTEN = [
  {x: 0, b: 132, titel: k => k.sensor, zeile: k => `${anKomma(k.wert, 1)} ${k.einheit}`},
  {x: 172, b: 132, titel: () => "Messumformer", zeile: k => k.drahtbruch ? "kein Strom" : `${anKomma(k.strom, 2)} mA`},
  {x: 344, b: 132, titel: () => "Analogeingabe", zeile: () => "Baugruppe AI"},
  {x: 516, b: 132, titel: k => k.adresse, zeile: k => `${anZahl(k.roh)} (${anHex(k.roh)})`},
];
function akKasten(k, d){
  const mitte = d.x + d.b / 2;
  return `<rect x="${d.x}" y="22" width="${d.b}" height="58" rx="6" class="an-kasten"/>`
    + iaText(mitte, 45, d.titel(k), "an-titel") + iaText(mitte, 67, d.zeile(k), "ia-op");
}
function akDraht(von, nach, text, bruch){
  const x1 = von.x + von.b, x2 = nach.x, mitte = (x1 + x2) / 2, klasse = bruch ? "an-bruch" : "an-draht";
  const zeichen = bruch ? iaText(mitte, 56, "✕", "an-bruch-text") : `<path d="M${x2 - 8} 46 l8 5 l-8 5 z" class="an-spitze"/>`;
  return `<line x1="${x1}" y1="51" x2="${x2}" y2="51" class="${klasse}"/>` + zeichen + iaText(mitte, 100, text, "an-klein");
}
export function anKetteSVG(k){
  const [s, m, ai, iw] = AK_KAESTEN;
  const draehte = akDraht(s, m, "Messgröße", false) + akDraht(m, ai, k.drahtbruch ? "Drahtbruch" : "4 bis 20 mA", k.drahtbruch)
    + akDraht(ai, iw, "Rohwert Int", false);
  const titel = iaText(s.x, 12, "Sensor", "an-klein", "start") + iaText(iw.x + iw.b, 12, "Eingangswort im Programm", "an-klein", "end");
  return iaSvg(648, 108, titel + AK_KAESTEN.map(d => akKasten(k, d)).join("") + draehte, "Weg des Messwerts vom Sensor zum Rohwert");
}

/* ---------- Skala der Rohwerte ---------- */
const AS_BREITE = {"Unterlauf": 74, "Untersteuerung": 104, "Nennbereich": 220, "Übersteuerung": 104, "Überlauf": 74};
const AS_KLASSE = b => b.gueltig ? "an-nenn" : b.von === b.bis ? "an-fehler" : "an-rand";
const asText = b => b.von === b.bis ? anZahl(b.von) : `${anZahl(b.von)} … ${anZahl(b.bis)}`;
function asTeile(){
  let x = 4;
  return [...AN_BEREICHE].reverse().map(b => { const t = {b, x, breite: AS_BREITE[b.name]}; x += t.breite; return t; });
}
// Lage der Marke: im Bereich anteilig, in Unterlauf und Überlauf in der Mitte
function asMarkeX(t, roh){
  if (t.b.von === t.b.bis) return t.x + t.breite / 2;
  return t.x + (roh - t.b.von) / (t.b.bis - t.b.von) * t.breite;
}
export function anSkalaSVG(roh){
  const teile = asTeile(), aktiv = anBereich(roh), t = teile.find(x => x.b === aktiv), mx = asMarkeX(t, roh).toFixed(1);
  const baender = teile.map(({b, x, breite}) => `<rect x="${x}" y="30" width="${breite}" height="22" class="${AS_KLASSE(b)}${b === aktiv ? " aktiv" : ""}"/>`
    + iaText(x + breite / 2, 24, b.name, b === aktiv ? "an-titel" : "an-klein") + iaText(x + breite / 2, 68, asText(b), "an-klein")).join("");
  const marke = `<line x1="${mx}" y1="26" x2="${mx}" y2="56" class="an-zeiger"/><path d="M${mx} 74 l-5 9 h10 z" class="an-marke"/>`
    + iaText(+mx, 98, `Rohwert ${anZahl(roh)}`, "ia-op");
  return iaSvg(584, 104, baender + marke, "Bereiche des Rohwerts");
}

/* ---------- Kennlinie ---------- */
const AL = {x0: 64, x1: 470, y0: 196, y1: 18, rohMax: 32767};
const alX = roh => AL.x0 + Math.max(0, Math.min(roh, AL.rohMax)) / AL.rohMax * (AL.x1 - AL.x0);
function alSkala(bis){
  const oben = bis * AL.rohMax / AN_NENN;
  return v => AL.y0 - Math.max(0, Math.min(v, oben)) / oben * (AL.y0 - AL.y1);
}
function alAchsen(bis, y, einheit){
  const xs = [0, AN_NENN / 2, AN_NENN], ys = [0, bis / 2, bis];
  return `<rect x="${AL.x0}" y="${AL.y1}" width="${alX(AN_NENN) - AL.x0}" height="${AL.y0 - AL.y1}" class="an-nennflaeche"/>`
    + `<line x1="${AL.x0}" y1="${AL.y0}" x2="${AL.x1}" y2="${AL.y0}" class="an-achse"/><line x1="${AL.x0}" y1="${AL.y0}" x2="${AL.x0}" y2="${AL.y1}" class="an-achse"/>`
    + xs.map(v => iaText(alX(v), AL.y0 + 16, anZahl(v), "an-klein")).join("")
    + ys.map(v => iaText(AL.x0 - 6, y(v) + 4, zfZahlText(v), "an-klein", "end")).join("")
    + iaText(AL.x1, AL.y0 + 32, "Rohwert", "an-klein", "end") + iaText(AL.x0 - 6, AL.y1 - 6, einheit, "an-klein", "end")
    + iaText((AL.x0 + alX(AN_NENN)) / 2, AL.y1 + 14, "Nennbereich", "an-klein");
}
function alPunkt(roh, wert, y, k){
  if (roh < 0 || roh > AL.rohMax - 1) return "";
  const px = alX(roh).toFixed(1), py = y(wert).toFixed(1);
  return `<line x1="${px}" y1="${AL.y0}" x2="${px}" y2="${py}" class="an-hilfe"/><line x1="${AL.x0}" y1="${py}" x2="${px}" y2="${py}" class="an-hilfe"/>`
    + `<circle cx="${px}" cy="${py}" r="5" class="an-punkt${k.gueltig ? "" : " warn"}"/>`
    + iaText(+px + 8, +py - 8, `${anZahl(roh)} → ${zfZahlText(wert)} ${k.einheit}`, "ia-op", +px > 330 ? "end" : "start");
}
export function anKennlinieSVG(k){
  const y = alSkala(k.bis), nennX = alX(AN_NENN), endeX = alX(32511), endeY = y(k.bis * 32511 / AN_NENN);
  const gerade = `<line x1="${AL.x0}" y1="${y(0)}" x2="${nennX}" y2="${y(k.bis)}" class="an-gerade"/>`
    + `<line x1="${nennX}" y1="${y(k.bis)}" x2="${endeX}" y2="${endeY}" class="an-gerade-rand"/>`;
  return iaSvg(480, 232, alAchsen(k.bis, y, k.einheit) + gerade + alPunkt(k.roh, k.wert, y, k), "Kennlinie Rohwert zu Messgröße");
}
