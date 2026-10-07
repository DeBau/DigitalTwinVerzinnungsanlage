// Vorlage Regelkreis: Bausteine des Blockschaltbilds. Block (mit Text), Summierstelle mit Vorzeichen je Eingang,
// Verzweigung (gefüllter Punkt) und Signal (offenes Ende mit Namen, z. B. w oder x). Alle stehen im 10er-Raster
// mit der Mitte auf einem Rasterpunkt, damit gerade Pfeile auch wirklich gerade sind.
import { INK, MUTE, SVGT, tw } from '../svg.js';
import { BAUSTEIN, SAMPLE, fuelle, registriereGruppe } from '../registry.js';
import { LINIE, platzhalter, rund } from '../bausteine.js';
import { HINWEIS, listenFeld } from '../eigenschaften.js';
import { GLIED, GLIED_B, GLIED_OPTIONEN, gliedInfo, gliedSVG } from './regelkreis-glieder.js';

export const BLOCK_H = 60;
// Blockbreite: Glied fest, sonst nach Text in 20er-Schritten (die Mitte liegt so im 10er-Raster)
export const bw = o => GLIED[o.typ] ? GLIED_B : Math.max(120, Math.round((tw(o.v || "Block") + 30) / 20) * 20);
export function blockSVG(o, edit){
  const w = bw(o), rahmen = `<rect x="${o.x}" y="${o.y}" width="${w}" height="${BLOCK_H}" rx="3" fill="#fff" ${LINIE}/>`;
  if (GLIED[o.typ]) return rahmen + gliedSVG(o, edit);
  return rahmen + (o.v ? SVGT(o.x + w/2, o.y + 35, o.v) : platzhalter(edit, "Block", o.x + w/2, o.y + 35));
}
// Eigenschaftsfeld eines Blocks: Bezeichnung, Verhalten und was das Glied tut
export function blockFelder(o){
  const a = BAUSTEIN.box, info = gliedInfo(o.typ);
  return a.feldliste.map(f => listenFeld(o, a, f)).join("") + (info ? HINWEIS(info) : "");
}

/* ---------- Summierstelle ---------- */
export const VZ_STANDARD = {vl: "+", vo: "", vu: "−"};   // + an w (links), − an x (unten)
export const VZ_ORT = {vl: [-19, -6, "end"], vo: [8, -19, "start"], vu: [8, 29, "start"]};
export const VZ_OPTIONEN = [["+", "+ (addieren)"], ["−", "− (abziehen)"], ["", "kein Eingang"]];
export const vorzeichen = (o, f) => o[f] ?? VZ_STANDARD[f];
export function summierstelle(o){
  const k = 10.6, kreuz = `M${o.x - k} ${o.y - k}L${o.x + k} ${o.y + k}M${o.x + k} ${o.y - k}L${o.x - k} ${o.y + k}`;
  const zeichen = Object.entries(VZ_ORT).filter(([f]) => vorzeichen(o, f))
    .map(([f, [dx, dy, a]]) => SVGT(o.x + dx, o.y + dy, vorzeichen(o, f), a, 14, 700)).join("");
  return `<circle cx="${o.x}" cy="${o.y}" r="15" fill="#fff" ${LINIE}/><path d="${kreuz}" stroke="${INK}" stroke-width="1"/>` + zeichen;
}

/* ---------- Signal ---------- */
// Namen der Signale bei PID_Compact (Siemens, Beitrag 100746401)
export const PID_COMPACT = {w: "Setpoint", x: "Input", y: "Output", z: "Disturbance"};
export const pidName = v => PID_COMPACT[String(v || "").trim().charAt(0).toLowerCase()];
export const PID_INFO = "Bei PID_Compact (Siemens, Beitrag 100746401) heißen die Signale so: w = Setpoint, x = Input, "
  + "y = Output, z = Disturbance.";
export function signal(o, edit){
  const name = o.v ? SVGT(o.x, o.y - 9, o.v, "middle", 14, 700) : platzhalter(edit, "Signal", o.x, o.y - 9);
  if (!edit) return name;
  const pid = pidName(o.v) ? SVGT(o.x, o.y - 27, `PID_Compact: ${pidName(o.v)}`, "middle", 9, 400, MUTE) : "";
  return name + pid + `<circle cx="${o.x}" cy="${o.y}" r="3" fill="#fff" stroke="${MUTE}" stroke-width="1.2"/>`;
}

fuelle(BAUSTEIN, {
  box: {g: "regel", n: "Block", zeichne: blockSVG,
    umriss: o => ({x: o.x, y: o.y, w: bw(o), h: BLOCK_H}),
    neu(o, [px, py], mk){
      if (mk && mk.typ) o.typ = mk.typ;
      o.v = ""; o.x = px - bw(o) / 2; o.y = py - BLOCK_H / 2;
    },
    feldliste: [["v", "Bezeichnung"], ["typ", "Verhalten", GLIED_OPTIONEN]], felder: blockFelder, umbau: ["typ"],
    beschriftung: {sofort: true, hinweis: "Bezeichnung, z. B. Regler"}},
  sum: {g: "regel", n: "Summierstelle", ...rund(15), beschriftung: false, zeichne: summierstelle,
    def: VZ_STANDARD,
    feldliste: [["vl", "Vorzeichen links", VZ_OPTIONEN], ["vo", "Vorzeichen oben", VZ_OPTIONEN], ["vu", "Vorzeichen unten", VZ_OPTIONEN]],
    info: "Üblich: + am Sollwert w (links) und − an der Rückführung x (unten). Dann rechnet die Stelle e = w − x."},
  abzw: {g: "regel", n: "Verzweigung", ...rund(6), beschriftung: false,
    zeichne: o => `<circle cx="${o.x}" cy="${o.y}" r="3.5" fill="${INK}"/>`,
    info: "Hier teilt sich ein Signal, z. B. die Regelgröße x zum Ausgang und zur Rückführung."},
  sig: {g: "regel", n: "Signal", zeichne: signal,
    umriss: o => ({x: o.x - 15, y: o.y - 25, w: 30, h: 32}), mitte: o => [o.x, o.y],
    neu(o, [px, py]){ o.x = px; o.y = py; o.v = ""; },
    feldliste: [["v", "Name", "w, x oder z"]], info: PID_INFO,
    beschriftung: {sofort: true, hinweis: "Name des Signals, z. B. w (Sollwert), x (Istwert) oder z (Störgröße)"}},
});
fuelle(SAMPLE, {
  box: [{k: "box", x: 2, y: 2, v: "Regler"}, "0 0 124 64"],
  sum: [{k: "sum", x: 32, y: 22}, "0 0 64 58"],
  abzw: [{k: "abzw", x: 24, y: 24}, "0 0 48 48", `<path d="M0 24H48M24 24V48" stroke="${INK}" stroke-width="1.6"/>`],
  sig: [{k: "sig", x: 24, y: 34, v: "w"}, "0 0 48 48", `<path d="M24 34H48" stroke="${INK}" stroke-width="1.6"/>`],
});
// Übertragungsglieder als Palettenvarianten des Blocks (Gruppe regelglied, nur für die Palette).
// "typ" steht in Anführungszeichen, sonst trägt module.mjs imports einen Import des gleichnamigen Exports ein.
registriereGruppe("regelglied", {name: "Übertragungsglieder"});
for (const [gt, [n]] of Object.entries(GLIED)) {
  fuelle(BAUSTEIN, {["glied_" + gt]: {g: "regelglied", n, mk: {k: "box", "typ": gt}}});
  fuelle(SAMPLE, {["glied_" + gt]: [{k: "box", "typ": gt, x: 2, y: 14}, "0 0 84 76"]});
}
