/* ---------- Bauteile mit Anschlüssen: Stromlauf, Geräte, Hauptstromkreis, Pneumatik (ISO 1219) ---------- */
const SK = `stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
const PP = d => `<path d="${d}" ${SK}/>`;
const PD = d => `<path d="${d}" ${SK} stroke-dasharray="3 2.5"/>`;
const LB = (x, y, t, a="end") => t ? SVGT(x, y, t, a, 12, 600) : "";
const PN = (x, y, t, a="start") => SVGT(x, y, t, a, 8.5, 500, "#5A6672");
const cNO = (x, y) => `M${x} ${y}V${y+20}M${x} ${y+60}V${y+42}L${x-13} ${y+19}`;
const cNC = (x, y) => `M${x} ${y}V${y+20}H${x+9}M${x} ${y+60}V${y+42}L${x+12} ${y+16}`;
const BLUE = "#2F80ED";
const simOn = () => typeof ED !== "undefined" && ED.sim && ED.sim.on;
const pressed = (o, p) => simOn() && ED.sim.P && ED.sim.P.has(o.id + ":" + p);
const posOf = o => simOn() && ED.sim.pos[o.id] !== undefined ? ED.sim.pos[o.id] : 0;
const vstate = o => simOn() && ED.sim.st[o.id] || (o.k === "v53" ? "center" : "rest");

/* Wegeventile nach ISO 1219: quadratische Schaltstellungen 40 × 40, Anschlüsse im 10er-Raster */
const VB = 40;
const VALVE = {
  v22: {n: 2, rest: 1, ports: [["2", 20, "u"], ["1", 20, "d"]]},
  v32: {n: 2, rest: 1, ports: [["2", 20, "u"], ["1", 10, "d"], ["3", 30, "d"]]},
  v52: {n: 2, rest: 1, ports: [["4", 10, "u"], ["2", 30, "u"], ["5", 10, "d"], ["1", 20, "d"], ["3", 30, "d"]]},
  v53: {n: 3, rest: 1, ports: [["4", 10, "u"], ["2", 30, "u"], ["5", 10, "d"], ["1", 20, "d"], ["3", 30, "d"]]}
};
const vIdx = (o, s) => o.k === "v53" ? ({act: 0, center: 1, b: 2}[s] ?? 1) : (s === "act" ? 0 : 1);
function vPairs(o, s){
  if (o.k === "v22") { const nc = (o.gs || "nc") === "nc"; return (s === "act") === nc ? [["1","2"]] : []; }   // 2/2: Durchgang oder gesperrt
  if (o.k === "v32") { const nc = (o.gs || "nc") === "nc"; return s === "act" ? (nc ? [["1","2"]] : [["2","3"]]) : (nc ? [["2","3"]] : [["1","2"]]); }
  if (o.k === "v52") return s === "act" ? [["1","4"],["2","3"]] : [["1","2"],["4","5"]];
  return s === "act" ? [["1","4"],["2","3"]] : s === "b" ? [["1","2"],["4","5"]] : [];
}
function vBox(o, i){   // Durchflusswege (Pfeil vom Druck- bzw. Arbeitsanschluss weg) und Sperren eines Kästchens
  const V = VALVE[o.k], at = n => V.ports.find(p => p[0] === n);
  let pairs;
  if (o.k === "v53" && i === 1) pairs = [];
  else pairs = vPairs(o, o.k === "v53" ? (i === 0 ? "act" : "b") : (i === 0 ? "act" : "rest"));
  const used = new Set(pairs.flat());
  const dir = ([a, b]) => a === "1" ? [at(a), at(b)] : b === "1" ? [at(b), at(a)] : (b === "3" || b === "5") ? [at(a), at(b)] : [at(b), at(a)];
  return {flows: pairs.map(dir), blocked: V.ports.filter(p => !used.has(p[0]))};
}
const thin = `stroke="${INK}" stroke-width="1.3" fill="none" stroke-linecap="round"`;
function arrowHead(x1, y1, x2, y2, h=6.5, w=.42){
  const a = Math.atan2(y2 - y1, x2 - x1), f = n => n.toFixed(1);
  return `<path d="M${f(x2)} ${f(y2)}L${f(x2 - h*Math.cos(a - w))} ${f(y2 - h*Math.sin(a - w))}L${f(x2 - h*Math.cos(a + w))} ${f(y2 - h*Math.sin(a + w))}Z" fill="${INK}"/>`;
}
function actuator(kind, ex, cy, dir){   // ex = Außenkante des äußeren Kästchens, dir −1 links, +1 rechts
  const X = d => ex + dir * d;
  if (kind === "feder") return `<path d="M${ex} ${cy}L${X(3)} ${cy-7}L${X(7)} ${cy+7}L${X(11)} ${cy-7}L${X(15)} ${cy+7}L${X(19)} ${cy-7}L${X(22)} ${cy}" ${thin}/>`;
  if (kind === "taster") return `<path d="M${ex} ${cy}H${X(14)}M${X(14)} ${cy-8}V${cy+8}" ${thin}/><path d="M${X(14)} ${cy-8}A8 8 0 0 ${dir < 0 ? 0 : 1} ${X(14)} ${cy+8}" ${thin}/>`;
  if (kind === "hebel") return `<path d="M${ex} ${cy}H${X(6)}L${X(16)} ${cy-12}" ${thin}/><circle cx="${X(17.5)}" cy="${cy-14}" r="2.8" fill="${INK}"/>`;
  const x0 = Math.min(ex, X(12));
  let s = `<rect x="${x0}" y="${cy-9}" width="12" height="18" fill="#fff" ${thin}/><path d="M${x0} ${cy+9}L${x0+12} ${cy-9}" ${thin}/>`;
  if (kind === "magp") { const x1 = Math.min(X(12), X(24)); s += `<rect x="${x1}" y="${cy-9}" width="12" height="18" fill="#fff" ${thin}/><path d="M${X(14)} ${cy}L${X(22)} ${cy-5}V${cy+5}Z" fill="${INK}"/>`; }
  return s;
}
const actW = k => k === "magp" ? 24 : k === "feder" ? 22 : k === "mag" ? 12 : 18;
function drawValve(o){
  const V = VALVE[o.k], x = o.x, y = o.y, s = vstate(o), shift = (V.rest - vIdx(o, s)) * VB, by = y + 10;
  let g = "";
  for (let i = 0; i < V.n; i++) {
    const bx = x + 30 + i * VB + shift, c = vBox(o, i);
    g += `<rect x="${bx}" y="${by}" width="${VB}" height="${VB}" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`;
    c.flows.forEach(([p, q]) => { const x1 = bx + p[1], y1 = p[2] === "u" ? by + 2 : by + VB - 2, x2 = bx + q[1], y2 = q[2] === "u" ? by + 2 : by + VB - 2;
      g += `<path d="M${x1} ${y1}L${x2} ${y2}" ${thin}/>` + arrowHead(x1, y1, x2, y2); });
    c.blocked.forEach(p => { const px = bx + p[1], top = p[2] === "u", y0 = top ? by : by + VB, y1 = top ? by + 9 : by + VB - 9;
      g += `<path d="M${px} ${y0}V${y1}M${px-5} ${y1}H${px+5}" ${thin}/>`; });
  }
  const el = x + 30 + shift, er = x + 30 + V.n * VB + shift, cy = y + 30, al = o.al || "mag", ar = o.ar || (o.k === "v53" ? "mag" : "feder");
  g += actuator(al, el, cy, -1) + actuator(ar, er, cy, 1);
  if (o.k === "v53") g += actuator("feder", el - actW(al), cy, -1) + actuator("feder", er + actW(ar), cy, 1);
  if (al === "mag" || al === "magp") g += PN(el - actW(al) / 2, y + 17, "14", "middle");
  if (ar === "mag" || ar === "magp") g += PN(er + actW(ar) / 2, y + 17, "12", "middle");
  const rx = x + 30 + V.rest * VB;
  V.ports.forEach(([n, dx, d]) => { const px = rx + dx; g += d === "u" ? PP(`M${px} ${y}V${y+10}`) + PN(px + 3, y + 7, n) : PP(`M${px} ${y+50}V${y+60}`) + PN(px + 3, y + 59, n); });
  const lx = Math.min(el - actW(al) - (o.k === "v53" ? 22 : 0), x + 30) - 4;
  return g + LB(lx, y + 34, o.v);
}
function cylinder(o, single){
  const x = o.x, y = o.y, p = posOf(o), px = x + 16 + p * 88, f = n => n.toFixed(1);
  let s = "";
  if (simOn()) { if (pressed(o, "A")) s += `<rect x="${x+3}" y="${y+13}" width="${f(px - x - 3)}" height="24" fill="${BLUE}" fill-opacity=".2"/>`;
    if (!single && pressed(o, "B")) s += `<rect x="${f(px)}" y="${y+13}" width="${f(x + 117 - px)}" height="24" fill="${BLUE}" fill-opacity=".2"/>`; }
  s += `<rect x="${x}" y="${y+10}" width="120" height="30" fill="none" stroke="${INK}" stroke-width="1.6"/>`;
  s += `<rect x="${f(px - 2)}" y="${y+11}" width="4" height="28" fill="${INK}"/>`;                                     // Kolben
  if (o.mk === "ja") s += `<rect x="${f(px - 7)}" y="${y+13}" width="3" height="24" fill="${INK}"/>`;                       // Magnetkolben
  if (!single && o.dp) { const cu = (cx, d) => `<rect x="${cx}" y="${y+19}" width="7" height="12" fill="#fff" ${thin}/>` + (o.dp === "einst" ? `<path d="M${cx-4} ${y+34}L${cx+11} ${y+16}" ${thin}/>` + arrowHead(cx-4, y+34, cx+11.5, y+15.5, 4.5) : "");
    s += cu(x + 3, 1) + cu(x + 108, -1); }                                                                                   // Endlagendämpfung
  s += `<path d="M${f(px)} ${y+22}H${f(px + 112)}V${y+28}H${f(px)}" fill="#fff" stroke="${INK}" stroke-width="1.4"/>`;   // Kolbenstange
  s += `<rect x="${x+118}" y="${y+20}" width="4" height="10" fill="${INK}"/>`;                                            // Stangendichtung
  if (single) { const a = px + 5, b = x + 116, n = 7, st = (b - a) / n; let z = `M${f(a)} ${y+25}`;
    for (let i = 1; i < n; i++) z += `L${f(a + st*i)} ${i % 2 ? y+15 : y+35}`; s += `<path d="${z}L${f(b)} ${y+25}" ${thin}/>`;
    s += `<path d="M${x+110} ${y+40}V${y+46}M${x+106} ${y+46}H${x+114}" ${thin}/>`; }                                    // Entlüftung Federraum
  s += PP(`M${x+10} ${y+40}V${y+60}`) + PN(x + 13, y + 57, "A");
  if (!single) s += PP(`M${x+110} ${y+40}V${y+60}`) + PN(x + 113, y + 57, "B");
  const sens = (sx, t, on) => t ? `<path d="M${sx} ${y+10}V${y+4}" ${thin}/><rect x="${sx-6}" y="${y-4}" width="12" height="8" rx="1.5" fill="${on ? "#2E7D4F" : "#fff"}" ${thin}/>` + PN(sx, y - 7, t, "middle") : "";
  s += sens(x + 16, o.s1, simOn() && p < .02) + sens(x + 104, o.s2, simOn() && p > .98);
  return s + LB(x - 6, y + 30, o.v);
}
const PC = {
  /* Steuerstromkreis – Mittellinie bei o.x, Höhe 60 */
  tno:{g:"elektro", n:"Taster Schließer", lbl:"-SF1", bx:-22, w:44, h:60, ports:[["13",0,0,"u"],["14",0,60,"d"]],
    draw:o => PP(cNO(o.x, o.y)) + PD(`M${o.x-7} ${o.y+31}H${o.x-24}`) + PP(`M${o.x-24} ${o.y+24}V${o.y+38}M${o.x-24} ${o.y+24}H${o.x-28}M${o.x-24} ${o.y+38}H${o.x-28}`) + LB(o.x-34, o.y+35, o.v) + PN(o.x+5, o.y+11, "13") + PN(o.x+5, o.y+57, "14")},
  tnc:{g:"elektro", n:"Taster Öffner", lbl:"-SF2", bx:-22, w:44, h:60, ports:[["11",0,0,"u"],["12",0,60,"d"]],
    draw:o => PP(cNC(o.x, o.y)) + PD(`M${o.x+5} ${o.y+29}H${o.x-24}`) + PP(`M${o.x-24} ${o.y+22}V${o.y+36}M${o.x-24} ${o.y+22}H${o.x-28}M${o.x-24} ${o.y+36}H${o.x-28}`) + LB(o.x-34, o.y+33, o.v) + PN(o.x+12, o.y+11, "11") + PN(o.x+5, o.y+57, "12")},
  estop:{g:"elektro", n:"Not-Halt (Pilztaster)", lbl:"-SF0", bx:-22, w:44, h:60, ports:[["11",0,0,"u"],["12",0,60,"d"]],
    draw:o => PP(cNC(o.x, o.y)) + PD(`M${o.x+5} ${o.y+29}H${o.x-20}`) + `<path d="M${o.x-20} ${o.y+20}A9 9 0 0 0 ${o.x-20} ${o.y+38}Z" fill="#C0392B" fill-opacity=".85" stroke="${INK}" stroke-width="1.4"/>` + LB(o.x-34, o.y+33, o.v) + PN(o.x+12, o.y+11, "11") + PN(o.x+5, o.y+57, "12")},
  key:{g:"elektro", n:"Schlüsselschalter", lbl:"-SA2", bx:-22, w:44, h:60, ports:[["13",0,0,"u"],["14",0,60,"d"]],
    draw:o => PP(cNO(o.x, o.y)) + PD(`M${o.x-7} ${o.y+31}H${o.x-20}`) + `<circle cx="${o.x-25}" cy="${o.y+31}" r="4.5" ${SK}/>` + PP(`M${o.x-29.5} ${o.y+31}H${o.x-36}M${o.x-33} ${o.y+31}V${o.y+35}`) + LB(o.x-40, o.y+35, o.v) + PN(o.x+5, o.y+11, "13") + PN(o.x+5, o.y+57, "14")},
  lsw:{g:"elektro", n:"Positionsschalter", lbl:"-BG1", bx:-22, w:44, h:60, ports:[["13",0,0,"u"],["14",0,60,"d"]],
    draw:o => PP(cNO(o.x, o.y)) + PD(`M${o.x-7} ${o.y+31}H${o.x-20}`) + PP(`M${o.x-20} ${o.y+24}V${o.y+38}L${o.x-28} ${o.y+31}Z`) + LB(o.x-32, o.y+35, o.v) + PN(o.x+5, o.y+11, "13") + PN(o.x+5, o.y+57, "14")},
  sens:{g:"elektro", n:"Näherungsschalter PNP", lbl:"-BG2", bx:-22, w:56, h:60, ports:[["BN",0,0,"u"],["BU",0,60,"d"],["BK",30,30,"r"]],
    draw:o => `<rect x="${o.x-15}" y="${o.y+15}" width="30" height="30" fill="#fff" ${SK}/>` + PP(`M${o.x} ${o.y}V${o.y+15}M${o.x} ${o.y+45}V${o.y+60}M${o.x+15} ${o.y+30}H${o.x+30}M${o.x} ${o.y+22}L${o.x+8} ${o.y+30}L${o.x} ${o.y+38}L${o.x-8} ${o.y+30}Z`)
      + LB(o.x-20, o.y+35, o.v) + PN(o.x+4, o.y+10, "BN") + PN(o.x+4, o.y+57, "BU") + PN(o.x+18, o.y+26, "BK")},
  mbv:{g:"elektro", n:"Ventilspule", lbl:"-MB1", bx:-22, w:44, h:60, ports:[["A1",0,0,"u"],["A2",0,60,"d"]],
    draw:o => PP(`M${o.x} ${o.y}V${o.y+18}M${o.x} ${o.y+42}V${o.y+60}`) + `<rect x="${o.x-15}" y="${o.y+18}" width="30" height="24" fill="#fff" ${SK}/>` + PP(`M${o.x-15} ${o.y+42}L${o.x+15} ${o.y+18}`) + LB(o.x-22, o.y+35, o.v) + PN(o.x+5, o.y+11, "A1") + PN(o.x+5, o.y+57, "A2")},
  term:{g:"elektro", n:"Klemme", lbl:"-X1:1", bx:-22, w:44, h:60, ports:[["1",0,0,"u"],["2",0,60,"d"]],
    draw:o => PP(`M${o.x} ${o.y}V${o.y+26}M${o.x} ${o.y+34}V${o.y+60}`) + `<circle cx="${o.x}" cy="${o.y+30}" r="4" fill="#fff" ${SK}/>` + LB(o.x-10, o.y+34, o.v)},
  fuse:{g:"elektro", n:"Sicherung", lbl:"-FA2", bx:-22, w:44, h:60, ports:[["1",0,0,"u"],["2",0,60,"d"]],
    draw:o => PP(`M${o.x} ${o.y}V${o.y+60}`) + `<rect x="${o.x-5}" y="${o.y+16}" width="10" height="28" ${SK}/>` + LB(o.x-12, o.y+34, o.v) + PN(o.x+8, o.y+11, "1") + PN(o.x+8, o.y+57, "2")},
  /* Geräte und SPS – oben links */
  di8:{g:"geraete", n:"SPS-Eingänge DI 8", lbl:"-KF1", w:200, h:70, def:{b:"0"}, props:[["b","Byte-Adresse (%I…)","text"]],
    ports:() => [...Array.from({length: 8}, (_, i) => ["DI" + i, 40 + i*20, 0, "u"]), ["L+", 0, 25, "l"], ["M", 0, 45, "l"]],
    draw:o => { let s = `<rect x="${o.x+10}" y="${o.y+10}" width="180" height="50" fill="#fff" ${SK}/>` + PP(`M${o.x} ${o.y+25}H${o.x+10}M${o.x} ${o.y+45}H${o.x+10}`) + PN(o.x+1, o.y+21, "L+") + PN(o.x+1, o.y+41, "M");
      for (let i = 0; i < 8; i++) s += PP(`M${o.x+40+i*20} ${o.y}V${o.y+10}`) + PN(o.x+40+i*20, o.y+22, "." + i, "middle");
      return s + PN(o.x+14, o.y+22, `%I${o.b ?? 0}`) + SVGT(o.x+18, o.y+52, `${o.v || ""}  DI 8 × 24 V DC`, "start", 10.5, 600)}},
  dq8:{g:"geraete", n:"SPS-Ausgänge DQ 8", lbl:"-KF1", w:200, h:70, def:{b:"0"}, props:[["b","Byte-Adresse (%Q…)","text"]],
    ports:() => [...Array.from({length: 8}, (_, i) => ["DQ" + i, 40 + i*20, 70, "d"]), ["L+", 0, 25, "l"], ["M", 0, 45, "l"]],
    draw:o => { let s = `<rect x="${o.x+10}" y="${o.y+10}" width="180" height="50" fill="#fff" ${SK}/>` + PP(`M${o.x} ${o.y+25}H${o.x+10}M${o.x} ${o.y+45}H${o.x+10}`) + PN(o.x+1, o.y+21, "L+") + PN(o.x+1, o.y+41, "M");
      for (let i = 0; i < 8; i++) s += PP(`M${o.x+40+i*20} ${o.y+60}V${o.y+70}`) + PN(o.x+40+i*20, o.y+55, "." + i, "middle");
      return s + PN(o.x+14, o.y+55, `%Q${o.b ?? 0}`) + SVGT(o.x+18, o.y+26, `${o.v || ""}  DQ 8 × 24 V DC`, "start", 10.5, 600)}},
  ps:{g:"geraete", n:"Netzteil 24 V DC", lbl:"-TA1", w:100, h:70, ports:[["L",30,0,"u"],["N",50,0,"u"],["PE",70,0,"u"],["+",40,70,"d"],["−",60,70,"d"]],
    draw:o => `<rect x="${o.x+10}" y="${o.y+10}" width="80" height="50" fill="#fff" ${SK}/>` + PP(`M${o.x+30} ${o.y}V${o.y+10}M${o.x+50} ${o.y}V${o.y+10}M${o.x+70} ${o.y}V${o.y+10}M${o.x+40} ${o.y+60}V${o.y+70}M${o.x+60} ${o.y+60}V${o.y+70}M${o.x+10} ${o.y+60}L${o.x+90} ${o.y+10}`)
      + SVGT(o.x+28, o.y+32, "~", "middle", 14, 600) + SVGT(o.x+72, o.y+52, "=", "middle", 14, 600) + PN(o.x+33, o.y+8, "L") + PN(o.x+53, o.y+8, "N") + PN(o.x+73, o.y+8, "PE") + PN(o.x+43, o.y+68, "+") + PN(o.x+63, o.y+68, "−") + LB(o.x+6, o.y+40, o.v)},
  sr:{g:"geraete", n:"Sicherheitsrelais", lbl:"-KF2", w:220, h:80,
    ports:[["A1",30,0,"u"],["S11",60,0,"u"],["S12",80,0,"u"],["S21",110,0,"u"],["S22",130,0,"u"],["S34",160,0,"u"],["13",180,0,"u"],["23",200,0,"u"],["A2",30,80,"d"],["14",180,80,"d"],["24",200,80,"d"]],
    draw:o => { let s = `<rect x="${o.x+10}" y="${o.y+10}" width="200" height="60" fill="#fff" ${SK}/>` + SVGT(o.x+110, o.y+44, "Sicherheitsrelais", "middle", 11, 600) + LB(o.x+6, o.y+44, o.v);
      PC.sr.ports.forEach(([n, dx, dy]) => { s += dy ? PP(`M${o.x+dx} ${o.y+70}V${o.y+80}`) + PN(o.x+dx, o.y+66, n, "middle") : PP(`M${o.x+dx} ${o.y}V${o.y+10}`) + PN(o.x+dx, o.y+20, n, "middle"); });
      return s; }},
  /* Hauptstromkreis – drei Pole bei 10/30/50 */
  ls3:{g:"leistung", n:"Leitungsschutzschalter 3-polig", lbl:"-FA2", w:60, h:60, ports:[["1",10,0,"u"],["3",30,0,"u"],["5",50,0,"u"],["2",10,60,"d"],["4",30,60,"d"],["6",50,60,"d"]],
    draw:o => [10,30,50].map(d => PP(`M${o.x+d} ${o.y}V${o.y+20}M${o.x+d} ${o.y+60}V${o.y+42}L${o.x+d-11} ${o.y+21}M${o.x+d-3} ${o.y+17}L${o.x+d+3} ${o.y+23}M${o.x+d+3} ${o.y+17}L${o.x+d-3} ${o.y+23}`)).join("") + PD(`M${o.x+4} ${o.y+31}H${o.x+46}`) + LB(o.x-4, o.y+35, o.v)},
  ms3:{g:"leistung", n:"Motorschutzschalter", lbl:"-FA1", w:90, h:60, ports:[["1",10,0,"u"],["3",30,0,"u"],["5",50,0,"u"],["2",10,60,"d"],["4",30,60,"d"],["6",50,60,"d"]],
    draw:o => [10,30,50].map(d => PP(`M${o.x+d} ${o.y}V${o.y+20}M${o.x+d} ${o.y+60}V${o.y+42}L${o.x+d-11} ${o.y+21}M${o.x+d-3} ${o.y+17}L${o.x+d+3} ${o.y+23}M${o.x+d+3} ${o.y+17}L${o.x+d-3} ${o.y+23}`)).join("") + PD(`M${o.x+4} ${o.y+31}H${o.x+62}`)
      + `<rect x="${o.x+62}" y="${o.y+21}" width="26" height="20" fill="#fff" ${SK}/>` + SVGT(o.x+75, o.y+35, "I> ϑ", "middle", 9, 600) + LB(o.x-4, o.y+35, o.v)},
  k3:{g:"leistung", n:"Schütz 3-polig (Hauptkontakte)", lbl:"-QA1", w:60, h:60, ports:[["1",10,0,"u"],["3",30,0,"u"],["5",50,0,"u"],["2",10,60,"d"],["4",30,60,"d"],["6",50,60,"d"]],
    draw:o => [10,30,50].map(d => PP(`M${o.x+d} ${o.y}V${o.y+20}M${o.x+d} ${o.y+60}V${o.y+42}L${o.x+d-11} ${o.y+21}`) + `<path d="M${o.x+d-3.5} ${o.y+20}A3.5 3.5 0 0 0 ${o.x+d+3.5} ${o.y+20}" ${SK}/>`).join("") + PD(`M${o.x+4} ${o.y+31}H${o.x+46}`) + LB(o.x-4, o.y+35, o.v)},
  qs3:{g:"leistung", n:"Hauptschalter 3-polig", lbl:"-QB1", w:60, h:60, ports:[["1",10,0,"u"],["3",30,0,"u"],["5",50,0,"u"],["2",10,60,"d"],["4",30,60,"d"],["6",50,60,"d"]],
    draw:o => [10,30,50].map(d => PP(`M${o.x+d} ${o.y}V${o.y+20}M${o.x+d} ${o.y+60}V${o.y+42}L${o.x+d-11} ${o.y+21}M${o.x+d-4} ${o.y+20}H${o.x+d+4}`)).join("") + PD(`M${o.x+4} ${o.y+31}H${o.x+64}`) + PP(`M${o.x+64} ${o.y+25}V${o.y+37}`) + LB(o.x-4, o.y+35, o.v)},
  m3:{g:"leistung", n:"Drehstrommotor", lbl:"-MA1", w:60, h:80, ports:[["U1",10,0,"u"],["V1",30,0,"u"],["W1",50,0,"u"]],
    draw:o => PP(`M${o.x+10} ${o.y}V${o.y+43}M${o.x+30} ${o.y}V${o.y+30}M${o.x+50} ${o.y}V${o.y+43}`) + `<circle cx="${o.x+30}" cy="${o.y+52}" r="22" fill="#fff" ${SK}/>` + SVGT(o.x+30, o.y+54, "M", "middle", 15, 600) + SVGT(o.x+30, o.y+68, "3~", "middle", 10, 500)
      + PN(o.x+12, o.y+10, "U1") + PN(o.x+32, o.y+10, "V1") + PN(o.x+52, o.y+10, "W1") + LB(o.x-4, o.y+56, o.v)},
  fu:{g:"leistung", n:"Frequenzumrichter", lbl:"-TA2", w:80, h:90, ports:[["L1",10,0,"u"],["L2",30,0,"u"],["L3",50,0,"u"],["PE",70,0,"u"],["U",10,90,"d"],["V",30,90,"d"],["W",50,90,"d"],["PE2",70,90,"d"]],
    draw:o => `<rect x="${o.x}" y="${o.y+15}" width="80" height="60" fill="#fff" ${SK}/>` + PP(`M${o.x} ${o.y+75}L${o.x+80} ${o.y+15}` + [10,30,50,70].map(d => `M${o.x+d} ${o.y}V${o.y+15}M${o.x+d} ${o.y+75}V${o.y+90}`).join(""))
      + SVGT(o.x+18, o.y+36, "~", "middle", 14, 600) + SVGT(o.x+62, o.y+66, "~", "middle", 14, 600) + ["L1","L2","L3","PE"].map((n, i) => PN(o.x+12+i*20, o.y+9, n)).join("") + ["U","V","W","PE"].map((n, i) => PN(o.x+12+i*20, o.y+87, n)).join("") + LB(o.x-4, o.y+48, o.v)},
  rail:{g:"leistung", n:"Potenzialschiene", lbl:"L+", w:400, h:0, props:[["w","Länge","text"]],
    draw:o => `<path d="M${o.x} ${o.y}H${o.x+(o.w||400)}" stroke="${INK}" stroke-width="2.2" ${o.v === "PE" ? 'stroke-dasharray="10 4"' : ""}/>` + LB(o.x-6, o.y+4, o.v)},
  /* Pneumatik nach ISO 1219 – Energiefluss von unten nach oben */
  src:{g:"pneu", n:"Druckluftquelle", lbl:"", w:30, h:40, ports:[["1",15,0,"u"]], sim:() => ({src: ["1"]}),
    draw:o => PP(`M${o.x+15} ${o.y}V${o.y+16}`) + `<circle cx="${o.x+15}" cy="${o.y+27}" r="11" fill="#fff" stroke="${INK}" stroke-width="1.6"/><circle cx="${o.x+15}" cy="${o.y+27}" r="2.6" fill="${INK}"/>` + LB(o.x-4, o.y+31, o.v)},
  frl:{g:"pneu", n:"Wartungseinheit", lbl:"-AZ1", w:50, h:60, ports:[["1",20,60,"d"],["2",20,0,"u"]], sim:() => ({pairs: [["1","2"]]}),
    draw:o => `<rect x="${o.x+2}" y="${o.y+10}" width="46" height="40" fill="none" stroke="${INK}" stroke-width="1" stroke-dasharray="7 2 1.5 2"/>`
      + PP(`M${o.x+20} ${o.y}V${o.y+16}M${o.x+20} ${o.y+44}V${o.y+60}`) + `<path d="M${o.x+20} ${o.y+16}L${o.x+34} ${o.y+30}L${o.x+20} ${o.y+44}L${o.x+6} ${o.y+30}Z" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`
      + `<path d="M${o.x+10} ${o.y+30}H${o.x+30}" ${thin} stroke-dasharray="3 2"/><path d="M${o.x+34} ${o.y+30}H${o.x+38}" ${thin}/><circle cx="${o.x+42}" cy="${o.y+30}" r="4.5" fill="#fff" ${thin}/><path d="M${o.x+40} ${o.y+32}L${o.x+44.5} ${o.y+27.5}" ${thin}/>`
      + PN(o.x+23, o.y+7, "2") + PN(o.x+23, o.y+59, "1") + LB(o.x-4, o.y+34, o.v)},
  v22:{g:"pneu", n:"2/2-Wegeventil", lbl:"-MB14", hide:true, w:140, h:60, def:{al:"mag", ar:"feder", gs:"nc"}, ports:o => VALVE.v22.ports.map(([n, dx, d]) => [n, 70 + dx, d === "u" ? 0 : 60, d]),
    info:"Zwei Anschlüsse, zwei Stellungen: Durchgang von 1 nach 2 oder gesperrt. Kein Entlüftungsanschluss – die Leitung hinter dem Ventil bleibt beim Sperren unter Druck. An der Anlage: Luftmesser −MB14, Ausblasdüse −MB16, Frischwasser −MB17 (stromlos geschlossen).",
    props:[["gs","Grundstellung","select",[["nc","gesperrt (NC, stromlos geschlossen)"],["no","offen (NO, stromlos offen)"]]],["al","Betätigung links","select",[["mag","Magnet"],["magp","Magnet vorgesteuert"],["taster","Taster"],["hebel","Hebel"]]],["ar","Rückstellung rechts","select",[["feder","Feder"],["mag","Magnet"],["magp","Magnet vorgesteuert"]]]],
    sim:(o, s) => ({pairs: vPairs(o, s || "rest")}), draw:o => drawValve(o)},
  v32:{g:"pneu", n:"3/2-Wegeventil", lbl:"-MB1", hide:true, w:140, h:60, def:{al:"mag", ar:"feder", gs:"nc"}, ports:o => VALVE.v32.ports.map(([n, dx, d]) => [n, 70 + dx, d === "u" ? 0 : 60, d]),
    props:[["gs","Grundstellung","select",[["nc","gesperrt (NC)"],["no","offen (NO)"]]],["al","Betätigung links","select",[["mag","Magnet"],["magp","Magnet vorgesteuert"],["taster","Taster"],["hebel","Hebel"]]],["ar","Rückstellung rechts","select",[["feder","Feder"],["mag","Magnet"],["magp","Magnet vorgesteuert"]]]],
    sim:(o, s) => ({pairs: vPairs(o, s || "rest")}), draw:o => drawValve(o)},
  v52:{g:"pneu", n:"5/2-Wegeventil", lbl:"-MB1", hide:true, w:140, h:60, def:{al:"mag", ar:"feder"}, ports:o => VALVE.v52.ports.map(([n, dx, d]) => [n, 70 + dx, d === "u" ? 0 : 60, d]),
    props:[["al","Betätigung links (14)","select",[["mag","Magnet"],["magp","Magnet vorgesteuert"],["taster","Taster"],["hebel","Hebel"]]],["ar","Betätigung rechts (12)","select",[["feder","Feder – monostabil"],["mag","Magnet – bistabil"],["magp","Magnet vorgesteuert – bistabil"]]]],
    sim:(o, s) => ({pairs: vPairs(o, s || "rest")}), draw:o => drawValve(o)},
  v53:{g:"pneu", n:"5/3-Wegeventil", lbl:"-MB1", hide:true, w:180, h:60, def:{al:"mag", ar:"mag"}, ports:o => VALVE.v53.ports.map(([n, dx, d]) => [n, 70 + dx, d === "u" ? 0 : 60, d]),
    props:[["al","Betätigung links (14)","select",[["mag","Magnet"],["magp","Magnet vorgesteuert"]]],["ar","Betätigung rechts (12)","select",[["mag","Magnet"],["magp","Magnet vorgesteuert"]]]],
    sim:(o, s) => ({pairs: vPairs(o, s || "center")}), draw:o => drawValve(o)},
  zyl2:{g:"pneu", n:"Zylinder doppeltwirkend", lbl:"-MM1", w:240, h:60, def:{s1:"", s2:""}, ports:[["A",10,60,"d"],["B",110,60,"d"]],
    props:[["s1","Sensor hintere Endlage","text"],["s2","Sensor vordere Endlage","text"],["dp","Endlagendämpfung","select",[["","ohne"],["fest","beidseitig fest"],["einst","beidseitig einstellbar"]]],["mk","Magnetkolben (für berührungslose Sensoren)","select",[["","nein"],["ja","ja"]]]], draw:o => cylinder(o, false)},
  zyl1:{g:"pneu", n:"Zylinder einfachwirkend mit Feder", lbl:"-MM1", w:240, h:60, def:{s1:"", s2:""}, ports:[["A",10,60,"d"]],
    props:[["s1","Sensor hintere Endlage","text"],["s2","Sensor vordere Endlage","text"],["mk","Magnetkolben (für berührungslose Sensoren)","select",[["","nein"],["ja","ja"]]]], draw:o => cylinder(o, true)},
  rot:{g:"pneu", n:"Schwenkantrieb", lbl:"-MM5", w:60, h:60, ports:[["A",20,60,"d"],["B",40,60,"d"]],
    draw:o => { const x = o.x, y = o.y, p = posOf(o), a = (-90 + p * 90) * Math.PI / 180, cx = x + 30, cy = y + 42, f = n => n.toFixed(1);
      return `<path d="M${x+8} ${cy}A22 22 0 0 1 ${x+52} ${cy}Z" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`                       // Halbkreis: begrenzter Schwenkwinkel
        + `<path d="M${x+20} ${cy-1}L${x+16} ${cy-9}H${x+24}Z" fill="${INK}"/><path d="M${x+40} ${cy-1}L${x+36} ${cy-9}H${x+44}Z" fill="${INK}"/>`   // zwei Richtungen
        + `<path d="M${x+11} ${y+12}A24 24 0 0 1 ${x+49} ${y+12}" ${thin}/>` + arrowHead(x+18, y+6.5, x+11, y+12, 6) + arrowHead(x+42, y+6.5, x+49, y+12, 6)
        + `<path d="M${cx} ${cy}L${f(cx + 15*Math.cos(a))} ${f(cy + 15*Math.sin(a))}" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="2.2" fill="${INK}"/>`
        + PP(`M${x+20} ${cy}V${y+60}M${x+40} ${cy}V${y+60}`) + PN(x+23, y+59, "A") + PN(x+43, y+59, "B") + LB(x-4, y+40, o.v); }},
  drv:{g:"pneu", n:"Drossel­rückschlag­ventil", lbl:"-RZ1", w:50, h:60, info:"Frei von 1 nach 2 (Kugel hebt ab), gedrosselt von 2 nach 1. Mit 1 zum Ventil und 2 zum Zylinder: Abluftdrosselung – der Normalfall. Um 180° gedreht: Zuluftdrosselung.", ports:[["1",20,60,"d"],["2",20,0,"u"]], sim:() => ({pairs: [["1","2"]]}),
    draw:o => { const x = o.x, y = o.y;
      return `<rect x="${x+1}" y="${y+8}" width="48" height="44" fill="none" stroke="${INK}" stroke-width="1" stroke-dasharray="7 2 1.5 2"/>`   // Baueinheit
        + PP(`M${x+20} ${y}V${y+14}M${x+20} ${y+46}V${y+60}M${x+12} ${y+14}H${x+36}M${x+12} ${y+46}H${x+36}M${x+12} ${y+14}V${y+46}M${x+36} ${y+14}V${y+24}M${x+36} ${y+42}V${y+46}`)
        + `<path d="M${x+7} ${y+22}Q${x+12} ${y+30} ${x+7} ${y+38}M${x+17} ${y+22}Q${x+12} ${y+30} ${x+17} ${y+38}" ${thin}/>`                   // Drossel
        + `<path d="M${x+3} ${y+41}L${x+21} ${y+19}" ${thin}/>` + arrowHead(x+3, y+41, x+21, y+19, 6)                                                // einstellbar
        + `<path d="M${x+30} ${y+37}L${x+36} ${y+43}L${x+42} ${y+37}" ${thin}/><circle cx="${x+36}" cy="${y+31}" r="5.5" fill="#fff" stroke="${INK}" stroke-width="1.5"/>`  // Kugel im Sitz
        + PN(x+23, y+6, "2") + PN(x+23, y+59, "1") + LB(x-4, y+34, o.v); }},
  dr:{g:"pneu", n:"Drosselventil einstellbar", lbl:"-RZ2", w:30, h:60, ports:[["1",15,60,"d"],["2",15,0,"u"]], sim:() => ({pairs: [["1","2"]]}),
    draw:o => PP(`M${o.x+15} ${o.y}V${o.y+60}`) + `<path d="M${o.x+10} ${o.y+22}Q${o.x+15} ${o.y+30} ${o.x+10} ${o.y+38}M${o.x+20} ${o.y+22}Q${o.x+15} ${o.y+30} ${o.x+20} ${o.y+38}" ${thin}/>`
      + `<path d="M${o.x+5} ${o.y+41}L${o.x+25} ${o.y+19}" ${thin}/>` + arrowHead(o.x+5, o.y+41, o.x+25, o.y+19, 6) + LB(o.x-2, o.y+34, o.v)},
  rv:{g:"pneu", n:"Rückschlagventil", lbl:"-RM1", w:30, h:60, ports:[["1",15,60,"d"],["2",15,0,"u"]], sim:(o, s, has) => ({dir: has("1") ? [["1","2"]] : []}),
    draw:o => PP(`M${o.x+15} ${o.y}V${o.y+25}M${o.x+15} ${o.y+42}V${o.y+60}`) + `<path d="M${o.x+8} ${o.y+35}L${o.x+15} ${o.y+42}L${o.x+22} ${o.y+35}" ${thin}/><circle cx="${o.x+15}" cy="${o.y+30}" r="5.5" fill="#fff" stroke="${INK}" stroke-width="1.5"/>` + LB(o.x-2, o.y+34, o.v)},
  /* Weitere Symbole der Anlage und Klassiker der Ausbildung */
  kh:{g:"pneu", n:"Absperrventil (Kugelhahn)", lbl:"-QM10", w:50, h:60, def:{zu:"auf"}, ports:[["1",20,60,"d"],["2",20,0,"u"]],
    info:"Handbetätigtes Absperrventil in der Zuleitung vor der Wartungseinheit. In der Simulation per Klick auf- und zudrehen.",
    props:[["zu","Stellung","select",[["auf","offen"],["zu","geschlossen"]]]],
    sim:(o, s) => ({pairs: (s || o.zu || "auf") === "auf" ? [["1","2"]] : []}),
    draw:o => { const x = o.x, y = o.y, open = (vstate(o) === "rest" ? (o.zu || "auf") : vstate(o)) === "auf";
      return PP(`M${x+20} ${y}V${y+18}M${x+20} ${y+42}V${y+60}`) + `<path d="M${x+11} ${y+18}H${x+29}L${x+11} ${y+42}H${x+29}Z" fill="${open ? "#fff" : INK}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`
        + `<path d="M${x+29} ${y+30}H${x+40}M${x+40} ${y+22}V${y+38}" ${thin}/>` + PN(x+23, y+7, "2") + PN(x+23, y+59, "1") + LB(x-2, y+34, o.v); }},
  mano:{g:"pneu", n:"Manometer", lbl:"", w:40, h:60, ports:[["1",20,60,"d"]], sim:() => ({}),
    draw:o => { const x = o.x, y = o.y, on = pressed(o, "1");
      return PP(`M${x+20} ${y+60}V${y+42}`) + `<circle cx="${x+20}" cy="${y+28}" r="14" fill="${on ? "#DCEBFF" : "#fff"}" stroke="${INK}" stroke-width="1.6"/>`
        + `<path d="M${x+10} ${y+38}L${x+28} ${y+20}" ${thin}/>` + arrowHead(x+10, y+38, x+29, y+19, 6) + LB(x-2, y+32, o.v); }},
  ds:{g:"pneu", n:"Druckschalter (pneumatisch-elektrisch)", lbl:"-BP1", w:70, h:60, ports:[["1",20,60,"d"]], sim:() => ({}),
    info:"Meldet der SPS, dass der Druck einen einstellbaren Wert überschritten hat – z. B. Druckluft vorhanden hinter der Wartungseinheit. Ausgang ist ein elektrischer Kontakt.",
    draw:o => { const x = o.x, y = o.y, on = pressed(o, "1");
      return PP(`M${x+20} ${y+60}V${y+44}`) + `<rect x="${x+4}" y="${y+14}" width="32" height="30" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`
        + `<path d="M${x+20} ${y+44}V${y+34}" ${thin}/><path d="M${x+15} ${y+34}L${x+20} ${y+26}L${x+25} ${y+34}Z" fill="${INK}"/>`                  // Druck wirkt auf den Messkolben
        + `<path d="M${x+8} ${y+40}L${x+32} ${y+18}" ${thin}/>` + arrowHead(x+8, y+40, x+33, y+17, 5)                                                // einstellbar
        + `<path d="M${x+36} ${y+29}H${x+44}M${x+58} ${y+29}H${x+66}" ${thin}/><path d="M${x+44} ${y+29}L${x+57} ${y+(on ? 29 : 21)}" stroke="${on ? "#2E7D4F" : INK}" stroke-width="1.6" stroke-linecap="round"/>`
        + LB(x+2, y+10, o.v, "start"); }},
  duese:{g:"pneu", n:"Blasdüse", lbl:"", w:40, h:60, ports:[["1",20,60,"d"]], sim:() => ({}),
    info:"Verbraucher hinter einem 2/2-Wegeventil: Luftmesser −MB14 (bläst das Wasser vom Korb) und Ausblasdüse −MB16 (n.i.O.-Teile).",
    draw:o => { const x = o.x, y = o.y, on = pressed(o, "1"), c = on ? BLUE : INK;
      return PP(`M${x+20} ${y+60}V${y+34}`) + `<path d="M${x+12} ${y+34}H${x+28}L${x+23} ${y+20}H${x+17}Z" fill="#fff" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`
        + `<path d="M${x+20} ${y+16}V${y+4}M${x+15} ${y+16}L${x+9} ${y+5}M${x+25} ${y+16}L${x+31} ${y+5}" stroke="${c}" stroke-width="1.3" stroke-dasharray="${on ? "4 2" : "2 3"}" fill="none"/>` + LB(x+4, y+32, o.v); }},
  wv:{g:"pneu", n:"Wechselventil (ODER)", lbl:"", w:60, h:60, ports:[["1",8,60,"d"],["3",52,60,"d"],["2",30,0,"u"]],
    info:"ODER-Glied: Druck an 1 ODER 3 gelangt nach 2. Die Kugel sperrt jeweils den anderen Eingang – keine Luft entweicht rückwärts.",
    sim:(o, s, has) => ({dir: [...(has("1") ? [["1","2"]] : []), ...(has("3") ? [["3","2"]] : [])]}),
    draw:o => { const x = o.x, y = o.y;
      return `<rect x="${x+4}" y="${y+20}" width="52" height="20" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`
        + `<path d="M${x+12} ${y+22}L${x+18} ${y+30}L${x+12} ${y+38}M${x+48} ${y+22}L${x+42} ${y+30}L${x+48} ${y+38}" ${thin}/><circle cx="${x+30}" cy="${y+30}" r="5.5" fill="#fff" stroke="${INK}" stroke-width="1.5"/>`
        + PP(`M${x+30} ${y}V${y+20}M${x+8} ${y+40}V${y+60}M${x+52} ${y+40}V${y+60}`) + PN(x+33, y+8, "2") + PN(x+11, y+58, "1") + PN(x+55, y+58, "3") + LB(x, y+34, o.v); }},
  zd:{g:"pneu", n:"Zweidruckventil (UND)", lbl:"", w:60, h:60, ports:[["1",8,60,"d"],["3",52,60,"d"],["2",30,0,"u"]],
    info:"UND-Glied: Nur wenn an 1 UND 3 Druck anliegt, gelangt Luft nach 2.",
    sim:(o, s, has) => ({dir: has("1") && has("3") ? [["1","2"],["3","2"]] : []}),
    draw:o => { const x = o.x, y = o.y;
      return `<rect x="${x+4}" y="${y+20}" width="52" height="20" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`
        + `<path d="M${x+12} ${y+22}V${y+38}M${x+48} ${y+22}V${y+38}" ${thin}/><rect x="${x+15}" y="${y+25}" width="8" height="10" fill="#fff" ${thin}/><rect x="${x+37}" y="${y+25}" width="8" height="10" fill="#fff" ${thin}/><path d="M${x+23} ${y+30}H${x+37}" ${thin}/>`
        + PP(`M${x+30} ${y}V${y+20}M${x+8} ${y+40}V${y+60}M${x+52} ${y+40}V${y+60}`) + PN(x+33, y+8, "2") + PN(x+11, y+58, "1") + PN(x+55, y+58, "3") + LB(x, y+34, o.v); }},
  se:{g:"pneu", n:"Schnell­entlüftungs­ventil", lbl:"-RM2", w:60, h:60, ports:[["1",20,60,"d"],["2",20,0,"u"]],
    info:"Direkt am Zylinder: Beim Entlüften strömt die Luft über 3 ins Freie statt den langen Weg zurück durchs Wegeventil – der Zylinder fährt schneller zurück.",
    sim:(o, s, has) => ({dir: has("1") ? [["1","2"]] : []}),
    draw:o => { const x = o.x, y = o.y;
      return PP(`M${x+20} ${y}V${y+18}M${x+20} ${y+42}V${y+60}M${x+20} ${y+30}H${x+44}`) + `<rect x="${x+8}" y="${y+18}" width="24" height="24" fill="none" stroke="${INK}" stroke-width="1" stroke-dasharray="7 2 1.5 2"/>`
        + `<circle cx="${x+20}" cy="${y+30}" r="5" fill="#fff" stroke="${INK}" stroke-width="1.5"/><path d="M${x+14} ${y+37}L${x+20} ${y+41}L${x+26} ${y+37}" ${thin}/>`
        + `<path d="M${x+44} ${y+24}L${x+54} ${y+30}L${x+44} ${y+36}Z" fill="#fff" stroke="${INK}" stroke-width="1.4"/>` + PN(x+23, y+8, "2") + PN(x+23, y+58, "1") + PN(x+46, y+22, "3") + LB(x+2, y+34, o.v); }},
  insel:{g:"pneu", n:"Ventilinsel (Baugruppenrahmen)", lbl:"-QM1", w:360, h:120, def:{fw:"360", fh:"120"},
    info:"Strichpunktierter Rahmen um die Ventile einer Ventilinsel, z. B. −QM1 Portal und −QM2 Band. Breite und Höhe links einstellen; die Ventile darin bleiben anklickbar.",
    props:[["fw","Breite","text"],["fh","Höhe","text"]],
    draw:o => `<rect x="${o.x}" y="${o.y}" width="${+o.fw || 360}" height="${+o.fh || 120}" fill="none" stroke="${INK}" stroke-width="1.2" stroke-dasharray="12 3 2 3"/>` + LB(o.x + 6, o.y - 6, o.v, "start")},
  sd:{g:"pneu", n:"Schalldämpfer", lbl:"", w:24, h:34, ports:[["1",12,0,"u"]],
    draw:o => PP(`M${o.x+12} ${o.y}V${o.y+10}`) + `<path d="M${o.x+12} ${o.y+10}L${o.x+22} ${o.y+20}L${o.x+12} ${o.y+30}L${o.x+2} ${o.y+20}Z" fill="#fff" stroke="${INK}" stroke-width="1.5"/><path d="M${o.x+6} ${o.y+17}H${o.x+18}M${o.x+5} ${o.y+20}H${o.x+19}M${o.x+6} ${o.y+23}H${o.x+18}" ${thin}/>`}
};
/* Palette: Ventil-Varianten als Voreinstellungen eines Grundtyps */
const PCPAL = {
  v22nc:{g:"pneu", n:"2/2-Wegeventil gesperrt, Magnet/Feder", mk:{k:"v22", gs:"nc", al:"mag", ar:"feder"}},
  v22no:{g:"pneu", n:"2/2-Wegeventil offen, Magnet/Feder", mk:{k:"v22", gs:"no", al:"mag", ar:"feder"}},
  v32nc:{g:"pneu", n:"3/2-Wegeventil gesperrt, Magnet/Feder", mk:{k:"v32", gs:"nc", al:"mag", ar:"feder"}},
  v32no:{g:"pneu", n:"3/2-Wegeventil offen, Magnet/Feder", mk:{k:"v32", gs:"no", al:"mag", ar:"feder"}},
  v32h:{g:"pneu", n:"3/2-Wegeventil Taster/Feder", mk:{k:"v32", gs:"nc", al:"taster", ar:"feder"}},
  v52m:{g:"pneu", n:"5/2-Wegeventil monostabil", mk:{k:"v52", al:"mag", ar:"feder"}},
  v52b:{g:"pneu", n:"5/2-Wegeventil bistabil (Impuls)", mk:{k:"v52", al:"mag", ar:"mag"}},
  v52p:{g:"pneu", n:"5/2 vorgesteuert, monostabil", mk:{k:"v52", al:"magp", ar:"feder"}},
  v52pb:{g:"pneu", n:"5/2 vorgesteuert, bistabil", mk:{k:"v52", al:"magp", ar:"magp"}},
  v53c:{g:"pneu", n:"5/3-Wegeventil Mitte gesperrt", mk:{k:"v53", al:"mag", ar:"mag"}}
};
const PORTS2 = {no:[["13",0,0,"u"],["14",0,60,"d"]], nc:[["11",0,0,"u"],["12",0,60,"d"]], coil:[["A1",0,0,"u"],["A2",0,60,"d"]], lamp:[["X1",0,0,"u"],["X2",0,60,"d"]]};
/* Drehen (o.rot = 0/90/180/270) und Spiegeln (o.flip) um die Bauteilmitte – Schrift bleibt aufrecht */
const DIRV = {u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0]};
function xform(o){
  const pc = PC[o.k]; if (!pc || o.k === "rail") return null;
  const r = (((o.rot || 0) % 360) + 360) % 360, f = o.flip ? -1 : 1; if (!r && f === 1) return null;
  const x0 = o.x + (pc.bx || 0), cx = x0 + pc.w / 2, cy = o.y + pc.h / 2, c = Math.round(Math.cos(r * Math.PI / 180)), sn = Math.round(Math.sin(r * Math.PI / 180));
  const pt = (x, y) => { const dx = (x - cx) * f, dy = y - cy; return [cx + dx*c - dy*sn, cy + dx*sn + dy*c]; };
  const dir = d => { const [vx, vy] = DIRV[d], ux = vx * f, wx = ux*c - vy*sn, wy = ux*sn + vy*c; return wx > .5 ? "r" : wx < -.5 ? "l" : wy > .5 ? "d" : "u"; };
  return {r, f, c, cx, cy, x0, pt, dir};
}
function portsOf(o){
  if (!o) return [];
  const P = PC[o.k] ? PC[o.k].ports : PORTS2[o.k];
  if (!P) return [];
  const X = xform(o);
  return (typeof P === "function" ? P(o) : P).map(([n, dx, dy, d]) => { if (!X) return {n, x: o.x + dx, y: o.y + dy, d}; const [x, y] = X.pt(o.x + dx, o.y + dy); return {n, x: Math.round(x), y: Math.round(y), d: X.dir(d)}; });
}
const portCap = o => !!o && (o.k === "rail" || portsOf(o).length > 0);
function nearestPort(o, pt){ if (o.k === "rail") return "~"; let b = null; for (const p of portsOf(o)) { const d = Math.hypot(p.x - pt[0], p.y - pt[1]); if (!b || d < b.d) b = {n: p.n, d}; } return b ? b.n : null; }
/* virtuelle Schienen der Vorlagen – auf jedem Blatt */
const VRAIL = {stromlauf: [["L+", 70, 40, 935], ["M", 590, 40, 935]], leistung: [["L1", 50, 60, 915], ["L2", 70, 60, 915], ["L3", 90, 60, 915], ["N", 110, 60, 915], ["PE", 130, 60, 915]]};
function vrails(key, n){ const r = []; (VRAIL[key] || []).forEach(([v, y, x, w]) => { for (let i = 0; i < n; i++) r.push({id: `_${v}@${i}`, k: "rail", v, x, y: y + i*PH, w, virt: true}); }); return r; }
function wireD(a, b){
  if ((a.d === "u" || a.d === "d") && (b.d === "u" || b.d === "d") && Math.abs(a.x - b.x) < 1) return `M${a.x} ${a.y}V${b.y}`;
  const st = 14, ext = p => [p.x + (p.d === "r" ? st : p.d === "l" ? -st : 0), p.y + (p.d === "d" ? st : p.d === "u" ? -st : 0)];
  const A = ext(a), B = ext(b), va = a.d === "u" || a.d === "d", vb = b.d === "u" || b.d === "d";
  let mid;
  if (va && vb) { const my = Math.round((A[1] + B[1]) / 20) * 10 + (Math.round(a.x / 20) % 4) * 10 - 10; mid = [[A[0], my], [B[0], my]]; }   // je Anschluss eigene Querhöhe: verschiedene Potenziale liegen nie übereinander
  else if (!va && !vb) { const mx = Math.round((A[0] + B[0]) / 20) * 10 + (Math.round(a.y / 20) % 4) * 10 - 10; mid = [[mx, A[1]], [mx, B[1]]]; }
  else if (va) mid = [[A[0], B[1]]]; else mid = [[B[0], A[1]]];
  return "M" + [[a.x, a.y], A, ...mid, B, [b.x, b.y]].map(p => p.join(" ")).join("L");
}
function wireEnds(c, objs){
  const A = objs[c.a], B = objs[c.b]; if (!A || !B) return null;
  const pa = A.k === "rail" ? null : portsOf(A).find(p => p.n === c.pa), pb = B.k === "rail" ? null : portsOf(B).find(p => p.n === c.pb);
  if ((!pa && A.k !== "rail") || (!pb && B.k !== "rail") || (!pa && !pb)) return null;
  const onRail = (r, p) => ({x: clamp(p.x, r.x, r.x + (r.w || 400)), y: r.y, d: p.y > r.y ? "d" : "u", rail: true});
  return [pa || onRail(A, pb), pb || onRail(B, pa)];
}
function wireRef(o, port, key, y, x){   // Verweistext: Kennzeichen:Anschluss, Blatt, Strompfad
  const b = Math.floor(y / PH) + 1, name = o.k === "rail" ? o.v : `${o.v || BLK[o.k].n}${port && port !== "~" ? ":" + port : ""}`;
  const pfad = key === "stromlauf" ? `, Pfad ${Math.max(1, Math.min(20, Math.round((x - 40) / 46)))}` : "";
  return `${name}, Blatt ${b}${pfad}`;
}
function pcSample(k){
  const mk = BLK[k] && BLK[k].mk, base = (mk && mk.k) || k, pc = PC[base];
  const o = {k: base, ...(pc.def || {}), ...(mk || {}), x: 0, y: 0, v: ""}; o.k = base; if (base === "rail") o.w = 70;
  const bx = pc.bx || 0, w = base === "rail" ? 70 : pc.w, h = Math.max(pc.h, 12);
  o.x = 4 - bx; o.y = base === "rail" ? 10 : 4;
  return [o, `0 0 ${w + 8} ${h + 8}`, ""];
}
