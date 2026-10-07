// Editor-Kern: Eingabefeld für Kennzeichen mit Vorschlagsliste (Combobox nach WAI-ARIA).
// Die Vorschläge kommen aus der Signalliste (SIG) und den Anlagenteilen (EXTRA), die Signale der Übung zuerst.
// Welche Kennbuchstaben passen, sagt der Bausteineintrag: kennbuchstaben: ["QA", "KF"] (siehe src/README.md).
// objektFelder (eigenschaften.js) nimmt dieses Feld für das Kennzeichen, sobald der Baustein kennbuchstaben hat.
// Die Listener hängt editor/ereignisse.js an: signalEingabe (input), signalTaste (keydown), signalWahl (pointerdown).
import { EXTRA, SIG } from '../app/daten.js';
import { BY, esc } from '../app/basis.js';
import { ED } from './status.js';

export const VORSCHLAEGE_MAX = 12;

// "-" oder "–" am Anfang wird zum Minuszeichen "−" (U+2212) vor Kennzeichen
export const normKennzeichen = v => String(v ?? "").replace(/^[-–]/, "−");
const ohneMinus = t => normKennzeichen(t).replace(/^−/, "").trim().toLowerCase();
export const kennArt = tag => (/^[A-Z]+/.exec(tag) || [""])[0];

// Vorschläge [{tag, name, art, uebung}] für die Übung scope, gefiltert nach Kennbuchstaben und Suchtext
export function signalVorschlaege(scope, {arten = [], text = ""} = {}){
  const eigene = new Set(((BY[scope] && BY[scope].sig) || "").split(" "));
  const such = ohneMinus(text);
  const alle = [...new Set([...Object.keys(SIG), ...Object.keys(EXTRA)])].map(tag => ({
    tag, art: kennArt(tag), uebung: eigene.has(tag),
    name: SIG[tag] && SIG[tag][0] ? SIG[tag][0].k : EXTRA[tag] || "",
  }));
  const passt = v => (!arten.length || arten.includes(v.art))
    && (!such || v.tag.toLowerCase().includes(such) || v.name.toLowerCase().includes(such));
  return alle.filter(passt).sort((a, b) => (b.uebung - a.uebung) || a.tag.localeCompare(b.tag, "de", {numeric: true}));
}

// HTML des Felds: Eingabe mit Liste darunter. data-sigart trägt die Kennbuchstaben für die Vorschläge.
export function signalFeld(feld, beschriftung, wert, {arten = [], ph = ""} = {}){
  const liste = `sfl-${feld}`;
  return `<label class="prop sigfeld">${beschriftung}<input type="text" role="combobox" aria-autocomplete="list" `
    + `aria-expanded="false" aria-controls="${liste}" data-prop="${feld}" data-sigart="${arten.join(" ")}" `
    + `value="${esc(wert ?? "")}" placeholder="${esc(ph)}" autocomplete="off">`
    + `<ul class="sigliste" role="listbox" id="${liste}" hidden></ul></label>`;
}

export const istSignalFeld = el => !!(el && el.matches && el.matches("input[data-sigart]"));
const listeVon = el => document.getElementById(el.getAttribute("aria-controls"));

// Eingabe: Minuszeichen setzen und die Liste neu füllen
export function signalEingabe(el){
  const v = normKennzeichen(el.value);
  if (v !== el.value) { const pos = el.selectionStart; el.value = v; el.setSelectionRange(pos, pos); }
  zeigeListe(el);
}
export function zeigeListe(el){
  const ul = listeVon(el);
  if (!ul) return;
  const arten = el.dataset.sigart.split(" ").filter(Boolean);
  const vs = signalVorschlaege(ED.scope, {arten, text: el.value}).slice(0, VORSCHLAEGE_MAX);
  ul.innerHTML = vs.map((v, i) => `<li role="option" id="${ul.id}-${i}" data-sigwahl="${v.tag}" aria-selected="false"`
    + `${v.uebung ? ' class="ueb"' : ""}><b>−${v.tag}</b> ${esc(v.name)}</li>`).join("");
  ul.hidden = !vs.length;
  el.setAttribute("aria-expanded", String(!!vs.length));
  el.removeAttribute("aria-activedescendant");
}
export function schliesseListe(el){
  const ul = listeVon(el);
  if (ul) ul.hidden = true;
  el.setAttribute("aria-expanded", "false");
  el.removeAttribute("aria-activedescendant");
}
// Vorschlag übernehmen: Wert setzen und als Eingabe melden (der input-Listener übernimmt ihn in die Zeichnung)
export function uebernimmSignal(el, tag){
  el.value = "−" + tag;
  el.dispatchEvent(new Event("input", {bubbles: true}));
  schliesseListe(el);
}
// Markierung in der Liste um schritt verschieben
export function bewegeAuswahl(el, schritt){
  const ul = listeVon(el), opts = ul ? [...ul.children] : [];
  if (!opts.length) return;
  const alt = opts.findIndex(li => li.getAttribute("aria-selected") === "true");
  const neu = (alt + schritt + opts.length + (alt < 0 && schritt < 0 ? 1 : 0)) % opts.length;
  opts.forEach((li, i) => li.setAttribute("aria-selected", String(i === neu)));
  el.setAttribute("aria-activedescendant", opts[neu].id);
  opts[neu].scrollIntoView({block: "nearest"});
}
// Tasten im Feld: Pfeile wählen, Enter übernimmt, Esc schließt nur die Liste. true, wenn die Taste verbraucht ist.
export function signalTaste(e){
  const el = e.target;
  if (!istSignalFeld(el)) return false;
  const offen = el.getAttribute("aria-expanded") === "true", aktiv = el.getAttribute("aria-activedescendant");
  const tasten = {
    ArrowDown: () => offen ? bewegeAuswahl(el, 1) : zeigeListe(el),
    ArrowUp: () => offen && bewegeAuswahl(el, -1),
    Enter: () => offen && aktiv && uebernimmSignal(el, document.getElementById(aktiv).dataset.sigwahl),
    Escape: () => offen && schliesseListe(el),
  };
  const zuTun = tasten[e.key];
  if (!zuTun || (e.key === "Enter" && !(offen && aktiv)) || (e.key === "Escape" && !offen)) return false;
  e.preventDefault(); e.stopPropagation();
  zuTun();
  return true;
}
// Klick auf einen Vorschlag: übernehmen, Fokus bleibt im Feld
export function signalWahl(e){
  const li = e.target.closest && e.target.closest("[data-sigwahl]");
  if (!li) return false;
  e.preventDefault();
  const el = document.querySelector(`[aria-controls="${li.parentElement.id}"]`);
  if (el) uebernimmSignal(el, li.dataset.sigwahl);
  return true;
}
