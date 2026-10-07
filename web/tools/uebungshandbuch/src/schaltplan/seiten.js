/* Seitenfolge des Schaltplans als Tabelle SEITENARTEN. Jede Art liefert aus dem Modell eine oder mehrere
   Seitenbeschreibungen. Gezeichnet wird später in plan.js; hier steht nur, was auf welche Seite kommt.
   Kanalseiten (Ein- und Ausgänge) werden zu Strompfaden umgeformt und mit derselben Pfad-Zeichnung gezeichnet. */
import { TABELLEN } from './tabellen.js';

const stueckeln = (liste, n) => Array.from({length: Math.ceil(liste.length / n)}, (_, i) => liste.slice(i * n, i * n + n));

/* ---------- Kanäle als Strompfade ---------- */
const PORT = /^(−\w+):(\w+):(\w+)$/;   // "−XD1:X0:4" oder "−QM1:0:14"

// Steckverbinder am Feldverteiler oder an der Ventilinsel, mit dem Kabel zum Schaltschrank
function portGlied(weg, plan){
  const m = PORT.exec(weg || "");
  if (!m) return null;
  const istInsel = m[1].startsWith("−QM"), quelle = (istInsel ? plan.ventilinseln : plan.feldverteiler)[m[1]];
  return {sym: "port", bmk: istInsel ? m[1] : `${m[1]}:${m[2]}`, an: istInsel ? `Platz ${m[2]}, ${m[3]}` : `Pin ${m[3]}`,
    kabel: quelle ? quelle.kabel : ""};
}

const klemmGlied = k => k.klemme ? {sym: "klemme", bmk: k.klemme} : null;
const geraetGlied = k => ({sym: k.sym, bmk: k.bmk, an: k.analog ? "" : k.an, annahme: k.annahme});

function kontaktGlied(eintrag, sym){   // "−QA2:21/22" → Kontakt des Geräts −QA2
  if (!eintrag) return null;
  const [bmk, an] = eintrag.split(":");
  return {sym, bmk, an};
}

const GLIEDER = {
  DI: (k, plan) => [geraetGlied(k), portGlied(k.weg, plan), klemmGlied(k)],
  AI: k => [geraetGlied(k), klemmGlied(k)],
  DQ: (k, plan) => [klemmGlied(k), portGlied(k.weg, plan), kontaktGlied(plan.verriegelung[k.adr], "nc"), geraetGlied(k)],
  AQ: k => [klemmGlied(k), geraetGlied(k)],
};

// Oberer Anschluss eines Analoggeräts: Potentiometer an der 10-V-Referenz, aktives Gerät an seiner 24-V-Speisung,
// 2-Leiter-Messumformer frei (er wird über den zweiten Leiter von der Baugruppe gespeist)
function analogAnfang(k, plan){
  if (k.sym === "poti") return {von: "+10V"};
  const speisung = (plan.speisung || {})[k.bmk];
  return speisung && !k.analog.vonOben ? {von: speisung} : {frei: true};
}

// Ein Kanal als Strompfad. Spulen in gemischten Ausgangsbytes enden am geschalteten M (M3S usw.).
function kanalPfad(k, i, plan){
  const pfad = {spalte: i + 1, glieder: GLIEDER[k.typ](k, plan).filter(Boolean), kanal: k, titel: k.info ? k.info.n : k.signal};
  if (k.typ === "AI") Object.assign(pfad, analogAnfang(k, plan));
  if (plan.abschalten[k.adr]) Object.assign(pfad, {bis: plan.abschalten[k.adr], definiert: "keine"});
  return pfad;
}

// Schienen je Kanalart: Eingänge hängen an ihrer Versorgung und M, Ausgänge enden an M
const SCHIENEN = {DI: v => ({oben: v, oben2: "M"}), AI: () => ({}), DQ: () => ({unten: "M"}), AQ: () => ({unten: "M"})};

function kanalSeite(typ, gruppe, modell, titel){
  const erster = gruppe[0], istEingang = typ === "DI" || typ === "AI";
  return {typ: "pfade", art: istEingang ? "Eingänge" : "Ausgänge", titel, ort: "+A1", signaltext: true,
    pfade: gruppe.map((k, i) => kanalPfad(k, i, modell.plan)), oben: null, oben2: null, unten: null,
    ...SCHIENEN[typ](erster.versorgung),
    modul: {lage: istEingang ? "unten" : "oben", typ, kanaele: gruppe, baugruppe: erster.modul, versorgung: erster.versorgung}};
}

function digitalSeiten(typ, modell){
  const kanaele = modell.kanaele.filter(k => k.typ === typ);
  const bytes = [...new Set(kanaele.map(k => k.teile.byte))];
  const zeichen = typ === "DI" ? "I" : "Q";
  return bytes.map(b => kanalSeite(typ, kanaele.filter(k => k.teile.byte === b), modell,
    `${typ === "DI" ? "Eingänge" : "Ausgänge"} %${zeichen}${b}.0 bis %${zeichen}${b}.7`));
}

function analogSeiten(modell){
  const ai = modell.kanaele.filter(k => k.typ === "AI"), aq = modell.kanaele.filter(k => k.typ === "AQ");
  return [kanalSeite("AI", ai, modell, "Analogeingänge %IW64 bis %IW74"), kanalSeite("AQ", aq, modell, "Analogausgang %QW80")];
}

/* ---------- Strompfadseiten aus den Plandaten ---------- */
function pfadSeite(daten){
  const n = daten.pfade.length, versatz = n <= 9 ? 1 : 0;
  const pfade = daten.pfade.map((p, i) => ({...p, spalte: i + versatz}));
  return {typ: "pfade", art: "Steuerstromkreis", titel: daten.titel, ort: "+A1", pfade, quelle: daten.quelle,
    oben: daten.oben, oben2: null, unten: daten.unten, signaltext: false};
}

/* ---------- Tabelle der Seitenarten in Planreihenfolge ---------- */
const SEITENARTEN = [
  m => [{typ: "block", block: "deckblatt", art: "Deckblatt", titel: "Schaltplan der Anlage"}],
  m => [{typ: "block", block: "hinweise", art: "Übersicht", titel: "Hinweise und Legende"}],
  m => [{typ: "einspeisung", art: "Hauptstromkreis", titel: "Einspeisung 400 V"}],
  m => stueckeln(m.leistung, 3).map(a => ({typ: "leistung", art: "Hauptstromkreis", titel: a.map(x => x.titel).join(", "), abgaenge: a})),
  m => m.pfadseiten.map(pfadSeite),
  m => [{typ: "block", block: "sps", art: "SPS", titel: "SPS-Übersicht −KF1"}],
  m => digitalSeiten("DI", m),
  m => digitalSeiten("DQ", m),
  m => analogSeiten(m),
  m => [{typ: "block", block: "profinet", art: "SPS", titel: "PROFINET und Umrichter-Telegramme"}],
  m => [{typ: "block", block: "feldverteiler", art: "Feld", titel: "Feldverteiler"}],
  m => [{typ: "block", block: "ventilinseln", art: "Feld", titel: "Ventilinseln"}],
  m => tabellenSeiten("klemmen", m),
  m => tabellenSeiten("betriebsmittel", m),
  m => tabellenSeiten("signale", m),
];

function tabellenSeiten(name, modell, anzahl){
  const t = TABELLEN[name], zeilen = anzahl ?? t.anzahl(modell), n = Math.max(1, Math.ceil(zeilen / t.jeSeite));
  return Array.from({length: n}, (_, i) => ({typ: "tabelle", tabelle: name, art: "Liste",
    titel: t.titel + (i ? ` (Teil ${i + 1})` : ""), von: i * t.jeSeite, bis: Math.min(zeilen, (i + 1) * t.jeSeite)}));
}

// Alle Seiten mit Nummer; das Inhaltsverzeichnis kommt als Seite 2 dazu, sobald die Seitenzahl feststeht
export function seitenBauen(modell){
  const ohneInhalt = SEITENARTEN.flatMap(art => art(modell));
  // Das Inhaltsverzeichnis listet auch seine eigenen Seiten. Geschätzt: alle übrigen Seiten plus die Seiten,
  // die es selbst braucht (mit 2 Zeilen Reserve, damit die Schätzung bei einem Seitenwechsel nicht zu knapp wird).
  const eigene = Math.ceil((ohneInhalt.length + 2) / TABELLEN.inhalt.jeSeite);
  const inhalt = tabellenSeiten("inhalt", modell, ohneInhalt.length + eigene);
  const seiten = [ohneInhalt[0], ...inhalt, ...ohneInhalt.slice(1)];
  seiten.forEach((s, i) => { s.nr = i + 1; });
  return seiten;
}
