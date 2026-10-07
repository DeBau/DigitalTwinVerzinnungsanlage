// Vorlage Stromlaufplan (Steuerstromkreis zwischen L+ und M) mit den Gruppen Steuerstromkreis und Geräte/SPS.
// Kontakte, Spulen und Taster bilden Strompfade: eine Ablaufkette (editor/kette.js), die oben an L+ und unten
// an M andockt. Die Schaltzeichen kommen aus symbole/iec60617.js (gemeinsam mit dem Schaltplan).
// Geräte und SPS stehen in elektro-geraete.js.
import { kasten, kreis, linie, nummer, text, wirklinie } from '../../symbole/grund.js';
import { SYM } from '../../symbole/iec60617.js';
import { ED } from '../status.js';
import { registriereBauteile, registriereGruppe, registriereVorlage } from '../registry.js';
import { portsOf, simOn, virtuelleSchienen } from '../bauteile.js';
import { gruppenId } from '../bausteine.js';
import { pageCount } from '../zeichnen.js';
import { kennzeichen, kontaktAnschluss, kontaktNummern, merkeOrdnung } from './elektro-kennzeichen.js';
import { autoLeitungSVG, kennzeichenSVG, merkePfade, pfadKlick, pfadKnopf, pfadNummer, pfadX, stromlaufBlatt } from './elektro-pfade.js';
import { spiegelSVG } from './elektro-spiegel.js';
import { STROM_ANLEITUNG, simKnopf, simUnten, simWechsel, simZusatz, stromSVG } from './elektro-simulation.js';

/* ---------- Vorlage ---------- */
// Haken hintergrund: Ordnungsziffern und Kennzeichen-Seiten merken (vor dem Zeichnen der Glieder), in der Simulation
// den Stromfluss unterlegen, automatische Leitungen
export function stromlaufHintergrund(d, cs){
  merkeOrdnung(d); merkePfade(d);
  if (!simOn() || !ED.svg) return autoLeitungSVG(d, cs) + spiegelSVG(d);
  const objs = Object.fromEntries((d.o || []).map(o => [o.id, o]));
  virtuelleSchienen("stromlauf", pageCount("stromlauf", d)).forEach(r => { objs[r.id] = r; });
  return stromSVG(d, cs, objs) + autoLeitungSVG(d, cs) + spiegelSVG(d);
}
registriereVorlage("stromlauf", {
  n: "Stromlaufplan", d: "Steuerstromkreis zwischen L+ und M: Taster, Not-Halt, SPS, Sicherheitsrelais",
  gruppen: ["elektro", "geraete", "leistung"], schienen: [["L+", 70, 40, 935], ["M", 590, 40, 935]],
  body: stromlaufBlatt,
  // Haken hintergrund: Ordnungsziffern merken (vor dem Zeichnen der Kontakte), automatische Leitungen
  hintergrund: stromlaufHintergrund,
  werkzeugleiste: {get nachVerbinden(){ return simKnopf() + pfadKnopf(); }},
  anleitung: () => ED.tool === "sim" ? STROM_ANLEITUNG : null,
  werkzeugWechsel: simWechsel,
  zeiger: {unten: simUnten},
  klick: pfadKlick,   // Knopf „Breite Pfade“
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
// Mittellinie (weicht es aus, steht es rechts, elektro-pfade.js), kontakt = "no" oder "nc" (Anschlussnummern mit
// Ordnungsziffer), kb = Kennbuchstaben für Vorschläge
export function glied(n, lbl, bild, an, z = {}){
  const {links = 34, kontakt, kb} = z, nummern = o => kontakt ? kontaktNummern(o) : an;
  return {...STROMPFAD, n, lbl, links, kontakt, kennbuchstaben: kb, zusatz: simZusatz,
    anschluesse: [[an[0], 0, 0, "u"], [an[1], 0, 60, "d"]],
    anschlussName: kontakt ? kontaktAnschluss : undefined,
    zeichne: o => bild(o.x, o.y, {an: nummern(o)}) + kennzeichenSVG(o, links)};
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

// Not-Halt zweikanalig: ein Pilztaster, zwei Öffner 11/12 (auf der Mittellinie) und 21/22 (30 rechts daneben),
// beide über die Wirklinie betätigt. Kanal 1 hängt im Strompfad, Kanal 2 wird verdrahtet (z. B. S21/S22 am
// Sicherheitsrelais). Raste und Zwangsöffnung zeichnet der Editor nicht (Geometrie ohne Normblatt unklar).
const notHalt2 = (x, y) => SYM.nh.zeichne(x, y, {an: ["11", "12"]}) + SYM.nc.zeichne(x + 30, y, {an: ["21", "22"]})
  + wirklinie(`M${x + 5} ${y + 29}H${x + 35}`);
const NOT_HALT_2 = {...glied("Not-Halt zweikanalig", "−SF0", notHalt2, ["11", "12"], {links: 40, kb: ["SF"]}), w: 90, bx: -40,
  anschluesse: [["11", 0, 0, "u"], ["12", 0, 60, "d"], ["21", 30, 0, "u"], ["22", 30, 60, "d"]]};
// Hilfsöffner 95/96 des Motorschutzschalters, betätigt vom Überlastauslöser (Kasten I>); in der Simulation auslösbar
const motorschutzOeffner = (x, y, g) => SYM.nc.zeichne(x, y, g) + wirklinie(`M${x + 5} ${y + 29}H${x - 24}`)
  + kasten(x - 42, y + 22, 18, 14) + text(x - 33, y + 32.5, "I>", {a: "middle", g: 8, w: 600});
const SPULE = ["QA", "KF", "MB"], TASTER = ["SF"], GEBER = ["BG"];
registriereBauteile({
  no: glied("Schließer", "−QA1", SCHALTZEICHEN("no"), ["13", "14"], {links: 20, kontakt: "no", kb: SPULE}),
  nc: glied("Öffner", "−QA1", SCHALTZEICHEN("nc"), ["11", "12"], {links: 20, kontakt: "nc", kb: SPULE}),
  coil: glied("Spule / Schütz", "−QA1", SCHALTZEICHEN("coil"), ["A1", "A2"], {links: 22, kb: SPULE}),
  lamp: glied("Meldeleuchte", "−PF1", SCHALTZEICHEN("lamp"), ["X1", "X2"], {links: 20, kb: ["PF"]}),
  tno: glied("Taster Schließer", "−SF1", SCHALTZEICHEN("tno"), ["13", "14"], {kontakt: "no", kb: TASTER}),
  tnc: glied("Taster Öffner", "−SF2", SCHALTZEICHEN("tnc"), ["11", "12"], {kontakt: "nc", kb: TASTER}),
  estop: glied("Not-Halt (Pilztaster)", "−SF0", SCHALTZEICHEN("nh"), ["11", "12"], {links: 40, kontakt: "nc", kb: TASTER}),
  estop2: NOT_HALT_2,
  key: glied("Schlüsselschalter", "−SF3", SCHALTZEICHEN("key"), ["13", "14"], {links: 44, kontakt: "no", kb: TASTER}),
  lsw: glied("Positionsschalter", "−BG1", positionsschalter, ["13", "14"], {links: 32, kontakt: "no", kb: GEBER}),
  sens: {...glied("Näherungsschalter PNP", "−BG2", naeherungsschalter, ["BN", "BU"], {links: 20, kb: GEBER}), w: 56,
    anschluesse: [["BN", 0, 0, "u"], ["BU", 0, 60, "d"], ["BK", 30, 30, "r"]]},
  mbv: glied("Ventilspule", "−MB1", SCHALTZEICHEN("mbv"), ["A1", "A2"], {links: 22, kb: ["MB"]}),
  msk: glied("Motorschutz Hilfsöffner", "−FA1", motorschutzOeffner, ["95", "96"], {links: 48, kb: ["FA", "QA"]}),
  term: glied("Klemme", "−X1:1", klemme, ["1", "2"], {links: 10}),
  fuse: glied("Sicherung", "−FA2", SCHALTZEICHEN("sicherung"), ["1", "2"], {links: 12, kb: ["FA"]}),
});
