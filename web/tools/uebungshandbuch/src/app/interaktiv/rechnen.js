/* ---------- Interaktive Erklärung: Rechnen, Runden und Vergleichen wie die S7-1500 ---------- */
// Platzhalter: <div data-interaktiv="rechnen" data-op="ADD,SUB,MUL,DIV,MOD,ROUND,TRUNC,CEIL,FLOOR,CMP,IN_RANGE" data-typ="Int,DInt,Real"
//   data-a="3600" data-b="45" data-name-a="Sekunden je Stunde" data-name-b="Taktzeit in s" data-name-q="Körbe pro Stunde"></div>
// op: Anweisungen (mehrere: Umschalter). typ: Datentypen. a, b: Operanden. min, max: Grenzen für IN_RANGE (optional).
// name-a, name-b, name-q: Bedeutung für den Satz (optional). sa, sb, sq: Namen in SCL (optional, sonst #in1, #in2, #result).
// Zeigt die FUP-Box im Programmstatus, die SCL-Zeile mit Status, einen Zahlenstrahl mit dem Wertebereich und einen Satz.
// Rechenregeln: rechnen-modell.js, Texte: rechnen-text.js, Zahlenstrahl: rechnen-bild.js
import { esc } from '../basis.js';
import { iaRegistrieren } from './basis.js';
import { bxFupSVG, bxSclHTML, bxTabs } from './box-bild.js';
import { reStrahlSVG } from './rechnen-bild.js';
import { RE_TYPEN, RE_ZEICHEN, reImBereich, reParsen, reRechnen, reRunden, reVergleichen } from './rechnen-modell.js';
import { RE_BEGRIFFE, RE_SATZ, RE_SCL_HINWEIS } from './rechnen-text.js';
import { zfZahlText } from './zahl-modell.js';

const RE_ART = {ADD: "rechnen", SUB: "rechnen", MUL: "rechnen", DIV: "rechnen", MOD: "rechnen",
  ROUND: "runden", TRUNC: "runden", CEIL: "runden", FLOOR: "runden", CMP: "vergleich", IN_RANGE: "bereich"};
const RE_FELDER = {rechnen: [["a", "IN1"], ["b", "IN2"]], runden: [["a", "IN"]], vergleich: [["a", "IN1"], ["b", "IN2"]],
  bereich: [["min", "MIN"], ["a", "VAL"], ["max", "MAX"]]};
const RE_VGL = ["==", "<>", ">", "<", ">=", "<="];
const RE_SCL_VGL = {"==": "=", "<>": "<>", ">": ">", "<": "<", ">=": ">=", "<=": "<="};
const RE_REAL_0_1_PLUS_0_6 = Math.fround(Math.fround(0.1) + Math.fround(0.6));
// Beispiele aus der Anlage (L10); gezeigt werden nur die, deren Anweisung und Datentyp der Platzhalter anbietet
const RE_BEISPIELE = [
  {text: "Körbe pro Stunde: 3600 / 45", op: "DIV", typ: "Int", a: 3600, b: 45},
  {text: "Rest: 25 MOD 10", op: "MOD", typ: "Int", a: 25, b: 10},
  {text: "Erst teilen: 4 / 5", op: "DIV", typ: "Int", a: 4, b: 5},
  {text: "Überlauf: 10 × 3600 in Int", op: "MUL", typ: "Int", a: 10, b: 3600},
  {text: "Dasselbe in DInt", op: "MUL", typ: "DInt", a: 10, b: 3600},
  {text: "Division durch 0", op: "DIV", typ: "Int", a: 3600, b: 0},
  {text: "Real: 100000000.0 + 1.0", op: "ADD", typ: "Real", a: 100000000, b: 1},
  {text: "Runden: 2.5", op: "ROUND", typ: "DInt", a: 2.5},
  {text: "Real: 0.1 + 0.6 = 0.7?", op: "CMP", typ: "Real", a: RE_REAL_0_1_PLUS_0_6, b: 0.7, herkunft: "IN1 ist das Ergebnis von 0.1 + 0.6, gerechnet in Real."},
  {text: "Besser: IN_RANGE mit Toleranz", op: "IN_RANGE", typ: "Real", a: RE_REAL_0_1_PLUS_0_6, min: 0.699, max: 0.701, herkunft: "VAL ist das Ergebnis von 0.1 + 0.6 in Real, die Toleranz ist ±0.001."},
];

const reArt = z => RE_ART[z.op];
const reFeldTyp = (z, k) => reArt(z) === "runden" && k === "a" ? "Real" : z.typ;
const reZahl = (z, k) => zfZahlText(reFeldTyp(z, k) === "Real" ? Math.fround(z.w[k]) : z.w[k]);

function rechnenNeu(at){
  const ops = (at.op || "ADD").split(",").map(o => o.trim()).filter(o => RE_ART[o]);
  const typen = (at.typ || "Int").split(",").map(t => t.trim()).filter(t => RE_TYPEN[t]);
  const w = {a: +at.a || 0, b: at.b === undefined ? 1 : +at.b || 0, min: +at.min || 0, max: at.max === undefined ? 100 : +at.max || 0};
  const z = {ops: ops.length ? ops : ["ADD"], typen: typen.length ? typen : ["Int"], w, fehler: {}, en: 1, vgl: "==", herkunft: "",
    namen: {a: at["name-a"] || "", b: at["name-b"] || "", q: at["name-q"] || ""},
    scl: {a: at.sa || "#in1", b: at.sb || "#in2", q: at.sq || "#result", min: "#min", max: "#max"}};
  z.op = z.ops[0];
  reTypWechsel(z, z.typen[0]);   // Startwerte in den Wertebereich des Datentyps bringen
  return z;
}
function reTexteNeu(z){ z.t = Object.fromEntries(Object.keys(z.w).map(k => [k, reZahl(z, k)])); z.fehler = {}; }

/* ---------- Ergebnis ---------- */
const RE_ERGEBNIS = {
  rechnen: z => reRechnen(z.op, z.typ, z.w.a, z.w.b),
  runden: z => reRunden(z.op, z.typ, z.w.a),
  vergleich: z => { const alle = reVergleichen(z.typ, z.w.a, z.w.b); return {out: alle[z.vgl], alle}; },
  bereich: z => ({out: reImBereich(z.typ, z.w.min, z.w.a, z.w.max)}),
};
const reMitEn = z => reArt(z) === "rechnen" || reArt(z) === "runden";
function reErgebnis(z){
  if (reMitEn(z) && !z.en) return {out: undefined, eno: false, fall: "en0"};
  return RE_ERGEBNIS[reArt(z)](z);
}
function reOutText(r){
  if (r.out === undefined) return "alter Wert";
  if (r.out === null) return "?";
  if (typeof r.out === "boolean") return r.out ? "TRUE" : "FALSE";
  return zfZahlText(r.out);
}

/* ---------- Bild: FUP-Box, SCL, Zahlenstrahl ---------- */
const RE_TITEL = {
  rechnen: z => [z.op, z.typ], runden: z => [z.op, `Real to ${z.typ}`],
  vergleich: z => [`CMP ${z.vgl}`, z.typ], bereich: z => ["IN_RANGE", z.typ],
};
const rePin = (pin, name, wert) => ({pin, name, wert});
function reBoxSVG(z, r){
  const [titel, typ] = RE_TITEL[reArt(z)](z), name = k => k === "a" || k === "b" ? z.scl[k] : z.scl[k] || "";
  const werte = RE_FELDER[reArt(z)].map(([k, pin]) => rePin(pin, name(k), reZahl(z, k)));
  const binaer = !reMitEn(z);
  const ein = binaer ? werte : [{pin: "EN", name: "", wert: z.en, bool: true}, ...werte];
  const aus = binaer ? [{pin: "", name: z.scl.q, wert: r.out ? 1 : 0, bool: true}]
    : [{pin: "ENO", name: "", wert: r.eno ? 1 : 0, bool: true}, rePin("OUT", z.scl.q, reOutText(r))];
  return bxFupSVG({inst: "", titel, typ, ein, aus});
}
const RE_SCL = {
  rechnen: z => `${z.scl.q} := ${z.scl.a} ${RE_ZEICHEN[z.op]} ${z.scl.b};`,
  runden: z => `${z.scl.q} := ${z.op}(${z.scl.a});`,
  vergleich: z => `${z.scl.q} := ${z.scl.a} ${RE_SCL_VGL[z.vgl]} ${z.scl.b};`,
  bereich: z => `${z.scl.q} := ${z.scl.min} <= ${z.scl.a} AND ${z.scl.a} <= ${z.scl.max};`,
};
function reSclHTML(z, r){
  const bool = typeof r.out === "boolean" ? r.out : null;
  const status = [[z.scl.q, reOutText(r), bool], ...RE_FELDER[reArt(z)].map(([k]) => [z.scl[k], reZahl(z, k), null])];
  return bxSclHTML(RE_SCL[reArt(z)](z), status) + `<p class="small muted">${RE_SCL_HINWEIS[reArt(z)]}</p>`;
}
function reBereich(werte){
  const lo = Math.min(...werte), hi = Math.max(...werte), rand = (hi - lo) * 0.15 || Math.max(1, Math.abs(lo) * 0.5);
  return {von: lo - rand, bis: hi + rand};
}
// Ausschnitt des Strahls: beim Runden die Ganzzahlen rund um den Wert, sonst alle Werte und die 0
const RE_STRAHL = {
  runden: werte => ({von: Math.floor(Math.min(...werte)) - 1, bis: Math.ceil(Math.max(...werte)) + 1}),
  rechnen: werte => reBereich([0, ...werte]),
  vergleich: werte => reBereich([0, ...werte]),
  bereich: werte => reBereich([0, ...werte]),
};
// Teilstriche: höchstens 12 Ganzzahlen, sonst Anfang, 0 und Ende
function reStriche(d, genau){
  const anzahl = Math.floor(d.bis) - Math.ceil(d.von) + 1;
  const werte = anzahl > 0 && anzahl <= 12 ? Array.from({length: anzahl}, (_, i) => Math.ceil(d.von) + i)
    : [d.von, 0, d.bis].filter(v => v >= d.von && v <= d.bis);
  return werte.map(v => ({v, text: zfZahlText(genau ? v : +v.toPrecision(3))}));
}
function reStrahlDaten(z, r){
  const t = RE_TYPEN[z.typ], art = reArt(z), zahl = typeof r.out === "number" && Number.isFinite(r.out);
  const marken = RE_FELDER[art].map(([k, pin], i) => ({v: z.w[k], text: `${pin} ${reZahl(z, k)}`, oben: true, reihe: i % 2}));
  if (zahl && art !== "vergleich") marken.push({v: r.out, text: `OUT ${reOutText(r)}`, oben: false, reihe: 0, klasse: r.eno === false ? "warn" : "ok"});
  const ganzBereich = art === "rechnen" && t.ganz;
  const d = ganzBereich ? {von: t.min, bis: t.max} : RE_STRAHL[art](marken.map(m => m.v));
  d.striche = reStriche(d, ganzBereich);
  if (r.fall === "ueberlauf" && r.exakt !== null && t.ganz) {
    marken.push({v: +r.exakt, text: `richtig ${r.exakt}`, oben: false, reihe: 1, klasse: "warn"});
    if (zahl) d.bogen = {von: +r.exakt, nach: r.out};
  }
  if (art === "bereich") d.band = {von: z.w.min, bis: z.w.max};
  return {...d, marken};
}
function reStrahlHTML(z, r){
  const art = reArt(z), titel = art === "rechnen" && RE_TYPEN[z.typ].ganz ? `Zahlenstrahl: Wertebereich ${z.typ}` : "Zahlenstrahl";
  return `<div class="re-strahl"><b class="small">${titel}</b>${reStrahlSVG(reStrahlDaten(z, r))}</div>`;
}

/* ---------- Bedienung ---------- */
function reFeldHTML(z, [k, pin]){
  const typ = reFeldTyp(z, k), ganz = RE_TYPEN[typ].ganz, schritt = ganz ? 1 : 0.1;
  const max = ganz && reArt(z) === "rechnen" ? `<button type="button" class="btn small" data-ia-akt="max:${k}">Max</button>` : "";
  const name = (z.op === z.ops[0] && z.namen[k]) || typ;
  const fehler = z.fehler[k] ? `<span class="zf-fehler">${esc(z.fehler[k])}</span>` : "";
  return `<div class="re-feld"><label><b>${pin}</b> <span class="small muted">${esc(name)}</span><input type="text" data-ia-eingabe="${k}" value="${esc(z.t[k])}" spellcheck="false" autocomplete="off"></label>`
    + `<span class="re-knoepfe"><button type="button" class="btn small" data-ia-akt="plus:${k}:${-schritt}">−${schritt}</button>`
    + `<button type="button" class="btn small" data-ia-akt="plus:${k}:${schritt}">+${schritt}</button>${max}</span>${fehler}</div>`;
}
function reVergleichHTML(z, r){
  if (!r.alle) return "";
  const zeile = v => `<tr class="${v === z.vgl ? "aktiv" : ""}" data-ia-akt="vgl:${esc(v)}"><td>CMP ${esc(v)}</td><td><b>${r.alle[v] ? "TRUE" : "FALSE"}</b></td></tr>`;
  return `<table class="ia-tab re-vgl"><thead><tr><th>Vergleich</th><th>Ergebnis</th></tr></thead><tbody>${RE_VGL.map(zeile).join("")}</tbody></table>`;
}
// Datentyp für ein Beispiel: der des Beispiels, beim Runden notfalls der aktuelle; null, wenn er nicht angeboten wird
function reBeispielTyp(z, b){
  if (z.typen.includes(b.typ)) return b.typ;
  return RE_ART[b.op] === "runden" ? z.typ : null;
}
function reBeispieleHTML(z){
  const passend = RE_BEISPIELE.map((b, i) => [b, i]).filter(([b]) => z.ops.includes(b.op) && reBeispielTyp(z, b));
  if (!passend.length) return "";
  return `<div class="re-beispiele"><span class="small muted">Beispiele:</span>${passend.map(([b, i]) => `<button type="button" class="zf-als" data-ia-akt="bsp:${i}">${esc(b.text)}</button>`).join("")}</div>`;
}
function reSatzHTML(z, r){
  const e = {z, r, a: reZahl(z, "a"), b: reZahl(z, "b"), min: reZahl(z, "min"), max: reZahl(z, "max"), out: reOutText(r)};
  const warn = r.eno === false || r.fall === "div0" || r.fall === "mod0" || r.fall === "nurGanz" ? " warn" : "";
  return `<div class="ia-satz${warn}">${RE_SATZ[reArt(z)](e)}</div>`;
}
function reBegriffeHTML(){
  return `<details class="ia-begriffe"><summary>Begriffe: ${RE_BEGRIFFE.map(b => b[0]).join(", ")}</summary><dl>`
    + RE_BEGRIFFE.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("") + `</dl></details>`;
}
function rechnenHTML(z){
  const r = reErgebnis(z);
  const en = reMitEn(z) ? `<button type="button" class="ia-sig${z.en ? " an" : ""}" data-ia-akt="en"><span class="n">EN</span><b>${z.en}</b></button>` : "";
  return `<div class="ia-kopf"><b>Probier es aus:</b> Gib Zahlen ein oder ändere sie mit den Knöpfen.${bxTabs(z.ops, z.op, "op")}${bxTabs(z.typen, z.typ, "typ")}</div>`
    + reBeispieleHTML(z) + `<div class="re-felder">${RE_FELDER[reArt(z)].map(f => reFeldHTML(z, f)).join("")}${en}</div>`
    + reSatzHTML(z, r) + `<div class="re-bild"><div>${reBoxSVG(z, r)}${reVergleichHTML(z, r)}</div><div>${reSclHTML(z, r)}</div></div>`
    + reStrahlHTML(z, r) + reBegriffeHTML();
}

/* ---------- Aktionen ---------- */
function reSetzen(z, k, v){
  const t = RE_TYPEN[reFeldTyp(z, k)];
  z.w[k] = Math.min(t.max, Math.max(t.min, t.ganz ? Math.round(v) : Number(v.toPrecision(12))));
  z.herkunft = "";
  reTexteNeu(z);
}
function reTypWechsel(z, typ){
  z.typ = typ;
  for (const k of Object.keys(z.w)) reSetzen(z, k, z.w[k]);
}
function reBeispiel(z, i){
  const b = RE_BEISPIELE[+i];
  z.op = b.op; z.typ = reBeispielTyp(z, b); z.en = 1;
  Object.assign(z.w, {a: b.a, b: b.b ?? z.w.b, min: b.min ?? z.w.min, max: b.max ?? z.w.max});
  reTexteNeu(z);
  z.herkunft = b.herkunft || "";
}
function reEingabe(z, k, feld){
  const r = reParsen(reFeldTyp(z, k), feld.value);
  z.t[k] = feld.value; z.herkunft = "";
  z.fehler[k] = r.fehler || "";
  if (!r.fehler) z.w[k] = r.wert;
}
const RE_AKTION = {
  op: (z, op) => { z.op = op; reTypWechsel(z, z.typ); },
  typ: reTypWechsel,
  plus: (z, k, d) => reSetzen(z, k, z.w[k] + +d),
  max: (z, k) => reSetzen(z, k, RE_TYPEN[z.typ].max),
  en: z => { z.en = z.en ? 0 : 1; },
  vgl: (z, v) => { z.vgl = v; },
  bsp: reBeispiel,
};
iaRegistrieren("rechnen", {
  neu: rechnenNeu,
  html: rechnenHTML,
  aktion: (z, akt, el) => {
    if (z.w[akt] !== undefined) return reEingabe(z, akt, el);
    const [name, ...werte] = akt.split(":");
    RE_AKTION[name](z, ...werte);
  },
});
