/* ---------- Interaktive Erklärungen: Grundlagen ---------- */
// Ein Fachwissen-Thema kann interaktive Erklärungen enthalten. Im Text steht dafür ein Platzhalter, z. B.
//   <div data-interaktiv="logik" data-op="UND,ODER" data-a="BG9" data-b="BG10" data-q="PF2"></div>
// iaEinsetzen ersetzt ihn durch das HTML der Erklärung. Jede Art meldet sich mit iaRegistrieren an
// (logik.js, zyklus.js) und liefert: neu(attribute) → Zustand, html(zustand), aktion(zustand, name, element).
// Kennzeichen in Attributen ohne „−“ schreiben (BG9), sonst macht chips() daraus einen Chip im Attribut.
import { chip, esc } from '../basis.js';

const IA_ARTEN = {};
const IA_ZUSTAND = new Map();
let iaZaehler = 0;

export function iaRegistrieren(name, art){ IA_ARTEN[name] = art; }

// Kennzeichen wie BG9 als Chip, sonst als Text
const istKennzeichen = t => /^[A-Z]{1,3}\d{1,2}$/.test(t);
export const iaName = t => istKennzeichen(t) ? chip(t) : esc(t);
// Für Text im SVG: Kennzeichen mit „−“ davor (−BG9), sonst unverändert
export const iaKurz = t => istKennzeichen(t) ? "−" + t : t;

function iaAttribute(text){
  const a = {};
  for (const m of text.matchAll(/data-([a-z]+)="([^"]*)"/g)) a[m[1]] = m[2];
  return a;
}
function iaInhalt(id){
  const z = IA_ZUSTAND.get(id);
  return IA_ARTEN[z.art].html(z);
}
export function iaEinsetzen(html){
  return String(html).replace(/<div data-interaktiv="([a-z]+)"([^>]*)><\/div>/g, (ganz, art, rest) => {
    if (!IA_ARTEN[art]) return "";
    const id = "ia" + (++iaZaehler), z = {...IA_ARTEN[art].neu(iaAttribute(rest)), art, id};
    IA_ZUSTAND.set(id, z);
    return `<div class="ia ia-${art}" data-ia="${id}">${iaInhalt(id)}</div>`;
  });
}
// Neu zeichnen; liefert false, wenn die Erklärung nicht mehr auf der Seite steht (z. B. Popup geschlossen)
export function iaZeichnen(id){
  const el = document.querySelector(`[data-ia="${id}"]`);
  if (!el) { IA_ZUSTAND.delete(id); return false; }
  el.innerHTML = iaInhalt(id);
  return true;
}
export function init(){
  document.addEventListener("click", e => {
    const knopf = e.target.closest("[data-ia-akt]"), wurzel = knopf && knopf.closest("[data-ia]");
    if (!wurzel) return;
    e.preventDefault();
    const z = IA_ZUSTAND.get(wurzel.dataset.ia); if (!z) return;
    IA_ARTEN[z.art].aktion(z, knopf.dataset.iaAkt, knopf);
    iaZeichnen(z.id);
  });
}

/* ---------- SVG-Bausteine ---------- */
// Programmstatus wie in TIA: erfüllt (1) grün durchgezogen, nicht erfüllt (0) blau gestrichelt
export const iaStrich = an => an ? `class="ia-an"` : `class="ia-aus"`;
export const iaLinie = (x1, y1, x2, y2, an) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${iaStrich(an)}/>`;
export const iaText = (x, y, t, klasse = "", anker = "middle") => `<text x="${x}" y="${y}" text-anchor="${anker}" class="${klasse}">${esc(t)}</text>`;
export const iaSvg = (b, h, inhalt, label) => `<svg class="ia-svg" viewBox="0 0 ${b} ${h}" role="img" aria-label="${esc(label)}">${inhalt}</svg>`;
// Taste für ein Signal: zeigt 0 oder 1, Klick schaltet um
export const iaSignalKnopf = (akt, name, wert, extra = "") =>
  `<button type="button" class="ia-sig${wert ? " an" : ""}" data-ia-akt="${akt}" ${extra}><span class="n">${iaName(name)}</span><b>${wert ? 1 : 0}</b></button>`;
