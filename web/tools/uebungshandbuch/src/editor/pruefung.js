// Editor-Kern: Knopf „Prüfen“. Eine Vorlage mit dem Haken pruefe(d, {scope, key}) → Befund[] bekommt den Knopf.
// Befund: {stufe: "fehler" | "hinweis", text, o?: Objekt-ID, c?: Index der Verbindung, pt?: [x, y]}.
// zeigeBefunde markiert die Stellen rot (Ebene <g class="befund"> über der Zeichnung) und listet sie in #props;
// ein Klick auf einen Eintrag markiert das Element. Jede Änderung (aendere in verlauf.js) löscht die Markierungen.
import { $, esc } from '../app/basis.js';
import { SVGT } from './svg.js';
import { ED } from './status.js';
import { VORL } from './registry.js';
import { bbox } from './bausteine.js';
import { clearSel, objById } from './auswahl.js';
import { updateProps } from './eigenschaften.js';
import { renderInk } from './anzeige.js';

export const ROT = "#C0392B";
export let befunde = [];

export const hatPruefung = key => !!(VORL[key] && VORL[key].pruefe);
export function pruefeSkizze(){
  const v = VORL[ED.key];
  return v && v.pruefe ? v.pruefe(ED.data, {scope: ED.scope, key: ED.key}) : [];
}

// Rote Markierung eines Befunds mit seiner Nummer
export function befundSVG(b, i){
  const o = b.o && objById(b.o), weg = b.c !== undefined && ED.svg.querySelector(`.ink [data-c="${b.c}"] path`);
  const nr = (x, y) => SVGT(x, y, String(i + 1), "middle", 11, 700, ROT);
  if (o) {
    const r = bbox(o);
    return `<rect x="${r.x - 7}" y="${r.y - 7}" width="${r.w + 14}" height="${r.h + 14}" rx="5" fill="none" stroke="${ROT}" `
      + `stroke-width="2"/>` + nr(r.x - 12, r.y - 10);
  }
  if (weg) {
    const p = weg.getPointAtLength(weg.getTotalLength() / 2);
    return `<path d="${weg.getAttribute("d")}" fill="none" stroke="${ROT}" stroke-width="3" stroke-opacity=".6"/>` + nr(p.x + 10, p.y - 6);
  }
  if (b.pt) return `<circle cx="${b.pt[0]}" cy="${b.pt[1]}" r="10" fill="none" stroke="${ROT}" stroke-width="2"/>` + nr(b.pt[0] + 16, b.pt[1] - 10);
  return "";
}
// Ebene für die Markierungen; sie entsteht erst beim ersten Prüfen
export function befundEbene(){
  let g = ED.svg.querySelector(".befund");
  if (!g) {
    g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "befund"); g.setAttribute("pointer-events", "none");
    ED.svg.appendChild(g);
  }
  return g;
}
export function befundListe(liste){
  if (!liste.length) return `<div class="props"><div class="palh">Prüfung</div><p>Keine Auffälligkeiten gefunden.</p></div>`;
  const eintrag = (b, i) => `<li><button type="button" class="befundknopf ${b.stufe}" data-ed="befund" data-n="${i}">`
    + `<b>${i + 1}</b> ${b.stufe === "fehler" ? "Fehler" : "Hinweis"}: ${esc(b.text)}</button></li>`;
  return `<div class="props"><div class="palh">Prüfung</div><ol class="befunde">${liste.map(eintrag).join("")}</ol></div>`;
}
export function zeigeBefunde(liste){
  befunde = liste;
  if (!ED.svg) return;
  befundEbene().innerHTML = liste.map(befundSVG).join("");
  const el = $("#props");
  if (el) el.innerHTML = befundListe(liste);
}
export function befundeWeg(){
  befunde = [];
  const g = ED.svg && ED.svg.querySelector(".befund");
  if (g) g.innerHTML = "";
}
// Klick auf Befund i: das betroffene Element markieren
export function waehleBefund(i){
  const b = befunde[i];
  if (!b) return;
  clearSel();
  if (b.o) ED.sel = b.o; else if (b.c !== undefined) ED.selC = b.c;
  renderInk(); updateProps(true);
}
