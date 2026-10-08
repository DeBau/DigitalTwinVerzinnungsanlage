/* ---------- Interaktive Erklärungen: Grundlagen ---------- */
// Ein Fachwissen-Thema kann interaktive Erklärungen enthalten. Im Text steht dafür ein Platzhalter, z. B.
//   <div data-interaktiv="logik" data-op="UND,ODER" data-a="BG9" data-b="BG10" data-q="PF2"></div>
// iaEinsetzen ersetzt ihn durch das HTML der Erklärung. Jede Art meldet sich mit iaRegistrieren an
// (logik.js, zyklus.js) und liefert: neu(attribute) → Zustand, html(zustand), aktion(zustand, name, element).
// Knöpfe tragen data-ia-akt="Name", Eingabefelder data-ia-eingabe="Name" (jede Eingabe ruft aktion auf).
// Attributnamen dürfen Bindestriche haben (data-name-a → at["name-a"]).
// Kennzeichen in Attributen ohne „−“ schreiben (BG9), sonst macht chips() daraus einen Chip im Attribut.
// Im Text steht nur eine Vorschau (nicht bedienbar, nicht animiert). Ein Klick darauf öffnet die Erklärung groß im
// Popup (popup.js), dort ist sie bedienbar. Vorschau und Popup zeigen denselben Zustand. Optional liefert eine Art
// titel (Kopf des Popups), anhalten(zustand) (Abspielen beim Schließen beenden) und oeffnen(zustand) (eigenes Popup).
// Beim Zeichnen steht in zustand.breit, ob es fürs Popup ist (true) oder für die Vorschau im Text (false). Damit zeichnet
// z. B. der Signalverlauf im Popup mehr Zeitachse, statt das Bild zu vergrößern.
import { chip, esc } from '../basis.js';
import { puOeffnen } from './popup.js';

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
  for (const m of text.matchAll(/data-([a-z-]+)="([^"]*)"/g)) a[m[1]] = m[2];
  return a;
}
function iaInhalt(id, breit){
  const z = IA_ZUSTAND.get(id);
  z.breit = breit;
  return IA_ARTEN[z.art].html(z);
}
const iaBedienbarHTML = z => `<div class="ia ia-${z.art}" data-ia="${z.id}">${iaInhalt(z.id, true)}</div>`;
function iaVorschauHTML(z){
  const titel = esc(IA_ARTEN[z.art].titel || "Erklärung");
  return `<div class="ia-vorschau" data-ia-oeffnen="${z.id}" role="button" tabindex="0" aria-label="${titel}: groß öffnen und ausprobieren">`
    + `<div class="ia ia-${z.art}" data-ia="${z.id}" data-ia-vorschau inert>${iaInhalt(z.id, false)}</div>`
    + `<div class="ia-vorschau-fuss">🔍 Anklicken, um es groß zu öffnen und auszuprobieren</div></div>`;
}
// bedienbar: gleich bedienbar einsetzen (Inhalt eines Popups), sonst als Vorschau
export function iaEinsetzen(html, {bedienbar = false} = {}){
  return String(html).replace(/<div data-interaktiv="([a-z]+)"([^>]*)><\/div>/g, (ganz, art, rest) => {
    if (!IA_ARTEN[art]) return "";
    const id = "ia" + (++iaZaehler), z = {...IA_ARTEN[art].neu(iaAttribute(rest)), art, id};
    IA_ZUSTAND.set(id, z);
    return bedienbar ? iaBedienbarHTML(z) : iaVorschauHTML(z);
  });
}
// Aufgeklappte Bereiche (z. B. Begriffe) bleiben beim Neuzeichnen offen, auch während eine Animation läuft
function iaFeldZeichnen(el, id){
  const feld = el.contains(document.activeElement) && document.activeElement.dataset.iaEingabe ? document.activeElement : null;
  const offen = [...el.querySelectorAll("details")].map(d => d.open);
  el.innerHTML = iaInhalt(id, true);
  el.querySelectorAll("details").forEach((d, i) => { if (offen[i]) d.open = true; });
  if (feld) iaFokusZurueck(el, feld);
}
// Neu zeichnen, nur wo die Erklärung bedienbar offen ist (Popup). Die Vorschau dahinter bleibt stehen, sonst würde
// beim Abspielen alles doppelt gezeichnet. Liefert false, wenn sie nirgends bedienbar offen ist: Abspielen hält an.
export function iaZeichnen(id){
  const els = [...document.querySelectorAll(`[data-ia="${id}"]`)], bedienbar = els.filter(el => !el.hasAttribute("data-ia-vorschau"));
  if (!els.length) IA_ZUSTAND.delete(id);
  bedienbar.forEach(el => iaFeldZeichnen(el, id));
  return bedienbar.length > 0;
}
// Vorschau im Text auf den Stand bringen (beim Schließen des Popups)
export function iaVorschauZeichnen(id){
  document.querySelectorAll(`[data-ia="${id}"][data-ia-vorschau]`).forEach(el => { el.innerHTML = iaInhalt(id, false); });
}
// Erklärung groß im Popup öffnen; beim Schließen anhalten und die Vorschau auf den letzten Stand bringen
export function iaGrossOeffnen(z){
  const art = IA_ARTEN[z.art];
  puOeffnen("#iadlg", esc(art.titel || "Erklärung"), iaBedienbarHTML(z), () => { if (art.anhalten) art.anhalten(z); iaVorschauZeichnen(z.id); });
}
function iaOeffnen(e){
  const v = e.target.closest && e.target.closest("[data-ia-oeffnen]"); if (!v) return;
  const z = IA_ZUSTAND.get(v.dataset.iaOeffnen); if (!z) return;
  e.preventDefault();
  (IA_ARTEN[z.art].oeffnen || iaGrossOeffnen)(z);
}
// Eingabefeld (data-ia-eingabe="Name"): Nach dem Neuzeichnen bekommt das neue Feld mit demselben Namen Fokus und Schreibmarke
function iaFokusZurueck(el, alt){
  const neu = el.querySelector(`[data-ia-eingabe="${alt.dataset.iaEingabe}"]`); if (!neu) return;
  neu.focus();
  if (neu.type === "text") neu.setSelectionRange(alt.selectionStart, alt.selectionEnd);
}
// Jede Eingabe ruft aktion(zustand, Name, Feld) auf, wie ein Klick auf data-ia-akt
function iaEingeben(e){
  const feld = e.target.closest && e.target.closest("[data-ia-eingabe]"), wurzel = feld && feld.closest("[data-ia]");
  if (!wurzel) return;
  const z = IA_ZUSTAND.get(wurzel.dataset.ia); if (!z) return;
  IA_ARTEN[z.art].aktion(z, feld.dataset.iaEingabe, feld);
  iaZeichnen(z.id);
}
function iaBedienen(e){
  const knopf = e.target.closest("[data-ia-akt]"), wurzel = knopf && knopf.closest("[data-ia]");
  if (!wurzel) return;
  e.preventDefault();
  const z = IA_ZUSTAND.get(wurzel.dataset.ia); if (!z) return;
  IA_ARTEN[z.art].aktion(z, knopf.dataset.iaAkt, knopf);
  iaZeichnen(z.id);
}
// Maus, Stift und Finger wirken schon beim Drücken: Beim Abspielen wird die Erklärung laufend neu gezeichnet,
// ein Klick (Drücken und Loslassen auf demselben Knopf) käme dann nie an. Die Tastatur löst weiter über click aus.
// Aufklappen (Begriffe) ebenso beim Drücken; der Klick danach darf nicht noch einmal umschalten.
const iaSummary = e => e.target.closest && e.target.closest("[data-ia] summary");
function iaAufklappen(e){
  const s = iaSummary(e); if (!s) return;
  e.preventDefault();
  s.parentElement.open = !s.parentElement.open;
}
export function init(){
  document.addEventListener("pointerdown", e => { if (e.button === 0) { iaBedienen(e); iaAufklappen(e); } });
  document.addEventListener("click", e => { if (e.detail === 0) iaBedienen(e); else if (iaSummary(e)) e.preventDefault(); });
  document.addEventListener("input", iaEingeben);
  document.addEventListener("click", iaOeffnen);
  document.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") iaOeffnen(e); });
}

/* ---------- SVG-Bausteine ---------- */
// Programmstatus wie in TIA: erfüllt (1) grün durchgezogen, nicht erfüllt (0) blau gestrichelt
export const iaStrich = an => an ? `class="ia-an"` : `class="ia-aus"`;
export const iaLinie = (x1, y1, x2, y2, an) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${iaStrich(an)}/>`;
export const iaText = (x, y, t, klasse = "", anker = "middle") => `<text x="${x}" y="${y}" text-anchor="${anker}" class="${klasse}">${esc(t)}</text>`;
// Schrift der Texte im SVG je Klasse: [Größe in px, Zeichenbreite in em] wie in src/styles/12 bis 15, sonst 13px Sans
const IA_SCHRIFT = {"": [13, .56], "ia-op": [12.5, .6], "ia-sym": [17, .6], "bx-pin": [12, .6], "bx-status": [12, .6], "bx-titel": [15, .6],
  "bx-typ": [12, .56], "rs-text": [12, .6], "rs-zahl": [11, .6], "sp-pin": [11.5, .6], "sp-titel": [13, .6], "sv-fuss": [11, .56],
  "sv-name": [12, .6], "sv-zahl": [11.5, .6], "zy-modus": [16, .5], "zy-nr": [12, .56]};
const IA_ANKER = {start: 0, middle: .5, end: 1};
const IA_TEXT = /<text x="([-\d.]+)" y="([-\d.]+)" text-anchor="(\w+)" class="([^"]*)">([^<]*)<\/text>/g;
// Rahmen um alle Texte (aus iaText), geschätzt aus Zeichenzahl und Schrift
function iaTextRahmen(inhalt){
  const r = {x0: 0, y0: 0, x1: 0, y1: 0};
  for (const [, x, y, anker, klasse, text] of inhalt.matchAll(IA_TEXT)) {
    const [px, em] = IA_SCHRIFT[klasse.split(" ")[0]] || IA_SCHRIFT[""];
    const breite = text.replace(/&[^;]+;/g, "x").length * px * em, links = +x - breite * IA_ANKER[anker];
    Object.assign(r, {x0: Math.min(r.x0, links - 3), x1: Math.max(r.x1, links + breite + 3), y0: Math.min(r.y0, +y - px - 2), y1: Math.max(r.y1, +y + px * .35)});
  }
  return r;
}
// Lange Operanden (z. B. #stopperPlausible) dürfen nicht abgeschnitten werden: Die viewBox wächst, bis alle Texte passen
export function iaSvg(b, h, inhalt, label){
  const t = iaTextRahmen(inhalt), x0 = Math.floor(t.x0), y0 = Math.floor(t.y0);
  const breite = Math.ceil(Math.max(b, t.x1)) - x0, hoehe = Math.ceil(Math.max(h, t.y1)) - y0;
  return `<svg class="ia-svg" viewBox="${x0} ${y0} ${breite} ${hoehe}" role="img" aria-label="${esc(label)}">${inhalt}</svg>`;
}
// Taste für ein Signal: zeigt 0 oder 1, Klick schaltet um
export const iaSignalKnopf = (akt, name, wert, extra = "") =>
  `<button type="button" class="ia-sig${wert ? " an" : ""}" data-ia-akt="${akt}" ${extra}><span class="n">${iaName(name)}</span><b>${wert ? 1 : 0}</b></button>`;
