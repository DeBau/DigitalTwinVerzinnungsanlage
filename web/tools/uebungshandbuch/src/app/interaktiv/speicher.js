/* ---------- Interaktive Erklärung: Speichern mit SR-Box, RS-Box und Selbsthaltung ---------- */
// Platzhalter: <div data-interaktiv="speicher" data-art="SR,RS,SELBST" data-s="SF1" data-r="SF2" data-q="statReady"
//   data-ss="#start" data-sr="#stop" data-sq="#statReady"></div>
// art: eine oder mehrere von SR (rücksetzdominant, Eingänge S und R1), RS (setzdominant, Eingänge R und S1),
// SELBST (KOP-Selbsthaltung: Schließer S parallel zum Haltekontakt Q, in Reihe der Öffner R), SPULEN (Netzwerk 1 mit
// Spule ( S ) „Ausgang setzen“, Netzwerk 2 mit Spule ( R ) „Ausgang rücksetzen“ auf denselben Operanden). Mehrere: Umschalter.
// s, r: Operanden zum Setzen und Rücksetzen, q: Speicheroperand. ss, sr, sq: Namen in SCL (optional).
// Jeder Klick ist eine Bearbeitung der Anweisung: Q neu hängt von S, R und Q alt ab. Bild (FUP, KOP, SCL im
// Programmstatus), Funktionstabelle, Signalverlauf und ein Satz zum Warum folgen.
import { esc } from '../basis.js';
import { iaKurz, iaName, iaRegistrieren, iaSignalKnopf } from './basis.js';
import { spSelbstFup, spSelbstKop, spSpulenFup, spSpulenKop, spSrFup, spSrKop } from './speicher-bild.js';
import { signalverlaufSVG } from './signalverlauf.js';

// f: Q neu aus S, R und Q alt. pins: Eingänge der Box von oben, mit dem Namen in TIA.
const SP_ARTEN = {
  SR: {tab: "SR-Box", name: "SR: Flipflop setzen/rücksetzen", pins: [["s", "S"], ["r", "R1"]], f: (s, r, q) => (s || q) && !r,
    kop: spSrKop, fup: spSrFup, scl: z => [...spIf(z.scl.s, z.scl.q, "TRUE", z.s), ...spIf(z.scl.r, z.scl.q, "FALSE", z.r)]},
  RS: {tab: "RS-Box", name: "RS: Flipflop rücksetzen/setzen", pins: [["r", "R"], ["s", "S1"]], f: (s, r, q) => s || (q && !r),
    kop: spSrKop, fup: spSrFup, scl: z => [...spIf(z.scl.r, z.scl.q, "FALSE", z.r), ...spIf(z.scl.s, z.scl.q, "TRUE", z.s)]},
  SELBST: {tab: "Selbsthaltung", name: "Selbsthaltung in KOP", pins: [["s", "S"], ["r", "R"]], f: (s, r, q) => (s || q) && !r,
    kop: spSelbstKop, fup: spSelbstFup, scl: z => [{t: `${z.scl.q} := (${z.scl.s} OR ${z.scl.q}) AND NOT ${z.scl.r};`, an: null}]},
  // Netzwerk 1 setzt, Netzwerk 2 rücksetzt: Das Rücksetzen wird zuletzt bearbeitet und gewinnt
  SPULEN: {tab: "Spulen S und R", name: "Ausgang setzen ( S ) und Ausgang rücksetzen ( R )", pins: [["s", "S"], ["r", "R"]], f: (s, r, q) => (s || q) && !r,
    kop: spSpulenKop, fup: spSpulenFup, scl: z => [...spIf(z.scl.s, z.scl.q, "TRUE", z.s), ...spIf(z.scl.r, z.scl.q, "FALSE", z.r)]},
};
const SP_MIT_FALLE = new Set(["SR", "RS"]);
// Warum Q jetzt so ist. Schlüssel: S und R als „10“, n: Namen als Chips, q: Q neu
const SP_GRUND = {
  SR: {
    "00": (n, q) => `S und R1 sind 0. Die Box wird nicht ausgeführt, ${n.q} behält seinen Wert ${q}. Das ist das Speichern.`,
    "10": n => `S ist 1 und R1 ist 0: ${n.q} wird gesetzt, Q = 1.`,
    "01": n => `R1 ist 1 und S ist 0: ${n.q} wird zurückgesetzt, Q = 0.`,
    "11": n => `S und R1 gleichzeitig 1: Die SR-Box ist rücksetzdominant, R1 gewinnt. ${n.q} = 0.`,
  },
  RS: {
    "00": (n, q) => `R und S1 sind 0. Die Box wird nicht ausgeführt, ${n.q} behält seinen Wert ${q}. Das ist das Speichern.`,
    "10": n => `S1 ist 1 und R ist 0: ${n.q} wird gesetzt, Q = 1.`,
    "01": n => `R ist 1 und S1 ist 0: ${n.q} wird zurückgesetzt, Q = 0.`,
    "11": n => `R und S1 gleichzeitig 1: Die RS-Box ist setzdominant, S1 gewinnt. ${n.q} = 1.`,
  },
  SELBST: {
    "00": (n, q) => q ? `${n.s} und ${n.r} sind 0. Der Haltekontakt ${n.q} ist geschlossen und hält den Strompfad: Q bleibt 1. Das ist die Selbsthaltung.`
      : `${n.s} und ${n.r} sind 0. Weder ${n.s} noch der Haltekontakt ${n.q} ist geschlossen: Q bleibt 0.`,
    "10": n => `${n.s} schließt. Strom fließt über den geschlossenen Öffner von ${n.r} zur Spule: Q = 1. Damit schließt auch der Haltekontakt ${n.q}.`,
    "01": n => `Der Öffner von ${n.r} öffnet und unterbricht den Strompfad: Q = 0. Die Selbsthaltung ist aufgehoben.`,
    "11": n => `${n.s} und ${n.r} gleichzeitig 1: Der Öffner von ${n.r} liegt in Reihe hinter ${n.s} und unterbricht auch ihn. Rücksetzdominant, Q = 0.`,
  },
  SPULEN: {
    "00": (n, q) => `Vor beiden Spulen ist das VKE 0. Keine Spule wird ausgeführt, ${n.q} behält seinen Wert ${q}. Das ist das Speichern.`,
    "10": n => `Netzwerk 1: VKE 1 an der Spule ( S ), ${n.q} wird gesetzt. Netzwerk 2 tut nichts. Q = 1.`,
    "01": n => `Netzwerk 2: VKE 1 an der Spule ( R ), ${n.q} wird zurückgesetzt. Q = 0.`,
    "11": n => `Beide VKE sind 1. Die CPU bearbeitet die Netzwerke nacheinander: Netzwerk 1 setzt ${n.q} auf 1, Netzwerk 2 danach auf 0. Das zuletzt bearbeitete Netzwerk gewinnt, hier rücksetzdominant. Q = 0.`,
  },
};
const SP_SCL_TEXT = {
  SR: "Die Boxen SR und RS gibt es in SCL nicht. Du schreibst den Speicher mit zwei IF. Sind beide Bedingungen 1, werden beide Zuweisungen ausgeführt. Die untere überschreibt die obere: Wer zuletzt schreibt, dominiert. Hier steht das Rücksetzen unten, also rücksetzdominant wie die SR-Box.",
  RS: "Die Boxen SR und RS gibt es in SCL nicht. Du schreibst den Speicher mit zwei IF. Sind beide Bedingungen 1, werden beide Zuweisungen ausgeführt. Die untere überschreibt die obere: Wer zuletzt schreibt, dominiert. Hier steht das Setzen unten, also setzdominant wie die RS-Box.",
  SPULEN: "In SCL gibt es keine Spulen. Die zwei Netzwerke werden zwei IF in derselben Reihenfolge. Sind beide Bedingungen 1, überschreibt die untere Zuweisung die obere: Wer zuletzt schreibt, dominiert. Hier steht das Rücksetzen unten, also rücksetzdominant.",
  SELBST: "Die Selbsthaltung als eine Zeile: Setzen ODER der eigene Wert, UND NICHT Rücksetzen. Das AND NOT wirkt auf alles davor, deshalb ist sie rücksetzdominant. Rechts vom := steht der alte Wert, links wird der neue geschrieben.",
};
const SP_ANSICHTEN = ["FUP", "KOP", "SCL"];
const SP_BEGRIFFE = [
  ["Setzen", "Den Speicher auf 1 bringen. Er bleibt 1, auch wenn das Setzsignal wieder 0 wird."],
  ["Rücksetzen", "Den Speicher auf 0 bringen. Er bleibt 0, bis wieder gesetzt wird."],
  ["Dominanz", "Was gilt, wenn Setzen und Rücksetzen gleichzeitig 1 sind. Rücksetzdominant: Q wird 0 (SR-Box, Selbsthaltung mit dem Öffner in Reihe). Setzdominant: Q wird 1 (RS-Box). Bei den Spulen ( S ) und ( R ) entscheidet die Reihenfolge der Netzwerke. Die TIA-Hilfe schreibt dazu bei der SR-Box: Der Eingang R1 dominiert den Eingang S."],
  ["Speicher im Instanz-DB", "Den Speicheroperanden über der Box legst du im FB als statische Variable an (Bereich Static, z. B. <code>#statReady</code>). Statische Variablen stehen im Instanz-Datenbaustein. Sie bleiben erhalten, bis sie neu geschrieben werden, auch über mehrere Zyklen. Eine temporäre Variable (Temp) kann nichts speichern."],
  ["Remanenz", "Bei Spannungsausfall geht der Wert einer statischen Variablen normalerweise verloren, nach dem Anlauf gilt wieder ihr Startwert. Kennzeichnest du sie im FB als remanent (Spalte <i>Remanenz</i>), steht ihr Wert auch nach Spannungsausfall zur Verfügung."],
  ["Selbsthaltung", "Ein Kontakt des Ausgangs selbst (Haltekontakt) liegt parallel zum Einschaltkontakt. Ist der Ausgang einmal 1, hält er sich über diesen Kontakt selbst, auch wenn du den Taster loslässt. So schaltet man auch Schütze in der Elektrotechnik. In KOP brauchst du dafür keine Box."],
];
const SP_FALLE = `<div class="ia-satz warn"><b>Namensfalle:</b> Die SR-Box heißt in TIA „Flipflop setzen/rücksetzen“, die RS-Box „Flipflop rücksetzen/setzen“. Welcher Eingang gewinnt, zeigt die <b>1</b> am Eingang: Bei SR heißt der Rücksetzeingang <b>R1</b>, er dominiert, die Box ist rücksetzdominant. Bei RS heißt der Setzeingang <b>S1</b>, er dominiert, die Box ist setzdominant. Merke: Der zweite Buchstabe im Namen gewinnt.</div>`;
const SP_REIHENFOLGE = `<div class="ia-satz warn"><b>Dominanz durch Reihenfolge:</b> Die Spulen ( S ) und ( R ) haben keine eingebaute Dominanz. Jede wirkt nur, wenn ihr VKE 1 ist, sonst bleibt der Operand unverändert. Die CPU bearbeitet die Netzwerke von oben nach unten. Sind beide VKE im selben Zyklus 1, gilt der Wert des zuletzt bearbeiteten Netzwerks. Steht das Setzen unten, ist es setzdominant. Setzen und Rücksetzen an verstreuten Stellen sind schwer zu überblicken: Halte sie nah beieinander.</div>`;

/* ---------- Zustand ---------- */
function speicherNeu(at){
  const arten = (at.art || "SR").split(",").filter(a => SP_ARTEN[a]);
  const namen = {s: at.s || "S", r: at.r || "R", q: at.q || "Q"};
  const scl = {s: at.ss || `"${namen.s}"`, r: at.sr || `"${namen.r}"`, q: at.sq || `"${namen.q}"`};
  // wahl: gewählte Art (z.art ist schon belegt, dort steht die Art der Erklärung „speicher“)
  const z = {arten, wahl: arten[0], namen, scl, s: 0, r: 0, qAlt: 0, q: 0, ansicht: "FUP", verlauf: []};
  spMerken(z);
  return z;
}
// Eine Bearbeitung der Anweisung: Q alt ist der gespeicherte Wert, Q neu folgt aus S, R und Q alt
function spBearbeiten(z){
  z.qAlt = z.q;
  z.q = SP_ARTEN[z.wahl].f(z.s, z.r, z.qAlt) ? 1 : 0;
  spMerken(z);
}
function spMerken(z){ z.verlauf.push({s: z.s, r: z.r, q: z.q}); }
const spIf = (bed, ziel, wert, an) => [{t: `IF ${bed} THEN`, an}, {t: `    ${ziel} := ${wert};`, an}, {t: "END_IF;", an: null}];
const spChips = z => ({s: iaName(z.namen.s), r: iaName(z.namen.r), q: iaName(z.namen.q)});

/* ---------- HTML ---------- */
function spUmschalter(liste, aktiv, akt, text = x => x){
  if (liste.length < 2) return "";
  return `<div class="ia-tabs">${liste.map(x => `<button type="button" data-ia-akt="${akt}:${x}" aria-pressed="${x === aktiv}">${text(x)}</button>`).join("")}</div>`;
}
// SCL: ausgeführte Zeilen grün markiert, nicht ausgeführte blau; rechts die Variablen im Programmstatus
function spSclHTML(z){
  const klasse = an => an === null ? "" : an ? "ja" : "nein";
  const zeilen = SP_ARTEN[z.wahl].scl(z).map(l => `<span class="sp-zeile ${klasse(l.an)}">${esc(l.t)}</span>`).join("");
  const zeile = (name, w) => `<tr class="${w ? "an" : "aus"}"><td>${esc(name)}</td><td>${w ? "TRUE" : "FALSE"}</td></tr>`;
  const status = [[z.scl.q, z.q], [z.scl.s, z.s], [z.scl.r, z.r]].map(([name, w]) => zeile(name, w)).join("");
  return `<div class="ia-scl-wrap"><pre class="ia-scl sp-scl"><code>${zeilen}</code></pre>`
    + `<table class="ia-scl-status"><thead><tr><th>Variable</th><th>Wert</th></tr></thead><tbody>${status}</tbody></table></div>`
    + `<p class="small muted">${SP_SCL_TEXT[z.wahl]} Grün markiert: Diese Zeilen hat die CPU gerade ausgeführt.</p>`;
}
function spBildHTML(z){
  if (z.ansicht === "SCL") return spSclHTML(z);
  const art = SP_ARTEN[z.wahl], w = {s: z.s, r: z.r, qAlt: z.qAlt, q: z.q};
  const n = {s: iaKurz(z.namen.s), r: iaKurz(z.namen.r), q: iaKurz(z.namen.q)};
  return art[z.ansicht.toLowerCase()](w, n, z.wahl, art.pins);
}
function spTabelleHTML(z){
  const pins = SP_ARTEN[z.wahl].pins, pin = sig => pins.find(p => p[0] === sig)[1];
  const kopf = `<tr><th>${iaName(z.namen.s)}<br><small>${pin("s")}</small></th><th>${iaName(z.namen.r)}<br><small>${pin("r")}</small></th><th>Q alt</th><th>Q neu</th></tr>`;
  const zeilen = [];
  for (const s of [0, 1]) for (const r of [0, 1]) for (const q of [0, 1]) {
    const aktiv = s === z.s && r === z.r && q === z.qAlt, neu = SP_ARTEN[z.wahl].f(s, r, q) ? 1 : 0;
    zeilen.push(`<tr class="${aktiv ? "aktiv" : ""}" data-ia-akt="zeile:${s}${r}${q}"><td>${s}</td><td>${r}</td><td>${q}</td><td><b>${neu}</b></td></tr>`);
  }
  return `<table class="ia-tab"><thead>${kopf}</thead><tbody>${zeilen.join("")}</tbody></table>`
    + `<p class="small muted">Klick auf eine Zeile: Q alt einstellen und die Anweisung bearbeiten.</p>`;
}
function spErklaerungHTML(z){
  const text = SP_GRUND[z.wahl][`${z.s}${z.r}`](spChips(z), z.q);
  return `<div class="ia-satz ${z.q ? "an" : "aus"}"><b>Q = ${z.q}:</b> ${text}</div>`;
}
// Name einer Spur im Signalverlauf: Lange Namen passen nicht in die Spalte, dann steht dort der Anschluss (S, R, Q)
export const spSpurName = (name, kurz) => name.length > 11 ? kurz : iaKurz(name);
function spVerlaufHTML(z){
  const spur = (k, kurz) => ({name: spSpurName(z.namen[k], kurz), werte: z.verlauf.map(v => v[k])});
  return signalverlaufSVG([spur("s", "S"), spur("r", "R"), spur("q", "Q")], "Klicks", z.breit);
}
function spKnoepfeHTML(z){
  const tippen = (sig, name) => `<button type="button" class="btn small" data-ia-akt="tippen:${sig}">${iaName(name)} kurz 1</button>`;
  return `<div class="ia-knoepfe">${iaSignalKnopf("s", z.namen.s, z.s)}${iaSignalKnopf("r", z.namen.r, z.r)}`
    + `${tippen("s", z.namen.s)}${tippen("r", z.namen.r)}</div>`;
}
function spBegriffeHTML(){
  return `<details class="ia-begriffe"><summary>Begriffe: Setzen, Rücksetzen, Dominanz, Speicher im Instanz-DB, Remanenz, Selbsthaltung</summary><dl>`
    + SP_BEGRIFFE.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("") + `</dl></details>`;
}
function speicherHTML(z){
  const kopf = `<div class="ia-kopf"><b>Probier es aus:</b> Setze und rücksetze. Lass dann beide Eingänge 0: Q bleibt gespeichert.`
    + spUmschalter(z.arten, z.wahl, "art", a => SP_ARTEN[a].tab) + `</div>`;
  const bild = `<div class="ia-bild"><div class="sp-name">${SP_ARTEN[z.wahl].name}</div>${spUmschalter(SP_ANSICHTEN, z.ansicht, "ansicht")}${spBildHTML(z)}</div>`;
  return kopf + `<div class="sp-reihe">${spKnoepfeHTML(z)}${bild}</div>`
    + `<div class="sp-tabelle">${spTabelleHTML(z)}</div>` + spErklaerungHTML(z)
    + (SP_MIT_FALLE.has(z.wahl) ? SP_FALLE : "") + (z.wahl === "SPULEN" ? SP_REIHENFOLGE : "")
    + `<div class="ia-verlauf"><div class="ia-verlauf-kopf"><b>Signalverlauf</b><button type="button" data-ia-akt="leeren">Neu beginnen</button></div>${spVerlaufHTML(z)}</div>`
    + spBegriffeHTML();
}

/* ---------- Bedienen ---------- */
const SP_AKTION = {
  s: z => { z.s = z.s ? 0 : 1; spBearbeiten(z); },
  r: z => { z.r = z.r ? 0 : 1; spBearbeiten(z); },
  // Kurz 1 (wie ein Taster): einmal mit 1 bearbeiten, dann mit 0
  tippen: (z, sig) => { z[sig] = 1; spBearbeiten(z); z[sig] = 0; spBearbeiten(z); },
  zeile: (z, w) => { z.s = +w[0]; z.r = +w[1]; z.q = +w[2]; spBearbeiten(z); },
  art: (z, a) => { z.wahl = a; z.verlauf = []; spMerken(z); },
  ansicht: (z, a) => { z.ansicht = a; },
  leeren: z => { z.verlauf = []; spMerken(z); },
};
iaRegistrieren("speicher", {
  titel: "Setzen und Rücksetzen",
  neu: speicherNeu,
  html: speicherHTML,
  aktion: (z, akt) => { const [name, wert] = akt.split(":"); SP_AKTION[name](z, wert); },
});
