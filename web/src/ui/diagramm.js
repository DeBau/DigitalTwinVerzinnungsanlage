import { ZYL_LISTE, st } from '../logik/zustand.js';
import { $ } from '../core/szene.js';
import { demo } from '../logik/demo-sps.js';

// ----------------------------------------------------------------------------
// Weg-Zeit-Diagramm
// ----------------------------------------------------------------------------
const wz = $('wz');
const wzCtx = wz.getContext('2d');
export const verlauf = [];
let wzTakt = 0;
export function wzAufzeichnen(dt) {
  wzTakt += dt;
  if (wzTakt < 0.1) return;
  wzTakt = 0;
  verlauf.push({ p: ZYL_LISTE.map(c => c.pos), s: st.modus === 'demo' ? demo.schritt : null });
  if (verlauf.length > 600) verlauf.shift();
  wzZeichnen();
}
export function wzZeichnen() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = wz.clientWidth, h = wz.clientHeight;
  if (!w) return;
  if (wz.width !== Math.round(w * dpr)) { wz.width = Math.round(w * dpr); wz.height = Math.round(h * dpr); }
  const cs = getComputedStyle(document.documentElement);
  const fg = cs.getPropertyValue('--fg').trim(), muted = cs.getPropertyValue('--muted').trim();
  const line = cs.getPropertyValue('--line').trim(), accent = cs.getPropertyValue('--accent').trim();
  const c = wzCtx;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, w, h);
  const links = 40, oben = 16, bahn = (h - oben - 4) / 4, breite = w - links - 4;
  c.textBaseline = 'middle';
  ['MM1', 'MM2', 'MM3', 'MM4'].forEach((n, i) => {
    const y0 = oben + i * bahn;
    c.font = '500 10.5px "IBM Plex Sans Condensed", Arial, sans-serif';
    c.fillStyle = fg; c.fillText('−' + n, 2, y0 + bahn / 2);
    c.fillStyle = muted; c.font = '400 9px "IBM Plex Mono", monospace';
    c.fillText('1', links - 10, y0 + 6); c.fillText('0', links - 10, y0 + bahn - 8);
    c.strokeStyle = line; c.lineWidth = 1;
    c.beginPath(); c.moveTo(links, y0 + bahn - 8 + 0.5); c.lineTo(links + breite, y0 + bahn - 8 + 0.5); c.stroke();
  });
  const n = verlauf.length, dx = breite / 600, start = links + breite - n * dx;
  c.textBaseline = 'top';
  c.font = '400 9.5px "IBM Plex Mono", monospace';
  for (let j = 1; j < n; j++) {
    if (verlauf[j].s !== verlauf[j - 1].s && verlauf[j].s != null) {
      const x = Math.round(start + j * dx) + 0.5;
      c.strokeStyle = line; c.beginPath(); c.moveTo(x, oben - 2); c.lineTo(x, h - 4); c.stroke();
      c.fillStyle = muted; c.fillText(String(verlauf[j].s), x + 2, 2);
    }
  }
  c.strokeStyle = accent; c.lineWidth = 2; c.lineJoin = 'round';
  for (let i = 0; i < 4; i++) {
    const y0 = oben + i * bahn + 6, hoehe = bahn - 14;
    c.beginPath();
    for (let j = 0; j < n; j++) {
      const x = start + j * dx, y = y0 + (1 - verlauf[j].p[i]) * hoehe;
      j ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.stroke();
  }
}

