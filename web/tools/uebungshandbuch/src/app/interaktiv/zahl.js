/* ---------- Interaktive Erklärung: Zahlenformate (Bit, Byte, Wort, Datentypen) ---------- */
// Platzhalter: <div data-interaktiv="zahl" data-typ="Byte,Word,Int,DInt,Real,BCD16" data-wert="16#00FF" data-adresse="IW0"
//   data-name="DI-Bytes BG1 bis BG16"></div>
// typ: Datentypen zum Umschalten (Byte, Word, DWord, Int, DInt, Real, BCD16). wert: Startwert (dezimal, 16#…, 2#…).
// adresse: Byte, Wort oder Doppelwort (IB3, IW0, QD4, MW10). name: Text dazu, Kennzeichen ohne „−“ (BG1 wird ein Chip).
// Bits anklicken, Zahl eingeben, +1/−1: binär, hexadezimal, dezimal, BCD, Bytes mit Adressen und Bits folgen.
// Rechnen und Bitmuster: zahl-modell.js
import { chip, esc } from '../basis.js';
import { SIG } from '../daten.js';
import { iaRegistrieren } from './basis.js';
import { bxTabs } from './box-bild.js';
import { ZF_TYPEN, zfAdresse, zfBcdTetraden, zfBinaer, zfBit, zfBytes, zfGenau, zfHex, zfKippen, zfKuerzen, zfLesen, zfParsen,
  zfRealTeile, zfRolle, zfSchritt, zfZahlText } from './zahl-modell.js';

const ZF_BEGRIFFE = [
  ["Bit", "Die kleinste Einheit: 0 oder 1. Ein Eingang wie %I0.0 ist ein Bit."],
  ["Byte", "8 Bit, z. B. %IB0 mit den Bits %I0.0 bis %I0.7. Bit 0 steht rechts und zählt 1, Bit 7 links und zählt 128."],
  ["Wort (Word)", "16 Bit, also 2 Byte. %IW0 besteht aus %IB0 und %IB1."],
  ["Doppelwort (DWord)", "32 Bit, also 4 Byte. %ID0 besteht aus %IB0 bis %IB3."],
  ["Big Endian (höherwertiges Byte zuerst)", "Im Wort steht das Byte mit der kleineren Nummer vorn, als höherwertiges Byte (High-Byte, Bit 15 bis 8). Bei %IW0 ist %IB0 das höherwertige und %IB1 das niederwertige Byte (Low-Byte, Bit 7 bis 0)."],
  ["Zweierkomplement", "So speichern Int und DInt negative Zahlen. Das höchste Bit ist das Vorzeichen: 0 positiv, 1 negativ. Den Betrag einer negativen Zahl findest du, indem du alle Bits umdrehst und 1 addierst."],
  ["Tetrade", "Eine Gruppe aus 4 Bit. Eine Tetrade ist genau eine Hex-Ziffer (0 bis F). Bei BCD ist jede Tetrade eine Dezimalziffer 0 bis 9, A bis F sind dort ungültig."],
  ["Überlauf", "Ein Ergebnis passt nicht mehr in den Wertebereich des Datentyps. Anweisungen wie ADD melden das mit ENO = FALSE."],
  ["IEEE 754", "Die Norm, nach der Real gespeichert wird: 1 Bit Vorzeichen, 8 Bit Exponent, 23 Bit Mantisse. Real hat dadurch nur etwa 6 bis 7 gültige Stellen (TIA-Hilfe: 6, Programmierleitfaden: 7), sicher sind 6."],
];
const ZF_ROLLENNAME = {vz: "Vorzeichen", exp: "Exponent", man: "Mantisse", "": ""};

function zahlNeu(at){
  const typen = (at.typ || "Word").split(",").map(t => t.trim()).filter(t => ZF_TYPEN[t]);
  const typ = typen[0] || "Word", start = zfParsen(typ, at.wert || "0");
  const z = {typen, typ, u: start.u || 0, adresse: zfAdresse(at.adresse), name: at.name || "", meldung: null, fehler: null};
  z.text = zfEingabeText(z);
  return z;
}
// Text im Eingabefeld: der Wert im Datentyp, bei ungültigem BCD das Bitmuster in Hex
function zfEingabeText(z){
  const v = zfLesen(z.typ, z.u);
  return v === null ? zfHex(z.u, ZF_TYPEN[z.typ].bits) : zfZahlText(v);
}
const zfBits = z => ZF_TYPEN[z.typ].bits;
const zfWert = z => zfLesen(z.typ, z.u);
const zfAdrPasst = z => z.adresse && z.adresse.bits === zfBits(z);

/* ---------- Kennzeichen zu einer Bitadresse (aus der Signalliste) ---------- */
let zfSignale = null;
function zfKennzeichen(adresse){
  if (!zfSignale) {
    zfSignale = {};
    for (const [tag, liste] of Object.entries(SIG)) for (const e of liste) zfSignale[e.a] = zfSignale[e.a] || tag;
  }
  return zfSignale[adresse];
}
// Kennzeichen im Namen (BG1) werden Chips, wenn es sie in der Signalliste gibt
const zfNameHTML = text => esc(text).replace(/\b([A-Z]{1,3}\d{1,2})\b/g, (m, t) => SIG[t] ? chip(t) : m);

/* ---------- Kopf und Bits ---------- */
function zfTitelHTML(z){
  const a = z.adresse, name = z.name ? ` ${zfNameHTML(z.name)}` : "";
  if (!a) return name ? `<div class="zf-titel">${name}</div>` : "";
  const adr = `%${a.bereich}${a.breite}${a.start}`;
  const hinweis = zfAdrPasst(z) ? "" : ` <span class="small muted">(${adr} hat ${a.bits} Bit, ${z.typ} hat ${zfBits(z)} Bit. Die Bitadressen siehst du, wenn die Breite passt.)</span>`;
  return `<div class="zf-titel"><code>${adr}</code>${name}${hinweis}</div>`;
}
const ZF_BYTENAME = {16: ["höherwertig (High-Byte)", "niederwertig (Low-Byte)"], 32: ["höchstwertig", "", "", "niederwertigst"]};
function zfByteKopf(z, b, k){
  const name = (ZF_BYTENAME[zfBits(z)] || [])[k] || "";
  const adr = zfAdrPasst(z) ? `%${z.adresse.bereich}B${b.adresse}` : `Bit ${zfBits(z) - 1 - 8 * k} bis ${zfBits(z) - 8 - 8 * k}`;
  return `<div class="zf-byte-kopf"><b>${adr}</b> ${name}</div>`;
}
function zfBitHTML(z, i, byteAdr, bitImByte){
  const an = zfBit(z.u, i), rolle = zfRolle(z.typ, i);
  const adr = zfAdrPasst(z) ? `%${z.adresse.bereich}${byteAdr}.${bitImByte}` : "";
  const tag = adr && zfKennzeichen(adr);
  const titel = `Bit ${i}${adr ? ", " + adr : ""}${rolle ? ", " + ZF_ROLLENNAME[rolle] : ""}`;
  return `<div class="zf-zelle"><span class="zf-nr">${i}</span>`
    + `<button type="button" class="zf-bit${an ? " an" : ""}${rolle ? " zf-" + rolle : ""}" data-ia-akt="bit:${i}" title="${titel}" aria-label="${titel}" aria-pressed="${!!an}">${an}</button>`
    + (adr ? `<span class="zf-adr">${byteAdr}.${bitImByte}</span>` : "") + (tag ? `<span class="zf-tag">${chip(tag)}</span>` : "") + `</div>`;
}
// Unter jeder Tetrade die Hex-Ziffer; bei BCD16 zusätzlich, ob sie gültig ist
function zfTetradeHTML(z, wert, i){
  const hex = wert.toString(16).toUpperCase();
  if (ZF_TYPEN[z.typ].art !== "bcd") return `<div class="zf-tetrade">${hex}</div>`;
  const t = zfBcdTetraden(z.u).find(x => x.i === i);
  const text = t.rolle === "vorzeichen" ? (t.gueltig ? (t.w ? "−" : "+") : "?") : t.gueltig ? hex : "ungültig";
  return `<div class="zf-tetrade ${t.gueltig ? "ok" : "falsch"}">${text}</div>`;
}
function zfByteHTML(z, b, k){
  const hoch = zfBits(z) - 1 - 8 * k;
  const bits = Array.from({length: 8}, (_, j) => zfBitHTML(z, hoch - j, b.adresse, 7 - j)).join("");
  const tetraden = [Math.floor(b.wert / 16), b.wert % 16].map((w, j) => zfTetradeHTML(z, w, (hoch - 3 - 4 * j) / 4)).join("");
  return `<div class="zf-byte">${zfByteKopf(z, b, k)}<div class="zf-reihe">${bits}</div><div class="zf-tetraden">${tetraden}</div></div>`;
}
function zfBitfeldHTML(z){
  const start = zfAdrPasst(z) ? z.adresse.start : 0;
  return `<div class="zf-bitfeld">${zfBytes(z.u, zfBits(z), start).map((b, k) => zfByteHTML(z, b, k)).join("")}</div>`;
}

/* ---------- Eingabe und Darstellungen ---------- */
function zfEingabeHTML(z){
  const t = ZF_TYPEN[z.typ], fehler = z.fehler ? `<div class="zf-fehler">${esc(z.fehler)}</div>` : "";
  return `<div class="zf-eingabe"><label>Zahl als ${z.typ} <input type="text" data-ia-eingabe="wert" value="${esc(z.text)}" spellcheck="false" autocomplete="off"></label>`
    + `<button type="button" class="btn small" data-ia-akt="schritt:-1">−1</button><button type="button" class="btn small" data-ia-akt="schritt:1">+1</button>`
    + `<span class="small muted">Wertebereich ${z.typ}: ${zfZahlText(t.min)} bis ${zfZahlText(t.max)}</span></div>${fehler}`;
}
// Dasselbe Bitmuster in allen Datentypen gleicher Breite
function zfAndereHTML(z){
  const gleich = Object.keys(ZF_TYPEN).filter(t => t !== z.typ && ZF_TYPEN[t].bits === zfBits(z));
  const eintrag = t => {
    const inhalt = `<b>${t}</b> ${esc(zfZahlText(zfLesen(t, z.u)))}`;
    return z.typen.includes(t) ? `<button type="button" class="zf-als" data-ia-akt="typ:${t}">${inhalt}</button>` : `<span class="zf-als">${inhalt}</span>`;
  };
  return gleich.map(eintrag).join(" ");
}
function zfTabelleHTML(z){
  const zeilen = [
    ["Binär (2#)", `<code>${zfBinaer(z.u, zfBits(z))}</code>`],
    ["Hexadezimal (16#)", `<code>${zfHex(z.u, zfBits(z))}</code>`],
    [`Dezimal als ${z.typ}`, `<code class="zf-gross">${esc(zfZahlText(zfWert(z)))}</code>`],
    ["Dasselbe Bitmuster als", zfAndereHTML(z) || "–"],
  ];
  return `<table class="zf-tab"><tbody>${zeilen.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("")}</tbody></table>`;
}

/* ---------- Zusätze je Datentyp ---------- */
function zfRealHTML(z){
  const t = zfRealTeile(z.u), feld = (klasse, titel, wert) => `<div class="zf-feld zf-${klasse}"><span>${titel}</span><b>${wert}</b></div>`;
  return `<div class="zf-real">${feld("vz", "Vorzeichen (Bit 31)", t.vorzeichen ? "1 = negativ" : "0 = positiv")}`
    + feld("exp", "Exponent (Bit 30 bis 23)", `${t.exponent} − 127 = ${t.exponent - 127}`)
    + feld("man", "Mantisse (Bit 22 bis 0)", `1 + ${t.mantisse} / 2<sup>23</sup> = ${zfGenau(t.faktor)}`)
    + `</div><p class="small">Gespeichert ist genau <code>${esc(zfGenau(zfWert(z)))}</code>. Auf 7 Stellen gerundet: <code>${esc(zfZahlText(zfWert(z)))}</code>.</p>`;
}
function zfBcdHTML(){
  return `<pre class="ia-scl"><code>#bcdValue := INT_TO_BCD16_WORD(#intValue);   // Int → BCD16, nur −999 bis +999
#intValue := WORD_BCD16_TO_INT(#bcdValue);   // BCD16 → Int</code></pre>`
    + `<p class="small">In FUP nimmst du dafür CONVERT mit Quelle Int und Ziel Bcd16 (oder umgekehrt). Liegt der Wert außerhalb von −999 bis +999 oder ist eine Tetrade ungültig, löst die CPU keinen Fehler aus. Die CPU setzt nur das Statusbit OV (Überlauf).</p>`;
}
const ZF_ZUSATZ = {real: zfRealHTML, bcd: zfBcdHTML};
const zfZusatzHTML = z => (ZF_ZUSATZ[ZF_TYPEN[z.typ].art] || (() => ""))(z);

/* ---------- Satz in Worten ---------- */
function zfStellenwerte(u, bits){
  const einsen = Array.from({length: bits}, (_, i) => bits - 1 - i).filter(i => zfBit(u, i)).map(i => 2 ** i);
  if (!einsen.length) return "Alle Bits sind 0, der Wert ist 0.";
  if (einsen.length > 6) return `${einsen.length} Bits sind 1. Ihre Stellenwerte zusammen ergeben ${u}.`;
  return `Jede 1 zählt ihren Stellenwert: ${einsen.join(" + ")} = ${u}.`;
}
function zfGanzSatz(z){
  const b = zfBits(z), v = zfWert(z);
  if (v >= 0) return `Bit ${b - 1} (Vorzeichen) ist 0, die Zahl ist positiv. ${zfStellenwerte(z.u, b)}`;
  const umgedreht = 2 ** b - 1 - z.u;
  return `Bit ${b - 1} ist 1, die Zahl ist negativ (Zweierkomplement). Den Betrag findest du so: alle Bits umdrehen ergibt ${umgedreht}, plus 1 ergibt ${umgedreht + 1}. Der Wert ist also −${umgedreht + 1}.`;
}
const ZF_REAL_SATZ = {
  null: () => "Exponent und Mantisse sind 0: Das ist die Zahl 0.",
  denormal: () => "Exponent 0, Mantisse nicht 0: eine denormalisierte Zahl. Die CPU rechnet damit wie mit 0.",
  unendlich: t => `Exponent 255, Mantisse 0: ${t.vorzeichen ? "minus" : "plus"} unendlich (Inf). Das ist keine gültige Zahl. Anweisungen wie ADD melden dann ENO = FALSE.`,
  nan: () => "Exponent 255, Mantisse nicht 0: NaN (Not a Number), eine ungültige Gleitpunktzahl.",
  normal: (t, z) => `Wert = ${t.vorzeichen ? "−" : ""}${zfGenau(t.faktor)} × 2<sup>${t.exponent - 127}</sup> = ${esc(zfGenau(zfWert(z)))}. Real hat nur etwa 6 bis 7 gültige Stellen (TIA-Hilfe: 6, Programmierleitfaden: 7), sicher sind 6, darum ist nicht jede Dezimalzahl genau darstellbar.`,
};
function zfBcdSatz(z){
  const t = zfBcdTetraden(z.u), falsch = t.find(x => !x.gueltig);
  if (!falsch) return `Jede Tetrade ist eine Dezimalziffer: ${t[1].w}, ${t[2].w} und ${t[3].w} ergeben ${Math.abs(zfWert(z))}. Die oberste Tetrade ist das Vorzeichen (0000 plus, 1111 minus): Wert ${zfWert(z)}.`;
  const was = falsch.rolle === "ziffer" ? "keine Dezimalziffer (nur 0 bis 9 sind erlaubt)" : "kein gültiges Vorzeichen (0000 oder 1111)";
  return `Die Tetrade ${falsch.w.toString(2).padStart(4, "0")} (${falsch.w.toString(16).toUpperCase()}) ist ${was}. Das Bitmuster ist keine gültige BCD-Zahl.`;
}
const ZF_SATZ = {
  bitfolge: z => `Als ${z.typ} hat das Bitmuster kein Vorzeichen. ${zfStellenwerte(z.u, zfBits(z))}`,
  ganzzahl: zfGanzSatz,
  real: z => { const t = zfRealTeile(z.u); return ZF_REAL_SATZ[t.art](t, z); },
  bcd: zfBcdSatz,
};
const zfSatzHTML = z => `<div class="ia-satz">${ZF_SATZ[ZF_TYPEN[z.typ].art](z)}</div>`;

/* ---------- Meldungen nach +1 und −1 ---------- */
function zfGrenzText(z, m, richtung){
  const t = ZF_TYPEN[z.typ], b = zfBits(z), grenze = richtung > 0 ? t.max : t.min;
  const muster = `Im Bitmuster wird aus <code>${zfBinaer(m.vorher, b)}</code> das Muster <code>${zfBinaer(z.u, b)}</code>, als ${z.typ} gelesen ${zfWert(z)}.`;
  const eno = t.art === "ganzzahl" ? " Rechnest du das mit ADD oder SUB, meldet die Box ENO = FALSE: Das Ergebnis liegt außerhalb des Wertebereichs. Dass am Ausgang dann genau dieses Bitmuster steht, beobachtet man an der CPU, die TIA-Hilfe legt es nicht fest. Verlass dich nie auf den Wert am Ausgang." : "";
  return `<b>Überlauf:</b> ${grenze} ${richtung > 0 ? "+" : "−"} 1 passt nicht in ${z.typ}. ${muster}${eno}`;
}
const ZF_MELDUNG = {
  ueberlauf: (z, m) => zfGrenzText(z, m, 1),
  unterlauf: (z, m) => zfGrenzText(z, m, -1),
  ungenau: z => `<b>Zu ungenau:</b> ${zfZahlText(zfWert(z))} ± 1 ergibt in Real wieder ${zfZahlText(zfWert(z))}. So große Zahlen liegen in Real mehr als 1 auseinander (ab 16777216 = 2<sup>24</sup> reicht die Mantisse nicht mehr).`,
  bcdGrenze: () => "<b>Grenze:</b> BCD16 hat nur drei Ziffern, also −999 bis +999. INT_TO_BCD16_WORD setzt bei größeren Werten nur das Statusbit OV.",
  bcdUngueltig: () => "<b>Kein BCD:</b> Das Bitmuster enthält eine ungültige Tetrade. Damit kann man nicht rechnen.",
};
const zfMeldungHTML = z => z.meldung ? `<div class="ia-satz warn">${ZF_MELDUNG[z.meldung.art](z, z.meldung)}</div>` : "";

function zfBegriffeHTML(){
  return `<details class="ia-begriffe"><summary>Begriffe: ${ZF_BEGRIFFE.map(b => b[0]).join(", ")}</summary><dl>`
    + ZF_BEGRIFFE.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("") + `</dl></details>`;
}
function zahlHTML(z){
  return `<div class="ia-kopf"><b>Probier es aus:</b> Klicke auf die Bits oder gib eine Zahl ein.${bxTabs(z.typen, z.typ, "typ")}</div>`
    + zfTitelHTML(z) + zfBitfeldHTML(z) + zfEingabeHTML(z) + zfMeldungHTML(z)
    + `<div class="zf-unten">${zfTabelleHTML(z)}<div class="zf-zusatz">${zfZusatzHTML(z)}</div></div>` + zfSatzHTML(z) + zfBegriffeHTML();
}

/* ---------- Bedienen ---------- */
// Typwechsel: Gleiche Breite behält das Bitmuster (z. B. Word ↔ Int). Andere Breite behält die Zahl, wenn sie passt
// (Int −11 → DInt −11), sonst die unteren Bits.
function zfUmTyp(z, v, altBits){
  if (zfBits(z) === altBits || v === null) return zfKuerzen(z.u, zfBits(z));
  const r = zfParsen(z.typ, String(v));
  return r.fehler ? zfKuerzen(z.u, zfBits(z)) : r.u;
}
function zfNeuerWert(z, u){
  z.u = u; z.fehler = null;
  z.text = zfEingabeText(z);
}
const ZF_AKTION = {
  bit: (z, i) => { zfNeuerWert(z, zfKippen(z.u, +i)); z.meldung = null; },
  typ: (z, t) => {
    const v = zfWert(z), altBits = zfBits(z);
    z.typ = t; z.meldung = null;
    zfNeuerWert(z, zfUmTyp(z, v, altBits));
  },
  schritt: (z, d) => {
    const r = zfSchritt(z.typ, z.u, +d);
    z.meldung = r.meldung ? {art: r.meldung, vorher: z.u} : null;
    zfNeuerWert(z, r.u);
  },
  wert: (z, _, feld) => {
    const r = zfParsen(z.typ, feld.value);
    z.text = feld.value; z.fehler = r.fehler || null; z.meldung = null;
    if (!r.fehler) z.u = r.u;
  },
};
iaRegistrieren("zahl", {
  neu: zahlNeu,
  html: zahlHTML,
  aktion: (z, akt, el) => { const [name, wert] = akt.split(":"); ZF_AKTION[name](z, wert, el); },
});
