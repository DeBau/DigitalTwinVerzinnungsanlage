// Editor-Kern: Zeigerereignisse auf dem Blatt (drücken, ziehen, loslassen) für alle Werkzeuge.
import { CYL } from '../app/daten.js';
import { $ } from '../app/basis.js';
import { ED } from './status.js';
import { shapeD, snap, wsAus } from './vorlagen-svg.js';
import { nearestPort, portCap, vrails } from './bauteile.js';
import { clearSel, objById } from './auswahl.js';
import { ausrichten, kettenQuelle } from './kette.js';
import { connGeom, drawObj, simClick } from './zeichnen.js';
import { skMeta } from './blaetter.js';
import { updateProps } from './eigenschaften.js';
import { checkPages, refreshTpl, renderInk } from './anzeige.js';
import { saveSketch, snapshot } from './verlauf.js';
import { editConnLabel, editLabel, editObjLabel, editTextItem } from './beschriften.js';
import { setTool, snapW, svgPt, wsRows } from './werkzeuge.js';
import { eraseAt } from './bearbeiten.js';
import { avoidBreak, connect, connectPorts, linked, makeObj, placeObj, smartPos } from './andocken.js';

export function edDown(e){
  if (!e.target.closest("input")) { e.preventDefault(); const sl = getSelection(); if (sl && sl.rangeCount) sl.removeAllRanges(); }
  const svg = ED.svg, pt = svgPt(svg, e), hitO = e.target.closest("[data-o]"), hitC = e.target.closest("[data-c]");
  if (ED.tool === "sim") { const h = e.target.closest("[data-o]"); if (h) simClick(objById(h.dataset.o), pt); return; }
  if (ED.tool === "place" && ED.place) { e.preventDefault(); placeObj(ED.place, pt); return; }
  if (ED.tool === "sel") {
    e.preventDefault();
    const hitH = e.target.closest("[data-hi]"), hitS = e.target.closest("[data-i]"), hitT = e.target.closest("[data-ti]");
    if (ED.key === "wegschritt" && !hitS && !hitT && pt[0] >= 30 && pt[0] < 140 && pt[1] >= 74 && pt[1] < 74 + wsRows() * 62) {   // Zeilenname ändern
      const i = Math.floor((pt[1] - 74) / 62), cur = (skMeta(ED.scope, ED.key, ED.data).rows || [])[i];
      const def = [...(CYL[ED.scope] || ["−MM1","−MM2","−MM3","−MM4"]), "", ""][i];
      editLabel(40, 74 + i * 62 + 31, cur ?? def, "Bauglied, z. B. −MM1 Zylinder oder −MB1 Ventil", v => { snapshot(); const m = ED.data.meta = ED.data.meta || {}; m.rows = m.rows || []; m.rows[i] = v; saveSketch(); refreshTpl(); });
      return; }
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
  if (ED.tool === "vk") { e.preventDefault(); const q = snapW(pt), J = [q[0], q[1] - wsAus(q[1]) * 18]; snapshot();
    ED.data.s.push({k: "vk", t: (ED.wsPreset && ED.wsPreset.t) || "und", c: ED.color, w: 1.2, p: [J]}, {k: "sig", c: ED.color, w: 1.2, p: [J, q], lbl: ""});
    saveSketch(); const keep = ED.wsPreset; setTool("sig"); ED.wsPreset = {}; clearSel(); renderInk(); updateProps(true); return; }
  if (ED.tool === "eq") { e.preventDefault(); const cw = (975 - 150) / 12, j = Math.max(1, Math.min(11, Math.floor((pt[0] - 150) / cw))); snapshot();
    ED.data.s = ED.data.s.filter(q => q.k !== "eq"); ED.data.s.push({k: "eq", c: ED.color, w: 2.6, p: [[+(150 + j * cw).toFixed(2), 57]], y2: 74 + wsRows() * 62}); clearSel(); saveSketch(); setTool("sel"); return; }
  if (ED.tool === "start") { e.preventDefault(); snapshot(); ED.data.s.push({k: "st", c: ED.color, w: 1.2, p: [snapW(pt)], lbl: "−SF1"}); clearSel(); ED.selS = ED.data.s.length - 1; saveSketch(); setTool("sel"); return; }
  if (ED.pend && (ED.tool === "sig" || ED.tool === "line")) {   // zweiter Klick: Linie vom gemerkten Punkt bis hier
    e.preventDefault(); const q = snapW(pt), a = ED.pend, same = Math.abs(a[0] - q[0]) < .5 && Math.abs(a[1] - q[1]) < .5;
    $(".ghost", svg).innerHTML = "";
    if (ED.tool === "sig") { snapshot(); ED.data.s.push({k: "sig", c: ED.color, w: 1.2, p: [a, q], lbl: "", ...(ED.wsPreset || {})}); ED.pend = null; saveSketch();
      clearSel(); ED.selS = ED.data.s.length - 1; renderInk(); updateProps("neu"); const f = $('#props [data-prop="sl"]'); if (f) f.focus(); return; }
    if (same) { ED.pend = null; renderInk(); updateProps(true); return; }   // gleicher Punkt: Linienzug beenden
    snapshot(); ED.data.s.push({k: "l", c: ED.color, w: Math.max(ED.w, 2.8), p: [a, q]}); ED.pend = q; saveSketch(); renderInk(); return;
  }
  svg.setPointerCapture(e.pointerId); snapshot();
  const q = ED.tool === "pen" ? pt : snapW(pt);
  ED.cur = ED.tool === "pen" ? {c: ED.color, w: ED.w, p: [q]} : {k: {line: "l", rect: "r", sig: "sig"}[ED.tool] || "l", c: ED.color, w: ED.tool === "sig" ? 1.2 : (ED.key === "wegschritt" && ED.tool === "line" ? Math.max(ED.w, 2.8) : ED.w), p: [q, q], ...(ED.tool === "sig" ? {lbl: "", ...(ED.wsPreset || {})} : {})};
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("stroke", ED.color); path.setAttribute("stroke-width", ED.w); path.setAttribute("fill", "none"); path.setAttribute("stroke-linecap", "round"); path.setAttribute("stroke-linejoin", "round");
  svg.querySelector(".ink").appendChild(path); ED.curEl = path; edMove(e);
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
      if (st.k === "vk") {   // Verknüpfungspunkt verschieben: angeschlossene Signallinien wandern mit
        if (!ED.drag.att) ED.drag.att = []; if (!ED.drag.attDone) { ED.drag.attDone = true; ED.data.s.forEach((q, j) => q.k === "sig" && q.p.forEach((v, h) => Math.hypot(v[0] - o0[0], v[1] - o0[1]) < .6 && ED.drag.att.push([j, h]))); }
        const cx = 150 + Math.round((o0[0] + dx - 150) / 68.75) * 68.75, q = [Math.abs(cx - o0[0] - dx) < 10 ? cx : Math.round((o0[0] + dx) / 4) * 4, Math.round((o0[1] + dy) / 4) * 4]; st.p = [q]; ED.drag.att.forEach(([j, h]) => ED.data.s[j].p[h] = [...q]); renderInk(); return; }
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
  if (ED.pend && !ED.cur && (ED.tool === "sig" || ED.tool === "line")) { const q = snapW(pt), a = ED.pend;
    const d = ED.tool === "sig" ? shapeD({k: "sig", p: [a, q]}) : `M${a[0]} ${a[1]}L${q[0]} ${q[1]}`;
    $(".ghost", svg).innerHTML = `<path d="${d}" stroke="#2F80ED" stroke-width="${ED.tool === "sig" ? 1.4 : 2.8}" stroke-dasharray="5 4" fill="none"/><circle cx="${a[0]}" cy="${a[1]}" r="5" fill="#2F80ED" fill-opacity=".35" stroke="#2F80ED"/><circle cx="${q[0]}" cy="${q[1]}" r="4" fill="none" stroke="#2F80ED"/>`; return; }
  if (!ED.cur) return;
  if (ED.cur.k) { ED.cur.p[1] = snapW(pt); ED.curEl.setAttribute("d", shapeD(ED.cur)); return; }
  const l = ED.cur.p[ED.cur.p.length-1];
  if (Math.hypot(pt[0]-l[0], pt[1]-l[1]) > 1.2) ED.cur.p.push(pt);
  ED.curEl.setAttribute("d", "M" + ED.cur.p.map(q => q.join(" ")).join("L") + (ED.cur.p.length === 1 ? "l.01 0" : ""));
}
export function edUp(){
  ED.erasing = false; ED.extraY = 0;
  if (ED.drag) {
    const dk = ED.drag.dock;
    if (ED.drag.moved) { if (dk && !linked(dk.a, dk.b)) ED.data.c.push({a: dk.a, b: dk.b, v: ""}); saveSketch(); renderInk(); }
    ED.drag = null; if (ED.svg) $(".ghost", ED.svg).innerHTML = ""; return;
  }
  if (!ED.cur) return;
  if (ED.cur.k && ED.cur.p[0][0] === ED.cur.p[1][0] && ED.cur.p[0][1] === ED.cur.p[1][1]) {   // nur geklickt, nicht gezogen
    const p0 = ED.cur.p[0], k = ED.cur.k; ED.cur = null; ED.hist.pop();
    if (k === "sig" || (k === "l" && ED.key === "wegschritt")) { ED.pend = p0; renderInk(); updateProps(true); $(".ghost", ED.svg).innerHTML = `<circle cx="${p0[0]}" cy="${p0[1]}" r="5" fill="#2F80ED" fill-opacity=".35" stroke="#2F80ED"/>`; return; }
    renderInk(); return; }
  const neu = ED.cur; ED.data.s.push(neu); ED.cur = null; saveSketch();
  if (neu.k === "sig") { clearSel(); ED.selS = ED.data.s.length - 1; renderInk(); updateProps("neu"); const f = $('#props [data-prop="sl"]'); if (f) f.focus(); return; }
  renderInk();
}
