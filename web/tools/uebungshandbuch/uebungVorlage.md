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

Jede Übung hat einen eigenen Ordner `uebungen/Lxx/`. Alles, was zu einer Übung gehört, steht dort.

| Datei | Inhalt |
| --- | --- |
| `uebungen/Lxx/uebung.js` | Stammdaten der Übung als ein Objekt: Kopfdaten, Lernziele, Signale, Situation, Planung, Aufgabenschritte, Hilfen, Leitfragen, Prüfprotokoll, Ergebnisse, Vorlagen |
| `uebungen/Lxx/texte.json` | Aufgabenbeschreibung `beschr` und Fachwissen `wissen` der Übung |
| `uebungen/Lxx/quiz.js` | Eingangs-Check `ein` und Abschluss-Quiz `aus` |
| `stil.js` | Programmierregeln nach Siemens, ab welcher Übung sie gelten (gilt für alle Übungen) |

Eine neue Übung legst du an, indem du einen neuen Ordner `uebungen/Lxx/` mit diesen drei Dateien anlegst. Der Build
liest alle Ordner in der Reihenfolge ihrer Nummer. Die `id` in `uebung.js` muss zum Ordnernamen passen.

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

Ein Thema in `uebungen/Lxx/texte.json`, Feld `wissen`, sieht so aus: `{t: "Titel", h: "HTML-Text", q: "Quellen"}`.

- **Ein Thema, eine Frage.** Der Titel sagt, worum es geht, zum Beispiel „Lampentest“ oder „Flanken: R_TRIG und
  F_TRIG“. Ein Thema erklärt eine Sache und nicht drei.
- **Für sich allein verständlich.** Das Thema wird als Popup mitten im Ausführen geöffnet. Es darf nicht auf „wie oben
  beschrieben“ bauen. Begriffe, die es braucht, erklärt es selbst oder nennt das Thema, in dem sie stehen.
- **Erklärniveau:** Was ist es, wie funktioniert es, was macht es, warum brauchst du es, wo findest du es in TIA.
  Keine schwierige Mathematik.
- **Neue Stilregeln** bekommen ein eigenes Thema mit dem Titel „Neue Stilregel: …“.
- **Die Reihenfolge der Themen nicht ändern**, ohne `fw` in `uebung.js` anzupassen. `fw` zählt die Themen ab 0.

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
dafür einen Platzhalter im Text (`h`). Die App macht daraus eine interaktive Erklärung, im Fachwissen-Popup und in Schritt 1.
Im Text steht davon nur eine **Vorschau**, ausprobiert wird im **Popup** (siehe „Vorschau und Popup“ unten).

| Art | Platzhalter | Zeigt |
| --- | --- | --- |
| `logik` | `<div data-interaktiv="logik" data-op="UND,ODER,NICHT,XOR" data-a="BG9" data-b="BG10" data-q="PF2" data-sa="#temperatureOk" data-sb="#levelOk" data-sq="#lampBathReady"></div>` | Eingänge zum Anklicken, FUP, KOP und SCL im Programmstatus wie in TIA, Funktionstabelle, Signalverlauf, Satz „VKE = …, weil …“, Begriffe Signalzustand, VKE, Programmstatus |
| `speicher` | `<div data-interaktiv="speicher" data-art="SR,RS,SELBST,SPULEN" data-s="SF1" data-r="SF2" data-q="statReady" data-ss="#start" data-sr="#stop" data-sq="#statReady"></div>` | Speichern nach TIA-Hilfe: SR-Box (S, R1, rücksetzdominant), RS-Box (R, S1, setzdominant), KOP-Selbsthaltung (Schließer S parallel zum Haltekontakt Q, in Reihe der Öffner R), SPULEN (Netzwerk 1 „Ausgang setzen“ -( S )-, Netzwerk 2 „Ausgang rücksetzen“ -( R )- auf denselben Operanden, Dominanz durch die Reihenfolge der Netzwerke). S und R umschalten oder kurz auf 1, FUP, KOP und SCL (zwei IF, wer zuletzt schreibt, dominiert) im Programmstatus, Funktionstabelle S, R, Q alt, Q neu, Satz zum Warum, Namensfalle SR/RS, Signalverlauf, Begriffe Setzen, Rücksetzen, Dominanz, Speicher im Instanz-DB, Remanenz, Selbsthaltung |
| `flanke` | `<div data-interaktiv="flanke" data-art="P,N,PSPULE,NSPULE,P_TRIG,N_TRIG,R_TRIG,F_TRIG" data-e="SF1" data-q="startPulse" data-m="edgeMemStart" data-i="instStartTrig" data-se="#start" data-sq="#startPulse" data-sm="#statEdgeMem"></div>` | Alle Flankenanweisungen der S7-1500 mit Symbol und Namen nach TIA-Hilfe (-\|P\|-, -\|N\|-, -(P)-, -(N)-, P=, N=, P_TRIG, N_TRIG, R_TRIG, F_TRIG). Eingang anklicken, dann „Nächster Zyklus“ oder Abspielen: Q ist genau einen Zyklus lang 1. KOP, FUP, SCL (R_TRIG/F_TRIG als Multi- oder Einzelinstanz, Flanke von Hand mit statischer Variable), Stand Eingang, Flankenmerker vorher, Q, Signalverlauf über Zyklen, Wissen zu Flankenmerker, Bit- und Instanz-Flanke, Multiinstanz |
| `zyklus` | `<div data-interaktiv="zyklus" data-e="BG40" data-a="PF4"></div>` | STOP, ANLAUF und RUN, den Zyklus „Eingänge ins PAE, OB1 bearbeiten, am Zyklusende PAA an die Ausgänge“ (wie SCE 032-200) animiert, Zykluszeit, Reaktionszeit, kurze Impulse, Sensor und kurzen Impuls zum Anklicken, Signalverlauf, Begriffe |
| `zeit` | `<div data-interaktiv="zeit" data-art="TON,TOF,TP,TONR" data-in="BG40" data-q="statBathReady" data-pt="2000" data-sin="#levelOk" data-sq="#statBathReady" data-inst="#instBathReadyDelay" data-et="#statElapsed"></div>` | IEC-Zeiten nach TIA-Hilfe: IN anklicken oder kurz antippen, die Zeit läuft in echter Zeit (Abspielen, Anhalten, PT wählbar), Box in FUP und KOP im Programmstatus, SCL-Aufruf der Multiinstanz mit Status, ET als Balken und als Rampe im Impulsdiagramm, PT gestrichelt, Satz zum Verhalten (Abbruch beim TON, kein Nachtriggern beim TP, Wiedereinschalten beim TOF, TONR behält ET bis R), Begriffe IEC-Zeit, IN, PT, Q, ET, R, Instanz, Time und T# |
| `zahl` | `<div data-interaktiv="zahl" data-typ="Byte,Word,Int,DInt,Real,BCD16" data-wert="16#00FF" data-adresse="IW0" data-name="DI-Bytes BG1 bis BG16"></div>` | Bits anklicken (Bit 0 rechts), Zahl eingeben (dezimal, 16#…, 2#…), +1/−1. Binär, hexadezimal, dezimal, dasselbe Bitmuster in anderen Datentypen gleicher Breite (z. B. Word, UInt, Int, BCD16), Tetraden mit Hex-Ziffer, bei BCD16 gültig/ungültig und CONVERT. Mit `data-adresse` (IB, IW, ID, QB, QW, MW …) die Bytes nach Big Endian (höherwertig zuerst), jedes Bit mit Adresse und Gerät aus der Signalliste. Überlauf beim +1, Zweierkomplement, Real und LReal mit Vorzeichen, Exponent, Mantisse und gespeichertem Wert, Steckbrief des Typs (Breite, Wertebereich, Werteingaben, Kürzel, CPU-Familien). Knopf „Speicheraufbau groß ansehen“ öffnet ein zweites Popup mit Speicheraufbau, Tabelle der Datentypen und Zeiten (TIME eingeben). Typen: Byte, Word, DWord, LWord, USInt, SInt, UInt, Int, UDInt, DInt, ULInt, LInt, Real, LReal, BCD16. Optional `data-ansicht="speicher"`. In `data-name` Kennzeichen ohne „−“ |
| `bitmuster` | `<div data-interaktiv="bitmuster" data-op="AND,OR,XOR,SHL,SHR,ROL,ROR" data-typ="Byte,Word" data-wert="16#0F" data-maske="16#F0" data-n="1" data-sa="#value" data-sq="#out"></div>` | Wert und Maske anklicken, geänderte Bits markiert; Schieben und Rotieren mit N (auch N größer als die Bitbreite), Bits wandern animiert, herausgefallene und nachgeschobene Bits, Lauflicht −PF1 bis −PF4 aus den Ergebnis-Bits 0 bis 3 (Übernehmen, Abspielen), SCL mit Status und Slice-Zugriff `.%X0`, `.%B0`, Begriffe |
| `rechnen` | `<div data-interaktiv="rechnen" data-op="ADD,SUB,MUL,DIV,MOD,ROUND,TRUNC,CEIL,FLOOR,CMP,IN_RANGE" data-typ="Int,DInt,Real" data-a="3600" data-b="45" data-name-a="Sekunden je Stunde" data-name-b="Taktzeit in s" data-name-q="Körbe pro Stunde"></div>` | Operanden eingeben oder mit Knöpfen ändern (Max für die Grenze), EN umschalten, Beispiele aus der Anlage. FUP-Box mit EN/ENO im Programmstatus, SCL mit Status, Zahlenstrahl mit Wertebereich und Überlauf, Satz in Worten. Regeln nach TIA-Hilfe: Ganzzahldivision schneidet ab, MOD-Rest, Überlauf ENO = FALSE, DIV durch 0 ENO = TRUE (Int: OUT 0, Real: NaN), Real mit 7 Stellen, ROUND bei .5 zur geraden Zahl, CMP-Tabelle, IN_RANGE mit `data-min`, `data-max`. Optional `data-sa`, `data-sb`, `data-sq` (SCL-Namen). `name-…` gelten nur für die erste Anweisung |
| `zaehler` | `<div data-interaktiv="zaehler" data-art="CTU,CTD,CTUD" data-cu="BG13" data-cd="BG22" data-r="SF4" data-ld="SF5" data-pv="5" data-q="statFull" data-cv="#statCount"></div>` | IEC-Zähler nach TIA-Hilfe (Int): CU, CD, R und LD zum Anklicken und Halten, Zähleingang kurz antippen, „Nächster Zyklus“ (Halten zählt nur einmal), PV ändern, Zählerstand groß, Box in FUP und KOP, SCL mit Status, Satz zu Flanke, Rücksetzen, Laden, Grenze von Int, Signalverlauf mit CV je Aufruf, Begriffe CV, PV, Q, Flanke, Rücksetzen, Laden, Remanenz |

- `data-op` mit mehreren Verknüpfungen zeigt einen Umschalter, mit einer nur diese.
- Kennzeichen in Attributen **ohne „−“** schreiben (`BG9`), die App setzt es selbst davor.
- `data-sa`, `data-sb` und `data-sq` sind die Namen in SCL (Parameter des Bausteins). Ohne sie nimmt die App die
  Kennzeichen in Anführungszeichen.
- `zeit`: `data-pt` in ms. Optional `data-inst` (Name der Multiinstanz, sonst `#instTimer`), `data-et` (Operand an ET),
  `data-r` und `data-sr` (Operand an R, nur TONR). `data-sin` und `data-sq` sind die Namen in SCL. Fehlt `data-sq`
  (bzw. `data-et`), entfällt `Q =>` (bzw. `ET =>`) im Aufruf, und die Status-Tabelle zeigt `#inst….Q` (bzw. `.ET`),
  so wie man den Ausgang im Programm direkt an der Instanz liest. Das Anzeigefeld zeigt Q mit dem Operanden aus `data-q`.
- `zahl`: `data-ansicht="speicher"` zeigt statt des Bitfelds gleich den Speicheraufbau: oben der Operand (z. B. %ID0 oder
  %IW2), darunter Wörter, Bytes und Bits, alles **bündig untereinander in einer Reihe**, damit man höherwertig und
  niederwertig sofort sieht (jedes Feld ist so beschriftet, z. B. „höherwertiges Byte · Bit 31 bis 24“). Im Text ist das
  eine ruhige Übersicht (je Byte eine Spalte, die Bits als Text wie `1001 1010`), die ohne Scrollbalken in die Spalte
  passt. Ein Klick öffnet gleich den Speicheraufbau groß mit Bitadresse und Gerät je Bit. Dort wählbar sind Wort, Doppelwort oder LWord, die
  Startadresse (Überlappung wie %IW1 = %IB1 + %IB2) und überlappende Wörter. Klick auf eine Ebene markiert ihre Bits und
  Teile (höherwertig, niederwertig, Bit hi bis lo), Klick auf ein Bit schaltet es. Big Endian nach TIA-Hilfe „L: Laden“
  und Programmierleitfaden 2.6.3. Ohne `data-adresse` liegt die Zahl als Beispiel ab %MB0. Daten der Typen: TIA-Hilfe V21,
  abgeglichen mit „Übersicht Datentypen TIA-Portal“ (spshaus); Kürzel nur von spshaus, Abweichungen stehen in der Tabelle.
- `zaehler`: `data-pv` ist der Vorgabewert. Optional `data-qd` (Operand an QD, nur CTUD), `data-cv` (Operand an CV),
  `data-inst` (sonst `#instCounter`), Namen in SCL mit `data-scu`, `data-scd`, `data-sr`, `data-sld`, `data-sq`,
  `data-sqd`. Ebenso: Fehlt `data-sq`, `data-sqd` oder `data-cv`, entfällt der Ausgang im Aufruf, und die
  Status-Tabelle zeigt `#inst….Q`, `.QU`, `.QD` bzw. `.CV`.
- `speicher`: `data-s`, `data-r` Operanden zum Setzen und Rücksetzen, `data-q` der Speicheroperand (Static-Variable).
  Namen in SCL mit `data-ss`, `data-sr`, `data-sq`.
- `flanke`: `data-m` ist der Flankenmerker (P bis N_TRIG), `data-i` der Name der Multiinstanz (R_TRIG, F_TRIG; ohne
  `data-i` gilt `data-m`, sonst `instTrig`). Ist `data-q` der Ausgang der Instanz selbst (`instStartTrig.Q`), bleibt Q
  unbeschaltet und SCL fragt `#instStartTrig.Q` ab. Namen in SCL mit `data-se`, `data-sq`, `data-sm` (Flankenmerker
  der Flanke von Hand, sonst `#statEdgeMem`). `data-art="HAND"` zeigt nur die Flanke von Hand in SCL
  (`#q := #e AND NOT #statOld; #statOld := #e;`) mit Spuren e, statOld und q, z. B. `<div data-interaktiv="flanke"
  data-art="HAND" data-e="SF1" data-q="tempStartPulseScl" data-se="#start" data-sq="#tempStartPulseScl"
  data-sm="#statStartSclOld"></div>`.
- Jede Verknüpfung, jede Zeitfunktion und jeder Ablauf, den die Übung neu einführt, bekommt eine interaktive Erklärung.
  Fehlt eine passende Art, wird sie als eigene Datei in `src/app/interaktiv/` gebaut und hier eingetragen.

**Vorschau und Popup** (Wunsch des Auftraggebers, gilt für alle interaktiven Erklärungen ab L01):

- **Im Text nur eine kleine Vorschau:** nicht bedienbar, nicht animiert, verkleinert (65 %), höchstens etwa 230 px hoch
  und unten ausgeblendet; darunter der Hinweis „Anklicken, um es groß zu öffnen und auszuprobieren“. Sie muss nicht alles
  zeigen, nur neugierig machen. Sie muss **ohne Scrollbalken** in die Textspalte passen, auch ins schmale Fachwissen-Popup
  ab Schritt 2 (lange SCL-Zeilen brechen in der Vorschau um).
- **Klick öffnet das Popup** (`#iadlg`, `popup.js`), dort ist die Erklärung bedienbar. Vorschau und Popup teilen sich den
  Zustand. Beim Schließen hält eine Animation an, und die Vorschau zeigt den letzten Stand.
- **Popup über Popup:** Ab Schritt 2 liegt das Erklärungs-Popup über dem Fachwissen-Popup, darüber kann ein drittes liegen
  (`#iadlg2`, Speicheraufbau groß). Jedes Erklärungs-Popup hat oben links **„← Zurück“** und oben rechts **„×“**; beides
  und Esc schließen nur das oberste. Danach steht man wieder genau im Fachwissen. Das Fachwissen-Popup selbst hat „×“ und
  „Schließen“, aber kein „← Zurück“, denn dahinter liegt kein weiteres Popup.
- **Zeitdiagramme enden bei der aktuellen Zeit** (`jetzt` in `zeitverlaufSVG`, `zeitverlaufWertSVG`), sonst sieht der
  Rest der Achse aus wie die Zukunft.
- **Zahlenstrahl:** Beschriftungen setzt `rechnen-bild.js` selbst in Reihen, sodass sich nichts überdeckt. Gleiche Werte
  teilen sich eine Beschriftung, der Überlauf-Bogen läuft unter allen Beschriftungen.
- **Popup ohne Scrollleiste von Anfang an**, auch bei hoher Windows-Skalierung (geprüft bei 1536 × 740): so hoch wie der
  Inhalt, höchstens bis zum Fensterrand. Reicht die Höhe nicht, verkleinert `puEinpassen` (`popup.js`) den Inhalt beim
  Öffnen bis höchstens 70 %. Erst wenn man etwas aufklappt (z. B. „Begriffe“), darf die Scrollleiste erscheinen.
  Kompakt bauen: Breite nutzen (Erklärtexte nebeneinander), lange Erklärungen in ein aufklappbares `<details>`, Hinweise
  zum Diagramm in dessen Kopfzeile. Wechselt ein Text beim Abspielen seine Länge (z. B. ANLAUF, Impuls-Meldung), bekommt
  sein Bereich im Popup eine feste Mindesthöhe, sonst wächst das Popup während der Animation.
- **Bilder nicht aufblasen:** Im Popup zeichnet eine Erklärung mehr Inhalt bei gleicher Schriftgröße, statt das Bild zu
  vergrößern. `html(zustand)` bekommt dafür `zustand.breit` (true im Popup, false in der Vorschau); Signalverlauf und
  Impulsdiagramm gehen im Popup über die ganze Breite (32 statt 16 Schritte, längere Zeitachse).
- **Kein Text wird abgeschnitten:** Texte im SVG nur mit `iaText`, Bilder nur mit `iaSvg`. `iaSvg` macht das Bild so
  breit, wie die Texte es brauchen (lange Operanden wie `#stopperPlausible`). Eine neue Textklasse im CSS gehört mit
  Schriftgröße auch in `IA_SCHRIFT` in `interaktiv/basis.js`.
- **Aufklappen geht immer:** Beim Neuzeichnen (auch während einer Animation) bleiben `<details>` wie „Begriffe“
  aufgeklappt. Sie schalten schon beim Drücken um (wie die Knöpfe), denn eine laufende Animation tauscht das Element
  zwischen Drücken und Loslassen aus, ein normaler Klick käme dann nie an. Im Browser mit langsamem Klick (150 ms) prüfen.
- **Flüssig:** Gezeichnet wird nur das offene Popup, nicht die Vorschau dahinter. Ein Klick soll nur wenige ms brauchen.
- **Neue Art:** in `iaRegistrieren` zusätzlich `titel` (Kopf des Popups), bei Animationen `anhalten(zustand)`, bei Bedarf
  `oeffnen(zustand)` (eigenes Popup statt des normalen).

**Alle Popups der App** (Fachwissen, Aufgabe, Meine Daten, Drucken, Bild-Zoom, Erklärungen) haben oben rechts ein „×“
(`dlgZeigen` in `src/app/basis.js` bzw. `DLG_X`). **Ein Klick neben das Popup schließt es nicht.** Geschlossen wird nur
über „×“, „Zurück“, „Fertig“, „Schließen“ oder Esc. **Popups pulsieren nie:** Solange ein Popup offen ist, wird es
nicht kleiner (`puRuhigHalten` in `popup.js`), auch wenn beim Abspielen eine Textzeile kommt und geht.

**Übungskopf** (Kennung, Titel, Arbeitszeit, Drucken) bleibt beim Scrollen unter der oberen Leiste stehen und wird dabei
schmal (`kopfAnpassen` in `ereignisse.js`, Klasse `klein`).

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
- **Daten gehören in die Daten:** Inhalte stehen im Übungsordner `uebungen/Lxx/`, nie im Code.
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
- [ ] Jede interaktive Erklärung im Browser geprüft: Vorschau ohne Scrollbalken, Popup öffnet, ist bedienbar, „Zurück“ und
      „×“ schließen, bei 1600 × 1000 und 1536 × 740 keine senkrechte Scrollleiste (auch nicht während des Abspielens),
      kein abgeschnittener Text, Begriffe lassen sich beim Abspielen mit langsamem Klick auf- und zuklappen.
- [ ] Jede Vorlage hat `felder` mit passenden Typen, wo sinnvoll 0/1 oder ja/nein statt Text.
- [ ] Jede Aufgabe ist in TIA Portal und am Zwilling machbar.
- [ ] Du-Form, keine Gedankenstriche, keine unerklärten und keine erfundenen Begriffe.
- [ ] Im Browser geprüft: Schritt 1, Schritt 4 mit Popups, schmales Fenster.
