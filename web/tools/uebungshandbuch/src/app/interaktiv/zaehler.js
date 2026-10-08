/* ---------- Interaktive Erklärung: IEC-Zähler CTU, CTD und CTUD ---------- */
// Platzhalter: <div data-interaktiv="zaehler" data-art="CTU,CTD,CTUD" data-cu="BG13" data-cd="BG22" data-r="SF4" data-ld="SF5"
//   data-pv="5" data-q="statFull" data-qd="statEmpty" data-cv="#statCount" data-inst="#instCounter"
//   data-scu="#cu" data-scd="#cd" data-sr="#reset" data-sld="#load" data-sq="#statFull" data-sqd="#statEmpty"></div>
// art: eine oder mehrere Zählerarten (mehrere: Umschalter). cu, cd, r, ld, q, qd: Operanden im Bild (qd nur CTUD),
// pv: Vorgabewert. Optional: cv Operand an CV, inst Name der Multiinstanz, s… Namen in SCL.
// Jeder Klick ist ein Aufruf des Zählers (ein Zyklus, Modell: zaehler-modell.js). Gezeigt werden Zählerstand, Box in
// FUP und KOP im Programmstatus, SCL-Aufruf mit Status, ein Satz zum Verhalten und der Signalverlauf mit CV je Aufruf.
import { iaKurz, iaName, iaRegistrieren, iaSignalKnopf } from './basis.js';
import { signalverlaufZahlenSVG } from './signalverlauf.js';
import { bxFupSVG, bxKopSVG, bxLampe, bxSclHTML, bxTabs } from './box-bild.js';
import { ZL_ARTEN, ZL_INT, zlAufruf, zlAusgaenge, zlModell, zlPv, zlSetze, zlTippen } from './zaehler-modell.js';

const ZZ_NAME = {CTU: "Vorwärts zählen", CTD: "Rückwärts zählen", CTUD: "Vorwärts und rückwärts zählen"};
// Eingänge und Ausgänge je Art in der Reihenfolge der Box; der erste Eingang ist in KOP der Stromeingang
const ZZ_PINS = {
  CTU: {ein: ["cu", "r"], aus: ["q"]},
  CTD: {ein: ["cd", "ld"], aus: ["q"]},
  CTUD: {ein: ["cu", "cd", "r", "ld"], aus: ["qu", "qd"]},
};
const ZZ_ANSICHTEN = ["FUP", "KOP", "SCL"];
const zzZahl = n => String(n).replace("-", "−");

function zaehlerNeu(at){
  const arten = (at.art || "CTU").split(",").filter(a => ZL_ARTEN.includes(a));
  const n = {cu: at.cu || "CU", cd: at.cd || "CD", r: at.r || "R", ld: at.ld || "LD", qu: at.q || "Q", qd: at.qd || "QD", cv: at.cv || ""};
  n.q = n.qu;
  const s = k => at["s" + k] || `"${n[k]}"`;
  // Ohne sq, sqd und cv entfallen die Ausgänge im Aufruf; man liest sie dann als #inst….Q, .QU, .QD bzw. .CV
  const scl = {cu: s("cu"), cd: s("cd"), r: s("r"), ld: s("ld"), qu: at.sq || "", qd: at.sqd || "", cv: n.cv};
  scl.q = scl.qu;
  const pv = at.pv !== undefined && Number.isFinite(+at.pv) ? +at.pv : 5;
  return {arten, n, scl, inst: at.inst || "#instCounter", m: zlModell(arten[0] || "CTU", pv), ansicht: "FUP"};
}

/* ---------- Satz zum Verhalten ---------- */
const zzEin = m => ZZ_PINS[m.art].ein.filter(k => k === "cu" || k === "cd").map(k => k.toUpperCase()).join(" oder ");
const ZZ_SATZ = {
  start: m => `CV = ${zzZahl(m.cv)}. Klicke auf ${zzEin(m)}: Mit der steigenden Flanke zählt der Zähler um 1.`,
  hoch: m => `Steigende Flanke an CU: CV wird um 1 erhöht auf ${zzZahl(m.cv)}.`,
  runter: m => `Steigende Flanke an CD: CV wird um 1 verringert auf ${zzZahl(m.cv)}.`,
  gehalten: m => `${m.cu ? "CU" : "CD"} ist noch 1, aber es gibt keine neue steigende Flanke. CV bleibt ${zzZahl(m.cv)}. Halten zählt nur einmal.`,
  ruhe: m => `Keine steigende Flanke an ${zzEin(m)}: CV bleibt ${zzZahl(m.cv)}.`,
  beide: m => `In diesem Aufruf kamen steigende Flanken an CU und an CD: CV bleibt unverändert ${zzZahl(m.cv)}.`,
  grenze: m => `CV = ${zzZahl(m.cv)} ist die Grenze von Int (−32768 bis 32767). Weitere Flanken ändern CV nicht, der Zähler läuft nicht über.`,
  reset: m => `R ist 1: CV = 0. Solange R 1 ist, wirken ${m.art === "CTUD" ? "CU, CD und LD" : "die Flanken an CU"} nicht.`,
  geladen: m => `Steigende Flanke an LD: CV wird auf PV gesetzt, CV = ${zzZahl(m.cv)}.`,
  ldHalten: m => `LD ist 1: CV bleibt ${zzZahl(m.cv)}. Solange LD 1 ist, wirken ${m.art === "CTUD" ? "CU und CD" : "die Flanken an CD"} nicht.`,
  pv: m => `PV ist jetzt ${zzZahl(m.pv)}. CV bleibt ${zzZahl(m.cv)}.`,
};
const zzVergleich = (ja, zeichen, nein) => ja ? zeichen : nein;
const ZZ_AUSGANG_SATZ = {
  CTU: (m, a) => `CV ${zzVergleich(a.q, "≥", "<")} PV (${zzZahl(m.pv)}), deshalb Q = ${a.q}.`,
  CTD: (m, a) => `CV ${zzVergleich(a.q, "≤", ">")} 0, deshalb Q = ${a.q}.`,
  CTUD: (m, a) => `CV ${zzVergleich(a.qu, "≥", "<")} PV (${zzZahl(m.pv)}), deshalb QU = ${a.qu}. CV ${zzVergleich(a.qd, "≤", ">")} 0, deshalb QD = ${a.qd}.`,
};
function zzSatzHTML(z){
  const m = z.m, a = zlAusgaenge(m), an = a.q || a.qu;
  return `<div class="ia-satz ${an ? "an" : "aus"}">${ZZ_SATZ[m.hinweis](m)} ${ZZ_AUSGANG_SATZ[m.art](m, a)}</div>`;
}

/* ---------- Bild: Box, SCL, Zählerstand ---------- */
function zzBox(z){
  const m = z.m, a = zlAusgaenge(m);
  const ein = ZZ_PINS[m.art].ein.map(k => ({pin: k.toUpperCase(), name: iaKurz(z.n[k]), wert: m[k], bool: true}));
  const ausPins = ZZ_PINS[m.art].aus.map(k => ({pin: k.toUpperCase(), name: iaKurz(z.n[k]), wert: a[k], bool: true}));
  return {inst: z.inst, titel: m.art, typ: "Int", ein: [...ein, {pin: "PV", name: zzZahl(m.pv), wert: ""}],
    aus: [...ausPins, {pin: "CV", name: z.n.cv, wert: zzZahl(m.cv)}]};
}
function zzSclHTML(z){
  const m = z.m, a = zlAusgaenge(m), bool = w => w ? "TRUE" : "FALSE", pins = ZZ_PINS[m.art];
  const verschaltet = pins.aus.filter(k => z.scl[k]);
  const teile = [...pins.ein.map(k => `${k.toUpperCase()} := ${z.scl[k]}`), `PV := ${m.pv}`, ...verschaltet.map(k => `${k.toUpperCase()} => ${z.scl[k]}`)];
  if (z.scl.cv) teile.push(`CV => ${z.scl.cv}`);
  const code = `${z.inst}(${teile.join(",\n" + " ".repeat(z.inst.length + 1))});`;
  const ausName = k => z.scl[k] || `${z.inst}.${k.toUpperCase()}`;   // nicht verschaltet: Zugriff auf die Instanz
  const status = [...pins.ein.map(k => [z.scl[k], bool(m[k]), !!m[k]]), ...pins.aus.map(k => [ausName(k), bool(a[k]), !!a[k]]),
    [z.scl.cv || `${z.inst}.CV`, zzZahl(m.cv), null]];
  return bxSclHTML(code, status) + `<p class="small muted">In SCL rufst du die Multiinstanz mit ihren Parametern auf. Eingänge schreibst du mit :=, Ausgänge mit =>.</p>`;
}
const ZZ_BILD = {FUP: z => bxFupSVG(zzBox(z)), KOP: z => bxKopSVG(zzBox(z)), SCL: zzSclHTML};
function zzStandHTML(z){
  const m = z.m, a = zlAusgaenge(m);
  const lampe = k => bxLampe(k.toUpperCase(), z.n[k], a[k]);
  return `<div class="zz-anzeige"><div class="zz-stand"><span>CV</span><b>${zzZahl(m.cv)}</b><small>PV = ${zzZahl(m.pv)}</small></div>`
    + `<div class="zz-lampen">${Object.keys(a).map(lampe).join("")}</div></div>`;
}

/* ---------- Bedienung und Signalverlauf ---------- */
const zzKnopf = (akt, t, prim) => `<button type="button" class="btn small${prim ? " primary" : ""}" data-ia-akt="${akt}">${t}</button>`;
function zzEingaengeHTML(z){
  const m = z.m;
  const knopf = k => iaSignalKnopf(`setze:${k}`, z.n[k], m[k]);
  const tippen = ZZ_PINS[m.art].ein.filter(k => k === "cu" || k === "cd").map(k => zzKnopf(`tippen:${k}`, `${k.toUpperCase()} kurz antippen`)).join("");
  return `<div class="zz-eingaenge"><div class="ia-knoepfe">${ZZ_PINS[m.art].ein.map(knopf).join("")}</div><div class="zz-tippen">${tippen}</div></div>`;
}
function zzSteuerHTML(z){
  const laden = z.m.art === "CTU" ? "" : zzKnopf(`pv:${ZL_INT.max}`, "PV = 32767");
  return `<div class="ze-steuer"><span class="small">PV:</span>${zzKnopf("pv:-1", "− 1")}${zzKnopf("pv:+1", "+ 1")}${laden}`
    + `<span class="ze-luecke"></span>${zzKnopf("zyklus", "Nächster Zyklus", true)}${zzKnopf("neu", "Neu beginnen")}</div>`;
}
function zzVerlaufHTML(z){
  const m = z.m, a = zlAusgaenge(m);
  const keys = [...ZZ_PINS[m.art].ein, ...Object.keys(a)];
  const spuren = keys.map(k => ({name: k.toUpperCase(), werte: m.verlauf.map(s => s[k])}));
  return signalverlaufZahlenSVG(spuren, {name: "CV", werte: m.verlauf.map(s => zzZahl(s.cv))}, "Aufrufe", z.breit)
    + `<p class="small muted">Jede Spalte ist ein Aufruf des Zählers (ein Zyklus). Halte CU auf 1 und klicke auf <i>Nächster Zyklus</i>: CV ändert sich nicht.</p>`;
}

/* ---------- Begriffe ---------- */
const ZZ_BEGRIFFE = [
  ["CV", "Aktueller Zählwert, hier Datentyp Int (−32768 bis 32767). An der Grenze bleibt CV stehen, der Zähler läuft nicht über."],
  ["PV", "Vorgabewert. Beim CTU ist Q = 1, wenn CV ≥ PV. Beim CTD und CTUD lädt LD den Wert PV nach CV. Beim CTUD ist QU = 1, wenn CV ≥ PV."],
  ["Q, QU, QD", "Zählerstatus. CTU: Q = 1 bei CV ≥ PV. CTD: Q = 1 bei CV ≤ 0. CTUD: QU = 1 bei CV ≥ PV, QD = 1 bei CV ≤ 0."],
  ["Flanke am Zähleingang", "Der Zähler zählt nur, wenn CU oder CD von 0 auf 1 wechselt (steigende Flanke). Dafür merkt er sich den Wert vom letzten Aufruf. Bleibt CU 1, zählt er nicht weiter. Rufe ihn deshalb in jedem Zyklus auf und verwende jeden Zähler nur an einer Stelle im Programm."],
  ["Rücksetzen (R)", "R = 1 setzt CV auf 0. Solange R 1 ist, wirken die Zähleingänge nicht."],
  ["Laden (LD)", "Wechselt LD auf 1, wird CV auf PV gesetzt. Solange LD 1 ist, wirken die Zähleingänge nicht."],
  ["Remanenz des Instanz-DB", "Als Einzelinstanz im eigenen Instanz-DB und als Multiinstanz in einem FB mit optimiertem Bausteinzugriff legt TIA die Variablen des Zählers remanent an. Remanente Werte bleiben nach einem Neustart erhalten, der Zählerstand geht also nicht verloren."],
];
function zzBegriffeHTML(){
  return `<details class="ia-begriffe"><summary>Begriffe: CV, PV, Q, Flanke am Zähleingang, Rücksetzen, Laden, Remanenz</summary><dl>`
    + ZZ_BEGRIFFE.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("") + `</dl></details>`;
}

function zaehlerHTML(z){
  const m = z.m;
  const kopf = `<div class="ia-kopf"><b>Probier es aus:</b> Klicke auf ${iaName(z.n[ZZ_PINS[m.art].ein[0]])}, halte es auf 1 oder tippe es kurz an.${bxTabs(z.arten, m.art, "art")}</div>`;
  const art = `<div class="ze-art"><b>${m.art}</b> ${ZZ_NAME[m.art]}</div>`;
  return kopf + art + `<div class="ze-oben">${zzEingaengeHTML(z)}${zzStandHTML(z)}</div>`
    + `<div class="ia-bild ze-bild">${bxTabs(ZZ_ANSICHTEN, z.ansicht, "ansicht")}${ZZ_BILD[z.ansicht](z)}</div>` + zzSatzHTML(z) + zzSteuerHTML(z)
    + `<div class="ia-verlauf"><div class="ia-verlauf-kopf"><b>Signalverlauf</b></div>${zzVerlaufHTML(z)}</div>` + zzBegriffeHTML();
}

/* ---------- Bedienen ---------- */
const ZZ_AKTION = {
  setze: (z, k) => zlSetze(z.m, k, z.m[k] ? 0 : 1),
  tippen: (z, k) => zlTippen(z.m, k),
  zyklus: z => zlAufruf(z.m),
  pv: (z, w) => zlPv(z.m, w === String(ZL_INT.max) ? ZL_INT.max : z.m.pv + +w),
  neu: z => { z.m = zlModell(z.m.art, z.m.pv); },
  art: (z, w) => { z.m = zlModell(w, z.m.pv); },
  ansicht: (z, w) => { z.ansicht = w; },
};
iaRegistrieren("zaehler", {
  titel: "Zähler",
  neu: zaehlerNeu,
  html: zaehlerHTML,
  aktion: (z, akt) => { const [name, wert] = akt.split(":"); ZZ_AKTION[name](z, wert); },
});
