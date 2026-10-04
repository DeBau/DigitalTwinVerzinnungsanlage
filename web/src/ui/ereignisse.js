import { st } from '../logik/zustand.js';
import { $ } from '../core/szene.js';


// ----------------------------------------------------------------------------
// Ereignisse
// ----------------------------------------------------------------------------
export const zuletzt = new Map();
export let toastBis = 0;
export function ereignis(text, art = '', schluessel = null) {
  const jetzt = performance.now();
  if (schluessel) {
    if (jetzt - (zuletzt.get(schluessel) || -1e9) < 6000) return;
    zuletzt.set(schluessel, jetzt);
  }
  const ul = $('events');
  ul.querySelector('.empty')?.remove();
  const li = document.createElement('li');
  li.className = art;
  li.innerHTML = `<time>${new Date().toLocaleTimeString('de-DE')}</time><span></span>`;
  li.querySelector('span').textContent = text;
  ul.prepend(li);
  while (ul.children.length > 40) ul.lastChild.remove();
  if (art === 'err') {
    st.letzteStoerung = { text, zeit: new Date().toLocaleTimeString('de-DE') };
    $('toast-text').textContent = text;
    $('toast').hidden = false;
    toastBis = jetzt + 4500;
  }
}

