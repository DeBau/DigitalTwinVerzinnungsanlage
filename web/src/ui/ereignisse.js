import { st } from '../logik/zustand.js';
import { $ } from '../core/szene.js';
import { LOCALE, t } from '../core/sprache.js';


// ----------------------------------------------------------------------------
// Ereignisse (feste Texte übersetzt ereignis() selbst, Texte mit Werten kommen schon als t`…`)
// ----------------------------------------------------------------------------
export const zuletzt = new Map();
export let toastBis = 0;
export function ereignis(text, art = '', schluessel = null) {
  const jetzt = performance.now();
  if (schluessel) {
    if (jetzt - (zuletzt.get(schluessel) || -1e9) < 6000) return;
    zuletzt.set(schluessel, jetzt);
  }
  text = t(text);
  const ul = $('events');
  ul.querySelector('.empty')?.remove();
  const li = document.createElement('li');
  li.className = art;
  li.innerHTML = `<time>${new Date().toLocaleTimeString(LOCALE)}</time><span></span>`;
  li.querySelector('span').textContent = text;
  ul.prepend(li);
  while (ul.children.length > 40) ul.lastChild.remove();
  if (art === 'err') {
    st.letzteStoerung = { text, zeit: new Date().toLocaleTimeString(LOCALE) };
    $('toast-text').textContent = text;
    $('toast').hidden = false;
    toastBis = jetzt + 4500;
  }
}
