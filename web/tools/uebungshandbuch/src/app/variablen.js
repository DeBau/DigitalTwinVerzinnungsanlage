import { $, IC, S, esc } from './basis.js';

/* ---------- Variablenliste ---------- */
export const typeOf = a => /^%[IQEA]W/.test(a) ? "Int" : (/^%[IQEA]/.test(a) ? "Bool" : "");
export function paintVars(s){
  const el = $("#vars"); if (!el) return;
  const rows = S.get(s.id+":vars", []);
  el.innerHTML = rows.length ? rows.map((r, i) => `<tr>${["n","t","a","k"].map(f => `<td><input type="text" data-var="${i}" data-f="${f}" value="${esc(r[f])}" aria-label="${{n:"Name",t:"Datentyp",a:"Adresse",k:"Kommentar"}[f]}, Zeile ${i+1}"></td>`).join("")}<td><button class="del" type="button" data-act="var-del" data-i="${i}" aria-label="Zeile ${i+1} löschen">${IC.trash}</button></td></tr>`).join("")
    : `<tr><td colspan="5" class="muted small" style="padding:14px 6px">Noch keine Variablen. Übernehmen Sie die Signale dieser Übung oder fügen Sie eine Zeile hinzu.</td></tr>`;
}

