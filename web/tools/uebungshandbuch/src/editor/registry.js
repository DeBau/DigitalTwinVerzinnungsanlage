// Registry der Skizzenvorlagen, Bausteingruppen, Bausteine und Stricharten.
// Der Editor-Kern und die App lesen nur diese Tabellen. Befüllt werden sie beim Laden von src/editor/vorlagen/*.js.
// Die Vorlagen laden nach dem Kern (siehe main.js), der Kern liest die Tabellen also erst zur Laufzeit.
// Der Vertrag mit allen Haken steht in src/README.md.
// Die Reihenfolge der Einträge zählt: VORL ergibt die Reihenfolge der Kacheln, BAUSTEIN die Reihenfolge in der Palette.
// Es gibt ein Bausteinmodell: Bauteile mit Anschlüssen (registriereBauteile) sind Einträge in BAUSTEIN mit bauteil: true
// und den Maßen w, h. Der Kern dreht und spiegelt sie und leitet ihr Kennzeichenfeld ab.

/* ---------- Vorlagen ---------- */
export const VORL = {};       // Vorlage → ganze Anmeldung {n, d, gruppen, schienen, einblattig, body, …, Haken}
                              //   Haken eingabe(e) → true: input-Ereignis eines eigenen Felds (editor/ereignisse.js)

/* ---------- Bausteingruppen ---------- */
export const GRUPPE = {};     // Gruppe → ganze Anmeldung {name, hinweis, kette, verbinde, andocke, mitziehen, loeschen,
                              //   kennzeichen, nachSetzen, vorVerbinden, mehrpolig, …}; Signaturen in src/README.md

// Eintrag einer Vorlage; {} für einen unbekannten Schlüssel, damit Haken ohne weitere Prüfung abfragbar sind
export const vorlage = key => VORL[key] || {};

/* ---------- Bausteine ---------- */
// Bausteinart oder Palettenvariante → {n, g, mk, hide, zeichne, anschluesse, feldliste, beschriftung, …, Haken};
// anschlussName(o, n) → angezeigter Name des gespeicherten Anschlusses n (wireRef in zeichnen.js), z. B. "PE2" → "PE";
// Bauteile zusätzlich {bauteil: true, w, h, bx, def, lbl, info}
// Haken der Pneumatik-Simulation (Aufrufer in vorlagen/pneumatik-simulation.js):
//   sim(o, stellung, hatDruck, belegt) → {src, pairs, dir, ablass}: Druckquellen, offene Wege, Richtung, Anschlüsse offen
//     zur Atmosphäre; hatDruck(p) sagt, ob Anschluss p Druck hat, belegt(p), ob p verdrahtet ist (simTeile, simCompute)
//   drossel(o) → {frei, f}: Anschluss, zu dem die Luft ungedrosselt strömt (null: beide Richtungen gedrosselt), Faktor 0 bis 1
//     (drosselFaktor); ohne Haken keine Drossel
export const BAUSTEIN = {};
export const SAMPLE = {};     // Bausteinart → [Musterobjekt, viewBox, Zusatz-SVG] für das Palettenbild

/* ---------- Striche ---------- */
export const STRICH = {};     // Strichart (st.k) → Haken {form, zeichne, titel, felder, griffe, oben, ziehen}
export const STRICHFELD = {sc: "c", sw: "w"};   // Feld im Eigenschaftsbereich → Eigenschaft des markierten Strichs

// Eintrag einer Bausteinart ({} wenn unbekannt) bzw. eines Bauteils (null, wenn k kein Bauteil ist)
export const art = k => BAUSTEIN[k] || {};
export const bauteil = k => BAUSTEIN[k] && BAUSTEIN[k].bauteil ? BAUSTEIN[k] : null;

// Eine Vorlage anmelden. Felder: n, d, gruppen, schienen, einblattig, body(ex, page, meta) und die Haken der Vorlage
export function registriereVorlage(key, v) {
  VORL[key] = v;
}

// Eine Bausteingruppe anmelden. Felder: name, hinweis und die Haken der Gruppe
export function registriereGruppe(id, g) {
  GRUPPE[id] = g;
}

// Bauteile mit Anschlüssen anmelden. Das Kennzeichen (Vorschlag lbl) ist immer ihr erstes Eigenschaftsfeld.
export function registriereBauteile(eintraege) {
  for (const [k, b] of Object.entries(eintraege)) {
    BAUSTEIN[k] = {...b, bauteil: true, feldliste: [["v", "Kennzeichen", b.lbl], ...(b.feldliste || [])]};
  }
}

// Einträge in eine der Tabellen übernehmen (BAUSTEIN, SAMPLE, STRICH, STRICHFELD)
export const fuelle = (tabelle, eintraege) => Object.assign(tabelle, eintraege);
