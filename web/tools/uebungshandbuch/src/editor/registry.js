// Registry der Skizzenvorlagen, Bausteingruppen, Bausteine und Stricharten.
// Der Editor-Kern und die App lesen nur diese Tabellen. Befüllt werden sie beim Laden von src/editor/vorlagen/*.js.
// Die Vorlagen laden nach dem Kern (siehe main.js), der Kern liest die Tabellen also erst zur Laufzeit.
// Der Vertrag mit allen Haken steht in vorlagen/README.md.
// Die Reihenfolge der Einträge zählt: VORL ergibt die Reihenfolge der Kacheln, BLK die Reihenfolge in der Palette.

/* ---------- Vorlagen ---------- */
export const VORL = {};       // Vorlage → ganze Anmeldung {n, d, gruppen, schienen, einblattig, body, …, Haken}

/* ---------- Bausteingruppen ---------- */
export const GRUPPE = {};     // Gruppe → ganze Anmeldung {name, hinweis, kette, verbinde, andocke, mitziehen, loeschen,
                              //   kennzeichen, nachSetzen, vorVerbinden, …}; Signaturen in vorlagen/README.md

// Eintrag einer Vorlage; {} für einen unbekannten Schlüssel, damit Haken ohne weitere Prüfung abfragbar sind
export const vorlage = key => VORL[key] || {};

/* ---------- Bausteine ---------- */
export const BLK = {};        // Bausteinart oder Palettenvariante → {n, g, mk, hide, Haken}
export const PC = {};         // Bauteil mit Anschlüssen → {g, n, w, h, bx, ports, draw, def, lbl, props, info, Haken}
export const PORTS2 = {};     // einfache Steuerstrom-Bausteine → Anschlüsse [[Name, dx, dy, Richtung], …]
export const SAMPLE = {};     // Bausteinart → [Musterobjekt, viewBox, Zusatz-SVG] für das Palettenbild
export const PROPS = {};      // Bausteinart → Eigenschaftsfelder [[Feld, Beschriftung, Platzhalter], …]
export const LABEL_HINT = {}; // Bausteinart → Hinweis beim Beschriften

/* ---------- Striche ---------- */
export const STRICH = {};     // Strichart (st.k) → Haken {form, zeichne, titel, felder, griffe, oben, ziehen}
export const STRICHFELD = {sc: "c", sw: "w"};   // Feld im Eigenschaftsbereich → Eigenschaft des markierten Strichs

// Haken einer Bausteinart: Bauteile stehen in PC, einfache Bausteine in BLK
export const art = k => PC[k] || BLK[k] || {};

// Eine Vorlage anmelden. Felder: n, d, gruppen, schienen, einblattig, body(ex, page, meta) und die Haken der Vorlage
export function registriereVorlage(key, v) {
  VORL[key] = v;
}

// Eine Bausteingruppe anmelden. Felder: name, hinweis und die Haken der Gruppe
export function registriereGruppe(id, g) {
  GRUPPE[id] = g;
}

// Bauteile mit Anschlüssen anmelden: Eintrag in PC und, falls noch keiner da ist, ein Paletteneintrag in BLK
export function registriereBauteile(eintraege) {
  for (const [k, pc] of Object.entries(eintraege)) {
    PC[k] = pc;
    if (!BLK[k]) BLK[k] = {g: pc.g, n: pc.n, hide: pc.hide};
  }
}

// Einträge in eine der Tabellen übernehmen (BLK, PORTS2, SAMPLE, PROPS, LABEL_HINT, STRICH, STRICHFELD)
export const fuelle = (tabelle, eintraege) => Object.assign(tabelle, eintraege);
