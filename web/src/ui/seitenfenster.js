import { $, NEBENFENSTER } from '../core/szene.js';
import { t } from '../core/sprache.js';

// ----------------------------------------------------------------------------
// Seitenleiste lösen: Sie wandert in ein eigenes Browserfenster (z. B. auf einen zweiten Bildschirm),
// die 3D-Ansicht hat dann die volle Breite. Schließen des Fensters oder „Andocken“ holt sie zurück.
// Es bleiben dieselben Elemente mit ihren Ereignissen, nur das Dokument wechselt; $() sucht deshalb
// auch im Nebenfenster (core/szene.js).
// ----------------------------------------------------------------------------
const seite = $('side'), app = document.querySelector('.app'), knopf = $('side-loesen');
const platz = { eltern: seite.parentNode, danach: seite.nextSibling };
export const SEITENFENSTER = { fenster: null };

function knopfZeigen() {
  const los = !!SEITENFENSTER.fenster;
  knopf.textContent = t(los ? 'Andocken' : 'Lösen');
  knopf.title = t(los ? 'Zurück in das Hauptfenster' : 'In eigenem Fenster öffnen, z. B. auf einem zweiten Bildschirm');
}
// Neues Fenster: gleiche Stile und Sprache wie das Hauptfenster
function fensterEinrichten(w) {
  const d = w.document;
  d.title = t('Bedienen & Beobachten') + ' – ' + document.title;
  d.documentElement.lang = document.documentElement.lang;
  const thema = document.documentElement.getAttribute('data-theme');
  if (thema) d.documentElement.setAttribute('data-theme', thema);
  for (const s of document.head.querySelectorAll('style, link[rel="stylesheet"]')) d.head.appendChild(d.importNode(s, true));
}

export function loesen() {
  const breite = Math.round(seite.offsetWidth || 480) + 16, hoehe = Math.round(screen.availHeight * 0.85);
  const w = window.open('', 'zinnbad-seitenleiste', `popup,width=${breite},height=${hoehe}`);
  if (!w) { window.zwillingFehler?.(t('Fenster blockiert'), t('Der Browser hat das neue Fenster blockiert. Bitte Pop-ups für diese Seite erlauben.')); return; }
  fensterEinrichten(w);
  seite.hidden = false;
  seite.classList.add('abgeloest');
  w.document.body.style.margin = '0';
  w.document.body.appendChild(w.document.adoptNode(seite));
  NEBENFENSTER.doc = w.document;
  SEITENFENSTER.fenster = w;
  app.classList.add('seite-zu');                       // 3D-Ansicht nutzt die volle Breite
  w.addEventListener('pagehide', andocken);            // Fenster geschlossen
  knopfZeigen();
}
export function andocken() {
  const w = SEITENFENSTER.fenster;
  if (!w) return;
  SEITENFENSTER.fenster = null;
  NEBENFENSTER.doc = null;
  seite.classList.remove('abgeloest');
  platz.eltern.insertBefore(document.adoptNode(seite), platz.danach);
  app.classList.remove('seite-zu');
  $('btn-side').setAttribute('aria-pressed', 'true');
  knopfZeigen();
  if (!w.closed) w.close();
}

knopf.onclick = () => (SEITENFENSTER.fenster ? andocken() : loesen());
window.addEventListener('pagehide', () => SEITENFENSTER.fenster?.close());   // Hauptfenster neu geladen oder geschlossen
