// GRAFCET: Knöpfe der Werkzeugleiste (data-gc, Vorlagen-Haken klick): „+ Schritt“ hängt Transition und nächsten
// Schritt in einem Rutsch an, „Kette ausrichten“ legt Schritte und Transitionen mit Teilung 100 untereinander,
// „Neu nummerieren“ zählt die Schritte (und Transitionen mit Nummer) in der Reihenfolge der Kette.
import { markiere } from '../status.js';
import { markiertesObjekt, objById } from '../auswahl.js';
import { aendere } from '../verlauf.js';
import { editObjLabel } from '../beschriften.js';
import { umbruchWeg } from '../andocken.js';
import { isAct, isStep, isTrans } from './grafcet-aktion.js';
import { aktionenVon, freieSchrittNummer, haengeEin, legeUnter, nachfolger, neuesGlied, objIn, vorgaengerIn } from './grafcet-kette.js';
import { linienBreiteAnpassen } from './grafcet-schnipsel.js';

/* ---------- Reihenfolge der Kette ---------- */
export const nachLage = (a, b) => a.y - b.y || a.x - b.x;
// Kettenglieder in Lesereihenfolge (Breitensuche): ab den Anfangsschritten (dann den übrigen Gliedern), die Warteschlange
// nach Höhe und von links nach rechts geordnet. Parallele Zweige zählen so Zeile für Zeile von links, ein Glied kommt
// immer nach seinem Vorgänger.
export function kettenFolge(d){
  const glieder = d.o.filter(o => !isAct(o)).sort(nachLage);
  const folge = [], gesehen = new Set();
  for (const start of [...glieder.filter(o => o.k === "init"), ...glieder]) {
    if (gesehen.has(start.id)) continue;
    const offen = [start];
    gesehen.add(start.id);
    while (offen.length) {
      const A = offen.sort(nachLage).shift();
      folge.push(A);
      for (const B of nachfolger(d, A)) if (!gesehen.has(B.id)) { gesehen.add(B.id); offen.push(B); }
    }
  }
  return folge;
}
// Kettenglied, an dem eine Aktion hängt (über die Aktionen darüber hinweg)
export function stammVon(d, o){
  for (let n = 0; isAct(o) && n < 50; n++) { const c = d.c.find(c => c.b === o.id); o = c && objIn(d, c.a); }
  return o || null;
}

/* ---------- + Schritt ---------- */
// Wo „+ Schritt“ anhängt: am markierten Glied, sonst am untersten Ende der Kette
export function anhaengeStelle(d){
  const m = markiertesObjekt();
  if (m) return stammVon(d, m);
  const enden = d.o.filter(o => (isStep(o) || isTrans(o)) && !nachfolger(d, o, true).length);
  return enden.sort((a, b) => b.y - a.y)[0] || null;
}
// Nach einem Schritt kommt zuerst die Transition, nach einer Transition zuerst der Schritt. Bei einer Verzweigungs- oder
// Zusammenführungslinie entscheidet, was über der Linie steht: ODER-Verzweigung und UND-Zusammenführung haben einen
// Schritt darüber (weiter mit Transition), ODER-Zusammenführung und UND-Verzweigung eine Transition (weiter mit Schritt).
export const transitionZuerst = (d, A) => isStep(A) || (!isTrans(A) && isStep(vorgaengerIn(d, A)));
export function plusSchritt(){
  let trans = null, schritt = null;
  aendere(d => {
    let A = anhaengeStelle(d);
    if (!A) A = Object.assign(neuesGlied(d, "init", "1"), {x: 180, y: 60});
    const nachher = nachfolger(d, A, true)[0];
    trans = neuesGlied(d, "trans", ""); schritt = neuesGlied(d, "step", freieSchrittNummer(d));
    haengeEin(A, transitionZuerst(d, A) ? [trans, schritt] : [schritt, trans], d, nachher);
  });
  markiere("o", schritt.y > trans.y ? schritt.id : trans.id);   // das untere Glied: dort geht es weiter
  editObjLabel(objById(trans.id));   // Fokus auf die Bedingung
}

/* ---------- Kette ausrichten ---------- */
export const legbar = o => isStep(o) || isTrans(o);
// Schritte und Transitionen unter ihren Vorgänger legen (Teilung 100), Verzweigungen und Aktionen ziehen mit.
// Ein Glied im Bereich um ein Blattende springt auf das nächste Blatt, die Glieder darunter legen sich darunter.
export function ketteAusrichten(d){
  const unten = Object.fromEntries(d.o.map(o => [o.id, o.y])), weg = {};
  for (const A of kettenFolge(d)) {
    weg[A.id] = weg[A.id] || [0, 0];
    for (const c of d.c.filter(c => c.a === A.id)) {
      const B = objIn(d, c.b);
      if (!B || isAct(B) || B.id in weg || unten[B.id] <= unten[A.id]) continue;
      const [x0, y0] = [B.x, B.y];
      if (legbar(A) && legbar(B)) legeUnter(B, A); else { B.x += weg[A.id][0]; B.y += weg[A.id][1]; }
      B.y += umbruchWeg(B);
      weg[B.id] = [B.x - x0, B.y - y0];
      verschiebeAktionen(d, B, weg[B.id]);
    }
  }
  linienBreiteAnpassen(d);
}
export function verschiebeAktionen(d, B, [dx, dy]){
  const ids = new Set(aktionenVon(d, B.id));
  d.o.forEach(o => { if (ids.has(o.id)) { o.x += dx; o.y += dy; } });
}

/* ---------- Neu nummerieren ---------- */
// Schritte 1, 2, 3 … in der Reihenfolge der Kette; Transitionen nur, wenn schon eine eine Nummer trägt.
// Verweise (Sprungziele) bekommen die neue Nummer.
export function neuNummerieren(d){
  const neu = {}, mitNummer = d.o.some(o => isTrans(o) && o.nr);
  let n = 0, t = 0;
  for (const o of kettenFolge(d)) {
    if (o.k === "step" || o.k === "init") { neu[o.v] = String(++n); o.v = String(n); }
    else if (isTrans(o) && mitNummer) o.nr = String(++t);
  }
  d.o.filter(o => o.k === "ref" && o.v).forEach(r => { r.v = r.v.replace(/\d+/, z => neu[z] ?? z); });
}

/* ---------- Werkzeugleiste ---------- */
export const KETTEN_KNOEPFE = {
  plus: {name: "+ Schritt", titel: "Transition und nächsten Schritt unter dem markierten Baustein anhängen (Taste +)",
    tue: plusSchritt},
  ausrichten: {name: "Kette ausrichten", titel: "Schritte und Transitionen mit Abstand 100 untereinander legen",
    tue: () => aendere(ketteAusrichten)},
  nummern: {name: "Neu nummerieren", titel: "Schritte in der Reihenfolge der Kette neu nummerieren, Verweise ziehen mit",
    tue: () => aendere(neuNummerieren)},
};
export const kettenKnoepfeHTML = () => Object.entries(KETTEN_KNOEPFE)
  .map(([k, b]) => `<button type="button" class="tool" data-gc="${k}" title="${b.titel}">${b.name}</button>`).join("");
// Vorlagen-Haken klick: true, wenn ein Knopf der Kette gedrückt wurde
export function kettenKlick(e){
  const b = e.target.closest("[data-gc]"), knopf = b && KETTEN_KNOEPFE[b.dataset.gc];
  if (knopf) knopf.tue();
  return !!knopf;
}
// Vorlagen-Haken taste (Aufruf baut KERN, siehe README): Taste „+“ wirkt wie der Knopf „+ Schritt“.
// In einem Eingabefeld (z. B. beim Tippen einer Bedingung) bleibt das „+“ ein Zeichen.
export const imEingabefeld = e => !!(e.target && e.target.closest && e.target.closest("input, textarea, select, [contenteditable]"));
export function kettenTaste(e){
  if (e.key !== "+" || e.ctrlKey || e.metaKey || e.altKey || imEingabefeld(e)) return false;
  e.preventDefault(); plusSchritt();
  return true;
}
