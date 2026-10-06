const SIG = __SIG__;
const EXTRA = {
  MM1:"Einhängezylinder: Korb einhängen / lösen", MM2:"Tauchzylinder: heben / senken", MM3:"Verschiebezylinder: Band / Zinnbad",
  MM4:"Abstreifzylinder: Bad abdecken / öffnen", MM5:"Anschlag Übergabeplatz, Schwenkantrieb 90°", MM6:"Vereinzeler, Schwenkantrieb 90°",
  MM8:"Korbkipper, ISO 15552 Ø50/200", MA1:"Bandmotor Band 1", MA2:"Bandmotor Band 2", MA3:"Umwälzpumpe Sprühkühlung", MA4:"Vibrorinne",
  MA5:"Prüfband", MA6:"Rollenkurve 90°", MA7:"Rollenantrieb Kippmulde", KF1:"CPU 1516-3 PN/DP", S10:"Vor-Ort-Steuerstelle Band 1",
  S20:"Vor-Ort-Steuerstelle Band 2", S30:"Vor-Ort-Steuerstelle Rollenkurve", S40:"Vor-Ort-Steuerstelle Prüfstation", S50:"Vor-Ort-Steuerstelle Prüfband",
  QM2:"Ventilinsel Band", QM4:"Ventilinsel Prüfstation", A1:"Schaltschrank"
};
const STUFEN = [null,
  {n:"Grundlagen", c:"var(--s1)", ue:27, sub:"Verknüpfungen, Zeiten, Zähler an Signalen der Anlage – dann fahren Sie das Portal von Hand, sicher verriegelt."},
  {n:"Aufbau", c:"var(--s2)", ue:31, sub:"Betriebsarten, Befehlsausgabe, Automatik – dann Not-Halt, Band 1 und Übergabeplatz."},
  {n:"Vertiefung", c:"var(--s3)", ue:29, sub:"Förderstrecke, Prüfstation und erste Regelkreise."},
  {n:"Experte", c:"var(--s4)", ue:52, sub:"Stetige Regelung, Antriebe und die ganze Anlage."}];
const T = (head, rows) => ({head, rows});
const SHEETS = __SHEETS__;
const TEXTE = __TEXTE__;   // ausführliche Aufgabenbeschreibung und Fachwissen je Übung (texte/Lxx.json)
SHEETS.forEach(s => Object.assign(s, TEXTE[s.id] || {}));

const QUIZ = __QUIZ__;   // Kurz-Checks je Übung (quiz.js): {Lxx:{ein:[…], aus:[…]}}

const VORL = {
  grafcet:{n:"GRAFCET", d:"Ablauf nach DIN EN 60848 mit Symbollegende"},
  zustand:{n:"Zustandsdiagramm", d:"Zustände und Übergänge, z. B. für Übergaben und Antriebe"},
  wegschritt:{n:"Weg-Schritt-Diagramm", d:"Zylinderbewegungen über die Schritte"},
  stromlauf:{n:"Stromlaufplan", d:"Steuerstromkreis zwischen L+ und M – Taster, Not-Halt, SPS, Sicherheitsrelais"},
  leistung:{n:"Hauptstromkreis", d:"L1, L2, L3, N, PE – Schütze, Wendeschützschaltung, Motorschutz, Motoren, Umrichter"},
  pneumatik:{n:"Pneumatikschaltplan", d:"Zylinder, Wegeventile, Drosseln nach ISO 1219 – mit Simulation"},
  regelkreis:{n:"Regelkreis", d:"Blockschaltbild Regler, Stellglied, Strecke, Messglied"},
  trend:{n:"Trendaufzeichnung", d:"Istwert, Sollwert und Stellgröße über der Zeit"},
  raster:{n:"Kästchenraster", d:"5-mm-Raster für alles Weitere"}
};
const EXVORL = {L01:["raster"],L02:["raster"],L03:["raster"],L04:["trend","raster"],L05:["raster"],L06:["raster"],L07:["stromlauf","raster"],L12:["grafcet","wegschritt","pneumatik"],L13:["grafcet","zustand"],L08:["pneumatik","raster"],L09:["zustand","raster"],L10:["zustand","raster"],L11:["stromlauf","raster"],L14:["zustand","stromlauf"],L15:["stromlauf","leistung"],
  L16:["grafcet","wegschritt","pneumatik"],L17:["wegschritt","pneumatik"],L18:["zustand"],L19:["raster"],L20:["grafcet"],L21:["zustand","pneumatik"],L22:["regelkreis"],L23:["regelkreis","trend"],
  L24:["regelkreis","trend"],L25:["regelkreis","trend"],L26:["zustand"],L27:["zustand","leistung"],L28:["zustand"],L29:["raster"],L30:["zustand","leistung"],L31:["raster"],L32:["grafcet","zustand","stromlauf","leistung","pneumatik"]};
const CYL = {L16:["−MM5","−MM6","−MM1","−MM2"]};
const PHASES = [null,
  {n:"Informieren", s:"Situation und Signale"},
  {n:"Planen", s:"Leitfragen, Skizzen, Variablen"},
  {n:"Entscheiden", s:"Fachgespräch und Freigabe"},
  {n:"Ausführen", s:"Programmieren, in Betrieb nehmen"},
  {n:"Kontrollieren", s:"Prüfprotokoll"},
  {n:"Bewerten", s:"Selbsteinschätzung"}];

