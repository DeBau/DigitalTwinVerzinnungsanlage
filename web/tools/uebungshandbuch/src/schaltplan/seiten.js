/* Seitenfolge des Schaltplans als Tabelle SEITENARTEN. Jede Art liefert aus dem Modell eine oder mehrere
   Seitenbeschreibungen. Gezeichnet wird später in plan.js; hier steht nur, was auf welche Seite kommt.
   Kanalseiten (Ein- und Ausgänge) werden zu Strompfaden umgeformt und mit derselben Pfad-Zeichnung gezeichnet. */
import { TABELLEN } from './tabellen.js';

const stueckeln = (liste, n) => Array.from({length: Math.ceil(liste.length / n)}, (_, i) => liste.slice(i * n, i * n + n));

/* ---------- Kanäle als Strompfade ---------- */
const PORT = /^(−\w+):(\w+):(\w+)$/;   // "−XD1:X0:4" oder "−QM1:0:14"

function portGlied(weg){
  const m = PORT.exec(weg || "");
  if (!m) return null;
  const istInsel = m[1].startsWith("−QM");
  return {sym: "port", bmk: istInsel ? m[1] : `${m[1]}:${m[2]}`, an: istInsel ? `Platz ${m[2]}, ${m[3]}` : `Pin ${m[3]}`};
}

const klemmGlied = k => k.klemme ? {sym: "klemme", bmk: k.klemme} : null;
const geraetGlied = k => ({sym: k.sym, bmk: k.bmk, an: k.typ === "AI" || k.typ === "AQ" ? "" : k.an, annahme: k.annahme});

function kontaktGlied(eintrag, sym){   // "−KF3:13/14" → Kontakt des Geräts −KF3
  if (!eintrag) return null;
  const [bmk, an] = eintrag.split(":");
  return {sym, bmk, an};
}

function kanalGlieder(k, plan){
  if (k.typ === "DI" || k.typ === "AI") return [geraetGlied(k), portGlied(k.weg), klemmGlied(k)].filter(Boolean);
  const vorher = [kontaktGlied(plan.abschalten[k.adr], "no"), klemmGlied(k), portGlied(k.weg), kontaktGlied(plan.verriegelung[k.adr], "nc")];
  return [...vorher, geraetGlied(k)].filter(Boolean);
}

function kanalSeite(typ, gruppe, modell, titel){
  const ersterKanal = gruppe[0];
  const istEingang = typ === "DI" || typ === "AI";
  const pfade = gruppe.map((k, i) => ({spalte: i + 1, glieder: kanalGlieder(k, modell.plan), kanal: k, titel: k.info ? k.info.n : k.signal}));
  return {typ: "pfade", art: istEingang ? "Eingänge" : "Ausgänge", titel, ort: "+A1", pfade, signaltext: true,
    oben: istEingang ? "L+" : null, oben2: istEingang ? "M" : null, unten: istEingang ? null : "M",
    modul: {lage: istEingang ? "unten" : "oben", typ, kanaele: gruppe, baugruppe: ersterKanal.modul,
      versorgung: typ === "DQ" ? modell.plan.versorgung["Q" + ersterKanal.teile.byte] : "L+"}};
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
  return Array.from({length: n}, (_, i) => ({typ: "tabelle", tabelle: name, art: "Liste", titel: t.titel + (i ? ` (Teil ${i + 1})` : ""), von: i * t.jeSeite,
    bis: Math.min(zeilen, (i + 1) * t.jeSeite)}));
}

// Alle Seiten mit Nummer; das Inhaltsverzeichnis kommt als Seite 2 dazu, sobald die Seitenzahl feststeht
export function seitenBauen(modell){
  const ohneInhalt = SEITENARTEN.flatMap(art => art(modell));
  const inhalt = tabellenSeiten("inhalt", modell, ohneInhalt.length + Math.ceil((ohneInhalt.length + 2) / TABELLEN.inhalt.jeSeite));
  const seiten = [ohneInhalt[0], ...inhalt, ...ohneInhalt.slice(1)];
  seiten.forEach((s, i) => { s.nr = i + 1; });
  return seiten;
}
