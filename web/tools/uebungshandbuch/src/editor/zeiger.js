// Editor-Kern: Zeigerereignisse auf dem Blatt (drücken, ziehen, loslassen) für alle Werkzeuge.
// Vorlagen mit eigenen Werkzeugen hängen sich über den Haken zeiger {unten, bewegen, angeklickt, gezogen} ein.
// Angemeldet in oeffnen.js (paintEditor), edMove auch beim Ziehen aus der Palette (ereignisse.js).
import { $ } from '../app/basis.js';
import { ED } from './status.js';
import { STRICH, VORL } from './registry.js';
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
import { VORSCHAU, avoidBreak, connect, connectPorts, linked, makeObj, placeObj, smartPos } from './andocken.js';

export const zeigerHaken = () => (VORL[ED.key] && VORL[ED.key].zeiger) || {};
export const festhalten = e => ED.svg.setPointerCapture(e.pointerId);

/* ---------- Drücken ---------- */
export function edDown(e){
  if (!e.target.closest("input")) {   // kein Markieren von Text beim Zeichnen
    e.preventDefault();
    const sl = getSelection(); if (sl && sl.rangeCount) sl.removeAllRanges();
  }
  const pt = svgPt(ED.svg, e);
  const zeiger = zeigerHaken();
  if (zeiger.unten && zeiger.unten(e, pt)) return;   // Haken zeiger.unten: eigene Werkzeuge der Vorlage
  if (ED.tool === "place" && ED.place) { e.preventDefault(); placeObj(ED.place, pt); return; }
  if (ED.tool === "sel") { e.preventDefault(); auswahlUnten(e, pt); return; }
  if (ED.tool === "conn") { e.preventDefault(); verbindenUnten(e, pt); return; }
  if (ED.tool === "erase") { ED.erasing = true; festhalten(e); eraseAt(e); return; }
  if (ED.tool === "text") { e.preventDefault(); neuerText(pt); return; }
  const q = ED.tool === "pen" ? pt : snapW(pt);
  if (ED.tool === "pen") beginneStrich(e, {c: ED.color, w: ED.w, p: [q]});
  else beginneStrich(e, {k: {line: "l", rect: "r"}[ED.tool] || "l", c: ED.color, w: ED.w, p: [q, q]});
}

// Auswählen: Schriftfeld, Griff, Doppelklick (beschriften) oder Markieren und Ziehen beginnen
export function auswahlUnten(e, pt){
  const hitO = e.target.closest("[data-o]"), hitC = e.target.closest("[data-c]");
  const hitH = e.target.closest("[data-hi]"), hitS = e.target.closest("[data-i]"), hitT = e.target.closest("[data-ti]");
  if (e.target.closest("[data-sf]") && !hitO && !hitS && !hitT) { schriftfeldWaehlen(); return; }
  if (hitH) {
    ED.drag = {kind: "h", i: +hitH.dataset.hi, h: +hitH.dataset.h, sx: pt[0], sy: pt[1], moved: false};
    festhalten(e); return;
  }
  const dbl = doppelklick(hitO ? hitO.dataset.o : hitC ? "c" + hitC.dataset.c : hitT ? "t" + hitT.dataset.ti : hitS ? "s" + hitS.dataset.i : null);
  clearSel();
  if (dbl && hitO) { ED.sel = hitO.dataset.o; renderInk(); editObjLabel(objById(ED.sel)); return; }
  if (dbl && hitC) { ED.selC = +hitC.dataset.c; renderInk(); editConnLabel(ED.selC); return; }
  if (dbl && hitT) { ED.selT = +hitT.dataset.ti; renderInk(); editTextItem(ED.selT); return; }
  if (hitO) {
    const o = objById(hitO.dataset.o);
    ED.sel = o.id;
    ED.drag = {id: o.id, sx: pt[0], sy: pt[1], ox: o.x, oy: o.y, moved: false};
    festhalten(e);
  } else if (hitC) {
    ED.selC = +hitC.dataset.c;
  } else if (hitT) {
    const i = +hitT.dataset.ti, t = ED.data.t[i];
    ED.selT = i;
    ED.drag = {kind: "t", i, sx: pt[0], sy: pt[1], ox: t.x, oy: t.y, moved: false};
    festhalten(e);
  } else if (hitS) {
    const i = +hitS.dataset.i;
    ED.selS = i;
    ED.drag = {kind: "s", i, sx: pt[0], sy: pt[1], orig: JSON.parse(JSON.stringify(ED.data.s[i].p)), moved: false};
    festhalten(e);
  }
  renderInk();
}
// Zweiter Klick auf dasselbe Element innerhalb von 450 ms (der Browser-Doppelklick kommt nach pointerdown zu spät)
export function doppelklick(id){
  const now = Date.now();
  const dbl = id && ED.lastClick && ED.lastClick.id === id && now - ED.lastClick.t < 450;
  ED.lastClick = dbl ? null : {id, t: now};
  return dbl;
}
export function schriftfeldWaehlen(){
  clearSel(); ED.selF = true; renderInk(); updateProps("neu");
  const f = $('#props [data-prop="mn"]'); if (f) f.focus();
}

// Verbinden: erst Quelle, dann Ziel anklicken. Bauteile mit Anschlüssen werden Anschluss für Anschluss verdrahtet.
export function verbindenUnten(e, pt){
  const hitO = e.target.closest("[data-o]");
  let id = hitO && hitO.dataset.o;
  if (!id) {   // Klick auf eine virtuelle Schiene der Vorlage
    const vr = vrails(ED.key, ED.pages || 1).find(r => Math.abs(pt[1] - r.y) < 8 && pt[0] >= r.x && pt[0] <= r.x + r.w);
    if (vr) id = vr.id;
  }
  if (!id) { ED.from = null; ED.fromP = null; renderInk(); return; }
  const o = objById(id), pn = portCap(o) ? nearestPort(o, pt) : null;
  if (!ED.from) { ED.from = id; ED.fromP = pn; renderInk(); return; }
  const a = ED.from, pa = ED.fromP;
  ED.from = null; ED.fromP = null;
  if (portCap(o) && portCap(objById(a))) connectPorts(a, pa, id, pn); else connect(a, id);
  renderInk();
}
export function neuerText(pt){
  editLabel(pt[0], pt[1], "", "Text, Enter übernimmt", v => {
    if (!v) return;
    snapshot();
    ED.data.t.push({x: pt[0], y: pt[1] + 5, v, c: ED.color, s: 16});
    saveSketch(); renderInk();
  });
}
// Strich cur aufziehen: Zeiger festhalten, Stand merken, Vorschaupfad anlegen. Auch für die Werkzeuge der Vorlagen.
export function beginneStrich(e, cur){
  festhalten(e); snapshot();
  ED.cur = cur;
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("stroke", ED.color); path.setAttribute("stroke-width", ED.w); path.setAttribute("fill", "none");
  path.setAttribute("stroke-linecap", "round"); path.setAttribute("stroke-linejoin", "round");
  ED.svg.querySelector(".ink").appendChild(path); ED.curEl = path; edMove(e);
}

/* ---------- Ziehen ---------- */
export function edMove(e){
  const svg = ED.svg; if (!svg) return;
  if (ED.erasing) { eraseAt(e); return; }
  const pt = svgPt(svg, e);
  const busy = ED.drag || ED.cur || (ED.tool === "place" && ED.place);
  ED.extraY = busy ? pt[1] : 0; checkPages();   // beim Ziehen über den Blattrand wächst die Zeichnung
  if (busy) randScrollen(e);
  if (ED.drag) { ziehen(pt); return; }
  if (ED.tool === "place" && ED.place) { setzVorschau(pt); return; }
  const zeiger = zeigerHaken();
  if (zeiger.bewegen && zeiger.bewegen(e, pt)) return;   // Haken zeiger.bewegen
  if (!ED.cur) return;
  if (ED.cur.k) { ED.cur.p[1] = snapW(pt); ED.curEl.setAttribute("d", shapeD(ED.cur)); return; }
  const l = ED.cur.p[ED.cur.p.length-1];   // Freihand: Punkte sammeln
  if (Math.hypot(pt[0]-l[0], pt[1]-l[1]) > 1.2) ED.cur.p.push(pt);
  ED.curEl.setAttribute("d", "M" + ED.cur.p.map(q => q.join(" ")).join("L") + (ED.cur.p.length === 1 ? "l.01 0" : ""));
}
export function randScrollen(e){
  const st = $("#edstage"), r = st.getBoundingClientRect();
  if (e.clientY > r.bottom - 36) st.scrollTop += 18;
  else if (e.clientY < r.top + 36) st.scrollTop -= 18;
}
// Markiertes ziehen: Griff, Text, Strich oder Baustein (mit Andocken und Hilfslinien)
export function ziehen(pt){
  const dr = ED.drag, dx = pt[0] - dr.sx, dy = pt[1] - dr.sy;
  if (!dr.moved && Math.hypot(dx, dy) < 3) return;   // kleines Zittern ist noch ein Klick
  if (!dr.moved) { snapshot(); dr.moved = true; }
  if (dr.kind === "h") { ED.data.s[dr.i].p[dr.h] = snapW(pt); renderInk(); return; }
  if (dr.kind === "t") { const t = ED.data.t[dr.i]; [t.x, t.y] = snap([dr.ox + dx, dr.oy + dy]); renderInk(); return; }
  if (dr.kind === "s") { zieheStrich(ED.data.s[dr.i], dx, dy); renderInk(); return; }
  const o = objById(dr.id);
  [o.x, o.y] = snap([dr.ox + dx, dr.oy + dy]);
  const r = smartPos(o);
  avoidBreak(o);
  dr.dock = r.dock && !linked(r.dock.a, r.dock.b) ? r.dock : null;
  renderInk(); $(".ghost", ED.svg).innerHTML = r.marks;
}
export function zieheStrich(st, dx, dy){
  const a = STRICH[st.k], o0 = ED.drag.orig[0];
  if (a && a.ziehen) { a.ziehen(st, ED.drag, dx, dy); return; }   // Haken ziehen der Strichart
  let mx = dx, my = dy;
  if (st.k) { const q = snapW([o0[0] + dx, o0[1] + dy]); mx = q[0] - o0[0]; my = q[1] - o0[1]; }   // Ecke fängt
  st.p = ED.drag.orig.map(([x, y]) => [+(x + mx).toFixed(1), +(y + my).toFixed(1)]);
}
// Vorschau des Bausteins, der beim Klick gesetzt würde, mit Verbindung zum Kettenvorgänger
export function setzVorschau(pt){
  const o = makeObj(ED.place, pt), A = kettenQuelle(ED.place);
  let marks = "";
  if (A) {
    ausrichten(o, A, pt);
    const map = Object.fromEntries(ED.data.o.map(p => [p.id, p])); map[o.id] = o;
    const gm = connGeom({a: A.id, b: o.id}, map, []);
    if (gm) marks = VORSCHAU(gm.d);
  }
  else marks = smartPos(o).marks;
  avoidBreak(o);
  $(".ghost", ED.svg).innerHTML = marks + `<g opacity=".5">${drawObj(o, true)}</g>`;
}

/* ---------- Loslassen ---------- */
export function edUp(){
  ED.erasing = false; ED.extraY = 0;
  if (ED.drag) { ziehenEnde(); return; }
  if (!ED.cur) return;
  const zeiger = zeigerHaken(), [p0, p1] = ED.cur.p;
  if (ED.cur.k && p0[0] === p1[0] && p0[1] === p1[1]) {   // nur geklickt, nicht gezogen: kein Strich
    const k = ED.cur.k;
    ED.cur = null; ED.hist.pop();
    if (zeiger.angeklickt && zeiger.angeklickt(p0, k)) return;   // Haken zeiger.angeklickt
    renderInk(); return;
  }
  const neu = ED.cur;
  ED.data.s.push(neu); ED.cur = null; saveSketch();
  if (zeiger.gezogen && zeiger.gezogen(neu)) return;   // Haken zeiger.gezogen
  renderInk();
}
export function ziehenEnde(){
  const dk = ED.drag.dock;
  if (ED.drag.moved) {
    if (dk && !linked(dk.a, dk.b)) ED.data.c.push({a: dk.a, b: dk.b, v: ""});   // angedockt: verbinden
    saveSketch(); renderInk();
  }
  ED.drag = null;
  if (ED.svg) $(".ghost", ED.svg).innerHTML = "";
}
