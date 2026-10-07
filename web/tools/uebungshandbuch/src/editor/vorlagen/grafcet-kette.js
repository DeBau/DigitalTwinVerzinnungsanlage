// GRAFCET: Regeln beim Bearbeiten der Ablaufkette. Haken der Gruppe grafcet (registriert in vorlagen/grafcet.js):
// nachSetzen und vorVerbinden halten den Wechsel von Schritt und Transition ein (zwischen zwei Schritten kommt von selbst
// eine Transition, zwei Transitionen hintereinander lehnt der Editor mit Hinweis ab).
import { ED, istMarkiert } from '../status.js';
import { kettenAus } from '../bausteine.js';
import { objById, uid } from '../auswahl.js';
import { FELDER_JE_ART } from '../eigenschaften.js';
import { isAct, isStep, isTrans } from './grafcet-aktion.js';

export const TEILUNG = 100;   // Abstand zweier Schritte in der Kette (Schritt 40, Linie 30, Transition, Linie 30)
export const TEXT_TRANS_TRANS = "Auf eine Transition folgt immer ein Schritt. Setz zuerst einen Schritt dazwischen, "
  + "dann verbindest du ihn mit der nächsten Transition.";

/* ---------- Bausteine und Verbindungen in der Zeichnung d ---------- */
export const objIn = (d, id) => d.o.find(o => o.id === id);
export const verknuepfe = (d, A, B) => { d.c.push({a: A.id, b: B.id, v: ""}); };
export const loeseVerbindung = (d, A, B) => { d.c = d.c.filter(c => !(c.a === A.id && c.b === B.id)); };

// Transition zwischen den Schritten A und B einfügen (A → Transition → B statt A → B). Liegt B unter A, kommt T in die Mitte.
export function transitionDazwischen(A, B, d){
  const [x, y1] = kettenAus(A), y = B.y > y1 ? Math.round((y1 + B.y) / 20) * 10 : y1 + 30;
  const zwischen = {id: uid(), k: "trans", x, y, v: ""};
  d.o.push(zwischen);
  loeseVerbindung(d, A, B);
  verknuepfe(d, A, zwischen); verknuepfe(d, zwischen, B);
  return zwischen;
}

/* ---------- Hinweis an einem Baustein ---------- */
// Der Hinweis steht über den Feldern im Eigenschaftsfeld, solange der Baustein markiert ist (Haken anleitung)
export const merkeHinweis = (id, text) => { ED.vorlage.hinweis = {id, text}; };
export function hinweisAnleitung(){
  const h = ED.vorlage.hinweis, o = h && istMarkiert("o", h.id) && objById(h.id);
  return o ? `<div class="props quiet"><p>${h.text}</p></div>` + FELDER_JE_ART.o(o) : null;
}

/* ---------- Haken nachSetzen und vorVerbinden ---------- */
// Regeln für ein neues Paar oben → unten in der Kette; neu ist der eben gesetzte Baustein
export const PAAR_REGELN = [
  {passt: (A, B) => isStep(A) && isStep(B), tue: (A, B, d, neu) => {
    if (neu === B) B.y = Math.max(B.y, A.y + TEILUNG);
    transitionDazwischen(A, B, d);
  }},
  {passt: (A, B) => isTrans(A) && isTrans(B), tue: (A, B, d, neu) => {
    loeseVerbindung(d, A, B);
    merkeHinweis(neu.id, TEXT_TRANS_TRANS);
  }},
];
export function grafcetNachSetzen(o, d, {A, dock}){
  const [oben, unten] = A ? [A, o] : dock ? [objIn(d, dock.a), objIn(d, dock.b)] : [];
  const regel = oben && unten && PAAR_REGELN.find(r => r.passt(oben, unten));
  if (regel) regel.tue(oben, unten, d, o);
}
export function grafcetVorVerbinden(A, B){
  if (isTrans(A) && isTrans(B)) return {ok: false, text: TEXT_TRANS_TRANS};
  if (isStep(A) && isStep(B)) return {ersetze: d => { transitionDazwischen(objIn(d, A.id), objIn(d, B.id), d); }};
  return null;
}

/* ---------- Aktionen und Rest der Kette ---------- */
// Aktionen, die an Baustein id hängen, auch die unter oder hinter einer anderen Aktion
export function aktionenVon(d, id){
  const ids = [], offen = [id];
  while (offen.length) {
    const a = offen.pop();
    for (const c of d.c) {
      if (c.a !== a || ids.includes(c.b) || !isAct(objIn(d, c.b))) continue;
      ids.push(c.b); offen.push(c.b);
    }
  }
  return ids;
}
// Kettenglieder unter o: über Kettenverbindungen nach unten erreichbar (Rücksprünge nach oben zählen nicht)
export function kettenRest(d, o){
  const ids = [], offen = [o];
  while (offen.length) {
    const A = offen.pop();
    for (const c of d.c) {
      const B = c.a === A.id && objIn(d, c.b);
      if (!B || isAct(B) || B.id === o.id || ids.includes(B.id) || B.y <= A.y) continue;
      ids.push(B.id); offen.push(B);
    }
  }
  return ids;
}
// Haken mitziehen: Aktionen gehen mit ihrem Schritt, mit Umschalt auch der Rest der Kette samt Aktionen
export function grafcetMitziehen(o, {umschalt}, d){
  const glieder = umschalt ? kettenRest(d, o) : [];
  return [...aktionenVon(d, o.id), ...glieder.flatMap(id => [id, ...aktionenVon(d, id)])];
}
// Erstes Kettenglied nach bzw. vor A (Aktionen zählen nicht)
export const nachfolgerIn = (d, A) => { const c = d.c.find(c => c.a === A.id && !isAct(objIn(d, c.b))); return c && objIn(d, c.b); };
export const vorgaengerIn = (d, B) => { const c = d.c.find(c => c.b === B.id && !isAct(objIn(d, c.a))); return c && objIn(d, c.a); };
// Kettenglieder ids samt ihren Aktionen um dy senkrecht verschieben
export function verschiebeRest(d, ids, dy){
  const alle = new Set(ids.flatMap(id => [id, ...aktionenVon(d, id)]));
  d.o.forEach(o => { if (alle.has(o.id)) o.y += dy; });
}

/* ---------- Löschen ---------- */
// Haken loeschen: Aktionen gehen mit ihrem Baustein, ein Schritt schließt dazu die Kette
export function grafcetLoeschen(o, d){
  return [...aktionenVon(d, o.id), ...(isStep(o) ? ketteSchliessen(o, d) : [])];
}
// Schritt o in T1 → o → T2 → N: T2 geht mit, T1 hängt sich an N, und N rückt mit dem Rest der Kette an die Stelle von o
export function ketteSchliessen(o, d){
  const T1 = vorgaengerIn(d, o), T2 = nachfolgerIn(d, o), N = T2 && nachfolgerIn(d, T2);
  if (!T1 || !isTrans(T2)) return [];
  if (N && N.id !== o.id) {
    if (N.y > o.y) verschiebeRest(d, [N.id, ...kettenRest(d, N)], o.y - N.y);
    verknuepfe(d, T1, N);
  }
  return [T2.id, ...aktionenVon(d, T2.id)];
}
