// Vorlage GRAFCET nach DIN EN 60848: Schritte, Transitionen, Verzweigungen, Verweise und Aktionen.
// Die Bausteine bilden eine Ablaufkette (editor/kette.js). Aktionen sind Seitenbausteine: Sie hängen sich rechts
// an einen Schritt bzw. eine Transition oder unter bzw. hinter eine andere Aktion (Haken seite).
import { INK, SVGT, clamp, tw } from '../svg.js';
import { ED } from '../status.js';
import { BAUSTEIN, SAMPLE, fuelle, registriereGruppe, registriereVorlage } from '../registry.js';
import { G, TX, dots } from '../vorlagen-svg.js';
import { LINIE, platzhalter } from '../bausteine.js';
import { objById } from '../auswahl.js';
import { textFeld } from '../eigenschaften.js';

/* ---------- Aktionen ---------- */
export const isAct = o => !!o && (o.k === "action" || o.k === "actionq");
export const atype = o => o.k === "actionq" ? "q" : (o.t || "kont");
// Aktionen mit Pfeil oder Zuweisungsbedingung tragen oben eine Marke, die Platz braucht
export const hasMark = o => isAct(o) && (["akt","deakt","ereig"].includes(atype(o)) || (atype(o) === "kont" && (o.b || o.hb)));
export const ACT_T = {kont:"kontinuierlich wirkend", akt:"speichernd bei Aktivierung ↑", deakt:"speichernd bei Deaktivierung ↓", ereig:"speichernd bei Ereignis", q:"mit Bestimmungszeichen (IEC 61131-3)"};
export const aw = o => Math.max(90, Math.round((tw(o.v || "Aktion") + 26 + (isAct(o) && atype(o) === "q" ? 30 : 0)) / 10) * 10);
export const BESTIMMUNG = ["N","S","R","D","L","P","SD","DS","SL"];
export const isStep = o => o && (o.k === "step" || o.k === "init" || o.k === "macro");
export const knick = (x1, y1, x2, y2, m, waagrecht) => waagrecht ? `M${x1} ${y1}H${m}V${y2}H${x2}` : `M${x1} ${y1}V${m}H${x2}V${y2}`;

export function zeichneAktion(o, edit){
  const x = o.x, y = o.y, t = atype(o), w = aw(o), qw = t === "q" ? 30 : 0, mx = x + 16, tc = x + qw + (w - qw)/2;
  let r = `<rect x="${x}" y="${y}" width="${w}" height="30" fill="#fff" ${LINIE}/>`;
  if (qw) r += `<path d="M${x+30} ${y}V${y+30}" ${LINIE}/>` + SVGT(x+15, y+20, o.q || "S", "middle", 12, 600);
  r += o.v ? SVGT(tc, y+20, o.v, "middle", 13, 400) : platzhalter(edit, "Aktion", tc, y+20);
  if (t === "kont" && (o.b || o.hb)) {   // Zuweisungsbedingung
    r += `<path d="M${mx} ${y}V${y-16}" ${LINIE}/>`;
    r += o.b ? SVGT(mx+6, y-6, o.b, "start", 12, 400) : platzhalter(edit, "Zuweisungsbedingung", mx+6, y-6, "start");
  }
  if (t === "akt" || t === "ereig") r += `<path d="M${mx} ${y}V${y-18}M${mx-4.5} ${y-12}L${mx} ${y-18}L${mx+4.5} ${y-12}" ${LINIE} fill="none"/>`;
  if (t === "deakt") r += `<path d="M${mx} ${y}V${y-18}M${mx-4.5} ${y-18}L${mx} ${y-12}L${mx+4.5} ${y-18}" ${LINIE} fill="none"/>`;
  if (t === "ereig") r += o.b ? SVGT(mx+8, y-6, o.b, "start", 12, 400) : platzhalter(edit, "Ereignis, z. B. ↑BG1", mx+8, y-6, "start");
  return r;
}
export function aktionFelder(o){
  const t = atype(o);
  const arten = Object.entries(ACT_T).map(([k, n]) => `<option value="${k}" ${k === t ? "selected" : ""}>${n}</option>`).join("");
  let h = `<label class="prop">Art<select data-prop="t">${arten}</select></label>`;
  if (t === "q") {
    const zeichen = BESTIMMUNG.map(q => `<option ${q === (o.q || "S") ? "selected" : ""}>${q}</option>`).join("");
    h += `<label class="prop">Bestimmungszeichen<select data-prop="q">${zeichen}</select></label>`;
  }
  h += textFeld("v", "Aktion", "z. B. MB1 oder Z := Z + 1", o.v);
  if (t === "kont") h += textFeld("b", "Zuweisungsbedingung (optional)", "z. B. BG9 oder 3s/X2", o.b);
  if (t === "ereig") h += textFeld("b", "Ereignis", "z. B. ↑BG1", o.b);
  return h;
}
// Art der Aktion wechseln; eine alte Aktion „actionq“ wird dabei zur Aktion mit Art q
export function setzeAktion(o, f, v){
  if (f !== "t") return false;
  if (o.k === "actionq") o.k = "action";
  o.t = v;
  if (v === "q" && !o.q) o.q = "S";
  return true;
}
// Bei Bestimmungszeichen steht im Beschriftungsfeld „S MB9“: erst das Zeichen, dann die Aktion
export const AKTION_TEXT = {
  sofort: true,
  wert: o => atype(o) === "q" ? `${o.q || "S"} ${o.v || ""}`.trim() : (o.v || ""),
  hinweis: o => atype(o) === "q" ? "Bestimmungszeichen und Aktion, z. B. S MB9" : "Aktion, z. B. MB1",
  setze(o, v){
    if (atype(o) !== "q") { o.v = v; return; }
    const m = v.match(/^(\S+)\s*(.*)$/);
    o.q = m ? m[1] : "S";
    o.v = m ? m[2] : "";
  },
};

// Seitenbaustein-Haken (editor/kette.js): Aktionen hängen rechts am Schritt bzw. an der Transition,
// weitere Aktionen darunter oder dahinter.
export const AKTION_SEITE = {
  verbinde(A, B){
    if (isAct(A)) {
      const ax2 = A.x + aw(A);
      if (B.x >= ax2 - 1) {   // dahinter
        const y1 = A.y + 15, y2 = B.y + 15, m = Math.round((ax2 + B.x)/20)*10;
        return {d: Math.abs(y1 - y2) < 1 ? `M${ax2} ${y1}H${B.x}` : knick(ax2, y1, B.x, y2, m, true)};
      }
      const y1 = A.y + 30, y2 = B.y - (hasMark(B) ? 20 : 0), m = Math.round((y1 + y2)/20)*10;   // darunter
      return {d: Math.abs(A.x - B.x) < 1 ? `M${A.x+8} ${y1}V${B.y}` : `M${A.x+8} ${y1}V${m}H${B.x+8}V${B.y}`};
    }
    const p1 = A.k === "trans" ? [A.x+14, A.y] : [A.x+40, A.y+20], p2 = [B.x, B.y+15], m = Math.round((p1[0]+p2[0])/20)*10;
    return {d: Math.abs(p1[1]-p2[1]) < 1 ? `M${p1[0]} ${p1[1]}H${p2[0]}` : knick(p1[0], p1[1], p2[0], p2[1], m, true)};
  },
  // Hat der Schritt schon Aktionen, hängt die neue an die letzte
  quelle(A){
    if (A.k === "trans") return A;
    const naechste = id => ED.data.c.find(c => c.a === id && isAct(objById(c.b)));
    let cur = null, n = 0;
    for (let c = naechste(A.id); c && n++ < 50; c = naechste(cur.id)) cur = objById(c.b);
    return cur || A;
  },
  ausrichten(o, A, pt){
    if (isAct(A)) {
      const right = pt && (pt[0] - (A.x + aw(A))) > (pt[1] - (A.y + 30));   // Klick eher rechts als unterhalb
      if (right) { o.x = A.x + aw(A); o.y = A.y; }
      else { o.x = A.x; o.y = A.y + 30 + (hasMark(o) ? 20 : 0); }
      return;
    }
    o.x = A.k === "trans" ? A.x + 40 : A.x + 70;
    o.y = A.k === "trans" ? A.y - 15 : A.y + 5;
  },
  andocken(o, others, take){
    for (const p of others) {
      if (["step","init","macro","trans"].includes(p.k)) {
        const px = p.k === "trans" ? p.x + 14 : p.x + 40, py = p.k === "trans" ? p.y : p.y + 20, dx = o.x - px, dy = o.y + 15 - py;
        if (dx >= 0 && dx <= 110 && Math.abs(dy) <= 30) take({a: p.id, b: o.id, d: Math.hypot(dx - 30, dy), sx: 0, sy: -dy});
      } else if (isAct(p)) {
        const rx = p.x + aw(p), by = p.y + 30 + (hasMark(o) ? 20 : 0);
        if (Math.abs(o.x - rx) <= 25 && Math.abs(o.y - p.y) <= 20) take({a: p.id, b: o.id, d: Math.abs(o.x - rx) + Math.abs(o.y - p.y), sx: rx - o.x, sy: p.y - o.y});
        if (Math.abs(o.x - p.x) <= 25 && Math.abs(o.y - by) <= 20) take({a: p.id, b: o.id, d: Math.abs(o.x - p.x) + Math.abs(o.y - by), sx: p.x - o.x, sy: by - o.y});
      }
    }
  },
  punkt: (A, B) => isAct(A) && B.x < A.x + aw(A) - 1 ? [B.x + 8, B.y] : [B.x, B.y + 15],
};

/* ---------- Schritte, Transitionen, Verzweigungen ---------- */
export const QUADRAT = o => ({x: o.x, y: o.y, w: 40, h: 40});
export const naechsteSchrittNummer = () => {
  const nums = ED.data.o.filter(q => q.k === "step" || q.k === "init").map(q => parseInt(q.v, 10)).filter(v => !isNaN(v));
  return String(nums.length ? Math.max(...nums) + 1 : 1);
};
export const SCHRITT = {
  umriss: QUADRAT,
  aus: o => [o.x+20, o.y+40],
  ein: o => [o.x+20, o.y],
  einrueck: 20,
  neu(o, [px, py]){ o.x = px - 20; o.y = py - 20; o.v = naechsteSchrittNummer(); },
  verweisName: o => `Schritt ${o.v}`,
  feldliste: [["v", "Schrittnummer"]],
  beschriftung: {hinweis: "Schrittnummer"},
};
// Bei einer Abbruchstelle heißt die Transition nach dem Schritt davor bzw. danach
export function transitionName(o, objs, cs, dir){
  const c = cs.find(c => dir === "von" ? c.b === o.id && isStep(objs[c.a]) : c.a === o.id && isStep(objs[c.b]));
  if (c) return `Schritt ${(dir === "von" ? objs[c.a] : objs[c.b]).v}`;
  return o.v ? `Transition ${o.v}` : "Transition";
}
export const verzweigungsBreite = o => o.w || 200;
export const VERZWEIGUNG = {
  aus: (o, tx) => [clamp(tx, o.x, o.x + verzweigungsBreite(o)), o.y],
  ein: (o, fx) => [clamp(fx, o.x, o.x + verzweigungsBreite(o)), o.y],
  einrueck: 100,
  neu(o, [px, py]){ o.x = px - 100; o.y = py; o.w = 200; },
  felder: o => textFeld("w", "Breite", undefined, verzweigungsBreite(o)),
  beschriftung: {
    hinweis: "Breite (Standard 200)",
    wert: o => String(verzweigungsBreite(o)),
    setze(o, v){ const w = parseInt(v, 10); if (w >= 40) o.w = Math.round(w/10)*10; },
  },
};

/* ---------- Anmeldung ---------- */
registriereVorlage("grafcet", {
  n: "GRAFCET", d: "Ablauf nach DIN EN 60848 mit Symbollegende", gruppen: ["grafcet"],
  body: (ex, page) => dots(20) + (page ? "" : GRAFCET_LEGENDE),
});
export const GRAFCET_LEGENDE = `<g><rect x="790" y="25" width="185" height="196" fill="#fff" stroke="${G}"/>${TX(800,43,10,"Symbole","start","#666",600)}
        <rect x="800" y="54" width="22" height="22" fill="none" stroke="${G}" stroke-width="1.3"/><rect x="803" y="57" width="16" height="16" fill="none" stroke="${G}" stroke-width="1.3"/>${TX(832,69,10,"Anfangsschritt")}
        <rect x="800" y="86" width="22" height="22" fill="none" stroke="${G}" stroke-width="1.3"/>${TX(832,101,10,"Schritt")}
        <path d="M811 116V140M803 128H819" stroke="${G}" stroke-width="1.3"/>${TX(832,132,10,"Transition + Bedingung")}
        <path d="M800 160H812" stroke="${G}" stroke-width="1.3"/><rect x="812" y="150" width="40" height="20" fill="none" stroke="${G}" stroke-width="1.3"/>${TX(862,164,10,"Aktion")}
        <path d="M811 180V206" stroke="${G}" stroke-width="1.3"/>${TX(832,197,10,"Wirkverbindung")}</g>`;

registriereGruppe("grafcet", {
  name: "GRAFCET",
  hinweis: "Anfangsschritt setzen, dann Transition, Schritt, Transition … anklicken: Jeder neue Baustein hängt sich unter den markierten. Aktionen hängen sich rechts an den Schritt; eine weitere Aktion kommt darunter oder – Klick rechts daneben – dahinter. Für den Rücksprung die letzte Transition markieren, Verbinden wählen und den Anfangsschritt anklicken.",
  kette: true,
});

export const AKTION = {
  g: "grafcet", titel: "Aktion",
  zeichne: zeichneAktion,
  umriss(o){ const m = hasMark(o) ? 20 : 0; return {x: o.x, y: o.y - m, w: aw(o), h: 30 + m}; },
  neu(o, [px, py], mk){ Object.assign(o, mk || {t: "kont"}); o.k = "action"; o.x = px - 20; o.y = py - 15; o.v = ""; },
  felder: aktionFelder, setze: setzeAktion, umbau: ["t", "q"],
  beschriftung: AKTION_TEXT, seite: AKTION_SEITE,
};
fuelle(BAUSTEIN, {
  init: {g: "grafcet", n: "Anfangsschritt", ...SCHRITT,
    zeichne: o => `<rect x="${o.x}" y="${o.y}" width="40" height="40" fill="#fff" ${LINIE}/><rect x="${o.x+4}" y="${o.y+4}" width="32" height="32" fill="none" ${LINIE}/>` + SVGT(o.x+20, o.y+25, o.v)},
  step: {g: "grafcet", n: "Schritt", ...SCHRITT,
    zeichne: o => `<rect x="${o.x}" y="${o.y}" width="40" height="40" fill="#fff" ${LINIE}/>` + SVGT(o.x+20, o.y+25, o.v)},
  macro: {g: "grafcet", n: "Makroschritt", ...SCHRITT,
    einrueck: 0,   // Makroschritt richtet sich mit der linken Kante aus (wie bisher)
    feldliste: [["v", "Bezeichnung", "z. B. M1"]],
    beschriftung: {hinweis: "Bezeichnung, z. B. M1"},
    neu(o, [px, py]){ o.x = px - 20; o.y = py - 20; o.v = "M" + (ED.data.o.filter(q => q.k === "macro").length + 1); },
    zeichne: o => `<rect x="${o.x}" y="${o.y}" width="40" height="40" fill="#fff" ${LINIE}/><path d="M${o.x} ${o.y+5}H${o.x+40}M${o.x} ${o.y+35}H${o.x+40}" ${LINIE}/>` + SVGT(o.x+20, o.y+25, o.v, "middle", 12)},
  trans: {g: "grafcet", n: "Transition",
    zeichne: (o, edit) => `<path d="M${o.x-14} ${o.y}H${o.x+14}" stroke="${INK}" stroke-width="3.2"/>`
      + (o.v ? SVGT(o.x+22, o.y+5, o.v, "start", 13, 400) : platzhalter(edit, "Bedingung", o.x+22, o.y+5, "start")),
    umriss: o => ({x: o.x-16, y: o.y-9, w: 32 + (o.v ? tw(o.v) + 12 : 70), h: 18}),
    mitte: o => [o.x, o.y],
    aus: o => [o.x, o.y], ein: o => [o.x, o.y],
    verweisName: transitionName,
    feldliste: [["v", "Übergangsbedingung", "z. B. BG1 · BG15, 5s/X3, ↑BG40"]],
    beschriftung: {sofort: true, ort: o => [o.x + 20, o.y], hinweis: "Bedingung, z. B. BG1 · BG40"}},
  action: {...AKTION, n: "Aktion kontinuierlich", mk: {t: "kont"}},
  actc: {g: "grafcet", n: "Aktion mit Zuweisungsbedingung", mk: {k: "action", t: "kont", b: "", hb: true}},
  acta: {g: "grafcet", n: "Aktion bei Aktivierung ↑", mk: {k: "action", t: "akt"}},
  actd: {g: "grafcet", n: "Aktion bei Deaktivierung ↓", mk: {k: "action", t: "deakt"}},
  acte: {g: "grafcet", n: "Aktion bei Ereignis", mk: {k: "action", t: "ereig", b: ""}},
  actionq: {...AKTION, n: "Aktion mit Bestimmungszeichen", mk: {k: "action", t: "q", q: "S"}},
  alt: {g: "grafcet", n: "ODER-Verzweigung", ...VERZWEIGUNG,
    zeichne: o => `<path d="M${o.x} ${o.y}H${o.x+verzweigungsBreite(o)}" stroke="${INK}" stroke-width="1.6"/>`,
    umriss: o => ({x: o.x, y: o.y-5, w: verzweigungsBreite(o), h: 10})},
  par: {g: "grafcet", n: "UND-Verzweigung", ...VERZWEIGUNG,
    zeichne: o => `<path d="M${o.x} ${o.y}H${o.x+verzweigungsBreite(o)}M${o.x} ${o.y+5}H${o.x+verzweigungsBreite(o)}" stroke="${INK}" stroke-width="1.6"/>`,
    aus: (o, tx) => [clamp(tx, o.x, o.x + verzweigungsBreite(o)), o.y+5],
    umriss: o => ({x: o.x, y: o.y-5, w: verzweigungsBreite(o), h: 15})},
  ref: {g: "grafcet", n: "Verweis / Sprung",
    zeichne: (o, edit) => `<path d="M${o.x} ${o.y}V${o.y+30}M${o.x-5} ${o.y+23}L${o.x} ${o.y+31}L${o.x+5} ${o.y+23}" ${LINIE} fill="none"/>`
      + (o.v ? SVGT(o.x+9, o.y+29, o.v, "start", 12, 500) : platzhalter(edit, "Ziel, z. B. 1", o.x+9, o.y+29, "start")),
    umriss: o => ({x: o.x-10, y: o.y, w: 24 + tw(o.v || "Ziel"), h: 36}),
    aus: o => [o.x, o.y+30], ein: o => [o.x, o.y],
    neu(o, [px, py]){ o.x = px; o.y = py - 15; o.v = ""; },
    feldliste: [["v", "Ziel", "z. B. 1 oder Schritt 5"]],
    beschriftung: {sofort: true, hinweis: "Ziel, z. B. 1"}},
});
fuelle(SAMPLE, {
  init: [{k:"init", x:4, y:4, v:"1"}, "0 0 48 48"], step: [{k:"step", x:4, y:4, v:"2"}, "0 0 48 48"],
  trans: [{k:"trans", x:24, y:24}, "0 0 48 48", `<path d="M24 4V44" stroke="${INK}" stroke-width="1.6"/>`],
  macro: [{k:"macro", x:4, y:4, v:"M1"}, "0 0 48 48"], ref: [{k:"ref", x:16, y:8, v:"1"}, "0 0 48 48"],
  action: [{k:"action", t:"kont", x:4, y:9, v:"MB1"}, "0 0 98 48"], actionq: [{k:"action", t:"q", x:4, y:9, q:"S", v:"MB9"}, "0 0 98 48"],
  actc: [{k:"action", t:"kont", x:4, y:22, v:"MB1", b:"BG9"}, "0 0 98 56"], acta: [{k:"action", t:"akt", x:4, y:22, v:"Z := 0"}, "0 0 98 56"],
  actd: [{k:"action", t:"deakt", x:4, y:22, v:"Z := 0"}, "0 0 98 56"], acte: [{k:"action", t:"ereig", x:4, y:22, v:"Z := Z+1", b:"↑BG1"}, "0 0 98 56"],
  alt: [{k:"alt", x:8, y:24, w:72}, "0 0 88 48", `<path d="M44 4V24M18 24V44M70 24V44" stroke="${INK}" stroke-width="1.6"/>`],
  par: [{k:"par", x:8, y:22, w:72}, "0 0 88 48", `<path d="M44 4V22M18 27V44M70 27V44" stroke="${INK}" stroke-width="1.6"/>`],
});
