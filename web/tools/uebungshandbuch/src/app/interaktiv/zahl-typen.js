/* ---------- Interaktive Erklärungen: Zahlenformate, Steckbrief der Datentypen ---------- */
// Breite, Wertebereich, Werteingaben und CPU-Familien nach TIA-Hilfe V21 (Seiten BOOL, BYTE … LREAL, S5TIME, TIME, LTIME,
// die Familien aus den Seitentiteln, z. B. „LWORD (S7-1500, S7-1200 G2)“). Abgeglichen mit „Übersicht Datentypen
// TIA-Portal“ von spshaus (11.2.2026, devInput/TIA_Portal_Uebersicht_Datentypen.pdf). Die Kürzel (x, b, w …) stehen
// nur bei spshaus, nicht in der TIA-Hilfe. Abweichungen zwischen beiden stehen in abw.
// cpu: [S7-300/400, S7-1200, S7-1200 G2, S7-1500], 1 = kann den Typ
import { esc } from '../basis.js';

export const DT_CPU = ["S7-300/400", "S7-1200", "S7-1200 G2", "S7-1500"];
const DT_ALLE = [1, 1, 1, 1], DT_OHNE_300 = [0, 1, 1, 1], DT_NUR_64 = [0, 0, 1, 1];
const DT_BITFOLGE = "Bitfolge: kann nicht auf größer oder kleiner verglichen werden (TIA-Hilfe).";

export const DT_TYPEN = {
  Bool:  {name: "BOOL", kurz: "x", bits: "1", bereich: "FALSE oder TRUE, BOOL#0 oder BOOL#1",
    ein: ["TRUE", "BOOL#1", "BOOL#TRUE"], cpu: DT_ALLE, info: "S7-1500: Im Baustein mit optimiertem Zugriff belegt ein Bool 1 Byte."},
  Byte:  {name: "BYTE", kurz: "b", bits: "8", bereich: "16#0 bis 16#FF, dezimal −128 bis +127 oder 0 bis 255",
    ein: ["15", "BYTE#15", "B#15", "B#16#0F", "2#0000_1111"], cpu: DT_ALLE, info: DT_BITFOLGE,
    abw: "spshaus nennt nur B#16#00 bis B#16#FF. Die TIA-Hilfe erlaubt auch dezimale Werte wie bei SINT und USINT."},
  Word:  {name: "WORD", kurz: "w", bits: "16", bereich: "16#0 bis 16#FFFF, dezimal −32_768 bis +32_767 oder 0 bis 65_535",
    ein: ["16#F0F0", "WORD#16#F0F0", "W#16#F0F0", "61_680", "C#55 (BCD, nicht in SCL)"], cpu: DT_ALLE, info: DT_BITFOLGE,
    abw: "spshaus nennt nur W#16#0000 bis W#16#FFFF. Die TIA-Hilfe erlaubt auch dezimale Werte wie bei INT und UINT und BCD mit C#."},
  DWord: {name: "DWORD", kurz: "dw", bits: "32", bereich: "16#0000_0000 bis 16#FFFF_FFFF, dezimal wie DINT oder UDINT",
    ein: ["15793935", "DWORD#15793935", "DW#15793935", "DW#16#00F0_FF0F"], cpu: DT_ALLE, info: DT_BITFOLGE,
    abw: "spshaus nennt nur DW#16#0000 0000 bis DW#16#FFFF FFFF, die TIA-Hilfe auch dezimale Werte."},
  LWord: {name: "LWORD", kurz: "lw", bits: "64", bereich: "16#0 bis 16#FFFF_FFFF_FFFF_FFFF, dezimal wie LINT oder ULINT",
    ein: ["26123590360715", "LWORD#26123590360715", "LW#26123590360715", "LW#16#0000_0000_5F52_DE8B"], cpu: DT_NUR_64,
    info: DT_BITFOLGE + " Für LWORD nennt die TIA-Hilfe keine absolute Adresse wie %MB, %MW oder %MD."},
  SInt:  {name: "SINT", kurz: "si", bits: "8", bereich: "−128 bis +127", ein: ["+44", "SINT#+44", "SINT#16#2C"], cpu: DT_OHNE_300},
  Int:   {name: "INT", kurz: "i", bits: "16", bereich: "−32_768 bis +32_767", ein: ["+3785", "INT#+3785", "INT#16#0EC9"], cpu: DT_ALLE},
  DInt:  {name: "DINT", kurz: "di", bits: "32", bereich: "−2_147_483_648 bis +2_147_483_647", ein: ["125790", "DINT#125790", "L#275"], cpu: DT_ALLE},
  LInt:  {name: "LINT", kurz: "li", bits: "64", bereich: "−9_223_372_036_854_775_808 bis +9_223_372_036_854_775_807",
    ein: ["+154325790816159", "LINT#+154325790816159"], cpu: DT_NUR_64},
  USInt: {name: "USINT", kurz: "usi", bits: "8", bereich: "0 bis 255", ein: ["78", "USINT#78", "USINT#16#4E"], cpu: DT_OHNE_300},
  UInt:  {name: "UINT", kurz: "ui", bits: "16", bereich: "0 bis 65_535", ein: ["65295", "UINT#65295", "UINT#16#FF0F"], cpu: DT_OHNE_300},
  UDInt: {name: "UDINT", kurz: "udi", bits: "32", bereich: "0 bis 4_294_967_295", ein: ["4042322160", "UDINT#4042322160"], cpu: DT_OHNE_300},
  ULInt: {name: "ULINT", kurz: "uli", bits: "64", bereich: "0 bis 18_446_744_073_709_551_615",
    ein: ["154325790816159", "ULINT#154325790816159"], cpu: DT_NUR_64},
  Real:  {name: "REAL", kurz: "r", bits: "32", bereich: "−3.402823e+38 bis −1.175495e−38, ±0, +1.175495e−38 bis +3.402823e+38",
    ein: ["1.0", "REAL#1.0", "1.0e-5", "REAL#1.0e-5"], cpu: DT_ALLE,
    info: "Genauigkeit 6 Stellen (TIA-Hilfe und spshaus). Der Programmierleitfaden nennt 7 Stellen."},
  LReal: {name: "LREAL", kurz: "lr", bits: "64",
    bereich: "−1.7976931348623157e+308 bis −2.2250738585072014e−308, ±0, +2.2250738585072014e−308 bis +1.7976931348623157e+308",
    ein: ["1.0", "LREAL#1.0", "1.0e-5", "LREAL#1.0e-5"], cpu: DT_OHNE_300, info: "Genauigkeit 15 Stellen.",
    abw: "spshaus schreibt als Grenze 1.7976931348623158e+308, die TIA-Hilfe 1.7976931348623157e+308 (der größte Wert nach IEEE 754)."},
  BCD16: {name: "BCD16", kurz: "", bits: "16", bereich: "−999 bis +999", ein: ["C#55 (in WORD)"], cpu: DT_ALLE,
    info: "Kein eigener Datentyp: ein WORD, das CONVERT als BCD liest (TIA-Hilfe „Explizite Konvertierung von INT/WORD“). Steht nicht bei spshaus."},
};
// Zeiten: nur zum Nachschlagen (TIME kannst du im Reiter „Zeiten“ eingeben)
export const DT_ZEITEN = {
  S5Time: {name: "S5TIME", kurz: "s5t", bits: "16", bereich: "S5T#0MS bis S5T#2H_46M_30S_0MS", ein: ["S5T#10s", "S5TIME#10s"],
    cpu: [1, 0, 0, 1], info: "Zeitwert 0 bis 999 als BCD und Zeitbasis 10 ms, 100 ms, 1 s oder 10 s.",
    abw: "spshaus schreibt die untere Grenze als S5T#0H_0M_0S_0MS, die TIA-Hilfe als S5T#0MS (gleicher Wert)."},
  Time:   {name: "TIME", kurz: "t", bits: "32", bereich: "T#-24d_20h_31m_23s_648ms bis T#+24d_20h_31m_23s_647ms",
    ein: ["T#10d_20h_30m_20s_630ms", "TIME#5h10s"], cpu: DT_ALLE, info: "Zeitdauer mit Vorzeichen in Millisekunden."},
  LTime:  {name: "LTIME", kurz: "lt", bits: "64", bereich: "LT#-106751d_23h_47m_16s_854ms_775us_808ns bis LT#+106751d_23h_47m_16s_854ms_775us_807ns",
    ein: ["LT#11350d_20h_25m_14s_830ms_652us_315ns", "LT#5h10s"], cpu: DT_NUR_64, info: "Zeitdauer mit Vorzeichen in Nanosekunden."},
};

const dtCode = liste => liste.map(e => `<code>${esc(e)}</code>`).join(" ");
const dtCpuText = cpu => DT_CPU.filter((_, i) => cpu[i]).join(", ");
// Kurzer Steckbrief zum gewählten Typ (unter der Eingabe)
export function dtSteckbriefHTML(typ){
  const d = DT_TYPEN[typ]; if (!d) return "";
  const kurz = d.kurz ? ` · Kürzel <code>${d.kurz}</code> (spshaus)` : "";
  return `<div class="dt-steck"><b>${d.name}</b> · ${d.bits} Bit${kurz} · Wertebereich ${esc(d.bereich)}`
    + `<br>Werteingaben ${dtCode(d.ein)} · CPU ${dtCpuText(d.cpu)}${d.info ? `<br><span class="muted">${esc(d.info)}</span>` : ""}</div>`;
}

/* ---------- Tabellen für das große Popup ---------- */
const dtHaken = an => an ? `<td class="dt-ja">✓</td>` : `<td class="dt-nein">–</td>`;
function dtZeileHTML(d, aktiv){
  const name = `<b>${d.name}</b>${d.kurz ? ` <span class="muted">(${d.kurz})</span>` : ""}`;
  const abw = d.abw ? `<div class="dt-abw"><b>Abweichung:</b> ${esc(d.abw)}</div>` : "";
  const info = d.info ? `<div class="muted">${esc(d.info)}</div>` : "";
  return `<tr${aktiv ? ` class="aktiv"` : ""}><th>${name}</th><td>${d.bits}</td><td>${esc(d.bereich)}${info}${abw}</td>`
    + `<td>${dtCode(d.ein)}</td>${d.cpu.map(dtHaken).join("")}</tr>`;
}
export function dtTabelleHTML(daten, aktiv){
  const kopf = `<tr><th>Datentyp (Kürzel)</th><th>Bit</th><th>Wertebereich</th><th>Werteingaben</th>${DT_CPU.map(c => `<th>${c}</th>`).join("")}</tr>`;
  const zeilen = Object.entries(daten).map(([k, d]) => dtZeileHTML(d, k === aktiv)).join("");
  return `<div class="dt-rollen"><table class="dt-tab"><thead>${kopf}</thead><tbody>${zeilen}</tbody></table></div>`;
}
export const DT_QUELLE = `<p class="small muted">Quellen: TIA-Hilfe V21 (Seiten der Datentypen) und „Übersicht Datentypen TIA-Portal“ `
  + `von spshaus (11.2.2026). Die Kürzel in Klammern stammen nur von spshaus. Wo beide abweichen, steht es in der Zeile.</p>`;
