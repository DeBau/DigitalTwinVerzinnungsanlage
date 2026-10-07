# Übungsvorlage: der Standard für jede Übung

Diese Datei legt fest, wie eine Übung im Übungshandbuch aufgebaut ist. Sie gilt für alle 37 Übungen. L01 bis L03
sind die Referenzübungen: Wer eine andere Übung überarbeitet, hält sich an diese Vorlage und schaut sich dort an,
wie es aussieht. Die Vorlage wächst mit jeder neuen Idee. Was hier steht, ist beschlossen.

## Inhalt

1. Wo die Daten liegen
2. Aufbau einer Übung in sechs Schritten
3. Nachschlagen: Aufgabe und Fachwissen
4. Fachwissen
5. Aufgabenschritte (Ausführen)
6. Vorlagen zum Ausfüllen
6a. Interaktive Erklärungen
7. Schreibregeln
8. Quellen
9. Regeln für den Code
10. Prüfliste vor dem Abschluss einer Übung

## 1. Wo die Daten liegen

| Datei | Inhalt |
| --- | --- |
| `uebungen.js` | Je Übung ein Objekt: Kopfdaten, Lernziele, Signale, Situation, Planung, Aufgabenschritte, Hilfen, Leitfragen, Prüfprotokoll, Ergebnisse, Vorlagen |
| `texte/Lxx.json` | Aufgabenbeschreibung `beschr` und Fachwissen `wissen` der Übung |
| `quiz.js` | Eingangs-Check und Abschluss-Quiz |
| `stil.js` | Programmierregeln nach Siemens, ab welcher Übung sie gelten |

Nach jeder Änderung: `node web/tools/uebungshandbuch/build.mjs`. Das baut `docs/uebungshandbuch.html` und prüft die
Daten. Es dürfen keine neuen Warnungen entstehen.

Arbeitsunterlagen (Siemens-PDFs, SCE-Module) liegen lokal in `devInput/` im Wurzelordner des Repositorys. Der Ordner
steht in `.gitignore` und kommt nie ins Repository.

## 2. Aufbau einer Übung in sechs Schritten

| Schritt | Inhalt | Felder |
| --- | --- | --- |
| 1 Informieren | Situation, Aufgabenbeschreibung, Tabelle, Fachwissen, Zwilling einstellen, Signal-Rallye, Eingangs-Check | `sit`, `beschr`, `tab`, `wissen`, `list`, `einst`, `sig` |
| 2 Planen | Leitfragen, Planungsaufträge, Vorlagen, Skizzen, Variablenliste | `lf`, `plan`, `tpls` mit `phase:2` |
| 3 Entscheiden | Fachgespräch und Freigabe | |
| 4 Ausführen | Aufgabenschritte zum Abhaken, mit Hilfen und Fachwissen je Schritt | `auf`, `hilfe`, `fw`, `tpls` mit `phase:4` |
| 5 Kontrollieren | Prüfprotokoll, Stil-Check | `pr`, `lfk` |
| 6 Bewerten | Selbsteinschätzung, Ergebnisse für die Folgeübungen | `ergebnis`, `plus` |

## 3. Nachschlagen: Aufgabe und Fachwissen

Ab Schritt 2 zeigt die Seitenleiste den Kasten „Nachschlagen“. Niemand soll zu Schritt 1 zurückblättern müssen.

- **Aufgabe** öffnet ein Popup mit der Aufgabenbeschreibung `beschr` (ohne `beschr` die Situation `sit`), dazu
  `tab` und `list`, wenn die Übung sie hat.
- **Fachwissen**: Darunter stehen alle Themen aus `wissen`. Ein Klick öffnet ein Popup mit **genau diesem einen
  Thema**, nie mit allen.
- Auf schmalen Fenstern schweben „Aufgabe“ und „Fachwissen“ unten rechts. „Fachwissen“ öffnet dort die Themenliste,
  alle Themen zugeklappt.
- In Schritt 1 sind alle Fachwissen-Themen beim Öffnen **zugeklappt**, auch das erste.

Damit das Popup ohne die Seite drumherum verständlich ist, muss jedes Fachwissen-Thema für sich allein stehen
(siehe 4).

## 4. Fachwissen

**Grundregel: Wer mit den Unterlagen arbeitet, kennt nichts, was zum ersten Mal vorkommt.** Jeder Begriff, jedes
Werkzeug in TIA oder im Zwilling, jede Vorlage und jede Arbeitsweise, die in einer Übung zum ersten Mal vorkommt, bekommt
in genau dieser Übung ein eigenes Fachwissen-Thema. Ein Verweis auf eine spätere Übung reicht nicht. Jedes Thema
beantwortet:

1. **Was ist das?**
2. **Was machst du damit?** Schritt für Schritt.
3. **Warum machst du das?** Wozu dient es in der Anlage, im Projekt, im Beruf, und wo brauchst du es später wieder?
4. **Wie sieht es aus?** Ein konkretes Beispiel aus der Verzinnungsanlage.
5. **Wo findest du es?** Menüpfad in TIA oder Stelle im Zwilling, bei Vorlagen: wie das Popup bedient wird.

Muster: L01, Thema „Die Wertetabelle: was sie ist und warum du sie ausfüllst“.

Ein Thema in `texte/Lxx.json`, Feld `wissen`, sieht so aus: `{t: "Titel", h: "HTML-Text", q: "Quellen"}`.

- **Ein Thema, eine Frage.** Der Titel sagt, worum es geht, zum Beispiel „Lampentest“ oder „Flanken: R_TRIG und
  F_TRIG“. Ein Thema erklärt eine Sache und nicht drei.
- **Für sich allein verständlich.** Das Thema wird als Popup mitten im Ausführen geöffnet. Es darf nicht auf „wie oben
  beschrieben“ bauen. Begriffe, die es braucht, erklärt es selbst oder nennt das Thema, in dem sie stehen.
- **Erklärniveau:** Was ist es, wie funktioniert es, was macht es, warum brauchst du es, wo findest du es in TIA.
  Keine schwierige Mathematik.
- **Neue Stilregeln** bekommen ein eigenes Thema mit dem Titel „Neue Stilregel: …“.
- **Die Reihenfolge der Themen nicht ändern**, ohne `fw` in `uebungen.js` anzupassen. `fw` zählt die Themen ab 0.

## 5. Aufgabenschritte (Ausführen)

`auf` ist die Liste der Schritte zum Abhaken. Jeder Schritt ist eine Handlung, die man in TIA Portal oder am Zwilling
ausführt und danach abhaken kann.

- **Fachwissen je Schritt (`fw`):** Zu jedem Schritt stehen die passenden Fachwissen-Themen direkt unter dem
  Schritt. Ein Klick öffnet das Thema als Popup. Format wie bei `hilfe`: Schlüssel ist die Nummer des Schritts ab 0,
  Wert die Liste der Themennummern ab 0, das wichtigste zuerst.

  ```js
  fw:{0:[1,10], 1:[2,9], 5:[6,8]},
  ```

  Jeder Schritt bekommt mindestens ein Thema, höchstens drei. Der Build warnt, wenn ein Schritt oder ein Thema fehlt.
- **Hilfen (`hilfe`):** bis zu drei Stufen je Schritt: Denkanstoß, Lösungsweg, Lösung.
- **Reihenfolge:** leicht vor schwer, so wie man in TIA wirklich arbeitet. Das Ergebnis eines Schritts braucht der
  nächste.

## 6. Vorlagen zum Ausfüllen

Vorlagen (`tpls`) stehen nie als große Tabelle im Text. Im Schritt steht eine **Karte** mit Titel, Fortschrittsbalken
und einer Kachel je Zeile (grau offen, grün fertig, gelb Abweichung). **Ausfüllen** öffnet das Popup.

Im Popup steht links die Liste aller Zeilen mit Status und den eingetragenen Werten, rechts die **Karte der
gewählten Zeile**: oben der Steckbrief (die festen Spalten), darunter je Eingabespalte ein Feld. Ist eine Zeile
fertig, springt das Popup selbst zur nächsten offenen Zeile. Die Filter „Offen“ und „Abweichung“ helfen beim
Nacharbeiten. Mit Tasten: 0 und 1, J und N füllen das nächste freie Feld, die Pfeiltasten wechseln die Zeile.

Oben schaltet man zwischen **Karten** und **Übersicht** um. Die Übersicht zeigt die ganze Tabelle mit allen Werten
und dem Status jeder Zeile, ein Klick auf eine Zeile öffnet ihre Karte. Sind alle Zeilen fertig, meldet die Karte
„Geschafft!“ und bietet die Übersicht an.

Jede Vorlage bekommt `fw`: die Fachwissen-Themen, die erklären, was die Vorlage ist und warum man sie ausfüllt, das
wichtigste zuerst. Sie stehen als Chips auf der Karte und oben im Popup. Ist die Vorlage neu, ist das erste Thema ihr
eigenes (siehe 4).

Jede Vorlage bekommt außerdem `felder`: je Eingabespalte (die Spalten nach den festen Spalten in `rows`) ein Eintrag.

| Typ | Feld im Popup | Pflicht |
| --- | --- | --- |
| `"01"` | zwei große Tasten 0 und 1 | ja |
| `"janein"` | zwei große Tasten ja und nein | ja |
| `"text"` | Textfeld | ja |
| `"notiz"` | Textfeld, z. B. Bemerkung | nein |

Mit `{typ: "01", ab: 4}` ist ein Feld erst ab Schritt 4 (Ausführen) offen, vorher steht dort „Trägst du im Schritt
Ausführen ein“. So plant man in Schritt 2 („erwartet“) und misst in Schritt 4 in derselben Vorlage.

`vergleich: [a, b]` vergleicht zwei Eingabespalten (ab 0 gezählt), zum Beispiel „erwartet“ und „gemessen“. Weichen
sie ab, wird die Zeile gelb, und die Karte bittet um eine Erklärung in der Bemerkung.

```js
{id:"werte", fw:[10,0,5], felder:["01", {typ:"01", ab:4}, {typ:"01", ab:4}, {typ:"janein", ab:4}, {typ:"notiz", ab:4}], vergleich:[0,1], cap:"…", …}
```

Feste Spalten in `rows` so wählen, dass die ersten beiden die Zeile benennen (z. B. Adresse und Kennzeichen), die
dritte sie beschreibt. Daraus entsteht die Zeilenliste. Vorlagen, die ein früheres Dokument fortschreiben
(`erweitert`), zeigen im Popup weiter die ganze Tabelle mit den früheren Zeilen.

## 6a. Interaktive Erklärungen

Was man ausprobieren kann, wird nicht nur beschrieben, sondern **zum Anklicken** gezeigt. Ein Fachwissen-Thema bekommt
dafür einen Platzhalter im Text (`h`). Die App macht daraus eine interaktive Erklärung, im Popup und in Schritt 1.

| Art | Platzhalter | Zeigt |
| --- | --- | --- |
| `logik` | `<div data-interaktiv="logik" data-op="UND,ODER,NICHT,XOR" data-a="BG9" data-b="BG10" data-q="PF2" data-sa="#temperatureOk" data-sb="#levelOk" data-sq="#lampBathReady"></div>` | Eingänge zum Anklicken, FUP, KOP und SCL im Programmstatus wie in TIA, Funktionstabelle, Signalverlauf, Satz „VKE = …, weil …“, Begriffe Signalzustand, VKE, Programmstatus |
| `zyklus` | `<div data-interaktiv="zyklus" data-e="BG40" data-a="PF4"></div>` | STOP, ANLAUF und RUN, den Zyklus „Eingänge ins PAE, OB1 bearbeiten, am Zyklusende PAA an die Ausgänge“ (wie SCE 032-200) animiert, Zykluszeit, Reaktionszeit, kurze Impulse, Sensor und kurzen Impuls zum Anklicken, Signalverlauf, Begriffe |

- `data-op` mit mehreren Verknüpfungen zeigt einen Umschalter, mit einer nur diese.
- Kennzeichen in Attributen **ohne „−“** schreiben (`BG9`), die App setzt es selbst davor.
- `data-sa`, `data-sb` und `data-sq` sind die Namen in SCL (Parameter des Bausteins). Ohne sie nimmt die App die
  Kennzeichen in Anführungszeichen.
- Jede Verknüpfung, jede Zeitfunktion und jeder Ablauf, den die Übung neu einführt, bekommt eine interaktive Erklärung.
  Fehlt eine passende Art, wird sie als eigene Datei in `src/app/interaktiv/` gebaut und hier eingetragen.

**Programmiersprachen und SCL:** Ab L02 steht zu jedem Netzwerk, das die Azubis in FUP oder KOP bauen, auch die
SCL-Zeile. SCL wird so von Anfang an mitgelernt (die Ansicht „SCL“ der interaktiven Erklärung zeigt sie). Wann man
welche Sprache nimmt, erklärt das Fachwissen nach dem Siemens-Programmierleitfaden (Kapitel 3, Programmiersprachen).

## 7. Schreibregeln

- **Du-Form**, nie Sie-Form.
- **Keine Gedankenstriche** als Satzzeichen („ – “, „—“, „--“). Stattdessen Punkt, Komma, Doppelpunkt oder Klammer.
  Das „−“ vor Kennzeichen wie −BG9 bleibt.
- **Kurze Sätze**, ein Gedanke je Satz.
- **Keine erfundenen Fachbegriffe.** Jeder Fachbegriff muss in Siemens-Unterlagen, der TIA-Hilfe oder einer Norm
  vorkommen. Braucht das Handbuch einen eigenen Namen (z. B. „Ausgangsliste“), steht im Fachwissen ausdrücklich, dass es
  ein Name dieses Handbuchs ist, und in `q` „nicht Siemens-belegt“. Dazu wird der echte Siemens-Begriff genannt
  (z. B. Querverweisliste).
- **Fachbegriffe und Bausteinnamen nie unerklärt** verwenden. Englische Namen im Programm (`Indication`) bekommen
  beim ersten Auftreten die deutsche Bedeutung dazu.
- **Kennzeichen** nach DIN EN 81346-2 immer mit „−“ schreiben (−BG9, −PF2). Die App macht daraus Chips.
- **Menüpfade in TIA** kursiv: `<i>Programmbausteine</i>, <i>Neuen Baustein hinzufügen</i>`.

## 8. Quellen

- Jede fachliche Aussage ist mit Siemens-Unterlagen belegt: zuerst https://docs.tia.siemens.cloud/, sonst Siemens
  Industry Online Support oder SCE-Lehrunterlagen. Wikipedia und Foren zählen nicht.
- Jedes Fachwissen-Thema hat im Feld `q` mindestens einen Link auf siemens.cloud oder siemens.com. Der Build warnt
  sonst.
- Was nicht von Siemens belegt ist (allgemeine Praxis), steht ausdrücklich so in `q`.
- **Zum fachlichen Gegenprüfen** (nicht als Link in `q`, weil nur lokal):
  - TIA Portal V21 Hilfe auf dem Rechner: https://localhost:5112/?api=PortalV21
  - Siemens-Unterlagen in `devInput/`: Programmierleitfaden, Übersicht der Datentypen, SCE-Module zu Hardware S7-1500,
    Security, FB, FC, IEC-Zeiten und Zähler, Diagnose, globalen DBs und SCL.
  Jede Übung wird vor dem Abschluss gegen diese Quellen geprüft.

## 9. Regeln für den Code

Alles wird strukturiert, wartbar, einfach und nach Best Practice gebaut.

- **Einzelne Dateien:** je Aufgabe ein Modul (z. B. `src/app/vorlage-popup.js` für das Vorlagen-Popup), Dateien bis etwa
  300 Zeilen. Neue Module stehen in `src/main.js` in der richtigen Schicht und in `src/README.md` in der Modulkarte.
- **Kurze Funktionen** mit genau einer Aufgabe und sprechenden deutschen Namen.
- **Keine überlangen Einzeiler**, keine verschachtelten Ternaries. Lieber zwei Zeilen mehr.
- **Tabellen statt if- oder switch-Ketten** (z. B. `AKTION`, `WAHL`, `TASTE` in `vorlage-popup.js`).
- **Daten gehören in die Daten:** Inhalte stehen in `uebungen.js` und `texte/`, nie im Code.
- **Jede Datei hat einen Kopfkommentar**, der sagt, was sie tut.
- **Keine Abstraktion auf Vorrat.**

## 10. Prüfliste vor dem Abschluss einer Übung

- [ ] Build läuft ohne neue Warnungen.
- [ ] Alles, was in der Übung zum ersten Mal vorkommt (Begriffe, Werkzeuge, Vorlagen, Arbeitsweisen), hat ein eigenes
      Fachwissen-Thema mit Was, Wie, Warum, Beispiel und Wo.
- [ ] Jeder Aufgabenschritt hat 1 bis 3 Fachwissen-Themen in `fw`, jede Vorlage hat `fw`.
- [ ] Jedes Fachwissen-Thema ist als Popup allein verständlich und hat eine Siemens-Quelle.
- [ ] Fachlich gegen die TIA-Hilfe V21 und die Unterlagen in `devInput/` geprüft.
- [ ] In Schritt 1 sind alle Fachwissen-Themen zugeklappt.
- [ ] Jede neue Verknüpfung, Zeitfunktion und jeder neue Ablauf hat eine interaktive Erklärung (6a); zu jedem
      FUP-Netzwerk steht die SCL-Zeile.
- [ ] Jede Vorlage hat `felder` mit passenden Typen, wo sinnvoll 0/1 oder ja/nein statt Text.
- [ ] Jede Aufgabe ist in TIA Portal und am Zwilling machbar.
- [ ] Du-Form, keine Gedankenstriche, keine unerklärten und keine erfundenen Begriffe.
- [ ] Im Browser geprüft: Schritt 1, Schritt 4 mit Popups, schmales Fenster.
