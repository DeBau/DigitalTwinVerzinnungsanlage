// Editor-Kern: Bausteine erzeugen und setzen, Ketten fortsetzen, Andocken, Hilfslinien, Verbinden.
import { PH } from './svg.js';
import { ED } from './status.js';
import { BLK, PC, art, vorlage } from './registry.js';
import { snap } from './vorlagen-svg.js';
import { bbox, ctr, gruppeVon } from './bausteine.js';
import { clearSel, objById, uid } from './auswahl.js';
import { andockPunkt, andockStelle, ausrichten, kettenQuelle } from './kette.js';
import { connGeom, fragtBedingung } from './zeichnen.js';
import { zeigeHinweis } from './eigenschaften.js';
import { aendere } from './verlauf.js';
import { editConnLabel, editObjLabel } from './beschriften.js';
import { setTool } from './werkzeuge.js';

export function nextLabel(l){   // -QA1 → nächste freie Nummer
  const m = /^(.*?)(\d+)$/.exec(l); if (!m || l.includes(":")) return l;
  const used = ED.data.o.map(o => o.v || "").filter(v => v.startsWith(m[1])).map(v => parseInt(v.slice(m[1].length), 10)).filter(n => !isNaN(n));
  return used.length ? m[1] + (Math.max(...used) + 1) : l;
}
// Neues Objekt der Palettenart k mit der Mitte bei [px, py]. Lage und Vorgaben setzt der Haken neu der Bausteinart,
// das Kennzeichen kann der Haken kennzeichen(k, d, vorschlag) der Gruppe ändern (vorschlag: o.v nach neu).
export function makeObj(k, [px, py]){
  const mk = BLK[k] && BLK[k].mk;
  if (mk) k = mk.k || k;
  const o = PC[k] ? neuesBauteil(k, mk, px, py) : neuerBaustein(k, mk, px, py);
  const kennzeichen = gruppeVon(o).kennzeichen;
  if (kennzeichen) o.v = kennzeichen(o.k, ED.data, o.v);
  return o;
}
export function neuerBaustein(k, mk, px, py){
  const o = {id: uid(), k}, a = BLK[k];
  if (a && a.neu) a.neu(o, [px, py], mk);
  else { o.x = px; o.y = py; }
  [o.x, o.y] = snap([o.x, o.y]);
  return o;
}
export function neuesBauteil(k, mk, px, py){
  const pc = PC[k], o = {id: uid(), ...(pc.def || {}), ...(mk || {})};
  o.k = k;
  o.v = nextLabel(pc.lbl || "");
  if (pc.neu) pc.neu(o, [px, py]);
  else { o.x = px - (pc.bx || 0) - pc.w / 2; o.y = py - pc.h / 2; }
  [o.x, o.y] = snap([o.x, o.y]);
  return o;
}
// Gestrichelte Vorschau einer Verbindung beim Setzen und Andocken
export const VORSCHAU = d => `<path d="${d}" fill="none" stroke="#2F80ED" stroke-width="2.5" stroke-dasharray="6 4"/>`;
/* Hilfslinien und Andocken beim Setzen und Ziehen: o wird verschoben, marks ist die blaue Vorschau */
export function smartPos(o){
  const v = vorlage(ED.key);
  if (v.fangBaustein) v.fangBaustein(o);   // Haken fangBaustein, z. B. Strompfad-Spalten
  const dock = andockStelle(o), marks = [];
  if (dock) { o.x += dock.sx; o.y += dock.sy; }
  if (ED.dock && !dock) hilfslinien(o, marks);
  if (dock) marks.push(andockVorschau(o, dock));
  return {dock, marks: marks.join("")};
}
export const HILFSLINIE = d => `<path d="${d}" stroke="#2F80ED" stroke-width="1" stroke-dasharray="4 4"/>`;
// Mitte auf die Mitte eines Nachbarn ziehen, wenn sie weniger als 12 daneben liegt
export function hilfslinien(o, marks){
  const c = ctr(o);
  let gx = null, gy = null, bx = 12, by = 12;
  for (const p of ED.data.o) {
    if (p.id === o.id) continue;
    const q = ctr(p), dx = q[0] - c[0], dy = q[1] - c[1];
    if (Math.abs(dx) < bx && Math.abs(dx) > 0) { bx = Math.abs(dx); gx = [dx, q]; } else if (dx === 0) { bx = 0; gx = [0, q]; }
    if (Math.abs(dy) < by && Math.abs(dy) > 0) { by = Math.abs(dy); gy = [dy, q]; } else if (dy === 0) { by = 0; gy = [0, q]; }
  }
  if (gx) {
    o.x += gx[0];
    const c2 = ctr(o);
    marks.push(HILFSLINIE(`M${c2[0]} ${Math.min(c2[1], gx[1][1]) - 30}V${Math.max(c2[1], gx[1][1]) + 30}`));
  }
  if (gy) {
    o.y += gy[0];
    const c2 = ctr(o);
    marks.push(HILFSLINIE(`M${Math.min(c2[0], gy[1][0]) - 30} ${c2[1]}H${Math.max(c2[0], gy[1][0]) + 30}`));
  }
}
// Vorschau der Verbindung, die beim Loslassen entsteht, und Kreis um den Anschluss
export function andockVorschau(o, dock){
  const map = Object.fromEntries(ED.data.o.map(p => [p.id, p])); map[o.id] = o;
  const gm = connGeom({a: dock.a, b: dock.b}, map, []);
  const p = andockPunkt(map[dock.a], map[dock.b]);
  return (gm ? VORSCHAU(gm.d) : "") + `<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="#2F80ED" fill-opacity=".25" stroke="#2F80ED" stroke-width="1.5"/>`;
}
export function avoidBreak(o){   // Bausteine nicht in Schriftfeld/Rand am Blattende legen – sonst auf das nächste Blatt
  if (vorlage(ED.key).einblattig) return;
  for (let i = 0; i < 4; i++) { const b = bbox(o), k = Math.floor((b.y + b.h + 80) / PH), B = k * PH;
    if (k >= 1 && b.y < B + 70 && b.y + b.h > B - 80) o.y += B + 70 - b.y; else break; }
}
// Verbindung, die beim Andocken entsteht; zwischen Anschlüssen, wenn der Haken andocke pa und pb nennt
export function dockLeitung(dock){
  const c = {a: dock.a, b: dock.b, v: ""};
  if (dock.pa !== undefined) Object.assign(c, {pa: dock.pa, pb: dock.pb});
  return c;
}
export const linked = (a, b) => ED.data.c.some(c => (c.a === a && c.b === b) || (c.a === b && c.b === a));
export function placeObj(k, pt){
  const A = kettenQuelle(k), o = makeObj(k, pt);
  let dock = null;
  if (A) ausrichten(o, A, pt); else dock = smartPos(o).dock;
  avoidBreak(o);
  aendere(d => {
    d.o.push(o);
    if (A) d.c.push({a: A.id, b: o.id, v: ""});
    else if (dock && !linked(dock.a, dock.b)) d.c.push(dockLeitung(dock));
    const nachSetzen = gruppeVon(o).nachSetzen;   // Haken nachSetzen(o, d, {A, dock}), z. B. Transition ergänzen
    if (nachSetzen) nachSetzen(o, d, {A, dock});
  }, {ohneRender: true});
  ED.sel = o.id; ED.selC = null; setTool("sel");
  const b = art(o.k).beschriftung;
  if (b && b.sofort) editObjLabel(o);   // z. B. Transition: Bedingung gleich eintragen
}
export function connectPorts(a, pa, b, pb){
  if (a === b && pa === pb) return;
  if (a.startsWith("_") && b.startsWith("_")) return;
  if (ED.data.c.some(c => (c.a === a && c.pa === pa && c.b === b && c.pb === pb) || (c.a === b && c.pa === pb && c.b === a && c.pb === pa))) return;
  aendere(d => { d.c.push({a, pa, b, pb, v: ""}); clearSel(); ED.selC = d.c.length - 1; });
}
export function connect(a, b){
  const A = objById(a); if (!A || (a === b && !gruppeVon(A).schleife)) return;
  if (ED.data.c.some(c => c.a === a && c.b === b)) return;
  const vor = gruppeVon(A).vorVerbinden, r = vor ? vor(A, objById(b), ED.data) : null;   // Haken vorVerbinden
  if (r && r.ok === false) { zeigeHinweis(r.text); return; }
  if (r && r.ersetze) { aendere(d => { r.ersetze(d); }); return; }
  aendere(d => { d.c.push({a, b, v: ""}); ED.selC = d.c.length - 1; ED.sel = null; });
  if (fragtBedingung(A)) editConnLabel(ED.data.c.length - 1);
}
