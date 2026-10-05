import { SIGNALE } from '../signale.js';
import { st } from '../logik/zustand.js';
import { $ } from '../core/szene.js';
import { ausgang, eingang, istAnalog } from '../logik/eingaenge.js';
import { t } from '../core/sprache.js';

// ----------------------------------------------------------------------------
// Signalmonitor
// ----------------------------------------------------------------------------
const monZeilen = new Map();       // Signalname → { el, tr, analog }
const letzterWert = new Map();     // Signalname → zuletzt angezeigter Wert
let monSichtbar = true, beobachter = null;
function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
export function monitorAufbauen() {
  const body = $('mon-body');
  body.innerHTML = '';
  monZeilen.clear();
  // Forcen überlebt den Neuaufbau (z. B. „hallo“ der Bridge nach jedem Verbinden) und muss dann
  // auch wieder zu sehen sein. Signale, die es in der neuen Liste nicht mehr gibt, sind nicht mehr geforct.
  for (const n of Object.keys(st.force)) if (!SIGNALE.some(s => s.name === n && s.richtung === 'eingang')) delete st.force[n];
  for (const [richtung, titel] of [['ausgang', 'Ausgänge SPS → Zwilling'], ['eingang', 'Eingänge Zwilling → SPS']]) {
    const kopf = document.createElement('tr');
    kopf.className = 'dir-row';
    kopf.innerHTML = `<td colspan="4">${esc(t(titel))}</td>`;
    body.appendChild(kopf);
    for (const s of SIGNALE.filter(x => x.richtung === richtung)) {
      const tr = document.createElement('tr');
      const kommentar = t(s.kommentar || '');             // Kommentare aus signale.csv, Übersetzung in sprache/en-signale.js
      tr.dataset.suche = (s.name + ' ' + s.adresse + ' ' + kommentar).toLowerCase();
      const an = istAnalog(s);
      const f = s.name in st.force ? (st.force[s.name] ? '1' : '0') : 'auto';
      tr.classList.toggle('forced', f !== 'auto');
      tr.innerHTML = `<td>${an ? '<b class="wert">0</b>' : '<div class="led"></div>'}</td>
        <td class="name">${esc(s.name)}<small>${esc(kommentar)}</small></td>
        <td class="adr">${esc(s.adresse)}</td>
        <td>${an ? '<span class="src">analog</span>' : richtung === 'eingang'
          ? `<span class="force" role="group" aria-label="${esc(t`${s.name} forcen`)}">
               <button type="button" data-f="auto" aria-pressed="${f === 'auto'}" title="${esc(t('Wert aus dem Modell'))}">A</button>
               <button type="button" data-f="0" aria-pressed="${f === '0'}" title="${esc(t('Auf 0 forcen'))}">0</button>
               <button type="button" data-f="1" aria-pressed="${f === '1'}" title="${esc(t('Auf 1 forcen'))}">1</button></span>`
          : `<span class="src">${esc(t('SPS'))}</span>`}</td>`;
      tr.querySelectorAll('.force button').forEach(b => b.onclick = () => {
        const f = b.dataset.f;
        if (f === 'auto') delete st.force[s.name]; else st.force[s.name] = f === '1';
        tr.querySelectorAll('.force button').forEach(x => x.setAttribute('aria-pressed', x === b));
        tr.classList.toggle('forced', f !== 'auto');
      });
      body.appendChild(tr);
      monZeilen.set(s.name, { el: tr.querySelector('.led, .wert'), tr, analog: an });
    }
  }
  letzterWert.clear();
  monBeobachten();
  filtern();
}

// Der Monitor steht unten in der Seitenleiste und ist meistens weggerollt.
// Dann muss er auch nicht nachgeführt werden.
function monBeobachten() {
  if (beobachter || !window.IntersectionObserver) return;
  const sek = $('mon-body').closest('.sec');
  if (!sek) return;
  beobachter = new IntersectionObserver((e) => { monSichtbar = e[0].isIntersecting; }, { rootMargin: '200px' });
  beobachter.observe(sek);
}
function filtern() {
  const q = $('mon-filter').value.trim().toLowerCase();
  for (const z of monZeilen.values()) z.tr.hidden = q && !z.tr.dataset.suche.includes(q);
}
$('mon-filter').addEventListener('input', filtern);
// Geschrieben wird nur, was sich geändert hat: jedes Anfassen des DOM lässt den
// Browser im nächsten Bild den Stil neu aufbauen, und von den gut 250 Signalen
// ändern sich je Durchlauf meist nur ein paar.
export function monitorAktualisieren() {
  if (!monSichtbar) return;
  for (const s of SIGNALE) {
    const z = monZeilen.get(s.name);
    if (!z || z.tr.hidden) continue;
    const wert = z.analog ? eingang(s.name) : (s.richtung === 'eingang' ? !!eingang(s.name) : ausgang(s.name));
    if (letzterWert.get(s.name) === wert) continue;
    letzterWert.set(s.name, wert);
    if (z.analog) z.el.textContent = wert; else z.el.classList.toggle('on', wert);
  }
}

