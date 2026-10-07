// Kontaktspiegel und Querverweise im Stromlaufplan, automatisch aus den Kennzeichen (EN 61082-1).
// Unter jeder Spule steht unter der Schiene M der Kontaktspiegel: links die Schließer, rechts die Öffner mit dem
// Strompfad, in dem der Kontakt liegt. Am Kontakt steht unter dem Kennzeichen der Strompfad seiner Spule, z. B. „/4“.
// Liegt das Gegenstück auf einem anderen Blatt, heißt der Verweis „Blatt.Pfad“, z. B. „2.4“.
import { GRAU, linie } from '../../symbole/grund.js';
import { SYM } from '../../symbole/iec60617.js';
import { PH, SVGT } from '../svg.js';
import { art } from '../registry.js';
import { kontakte } from './elektro-kennzeichen.js';
import { SEITE, pfadNummer } from './elektro-pfade.js';

const blattVon = o => Math.floor(o.y / PH) + 1;
// Ort von o, gesehen von bezug: Pfad, auf einem anderen Blatt Blatt.Pfad
export const ortVon = (o, bezug) => (blattVon(o) === blattVon(bezug) ? "" : blattVon(o) + ".") + pfadNummer(o.x);
const spulen = d => (d.o || []).filter(o => o.k === "coil" && o.v);
const ZEILE = 9;
// Kleines Schaltzeichen als Spaltenkopf (Schließer bzw. Öffner, auf ein Fünftel verkleinert)
const kopf = (k, x, y) => `<g transform="translate(${x} ${y}) scale(.18)">${SYM[k].zeichne(0, 0, {an: ["", ""]})}</g>`;

// Kontaktspiegel einer Spule: Kopf, senkrechter Strich, Pfade der Schließer links und der Öffner rechts
export function spiegel(sp, alle){
  const x = sp.x, y = (blattVon(sp) - 1) * PH + 600;
  const spalte = (k, dx, a) => alle.filter(o => art(o.k).kontakt === k)
    .map((o, i) => SVGT(x + dx, y + 20 + i * ZEILE, ortVon(o, sp), a, 8, 500, GRAU)).join("");
  const zeilen = Math.max(1, ...["no", "nc"].map(k => alle.filter(o => art(o.k).kontakt === k).length));
  return `<g class="spiegel">${kopf("no", x - 9, y)}${kopf("nc", x + 7, y)}`
    + linie(`M${x} ${y}V${y + 12 + zeilen * ZEILE}`, .8) + spalte("no", -4, "end") + spalte("nc", 4, "start") + `</g>`;
}
// Querverweis am Kontakt: Pfad der Spule unter dem Kennzeichen
export function querverweis(o, sp){
  const rechts = SEITE.get(o.id) === "r", links = art(o.k).links || 34;
  return SVGT(rechts ? o.x + 18 : o.x - links, o.y + 47, "/" + ortVon(sp, o), rechts ? "start" : "end", 8.5, 500, GRAU);
}
// Haken hintergrund: alle Kontaktspiegel und Querverweise der Zeichnung (nach merkePfade)
export function spiegelSVG(d){
  const ks = kontakte(d);
  return spulen(d).map(sp => {
    const meine = ks.filter(o => o.v === sp.v);
    return spiegel(sp, meine) + meine.map(o => querverweis(o, sp)).join("");
  }).join("");
}
