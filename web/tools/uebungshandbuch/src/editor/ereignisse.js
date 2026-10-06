import { $, $$ } from '../app/basis.js';
import { ED } from './status.js';
import { PAL, PC } from './registry.js';
import { deDate } from './blaetter.js';
import { anySel, applyProp, clearSel, delSel, edMove, editConnLabel, editObjLabel, editTextItem, lastProp, newline, objById, placeObj, renderInk, saveSketch, setLastProp, setTool, sizeSVG, snapshot, svgPt, takeMenu, takeSketch, turnSel, undo, updateProps, wsItem } from './editor.js';
import { doPrint, sketchPage } from '../app/druck.js';
import { route } from '../app/router.js';

export let palDrag = null;
export const overSheet = e => { const r = ED.svg && $("#edstage").getBoundingClientRect(); return r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; };
// Seiteneffekte: Listener, Migrationen, Start. main.js ruft init() in der ursprünglichen Reihenfolge auf.
export function init(){
addEventListener("resize", () => { if (ED.svg) sizeSVG(); });
$("#editor").addEventListener("pointerdown", e => { const pb = e.target.closest("[data-place]"); if (pb && e.button === 0) { e.preventDefault(); palDrag = {k: pb.dataset.place, x: e.clientX, y: e.clientY, on: false}; } });
$("#editor").addEventListener("selectstart", e => { if (!e.target.closest || !e.target.closest("input,textarea")) e.preventDefault(); });
document.addEventListener("pointermove", e => {
  if (!palDrag || !ED.svg) return;
  if (!palDrag.on && Math.hypot(e.clientX - palDrag.x, e.clientY - palDrag.y) > 6) { palDrag.on = true; ED.dnd = true; ED.place = palDrag.k; setTool("place"); document.body.classList.add("dnd"); }
  if (palDrag.on) { if (overSheet(e)) edMove(e); else $(".ghost", ED.svg).innerHTML = ""; }
});
document.addEventListener("pointerup", e => {
  if (!palDrag) return; const d = palDrag; palDrag = null; document.body.classList.remove("dnd");
  if (!d.on) return;
  ED.skipClick = true; ED.extraY = 0;
  if (overSheet(e)) placeObj(d.k, svgPt(ED.svg, e)); else setTool(PAL[ED.key] ? "sel" : ED.tool);
  ED.dnd = false;
});
$("#editor").addEventListener("click", e => {
  if (ED.skipClick) { ED.skipClick = false; if (e.target.closest("[data-place]")) return; }
  const pb = e.target.closest("[data-place]"); if (pb) { ED.place = pb.dataset.place; setTool("place"); return; }
  const wb = e.target.closest("[data-ws]");
  if (wb) { const it = wsItem(+wb.dataset.ws); setTool(it[0]); ED.wsPreset = it[2]; clearSel(); $$("#editor [data-ws]").forEach(x => x.setAttribute("aria-pressed", x === wb)); renderInk(); updateProps(true); return; }
  const sy = e.target.closest("[data-sym]");
  if (sy) { const el = lastProp; if (el && el.isConnected && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) { const a = el.selectionStart ?? el.value.length, b = el.selectionEnd ?? a;
    el.value = el.value.slice(0, a) + sy.dataset.sym + el.value.slice(b); el.focus(); el.setSelectionRange(a + sy.dataset.sym.length, a + sy.dataset.sym.length); applyProp(el.dataset.prop, el.value); } return; }
  const t = e.target.closest("[data-tool],[data-w],[data-ed]"); if (!t) return;
  if (t.dataset.tool) { if (t.dataset.color) ED.color = t.dataset.color; setTool(t.dataset.tool); }
  if (t.dataset.w) { ED.w = +t.dataset.w; $$("#editor [data-w]").forEach(b => b.setAttribute("aria-pressed", b === t)); }
  const a = t.dataset.ed;
  if (a === "undo") undo();
  if (a === "take") takeMenu(t);
  if (a === "takeit") takeSketch(t.dataset.from);
  if ((a === "rot" || a === "flip") && ED.sel && PC[objById(ED.sel).k]) turnSel(a);
  if (a === "sfzu") { ED.selF = false; updateProps("neu"); }
  if (a === "heute") { const f = $('#props [data-prop="md"]'); if (f) { snapshot(); f.value = deDate(Date.now()); applyProp("md", f.value); } }
  if (a === "del") delSel();
  if (a === "grid") { ED.grid = !ED.grid; t.setAttribute("aria-pressed", ED.grid); }
  if (a === "dock") { ED.dock = !ED.dock; t.setAttribute("aria-pressed", ED.dock); }
  if (a === "clear" && (ED.data.s.length || ED.data.t.length || ED.data.o.length) && confirm("Die ganze Skizze löschen?")) { snapshot(); ED.data = {s:[], t:[], o:[], c:[]}; clearSel(); saveSketch(); renderInk(); }
  if (a === "print") doPrint(sketchPage(ED.scope, ED.key, true));
  if (a === "close") $("#editor").close();
});
$("#editor").addEventListener("focusin", e => { if (e.target.dataset && e.target.dataset.prop) { snapshot(); setLastProp(e.target); } });
$("#editor").addEventListener("input", e => { const f = e.target.dataset && e.target.dataset.prop; if (f) applyProp(f, e.target.value); });
$("#editor").addEventListener("change", e => {
  const f = e.target.dataset && e.target.dataset.prop; if (f !== "t" && f !== "q") return;
  applyProp(f, e.target.value); updateProps("neu");
  const again = $(`#props [data-prop="${f}"]`); if (again) again.focus();
});
$("#editor").addEventListener("pointerdown", e => { if (e.target.closest(".sym")) e.preventDefault(); });
$("#editor").addEventListener("keydown", e => {
  if (e.target.matches("input,select,textarea")) {
    if (e.key === "Enter" && e.target.dataset.prop) {
      e.preventDefault();
      if (e.target.tagName === "TEXTAREA" && (e.altKey || e.shiftKey || e.ctrlKey)) { newline(e.target); e.target.rows = e.target.value.split("\n").length; applyProp(e.target.dataset.prop, e.target.value); }
      else $("#edstage").focus({preventScroll: true});
    }
    return; }
  if ((e.key === "Enter" || e.key === "F2") && anySel() && !ED.selF) { e.preventDefault(); const o = ED.sel && objById(ED.sel); if (o) editObjLabel(o); else if (ED.selT !== null) editTextItem(ED.selT); else if (ED.selC !== null) editConnLabel(ED.selC); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") { e.preventDefault(); return; }
  if (!e.ctrlKey && !e.metaKey && !e.altKey && ED.sel && (e.key === "r" || e.key === "R" || e.key === "m" || e.key === "M")) { e.preventDefault(); turnSel(e.key.toLowerCase() === "r" ? "rot" : "flip"); return; }
  if (e.key === "Escape" && ED.pend) { e.preventDefault(); ED.pend = null; $(".ghost", ED.svg).innerHTML = ""; updateProps(true); return; }
  if (e.key === "Escape" && (ED.place || ED.from || anySel())) { e.preventDefault(); clearSel(); ED.from = null; setTool(PAL[ED.key] ? "sel" : ED.tool); return; }
  if ((e.key === "Delete" || e.key === "Backspace") && anySel()) { e.preventDefault(); delSel(); return; }
  if (e.key.startsWith("Arrow") && (ED.sel || ED.selS !== null || ED.selT !== null)) {
    e.preventDefault(); snapshot();
    const dx = e.key === "ArrowLeft" ? -10 : e.key === "ArrowRight" ? 10 : 0, dy = e.key === "ArrowUp" ? -10 : e.key === "ArrowDown" ? 10 : 0;
    if (ED.sel) { const o = objById(ED.sel); o.x += dx; o.y += dy; }
    else if (ED.selS !== null) ED.data.s[ED.selS].p = ED.data.s[ED.selS].p.map(([x, y]) => [x + dx, y + dy]);
    else { const t = ED.data.t[ED.selT]; t.x += dx; t.y += dy; }
    saveSketch(); renderInk();
  }
});
$("#editor").addEventListener("cancel", e => {
  if (ED.svg && ED.pend) { e.preventDefault(); ED.pend = null; $(".ghost", ED.svg).innerHTML = ""; updateProps(true); return; }
  if (ED.svg && (ED.place || ED.from || anySel())) { e.preventDefault(); clearSel(); ED.from = null; setTool(PAL[ED.key] ? "sel" : ED.tool); }
});
$("#editor").addEventListener("close", () => { ED.svg = null; ED.sim = {on: false, st: {}, pos: {}}; route(); });
}
