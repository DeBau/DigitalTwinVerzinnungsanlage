// GRAFCET nach DIN EN 60848: Bausteinarten und Aktionen. Aktionen sind Seitenbausteine (Haken seite, editor/kette.js):
// Sie hängen rechts an einem Schritt bzw. einer Transition oder unter bzw. hinter einer anderen Aktion.
// Benutzt von vorlagen/grafcet.js (Anmeldung) und den übrigen vorlagen/grafcet-*.js.
import { SVGT, tw } from '../svg.js';
import { ED } from '../status.js';
import { LINIE, platzhalter } from '../bausteine.js';
import { objById } from '../auswahl.js';
import { HINWEIS, kennzeichenFeld, textFeld } from '../eigenschaften.js';

/* ---------- Bausteinarten ---------- */
export const SCHRITTARTEN = ["step", "init", "macro"];
export const AKTIONSARTEN = ["action", "actionq"];   // actionq: alte gespeicherte Aktion mit Bestimmungszeichen
export const isStep = o => !!o && SCHRITTARTEN.includes(o.k);
export const isTrans = o => !!o && o.k === "trans";
export const isAct = o => !!o && AKTIONSARTEN.includes(o.k);
export const atype = o => o.k === "actionq" ? "q" : (o.t || "kont");

// Zustand beim Durchspielen (grafcet-spiel.js): {aktiv, aktionen, schaltbar} als Mengen von IDs, sonst null
export const spielZustand = () => (ED.tool === "sim" && ED.vorlage.spiel) || null;
export const imSpiel = (menge, id) => { const s = spielZustand(); return !!(s && s[menge] && s[menge].has(id)); };

/* ---------- Aktionen ---------- */
// Arten mit einer Marke über dem Kasten, die Platz braucht: Pfeil, Ereignis oder Zuweisungsbedingung
export const MIT_MARKE = {akt: () => true, deakt: () => true, ereig: () => true, kont: o => !!(o.b || o.hb)};
export const hasMark = o => isAct(o) && !!(MIT_MARKE[atype(o)] || (() => false))(o);
export const ACT_T = {
  kont: "kontinuierlich wirkend", akt: "speichernd bei Aktivierung ↑", deakt: "speichernd bei Deaktivierung ↓",
  ereig: "speichernd bei Ereignis", q: "mit Bestimmungszeichen, S7-GRAPH (IEC 61131-3)",
  zwang: "Zwangssteuerung eines Teil-GRAFCET",
};
// Kennbuchstaben für die Vorschlagsliste: was eine Aktion schaltet bzw. was eine Transition abfragt
export const AKTION_KENNBUCHSTABEN = ["MB", "QA", "PF", "MA", "MM", "TA"];
export const BEDINGUNG_KENNBUCHSTABEN = ["BG", "SF", "BT", "BL", "SA", "KF"];
export const BESTIMMUNG = ["N", "S", "R", "D", "L", "P", "SD", "DS", "SL"];
export const qBreite = o => isAct(o) && atype(o) === "q" ? 30 : 0;   // Feld für das Bestimmungszeichen
export const aw = o => Math.max(90, Math.round((tw(o.v || "Aktion") + 26 + qBreite(o)) / 10) * 10);
export const knick = (x1, y1, x2, y2, m, waagrecht) => waagrecht ? `M${x1} ${y1}H${m}V${y2}H${x2}` : `M${x1} ${y1}V${m}H${x2}V${y2}`;

// Text links oben an der Marke oder Platzhalter im Editor
export const markenText = (wert, platz, x, y, edit) =>
  wert ? SVGT(x, y, wert, "start", 12, 400) : platzhalter(edit, platz, x, y, "start");
export const PFEIL_AUF = (mx, y) =>
  `<path d="M${mx} ${y}V${y-18}M${mx-4.5} ${y-12}L${mx} ${y-18}L${mx+4.5} ${y-12}" ${LINIE} fill="none"/>`;
// Ereignis-Aktion nach DIN EN 60848: Fähnchen aus senkrechtem Strich und kurzem waagrechtem Strich oben, Ereignis daneben
export const FAEHNCHEN = (mx, y) => `<path d="M${mx} ${y}V${y-18}H${mx+8}" ${LINIE} fill="none"/>`;
export const PFEIL_AB = (mx, y) =>
  `<path d="M${mx} ${y}V${y-18}M${mx-4.5} ${y-18}L${mx} ${y-12}L${mx+4.5} ${y-18}" ${LINIE} fill="none"/>`;
// Zwangssteuerung: Aktionskasten mit Doppelrahmen, Inhalt z. B. G2{INIT}
export const DOPPELRAHMEN = o => `<rect x="${o.x+3}" y="${o.y+3}" width="${aw(o)-6}" height="24" fill="none" ${LINIE}/>`;
// Marke über dem Kasten bzw. Zusatz je Art; mx ist die Lage der senkrechten Marke
export const AKTIONSMARKE = {
  kont: (o, mx, y, edit) => o.b || o.hb
    ? `<path d="M${mx} ${y}V${y-16}" ${LINIE}/>` + markenText(o.b, "Zuweisungsbedingung", mx+6, y-6, edit) : "",
  akt: (o, mx, y) => PFEIL_AUF(mx, y),
  deakt: (o, mx, y) => PFEIL_AB(mx, y),
  zwang: o => DOPPELRAHMEN(o),
  ereig: (o, mx, y, edit) => FAEHNCHEN(mx, y) + markenText(o.b, "Ereignis, z. B. ↑−BG1", mx+11, y-14, edit),
};
export function zeichneAktion(o, edit){
  const x = o.x, y = o.y, w = aw(o), qw = qBreite(o), tc = x + qw + (w - qw)/2, marke = AKTIONSMARKE[atype(o)];
  const fuellung = edit && imSpiel("aktionen", o.id) ? "#DFF5E1" : "#fff";   // beim Durchspielen: Aktion wirkt
  let r = `<rect x="${x}" y="${y}" width="${w}" height="30" fill="${fuellung}" ${LINIE}/>`;
  if (qw) r += `<path d="M${x+30} ${y}V${y+30}" ${LINIE}/>` + SVGT(x+15, y+20, o.q || "S", "middle", 12, 600);
  r += o.v ? SVGT(tc, y+20, o.v, "middle", 13, 400) : platzhalter(edit, "Aktion", tc, y+20);
  return r + (marke ? marke(o, x + 16, y, edit) : "");
}
// Eigenschaftsfeld: Art, Bestimmungszeichen, Aktion und je nach Art Zuweisungsbedingung bzw. Ereignis
export const AKTION_ZUSATZFELD = {
  kont: o => textFeld("b", "Zuweisungsbedingung (optional)", "z. B. −BG9 oder 3s/X2", o.b),
  ereig: o => textFeld("b", "Ereignis", "z. B. ↑−BG1", o.b),
  zwang: () => HINWEIS("Schreib den Teil-GRAFCET mit der Situation, z. B. G2{INIT} (Anfangssituation), G2{*} "
    + "(eingefroren), G2{} (alle Schritte inaktiv) oder G2{5, 7}."),
};
export function aktionFelder(o){
  const t = atype(o), zusatz = AKTION_ZUSATZFELD[t];
  const arten = Object.entries(ACT_T).map(([k, n]) => `<option value="${k}" ${k === t ? "selected" : ""}>${n}</option>`).join("");
  let h = `<label class="prop">Art<select data-prop="t">${arten}</select></label>`;
  if (t === "q") {
    const zeichen = BESTIMMUNG.map(q => `<option ${q === (o.q || "S") ? "selected" : ""}>${q}</option>`).join("");
    h += `<label class="prop">Bestimmungszeichen (S7-GRAPH, IEC 61131-3)<select data-prop="q">${zeichen}</select></label>`;
  }
  h += kennzeichenFeld(o, "Aktion", "z. B. −MB1 oder Z := Z + 1");   // Vorschläge nach AKTION_KENNBUCHSTABEN
  return h + (zusatz ? zusatz(o) : "");
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
  hinweis: o => atype(o) === "q" ? "Bestimmungszeichen und Aktion, z. B. S −MB9" : "Aktion, z. B. −MB1",
  setze(o, v){
    if (atype(o) !== "q") { o.v = v; return; }
    const m = v.match(/^(\S+)\s*(.*)$/);
    o.q = m ? m[1] : "S";
    o.v = m ? m[2] : "";
  },
};

/* ---------- Haken seite: Aktionen am Schritt bzw. an der Transition ---------- */
// Wo die Aktionslinie am Kettenglied ansetzt: Transition rechts am Strich, Schritt rechts in der Mitte
export const aktionsAnsatz = A => isTrans(A) ? [A.x + 14, A.y] : [A.x + 40, A.y + 20];
// Linie zu einer gestapelten Aktion: am linken Rand, wenn die Aktion oben eine Marke trägt (sonst kreuzt sie den Pfeil)
export const stapelX = B => hasMark(B) ? 0 : 8;
// Linie von Aktion A zur Aktion B dahinter (rechts) bzw. darunter
export function aktionNachAktion(A, B){
  const ax2 = A.x + aw(A);
  if (B.x >= ax2 - 1) {   // dahinter
    const y1 = A.y + 15, y2 = B.y + 15, m = Math.round((ax2 + B.x)/20)*10;
    return {d: Math.abs(y1 - y2) < 1 ? `M${ax2} ${y1}H${B.x}` : knick(ax2, y1, B.x, y2, m, true)};
  }
  const y1 = A.y + 30, y2 = B.y - (hasMark(B) ? 20 : 0), m = Math.round((y1 + y2)/20)*10, s = stapelX(B);   // darunter
  return {d: Math.abs(A.x - B.x) < 1 ? `M${A.x+s} ${y1}V${B.y}` : `M${A.x+s} ${y1}V${m}H${B.x+s}V${B.y}`};
}
export function aktionVerbinde(A, B){
  if (isAct(A)) return aktionNachAktion(A, B);
  const p1 = aktionsAnsatz(A), p2 = [B.x, B.y+15], m = Math.round((p1[0]+p2[0])/20)*10;
  return {d: Math.abs(p1[1]-p2[1]) < 1 ? `M${p1[0]} ${p1[1]}H${p2[0]}` : knick(p1[0], p1[1], p2[0], p2[1], m, true)};
}
// Letzte Aktion der Reihe, die an A hängt (oder A selbst)
export function letzteAktion(A){
  const naechste = id => ED.data.c.find(c => c.a === id && isAct(objById(c.b)));
  let cur = null, n = 0;
  for (let c = naechste(A.id); c && n++ < 50; c = naechste(cur.id)) cur = objById(c.b);
  return cur || A;
}
export function aktionAusrichten(o, A, pt){
  if (isAct(A)) {
    const right = pt && (pt[0] - (A.x + aw(A))) > (pt[1] - (A.y + 30));   // Klick eher rechts als unterhalb
    if (right) { o.x = A.x + aw(A); o.y = A.y; }
    else { o.x = A.x; o.y = A.y + 30 + (hasMark(o) ? 20 : 0); }
    return;
  }
  o.x = isTrans(A) ? A.x + 40 : A.x + 70;
  o.y = isTrans(A) ? A.y - 15 : A.y + 5;
}
// Andockstellen: rechts am Schritt bzw. an der Transition, rechts neben oder unter einer Aktion
export function aktionAndocken(o, others, take){
  for (const p of others) {
    if (isStep(p) || isTrans(p)) {
      const [px, py] = aktionsAnsatz(p), dx = o.x - px, dy = o.y + 15 - py;
      if (dx >= 0 && dx <= 110 && Math.abs(dy) <= 30) take({a: p.id, b: o.id, d: Math.hypot(dx - 30, dy), sx: 0, sy: -dy});
    } else if (isAct(p)) aktionAnAktion(o, p, take);
  }
}
export function aktionAnAktion(o, p, take){
  const rx = p.x + aw(p), by = p.y + 30 + (hasMark(o) ? 20 : 0);
  const stelle = (x, y) => take({a: p.id, b: o.id, d: Math.abs(o.x - x) + Math.abs(o.y - y), sx: x - o.x, sy: y - o.y});
  if (Math.abs(o.x - rx) <= 25 && Math.abs(o.y - p.y) <= 20) stelle(rx, p.y);
  if (Math.abs(o.x - p.x) <= 25 && Math.abs(o.y - by) <= 20) stelle(p.x, by);
}
export const AKTION_SEITE = {
  verbinde: aktionVerbinde,
  quelle: A => isTrans(A) ? A : letzteAktion(A),   // hat der Schritt schon Aktionen, hängt die neue an die letzte
  ausrichten: aktionAusrichten,
  andocken: aktionAndocken,
  punkt: (A, B) => isAct(A) && B.x < A.x + aw(A) - 1 ? [B.x + stapelX(B), B.y] : [B.x, B.y + 15],
};

// Bausteineintrag einer Aktion (Anmeldung als action und actionq in vorlagen/grafcet.js)
export const AKTION = {
  g: "grafcet", titel: "Aktion",
  zeichne: zeichneAktion,
  umriss(o){ const m = hasMark(o) ? 20 : 0; return {x: o.x, y: o.y - m, w: aw(o), h: 30 + m}; },
  neu(o, [px, py], mk){ Object.assign(o, mk || {t: "kont"}); o.k = "action"; o.x = px - 20; o.y = py - 15; o.v = ""; },
  felder: aktionFelder, setze: setzeAktion, umbau: ["t", "q"],
  kennbuchstaben: AKTION_KENNBUCHSTABEN,
  beschriftung: AKTION_TEXT, seite: AKTION_SEITE,
};
