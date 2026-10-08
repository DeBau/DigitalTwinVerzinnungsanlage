/* ---------- Interaktive Erklärungen: Zahlenformate, Zeitdauer TIME ---------- */
// TIA-Hilfe V21 „TIME (IEC-Zeit)“: 32 Bit, Inhalt in Millisekunden mit Vorzeichen, also dasselbe Bitmuster wie ein DINT.
// Eingabe wie T#1s_200ms oder TIME#5h10s. Nicht alle Einheiten nötig. Bei mehr als einer Einheit gilt je Einheit
// höchstens 24 d, 23 h, 59 m, 59 s, 999 ms.
import { esc } from '../basis.js';
import { zfBinaer, zfHex } from './zahl-modell.js';

const ZD_EINHEIT = {d: 86400000, h: 3600000, m: 60000, s: 1000, ms: 1};
const ZD_GRENZE = {d: 24, h: 23, m: 59, s: 59, ms: 999};
const ZD_MIN = -2147483648, ZD_MAX = 2147483647;
const ZD_FORM = "Schreib eine Zeit wie T#1s_200ms, T#5h10s oder TIME#-2m.";

function zdTeile(rest){
  const ohne = rest.replace(/_/g, "").toLowerCase(), teile = [...ohne.matchAll(/(\d+)(ms|d|h|m|s)/g)];
  return teile.length && teile.map(t => t[0]).join("") === ohne ? teile.map(t => ({zahl: +t[1], einheit: t[2]})) : null;
}
function zdPruefen(teile){
  const doppelt = teile.find((t, i) => teile.findIndex(x => x.einheit === t.einheit) !== i);
  if (doppelt) return `Die Einheit ${doppelt.einheit} steht zweimal.`;
  const zuGross = teile.length > 1 && teile.find(t => t.zahl > ZD_GRENZE[t.einheit]);
  return zuGross ? `Bei mehreren Einheiten darf ${zuGross.einheit} höchstens ${ZD_GRENZE[zuGross.einheit]} sein (TIA-Hilfe).` : null;
}
// Ergebnis {ms} oder {fehler}
export function zdParsen(roh){
  const p = /^(?:T|TIME)#([+-]?)(.+)$/i.exec(String(roh).trim().replace(/\s/g, ""));
  const teile = p && zdTeile(p[2]);
  if (!teile) return {fehler: ZD_FORM};
  const fehler = zdPruefen(teile); if (fehler) return {fehler};
  const ms = (p[1] === "-" ? -1 : 1) * teile.reduce((s, t) => s + t.zahl * ZD_EINHEIT[t.einheit], 0);
  return ms < ZD_MIN || ms > ZD_MAX ? {fehler: "TIME geht nur von T#-24d_20h_31m_23s_648ms bis T#+24d_20h_31m_23s_647ms."} : {ms};
}
// Millisekunden → T#1s_200ms
export function zdText(ms){
  let rest = Math.abs(ms);
  const teile = Object.entries(ZD_EINHEIT).map(([e, f]) => { const n = Math.floor(rest / f); rest -= n * f; return n ? n + e : ""; });
  return "T#" + (ms < 0 ? "-" : "") + (teile.filter(Boolean).join("_") || "0ms");
}
export const zdMuster = ms => BigInt.asUintN(32, BigInt(ms));

export function zdHTML(zeit){
  const r = zdParsen(zeit.text), feld = `<input type="text" data-ia-eingabe="zeit" value="${esc(zeit.text)}" spellcheck="false" autocomplete="off">`;
  const kopf = `<div class="zf-eingabe"><label>TIME eingeben ${feld}</label></div>`;
  if (r.fehler) return kopf + `<div class="zf-fehler">${esc(r.fehler)}</div>`;
  const zeilen = [["Millisekunden", `<code class="zf-gross">${r.ms}</code>`], ["Schreibweise", `<code>${zdText(r.ms)}</code>`],
    ["Bitmuster wie DInt (16#)", `<code>${zfHex(zdMuster(r.ms), 32)}</code>`], ["Binär (2#)", `<code>${zfBinaer(zdMuster(r.ms), 32)}</code>`]];
  return kopf + `<table class="zf-tab"><tbody>${zeilen.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("")}</tbody></table>`
    + `<p class="small">TIME ist ein 32-Bit-Wert in Millisekunden mit Vorzeichen. Im Speicher steht dasselbe Bitmuster wie bei einem DInt mit dem Wert ${r.ms}.</p>`;
}
