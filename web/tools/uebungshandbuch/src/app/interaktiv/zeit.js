/* ---------- Interaktive Erklärung: IEC-Zeiten TP, TON, TOF und TONR ---------- */
// Platzhalter: <div data-interaktiv="zeit" data-art="TON,TOF,TP,TONR" data-in="BG40" data-q="statBathReady" data-pt="2000"
//   data-sin="#in" data-sq="#q" data-inst="#instBathReadyDelay" data-et="#statElapsed" data-r="SF4" data-sr="#reset"></div>
// art: eine oder mehrere Zeitarten (mehrere: Umschalter). in, q: Operanden im Bild, pt: Vorgabezeit in ms.
// Optional: sin, sq Namen in SCL; inst Name der Multiinstanz; et Operand an ET; r, sr Operand an R (nur TONR).
// IN anklicken oder kurz antippen; die Zeit läuft dann in echter Zeit (Zeitmodell: zeit-modell.js). Gezeigt werden
// die Box in FUP und KOP im Programmstatus, der SCL-Aufruf mit Status, ET als Balken, ein Satz zum Verhalten und der
// Signalverlauf mit ET als Rampe. Der Zeitgeber endet, sobald die Erklärung nicht mehr auf der Seite steht.
import { iaKurz, iaName, iaRegistrieren, iaSignalKnopf, iaZeichnen } from './basis.js';
import { zeitverlaufWertSVG } from './signalverlauf.js';
import { bxFupSVG, bxKopSVG, bxLampe, bxSclHTML, bxTabs } from './box-bild.js';
import { ZE_ARTEN, zeEt, zeEtVerlauf, zeLaufen, zeModell, zeR, zeRuht, zeTippen, zeUmschalten } from './zeit-modell.js';

const ZT_NAME = {TP: "Impuls erzeugen", TON: "Einschaltverzögerung erzeugen", TOF: "Ausschaltverzögerung erzeugen", TONR: "Zeit akkumulieren"};
const ZT_PT = [1000, 2000, 3000, 5000];
const ZT_TIPPEN = 500;                 // „kurz antippen“: IN so lange 1 (ms)
const ZT_TAKT = 50;                    // Abspielen in echter Zeit: alle 50 ms um 50 ms weiter
const ZT_ANSICHTEN = ["FUP", "KOP", "SCL"];
const ZT_UHR = new Map();

/* ---------- Zeiten als Text ---------- */
// Wie die TIA-Hilfe beim Datentyp TIME: T#2s, T#500ms, T#1s_200ms
const ZT_EINHEITEN = [["d", 86400000], ["h", 3600000], ["m", 60000], ["s", 1000], ["ms", 1]];
function ztTime(ms){
  let rest = Math.round(ms);
  const teile = [];
  for (const [e, n] of ZT_EINHEITEN) { const k = Math.floor(rest / n); rest -= k * n; if (k) teile.push(k + e); }
  return "T#" + (teile.join("_") || "0ms");
}
const ztSek = ms => `${(Math.round(ms / 100) / 10).toLocaleString("de-DE")} s`;

// Ausdruck statt Operand: enthält Leerzeichen, # oder Klammern. Der Knopf heißt dann „IN (Bedingung)“.
const ztAusdruck = t => /[\s#()]/.test(t);
const ztInKnopf = z => ztAusdruck(z.n.in) ? "IN (Bedingung)" : z.n.in;

function zeitNeu(at){
  const arten = (at.art || "TON").split(",").filter(a => ZE_ARTEN.includes(a));
  const pt = +at.pt > 0 ? +at.pt : 2000;
  const n = {in: at.in || "IN", q: at.q || "Q", r: at.r || "R", et: at.et || ""};
  // Ohne sq und et entfallen Q => und ET => im Aufruf; man liest sie dann als #inst….Q bzw. #inst….ET
  // in darf auch ein Ausdruck sein (z. B. „#temperatureOk AND #levelOk“): In SCL steht er ohne Anführungszeichen
  const scl = {in: at.sin || (ztAusdruck(n.in) ? n.in : `"${n.in}"`), q: at.sq || "", r: at.sr || `"${n.r}"`, et: at.et || ""};
  return {arten, n, scl, inst: at.inst || "#instTimer", pts: [...new Set([...ZT_PT, pt])].sort((a, b) => a - b),
    m: zeModell(arten[0] || "TON", pt), ansicht: "FUP", laeuft: false, ruhe: 0};
}

/* ---------- Abspielen ---------- */
const ztFenster = m => Math.max(8000, 4 * m.pt);
function ztAnhalten(z){ clearInterval(ZT_UHR.get(z.id)); ZT_UHR.delete(z.id); z.laeuft = false; }
// Ein Takt: Zeit weiter; ruht die Zeit ein ganzes Fenster lang, hält das Abspielen von selbst an
function ztTakt(z){
  zeLaufen(z.m, ZT_TAKT);
  z.ruhe = zeRuht(z.m) ? z.ruhe + ZT_TAKT : 0;
  if (z.ruhe > ztFenster(z.m)) ztAnhalten(z);
  if (!iaZeichnen(z.id)) ztAnhalten(z);
}
function ztAbspielen(z){
  if (z.laeuft) return;
  z.laeuft = true; z.ruhe = 0;
  ZT_UHR.set(z.id, setInterval(() => ztTakt(z), ZT_TAKT));
}

/* ---------- Satz zum Verhalten ---------- */
// Je Art eine Liste [Bedingung, Text]; es gilt die erste passende Zeile
const ZT_SATZ = {
  TON: [
    [(m) => !m.in && m.hinweis === "abbruch", (m) => `IN war nur ${ztSek(m.vorherDauer)} lang 1 und ist vor Ablauf von PT wieder 0 geworden. Die Zeit ist zurückgesetzt: ET = T#0ms, Q blieb 0. Erst die nächste steigende Flanke an IN startet sie neu.`],
    [(m) => m.in && m.lauf, (m, et) => `IN ist seit ${ztSek(m.t - m.inSeit)} 1. ET = ${ztSek(et)} ist kleiner als PT = ${ztSek(m.pt)}, deshalb bleibt Q = 0.`],
    [(m) => m.in, (m) => `IN ist seit ${ztSek(m.t - m.inSeit)} 1. ET hat PT erreicht und bleibt bei ${ztTime(m.pt)} stehen. Q = 1, solange IN 1 bleibt.`],
    [() => true, () => "IN ist 0, deshalb Q = 0 und ET = T#0ms. Die steigende Flanke an IN startet die Zeit. Wird IN 0, sind Q und ET sofort wieder 0."],
  ],
  TP: [
    [(m) => m.lauf && m.hinweis === "nachtriggern", (m, et) => `Der Impuls läuft, ET = ${ztSek(et)}. Die neue steigende Flanke an IN eben hatte keine Wirkung: Ein TP lässt sich nicht nachtriggern, Q bleibt genau PT = ${ztSek(m.pt)} lang 1.`],
    [(m) => m.lauf, (m, et) => `Der Impuls läuft: Q = 1, bis ET = PT (${ztSek(m.pt)}) erreicht ist, egal was IN macht. ET = ${ztSek(et)}.`],
    [(m) => m.in && m.et > 0, (m) => `PT ist abgelaufen, deshalb Q = 0. IN ist noch 1, deshalb bleibt ET bei ${ztTime(m.pt)} stehen. Einen neuen Impuls startet erst die nächste steigende Flanke an IN.`],
    [() => true, (m) => `Q = 0, ET = T#0ms. Eine steigende Flanke an IN startet einen Impuls: Q wird für PT = ${ztSek(m.pt)} 1, egal wie lange IN 1 bleibt.`],
  ],
  TOF: [
    [(m) => m.in && m.hinweis === "wieder", () => "IN ist wieder 1 geworden, bevor PT abgelaufen war: Die Zeit ist zurückgesetzt (ET = T#0ms), Q blieb ohne Unterbrechung 1."],
    [(m) => m.in, () => "IN ist 1, deshalb Q = 1 und ET = T#0ms. Die Zeit startet erst mit der fallenden Flanke an IN."],
    [(m) => m.lauf, (m, et) => `IN ist seit ${ztSek(m.t - m.inSeit)} 0. ET = ${ztSek(et)} ist kleiner als PT = ${ztSek(m.pt)}, deshalb bleibt Q = 1.`],
    [(m) => m.et > 0, (m) => `PT ist abgelaufen, deshalb Q = 0. ET bleibt bei ${ztTime(m.pt)} stehen, bis IN wieder 1 wird.`],
    [() => true, () => "IN ist 0 und Q = 0. Schalte IN ein: Q wird sofort 1. Die Zeit läuft erst, wenn IN wieder 0 wird."],
  ],
  TONR: [
    [(m) => m.r, () => "R ist 1: ET und Q sind zurückgesetzt. Flanken an IN werden nicht beachtet. R = 0 gibt die Zeitmessung wieder frei."],
    [(m) => m.q, (m) => `ET hat PT = ${ztSek(m.pt)} erreicht, deshalb Q = 1. Q bleibt 1, auch wenn IN 0 wird. Nur R setzt ET und Q zurück.`],
    [(m) => m.lauf, (m, et) => `IN ist 1, die Zeit läuft: ET = ${ztSek(et)} ist kleiner als PT = ${ztSek(m.pt)}, deshalb Q = 0.`],
    [(m) => m.et > 0, (m) => `IN ist 0: Die Zeit steht, ET behält ${ztSek(m.et)}. Wird IN wieder 1, läuft sie ab diesem Wert weiter.`],
    [() => true, () => "IN ist 0, ET = T#0ms. Schalte IN ein: Die Zeit sammelt, solange IN 1 ist."],
  ],
};
function ztSatzHTML(z){
  const m = z.m, et = zeEt(m);
  const [, text] = ZT_SATZ[m.art].find(([bedingung]) => bedingung(m));
  return `<div class="ia-satz ${m.q ? "an" : "aus"}"><b>Q = ${m.q}:</b> ${text(m, et)}</div>`;
}

/* ---------- Bild: Box, SCL, ET-Anzeige ---------- */
function ztBox(z){
  const m = z.m, rPin = m.art === "TONR" ? [{pin: "R", name: iaKurz(z.n.r), wert: m.r, bool: true}] : [];
  const ein = [{pin: "IN", name: iaKurz(z.n.in), wert: m.in, bool: true}, ...rPin, {pin: "PT", name: ztTime(m.pt), wert: ""}];
  const aus = [{pin: "Q", name: iaKurz(z.n.q), wert: m.q, bool: true}, {pin: "ET", name: z.n.et, wert: ztTime(zeEt(m))}];
  return {inst: z.inst, titel: m.art, typ: "Time", ein, aus};
}
function ztSclHTML(z){
  const m = z.m, bool = w => w ? "TRUE" : "FALSE";
  const teile = [`IN := ${z.scl.in}`, ...(m.art === "TONR" ? [`R := ${z.scl.r}`] : []), `PT := ${ztTime(m.pt)}`];
  if (z.scl.q) teile.push(`Q => ${z.scl.q}`);
  if (z.scl.et) teile.push(`ET => ${z.scl.et}`);
  const code = `${z.inst}(${teile.join(",\n" + " ".repeat(z.inst.length + 1))});`;
  const status = [[z.scl.in, bool(m.in), !!m.in], ...(m.art === "TONR" ? [[z.scl.r, bool(m.r), !!m.r]] : []),
    [z.scl.q || `${z.inst}.Q`, bool(m.q), !!m.q], [z.scl.et || `${z.inst}.ET`, ztTime(zeEt(m)), null]];
  return bxSclHTML(code, status) + `<p class="small muted">In SCL rufst du die Multiinstanz mit ihren Parametern auf. Eingänge schreibst du mit :=, Ausgänge mit =>.</p>`;
}
const ZT_BILD = {FUP: z => bxFupSVG(ztBox(z)), KOP: z => bxKopSVG(ztBox(z)), SCL: ztSclHTML};
function ztAnzeigeHTML(z){
  const m = z.m, et = zeEt(m), anteil = Math.round(et / m.pt * 100);
  return `<div class="ze-anzeige"><div class="ze-wert"><span>ET</span><b>${ztTime(et)}</b></div>`
    + `<div class="ze-balken" role="img" aria-label="ET ${anteil} % von PT"><i style="width:${anteil}%"></i></div>`
    + `<div class="ze-pt"><span>PT</span><b>${ztTime(m.pt)}</b></div>`
    + bxLampe("Q", z.n.q, m.q) + `</div>`;
}

/* ---------- Bedienung und Signalverlauf ---------- */
const ztKnopf = (akt, t, prim, an) => `<button type="button" class="btn small${prim ? " primary" : ""}" data-ia-akt="${akt}"${an === undefined ? "" : ` aria-pressed="${an}"`}>${t}</button>`;
function ztEingaengeHTML(z){
  const m = z.m, r = m.art === "TONR" ? iaSignalKnopf("r", z.n.r, m.r) : "";
  return `<div class="ia-knoepfe">${iaSignalKnopf("in", ztInKnopf(z), m.in)}${r}${ztKnopf("tippen", `IN kurz antippen (${ztSek(ZT_TIPPEN)})`)}</div>`;
}
function ztSteuerHTML(z){
  const uhr = z.laeuft ? ztKnopf("pause", "Anhalten") : ztKnopf("abspielen", "Abspielen", true);
  return `<div class="ze-steuer"><span class="small">PT:</span>${z.pts.map(p => ztKnopf(`pt:${p}`, ztTime(p), false, z.m.pt === p)).join("")}`
    + `<span class="ze-luecke"></span>${uhr}${ztKnopf("neu", "Neu beginnen")}<span class="ze-zeit">t = ${ztSek(z.m.t)}</span></div>`;
}
function ztVerlaufHTML(z){
  const m = z.m, fenster = ztFenster(m), bis = Math.max(fenster, m.t), von = bis - fenster;
  // Spuren heißen wie die Pins der Box, wie im Impulsdiagramm der TIA-Hilfe
  const spuren = ["in", ...(m.art === "TONR" ? ["r"] : []), "q"].map(k => ({name: k.toUpperCase(), wechsel: m.spuren[k]}));
  const wert = {name: "ET", punkte: zeEtVerlauf(m), max: m.pt, linie: {v: m.pt, text: "PT"}};
  return zeitverlaufWertSVG({spuren, wert, von, bis, marken: m.marken, teilung: fenster > 12000 ? 2000 : 1000})
    + `<p class="small muted">Die Rampe zeigt ET. Die gestrichelte Linie ist PT. Senkrechte Linien: Die Zeitmessung startet oder ET erreicht PT.</p>`;
}

/* ---------- Begriffe ---------- */
const ZT_BEGRIFFE = [
  ["IEC-Zeit", "Eine Zeitfunktion der S7-1500: TP, TON, TOF oder TONR. Jedem Aufruf ist eine eigene IEC-Zeit zugeordnet, in der sie ihre Daten speichert (Instanz)."],
  ["IN", "Starteingang (Bool). Die Zeit vergleicht IN mit dem Wert vom letzten Aufruf und erkennt so die Flanke, die sie startet."],
  ["PT", "Vorgabezeit (Datentyp Time), muss positiv sein. Die Zeit übernimmt PT bei einem Flankenwechsel an IN."],
  ["Q", "Ausgang (Bool). Wann er 1 ist, hängt von der Art ab: Impuls, Einschaltverzögerung, Ausschaltverzögerung oder akkumulierte Zeit."],
  ["ET", "Abgelaufene Zeit (Datentyp Time). Sie beginnt bei T#0ms und endet, wenn PT erreicht ist."],
  ["R", "Nur beim TONR: Rücksetzeingang. R = 1 setzt ET und Q zurück und blockiert die Zeitmessung."],
  ["Instanz, Multiinstanz", "Die Daten einer IEC-Zeit (z. B. IN vom letzten Aufruf) liegen in ihrer Instanz. Als Multiinstanz (#inst…) liegt sie im Instanz-DB deines FB. Rufe sie in jedem Zyklus auf, nicht in einer IF-Bedingung: Sie sieht IN nur, wenn sie aufgerufen wird."],
  ["Time und T#", "Datentyp für Zeitdauern. Er speichert Millisekunden in 32 Bit. Konstanten schreibst du mit T#, z. B. T#2s, T#500ms oder T#1s_200ms."],
];
function ztBegriffeHTML(){
  return `<details class="ia-begriffe"><summary>Begriffe: IEC-Zeit, IN, PT, Q, ET, R, Instanz, Time und T#</summary><dl>`
    + ZT_BEGRIFFE.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("") + `</dl></details>`;
}

function zeitHTML(z){
  const m = z.m;
  const kopf = `<div class="ia-kopf"><b>Probier es aus:</b> Klicke auf ${iaName(ztInKnopf(z))} oder tippe es kurz an. Die Zeit läuft dann los.${bxTabs(z.arten, m.art, "art")}</div>`;
  const art = `<div class="ze-art"><b>${m.art}</b> ${ZT_NAME[m.art]}</div>`;
  return kopf + art + `<div class="ze-oben">${ztEingaengeHTML(z)}${ztAnzeigeHTML(z)}</div>`
    + `<div class="ia-bild ze-bild">${bxTabs(ZT_ANSICHTEN, z.ansicht, "ansicht")}${ZT_BILD[z.ansicht](z)}</div>` + ztSatzHTML(z) + ztSteuerHTML(z)
    + `<div class="ia-verlauf"><div class="ia-verlauf-kopf"><b>Impulsdiagramm</b></div>${ztVerlaufHTML(z)}</div>` + ztBegriffeHTML();
}

/* ---------- Bedienen ---------- */
const ZT_AKTION = {
  in: z => { zeUmschalten(z.m); ztAbspielen(z); },
  r: z => { zeR(z.m, z.m.r ? 0 : 1); ztAbspielen(z); },
  tippen: z => { zeTippen(z.m, ZT_TIPPEN); ztAbspielen(z); },
  abspielen: z => ztAbspielen(z),
  pause: z => ztAnhalten(z),
  neu: z => { z.m = zeModell(z.m.art, z.m.pt); },
  pt: (z, w) => { z.m = zeModell(z.m.art, +w); },
  art: (z, w) => { z.m = zeModell(w, z.m.pt); },
  ansicht: (z, w) => { z.ansicht = w; },
};
iaRegistrieren("zeit", {
  neu: zeitNeu,
  html: zeitHTML,
  aktion: (z, akt) => { const [name, wert] = akt.split(":"); ZT_AKTION[name](z, wert); },
});
