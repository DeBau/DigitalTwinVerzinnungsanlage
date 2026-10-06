// Editor-Kern: Beschriftungsfeld direkt auf dem Blatt (Bausteine, Verbindungen, Texte).
import { $ } from '../app/basis.js';
import { ED } from './status.js';
import { LABEL_HINT } from './registry.js';
import { atype, bbox, isAct } from './bausteine.js';
import { updateProps } from './eigenschaften.js';
import { renderInk } from './anzeige.js';
import { saveSketch, snapshot } from './verlauf.js';

export function newline(el){ const a = el.selectionStart, b = el.selectionEnd; el.value = el.value.slice(0, a) + "\n" + el.value.slice(b); el.selectionStart = el.selectionEnd = a + 1; }
export function editLabel(x, y, init, ph, done){
  const svg = ED.svg, stage = $("#edstage"), r = stage.getBoundingClientRect(), m = svg.getScreenCTM();
  const inp = document.createElement("textarea"); inp.className = "txtin"; inp.value = init; inp.placeholder = (ph || "Text") + " – Enter übernimmt, Alt+Enter neue Zeile";
  inp.rows = Math.max(1, init.split("\n").length); inp.title = "Enter übernimmt, Alt+Enter (oder Umschalt+Enter) beginnt eine neue Zeile";
  inp.style.left = Math.max(4, Math.min(m.a * x + m.e - r.left, r.width - 270)) + "px"; inp.style.top = (m.d * y + m.f - r.top + stage.scrollTop - 17) + "px";
  stage.appendChild(inp); inp.focus(); inp.select();
  let fertig = false;
  const commit = (ok, wohin) => { if (fertig) return; fertig = true; const v = inp.value.trim(); inp.remove(); if (!wohin) stage.focus({preventScroll: true}); if (ok) done(v); };
  inp.addEventListener("keydown", ev => { ev.stopPropagation();
    if (ev.key === "Enter" && (ev.altKey || ev.shiftKey || ev.ctrlKey)) { ev.preventDefault(); newline(inp); inp.rows = inp.value.split("\n").length; return; }
    if (ev.key === "Enter") { ev.preventDefault(); commit(true); }
    if (ev.key === "Escape") { ev.preventDefault(); commit(false); } });
  inp.addEventListener("blur", ev => commit(true, ev.relatedTarget));
}
export function editObjLabel(o){
  if (!o || o.k === "start" || o.k === "sum") return;
  const b = bbox(o);
  const q = isAct(o) && atype(o) === "q";
  const init = q ? `${o.q || "S"} ${o.v || ""}`.trim() : (o.k === "alt" || o.k === "par") ? String(o.w || 200) : (o.v || "");
  const at = o.k === "trans" ? [o.x + 20, o.y] : (o.k === "no" || o.k === "nc" || o.k === "coil" || o.k === "lamp") ? [o.x - 120, o.y + 30] : [b.x, b.y + b.h/2];
  editLabel(at[0], at[1], init, q ? LABEL_HINT.actionq : LABEL_HINT[o.k], v => {
    snapshot();
    if (q) { const m = v.match(/^(\S+)\s*(.*)$/); o.q = m ? m[1] : "S"; o.v = m ? m[2] : ""; }
    else if (o.k === "alt" || o.k === "par") { const w = parseInt(v, 10); if (w >= 40) o.w = Math.round(w/10)*10; }
    else o.v = v;
    saveSketch(); renderInk(); updateProps(true);
  });
}
export function editConnLabel(i){
  const c = ED.data.c[i], p = ED.svg.querySelector(`[data-c="${i}"] path`); if (!c || !p) return;
  const L = p.getTotalLength(), m = p.getPointAtLength(L / 2);
  editLabel(m.x + 8, m.y, c.v || "", "Bedingung / Aktion, z. B. BG1 / MB1", v => { snapshot(); c.v = v; saveSketch(); renderInk(); updateProps(true); });
}
export function editTextItem(i){
  const t = ED.data.t[i]; if (!t) return;
  editLabel(t.x, t.y - 5, t.v, "Text", v => { snapshot(); if (v) t.v = v; else { ED.data.t.splice(i, 1); ED.selT = null; } saveSketch(); renderInk(); updateProps(true); });
}
