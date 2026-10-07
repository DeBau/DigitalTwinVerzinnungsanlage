// GRAFCET: Regeln für den Knopf „Prüfen“ (Vorlagen-Haken pruefe, Kern in editor/pruefung.js).
// Jede Regel bekommt die Zeichnung d und gibt Befunde {stufe, text, o?, c?} zurück. Die Texte sprechen den Azubi an.
import { isAct, isStep, isTrans } from './grafcet-aktion.js';
import { objIn } from './grafcet-kette.js';

export const befundFehler = (text, wo = {}) => ({stufe: "fehler", text, ...wo});
export const befundHinweis = (text, wo = {}) => ({stufe: "hinweis", text, ...wo});
export const nummerierteSchritte = d => d.o.filter(o => o.k === "step" || o.k === "init");
export const kettenNachfolger = (d, A) => d.c.filter(c => c.a === A.id).map(c => objIn(d, c.b)).filter(B => B && !isAct(B));
// Schritte und Transitionen nach A, über Verzweigungslinien hinweg
export function echteNachfolger(d, A, tiefe = 0){
  return kettenNachfolger(d, A).flatMap(B => isStep(B) || isTrans(B) || tiefe > 3 ? [B] : echteNachfolger(d, B, tiefe + 1));
}

export function regelAnfangsschritt(d){
  const anfang = d.o.filter(o => o.k === "init");
  if (!anfang.length) return [befundFehler("Es fehlt der Anfangsschritt (doppelter Rahmen). Mit ihm startet die Kette.")];
  return anfang.slice(1).map(o => befundHinweis("Mehr als ein Anfangsschritt: Das stimmt nur, wenn du mehrere Teil-GRAFCETs "
    + "zeichnest.", {o: o.id}));
}
export function regelWechsel(d){
  const liste = [];
  for (const A of d.o.filter(o => isStep(o) || isTrans(o))) {
    for (const B of echteNachfolger(d, A)) {
      if (isStep(A) && isStep(B)) liste.push(befundFehler(`Auf Schritt ${A.v} folgt direkt Schritt ${B.v}. Dazwischen gehört eine `
        + "Transition.", {o: B.id}));
      if (isTrans(A) && isTrans(B)) liste.push(befundFehler("Zwei Transitionen folgen direkt aufeinander. Dazwischen gehört ein "
        + "Schritt.", {o: B.id}));
    }
  }
  return liste;
}
export const regelBeschriftet = d => d.o.filter(o => isTrans(o) && !String(o.v || "").trim())
  .map(o => befundFehler("Diese Transition hat keine Bedingung. Schreib die Übergangsbedingung daneben, z. B. BG1 · BG15.", {o: o.id}));
export function regelNummern(d){
  const gesehen = new Set();
  return nummerierteSchritte(d).filter(o => { const doppelt = gesehen.has(o.v); gesehen.add(o.v); return doppelt; })
    .map(o => befundFehler(`Die Schrittnummer ${o.v} gibt es zweimal. Jeder Schritt braucht eine eigene Nummer `
      + "(Knopf „Neu nummerieren“).", {o: o.id}));
}
export const regelVerwaist = d => d.o.filter(o => isAct(o) && !d.c.some(c => c.b === o.id))
  .map(o => befundFehler("Diese Aktion hängt an keinem Schritt. Zieh sie rechts an ihren Schritt.", {o: o.id}));
export function regelVerweise(d){
  const nummern = new Set(nummerierteSchritte(d).map(o => String(o.v)));
  return d.o.filter(o => o.k === "ref").filter(o => !nummern.has((/\d+/.exec(o.v || "") || [""])[0]))
    .map(o => befundFehler(o.v ? `Den Schritt ${o.v} als Sprungziel gibt es nicht.` : "Der Verweis hat kein Ziel.", {o: o.id}));
}
export const kettenEnde = (d, o) => (isStep(o) || isTrans(o)) && !kettenNachfolger(d, o).length && d.c.some(c => c.b === o.id);
export const regelZyklus = d => d.o.filter(o => kettenEnde(d, o))
  .map(o => befundHinweis("Hier endet die Kette. Schließ sie mit einem Rücksprung zum Anfangsschritt oder einem Verweis.", {o: o.id}));

export const GRAFCET_REGELN = [
  regelAnfangsschritt, regelWechsel, regelBeschriftet, regelNummern, regelVerwaist, regelVerweise, regelZyklus,
];
// Vorlagen-Haken pruefe; eine leere Zeichnung hat nichts zu prüfen
export const pruefeGrafcet = d => d.o.length ? GRAFCET_REGELN.flatMap(regel => regel(d)) : [];
