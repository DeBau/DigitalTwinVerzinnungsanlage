/* ---------- Interaktive Erklärungen: Speicher als KOP und FUP ---------- */
// Zeichnet SR-Box, RS-Box und die KOP-Selbsthaltung im Programmstatus wie in TIA: grün durchgezogen = erfüllt (1),
// blau gestrichelt = nicht erfüllt (0). So wie in der TIA-Hilfe V21 (SR, RS): Speicheroperand über der Box,
// in KOP die Eingänge über Kontakte, in FUP die Operanden direkt an den Eingängen.
// w: {s, r, qAlt, q} als 0/1, n: {s, r, q} Operanden (Kennzeichen schon mit „−“), pins: [[sig, Name], …] von oben.
// spBox, spPin, spSpule, spZuweisung und spSchiene benutzt auch flanke-bild.js.
import { iaLinie, iaStrich, iaSvg, iaText } from './basis.js';
import { kopKontakt } from './logik-bild.js';

/* ---------- Bausteine ---------- */
export const spSchiene = (y1, y2) => `<line x1="20" y1="${y1}" x2="20" y2="${y2}" class="ia-schiene"/>`;
export function spBox(x, y, b, h, titel, an){
  return `<rect x="${x}" y="${y}" width="${b}" height="${h}" rx="3" ${iaStrich(an)} fill="none"/>`
    + iaText(x + b / 2, y + 17, titel, "sp-titel");
}
// Name eines Anschlusses innen am Rand der Box
export const spPin = (x, y, text, anker = "start") => iaText(x, y + 4, text, "sp-pin", anker);
// KOP-Spule ( ) ab x, Operand darüber, optional ein Zeichen in der Spule (P, N) und ein Operand darunter (Flankenmerker)
export function spSpule(x, y, name, an, zeichen = "", unten = ""){
  const boegen = `<path d="M${x} ${y - 12} q-8 12 0 24 M${x + 16} ${y - 12} q8 12 0 24" ${iaStrich(an)} fill="none"/>`;
  const innen = zeichen ? iaText(x + 8, y + 5, zeichen, "sp-pin") : "";
  const drunter = unten ? iaText(x + 8, y + 30, unten, "ia-op") : "";
  return iaText(x + 8, y - 18, name, "ia-op") + boegen + innen + drunter;
}
// FUP-Zuweisung: Kasten mit „=“, Operand darüber
export function spZuweisung(x, y, name, an){
  return iaText(x + 25, y - 28, name, "ia-op") + `<rect x="${x}" y="${y - 20}" width="50" height="40" rx="3" ${iaStrich(an)} fill="none"/>`
    + iaText(x + 25, y + 6, "=", "ia-sym");
}
// FUP-Eingang: Operand über der Leitung, Leitung bis zur Box
const spFupEingang = (x1, x2, y, name, an) => iaText((x1 + x2) / 2, y - 7, name, "ia-op") + iaLinie(x1, y, x2, y, an);

/* ---------- SR und RS ---------- */
const SP_Y = [62, 112];
function spBoxKop(w, n, titel, pins){
  const eingang = ([sig], i) => iaLinie(20, SP_Y[i], 73, SP_Y[i], true) + kopKontakt({sig}, 80, SP_Y[i], w[sig], n)
    + iaLinie(87, SP_Y[i], 160, SP_Y[i], w[sig]);
  return spSchiene(24, 136) + pins.map(eingang).join("") + spBoxRest(w, n, titel, pins);
}
function spBoxFup(w, n, titel, pins){
  return pins.map(([sig], i) => spFupEingang(40, 160, SP_Y[i], n[sig], w[sig])).join("") + spBoxRest(w, n, titel, pins);
}
// Box mit Speicheroperand darüber, Anschlussnamen und Ausgang Q
function spBoxRest(w, n, titel, pins){
  const namen = pins.map(([, name], i) => spPin(165, SP_Y[i], name)).join("");
  return iaText(200, 26, n.q, "ia-op") + spBox(160, 34, 80, 98, titel, w.q) + namen
    + spPin(235, SP_Y[0], "Q", "end") + iaLinie(240, SP_Y[0], 300, SP_Y[0], w.q);
}
export const spSrKop = (w, n, titel, pins) => iaSvg(320, 146, spBoxKop(w, n, titel, pins), "KOP");
export const spSrFup = (w, n, titel, pins) => iaSvg(320, 146, spBoxFup(w, n, titel, pins), "FUP");

/* ---------- Spulen ( S ) und ( R ) in zwei Netzwerken ---------- */
// Wie in der TIA-Hilfe: KOP-Spule mit S oder R, darüber der Operand; FUP-Box S oder R, darüber der Operand.
// Die Spule zeigt im Programmstatus ihr VKE: Nur bei VKE 1 wird sie ausgeführt.
const SP_NETZ = [{sig: "s", zeichen: "S", y: 58, titel: "Netzwerk 1"}, {sig: "r", zeichen: "R", y: 150, titel: "Netzwerk 2"}];
function spNetzKop(netz, w, n){
  const {sig, zeichen, y, titel} = netz;
  return iaText(20, y - 40, titel, "sp-pin", "start") + spSchiene(y - 30, y + 24) + iaLinie(20, y, 103, y, true)
    + kopKontakt({sig}, 110, y, w[sig], n) + iaLinie(117, y, 240, y, w[sig]) + spSpule(240, y, n.q, w[sig], zeichen);
}
function spNetzFup(netz, w, n){
  const {sig, zeichen, y, titel} = netz;
  return iaText(20, y - 40, titel, "sp-pin", "start") + spFupEingang(40, 180, y, n[sig], w[sig])
    + iaText(200, y - 24, n.q, "ia-op") + spBox(180, y - 17, 40, 34, "", w[sig]) + iaText(200, y + 6, zeichen, "ia-sym");
}
export const spSpulenKop = (w, n) => iaSvg(300, 186, SP_NETZ.map(netz => spNetzKop(netz, w, n)).join(""), "KOP");
export const spSpulenFup = (w, n) => iaSvg(300, 186, SP_NETZ.map(netz => spNetzFup(netz, w, n)).join(""), "FUP");

/* ---------- Selbsthaltung ---------- */
// KOP: Schließer S parallel zum Haltekontakt Q, dahinter in Reihe der Öffner R, dann die Spule Q.
// Der Haltekontakt zeigt Q aus der vorigen Bearbeitung (qAlt): Diesen Wert liest die Anweisung, bevor die Spule schreibt.
export function spSelbstKop(w, n){
  const namen = {...n, halt: n.q}, parallel = w.s || w.qAlt;
  const oben = iaLinie(20, 62, 73, 62, true) + kopKontakt({sig: "s"}, 80, 62, w.s, namen) + iaLinie(87, 62, 140, 62, w.s);
  const unten = iaLinie(20, 122, 73, 122, true) + kopKontakt({sig: "halt"}, 80, 122, w.qAlt, namen) + iaLinie(87, 122, 140, 122, w.qAlt);
  const reihe = iaLinie(140, 62, 140, 122, parallel) + iaLinie(140, 62, 183, 62, parallel)
    + kopKontakt({sig: "r", neg: true}, 190, 62, !w.r, namen) + iaLinie(197, 62, 270, 62, w.q);
  return iaSvg(320, 150, spSchiene(24, 140) + oben + unten + reihe + spSpule(270, 62, n.q, w.q), "KOP");
}
// FUP: ODER aus S und Q, dann UND mit negiertem R, dann Zuweisung an Q
export function spSelbstFup(w, n){
  const parallel = w.s || w.qAlt;
  const oder = spFupEingang(10, 120, 50, n.s, w.s) + spFupEingang(10, 120, 90, n.q, w.qAlt)
    + `<rect x="120" y="30" width="50" height="80" rx="3" ${iaStrich(parallel)} fill="none"/>` + iaText(145, 52, ">=1", "ia-sym");
  const und = iaLinie(170, 70, 210, 70, parallel) + spFupEingang(10, 202, 130, n.r, w.r)
    + `<circle cx="206" cy="130" r="4" ${iaStrich(w.r)} fill="var(--panel)"/>`
    + `<rect x="210" y="50" width="50" height="100" rx="3" ${iaStrich(w.q)} fill="none"/>` + iaText(235, 72, "&", "ia-sym");
  return iaSvg(360, 160, oder + und + iaLinie(260, 70, 290, 70, w.q) + spZuweisung(290, 70, n.q, w.q), "FUP");
}
