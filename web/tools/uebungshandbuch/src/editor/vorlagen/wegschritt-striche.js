// Weg-Schritt-Diagramm: Stricharten im Schrittfeld (Signallinie sig, Start st, Zyklusende eq, Verknüpfung vk).
// Sie melden sich in STRICH an und zeichnen sich dort selbst; die Werkzeuge dazu stehen in vorlagen/wegschritt.js.
import { INK, SVGT, arrowHead, tw } from '../svg.js';
import { ED } from '../status.js';
import { STRICH, STRICHFELD, fuelle } from '../registry.js';
import { shapeD } from '../vorlagen-svg.js';
import { FARBEN, auswahlFeld, textFeld } from '../eigenschaften.js';

// Raster des Formulars: Schrittspalten von x0 bis x1 in 12 Schritten, erste Zeile bei y0, Zeilenhöhe zeile
export const WS_RASTER = {x0: 150, x1: 975, spalten: 12, spalte: (975 - 150) / 12, y0: 74, zeile: 62};
export const spalteBei = x => Math.round((x - WS_RASTER.x0) / WS_RASTER.spalte);   // nächste Schrittgrenze
export const zeileBei = y => Math.floor((y - WS_RASTER.y0) / WS_RASTER.zeile);      // Zeile, in der y liegt
export const WS_BAUGLIEDER = ["−MM1", "−MM2", "−MM3", "−MM4"];   // Zeilen ohne Zylinderliste der Übung (CYL)

/* ---------- Linien im Schrittfeld ---------- */
/* Weg-Schritt-Diagramm: Stellung 1 liegt 16 unter dem Zeilenanfang, Stellung 0 bei 50 (Zeilenhöhe 62, erste Zeile bei 74).
   "aus" = Richtung aus dem Zeilenbereich heraus (Stellung 1: nach oben, Stellung 0: nach unten), "ein" = in die Zeile hinein. */
export const wsAus = y => (((y - WS_RASTER.y0) % WS_RASTER.zeile) + WS_RASTER.zeile) % WS_RASTER.zeile < 33 ? -1 : 1;
export const halo = t => t.replace("<text ", '<text stroke="#fff" stroke-width="4" stroke-linejoin="round" paint-order="stroke" ');
export const sigLoop = st => { const [x, y] = st.p[0], [x2, y2] = st.p[1] || st.p[0]; return Math.abs(x - x2) < .5 && Math.abs(y - y2) < .5; };
export function startGeo(st){ const [x, y] = st.p[0], e = -wsAus(y), cy = y + e * 23; return {x, y, e, cy}; }   // freie Ecke des Schrittfelds unter bzw. über der Bewegungslinie
export function sigMid(st){   // Höhe des Querstücks; auf gleicher Höhe nach außen ausweichen, sonst läge die Signallinie auf der Funktionslinie
  const [[, y1], [, y2]] = st.p; return Math.abs(y1 - y2) < .5 ? y1 + wsAus(y1) * 20 : Math.round((y1 + y2) / 2);
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
export function signalBeschriftung(st, x, y, a = "start"){
  return st.lbl ? halo(SVGT(x, y, st.lbl, a, 10.5, 600, st.c || INK)) : "";
}
export function zeitglied(st, x, y){
  if (!st.tz) return "";
  const c = st.c || INK, w = tw(st.tz, 10) + 12;
  return `<rect x="${(x - w/2).toFixed(1)}" y="${y - 8}" width="${w.toFixed(1)}" height="16" rx="2" fill="#fff" stroke="${c}" stroke-width="1.2"/>` + SVGT(x, y + 3.5, st.tz, "middle", 10, 600, c);
}
// Verknüpfungspunkt: UND = Schrägstrich, ODER = Punkt
export function zeichneVerknuepfung(st){
  const [x, y] = st.p[0], c = st.c || INK;
  if (st.t === "oder") return `<circle cx="${x}" cy="${y}" r="4" fill="${c}"/>`;
  return `<circle cx="${x}" cy="${y}" r="1.6" fill="${c}"/><path d="M${x - 8} ${y + 6}L${x + 8} ${y - 6}" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`;
}
export function zeichneZyklusende(st){
  const [x] = st.p[0], c = st.c || INK, j = spalteBei(x);
  return `<rect x="${(x + 1).toFixed(1)}" y="41" width="${(WS_RASTER.spalte - 2).toFixed(1)}" height="32" fill="#fff"/>` + SVGT(x + WS_RASTER.spalte/2, 62, `${j + 1} = 1`, "middle", 12, 700, c) + `<path d="M${x} 40V${st.y2 || 446}" stroke="${c}" stroke-width="2.6"/>`;
}
export function zeichneStart(st){
  const {x, y, e, cy} = startGeo(st), c = st.c || INK;
  return `<rect x="${x + 4}" y="${cy - 7}" width="14" height="14" rx="1.5" fill="#fff" stroke="${c}" stroke-width="1.3"/><path d="M${x + 7} ${cy - 3}H${x + 15}M${x + 11} ${cy - 3}V${cy + 4}" stroke="${c}" stroke-width="1.3" fill="none"/>`
    + `<path d="M${x + 6} ${cy - e*7}L${x + 1.5} ${y + e*3}" stroke="${c}" stroke-width="1.2" fill="none"/>` + arrowHead(x + 6, cy - e*7, x + .8, y + e*1.2, 6) + signalBeschriftung(st, x + 22, cy + 4);
}
// Signallinie vom Signalgeber zum Pfeil. grp sagt, ob sie an einem Verknüpfungspunkt beginnt bzw. endet und ob
// die Beschriftung nach links ausweichen muss.
export function zeichneSignal(st, grp){
  const c = st.c || INK;
  if (sigLoop(st)) {
    const [x, y] = st.p[0], o = wsAus(y), tw2 = st.tz ? tw(st.tz, 10) + 12 : 0;
    return `<path d="${shapeD(st)}" stroke="${c}" stroke-width="1.2" fill="none"/>` + srcMark(st, x, y) + arrowHead(x + 7, y + o*12, x + 1.2, y + o*2, 6)
      + zeitglied(st, x + 16 + tw2 / 2, y + o*12) + signalBeschriftung(st, x - 14, y + o*12 + 4, "end");
  }
  const [[x1, y1], [x2, y2]] = st.p, straight = Math.abs(x1 - x2) < .5, ym = straight ? y1 : sigMid(st), down = y2 > ym, o = wsAus(y1);
  const jS = grp && grp.jStart, jE = grp && grp.jEnd;
  let r = `<path d="${shapeD(st)}" stroke="${c}" stroke-width="1.2" fill="none"/>` + (jS ? "" : srcMark(st, x1, y1));
  if (!jE) r += arrowHead(x2, y2 + (down ? -11 : 11), x2, y2, 6.5);
  r += straight ? zeitglied(st, x1, Math.round((y1 + y2) / 2)) : zeitglied(st, x1, Math.round((y1 + ym) / 2));
  const links = st.sg === "balken" || (grp && grp.ldy);
  return r + signalBeschriftung(st, x1 + (st.sg === "balken" ? -26 : links ? -7 : 7), y1 + o * 13 + (o > 0 ? 4 : 0), links ? "end" : "start");
}
// Gruppe einer Signallinie i: Verknüpfungspunkte an den Enden, und ob an derselben Stelle schon eine Beschriftung steht
export function signalGruppe(d, i){
  const st = d.s[i];
  if (sigLoop(st)) return null;
  const pk = q => q.map(v => Math.round(v)).join(","), jset = new Set(d.s.filter(q => q.k === "vk").map(q => pk(q.p[0])));
  const labs = [], ldy = {};
  d.s.forEach((q, j) => {
    if (q.k !== "sig" || sigLoop(q) || !q.lbl || jset.has(pk(q.p[0]))) return;
    const [x, y] = q.p[0], o = wsAus(y), ly = y + o * 13 + (o > 0 ? 4 : 0);
    const hit = labs.some(([lx, yy, l]) => !l && Math.abs(lx - x) < 40 && Math.abs(yy - ly) < 12);
    labs.push([x, ly, hit]); ldy[j] = hit;   // belegt: links neben die Linie
  });
  return {jStart: jset.has(pk(st.p[0])), jEnd: jset.has(pk(st.p[1])), ldy: !!ldy[i]};
}
export function signalForm(st){
  if (sigLoop(st)) { const [x, y] = st.p[0], o = wsAus(y); return `M${x} ${y}C${x - 16} ${y + o*24} ${x + 16} ${y + o*24} ${x + 1.5} ${y + o*2}`; }
  const [[x1, y1], [x2, y2]] = st.p;
  if (Math.abs(x1 - x2) < .5) return `M${x1} ${y1}V${y2}`;
  const ym = sigMid(st);
  return `M${x1} ${y1}V${ym}H${x2}V${y2}`;
}
// Verknüpfungspunkt verschieben: angeschlossene Signallinien wandern mit, er rastet auf die Schrittgrenzen
export function zieheVerknuepfung(st, drag, dx, dy){
  const o0 = drag.orig[0];
  if (!drag.att) drag.att = [];
  if (!drag.attDone) {
    drag.attDone = true;
    ED.data.s.forEach((q, j) => q.k === "sig" && q.p.forEach((v, h) => Math.hypot(v[0] - o0[0], v[1] - o0[1]) < .6 && drag.att.push([j, h])));
  }
  const cx = WS_RASTER.x0 + spalteBei(o0[0] + dx) * WS_RASTER.spalte;
  const q = [Math.abs(cx - o0[0] - dx) < 10 ? cx : Math.round((o0[0] + dx) / 4) * 4, Math.round((o0[1] + dy) / 4) * 4];
  st.p = [q];
  drag.att.forEach(([j, h]) => ED.data.s[j].p[h] = [...q]);
}

export const HINWEIS = t => `<p class="small muted" style="margin:0 0 8px">${t}</p>`;
fuelle(STRICH, {
  sig: {titel: "Signallinie", form: signalForm, zeichne: (st, i, d) => zeichneSignal(st, signalGruppe(d, i)),
    felder: st => textFeld("sl", "Signalgeber (steht am Ausgangspunkt)", "z. B. −BG2", st.lbl)
      + auswahlFeld("sg", "Darstellung des Signalgebers", [["punkt","Grenztaster / Sensor – Punkt"],["kreis","Grenztaster – Kreis"],["balken","Betätigung über eine Strecke – Balken"],["extern","Signal von anderer Maschine"]], st.sg || "punkt")
      + textFeld("tz", "Zeitglied (optional)", "z. B. t = 10 s", st.tz) + auswahlFeld("sc", "Farbe", FARBEN, st.c)
      + HINWEIS("Signallinien sind dünn, Funktionslinien dick. Die Linie beginnt am Signalgeber und endet mit dem Pfeil dort, wo die Zustandsänderung ausgelöst wird.")},
  st: {titel: "Startbedingung", zeichne: zeichneStart,
    form(st){ const {x, cy} = startGeo(st); return `M${x + 2} ${cy - 9}H${x + 56}V${cy + 9}H${x + 2}Z`; },
    felder: st => textFeld("sl", "Starttaster / Bedingung", "z. B. −SF1 START", st.lbl) + auswahlFeld("sc", "Farbe", FARBEN, st.c)
      + HINWEIS("Der Pfeil zeigt auf den Beginn der ersten Bewegung.")},
  eq: {titel: "Zyklusende", zeichne: zeichneZyklusende, griffe: false,
    form(st){ const [x] = st.p[0]; return `M${x} 41H${x + 68}V73H${x}Z`; },
    felder: () => HINWEIS("Der Schritt in dieser Spalte entspricht wieder Schritt 1 – der Ablauf beginnt von vorn.")},
  vk: {titel: "Verknüpfung", zeichne: zeichneVerknuepfung, griffe: false, oben: true, ziehen: zieheVerknuepfung,
    form(st){ const [x, y] = st.p[0]; return `M${x - 4} ${y - 4}H${x + 4}V${y + 4}H${x - 4}Z`; },
    felder: st => auswahlFeld("vt", "Art", [["und","UND – Schrägstrich: alle Signale müssen anliegen"],["oder","ODER – Punkt: ein Signal genügt"]], st.t || "und")
      + HINWEIS("Signallinien von den Signalgebern enden hier, die Linie mit Pfeil führt zum ausgelösten Bewegungsbeginn.")},
});
fuelle(STRICHFELD, {sl: "lbl", sg: "sg", tz: "tz", vt: "t"});

