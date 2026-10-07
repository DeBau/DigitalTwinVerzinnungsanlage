/* ---------- Interaktive Erklärung: Flankenauswertung über Zyklen ---------- */
// Platzhalter: <div data-interaktiv="flanke" data-art="P,N,PSPULE,NSPULE,P_TRIG,N_TRIG,R_TRIG,F_TRIG" data-e="SF1"
//   data-q="startPulse" data-m="edgeMemStart"></div>
// art: eine oder mehrere Flankenanweisungen der S7-1500 (mehrere: Umschalter), dazu HAND (Flanke von Hand in SCL,
// z. B. data-art="HAND" data-se="#start" data-sq="#startPulse" data-sm="#statStartOld"). e: abgefragtes Signal, q: Ergebnis,
// m: Flankenmerker (bei P bis N_TRIG). Optional: i (Name der Multiinstanz bei R_TRIG und F_TRIG; ohne i gilt m,
// sonst instTrig), se, sq, sm (Namen in SCL). Ist q der Ausgang der Instanz selbst (data-q="instStartTrig.Q"), bleibt Q
// unbeschaltet, und SCL fragt #instStartTrig.Q ab.
// Der Eingang wird angeklickt, die Anweisung erst mit „Nächster Zyklus“ oder beim Abspielen bearbeitet:
// Q = Eingang UND NICHT Flankenmerker (fallend: NICHT Eingang UND Flankenmerker), danach Flankenmerker = Eingang.
// Abspielen läuft mit einem Zeitgeber je Erklärung; er endet, sobald die Erklärung nicht mehr auf der Seite steht.
import { esc } from '../basis.js';
import { iaKurz, iaName, iaRegistrieren, iaSignalKnopf, iaZeichnen } from './basis.js';
import { spSpurName } from './speicher.js';
import { flBildSVG } from './flanke-bild.js';
import { signalverlaufSVG } from './signalverlauf.js';

// Namen und Symbole wie in der TIA-Hilfe V21. typ: Bildart in flanke-bild.js, neg: fallende Flanke
const FL_ARTEN = {
  P: {typ: "kontakt", zeichen: "P", kop: "-|P|-", fup: "P", name: "Operand auf positive Signalflanke abfragen"},
  N: {typ: "kontakt", zeichen: "N", neg: true, kop: "-|N|-", fup: "N", name: "Operand auf negative Signalflanke abfragen"},
  PSPULE: {typ: "spule", zeichen: "P", kop: "-(P)-", fup: "P=", name: "Operand bei positiver Signalflanke setzen"},
  NSPULE: {typ: "spule", zeichen: "N", neg: true, kop: "-(N)-", fup: "N=", name: "Operand bei negativer Signalflanke setzen"},
  P_TRIG: {typ: "trig", box: "P_TRIG", kop: "P_TRIG", fup: "P_TRIG", name: "VKE auf positive Signalflanke abfragen"},
  N_TRIG: {typ: "trig", box: "N_TRIG", neg: true, kop: "N_TRIG", fup: "N_TRIG", name: "VKE auf negative Signalflanke abfragen"},
  R_TRIG: {typ: "fb", fb: "R_TRIG", kop: "R_TRIG", fup: "R_TRIG", name: "Positive Signalflanke erkennen"},
  F_TRIG: {typ: "fb", fb: "F_TRIG", neg: true, kop: "F_TRIG", fup: "F_TRIG", name: "Negative Signalflanke erkennen"},
  // Keine Anweisung aus TIA: zwei SCL-Zeilen mit einer statischen Variablen als Flankenmerker (nur SCL)
  HAND: {typ: "hand", kop: "Von Hand", fup: "Von Hand", name: "Flanke von Hand in SCL"},
};
// Was die Anweisung abfragt und wo ihr Flankenmerker liegt
const FL_TYP_TEXT = {
  kontakt: "Die Anweisung fragt den Operanden darüber ab. Den Flankenmerker schreibst du darunter: ein eigenes Bit im Merkerbereich oder in einem DB, im FB eine Static-Variable.",
  spule: "Die Anweisung fragt das VKE davor ab und setzt den Operanden darüber für einen Zyklus auf 1. Den Flankenmerker schreibst du darunter: ein eigenes Bit im Merkerbereich oder in einem DB, im FB eine Static-Variable.",
  trig: "Die Box fragt das VKE an CLK ab und liefert an Q das Ergebnis. Den Flankenmerker schreibst du unter die Box: ein eigenes Bit im Merkerbereich oder in einem DB.",
  hand: "Die erste Zeile vergleicht den Eingang jetzt mit dem alten Wert. Die zweite Zeile merkt sich den Eingang für den nächsten Zyklus. Die Reihenfolge ist wichtig: Stünde das Merken zuerst, wäre der alte Wert immer gleich dem Eingang und Q nie 1. Die statische Variable mit der Endung Old (alter Wert) ist der Flankenmerker, so benennt sie der Siemens-Styleguide.",
  fb: "R_TRIG und F_TRIG sind Funktionsbausteine. Den Flankenmerker speichern sie selbst in ihrer Instanz. Du gibst ihnen nur eine eigene Instanz, am besten eine Multiinstanz.",
};
// Warum Q jetzt so ist. Schlüssel: Eingang jetzt und Flankenmerker (vorige Abfrage), z. B. „10“
const FL_GRUND = {
  steigend: {
    "10": "Steigende Flanke: Der Eingang ist jetzt 1, im Flankenmerker steht noch die 0 der vorigen Abfrage. Q = 1, aber nur in diesem einen Zyklus. Jetzt speichert der Flankenmerker die 1.",
    "11": "Der Eingang ist 1 und war schon 1: kein Wechsel, Q = 0. Auch wenn du den Taster hältst, entsteht keine neue Flanke.",
    "00": "Der Eingang ist 0 und war 0: kein Wechsel, Q = 0.",
    "01": "Der Eingang ist von 1 auf 0 gefallen. Das ist eine fallende Flanke. Diese Anweisung wertet aber die steigende aus: Q = 0.",
  },
  fallend: {
    "01": "Fallende Flanke: Der Eingang ist jetzt 0, im Flankenmerker steht noch die 1 der vorigen Abfrage. Q = 1, aber nur in diesem einen Zyklus. Jetzt speichert der Flankenmerker die 0.",
    "00": "Der Eingang ist 0 und war schon 0: kein Wechsel, Q = 0.",
    "11": "Der Eingang ist 1 und war 1: kein Wechsel, Q = 0.",
    "10": "Der Eingang ist von 0 auf 1 gestiegen. Das ist eine steigende Flanke. Diese Anweisung wertet aber die fallende aus: Q = 0.",
  },
};
const FL_WISSEN = [
  ["Steigend und fallend", "Eine steigende (positive) Flanke ist der Wechsel von 0 auf 1, eine fallende (negative) Flanke der Wechsel von 1 auf 0. P, R_TRIG und die anderen positiven Anweisungen erkennen den Wechsel 0 auf 1, N, F_TRIG und die anderen negativen den Wechsel 1 auf 0."],
  ["Warum eine Flanke?", "Das Programm läuft in jedem Zyklus. Fragst du einen Taster direkt ab, ist er in jedem Zyklus 1, solange du drückst: bei 10 ms Zykluszeit hundertmal in der Sekunde. Mit einer Flanke wertest du den Tastendruck genau einmal aus, zum Beispiel um einen Befehl einmal zu starten oder einen Zähler um 1 zu erhöhen."],
  ["Flankenmerker", "Er speichert den Signalzustand der vorigen Abfrage. Die Anweisung vergleicht den aktuellen Zustand mit ihm und schreibt danach den aktuellen Zustand hinein. Trotz des Namens muss er kein Merker (M) sein: Bei P, N, P=, N= liegt er in einem DB (im FB im Bereich Static) oder im Merkerbereich, bei P_TRIG und N_TRIG im Merkerbereich oder in einem DB. Bei R_TRIG und F_TRIG steckt er in der Instanz."],
  ["Je Flanke ein eigener Flankenmerker", "Die TIA-Hilfe sagt: Die Adresse des Flankenmerkers darf nicht mehrfach im Programm verwendet werden, sonst wird das Bit überschrieben und das Ergebnis ist nicht mehr eindeutig. Zwei Flanken mit demselben Merker stören sich: Die erste schreibt den aktuellen Zustand hinein, die zweite sieht dann keinen Wechsel mehr. Genauso braucht jeder Aufruf von R_TRIG oder F_TRIG eine eigene Instanz."],
  ["Bit-Flanke und Instanz-Flanke", "P, N, P=, N=, P_TRIG und N_TRIG brauchen den Flankenmerker als eigenen Operanden, ein einzelnes Bit. R_TRIG und F_TRIG sind Funktionsbausteine: Der Flankenmerker liegt in ihrer Instanz. In SCL gibt es nur R_TRIG und F_TRIG."],
  ["Multiinstanz: die Empfehlung von Siemens", "Der Siemens-Programmierleitfaden empfiehlt Multiinstanzen, unter anderem für lokale Flankenauswertungen, und Datenbausteine statt Merker. Der Styleguide sagt: Multiinstanzen statt Einzelinstanzen, mit dem Präfix inst (z. B. <code>#instStartTrig</code>). Eine Multiinstanz liegt im Bereich Static deines FB. Eine Einzelinstanz bekommt einen eigenen Instanz-DB (z. B. <code>\"R_TRIG_DB\"</code>)."],
  ["In jedem Zyklus bearbeiten", "Die Anweisung vergleicht bei jeder Bearbeitung mit der vorigen Abfrage. Bearbeitet die CPU sie nur unter einer Bedingung, ist die vorige Abfrage alt. Dann meldet sie die Flanke zu spät oder gar nicht."],
];
const FL_ANSICHTEN = ["KOP", "FUP", "SCL"];
const FL_INSTANZ = {multi: "Multiinstanz", einzel: "Einzelinstanz"};
const FL_TAKT = 900;   // Abspielen: alle 900 ms ein Zyklus
const FL_UHR = new Map();

/* ---------- Zustand und Zyklus ---------- */
function flankeNeu(at){
  const arten = (at.art || "R_TRIG").split(",").filter(a => FL_ARTEN[a]);
  const namen = {e: at.e || "E", q: at.q || "Q", m: at.m || "M", i: at.i || at.m || "instTrig"};
  const qIntern = namen.q === `${namen.i}.Q`, mIstInstanz = !at.i && !!at.m;
  // Für die Flanke von Hand braucht SCL eigene Variablen, wenn q und m zur Instanz gehören
  const scl = {e: at.se || `"${namen.e}"`, q: at.sq || flSclName(qIntern, "#statEdgePulse", namen.q),
    m: at.sm || flSclName(mIstInstanz, "#statEdgeMem", namen.m)};
  // wahl: gewählte Anweisung (z.art ist schon belegt, dort steht die Art der Erklärung „flanke“)
  const z = {arten, wahl: arten[0], namen, scl, qIntern, instanz: "multi", ansicht: "KOP", laeuft: false, ...flStart()};
  flAnsichtPruefen(z);
  return z;
}
// Gibt es die Ansicht für die gewählte Anweisung nicht (HAND: nur SCL), gilt die erste mögliche
function flAnsichtPruefen(z){
  if (!flAnsichten(z).includes(z.ansicht)) z.ansicht = flAnsichten(z)[0];
}
const flSclName = (eigen, ersatz, name) => eigen ? ersatz : `"${name}"`;
const flStart = () => ({e: 0, m: 0, mVor: 0, q: 0, zyklus: 0, geaendert: false, verlauf: []});
const flDef = z => FL_ARTEN[z.wahl];
const flRichtung = z => flDef(z).neg ? "fallend" : "steigend";
// Q aus dem Eingang jetzt (e) und dem Flankenmerker der vorigen Abfrage (m)
const FL_ERGEBNIS = {steigend: (e, m) => e && !m, fallend: (e, m) => !e && m};
// Ein Zyklus: vergleichen, Q bilden, dann den aktuellen Zustand in den Flankenmerker schreiben
function flZyklus(z){
  z.mVor = z.m;
  z.q = FL_ERGEBNIS[flRichtung(z)](z.e, z.mVor) ? 1 : 0;
  z.m = z.e;
  z.zyklus++; z.geaendert = false;
  z.verlauf.push({e: z.e, m: z.mVor, q: z.q});
}
function flInstanzName(z){
  return z.instanz === "multi" ? "#" + z.namen.i : `"${flDef(z).fb}_DB"`;
}

/* ---------- Abspielen ---------- */
function flAnhalten(z){ clearInterval(FL_UHR.get(z.id)); FL_UHR.delete(z.id); z.laeuft = false; }
function flAbspielen(z){
  z.laeuft = true;
  FL_UHR.set(z.id, setInterval(() => { flZyklus(z); if (!iaZeichnen(z.id)) flAnhalten(z); }, FL_TAKT));
}

/* ---------- SCL ---------- */
function flVonHand(z){
  const {e, q, m} = z.scl;
  const formel = flDef(z).neg ? `NOT ${e} AND ${m}` : `${e} AND NOT ${m}`;
  return `${q} := ${formel};\n${m} := ${e};`;
}
// Name des Ergebnisses in SCL: beim Instanzaufruf mit Q der Instanz deren Ausgang, sonst der eigene Operand
function flSclQ(z, aufruf){
  return aufruf && z.qIntern ? `${flInstanzName(z)}.Q` : z.scl.q;
}
function flSclStatus(z, aufruf){
  const bool = w => w ? "TRUE" : "FALSE";
  const merker = flDef(z).typ === "hand" ? z.scl.m : "Flankenmerker";
  const zeilen = [[z.scl.e, bool(z.e), z.e], [flSclQ(z, aufruf), bool(z.q), z.q], [merker, `${bool(z.mVor)} → ${bool(z.m)}`, z.m]];
  const zeile = ([name, text, w]) => `<tr class="${w ? "an" : "aus"}"><td>${esc(name)}</td><td>${text}</td></tr>`;
  return `<table class="ia-scl-status"><thead><tr><th>Variable</th><th>Wert</th></tr></thead><tbody>${zeilen.map(zeile).join("")}</tbody></table>`;
}
// Aufruf der Instanz wie in der TIA-Hilfe; mit Q der Instanz bleibt Q unbeschaltet und wird danach abgefragt
function flAufruf(z){
  const inst = flInstanzName(z);
  if (z.qIntern) return `${inst}(CLK := ${z.scl.e});\nIF ${inst}.Q THEN\n    // genau ein Zyklus je Flanke\nEND_IF;`;
  return `${inst}(CLK := ${z.scl.e},\n${" ".repeat(inst.length + 1)}Q => ${z.scl.q});`;
}
const flHandCode = z => `<pre class="ia-scl"><code>${esc(flVonHand(z))}</code></pre>`;
// SCL je Bildart: Bit-Flanken gibt es dort nicht, R_TRIG und F_TRIG als Instanzaufruf, HAND nur von Hand
const FL_SCL = {
  bit: z => `<p class="small"><b>${flDef(z).kop}</b> gibt es in SCL nicht. In SCL nimmst du ${flDef(z).neg ? "F_TRIG" : "R_TRIG"} als Multiinstanz oder schreibst die Flanke von Hand mit dem Flankenmerker:</p>`
    + `<div class="ia-scl-wrap">${flHandCode(z)}${flSclStatus(z, false)}</div>`,
  fb: z => `<div class="ia-scl-wrap"><pre class="ia-scl"><code>${esc(flAufruf(z))}</code></pre>${flSclStatus(z, true)}</div>`
    + `<p class="small"><b>Von Hand</b> geht es auch, mit einer statischen Variablen als Flankenmerker:</p>${flHandCode(z)}`,
  hand: z => `<div class="ia-scl-wrap">${flHandCode(z)}${flSclStatus(z, false)}</div><p class="small muted">${FL_TYP_TEXT.hand}</p>`,
};
const flSclHTML = z => (FL_SCL[flDef(z).typ] || FL_SCL.bit)(z);

/* ---------- HTML ---------- */
function flUmschalter(liste, aktiv, akt, text = x => x){
  if (liste.length < 2) return "";
  return `<div class="ia-tabs">${liste.map(x => `<button type="button" data-ia-akt="${akt}:${x}" aria-pressed="${x === aktiv}">${text(x)}</button>`).join("")}</div>`;
}
function flTitel(z){
  const d = flDef(z), symbol = z.ansicht === "FUP" ? d.fup : d.kop;
  if (d.typ === "hand") return `<div class="sp-name">${d.name}</div>`;
  return `<div class="sp-name">${esc(symbol)}: ${d.name}</div>`;
}
// Die Flanke von Hand gibt es nur in SCL
const flAnsichten = z => flDef(z).typ === "hand" ? ["SCL"] : FL_ANSICHTEN;
function flBildHTML(z){
  const d = flDef(z), instanz = d.typ === "fb" ? flUmschalter(Object.keys(FL_INSTANZ), z.instanz, "instanz", k => FL_INSTANZ[k]) : "";
  const kopf = `<div class="fl-bildkopf">${flUmschalter(flAnsichten(z), z.ansicht, "ansicht")}${instanz}</div>`;
  if (z.ansicht === "SCL") return kopf + flSclHTML(z);
  // Q der Instanz selbst steht nicht an Q: Der Ausgang bleibt unbeschaltet
  const qBild = z.qIntern && d.typ === "fb" ? "" : iaKurz(z.namen.q);
  const n = {e: iaKurz(z.namen.e), q: qBild, m: iaKurz(z.namen.m), inst: flInstanzName(z)};
  return kopf + flBildSVG(z.ansicht, {e: z.e, q: z.q}, n, d) + `<p class="small muted">${FL_TYP_TEXT[d.typ]}</p>`;
}
// Wo der Flankenmerker steht, je Bildart
const FL_MERKER_NAME = {bit: z => iaName(z.namen.m), fb: () => "in der Instanz", hand: z => esc(z.scl.m)};
// Die drei Werte des letzten Zyklus nebeneinander: Eingang, Flankenmerker (vorige Abfrage), Q
function flStandHTML(z){
  const feld = (titel, name, wert) => `<div class="zy-st${wert ? " an" : ""}"><span class="t">${titel}</span><span class="n">${name}</span><b>${wert}</b></div>`;
  const merker = (FL_MERKER_NAME[flDef(z).typ] || FL_MERKER_NAME.bit)(z);
  return `<div class="fl-stand">${feld("Eingang", iaName(z.namen.e), z.e)}<i>vergleicht mit</i>${feld("Flankenmerker vorher", merker, z.mVor)}<i>ergibt</i>`
    + `${feld("Q", iaName(z.namen.q), z.q)}<span class="fl-zyklus">Zyklus ${z.zyklus}</span></div>`;
}
function flSatzHTML(z){
  if (z.geaendert || !z.zyklus) {
    return `<div class="ia-satz">Du hast den Eingang auf ${z.e} gestellt. Die Anweisung sieht das erst, wenn die CPU sie bearbeitet: Drücke <b>Nächster Zyklus</b> oder <b>Abspielen</b>.</div>`;
  }
  return `<div class="ia-satz ${z.q ? "an" : "aus"}"><b>Q = ${z.q}:</b> ${FL_GRUND[flRichtung(z)][`${z.e}${z.mVor}`]}</div>`;
}
function flSteuerHTML(z){
  const knopf = (akt, t, prim) => `<button type="button" class="btn small${prim ? " primary" : ""}" data-ia-akt="${akt}">${t}</button>`;
  const spiel = z.laeuft ? knopf("pause", "Anhalten") : knopf("abspielen", "Abspielen", true);
  return `<div class="zy-knoepfe">${knopf("zyklus", "Nächster Zyklus", !z.laeuft)}${spiel}</div>`;
}
function flVerlaufHTML(z){
  const spur = (k, name) => ({name, werte: z.verlauf.map(v => v[k])});
  const svg = signalverlaufSVG([spur("e", spSpurName(z.namen.e, "E")), spur("m", flDef(z).typ === "hand" ? spSpurName(z.scl.m, "Merker") : "Merker"), spur("q", spSpurName(z.namen.q, "Q"))], "Zyklen");
  return svg + `<p class="small muted">Spur Merker: was beim Vergleich im Flankenmerker stand, also der Eingang aus dem vorigen Zyklus. Q ist genau einen Zyklus lang 1.</p>`;
}
function flWissenHTML(){
  return `<details class="ia-begriffe"><summary>Wissen: steigend und fallend, warum Flanken, Flankenmerker, Multiinstanz</summary><dl>`
    + FL_WISSEN.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("") + `</dl></details>`;
}
function flankeHTML(z){
  const kopf = `<div class="ia-kopf"><b>Probier es aus:</b> Drücke den Taster und bearbeite Zyklus für Zyklus. Halte ihn gedrückt und sieh, wie lange Q 1 bleibt.`
    + flUmschalter(z.arten, z.wahl, "art", a => FL_ARTEN[a].kop) + `</div>`;
  const links = `<div class="ia-knoepfe">${iaSignalKnopf("e", z.namen.e, z.e)}${flSteuerHTML(z)}</div>`;
  return kopf + `<div class="sp-reihe">${links}<div class="ia-bild">${flTitel(z)}${flBildHTML(z)}</div></div>`
    + flStandHTML(z) + flSatzHTML(z)
    + `<div class="ia-verlauf"><div class="ia-verlauf-kopf"><b>Signalverlauf über die Zyklen</b><button type="button" data-ia-akt="leeren">Neu beginnen</button></div>${flVerlaufHTML(z)}</div>`
    + flWissenHTML();
}

/* ---------- Bedienen ---------- */
const FL_AKTION = {
  e: z => { z.e = z.e ? 0 : 1; z.geaendert = true; },
  zyklus: z => flZyklus(z),
  abspielen: z => flAbspielen(z),
  pause: z => flAnhalten(z),
  art: (z, a) => { z.wahl = a; Object.assign(z, flStart()); flAnsichtPruefen(z); },
  ansicht: (z, a) => { z.ansicht = a; },
  instanz: (z, a) => { z.instanz = a; },
  leeren: z => { z.verlauf = []; },
};
iaRegistrieren("flanke", {
  neu: flankeNeu,
  html: flankeHTML,
  aktion: (z, akt) => { const [name, wert] = akt.split(":"); FL_AKTION[name](z, wert); },
});
