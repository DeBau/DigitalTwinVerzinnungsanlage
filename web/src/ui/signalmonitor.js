import { SIGNALE } from '../signale.js';
import { st } from '../logik/zustand.js';
import { $ } from '../core/szene.js';
import { ausgangSps, ausgangWort, eingang, istAnalog, vomPortal } from '../logik/eingaenge.js';
import { signalName, t } from '../core/sprache.js';

// ----------------------------------------------------------------------------
// Signalmonitor
// ----------------------------------------------------------------------------
const monZeilen = new Map();       // Signalname → { el, tr, analog }
const byteZeilen = new Map();      // „%IB1“ → { el, tr, bits: [{ s, bit }] }
const letzterWert = new Map();     // Signalname bzw. Byte → zuletzt angezeigter Wert
let monSichtbar = true, beobachter = null;
// Anzeigeformat für Byte und Wort wie in der Beobachtungstabelle: Dez (Wort als Int, Byte ohne Vorzeichen), 16#…, 2#…
const FORMATE = {
  dez: (w) => String(w),
  hex: (w, bits) => '16#' + (w & (2 ** bits - 1)).toString(16).toUpperCase().padStart(bits / 4, '0'),
  bin: (w, bits) => '2#' + (w & (2 ** bits - 1)).toString(2).padStart(bits, '0').replace(/(\d{4})(?=\d)/g, '$1_'),
};
const formatWahl = () => $('mon-format').value;
function wortText(s, w) {
  if (formatWahl() === 'dez' && /_[SZ]TW\d$/.test(s.name)) return FORMATE.hex(w, 16);   // Steuer-/Zustandswort lesbar als 16#…
  return FORMATE[formatWahl()](w, 16);
}
// Byteadresse eines Bitsignals: „%I1.3“ → { byte: '%IB1', bit: 3 }
function byteVon(adresse) {
  const m = /^%?\s*([IEQA])\s*(\d+)\.(\d)$/i.exec(adresse || '');
  return m && { byte: '%' + (/[IE]/i.test(m[1]) ? 'I' : 'Q') + 'B' + m[2], bit: +m[3] };
}
function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
export function monitorAufbauen() {
  const body = $('mon-body');
  body.innerHTML = '';
  monZeilen.clear();
  byteZeilen.clear();
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
      const name = signalName(s.name);                    // wie im TIA-Projekt der gewählten Sprache
      tr.dataset.suche = (name + ' ' + s.name + ' ' + s.adresse + ' ' + kommentar).toLowerCase();
      const an = istAnalog(s), b = !an && byteVon(s.adresse);
      if (b && !byteZeilen.has(b.byte)) {
        const btr = document.createElement('tr');
        btr.className = 'byte-row';
        btr.dataset.suche = b.byte.toLowerCase();
        btr.innerHTML = `<td><b class="wert">0</b></td><td class="name">${esc(b.byte)}<small>${esc(t('Byte aus den Bits darunter'))}</small></td><td class="adr">${esc(b.byte)}</td><td></td>`;
        body.appendChild(btr);
        byteZeilen.set(b.byte, { el: btr.querySelector('.wert'), tr: btr, bits: [] });
      }
      if (b) byteZeilen.get(b.byte).bits.push({ s, bit: b.bit });
      const f = s.name in st.force ? (st.force[s.name] ? '1' : '0') : 'auto';
      tr.classList.toggle('forced', f !== 'auto');
      tr.innerHTML = `<td>${an ? '<b class="wert">0</b>' : '<div class="led"></div>'}</td>
        <td class="name"${name !== s.name ? ` title="${esc(t`Name in signale.csv: ${s.name}`)}"` : ''}>${esc(name)}<small>${esc(kommentar)}</small></td>
        <td class="adr">${esc(s.adresse)}</td>
        <td>${an ? `<span class="src">${richtung === 'eingang' ? 'analog' : esc(t('Wort'))}</span>` : richtung === 'eingang'
          ? `<span class="force" role="group" aria-label="${esc(t`${name} forcen`)}">
               <button type="button" data-f="auto" aria-pressed="${f === 'auto'}" title="${esc(t('Wert aus dem Modell'))}">A</button>
               <button type="button" data-f="0" aria-pressed="${f === '0'}" title="${esc(t('Auf 0 forcen'))}">0</button>
               <button type="button" data-f="1" aria-pressed="${f === '1'}" title="${esc(t('Auf 1 forcen'))}">1</button></span>`
          : vomPortal(s.name) ? `<span class="src" title="${esc(t('Übungsumfang Verzinnen: Portal automatisch. Das Ventil schaltet die Portalsteuerung, dieser SPS-Ausgang ist ohne Wirkung.'))}">${esc(t('Portal'))}</span>`
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
  const q = $('mon-filter').value.trim().toLowerCase(), bytes = $('mon-bytes').checked;
  for (const z of monZeilen.values()) z.tr.hidden = q && !z.tr.dataset.suche.includes(q);
  for (const z of byteZeilen.values()) z.tr.hidden = !bytes || (q && !z.tr.dataset.suche.includes(q) && z.bits.every(x => monZeilen.get(x.s.name).tr.hidden));
}
$('mon-filter').addEventListener('input', filtern);
$('mon-bytes').addEventListener('change', filtern);
$('mon-format').addEventListener('change', () => { letzterWert.clear(); try { localStorage.setItem('zinnbad-monformat', formatWahl()); } catch { /* kein Speicher */ } });
try { const f = localStorage.getItem('zinnbad-monformat'); if (f in FORMATE) $('mon-format').value = f; } catch { /* kein Speicher */ }
const bitWert = (s) => (s.richtung === 'eingang' ? !!eingang(s.name) : ausgangSps(s.name));
// Geschrieben wird nur, was sich geändert hat: jedes Anfassen des DOM lässt den
// Browser im nächsten Bild den Stil neu aufbauen, und von den gut 250 Signalen
// ändern sich je Durchlauf meist nur ein paar.
export function monitorAktualisieren() {
  if (!monSichtbar) return;
  for (const s of SIGNALE) {
    const z = monZeilen.get(s.name);
    if (!z || z.tr.hidden) continue;
    let wert = z.analog ? (s.richtung === 'eingang' ? eingang(s.name) : ausgangWort(s.name)) : bitWert(s);
    if (z.analog) wert = wortText(s, wert);
    if (letzterWert.get(s.name) === wert) continue;
    letzterWert.set(s.name, wert);
    if (z.analog) z.el.textContent = wert; else z.el.classList.toggle('on', wert);
  }
  for (const [adr, z] of byteZeilen) {
    if (z.tr.hidden) continue;
    const wert = FORMATE[formatWahl()](z.bits.reduce((w, x) => w | (bitWert(x.s) ? 1 << x.bit : 0), 0), 8);
    if (letzterWert.get(adr) === wert) continue;
    letzterWert.set(adr, wert);
    z.el.textContent = wert;
  }
}

