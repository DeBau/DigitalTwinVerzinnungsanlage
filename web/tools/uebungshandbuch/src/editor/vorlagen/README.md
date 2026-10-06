# Quelltext des Übungshandbuchs

Das Übungshandbuch entsteht mit `node web/tools/uebungshandbuch/build.mjs` als eine einzige Datei
`docs/uebungshandbuch.html`, die ohne Server und ohne Internet läuft. Der Quelltext liegt in
`web/tools/uebungshandbuch/src/` und ist in ES-Module aufgeteilt. esbuild (aus `web/node_modules`, einmal
`cd web && npm ci`) bündelt sie zu einem Skript.

## Modulkarte

Die Ladereihenfolge ist die Reihenfolge der Importe in `src/main.js`. Ein Modul darf nur aus Modulen
importieren, die in `main.js` vor ihm stehen (Schichten). Der Build bricht ab, wenn das verletzt ist.

| Datei | Inhalt |
| --- | --- |
| `seite.html` | HTML-Gerüst mit den Markern `<!--@CSS-->` und `<!--@JS-->` |
| `styles/*.css` | Styles, Reihenfolge in `reihenfolge.json` |
| `main.js` | Einstieg: lädt alle Module, startet danach die Seiteneffekte über `init()` |
| **App** | |
| `app/daten.js` | Platzhalter `__SIG__`, `__SHEETS__`, `__TEXTE__`, `__QUIZ__`, `__STIL__`, Stammdaten (EXTRA, STUFEN, EXVORL, CYL, PHASES, STYLECHECK, STIL, CRIT, critOf, TYPN, gradeOf) |
| `app/basis.js` | `$`, `$$`, `BY`, Speicher `S`, `esc`, Chips, Hilfestufen, Icons `IC`, Signalliste |
| `app/fortschritt.js` | Phasen erledigt, Prüfpunkte |
| `app/start.js` | Startseite, Navigation |
| `app/skizzen-kacheln.js` | Skizzen-Kacheln einer Übung |
| `app/variablen.js` | Variablenliste |
| `app/uebung.js` | Übungsansicht mit allen Phasen, Timer, Quiz, Hilfe, `restoreInputs`, `refreshStatus` |
| `app/druck.js` | Druckansicht, `doPrint`, `sketchPage` |
| `app/seiten.js` | Vorlagen, Signale, Anlage, Richtlinien, Konzept, Bewertung |
| `app/tooltip.js` | Signal-Tooltip |
| `app/router.js` | `route()`, Migrationen der gespeicherten Daten |
| `app/ereignisse.js` | Eingaben, Klicks, Tastatur der App, Dialog „Meine Daten“ |
| **Editor** | |
| `editor/svg.js` | SVG-Grundlagen: `INK`, `MUTE`, `SVGT`, `tw`, `clamp`, `arrowHead`, Blatthöhe `PH` |
| `editor/status.js` | Zustand des Editors `ED` |
| `editor/registry.js` | Tabellen der Vorlagen, Gruppen und Bausteine, Funktionen zum Anmelden |
| `editor/vorlagen-svg.js` | Raster, Rahmen, Schriftfeld, Weg-Schritt-Linien, Striche |
| `editor/bauteile.js` | Hilfen für Bauteile mit Anschlüssen: Ventile, Zylinder, Drehen und Spiegeln, Anschlüsse, Leitungen |
| `editor/bausteine.js` | Umriss `bbox`, Aktionen, Familie `fam` |
| `editor/vorlagen/alt.js` | alle Vorlagen und Bausteine, die noch nicht in einer eigenen Datei stehen |
| `editor/zeichnen.js` | Simulation, `drawObj`, Verbindungen, `inkSVG`, `pageCount` |
| `editor/blaetter.js` | Blätter, `sketchSVG`, Schriftfeld-Daten |
| `editor/editor.js` | Editor öffnen, Paletten, Eigenschaften, Werkzeuge, Zeiger, Andocken, Beschriften, Rückgängig |
| `editor/ereignisse.js` | Listener des Editor-Dialogs |

Daten bleiben außerhalb von `src/`: `uebungen.js`, `quiz.js`, `stil.js`, `texte/Lxx.json`, `signale.csv`.

## Werkzeuge

* `node web/tools/uebungshandbuch/module.mjs imports` trägt in allen Modulen die passenden Importe ein. Rufe es
  nach jedem Verschieben oder neuen Querbezug auf.
* `node web/tools/uebungshandbuch/module.mjs check` meldet Schichtverletzungen.
* `node web/tools/uebungshandbuch/module.mjs move <Name> <von> <nach>` verschiebt eine Deklaration samt Kommentar.
* `waechter.mjs` läuft bei jedem Build. Er prüft, dass jeder Bezeichner deklariert, importiert oder ein
  Browser-Global ist. esbuild meldet einen vergessenen Import nicht, er fiele sonst erst im Browser auf.
* `pruefen/pruefen.mjs` vergleicht zwei Builds (DOM und Bilder). Für einen Umbau ohne Verhaltensänderung:
  vorher `docs/uebungshandbuch.html` nach `docs/uebungshandbuch.ref.html` kopieren, umbauen, bauen, dann
  `node web/tools/uebungshandbuch/pruefen/pruefen.mjs`. Erwartet sind 0 Abweichungen.

## Registry: der Vertrag einer Vorlage

Eine Vorlage meldet sich beim Laden an. Der Kern liest nur die Tabellen aus `editor/registry.js`.

```js
import { registriereVorlage, registriereGruppe, fuelle, BLK, PC, PORTS2, SAMPLE, PROPS, LABEL_HINT } from '../registry.js';

registriereVorlage("regelkreis", {
  n: "Regelkreis",                        // Name der Kachel
  d: "Blockschaltbild Regler, Stellglied, Strecke, Messglied",
  gruppen: ["regel"],                     // Bausteingruppen der Palette
  schienen: [["L+", 70, 40, 935]],        // optional: virtuelle Schienen [Name, y, x, Breite]
  einblattig: false,                      // true: Formular mit genau einem Blatt
  body: (ex, page, meta) => "<g>…</g>",   // vorgedruckter Inhalt eines Blatts als SVG-Text
});
registriereGruppe("regel", {name: "Regelkreis", hinweis: "Blöcke und Summierstelle setzen …"});
fuelle(BLK, {box: {n: "Block", g: "regel"}, sum: {n: "Summierstelle", g: "regel"}});
fuelle(SAMPLE, {box: [{k: "box", x: 2, y: 2, v: "Regler"}, "0 0 114 54"]});
```

| Tabelle | Schlüssel | Inhalt |
| --- | --- | --- |
| `VORL` | Vorlage | `{n, d}`, Reihenfolge = Kacheln |
| `TPL` | Vorlage | `body(ex, page, meta)` |
| `PAL`, `VRAIL`, `FIXED` | Vorlage | Gruppen, Schienen, einblättig |
| `GN`, `HINT` | Gruppe | Überschrift und Bedienhinweis in der Palette |
| `BLK` | Bausteinart | `{n, g, mk, hide}`, Reihenfolge = Palette |
| `PC` | Bauteil mit Anschlüssen | `{g, n, w, h, bx, ports, draw, def, lbl, props, info, sim}` |
| `PORTS2` | einfacher Baustein | Anschlüsse `[[Name, dx, dy, Richtung]]` |
| `SAMPLE` | Bausteinart | `[Musterobjekt, viewBox, Zusatz-SVG]` für das Palettenbild |
| `PROPS` | Bausteinart | Eigenschaftsfelder |
| `LABEL_HINT` | Bausteinart | Hinweis beim Beschriften |

Wichtig: Die Reihenfolge der Einträge in `VORL` und `BLK` ist sichtbar (Kacheln, Palette). Bauteile aus `PC`
trägt `alt.js` nach `BLK` ein, die Ventil-Varianten (`PCPAL`) direkt vor `zyl2`.

## Eine Vorlage aus alt.js herauslösen

Ziel: Alles, was zu einer Vorlage gehört, steht in `editor/vorlagen/<key>.js`. Gehe in kleinen Schritten vor
und prüfe nach jedem Schritt mit `pruefen.mjs`.

1. Referenz sichern: bauen, dann `docs/uebungshandbuch.html` nach `docs/uebungshandbuch.ref.html` kopieren.
2. Lege `editor/vorlagen/<key>.js` an und importiere sie in `main.js` direkt hinter `editor/vorlagen/alt.js`.
   Muss die Vorlage vor anderen Vorlagen stehen (Reihenfolge der Kacheln), setze sie vor `alt.js`.
3. Verschiebe aus `alt.js` den Aufruf `registriereVorlage("<key>", …)` und den Zweig `case "<key>"` aus
   `tplBody` als eigene Funktion `body`. Verschiebe die Gruppe (`registriereGruppe`) und die Einträge der
   Gruppe aus `fuelle(BLK, …)`, `fuelle(PC, …)`, `fuelle(SAMPLE, …)`, `fuelle(PROPS, …)`, `fuelle(LABEL_HINT, …)`
   als eigene `fuelle`-Aufrufe.
4. Achte auf die Reihenfolge: Steht die Datei hinter `alt.js`, landen ihre Bausteine in der Palette hinter den
   übrigen. Ist das eine sichtbare Änderung, melde die Einträge in derselben Reihenfolge an wie vorher oder
   lass die Gruppe bewusst wandern und sag es im Commit.
5. Sonderfälle des Kerns: Viele Stellen in `zeichnen.js`, `bausteine.js` und `editor.js` fragen noch
   `o.k === …`, `fam(o) === …` oder `ED.key === …` ab. Zieh solche Zweige erst dann in die Vorlage, wenn es
   dafür einen Haken in der Registry gibt (z. B. `zeichne`, `umriss`, `verbinde`). Einen neuen Haken legst du
   in `registry.js` an und rufst ihn im Kern auf. Sprich neue Haken mit den anderen Vorlagen ab, damit alle
   denselben Vertrag nutzen.
6. `node web/tools/uebungshandbuch/module.mjs imports`, bauen, `pruefen.mjs`: 0 Abweichungen.
