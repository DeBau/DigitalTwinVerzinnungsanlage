/* ---------- Skizzen: Vorlagen als SVG ---------- */
import { esc } from '../app/basis.js';
import { INK, SVGT, arrowHead, tw } from './svg.js';
import { ED } from './status.js';

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
/* Weg-Schritt-Diagramm: Stellung 1 liegt 16 unter dem Zeilenanfang, Stellung 0 bei 50 (Zeilenhöhe 62, erste Zeile bei 74).
   "aus" = Richtung aus dem Zeilenbereich heraus (Stellung 1: nach oben, Stellung 0: nach unten), "ein" = in die Zeile hinein. */
export const wsAus = y => (((y - 74) % 62) + 62) % 62 < 33 ? -1 : 1;
export const halo = t => t.replace("<text ", '<text stroke="#fff" stroke-width="4" stroke-linejoin="round" paint-order="stroke" ');
export const sigLoop = st => { const [x, y] = st.p[0], [x2, y2] = st.p[1] || st.p[0]; return Math.abs(x - x2) < .5 && Math.abs(y - y2) < .5; };
export function startGeo(st){ const [x, y] = st.p[0], e = -wsAus(y), cy = y + e * 23; return {x, y, e, cy}; }   // freie Ecke des Schrittfelds unter bzw. über der Bewegungslinie
export function sigMid(st){   // Höhe des Querstücks; auf gleicher Höhe nach außen ausweichen, sonst läge die Signallinie auf der Funktionslinie
  const [[, y1], [, y2]] = st.p; return Math.abs(y1 - y2) < .5 ? y1 + wsAus(y1) * 20 : Math.round((y1 + y2) / 2);
}
export function shapeD(st){
  if (st.k === "st") { const {x, cy} = startGeo(st); return `M${x + 2} ${cy - 9}H${x + 56}V${cy + 9}H${x + 2}Z`; }
  if (st.k === "eq") { const [x] = st.p[0]; return `M${x} 41H${x + 68}V73H${x}Z`; }
  if (st.k === "vk") { const [x, y] = st.p[0]; return `M${x - 4} ${y - 4}H${x + 4}V${y + 4}H${x - 4}Z`; }
  if (st.k === "sig" && sigLoop(st)) { const [x, y] = st.p[0], o = wsAus(y); return `M${x} ${y}C${x - 16} ${y + o*24} ${x + 16} ${y + o*24} ${x + 1.5} ${y + o*2}`; }
  const [[x1, y1], [x2, y2]] = st.p;
  if (st.k === "sig") { if (Math.abs(x1 - x2) < .5) return `M${x1} ${y1}V${y2}`; const ym = sigMid(st); return `M${x1} ${y1}V${ym}H${x2}V${y2}`; }
  return st.k === "l" ? `M${x1} ${y1}L${x2} ${y2}` : `M${x1} ${y1}H${x2}V${y2}H${x1}Z`;
}
export function srcMark(st, x, y){   // Signalgeber am Auslösepunkt
  const c = st.c || INK;
  switch (st.sg || "punkt") {
    case "kreis": return `<circle cx="${x}" cy="${y}" r="4.5" fill="#fff" stroke="${c}" stroke-width="1.4"/>`;
    case "balken": return `<path d="M${x - 24} ${y}H${x}" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`;
    case "hand": return `<path d="M${x} ${y}L${x - 10} ${y - 10}" stroke="${c}" stroke-width="1.2"/><rect x="${x - 24}" y="${y - 24}" width="14" height="14" rx="1.5" fill="#fff" stroke="${c}" stroke-width="1.3"/><path d="M${x - 21} ${y - 20}H${x - 13}M${x - 17} ${y - 20}V${y - 13}" stroke="${c}" stroke-width="1.3" fill="none"/>`;
    case "extern": return `<path d="M${x - 16} ${y - 7}H${x - 4}L${x} ${y}L${x - 4} ${y + 7}H${x - 16}Z" fill="#fff" stroke="${c}" stroke-width="1.3"/>`;
  }
  return `<circle cx="${x}" cy="${y}" r="3" fill="${c}"/>`;
}
export function sigSVG(st, grp){   // Signallinie, Schleife und Start – im Schrittfeld
  if (st.k === "vk") { const [x, y] = st.p[0], c = st.c || INK;   // Verknüpfungspunkt: UND = Schrägstrich, ODER = Punkt
    return st.t === "oder" ? `<circle cx="${x}" cy="${y}" r="4" fill="${c}"/>` : `<circle cx="${x}" cy="${y}" r="1.6" fill="${c}"/><path d="M${x - 8} ${y + 6}L${x + 8} ${y - 6}" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`; }
  const c = st.c || INK, lab = (x, y, a="start") => st.lbl ? halo(SVGT(x, y, st.lbl, a, 10.5, 600, c)) : "";
  const timer = (x, y) => { if (!st.tz) return ""; const w = tw(st.tz, 10) + 12; return `<rect x="${(x - w/2).toFixed(1)}" y="${y - 8}" width="${w.toFixed(1)}" height="16" rx="2" fill="#fff" stroke="${c}" stroke-width="1.2"/>` + SVGT(x, y + 3.5, st.tz, "middle", 10, 600, c); };
  if (st.k === "eq") { const [x] = st.p[0], cw = (975 - 150) / 12, j = Math.round((x - 150) / cw);
    return `<rect x="${(x + 1).toFixed(1)}" y="41" width="${(cw - 2).toFixed(1)}" height="32" fill="#fff"/>` + SVGT(x + cw/2, 62, `${j + 1} = 1`, "middle", 12, 700, c) + `<path d="M${x} 40V${st.y2 || 446}" stroke="${c}" stroke-width="2.6"/>`; }
  if (st.k === "st") { const {x, y, e, cy} = startGeo(st);
    return `<rect x="${x + 4}" y="${cy - 7}" width="14" height="14" rx="1.5" fill="#fff" stroke="${c}" stroke-width="1.3"/><path d="M${x + 7} ${cy - 3}H${x + 15}M${x + 11} ${cy - 3}V${cy + 4}" stroke="${c}" stroke-width="1.3" fill="none"/>`
      + `<path d="M${x + 6} ${cy - e*7}L${x + 1.5} ${y + e*3}" stroke="${c}" stroke-width="1.2" fill="none"/>` + arrowHead(x + 6, cy - e*7, x + .8, y + e*1.2, 6) + lab(x + 22, cy + 4); }
  if (sigLoop(st)) { const [x, y] = st.p[0], o = wsAus(y);
    const tw2 = st.tz ? tw(st.tz, 10) + 12 : 0;
    return `<path d="${shapeD(st)}" stroke="${c}" stroke-width="1.2" fill="none"/>` + srcMark(st, x, y) + arrowHead(x + 7, y + o*12, x + 1.2, y + o*2, 6) + timer(x + 16 + tw2 / 2, y + o*12) + lab(x - 14, y + o*12 + 4, "end"); }
  const [[x1, y1], [x2, y2]] = st.p, straight = Math.abs(x1 - x2) < .5, ym = straight ? y1 : sigMid(st), down = y2 > ym, o = wsAus(y1);
  const jS = grp && grp.jStart, jE = grp && grp.jEnd;   // beginnt bzw. endet an einem Verknüpfungspunkt
  let r = `<path d="${shapeD(st)}" stroke="${c}" stroke-width="1.2" fill="none"/>` + (jS ? "" : srcMark(st, x1, y1));
  if (!jE) r += arrowHead(x2, y2 + (down ? -11 : 11), x2, y2, 6.5);
  r += straight ? timer(x1, Math.round((y1 + y2) / 2)) : timer(x1, Math.round((y1 + ym) / 2));
  const links = st.sg === "balken" || (grp && grp.ldy);
  return r + lab(x1 + (st.sg === "balken" ? -26 : links ? -7 : 7), y1 + o * 13 + (o > 0 ? 4 : 0), links ? "end" : "start");
}
export function strokesSVG(d, edit=false){
  if (!d) return "";
  const path = pts => { if (!pts.length) return ""; let s = `M${pts[0][0]} ${pts[0][1]}`; if (pts.length === 1) return s + "l.01 0";
    for (let i = 1; i < pts.length - 1; i++) { const [x, y] = pts[i], [nx, ny] = pts[i+1]; s += `Q${x} ${y} ${((x+nx)/2).toFixed(1)} ${((y+ny)/2).toFixed(1)}`; }
    const l = pts[pts.length-1]; return s + `L${l[0]} ${l[1]}`; };
  const pk = q => q.map(v => Math.round(v)).join(","), jset = new Set((d.s || []).filter(q => q.k === "vk").map(q => pk(q.p[0])));
  const labs = [], ldy = {};   // Beschriftungen an derselben Stelle gegeneinander versetzen
  (d.s || []).forEach((st, i) => { if (st.k !== "sig" || sigLoop(st) || !st.lbl || jset.has(pk(st.p[0]))) return; const [x, y] = st.p[0], o = wsAus(y);
    const ly = y + o * 13 + (o > 0 ? 4 : 0), hit = labs.some(([lx, yy, l]) => !l && Math.abs(lx - x) < 40 && Math.abs(yy - ly) < 12);
    labs.push([x, ly, hit]); ldy[i] = hit; });   // belegt: links neben die Linie
  const grpOf = (st, i) => st.k === "sig" && !sigLoop(st) ? {jStart: jset.has(pk(st.p[0])), jEnd: jset.has(pk(st.p[1])), ldy: !!ldy[i]} : null;
  return (d.s || []).map((st, i) => { const dd = st.k ? shapeD(st) : path(st.p), sel = edit && ED.selS === i;
    return (sel ? `<path d="${dd}" stroke="#2F80ED" stroke-width="${+st.w + 7}" stroke-opacity=".28" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : "")
      + (st.k === "sig" || st.k === "st" || st.k === "eq" || st.k === "vk" ? sigSVG(st, grpOf(st, i)) : `<path data-i="${i}" d="${dd}" stroke="${st.c}" stroke-width="${st.w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)
      + (edit ? `<path data-i="${i}" d="${dd}" stroke="transparent" stroke-width="14" fill="none"/>` : "")
      + (sel && st.k && st.k !== "eq" && st.k !== "vk" ? st.p.map((q, h) => `<circle data-hi="${i}" data-h="${h}" cx="${q[0]}" cy="${q[1]}" r="6.5" fill="#fff" stroke="#2F80ED" stroke-width="2"/>`).join("") : ""); })
      .map((h, i) => [d.s[i].k === "vk", h]).sort((a, b) => a[0] - b[0]).map(x => x[1]).join("")   // Verknüpfungspunkte oben, damit sie greifbar bleiben
    + (d.t || []).map((t, i) => { const sz = t.s || 16, sel = edit && ED.selT === i;
      return (edit ? `<rect data-ti="${i}" x="${t.x - 4}" y="${t.y - sz - 1}" width="${tw(t.v, sz) + 10}" height="${sz * 1.2 * String(t.v).split("\n").length + 6}" rx="3" fill="transparent" ${sel ? 'stroke="#2F80ED" stroke-width="1.3" stroke-dasharray="4 3"' : ""}/>` : "")
        + `<text data-ti="${i}" x="${t.x}" y="${t.y}" font-size="${sz}" fill="${t.c}" font-family="Plex Sans,Segoe UI,sans-serif" font-weight="500">${String(t.v).split("\n").map((l, j) => j ? `<tspan x="${t.x}" dy="${(1.2 * sz).toFixed(1)}">${esc(l)}</tspan>` : esc(l)).join("")}</text>`; }).join("");
}

