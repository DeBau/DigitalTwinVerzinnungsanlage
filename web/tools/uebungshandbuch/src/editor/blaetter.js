import { VORL } from '../app/daten.js';
import { BY, S } from '../app/basis.js';
import { INK, PH, SVGT } from './svg.js';
import { frame, tplBody } from './vorlagen-svg.js';
import { inkSVG, pageCount } from './zeichnen.js';

export function pagesSVG(key, ex, meta, n, edit){
  let h = "";
  for (let i = 0; i < n; i++) h += `<g transform="translate(0 ${i*PH})"><rect width="1000" height="${PH}" fill="#fff"/>${tplBody(key, ex, i, meta)}${frame({...meta, blatt: n > 1 ? `${i+1} von ${n}` : "1"})}</g>`;
  if (edit) for (let i = 1; i < n; i++) h += `<g pointer-events="none"><path d="M0 ${i*PH}H1000" stroke="#9AA4AD" stroke-width="1" stroke-dasharray="2 6"/>${SVGT(990, i*PH - 5, `Seitenumbruch – Blatt ${i+1}`, "end", 9.5, 400, "#9AA4AD")}</g>`;
  return h;
}
export function sketchSVG(key, ex, data, meta, edit=false, page=null){
  const n = pageCount(key, data), shown = edit || page !== null ? n : 1;
  const vb = page !== null ? `0 ${page*PH} 1000 ${PH}` : `0 0 1000 ${PH*(edit ? n : 1)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><defs><marker id="arw" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 1L10 5L0 9z" fill="${INK}"/></marker></defs><g class="tpl">${pagesSVG(key, ex, meta, shown, edit)}</g><g class="ink">${inkSVG(data, edit, key)}</g><g class="ghost"></g></svg>`;
}
export const skKey = (scope, key) => `${scope}:sk:${key}`;
export const deDate = t => new Date(t).toLocaleDateString("de-DE", {day: "2-digit", month: "2-digit", year: "numeric"});
export const skMeta = (scope, key, d) => {   // Schriftfeld: eigene Angaben der Skizze, sonst Name aus „Meine Daten“ und Datum der letzten Änderung
  const ex = BY[scope]; d = d || S.get(skKey(scope, key)) || {}; const m = d.meta || {};
  return {rows: m.rows || null, title: m.title || (ex ? `${ex.id} ${ex.t}` : VORL[key].n), vorlage: VORL[key].n, name: m.name || S.get("name") || "",
    datum: m.datum || (ex && S.get(ex.id+":datum")) || (d.ts ? deDate(d.ts) : "")};
};

