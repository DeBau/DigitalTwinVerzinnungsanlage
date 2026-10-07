export const SIG = __SIG__;
export const EXTRA = {
  MM1:"Einhängezylinder: Korb einhängen / lösen", MM2:"Tauchzylinder: heben / senken", MM3:"Verschiebezylinder: Band / Zinnbad",
  MM4:"Abstreifzylinder: Bad abdecken / öffnen", MM5:"Anschlag Übergabeplatz, Schwenkantrieb 90°", MM6:"Vereinzeler, Schwenkantrieb 90°",
  MM8:"Korbkipper, ISO 15552 Ø50/200", MA1:"Bandmotor Band 1", MA2:"Bandmotor Band 2", MA3:"Umwälzpumpe Sprühkühlung", MA4:"Vibrorinne",
  MA5:"Prüfband", MA6:"Rollenkurve 90°", MA7:"Rollenantrieb Kippmulde", KF1:"CPU 1516-3 PN/DP", S10:"Vor-Ort-Steuerstelle Band 1",
  S20:"Vor-Ort-Steuerstelle Band 2", S30:"Vor-Ort-Steuerstelle Rollenkurve", S40:"Vor-Ort-Steuerstelle Prüfstation", S50:"Vor-Ort-Steuerstelle Prüfband",
  QM2:"Ventilinsel Band", QM4:"Ventilinsel Prüfstation", A1:"Schaltschrank"
};
export const STUFEN = [null,
  {n:"Grundlagen", c:"var(--s1)", sub:"Verknüpfungen, Zeiten, Zähler an Signalen der Anlage. Danach fährst du das Portal von Hand, sicher verriegelt."},
  {n:"Aufbau", c:"var(--s2)", sub:"Betriebsarten, Befehlsausgabe, Automatik. Danach Not-Halt, Band 1 und Übergabeplatz."},
  {n:"Vertiefung", c:"var(--s3)", sub:"Förderstrecke, Prüfstation und erste Regelkreise."},
  {n:"Experte", c:"var(--s4)", sub:"Stetige Regelung, Antriebe und die ganze Anlage."}];
export const T = (head, rows) => ({head, rows});
export const SHEETS = __SHEETS__;
export const TEXTE = __TEXTE__;   // ausführliche Aufgabenbeschreibung und Fachwissen je Übung (texte/Lxx.json)
SHEETS.forEach(s => Object.assign(s, TEXTE[s.id] || {}));
// UE je Stufe und gesamt aus den Übungen berechnet (keine festen Zahlen)
STUFEN.forEach((st, n) => { if (st) st.ue = SHEETS.filter(s => s.st === n).reduce((a, s) => a + (+s.ue || 0), 0); });
export const UE_GESAMT = SHEETS.reduce((a, s) => a + (+s.ue || 0), 0);

export const QUIZ = __QUIZ__;   // Kurz-Checks je Übung (quiz.js): {Lxx:{ein:[…], aus:[…]}}

// Skizzenvorlagen je Übung (Nummerierung mit 37 Übungen). Eine einmal angebotene Vorlage bleibt stehen, damit gespeicherte
// Skizzen erreichbar bleiben. Ergänzt nach vorlagen-skizzen.md, soweit es den Vorlagentyp schon gibt.
export const EXVORL = {L01:["raster"],L02:["raster"],L03:["raster"],L04:["trend","raster"],L05:["raster"],
  L06:["raster"],L07:["raster"],L08:["raster"],L09:["raster"],L10:["raster"],L11:["trend","raster"],
  L12:["stromlauf","raster"],L13:["pneumatik","raster"],L14:["zustand","raster"],L15:["zustand","raster"],L16:["stromlauf","raster"],
  L17:["grafcet","wegschritt","pneumatik","raster"],L18:["grafcet","zustand"],L19:["zustand","stromlauf"],L20:["stromlauf","leistung"],
  L21:["grafcet","wegschritt","pneumatik","trend"],L22:["grafcet","wegschritt","pneumatik"],L23:["zustand"],L24:["raster"],L25:["grafcet"],
  L26:["zustand","pneumatik","trend","raster"],L27:["regelkreis","trend","raster"],L28:["regelkreis","trend"],L29:["regelkreis","trend"],
  L30:["regelkreis","trend"],L31:["zustand"],L32:["zustand","leistung"],L33:["zustand"],L34:["raster"],L35:["zustand","leistung"],L36:["raster"],
  L37:["grafcet","zustand","stromlauf","leistung","pneumatik","raster"]};
export const CYL = {L16:["−MM5","−MM6","−MM1","−MM2"]};
export const PHASES = [null,
  {n:"Informieren", s:"Situation und Signale"},
  {n:"Planen", s:"Leitfragen, Skizzen, Variablen"},
  {n:"Entscheiden", s:"Fachgespräch und Freigabe"},
  {n:"Ausführen", s:"Programmieren, in Betrieb nehmen"},
  {n:"Kontrollieren", s:"Prüfprotokoll"},
  {n:"Bewerten", s:"Selbsteinschätzung"}];

/* ---------- Programmierrichtlinien nach Siemens (Programmierleitfaden und Programmierstyleguide S7-1200/S7-1500, Beitrags-ID 81318674) ---------- */
export const STIL = __STIL__;   // Programmierrichtlinien einzeln, je mit Übung ab der sie gelten (stil.js): [{ab, t, w, q}]
// Bewertungsraster je Übungstyp: [Kriterium, Höchstpunkte, erfüllt wenn, [Niveaustufe 1, 2, 3, 4]].
// Die Niveaustufen passen zur Selbsteinschätzung (1 noch nicht, 2 mit Hilfe, 3 selbstständig, 4 sicher und kann es erklären).
// Speicherschlüssel der Punkte: Lxx:bew:<Index im Raster der Übung>.
export const CRITS = {
  programmieren: [
    ["Planung",15,"Skizze vollständig, Leitfragen fachlich richtig",["Skizze oder Leitfragen fehlen oder sind fachlich falsch","Skizze und Leitfragen erst mit Hilfe vollständig","Skizze vollständig, Leitfragen fachlich richtig","zusätzlich begründet und mit Randfällen geplant"]],
    ["Funktion",30,"alle Prüffälle bestanden, Ereignisliste ohne Meldungen",["Programm läuft nicht oder nur in Teilen","Grundfunktion läuft, mehrere Prüffälle offen","alle Prüffälle bestanden","alle Prüffälle bestanden, Ereignisliste ohne Meldungen, auch Randfälle sicher"]],
    ["Fehlerverhalten",20,"geforcte Fehler erkannt, gemeldet, sicher behandelt; kein selbstständiger Wiederanlauf",["Fehler werden nicht erkannt","einzelne Fehler erkannt, Reaktion unvollständig","geforcte Fehler erkannt, gemeldet und sicher behandelt","zusätzlich kein selbstständiger Wiederanlauf, Ursache für den Bediener klar"]],
    ["Programmstruktur",15,"Stil-Check der Übung erfüllt: Bausteinaufteilung, Bezeichner, Schnittstellen nach Siemens-Styleguide",["Stilregeln überwiegend nicht eingehalten","einige Stilregeln eingehalten","alle Regeln des Stil-Checks dieser Übung eingehalten","zusätzlich übersichtlich, wiederverwendbar und begründet aufgeteilt"]],
    ["Dokumentation",10,"Prüfprotokoll ausgefüllt, Änderungen nachvollziehbar",["Prüfprotokoll fehlt","Prüfprotokoll lückenhaft","Prüfprotokoll vollständig, Änderungen nachvollziehbar","zusätzlich Fehleranalyse und Bausteinkopf vorbildlich"]],
    ["Fachgespräch",10,"Lösung begründet, Alternativen benannt, Transfer auf reale Anlage",["Lösung kann nicht erklärt werden","Lösung mit Hilfe erklärt","Lösung begründet, Alternative benannt","zusätzlich sicherer Transfer auf eine reale Anlage"]]],
  erkunden: [
    ["Planung",15,"Leitfragen fachlich richtig, Vorgehen der Untersuchung geplant",["Leitfragen fehlen oder sind falsch","Leitfragen mit Hilfe beantwortet","Leitfragen richtig, Vorgehen geplant","zusätzlich begründet, was wie beobachtet wird"]],
    ["Beobachtung",30,"alle Signale gefunden, Beobachtungen vollständig und richtig notiert",["Signale kaum gefunden, Beobachtungen fehlen","einzelne Signale gefunden, Notizen lückenhaft","alle Signale gefunden, Beobachtungen vollständig","zusätzlich Auffälligkeiten erkannt und genau beschrieben"]],
    ["Auswertung",25,"Ergebnisse richtig aus den Beobachtungen abgeleitet, Kontrollfragen richtig",["keine Schlüsse gezogen","Schlüsse nur mit Hilfe","Ergebnisse richtig abgeleitet, Kontrollfragen richtig","zusätzlich Zusammenhänge erklärt und Folgen für das Programm benannt"]],
    ["Dokumentation",15,"Prüfprotokoll und Notizen vollständig und nachvollziehbar",["Unterlagen fehlen","Unterlagen lückenhaft","Unterlagen vollständig und nachvollziehbar","zusätzlich so klar, dass andere damit weiterarbeiten können"]],
    ["Fachgespräch",15,"Beobachtungen erklärt, Fachbegriffe richtig verwendet",["Beobachtungen können nicht erklärt werden","mit Hilfe erklärt","sicher erklärt, Fachbegriffe richtig","zusätzlich Transfer auf eine reale Anlage"]]],
  auslegen: [
    ["Planung",15,"Messplan oder Vorgehen vollständig, Leitfragen fachlich richtig",["Plan fehlt","Plan mit Hilfe vollständig","Plan vollständig, Leitfragen richtig","zusätzlich Messfehler und Randbedingungen bedacht"]],
    ["Messung und Versuch",25,"Messwerte vollständig, sauber erfasst und plausibel",["Messwerte fehlen oder sind unbrauchbar","Messwerte lückenhaft","Messwerte vollständig und plausibel","zusätzlich wiederholt und Streuung bewertet"]],
    ["Berechnung und Auslegung",25,"Werte richtig berechnet, Annahmen und Zuschläge begründet",["Rechnung fehlt oder ist falsch","Rechnung mit Hilfe richtig","Werte richtig, Annahmen begründet","zusätzlich Grenzen der Auslegung erkannt"]],
    ["Umsetzung",15,"Auslegung im Programm übernommen und am Zwilling geprüft",["nicht umgesetzt","teilweise umgesetzt","umgesetzt und geprüft","zusätzlich Wirkung gemessen und bewertet"]],
    ["Dokumentation",10,"Vorlagen und Prüfprotokoll ausgefüllt, Werte nachvollziehbar",["Unterlagen fehlen","Unterlagen lückenhaft","Unterlagen vollständig, Werte nachvollziehbar","zusätzlich übersichtlich für die Inbetriebnahme aufbereitet"]],
    ["Fachgespräch",10,"Auslegung begründet, Alternativen benannt",["Auslegung kann nicht erklärt werden","mit Hilfe erklärt","Auslegung begründet, Alternative benannt","zusätzlich Transfer auf eine reale Anlage"]]],
  projekt: [
    ["Planung und Pflichtenheft",15,"Pflichtenheft, Aufteilung im Team und Zeitplan vollständig",["Planung fehlt","Planung mit Hilfe vollständig","Pflichtenheft, Aufteilung und Zeitplan vollständig","zusätzlich Risiken und Schnittstellen im Team geklärt"]],
    ["Funktion",20,"Gesamtanlage läuft, alle Prüffälle bestanden",["Anlage läuft nicht","Teilanlagen laufen einzeln","alle Prüffälle bestanden","zusätzlich stabiler Dauerbetrieb ohne Meldungen"]],
    ["Fehlerverhalten",15,"Fehler erkannt, gemeldet, sicher behandelt; kein selbstständiger Wiederanlauf",["Fehler werden nicht erkannt","einzelne Fehler erkannt","Fehler erkannt, gemeldet und sicher behandelt","zusätzlich verdeckte Fehler schnell gefunden"]],
    ["Programmstruktur",10,"alle Stilregeln eingehalten, Bausteine sauber zusammengeführt",["Stilregeln überwiegend nicht eingehalten","einige Stilregeln eingehalten","alle Stilregeln eingehalten","zusätzlich einheitlich und wiederverwendbar zusammengeführt"]],
    ["Dokumentation",10,"Inbetriebnahmeprotokoll und Übergabe vollständig",["Unterlagen fehlen","Unterlagen lückenhaft","Unterlagen vollständig","zusätzlich übergabereif für Betreiber und Service"]],
    ["Einzelanteil",15,"eigener Anteil je Person benannt, nachvollziehbar und funktionsfähig",["eigener Anteil nicht erkennbar","eigener Anteil erkennbar, aber unvollständig","eigener Anteil vollständig und funktionsfähig","zusätzlich Verantwortung für Schnittstellen übernommen"]],
    ["Fachgespräch",15,"je Person einzeln: eigene Lösung begründet, Fragen zum Gesamtsystem beantwortet",["eigene Lösung kann nicht erklärt werden","mit Hilfe erklärt","eigene Lösung begründet, Fragen zum Gesamtsystem beantwortet","zusätzlich sicherer Transfer auf eine reale Anlage"]]]
};
export const CRIT = CRITS.programmieren;
export const critOf = ex => CRITS[(ex && ex.typ) || "programmieren"] || CRIT, TYPN = {erkunden:"Erkunden", programmieren:"Programmieren", auslegen:"Auslegen", projekt:"Projekt"};
export const critMax = crit => crit.reduce((a, c) => a + c[1], 0);
export const bewKey = (id, i) => `${id}:bew:${i}`;
export const gradeOf = p => p >= 92 ? "1 sehr gut" : p >= 81 ? "2 gut" : p >= 67 ? "3 befriedigend" : p >= 50 ? "4 ausreichend" : p >= 30 ? "5 mangelhaft" : "6 ungenügend";
