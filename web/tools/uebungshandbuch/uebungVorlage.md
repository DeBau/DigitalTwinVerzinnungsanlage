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
7. Schreibregeln
8. Quellen
9. Prüfliste vor dem Abschluss einer Übung

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

Jede Vorlage bekommt deshalb `felder`: je Eingabespalte (die Spalten nach den festen Spalten in `rows`) ein Eintrag.

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
{id:"werte", felder:["01", {typ:"01", ab:4}, {typ:"01", ab:4}, {typ:"janein", ab:4}, {typ:"notiz", ab:4}], vergleich:[0,1], cap:"…", …}
```

Feste Spalten in `rows` so wählen, dass die ersten beiden die Zeile benennen (z. B. Adresse und Kennzeichen), die
dritte sie beschreibt. Daraus entsteht die Zeilenliste. Vorlagen, die ein früheres Dokument fortschreiben
(`erweitert`), zeigen im Popup weiter die ganze Tabelle mit den früheren Zeilen.

## 7. Schreibregeln

- **Du-Form**, nie Sie-Form.
- **Keine Gedankenstriche** als Satzzeichen („ – “, „—“, „--“). Stattdessen Punkt, Komma, Doppelpunkt oder Klammer.
  Das „−“ vor Kennzeichen wie −BG9 bleibt.
- **Kurze Sätze**, ein Gedanke je Satz.
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

## 9. Prüfliste vor dem Abschluss einer Übung

- [ ] Build läuft ohne neue Warnungen.
- [ ] Jeder Aufgabenschritt hat 1 bis 3 Fachwissen-Themen in `fw`.
- [ ] Jedes Fachwissen-Thema ist als Popup allein verständlich und hat eine Siemens-Quelle.
- [ ] In Schritt 1 sind alle Fachwissen-Themen zugeklappt.
- [ ] Jede Vorlage hat `felder` mit passenden Typen, wo sinnvoll 0/1 oder ja/nein statt Text.
- [ ] Jede Aufgabe ist in TIA Portal und am Zwilling machbar.
- [ ] Du-Form, keine Gedankenstriche, keine unerklärten Begriffe.
- [ ] Im Browser geprüft: Schritt 1, Schritt 4 mit Popups, schmales Fenster.
