// Editor-Kern: SVG-Grundlagen für alle Zeichnungen (Farben, Text, Pfeilspitze, Blatthöhe).
import { esc } from '../app/basis.js';

export const INK = "#17212B", MUTE = "#9AA4AD";
export const tw = (s, px=13) => Math.max(...String(s ?? "").split("\n").map(l => l.length)) * px * .58;
export const SCHRIFT = "Plex Sans,Segoe UI,sans-serif";
// Text an x, y mit Ausrichtung a, Größe sz, Stärke w, Farbe f. Mehrzeilig: Zeilen durch Zeilenumbruch getrennt,
// zentrierte Beschriftungen bleiben dabei mittig.
export const SVGT = (x, y, t, a="middle", sz=13, w=500, f=INK) => {
  const ls = String(t ?? "").split("\n"), y0 = a === "middle" && ls.length > 1 ? y - (ls.length - 1) * .6 * sz : y;
  const zeile = (l, i) => `<tspan x="${x}" dy="${i ? (1.2 * sz).toFixed(1) : 0}">${esc(l)}</tspan>`;
  const body = ls.length > 1 ? ls.map(zeile).join("") : esc(t);
  return `<text x="${x}" y="${y0.toFixed ? +y0.toFixed(1) : y0}" text-anchor="${a}" font-size="${sz}" font-weight="${w}" fill="${f}" `
    + `font-family="${SCHRIFT}">${body}</text>`;
};
export function arrowHead(x1, y1, x2, y2, h=6.5, w=.42){
  const a = Math.atan2(y2 - y1, x2 - x1), f = n => n.toFixed(1);
  const ecke = s => `${f(x2 - h*Math.cos(a + s))} ${f(y2 - h*Math.sin(a + s))}`;
  return `<path d="M${f(x2)} ${f(y2)}L${ecke(-w)}L${ecke(w)}Z" fill="${INK}"/>`;
}
/* Blätter: Die Zeichnung wächst nach unten; jedes Blatt hat Rahmen und Schriftfeld. Formulare (Weg-Schritt, Trend) bleiben einblättrig. */
export const PH = 707;   // Blatthöhe in Zeichnungseinheiten
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
