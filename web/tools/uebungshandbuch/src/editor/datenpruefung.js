// Editor-Kern: gespeicherte Zeichnungen beim Laden prüfen (localStorage, Import, „Aus früherer Übung“).
// Gespeicherte Werte landen beim Zeichnen in SVG-Attributen. Eine präparierte Datei darf dort keinen Code einschleusen:
// Zahlenfelder laufen über num(), Farben nur als #hex, Schlüssel (Bausteinart, IDs, Anschlüsse) nur aus harmlosen
// Zeichen. Texte bleiben Text, esc() maskiert sie beim Zeichnen. Aufruf über ladeSkizze (blaetter.js).

// Zahl oder 0 (nicht endliche Werte wie NaN, Infinity oder Text)
export const num = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
export const FARBE = /^#[0-9a-f]{3,8}$/i;
export const SCHLUESSEL = /^[A-Za-z0-9_-]*$/;          // Bausteinart k, Strichart, Signalgeber-Art
export const KENNUNG = /^[A-Za-z0-9_@~+.:-]*$/;        // IDs und Anschlüsse, z. B. "_L1@0" (Schiene), "~"
// Feldname → Prüfung je Element; ungültig bei Schlüsseln heißt: Element fällt weg
export const ZAHLENFELDER = ["x", "y", "w", "h", "rot", "fw", "fh", "y2"];
export const SCHLUESSELFELDER = {k: SCHLUESSEL, sg: SCHLUESSEL, id: KENNUNG, a: KENNUNG, b: KENNUNG, pa: KENNUNG, pb: KENNUNG};

// Ein Element (Baustein, Verbindung, Strich, Text) prüfen; null, wenn ein Schlüsselfeld ungültig ist
export function pruefeElement(e, zahlen = ZAHLENFELDER){
  if (!e || typeof e !== "object" || Array.isArray(e)) return null;
  const r = {...e};
  for (const [f, muster] of Object.entries(SCHLUESSELFELDER)) {
    if (f in r && !(typeof r[f] === "string" && muster.test(r[f]))) return null;
  }
  zahlen.forEach(f => { if (f in r) r[f] = num(r[f]); });
  if ("c" in r && !(typeof r.c === "string" && FARBE.test(r.c))) delete r.c;   // Standardfarbe der Vorlage
  if ("p" in r) r.p = Array.isArray(r.p) ? r.p.filter(Array.isArray).map(([x, y]) => [num(x), num(y)]) : [];
  return r;
}
const liste = (l, zahlen) => (Array.isArray(l) ? l : []).map(e => pruefeElement(e, zahlen)).filter(Boolean);

// Gespeicherte Zeichnung d prüfen; liefert eine bereinigte Kopie oder null
export function pruefeZeichnung(d){
  if (!d || typeof d !== "object" || Array.isArray(d)) return null;
  const r = {...d, o: liste(d.o), c: liste(d.c), s: liste(d.s), t: liste(d.t, [...ZAHLENFELDER, "s"])};
  if ("ts" in r) r.ts = num(r.ts);
  if (r.meta && typeof r.meta === "object") {
    r.meta = {...r.meta};
    if ("pfadbreite" in r.meta) r.meta.pfadbreite = num(r.meta.pfadbreite);
  } else delete r.meta;
  return r;
}
