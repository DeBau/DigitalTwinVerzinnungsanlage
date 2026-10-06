// Editor-Kern: Zeigerereignisse auf dem Blatt (drücken, ziehen, loslassen) für alle Werkzeuge.
import { $ } from '../app/basis.js';
import { ED } from './status.js';
import { STRICH, VORL, art } from './registry.js';
import { shapeD, snap } from './vorlagen-svg.js';
import { nearestPort, portCap, vrails } from './bauteile.js';
import { clearSel, objById } from './auswahl.js';
import { ausrichten, kettenQuelle } from './kette.js';
import { connGeom, drawObj } from './zeichnen.js';
import { updateProps } from './eigenschaften.js';
import { checkPages, renderInk } from './anzeige.js';
import { saveSketch, snapshot } from './verlauf.js';
import { editConnLabel, editLabel, editObjLabel, editTextItem } from './beschriften.js';
import { snapW, svgPt } from './werkzeuge.js';
import { eraseAt } from './bearbeiten.js';
import { avoidBreak, connect, connectPorts, linked, makeObj, placeObj, smartPos } from './andocken.js';

export function edDown(e){
  if (!e.target.closest("input")) { e.preventDefault(); const sl = getSelection(); if (sl && sl.rangeCount) sl.removeAllRanges(); }
  const svg = ED.svg, pt = svgPt(svg, e), hitO = e.target.closest("[data-o]"), hitC = e.target.closest("[data-c]");
  const zeiger = VORL[ED.key].zeiger || {};
  if (zeiger.unten && zeiger.unten(e, pt)) return;   // Haken zeiger.unten: eigene Werkzeuge der Vorlage
  if (ED.tool === "place" && ED.place) { e.preventDefault(); placeObj(ED.place, pt); return; }
  if (ED.tool === "sel") {
    e.preventDefault();
    const hitH = e.target.closest("[data-hi]"), hitS = e.target.closest("[data-i]"), hitT = e.target.closest("[data-ti]");
    if (e.target.closest("[data-sf]") && !hitO && !hitS && !hitT) { clearSel(); ED.selF = true; renderInk(); updateProps("neu"); const f = $('#props [data-prop="mn"]'); if (f) f.focus(); return; }
    if (hitH) { ED.drag = {kind: "h", i: +hitH.dataset.hi, h: +hitH.dataset.h, sx: pt[0], sy: pt[1], moved: false}; svg.setPointerCapture(e.pointerId); return; }
    const now = Date.now(), hitId = hitO ? hitO.dataset.o : hitC ? "c" + hitC.dataset.c : hitT ? "t" + hitT.dataset.ti : hitS ? "s" + hitS.dataset.i : null;
    const dbl = hitId && ED.lastClick && ED.lastClick.id === hitId && now - ED.lastClick.t < 450;
    ED.lastClick = dbl ? null : {id: hitId, t: now};
    clearSel();
    if (dbl && hitO) { ED.sel = hitO.dataset.o; renderInk(); editObjLabel(objById(ED.sel)); return; }
    if (dbl && hitC) { ED.selC = +hitC.dataset.c; renderInk(); editConnLabel(ED.selC); return; }
    if (dbl && hitT) { ED.selT = +hitT.dataset.ti; renderInk(); editTextItem(ED.selT); return; }
    if (hitO) { const o = objById(hitO.dataset.o); ED.sel = o.id; ED.drag = {id: o.id, sx: pt[0], sy: pt[1], ox: o.x, oy: o.y, moved: false}; svg.setPointerCapture(e.pointerId); renderInk(); return; }
    if (hitC) { ED.selC = +hitC.dataset.c; renderInk(); return; }
    if (hitT) { const i = +hitT.dataset.ti, t = ED.data.t[i]; ED.selT = i; ED.drag = {kind: "t", i, sx: pt[0], sy: pt[1], ox: t.x, oy: t.y, moved: false}; svg.setPointerCapture(e.pointerId); renderInk(); return; }
    if (hitS) { const i = +hitS.dataset.i; ED.selS = i; ED.drag = {kind: "s", i, sx: pt[0], sy: pt[1], orig: JSON.parse(JSON.stringify(ED.data.s[i].p)), moved: false}; svg.setPointerCapture(e.pointerId); renderInk(); return; }
    renderInk(); return;
  }
  if (ED.tool === "conn") {
    e.preventDefault();
    let id = hitO && hitO.dataset.o;
    if (!id) { const vr = vrails(ED.key, ED.pages || 1).find(r => Math.abs(pt[1] - r.y) < 8 && pt[0] >= r.x && pt[0] <= r.x + r.w); if (vr) id = vr.id; }
    if (!id) { ED.from = null; ED.fromP = null; renderInk(); return; }
    const o = objById(id);
    if (portCap(o)) {   // Anschluss für Anschluss verdrahten
      const pn = nearestPort(o, pt);
      if (!ED.from) { ED.from = id; ED.fromP = pn; renderInk(); return; }
      const a = ED.from, pa = ED.fromP; ED.from = null; ED.fromP = null;
      if (portCap(objById(a))) connectPorts(a, pa, id, pn); else connect(a, id);
      renderInk(); return;
    }
    if (!ED.from) { ED.from = id; ED.fromP = null; renderInk(); return; }
    const a = ED.from; ED.from = null; ED.fromP = null; connect(a, id); renderInk(); return;
  }
  if (ED.tool === "erase") { ED.erasing = true; svg.setPointerCapture(e.pointerId); eraseAt(e); return; }
  if (ED.tool === "text") { e.preventDefault(); editLabel(pt[0], pt[1], "", "Text, Enter übernimmt", v => { if (v) { snapshot(); ED.data.t.push({x: pt[0], y: pt[1] + 5, v, c: ED.color, s: 16}); saveSketch(); renderInk(); } }); return; }
  const q = ED.tool === "pen" ? pt : snapW(pt);
  beginneStrich(e, ED.tool === "pen" ? {c: ED.color, w: ED.w, p: [q]} : {k: {line: "l", rect: "r"}[ED.tool] || "l", c: ED.color, w: ED.w, p: [q, q]});
}
// Strich cur aufziehen: Zeiger festhalten, Stand merken, Vorschaupfad anlegen
export function beginneStrich(e, cur){
  ED.svg.setPointerCapture(e.pointerId); snapshot();
  ED.cur = cur;
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("stroke", ED.color); path.setAttribute("stroke-width", ED.w); path.setAttribute("fill", "none");
  path.setAttribute("stroke-linecap", "round"); path.setAttribute("stroke-linejoin", "round");
  ED.svg.querySelector(".ink").appendChild(path); ED.curEl = path; edMove(e);
}
export function edMove(e){
  const svg = ED.svg; if (!svg) return;
  if (ED.erasing) { eraseAt(e); return; }
  const pt = svgPt(svg, e);
  const busy = ED.drag || ED.cur || (ED.tool === "place" && ED.place);
  ED.extraY = busy ? pt[1] : 0; checkPages();
  if (busy) { const st = $("#edstage"), r = st.getBoundingClientRect();   // am Rand mitscrollen
    if (e.clientY > r.bottom - 36) st.scrollTop += 18; else if (e.clientY < r.top + 36) st.scrollTop -= 18; }
  if (ED.drag) {
    const dx = pt[0] - ED.drag.sx, dy = pt[1] - ED.drag.sy;
    if (!ED.drag.moved && Math.hypot(dx, dy) < 3) return;
    if (!ED.drag.moved) { snapshot(); ED.drag.moved = true; }
    if (ED.drag.kind === "h") { ED.data.s[ED.drag.i].p[ED.drag.h] = snapW(pt); renderInk(); return; }
    if (ED.drag.kind === "t") { const t = ED.data.t[ED.drag.i]; [t.x, t.y] = snap([ED.drag.ox + dx, ED.drag.oy + dy]); renderInk(); return; }
    if (ED.drag.kind === "s") {
      const st = ED.data.s[ED.drag.i], o0 = ED.drag.orig[0]; let mx = dx, my = dy;
      const art = STRICH[st.k];
      if (art && art.ziehen) { art.ziehen(st, ED.drag, dx, dy); renderInk(); return; }   // Haken ziehen der Strichart
      if (st.k) { const q = snapW([o0[0] + dx, o0[1] + dy]); mx = q[0] - o0[0]; my = q[1] - o0[1]; }
      st.p = ED.drag.orig.map(([x, y]) => [+(x + mx).toFixed(1), +(y + my).toFixed(1)]); renderInk(); return;
    }
    const o = objById(ED.drag.id);
    [o.x, o.y] = snap([ED.drag.ox + dx, ED.drag.oy + dy]);
    const r = smartPos(o); avoidBreak(o); ED.drag.dock = r.dock && !linked(r.dock.a, r.dock.b) ? r.dock : null;
    renderInk(); $(".ghost", svg).innerHTML = r.marks; return;
  }
  if (ED.tool === "place" && ED.place) {
    const o = makeObj(ED.place, pt), A = kettenQuelle(ED.place); let marks = "";
    if (A) { ausrichten(o, A, pt); const map = Object.fromEntries(ED.data.o.map(p => [p.id, p])); map[o.id] = o; const gm = connGeom({a: A.id, b: o.id}, map, []); if (gm) marks = `<path d="${gm.d}" fill="none" stroke="#2F80ED" stroke-width="2.5" stroke-dasharray="6 4"/>`; }
    else marks = smartPos(o).marks;
    avoidBreak(o);
    $(".ghost", svg).innerHTML = marks + `<g opacity=".5">${drawObj(o, true)}</g>`; return;
  }
  const zeiger = VORL[ED.key].zeiger || {};
  if (zeiger.bewegen && zeiger.bewegen(e, pt)) return;   // Haken zeiger.bewegen
  if (!ED.cur) return;
  if (ED.cur.k) { ED.cur.p[1] = snapW(pt); ED.curEl.setAttribute("d", shapeD(ED.cur)); return; }
  const l = ED.cur.p[ED.cur.p.length-1];
  if (Math.hypot(pt[0]-l[0], pt[1]-l[1]) > 1.2) ED.cur.p.push(pt);
  ED.curEl.setAttribute("d", "M" + ED.cur.p.map(q => q.join(" ")).join("L") + (ED.cur.p.length === 1 ? "l.01 0" : ""));
}
export function edUp(){
  ED.erasing = false; ED.extraY = 0;
  const zeiger = VORL[ED.key].zeiger || {};
  if (ED.drag) {
    const dk = ED.drag.dock;
    if (ED.drag.moved) { if (dk && !linked(dk.a, dk.b)) ED.data.c.push({a: dk.a, b: dk.b, v: ""}); saveSketch(); renderInk(); }
    ED.drag = null; if (ED.svg) $(".ghost", ED.svg).innerHTML = ""; return;
  }
  if (!ED.cur) return;
  if (ED.cur.k && ED.cur.p[0][0] === ED.cur.p[1][0] && ED.cur.p[0][1] === ED.cur.p[1][1]) {   // nur geklickt, nicht gezogen
    const p0 = ED.cur.p[0], k = ED.cur.k; ED.cur = null; ED.hist.pop();
    if (zeiger.angeklickt && zeiger.angeklickt(p0, k)) return;   // Haken zeiger.angeklickt
    renderInk(); return; }
  const neu = ED.cur; ED.data.s.push(neu); ED.cur = null; saveSketch();
  if (zeiger.gezogen && zeiger.gezogen(neu)) return;   // Haken zeiger.gezogen
  renderInk();
}
