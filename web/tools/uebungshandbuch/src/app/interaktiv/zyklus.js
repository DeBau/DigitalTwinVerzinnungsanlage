/* ---------- Interaktive Erklärung: Anlauf, SPS-Zyklus und Reaktionszeit ---------- */
// Platzhalter: <div data-interaktiv="zyklus" data-e="BG40" data-a="PF4"></div>
// e: Eingang (Sensor an der Klemme), a: Ausgang. Das Programm im OB1 ist eine Zuweisung: a := e.
// Ablauf STOP → ANLAUF → RUN mit dem Zyklus „Eingänge ins PAE, OB1, am Ende PAA an die Ausgänge“ über echter Zeit in ms (Zeitmodell: zyklus-modell.js). Gezeigt werden Zykluszeit,
// Einlesezeitpunkte, gemessene Reaktionszeit und kurze Impulse, die verloren gehen können.
// Abspielen läuft mit einem Zeitgeber je Erklärung; er endet, sobald die Erklärung nicht mehr auf der Seite steht.
import { iaName, iaRegistrieren, iaSignalKnopf, iaSvg, iaText, iaZeichnen } from './basis.js';
import { zeitverlaufSVG } from './signalverlauf.js';
import { ZY_EREIGNIS, ZY_PHASE_BIS, zyAusschalten, zyEinschalten, zyImpuls, zyLaufen, zyModell, zyPhase, zySchritt, zySensor, zyZyklusNr } from './zyklus-modell.js';

const ZY_PHASEN = {
  ein: {n: "Eingänge → PAE", text: z => `Am Anfang des Zyklus liest die CPU alle Eingänge in das Prozessabbild der Eingänge (PAE). Ändert sich ${z.ne} danach, sieht das Programm das erst im nächsten Zyklus.`},
  ob1: {n: "OB1 bearbeiten", text: z => `Die CPU bearbeitet das Programm im OB1 Anweisung für Anweisung. Es liest nur das PAE und schreibt in das PAA, nicht direkt an die Klemmen. Hier: ${z.na} := ${z.ne}. An der Klemme ändert sich noch nichts.`},
  aus: {n: "PAA → Ausgänge", text: z => `Am Ende des Zyklus, wenn das ganze Programm durchlaufen ist, überträgt die CPU das Prozessabbild der Ausgänge (PAA) an die Ausgänge. Erst jetzt ändert sich ${z.na} an der Klemme. Danach beginnt der nächste Zyklus.`},
};
const ZY_TEXT = {
  STOP: "STOP: Die CPU bearbeitet kein Programm. Die Ausgänge sind deaktiviert oder reagieren wie parametriert (z. B. Ersatzwert). Wähle die Zykluszeit und drücke <b>Einschalten</b>.",
  ANLAUF: "ANLAUF: Nach dem Einschalten bearbeitet die CPU einmal den Anlauf. Sie setzt nicht remanente Daten auf ihre Startwerte, löscht das PAA und bearbeitet den Anlauf-OB (z. B. OB100), wenn es einen gibt. Zuletzt liest sie die Eingänge ins PAE. Die Ausgänge werden erst beim Übergang nach RUN freigegeben. Dann beginnt der Zyklus.",
};
const ZY_BEGRIFFE = [
  ["Betriebszustand", "STOP, ANLAUF oder RUN. Nur in RUN wird der OB1 zyklisch bearbeitet."],
  ["Anlauf-OB", "Ein Organisationsbaustein (z. B. OB100), den die CPU beim Übergang von STOP nach RUN einmal bearbeitet, z. B. für Startwerte."],
  ["PAE", "Prozessabbild der Eingänge: Speicherbereich der CPU mit den Eingangswerten, eingelesen am Zyklusanfang."],
  ["PAA", "Prozessabbild der Ausgänge: Hier schreibt das Programm hinein. Erst am Ende des Zyklus, wenn alles durchlaufen ist, überträgt die CPU es an die Ausgänge. Schreiben zwei Stellen denselben Ausgang, kommt also nur die letzte Zuweisung an."],
  ["Zykluskontrollpunkt", "So nennt die TIA-Hilfe bei der S7-1500 den Übergang zwischen zwei Zyklen: Dort wird das PAA ausgegeben und danach das PAE eingelesen. Das ist derselbe Ablauf wie oben."],
  ["Zykluszeit", "Die Zeit für einen Durchlauf von Ausgeben, Einlesen und OB1. Die CPU überwacht sie mit der Zyklusüberwachungszeit."],
  ["Reaktionszeit", "Die Zeit vom Wechsel an einem Eingang bis der Ausgang reagiert. Sie liegt zwischen etwa einer und zwei Zykluszeiten, dazu kommen in der echten Anlage die Verzögerungen der Ein- und Ausgabebaugruppen."],
];
const ZY_ZYKLUSZEITEN = [10, 20];
const ZY_IMPULSE = [0.3, 0.8, 1.5];   // Impulsdauer als Anteil der Zykluszeit
const ZY_TAKT = 40, ZY_SCHRITTE_JE_ZYKLUS = 60;   // Abspielen: alle 40 ms ein Sechzigstel Zyklus
const ZY_UHR = new Map();

function zyklusNeu(at){
  const e = at.e || "E", a = at.a || "A";
  return {e, a, ne: iaName(e), na: iaName(a), m: zyModell(ZY_ZYKLUSZEITEN[0]), laeuft: false};
}
const ms = x => `${(Math.round(x * 10) / 10).toLocaleString("de-DE")} ms`;

/* ---------- Abspielen ---------- */
function anhalten(z){ clearInterval(ZY_UHR.get(z.id)); ZY_UHR.delete(z.id); z.laeuft = false; }
function abspielen(z){
  z.laeuft = true;
  ZY_UHR.set(z.id, setInterval(() => { zyLaufen(z.m, z.m.T / ZY_SCHRITTE_JE_ZYKLUS); if (!iaZeichnen(z.id)) anhalten(z); }, ZY_TAKT));
}

/* ---------- Bild ---------- */
function stationHTML(titel, name, wert, aktiv){
  return `<div class="zy-st${aktiv ? " aktiv" : ""}${wert ? " an" : ""}"><span class="t">${titel}</span><span class="n">${name}</span><b>${wert}</b></div>`;
}
function strasseHTML(z){
  const m = z.m, p = zyPhase(m), pfeil = "<i>→</i>";
  return `<div class="zy-strasse">${stationHTML("Klemme", z.ne, m.klemme, p === "ein")}${pfeil}${stationHTML("PAE", z.ne, m.pae, p === "ein" || p === "ob1")}${pfeil}`
    + `${stationHTML("OB1", `${z.na} := ${z.ne}`, m.pae, p === "ob1")}${pfeil}${stationHTML("PAA", z.na, m.paa, p === "ob1" || p === "aus")}${pfeil}`
    + stationHTML("Ausgang", z.na, m.ausgang, p === "aus") + `</div>`;
}
// Ring: die drei Phasen im Verhältnis ihrer Dauer, ein Punkt zeigt die aktuelle Stelle im Zyklus
function ringSVG(z){
  const m = z.m, r = 62, run = m.betrieb === "RUN" && m.t >= m.start, p = zyPhase(m);
  const pkt = anteil => { const w = (anteil * 360 - 90) * Math.PI / 180; return [80 + r * Math.cos(w), 80 + r * Math.sin(w)]; };
  const bogen = (von, bis, id) => {
    const [x0, y0] = pkt(von + 0.008), [x1, y1] = pkt(bis - 0.008), gross = bis - von > 0.5 ? 1 : 0;
    return `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${gross} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" class="zy-bogen${p === id ? " aktiv" : ""}"/>`;
  };
  const boegen = ZY_EREIGNIS.map((e, i) => bogen(e.anteil, ZY_PHASE_BIS[e.id], e.id)).join("");
  const [px, py] = pkt(run ? ((m.t - m.start) % m.T) / m.T : 0);
  const zeiger = run ? `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="7" class="zy-zeiger"/>` : "";
  const mitte = iaText(80, 72, m.betrieb, "zy-modus") + iaText(80, 92, run ? `Zyklus ${zyZyklusNr(m)}` : "", "zy-nr") + iaText(80, 108, `T = ${m.T} ms`, "zy-nr");
  return iaSvg(160, 160, boegen + zeiger + mitte, "SPS-Zyklus");
}
function phasenHTML(z){
  const m = z.m, p = zyPhase(m);
  const modi = ["STOP", "ANLAUF", "RUN"].map(b => `<span class="zy-modus${m.betrieb === b ? " aktiv" : ""}">${b}</span>`).join("<i>→</i>");
  const liste = ZY_EREIGNIS.map(e => `<li class="${p === e.id ? "aktiv" : ""}">${ZY_PHASEN[e.id].n}</li>`).join("");
  return `<div class="zy-modi">${modi}<span class="zy-zeit">t = ${ms(m.t)}</span></div><ol class="zy-phasen">${liste}</ol>`;
}
function textHTML(z){
  const p = zyPhase(z.m), t = p ? ZY_PHASEN[p].text(z) : ZY_TEXT[z.m.betrieb === "RUN" ? "ANLAUF" : z.m.betrieb];
  return `<div class="ia-satz">${t}</div>`;
}

/* ---------- Reaktionszeit und Impulse ---------- */
function reaktionHTML(z){
  const r = z.m.reaktion, T = z.m.T;
  const gemessen = r && r.wert !== null
    ? `<b>Gemessen: ${ms(r.wert)}</b> = ${(r.wert / T).toLocaleString("de-DE", {maximumFractionDigits: 2})} × Zykluszeit.`
    : r ? "Gemessen wird gerade: Warte, bis der Ausgang schaltet." : "Schalte im Betrieb den Sensor um, dann misst die Erklärung die Reaktionszeit.";
  return `<div class="zy-info"><b>Reaktionszeit</b> (Klemme bis Ausgang): ${gemessen}`
    + `<details class="ia-begriffe"><summary>Warum 1 bis 2 Zykluszeiten (hier ${ms(T)} bis ${ms(2 * T)})?</summary>`
    + `<p class="small">Wechselt das Signal kurz <i>vor</i> dem Einlesen, bearbeitet der OB1 es sofort, und am Ende desselben Zyklus schaltet der Ausgang: etwa 1 × Zykluszeit. Wechselt es kurz <i>nach</i> dem Einlesen, wartet es fast einen ganzen Zyklus auf das nächste Einlesen, und der Ausgang schaltet erst am Ende des folgenden Zyklus: fast 2 × Zykluszeit.</p></details></div>`;
}
function impulsHTML(z){
  if (!z.m.verpasst && !(z.m.impulsGesehen && z.m.impulsEnde === null && z.letzterImpuls)) return "";
  if (z.m.verpasst) return `<div class="ia-satz warn"><b>Impuls verpasst:</b> ${z.ne} war nur ${ms(z.letzterImpuls)} lang 1, kürzer als die Zykluszeit (${ms(z.m.T)}). Er lag nicht an, als die CPU die Eingänge gelesen hat (Dreiecke im Signalverlauf). Das Programm hat ihn nie gesehen.</div>`;
  return `<div class="ia-satz an"><b>Impuls erkannt:</b> Er lag gerade an, als die CPU die Eingänge gelesen hat. Bei einem Impuls kürzer als die Zykluszeit ist das Glück. Sicher erkannt wird ein Signal erst, wenn es mindestens eine Zykluszeit lang ansteht.</div>`;
}
function verlaufHTML(z){
  const m = z.m, fenster = 4 * m.T, bis = Math.max(fenster, m.t), von = bis - fenster;
  const marken = [];
  if (m.start !== null) for (let t = m.start, n = 1; t <= bis; t += m.T, n++) marken.push({t, text: `Zyklus ${n} · ${ms(t)}`});
  const spuren = [["k", "Klemme"], ["e", "PAE"], ["a", "PAA"], ["q", "Ausgang"]].map(([k, name]) => ({name, wechsel: m.spuren[k]}));
  return zeitverlaufSVG({spuren, von, bis, marken, punkte: m.lesungen.map(t => ({zeile: 1, t})), breit: z.breit});
}

/* ---------- Steuerung ---------- */
const zyKnopf = (akt, t, prim, an) => `<button type="button" class="btn small${prim ? " primary" : ""}" data-ia-akt="${akt}"${an === undefined ? "" : ` aria-pressed="${an}"`}>${t}</button>`;
function steuerHTML(z){
  const m = z.m;
  if (m.betrieb === "STOP") return `<span class="small">Zykluszeit:</span>${ZY_ZYKLUSZEITEN.map(T => zyKnopf(`zeit:${T}`, `${T} ms`, false, m.T === T)).join("")}${zyKnopf("einschalten", "Einschalten", true)}`;
  return (z.laeuft ? zyKnopf("pause", "Anhalten") : zyKnopf("abspielen", "Abspielen", true)) + zyKnopf("schritt", "Nächstes Ereignis") + zyKnopf("ausschalten", "STOP");
}
function sensorHTML(z){
  const impulse = ZY_IMPULSE.map(a => zyKnopf(`impuls:${a}`, `Impuls ${ms(a * z.m.T)}`)).join("");
  return `<div class="ia-knoepfe">${iaSignalKnopf("sensor", z.e, z.m.klemme)}</div><div class="zy-impulse">${impulse}</div>`;
}
function zyBegriffeHTML(){
  return `<details class="ia-begriffe"><summary>Begriffe: Betriebszustand, Anlauf-OB, PAE, PAA, Zykluskontrollpunkt, Zykluszeit, Reaktionszeit</summary><dl>`
    + ZY_BEGRIFFE.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("") + `</dl></details>`;
}
function zyklusHTML(z){
  return `<div class="ia-kopf"><b>Probier es aus:</b> Schalte ein, schalte den Sensor und miss, wann der Ausgang reagiert. Gib dann kurze Impulse.</div>`
    + `<div class="zy-oben"><div class="zy-ring">${ringSVG(z)}</div><div class="zy-mitte">${phasenHTML(z)}${strasseHTML(z)}</div></div>`
    + `<div class="zy-steuer"><div class="zy-sensor">${sensorHTML(z)}</div><div class="zy-knoepfe">${steuerHTML(z)}</div></div>`
    + `<div class="zy-texte">${textHTML(z)}<div class="zy-saetze">${reaktionHTML(z)}${impulsHTML(z)}</div></div>`
    + `<div class="ia-verlauf"><div class="ia-verlauf-kopf"><b>Signalverlauf über der Zeit</b>`
    + `<span class="small muted">Senkrechte Linien: Zyklusanfang. Dreiecke: Hier liest die CPU die Eingänge ins PAE.</span></div>`
    + `${verlaufHTML(z)}</div>` + zyBegriffeHTML();
}

/* ---------- Bedienen ---------- */
const ZY_AKTION = {
  zeit: (z, T) => { z.m = zyModell(+T); },
  einschalten: z => zyEinschalten(z.m),
  ausschalten: z => { anhalten(z); zyAusschalten(z.m); },
  abspielen: z => abspielen(z),
  pause: z => anhalten(z),
  schritt: z => zySchritt(z.m),
  sensor: z => zySensor(z.m),
  impuls: (z, anteil) => { z.letzterImpuls = +anteil * z.m.T; zyImpuls(z.m, z.letzterImpuls); },
};
iaRegistrieren("zyklus", {
  titel: "Anlauf, SPS-Zyklus und Reaktionszeit",
  anhalten: anhalten,
  neu: zyklusNeu,
  html: zyklusHTML,
  aktion: (z, akt) => { const [name, wert] = akt.split(":"); ZY_AKTION[name](z, wert); },
});
