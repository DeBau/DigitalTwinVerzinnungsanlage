/* ---------- Interaktive Erklärung: Anlauf und SPS-Zyklus ---------- */
// Platzhalter: <div data-interaktiv="zyklus" data-e="BG40" data-a="PF4"></div>
// e: Eingang (Sensor an der Klemme), a: Ausgang. Das Programm im OB1 ist eine Zuweisung: a := e.
// Ablauf: STOP → ANLAUF (einmal) → RUN mit dem Zyklus „PAA an die Ausgänge, Eingänge ins PAE, OB1 bearbeiten“.
// Abspielen läuft mit einem Zeitgeber je Erklärung; er endet, sobald die Erklärung nicht mehr auf der Seite steht.
import { iaName, iaRegistrieren, iaSignalKnopf, iaSvg, iaText, iaZeichnen } from './basis.js';
import { signalverlaufSVG } from './signalverlauf.js';

const ZY_PHASEN = [
  {id: "aus", n: "PAA → Ausgänge", text: z => `Die CPU schreibt das Prozessabbild der Ausgänge (PAA) auf die Ausgänge. Erst jetzt ändert sich ${z.na} an der Klemme.`},
  {id: "ein", n: "Eingänge → PAE", text: z => `Die CPU liest alle Eingänge in das Prozessabbild der Eingänge (PAE). Ändert sich ${z.ne} danach, sieht das Programm das erst im nächsten Zyklus.`},
  {id: "ob1", n: "OB1 bearbeiten", text: z => `Das Programm im OB1 arbeitet nur mit dem PAE und schreibt in das PAA, nicht direkt an die Klemmen. Hier: ${z.na} := ${z.ne}.`},
];
const ZY_TEXT = {
  STOP: "STOP: Die CPU bearbeitet kein Programm, die Ausgänge sind aus. Drücke <b>Einschalten</b>.",
  ANLAUF: "ANLAUF: Nach dem Einschalten bearbeitet die CPU einmal den Anlauf. Sie setzt nicht remanente Daten auf ihre Startwerte und bearbeitet den Anlauf-OB (z. B. OB100), wenn es einen gibt. Die Ausgänge bleiben so lange aus. Erst danach beginnt der Zyklus.",
};
const ZY_BEGRIFFE = [
  ["Betriebszustand", "STOP, ANLAUF oder RUN. Nur in RUN wird der OB1 zyklisch bearbeitet."],
  ["Anlauf-OB", "Ein Organisationsbaustein (z. B. OB100), den die CPU beim Übergang von STOP nach RUN einmal bearbeitet, z. B. für Startwerte."],
  ["PAE", "Prozessabbild der Eingänge: Speicherbereich der CPU mit den Eingangswerten, eingelesen am Zyklusanfang."],
  ["PAA", "Prozessabbild der Ausgänge: Hier schreibt das Programm hinein. Die CPU gibt es im nächsten Zyklus auf die Ausgänge."],
  ["Zykluszeit", "Die Zeit für einen Durchlauf. Die CPU überwacht sie mit der Zyklusüberwachungszeit."],
];
const ZY_TAKT = 900;   // ms je Schritt beim Abspielen
const ZY_UHR = new Map();

function zyklusNeu(at){
  return {e: at.e || "E", a: at.a || "A", ne: iaName(at.e || "E"), na: iaName(at.a || "A"),
    betrieb: "STOP", phase: -1, zyklus: 0, klemme: 0, impuls: false, pae: 0, paa: 0, ausgang: 0, laeuft: false, verlauf: []};
}
function merke(z){ z.verlauf.push({k: z.klemme, e: z.pae, a: z.paa, q: z.ausgang}); }

/* ---------- Ein Schritt ---------- */
const ZY_WIRKUNG = {
  aus: z => { z.ausgang = z.paa; },
  ein: z => { z.pae = z.klemme; },
  ob1: z => { z.paa = z.pae; },
};
function weiter(z){
  if (z.betrieb === "STOP") return;
  if (z.betrieb === "ANLAUF") { z.betrieb = "RUN"; z.phase = 0; z.zyklus = 1; }
  else { z.phase = (z.phase + 1) % ZY_PHASEN.length; if (!z.phase) z.zyklus++; }
  ZY_WIRKUNG[ZY_PHASEN[z.phase].id](z);
  merke(z);
  // kurzer Impuls: nur einen Schritt lang 1; lag er nicht beim Einlesen an, hat das Programm ihn nie gesehen
  if (z.impuls) { z.verpasst = ZY_PHASEN[z.phase].id !== "ein"; z.klemme = 0; z.impuls = false; }
}
function anhalten(z){ clearInterval(ZY_UHR.get(z.id)); ZY_UHR.delete(z.id); z.laeuft = false; }
function abspielen(z){
  z.laeuft = true;
  ZY_UHR.set(z.id, setInterval(() => { weiter(z); if (!iaZeichnen(z.id)) anhalten(z); }, ZY_TAKT));
}

/* ---------- Bild ---------- */
function stationHTML(titel, name, wert, aktiv){
  return `<div class="zy-st${aktiv ? " aktiv" : ""}${wert ? " an" : ""}"><span class="t">${titel}</span><span class="n">${name}</span><b>${wert}</b></div>`;
}
function strasseHTML(z){
  const p = z.betrieb === "RUN" ? ZY_PHASEN[z.phase].id : "";
  return `<div class="zy-strasse">${stationHTML("Klemme", z.ne, z.klemme, p === "ein")}<i>→</i>${stationHTML("PAE", z.ne, z.pae, p === "ein" || p === "ob1")}<i>→</i>`
    + `${stationHTML("OB1", `${z.na} := ${z.ne}`, z.pae, p === "ob1")}<i>→</i>${stationHTML("PAA", z.na, z.paa, p === "ob1" || p === "aus")}<i>→</i>${stationHTML("Ausgang", z.na, z.ausgang, p === "aus")}</div>`;
}
// Ring mit den drei Phasen des Zyklus, die aktive Phase ist hervorgehoben
function ringSVG(z){
  const bogen = (i, aktiv) => {
    const w0 = (i * 120 - 90 + 4) * Math.PI / 180, w1 = ((i + 1) * 120 - 90 - 4) * Math.PI / 180, r = 62;
    const p = w => `${(80 + r * Math.cos(w)).toFixed(1)} ${(80 + r * Math.sin(w)).toFixed(1)}`;
    return `<path d="M${p(w0)} A${r} ${r} 0 0 1 ${p(w1)}" class="zy-bogen${aktiv ? " aktiv" : ""}"/>`;
  };
  const run = z.betrieb === "RUN";
  const boegen = ZY_PHASEN.map((_, i) => bogen(i, run && z.phase === i)).join("");
  const mitte = iaText(80, 76, z.betrieb, "zy-modus") + iaText(80, 96, run ? `Zyklus ${z.zyklus}` : "", "zy-nr");
  return iaSvg(160, 160, boegen + mitte, "SPS-Zyklus");
}
function phasenHTML(z){
  const modi = ["STOP", "ANLAUF", "RUN"].map(m => `<span class="zy-modus${z.betrieb === m ? " aktiv" : ""}">${m}</span>`).join("<i>→</i>");
  const liste = ZY_PHASEN.map((ph, i) => `<li class="${z.betrieb === "RUN" && z.phase === i ? "aktiv" : ""}">${ph.n}</li>`).join("");
  return `<div class="zy-modi">${modi}</div><ol class="zy-phasen">${liste}</ol>`;
}
function textHTML(z){
  const t = z.betrieb === "RUN" ? ZY_PHASEN[z.phase].text(z) : ZY_TEXT[z.betrieb];
  const verpasst = z.verpasst ? `<div class="ia-satz warn"><b>Impuls verpasst:</b> ${z.ne} war nur kurz 1 und lag nicht an, als die CPU die Eingänge gelesen hat. Das Programm hat ihn nie gesehen. Ein Signal muss deshalb mindestens einen Zyklus lang anstehen.</div>` : "";
  return verpasst + `<div class="ia-satz">${t}</div>`;
}
function steuerHTML(z){
  const knopf = (akt, t, prim) => `<button type="button" class="btn small${prim ? " primary" : ""}" data-ia-akt="${akt}">${t}</button>`;
  if (z.betrieb === "STOP") return knopf("einschalten", "Einschalten", true);
  return (z.laeuft ? knopf("pause", "Anhalten") : knopf("abspielen", "Abspielen", true)) + knopf("schritt", "Ein Schritt") + knopf("ausschalten", "STOP");
}
function zyBegriffeHTML(){
  return `<details class="ia-begriffe"><summary>Begriffe: Betriebszustand, Anlauf-OB, PAE, PAA, Zykluszeit</summary><dl>`
    + ZY_BEGRIFFE.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("") + `</dl></details>`;
}
function zyVerlaufHTML(z){
  const spur = (k, name) => ({name, werte: z.verlauf.map(s => s[k])});
  return signalverlaufSVG([spur("k", "Klemme"), spur("e", "PAE"), spur("a", "PAA"), spur("q", "Ausgang")], "Schritte");
}
function zyklusHTML(z){
  const sensor = iaSignalKnopf("sensor", z.e, z.klemme) + `<button type="button" class="btn small" data-ia-akt="impuls">Kurzer Impuls</button>`;
  return `<div class="ia-kopf"><b>Probier es aus:</b> Schalte ein, schalte den Sensor und sieh zu, wann das Signal am Ausgang ankommt.</div>`
    + `<div class="zy-oben"><div class="zy-ring">${ringSVG(z)}</div><div class="zy-mitte">${phasenHTML(z)}${strasseHTML(z)}</div></div>`
    + `<div class="zy-steuer"><div class="ia-knoepfe">${sensor}</div><div class="zy-knoepfe">${steuerHTML(z)}</div></div>`
    + textHTML(z) + `<div class="ia-verlauf"><div class="ia-verlauf-kopf"><b>Signalverlauf</b></div>${zyVerlaufHTML(z)}</div>` + zyBegriffeHTML();
}

/* ---------- Bedienen ---------- */
const ZY_AKTION = {
  einschalten: z => { z.betrieb = "ANLAUF"; z.phase = -1; z.pae = 0; z.paa = 0; z.ausgang = 0; merke(z); },
  ausschalten: z => { anhalten(z); z.betrieb = "STOP"; z.phase = -1; z.ausgang = 0; merke(z); },
  abspielen: z => abspielen(z),
  pause: z => anhalten(z),
  schritt: z => weiter(z),
  sensor: z => { z.klemme = z.klemme ? 0 : 1; z.impuls = false; z.verpasst = false; },
  impuls: z => { z.klemme = 1; z.impuls = true; z.verpasst = false; },
};
iaRegistrieren("zyklus", {
  neu: zyklusNeu,
  html: zyklusHTML,
  aktion: (z, akt) => ZY_AKTION[akt](z),
});
