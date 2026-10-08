/* ---------- Interaktive Erklärung: Analogwert einlesen, umrechnen und prüfen ---------- */
// Platzhalter: <div data-interaktiv="analog" data-art="KETTE,UMRECHNEN,NORM_X,PRUEFEN" data-name="BT1" data-adresse="IW64"
//   data-einheit="°C" data-bis="400" data-wert="280" data-min="270" data-max="290"></div>
// art: Ansichten (mehrere: Umschalter). KETTE: Weg Sensor → Messumformer → Baugruppe → Rohwert mit den Bereichen des
// Rohwerts und Drahtbruch. UMRECHNEN: Gerade Rohwert → Messgröße, richtig in Real, falsch in Int. NORM_X: dieselbe
// Umrechnung mit NORM_X und SCALE_X. PRUEFEN: Testumschaltung, Gültigkeit und Grenzwerte wie im FB BathMonitor.
// name: Kennzeichen des Sensors, adresse: Eingangswort, einheit und bis: Messbereich 0 bis bis, wert: Startwert der
// Messgröße, min und max: Grenzen für PRUEFEN, testroh: Testwert (schaltet den Testbetrieb gleich ein), beispiele: Rohwerte
// für die Beispielknöpfe (UMRECHNEN, NORM_X). Namen in SCL optional: sroh, stemp, sq, sbereich, sv, sok, smin, smax.
// Modell: analog-modell.js, Bilder: analog-bild.js, Texte: analog-text.js
import { esc } from '../basis.js';
import { iaKurz, iaRegistrieren } from './basis.js';
import { anKennlinieSVG, anKetteSVG, anSkalaSVG } from './analog-bild.js';
import { AN_NENN, AN_WEGE, anBereich, anKette, anNormScale, anPruefen } from './analog-modell.js';
import { AN_BEGRIFFE, anSatzKette, anSatzNorm, anSatzPruefen, anSatzWeg } from './analog-text.js';
import { bxFupSVG, bxLampe, bxSclHTML, bxTabs } from './box-bild.js';
import { reParsen } from './rechnen-modell.js';
import { zfZahlText } from './zahl-modell.js';

const AN_ANSICHT = {KETTE: "Vom Sensor zur Zahl", UMRECHNEN: "Umrechnen", NORM_X: "NORM_X und SCALE_X", PRUEFEN: "Prüfen im FB"};
const AN_CODE = Object.fromEntries(Object.entries(AN_ANSICHT).map(([k, v]) => [v, k]));
const AN_BEISPIELE = {
  KETTE: [["0 °C", {wert: 0}], ["280 °C", {wert: 280}], ["400 °C", {wert: 400}], ["450 °C", {wert: 450}], ["500 °C", {wert: 500}],
    ["−20 °C", {wert: -20}], ["−60 °C", {wert: -60}], ["Drahtbruch", {drahtbruch: true}]],
  PRUEFEN: [["18662", {testRoh: 18662}], ["18663", {testRoh: 18663}], ["20044", {testRoh: 20044}], ["20045", {testRoh: 20045}],
    ["32767", {testRoh: 32767}], ["−32768", {testRoh: -32768}]],
};
const anZahl = v => zfZahlText(v).replace("-", "−");
// Rohwerte als Beispiele: aus data-beispiele, sonst beim Umrechnen mit der Grenze, ab der „Int, erst mal“ überläuft
const anRohListe = liste => liste.map(v => [anZahl(v), {roh: v}]);
const AN_ROH_BEISPIELE = {
  UMRECHNEN: z => [13824, 19354, Math.floor(32767 / z.n.bis), Math.floor(32767 / z.n.bis) + 1, 27648, 32767],
  NORM_X: () => [13824, 19354, 27648, 32767, -4864],
};
function anBeispiele(z){
  if (!AN_ROH_BEISPIELE[z.ansicht]) return AN_BEISPIELE[z.ansicht];
  return anRohListe(z.rohBeispiele || AN_ROH_BEISPIELE[z.ansicht](z));
}

function analogNeu(at){
  const arten = (at.art || "KETTE").split(",").map(a => a.trim()).filter(a => AN_ANSICHT[a]);
  const name = at.name || "BT1", bis = +at.bis || 400;
  const n = {sensor: iaKurz(name), adresse: "%" + (at.adresse || "IW64"), einheit: at.einheit || "°C", bis, min: +at.min || 0, max: +at.max || bis};
  const s = {roh: at.sroh || "#rawTemp", temp: at.stemp || "#tempRaw", wert: at.sq || "#bathTemp", bereich: at.sbereich || "#TEMP_RANGE",
    gueltig: at.sv || "#bathTempValid", ok: at.sok || "#bathTempOk", min: at.smin || "#TEMP_MIN", max: at.smax || "#TEMP_MAX",
    test: "#statTestMode", testRoh: "#statTestRaw"};
  const z = {ansichten: arten.length ? arten : ["KETTE"], n, s, wert: at.wert === undefined ? bis * 0.7 : +at.wert,
    rohBeispiele: at.beispiele ? at.beispiele.split(",").map(Number).filter(Number.isInteger) : null, drahtbruch: false, weg: "Real", test: at.testroh !== undefined, testRoh: at.testroh === undefined ? 18663 : +at.testroh, t: {}, fehler: {}};
  z.ansicht = z.ansichten[0];
  anWertSetzen(z, z.wert);
  return z;
}

/* ---------- Werte ---------- */
function anTexteNeu(z){ z.t = {wert: zfZahlText(z.wert), roh: String(z.roh), testRoh: String(z.testRoh)}; z.fehler = {}; }
// Messgröße ändern: Der Rohwert folgt über Messumformer und Baugruppe
function anWertSetzen(z, wert){
  z.wert = Math.max(-1000, Math.min(10000, Math.round(wert * 10) / 10));
  z.roh = anKette(z.wert, z.n.bis, z.drahtbruch).roh;
  anTexteNeu(z);
}
const anInt = v => Math.max(-32768, Math.min(32767, Math.round(v)));
function anEingabe(z, k, feld){
  const r = reParsen(k === "wert" ? "Real" : "Int", feld.value);
  z.t[k] = feld.value;
  z.fehler[k] = r.fehler || "";
  if (r.fehler) return;
  if (k === "wert") { z.drahtbruch = false; z.wert = r.wert; z.roh = anKette(z.wert, z.n.bis, false).roh; }
  else z[k] = r.wert;
}

/* ---------- Bedienfelder ---------- */
function anFeldHTML(z, k, titel, schritt){
  const fehler = z.fehler[k] ? `<span class="zf-fehler">${esc(z.fehler[k])}</span>` : "";
  return `<div class="re-feld"><label><b>${esc(titel)}</b><input type="text" data-ia-eingabe="${k}" value="${esc(z.t[k])}" spellcheck="false" autocomplete="off"></label>`
    + `<span class="re-knoepfe"><button type="button" class="btn small" data-ia-akt="plus:${k}:${-schritt}">−${schritt}</button>`
    + `<button type="button" class="btn small" data-ia-akt="plus:${k}:${schritt}">+${schritt}</button></span>${fehler}</div>`;
}
const anSchalter = (akt, name, wert) => `<button type="button" class="ia-sig${wert ? " an" : ""}" data-ia-akt="${akt}"><span class="n">${esc(name)}</span><b>${wert ? 1 : 0}</b></button>`;
const AN_FELDER = {
  KETTE: z => anFeldHTML(z, "wert", `Messgröße an ${z.n.sensor} in ${z.n.einheit}`, 10) + anSchalter("bruch", "Drahtbruch", z.drahtbruch),
  UMRECHNEN: z => anFeldHTML(z, "roh", `Rohwert ${z.n.adresse}`, 1) + bxTabs(Object.keys(AN_WEGE), z.weg, "weg"),
  NORM_X: z => anFeldHTML(z, "roh", `Rohwert ${z.n.adresse}`, 1),
  PRUEFEN: z => anFeldHTML(z, "roh", `${z.s.roh} (${z.n.sensor})`, 1) + anSchalter("test", z.s.test, z.test) + anFeldHTML(z, "testRoh", z.s.testRoh, 1),
};
function anBeispieleHTML(z){
  const liste = anBeispiele(z);
  return `<div class="re-beispiele"><span class="small muted">Beispiele:</span>${liste.map(([text], i) => `<button type="button" class="zf-als" data-ia-akt="bsp:${i}">${esc(text)}</button>`).join("")}</div>`;
}

/* ---------- Ansichten ---------- */
function anKetteHTML(z){
  const k = {...anKette(z.wert, z.n.bis, z.drahtbruch), ...z.n, wert: z.wert, drahtbruch: z.drahtbruch};
  const satz = anSatzKette({z, k, bereich: anBereich(k.roh)}), warn = anBereich(k.roh).gueltig ? "" : " warn";
  return `<div class="ia-satz${warn}">${satz}</div><div class="an-bild">${anKetteSVG(k)}${anSkalaSVG(k.roh)}</div>`
    + `<p class="small muted">Im Zwilling liefert ${z.n.sensor} im Betrieb nur Rohwerte von 0 bis ${AN_NENN}, bei <i>Drahtbruch ${z.n.sensor}</i> unter <i>Prozess</i> 32767. Alles andere testest du mit der Testumschaltung (Ansicht „Prüfen im FB“).</p>`;
}
function anSchritteHTML(k){
  const zeile = s => `<tr class="${s.ok ? "" : "warn"}"><td>${s.anw}</td><td>${esc(s.rechnung)}</td><td><b>${anZahl(s.out)}</b></td><td>${s.ok ? "TRUE" : "FALSE"}</td></tr>`;
  return `<table class="ia-tab an-schritte"><thead><tr><th>Anweisung</th><th>Rechnung</th><th>OUT</th><th>ENO</th></tr></thead><tbody>${k.schritte.map(zeile).join("")}</tbody></table>`;
}
const anUmrechnenCode = s => `${s.wert} := INT_TO_REAL(${s.temp}) * ${s.bereich}\n    / INT_TO_REAL(#RAW_NOMINAL);`;
function anUmrechnenHTML(z){
  const k = AN_WEGE[z.weg](z.roh, z.n.bis), real = z.weg === "Real";
  const scl = real ? bxSclHTML(anUmrechnenCode(z.s), [[z.s.wert, zfZahlText(k.wert), null], [z.s.temp, String(z.roh), null]])
    : `<p class="small muted">So rechnen zwei FUP-Boxen vom Typ Int hintereinander. Nicht nachbauen, nur ansehen.</p>`;
  const kl = anKennlinieSVG({roh: z.roh, wert: AN_WEGE.Real(z.roh, z.n.bis).wert, bis: z.n.bis, einheit: z.n.einheit, gueltig: anBereich(z.roh).gueltig});
  return `<div class="ia-satz${real ? "" : " warn"}">${anSatzWeg({z, k})}</div>`
    + `<div class="re-bild"><div class="an-spalte">${anSchritteHTML(k)}${scl}</div><div>${kl}</div></div>`;
}
function anNormHTML(z){
  const k = anNormScale(z.roh, z.n.bis), norm = "#tempNorm";
  const boxNorm = bxFupSVG({inst: "", titel: "NORM_X", typ: "Int to Real", ein: [{pin: "EN", name: "", wert: 1, bool: true},
    {pin: "MIN", name: "0", wert: ""}, {pin: "VALUE", name: z.s.temp, wert: String(z.roh)}, {pin: "MAX", name: "#RAW_NOMINAL", wert: String(AN_NENN)}],
    aus: [{pin: "ENO", name: "", wert: 1, bool: true}, {pin: "OUT", name: norm, wert: zfZahlText(k.norm)}]});
  const boxScale = bxFupSVG({inst: "", titel: "SCALE_X", typ: "Real to Real", ein: [{pin: "EN", name: "", wert: 1, bool: true},
    {pin: "MIN", name: "0.0", wert: ""}, {pin: "VALUE", name: norm, wert: zfZahlText(k.norm)}, {pin: "MAX", name: z.s.bereich, wert: `${z.n.bis}.0`}],
    aus: [{pin: "ENO", name: "", wert: 1, bool: true}, {pin: "OUT", name: z.s.wert, wert: zfZahlText(k.wert)}]});
  const code = [`${norm} := NORM_X(MIN := 0, VALUE := ${z.s.temp}, MAX := #RAW_NOMINAL);`,
    `${z.s.wert} := SCALE_X(MIN := 0.0, VALUE := ${norm}, MAX := ${z.s.bereich});`].join("\n");
  const status = [[z.s.wert, zfZahlText(k.wert), null], [norm, zfZahlText(k.norm), null], [z.s.temp, String(z.roh), null]];
  return `<div class="ia-satz${anBereich(z.roh).gueltig ? "" : " warn"}">${anSatzNorm({z, k})}</div>`
    + `<div class="an-boxen">${boxNorm}${boxScale}</div>${bxSclHTML(code, status)}`;
}
function anPruefenCode(z){
  const s = z.s;
  return [`IF ${s.test} THEN`, `  ${s.temp} := ${s.testRoh};   // Testwert`, "ELSE", `  ${s.temp} := ${s.roh};   // ${z.n.sensor}`, "END_IF;",
    `${s.gueltig} := ${s.temp} >= 0 AND ${s.temp} <= #RAW_NOMINAL;`, anUmrechnenCode(s),
    `${s.ok} := ${s.gueltig}`, `    AND ${s.wert} >= ${s.min} AND ${s.wert} <= ${s.max};`].join("\n");
}
function anPruefenHTML(z){
  const s = z.s, k = anPruefen({test: z.test, testRoh: z.testRoh, eingang: z.roh, bis: z.n.bis, min: z.n.min, max: z.n.max});
  const status = [[s.ok, k.ok ? "TRUE" : "FALSE", k.ok], [s.gueltig, k.gueltig ? "TRUE" : "FALSE", k.gueltig], [s.wert, zfZahlText(k.wert), null],
    [s.temp, String(k.roh), null], [s.test, z.test ? "TRUE" : "FALSE", z.test], [s.testRoh, String(z.testRoh), null], [s.roh, String(z.roh), null]];
  const lampen = `<div class="an-lampen">${bxLampe("gültig", s.gueltig, k.gueltig ? 1 : 0)}${bxLampe("im Bereich", s.ok, k.ok ? 1 : 0)}</div>`;
  return `<div class="ia-satz${k.ok ? " an" : k.gueltig ? "" : " warn"}">${anSatzPruefen({z, k})}</div>`
    + `<div class="re-bild"><div>${bxSclHTML(anPruefenCode(z), status)}</div><div class="an-spalte">${lampen}${anSkalaSVG(k.roh)}</div></div>`;
}
const AN_HTML = {KETTE: anKetteHTML, UMRECHNEN: anUmrechnenHTML, NORM_X: anNormHTML, PRUEFEN: anPruefenHTML};

function anBegriffeHTML(){
  return `<details class="ia-begriffe"><summary>Begriffe: ${AN_BEGRIFFE.map(b => b[0]).join(", ")}</summary><dl>`
    + AN_BEGRIFFE.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("") + `</dl></details>`;
}
function analogHTML(z){
  const tabs = bxTabs(z.ansichten.map(a => AN_ANSICHT[a]), AN_ANSICHT[z.ansicht], "ansicht");
  return `<div class="ia-kopf"><b>Probier es aus:</b> Gib Werte ein oder wähle ein Beispiel.${tabs}</div>`
    + `<div class="re-felder">${AN_FELDER[z.ansicht](z)}</div>` + anBeispieleHTML(z) + AN_HTML[z.ansicht](z) + anBegriffeHTML();
}

/* ---------- Aktionen ---------- */
function anPlus(z, k, d){
  if (k === "wert") { z.drahtbruch = false; return anWertSetzen(z, z.wert + +d); }
  z[k] = anInt(z[k] + +d);
  anTexteNeu(z);
}
function anBeispiel(z, i){
  const b = anBeispiele(z)[+i][1];
  if (b.drahtbruch) { z.drahtbruch = true; z.roh = 32767; return anTexteNeu(z); }
  if (b.wert !== undefined) { z.drahtbruch = false; return anWertSetzen(z, b.wert); }
  if (b.testRoh !== undefined) z.test = true;
  Object.assign(z, b);
  anTexteNeu(z);
}
const AN_AKTION = {
  ansicht: (z, name) => { z.ansicht = AN_CODE[name]; },
  weg: (z, w) => { z.weg = w; },
  plus: anPlus,
  bsp: anBeispiel,
  bruch: z => { z.drahtbruch = !z.drahtbruch; anWertSetzen(z, z.wert); },
  test: z => { z.test = !z.test; },
};
iaRegistrieren("analog", {
  titel: "Analogwert",
  neu: analogNeu,
  html: analogHTML,
  aktion: (z, akt, el) => {
    if (z.t[akt] !== undefined) return anEingabe(z, akt, el);
    const [name, ...werte] = akt.split(":");
    AN_AKTION[name](z, ...werte);
  },
});
