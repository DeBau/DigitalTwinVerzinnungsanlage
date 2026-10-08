/* ---------- Interaktive Erklärung: Zahlenformate (Bit, Byte, Wort, Datentypen, Speicheraufbau) ---------- */
// Platzhalter: <div data-interaktiv="zahl" data-typ="Byte,Word,Int,DInt,Real,BCD16" data-wert="16#00FF" data-adresse="IW0"
//   data-name="DI-Bytes BG1 bis BG16" data-ansicht="speicher"></div>
// typ: Datentypen zum Umschalten (Byte, Word, DWord, LWord, USInt … ULInt, SInt … LInt, Real, LReal, BCD16).
// wert: Startwert (dezimal, 16#…, 2#…, auch W#16#…, INT#…). adresse: Byte, Wort oder Doppelwort (IB3, IW0, QD4, MW10).
// name: Text dazu, Kennzeichen ohne „−“ (BG1 wird ein Chip). ansicht (optional): "speicher" zeigt statt des Bitfelds
// gleich den Speicheraufbau (Doppelwort, Wörter, Bytes, Bits).
// Bits anklicken, Zahl eingeben, +1/−1: binär, hexadezimal, dezimal, BCD, Bytes mit Adressen und Bits folgen.
// „Speicheraufbau groß ansehen“ öffnet das große Popup (zahl-gross.js) mit Speicheraufbau, Datentypen und Zeiten.
// Der Operand liegt zugleich im Speicher z.sp (zahl-speicher-modell.js); jede Änderung gleicht beide ab.
import { chip, esc } from '../basis.js';
import { SIG } from '../daten.js';
import { iaRegistrieren, iaZeichnen } from './basis.js';
import { bxTabs } from './box-bild.js';
import { ZF_GLEIT, ZF_TYPEN, zfAdresse, zfBcdTetraden, zfBinaer, zfBit, zfBytes, zfGenau, zfHex, zfKippen, zfKuerzen, zfLesen,
  zfMusterParsen, zfRealTeile, zfRolle, zfSchritt, zfZahlText } from './zahl-modell.js';
import { DT_QUELLE, DT_TYPEN, DT_ZEITEN, dtSteckbriefHTML, dtTabelleHTML } from './zahl-typen.js';
import { zdHTML } from './zahl-zeit.js';
import { zsLesen, zsNeu, zsOperandZeigen, zsSchreiben } from './zahl-speicher-modell.js';
import { ZS_AKTION, zsHTML, zsKennzeichen } from './zahl-speicher.js';
import { zgOeffnen } from './zahl-gross.js';

const ZF_BEGRIFFE = [
  ["Bit", "Die kleinste Einheit: 0 oder 1. Ein Eingang wie %I0.0 ist ein Bit."],
  ["Byte", "8 Bit, z. B. %IB0 mit den Bits %I0.0 bis %I0.7. Bit 0 steht rechts und zählt 1, Bit 7 links und zählt 128."],
  ["Wort (Word)", "16 Bit, also 2 Byte. %IW0 besteht aus %IB0 und %IB1."],
  ["Doppelwort (DWord)", "32 Bit, also 4 Byte. %ID0 besteht aus %IB0 bis %IB3, also aus den Wörtern %IW0 und %IW2."],
  ["LWord", "64 Bit, also 8 Byte. Gibt es nur bei S7-1500 und S7-1200 G2, eine absolute Adresse wie %ID dafür nennt die TIA-Hilfe nicht."],
  ["Big Endian (höherwertiges Byte zuerst)", "Im Wort steht das Byte mit der kleineren Nummer vorn, als höherwertiges Byte (High-Byte, Bit 15 bis 8). Bei %IW0 ist %IB0 das höherwertige und %IB1 das niederwertige Byte (Low-Byte, Bit 7 bis 0)."],
  ["Zweierkomplement", "So speichern SInt, Int, DInt und LInt negative Zahlen. Das höchste Bit ist das Vorzeichen: 0 positiv, 1 negativ. Den Betrag einer negativen Zahl findest du, indem du alle Bits umdrehst und 1 addierst."],
  ["Tetrade", "Eine Gruppe aus 4 Bit. Eine Tetrade ist genau eine Hex-Ziffer (0 bis F). Bei BCD ist jede Tetrade eine Dezimalziffer 0 bis 9, A bis F sind dort ungültig."],
  ["Überlauf", "Ein Ergebnis passt nicht mehr in den Wertebereich des Datentyps. Anweisungen wie ADD melden das mit ENO = FALSE."],
  ["IEEE 754", "Die Norm, nach der Real und LReal gespeichert werden. Real: 1 Bit Vorzeichen, 8 Bit Exponent, 23 Bit Mantisse, etwa 6 bis 7 gültige Stellen (TIA-Hilfe: 6, Programmierleitfaden: 7), sicher sind 6. LReal: 1, 11 und 52 Bit, 15 Stellen."],
];
const ZF_ROLLENNAME = {vz: "Vorzeichen", exp: "Exponent", man: "Mantisse", "": ""};

/* ---------- Zustand ---------- */
let zfGrossQuelle = null;
function zahlNeu(at){
  if (at.gross && zfGrossQuelle) return zfGrossNeu(zfGrossQuelle);
  const typen = (at.typ || "Word").split(",").map(t => t.trim()).filter(t => ZF_TYPEN[t]);
  const typ = typen[0] || "Word", start = zfMusterParsen(typ, at.wert || "0");
  const z = {typen, typ, u: start.m ?? 0n, adresse: zfAdresse(at.adresse), name: at.name || "", meldung: null, fehler: null,
    ansicht: at.ansicht || "", tab: "speicher", zeit: {text: "T#1s_200ms"}};
  const o = zfOperand(z);
  z.sp = zsNeu(z.adresse ? z.adresse.bereich : "M", o.adr, o.bits);
  zfNeuerWert(z, z.u);
  return z;
}
// Das große Popup arbeitet auf einer Kopie; beim Schließen übernimmt die kleine Erklärung die Bytes
function zfGrossNeu(q){
  const sp = structuredClone(q.sp), o = zfOperand(q);
  Object.assign(sp, {n: Math.max(sp.n, 4), start: sp.basis, eingabe: null});
  zsOperandZeigen(sp, o.adr, o.bits);
  return {...q, sp, typen: [...q.typen], zeit: {...q.zeit}, ansicht: "gross", tab: "speicher", meldung: null, quelle: q};
}
const zfBits = z => ZF_TYPEN[z.typ].bits;
const zfWert = z => zfLesen(z.typ, z.u);
const zfStellenZahl = z => ZF_TYPEN[z.typ].art === "real" ? ZF_GLEIT[zfBits(z)].stellen : 7;
const zfAdrPasst = z => z.adresse && z.adresse.bits === zfBits(z);
const zfOperand = z => ({adr: z.adresse ? z.adresse.start : 0, bits: zfBits(z)});
// Text im Eingabefeld: der Wert im Datentyp, bei ungültigem BCD das Bitmuster in Hex
function zfEingabeText(z){
  const v = zfWert(z);
  return v === null ? zfHex(z.u, zfBits(z)) : zfZahlText(v, zfStellenZahl(z));
}
function zfNeuerWert(z, u){
  z.u = u; z.fehler = null;
  z.text = zfEingabeText(z);
  const o = zfOperand(z);
  zsSchreiben(z.sp, o.adr, o.bits, u);
  z.sp.eingabe = null;
}
function zfAusSpeicher(z){
  const o = zfOperand(z);
  z.u = zsLesen(z.sp, o.adr, o.bits); z.fehler = null; z.meldung = null;
  z.text = zfEingabeText(z);
}
const zfNameHTML = text => esc(text).replace(/\b([A-Z]{1,3}\d{1,2})\b/g, (m, t) => SIG[t] ? chip(t) : m);

/* ---------- Kopf und Bits ---------- */
function zfTitelHTML(z){
  const a = z.adresse, name = z.name ? ` ${zfNameHTML(z.name)}` : "";
  if (!a) return name ? `<div class="zf-titel">${name}</div>` : "";
  const adr = `%${a.bereich}${a.breite}${a.start}`;
  const hinweis = zfAdrPasst(z) ? "" : ` <span class="small muted">(${adr} hat ${a.bits} Bit, ${z.typ} hat ${zfBits(z)} Bit. Die Bitadressen siehst du, wenn die Breite passt.)</span>`;
  return `<div class="zf-titel"><code>${adr}</code>${name}${hinweis}</div>`;
}
const ZF_BYTENAME = {16: ["höherwertig (High-Byte)", "niederwertig (Low-Byte)"], 32: ["höchstwertig", "", "", "niederwertigst"],
  64: ["höchstwertig", "", "", "", "", "", "", "niederwertigst"]};
function zfByteKopf(z, b, k){
  const name = (ZF_BYTENAME[zfBits(z)] || [])[k] || "";
  const adr = zfAdrPasst(z) ? `%${z.adresse.bereich}B${b.adresse}` : `Bit ${zfBits(z) - 1 - 8 * k} bis ${zfBits(z) - 8 - 8 * k}`;
  return `<div class="zf-byte-kopf"><b>${adr}</b> ${name}</div>`;
}
function zfBitHTML(z, i, byteAdr, bitImByte){
  const an = zfBit(z.u, i), rolle = zfRolle(z.typ, i);
  const adr = zfAdrPasst(z) ? `%${z.adresse.bereich}${byteAdr}.${bitImByte}` : "";
  const tag = adr && zsKennzeichen(adr);
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
  const fehler = z.fehler ? `<div class="zf-fehler">${esc(z.fehler)}</div>` : "";
  return `<div class="zf-eingabe"><label>Zahl als ${z.typ} <input type="text" data-ia-eingabe="wert" value="${esc(z.text)}" spellcheck="false" autocomplete="off"></label>`
    + `<button type="button" class="btn small" data-ia-akt="schritt:-1">−1</button><button type="button" class="btn small" data-ia-akt="schritt:1">+1</button>`
    + `<button type="button" class="btn small" data-ia-akt="gross">Speicheraufbau groß ansehen</button></div>${fehler}`;
}
// Dasselbe Bitmuster in allen Datentypen gleicher Breite
function zfAndereHTML(z){
  const gleich = Object.keys(ZF_TYPEN).filter(t => t !== z.typ && ZF_TYPEN[t].bits === zfBits(z));
  const eintrag = t => {
    const stellen = ZF_TYPEN[t].art === "real" ? ZF_GLEIT[zfBits(z)].stellen : 7;
    const inhalt = `<b>${t}</b> ${esc(zfZahlText(zfLesen(t, z.u), stellen))}`;
    return z.typen.includes(t) ? `<button type="button" class="zf-als" data-ia-akt="typ:${t}">${inhalt}</button>` : `<span class="zf-als">${inhalt}</span>`;
  };
  return gleich.map(eintrag).join(" ");
}
function zfTabelleHTML(z){
  const zeilen = [
    ["Binär (2#)", `<code>${zfBinaer(z.u, zfBits(z))}</code>`],
    ["Hexadezimal (16#)", `<code>${zfHex(z.u, zfBits(z))}</code>`],
    [`Dezimal als ${z.typ}`, `<code class="zf-gross">${esc(zfZahlText(zfWert(z), zfStellenZahl(z)))}</code>`],
    ["Dasselbe Bitmuster als", zfAndereHTML(z) || "–"],
  ];
  return `<table class="zf-tab"><tbody>${zeilen.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("")}</tbody></table>`;
}

/* ---------- Zusätze je Datentyp ---------- */
function zfRealHTML(z){
  const t = zfRealTeile(z.u, zfBits(z)), b = zfBits(z);
  const feld = (klasse, titel, wert) => `<div class="zf-feld zf-${klasse}"><span>${titel}</span><b>${wert}</b></div>`;
  return `<div class="zf-real">${feld("vz", `Vorzeichen (Bit ${b - 1})`, t.vorzeichen ? "1 = negativ" : "0 = positiv")}`
    + feld("exp", `Exponent (Bit ${b - 2} bis ${t.man})`, `${t.exponent} − ${t.bias} = ${t.exponent - t.bias}`)
    + feld("man", `Mantisse (Bit ${t.man - 1} bis 0)`, `1 + ${t.mantisse} / 2<sup>${t.man}</sup> = ${zfGenau(t.faktor, 17)}`)
    + `</div><p class="small">Gespeichert ist genau <code>${esc(zfGenau(zfWert(z), 17))}</code>. Auf ${t.stellen} Stellen gerundet: <code>${esc(zfZahlText(zfWert(z), t.stellen))}</code>.</p>`;
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
  const einsen = Array.from({length: bits}, (_, i) => bits - 1 - i).filter(i => zfBit(u, i)).map(i => 1n << BigInt(i));
  if (!einsen.length) return "Alle Bits sind 0, der Wert ist 0.";
  if (einsen.length > 6) return `${einsen.length} Bits sind 1. Ihre Stellenwerte zusammen ergeben ${u}.`;
  return `Jede 1 zählt ihren Stellenwert: ${einsen.join(" + ")} = ${u}.`;
}
function zfGanzSatz(z){
  const b = zfBits(z), v = zfWert(z);
  if (v >= 0n) return `Bit ${b - 1} (Vorzeichen) ist 0, die Zahl ist positiv. ${zfStellenwerte(z.u, b)}`;
  const umgedreht = (1n << BigInt(b)) - 1n - z.u;
  return `Bit ${b - 1} ist 1, die Zahl ist negativ (Zweierkomplement). Den Betrag findest du so: alle Bits umdrehen ergibt ${umgedreht}, plus 1 ergibt ${umgedreht + 1n}. Der Wert ist also −${umgedreht + 1n}.`;
}
const ZF_GENAUIGKEIT = {32: "Real hat nur etwa 6 bis 7 gültige Stellen (TIA-Hilfe: 6, Programmierleitfaden: 7), sicher sind 6",
  64: "LReal hat eine Genauigkeit von 15 Stellen (TIA-Hilfe)"};
const ZF_REAL_SATZ = {
  null: () => "Exponent und Mantisse sind 0: Das ist die Zahl 0.",
  denormal: () => "Exponent 0, Mantisse nicht 0: eine denormalisierte Zahl. Die CPU rechnet damit wie mit 0.",
  unendlich: t => `Exponent ${t.expMax}, Mantisse 0: ${t.vorzeichen ? "minus" : "plus"} unendlich (Inf). Das ist keine gültige Zahl. Anweisungen wie ADD melden dann ENO = FALSE.`,
  nan: t => `Exponent ${t.expMax}, Mantisse nicht 0: NaN (Not a Number), eine ungültige Gleitpunktzahl.`,
  normal: (t, z) => `Wert = ${t.vorzeichen ? "−" : ""}${zfGenau(t.faktor, 17)} × 2<sup>${t.exponent - t.bias}</sup> = ${esc(zfGenau(zfWert(z), 17))}. ${ZF_GENAUIGKEIT[t.bits]}, darum ist nicht jede Dezimalzahl genau darstellbar.`,
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
  real: z => { const t = zfRealTeile(z.u, zfBits(z)); return ZF_REAL_SATZ[t.art](t, z); },
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
  ungenau: z => `<b>Zu ungenau:</b> ${zfZahlText(zfWert(z), zfStellenZahl(z))} ± 1 ergibt in ${z.typ} wieder denselben Wert. So große Zahlen liegen in ${z.typ} mehr als 1 auseinander (ab ${ZF_GLEIT[zfBits(z)].ganzBis} reicht die Mantisse nicht mehr).`,
  bcdGrenze: () => "<b>Grenze:</b> BCD16 hat nur drei Ziffern, also −999 bis +999. INT_TO_BCD16_WORD setzt bei größeren Werten nur das Statusbit OV.",
  bcdUngueltig: () => "<b>Kein BCD:</b> Das Bitmuster enthält eine ungültige Tetrade. Damit kann man nicht rechnen.",
};
const zfMeldungHTML = z => z.meldung ? `<div class="ia-satz warn">${ZF_MELDUNG[z.meldung.art](z, z.meldung)}</div>` : "";

function zfBegriffeHTML(){
  return `<details class="ia-begriffe"><summary>Begriffe: ${ZF_BEGRIFFE.map(b => b[0]).join(", ")}</summary><dl>`
    + ZF_BEGRIFFE.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("") + `</dl></details>`;
}

/* ---------- Ansichten: normal, Speicheraufbau, großes Popup ---------- */
const zfKopfHTML = (z, text) => `<div class="ia-kopf"><b>Probier es aus:</b> ${text}${bxTabs(z.typen, z.typ, "typ")}</div>`;
const zfOhneAdresse = z => z.adresse ? "" : `<p class="small muted">Diese Zahl hat keine feste Adresse. Damit du den Aufbau siehst, liegt sie hier als Beispiel ab %MB0.</p>`;
const zfSpeicherHTML = z => zsHTML(z.sp, zfOperand(z), zfOhneAdresse(z));
function zahlNormalHTML(z){
  return zfKopfHTML(z, "Klicke auf die Bits oder gib eine Zahl ein.")
    + zfTitelHTML(z) + zfBitfeldHTML(z) + zfEingabeHTML(z) + zfMeldungHTML(z) + dtSteckbriefHTML(z.typ)
    + `<div class="zf-unten">${zfTabelleHTML(z)}<div class="zf-zusatz">${zfZusatzHTML(z)}</div></div>` + zfSatzHTML(z) + zfBegriffeHTML();
}
function zahlSpeicherHTML(z){
  return zfKopfHTML(z, "Klicke auf eine Ebene oder auf die Bits.") + zfTitelHTML(z) + zfSpeicherHTML(z)
    + `<div class="zf-eingabe"><button type="button" class="btn small" data-ia-akt="gross">Speicheraufbau groß ansehen</button></div>`
    + dtSteckbriefHTML(z.typ) + zfBegriffeHTML();
}
const ZF_GROSS_TABS = {speicher: "Speicheraufbau", typen: "Datentypen", zeiten: "Zeiten"};
const ZF_GROSS_INHALT = {
  speicher: z => zfTitelHTML(z) + zfSpeicherHTML(z),
  typen: z => dtTabelleHTML(DT_TYPEN, z.typ) + DT_QUELLE,
  zeiten: z => dtTabelleHTML(DT_ZEITEN) + zdHTML(z.zeit) + DT_QUELLE,
};
function zahlGrossHTML(z){
  const knopf = ([k, t]) => `<button type="button" data-ia-akt="tab:${k}" aria-pressed="${k === z.tab}">${t}</button>`;
  return `<div class="ia-kopf"><div class="ia-tabs zf-gross-tabs">${Object.entries(ZF_GROSS_TABS).map(knopf).join("")}</div></div>`
    + ZF_GROSS_INHALT[z.tab](z);
}
const ZF_ANSICHT = {speicher: zahlSpeicherHTML, gross: zahlGrossHTML};
const zahlHTML = z => (ZF_ANSICHT[z.ansicht] || zahlNormalHTML)(z);

/* ---------- Bedienen ---------- */
// Typwechsel: Gleiche Breite behält das Bitmuster (z. B. Word ↔ Int). Andere Breite behält die Zahl, wenn sie passt
// (Int −11 → DInt −11), sonst die unteren Bits.
function zfUmTyp(z, v, altBits){
  if (zfBits(z) === altBits || v === null) return zfKuerzen(z.u, zfBits(z));
  const r = zfMusterParsen(z.typ, String(v));
  return r.fehler ? zfKuerzen(z.u, zfBits(z)) : r.m;
}
function zfTypWechsel(z, t){
  const v = zfWert(z), altBits = zfBits(z);
  z.typ = t; z.meldung = null;
  const o = zfOperand(z);
  zsOperandZeigen(z.sp, o.adr, o.bits);
  z.sp.wahl = {bits: o.bits, adr: o.adr};
  zfNeuerWert(z, zfUmTyp(z, v, altBits));
}
function zfWertEingeben(z, feld){
  const r = zfMusterParsen(z.typ, feld.value);
  z.text = feld.value; z.fehler = r.fehler || null; z.meldung = null;
  if (r.fehler) return;
  const text = z.text;
  zfNeuerWert(z, r.m);
  z.text = text;
}
function zfGrossOeffnen(z){
  zfGrossQuelle = z;
  zgOeffnen("Speicheraufbau und Datentypen", `<div data-interaktiv="zahl" data-gross="1"></div>`, () => zfGrossZu(z));
  zfGrossQuelle = null;
}
// Popup zu: Bytes übernehmen, die kleine Erklärung neu zeichnen
function zfGrossZu(q){
  const g = q.grossZustand; if (!g) return;
  q.sp.bytes = g.sp.bytes; q.grossZustand = null;
  zfAusSpeicher(q);
  iaZeichnen(q.id);
}
// Aktionen der Speicheransicht ändern z.sp; danach liest der Operand seinen Wert aus dem Speicher
const ZF_SPEICHER_AKTION = Object.fromEntries(Object.entries(ZS_AKTION).map(([k, f]) => [k, (z, w, el) => { f(z.sp, w, el); zfAusSpeicher(z); }]));
const ZF_AKTION = {
  ...ZF_SPEICHER_AKTION,
  bit: (z, i) => { zfNeuerWert(z, zfKippen(z.u, +i)); z.meldung = null; },
  typ: zfTypWechsel,
  schritt: (z, d) => {
    const r = zfSchritt(z.typ, z.u, +d);
    z.meldung = r.meldung ? {art: r.meldung, vorher: z.u} : null;
    zfNeuerWert(z, r.m);
  },
  wert: (z, _, feld) => zfWertEingeben(z, feld),
  gross: zfGrossOeffnen,
  tab: (z, t) => { z.tab = t; },
  zeit: (z, _, feld) => { z.zeit.text = feld.value; },
};
iaRegistrieren("zahl", {
  neu: at => {
    const z = zahlNeu(at);
    if (z.quelle) z.quelle.grossZustand = z;
    return z;
  },
  html: zahlHTML,
  aktion: (z, akt, el) => { const [name, wert] = akt.split(":"); ZF_AKTION[name](z, wert, el); },
});
