// Editor-Kern: Eigenschaften übernehmen, Drehen, Löschen, Radieren.
import { ED } from './status.js';
import { PC } from './registry.js';
import { inkSVG } from './zeichnen.js';
import { objById } from './auswahl.js';
import { refreshTpl, renderInk } from './anzeige.js';
import { saveSketch, snapshot } from './verlauf.js';

export function applyProp(f, v){
  if (f === "cst") { const c = ED.data.c[ED.selC]; if (c) { c.st = v; saveSketch(); renderInk(); } return; }
  if (f === "mt" || f === "mn" || f === "md") { const m = ED.data.meta = ED.data.meta || {}; m[{mt: "title", mn: "name", md: "datum"}[f]] = v;
    Object.keys(m).forEach(k => { if (!m[k]) delete m[k]; }); if (!Object.keys(m).length) delete ED.data.meta; saveSketch(); refreshTpl(); return; }
  if (f === "cv") { const c = ED.data.c[ED.selC]; if (c) c.v = v; }
  else if (ED.selT !== null && ED.data.t[ED.selT] && ["tv","ts","sc"].includes(f)) { const t = ED.data.t[ED.selT]; if (f === "tv") t.v = v; if (f === "ts") t.s = +v; if (f === "sc") t.c = v; }
  else if (ED.selS !== null && ED.data.s[ED.selS] && ["sc","sw","sl","sg","tz","vk","vt"].includes(f)) { const st = ED.data.s[ED.selS]; if (f === "vt") st.t = v; if (f === "sc") st.c = v; if (f === "sw") st.w = +v; if (f === "sl") st.lbl = v; if (f === "sg") st.sg = v; if (f === "tz") st.tz = v; if (f === "vk") st.vk = v; }
  else { const o = objById(ED.sel); if (!o) return;
    if (f === "w") { const w = parseInt(v, 10); if (w >= 40) o.w = Math.round(w/10)*10; }
    else if (f === "t") { if (o.k === "actionq") o.k = "action"; o.t = v; if (v === "q" && !o.q) o.q = "S"; }
    else o[f] = v; }
  saveSketch(); ED.svg.querySelector(".ink").innerHTML = inkSVG(ED.data, true, ED.key);
}
export function removeObj(id){ ED.data.o = ED.data.o.filter(o => o.id !== id); ED.data.c = ED.data.c.filter(c => c.a !== id && c.b !== id); if (ED.sel === id) ED.sel = null; }
export function delSel(){
  if (ED.sel) { snapshot(); removeObj(ED.sel); }
  else if (ED.selC !== null && ED.data.c[ED.selC]) { snapshot(); ED.data.c.splice(ED.selC, 1); ED.selC = null; }
  else if (ED.selS !== null && ED.data.s[ED.selS]) { snapshot(); ED.data.s.splice(ED.selS, 1); ED.selS = null; }
  else if (ED.selT !== null && ED.data.t[ED.selT]) { snapshot(); ED.data.t.splice(ED.selT, 1); ED.selT = null; }
  else return;
  saveSketch(); renderInk();
}
export function turnSel(a){
  const o = objById(ED.sel); if (!o || !PC[o.k] || o.k === "rail") return;
  snapshot(); if (a === "rot") o.rot = ((o.rot || 0) + 90) % 360; else o.flip = !o.flip;
  saveSketch(); renderInk();
}
export function eraseAt(e){
  const el = document.elementFromPoint(e.clientX, e.clientY); if (!el) return;
  const go = el.closest("[data-o]"), gc = el.closest("[data-c]");
  if (go) { snapshot(); removeObj(go.dataset.o); }
  else if (gc) { snapshot(); ED.data.c.splice(+gc.dataset.c, 1); }
  else if (el.dataset.i !== undefined) { snapshot(); ED.data.s.splice(+el.dataset.i, 1); }
  else if (el.dataset.ti !== undefined) { snapshot(); ED.data.t.splice(+el.dataset.ti, 1); }
  else return;
  saveSketch(); renderInk();
}
