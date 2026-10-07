# Quelltext des Übungshandbuchs: App und Skizzen-Editor

Das Übungshandbuch entsteht mit `node web/tools/uebungshandbuch/build.mjs` als eine einzige Datei
`docs/uebungshandbuch.html`, die ohne Server und ohne Internet läuft. Der Quelltext liegt in
`web/tools/uebungshandbuch/src/` und ist in ES-Module aufgeteilt. esbuild (aus `web/node_modules`, einmal
`cd web && npm ci`) bündelt sie zu einem Skript.

Die App (`app/`) zeigt Übungen, Seiten und Druck. Der Skizzen-Editor (`editor/`) zeichnet GRAFCET, Stromlaufpläne,
Pneumatik und die anderen Skizzen. Die App benutzt vom Editor nur `VORL`, `openEditor`, `sketchSVG`, `skMeta`,
`skKey` und `pageCount`.

## Inhalt

1. Modulkarte
2. Werkzeuge
3. Datenmodell der Zeichnung und Speicherschlüssel
4. Koordinaten
5. Zustand des Editors (ED) und Markierung
6. Änderungen und Neuzeichnen
7. data-Attribute für Treffer
8. Registry: der Vertrag mit den Vorlagen
9. Anleitungen: neue Bausteinart, neue Vorlage
10. Glossar der Kurznamen
11. Offene Sonderfälle
12. Welle 1: wer ändert was, Namen aus Paket V

## 1. Modulkarte

Die Ladereihenfolge ist die Reihenfolge der Importe in `src/main.js`. Ein Modul darf nur aus Modulen
importieren, die in `main.js` vor ihm stehen (Schichten). Der Build bricht ab, wenn das verletzt ist.

Die Schichten von unten nach oben: App-Grundlagen, Editor-Kern (Zeichnen), App-Seiten, Editor-Kern (Bedienung),
Druck und Seiten, zuletzt die Vorlagen. Die Vorlagen laden nach dem ganzen Kern. Sie melden sich beim Laden nur in
der Registry an und dürfen dafür alles aus dem Kern benutzen. Der Kern liest die Registry erst zur Laufzeit und
importiert nie aus einer Vorlage.

| Datei | Inhalt |
| --- | --- |
| `seite.html` | HTML-Gerüst mit den Markern `<!--@CSS-->` und `<!--@JS-->` |
| `styles/*.css` | Styles, Reihenfolge in `reihenfolge.json` |
| `main.js` | Einstieg: lädt alle Module, startet danach die Seiteneffekte über `init()` |
| **App-Grundlagen** | |
| `app/daten.js` | Platzhalter `__SIG__`, `__SHEETS__`, `__TEXTE__`, `__QUIZ__`, `__STIL__`, Stammdaten (EXTRA, STUFEN, EXVORL, CYL, PHASES, STYLECHECK, STIL, CRIT, critOf, TYPN, gradeOf) |
| `app/basis.js` | `$`, `$$`, `BY`, Speicher `S`, `esc`, Chips, Hilfestufen, Icons `IC`, Signalliste |
| `app/fortschritt.js` | Phasen erledigt, Prüfpunkte |
| **Editor-Kern: Zeichnen** | |
| `editor/svg.js` | SVG-Grundlagen: `INK`, `MUTE`, `SCHRIFT`, `SVGT`, `tw`, `clamp`, `arrowHead`, Blatthöhe `PH` |
| `editor/status.js` | Zustand `ED` (ein Feld je Zeile), Markierung `markiere`, `istMarkiert`, `markiertId` |
| `editor/registry.js` | Tabellen `VORL`, `GRUPPE`, `BAUSTEIN`, `SAMPLE`, `STRICH`, `STRICHFELD`, Lesefunktionen `vorlage`, `art`, `bauteil`, Anmelden |
| `editor/spuren.js` | Spurbelegung `neueSpuren(raster)` mit `belege` und `knick`, `pfadD` |
| `editor/vorlagen-svg.js` | Raster, Punkte, Rahmen, Schriftfeld, `snap`, Stricharten `l` und `r`, Striche und Texte (`shapeD`, `strokesSVG`) |
| `editor/bauteile.js` | Bauteile mit Anschlüssen: Strichstile, `drehung`, `portsOf`, `versetzt`, `virtuelleSchienen`, Leitungen, `simOn`, `pressed` |
| `editor/bausteine.js` | Geometrie: `umrissVon`, `mitteVon`, `kettenAus`, `kettenEin`, `gruppenId`, `gruppeVon`, `rund`, `setzeBreite`, `LINIE`, `platzhalter` |
| `editor/auswahl.js` | `objById`, `uid`, `anySel`, `clearSel`, Tabellen `MARKIERUNG` und `TREFFER`, `trefferBei`, `markiertesElement`, `markiertesObjekt` |
| `editor/kette.js` | Ablaufkette: senkrechte Verbindung, Kettenvorgänger, Ausrichten, Andocken, Seitenbausteine |
| `editor/zeichnen.js` | `bausteinZeichnen`, `verbindungsWeg`, `zeichnungSVG` mit Leitungen, Verbindungen, Bausteinen und Punkten, `abzweigpunkte`, `pageCount`, `wireRef` |
| `editor/blaetter.js` | Blätter, `sketchSVG`, Schriftfeld-Daten `skMeta`, Speicherschlüssel `skKey` |
| **App-Seiten** | `app/start.js`, `app/skizzen-kacheln.js`, `app/variablen.js`, `app/uebung.js` |
| **Editor-Kern: Bedienung** | |
| `editor/signalfeld.js` | Kennzeichenfeld mit Vorschlagsliste: `signalFeld`, `signalVorschlaege`, `normKennzeichen` |
| `editor/eigenschaften.js` | Eigenschaftsfeld links (`propsHTML`, `updateProps`, `FELDER_JE_ART`), Feldbausteine `textFeld`, `auswahlFeld`, `listenFeld`, `HINWEIS`, `propsKasten`, `FARBEN`, `STAERKEN`, `loeschKnopf` |
| `editor/anzeige.js` | Blatt und Zeichnung neu zeichnen (`renderInk`, `refreshTpl`), Blattzahl, Größe |
| `editor/pruefung.js` | Knopf „Prüfen“: `pruefeSkizze`, `zeigeBefunde`, `befundeWeg`, `waehleBefund` |
| `editor/verlauf.js` | `aendere`, `beginne`, `schliesse`, `undo`, `redo`, `snapshot` (Übergang), `saveSketch`, `mitListen`, Kopie aus einer früheren Übung |
| `editor/beschriften.js` | Beschriftungsfeld auf dem Blatt (`editLabel`, `editObjLabel`, `editConnLabel`, `editTextItem`) |
| `editor/werkzeuge.js` | `setTool`, `blattPunkt`, Punkt fangen `fangen`, `BLATTKLASSEN` |
| `editor/bearbeiten.js` | Eigenschaft übernehmen `applyProp` (`FELDNAME`), Drehen, Löschen (`ENTFERNE`), Radieren |
| `editor/andocken.js` | Bausteine erzeugen `makeObj` und setzen `placeObj`, Hilfslinien, Andock-Vorschau, Verbinden |
| `editor/zeiger.js` | Zeigerereignisse `zeigerUnten` (Tabelle `UNTEN`), `zeigerBewegen`, `zeigerLoslassen`, Auswählen (`AUSWAHL`), `beginneStrich` |
| `editor/oeffnen.js` | `openEditor`: `zuruecksetzen`, `werkzeugleisteHTML`, `seitenleisteHTML`, Palette, `paintEditor` |
| **Druck und Seiten** | `app/druck.js`, `app/seiten.js` |
| **Vorlagen** (Reihenfolge = Kacheln) | |
| `editor/vorlagen/grafcet-aktion.js` | GRAFCET: Bausteinarten (`isStep`, `isTrans`, `isAct`), Aktionen zeichnen, Eigenschaftsfeld, Haken `seite` |
| `editor/vorlagen/grafcet-kette.js` | GRAFCET: Regeln der Ablaufkette (Haken `nachSetzen`, `vorVerbinden`, `mitziehen`, `loeschen`), Einfügen, Ausrichten, Neu nummerieren |
| `editor/vorlagen/grafcet-schnipsel.js` | GRAFCET: Verzweigungs-Schnipsel ODER und UND mit 2 Zweigen, `linienBreiteAnpassen` |
| `editor/vorlagen/grafcet-knoepfe.js` | GRAFCET: Knöpfe „+ Schritt“, „Kette ausrichten“, „Neu nummerieren“ (`data-gc`, Haken `klick`), `kettenFolge` |
| `editor/vorlagen/grafcet-pruefen.js` | GRAFCET: Regeln für „Prüfen“ (`GRAFCET_REGELN`, Haken `pruefe`) |
| `editor/vorlagen/grafcet.js` | GRAFCET: Schritte, Transitionen, Verzweigungen, Verweise, Aktionen als Seitenbausteine |
| `editor/vorlagen/zustand.js` | Zustandsdiagramm: Zustände, Übergänge als gebogene Pfeile |
| `editor/vorlagen/wegschritt-striche.js` | Weg-Schritt-Diagramm: Raster `WS_RASTER`, Stricharten Signallinie, Start, Zyklusende, Verknüpfung |
| `editor/vorlagen/wegschritt.js` | Weg-Schritt-Diagramm: Formular, Seitenleiste, Werkzeuge |
| `editor/vorlagen/elektro.js` | Stromlaufplan mit den Gruppen Steuerstromkreis (`elektro`) und Geräte/SPS (`geraete`) |
| `editor/vorlagen/leistung.js` | Hauptstromkreis mit Potenzialschiene |
| `editor/vorlagen/pneumatik-symbole.js` | Ventile, Zylinder, Entlüftungen nach ISO 1219 |
| `editor/vorlagen/pneumatik-simulation.js` | Druckverteilung, Zylinderbewegung, Ventile schalten |
| `editor/vorlagen/pneumatik.js` | Pneumatikschaltplan: Vorlage, Gruppe, Bauteile, Ventil-Varianten |
| `editor/vorlagen/regelkreis.js` | Regelkreis: Block, Summierstelle |
| `editor/vorlagen/trend.js` | Trendaufzeichnung (nur Formular) |
| `editor/vorlagen/raster.js` | Kästchenraster mit allen Gruppen |
| **Seiteneffekte** | `app/tooltip.js`, `app/router.js`, `app/ereignisse.js`, `editor/ereignisse.js` (Listener des Editor-Dialogs, `AKTIONEN`, `VERSCHIEBE`) |

Daten bleiben außerhalb von `src/`: `uebungen.js`, `quiz.js`, `stil.js`, `texte/Lxx.json`, `signale.csv`.

## 2. Werkzeuge

* `node web/tools/uebungshandbuch/module.mjs imports` trägt in allen Modulen die passenden Importe ein. Rufe es
  nach jedem Verschieben oder neuen Querbezug auf.
* `node web/tools/uebungshandbuch/module.mjs check` meldet Schichtverletzungen.
* `node web/tools/uebungshandbuch/module.mjs move <Name> <von> <nach>` verschiebt eine Deklaration samt Kommentar.
* `waechter.mjs` läuft bei jedem Build. Er prüft, dass jeder Bezeichner deklariert, importiert oder ein
  Browser-Global ist. esbuild meldet einen vergessenen Import nicht, er fiele sonst erst im Browser auf.
* `pruefen/pruefen.mjs` vergleicht zwei Builds (DOM und Bilder). Für einen Umbau ohne Verhaltensänderung:
  vorher `docs/uebungshandbuch.html` nach `docs/uebungshandbuch.ref.html` kopieren, umbauen, bauen, dann
  `node web/tools/uebungshandbuch/pruefen/pruefen.mjs`. Erwartet sind 0 Abweichungen. Baue nicht neu, solange
  `pruefen.mjs` läuft: Es lädt `docs/uebungshandbuch.html` für jedes Szenario neu.
* `pruefen/tests/lauf.mjs [paket …] [--nur text] [--bauen]` führt die Abnahmetests aus (`pruefen/tests/<paket>.mjs`,
  Treiber in `treiber.mjs`, Startdaten in `tests/daten/`). Im Bündel gibt es kein globales `ED`: Tests lesen den Zustand
  aus dem DOM und aus `localStorage["uebh2:<scope>:sk:<key>"]`.
* `pruefen/beispiele/*.json` sind feste Beispielzeichnungen. `pruefen/beispiele-erzeugen.mjs` läuft nur gegen
  einen Build mit globalen Namen (bis Commit 640c36d), siehe Kopfkommentar dort.

Achtung bei `module.mjs imports`: Das Werkzeug kennt keine lokalen Gültigkeitsbereiche. Heißt eine lokale
Variable oder ein Parameter so wie ein exportierter Name eines anderen Moduls, trägt es einen falschen Import ein
(der Build meldet dann womöglich eine Schichtverletzung). Gib lokalen Namen deshalb Namen, die nirgends exportiert
sind. Beispiele, die schon einmal gestört haben: `art`, `rund`, `gruppe`, `init`, `titel`.

## 3. Datenmodell der Zeichnung und Speicherschlüssel

Eine Zeichnung ist ein JSON-Objekt `{s, t, o, c, meta, ts}`:

| Feld | Inhalt |
| --- | --- |
| `o` | Bausteine `{id, k, x, y, v, …}`: `id` eindeutig (`uid()`), `k` Bausteinart (Schlüssel in `BAUSTEIN`), `x`, `y` Lage, `v` Kennzeichen oder Text. Bauteile zusätzlich `rot` (0, 90, 180, 270) und `flip`. Weitere Felder je Art, z. B. `w` (Breite einer Verzweigung oder Schiene), `t`, `q`, `b` (GRAFCET-Aktion), `gs`, `al`, `ar` (Ventile) |
| `c` | Verbindungen `{a, b, v}` von Baustein `a` nach `b`. Mit `pa` und `pb` ist es eine Leitung zwischen den Anschlüssen `pa` von a und `pb` von b, `st: "st"` macht sie zur gestrichelten Steuerleitung. Ohne `pa`/`pb` ist es ein Pfeil (Kette, Übergang, Signalfluss) mit Beschriftung `v` |
| `s` | Striche `{k, c, w, p}`: `k` Strichart (`l` Linie, `r` Kasten, eine Strichart aus `STRICH` oder leer für Freihand), `c` Farbe, `w` Stärke, `p` Punkte `[[x, y], …]`. Stricharten haben eigene Felder, z. B. `lbl` (Signallinie) |
| `t` | Texte `{x, y, v, c, s}`: Lage, Text, Farbe, Schriftgröße |
| `meta` | Schriftfeld `{title, name, datum, rows}`, nur gesetzte Einträge. `rows` sind die Zeilennamen im Weg-Schritt-Diagramm |
| `ts` | Zeitpunkt der letzten Speicherung (ms) |

Die Zeichnung liegt im localStorage unter `uebh2:<scope>:sk:<key>`: `scope` ist die Übung (`L08`) oder `frei`,
`key` die Vorlage (`grafcet`). `skKey(scope, key)` ergibt `<scope>:sk:<key>`, den Vorsatz `uebh2:` setzt der
Speicher `S` (app/basis.js). `saveSketch` löscht den Eintrag, wenn die Zeichnung leer ist.

Die Feldnamen der Zeichnung (`o.k`, `c.pa`, `st.p` …) stehen in gespeicherten Zeichnungen der Nutzer. Benenne sie
nie um, sonst lassen sich alte Zeichnungen nicht mehr öffnen. Alte Werte bleiben lesbar, z. B. die Bausteinart
`actionq` (heute `action` mit `t: "q"`).

## 4. Koordinaten

Ein Blatt ist 1000 breit und `PH` = 707 hoch (Zeichnungseinheiten, entspricht A4 quer). Blatt n beginnt bei
`y = (n - 1) * PH`, die Zeichnung wächst nach unten um weitere Blätter (`pageCount`), außer bei Vorlagen mit
`einblattig: true`. Rahmen: x 15 bis 985, y 15 bis 692. Das Schriftfeld liegt unten rechts (x 555 bis 985,
y 632 bis 692). `avoidBreak` schiebt Bausteine aus dem Bereich um das Blattende.

Mit „Raster fangen“ rastet alles im 10er-Raster (`snap`, `fangen`). Eine Vorlage kann eigene Fangpunkte haben
(Haken `fangPunkt`, z. B. das Weg-Schritt-Diagramm mit `WS_RASTER`). `blattPunkt(svg, e)` rechnet einen
Zeigerpunkt in Blattkoordinaten um.

## 5. Zustand des Editors (ED) und Markierung

`ED` (status.js) ist der Zustand des einen offenen Editors. Jedes Feld steht dort mit Kommentar. Gespeichert wird
nur `ED.data`.

| Feld | Bedeutung | Besitzer |
| --- | --- | --- |
| `scope`, `key`, `data` | Übung, Vorlage, Zeichnung | oeffnen.js, verlauf.js |
| `svg`, `blattzahl`, `zusatzY` | Blatt-SVG, gezeigte Blätter, Zeiger-y beim Ziehen über den Rand | oeffnen.js, anzeige.js, zeiger.js |
| `tool`, `color`, `w`, `grid`, `dock` | Werkzeug, Farbe, Strichstärke, Raster fangen, Andocken | werkzeuge.js, ereignisse.js |
| `place`, `ausPalette`, `klickAuslassen` | Palettenart zum Setzen, Ziehen aus der Palette, Klick danach übergehen | ereignisse.js |
| `markiert` | Markierung `{art, id}` oder null | status.js und die Tabellen unten |
| `letzterKlick`, `drag`, `strich`, `strichPfad`, `radiert` | Doppelklick, laufendes Ziehen, aufgezogener Strich, Radierer | zeiger.js |
| `verbindenVon` | Werkzeug Verbinden: erster Baustein `{id, anschluss}` | zeiger.js |
| `hist`, `zukunft`, `tx` | Rückgängig, Wiederholen, offene Transaktion | verlauf.js |
| `sim` | Pneumatik-Simulation `{on, st, pos, P}` | vorlagen/pneumatik-simulation.js |
| `vorlage` | Zustand der Vorlage, beim Öffnen geleert. Der Kern kennt nur `vorlage.angefangen` (Esc und Werkzeugwechsel verwerfen es) | Vorlage |

Die Markierung ist höchstens ein Element: `ED.markiert = {art, id}`. `art` ist `o` (Baustein, `id` = Objekt-ID),
`c` (Verbindung), `s` (Strich), `t` (Text) mit `id` = Index in `data.c`, `data.s`, `data.t`, oder `f`
(Schriftfeld, `id` null). Setze sie mit `markiere(art, id)`, frage sie mit `istMarkiert(art, id)` und
`markiertId(art)` ab, hebe sie mit `clearSel()` auf. Was je Art geschieht, steht in Tabellen statt in if-Ketten:

| Tabelle | Datei | je Art |
| --- | --- | --- |
| `MARKIERUNG` | auswahl.js | `element(id)`: das markierte Element |
| `TREFFER` | auswahl.js | data-Attribut und id eines Treffers unter dem Zeiger (`trefferBei`) |
| `FELDER_JE_ART` | eigenschaften.js | Inhalt des Eigenschaftsfelds |
| `FELDNAME` | bearbeiten.js | Eingabefeld (data-prop) → Eigenschaft des Elements |
| `ENTFERNE` | bearbeiten.js | Löschen und Radieren |
| `AUSWAHL` | zeiger.js | `beschriften` beim Doppelklick, `greifen` beginnt das Ziehen |
| `VERSCHIEBE` | ereignisse.js | Pfeiltasten |

## 6. Änderungen und Neuzeichnen

Regel: Jede Änderung an der Zeichnung läuft über `aendere(d => { … }, {ohneRender})` (verlauf.js). Die Funktion
vergleicht die Zeichnung vorher und nachher als JSON. Nur bei einer echten Änderung legt sie einen Verlaufsschritt
an, leert Wiederholen, speichert, löscht die Markierungen der Prüfung, zeichnet das Schriftfeld neu (wenn `meta`
anders ist) und die Zeichnung (außer mit `ohneRender`). Gibt die Änderung eine neue Zeichnung zurück, ersetzt diese
`ED.data`. Gib in einem Pfeil `d => d.c.splice(i, 1)` deshalb nichts zurück, schreib `d => { d.c.splice(i, 1); }`.

Ziehen und Tippen fasst du mit `beginne(schluessel)` und `schliesse()` zu einem Schritt zusammen: Dazwischen legt
`aendere` keinen eigenen Schritt an, `schliesse` legt einen an, wenn sich etwas geändert hat. `undo` und `redo`
schließen eine offene Transaktion. `snapshot()` und danach `saveSketch()` ist der alte Weg (legt immer einen Stand
ab). Er steht noch beim Beschriften, Ziehen, Strichzeichnen, Tippen im Eigenschaftsfeld (focusin), „Alles leeren“,
in der Kopie aus einer früheren Übung
und im Weg-Schritt-Diagramm. Neue Stellen nehmen nur `aendere`.

Wann was neu gezeichnet wird:

| Aufruf | zeichnet | wann |
| --- | --- | --- |
| `renderInk()` | Zeichnung (`<g class="ink">`), Blattzahl (`checkPages`), Eigenschaftsfeld nur bei geänderter Markierung | nach jeder Änderung, macht `aendere` selbst |
| `refreshTpl()` | Vorgedrucktes und Schriftfeld (`<g class="tpl">`) | nach Änderung an `meta` (macht `aendere` selbst) und an der Blattzahl |
| `updateProps()` | Eigenschaftsfeld, wenn sich die Markierung geändert hat | über `renderInk` |
| `updateProps(true)` | Eigenschaftsfeld neu; wird es gerade bedient, nur die Werte | nach Werkzeugwechsel, Beschriften |
| `updateProps("neu")` | Eigenschaftsfeld immer ganz neu | wenn ein Feld andere Felder ein- oder ausblendet (Haken `umbau`), Schriftfeld öffnen |
| `applyProp(f, v)` | nur die Zeichnung, nicht das Eigenschaftsfeld | Tippen im Eigenschaftsfeld, damit das Feld den Fokus behält |

Die Ebene `<g class="ghost">` zeigt Vorschauen (Setzen, Andocken, Hilfslinien) und wird beim Werkzeugwechsel und
beim Verlassen des Blatts geleert.

## 7. data-Attribute für Treffer

Der Kern erkennt Treffer und Knöpfe an diesen Attributen. Eine Vorlage darf sie nur in dieser Bedeutung benutzen.

| Attribut | Element | Bedeutung |
| --- | --- | --- |
| `data-o` | `<g>` eines Bausteins | Objekt-ID |
| `data-c` | `<g>` einer Verbindung | Index in `data.c` |
| `data-i` | Pfad eines Strichs | Index in `data.s` |
| `data-hi`, `data-h` | Griff am Strichende | Index des Strichs, Nummer des Punkts |
| `data-ti` | Text und sein Rahmen | Index in `data.t` |
| `data-sf` | Fläche über dem Schriftfeld | Klick öffnet das Schriftfeld |
| `data-prop` | Eingabefeld im Eigenschaftsfeld | Feldname für `applyProp` |
| `data-ed` | Knopf | Aktion in `AKTIONEN` (editor/ereignisse.js) |
| `data-tool`, `data-color`, `data-w` | Knopf der Werkzeugleiste | Werkzeug, Farbe, Strichstärke |
| `data-place` | Palettenknopf | Bausteinart zum Setzen |
| `data-sym` | Zeichenleiste | Zeichen zum Einfügen |
| `data-ws` | Seitenleiste des Weg-Schritt-Diagramms | gehört der Vorlage (Haken `klick`) |
| `data-gc` | Knöpfe der GRAFCET-Kette | gehört der Vorlage (Haken `klick`, grafcet-knoepfe.js) |

## 8. Registry: der Vertrag mit den Vorlagen

Eine Vorlage meldet beim Laden Vorlage, Gruppen, Bausteine und Stricharten in `editor/registry.js` an. Der Kern
fragt nie nach dem Namen einer Vorlage oder Bausteinart, sondern nach Haken in diesen Einträgen. Fehlt ein Haken,
gilt das Verhalten in der Spalte „ohne Haken“.

```js
import { registriereVorlage, registriereGruppe, fuelle, BAUSTEIN, SAMPLE } from '../registry.js';

registriereVorlage("regelkreis", {
  n: "Regelkreis",                        // Name der Kachel
  d: "Blockschaltbild Regler, Stellglied, Strecke, Messglied",
  gruppen: ["regel"],                     // Bausteingruppen der Palette
  body: (ex, page, meta) => "<g>…</g>",   // vorgedruckter Inhalt eines Blatts als SVG-Text
});
registriereGruppe("regel", {name: "Regelkreis", hinweis: "Blöcke und Summierstelle setzen …", pfeiltext: true});
fuelle(BAUSTEIN, {box: {g: "regel", n: "Block", zeichne: o => "…", umriss: o => ({x: o.x, y: o.y, w: 110, h: 50}),
  feldliste: [["v", "Bezeichnung"]], beschriftung: {sofort: true, hinweis: "Bezeichnung, z. B. Regler"}}});
fuelle(SAMPLE, {box: [{k: "box", x: 2, y: 2, v: "Regler"}, "0 0 114 54"]});
```

### Tabellen

| Tabelle | Schlüssel | Inhalt |
| --- | --- | --- |
| `VORL` | Vorlage | ganze Anmeldung mit allen Haken; Reihenfolge = Kacheln. Lesen über `vorlage(key)` ({} wenn unbekannt) |
| `GRUPPE` | Gruppe | ganze Anmeldung mit allen Haken (`name`, `hinweis`, …). Für ein Objekt: `gruppeVon(o)` |
| `BAUSTEIN` | Bausteinart oder Palettenvariante | ein Eintrag mit allen Haken; Reihenfolge = Palette. Lesen über `art(k)` ({} wenn unbekannt) |
| `SAMPLE` | Paletteneintrag | `[Musterobjekt, viewBox, Zusatz-SVG]` für das Palettenbild (sonst `pcSample`) |
| `STRICH` | Strichart `st.k` | Haken einer Strichart; der Kern trägt `l` (Linie) und `r` (Kasten) ein |
| `STRICHFELD` | Feld | Eigenschaftsfeld → Eigenschaft des markierten Strichs, z. B. `sl: "lbl"` |

Es gibt ein Bausteinmodell. Ein Bauteil mit Anschlüssen ist ein Eintrag in `BAUSTEIN` mit `bauteil: true` und den
Maßen `w`, `h`. `registriereBauteile({k: {…}})` setzt `bauteil: true` und stellt das Kennzeichen (Vorschlag `lbl`)
als erstes Eigenschaftsfeld vor die `feldliste`. `bauteil(k)` liefert den Eintrag nur für Bauteile, sonst null.
Der Kern dreht und spiegelt nur Bauteile. Eine Palettenvariante (`mk`) erzeugt ein Objekt ihrer Grundart `mk.k`; die
Haken stehen bei der Grundart.

Funktionen zum Anmelden: `registriereVorlage(key, v)`, `registriereGruppe(id, g)`, `registriereBauteile({k: b, …})`
und `fuelle(tabelle, einträge)`.

### Haken einer Vorlage (`registriereVorlage`)

| Haken | Signatur | Aufrufer | ohne Haken |
| --- | --- | --- | --- |
| `n`, `d` | Text | Kacheln, Druck, Schriftfeld | |
| `gruppen` | `["grafcet", …]` | Palette, Werkzeug Verbinden, Andocken | keine Palette, nur Zeichenwerkzeuge |
| `schienen` | `[[Name, y, x, Breite]]` | `virtuelleSchienen` (bauteile.js) | keine virtuellen Schienen |
| `einblattig` | `true` | `pageCount`, Abbruchstellen, `avoidBreak` | Zeichnung wächst um Blätter |
| `body` | `(ex, page, meta) → SVG` | `pagesSVG` (blaetter.js) | leeres Blatt |
| `startWerkzeug` | Werkzeugname | `openEditor` (oeffnen.js), nur ohne Palette | zuletzt benutztes Zeichenwerkzeug |
| `werkzeugleiste` | `{linie: {titel, name}, nachVerbinden, nachLinie}` (HTML) | `werkzeugleisteZeilen` | Linie „Linie“, keine Zusatzknöpfe |
| `seitenleiste` | `() → HTML` | `seitenleisteHTML`, nur ohne Palette | nichts |
| `hilfe` | HTML | `seitenleisteHTML`, Hilfetext ohne Palette | nur der allgemeine Hinweis |
| `anleitung` | `() → HTML oder null` | `propsHTML` (eigenschaften.js) | Felder der Markierung |
| `klick` | `(e) → true wenn erledigt` | Klick im Dialog (editor/ereignisse.js) | |
| `werkzeugWechsel` | `(t)` | `setTool` (werkzeuge.js), vor dem Wechsel | |
| `fangPunkt` | `(pt) → [x, y]` | `fangen` (werkzeuge.js), wenn Raster fangen an ist | 10er-Raster |
| `fangBaustein` | `(o)`, verschiebt o | `smartPos` (andocken.js) | |
| `zeiger.unten` | `(e, pt) → true wenn erledigt` | `zeigerUnten` (zeiger.js), vor allen Kernwerkzeugen | |
| `zeiger.bewegen` | `(e, pt) → true wenn erledigt` | `zeigerBewegen`, wenn nichts gezogen oder gesetzt wird | |
| `zeiger.angeklickt` | `(p, k) → true wenn erledigt` | `zeigerLoslassen`, Strich nur angeklickt, nicht gezogen | Strich verwerfen |
| `zeiger.gezogen` | `(st) → true wenn erledigt` | `zeigerLoslassen`, Strich fertig und gespeichert | neu zeichnen |
| `hintergrund` | `(d, cs) → SVG` | `zeichnungSVG` (zeichnen.js), unter den Verbindungen | |
| `verweis` | `(x, y) → Text` | `wireRef` (zeichnen.js), Verweis an Abbruchstellen | nur Kennzeichen und Blatt |
| `pruefe` | `(d, {scope, key}) → [Befund]` | Knopf „Prüfen“ (pruefung.js); Befund `{stufe: "fehler" oder "hinweis", text, o?, c?, pt?}` | kein Knopf |

### Haken einer Gruppe (`registriereGruppe`)

| Haken | Signatur | Aufrufer | ohne Haken |
| --- | --- | --- | --- |
| `name`, `hinweis` | Text | Palette (`paletteHTML`) | |
| `kette` | `true` | `kettenQuelle`, `andockStelle` (kette.js), `verbindungsWeg` | kein Fortsetzen, kein Andocken |
| `verbinde` | `(c, A, B, objs, alle, spuren) → {d, arrow, lbl}` | `verbindungsWeg` (zeichnen.js) nach der Gruppe von A | rechtwinklig von Rand zu Rand |
| `schleife` | `true` | `connect` (andocken.js) | keine Verbindung auf sich selbst |
| `pfeiltext` | `true` | `verbindungFelder` (eigenschaften.js) | Verbindung ohne Beschriftung |
| `bedingung` | `(A) → true/false` | Platzhalter in `verbindungSVG`, Abfrage in `connect` | |
| `andocke` | `(o, andere) → {a, b, d, sx, sy, pa?, pb?} oder null` | `andockStelle` (kette.js) beim Setzen und Ziehen; `andere` = Bausteine derselben Gruppe | Ketten: `andockKette(o, andere, weite = 140)`, sonst kein Andocken |
| `mitziehen` | `(o, {umschalt}, d) → [id, …]` | `mitnehmen` (zeiger.js) beim Greifen von o | nur o bewegt sich |
| `loeschen` | `(o, d) → [id, …]` | `removeObj` (bearbeiten.js), also Löschen und Radierer; darf vorher Verbindungen in d ergänzen | nur o und seine Verbindungen |
| `kennzeichen` | `(k, d, vorschlag) → Text` | `makeObj` (andocken.js), auch für die Vorschau; `vorschlag` = `o.v` nach `neu` bzw. `nextLabel` | `vorschlag` |
| `nachSetzen` | `(o, d, {A, dock})`, ändert d | `placeObj` im selben Verlaufsschritt; A = Kettenvorgänger, dock = Andockstelle | |
| `vorVerbinden` | `(A, B, d) → null`, `{ok: false, text}` oder `{ersetze(d)}` | `connect` (andocken.js), nur Verbindungen ohne Anschlüsse | verbinden |

Ergibt `andocke` ein `pa` und `pb`, entsteht beim Loslassen eine Leitung zwischen diesen Anschlüssen (`dockLeitung`).
`{ok: false, text}` zeigt den Text im Eigenschaftsfeld (`zeigeHinweis`), `{ersetze}` ändert die Zeichnung statt der
einfachen Verbindung (ein Verlaufsschritt).

### Haken einer Bausteinart (`BAUSTEIN`)

„Bauteil“ heißt: nur für Einträge aus `registriereBauteile`.

| Haken | für | Signatur | Aufrufer | ohne Haken |
| --- | --- | --- | --- | --- |
| `n`, `g`, `hide`, `mk` | alle | Name, Gruppe, nicht in der Palette, Palettenvariante | Palette, `makeObj` | |
| `zeichne` | alle | `(o, edit) → SVG` | `bausteinZeichnen` (zeichnen.js), Bauteile gedreht | nichts |
| `umriss` | alle | `(o) → {x, y, w, h}` | `umrissVon` (bausteine.js) | Bauteil aus `w`, `h`, `bx` und Drehung, sonst 20 × 20 |
| `mitte` | alle | `(o) → [x, y]` | `mitteVon` | Mitte des Umrisses |
| `aus`, `ein` | alle | `(o, x) → [x, y]` | `kettenAus`, `kettenEin`: Kettenanschluss unten bzw. oben | Mitte der Unter- bzw. Oberkante |
| `einrueck` | alle | Zahl | `ausrichten` (kette.js) | 0 |
| `teilung` | alle | Zahl: Abstand des Kettenanschlusses unter dem Vorgänger | `ausrichten` (kette.js) beim Fortsetzen einer Kette | Höhe vom Klick |
| `radius` | alle | Zahl, am einfachsten über `...rund(r)` | Pfeile an den Kreisrand (zeichnen.js, zustand.js) | Rechteckrand |
| `neu` | alle | `(o, pt, mk)`, Bauteil `(o, pt)`; setzt `x`, `y`, `v` … | `makeObj`, `neuesBauteil` (andocken.js) | Mitte bei pt |
| `anschluesse` | alle | `[[Name, dx, dy, Richtung]]` oder `(o) → […]`, Richtung u, d, l, r | `portsOf` (bauteile.js): Verbinden, Leitungen | keine Anschlüsse |
| `feldliste` | alle | `[[Feld, Beschriftung, Platzhalter oder Optionen]]`; Optionen `[[Wert, Text]]` ergeben eine Auswahl, Feld `v` das Kennzeichenfeld | `objektFelder` (eigenschaften.js), `listenFeld` | keine Felder |
| `felder` | alle | `(o) → HTML` | `objektFelder`, statt der `feldliste` | `feldliste` |
| `titel` | alle | Text | `objektFelder` | `n` |
| `setze` | alle | `(o, f, v) → true wenn erledigt`, z. B. `setzeBreite` | `setzeFeld` (bearbeiten.js) | `o[f] = v` |
| `umbau` | alle | `["t", …]` | `feldGeaendert` (editor/ereignisse.js): Feld baut das Eigenschaftsfeld neu auf | |
| `beschriftung` | alle | `false` oder `{sofort, ort(o), wert(o), hinweis, setze(o, v)}`; `hinweis` ist Text oder `(o) → Text` | `editObjLabel` (beschriften.js), `placeObj` | Text `o.v` links am Umriss, kein Hinweis |
| `verweisName` | alle | `(o, objs, cs, dir) → Text` | `refName` (zeichnen.js) | `o.v` oder `n` |
| `seite` | alle | `{verbinde(A, B, spuren), quelle, ausrichten, andocken, punkt}` | kette.js: Seitenbaustein einer Kette | gewöhnliches Kettenglied |
| `kennbuchstaben` | alle | `["QA", "KF"]` | `kennzeichenFeld` (eigenschaften.js): Kennzeichen mit Vorschlagsliste | einfaches Textfeld |
| `w`, `h`, `bx` | Bauteil | Maße, Versatz des Umrisses nach links | `umrissVon`, `drehung`, `neuesBauteil` | |
| `def`, `lbl`, `info` | Bauteil | Vorgabewerte, Kennzeichen-Vorschlag, Hinweistext im Eigenschaftsfeld | `neuesBauteil`, `objektFelder` | |
| `schiene` | Bauteil | `true` | `istSchiene` (bauteile.js): Anschluss „~“ an beliebiger Stelle | |
| `drehbar` | Bauteil | `false` | `drehung`, `turnSel`, Drehknöpfe | drehbar und spiegelbar |
| `rahmen` | Bauteil | `true` | `istRahmen` (zeichnen.js): unter allen Bausteinen, nur am Rand greifbar | |
| `zusatz` | Bauteil | `(o, belegt) → SVG` | `punkteSVG` (zeichnen.js); `belegt(n)`: Anschluss n ist verdrahtet | |
| `sim` | Bauteil | `(o, stellung, hatDruck) → {src, pairs, dir}` | `simCompute` (pneumatik-simulation.js) | nimmt nicht an der Simulation teil |

Warum es nur noch ein Modell gibt: Bausteine und Bauteile hatten dieselben Haken unter verschiedenen Namen (`draw`
und `zeichne`, `ports` und `PORTS2`, `props` und `PROPS`, `LABEL_HINT`). Der einzige echte Unterschied ist, dass
Bauteile Maße haben und sich drehen lassen. Das sagt jetzt `bauteil: true`.

Hilfen für die Haken: `textFeld`, `auswahlFeld`, `HINWEIS`, `FARBEN`, `loeschKnopf` (eigenschaften.js), `LINIE`,
`platzhalter`, `rund`, `setzeBreite` (bausteine.js), `PP`, `PD`, `LB`, `PN`, `SK`, `portsOf` (bauteile.js),
`beginneStrich` (zeiger.js), `fangen`, `setTool` (werkzeuge.js).

### Haken einer Strichart (`fuelle(STRICH, {k: {…}})`)

| Haken | Signatur | Aufrufer | ohne Haken |
| --- | --- | --- | --- |
| `form` | `(st) → Pfad` | `shapeD` (vorlagen-svg.js): Umriss, Treffer, Vorschau | Kasten |
| `zeichne` | `(st, i, d) → SVG` | `strichSVG` (vorlagen-svg.js) | Pfad in Farbe und Stärke des Strichs |
| `titel`, `felder` | Text, `(st) → HTML` | `strichFelder` (eigenschaften.js) | Titel, Farbe und Strichstärke |
| `griffe` | `false` | `strichSVG` | runde Griffe an den Enden |
| `oben` | `true` | `strokesSVG`: über den anderen Strichen | |
| `ziehen` | `(st, drag, dx, dy)` | `zieheStrich` (zeiger.js) | verschieben, Ecke fängt |

Eigene Felder eines Strichs trägst du in `STRICHFELD` ein, z. B. `fuelle(STRICHFELD, {sl: "lbl"})`.

## 9. Anleitungen

### Neue Bausteinart anlegen

1. Such dir die Vorlagendatei der Gruppe, z. B. `vorlagen/regelkreis.js`. Gehört der Baustein zu einer neuen
   Gruppe, meldest du sie dort mit `registriereGruppe` an und nimmst sie in `gruppen` der Vorlage auf (und beim
   Kästchenraster in `vorlagen/raster.js`).
2. Einfacher Baustein ohne Maße: Trag ihn mit `fuelle(BAUSTEIN, {k: {g, n, zeichne, umriss, …}})` ein.
   Bauteil mit Anschlüssen: `registriereBauteile({k: {g, n, w, h, anschluesse, zeichne, lbl, …}})`.
3. Gib ihm die Haken, die er braucht: meist `zeichne` und `umriss`, oft `neu` (Lage und Kennzeichen beim
   Setzen), `feldliste` und `beschriftung`. In einer Kette kommen `aus`, `ein` und eventuell `einrueck` dazu.
4. Palettenbild: Bauteile bekommen es von selbst. Für einfache Bausteine trägst du `SAMPLE` ein.
5. Die Reihenfolge der Einträge in `BAUSTEIN` ist die Reihenfolge in der Palette.
6. `node web/tools/uebungshandbuch/module.mjs imports`, bauen, im Browser ausprobieren. Für einen Umbau ohne
   neue Funktion zusätzlich `pruefen.mjs`.

### Neue Vorlage anlegen

1. Lege `editor/vorlagen/<key>.js` an, mit einem Kommentar oben: was die Vorlage zeigt und wer sie nutzt.
2. Importiere die Datei in `main.js` bei den Vorlagen. Die Stelle bestimmt die Reihenfolge der Kacheln.
3. Melde die Vorlage an: `registriereVorlage("<key>", {n, d, body, …})`. Ein Formular mit genau einem Blatt
   bekommt `einblattig: true`, eine Palette bekommt `gruppen`.
4. Braucht die Vorlage eigene Werkzeuge, nutze die Haken `werkzeugleiste`, `seitenleiste`, `anleitung`,
   `zeiger`, `fangPunkt` und `werkzeugWechsel` (Vorbild: `vorlagen/wegschritt.js`). Eigenen Zustand legst du in
   `ED.vorlage` ab. Für eigene Linienarten meldest du Stricharten in `STRICH` an (Vorbild:
   `vorlagen/wegschritt-striche.js`).
5. Soll eine Übung die Vorlage anbieten, trägt die Übung sie in `EXVORL` (app/daten.js) ein.
6. `node web/tools/uebungshandbuch/module.mjs imports`, bauen, ausprobieren.

Fehlt dir ein Haken, leg ihn in `registry.js` (Kommentar) an, ruf ihn an genau einer Stelle im Kern auf und trag
ihn hier in die Tabelle ein. Frag vorher, ob ein bestehender Haken reicht.

## 10. Glossar der Kurznamen

Die Zeichenhelfer bilden eine kleine Zeichensprache und bleiben kurz, damit die Symbolzeilen lesbar bleiben.

| Name | Bedeutung | Datei |
| --- | --- | --- |
| `SVGT(x, y, t, a, sz, w, f)` | Text als SVG, mehrzeilig | svg.js |
| `tw(t, px)` | geschätzte Textbreite | svg.js |
| `INK`, `MUTE`, `SCHRIFT` | Strichfarbe, Farbe der Platzhalter, Schriftfamilie | svg.js |
| `PH` | Blatthöhe 707 | svg.js |
| `TX(x, y, s, txt, a, f, w)` | grauer Text im Vorgedruckten | vorlagen-svg.js |
| `G`, `G2` | Grau und helles Grau des Vorgedruckten | vorlagen-svg.js |
| `SK` | Strichattribute der Bauteilsymbole | bauteile.js |
| `PP(d)`, `PD(d)` | Pfad, gestrichelter Pfad im Symbolstil | bauteile.js |
| `LB(x, y, t)` | Kennzeichen am Symbol | bauteile.js |
| `PN(x, y, t)` | Anschlussname am Symbol | bauteile.js |
| `BLUE` | Blau für Druck in der Simulation und Anschlusskreise | bauteile.js |
| `IC`, `S`, `BY`, `$`, `$$`, `esc` | Icons, Speicher, Übung nach ID, querySelector, querySelectorAll, HTML maskieren | app/basis.js |
| `ED` | Zustand des Editors | status.js |
| `o`, `c`, `st`, `t`, `d` | Baustein, Verbindung, Strich, Text, Zeichnung | überall |
| `k`, `v` | Bausteinart bzw. Strichart, Kennzeichen oder Text | Datenmodell |
| `pa`, `pb` | Anschlüsse einer Leitung an `a` und `b` | Datenmodell |
| `mk` | Palettenvariante: Vorgaben, mit denen ein Paletteneintrag ein Objekt der Grundart `mk.k` erzeugt | BAUSTEIN |
| `ex`, `scope`, `key` | Übung, Bereich (Übung oder `frei`), Vorlage | App und Editor |
| `gm` | Geometrie einer Verbindung `{d, arrow, lbl, p1, p2, up, wire, ends}` | zeichnen.js |

## 11. Offene Sonderfälle

Diese Stellen im Kern kennen noch Namen aus einer Vorlage. Sie bleiben, weil ein Haken dafür mehr Verrenkung
als Nutzen brächte.

* `virtuelleSchienen` (bauteile.js) erzeugt die virtuellen Schienen als Objekte der Bauteilart `rail` aus
  `vorlagen/leistung.js`. Der Stromlaufplan braucht deshalb die Potenzialschiene aus dem Hauptstromkreis.
* `BLATTKLASSEN` (werkzeuge.js) nennt die CSS-Klassen `erase`, `text`, `sel`, `conn`, `place`, `sim` am Blatt. Die
  Klasse `sim` gehört zur Pneumatik-Simulation, die Zeiger stehen in `styles/07-editor.css`.
* Eine Verbindung ohne `pfeiltext` zeigt im Eigenschaftsfeld den Satz über GRAFCET-Verbindungen
  (`verbindungFelder` in eigenschaften.js), auch in anderen Gruppen.
* `ED.vorlage.angefangen` (angefangene Linie des Weg-Schritt-Diagramms) setzt der Kern zurück: in `setTool` und bei
  Esc (`abbrechen` in editor/ereignisse.js). `ED.vorlage.voreinstellung` gehört allein der Vorlage.
* `zeiger.unten` läuft vor allen Kernwerkzeugen, auch vor Auswählen. Eine Vorlage, die dort eingreift (Zeilennamen
  im Weg-Schritt-Diagramm), muss sonst `false` zurückgeben.
* Der Steuerstromkreis (`elektro.js`) nutzt dieselbe Ablaufkette wie GRAFCET (`kette.js`). Verbindet jemand im
  Kästchenraster einen Kontakt mit einer GRAFCET-Aktion, zeichnet der Haken `seite` der Aktion die Linie.
* Die Ventil-Varianten der Pneumatik stehen in der Palette vor den Zylindern, weil `pneumatik.js` die Bauteile in
  zwei Aufrufen von `registriereBauteile` anmeldet und dazwischen `PCPAL` einträgt.
* `pruefen/beispiele-erzeugen.mjs` läuft nur gegen den alten Ein-Skript-Stand, die Beispiele sind fest.
* Ein Hinweis aus `vorVerbinden` (`zeigeHinweis`) und die Befundliste der Prüfung stehen in `#props`, bis sich die
  Markierung ändert. Nach einem Klick auf einen Knopf in `#props` liegt der Fokus nicht mehr im Editor (K10).
* Einige Texte der Bedienoberfläche (Palettenhilfe, Menü „Aus früherer Übung“, Rückfrage beim Kopieren) stehen
  noch in der Sie-Form und mit Gedankenstrich. Sie zu ändern ändert die Ausgabe, deshalb blieb es beim Umbau.

## 12. Welle 1: wer ändert was, Namen aus Paket V

Grundlage ist der Stand mit Tag `welle1-v` (Paket V auf `welle1-k0`). Jedes Paket arbeitet in einem eigenen
Worktree und ändert in gemeinsamen Dateien nur die Funktionen, die ihm gehören, ohne Umformatieren. Neue Haken liefert
nur KERN. Vor jedem Commit: `module.mjs imports`, Build, `pruefen/tests/lauf.mjs` (alle Pakete) und `pruefen.mjs`
als Rauchtest.

| Paket | Eigene Dateien | Funktionen in gemeinsamen Dateien |
| --- | --- | --- |
| KERN | `verlauf.js`, `zeiger.js`, `oeffnen.js`, `ereignisse.js`, `registry.js`, `spuren.js`, `signalfeld.js`, `pruefung.js`, `anzeige.js`, `auswahl.js`, `status.js`, `styles/07-editor.css`, `pruefen/tests/lauf.mjs`, `treiber.mjs`, `kern.mjs` | Rahmen von `eigenschaften.js`, `andocken.js`, `bearbeiten.js`; `pageCount` (zeichnen.js), `pagesSVG`, `sketchSVG` (blaetter.js), `sketchPage` (app/druck.js), `S.set` (app/basis.js) |
| GRAFCET | `vorlagen/grafcet.js`, `vorlagen/zustand.js`, `pruefen/tests/grafcet.mjs` | `avoidBreak` (andocken.js), `routeV`, GRAFCET-Teil von `kettenQuelle` und `ausrichten` (kette.js) |
| ELEKTRO | `vorlagen/elektro.js`, `vorlagen/leistung.js`, `pruefen/tests/elektro.mjs` | `wireEnds` (bauteile.js), `abzweigpunkte`, `wireRef` (zeichnen.js) |
| PNEU | `vorlagen/pneumatik*.js`, `vorlagen/wegschritt*.js`, `pruefen/tests/pneu.mjs` | `wireD`, `drehung` (bauteile.js); `vPairs`, `drawValve`, `simCompute`, `simStep`, `simClick` liegen in den eigenen Dateien |
| REGEL | `vorlagen/regelkreis.js`, `vorlagen/trend.js`, `vorlagen/raster.js`, `pruefen/tests/regel.mjs` | keine; Wege nur über den Haken `verbinde` mit `spuren` |

Die Kettenlogik (`kette.js`) teilen sich GRAFCET und Steuerstromkreis. Eine andere Fangweite oder eigene Regeln
kommen über den Gruppen-Haken `andocke` in die Vorlagendatei, z. B.
`andocke: (o, andere) => andockKette(o, andere, 70)`, nicht als Änderung in `andockKette`.

Lange Zeilen (über 140 Zeichen) und `o.k`-Ketten in den Vorlagen räumt jedes Familienpaket in seinen eigenen Dateien
auf. Der Kern hat keine Zeile über 140 Zeichen mehr.

Namen aus dem Plan und die Haken, die es dafür gibt:

| Plan | Haken | Wo |
| --- | --- | --- |
| `andocke` (dockFor) | Gruppe `andocke(o, andere)`, Standard `andockKette`, Seitenbausteine `seite.andocken` | kette.js |
| `raste` (Strompfad aus smartPos) | Vorlage `fangBaustein(o)` | elektro.js, Aufruf in `smartPos` |
| `reihe` | nicht angelegt, kein Bedarf in Welle 1 | |
| `nachSetzen` | Gruppe `nachSetzen(o, d, {A, dock})` | `placeObj` |
| `verbinde` (Veto) | Gruppe `vorVerbinden(A, B, d)`; `verbinde` bleibt die Geometrie | `connect` |
| `mitziehen` | Gruppe `mitziehen(o, {umschalt}, d)` | `mitnehmen` (zeiger.js) |
| `loesche`, `nachLoeschen` | Gruppe `loeschen(o, d)`: mitgehende IDs, ergänzt vorher Verbindungen | `removeObj` |
| `kennzeichen` | Gruppe `kennzeichen(k, d, vorschlag)` | `makeObj` |
| `autoLeitungen` (L+/M-Block) | Vorlage `hintergrund(d, cs)` | elektro.js (`strompfadAnschluesse`), Aufruf in `zeichnungSVG` |
| `weg` | Gruppe `verbinde(…, spuren)`, `seite.verbinde(A, B, spuren)`, `routeV`, `wireD` | `verbindungsWeg` |
| `PRUEF[vorlage]` | Vorlage `pruefe(d, {scope, key})` | pruefung.js |
| `SIGART[bausteinart]` | Bausteinart `kennbuchstaben` | `kennzeichenFeld` (eigenschaften.js) |
| `edit()` | `aendere()` (`edit` ist überall ein lokaler Parameter) | verlauf.js |

### Namen aus Paket V (alt → neu)

Wer auf `welle1-k0` angefangen hat, findet die Namen so wieder:

| alt | neu |
| --- | --- |
| `TPL[key]`, `PAL[key]`, `VRAIL[key]`, `FIXED[key]` | `vorlage(key).body`, `.gruppen`, `.schienen`, `.einblattig` |
| `GN[g]`, `HINT[g]` | `GRUPPE[g].name`, `GRUPPE[g].hinweis` |
| `BLK`, `PC` | `BAUSTEIN` (Bauteile mit `bauteil: true`), `art(k)`, `bauteil(k)` |
| `PC[k].draw` | `zeichne` |
| `PC[k].ports`, `PORTS2[k]` | `anschluesse` |
| `PC[k].props` `[f, lbl, "select", opts]`, `[f, lbl, "text"]`; `PROPS[k]` | `feldliste` `[f, lbl, opts]`, `[f, lbl]`, `[f, lbl, platzhalter]` |
| `LABEL_HINT[k]` | `beschriftung.hinweis` |
| `ED.sel`, `selC`, `selS`, `selT`, `selF` | `ED.markiert = {art, id}`, `markiere`, `istMarkiert`, `markiertId`, `markiertesObjekt()` |
| `ED.cur`, `ED.curEl` | `ED.strich`, `ED.strichPfad` |
| `ED.from`, `ED.fromP` | `ED.verbindenVon = {id, anschluss}` |
| `ED.pend`, `ED.wsPreset` | `ED.vorlage.angefangen`, `ED.vorlage.voreinstellung` |
| `ED.pages`, `extraY`, `dnd`, `skipClick`, `erasing`, `lastClick` | `ED.blattzahl`, `zusatzY`, `ausPalette`, `klickAuslassen`, `radiert`, `letzterKlick` |
| `bbox`, `ctr`, `fam` | `umrissVon`, `mitteVon`, `gruppenId` |
| `drawObj`, `inkSVG`, `connGeom` | `bausteinZeichnen`, `zeichnungSVG`, `verbindungsWeg` |
| `xform`, `vrails`, `outPt`, `inPt` | `drehung`, `virtuelleSchienen`, `kettenAus`, `kettenEin` |
| `snapW`, `svgPt` | `fangen`, `blattPunkt` |
| `edDown`, `edMove`, `edUp` | `zeigerUnten`, `zeigerBewegen`, `zeigerLoslassen` |
| `leitungsart`, `TEXTFELD` | `FELDNAME` in bearbeiten.js |
| Rundung von `w` in `setzeFeld` | Haken `setze: setzeBreite` (Verzweigung, Schiene) |
| `st.k === "l"`/`"r"` | Einträge `l`, `r` in `STRICH` |
| `WS_X0`, `WS_SPALTE`, `WS_Y0`, `WS_ZEILE` | `WS_RASTER.x0`, `.spalte`, `.y0`, `.zeile`, dazu `spalteBei`, `zeileBei`, `WS_BAUGLIEDER` |
| `HINWEIS` (wegschritt-striche.js) | `HINWEIS` in eigenschaften.js |
