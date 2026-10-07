// Editor-Kern: Objektsuche, Markierung und Treffer auf dem Blatt. Benutzt von allen Editor-Modulen.
import { ED, markiertId } from './status.js';
import { virtuelleSchienen } from './bauteile.js';

export const objById = id => ED.data.o.find(o => o.id === id)
  || (String(id).startsWith("_") ? virtuelleSchienen(ED.key, ED.blattzahl || 1).find(r => r.id === id) : undefined);
export const uid = () => "o" + Math.random().toString(36).slice(2, 9);
export const anySel = () => !!ED.markiert;
export function clearSel(){ ED.markiert = null; }

// Element zur Markierung je Art (undefined, wenn es nicht mehr da ist)
export const MARKIERUNG = {
  o: {element: id => objById(id)},
  c: {element: i => ED.data.c[i]},
  s: {element: i => ED.data.s[i]},
  t: {element: i => ED.data.t[i]},
  f: {element: () => ED.data},
};
export const markiertesElement = () => ED.markiert && MARKIERUNG[ED.markiert.art].element(ED.markiert.id);
export const markiertesObjekt = () => { const id = markiertId("o"); return id ? objById(id) : null; };

// Treffer unter dem Zeiger: das erste passende data-Attribut ergibt Art und id (data-o, data-c, data-ti, data-i)
export const TREFFER = [
  {art: "o", wo: "[data-o]", id: el => el.dataset.o},
  {art: "c", wo: "[data-c]", id: el => +el.dataset.c},
  {art: "t", wo: "[data-ti]", id: el => +el.dataset.ti},
  {art: "s", wo: "[data-i]", id: el => +el.dataset.i},
];
export function trefferBei(ziel){
  for (const t of TREFFER) {
    const el = ziel.closest(t.wo);
    if (el) return {art: t.art, id: t.id(el)};
  }
  return null;
}
