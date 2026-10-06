// Editor-Kern: Geometrie der Bausteine (Umriss, Mitte, Kettenanschlüsse) und Hilfen zum Zeichnen einfacher Bausteine.
// Die Einzelheiten je Bausteinart kommen über die Haken umriss, mitte, aus, ein aus den Vorlagen (registry.js).
import { INK, MUTE, SVGT, tw } from './svg.js';
import { BLK, GRUPPE, PC, art } from './registry.js';
import { xform } from './bauteile.js';

export const bw = o => Math.max(110, Math.round((tw(o.v || "Block") + 30) / 10) * 10);

// Strichart einfacher Bausteine und Platzhaltertext, der nur im Editor erscheint
export const LINIE = `stroke="${INK}" stroke-width="1.6"`;
export const platzhalter = (edit, t, x, y, a = "middle") => edit ? SVGT(x, y, t, a, 12, 400, MUTE) : "";

// Runder Baustein mit Radius r (Zustand, Summierstelle): Umriss und Radius für Pfeile an den Rand
export const rund = r => ({radius: r, umriss: o => ({x: o.x - r, y: o.y - r, w: 2*r, h: 2*r})});
export const fam = o => o && BLK[o.k] ? BLK[o.k].g : null;
export const gruppeVon = o => GRUPPE[fam(o)] || {};

// Umriss eines Bausteins: Bauteile aus Breite, Höhe und Drehung, einfache Bausteine über den Haken umriss
export function bbox(o){
  const pc = PC[o.k];
  if (pc) {
    if (pc.umriss) return pc.umriss(o);
    if (o.k === "insel") return {x: o.x, y: o.y, w: +o.fw || 360, h: +o.fh || 120};
    const X = xform(o), b = {x: o.x + (pc.bx || 0), y: o.y, w: pc.w, h: pc.h};
    if (!X || X.c) return b;   // 0°/180°: gleicher Umriss
    return {x: X.cx - pc.h / 2, y: X.cy - pc.w / 2, w: pc.h, h: pc.w};
  }
  const a = BLK[o.k];
  if (a && a.umriss) return a.umriss(o);
  switch (o.k) {
    case "box": return {x:o.x, y:o.y, w:bw(o), h:50};
  }
  return {x:o.x, y:o.y, w:20, h:20};
}
export function ctr(o){
  const a = art(o.k);
  if (a.mitte) return a.mitte(o);
  const b = bbox(o);
  return [b.x + b.w/2, b.y + b.h/2];
}

// Kettenanschlüsse: wo eine senkrechte Verbindung unten aus o heraus- bzw. oben in o hineinläuft.
// tx bzw. fx ist die x-Lage des Gegenübers, breite Bausteine (Verzweigungen) nehmen die Linie dort auf.
export function outPt(o, tx){
  const a = art(o.k);
  if (a.aus) return a.aus(o, tx);
  const b = bbox(o);
  return [b.x+b.w/2, b.y+b.h];
}
export function inPt(o, fx){
  const a = art(o.k);
  if (a.ein) return a.ein(o, fx);
  const b = bbox(o);
  return [b.x+b.w/2, b.y];
}
