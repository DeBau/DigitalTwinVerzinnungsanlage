/* ---------- Interaktive Erklärung: Verknüpfung (UND, ODER, NICHT, XOR) ---------- */
// Platzhalter: <div data-interaktiv="logik" data-op="UND,ODER,NICHT,XOR" data-a="BG9" data-b="BG10" data-q="PF2"
//   data-sa="#temperatureOk" data-sb="#levelOk" data-sq="#lampBathReady"></div>
// op: eine oder mehrere Verknüpfungen (mehrere: Umschalter). a, b, q: Operanden im Bild. sa, sb, sq: Namen in SCL (optional).
// Klick auf die Eingänge schaltet sie um; Bild (FUP, KOP, SCL), Funktionstabelle, Signalverlauf und Erklärung folgen.
import { esc } from '../basis.js';
import { iaKurz, iaName, iaRegistrieren, iaSignalKnopf } from './basis.js';
import { fupSVG, kopSVG } from './logik-bild.js';
import { signalverlaufSVG } from './signalverlauf.js';

const A = {sig: "a"}, B = {sig: "b"}, NA = {sig: "a", neg: true}, NB = {sig: "b", neg: true};
const LOGIK_OPS = {
  UND:   {fup: "&",  ein: [A, B], kop: [[A, B]],          scl: n => `${n.a} AND ${n.b}`, f: (a, b) => a && b},
  ODER:  {fup: ">=1", ein: [A, B], kop: [[A], [B]],        scl: n => `${n.a} OR ${n.b}`,  f: (a, b) => a || b},
  NICHT: {fup: null, ein: [NA],    kop: [[NA]],            scl: n => `NOT ${n.a}`,         f: a => !a},
  XOR:   {fup: "X",  ein: [A, B], kop: [[A, NB], [NA, B]], scl: n => `${n.a} XOR ${n.b}`, f: (a, b) => a !== b},
};
const LOGIK_GRUND = {
  UND:   (a, b, q) => q ? "Beide Eingänge sind 1." : "Mindestens ein Eingang ist 0.",
  ODER:  (a, b, q) => q ? "Mindestens ein Eingang ist 1." : "Kein Eingang ist 1.",
  NICHT: (a, b, q) => q ? "Der Eingang ist 0, die Negation macht daraus 1." : "Der Eingang ist 1, die Negation macht daraus 0.",
  XOR:   (a, b, q) => q ? "Genau ein Eingang ist 1." : a ? "Beide Eingänge sind 1." : "Kein Eingang ist 1.",
};
const LOGIK_ANSICHTEN = ["FUP", "KOP", "SCL"];
const LOGIK_BEGRIFFE = [
  ["Signalzustand", "Der Wert eines Operanden: 0 oder 1."],
  ["VKE", "Verknüpfungsergebnis: das Ergebnis der Verknüpfung bis zu dieser Stelle. Die Zuweisung schreibt das VKE in den Operanden rechts."],
  ["Programmstatus", "In TIA mit <i>Beobachten ein/aus</i> (Brille): erfüllt grün durchgezogen, nicht erfüllt blau gestrichelt. So sieht auch das Bild oben aus."],
];

const zweiEin = z => LOGIK_OPS[z.op].ein.length > 1;
const ergebnis = z => LOGIK_OPS[z.op].f(z.a, z.b) ? 1 : 0;

function logikNeu(at){
  const ops = (at.op || "UND").split(",").filter(o => LOGIK_OPS[o]);
  const namen = {a: at.a || "A", b: at.b || "B", q: at.q || "Q"};
  const scl = {a: at.sa || `"${namen.a}"`, b: at.sb || `"${namen.b}"`, q: at.sq || `"${namen.q}"`};
  return {ops, op: ops[0], namen, scl, a: 0, b: 0, ansicht: "FUP", verlauf: []};
}
function schritt(z){ z.verlauf.push({a: z.a, b: z.b, q: ergebnis(z)}); }

/* ---------- HTML ---------- */
function umschalter(liste, aktiv, akt){
  if (liste.length < 2) return "";
  return `<div class="ia-tabs">${liste.map(x => `<button type="button" data-ia-akt="${akt}:${x}" aria-pressed="${x === aktiv}">${x}</button>`).join("")}</div>`;
}
function sclHTML(z){
  const wert = (name, w) => `<span class="ia-scl-op ${w ? "an" : "aus"}" title="Signalzustand ${w}">${esc(name)}<sub>${w}</sub></span>`;
  const n = {a: wert(z.scl.a, z.a), b: wert(z.scl.b, z.b)};
  return `<pre class="ia-scl"><code>${wert(z.scl.q, ergebnis(z))} := ${LOGIK_OPS[z.op].scl(n)};</code></pre>`
    + `<p class="small muted">In SCL steht die Verknüpfung als Zeile. Die kleinen Zahlen zeigen den Signalzustand, wie in TIA im Programmstatus.</p>`;
}
function bildHTML(z){
  const werte = {a: z.a, b: z.b, q: ergebnis(z)};
  if (z.ansicht === "SCL") return sclHTML(z);
  const namen = {a: iaKurz(z.namen.a), b: iaKurz(z.namen.b), q: iaKurz(z.namen.q)};
  return z.ansicht === "KOP" ? kopSVG(LOGIK_OPS[z.op], werte, namen) : fupSVG(LOGIK_OPS[z.op], werte, namen);
}
function tabelleHTML(z){
  const zeilen = zweiEin(z) ? [[0, 0], [0, 1], [1, 0], [1, 1]] : [[0, 0], [1, 0]];
  const kopf = `<tr><th>${iaName(z.namen.a)}</th>${zweiEin(z) ? `<th>${iaName(z.namen.b)}</th>` : ""}<th>${iaName(z.namen.q)}</th></tr>`;
  const zeile = ([a, b]) => {
    const aktiv = a === z.a && (!zweiEin(z) || b === z.b), q = LOGIK_OPS[z.op].f(a, b) ? 1 : 0;
    return `<tr class="${aktiv ? "aktiv" : ""}" data-ia-akt="setze:${a}${b}"><td>${a}</td>${zweiEin(z) ? `<td>${b}</td>` : ""}<td><b>${q}</b></td></tr>`;
  };
  return `<table class="ia-tab"><thead>${kopf}</thead><tbody>${zeilen.map(zeile).join("")}</tbody></table>`;
}
function logikVerlaufHTML(z){
  const spur = (k, name) => ({name, werte: z.verlauf.map(s => s[k])});
  const spuren = [spur("a", z.namen.a), ...(zweiEin(z) ? [spur("b", z.namen.b)] : []), spur("q", z.namen.q)];
  return signalverlaufSVG(spuren, "Klicks");
}
function erklaerungHTML(z){
  const q = ergebnis(z);
  return `<div class="ia-satz ${q ? "an" : "aus"}"><b>VKE = ${q}:</b> ${LOGIK_GRUND[z.op](z.a, z.b, q)} Die Zuweisung schreibt ${q} nach ${iaName(z.namen.q)}.</div>`;
}
function logikBegriffeHTML(){
  return `<details class="ia-begriffe"><summary>Begriffe: Signalzustand, VKE, Programmstatus</summary><dl>`
    + LOGIK_BEGRIFFE.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("") + `</dl></details>`;
}
function logikHTML(z){
  const knoepfe = iaSignalKnopf("a", z.namen.a, z.a) + (zweiEin(z) ? iaSignalKnopf("b", z.namen.b, z.b) : "");
  const kopf = `<div class="ia-kopf"><b>Probier es aus:</b> Klicke auf die Eingänge.${umschalter(z.ops, z.op, "op")}</div>`;
  return kopf + `<div class="ia-reihe"><div class="ia-knoepfe">${knoepfe}</div><div class="ia-bild">${umschalter(LOGIK_ANSICHTEN, z.ansicht, "ansicht")}${bildHTML(z)}</div>`
    + `<div class="ia-rechts">${tabelleHTML(z)}</div></div>` + erklaerungHTML(z)
    + `<div class="ia-verlauf"><div class="ia-verlauf-kopf"><b>Signalverlauf</b><button type="button" data-ia-akt="leeren">Neu beginnen</button></div>${logikVerlaufHTML(z)}</div>`
    + logikBegriffeHTML();
}

/* ---------- Bedienen ---------- */
const LOGIK_AKTION = {
  a: z => { z.a = z.a ? 0 : 1; schritt(z); },
  b: z => { z.b = z.b ? 0 : 1; schritt(z); },
  setze: (z, w) => { z.a = +w[0]; z.b = +w[1]; schritt(z); },
  op: (z, w) => { z.op = w; z.verlauf = []; schritt(z); },
  ansicht: (z, w) => { z.ansicht = w; },
  leeren: z => { z.verlauf = []; schritt(z); },
};
function logikAktion(z, akt){
  const [name, wert] = akt.split(":");
  LOGIK_AKTION[name](z, wert);
}
iaRegistrieren("logik", {
  neu: at => { const z = logikNeu(at); schritt(z); return z; },
  html: logikHTML,
  aktion: logikAktion,
});
