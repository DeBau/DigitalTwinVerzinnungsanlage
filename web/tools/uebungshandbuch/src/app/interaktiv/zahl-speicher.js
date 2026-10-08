/* ---------- Interaktive Erklärungen: Speicheraufbau (Darstellung und Bedienung) ---------- */
// Oben das Doppelwort (%ID0), darunter die Wörter (%IW0 | %IW2), die vier Bytes und die 32 Bits mit Bitadresse und
// Gerät aus der Signalliste. Beim Wort-Operanden steht oben das Wort (%IW2), darüber hinaus wählbar Doppelwort und
// LWord (8 Byte), Startadresse und überlappende Wörter (%IW1 = %IB1 + %IB2).
// Klick auf eine Ebene wählt sie: Ihre Bits und Teile werden markiert (höherwertig, niederwertig, Bit hi bis lo).
// Klick auf ein Bit schaltet es, alle Ebenen rechnen mit. Die gewählte Ebene kann man hex oder dezimal eingeben.
// Modell: zahl-speicher-modell.js. Aufrufer (zahl.js) gleicht danach seinen Operanden mit dem Speicher ab.
import { chip, esc } from '../basis.js';
import { SIG } from '../daten.js';
import { ZF_GLEIT, ZF_TYPEN, zfBinaer, zfBit, zfEbeneParsen, zfHex, zfLesen, zfZahlText } from './zahl-modell.js';
import { zdText } from './zahl-zeit.js';
import { ZS_BREITEN, ZS_KURZ, zsBitKippen, zsBitNr, zsBitsIn, zsByte, zsDrin, zsFensterBytes, zsGleich, zsLesen, zsSchreiben, zsStarts,
  zsTeilweise, zsWertigkeit, zsZeilen } from './zahl-speicher-modell.js';

/* ---------- Kennzeichen zu einer Bitadresse (aus der Signalliste) ---------- */
let zsSignale = null;
export function zsKennzeichen(adresse){
  if (!zsSignale) {
    zsSignale = {};
    for (const [tag, liste] of Object.entries(SIG)) for (const e of liste) zsSignale[e.a] = zsSignale[e.a] || tag;
  }
  return zsSignale[adresse];
}

/* ---------- Namen und Rollen ---------- */
export const zsName = (sp, f) => ZS_KURZ[f.bits] ? `%${sp.bereich}${ZS_KURZ[f.bits]}${f.adr}` : `LWord ab %${sp.bereich}B${f.adr}`;
const ZS_TEIL = {8: "Byte", 16: "Wort", 32: "Doppelwort"};
const ZS_WERTIG = {hoeher: "höherwertiges", nieder: "niederwertiges", "": ""};
const zsBitText = b => `Bit ${b.hi} bis ${b.lo}`;
// [Klasse, Text] des Felds f gegenüber der gewählten Ebene w
const ZS_ROLLE = [
  [(f, w) => zsGleich(f, w), () => ["wahl", "gewählt"]],
  [(f, w) => zsDrin(f, w), (f, w, sp) => ["drin", `${ZS_WERTIG[zsWertigkeit(f, w)]} ${ZS_TEIL[f.bits]} · ${zsBitText(zsBitsIn(f, w))}`.trim()]],
  [(f, w) => zsDrin(w, f), (f, w, sp) => ["enthaelt", `enthält ${zsName(sp, w)}`]],
  [(f, w) => zsTeilweise(f, w), (f, w, sp) => ["teil", `überlappt ${zsName(sp, w)}`]],
  [() => true, () => ["", ""]],
];
const zsRolle = (sp, f, w) => ZS_ROLLE.find(([pruefe]) => pruefe(f, w))[1](f, w, sp);

/* ---------- Gitter: Ebenen und Bits ---------- */
function zsFeldHTML(sp, f, op){
  const m = zsLesen(sp, f.adr, f.bits), [klasse, rolle] = zsRolle(sp, f, sp.wahl);
  const opText = op && zsGleich(f, op) ? `<span class="zs-op">dein Operand</span>` : "";
  const ort = `grid-column:${f.spalte * 8 + 1} / span ${f.bits}`;
  return `<button type="button" class="zs-feld ${klasse}${f.versatz ? " versetzt" : ""}" style="${ort}" data-ia-akt="wahl:${f.bits}-${f.adr}" `
    + `aria-pressed="${klasse === "wahl"}"><b>${zsName(sp, f)}</b>${opText}<span class="zs-wert"><code>${zfHex(m, f.bits)}</code> `
    + `<code>${m}</code></span><span class="zs-rolle">${rolle || "&nbsp;"}</span></button>`;
}
function zsBitHTML(sp, adr, j){
  const an = zfBit(zsByte(sp, adr), j), nr = zsBitNr(sp.wahl, adr, j), bitAdr = `%${sp.bereich}${adr}.${j}`, tag = zsKennzeichen(bitAdr);
  const titel = `${bitAdr}${nr === null ? "" : `, Bit ${nr} in ${zsName(sp, sp.wahl)}`}`;
  return `<div class="zs-bit${nr === null ? "" : " drin"}${j === 7 ? " links" : ""}"><span class="zf-nr">${nr === null ? "&nbsp;" : nr}</span>`
    + `<button type="button" class="zf-bit${an ? " an" : ""}" data-ia-akt="spbit:${adr}-${j}" title="${titel}" aria-label="${titel}" aria-pressed="${!!an}">${an}</button>`
    + `<span class="zf-adr">${adr}.${j}</span>${tag ? `<span class="zf-tag">${chip(tag)}</span>` : ""}</div>`;
}
function zsGitterHTML(sp, op){
  const n = zsFensterBytes(sp);
  const zeilen = zsZeilen(sp).map(e => `<div class="zs-zeile" style="--n:${8 * n}">${e.felder.map(f => zsFeldHTML(sp, f, op)).join("")}</div>`);
  const bits = Array.from({length: n}, (_, k) => [7, 6, 5, 4, 3, 2, 1, 0].map(j => zsBitHTML(sp, sp.start + k, j)).join("")).join("");
  return `<div class="zs-rollen"><div class="zs-gitter">${zeilen.join("")}<div class="zs-zeile zs-bits" style="--n:${8 * n}">${bits}</div></div></div>`;
}

/* ---------- Werkzeugleiste ---------- */
const ZS_BREITE_NAME = {2: "Wort", 4: "Doppelwort", 8: "LWord"};
function zsLeisteHTML(sp){
  const tabs = (liste, akt, aktiv, text) => `<div class="ia-tabs">${liste.map(w =>
    `<button type="button" data-ia-akt="${akt}:${w}" aria-pressed="${w === aktiv}">${text(w)}</button>`).join("")}</div>`;
  const start = tabs(zsStarts(sp), "start", sp.start, a => zsName(sp, {adr: a, bits: 8 * sp.n}));
  const ueberl = sp.n >= 4 ? `<button type="button" class="btn small" data-ia-akt="ueberl" aria-pressed="${sp.ueberlappung}">`
    + `${sp.ueberlappung ? "✓ " : ""}Überlappende Wörter zeigen</button>` : "";
  return `<div class="zs-leiste"><span class="small">Zeigen</span>${tabs(ZS_BREITEN, "breite", sp.n, n => ZS_BREITE_NAME[n])}`
    + `<span class="small">ab</span>${start}${ueberl}</div>`;
}

/* ---------- Gewählte Ebene: Aufbau, Werte, Eingabe ---------- */
function zsAufbauText(sp, w){
  if (w.bits === 8) return `${zsName(sp, w)} ist ein Byte: Bit 7 links zählt 128, Bit 0 rechts zählt 1.`;
  const teile = Array.from({length: w.bits / 8}, (_, k) => ({adr: w.adr + k, bits: 8}));
  const wertig = {hoeher: "höherwertig, ", nieder: "niederwertig, ", "": ""};
  const text = teile.map(b => `${zsName(sp, b)} (${wertig[zsWertigkeit(b, w)]}${zsBitText(zsBitsIn(b, w))})`).join(", ");
  return `${zsName(sp, w)} = ${text}. Big Endian: Das Byte mit der niedrigeren Adresse ist das höherwertige.`;
}
const zsStellen = t => ZF_TYPEN[t].art === "real" ? ZF_GLEIT[ZF_TYPEN[t].bits].stellen : 7;
function zsAlsHTML(m, bits){
  const typen = Object.keys(ZF_TYPEN).filter(t => ZF_TYPEN[t].bits === bits);
  const eintrag = (t, wert) => `<span class="zf-als"><b>${t}</b> ${esc(wert)}</span>`;
  const zeit = bits === 32 ? eintrag("Time", zdText(Number(BigInt.asIntN(32, m)))) : "";
  return typen.map(t => eintrag(t, zfZahlText(zfLesen(t, m), zsStellen(t)))).join(" ") + " " + zeit;
}
function zsUeberlappText(sp, w){
  const versetzt = w.bits === 16 && (w.adr - sp.start) % 2 === 1;
  if (!versetzt && !sp.ueberlappung) return "";
  const a = versetzt ? w.adr : sp.start + 1, wort = x => zsName(sp, {adr: x, bits: 16}), byte = x => zsName(sp, {adr: x, bits: 8});
  return `<div class="ia-satz warn"><b>Überlappung:</b> ${wort(a)} besteht aus ${byte(a)} und ${byte(a + 1)}. ${byte(a)} ist zugleich `
    + `das niederwertige Byte von ${wort(a - 1)}, ${byte(a + 1)} das höherwertige Byte von ${wort(a + 1)}. Schreibst du ${wort(a)}, `
    + `ändern sich ${wort(a - 1)} und ${wort(a + 1)} mit.</div>`;
}
function zsDetailHTML(sp){
  const w = sp.wahl, m = zsLesen(sp, w.adr, w.bits), e = sp.eingabe || {text: zfHex(m, w.bits), fehler: null};
  const feld = `<input type="text" data-ia-eingabe="spwert" value="${esc(e.text)}" spellcheck="false" autocomplete="off">`;
  const fehler = e.fehler ? `<div class="zf-fehler">${esc(e.fehler)}</div>` : "";
  return `<div class="zs-detail"><div class="zs-detail-kopf"><b>${zsName(sp, w)}</b> · ${w.bits} Bit</div>`
    + `<p class="small">${zsAufbauText(sp, w)}</p>`
    + `<div class="zf-eingabe"><label>Wert für ${zsName(sp, w)} ${feld}</label><span class="small muted">z. B. 16#00FF, W#16#F0F0, -5, 1.5, 2#1010</span></div>${fehler}`
    + `<table class="zf-tab"><tbody><tr><th>Binär (2#)</th><td><code>${zfBinaer(m, w.bits)}</code></td></tr>`
    + `<tr><th>Gelesen als</th><td>${zsAlsHTML(m, w.bits)}</td></tr></tbody></table></div>`;
}
const ZS_REGEL = `<p class="small muted">Regel nach TIA-Hilfe „L: Laden“ und Programmierleitfaden 2.6.3: Bei Adressen wie %ID0 steht `
  + `das Byte mit der niedrigsten Adresse vorn, als höherwertiges Byte (Big Endian). Die S7-1500 legt Daten in optimierten Bausteinen `
  + `intern anders ab (Little Endian). Das merkst du nicht, denn dort greifst du nur symbolisch zu.</p>`;
export function zsHTML(sp, op, hinweis = ""){
  return `<div class="zs">${zsLeisteHTML(sp)}${hinweis}${zsGitterHTML(sp, op)}${zsUeberlappText(sp, sp.wahl)}${zsDetailHTML(sp)}${ZS_REGEL}</div>`;
}

/* ---------- Bedienen ---------- */
const zsZahlen = w => w.split("-").map(Number);
function zsWahlImFenster(sp){
  const n = zsFensterBytes(sp), w = sp.wahl;
  if (w.adr < sp.start || w.adr + w.bits / 8 > sp.start + n) sp.wahl = {bits: 8 * n, adr: sp.start};
  sp.eingabe = null;
}
function zsWertEingeben(sp, feld){
  const r = zfEbeneParsen(sp.wahl.bits, feld.value);
  sp.eingabe = {text: feld.value, fehler: r.fehler || null};
  if (!r.fehler) zsSchreiben(sp, sp.wahl.adr, sp.wahl.bits, r.m);
}
export const ZS_AKTION = {
  wahl: (sp, w) => { const [bits, adr] = zsZahlen(w); sp.wahl = {bits, adr}; sp.eingabe = null; },
  spbit: (sp, w) => { const [adr, j] = zsZahlen(w); zsBitKippen(sp, adr, j); sp.eingabe = null; },
  start: (sp, w) => { sp.start = +w; zsWahlImFenster(sp); },
  ueberl: sp => { sp.ueberlappung = !sp.ueberlappung; },
  breite: (sp, w) => { sp.n = +w; zsWahlImFenster(sp); },
  spwert: (sp, _, feld) => zsWertEingeben(sp, feld),
};
