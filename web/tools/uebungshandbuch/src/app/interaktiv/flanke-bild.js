/* ---------- Interaktive Erklärungen: Flankenauswertungen als KOP und FUP ---------- */
// Zeichnet die Flankenanweisungen der S7-1500 im Programmstatus wie in TIA (Symbole nach TIA-Hilfe V21):
//   kontakt: KOP --|P|--, FUP-Box P; Operand darüber, Flankenmerker darunter
//   spule:   KOP --(P)--, FUP-Box P=; zu setzender Operand darüber, Flankenmerker darunter
//   trig:    Box P_TRIG mit CLK und Q, Flankenmerker unter der Box
//   fb:      FB R_TRIG mit Instanz über der Box, EN, CLK, Q, ENO
// w: {e, q} als 0/1. n: {e, m, q, inst} Operanden. d: {typ, zeichen "P"/"N", box "P_TRIG", fb "R_TRIG"} aus flanke.js.
import { iaLinie, iaStrich, iaSvg, iaText } from './basis.js';
import { kopKontakt } from './logik-bild.js';
import { spBox, spPin, spSchiene, spSpule, spZuweisung } from './speicher-bild.js';

// Schließer am Anfang des Netzwerks: Schiene, Kontakt, Leitung bis x
const flSchliesser = (w, n, y, bis) => iaLinie(20, y, 73, y, true) + kopKontakt({sig: "e"}, 80, y, w.e, n) + iaLinie(87, y, bis, y, w.e);

/* ---------- KOP ---------- */
function flKopKontakt(w, n, d){
  const kontakt = kopKontakt({sig: "e"}, 120, 60, w.q, n) + iaText(120, 65, d.zeichen, "sp-pin") + iaText(120, 90, n.m, "ia-op");
  return iaSvg(360, 110, spSchiene(24, 96) + iaLinie(20, 60, 113, 60, true) + kontakt + iaLinie(127, 60, 300, 60, w.q)
    + spSpule(300, 60, n.q, w.q), "KOP");
}
function flKopSpule(w, n, d){
  return iaSvg(360, 110, spSchiene(24, 96) + flSchliesser(w, n, 60, 260) + spSpule(260, 60, n.q, w.q, d.zeichen, n.m), "KOP");
}
function flKopTrig(w, n, d){
  const box = spBox(160, 36, 80, 50, d.box, w.q) + spPin(165, 70, "CLK") + spPin(235, 70, "Q", "end") + iaText(200, 104, n.m, "ia-op");
  return iaSvg(360, 120, spSchiene(24, 100) + flSchliesser(w, n, 70, 160) + box + iaLinie(240, 70, 300, 70, w.q)
    + spSpule(300, 70, n.q, w.q), "KOP");
}
// In KOP fließt der Strom von der Schiene in EN, das Signal über einen Kontakt an CLK, der Operand steht an Q
function flKopFb(w, n, d){
  const box = iaText(205, 24, n.inst, "ia-op") + spBox(160, 32, 90, 78, d.fb, true)
    + spPin(165, 56, "EN") + spPin(245, 56, "ENO", "end") + spPin(165, 92, "CLK") + spPin(245, 92, "Q", "end");
  const aussen = iaLinie(20, 56, 160, 56, true) + iaLinie(250, 56, 280, 56, true) + iaLinie(250, 92, 275, 92, w.q)
    + iaText(280, 96, n.q, "ia-op", "start");
  return iaSvg(380, 124, spSchiene(24, 108) + flSchliesser(w, n, 92, 160) + box + aussen, "KOP");
}

/* ---------- FUP ---------- */
function flFupKontakt(w, n, d){
  const box = iaText(130, 32, n.e, "ia-op") + spBox(110, 40, 40, 40, "", w.q) + iaText(130, 66, d.zeichen, "ia-sym") + iaText(130, 98, n.m, "ia-op");
  return iaSvg(330, 112, box + iaLinie(150, 60, 240, 60, w.q) + spZuweisung(240, 60, n.q, w.q), "FUP");
}
function flFupSpule(w, n, d){
  const box = iaText(205, 32, n.q, "ia-op") + spBox(180, 40, 50, 40, "", w.q) + iaText(205, 66, d.zeichen + "=", "ia-sym") + iaText(205, 98, n.m, "ia-op");
  return iaSvg(300, 112, iaText(110, 53, n.e, "ia-op") + iaLinie(40, 60, 180, 60, w.e) + box, "FUP");
}
function flFupTrig(w, n, d){
  const box = spBox(150, 36, 80, 50, d.box, w.q) + spPin(155, 70, "CLK") + spPin(225, 70, "Q", "end") + iaText(190, 104, n.m, "ia-op");
  return iaSvg(340, 116, iaText(95, 63, n.e, "ia-op") + iaLinie(40, 70, 150, 70, w.e) + box + iaLinie(230, 70, 270, 70, w.q)
    + spZuweisung(270, 70, n.q, w.q), "FUP");
}
// In FUP stehen links EN und CLK, rechts Q und ENO; EN bleibt hier unbeschaltet
function flFupFb(w, n, d){
  const box = iaText(195, 24, n.inst, "ia-op") + spBox(150, 32, 90, 78, d.fb, true)
    + spPin(155, 56, "EN") + spPin(235, 56, "Q", "end") + spPin(155, 92, "CLK") + spPin(235, 92, "ENO", "end");
  const aussen = iaText(95, 85, n.e, "ia-op") + iaLinie(40, 92, 150, 92, w.e) + iaLinie(240, 56, 265, 56, w.q)
    + iaText(270, 60, n.q, "ia-op", "start");
  return iaSvg(370, 120, box + aussen, "FUP");
}

const FL_BILD = {
  kontakt: {KOP: flKopKontakt, FUP: flFupKontakt},
  spule: {KOP: flKopSpule, FUP: flFupSpule},
  trig: {KOP: flKopTrig, FUP: flFupTrig},
  fb: {KOP: flKopFb, FUP: flFupFb},
};
export const flBildSVG = (ansicht, w, n, d) => FL_BILD[d.typ][ansicht](w, n, d);
