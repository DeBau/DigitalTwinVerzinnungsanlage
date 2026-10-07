// Editor-Kern: Blätter einer Skizze mit Rahmen und Schriftfeld, ganze Skizze als SVG (sketchSVG), Schriftfeld-Daten.
// Benutzt von Editor, Skizzen-Kacheln und Druck.
import { BY, S } from '../app/basis.js';
import { INK, PH, SVGT } from './svg.js';
import { VORL, vorlage } from './registry.js';
import { frame } from './vorlagen-svg.js';
import { RESERVE_EDITOR, pageCount, zeichnungSVG } from './zeichnen.js';

export function pagesSVG(key, ex, meta, n, edit){
  const body = vorlage(key).body;
  let h = "";
  for (let i = 0; i < n; i++) {
    h += `<g transform="translate(0 ${i*PH})"><rect width="1000" height="${PH}" fill="#fff"/>${body ? body(ex, i, meta) : ""}`
      + `${frame({...meta, blatt: n > 1 ? `${i+1} von ${n}` : "1"})}</g>`;
  }
  if (edit) for (let i = 1; i < n; i++) h += seitenumbruch(i);
  return h;
}
// Gestrichelte Linie mit Hinweis zwischen Blatt i und i + 1 (nur im Editor). Der Hinweis steht links unter dem
// Rahmen, rechts steht das © (frame).
export const seitenumbruch = i => `<g pointer-events="none">`
  + `<path d="M0 ${i*PH}H1000" stroke="#9AA4AD" stroke-width="1" stroke-dasharray="2 6"/>`
  + `${SVGT(15, i*PH - 4, `Seitenumbruch: ab hier Blatt ${i+1}`, "start", 9.5, 400, "#9AA4AD")}</g>`;
// Pfeilspitze für alle Verbindungen. Die Zeichnung verweist mit marker-end="url(#arw)" darauf.
export const PFEIL_MARKER = `<defs><marker id="arw" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" `
  + `markerUnits="userSpaceOnUse" orient="auto"><path d="M0 1L10 5L0 9z" fill="${INK}"/></marker></defs>`;
// Jede Kachel und jedes Druckblatt bekommt eine eigene Marker-ID (arw-1, arw-2 …). Gleiche IDs in mehreren SVGs
// nimmt der Browser aus dem ersten, und das liegt im Druck in der ausgeblendeten App: Dann fehlen alle Pfeilspitzen.
// Nur das Blatt im Editor behält "arw", denn die Vorlagen zeichnen dort .ink direkt neu.
let markerZaehler = 0;
export const eigenerMarker = (svg, id) => svg.replaceAll('id="arw"', `id="${id}"`).replaceAll("url(#arw)", `url(#${id})`);
// Ganze Skizze als SVG: im Editor alle Blätter, für eine Kachel Blatt 1, für den Druck Blatt page
export function sketchSVG(key, ex, data, meta, edit=false, page=null){
  const n = pageCount(key, data, 0, edit ? RESERVE_EDITOR : 0), shown = edit || page !== null ? n : 1;
  const vb = page !== null ? `0 ${page*PH} 1000 ${PH}` : `0 0 1000 ${PH*(edit ? n : 1)}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${PFEIL_MARKER}`
    + `<g class="tpl">${pagesSVG(key, ex, meta, shown, edit)}</g>`
    + `<g class="ink">${zeichnungSVG(data, edit, key)}</g><g class="ghost"></g></svg>`;
  return edit ? svg : eigenerMarker(svg, "arw-" + (++markerZaehler));
}
export const skKey = (scope, key) => `${scope}:sk:${key}`;
export const deDate = t => new Date(t).toLocaleDateString("de-DE", {day: "2-digit", month: "2-digit", year: "numeric"});
// Schriftfeld: eigene Angaben der Skizze, sonst Name aus „Meine Daten“ und Datum der letzten Änderung
export const skMeta = (scope, key, d) => {
  const ex = BY[scope]; d = d || S.get(skKey(scope, key)) || {}; const m = d.meta || {};
  return {rows: m.rows || null, bed: m.bed || null, title: m.title || (ex ? `${ex.id} ${ex.t}` : VORL[key].n), vorlage: VORL[key].n,
    name: m.name || S.get("name") || "",
    datum: m.datum || (ex && S.get(ex.id+":datum")) || (d.ts ? deDate(d.ts) : ""),
    pfadbreite: m.pfadbreite};   // Stromlaufplan: Breite der Strompfade (vorlagen/elektro-pfade.js)
};

