/* ---------- Skizzen-Kacheln ---------- */
import { EXVORL } from './daten.js';
import { $, IC, S } from './basis.js';
import { VORL } from '../editor/registry.js';
import { pageCount } from '../editor/zeichnen.js';
import { skKey, skMeta, sketchSVG } from '../editor/blaetter.js';

export function sketchCards(scope, keys, ex){
  return keys.map(key => { const d = S.get(skKey(scope, key)); const n = d ? (d.s||[]).length + (d.t||[]).length + (d.o||[]).length : 0;
    return `<div class="sk"><div class="th" data-act="sk-open" data-scope="${scope}" data-key="${key}" role="button" tabindex="0" aria-label="${VORL[key].n} öffnen">${sketchSVG(key, ex, d, skMeta(scope, key))}</div>
      <div class="nm">${VORL[key].n}</div><div class="st">${n ? `${n} Elemente${pageCount(key, d) > 1 ? `, ${pageCount(key, d)} Blätter` : ""}` : VORL[key].d}</div>
      <div class="act"><button class="btn small" type="button" data-act="sk-open" data-scope="${scope}" data-key="${key}">${IC.pen}${n ? "Weiterzeichnen" : "Zeichnen"}</button>
      <button class="btn small" type="button" data-act="sk-print" data-scope="${scope}" data-key="${key}" data-with="0" title="Leere Vorlage drucken">${IC.print}leer</button>
      ${n ? `<button class="btn small" type="button" data-act="sk-print" data-scope="${scope}" data-key="${key}" data-with="1" title="Mit Zeichnung drucken">${IC.print}mit Skizze</button>` : ""}</div></div>`; }).join("");
}
export function paintSketches(s){ const el = $("#sketches"); if (el) el.innerHTML = sketchCards(s.id, EXVORL[s.id] || ["raster"], s); }

