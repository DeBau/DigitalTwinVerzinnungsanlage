// Strompfade des Stromlaufplans: Raster der Pfade (Breite 46 oder 60, umschaltbar), Pfadnummer, und wohin das
// Kennzeichen eines Glieds ausweicht, wenn links der Nachbarpfad im Weg ist.
// Die Breite steht in der Zeichnung unter meta.pfadbreite (nur gesetzt, wenn sie nicht 46 ist).
import { INK, PH, tw } from '../svg.js';
import { ED } from '../status.js';
import { art, bauteil } from '../registry.js';
import { G, G2, TX, grid } from '../vorlagen-svg.js';
import { LB, portsOf } from '../bauteile.js';
import { gruppenId, umrissVon } from '../bausteine.js';
import { zeigeHinweis } from '../eigenschaften.js';
import { refreshTpl } from '../anzeige.js';
import { aendere } from '../verlauf.js';

export const PFADBREITEN = [46, 60];
export const breiteVon = meta => (meta && meta.pfadbreite) || PFADBREITEN[0];
// Breite der Zeichnung, die gerade gezeichnet oder bearbeitet wird (merkePfade setzt sie vor dem Zeichnen)
export const PFAD = {breite: PFADBREITEN[0]};
export const pfadZahl = breite => Math.floor(935 / breite);
export const pfadX = (n, breite = PFAD.breite) => 40 + n * breite;
export const pfadNummer = (x, breite = PFAD.breite) => Math.max(1, Math.min(pfadZahl(breite), Math.round((x - 40) / breite)));

// Glied eines Strompfads: Baustein der Gruppe elektro mit Anschluss oben (0) und unten (1)
export const imPfad = o => gruppenId(o) === "elektro" && !!(bauteil(o.k) ? bauteil(o.k).bx : art(o.k).anschluesse);

/* ---------- Ketten und automatische Leitungen zu L+ und M ---------- */
const istKettenLink = c => c.pa === undefined && c.pb === undefined;
// Ketten des Steuerstromkreises: je Glied, ob es Anfang und Ende seiner Kette ist. Ein Glied ohne Kettenlink zählt nicht.
export function kettenEnden(d, cs){
  const glieder = (d.o || []).filter(imPfad), ids = new Set(glieder.map(o => o.id));
  const links = cs.filter(c => istKettenLink(c) && ids.has(c.a) && ids.has(c.b));
  return glieder.filter(o => links.some(c => c.a === o.id || c.b === o.id))
    .map(o => ({o, anfang: !links.some(c => c.b === o.id), ende: !links.some(c => c.a === o.id)}));
}
// Liegt zwischen y1 und y2 auf der Senkrechten x ein anderer Baustein?
export function verdeckt(d, x, y1, y2, ohne){
  return (d.o || []).some(p => {
    if (p.id === ohne) return false;
    const b = umrissVon(p);
    return b.x < x && x < b.x + b.w && b.y < y2 && y1 < b.y + b.h;
  });
}
// Automatische Leitungen: Kettenanfang oben zu L+, Kettenende unten zu M, je auf dem eigenen Blatt.
// Nur, wenn der Anschluss frei ist und die Leitung durch keinen anderen Baustein liefe. [{o, p, y}] mit Schienenhöhe y
export function autoLeitungen(d, cs){
  const r = [];
  const belegt = (o, p) => cs.some(c => (c.a === o.id && c.pa === p.n) || (c.b === o.id && c.pb === p.n));
  kettenEnden(d, cs).forEach(({o, anfang, ende}) => {
    const [oben, unten] = portsOf(o), basis = Math.floor(o.y / PH) * PH, yL = basis + 70, yM = basis + 590;
    if (anfang && !belegt(o, oben) && oben.y > yL && !verdeckt(d, oben.x, yL, oben.y, o.id)) r.push({o, p: oben, y: yL});
    if (ende && !belegt(o, unten) && unten.y < yM && !verdeckt(d, unten.x, unten.y, yM, o.id)) r.push({o, p: unten, y: yM});
  });
  return r;
}

export function autoLeitungSVG(d, cs){
  return autoLeitungen(d, cs).map(({p, y}) => `<path class="autoleitung" d="M${p.x} ${y}V${p.y}" stroke="${INK}" `
    + `stroke-width="1.6"/><circle cx="${p.x}" cy="${y}" r="2.6" fill="${INK}"/>`).join("");
}

// Blatt mit L+ und M, Pfadnummern und Pfadlinien in der Breite der Zeichnung (meta.pfadbreite)
export function stromlaufBlatt(ex, page, meta){
  const breite = breiteVon(meta);
  let s = `<path d="M40 70H975M40 590H975" stroke="${G}" stroke-width="2"/>`
    + TX(30, 74, 12, "L+", "end", "#555", 600) + TX(30, 594, 12, "M", "end", "#555", 600) + TX(975, 62, 9, "24 V DC", "end");
  for (let i = 1; i <= pfadZahl(breite); i++) {
    s += TX(pfadX(i, breite), 52, 9, String(i), "middle")
      + `<path d="M${pfadX(i, breite)} 74V586" stroke="${G2}" stroke-width=".6" stroke-dasharray="2 5"/>`;
  }
  return grid(10, "#EEF1F3", 40, 80, 975, 580) + s
    + TX(40, 682, 9, "Strompfad-Nr. oben, Kontaktspiegel unter den Spulen: links Schließer, rechts Öffner, mit Pfad");
}

/* ---------- Kennzeichen links oder rechts ---------- */
// Objekt-ID → "r", wenn das Kennzeichen rechts vom Glied steht (merkePfade füllt es vor dem Zeichnen)
export const SEITE = new Map();
const RECHTS = 18;   // Abstand des rechten Kennzeichens von der Mittellinie (hinter den Anschlussnummern)
// Bereiche [x1, x2, y1, y2]: Körper des Glieds (Betätigung links, Nummern rechts) und Kennzeichen links bzw. rechts
function bereiche(o){
  const links = art(o.k).links || 34, w = tw(o.v || "", 12), y = o.y;
  return {
    koerper: [o.x - links + 6, o.x + (art(o.k).bx || 0) + art(o.k).w - 6, y, y + 60],
    links: [o.x - links - w, o.x - links, y + 24, y + 38],
    rechts: [o.x + RECHTS, o.x + RECHTS + w, y + 24, y + 38],
  };
}
const schneidet = (a, b) => a[0] < b[1] && b[0] < a[1] && a[2] < b[3] && b[2] < a[3];
const RAHMEN = 20;   // linke Rahmenlinie: Ein Kennzeichen davor gilt als nicht frei
export function merkePfade(d){
  PFAD.breite = breiteVon(d.meta);
  SEITE.clear();
  const glieder = (d.o || []).filter(o => imPfad(o) && o.v && !o.rot && !o.flip).sort((a, b) => a.x - b.x || a.y - b.y);
  const B = new Map(glieder.map(o => [o.id, bereiche(o)])), belegt = [];
  const frei = (o, r) => r[0] >= RAHMEN && !belegt.some(q => schneidet(q, r))
    && !glieder.some(p => p !== o && schneidet(B.get(p.id).koerper, r));
  glieder.forEach(o => {
    const b = B.get(o.id), rechts = !frei(o, b.links) && frei(o, b.rechts);
    if (rechts) SEITE.set(o.id, "r");
    belegt.push(rechts ? b.rechts : b.links);
  });
}
// Kennzeichen eines Glieds an der gemerkten Seite
export const kennzeichenSVG = (o, links) => SEITE.get(o.id) === "r"
  ? LB(o.x + RECHTS, o.y + 35, o.v, "start") : LB(o.x - links, o.y + 35, o.v);

/* ---------- Breite umschalten ---------- */
// Knopf in der Werkzeugleiste: zeigt die andere Breite
export const pfadKnopf = () => {
  const breit = breiteVon(ED.data && ED.data.meta) === PFADBREITEN[1];
  return `<button type="button" class="tool" data-pfadbreite aria-pressed="${breit}" `
    + `title="Strompfade breiter, damit Kennzeichen nicht in den Nachbarpfad ragen">Breite Pfade</button>`;
};
// Neue Breite setzen; die Glieder bleiben in ihrem Pfad (Nummer gleich)
export function setzePfadbreite(d, breite){
  const alt = breiteVon(d.meta);
  (d.o || []).filter(o => gruppenId(o) === "elektro").forEach(o => { o.x = pfadX(pfadNummer(o.x, alt), breite); });
  d.meta = {...(d.meta || {})};
  if (breite === PFADBREITEN[0]) delete d.meta.pfadbreite; else d.meta.pfadbreite = breite;
  PFAD.breite = breite;
}
// Hinweis, wenn Glieder in Pfaden liegen, die es bei der neuen Breite nicht gibt; sonst null
export function pfadSperre(d, breite){
  const n = pfadZahl(breite), alt = breiteVon(d.meta);
  const hoechster = Math.max(0, ...(d.o || []).filter(o => gruppenId(o) === "elektro").map(o => pfadNummer(o.x, alt)));
  if (hoechster <= n) return null;
  return `Breite Pfade geht nicht: Pfad ${n + 1} bis ${hoechster} ist belegt. Bei breiten Pfaden passen nur ${n} Pfade `
    + `aufs Blatt. Verschieb die Glieder zuerst in die Pfade 1 bis ${n}.`;
}
// Haken klick der Vorlage: Knopf „Breite Pfade“ schaltet zwischen 46 und 60 um
export function pfadKlick(e){
  const k = e.target.closest && e.target.closest("[data-pfadbreite]");
  if (!k) return false;
  const breite = breiteVon(ED.data.meta) === PFADBREITEN[0] ? PFADBREITEN[1] : PFADBREITEN[0];
  const sperre = pfadSperre(ED.data, breite);
  if (sperre) { zeigeHinweis(sperre); return true; }
  aendere(d => { setzePfadbreite(d, breite); });
  refreshTpl();   // Pfadnummern im Vorgedruckten
  k.setAttribute("aria-pressed", String(breite === PFADBREITEN[1]));
  return true;
}
