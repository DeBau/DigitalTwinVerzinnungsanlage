// Vorlage Trendaufzeichnung: Werkzeuge Kurve und Band. Kurve: Punkte nacheinander anklicken, eine glatte Linie läuft
// durch alle Punkte (Strichart kurve). Band: ein Rechteck aufziehen, es wird zu zwei gestrichelten Hilfslinien mit
// leichter Fläche dazwischen, für ein Toleranzband um den Sollwert oder die Hysterese eines Zweipunktreglers
// (Strichart band). Die Werkzeuge hängen über die Haken zeiger und anleitung an der Vorlage (trend.js).
import { $ } from '../../app/basis.js';
import { SVGT } from '../svg.js';
import { ED, markiere } from '../status.js';
import { STRICH, STRICHFELD, fuelle } from '../registry.js';
import { shapeD } from '../vorlagen-svg.js';
import { FARBEN, auswahlFeld, textFeld, updateProps } from '../eigenschaften.js';
import { renderInk } from '../anzeige.js';
import { aendere, beginne, schliesse } from '../verlauf.js';
import { fangen } from '../werkzeuge.js';
import { beginneStrich } from '../zeiger.js';

/* ---------- Strichart kurve ---------- */
// Glatter Pfad durch alle Punkte (Catmull-Rom als kubische Bézierkurven). Die Stützpunkte bleiben in der Höhe
// zwischen ihren beiden Punkten, damit die Kurve nicht über- oder unterschwingt, wo man es nicht gezeichnet hat.
export function kurvenPfad(p){
  const r = v => +v.toFixed(1), q = i => p[Math.max(0, Math.min(p.length - 1, i))];
  const zwischen = (v, a, b) => Math.max(Math.min(a, b), Math.min(Math.max(a, b), v));
  let s = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i + 1 < p.length; i++) {
    const [a, b, c, d] = [q(i - 1), q(i), q(i + 1), q(i + 2)];
    const y1 = zwischen(b[1] + (c[1] - a[1]) / 6, b[1], c[1]), y2 = zwischen(c[1] - (d[1] - b[1]) / 6, b[1], c[1]);
    s += `C${r(b[0] + (c[0] - a[0]) / 6)} ${r(y1)} ${r(c[0] - (d[0] - b[0]) / 6)} ${r(y2)} ${c[0]} ${c[1]}`;
  }
  return s;
}

/* ---------- Strichart band ---------- */
export const bandRand = st => {
  const [[x1, y1], [x2, y2]] = st.p;
  return {x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1)};
};
export function bandSVG(st){
  const b = bandRand(st), strich = `stroke="${st.c}" stroke-width="${st.w}" stroke-dasharray="7 4"`;
  return `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${st.c}" fill-opacity=".08"/>`
    + `<path d="M${b.x} ${b.y}H${b.x + b.w}M${b.x} ${b.y + b.h}H${b.x + b.w}" ${strich} fill="none"/>`
    + (st.lbl ? SVGT(b.x + b.w, b.y - 5, st.lbl, "end", 11, 600, st.c) : "");
}
fuelle(STRICHFELD, {bl: "lbl"});
fuelle(STRICH, {
  kurve: {titel: "Kurve", form: st => kurvenPfad(st.p)},
  band: {titel: "Toleranzband / Hysterese", form: STRICH.r.form, zeichne: bandSVG,
    felder: st => textFeld("bl", "Beschriftung", "z. B. Toleranz ±2 °C oder Hysterese", st.lbl)
      + auswahlFeld("sc", "Farbe", FARBEN, st.c)},
});

/* ---------- Werkzeuge ---------- */
// Offenen Verlaufsschritt des Trends abschließen: Tippen in einem Achsenfeld (trend.js) oder eine angefangene Kurve.
// Aufrufer: Verlassen des Felds, Klick aufs Blatt außer beim Weiterzeichnen der Kurve, Werkzeugwechsel, Kurve fertig.
export function trendSchrittEnde(){ if (ED.tx && ED.tx.schluessel.startsWith("trend:")) schliesse(); }
export const gleicherPunkt = (a, b) => Math.abs(a[0] - b[0]) < .5 && Math.abs(a[1] - b[1]) < .5;
// Klick mit dem Werkzeug Kurve: erster Punkt merken, ab dem zweiten wächst der Strich; derselbe Punkt beendet die Kurve
export function kurvenKlick(pt){
  const q = fangen(pt), a = ED.vorlage.angefangen;
  if (!a) { ED.vorlage.angefangen = {punkte: [q]}; kurvenVorschau(q); return; }
  const st = a.i !== undefined && ED.data.s[a.i], letzter = st ? st.p[st.p.length - 1] : a.punkte[0];
  if (gleicherPunkt(letzter, q)) { ED.vorlage.angefangen = null; $(".ghost", ED.svg).innerHTML = ""; trendSchrittEnde(); return; }
  if (st) { aendere(d => { d.s[a.i].p.push(q); }); return; }
  beginne("trend:kurve");   // alle Punkte einer Kurve sind ein Verlaufsschritt
  aendere(d => { d.s.push({k: "kurve", c: ED.color, w: ED.w, p: [letzter, q]}); a.i = d.s.length - 1; });
}
export function kurvenVorschau(q){
  const a = ED.vorlage.angefangen, st = a.i !== undefined ? ED.data.s[a.i] : null, p = [...(st ? st.p : a.punkte), q];
  $(".ghost", ED.svg).innerHTML = `<path d="${shapeD({k: "kurve", p})}" stroke="#2F80ED" stroke-width="1.6" `
    + `stroke-dasharray="5 4" fill="none"/>` + p.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#2F80ED"/>`).join("");
}
export const TREND_ZEIGER = {
  unten(e, pt){
    if (ED.tool !== "kurve" || !ED.vorlage.angefangen) trendSchrittEnde();   // Klick aufs Blatt beendet den offenen Schritt
    if (ED.tool === "kurve") { e.preventDefault(); kurvenKlick(pt); return true; }
    if (ED.tool !== "band") return false;
    e.preventDefault();
    const q = fangen(pt);
    beginneStrich(e, {k: "band", c: ED.color, w: 1.2, p: [q, q], lbl: ""});
    return true;
  },
  bewegen(e, pt){
    if (ED.tool !== "kurve" || !ED.vorlage.angefangen) return false;
    kurvenVorschau(fangen(pt));
    return true;
  },
  // Neues Band markieren und das Beschriftungsfeld öffnen
  gezogen(st){
    if (st.k !== "band") return false;
    markiere("s", ED.data.s.length - 1); renderInk(); updateProps("neu");
    const f = $('#props [data-prop="bl"]'); if (f) f.focus();
    return true;
  },
};
export const TREND_WERKZEUGE = `<button type="button" class="tool" data-tool="kurve" `
  + `title="Punkte nacheinander anklicken, die Linie läuft glatt hindurch">∿ Kurve</button>`
  + `<button type="button" class="tool" data-tool="band" title="Rechteck aufziehen: Toleranzband oder Hysterese">▭ Band</button>`;
export const TREND_ANLEITUNG = {
  kurve: ["Punkte nacheinander anklicken. Die Kurve läuft glatt durch alle Punkte.",
    "Den letzten Punkt noch einmal anklicken oder Esc: Die Kurve ist fertig.",
    "Tipp: Für eine Sprungantwort erst den Knick, dann ein paar Punkte am Ende setzen."],
  band: ["Ein Rechteck aufziehen: oben und unten entsteht je eine gestrichelte Hilfslinie.",
    "Toleranzband: die erlaubte Abweichung um den Sollwert. Hysterese: oberer und unterer Schaltpunkt.",
    "Danach links die Beschriftung eintragen."],
};
// Haken anleitung: Hilfe zum gewählten Werkzeug, solange nichts markiert ist
export function trendAnleitung(){
  const schritte = TREND_ANLEITUNG[ED.tool];
  if (!schritte || ED.markiert) return null;
  return `<div class="props"><div class="palh">${STRICH[ED.tool].titel}</div><ol style="margin:0;padding-left:18px;`
    + `font-size:13.5px;line-height:1.45">${schritte.map(t => `<li style="margin:0 0 6px">${t}</li>`).join("")}</ol></div>`;
}
