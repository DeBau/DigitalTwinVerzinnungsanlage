/* ---------- Interaktive Erklärung: Modell der IEC-Zähler CTU, CTD und CTUD ---------- */
// Verhalten genau nach der TIA-Hilfe V21 (FUP: „CTU: Vorwärts zählen“, „CTD: Rückwärts zählen“,
// „CTUD: Vorwärts und rückwärts zählen“), Datentyp Int. Ein Aufruf (zlAufruf) ist ein Programmzyklus:
// Der Zähler vergleicht CU und CD mit dem Wert vom letzten Aufruf und zählt nur bei einer steigenden Flanke.
//   CTU:  R = 1 setzt CV auf 0 (CU wirkt dann nicht), Q = CV >= PV
//   CTD:  LD wechselt auf 1: CV = PV (solange LD = 1, wirkt CD nicht), Q = CV <= 0
//   CTUD: R vor LD vor Zählen; Flanken an CU und CD im selben Aufruf: CV bleibt; QU = CV >= PV, QD = CV <= 0
// CV bleibt in den Grenzen von Int stehen und läuft nicht über.

export const ZL_INT = {min: -32768, max: 32767};
export const ZL_ARTEN = ["CTU", "CTD", "CTUD"];

export function zlModell(art, pv){
  const m = {art, pv, cu: 0, cd: 0, r: 0, ld: 0, cuAlt: 0, cdAlt: 0, ldAlt: 0, cv: 0, hinweis: "start", verlauf: []};
  zlMerken(m);
  return m;
}

// Ausgänge je Art aus CV und PV
const ZL_AUSGANG = {
  CTU: m => ({q: m.cv >= m.pv ? 1 : 0}),
  CTD: m => ({q: m.cv <= 0 ? 1 : 0}),
  CTUD: m => ({qu: m.cv >= m.pv ? 1 : 0, qd: m.cv <= 0 ? 1 : 0}),
};
export const zlAusgaenge = m => ZL_AUSGANG[m.art](m);

/* ---------- Ein Aufruf ---------- */
const zlSteigt = (m, k) => m[k] && !m[k + "Alt"];
function zlSchritt(m, richtung){
  const neu = m.cv + richtung;
  if (neu > ZL_INT.max || neu < ZL_INT.min) { m.hinweis = "grenze"; return; }
  m.cv = neu;
  m.hinweis = richtung > 0 ? "hoch" : "runter";
}
function zlZaehlen(m){
  const hoch = m.art !== "CTD" && zlSteigt(m, "cu"), runter = m.art !== "CTU" && zlSteigt(m, "cd");
  if (hoch && runter) { m.hinweis = "beide"; return; }
  if (hoch || runter) { zlSchritt(m, hoch ? 1 : -1); return; }
  m.hinweis = m.cu || m.cd ? "gehalten" : "ruhe";
}
function zlRuecksetzen(m){ m.cv = 0; m.hinweis = "reset"; }
function zlLaden(m){
  if (!zlSteigt(m, "ld")) { m.hinweis = "ldHalten"; return; }
  m.cv = m.pv; m.hinweis = "geladen";
}
// Vorrang: R vor LD vor Zählen; es gilt die erste Zeile, deren Bedingung erfüllt ist
const ZL_VORRANG = [
  [m => m.r && m.art !== "CTD", zlRuecksetzen],
  [m => m.ld && m.art !== "CTU", zlLaden],
  [() => true, zlZaehlen],
];
function zlMerken(m){
  m.cuAlt = m.cu; m.cdAlt = m.cd; m.ldAlt = m.ld;
  m.verlauf.push({cu: m.cu, cd: m.cd, r: m.r, ld: m.ld, cv: m.cv, ...zlAusgaenge(m)});
}
export function zlAufruf(m){
  ZL_VORRANG.find(([bedingung]) => bedingung(m))[1](m);
  zlMerken(m);
}

/* ---------- Bedienung: jede Änderung ist ein Aufruf ---------- */
export function zlSetze(m, k, wert){
  m[k] = wert;
  zlAufruf(m);
}
// Zähleingang kurz antippen: ein Aufruf mit 1, ein Aufruf mit 0; der Satz erklärt den ersten
export function zlTippen(m, k){
  zlSetze(m, k, 1);
  const hinweis = m.hinweis;
  zlSetze(m, k, 0);
  m.hinweis = hinweis;
}
export function zlPv(m, wert){
  m.pv = Math.max(ZL_INT.min, Math.min(ZL_INT.max, wert));
  zlAufruf(m);
  if (m.hinweis === "ruhe" || m.hinweis === "gehalten") m.hinweis = "pv";
}
