// Editor-Kern: Zustand des geöffneten Editors ED. Es gibt genau einen Editor, deshalb ein einziges Objekt.
// Jedes Feld steht hier mit seiner Bedeutung. Felder, die nur eine Vorlage braucht, liegen in ED.vorlage.
// Gespeichert wird davon nur ED.data (verlauf.js, saveSketch). Die übrigen Felder gelten, solange der Editor offen ist.

export const ED = {
  scope: null,         // Übung (z. B. "L08") oder "frei": Bereich, zu dem die Zeichnung gehört
  key: null,           // Vorlage (Schlüssel in VORL), z. B. "grafcet"
  data: null,          // Zeichnung {s, t, o, c, meta, ts}; Datenmodell in src/README.md
  svg: null,           // <svg> des Blatts, null wenn der Editor zu ist
  blattzahl: 1,        // Zahl der Blätter, die das Blatt gerade zeigt (anzeige.js, checkPages)
  zusatzY: 0,          // beim Ziehen: y des Zeigers, damit die Zeichnung über den Blattrand wachsen kann
  tool: "pen",         // Werkzeug: sel, conn, place, pen, line, rect, text, erase oder eines der Vorlage
  color: "#17212B",    // Farbe für Stift, Linie, Kasten und Text
  w: 2.2,              // Strichstärke
  grid: true,          // Knopf „Raster fangen“
  dock: true,          // Knopf „Andocken“
  place: null,         // Palettenart, die das Werkzeug place beim Klick setzt
  ausPalette: false,   // true, solange ein Baustein aus der Palette aufs Blatt gezogen wird
  klickAuslassen: false,   // true direkt nach dem Ziehen aus der Palette: der folgende Klick zählt nicht
  sel: null,           // markierter Baustein (ID)
  selC: null,          // markierte Verbindung (Index in data.c)
  selS: null,          // markierter Strich (Index in data.s)
  selT: null,          // markierter Text (Index in data.t)
  selF: false,         // Schriftfeld markiert
  letzterKlick: null,  // {id, t} des letzten Klicks, für den Doppelklick (zeiger.js)
  drag: null,          // laufendes Ziehen {kind, i, id, sx, sy, ox, oy, moved, …} (zeiger.js)
  strich: null,        // Strich, der gerade aufgezogen wird {k, c, w, p}
  strichPfad: null,    // Vorschaupfad dieses Strichs im SVG
  radiert: false,      // true, solange der Radierer gedrückt ist
  verbindenVon: null,  // Werkzeug Verbinden: erster angeklickter Baustein {id, anschluss}
  hist: [],            // Rückgängig: frühere Stände als JSON (verlauf.js)
  zukunft: [],         // Wiederholen: zurückgenommene Stände als JSON
  tx: null,            // offene Transaktion {schluessel, vorher} (verlauf.js, beginne und schliesse)
  sim: {on: false, st: {}, pos: {}},   // Pneumatik-Simulation: läuft, Ventilstellungen, Zylinderlagen, Druck P
  vorlage: {},         // Zustand der Vorlage, beim Öffnen geleert. Der Kern kennt nur vorlage.angefangen:
                       //   eine angefangene Eingabe, die Esc und jeder Werkzeugwechsel verwerfen
};
