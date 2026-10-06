/* Zeichen-Grundlagen für Schaltzeichen: Linie, gestrichelte Wirklinie, Kreis, Text, Anschlussnummer.
   Reine Funktionen ohne DOM. Sie liefern SVG-Text und werden von symbole/iec60617.js und vom Schaltplan genutzt. */

export const TINTE = "#17212B", GRAU = "#5A6672", BLAU = "#0E4C92", ANNAHME = "#9A6B00";
export const SCHRIFT = "Plex Sans,Segoe UI,sans-serif", SCHMAL = "Plex Cond,Plex Sans,Segoe UI,sans-serif";

export const maskiere = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const zahl = n => +n.toFixed(1);

export function linie(d, breite = 1.4){
  return `<path d="${d}" stroke="${TINTE}" stroke-width="${breite}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
}

// Wirklinie (mechanische Verbindung zwischen Betätigung und Kontakt)
export const wirklinie = d => `<path d="${d}" stroke="${TINTE}" stroke-width="1.1" fill="none" stroke-dasharray="3 2.5"/>`;

export function kreis(x, y, r, fuellung = "#fff", breite = 1.4){
  return `<circle cx="${zahl(x)}" cy="${zahl(y)}" r="${r}" fill="${fuellung}" stroke="${TINTE}" stroke-width="${breite}"/>`;
}

export function kasten(x, y, b, h, fuellung = "#fff"){
  return `<rect x="${zahl(x)}" y="${zahl(y)}" width="${b}" height="${h}" fill="${fuellung}" stroke="${TINTE}" stroke-width="1.4"/>`;
}

export function punkt(x, y, r = 2.6){
  return `<circle cx="${zahl(x)}" cy="${zahl(y)}" r="${r}" fill="${TINTE}"/>`;
}

// Text; opt: {a: Ausrichtung start|middle|end, g: Größe, w: Gewicht, f: Farbe, k: CSS-Klasse, attr: weitere Attribute}
export function text(x, y, t, opt = {}){
  const {a = "start", g = 10, w = 400, f = TINTE, k = "", attr = "", schrift = SCHRIFT} = opt;
  const klasse = k ? ` class="${k}"` : "";
  return `<text x="${zahl(x)}" y="${zahl(y)}" text-anchor="${a}" font-size="${g}" font-weight="${w}" fill="${f}" `
    + `font-family="${schrift}"${klasse}${attr ? " " + attr : ""}>${maskiere(t)}</text>`;
}

// Anschlussnummer klein und grau neben dem Anschluss
export const nummer = (x, y, t, a = "start") => t ? text(x, y, t, {a, g: 7.5, f: GRAU}) : "";

// Zeilen umbrechen, damit ein Text in eine Spaltenbreite passt (grobe Zeichenbreite 0,55 × Schriftgröße)
export function umbrechen(t, breite, groesse){
  const proZeile = Math.max(4, Math.floor(breite / (groesse * .55)));
  const zeilen = [];
  for (const wort of String(t ?? "").split(/\s+/).filter(Boolean)) {
    const letzte = zeilen[zeilen.length - 1];
    if (letzte !== undefined && (letzte + " " + wort).length <= proZeile) zeilen[zeilen.length - 1] = letzte + " " + wort;
    else zeilen.push(wort);
  }
  return zeilen;
}

// Mehrzeiliger Text ab y nach unten, Zeilenabstand 1,25 × Größe
export function absatz(x, y, zeilen, opt = {}){
  const g = opt.g || 10;
  return zeilen.map((z, i) => text(x, y + i * g * 1.25, z, opt)).join("");
}
