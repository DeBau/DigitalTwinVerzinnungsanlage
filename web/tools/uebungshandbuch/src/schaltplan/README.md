# Schaltplan der Anlage

Der Schaltplan (`#/schaltplan`) zeigt die komplette Elektrik der Verzinnungsanlage auf etwa 59 Seiten: Einspeisung,
Motorabgänge, 230 V und 24 V, Not-Halt-Kreis, Sicherheitsrelais, jeden Ein- und Ausgang der SPS, PROFINET,
Feldverteiler, Ventilinseln und die Listen (Klemmenplan, Betriebsmittel, SPS-Zuordnung).

## Daten

* `web/tools/uebungshandbuch/schaltplan.json` beschreibt Geräte, Kanäle, Strompfade und Abgänge.
* Adresse und Kommentar eines Kanals kommen immer aus `signale.csv`. Im Plan steht nur, welches Gerät mit welchem
  Schaltzeichen an welchem Ort hängt und über welchen Weg (Feldverteiler, Ventilinsel).
* Klemmen `−X1`, `−X3`, `−X4`, `−X5` vergibt `klemmen.js` fortlaufend. Jede Klemme steht genau einmal in
  `modell.klemmen`, daraus entsteht der Klemmenplan.
* Motoren mit zwei Wegen (Schütz oder Umrichter) bekommen je Weg eigene Klemmen, eine Umsteckbrücke und einen
  gemeinsamen Motorklemmensatz.
* Ein neues Signal in `signale.csv` braucht eine Zeile in `kanaele`. Der Build meldet sonst eine Warnung
  „Schaltplan“, der Test `pruefen/tests/schaltplan.mjs` schlägt fehl.

## Module

| Datei | Inhalt |
| --- | --- |
| `../symbole/grund.js` | Linie, Kreis, Kasten, Text, Umbruch (reines SVG) |
| `../symbole/iec60617.js` | Schaltzeichen-Tabelle `SYM` (Höhe, Pole, Rolle, Anschlüsse, Zeichnung) |
| `daten.js` | Platzhalter `__PLAN__` |
| `klemmen.js` | alle Klemmen vergeben (Kanäle, Abgänge, Strompfade), Analoganschlüsse je Kanal |
| `modell.js` | Plan und Signalliste zusammenführen, Betriebsmittel, Prüfung |
| `querverweise.js` | Index der Fundstellen, Verweise `/Seite.Spalte`, Kontaktspiegel |
| `seiten.js` | Seitenfolge als Tabelle `SEITENARTEN`, Kanäle werden zu Strompfaden |
| `blatt.js` | A3-Blatt mit Spalten 0 bis 9 und Schriftfeld |
| `elemente.js` | ein Schaltzeichen setzen und beschriften |
| `kontaktspiegel.js` | Kontaktspiegel unter Spulen |
| `analog.js` | zweiter Leiter, Schirm und Speisung der Analogkanäle |
| `pfade.js` | Strompfadseiten (Steuerstromkreis, Ein- und Ausgänge) |
| `leistung.js` | Einspeisung und dreipolige Abgänge |
| `liste.js`, `tabellen.js` | Listenseiten |
| `deckblatt.js` | Deckblatt mit Kennzahlen und Übersichtsskizze der Anlage |
| `bloecke.js` | Hinweise mit Legende, SPS, PROFINET, Feldverteiler, Ventilinseln |
| `plan.js` | zwei Zeichenläufe: erst Index sammeln, dann mit Verweisen zeichnen |
| `zoom.js` | Zoom, Verschieben und Vollbild des Blatts |
| `ansicht.js` | Seite im Handbuch: Inhaltsverzeichnis, Suche, Blättern, Sprünge, Tastatur, Druck |

Alles außer `ansicht.js`, `zoom.js` und `daten.js` ist reine Funktion ohne DOM. `schaltplan-node.mjs` lädt diese Module in Node
für Build-Prüfung und Tests.

## Neues Schaltzeichen

1. Eintrag in `SYM` (`symbole/iec60617.js`): `name`, `h`, `pole`, `rolle`, `an`, `zeichne(x, y, g)`.
2. In `bloecke.js` die Liste `LEGENDE` ergänzen, damit es auf der Hinweisseite erscheint.
3. In `schaltplan.json` verwenden.

## Prüfen

```
node web/tools/uebungshandbuch/build.mjs
node web/tools/uebungshandbuch/pruefen/tests/schaltplan.mjs          # Daten und Zeichnung
node web/tools/uebungshandbuch/pruefen/tests/schaltplan-browser.mjs  # Bedienung im Browser
node web/tools/uebungshandbuch/pruefen/schaltplan-hd.mjs <Ordner> [von] [bis]  # alle Seiten groß als Bild
node web/tools/uebungshandbuch/pruefen/schaltplan-ui.mjs <Ordner>             # Ansicht hell, dunkel, schmal, gezoomt
```

## Strompfade in den Daten

Ein Pfad in `pfadseiten` ist eine senkrechte Kette `glieder` mit diesen Feldern:

| Feld | Bedeutung |
| --- | --- |
| `von`, `bis` | Marke am Anfang oder Ende: Potenzial (L+S, RK1) oder Anschluss eines Geräts (−KF2:S11) |
| `definiert` | Wo ein Potenzial entsteht: `bis` (Standard), `von` oder `keine` (nur Verweis) |
| `erde` | Pfad verbindet die untere Schiene mit −XPE |
| `pe` | Gerät bekommt eine Schutzleiterklemme auf −X1 |

Ein Glied ist `[Zeichen, Kennzeichen, Anschlüsse, Text, angenommen]`.
