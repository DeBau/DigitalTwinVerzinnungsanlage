// Vorlage Trendaufzeichnung: Formular mit zwei Diagrammen (Istwert/Sollwert, Stellgröße) über der Zeit.
// Gezeichnet wird frei mit Stift, Linie und Text.
import { registriereVorlage } from '../registry.js';
import { G, G2, TX } from '../vorlagen-svg.js';

export function trendBlatt(){
  let s = "";
  const ax = (y0, h, lbl, unit) => { let r = `<path d="M80 ${y0}V${y0+h}H965" stroke="${G}" stroke-width="1.3" fill="none"/>`;
    for (let i = 1; i <= 8; i++) r += `<path d="M80 ${y0 + h - i*h/8}H965" stroke="${G2}" stroke-width=".5"/>`;
    for (let i = 1; i <= 16; i++) r += `<path d="M${80 + i*885/16} ${y0}V${y0+h}" stroke="${G2}" stroke-width=".5"/>`;
    return r + TX(70, y0+10, 11, lbl, "end", "#555", 600) + TX(70, y0+26, 9, unit, "end"); };
  s += ax(40, 380, "x, w", "Einheit:") + TX(965, 440, 11, "t in s", "end", "#555", 600);
  s += ax(470, 130, "y", "in %");
  return s;
}
registriereVorlage("trend", {n: "Trendaufzeichnung", d: "Istwert, Sollwert und Stellgröße über der Zeit", einblattig: true, body: trendBlatt});
