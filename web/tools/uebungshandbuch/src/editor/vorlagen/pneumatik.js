// Vorlage Pneumatikschaltplan nach ISO 1219 mit Simulation. Bauteile mit Anschlüssen werden Anschluss für Anschluss
// verdrahtet. Symbole: pneumatik-symbole.js (Wegeventile, Zylinder) und pneumatik-geraete.js (alle anderen),
// Simulation: pneumatik-simulation.js. Hier stehen nur die Anmeldungen: Vorlage, Gruppe, Bauteile, Palettenvarianten.
import { IC } from '../../app/basis.js';
import { ED } from '../status.js';
import { BAUSTEIN, art, fuelle, registriereBauteile, registriereGruppe, registriereVorlage } from '../registry.js';
import { TX, grid } from '../vorlagen-svg.js';
import { DIRV, portsOf } from '../bauteile.js';
import { signalFeld } from '../signalfeld.js';
import { listenFeld } from '../eigenschaften.js';
import { VALVE, betaetigung, cylinder, drawValve, entlueftung, istSpule, rechteStellung, steuerNr, vPairs } from './pneumatik-symbole.js';
import { GERAET } from './pneumatik-geraete.js';
import { SIM_ANLEITUNG, simulationKlick, simulationWechsel } from './pneumatik-simulation.js';

registriereVorlage("pneumatik", {
  n: "Pneumatikschaltplan", d: "Zylinder, Wegeventile, Drosseln nach ISO 1219, mit Simulation", gruppen: ["pneu"],
  body: () => grid(10, "#EEF1F3", 15, 15, 985, 630)
    + TX(25, 33, 10, "Energiefluss von unten nach oben: Versorgung unten, Ventile in der Mitte, Antriebe oben", "start"),
  werkzeugleiste: {nachVerbinden: `<button type="button" class="tool" data-tool="sim" `
    + `title="Ventile per Klick schalten, Druck und Zylinderbewegung ansehen">${IC.play}Simulation</button>`},
  anleitung: () => ED.tool === "sim" ? SIM_ANLEITUNG : null,
  werkzeugWechsel: simulationWechsel,
  zeiger: {unten: simulationKlick},
});
registriereGruppe("pneu", {name: "Pneumatik nach ISO 1219",
  hinweis: "Ventile, Zylinder und Quelle setzen, mit Verbinden die Leitungen von Anschluss zu Anschluss ziehen. "
    + "Mit Andocken rastet ein Bauteil über einem freien Anschluss eines anderen ein und ist gleich verbunden. "
    + "Freie Entlüftungen 3 und 5 bekommen ihr Dreieck selbst. Mit Simulation die Ventilbetätigung links oder rechts anklicken.",
  andocke: andockeAnschluss});

/* ---------- Andocken über Anschlüsse ---------- */
// Ein freier Anschluss von o liegt einem freien, entgegengesetzt gerichteten Anschluss eines anderen Bauteils gegenüber:
// o rückt auf dessen Flucht, beim Loslassen entsteht die Leitung pa → pb (Haken andocke der Gruppe).
export function andockeAnschluss(o, andere){
  let best = null;
  portsOf(o).filter(q => anschlussFrei(o.id, q.n)).forEach(q => andere.forEach(p => portsOf(p).forEach(r => {
    const k = andockAbstand(q, r);
    if (k && anschlussFrei(p.id, r.n) && (!best || k.d < best.d)) best = {a: p.id, pa: r.n, b: o.id, pb: q.n, ...k};
  })));
  return best;
}
export const anschlussFrei = (id, n) => !ED.data.c.some(c => (c.a === id && c.pa === n) || (c.b === id && c.pb === n));
export const GEGENUEBER = {u: "d", d: "u", l: "r", r: "l"};
// Anschluss q (bewegt) gegenüber r: 20 bis 120 in Richtung von q, höchstens 20 daneben. Ergebnis {d, sx, sy} oder null
export function andockAbstand(q, r){
  if (GEGENUEBER[q.d] !== r.d) return null;
  const [dx, dy] = DIRV[q.d], weg = (r.x - q.x) * dx + (r.y - q.y) * dy, quer = dx ? r.y - q.y : r.x - q.x;
  if (weg < 20 || weg > 120 || Math.abs(quer) > 20) return null;
  return {d: Math.abs(quer) + weg / 4, sx: dx ? 0 : quer, sy: dx ? quer : 0};
}

/* ---------- Eigenschaftsfelder ---------- */
// Einträge der feldliste: [Feld, Beschriftung oder (o) → Text, Platzhalter oder Optionen, Kennbuchstaben, sichtbar(o)].
// Mit Kennbuchstaben wird das Feld ein Kennzeichenfeld mit Vorschlägen aus der Signalliste.
export function pneuFelder(o){
  const a = art(o.k);
  return a.feldliste.filter(e => !e[4] || e[4](o)).map(([f, lbl, zusatz, arten]) => {
    const text = typeof lbl === "function" ? lbl(o) : lbl;
    return arten ? signalFeld(f, text, o[f], {arten, ph: zusatz || ""}) : listenFeld(o, a, [f, text, zusatz]);
  }).join("");
}
const BETAETIGUNG_LINKS = [["mag", "Magnet"], ["magp", "Magnet vorgesteuert"], ["taster", "Taster"], ["hebel", "Hebel"]];
const RUECKSTELLUNG = [["feder", "Feder"], ["mag", "Magnet"], ["magp", "Magnet vorgesteuert"]];
const MAGNETE = [["mag", "Magnet"], ["magp", "Magnet vorgesteuert"]];
const RUECKSTELLUNG_52 = [["feder", "Feder, monostabil"], ["mag", "Magnet, bistabil"], ["magp", "Magnet vorgesteuert, bistabil"]];
const GRUNDSTELLUNG = [["nc", "gesperrt (NC, stromlos geschlossen)"], ["no", "offen (NO, stromlos offen)"]];
// Spulennamen an den Steueranschlüssen (z. B. Spule 14: −MB3), nur bei Magnetbetätigung
const SPULEN = [
  ["spl", o => `Spule ${steuerNr(o, "act")}`, "z. B. −MB3", ["MB"], o => istSpule(betaetigung(o).al)],
  ["spr", o => `Spule ${steuerNr(o, rechteStellung(o))}`, "z. B. −MB4", ["MB"], o => istSpule(betaetigung(o).ar)],
];
const ENDLAGEN = [["s1", "Sensor hintere Endlage", "z. B. −BG3", ["BG"]], ["s2", "Sensor vordere Endlage", "z. B. −BG4", ["BG"]]];
const MAGNETKOLBEN = ["mk", "Magnetkolben (für berührungslose Sensoren)", [["", "nein"], ["ja", "ja"]]];
const OEFFNUNG = ["of", "Öffnung der Drossel in %", "50"];

/* ---------- Wegeventile ---------- */
// Bauteileintrag eines Wegeventils k; Anschlüsse aus VALVE, Schaltwege aus vPairs
function ventil(k, n, w, def, feldliste, info){
  const anschluesse = () => VALVE[k].ports.map(([p, dx, d]) => [p, 70 + dx, d === "u" ? 0 : 60, d]);
  return {g: "pneu", n, lbl: "−MB1", hide: true, w, h: 60, def, anschluesse, info, kennbuchstaben: ["MB", "QM"],
    feldliste: [...feldliste, ...SPULEN], felder: pneuFelder, umbau: ["al", "ar", "gs"],
    sim: (o, s) => ({pairs: vPairs(o, s || VALVE[k].grund)}), zeichne: o => drawValve(o), zusatz: entlueftung};
}
const NC_NO = [["gs", "Grundstellung", GRUNDSTELLUNG], ["al", "Betätigung links", BETAETIGUNG_LINKS],
  ["ar", "Rückstellung rechts", RUECKSTELLUNG]];
registriereBauteile({
  src: {g: "pneu", n: "Druckluftquelle", lbl: "", w: 30, h: 40, anschluesse: [["1", 15, 0, "u"]], sim: () => ({src: ["1"]}),
    zeichne: GERAET.src},
  frl: {g: "pneu", n: "Wartungseinheit", lbl: "−AZ1", w: 50, h: 60, anschluesse: [["1", 20, 60, "d"], ["2", 20, 0, "u"]],
    sim: () => ({pairs: [["1", "2"]]}), zeichne: GERAET.frl},
  v22: ventil("v22", "2/2-Wegeventil", 140, {al: "mag", ar: "feder", gs: "nc"}, NC_NO, "Zwei Anschlüsse, zwei Stellungen: "
    + "Durchgang von 1 nach 2 oder gesperrt. Kein Entlüftungsanschluss, die Leitung hinter dem Ventil bleibt beim Sperren "
    + "unter Druck. An der Anlage: Luftmesser −MB14, Ausblasdüse −MB16, Frischwasser −MB17 (stromlos geschlossen)."),
  v32: ventil("v32", "3/2-Wegeventil", 140, {al: "mag", ar: "feder", gs: "nc"}, NC_NO),
  v52: ventil("v52", "5/2-Wegeventil", 140, {al: "mag", ar: "feder"}, [["al", "Betätigung links", BETAETIGUNG_LINKS],
    ["ar", "Betätigung rechts", RUECKSTELLUNG_52]]),
  v53: ventil("v53", "5/3-Wegeventil", 180, {al: "mag", ar: "mag"}, [["al", "Betätigung links", MAGNETE],
    ["ar", "Betätigung rechts", MAGNETE]]),
});
/* Palette: Ventil-Varianten als Voreinstellungen eines Grundtyps */
export const PCPAL = {
  v22nc: {g: "pneu", n: "2/2-Wegeventil gesperrt, Magnet/Feder", mk: {k: "v22", gs: "nc", al: "mag", ar: "feder"}},
  v22no: {g: "pneu", n: "2/2-Wegeventil offen, Magnet/Feder", mk: {k: "v22", gs: "no", al: "mag", ar: "feder"}},
  v32nc: {g: "pneu", n: "3/2-Wegeventil gesperrt, Magnet/Feder", mk: {k: "v32", gs: "nc", al: "mag", ar: "feder"}},
  v32no: {g: "pneu", n: "3/2-Wegeventil offen, Magnet/Feder", mk: {k: "v32", gs: "no", al: "mag", ar: "feder"}},
  v32h: {g: "pneu", n: "3/2-Wegeventil Taster/Feder", mk: {k: "v32", gs: "nc", al: "taster", ar: "feder"}},
  v52m: {g: "pneu", n: "5/2-Wegeventil monostabil", mk: {k: "v52", al: "mag", ar: "feder"}},
  v52b: {g: "pneu", n: "5/2-Wegeventil bistabil (Impuls)", mk: {k: "v52", al: "mag", ar: "mag"}},
  v52p: {g: "pneu", n: "5/2 vorgesteuert, monostabil", mk: {k: "v52", al: "magp", ar: "feder"}},
  v52pb: {g: "pneu", n: "5/2 vorgesteuert, bistabil", mk: {k: "v52", al: "magp", ar: "magp"}},
  v53c: {g: "pneu", n: "5/3-Wegeventil Mitte gesperrt", mk: {k: "v53", al: "mag", ar: "mag"}},
};
fuelle(BAUSTEIN, PCPAL);   // Varianten stehen in der Palette vor den Zylindern

/* ---------- Antriebe und weitere Bauteile ---------- */
const durchgang = (lbl, w, n, zeichne, extra = {}) => ({g: "pneu", n, lbl, w, h: 60, zeichne,
  anschluesse: [["1", w === 30 ? 15 : 20, 60, "d"], ["2", w === 30 ? 15 : 20, 0, "u"]], ...extra});
const anzeige = (lbl, w, n, zeichne, info) => ({g: "pneu", n, lbl, w, h: 60, info, zeichne,
  anschluesse: [["1", 20, 60, "d"]], sim: () => ({})});
const logik = (n, info, sim, zeichne) => ({g: "pneu", n, lbl: "", w: 60, h: 60, info, sim, zeichne,
  anschluesse: [["1", 8, 60, "d"], ["3", 52, 60, "d"], ["2", 30, 0, "u"]]});
const zylinder = (n, anschluesse, feldliste, einfach) => ({g: "pneu", n, lbl: "−MM1", w: 240, h: 60, def: {s1: "", s2: ""},
  anschluesse, kennbuchstaben: ["MM"], feldliste, felder: pneuFelder, zeichne: o => cylinder(o, einfach)});
const DAEMPFUNG = ["dp", "Endlagendämpfung", [["", "ohne"], ["fest", "beidseitig fest"], ["einst", "beidseitig einstellbar"]]];
registriereBauteile({
  zyl2: zylinder("Zylinder doppeltwirkend", [["A", 10, 60, "d"], ["B", 110, 60, "d"]], [...ENDLAGEN, DAEMPFUNG, MAGNETKOLBEN], false),
  zyl1: zylinder("Zylinder einfachwirkend mit Feder", [["A", 10, 60, "d"]], [...ENDLAGEN, MAGNETKOLBEN], true),
  rot: {g: "pneu", n: "Schwenkantrieb", lbl: "−MM5", w: 60, h: 60, anschluesse: [["A", 20, 60, "d"], ["B", 40, 60, "d"]],
    kennbuchstaben: ["MM"], feldliste: ENDLAGEN, felder: pneuFelder, zeichne: GERAET.rot},
  drv: durchgang("−RZ1", 50, "Drossel­rückschlag­ventil", GERAET.drv, {feldliste: [OEFFNUNG], sim: () => ({pairs: [["1", "2"]]}),
    info: "Frei von 1 nach 2 (Kugel hebt ab), gedrosselt von 2 nach 1. Mit 1 zum Ventil und 2 zum Zylinder: "
      + "Abluftdrosselung, der Normalfall. Um 180° gedreht: Zuluftdrosselung."}),
  dr: durchgang("−RZ2", 30, "Drosselventil einstellbar", GERAET.dr, {feldliste: [OEFFNUNG], sim: () => ({pairs: [["1", "2"]]})}),
  rv: durchgang("−RM1", 30, "Rückschlagventil", GERAET.rv, {sim: (o, s, has) => ({dir: has("1") ? [["1", "2"]] : []})}),
  /* Weitere Symbole der Anlage und Klassiker der Ausbildung */
  kh: durchgang("−QM10", 50, "Absperrventil (Kugelhahn)", GERAET.kh, {def: {zu: "auf"},
    info: "Handbetätigtes Absperrventil in der Zuleitung vor der Wartungseinheit. In der Simulation per Klick auf- und zudrehen.",
    feldliste: [["zu", "Stellung", [["auf", "offen"], ["zu", "geschlossen"]]]],
    sim: (o, s) => ({pairs: (s || o.zu || "auf") === "auf" ? [["1", "2"]] : []})}),
  mano: anzeige("", 40, "Manometer", GERAET.mano),
  ds: anzeige("−BP1", 70, "Druckschalter (pneumatisch-elektrisch)", GERAET.ds, "Meldet der SPS, dass der Druck einen "
    + "einstellbaren Wert überschritten hat, z. B. Druckluft vorhanden hinter der Wartungseinheit. Ausgang ist ein elektrischer Kontakt."),
  duese: anzeige("", 40, "Blasdüse", GERAET.duese, "Verbraucher hinter einem 2/2-Wegeventil: Luftmesser −MB14 "
    + "(bläst das Wasser vom Korb) und Ausblasdüse −MB16 (n.i.O.-Teile)."),
  wv: logik("Wechselventil (ODER)", "ODER-Glied: Druck an 1 ODER 3 gelangt nach 2. Die Kugel sperrt jeweils den anderen Eingang, "
    + "keine Luft entweicht rückwärts.", (o, s, has) => ({dir: ["1", "3"].filter(has).map(p => [p, "2"])}), GERAET.wv),
  zd: logik("Zweidruckventil (UND)", "UND-Glied: Nur wenn an 1 UND 3 Druck anliegt, gelangt Luft nach 2.",
    (o, s, has) => ({dir: has("1") && has("3") ? [["1", "2"], ["3", "2"]] : []}), GERAET.zd),
  se: {g: "pneu", n: "Schnell­entlüftungs­ventil", lbl: "−RM2", w: 60, h: 60, anschluesse: [["1", 20, 60, "d"], ["2", 20, 0, "u"]],
    info: "Direkt am Zylinder: Beim Entlüften strömt die Luft über 3 ins Freie statt den langen Weg zurück durchs Wegeventil. "
      + "Der Zylinder fährt schneller zurück.", sim: (o, s, has) => ({dir: has("1") ? [["1", "2"]] : []}), zeichne: GERAET.se},
  insel: {g: "pneu", n: "Ventilinsel (Baugruppenrahmen)", lbl: "−QM1", w: 360, h: 120, rahmen: true, kennbuchstaben: ["QM"],
    umriss: o => ({x: o.x, y: o.y, w: +o.fw || 360, h: +o.fh || 120}), def: {fw: "360", fh: "120"},
    info: "Strichpunktierter Rahmen um die Ventile einer Ventilinsel, z. B. −QM1 Portal und −QM2 Band. Breite und Höhe links "
      + "einstellen; die Ventile darin bleiben anklickbar.",
    feldliste: [["fw", "Breite"], ["fh", "Höhe"]], zeichne: GERAET.insel},
  sd: {g: "pneu", n: "Schalldämpfer", lbl: "", w: 24, h: 34, anschluesse: [["1", 12, 0, "u"]], zeichne: GERAET.sd},
});
