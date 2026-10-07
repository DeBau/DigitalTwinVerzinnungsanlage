// Editor-Kern: Geometrie der Bausteine (Umriss, Mitte, Kettenanschlüsse) und Hilfen zum Zeichnen einfacher Bausteine.
// Die Einzelheiten je Bausteinart kommen über die Haken umriss, mitte, aus, ein aus den Vorlagen (registry.js).
import { INK, MUTE, SVGT } from './svg.js';
import { BAUSTEIN, GRUPPE, art } from './registry.js';
import { drehung } from './bauteile.js';

// Strichart einfacher Bausteine und Platzhaltertext, der nur im Editor erscheint
export const LINIE = `stroke="${INK}" stroke-width="1.6"`;
export const platzhalter = (edit, t, x, y, a = "middle") => edit ? SVGT(x, y, t, a, 12, 400, MUTE) : "";

// Runder Baustein mit Radius r (Zustand, Summierstelle): Umriss und Radius für Pfeile an den Rand
export const rund = r => ({radius: r, umriss: o => ({x: o.x - r, y: o.y - r, w: 2*r, h: 2*r})});
// Haken setze für ein Breitenfeld w (Verzweigung, Schiene): ganze Zahl ab 40, im 10er-Raster
export function setzeBreite(o, f, v){
  if (f !== "w") return false;
  const w = parseInt(v, 10);
  if (w >= 40) o.w = Math.round(w / 10) * 10;
  return true;
}
export const gruppenId = o => o && BAUSTEIN[o.k] ? BAUSTEIN[o.k].g : null;
export const gruppeVon = o => GRUPPE[gruppenId(o)] || {};

// Umriss eines Bausteins: Bauteile aus Breite, Höhe und Drehung, einfache Bausteine über den Haken umriss
export function umrissVon(o){
  const a = art(o.k);
  if (a.umriss) return a.umriss(o);
  if (!a.bauteil) return {x:o.x, y:o.y, w:20, h:20};
  const X = drehung(o), b = {x: o.x + (a.bx || 0), y: o.y, w: a.w, h: a.h};
  if (!X || X.c) return b;   // 0°/180°: gleicher Umriss
  return {x: X.cx - a.h / 2, y: X.cy - a.w / 2, w: a.h, h: a.w};
}
export function mitteVon(o){
  const a = art(o.k);
  if (a.mitte) return a.mitte(o);
  const b = umrissVon(o);
  return [b.x + b.w/2, b.y + b.h/2];
}

// Kettenanschlüsse: wo eine senkrechte Verbindung unten aus o heraus- bzw. oben in o hineinläuft.
// tx bzw. fx ist die x-Lage des Gegenübers, breite Bausteine (Verzweigungen) nehmen die Linie dort auf.
export function kettenAus(o, tx){
  const a = art(o.k);
  if (a.aus) return a.aus(o, tx);
  const b = umrissVon(o);
  return [b.x+b.w/2, b.y+b.h];
}
export function kettenEin(o, fx){
  const a = art(o.k);
  if (a.ein) return a.ein(o, fx);
  const b = umrissVon(o);
  return [b.x+b.w/2, b.y];
}
