/* ---------- Interaktive Erklärung: Bitmuster mit Maske verknüpfen, schieben und rotieren ---------- */
// Platzhalter: <div data-interaktiv="bitmuster" data-op="AND,OR,XOR,SHL,SHR,ROL,ROR" data-typ="Byte,Word" data-wert="16#0F"
//   data-maske="16#F0" data-n="1" data-sa="#value" data-sq="#out"></div>
// op: Wortverknüpfungen und Schiebebefehle (mehrere: Umschalter). typ: Byte, Word. wert, maske: Bitmuster (16#…, 2#…, dezimal).
// n: Anzahl der Stellen beim Schieben. sa, sq: Namen in SCL (optional).
// Wert und Maske anklicken, N ändern; das Ergebnis zeigt geänderte Bits, wandernde, herausfallende und nachgeschobene Bits.
// Die Leuchten −PF1 bis −PF4 zeigen die Ergebnis-Bits 0 bis 3; „Ergebnis übernehmen“ und „Abspielen“ machen daraus ein Lauflicht.
import { esc } from '../basis.js';
import { iaName, iaRegistrieren, iaZeichnen } from './basis.js';
import { bxSclHTML, bxTabs } from './box-bild.js';
import { bmIstSchieben, bmSchieben, bmVerknuepfen } from './bitmuster-modell.js';
import { ZF_TYPEN, zfBit, zfHex, zfKippen, zfKuerzen, zfParsen } from './zahl-modell.js';

const BM_OPS = ["AND", "OR", "XOR", "SHL", "SHR", "ROL", "ROR"];
const BM_TYPEN = ["Byte", "Word"];
const BM_LAMPEN = ["PF1", "PF2", "PF3", "PF4"];
const BM_TAKT = 700;
const BM_UHR = new Map();
const BM_BEGRIFFE = [
  ["Wortverknüpfung", "AND, OR und XOR für ganze Bytes oder Wörter: Bit 0 wird mit Bit 0 verknüpft, Bit 1 mit Bit 1 und so weiter."],
  ["Maske", "Das zweite Bitmuster einer Wortverknüpfung. Es bestimmt, welche Bits gelöscht (AND mit 0), gesetzt (OR mit 1) oder umgedreht (XOR mit 1) werden."],
  ["Schieben (SHL, SHR)", "Alle Bits wandern um N Stellen. Auf der einen Seite fallen Bits heraus, auf der anderen kommen Nullen nach."],
  ["Rotieren (ROL, ROR)", "Wie Schieben, aber die herausfallenden Bits kommen auf der anderen Seite wieder herein. Es geht kein Bit verloren."],
  ["Slice-Zugriff", "Ein Teil einer Variablen über ihren Namen: .%X3 ist Bit 3, .%B0 das niederwertigste Byte, .%W0 das niederwertigste Wort."],
];
const BM_SATZ = {
  AND: "AND lässt nur die Bits durch, bei denen die Maske 1 ist. Wo die Maske 0 ist, wird das Bit 0.",
  OR: "OR setzt die Bits auf 1, bei denen die Maske 1 ist. Die anderen bleiben, wie sie sind.",
  XOR: "XOR dreht die Bits um, bei denen die Maske 1 ist. Die anderen bleiben, wie sie sind.",
  SHL: "SHL schiebt alle Bits nach links. Rechts kommen Nullen nach, links fallen Bits heraus.",
  SHR: "SHR schiebt alle Bits nach rechts. Links kommen Nullen nach, rechts fallen Bits heraus.",
  ROL: "ROL rotiert alle Bits nach links. Was links herausfällt, kommt rechts wieder herein.",
  ROR: "ROR rotiert alle Bits nach rechts. Was rechts herausfällt, kommt links wieder herein.",
};

function bitmusterNeu(at){
  const ops = (at.op || "AND").split(",").map(o => o.trim()).filter(o => BM_OPS.includes(o));
  const typen = (at.typ || "Byte").split(",").map(t => t.trim()).filter(t => BM_TYPEN.includes(t));
  const typ = typen[0] || "Byte", bits = ZF_TYPEN[typ].bits;
  const muster = text => zfParsen(typ, text || "0").u || 0;
  return {ops: ops.length ? ops : ["AND"], op: ops[0] || "AND", typen: typen.length ? typen : ["Byte"], typ,
    wert: muster(at.wert), maske: muster(at.maske), n: Math.max(0, +at.n || 1), bits,
    sa: at.sa || "#value", sq: at.sq || "#out", lauf: 0, gezeigt: 0, laeuft: false};
}
function bmErgebnis(z){
  return bmIstSchieben(z.op) ? bmSchieben(z.op, z.wert, z.n, z.bits) : bmVerknuepfen(z.op, z.wert, z.maske, z.bits);
}
const bmHex = (z, u) => zfHex(u, z.bits);

/* ---------- Bitreihen ---------- */
function bmKopfzeile(z){
  const nummern = Array.from({length: z.bits}, (_, k) => `<span>${z.bits - 1 - k}</span>`).join("");
  return `<div class="bm-reihe bm-nummern" style="--n:${z.bits}">${nummern}</div>`;
}
function bmEingabeReihe(z, akt, u, titel, klasse){
  const zelle = i => `<span><button type="button" class="bm-bit${zfBit(u, i) ? " an" : ""}" data-ia-akt="${akt}:${i}" aria-label="${titel} Bit ${i}" aria-pressed="${!!zfBit(u, i)}">${zfBit(u, i)}</button></span>`;
  const zellen = Array.from({length: z.bits}, (_, k) => zelle(z.bits - 1 - k)).join("");
  return `<div class="bm-zeile ${klasse}"><div class="bm-titel">${titel} <code>${bmHex(z, u)}</code></div><div class="bm-reihe" style="--n:${z.bits}">${zellen}</div></div>`;
}
// Ergebniszelle: geändert (Wortverknüpfung), gewandert um dx Spalten, nachgeschoben (neu) oder rundherum (rund)
function bmErgebnisZelle(x, i){
  const klassen = ["bm-bit", "erg", x.an ? "an" : "", x.geaendert ? "geaendert" : "", x.quelle === null ? "neu" : "", x.rund ? "rund" : ""];
  const dx = x.quelle === undefined || x.quelle === null ? 0 : i - x.quelle;
  return `<span style="--dx:${dx}"><b class="${klassen.filter(Boolean).join(" ")}">${x.an}</b></span>`;
}
function bmErgebnisReihe(z, erg, animiert){
  const zellen = Array.from({length: z.bits}, (_, k) => z.bits - 1 - k).map(i => bmErgebnisZelle(erg.bits[i], i)).join("");
  return `<div class="bm-zeile bm-ergebnis"><div class="bm-titel">Ergebnis ${esc(z.sq)} <code>${bmHex(z, erg.u)}</code></div>`
    + `<div class="bm-reihe${animiert ? " bm-lauf" : ""}" style="--n:${z.bits}">${zellen}</div></div>`;
}
function bmNHTML(z){
  const grenze = z.n > z.bits ? ` <span class="small">(größer als ${z.bits} Bit)</span>` : "";
  return `<div class="bm-zeile"><div class="bm-titel">N (Anzahl Stellen)</div><div class="bm-n">`
    + `<button type="button" class="btn small" data-ia-akt="n:-1" aria-label="N kleiner">−</button><b>${z.n}</b>`
    + `<button type="button" class="btn small" data-ia-akt="n:1" aria-label="N größer">+</button>${grenze}</div></div>`;
}
function bmRausHTML(z, erg){
  if (!erg.raus || !erg.raus.length) return "";
  const liste = erg.raus.slice().reverse().map(r => `<span class="bm-raus${r.an ? " an" : ""}">Bit ${r.i}: ${r.an}</span>`).join("");
  return `<div class="bm-rausliste"><span class="small">Herausgefallen:</span>${liste}</div>`;
}

/* ---------- Leuchten, SCL, Slice ---------- */
function bmLampenHTML(z, erg){
  const lampe = (tag, i) => `<div class="bm-lampe${zfBit(erg.u, i) ? " an" : ""}"><i></i>${iaName(tag)}<code>${esc(z.sq)}.%X${i}</code></div>`;
  const knopf = z.laeuft ? `<button type="button" class="btn small" data-ia-akt="pause">Anhalten</button>`
    : `<button type="button" class="btn small primary" data-ia-akt="abspielen">Abspielen</button>`;
  return `<div class="bm-lampen">${BM_LAMPEN.map(lampe).join("")}</div>`
    + `<div class="bm-steuer"><button type="button" class="btn small" data-ia-akt="takt">Ergebnis übernehmen (${esc(z.sa)} := ${esc(z.sq)})</button>${knopf}</div>`;
}
const BM_SCL = {
  logik: (z) => `${z.sq} := ${z.sa} ${z.op} ${bmHex(z, z.maske)};`,
  schieben: (z) => `${z.sq} := ${z.op}(IN := ${z.sa}, N := ${z.n});`,
};
function bmSclHTML(z, erg){
  const code = BM_SCL[bmIstSchieben(z.op) ? "schieben" : "logik"](z);
  const status = [[z.sa, bmHex(z, z.wert), null], [z.sq, bmHex(z, erg.u), null]];
  const bytes = z.bits > 8 ? [0, 1].map(k => [`${z.sq}.%B${k}`, zfHex(Math.floor(erg.u / 256 ** k) % 256, 8), null]) : [];
  const slices = [0, 1, 2, 3].map(i => [`${z.sq}.%X${i}`, zfBit(erg.u, i) ? "TRUE" : "FALSE", !!zfBit(erg.u, i)]);
  return bxSclHTML(code, [...status, ...bytes, ...slices])
    + `<p class="small muted">Slice-Zugriff: <code>.%X3</code> ist Bit 3, <code>.%B0</code> das niederwertigste Byte (Bit 7 bis 0). Die Nummer 0 ist immer das niederwertigste Teil.</p>`;
}

/* ---------- Satz ---------- */
function bmNText(z){
  if (!bmIstSchieben(z.op) || z.n <= z.bits) return "";
  if (z.op === "SHL" || z.op === "SHR") return ` N = ${z.n} ist größer als ${z.bits} Bit: Dann wird um alle verfügbaren Stellen geschoben, das Ergebnis ist 0.`;
  return ` N = ${z.n} ist größer als ${z.bits} Bit: Es wird trotzdem um ${z.n} Stellen rotiert. Das wirkt wie ${z.n % z.bits} Stellen, weil nach ${z.bits} Stellen alles wieder am Anfang steht.`;
}
function bmZaehlText(z, erg){
  if (!bmIstSchieben(z.op)) {
    const n = erg.bits.filter(x => x.geaendert).length;
    return n ? ` ${n} ${n === 1 ? "Bit hat" : "Bits haben"} sich geändert (gelb umrandet).` : " Kein Bit hat sich geändert.";
  }
  const neu = erg.bits.filter(x => x.quelle === null).length, raus = erg.raus.length;
  if (z.op.startsWith("RO")) return ` N = ${z.n}: Kein Bit geht verloren.`;
  return ` N = ${z.n}: ${raus} ${raus === 1 ? "Bit fällt" : "Bits fallen"} heraus, ${neu} ${neu === 1 ? "Null kommt" : "Nullen kommen"} nach.`;
}
function bmSatzHTML(z, erg){
  return `<div class="ia-satz">${BM_SATZ[z.op]}${bmZaehlText(z, erg)}${bmNText(z)} Ergebnis: <code>${bmHex(z, z.wert)}</code> → <code>${bmHex(z, erg.u)}</code>.</div>`;
}
function bmBegriffeHTML(){
  return `<details class="ia-begriffe"><summary>Begriffe: ${BM_BEGRIFFE.map(b => b[0]).join(", ")}</summary><dl>`
    + BM_BEGRIFFE.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("") + `</dl></details>`;
}
function bitmusterHTML(z){
  const erg = bmErgebnis(z), animiert = z.lauf !== z.gezeigt;
  z.gezeigt = z.lauf;   // die Wanderung nur einmal je Änderung abspielen
  const zweite = bmIstSchieben(z.op) ? bmNHTML(z) : bmEingabeReihe(z, "m", z.maske, "Maske", "bm-maske");
  return `<div class="ia-kopf"><b>Probier es aus:</b> Klicke auf die Bits.${bxTabs(z.ops, z.op, "op")}${bxTabs(z.typen, z.typ, "typ")}</div>`
    + `<div class="bm-feld">${bmKopfzeile(z)}${bmEingabeReihe(z, "w", z.wert, `Wert ${esc(z.sa)}`, "")}${zweite}${bmErgebnisReihe(z, erg, animiert)}${bmRausHTML(z, erg)}</div>`
    + bmSatzHTML(z, erg) + `<div class="bm-unten"><div>${bmLampenHTML(z, erg)}</div><div>${bmSclHTML(z, erg)}</div></div>` + bmBegriffeHTML();
}

/* ---------- Bedienen ---------- */
function bmAnhalten(z){ clearInterval(BM_UHR.get(z.id)); BM_UHR.delete(z.id); z.laeuft = false; }
function bmTakt(z){ z.wert = bmErgebnis(z).u; z.lauf++; }
function bmAbspielen(z){
  z.laeuft = true;
  BM_UHR.set(z.id, setInterval(() => { bmTakt(z); if (!iaZeichnen(z.id)) bmAnhalten(z); }, BM_TAKT));
}
const BM_AKTION = {
  w: (z, i) => { z.wert = zfKippen(z.wert, +i); z.lauf++; },
  m: (z, i) => { z.maske = zfKippen(z.maske, +i); },
  n: (z, d) => { z.n = Math.max(0, Math.min(40, z.n + +d)); z.lauf++; },
  op: (z, op) => { z.op = op; z.lauf++; },
  typ: (z, t) => { z.typ = t; z.bits = ZF_TYPEN[t].bits; z.wert = zfKuerzen(z.wert, z.bits); z.maske = zfKuerzen(z.maske, z.bits); },
  takt: bmTakt,
  abspielen: bmAbspielen,
  pause: bmAnhalten,
};
iaRegistrieren("bitmuster", {
  neu: bitmusterNeu,
  html: bitmusterHTML,
  aktion: (z, akt) => { const [name, wert] = akt.split(":"); BM_AKTION[name](z, wert); },
});
