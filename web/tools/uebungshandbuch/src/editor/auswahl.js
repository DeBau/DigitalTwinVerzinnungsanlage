// Editor-Kern: Markierung und Objektsuche. Benutzt von allen Editor-Modulen.
import { ED } from './status.js';
import { vrails } from './bauteile.js';

export const objById = id => ED.data.o.find(o => o.id === id) || (String(id).startsWith("_") ? vrails(ED.key, ED.pages || 1).find(r => r.id === id) : undefined);
export const uid = () => "o" + Math.random().toString(36).slice(2, 9);
export const anySel = () => !!ED.sel || ED.selC !== null || ED.selS !== null || ED.selT !== null || !!ED.selF;
export function clearSel(){ ED.sel = null; ED.selC = null; ED.selS = null; ED.selT = null; ED.selF = false; }
