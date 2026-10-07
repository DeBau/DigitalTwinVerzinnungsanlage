// Vorlage Stromlaufplan (Steuerstromkreis zwischen L+ und M) mit den Gruppen Steuerstromkreis und Geräte/SPS.
// Kontakte, Spulen und Taster bilden Strompfade: eine Ablaufkette (editor/kette.js), die oben an L+ und unten
// an M andockt. Die Schaltzeichen kommen aus symbole/iec60617.js (gemeinsam mit dem Schaltplan).
// Geräte und SPS stehen in elektro-geraete.js.
import { kasten, kreis, linie, nummer, wirklinie } from '../../symbole/grund.js';
import { SYM } from '../../symbole/iec60617.js';
import { INK, PH } from '../svg.js';
import { art, bauteil, registriereBauteile, registriereGruppe, registriereVorlage } from '../registry.js';
import { G, G2, TX, grid } from '../vorlagen-svg.js';
import { LB, portsOf } from '../bauteile.js';
import { gruppenId, umrissVon } from '../bausteine.js';
import { kennzeichen, kontaktAnschluss, kontaktNummern, merkeOrdnung } from './elektro-kennzeichen.js';

// Strompfad: Spalte i liegt bei x = 40 + i·46, 20 Pfade je Blatt
export const pfadNummer = x => Math.max(1, Math.min(20, Math.round((x - 40) / 46)));
export const pfadX = n => 40 + n * 46;

/* ---------- Vorlage ---------- */
export function stromlaufBlatt(){
  let s = `<path d="M40 70H975M40 590H975" stroke="${G}" stroke-width="2"/>`
    + TX(30, 74, 12, "L+", "end", "#555", 600) + TX(30, 594, 12, "M", "end", "#555", 600) + TX(975, 62, 9, "24 V DC", "end");
  for (let i = 1; i <= 20; i++) {
    s += TX(pfadX(i), 52, 9, String(i), "middle")
      + `<path d="M${pfadX(i)} 74V586" stroke="${G2}" stroke-width=".6" stroke-dasharray="2 5"/>`;
  }
  return grid(10, "#EEF1F3", 40, 80, 975, 580) + s + TX(40, 615, 9, "Strompfad-Nr. oben, Kontaktspiegel unter den Spulen");
}
// Glied eines Strompfads: Baustein der Gruppe elektro mit Anschluss oben (0) und unten (1)
export const imPfad = o => gruppenId(o) === "elektro" && !!(bauteil(o.k) ? bauteil(o.k).bx : art(o.k).anschluesse);
const istKettenLink = c => c.pa === undefined && c.pb === undefined;
// Ketten des Steuerstromkreises: je Glied, ob es Anfang und Ende seiner Kette ist. Ein Glied ohne Kettenlink zählt nicht.
export function kettenEnden(d, cs){
  const glieder = (d.o || []).filter(imPfad), ids = new Set(glieder.map(o => o.id));
  const links = cs.filter(c => istKettenLink(c) && ids.has(c.a) && ids.has(c.b));
  return glieder.filter(o => links.some(c => c.a === o.id || c.b === o.id))
    .map(o => ({o, anfang: !links.some(c => c.b === o.id), ende: !links.some(c => c.a === o.id)}));
}
// Liegt zwischen y1 und y2 auf der Senkrechten x ein anderer Baustein?
export function verdeckt(d, x, y1, y2, ohne){
  return (d.o || []).some(p => {
    if (p.id === ohne) return false;
    const b = umrissVon(p);
    return b.x < x && x < b.x + b.w && b.y < y2 && y1 < b.y + b.h;
  });
}
// Automatische Leitungen: Kettenanfang oben zu L+, Kettenende unten zu M, je auf dem eigenen Blatt.
// Nur, wenn der Anschluss frei ist und die Leitung durch keinen anderen Baustein liefe. [{o, p, y}] mit Schienenhöhe y
export function autoLeitungen(d, cs){
  const r = [];
  const belegt = (o, p) => cs.some(c => (c.a === o.id && c.pa === p.n) || (c.b === o.id && c.pb === p.n));
  kettenEnden(d, cs).forEach(({o, anfang, ende}) => {
    const [oben, unten] = portsOf(o), basis = Math.floor(o.y / PH) * PH, yL = basis + 70, yM = basis + 590;
    if (anfang && !belegt(o, oben) && oben.y > yL && !verdeckt(d, oben.x, yL, oben.y, o.id)) r.push({o, p: oben, y: yL});
    if (ende && !belegt(o, unten) && unten.y < yM && !verdeckt(d, unten.x, unten.y, yM, o.id)) r.push({o, p: unten, y: yM});
  });
  return r;
}
export function strompfadAnschluesse(d, cs){
  return autoLeitungen(d, cs).map(({p, y}) => `<path class="autoleitung" d="M${p.x} ${y}V${p.y}" stroke="${INK}" `
    + `stroke-width="1.6"/><circle cx="${p.x}" cy="${y}" r="2.6" fill="${INK}"/>`).join("");
}
registriereVorlage("stromlauf", {
  n: "Stromlaufplan", d: "Steuerstromkreis zwischen L+ und M: Taster, Not-Halt, SPS, Sicherheitsrelais",
  gruppen: ["elektro", "geraete", "leistung"], schienen: [["L+", 70, 40, 935], ["M", 590, 40, 935]],
  body: stromlaufBlatt,
  // Haken hintergrund: Ordnungsziffern merken (vor dem Zeichnen der Kontakte), automatische Leitungen
  hintergrund: (d, cs) => { merkeOrdnung(d); return strompfadAnschluesse(d, cs); },
  // Glieder des Steuerstromkreises rasten auf die Strompfad-Spalten
  fangBaustein(o){ if (gruppenId(o) === "elektro") o.x = pfadX(pfadNummer(o.x)); },
  // Abbruchstellen nennen zusätzlich den Strompfad
  verweis: x => `, Pfad ${pfadNummer(x)}`,
});

/* ---------- Gruppe Steuerstromkreis ---------- */
registriereGruppe("elektro", {
  name: "Steuerstromkreis",
  hinweis: "Kontakte und Spule untereinander setzen: Sie verbinden sich zum Strompfad und docken oben an L+ und unten "
    + "an M an. Kennzeichen per Doppelklick ändern.",
  kette: true,
  kennzeichen,
});

/* ---------- Glieder im Strompfad: Mittellinie bei o.x, Anschluss 0 oben, Anschluss 1 unten, Höhe 60 ---------- */
export const xy = q => [q.x, q.y];
export const STROMPFAD = {g: "elektro", bx: -22, w: 44, h: 60, aus: o => xy(portsOf(o)[1]), ein: o => xy(portsOf(o)[0])};
// Glied mit Bild bild(x, y, {an}) und Anschlüssen an = [oben, unten]. z: links = Abstand des Kennzeichens vor der
// Mittellinie, kontakt = "no" oder "nc" (Anschlussnummern mit Ordnungsziffer), kb = Kennbuchstaben für Vorschläge
export function glied(n, lbl, bild, an, z = {}){
  const {links = 34, kontakt, kb} = z, nummern = o => kontakt ? kontaktNummern(o) : an;
  return {...STROMPFAD, n, lbl, kontakt, kennbuchstaben: kb, anschluesse: [[an[0], 0, 0, "u"], [an[1], 0, 60, "d"]],
    anschlussName: kontakt ? kontaktAnschluss : undefined,
    zeichne: o => bild(o.x, o.y, {an: nummern(o)}) + LB(o.x - links, o.y + 35, o.v)};
}
const SCHALTZEICHEN = k => (x, y, g) => SYM[k].zeichne(x, y, g);
// Positionsschalter: Schließer, über die Wirklinie von einem Stößel (Dreieck) betätigt
const positionsschalter = (x, y, g) => SYM.no.zeichne(x, y, g) + wirklinie(`M${x - 7} ${y + 31}H${x - 20}`)
  + linie(`M${x - 20} ${y + 24}V${y + 38}L${x - 28} ${y + 31}Z`);
const klemme = (x, y) => linie(`M${x} ${y}V${y + 26}M${x} ${y + 34}V${y + 60}`) + kreis(x, y + 30, 4);
// Näherungsschalter PNP im Strompfad: BN oben, BU unten, Schaltausgang BK rechts
const naeherungsschalter = (x, y) => kasten(x - 15, y + 15, 30, 30)
  + linie(`M${x} ${y}V${y + 15}M${x} ${y + 45}V${y + 60}M${x + 15} ${y + 30}H${x + 30}`)
  + linie(`M${x} ${y + 22}L${x + 8} ${y + 30}L${x} ${y + 38}L${x - 8} ${y + 30}Z`)
  + nummer(x + 4, y + 10, "BN") + nummer(x + 4, y + 57, "BU") + nummer(x + 18, y + 26, "BK");

const SPULE = ["QA", "KF", "MB"], TASTER = ["SF"], GEBER = ["BG"];
registriereBauteile({
  no: glied("Schließer", "−QA1", SCHALTZEICHEN("no"), ["13", "14"], {links: 20, kontakt: "no", kb: SPULE}),
  nc: glied("Öffner", "−QA1", SCHALTZEICHEN("nc"), ["11", "12"], {links: 20, kontakt: "nc", kb: SPULE}),
  coil: glied("Spule / Schütz", "−QA1", SCHALTZEICHEN("coil"), ["A1", "A2"], {links: 22, kb: SPULE}),
  lamp: glied("Meldeleuchte", "−PF1", SCHALTZEICHEN("lamp"), ["X1", "X2"], {links: 20, kb: ["PF"]}),
  tno: glied("Taster Schließer", "−SF1", SCHALTZEICHEN("tno"), ["13", "14"], {kontakt: "no", kb: TASTER}),
  tnc: glied("Taster Öffner", "−SF2", SCHALTZEICHEN("tnc"), ["11", "12"], {kontakt: "nc", kb: TASTER}),
  estop: glied("Not-Halt (Pilztaster)", "−SF0", SCHALTZEICHEN("nh"), ["11", "12"], {links: 40, kontakt: "nc", kb: TASTER}),
  key: glied("Schlüsselschalter", "−SF3", SCHALTZEICHEN("key"), ["13", "14"], {links: 44, kontakt: "no", kb: TASTER}),
  lsw: glied("Positionsschalter", "−BG1", positionsschalter, ["13", "14"], {links: 32, kontakt: "no", kb: GEBER}),
  sens: {...glied("Näherungsschalter PNP", "−BG2", naeherungsschalter, ["BN", "BU"], {links: 20, kb: GEBER}), w: 56,
    anschluesse: [["BN", 0, 0, "u"], ["BU", 0, 60, "d"], ["BK", 30, 30, "r"]]},
  mbv: glied("Ventilspule", "−MB1", SCHALTZEICHEN("mbv"), ["A1", "A2"], {links: 22, kb: ["MB"]}),
  term: glied("Klemme", "−X1:1", klemme, ["1", "2"], {links: 10}),
  fuse: glied("Sicherung", "−FA2", SCHALTZEICHEN("sicherung"), ["1", "2"], {links: 12, kb: ["FA"]}),
});
