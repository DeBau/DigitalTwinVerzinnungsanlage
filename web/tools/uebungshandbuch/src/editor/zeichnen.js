// Editor-Kern: Bausteine, Verbindungen und Leitungen als SVG zeichnen (bausteinZeichnen, verbindungsWeg, zeichnungSVG), Blattzahl.
// Benutzt vom Editor (anzeige.js, zeiger.js), von den Skizzen-Kacheln und vom Druck (über blaetter.js).
import { INK, MUTE, PH, SVGT } from './svg.js';
import { ED, istMarkiert } from './status.js';
import { BAUSTEIN, art, bauteil, vorlage } from './registry.js';
import { neueSpuren } from './spuren.js';
import { strokesSVG } from './vorlagen-svg.js';
import { BLUE, drehung, istSchiene, kennzeichenSperren, portsOf, simOn, versetzt, virtuelleSchienen, wireD, wireEnds } from './bauteile.js';
import { gruppeVon, mitteVon, umrissVon } from './bausteine.js';
import { verbindeKette } from './kette.js';

/* ---------- Bausteine ---------- */
// Baustein über seinen Haken zeichne; Bauteile werden dabei gedreht bzw. gespiegelt
export function bausteinZeichnen(o, edit){
  const a = art(o.k);
  return a.zeichne ? gedreht(o, a.zeichne(o, edit)) : "";
}
// Drehen und Spiegeln um die Bauteilmitte; Texte drehen zurück, damit sie lesbar bleiben
export function gedreht(o, svg){
  const X = drehung(o);
  if (!X) return svg;
  const swap = X.f * X.c < 0;   // Schrift läge sonst auf der falschen Seite
  const anker = a => swap && a !== "middle" ? GEGENANKER[a] : a;
  const upright = svg.replace(/<text x="([-\d.]+)" y="([-\d.]+)" text-anchor="(\w+)"/g, (m, x, y, a) =>
    `<text transform="translate(${x} ${y}) scale(${X.f} 1) rotate(${-X.r}) translate(${-x} ${-y})" x="${x}" y="${y}" `
    + `text-anchor="${anker(a)}"`);
  return `<g transform="translate(${X.cx} ${X.cy}) rotate(${X.r}) scale(${X.f} 1) translate(${-X.cx} ${-X.cy})">${upright}</g>`;
}
export const GEGENANKER = {start: "end", end: "start"};
// Name eines Bausteins im Verweis an einer Abbruchstelle, z. B. „Schritt 7“ (Haken verweisName der Bausteinart)
export function refName(o, objs, cs, dir){
  const a = art(o.k);
  if (a.verweisName) return a.verweisName(o, objs, cs, dir);
  return o.v || BAUSTEIN[o.k].n;
}

/* ---------- Verbindungen ---------- */
// Geometrie einer Verbindung c: Leitung zwischen Anschlüssen, sonst nach der Gruppe von A
// (Ablaufkette, Haken verbinde der Gruppe oder rechtwinklig von Rand zu Rand).
// spuren ist die Spurbelegung der Zeichnung (spuren.js); die Wege reichen sie weiter, damit sie freie Spuren wählen können.
export function verbindungsWeg(c, objs, all, spuren = neueSpuren()){
  const A = objs[c.a], B = objs[c.b];
  if (!A || !B) return null;
  if (c.pa !== undefined || c.pb !== undefined) {
    const e = wireEnds(c, objs);
    if (!e) return null;
    return {d: wireD(e[0], e[1], spuren), wire: true, ends: e, lbl: [e[0].x + 5, Math.round((e[0].y + e[1].y) / 2), "start"]};
  }
  const gruppe = gruppeVon(A);
  if (gruppe.kette) return verbindeKette(A, B, spuren);
  if (gruppe.verbinde) return gruppe.verbinde(c, A, B, objs, all, spuren);
  return verbindeRechtwinklig(A, B);
}
// Randpunkt in Richtung dir (r, l, d, u); runde Bausteine (Haken radius) auf dem Kreis
export function randPunkt(o, b, dir){
  const c = mitteVon(o), r = art(o.k).radius;
  if (r) return {r: [c[0]+r, c[1]], l: [c[0]-r, c[1]], d: [c[0], c[1]+r], u: [c[0], c[1]-r]}[dir];
  return {r: [b.x+b.w, c[1]], l: [b.x, c[1]], d: [c[0], b.y+b.h], u: [c[0], b.y]}[dir];
}
// Pfeil von A nach B mit einem Knick in der Mitte, waagrecht oder senkrecht je nach Lage
export function verbindeRechtwinklig(A, B){
  const ba = umrissVon(A), bb = umrissVon(B), ca = mitteVon(A), cb = mitteVon(B), dx = cb[0]-ca[0], dy = cb[1]-ca[1];
  if (Math.abs(dx) >= Math.abs(dy)) {
    const p1 = randPunkt(A, ba, dx >= 0 ? "r" : "l"), p2 = randPunkt(B, bb, dx >= 0 ? "l" : "r"), m = Math.round((p1[0]+p2[0])/2);
    const d = Math.abs(p1[1]-p2[1]) < 1 ? `M${p1[0]} ${p1[1]}H${p2[0]}` : `M${p1[0]} ${p1[1]}H${m}V${p2[1]}H${p2[0]}`;
    return {d, arrow: true, lbl: [m, Math.min(p1[1], p2[1]) - 8, "middle"]};
  }
  const p1 = randPunkt(A, ba, dy >= 0 ? "d" : "u"), p2 = randPunkt(B, bb, dy >= 0 ? "u" : "d"), m = Math.round((p1[1]+p2[1])/2);
  const d = Math.abs(p1[0]-p2[0]) < 1 ? `M${p1[0]} ${p1[1]}V${p2[1]}` : `M${p1[0]} ${p1[1]}V${m}H${p2[0]}V${p2[1]}`;
  return {d, arrow: true, lbl: [Math.max(p1[0], p2[0]) + 8, m + 4, "start"]};
}
// Gruppen-Haken bedingung: Übergang von A braucht eine Bedingung (Platzhalter im Editor, Abfrage nach dem Verbinden)
export const fragtBedingung = A => { const b = gruppeVon(A).bedingung; return !!b && b(A); };
export const treffer = (d, edit) => edit ? `<path d="${d}" fill="none" stroke="transparent" stroke-width="12"/>` : "";
// Endet eine Linie auf einem anderen Blatt, zeichnet der Editor zwei Stummel mit Verweis statt einer Linie quer über den Rand
export const blattwechsel = (y1, y2, key) => !vorlage(key).einblattig && Math.floor(y1 / PH) !== Math.floor(y2 / PH);

// Leitung zwischen Anschlüssen; während der Simulation blau, wenn sie Druck führt
export function leitungSVG(c, i, gm, objs, key, edit){
  const [a, b] = gm.ends, sel = edit && istMarkiert("c", i);
  const P = simOn() && ED.sim.P && (ED.sim.P.has(c.a + ":" + c.pa) || ED.sim.P.has(c.b + ":" + c.pb));
  const wc = sel ? "#0E4C92" : P ? BLUE : INK, ww = sel || P ? 2.4 : 1.6, dash = c.st ? 'stroke-dasharray="6 4"' : "";
  if (!blattwechsel(a.y, b.y, key)) {
    const text = c.v ? SVGT(gm.lbl[0], gm.lbl[1], c.v, "start", 11, 500) : "";
    return `<g data-c="${i}"><path d="${gm.d}" fill="none" stroke="${wc}" stroke-width="${ww}" ${dash}/>${treffer(gm.d, edit)}${text}</g>`;
  }
  const e1 = versetzt(a, 30), e2 = versetzt(b, 30);
  const t1 = `→ ${wireRef(objs[c.b], c.pb, key, b.y, b.x)}`, t2 = `von ${wireRef(objs[c.a], c.pa, key, a.y, a.x)}`;
  const lab = (q, e, t) => SVGT(e[0] + STUMMELTEXT[q.d][0], e[1] + STUMMELTEXT[q.d][1], t, "start", 10.5, 600);
  const d1 = `M${a.x} ${a.y}L${e1[0]} ${e1[1]}`, d2 = `M${e2[0]} ${e2[1]}L${b.x} ${b.y}`;
  const pfeil = d => `<path d="${d}" fill="none" stroke="${wc}" stroke-width="${ww}" ${dash} marker-end="url(#arw)"/>`;
  return `<g data-c="${i}">${pfeil(d1)}${pfeil(d2)}${lab(a, e1, t1)}${lab(b, e2, t2)}` + treffer(d1 + d2, edit) + `</g>`;
}
// Lage des Verweistexts am Ende eines Leitungsstummels je Anschlussrichtung
export const STUMMELTEXT = {u: [5, 2], d: [5, 4], l: [0, -5], r: [0, -5]};
// Verbindung zwischen Bausteinen (Kette, Übergang, Signalfluss) mit Beschriftung oder Platzhalter
export function verbindungSVG(c, i, gm, objs, cs, key, edit){
  const sel = edit && istMarkiert("c", i), col = sel ? "#0E4C92" : INK, staerke = sel ? 2.2 : 1.6;
  if (gm.p1 && blattwechsel(gm.p1[1], gm.p2[1] - 1, key)) {   // Abbruchstelle mit Verweis
    const [x1, y1] = gm.p1, [x2, y2] = gm.p2, b1 = Math.floor(y1 / PH) + 1, b2 = Math.floor((y2 - 1) / PH) + 1;
    const zu = `→ ${refName(objs[c.b], objs, cs, "zu")}, Blatt ${b2}`, von = `von ${refName(objs[c.a], objs, cs, "von")}, Blatt ${b1}`;
    const stummel = d => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${staerke}" marker-end="url(#arw)"/>`;
    return `<g data-c="${i}">${stummel(`M${x1} ${y1}V${y1 + 30}`)}${stummel(`M${x2} ${y2 - 34}V${y2}`)}`
      + SVGT(x1 + 10, y1 + 28, zu, "start", 11.5, 600) + SVGT(x2 + 10, y2 - 22, von, "start", 11.5, 600)
      + treffer(`M${x1} ${y1}V${y1 + 30}M${x2} ${y2 - 34}V${y2}`, edit) + `</g>`;
  }
  const [ux, uy] = gm.up || [], pfeil = `M${ux-6} ${uy+5}L${ux} ${uy-6}L${ux+6} ${uy+5}`;   // Pfeil nach oben am Rücksprung
  const up = gm.up ? `<path d="${pfeil}" fill="none" stroke="${col}" stroke-width="1.6"/>` : "";
  let lbl = "";
  if (gm.lbl && c.v) lbl = SVGT(gm.lbl[0], gm.lbl[1], c.v, gm.lbl[2], 12, 500);
  else if (gm.lbl && edit && fragtBedingung(objs[c.a])) lbl = SVGT(gm.lbl[0], gm.lbl[1], "Bedingung", gm.lbl[2], 11, 400, MUTE);
  const spitze = gm.arrow ? 'marker-end="url(#arw)"' : "";
  return `<g data-c="${i}"><path d="${gm.d}" fill="none" stroke="${col}" stroke-width="${staerke}" ${spitze}/>`
    + `${up}${treffer(gm.d, edit)}${lbl}</g>`;
}

/* ---------- Ganze Zeichnung ---------- */
// Rahmen (Bauteil mit rahmen: true, z. B. Ventilinsel): liegt unter allen Bausteinen und ist nur am Rand greifbar
export const istRahmen = o => !!art(o.k).rahmen;
// Baustein mit Markierungsrahmen (im Editor) bzw. greifbarem Rand (Rahmen-Bauteile)
export function bausteinSVG(o, edit){
  const h = edit ? (istRahmen(o) ? rahmenGriff(o) : markierungsRahmen(o)) : "";
  return `<g data-o="${o.id}">${h}${bausteinZeichnen(o, edit)}</g>`;
}
// Bausteine, die im Editor hervorgehoben sind: markiert oder Quelle beim Verbinden
export const istVerbindenQuelle = o => !!ED.verbindenVon && ED.verbindenVon.id === o.id;
export const istHervorgehoben = o => istMarkiert("o", o.id) || istVerbindenQuelle(o);
// Greifbarer Rand eines Rahmen-Bauteils
export function rahmenGriff(o){
  const b = umrissVon(o), hi = istHervorgehoben(o);
  return `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="none" pointer-events="stroke" `
    + `stroke="${hi ? "#0E4C92" : "#000"}" stroke-opacity="${hi ? .25 : 0}" stroke-width="12"/>`;
}
// Greiffläche um einen Baustein, gestrichelt, wenn er markiert (5 3) oder Quelle beim Verbinden (2 3) ist
export function markierungsRahmen(o){
  const b = umrissVon(o), strich = `stroke="#0E4C92" stroke-width="1.3" stroke-dasharray="${istVerbindenQuelle(o) ? "2 3" : "5 3"}"`;
  return `<rect x="${b.x-5}" y="${b.y-5}" width="${b.w+10}" height="${b.h+10}" rx="4" fill="transparent" `
    + `${istHervorgehoben(o) ? strich : ""}/>`;
}
// Abzweigpunkte der Leitungen: auf einer Schiene immer, an einem Anschluss ab zwei Leitungen.
// Rückgabe: SVG und die Zählung cnt["id:Anschluss"] = {n, q} der verdrahteten Anschlüsse
export function abzweigpunkte(cs, objs){
  let s = "";
  const cnt = {}, dot = q => `<circle cx="${q.x}" cy="${q.y}" r="2.8" fill="${INK}"/>`;
  cs.forEach(c => {
    if (c.pa === undefined && c.pb === undefined) return;
    const e = wireEnds(c, objs); if (!e) return;
    [[c.a, c.pa, e[0]], [c.b, c.pb, e[1]]].forEach(([id, pn, q]) => {
      if (q.rail) s += dot(q);
      else { const k = id + ":" + pn; (cnt[k] = cnt[k] || {n: 0, q}).n++; }
    });
  });
  Object.values(cnt).forEach(v => { if (v.n >= 2) s += dot(v.q); });
  return {svg: s, cnt};
}
// Verbindungspunkte (zwei Leitungen an einem Anschluss, Leitung auf Schiene), Zusätze der Bauteile (Haken zusatz)
// und beim Verbinden die Anschlusskreise
export function punkteSVG(d, cs, objs, edit){
  let {svg: s, cnt} = abzweigpunkte(cs, objs);
  (d.o || []).forEach(o => { const z = art(o.k).zusatz; if (z) s += z(o, n => !!cnt[o.id + ":" + n]); });
  if (edit && ED.tool === "conn") (d.o || []).forEach(o => portsOf(o).forEach(q => {
    const v = ED.verbindenVon, f = !!v && v.id === o.id && v.anschluss === q.n;
    s += `<circle cx="${q.x}" cy="${q.y}" r="${f ? 5 : 3.6}" fill="${f ? BLUE : "#fff"}" stroke="${BLUE}" stroke-width="1.5" `
      + `pointer-events="none"/>`;
  }));
  return s;
}
// Zeichnung d der Vorlage key als SVG: Hintergrund der Vorlage, Verbindungen, Bausteine, Punkte, Striche und Texte
export function zeichnungSVG(d, edit=false, key=null){
  if (!d) return "";
  const objs = Object.fromEntries((d.o || []).map(o => [o.id, o])), cs = d.c || [];
  virtuelleSchienen(key, pageCount(key, d, 0, edit ? RESERVE_EDITOR : 0)).forEach(r => { objs[r.id] = r; });
  const v = vorlage(key);
  const rails = v.hintergrund ? v.hintergrund(d, cs) : "";   // Haken hintergrund, z. B. Strompfade zu L+ und M
  const spuren = neueSpuren();   // eine Belegung für alle Verbindungen der Zeichnung
  kennzeichenSperren(spuren, objs);   // Leitungen meiden die Kennzeichen der Bauteile
  const conns = cs.map((c, i) => {
    const gm = verbindungsWeg(c, objs, cs, spuren);
    if (!gm) return "";
    return gm.wire ? leitungSVG(c, i, gm, objs, key, edit) : verbindungSVG(c, i, gm, objs, cs, key, edit);
  }).join("");
  const os = [...(d.o || [])].sort((a, b) => istRahmen(b) - istRahmen(a)).map(o => bausteinSVG(o, edit)).join("");
  return rails + conns + os + punkteSVG(d, cs, objs, edit) + strokesSVG(d, edit);
}
// Platz unter der Zeichnung, den nur der Editor als weiteres Blatt anbietet (zum Weiterzeichnen)
export const RESERVE_EDITOR = 160;
// Zahl der Blätter der Zeichnung d. Druck und Kacheln: nur so viele, wie der Inhalt braucht (kein leeres Blatt).
// Der Editor gibt zusatzY (Zeiger beim Ziehen) und RESERVE_EDITOR mit.
export function pageCount(key, d, zusatzY = 0, reserve = 0){
  if (vorlage(key).einblattig) return 1;
  let m = zusatzY;
  (d && d.o || []).forEach(o => { const b = umrissVon(o); m = Math.max(m, b.y + b.h); });
  (d && d.s || []).forEach(st => st.p.forEach(q => { m = Math.max(m, q[1]); }));
  (d && d.t || []).forEach(t => { m = Math.max(m, t.y); });
  return Math.max(1, Math.ceil((m + reserve) / PH));
}
// Verweistext an einer Leitung über den Blattrand: Kennzeichen:Anschluss, Blatt und was die Vorlage ergänzt (Haken verweis)
export function wireRef(o, port, key, y, x){
  const b = Math.floor(y / PH) + 1, name = istSchiene(o) ? o.v : `${o.v || BAUSTEIN[o.k].n}${port && port !== "~" ? ":" + port : ""}`;
  const v = vorlage(key), pfad = v.verweis ? v.verweis(x, y) : "";
  return `${name}, Blatt ${b}${pfad}`;
}
// Palettenbild eines Bauteils ohne eigenes SAMPLE: Bauteil mit Vorgaben links oben, viewBox passend
export function pcSample(k){
  const mk = BAUSTEIN[k] && BAUSTEIN[k].mk, base = (mk && mk.k) || k, pc = bauteil(base);
  const o = {k: base, ...(pc.def || {}), ...(mk || {}), x: 0, y: 0, v: ""}; o.k = base;
  const bx = pc.bx || 0, w = pc.w, h = Math.max(pc.h, 12);
  o.x = 4 - bx; o.y = 4;
  return [o, `0 0 ${w + 8} ${h + 8}`, ""];
}
