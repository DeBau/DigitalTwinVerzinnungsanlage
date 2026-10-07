// Editor-Kern: Vorgedrucktes der Blätter (Raster, Punkte, Rahmen, Schriftfeld) und Striche und Texte als SVG.
import { esc } from '../app/basis.js';
import { tw } from './svg.js';
import { ED, istMarkiert } from './status.js';
import { STRICH, fuelle } from './registry.js';

export const G = "#9AA4AD", G2 = "#C9D0D5";
export function grid(step, color, x0=15, y0=15, x1=985, y1=630){
  let s = "";
  for (let x = x0; x <= x1 + .1; x += step) s += `M${x.toFixed(1)} ${y0}V${y1}`;
  for (let y = y0; y <= y1 + .1; y += step) s += `M${x0} ${y.toFixed(1)}H${x1}`;
  return `<path d="${s}" stroke="${color}" stroke-width=".5" fill="none"/>`;
}
export function dots(step, x0=15, y0=15, x1=985, y1=630){
  let s = "";
  for (let x = x0 + step; x < x1; x += step) for (let y = y0 + step; y < y1; y += step) s += `M${x} ${y}h.01`;
  return `<path d="${s}" stroke="${G}" stroke-width="2.2" stroke-linecap="round"/>`;
}
export function frame(meta){
  const t = (x, y, s, w, txt, f="#333") => `<text x="${x}" y="${y}" font-size="${s}" font-weight="${w}" fill="${f}" font-family="Plex Sans,Segoe UI,sans-serif">${esc(txt)}</text>`;
  return `<rect x="15" y="15" width="970" height="677" fill="none" stroke="#333" stroke-width="1.4"/>
  <g><rect x="555" y="632" width="430" height="60" fill="#fff" stroke="#333" stroke-width="1.1"/>
  <path d="M555 652H985M795 632V692M895 652V692M555 672H795" stroke="#333" stroke-width=".7" fill="none"/>
  ${t(561,646,9,500,"Übungshandbuch SPS-Technik","#0E4C92")}${t(801,646,9,400,meta.vorlage||"")}
  ${t(561,666,12,600,meta.title||"")}${t(561,686,8,400,"Name")}${t(590,686,10,500,meta.name||"")}
  ${t(801,664,8,400,"Datum")}${t(801,684,10,500,meta.datum||"")}${t(901,664,8,400,"Blatt")}${t(901,684,10,500,meta.blatt||"1")}
  <text x="985" y="701.5" font-size="6.5" fill="#999" text-anchor="end" letter-spacing=".3" font-family="Plex Sans,Segoe UI,sans-serif">© Bauer Automation Solutions · Dennis Bauer</text>
  <rect data-sf="1" x="555" y="632" width="430" height="60" fill="transparent"><title>Schriftfeld ändern</title></rect></g>`;
}
export const TX = (x, y, s, txt, a="start", f=G, w=400) => `<text x="${x}" y="${y}" font-size="${s}" text-anchor="${a}" fill="${f}" font-weight="${w}" font-family="Plex Sans,Segoe UI,sans-serif">${esc(txt)}</text>`;
export const snap = ([x, y]) => ED.grid ? [Math.round(x/10)*10, Math.round(y/10)*10] : [Math.round(x), Math.round(y)];
// Stricharten des Kerns: gerade Linie (Werkzeug line) und Kasten (Werkzeug rect)
fuelle(STRICH, {
  l: {titel: "Linie", form: ({p: [[x1, y1], [x2, y2]]}) => `M${x1} ${y1}L${x2} ${y2}`},
  r: {titel: "Kasten", form: ({p: [[x1, y1], [x2, y2]]}) => `M${x1} ${y1}H${x2}V${y2}H${x1}Z`},
});
// Umriss eines Strichs mit Art st.k als Pfad; eine Strichart ohne Haken form gilt als Kasten
export const shapeD = st => ((STRICH[st.k] || {}).form || STRICH.r.form)(st);
// Freihand-Glättung: Punkte mit quadratischen Kurven über die Mittelpunkte verbinden
export function glatterPfad(pts){
  if (!pts.length) return "";
  let s = `M${pts[0][0]} ${pts[0][1]}`;
  if (pts.length === 1) return s + "l.01 0";
  for (let i = 1; i < pts.length - 1; i++) { const [x, y] = pts[i], [nx, ny] = pts[i+1]; s += `Q${x} ${y} ${((x+nx)/2).toFixed(1)} ${((y+ny)/2).toFixed(1)}`; }
  const l = pts[pts.length-1];
  return s + `L${l[0]} ${l[1]}`;
}
// Ein Strich mit Markierung, Treffer-Fläche und Griffen. Stricharten aus STRICH zeichnen sich selbst.
export function strichSVG(d, st, i, edit){
  const a = STRICH[st.k], dd = st.k ? shapeD(st) : glatterPfad(st.p), sel = edit && istMarkiert("s", i);
  let s = sel ? `<path d="${dd}" stroke="#2F80ED" stroke-width="${+st.w + 7}" stroke-opacity=".28" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : "";
  s += a && a.zeichne ? a.zeichne(st, i, d) : `<path data-i="${i}" d="${dd}" stroke="${st.c}" stroke-width="${st.w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (edit) s += `<path data-i="${i}" d="${dd}" stroke="transparent" stroke-width="14" fill="none"/>`;
  if (sel && st.k && !(a && a.griffe === false)) s += st.p.map((q, h) => `<circle data-hi="${i}" data-h="${h}" cx="${q[0]}" cy="${q[1]}" r="6.5" fill="#fff" stroke="#2F80ED" stroke-width="2"/>`).join("");
  return s;
}
export function textSVG(t, i, edit){
  const sz = t.s || 16, sel = edit && istMarkiert("t", i), zeilen = String(t.v).split("\n");
  const rahmen = edit ? `<rect data-ti="${i}" x="${t.x - 4}" y="${t.y - sz - 1}" width="${tw(t.v, sz) + 10}" height="${sz * 1.2 * zeilen.length + 6}" rx="3" fill="transparent" ${sel ? 'stroke="#2F80ED" stroke-width="1.3" stroke-dasharray="4 3"' : ""}/>` : "";
  const inhalt = zeilen.map((l, j) => j ? `<tspan x="${t.x}" dy="${(1.2 * sz).toFixed(1)}">${esc(l)}</tspan>` : esc(l)).join("");
  return rahmen + `<text data-ti="${i}" x="${t.x}" y="${t.y}" font-size="${sz}" fill="${t.c}" font-family="Plex Sans,Segoe UI,sans-serif" font-weight="500">${inhalt}</text>`;
}
// Alle Striche und Texte einer Zeichnung; Stricharten mit oben: true (Verknüpfungspunkte) liegen obenauf, damit sie greifbar bleiben
export function strokesSVG(d, edit=false){
  if (!d) return "";
  const oben = st => !!(STRICH[st.k] && STRICH[st.k].oben);
  const striche = (d.s || []).map((st, i) => [oben(st), strichSVG(d, st, i, edit)]).sort((a, b) => a[0] - b[0]).map(x => x[1]).join("");
  return striche + (d.t || []).map((t, i) => textSVG(t, i, edit)).join("");
}
