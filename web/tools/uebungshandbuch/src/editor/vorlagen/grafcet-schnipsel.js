// GRAFCET: Verzweigungs-Schnipsel der Palette. „ODER mit 2 Zweigen“ und „UND mit 2 Zweigen“ setzen die Verzweigungslinie
// und hängen beim Setzen (Gruppen-Haken nachSetzen) die Zweige und die Zusammenführung darunter. Die Breite der Linien
// passt „Kette ausrichten“ an die Zweige an (linienBreiteAnpassen).
import { kettenAus, kettenEin, umrissVon } from '../bausteine.js';
import { umbruchWeg } from '../andocken.js';
import { isAct } from './grafcet-aktion.js';
import { freieSchrittNummer, grafcetNachSetzen, neuesGlied, objIn, verknuepfe } from './grafcet-kette.js';

export const ZWEIG_X = [40, 160];   // Mitten der beiden Zweige, gemessen vom linken Ende der Linie
// Ein Zweig als [Art, dy] unter der Linie; danach die Zusammenführung bei dy
export const SCHNIPSEL = {
  oder: {zweig: [["trans", 30], ["step", 60], ["trans", 130]], zusammen: ["alt", 160]},
  und: {zweig: [["step", 35]], zusammen: ["par", 105]},
};
// Glied der Art k mit Kettenanschluss bei x (Mitte) und Höhe y
export function gliedBei(d, k, x, y){
  const o = neuesGlied(d, k, k === "trans" ? "" : freieSchrittNummer(d));
  Object.assign(o, k === "trans" ? {x, y} : {x: x - 20, y});
  return o;
}
// Zweige und Zusammenführung unter der Linie o bauen
export function baueSchnipsel(o, d){
  const s = SCHNIPSEL[o.schnipsel];
  delete o.schnipsel;
  if (!s) return;
  const vorher = new Set(d.o.map(q => q.id)), [k, dy] = s.zusammen, unten = neuesGlied(d, k, undefined);
  Object.assign(unten, {x: o.x, y: o.y + dy, w: o.w});
  for (const zx of ZWEIG_X) {
    let vor = o;
    for (const [gliedArt, y] of s.zweig) { const B = gliedBei(d, gliedArt, o.x + zx, o.y + y); verknuepfe(d, vor, B); vor = B; }
    verknuepfe(d, vor, unten);
  }
  schnipselUmbruch(o, d.o.filter(B => !vorher.has(B.id)));
}
// Liegt ein Glied des Schnipsels im Bereich um ein Blattende, springt der ganze Schnipsel auf das nächste Blatt:
// die Linie o 70 unter den Blattanfang, die Zweige mit ihr
export function schnipselUmbruch(o, neue){
  const B = neue.find(q => umbruchWeg(q));
  if (!B) return;
  const dy = umrissVon(B).y + umbruchWeg(B) - umrissVon(o).y;
  [o, ...neue].forEach(q => { q.y += dy; });
}
// Haken nachSetzen der Gruppe: erst den Schnipsel ausbauen, dann die Regeln der Kette
export function schnipselNachSetzen(o, d, info){
  if (o.schnipsel) baueSchnipsel(o, d);
  grafcetNachSetzen(o, d, info);
}

// Linienbreite an die angeschlossenen Glieder anpassen: 40 über den äußersten Anschluss hinaus
export function linienBreiteAnpassen(d){
  for (const o of d.o.filter(o => o.k === "alt" || o.k === "par")) {
    const xs = d.c.flatMap(c => {
      const B = c.a === o.id ? objIn(d, c.b) : c.b === o.id ? objIn(d, c.a) : null;
      if (!B || isAct(B)) return [];
      return [c.a === o.id ? kettenEin(B, o.x)[0] : kettenAus(B, o.x)[0]];
    });
    if (xs.length < 2) continue;
    o.x = Math.min(...xs) - 40; o.w = Math.max(...xs) - Math.min(...xs) + 80;
  }
}
