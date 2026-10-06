/* Blatt im Format A3 quer: Rahmen, Spalten 0 bis 9 mit Nummern, Schriftfeld.
   Alle Seitenarten zeichnen in diese Fläche. Maße in Zeichnungseinheiten (1188 × 840, etwa 2,83 je Millimeter). */
import { GRAU, SCHMAL, TINTE, kasten, linie, maskiere, text } from '../symbole/grund.js';

export const BREITE = 1188, HOEHE = 840;
export const X0 = 30, X1 = 1178, Y0 = 10, KOPF = 26, FUSS = 770;
export const SPALTE = (X1 - X0) / 10;

export const spalteVon = x => Math.max(0, Math.min(9, Math.floor((x - X0) / SPALTE)));
export const spaltenMitte = i => X0 + (i + .5) * SPALTE;

function spaltenKopf(){
  let s = linie(`M${X0} ${KOPF}H${X1}`, .8);
  for (let i = 0; i < 10; i++) {
    const x = X0 + i * SPALTE;
    if (i) s += linie(`M${x} ${Y0}V${KOPF}`, .8);
    s += text(x + SPALTE / 2, Y0 + 12, String(i), {a: "middle", g: 9, f: GRAU});
  }
  return s;
}

// Schriftfeld: Firma | Anlage | Seitentitel | Ort und Stand | Seitennummer
function schriftfeld(seite, gesamt, meta){
  const y = FUSS, h = 830 - FUSS, x = [X0, 290, 560, 930, 1060, X1];
  // Schrift so groß, dass der Text ins Feld passt
  const passend = (t, breite, max) => Math.min(max, Math.round(breite / (String(t).length * .52) * 10) / 10);
  const feld = (i, oben, unten, gross = false) => text(x[i] + 8, y + 18, oben, {g: 8, f: GRAU})
    + text(x[i] + 8, y + (gross ? 46 : 42), unten, {g: passend(unten, x[i + 1] - x[i] - 16, gross ? 17 : 11), w: 600, schrift: SCHMAL});
  let s = linie(`M${X0} ${y}H${X1}`, 1.2) + x.slice(1, -1).map(v => linie(`M${v} ${y}V${y + h}`, .8)).join("");
  s += feld(0, meta.firma, meta.ersteller) + feld(1, meta.anlage, "Schaltplan der Anlage");
  s += feld(2, seite.art || "", seite.titel, true) + feld(3, `Ort ${seite.ort || "+A1"}`, `Stand ${meta.stand}`);
  s += text(x[4] + 59, y + 38, String(seite.nr), {a: "middle", g: 22, w: 600, schrift: SCHMAL});
  s += text(x[4] + 59, y + 53, `von ${gesamt}`, {a: "middle", g: 8, f: GRAU});
  return s;
}

// Komplettes Blatt als SVG-Text; inhalt ist der fertig gezeichnete Seiteninhalt
export function blatt(seite, gesamt, meta, inhalt){
  const rahmen = kasten(X0, Y0, X1 - X0, 830 - Y0, "none");
  return `<svg class="sp-svg" viewBox="0 0 ${BREITE} ${HOEHE}" xmlns="http://www.w3.org/2000/svg" role="img" `
    + `aria-label="${maskiere(`Seite ${seite.nr}: ${seite.titel}`)}" font-family="Plex Sans,Segoe UI,sans-serif">`
    + `<rect width="${BREITE}" height="${HOEHE}" fill="#fff"/>${rahmen}${spaltenKopf()}`
    + `<g class="sp-inhalt" stroke-linecap="round">${inhalt}</g>${schriftfeld(seite, gesamt, meta)}</svg>`;
}

// Überschrift über dem Seiteninhalt (für Tabellen und Übersichten)
export const ueberschrift = (t, unter = "") => text(X0 + 20, 60, t, {g: 20, w: 600, schrift: SCHMAL, f: TINTE})
  + (unter ? text(X0 + 20, 80, unter, {g: 10, f: GRAU}) : "");
