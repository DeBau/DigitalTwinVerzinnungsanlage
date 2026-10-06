import { esc } from '../app/basis.js';

/* ---------- Bausteine: GRAFCET, Zustandsdiagramm, Stromlauf, Regelkreis ---------- */
export const INK = "#17212B", MUTE = "#9AA4AD";
export const tw = (s, px=13) => Math.max(...String(s ?? "").split("\n").map(l => l.length)) * px * .58;
export const SVGT = (x, y, t, a="middle", sz=13, w=500, f=INK) => {   // mehrzeilig: Zeilen getrennt durch Zeilenumbruch, zentrierte Beschriftungen bleiben mittig
  const ls = String(t ?? "").split("\n"), y0 = a === "middle" && ls.length > 1 ? y - (ls.length - 1) * .6 * sz : y;
  const body = ls.length > 1 ? ls.map((l, i) => `<tspan x="${x}" dy="${i ? (1.2 * sz).toFixed(1) : 0}">${esc(l)}</tspan>`).join("") : esc(t);
  return `<text x="${x}" y="${y0.toFixed ? +y0.toFixed(1) : y0}" text-anchor="${a}" font-size="${sz}" font-weight="${w}" fill="${f}" font-family="Plex Sans,Segoe UI,sans-serif">${body}</text>`;
};
export function arrowHead(x1, y1, x2, y2, h=6.5, w=.42){
  const a = Math.atan2(y2 - y1, x2 - x1), f = n => n.toFixed(1);
  return `<path d="M${f(x2)} ${f(y2)}L${f(x2 - h*Math.cos(a - w))} ${f(y2 - h*Math.sin(a - w))}L${f(x2 - h*Math.cos(a + w))} ${f(y2 - h*Math.sin(a + w))}Z" fill="${INK}"/>`;
}
/* Blätter: Die Zeichnung wächst nach unten; jedes Blatt hat Rahmen und Schriftfeld. Formulare (Weg-Schritt, Trend) bleiben einblättrig. */
export const PH = 707, FIXED = {wegschritt: true, trend: true};
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
