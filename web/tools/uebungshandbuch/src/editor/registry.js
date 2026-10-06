// Registry der Skizzenvorlagen, Bausteingruppen und Bausteine.
// Der Editor-Kern und die App lesen nur diese Tabellen. Befüllt werden sie beim Laden von src/editor/vorlagen/*.js,
// zurzeit noch gesammelt in vorlagen/alt.js. Der Vertrag steht in vorlagen/README.md.
// Die Reihenfolge der Einträge zählt: VORL ergibt die Reihenfolge der Kacheln, BLK die Reihenfolge in der Palette.

/* ---------- Vorlagen ---------- */
export const VORL = {};       // Vorlage → {n: Name, d: Kurzbeschreibung}
export const TPL = {};        // Vorlage → body(ex, page, meta): vorgedruckter Inhalt eines Blatts als SVG-Text
export const PAL = {};        // Vorlage → Bausteingruppen der Palette, z. B. ["elektro", "geraete", "leistung"]
export const VRAIL = {};      // Vorlage → virtuelle Schienen [[Name, y, x, Breite], …] auf jedem Blatt
export const FIXED = {};      // Vorlage → true: Formular mit genau einem Blatt (wächst nicht nach unten)

/* ---------- Bausteingruppen ---------- */
export const GN = {};         // Gruppe → Überschrift in der Palette
export const HINT = {};       // Gruppe → Bedienhinweis unter der Palette

/* ---------- Bausteine ---------- */
export const BLK = {};        // Bausteinart → {n, g, mk, hide}: Name, Gruppe, Voreinstellung, in der Palette verborgen
export const PC = {};         // Bauteil mit Anschlüssen → {g, n, w, h, bx, ports, draw, def, lbl, props, info, …}
export const PORTS2 = {};     // einfache Steuerstrom-Bausteine → Anschlüsse [[Name, dx, dy, Richtung], …]
export const SAMPLE = {};     // Bausteinart → [Musterobjekt, viewBox, Zusatz-SVG] für das Palettenbild
export const PROPS = {};      // Bausteinart → Eigenschaftsfelder [[Feld, Beschriftung, …], …]
export const LABEL_HINT = {}; // Bausteinart → Hinweis beim Beschriften

// Eine Vorlage anmelden. Felder: n, d, gruppen, schienen, einblattig, body(ex, page, meta)
export function registriereVorlage(key, v) {
  VORL[key] = {n: v.n, d: v.d};
  if (v.body) TPL[key] = v.body;
  if (v.gruppen) PAL[key] = v.gruppen;
  if (v.schienen) VRAIL[key] = v.schienen;
  if (v.einblattig) FIXED[key] = true;
}

// Eine Bausteingruppe anmelden. Felder: name, hinweis
export function registriereGruppe(id, g) {
  if (g.name !== undefined) GN[id] = g.name;
  if (g.hinweis !== undefined) HINT[id] = g.hinweis;
}

// Einträge in eine der Bausteintabellen übernehmen (BLK, PC, PORTS2, SAMPLE, PROPS, LABEL_HINT)
export const fuelle = (tabelle, eintraege) => Object.assign(tabelle, eintraege);
