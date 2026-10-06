// Editor-Kern: Beschriftungsfeld direkt auf dem Blatt (Bausteine, Verbindungen, Texte).
import { $ } from '../app/basis.js';
import { ED } from './status.js';
import { art } from './registry.js';
import { bbox } from './bausteine.js';
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
// Baustein beschriften. Der Haken beschriftung der Bausteinart bestimmt Ort, Anfangswert, Hinweis und wie der
// eingegebene Text übernommen wird; beschriftung: false heißt, der Baustein trägt keinen Text.
export function editObjLabel(o){
  if (!o) return;
  const B = art(o.k).beschriftung;
  if (B === false) return;
  const b = bbox(o);
  const wert = B && B.wert ? B.wert(o) : (o.v || "");
  const at = B && B.ort ? B.ort(o) : [b.x, b.y + b.h/2];
  const hinweis = B && (typeof B.hinweis === "function" ? B.hinweis(o) : B.hinweis);
  editLabel(at[0], at[1], wert, hinweis, v => {
    snapshot();
    if (B && B.setze) B.setze(o, v); else o.v = v;
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
