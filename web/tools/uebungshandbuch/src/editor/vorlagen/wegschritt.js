// Vorlage Weg-Schritt-Diagramm (nach der zurückgezogenen VDI 3260): Formular mit einer Zeile je Bauglied, gezeichnet
// wird mit eigenen Werkzeugen (Funktionslinie, Signallinie, Start, Verknüpfung, Zyklusende) statt mit einer Palette.
// Die Stricharten sig, st, eq, vk stehen in STRICH (wegschritt-striche.js), die Werkzeuge hängen über die Haken der
// Vorlage im Kern. Schnelleingabe und Prüfung: wegschritt-eingabe.js.
import { $, $$ } from '../../app/basis.js';
import { INK, SVGT, arrowHead } from '../svg.js';
import { ED, markiere } from '../status.js';
import { registriereVorlage } from '../registry.js';
import { G, G2, TX, shapeD } from '../vorlagen-svg.js';
import { anySel, clearSel } from '../auswahl.js';
import { skMeta } from '../blaetter.js';
import { updateProps } from '../eigenschaften.js';
import { renderInk } from '../anzeige.js';
import { aendere } from '../verlauf.js';
import { editLabel } from '../beschriften.js';
import { fangen, setTool } from '../werkzeuge.js';
import { beginneStrich } from '../zeiger.js';
import { WS_RASTER, spalteBei, wsAus, wsRows, wsZeilen, zeileBei, zeilenName } from './wegschritt-striche.js';
import { EINGABE_HTML, bedeutung, eingabeKlick, wsPruefen } from './wegschritt-eingabe.js';

/* ---------- Formular ---------- */
export function wegschrittBlatt(ex, page = 0, meta = null){
  const all = wsZeilen(ex?.id).map((r, i) => zeilenName(meta, r, i));
  const x0 = 30, xs = WS_RASTER.x0, cw = WS_RASTER.spalte, y0 = 40, hh = WS_RASTER.y0 - y0, rh = WS_RASTER.zeile;
  const yb = y0 + hh + all.length * rh;
  let s = `<rect x="${x0}" y="${y0}" width="${975-x0}" height="${yb - y0 + 3*40}" fill="none" stroke="${G}" stroke-width="1"/>`;
  s += TX(x0+10, y0+22, 12, "Bauglied", "start", "#666", 600);
  for (let c = 0; c <= WS_RASTER.spalten; c++) {
    const x = xs + c*cw;
    s += `<path d="M${x} ${y0}V${yb + 120}" stroke="${G}" stroke-width="${c===0?1:.5}"/>`;
    if (c < WS_RASTER.spalten) s += TX(x + cw/2, y0+22, 12, String(c+1), "middle", "#666", 600);
  }
  s += `<path d="M${x0} ${y0+hh}H975" stroke="${G}"/>`;
  all.forEach((r, i) => {
    const y = y0 + hh + i*rh;
    s += `<path d="M${x0} ${y+rh}H975" stroke="${G}" stroke-width=".8"/>`
      + `<path d="M${xs} ${y+16}H975M${xs} ${y+rh-12}H975" stroke="${G2}" stroke-width=".6" stroke-dasharray="3 3"/>`
      + TX(x0+10, y+rh/2+5, 13, r, "start", "#555", 600) + TX(xs-8, y+20, 9, "1", "end") + TX(xs-8, y+rh-8, 9, "0", "end");
    const [b1, b0] = bedeutung(meta, r, i);   // Bedeutung von 1 und 0, z. B. unten / oben
    s += (b1 ? TX(xs-18, y+19, 8, b1, "end") : "") + (b0 ? TX(xs-18, y+rh-9, 8, b0, "end") : "");
  });
  s += TX(x0+10, yb+25, 11, "Bedingungen", "start", "#666", 600);
  for (let i = 1; i <= 3; i++) s += `<path d="M${x0} ${yb + i*40}H975" stroke="${G}" stroke-width=".6"/>`;
  return s;
}

/* ---------- Seitenleiste ---------- */
export const WSI = (inner) => `<svg viewBox="0 0 64 40" aria-hidden="true">`
  + `<path d="M4 8H60M4 32H60" stroke="#C9D0D5" stroke-width="1" stroke-dasharray="2 2"/>${inner}</svg>`;
export const WSP = (d, w=1.2) => `<path d="${d}" stroke="${INK}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
export const WSA = (x, y1, y2) => WSP(`M${x} ${y1}V${y2}`) + arrowHead(x, y2 + (y2 > y1 ? -7 : 7), x, y2, 5);
const PUNKT = `<circle cx="24" cy="8" r="3" fill="${INK}"/>`;
const KREIS = `<circle cx="24" cy="8" r="4.5" fill="#fff" stroke="${INK}" stroke-width="1.3"/>`;
const VK = WSP("M14 4V14H32M50 4V14H32V36");
export const WSPAL = [
  ["Funktionslinien", [["line", "Funktionslinie", {}, WSI(WSP("M6 8H20L40 32H58", 3))],
    ["line", "Ventil schaltet (senkrecht)", {}, WSI(WSP("M6 32H30V8H58", 3))]]],
  ["Signallinien und Signalgeber", [
    ["sig", "Grenztaster: Punkt", {sg: "punkt"}, WSI(WSP("M6 8H24L44 32", 2.4) + PUNKT + WSA(24, 8, 34))],
    ["sig", "Grenztaster: Kreis", {sg: "kreis"}, WSI(WSP("M6 8H24L44 32", 2.4) + WSA(24, 12, 34) + KREIS)],
    ["sig", "Betätigung über Strecke: Balken", {sg: "balken"},
      WSI(WSP("M6 8H40", 2.4) + `<path d="M20 8H38" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>` + WSA(38, 8, 34))],
    ["sig", "Signal von anderer Maschine", {sg: "extern"},
      WSI(`<path d="M10 12H22L26 18L22 24H10Z" fill="#fff" stroke="${INK}" stroke-width="1.2"/>` + WSP("M26 18H34") + WSA(34, 18, 34))],
    ["sig", "Schleife: eigene Endlage", {}, WSI(WSP("M6 8L26 32H58", 2.4)
      + `<path d="M26 32C18 18 34 18 27 30" stroke="${INK}" stroke-width="1.2" fill="none"/>`
      + `<circle cx="26" cy="32" r="2.6" fill="${INK}"/>`)]]],
  ["Verknüpfungen und Zeit", [
    ["vk", "UND-Verknüpfung", {t: "und"}, WSI(VK + WSP("M26 18L38 10", 2) + arrowHead(32, 29, 32, 36, 5))],
    ["vk", "ODER-Verknüpfung", {t: "oder"}, WSI(VK + `<circle cx="32" cy="14" r="3.4" fill="${INK}"/>` + arrowHead(32, 29, 32, 36, 5))],
    ["sig", "Zeitglied", {tz: "t = 1 s"}, WSI(WSA(32, 4, 36)
      + `<rect x="18" y="13" width="28" height="13" rx="2" fill="#fff" stroke="${INK}" stroke-width="1.2"/>`
      + SVGT(32, 23, "t = 1 s", "middle", 8, 600))]]],
  ["Ablauf", [
    ["start", "Taster / Start", {}, WSI(`<rect x="12" y="16" width="12" height="12" rx="1" fill="#fff" stroke="${INK}" stroke-width="1.2"/>`
      + WSP("M15 19H21M18 19V25M24 20L32 10") + WSP("M32 8L58 32", 2.4))],
    ["eq", "Zyklusende n = 1", {}, WSI(WSP("M32 2V38", 2.6) + SVGT(46, 24, "n=1", "middle", 9, 700))]]],
];
export function wsPaletteHTML(){
  let n = 0;
  const knopf = ([, name, , icon]) => `<button type="button" class="palb" data-ws="${n++}" title="${name}">`
    + `${icon}<span>${name}</span></button>`;
  return WSPAL.map(([g, items]) => `<div class="palg"><div class="palh">${g}</div>${items.map(knopf).join("")}</div>`).join("");
}
export const wsItem = i => WSPAL.flatMap(g => g[1])[i];
export const WS_HILFE = [
  "<b>Weg-Schritt-Diagramm</b> nach der zurückgezogenen VDI 3260. Eine Nachfolgenorm gibt es nicht, die Darstellung ist "
    + "in Ausbildung und Prüfung trotzdem üblich.",
  "<b>Funktionslinie</b> (dick): waagrecht = Stillstand, schräg = Bewegung (je steiler, desto schneller), senkrecht = Ventil "
    + "bzw. Stellglied schaltet. Die Enden rasten auf die Eckpunkte.",
  "<b>Schnelleingabe</b>: den Ablauf als Zeile eintragen, z. B. MM2−, MM3+, MM2+, t = 10 s, MM2−, MM3−, MM2+. "
    + "Funktionslinien, Signallinien mit den Sensoren der Anlage, Start und Zyklusende entstehen von selbst.",
  "<b>Zeilenname</b>: links auf den Namen klicken, z. B. eine freie Zeile in „−MB1 Ventil“ umbenennen. Klickst du oben "
    + "bzw. unten neben die 1 oder 0, trägst du ein, was die Stellung bedeutet (z. B. 1 = unten).",
  "<b>Start</b>: auf den Beginn der ersten Bewegung klicken. Der Starttaster (z. B. −SF1) wird davor gesetzt.",
  "<b>Signallinie</b>: vom Auslöser, z. B. der erreichten Endlage, zum Beginn der nächsten Bewegung ziehen und den Auslöser "
    + "eintragen (−BG2, eine Zeit wie t = 10 s oder eine Verknüpfung).",
  "<b>Schleife</b>: Löst ein Zylinder mit seiner eigenen Endlage die Gegenbewegung aus, klickst du mit Signallinie einfach auf "
    + "diesen Punkt.",
  "<b>UND / ODER</b>: „UND-Verknüpfung“ bzw. „ODER-Verknüpfung“ wählen und den Beginn der ausgelösten Bewegung anklicken. "
    + "Davor entsteht der Verknüpfungspunkt (Schrägstrich = UND, Punkt = ODER). Dann mit Signallinie jeden Signalgeber mit "
    + "diesem Punkt verbinden. Signalgeber und Zeitglied stellst du links bei der markierten Signallinie ein.",
  "<b>n = 1</b>: Spalte nach dem letzten Schritt anklicken. Der Zyklus schließt sich.",
].map(t => `<p>${t}</p>`).join("");

// Anleitung im Eigenschaftsfeld je Werkzeug: [Titel, Schritte ohne bzw. mit angefangener Linie]
export const WS_ANLEITUNG = {
  sig: [v => "Signallinie" + (v && v.tz ? " mit Zeitglied" : ""),
    [`Den <b>Auslösepunkt</b> anklicken, meist die Endlage, an der der Sensor schaltet.`,
      `Dann den <b>Zielpunkt</b> anklicken: den Beginn der ausgelösten Bewegung.`, `Danach den Sensor eintragen, z. B. −BG2.`,
      `Bei UND/ODER als Zielpunkt den Verknüpfungspunkt anklicken. Er fängt die Linie.`],
    [`Jetzt den <b>Zielpunkt</b> anklicken: den Beginn der Bewegung, die ausgelöst wird.`,
      `Für eine <b>Schleife</b> denselben Punkt noch einmal anklicken.`, `Esc bricht ab.`]],
  line: [() => "Funktionslinie",
    [`<b>Eckpunkte nacheinander anklicken</b>: waagrecht = Stillstand, schräg = Bewegung, senkrecht = Ventil schaltet.`,
      `Oder von Ecke zu Ecke ziehen.`],
    [`Nächsten <b>Eckpunkt</b> anklicken, die Funktionslinie läuft weiter.`,
      `Den letzten Punkt noch einmal anklicken oder Esc: Linie beenden.`]],
  start: [() => "Taster / Start", [`Den <b>Beginn der Bewegung</b> anklicken, die der Taster startet.`,
    `Taster und Pfeil werden ins Schrittfeld gesetzt; die Bezeichnung (z. B. −SF1) links ändern.`]],
  vk: [v => v && v.t === "oder" ? "ODER-Verknüpfung" : "UND-Verknüpfung",
    [`Den <b>Zielpunkt</b> anklicken: den Beginn der Bewegung, die erst ausgelöst wird, wenn die Bedingung erfüllt ist.`,
      `Davor entsteht der Verknüpfungspunkt (UND = Schrägstrich, ODER = Punkt) mit Pfeil zum Ziel.`,
      `Danach mit <b>Signallinie</b> jeden Signalgeber anklicken und dann den Verknüpfungspunkt. Die Linien laufen dort zusammen.`]],
  eq: [() => "Zyklusende", [`Die <b>Spalte nach dem letzten Schritt</b> anklicken. Die Spalte wird zu „n = 1“, der Zyklus schließt sich.`]],
};
// Anleitung im Eigenschaftsfeld, solange ein Werkzeug gewählt und nichts markiert ist
export function wsAnleitung(){
  const a = WS_ANLEITUNG[ED.tool];
  if (anySel() || !a) return null;
  const [titel, ohne, mit] = a, how = (ED.vorlage.angefangen && mit) || ohne;
  const step = t => `<li style="margin:0 0 6px">${t}</li>`;
  return `<div class="props"><div class="palh">${titel(ED.vorlage.voreinstellung)}</div>`
    + `<ol style="margin:0;padding-left:18px;font-size:13.5px;line-height:1.45">${how.map(step).join("")}</ol></div>`;
}

/* ---------- Werkzeuge auf dem Blatt ---------- */
// Fangen: auf einen Verknüpfungspunkt, im Diagramm auf einen Eckpunkt (Schrittgrenze × Stellung 1 oder 0), sonst 10er-Raster
export function wsFang(pt){
  const j = ED.data.s.find(q => q.k === "vk" && Math.hypot(q.p[0][0] - pt[0], q.p[0][1] - pt[1]) < 12);
  if (j) return [...j.p[0]];
  const rows = wsRows(), yEnd = WS_RASTER.y0 + rows * WS_RASTER.zeile;
  const imDiagramm = pt[0] >= WS_RASTER.x0 - 30 && pt[0] <= 990 && pt[1] >= WS_RASTER.y0 - 10 && pt[1] <= yEnd + 10;
  if (!imDiagramm) return [Math.round(pt[0]/10)*10, Math.round(pt[1]/10)*10];
  const c = Math.max(0, Math.min(12, spalteBei(pt[0])));
  const lv = [];
  for (let i = 0; i < rows; i++) lv.push(WS_RASTER.y0 + i*WS_RASTER.zeile + 16, WS_RASTER.y0 + i*WS_RASTER.zeile + 50);
  const ny = lv.reduce((a, v) => Math.abs(v - pt[1]) < Math.abs(a - pt[1]) ? v : a, lv[0]);
  return [+(WS_RASTER.x0 + c*WS_RASTER.spalte).toFixed(2), ny];
}
// Neue Signallinie markieren und das Feld für den Signalgeber fokussieren
export function signalMarkieren(){
  markiere("s", ED.data.s.length - 1); renderInk(); updateProps("neu");
  const f = $('#props [data-prop="sl"]'); if (f) f.focus();
}
export const punktMarke = p => `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#2F80ED" fill-opacity=".35" stroke="#2F80ED"/>`;
// Auswählen: Klick links auf den Zeilennamen benennt die Zeile um
export function zeilennameKlick(e, pt){
  const hitS = e.target.closest("[data-i]"), hitT = e.target.closest("[data-ti]");
  const aufName = pt[0] >= 30 && pt[0] < 140 && pt[1] >= WS_RASTER.y0 && pt[1] < WS_RASTER.y0 + wsRows() * WS_RASTER.zeile;
  if (hitS || hitT || !aufName) return false;
  e.preventDefault();
  const i = zeileBei(pt[1]), dy = pt[1] - WS_RASTER.y0 - i * WS_RASTER.zeile, k = dy < 22 ? 0 : dy > 42 ? 1 : -1;
  if (k >= 0) bedeutungAendern(i, k);
  else {
    const cur = (skMeta(ED.scope, ED.key, ED.data).rows || [])[i];
    const ph = "Bauglied, z. B. −MM1 Zylinder oder −MB1 Ventil";
    editLabel(40, WS_RASTER.y0 + i * WS_RASTER.zeile + 31, cur ?? wsZeilen(ED.scope)[i], ph, v => aendere(d => {
      const m = d.meta = d.meta || {}; m.rows = m.rows || []; m.rows[i] = v;
    }));
  }
  return true;
}
// Bedeutung von Stellung 1 (k = 0) bzw. 0 (k = 1) der Zeile i eintragen (meta.bed)
export function bedeutungAendern(i, k){
  const name = zeilenName(ED.data.meta, wsZeilen(ED.scope)[i], i), cur = bedeutung(ED.data.meta, name, i)[k];
  const y = WS_RASTER.y0 + i * WS_RASTER.zeile + (k ? 50 : 16);
  editLabel(60, y, cur, `Bedeutung von ${k ? 0 : 1}, z. B. ${k ? "oben" : "unten"}`, v => aendere(d => {
    const m = d.meta = d.meta || {}; m.bed = m.bed || []; m.bed[i] = m.bed[i] || [null, null]; m.bed[i][k] = v;
  }));
}
// Verknüpfung: Punkt vor dem Ziel setzen, dazu die Linie mit Pfeil zum Ziel; danach weiter mit Signallinien
export function setzeVerknuepfung(pt){
  const q = fangen(pt), J = [q[0], q[1] - wsAus(q[1]) * 18], verkArt = (ED.vorlage.voreinstellung && ED.vorlage.voreinstellung.t) || "und";
  aendere(d => {
    d.s.push({k: "vk", t: verkArt, c: ED.color, w: 1.2, p: [J]}, {k: "sig", c: ED.color, w: 1.2, p: [J, q], lbl: ""});
  }, {ohneRender: true});
  setTool("sig"); ED.vorlage.voreinstellung = {}; clearSel(); renderInk(); updateProps(true);
}
// Zyklusende: die angeklickte Spalte wird zu „n = 1“, ein früheres Zyklusende entfällt
export function setzeZyklusende(pt){
  const j = Math.max(1, Math.min(11, Math.floor((pt[0] - WS_RASTER.x0) / WS_RASTER.spalte)));
  const x = +(WS_RASTER.x0 + j * WS_RASTER.spalte).toFixed(2), y2 = WS_RASTER.y0 + wsRows() * WS_RASTER.zeile;
  clearSel();
  aendere(d => { d.s = d.s.filter(q => q.k !== "eq"); d.s.push({k: "eq", c: ED.color, w: 2.6, p: [[x, 57]], y2}); });
  setTool("sel");
}
export function setzeStart(pt){
  aendere(d => {
    d.s.push({k: "st", c: ED.color, w: 1.2, p: [fangen(pt)], lbl: "−SF1"});
    markiere("s", d.s.length - 1);
  }, {ohneRender: true});
  setTool("sel");
}
// Neue Signallinie bzw. Funktionslinie von a nach q (Funktionslinien sind mindestens 2.8 dick)
const neueLinie = (k, a, q) => k === "sig"
  ? {k: "sig", c: ED.color, w: 1.2, p: [a, q], lbl: "", ...(ED.vorlage.voreinstellung || {})}
  : {k: "l", c: ED.color, w: Math.max(ED.w, 2.8), p: [a, q]};
// Zweiter Klick mit Signallinie bzw. Funktionslinie: Linie vom gemerkten Punkt bis hier
export function zweiterKlick(pt){
  const q = fangen(pt), a = ED.vorlage.angefangen, same = Math.abs(a[0] - q[0]) < .5 && Math.abs(a[1] - q[1]) < .5;
  $(".ghost", ED.svg).innerHTML = "";
  if (ED.tool === "sig") {
    aendere(d => { d.s.push(neueLinie("sig", a, q)); }, {ohneRender: true});
    ED.vorlage.angefangen = null; signalMarkieren();
    return;
  }
  if (same) { ED.vorlage.angefangen = null; renderInk(); updateProps(true); return; }   // gleicher Punkt: Linienzug beenden
  aendere(d => { d.s.push(neueLinie("l", a, q)); ED.vorlage.angefangen = q; });
}
export const WS_KLICK = {vk: setzeVerknuepfung, eq: setzeZyklusende, start: setzeStart};
export const WS_ZEIGER = {
  unten(e, pt){
    const t = ED.tool;
    if (t === "sel") return zeilennameKlick(e, pt);
    if (!WS_KLICK[t] && t !== "sig" && t !== "line") return false;
    e.preventDefault();
    if (WS_KLICK[t]) WS_KLICK[t](pt);
    else if (ED.vorlage.angefangen) zweiterKlick(pt);
    else { const q = fangen(pt); beginneStrich(e, neueLinie(t === "sig" ? "sig" : "l", q, q)); }   // Linie aufziehen
    return true;
  },
  // Vorschau der Linie vom gemerkten Punkt zum Mauszeiger
  bewegen(e, pt){
    if (!ED.vorlage.angefangen || ED.strich || (ED.tool !== "sig" && ED.tool !== "line")) return false;
    const q = fangen(pt), a = ED.vorlage.angefangen, sig = ED.tool === "sig";
    const d = sig ? shapeD({k: "sig", p: [a, q]}) : `M${a[0]} ${a[1]}L${q[0]} ${q[1]}`;
    $(".ghost", ED.svg).innerHTML = `<path d="${d}" stroke="#2F80ED" stroke-width="${sig ? 1.4 : 2.8}" stroke-dasharray="5 4" `
      + `fill="none"/>${punktMarke(a)}<circle cx="${q[0]}" cy="${q[1]}" r="4" fill="none" stroke="#2F80ED"/>`;
    return true;
  },
  // Nur geklickt statt gezogen: Punkt merken, der nächste Klick setzt das Ende
  angeklickt(p0, k){
    if (k !== "sig" && k !== "l") return false;
    ED.vorlage.angefangen = p0; renderInk(); updateProps(true);
    $(".ghost", ED.svg).innerHTML = punktMarke(p0);
    return true;
  },
  gezogen(st){
    if (st.k !== "sig") return false;
    signalMarkieren();
    return true;
  },
};
// Klick auf ein Werkzeug der Seitenleiste: Werkzeug mit Voreinstellung (z. B. Signalgeber Kreis)
export function seitenleisteKlick(e){
  const wb = e.target.closest("[data-ws]");
  if (!wb) return false;
  const it = wsItem(+wb.dataset.ws);
  setTool(it[0]); ED.vorlage.voreinstellung = it[2]; clearSel();
  $$("#editor [data-ws]").forEach(x => x.setAttribute("aria-pressed", x === wb));
  renderInk(); updateProps(true);
  return true;
}

registriereVorlage("wegschritt", {
  n: "Weg-Schritt-Diagramm", d: "Zylinderbewegungen über die Schritte, nach der zurückgezogenen VDI 3260", einblattig: true,
  body: wegschrittBlatt,
  startWerkzeug: "line",
  werkzeugleiste: {
    linie: {titel: "Funktionslinie: waagrecht = Stillstand, schräg = Bewegung, senkrecht = Ventil/Stellglied", name: "Funktionslinie"},
    nachLinie: `<button type="button" class="tool" data-tool="sig" title="Vom Auslöser (Endlage) zum Beginn der nächsten Bewegung `
      + `ziehen">↳ Signallinie</button><button type="button" class="tool" data-tool="start" title="Auf den Beginn der ersten `
      + `Bewegung klicken">⊤ Start</button><button type="button" class="tool" data-tool="eq" title="In die Spalte nach dem `
      + `letzten Schritt klicken">n = 1</button>`,
  },
  seitenleiste: () => EINGABE_HTML + wsPaletteHTML(),
  hilfe: WS_HILFE,
  anleitung: wsAnleitung,
  klick: e => eingabeKlick(e) || seitenleisteKlick(e),
  pruefe: wsPruefen,
  werkzeugWechsel(){
    ED.vorlage.voreinstellung = null;
    $$("#editor [data-ws]").forEach(x => x.setAttribute("aria-pressed", "false"));
  },
  fangPunkt: wsFang,
  zeiger: WS_ZEIGER,
});
