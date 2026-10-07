// Editor-Kern: Bausteine erzeugen und setzen, Ketten fortsetzen, Andocken, Hilfslinien, Verbinden.
import { PH } from './svg.js';
import { ED, markiere } from './status.js';
import { BAUSTEIN, art, bauteil, vorlage } from './registry.js';
import { snap } from './vorlagen-svg.js';
import { gruppeVon, mitteVon, umrissVon } from './bausteine.js';
import { objById, uid } from './auswahl.js';
import { andockPunkt, andockStelle, ausrichten, kettenQuelle, seite } from './kette.js';
import { fragtBedingung, verbindungsWeg } from './zeichnen.js';
import { zeigeHinweis } from './eigenschaften.js';
import { aendere } from './verlauf.js';
import { editConnLabel, editObjLabel } from './beschriften.js';
import { setTool } from './werkzeuge.js';

export function nextLabel(l){   // -QA1 → nächste freie Nummer
  const m = /^(.*?)(\d+)$/.exec(l); if (!m || l.includes(":")) return l;
  const used = ED.data.o.map(o => o.v || "").filter(v => v.startsWith(m[1]))
    .map(v => parseInt(v.slice(m[1].length), 10)).filter(n => !isNaN(n));
  return used.length ? m[1] + (Math.max(...used) + 1) : l;
}
// Neues Objekt der Palettenart k mit der Mitte bei [px, py]. Lage und Vorgaben setzt der Haken neu der Bausteinart,
// das Kennzeichen kann der Haken kennzeichen(k, d, vorschlag) der Gruppe ändern (vorschlag: o.v nach neu).
export function makeObj(k, [px, py]){
  const mk = BAUSTEIN[k] && BAUSTEIN[k].mk;
  if (mk) k = mk.k || k;
  const o = bauteil(k) ? neuesBauteil(k, mk, px, py) : neuerBaustein(k, mk, px, py);
  const kennzeichen = gruppeVon(o).kennzeichen;
  if (kennzeichen) o.v = kennzeichen(o.k, ED.data, o.v);
  return o;
}
export function neuerBaustein(k, mk, px, py){
  const o = {id: uid(), k}, a = BAUSTEIN[k];
  if (a && a.neu) a.neu(o, [px, py], mk);
  else { o.x = px; o.y = py; }
  [o.x, o.y] = snap([o.x, o.y]);
  return o;
}
export function neuesBauteil(k, mk, px, py){
  const pc = bauteil(k), o = {id: uid(), ...(pc.def || {}), ...(mk || {})};
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
  const c = mitteVon(o);
  let gx = null, gy = null, bx = 12, by = 12;
  for (const p of ED.data.o) {
    if (p.id === o.id) continue;
    const q = mitteVon(p), dx = q[0] - c[0], dy = q[1] - c[1];
    if (Math.abs(dx) < bx && Math.abs(dx) > 0) { bx = Math.abs(dx); gx = [dx, q]; } else if (dx === 0) { bx = 0; gx = [0, q]; }
    if (Math.abs(dy) < by && Math.abs(dy) > 0) { by = Math.abs(dy); gy = [dy, q]; } else if (dy === 0) { by = 0; gy = [0, q]; }
  }
  if (gx) {
    o.x += gx[0];
    const c2 = mitteVon(o);
    marks.push(HILFSLINIE(`M${c2[0]} ${Math.min(c2[1], gx[1][1]) - 30}V${Math.max(c2[1], gx[1][1]) + 30}`));
  }
  if (gy) {
    o.y += gy[0];
    const c2 = mitteVon(o);
    marks.push(HILFSLINIE(`M${Math.min(c2[0], gy[1][0]) - 30} ${c2[1]}H${Math.max(c2[0], gy[1][0]) + 30}`));
  }
}
// Vorschau der Verbindung, die beim Loslassen entsteht, und Kreis um den Anschluss
export function andockVorschau(o, dock){
  const map = Object.fromEntries(ED.data.o.map(p => [p.id, p])); map[o.id] = o;
  const gm = verbindungsWeg({a: dock.a, b: dock.b}, map, []);
  const p = andockPunkt(map[dock.a], map[dock.b]);
  return (gm ? VORSCHAU(gm.d) : "")
    + `<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="#2F80ED" fill-opacity=".25" stroke="#2F80ED" stroke-width="1.5"/>`;
}
// Wie weit o nach unten muss, damit es nicht im Bereich um ein Blattende liegt (Rand, Schriftfeld, Verweise der
// Abbruchstellen): bis 70 unter den Anfang des nächsten Blatts. 0, wenn o frei liegt oder die Vorlage einblattig ist.
export function umbruchWeg(o){
  if (vorlage(ED.key).einblattig) return 0;
  const b = umrissVon(o), k = Math.floor((b.y + b.h + 80) / PH), B = k * PH;
  return k >= 1 && b.y < B + 70 && b.y + b.h > B - 80 ? B + 70 - b.y : 0;
}
// Baustein aus dem Bereich um das Blattende auf das nächste Blatt legen. Seitenbausteine (GRAFCET-Aktionen) bleiben
// bei ihrem Kettenglied. Was danach in der Kette folgt, schiebt die Vorlage selbst mit (GRAFCET: meideUmbruch).
export function avoidBreak(o){
  if (!seite(o)) o.y += umbruchWeg(o);
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
  markiere("o", o.id); setTool("sel");
  const b = art(o.k).beschriftung;
  if (b && b.sofort) editObjLabel(o);   // z. B. Transition: Bedingung gleich eintragen
}
export function connectPorts(a, pa, b, pb){
  if (a === b && pa === pb) return;
  if (a.startsWith("_") && b.startsWith("_")) return;
  const gleich = c => (c.a === a && c.pa === pa && c.b === b && c.pb === pb) || (c.a === b && c.pa === pb && c.b === a && c.pb === pa);
  if (ED.data.c.some(gleich)) return;
  aendere(d => { d.c.push({a, pa, b, pb, v: ""}); markiere("c", d.c.length - 1); });
}
export function connect(a, b){
  const A = objById(a); if (!A || (a === b && !gruppeVon(A).schleife)) return;
  if (ED.data.c.some(c => c.a === a && c.b === b)) return;
  const vor = gruppeVon(A).vorVerbinden, r = vor ? vor(A, objById(b), ED.data) : null;   // Haken vorVerbinden
  if (r && r.ok === false) { zeigeHinweis(r.text); return; }
  if (r && r.ersetze) { aendere(d => { r.ersetze(d); }); return; }
  aendere(d => { d.c.push({a, b, v: ""}); markiere("c", d.c.length - 1); });
  if (fragtBedingung(A)) editConnLabel(ED.data.c.length - 1);
}
