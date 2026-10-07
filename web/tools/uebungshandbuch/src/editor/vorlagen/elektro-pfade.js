// Strompfade des Stromlaufplans: Raster der Pfade (Breite 46 oder 60, umschaltbar), Pfadnummer, und wohin das
// Kennzeichen eines Glieds ausweicht, wenn links der Nachbarpfad im Weg ist.
// Die Breite steht in der Zeichnung unter meta.pfadbreite (nur gesetzt, wenn sie nicht 46 ist).
import { tw } from '../svg.js';
import { ED } from '../status.js';
import { art, bauteil } from '../registry.js';
import { LB } from '../bauteile.js';
import { gruppenId } from '../bausteine.js';
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
export function merkePfade(d){
  PFAD.breite = breiteVon(d.meta);
  SEITE.clear();
  const glieder = (d.o || []).filter(o => imPfad(o) && o.v && !o.rot && !o.flip).sort((a, b) => a.x - b.x || a.y - b.y);
  const B = new Map(glieder.map(o => [o.id, bereiche(o)])), belegt = [];
  const frei = (o, r) => !belegt.some(q => schneidet(q, r)) && !glieder.some(p => p !== o && schneidet(B.get(p.id).koerper, r));
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
// Haken klick der Vorlage: Knopf „Breite Pfade“ schaltet zwischen 46 und 60 um
export function pfadKlick(e){
  const k = e.target.closest && e.target.closest("[data-pfadbreite]");
  if (!k) return false;
  const breite = breiteVon(ED.data.meta) === PFADBREITEN[0] ? PFADBREITEN[1] : PFADBREITEN[0];
  aendere(d => { setzePfadbreite(d, breite); });
  refreshTpl();   // Pfadnummern im Vorgedruckten
  k.setAttribute("aria-pressed", String(breite === PFADBREITEN[1]));
  return true;
}
