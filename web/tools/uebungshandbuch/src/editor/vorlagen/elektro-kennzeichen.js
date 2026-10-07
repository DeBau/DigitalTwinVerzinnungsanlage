// Kennzeichen und Anschlussnummern der Elektro-Vorlagen (Stromlaufplan, Hauptstromkreis).
// Kennzeichen: je Bausteinart fortlaufend (Gruppen-Haken kennzeichen), Kontakte übernehmen die zuletzt gesetzte Spule.
// Ordnungsziffern (EN 50005, IEC 60947-1 Anhang L): Die Kontakte eines Geräts (gleiches Kennzeichen) zählen von links
// nach rechts und oben nach unten: 1. Kontakt 13/14 (Schließer) bzw. 11/12 (Öffner), 2. Kontakt 23/24 bzw. 21/22 …
// Gespeichert bleiben die Anschlussnamen der Bausteinart (z. B. "13", "14"), angezeigt wird die Nummer mit Ordnungsziffer.
import { PH } from '../svg.js';
import { art } from '../registry.js';

/* ---------- Ordnungsziffern ---------- */
// Objekt-ID → Ordnungsziffer der Zeichnung, die gerade gezeichnet wird. merkeOrdnung füllt sie vor dem Zeichnen
// (Haken hintergrund des Stromlaufplans), zeichne und anschlussName der Kontakte lesen sie.
export const ORDNUNG = new Map();
const lageVon = o => [Math.floor(o.y / PH), o.x, o.y];
export const vorKontakt = (a, b) => {
  const p = lageVon(a), q = lageVon(b);
  return p[0] - q[0] || p[1] - q[1] || p[2] - q[2];
};
// Spulen mit Kontakten: Schütz, Hilfsschütz, Zeitrelais anzugs- und abfallverzögert
export const SPULEN = ["coil", "khs", "zan", "zab"];
export const spulenVon = d => (d.o || []).filter(o => SPULEN.includes(o.k));
export const kontakte = d => (d.o || []).filter(o => art(o.k).kontakt);
export function merkeOrdnung(d){
  ORDNUNG.clear();
  const zaehler = {};
  kontakte(d).filter(o => o.v).sort(vorKontakt).forEach(o => {
    zaehler[o.v] = (zaehler[o.v] || 0) + 1;
    ORDNUNG.set(o.id, zaehler[o.v]);
  });
}
// Funktionsziffern oben/unten: Schließer 3/4, Öffner 1/2
export const FUNKTION = {no: ["3", "4"], nc: ["1", "2"]};
export function kontaktNummern(o){
  const i = ORDNUNG.get(o.id) || 1;
  return FUNKTION[art(o.k).kontakt].map(f => i + f);
}
// Haken anschlussName eines Kontakts: gespeicherter Anschluss (oben oder unten) → angezeigte Nummer
export function kontaktAnschluss(o, n){
  const i = (art(o.k).anschluesse || []).findIndex(a => a[0] === n);
  return i >= 0 ? kontaktNummern(o)[i] : n;
}

// Angezeigter Name des Anschlusses n von o (Haken anschlussName, sonst n)
export const anschlussAnzeige = (o, n) => (art(o.k).anschlussName ? art(o.k).anschlussName(o, n) : n);

/* ---------- Kennzeichen ---------- */
// Vorsatz je Bausteinart; ab: kleinste Nummer (−KF1 ist die SPS, das Sicherheitsrelais beginnt bei −KF2)
export const VORSATZ = {
  coil: "−QA", mbv: "−MB", lamp: "−PF", tno: "−SF", tnc: "−SF", estop: "−SF", estop2: "−SF", key: "−SF",
  lsw: "−BG", sens: "−BG", khs: "−KF", zan: "−KF", zab: "−KF",
  fuse: "−FA", ps: "−TA", sr: "−KF", ls3: "−FA", ms3: "−FA", k3: "−QA", qs3: "−QB", m3: "−MA", fu: "−TA",
};
const AB = {sr: 2, khs: 2, zan: 2, zab: 2};
// Nummern n aller Kennzeichen „vorsatz n“ an Bausteinen mit diesem Vorsatz ("-" und "−" gelten gleich).
// Kontakte zählen nicht mit: Sie tragen das Kennzeichen ihrer Spule.
export function nummernMit(d, vorsatz){
  const muster = new RegExp("^[-−]" + vorsatz.slice(1) + "(\\d+)$");
  return (d.o || []).filter(o => VORSATZ[o.k] === vorsatz).map(o => muster.exec(o.v || "")).filter(Boolean).map(m => +m[1]);
}
export const naechste = (d, vorsatz, ab = 1) => vorsatz + (Math.max(ab - 1, ...nummernMit(d, vorsatz)) + 1);
// Kontakt: Kennzeichen der zuletzt gesetzten Spule
export function letzteSpule(d){
  const spulen = spulenVon(d).filter(o => o.v);
  return spulen.length ? spulen[spulen.length - 1].v : "−QA1";
}
// Klemme: nächste Nummer an der Klemmleiste −X1
export function naechsteKlemme(d){
  const n = (d.o || []).map(o => /^[-−]X1:(\d+)$/.exec(o.v || "")).filter(Boolean).map(m => +m[1]);
  return "−X1:" + (Math.max(0, ...n) + 1);
}
const BESONDERS = {msk: () => "−FA1", no: letzteSpule, nc: letzteSpule, term: naechsteKlemme, di8: () => "−KF1", dq8: () => "−KF1"};
// Gruppen-Haken kennzeichen(k, d, vorschlag): Vorschlag beim Setzen
export function kennzeichen(k, d, vorschlag){
  if (BESONDERS[k]) return BESONDERS[k](d);
  return VORSATZ[k] ? naechste(d, VORSATZ[k], AB[k]) : vorschlag;
}
