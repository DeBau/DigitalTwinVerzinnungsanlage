# Quelltext des Übungshandbuchs

Das Übungshandbuch entsteht mit `node web/tools/uebungshandbuch/build.mjs` als eine einzige Datei
`docs/uebungshandbuch.html`, die ohne Server und ohne Internet läuft. Der Quelltext liegt in
`web/tools/uebungshandbuch/src/` und ist in ES-Module aufgeteilt. esbuild (aus `web/node_modules`, einmal
`cd web && npm ci`) bündelt sie zu einem Skript.

## Modulkarte

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
| `editor/svg.js` | SVG-Grundlagen: `INK`, `MUTE`, `SVGT`, `tw`, `clamp`, `arrowHead`, Blatthöhe `PH` |
| `editor/status.js` | Zustand des Editors `ED` |
| `editor/registry.js` | Tabellen der Vorlagen, Gruppen, Bausteine und Stricharten, `art()`, Funktionen zum Anmelden |
| `editor/vorlagen-svg.js` | Raster, Punkte, Rahmen, Schriftfeld, `snap`, Striche und Texte (`shapeD`, `strokesSVG`) |
| `editor/bauteile.js` | Bauteile mit Anschlüssen: Strichstile, Drehen und Spiegeln, Anschlüsse, Schienen, Leitungen, `simOn`, `pressed` |
| `editor/bausteine.js` | Geometrie: `bbox`, `ctr`, `outPt`, `inPt`, `fam`, `gruppeVon`, `rund`, `LINIE`, `platzhalter` |
| `editor/auswahl.js` | `objById`, `uid`, `anySel`, `clearSel` |
| `editor/kette.js` | Ablaufkette: senkrechte Verbindung, Kettenvorgänger, Ausrichten, Andocken, Seitenbausteine |
| `editor/zeichnen.js` | `drawObj`, `connGeom`, `inkSVG` mit Leitungen, Verbindungen, Bausteinen und Punkten, `pageCount`, `wireRef` |
| `editor/blaetter.js` | Blätter, `sketchSVG`, Schriftfeld-Daten |
| **App-Seiten** | `app/start.js`, `app/skizzen-kacheln.js`, `app/variablen.js`, `app/uebung.js` |
| **Editor-Kern: Bedienung** | |
| `editor/eigenschaften.js` | Eigenschaftsfeld links (`propsHTML`, `updateProps`), Feldbausteine `textFeld`, `auswahlFeld`, `FARBEN`, `loeschKnopf` |
| `editor/anzeige.js` | Blatt und Zeichnung neu zeichnen (`renderInk`, `refreshTpl`), Blattzahl, Größe |
| `editor/verlauf.js` | `snapshot`, `saveSketch`, `undo`, Kopie aus einer früheren Übung |
| `editor/beschriften.js` | Beschriftungsfeld auf dem Blatt (`editLabel`, `editObjLabel`, `editConnLabel`, `editTextItem`) |
| `editor/werkzeuge.js` | `setTool`, `svgPt`, Punkt fangen `snapW` |
| `editor/bearbeiten.js` | Eigenschaft übernehmen `applyProp`, Drehen, Löschen, Radieren |
| `editor/andocken.js` | Bausteine erzeugen `makeObj` und setzen `placeObj`, Hilfslinien, Andock-Vorschau, Verbinden |
| `editor/zeiger.js` | Zeigerereignisse `edDown`, `edMove`, `edUp`, `beginneStrich` |
| `editor/oeffnen.js` | `openEditor` mit Werkzeugleiste und Seitenleiste, Palette, `paintEditor` |
| **Druck und Seiten** | `app/druck.js`, `app/seiten.js` |
| **Vorlagen** (Reihenfolge = Kacheln) | |
| `editor/vorlagen/grafcet.js` | GRAFCET: Schritte, Transitionen, Verzweigungen, Verweise, Aktionen als Seitenbausteine |
| `editor/vorlagen/zustand.js` | Zustandsdiagramm: Zustände, Übergänge als gebogene Pfeile |
| `editor/vorlagen/wegschritt-striche.js` | Weg-Schritt-Diagramm: Stricharten Signallinie, Start, Zyklusende, Verknüpfung |
| `editor/vorlagen/wegschritt.js` | Weg-Schritt-Diagramm: Formular, Seitenleiste, Werkzeuge |
| `editor/vorlagen/elektro.js` | Stromlaufplan mit den Gruppen Steuerstromkreis (`elektro`) und Geräte/SPS (`geraete`) |
| `editor/vorlagen/leistung.js` | Hauptstromkreis mit Potenzialschiene |
| `editor/vorlagen/pneumatik-symbole.js` | Ventile, Zylinder, Entlüftungen nach ISO 1219 |
| `editor/vorlagen/pneumatik-simulation.js` | Druckverteilung, Zylinderbewegung, Ventile schalten |
| `editor/vorlagen/pneumatik.js` | Pneumatikschaltplan: Vorlage, Gruppe, Bauteile, Ventil-Varianten |
| `editor/vorlagen/regelkreis.js` | Regelkreis: Block, Summierstelle |
| `editor/vorlagen/trend.js` | Trendaufzeichnung (nur Formular) |
| `editor/vorlagen/raster.js` | Kästchenraster mit allen Gruppen |
| **Seiteneffekte** | `app/tooltip.js`, `app/router.js`, `app/ereignisse.js`, `editor/ereignisse.js` (Listener des Editor-Dialogs) |

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
  `node web/tools/uebungshandbuch/pruefen/pruefen.mjs`. Erwartet sind 0 Abweichungen. Baue nicht neu, solange
  `pruefen.mjs` läuft: Es lädt `docs/uebungshandbuch.html` für jedes Szenario neu.
* `pruefen/beispiele/*.json` sind feste Beispielzeichnungen. `pruefen/beispiele-erzeugen.mjs` läuft nur gegen
  einen Build mit globalen Namen (bis Commit 640c36d), siehe Kopfkommentar dort.

Achtung bei `module.mjs imports`: Das Werkzeug kennt keine lokalen Gültigkeitsbereiche. Heißt eine lokale
Variable so wie ein exportierter Name eines anderen Moduls, trägt es einen falschen Import ein (der Build meldet
dann womöglich eine Schichtverletzung). Gib lokalen Variablen deshalb Namen, die nirgends exportiert sind.

## Registry: der Vertrag

Eine Vorlage meldet beim Laden Vorlage, Gruppen, Bausteine und Stricharten in `editor/registry.js` an. Der Kern
fragt nie nach dem Namen einer Vorlage oder Bausteinart, sondern nach Haken in diesen Einträgen. Fehlt ein Haken,
gilt das Verhalten in der Spalte „ohne Haken“.

```js
import { registriereVorlage, registriereGruppe, registriereBauteile, fuelle, BLK, SAMPLE, PROPS, LABEL_HINT } from '../registry.js';

registriereVorlage("regelkreis", {
  n: "Regelkreis",                        // Name der Kachel
  d: "Blockschaltbild Regler, Stellglied, Strecke, Messglied",
  gruppen: ["regel"],                     // Bausteingruppen der Palette
  body: (ex, page, meta) => "<g>…</g>",   // vorgedruckter Inhalt eines Blatts als SVG-Text
});
registriereGruppe("regel", {name: "Regelkreis", hinweis: "Blöcke und Summierstelle setzen …", pfeiltext: true});
fuelle(BLK, {box: {g: "regel", n: "Block", zeichne: o => "…", umriss: o => ({x: o.x, y: o.y, w: 110, h: 50})}});
fuelle(SAMPLE, {box: [{k: "box", x: 2, y: 2, v: "Regler"}, "0 0 114 54"]});
```

### Tabellen

| Tabelle | Schlüssel | Inhalt |
| --- | --- | --- |
| `VORL` | Vorlage | ganze Anmeldung mit allen Haken; Reihenfolge = Kacheln |
| `TPL`, `PAL`, `VRAIL`, `FIXED` | Vorlage | `body`, Gruppen, Schienen, einblättrig (aus der Anmeldung abgeleitet) |
| `GRUPPE` | Gruppe | ganze Anmeldung mit allen Haken |
| `GN`, `HINT` | Gruppe | Überschrift und Bedienhinweis in der Palette |
| `BLK` | Bausteinart oder Palettenvariante | `{n, g, mk, hide}` und die Haken einfacher Bausteine; Reihenfolge = Palette |
| `PC` | Bauteil mit Anschlüssen | `{g, n, w, h, bx, ports, draw, def, lbl, props, info, hide, sim}` und die Bauteil-Haken |
| `PORTS2` | einfacher Baustein | Anschlüsse `[[Name, dx, dy, Richtung]]` |
| `SAMPLE` | Paletteneintrag | `[Musterobjekt, viewBox, Zusatz-SVG]` für das Palettenbild (sonst `pcSample`) |
| `PROPS` | Bausteinart | Eigenschaftsfelder `[[Feld, Beschriftung, Platzhalter]]`, wenn es keinen Haken `felder` gibt |
| `LABEL_HINT` | Bausteinart | Hinweis im Beschriftungsfeld |
| `STRICH` | Strichart `st.k` | Haken einer Strichart |
| `STRICHFELD` | Feld | Eigenschaftsfeld → Eigenschaft des markierten Strichs, z. B. `sl: "lbl"` |

`art(k)` liefert den Eintrag einer Bausteinart: `PC[k]`, sonst `BLK[k]`. Eine Palettenvariante (`mk`) erzeugt ein
Objekt ihrer Grundart `mk.k`; die Haken stehen bei der Grundart.

Funktionen zum Anmelden: `registriereVorlage(key, v)`, `registriereGruppe(id, g)`,
`registriereBauteile({k: pc, …})` (trägt jedes Bauteil in `PC` und als Paletteneintrag in `BLK` ein) und
`fuelle(tabelle, einträge)`.

### Haken einer Vorlage (`registriereVorlage`)

| Haken | Signatur | Aufrufer | ohne Haken |
| --- | --- | --- | --- |
| `n`, `d` | Text | Kacheln, Druck, Schriftfeld | |
| `gruppen` | `["grafcet", …]` | Palette, Werkzeug Verbinden, Andocken | keine Palette, nur Zeichenwerkzeuge |
| `schienen` | `[[Name, y, x, Breite]]` | `vrails` (bauteile.js) | keine virtuellen Schienen |
| `einblattig` | `true` | `pageCount`, Abbruchstellen | Zeichnung wächst um Blätter |
| `body` | `(ex, page, meta) → SVG` | `pagesSVG` (blaetter.js) | leeres Blatt |
| `startWerkzeug` | Werkzeugname | `openEditor` (oeffnen.js), nur ohne Palette | zuletzt benutztes Zeichenwerkzeug |
| `werkzeugleiste` | `{linie: {titel, name}, nachVerbinden, nachLinie}` (HTML) | `openEditor` | Linie „Linie“, keine Zusatzknöpfe |
| `seitenleiste` | `() → HTML` | `openEditor`, nur ohne Palette | nichts |
| `hilfe` | HTML | `openEditor`, Hilfetext ohne Palette | nur der allgemeine Hinweis |
| `anleitung` | `() → HTML oder null` | `propsHTML` (eigenschaften.js) | Felder der Markierung |
| `klick` | `(e) → true wenn erledigt` | Klick im Dialog (editor/ereignisse.js) | |
| `werkzeugWechsel` | `(t)` | `setTool` (werkzeuge.js), vor dem Wechsel | |
| `fangPunkt` | `(pt) → [x, y]` | `snapW` (werkzeuge.js), wenn Raster fangen an ist | 10er-Raster |
| `fangBaustein` | `(o)`, verschiebt o | `smartPos` (andocken.js) | |
| `zeiger.unten` | `(e, pt) → true wenn erledigt` | `edDown` (zeiger.js), vor allen Kernwerkzeugen | |
| `zeiger.bewegen` | `(e, pt) → true wenn erledigt` | `edMove`, wenn nichts gezogen oder gesetzt wird | |
| `zeiger.angeklickt` | `(p, k) → true wenn erledigt` | `edUp`, Strich nur angeklickt, nicht gezogen | Strich verwerfen |
| `zeiger.gezogen` | `(st) → true wenn erledigt` | `edUp`, Strich fertig und gespeichert | neu zeichnen |
| `hintergrund` | `(d, cs) → SVG` | `inkSVG` (zeichnen.js), unter den Verbindungen | |
| `verweis` | `(x, y) → Text` | `wireRef` (zeichnen.js), Verweis an Abbruchstellen | nur Kennzeichen und Blatt |

### Haken einer Gruppe (`registriereGruppe`)

| Haken | Signatur | Aufrufer | ohne Haken |
| --- | --- | --- | --- |
| `name`, `hinweis` | Text | Palette (`paletteHTML`) | |
| `kette` | `true` | `kettenQuelle`, `andockStelle` (kette.js), `connGeom` | kein Fortsetzen, kein Andocken |
| `verbinde` | `(c, A, B, objs, alle) → {d, arrow, lbl}` | `connGeom` (zeichnen.js) nach der Gruppe von A | rechtwinklig von Rand zu Rand |
| `schleife` | `true` | `connect` (andocken.js) | keine Verbindung auf sich selbst |
| `pfeiltext` | `true` | `verbindungFelder` (eigenschaften.js) | Verbindung ohne Beschriftung |
| `bedingung` | `(A) → true/false` | Platzhalter in `verbindungSVG`, Abfrage in `connect` | |

### Haken einer Bausteinart (`BLK` für einfache Bausteine, `PC` für Bauteile)

| Haken | Ebene | Signatur | Aufrufer | ohne Haken |
| --- | --- | --- | --- | --- |
| `zeichne` | BLK | `(o, edit) → SVG` | `drawObj` (zeichnen.js) | nichts (Bauteile: `draw`) |
| `umriss` | BLK, PC | `(o) → {x, y, w, h}` | `bbox` (bausteine.js) | BLK 20 × 20, PC aus `w`, `h`, `bx` und Drehung |
| `mitte` | beide | `(o) → [x, y]` | `ctr` | Mitte des Umrisses |
| `aus`, `ein` | beide | `(o, x) → [x, y]` | `outPt`, `inPt`: Kettenanschluss unten bzw. oben | Mitte der Unter- bzw. Oberkante |
| `einrueck` | BLK | Zahl | `ausrichten` (kette.js) | 0 |
| `radius` | BLK | Zahl, am einfachsten über `...rund(r)` | Pfeile an den Kreisrand (zeichnen.js, zustand.js) | Rechteckrand |
| `neu` | BLK: `(o, pt, mk)`, PC: `(o, pt)` | setzt `x`, `y`, `v` … | `makeObj`, `neuesBauteil` (andocken.js) | Mitte bei pt |
| `felder` | beide | `(o) → HTML` | `objektFelder` (eigenschaften.js) | `PROPS` bzw. Kennzeichen und `PC.props` |
| `titel` | beide | Text | `objektFelder` | Name aus `BLK` |
| `setze` | beide | `(o, f, v) → true wenn erledigt` | `setzeFeld` (bearbeiten.js) | `o[f] = v` |
| `umbau` | beide | `["t", …]` | `feldGeaendert` (editor/ereignisse.js): Feld baut das Eigenschaftsfeld neu auf | |
| `beschriftung` | beide | `false` oder `{sofort, ort(o), wert(o), hinweis(o), setze(o, v)}` | `editObjLabel` (beschriften.js), `placeObj` | Text `o.v` links am Umriss |
| `verweisName` | beide | `(o, objs, cs, dir) → Text` | `refName` (zeichnen.js) | `o.v` oder Name |
| `seite` | BLK | `{verbinde, quelle, ausrichten, andocken, punkt}` | kette.js: Seitenbaustein einer Kette | gewöhnliches Kettenglied |
| `schiene` | PC | `true` | `istSchiene` (bauteile.js): Anschluss „~“ an beliebiger Stelle | |
| `drehbar` | PC | `false` | `xform`, `turnSel`, Drehknöpfe | drehbar und spiegelbar |
| `rahmen` | PC | `true` | `istRahmen` (zeichnen.js): unter allen Bausteinen, nur am Rand greifbar | |
| `zusatz` | PC | `(o, belegt) → SVG` | `punkteSVG` (zeichnen.js); `belegt(n)`: Anschluss n ist verdrahtet | |
| `sim` | PC | `(o, stellung, hatDruck) → {src, pairs, dir}` | `simCompute` (pneumatik-simulation.js) | nimmt nicht an der Simulation teil |

Hilfen für die Haken: `textFeld`, `auswahlFeld`, `FARBEN`, `loeschKnopf` (eigenschaften.js), `LINIE`,
`platzhalter`, `rund` (bausteine.js), `PP`, `PD`, `LB`, `PN`, `SK`, `portsOf` (bauteile.js), `beginneStrich`
(zeiger.js), `snapW`, `setTool` (werkzeuge.js).

### Haken einer Strichart (`fuelle(STRICH, {k: {…}})`)

| Haken | Signatur | Aufrufer | ohne Haken |
| --- | --- | --- | --- |
| `form` | `(st) → Pfad` | `shapeD` (vorlagen-svg.js): Umriss, Treffer, Vorschau | Linie (`l`) bzw. Kasten |
| `zeichne` | `(st, i, d) → SVG` | `strichSVG` (vorlagen-svg.js) | Pfad in Farbe und Stärke des Strichs |
| `titel`, `felder` | Text, `(st) → HTML` | `strichFelder` (eigenschaften.js) | Farbe und Strichstärke |
| `griffe` | `false` | `strichSVG` | runde Griffe an den Enden |
| `oben` | `true` | `strokesSVG`: über den anderen Strichen | |
| `ziehen` | `(st, drag, dx, dy)` | `zieheStrich` (zeiger.js) | verschieben, Ecke fängt |

Eigene Felder eines Strichs trägst du in `STRICHFELD` ein, z. B. `fuelle(STRICHFELD, {sl: "lbl"})`.

## Neue Bausteinart anlegen

1. Such dir die Vorlagendatei der Gruppe, z. B. `vorlagen/regelkreis.js`. Gehört der Baustein zu einer neuen
   Gruppe, meldest du sie dort mit `registriereGruppe` an und nimmst sie in `gruppen` der Vorlage auf (und beim
   Kästchenraster in `vorlagen/raster.js`).
2. Einfacher Baustein ohne Anschlüsse: Trag ihn mit `fuelle(BLK, {k: {g, n, zeichne, umriss, …}})` ein.
   Bauteil mit Anschlüssen: `registriereBauteile({k: {g, n, w, h, ports, draw, lbl, …}})`.
3. Gib ihm die Haken, die er braucht: meist `zeichne` und `umriss`, oft `neu` (Lage und Kennzeichen beim
   Setzen) und `beschriftung`. In einer Kette kommen `aus`, `ein` und eventuell `einrueck` dazu.
4. Palettenbild: Bauteile bekommen es von selbst. Für einfache Bausteine trägst du `SAMPLE` ein.
5. Eigenschaftsfelder über `PROPS` (einfach) oder den Haken `felder`, Hinweis beim Beschriften über `LABEL_HINT`.
6. Die Reihenfolge der Einträge in `BLK` ist die Reihenfolge in der Palette.
7. `node web/tools/uebungshandbuch/module.mjs imports`, bauen, im Browser ausprobieren. Für einen Umbau ohne
   neue Funktion zusätzlich `pruefen.mjs`.

## Neue Vorlage anlegen

1. Lege `editor/vorlagen/<key>.js` an, mit einem Kommentar oben: was die Vorlage zeigt und wer sie nutzt.
2. Importiere die Datei in `main.js` bei den Vorlagen. Die Stelle bestimmt die Reihenfolge der Kacheln.
3. Melde die Vorlage an: `registriereVorlage("<key>", {n, d, body, …})`. Ein Formular mit genau einem Blatt
   bekommt `einblattig: true`, eine Palette bekommt `gruppen`.
4. Braucht die Vorlage eigene Werkzeuge, nutze die Haken `werkzeugleiste`, `seitenleiste`, `anleitung`,
   `zeiger`, `fangPunkt` und `werkzeugWechsel` (Vorbild: `vorlagen/wegschritt.js`). Für eigene Linienarten meldest
   du Stricharten in `STRICH` an (Vorbild: `vorlagen/wegschritt-striche.js`).
5. Soll eine Übung die Vorlage anbieten, trägt die Übung sie in `EXVORL` (app/daten.js) ein.
6. `node web/tools/uebungshandbuch/module.mjs imports`, bauen, ausprobieren.

Fehlt dir ein Haken, leg ihn in `registry.js` (Kommentar) an, ruf ihn an genau einer Stelle im Kern auf und trag
ihn hier in die Tabelle ein. Frag vorher, ob ein bestehender Haken reicht.

## Offene Sonderfälle

Diese Stellen im Kern kennen noch Namen aus einer Vorlage. Sie bleiben, weil ein Haken dafür mehr Verrenkung
als Nutzen brächte.

* `vrails` (bauteile.js) erzeugt die virtuellen Schienen als Objekte der Bauteilart `rail` aus
  `vorlagen/leistung.js`. Der Stromlaufplan braucht deshalb die Potenzialschiene aus dem Hauptstromkreis.
* `setTool` (werkzeuge.js) schaltet am Blatt die CSS-Klassen `erase`, `text`, `sel`, `conn`, `place`, `sim`. Die
  Klasse `sim` gehört zur Pneumatik-Simulation, die Zeiger stehen in `styles/07-editor.css`.
* Eine Verbindung ohne `pfeiltext` zeigt im Eigenschaftsfeld den Satz über GRAFCET-Verbindungen
  (`verbindungFelder` in eigenschaften.js), auch in anderen Gruppen.
* `ED.pend` (angefangene Linie des Weg-Schritt-Diagramms) wird im Kern zurückgesetzt: in `setTool` und bei Esc
  (`abbrechen` in editor/ereignisse.js). `ED.wsPreset` gehört allein der Vorlage.
* `zeiger.unten` läuft vor allen Kernwerkzeugen, auch vor Auswählen. Eine Vorlage, die dort eingreift (Zeilennamen
  im Weg-Schritt-Diagramm), muss sonst `false` zurückgeben.
* Der Steuerstromkreis (`elektro.js`) nutzt dieselbe Ablaufkette wie GRAFCET (`kette.js`). Verbindet jemand im
  Kästchenraster einen Kontakt mit einer GRAFCET-Aktion, zeichnet der Haken `seite` der Aktion die Linie.
* Die Ventil-Varianten der Pneumatik stehen in der Palette vor den Zylindern, weil `pneumatik.js` die Bauteile in
  zwei Aufrufen von `registriereBauteile` anmeldet und dazwischen `PCPAL` einträgt.
* `pruefen/beispiele-erzeugen.mjs` läuft nur gegen den alten Ein-Skript-Stand, die Beispiele sind fest.
