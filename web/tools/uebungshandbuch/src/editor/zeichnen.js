/* Pneumatik-Simulation */
import { INK, MUTE, PH, SVGT } from './svg.js';
import { ED } from './status.js';
import { BLK, FIXED, GRUPPE, PC, PORTS2, art } from './registry.js';
import { G, strokesSVG } from './vorlagen-svg.js';
import { BLUE, DIRV, SK, VALVE, portsOf, pressed, simOn, vrails, vstate, wireD, wireEnds, xform } from './bauteile.js';
import { bbox, bw, ctr, fam, gruppeVon } from './bausteine.js';
import { verbindeKette } from './kette.js';

export function simCompute(){
  const d = ED.data, adj = new Map(), add = (a, b) => { if (!adj.has(a)) adj.set(a, []); if (!adj.has(b)) adj.set(b, []); adj.get(a).push(b); adj.get(b).push(a); };
  d.c.forEach(c => { if (c.pa !== undefined && c.pb !== undefined) add(c.a + ":" + c.pa, c.b + ":" + c.pb); });
  const roots = [];
  d.o.forEach(o => { const pc = PC[o.k]; if (!pc || !pc.sim) return; const r = pc.sim(o, ED.sim.st[o.id], () => false);
    (r.pairs || []).forEach(([p, q]) => add(o.id + ":" + p, o.id + ":" + q)); (r.src || []).forEach(p => roots.push(o.id + ":" + p)); });
  let P = new Set();
  for (let pass = 0; pass < 8; pass++) {   // gerichtete Wege hängen vom Druck ab: wiederholen, bis sich nichts mehr ändert
    const dir = new Map();
    d.o.forEach(o => { const pc = PC[o.k]; if (!pc || !pc.sim) return; const r = pc.sim(o, ED.sim.st[o.id], q => P.has(o.id + ":" + q));
      (r.dir || []).forEach(([p, q]) => { const a = o.id + ":" + p; if (!dir.has(a)) dir.set(a, []); dir.get(a).push(o.id + ":" + q); }); });
    const N = new Set(), st = [...roots];
    while (st.length) { const n = st.pop(); if (N.has(n)) continue; N.add(n); (adj.get(n) || []).forEach(m => st.push(m)); (dir.get(n) || []).forEach(m => st.push(m)); }
    const same = N.size === P.size && [...N].every(n => P.has(n)); P = N; if (same) break;
  }
  ED.sim.P = P;
}
export function simStep(t){
  if (!simOn()) return;
  const dt = Math.min(.05, (t - (ED.sim.t || t)) / 1000); ED.sim.t = t;
  let moving = false;
  ED.data.o.forEach(o => { if (!["zyl1","zyl2","rot"].includes(o.k)) return;
    const A = pressed(o, "A"), B = o.k !== "zyl1" && pressed(o, "B"), p = ED.sim.pos[o.id] || 0;
    const dir = o.k === "zyl1" ? (A ? 1 : -1) : (A && !B ? 1 : B && !A ? -1 : 0), np = Math.max(0, Math.min(1, p + dir * dt / 1.2));
    if (np !== p) { ED.sim.pos[o.id] = np; moving = true; } });
  if (moving && ED.svg) ED.svg.querySelector(".ink").innerHTML = inkSVG(ED.data, true, ED.key);
  requestAnimationFrame(simStep);
}
export function simClick(o, pt){
  if (o.k === "kh") { ED.sim.st[o.id] = (ED.sim.st[o.id] || o.zu || "auf") === "auf" ? "zu" : "auf"; simCompute(); ED.svg.querySelector(".ink").innerHTML = inkSVG(ED.data, true, ED.key); return; }
  if (!["v22","v32","v52","v53"].includes(o.k)) return;
  const b = bbox(o), left = pt[0] < b.x + b.w / 2, s = vstate(o), mono = (o.ar || "feder") === "feder";
  let ns = s;
  if (o.k === "v53") ns = left ? (s === "act" ? "center" : "act") : (s === "b" ? "center" : "b");
  else if (mono) ns = left ? (s === "act" ? "rest" : "act") : s;
  else ns = left ? "act" : "rest";
  ED.sim.st[o.id] = ns; simCompute(); ED.svg.querySelector(".ink").innerHTML = inkSVG(ED.data, true, ED.key);
}

export function drawObj(o, edit){
  if (PC[o.k]) {
    const svg = PC[o.k].draw(o, edit), X = xform(o); if (!X) return svg;
    const swap = X.f * X.c < 0;   // Schrift läge sonst auf der falschen Seite
    const upright = svg.replace(/<text x="([-\d.]+)" y="([-\d.]+)" text-anchor="(\w+)"/g, (m, x, y, a) =>
      `<text transform="translate(${x} ${y}) scale(${X.f} 1) rotate(${-X.r}) translate(${-x} ${-y})" x="${x}" y="${y}" text-anchor="${swap && a !== "middle" ? (a === "end" ? "start" : "end") : a}"`);
    return `<g transform="translate(${X.cx} ${X.cy}) rotate(${X.r}) scale(${X.f} 1) translate(${-X.cx} ${-X.cy})">${upright}</g>`;
  }
  const a = BLK[o.k];
  if (a && a.zeichne) return a.zeichne(o, edit);
  const x = o.x, y = o.y, st = `stroke="${INK}" stroke-width="1.6"`, ph = (t, xx, yy, a="middle") => edit ? SVGT(xx, yy, t, a, 12, 400, MUTE) : "";
  switch (o.k) {
    case "state": return `<circle cx="${x}" cy="${y}" r="36" fill="#fff" ${st}/>` + SVGT(x, y+5, o.v);
    case "sinit": return `<circle cx="${x}" cy="${y}" r="36" fill="#fff" ${st}/><circle cx="${x}" cy="${y}" r="31" fill="none" ${st}/>` + SVGT(x, y+5, o.v);
    case "start": return `<circle cx="${x}" cy="${y}" r="8" fill="${INK}"/>`;
    case "no": return `<path d="M${x} ${y}V${y+20}M${x} ${y+60}V${y+42}L${x-13} ${y+19}" ${st} fill="none" stroke-linecap="round"/>` + SVGT(x-20, y+35, o.v, "end", 12);
    case "nc": return `<path d="M${x} ${y}V${y+20}H${x+9}M${x} ${y+60}V${y+42}L${x+12} ${y+16}" ${st} fill="none" stroke-linecap="round"/>` + SVGT(x-20, y+35, o.v, "end", 12);
    case "coil": return `<path d="M${x} ${y}V${y+18}M${x} ${y+42}V${y+60}" ${st}/><rect x="${x-15}" y="${y+18}" width="30" height="24" fill="#fff" ${st}/>` + SVGT(x-22, y+35, o.v, "end", 12);
    case "lamp": return `<path d="M${x} ${y}V${y+18}M${x} ${y+42}V${y+60}" ${st}/><circle cx="${x}" cy="${y+30}" r="12" fill="#fff" ${st}/><path d="M${x-8.5} ${y+21.5}L${x+8.5} ${y+38.5}M${x+8.5} ${y+21.5}L${x-8.5} ${y+38.5}" ${st}/>` + SVGT(x-20, y+35, o.v, "end", 12);
    case "box": { const w = bw(o); return `<rect x="${x}" y="${y}" width="${w}" height="50" rx="3" fill="#fff" ${st}/>` + (o.v ? SVGT(x+w/2, y+30, o.v) : ph("Block", x+w/2, y+30)); }
    case "sum": return `<circle cx="${x}" cy="${y}" r="15" fill="#fff" ${st}/><path d="M${x-10.6} ${y-10.6}L${x+10.6} ${y+10.6}M${x+10.6} ${y-10.6}L${x-10.6} ${y+10.6}" stroke="${INK}" stroke-width="1"/>`;
  }
  return "";
}
// Name eines Bausteins im Verweis an einer Abbruchstelle, z. B. „Schritt 7“ (Haken verweisName der Bausteinart)
export function refName(o, objs, cs, dir){
  const a = art(o.k);
  if (a.verweisName) return a.verweisName(o, objs, cs, dir);
  return o.v || BLK[o.k].n;
}
export function connGeom(c, objs, all){
  const A = objs[c.a], B = objs[c.b]; if (!A || !B) return null;
  if (c.pa !== undefined || c.pb !== undefined) { const e = wireEnds(c, objs); if (!e) return null;
    return {d: wireD(e[0], e[1]), wire: true, ends: e, lbl: [e[0].x + 5, Math.round((e[0].y + e[1].y) / 2), "start"]}; }
  const g = fam(A), G = GRUPPE[g] || {};
  if (G.kette) return verbindeKette(A, B);
  if (G.verbinde) return G.verbinde(c, A, B, objs, all);
  const ba = bbox(A), bb = bbox(B), ca = ctr(A), cb = ctr(B), dx = cb[0]-ca[0], dy = cb[1]-ca[1];
  const edge = (o, b, dir) => { const c = ctr(o), r = art(o.k).radius;
    if (r) return dir === "r" ? [c[0]+r, c[1]] : dir === "l" ? [c[0]-r, c[1]] : dir === "d" ? [c[0], c[1]+r] : [c[0], c[1]-r];
    return dir === "r" ? [b.x+b.w, c[1]] : dir === "l" ? [b.x, c[1]] : dir === "d" ? [c[0], b.y+b.h] : [c[0], b.y]; };
  if (Math.abs(dx) >= Math.abs(dy)) {
    const p1 = edge(A, ba, dx >= 0 ? "r" : "l"), p2 = edge(B, bb, dx >= 0 ? "l" : "r"), m = Math.round((p1[0]+p2[0])/2);
    return {d: Math.abs(p1[1]-p2[1]) < 1 ? `M${p1[0]} ${p1[1]}H${p2[0]}` : `M${p1[0]} ${p1[1]}H${m}V${p2[1]}H${p2[0]}`, arrow:true, lbl:[m, Math.min(p1[1], p2[1]) - 8, "middle"]};
  }
  const p1 = edge(A, ba, dy >= 0 ? "d" : "u"), p2 = edge(B, bb, dy >= 0 ? "u" : "d"), m = Math.round((p1[1]+p2[1])/2);
  return {d: Math.abs(p1[0]-p2[0]) < 1 ? `M${p1[0]} ${p1[1]}V${p2[1]}` : `M${p1[0]} ${p1[1]}V${m}H${p2[0]}V${p2[1]}`, arrow:true, lbl:[Math.max(p1[0], p2[0]) + 8, m + 4, "start"]};
}
// Gruppen-Haken bedingung: Übergang von A braucht eine Bedingung (Platzhalter im Editor, Abfrage nach dem Verbinden)
export const fragtBedingung = A => { const b = gruppeVon(A).bedingung; return !!b && b(A); };
export function inkSVG(d, edit=false, key=null){
  if (!d) return "";
  const objs = Object.fromEntries((d.o || []).map(o => [o.id, o])), cs = d.c || [];
  vrails(key, pageCount(key, d)).forEach(r => { objs[r.id] = r; });
  let rails = "";
  if (key === "stromlauf") (d.o || []).filter(o => fam(o) === "elektro" && (PORTS2[o.k] || (PC[o.k] && PC[o.k].bx))).forEach(o => {   // Steuerstrompfad an L+ und M des eigenen Blatts andocken
    const ps = portsOf(o), top = ps[0], bot = ps[1], base = Math.floor(o.y / PH) * PH, yT = base + 70, yB = base + 590;
    const wired = p => cs.some(c => (c.a === o.id && c.pa === p.n) || (c.b === o.id && c.pb === p.n));
    if (!cs.some(c => c.b === o.id && c.pa === undefined) && !wired(top) && o.y > yT) rails += `<path d="M${o.x} ${yT}V${o.y}" stroke="${INK}" stroke-width="1.6"/><circle cx="${o.x}" cy="${yT}" r="2.6" fill="${INK}"/>`;
    if (!cs.some(c => c.a === o.id && c.pa === undefined) && !wired(bot) && o.y + 60 < yB) rails += `<path d="M${o.x} ${o.y+60}V${yB}" stroke="${INK}" stroke-width="1.6"/><circle cx="${o.x}" cy="${yB}" r="2.6" fill="${INK}"/>`;
  });
  const conns = cs.map((c, i) => {
    const gm = connGeom(c, objs, cs); if (!gm) return "";
    const sel = edit && ED.selC === i, col = sel ? "#0E4C92" : INK, g = fam(objs[c.a]);
    if (gm.wire) {
      const [a, b] = gm.ends, P = simOn() && ED.sim.P && (ED.sim.P.has(c.a + ":" + c.pa) || ED.sim.P.has(c.b + ":" + c.pb));
      const wc = sel ? "#0E4C92" : P ? BLUE : INK, ww = sel || P ? 2.4 : 1.6, dash = c.st ? 'stroke-dasharray="6 4"' : "";
      if (!FIXED[key] && Math.floor(a.y / PH) !== Math.floor(b.y / PH)) {   // Abbruchstelle: beide Enden mit Verweis
        const stub = (q, n) => [q.x + (q.d === "r" ? n : q.d === "l" ? -n : 0), q.y + (q.d === "d" ? n : q.d === "u" ? -n : 0)];
        const e1 = stub(a, 30), e2 = stub(b, 30);
        const t1 = `→ ${wireRef(objs[c.b], c.pb, key, b.y, b.x)}`, t2 = `von ${wireRef(objs[c.a], c.pa, key, a.y, a.x)}`;
        const lab = (q, e, t) => { const v = q.d === "u" || q.d === "d"; return SVGT(e[0] + (v ? 5 : 0), e[1] + (v ? (q.d === "d" ? 4 : 2) : -5), t, "start", 10.5, 600); };
        const d1 = `M${a.x} ${a.y}L${e1[0]} ${e1[1]}`, d2 = `M${e2[0]} ${e2[1]}L${b.x} ${b.y}`;
        return `<g data-c="${i}"><path d="${d1}" fill="none" stroke="${wc}" stroke-width="${ww}" ${dash} marker-end="url(#arw)"/><path d="${d2}" fill="none" stroke="${wc}" stroke-width="${ww}" ${dash} marker-end="url(#arw)"/>${lab(a, e1, t1)}${lab(b, e2, t2)}`
          + (edit ? `<path d="${d1}${d2}" fill="none" stroke="transparent" stroke-width="12"/>` : "") + `</g>`;
      }
      return `<g data-c="${i}"><path d="${gm.d}" fill="none" stroke="${wc}" stroke-width="${ww}" ${dash}/>${edit ? `<path d="${gm.d}" fill="none" stroke="transparent" stroke-width="12"/>` : ""}${c.v ? SVGT(gm.lbl[0], gm.lbl[1], c.v, "start", 11, 500) : ""}</g>`;
    }
    if (gm.p1 && !FIXED[key] && Math.floor(gm.p1[1] / PH) !== Math.floor((gm.p2[1] - 1) / PH)) {   // Abbruchstelle mit Verweis
      const [x1, y1] = gm.p1, [x2, y2] = gm.p2, b1 = Math.floor(y1 / PH) + 1, b2 = Math.floor((y2 - 1) / PH) + 1;
      const zu = `→ ${refName(objs[c.b], objs, cs, "zu")}, Blatt ${b2}`, von = `von ${refName(objs[c.a], objs, cs, "von")}, Blatt ${b1}`;
      const d = `M${x1} ${y1}V${y1 + 30}M${x2} ${y2 - 34}V${y2}`;
      return `<g data-c="${i}"><path d="M${x1} ${y1}V${y1 + 30}" fill="none" stroke="${col}" stroke-width="${sel ? 2.2 : 1.6}" marker-end="url(#arw)"/><path d="M${x2} ${y2 - 34}V${y2}" fill="none" stroke="${col}" stroke-width="${sel ? 2.2 : 1.6}" marker-end="url(#arw)"/>`
        + SVGT(x1 + 10, y1 + 28, zu, "start", 11.5, 600) + SVGT(x2 + 10, y2 - 22, von, "start", 11.5, 600)
        + (edit ? `<path d="${d}" fill="none" stroke="transparent" stroke-width="12"/>` : "") + `</g>`;
    }
    const up = gm.up ? `<path d="M${gm.up[0]-6} ${gm.up[1]+5}L${gm.up[0]} ${gm.up[1]-6}L${gm.up[0]+6} ${gm.up[1]+5}" fill="none" stroke="${col}" stroke-width="1.6"/>` : "";
    const lbl = gm.lbl ? (c.v ? SVGT(gm.lbl[0], gm.lbl[1], c.v, gm.lbl[2], 12, 500) : (edit && fragtBedingung(objs[c.a]) ? SVGT(gm.lbl[0], gm.lbl[1], "Bedingung", gm.lbl[2], 11, 400, MUTE) : "")) : "";
    return `<g data-c="${i}"><path d="${gm.d}" fill="none" stroke="${col}" stroke-width="${sel ? 2.2 : 1.6}" ${gm.arrow ? 'marker-end="url(#arw)"' : ""}/>${up}${edit ? `<path d="${gm.d}" fill="none" stroke="transparent" stroke-width="12"/>` : ""}${lbl}</g>`;
  }).join("");
  const os = [...(d.o || [])].sort((a, b) => (b.k === "insel") - (a.k === "insel")).map(o => { const b = bbox(o), hi = edit && (ED.sel === o.id || ED.from === o.id), fr = o.k === "insel";
    return `<g data-o="${o.id}">${edit && fr ? `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="none" pointer-events="stroke" stroke="${hi ? "#0E4C92" : "#000"}" stroke-opacity="${hi ? .25 : 0}" stroke-width="12"/>` : ""}${edit && !fr ? `<rect x="${b.x-5}" y="${b.y-5}" width="${b.w+10}" height="${b.h+10}" rx="4" fill="transparent" ${hi ? `stroke="#0E4C92" stroke-width="1.3" stroke-dasharray="${ED.from === o.id ? "2 3" : "5 3"}"` : ""}/>` : ""}${drawObj(o, edit)}</g>`; }).join("");
  let extra = "";
  const cnt = {}, dot = q => `<circle cx="${q.x}" cy="${q.y}" r="2.8" fill="${INK}"/>`;
  cs.forEach(c => { if (c.pa === undefined && c.pb === undefined) return; const e = wireEnds(c, objs); if (!e) return;
    [[c.a, c.pa, e[0]], [c.b, c.pb, e[1]]].forEach(([id, pn, q]) => { if (q.rail) extra += dot(q); else { const k = id + ":" + pn; (cnt[k] = cnt[k] || {n: 0, q}).n++; } }); });
  Object.values(cnt).forEach(v => { if (v.n >= 2) extra += dot(v.q); });
  (d.o || []).forEach(o => { if (!VALVE[o.k]) return; portsOf(o).forEach(q => { if ((q.n === "3" || q.n === "5") && !cnt[o.id + ":" + q.n]) { const [dx, dy] = DIRV[q.d]; extra += `<path d="M${q.x} ${q.y}L${q.x + dx*9 - dy*5} ${q.y + dy*9 - dx*5}L${q.x + dx*9 + dy*5} ${q.y + dy*9 + dx*5}Z" ${SK}/>`; } }); });
  if (edit && ED.tool === "conn") (d.o || []).forEach(o => portsOf(o).forEach(q => { const f = ED.from === o.id && ED.fromP === q.n;
    extra += `<circle cx="${q.x}" cy="${q.y}" r="${f ? 5 : 3.6}" fill="${f ? BLUE : "#fff"}" stroke="${BLUE}" stroke-width="1.5" pointer-events="none"/>`; }));
  return rails + conns + os + extra + strokesSVG(d, edit);
}
export function pageCount(key, d, extraY=0){
  if (FIXED[key]) return 1;
  let m = extraY;
  (d && d.o || []).forEach(o => { const b = bbox(o); m = Math.max(m, b.y + b.h); });
  (d && d.s || []).forEach(st => st.p.forEach(q => { m = Math.max(m, q[1]); }));
  (d && d.t || []).forEach(t => { m = Math.max(m, t.y); });
  return Math.max(1, Math.ceil((m + 160) / PH));
}
export function wireRef(o, port, key, y, x){   // Verweistext: Kennzeichen:Anschluss, Blatt, Strompfad
  const b = Math.floor(y / PH) + 1, name = o.k === "rail" ? o.v : `${o.v || BLK[o.k].n}${port && port !== "~" ? ":" + port : ""}`;
  const pfad = key === "stromlauf" ? `, Pfad ${Math.max(1, Math.min(20, Math.round((x - 40) / 46)))}` : "";
  return `${name}, Blatt ${b}${pfad}`;
}
export function pcSample(k){
  const mk = BLK[k] && BLK[k].mk, base = (mk && mk.k) || k, pc = PC[base];
  const o = {k: base, ...(pc.def || {}), ...(mk || {}), x: 0, y: 0, v: ""}; o.k = base; if (base === "rail") o.w = 70;
  const bx = pc.bx || 0, w = base === "rail" ? 70 : pc.w, h = Math.max(pc.h, 12);
  o.x = 4 - bx; o.y = base === "rail" ? 10 : 4;
  return [o, `0 0 ${w + 8} ${h + 8}`, ""];
}
