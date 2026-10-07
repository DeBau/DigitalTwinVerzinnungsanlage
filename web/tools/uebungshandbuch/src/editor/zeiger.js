// Editor-Kern: Zeigerereignisse auf dem Blatt (drücken, ziehen, loslassen) für alle Werkzeuge.
// Vorlagen mit eigenen Werkzeugen hängen sich über den Haken zeiger {unten, bewegen, angeklickt, gezogen} ein.
// Angemeldet in oeffnen.js (paintEditor), zeigerBewegen auch beim Ziehen aus der Palette (ereignisse.js).
import { $ } from '../app/basis.js';
import { ED, markiere } from './status.js';
import { STRICH, vorlage } from './registry.js';
import { shapeD, snap } from './vorlagen-svg.js';
import { nearestPort, portCap, virtuelleSchienen } from './bauteile.js';
import { gruppeVon } from './bausteine.js';
import { clearSel, objById, trefferBei } from './auswahl.js';
import { ausrichten, kettenQuelle } from './kette.js';
import { bausteinZeichnen, verbindungsWeg } from './zeichnen.js';
import { updateProps } from './eigenschaften.js';
import { checkPages, renderInk } from './anzeige.js';
import { aendere, beginne, schliesse } from './verlauf.js';
import { editConnLabel, editLabel, editObjLabel, editTextItem } from './beschriften.js';
import { blattPunkt, fangen } from './werkzeuge.js';
import { eraseAt } from './bearbeiten.js';
import { VORSCHAU, avoidBreak, connect, connectPorts, dockLeitung, linked, makeObj, placeObj, smartPos } from './andocken.js';

export const zeigerHaken = () => vorlage(ED.key).zeiger || {};
export const festhalten = e => ED.svg.setPointerCapture(e.pointerId);

/* ---------- Drücken ---------- */
// Kernwerkzeuge beim Drücken. Jedes andere Werkzeug zieht eine Linie bzw. einen Kasten auf (formUnten).
export const UNTEN = {
  place: (e, pt) => { e.preventDefault(); if (ED.place) placeObj(ED.place, pt); },
  sel: (e, pt) => { e.preventDefault(); auswahlUnten(e, pt); },
  conn: (e, pt) => { e.preventDefault(); verbindenUnten(e, pt); },
  erase: e => { ED.radiert = true; festhalten(e); eraseAt(e); },
  text: (e, pt) => { e.preventDefault(); neuerText(pt); },
  pen: (e, pt) => beginneStrich(e, {c: ED.color, w: ED.w, p: [pt]}),
};
// Strichart, die ein Werkzeug aufzieht; unbekannte Werkzeuge ziehen eine Linie
export const STRICH_DES_WERKZEUGS = {line: "l", rect: "r"};
export function formUnten(e, pt){
  const q = fangen(pt);
  beginneStrich(e, {k: STRICH_DES_WERKZEUGS[ED.tool] || "l", c: ED.color, w: ED.w, p: [q, q]});
}
export function zeigerUnten(e){
  if (!e.target.closest("input")) {   // kein Markieren von Text beim Zeichnen
    e.preventDefault();
    const sl = getSelection(); if (sl && sl.rangeCount) sl.removeAllRanges();
  }
  const pt = blattPunkt(ED.svg, e), zeiger = zeigerHaken();
  if (zeiger.unten && zeiger.unten(e, pt)) return;   // Haken zeiger.unten: eigene Werkzeuge der Vorlage
  (UNTEN[ED.tool] || formUnten)(e, pt);
}

// Was Auswählen mit einem Treffer (auswahl.js) macht: beschriften beim Doppelklick, greifen gibt das Ziehen ED.drag
export const AUSWAHL = {
  o: {
    beschriften: id => editObjLabel(objById(id)),
    greifen(id, [sx, sy], e){ const o = objById(id); return {id, sx, sy, ox: o.x, oy: o.y, moved: false, mit: mitnehmen(o, e)}; },
  },
  c: {beschriften: i => editConnLabel(i)},
  t: {
    beschriften: i => editTextItem(i),
    greifen(i, [sx, sy]){ const t = ED.data.t[i]; return {kind: "t", i, sx, sy, ox: t.x, oy: t.y, moved: false}; },
  },
  s: {greifen: (i, [sx, sy]) => ({kind: "s", i, sx, sy, orig: JSON.parse(JSON.stringify(ED.data.s[i].p)), moved: false})},
};
// Auswählen: Schriftfeld, Griff, Doppelklick (beschriften) oder Markieren und Ziehen beginnen
export function auswahlUnten(e, pt){
  const griff = e.target.closest("[data-hi]"), t = trefferBei(e.target);
  if (!t && e.target.closest("[data-sf]")) { schriftfeldWaehlen(); return; }
  if (griff) { griffZiehen(e, griff, pt); return; }
  const dbl = doppelklick(t && t.art + t.id);
  clearSel();
  if (!t) { renderInk(); return; }
  const was = AUSWAHL[t.art];
  markiere(t.art, t.id);
  if (dbl && was.beschriften) { renderInk(); was.beschriften(t.id); return; }
  if (was.greifen) { ED.drag = was.greifen(t.id, pt, e); festhalten(e); }
  renderInk();
}
// Runden Griff am Ende einer Linie oder eines Kastens ziehen
export function griffZiehen(e, griff, [sx, sy]){
  ED.drag = {kind: "h", i: +griff.dataset.hi, h: +griff.dataset.h, sx, sy, moved: false};
  festhalten(e);
}
// Bausteine, die beim Ziehen von o mitgehen: Haken mitziehen(o, {umschalt}, d) der Gruppe, z. B. Aktionen eines Schritts
export function mitnehmen(o, e){
  const mitziehen = gruppeVon(o).mitziehen;
  const ids = mitziehen ? mitziehen(o, {umschalt: e.shiftKey}, ED.data) : [];
  return ids.map(objById).filter(Boolean).map(p => ({p, x: p.x, y: p.y}));
}
// Zweiter Klick auf dasselbe Element innerhalb von 450 ms (der Browser-Doppelklick kommt nach pointerdown zu spät)
export function doppelklick(id){
  const now = Date.now();
  const dbl = id && ED.letzterKlick && ED.letzterKlick.id === id && now - ED.letzterKlick.t < 450;
  ED.letzterKlick = dbl ? null : {id, t: now};
  return dbl;
}
export function schriftfeldWaehlen(){
  markiere("f"); renderInk(); updateProps("neu");
  const f = $('#props [data-prop="mn"]'); if (f) f.focus();
}

// Verbinden: erst Quelle, dann Ziel anklicken. Bauteile mit Anschlüssen werden Anschluss für Anschluss verdrahtet.
export function verbindenUnten(e, pt){
  const hitO = e.target.closest("[data-o]");
  let id = hitO && hitO.dataset.o;
  if (!id) {   // Klick auf eine virtuelle Schiene der Vorlage
    const vr = virtuelleSchienen(ED.key, ED.blattzahl || 1).find(r => Math.abs(pt[1] - r.y) < 8 && pt[0] >= r.x && pt[0] <= r.x + r.w);
    if (vr) id = vr.id;
  }
  if (!id) { ED.verbindenVon = null; renderInk(); return; }
  const o = objById(id), pn = portCap(o) ? nearestPort(o, pt) : null;
  if (!ED.verbindenVon) { ED.verbindenVon = {id, anschluss: pn}; renderInk(); return; }
  const {id: a, anschluss: pa} = ED.verbindenVon;
  ED.verbindenVon = null;
  if (portCap(o) && portCap(objById(a))) connectPorts(a, pa, id, pn); else connect(a, id);
  renderInk();
}
export function neuerText(pt){
  editLabel(pt[0], pt[1], "", "Text, Enter übernimmt", v => {
    if (v) aendere(d => { d.t.push({x: pt[0], y: pt[1] + 5, v, c: ED.color, s: 16}); });
  });
}
// Strich cur aufziehen: Zeiger festhalten, Stand merken, Vorschaupfad anlegen. Auch für die Werkzeuge der Vorlagen.
export function beginneStrich(e, cur){
  festhalten(e);
  ED.strich = cur;
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("stroke", ED.color); path.setAttribute("stroke-width", ED.w); path.setAttribute("fill", "none");
  path.setAttribute("stroke-linecap", "round"); path.setAttribute("stroke-linejoin", "round");
  ED.svg.querySelector(".ink").appendChild(path); ED.strichPfad = path; zeigerBewegen(e);
}

/* ---------- Ziehen ---------- */
export function zeigerBewegen(e){
  const svg = ED.svg; if (!svg) return;
  if (ED.radiert) { eraseAt(e); return; }
  const pt = blattPunkt(svg, e);
  const busy = ED.drag || ED.strich || (ED.tool === "place" && ED.place);
  ED.zusatzY = busy ? pt[1] : 0; checkPages();   // beim Ziehen über den Blattrand wächst die Zeichnung
  if (busy) randScrollen(e);
  if (ED.drag) { ziehen(pt); return; }
  if (ED.tool === "place" && ED.place) { setzVorschau(pt); return; }
  const zeiger = zeigerHaken();
  if (zeiger.bewegen && zeiger.bewegen(e, pt)) return;   // Haken zeiger.bewegen
  if (!ED.strich) return;
  if (ED.strich.k) { ED.strich.p[1] = fangen(pt); ED.strichPfad.setAttribute("d", shapeD(ED.strich)); return; }
  const l = ED.strich.p[ED.strich.p.length-1];   // Freihand: Punkte sammeln
  if (Math.hypot(pt[0]-l[0], pt[1]-l[1]) > 1.2) ED.strich.p.push(pt);
  ED.strichPfad.setAttribute("d", "M" + ED.strich.p.map(q => q.join(" ")).join("L") + (ED.strich.p.length === 1 ? "l.01 0" : ""));
}
export function randScrollen(e){
  const st = $("#edstage"), r = st.getBoundingClientRect();
  if (e.clientY > r.bottom - 36) st.scrollTop += 18;
  else if (e.clientY < r.top + 36) st.scrollTop -= 18;
}
// Was beim Ziehen je Art geschieht: Griff am Strichende, Text, Strich; alles andere ist ein Baustein (zieheBaustein)
export const ZIEHE = {
  h: (dr, pt) => { ED.data.s[dr.i].p[dr.h] = fangen(pt); },
  t: (dr, pt, dx, dy) => { const t = ED.data.t[dr.i]; [t.x, t.y] = snap([dr.ox + dx, dr.oy + dy]); },
  s: (dr, pt, dx, dy) => zieheStrich(ED.data.s[dr.i], dx, dy),
};
// Markiertes ziehen. Die ganze Geste ist ein Verlaufsschritt (beginne hier, schliesse in ziehenEnde).
export function ziehen(pt){
  const dr = ED.drag, dx = pt[0] - dr.sx, dy = pt[1] - dr.sy;
  if (!dr.moved && Math.hypot(dx, dy) < 3) return;   // kleines Zittern ist noch ein Klick
  if (!dr.moved) { beginne("ziehen"); dr.moved = true; }
  let marks = "";
  aendere(() => { if (ZIEHE[dr.kind]) ZIEHE[dr.kind](dr, pt, dx, dy); else marks = zieheBaustein(dr, dx, dy); });
  $(".ghost", ED.svg).innerHTML = marks;
}
// Baustein mit Andocken und Hilfslinien ziehen, Mitgenommene folgen; gibt die blaue Vorschau zurück
export function zieheBaustein(dr, dx, dy){
  const o = objById(dr.id);
  [o.x, o.y] = snap([dr.ox + dx, dr.oy + dy]);
  const r = smartPos(o);
  avoidBreak(o);
  for (const m of dr.mit) { m.p.x = m.x + o.x - dr.ox; m.p.y = m.y + o.y - dr.oy; }
  dr.dock = r.dock && !linked(r.dock.a, r.dock.b) ? r.dock : null;
  return r.marks;
}
export function zieheStrich(st, dx, dy){
  const a = STRICH[st.k], o0 = ED.drag.orig[0];
  if (a && a.ziehen) { a.ziehen(st, ED.drag, dx, dy); return; }   // Haken ziehen der Strichart
  let mx = dx, my = dy;
  if (st.k) { const q = fangen([o0[0] + dx, o0[1] + dy]); mx = q[0] - o0[0]; my = q[1] - o0[1]; }   // Ecke fängt
  st.p = ED.drag.orig.map(([x, y]) => [+(x + mx).toFixed(1), +(y + my).toFixed(1)]);
}
// Vorschau des Bausteins, der beim Klick gesetzt würde, mit Verbindung zum Kettenvorgänger
export function setzVorschau(pt){
  const o = makeObj(ED.place, pt), A = kettenQuelle(ED.place);
  let marks = "";
  if (A) {
    ausrichten(o, A, pt);
    const map = Object.fromEntries(ED.data.o.map(p => [p.id, p])); map[o.id] = o;
    const gm = verbindungsWeg({a: A.id, b: o.id}, map, []);
    if (gm) marks = VORSCHAU(gm.d);
  }
  else marks = smartPos(o).marks;
  avoidBreak(o);
  $(".ghost", ED.svg).innerHTML = marks + `<g opacity=".5">${bausteinZeichnen(o, true)}</g>`;
}

/* ---------- Loslassen ---------- */
export function zeigerLoslassen(){
  ED.radiert = false; ED.zusatzY = 0;
  if (ED.drag) { ziehenEnde(); return; }
  if (!ED.strich) return;
  const zeiger = zeigerHaken(), [p0, p1] = ED.strich.p;
  if (ED.strich.k && p0[0] === p1[0] && p0[1] === p1[1]) {   // nur geklickt, nicht gezogen: kein Strich
    const k = ED.strich.k;
    ED.strich = null;
    if (zeiger.angeklickt && zeiger.angeklickt(p0, k)) return;   // Haken zeiger.angeklickt
    renderInk(); return;
  }
  const neu = ED.strich;
  ED.strich = null;
  aendere(d => { d.s.push(neu); }, {ohneRender: true});
  if (zeiger.gezogen && zeiger.gezogen(neu)) return;   // Haken zeiger.gezogen
  renderInk();
}
export function ziehenEnde(){
  const dk = ED.drag.dock;
  if (ED.drag.moved) {
    aendere(d => { if (dk && !linked(dk.a, dk.b)) d.c.push(dockLeitung(dk)); });   // angedockt: verbinden
    schliesse(); renderInk();
  }
  ED.drag = null;
  if (ED.svg) $(".ghost", ED.svg).innerHTML = "";
}
