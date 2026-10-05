// ----------------------------------------------------------------------------
// Sprache der Oberfläche: Deutsch (Quelltext) oder Englisch (Wörterbuch).
// Der deutsche Text ist der Schlüssel – fehlt eine Übersetzung, bleibt er stehen.
//   t('Text')                    feste Texte
//   t`Korb ${nr} verzinnt`       Texte mit Werten (Schlüssel „Korb {0} verzinnt“)
// Statisches HTML übersetzt domUebersetzen() einmal beim Start. Umschalten lädt die Seite
// neu, weil 3D-Beschriftungen und bedruckte Flächen beim Aufbau entstehen.
// ----------------------------------------------------------------------------
import EN_UI from '../sprache/en-ui.js';
import EN_ANLAGE from '../sprache/en-anlage.js';
import EN_LOGIK from '../sprache/en-logik.js';
import EN_SIGNALE from '../sprache/en-signale.js';

const SPEICHER = 'zinnbad-sprache';
export const SPRACHE = (() => {
  try { const s = localStorage.getItem(SPEICHER); if (s === 'de' || s === 'en') return s; } catch { /* kein Speicher */ }
  return /^de\b/i.test(navigator.language || 'de') ? 'de' : 'en';
})();
export const LOCALE = SPRACHE === 'en' ? 'en-GB' : 'de-DE';

const norm = (s) => String(s).replace(/[\s ]+/g, ' ').trim();
const WB = new Map();
for (const teil of [EN_UI, EN_ANLAGE, EN_LOGIK, EN_SIGNALE]) for (const [de, en] of Object.entries(teil)) WB.set(norm(de), en);

// Diagnose: window.__fehlend = new Set() vor dem Laden sammelt alle Texte ohne Übersetzung
// (schon übersetzte Texte, die ein zweites Mal durch t() laufen, zählen nicht)
let englisch = null;
const ENGLISCH = () => (englisch ??= new Set([...WB.values()].map(norm)));
function nachschlagen(schluessel) {
  if (SPRACHE === 'de') return null;
  const en = WB.get(schluessel);
  if (en === undefined && window.__fehlend && /[a-zäöüß]{2}/i.test(schluessel) && !ENGLISCH().has(schluessel)) window.__fehlend.add(schluessel);
  return en ?? null;
}
export function t(s, ...werte) {
  if (Array.isArray(s) && s.raw) {
    const schluessel = norm(s.reduce((a, teil, i) => a + '{' + (i - 1) + '}' + teil));
    const vorlage = nachschlagen(schluessel);
    if (vorlage == null) return s.reduce((a, teil, i) => a + werte[i - 1] + teil);
    return vorlage.replace(/\{(\d+)\}/g, (_, i) => werte[i]);
  }
  if (s == null || s === '') return s;
  return nachschlagen(norm(s)) ?? s;
}

// Statisches HTML: Textknoten und beschreibende Attribute (Leerraum außen bleibt erhalten)
export function domUebersetzen(wurzel = document.body) {
  if (SPRACHE === 'de') return;
  document.documentElement.lang = SPRACHE;
  document.title = t(document.title);
  const gang = document.createTreeWalker(wurzel, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest('script, style') || !n.nodeValue.trim() ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let n = gang.nextNode(); n; n = gang.nextNode()) {
    const en = nachschlagen(norm(n.nodeValue));
    if (en != null) { const [, vor, , nach] = n.nodeValue.match(/^(\s*)([\s\S]*?)(\s*)$/); n.nodeValue = vor + en + nach; }
  }
  for (const el of wurzel.querySelectorAll('[title], [aria-label], [placeholder], [alt], optgroup[label]')) {
    for (const a of ['title', 'aria-label', 'placeholder', 'alt', 'label']) if (el.hasAttribute(a)) el.setAttribute(a, t(el.getAttribute(a)));
  }
}

// Umschalter oben in der Seitenleiste (beschriftet mit der jeweils anderen Sprache)
export function spracheWechseln(neu) {
  try { localStorage.setItem(SPEICHER, neu); } catch { /* kein Speicher */ }
  location.reload();
}
{
  const knopf = document.getElementById('sprache');
  if (knopf) {
    const andere = SPRACHE === 'de' ? 'en' : 'de';
    knopf.textContent = andere.toUpperCase(); knopf.lang = andere;
    knopf.title = andere === 'en' ? 'Switch to English (reloads the page)' : 'Auf Deutsch umschalten (lädt die Seite neu)';
    knopf.onclick = () => spracheWechseln(andere);
  }
}
domUebersetzen();
