// Editor-Kern: Ablaufkette. Bausteine einer Gruppe mit `kette: true` (GRAFCET, Steuerstrompfad) hängen sich
// senkrecht untereinander, docken an Nachbarn an und werden mit senkrechten Linien verbunden.
// Seitenbausteine (GRAFCET-Aktionen) hängen sich rechts an; ihr Verhalten steht im Haken `seite` der Bausteinart.
// Benutzt von zeichnen.js (Verbindungslinien) und andocken.js (Setzen, Ziehen).
import { ED } from './status.js';
import { BLK, art } from './registry.js';
import { ctr, fam, gruppeVon, inPt, outPt } from './bausteine.js';
import { objById } from './auswahl.js';

// Seitenbaustein-Haken eines Objekts bzw. eines Paletteneintrags (Palettenvarianten zeigen über mk.k auf die Grundart)
export const seite = o => o && art(o.k).seite;
export function seitenArt(k){
  if (!BLK[k]) return null;
  const grund = (BLK[k].mk && BLK[k].mk.k) || k;
  return art(grund).seite || null;
}

// Senkrechte Verbindung von unten aus A nach oben in B, bei Rücksprüngen links vorbei mit Pfeil nach oben
export function routeV([x1, y1], [x2, y2]){
  const p = {p1: [x1, y1], p2: [x2, y2]};
  if (y2 > y1 + 4) {
    if (Math.abs(x1 - x2) < 1) return {...p, d: `M${x1} ${y1}V${y2}`};
    const m = Math.round((y1 + y2) / 20) * 10;
    return {...p, d: `M${x1} ${y1}V${m}H${x2}V${y2}`};
  }
  const lane = Math.min(x1, x2) - 50, ya = y1 + 20, yb = y2 - 20;
  return {...p, d: `M${x1} ${y1}V${ya}H${lane}V${yb}H${x2}V${y2}`, up: [lane, (ya + yb) / 2]};
}

// Linie von A nach B innerhalb einer Kette
export function verbindeKette(A, B){
  const s = seite(B);
  if (s) return s.verbinde(A, B);
  const von = outPt(A, ctr(B)[0]);
  return routeV(von, inPt(B, von[0]));
}

// An welchen Baustein hängt sich ein neuer Baustein der Palettenart k? Der markierte, wenn er zur selben Kette gehört.
export function kettenQuelle(k){
  const A = !ED.dnd && ED.sel && objById(ED.sel);   // beim Ziehen entscheidet die Ablagestelle (Andocken), nicht die Markierung
  if (!A || !gruppeVon(A).kette || fam(A) !== BLK[k].g) return null;
  const neuSeite = seitenArt(k);
  if (seite(A)) return neuSeite ? A : null;
  if (neuSeite) return neuSeite.quelle(A);
  return A;
}

// Neuen Baustein o unter bzw. neben A ausrichten
export function ausrichten(o, A, pt){
  const s = seite(o);
  if (s) return s.ausrichten(o, A, pt);
  const ax = outPt(A, ctr(o)[0])[0];
  o.x = ax - (art(o.k).einrueck || 0);
}

/* Andocken: Anschluss in der Nähe eines passenden Anschlusses → ausrichten und beim Loslassen verbinden */
export function andockStelle(o){
  const g = fam(o);
  if (!ED.dock || !gruppeVon(o).kette) return null;
  const others = ED.data.o.filter(p => p.id !== o.id && fam(p) === g);
  let best = null;
  const take = c => { if (!best || c.d < best.d) best = c; };
  const s = seite(o);
  if (s) { s.andocken(o, others, take); return best; }
  for (const p of others) {
    if (seite(p)) continue;
    const po = outPt(p, ctr(o)[0]), oi = inPt(o, po[0]), dy1 = oi[1] - po[1], dx1 = po[0] - oi[0];
    if (dy1 >= 10 && dy1 <= 140 && Math.abs(dx1) <= 30) take({a: p.id, b: o.id, d: Math.abs(dx1) + dy1/4, sx: dx1, sy: 0});
    const oo = outPt(o, ctr(p)[0]), pi = inPt(p, oo[0]), dy2 = pi[1] - oo[1], dx2 = pi[0] - oo[0];
    if (dy2 >= 10 && dy2 <= 140 && Math.abs(dx2) <= 30) take({a: o.id, b: p.id, d: Math.abs(dx2) + dy2/4, sx: dx2, sy: 0});
  }
  return best;
}

// Punkt, an dem die Andock-Vorschau den Anschluss in B markiert
export function andockPunkt(A, B){
  const s = seite(B);
  if (s) return s.punkt(A, B);
  return inPt(B, outPt(A, ctr(B)[0])[0]);
}
