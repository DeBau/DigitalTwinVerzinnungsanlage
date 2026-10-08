**Deutsch** · [English](CHANGELOG.en.md)

# Änderungen

Alle nennenswerten Änderungen am Zwilling und an der Bridge. Die Version steht im Zwilling oben in
der Seitenleiste und in der Kopfzeile der Bridge-Konsole. Zwilling und Bridge sollten dieselbe
Haupt- und Nebenversion haben (z. B. 1.4.x), sonst meldet der Zwilling das in der Ereignisliste.

[◀ Zurück zur Übersicht](README.md)

## 1.17.0 – 2026-10-08

Das Übungshandbuch (`docs\uebungshandbuch.html`) ändert sich stark, der Zwilling (`web\index.html`) nur
optisch. In der Bridge ändert sich nur die Versionsnummer. Signalliste und TIA-Variablentabellen bleiben gleich.

**Warum**
Die Übungen waren unübersichtlich und lückenhaft: Fachwissen stand nur im ersten Schritt, Vorlagen als lange
Tabellen im Text, Neues wurde oft nicht erklärt, und einige Aussagen stimmten nicht mit der TIA-Hilfe überein.

**Neu**
- **Standard für alle Übungen** in `web/tools/uebungshandbuch/uebungVorlage.md` (Aufbau, Fachwissen, Vorlagen,
  interaktive Erklärungen, Schreibregeln, Quellen, Prüfliste). L01 bis L10 sind danach ausgearbeitet.
- **Nachschlagen:** Ab Schritt 2 öffnen Aufgabe und jedes Fachwissen-Thema ein Popup aus der Seitenleiste; unter
  jedem Aufgabenschritt und an jeder Vorlage stehen die passenden Themen.
- **Vorlagen im Popup:** Karte mit Fortschritt, Ausfüllen Zeile für Zeile mit großen Tasten 0/1 und ja/nein,
  Tastatur, Abweichungen zwischen Erwartung und Messung, Übersicht der ganzen Tabelle.
- **Interaktive Erklärungen** zum Ausprobieren: Verknüpfungen in FUP, KOP und SCL im Programmstatus, SPS-Zyklus mit
  Anlauf, Zykluszeit, Reaktionszeit und kurzen Impulsen, Speicher (SR, RS, Spulen, Selbsthaltung), alle Flankenarten,
  IEC-Zeiten und -Zähler, Zahlenformate mit Speicheransicht (Doppelwort, Wörter, Bytes, Bits, höherwertig und
  niederwertig) und allen Datentypen, Bitmuster, Rechnen mit Überlauf, Runden und Vergleichen.
- **L01 bis L10 überarbeitet** und unabhängig gegen TIA-Hilfe V21, SCE-Lehrunterlagen und Programmierleitfaden
  geprüft: neue Fachwissen-Themen (u. a. Hardwarekonfiguration, Programmiersprachen, alle Flankenarten, Datentypen),
  SCL in jeder Übung, Rechnungen und Bitmuster nachgerechnet.

**Geändert**
- „Schreibstellenplan“ heißt jetzt **Ausgangsliste** (kein Fachbegriff, als Name des Handbuchs gekennzeichnet).
- SPS-Zyklus überall wie in den SCE-Unterlagen: Eingänge ins PAE, OB1, am Zyklusende PAA an die Ausgänge.
- Zwilling: Leitungen von Pult und Vor-Ort-Stellen gerade nach hinten, Ausschusskiste vor dem Prüfbandgestell.

**Doku**
- `docs/01-inbetriebnahme.md`: Hardwarekonfiguration mit Steckplätzen, Importweg der PLC-Variablen korrigiert,
  Demo startet erst mit START.
- README: Hinweis zu Siemens-Quellen im Übungshandbuch.

## 1.16.0 – 2026-10-07

Der Zwilling ändert sich (`web\index.html`). In der Bridge ändert sich nur die Versionsnummer. Signalliste und
TIA-Variablentabellen bleiben gleich: Schutztür und Lichtvorhang wirken direkt im Sicherheitskreis von −KF2.

**Warum**
Die Absicherung entsprach nicht einer realen Anlage: Die Bänder lagen außerhalb des Schutzfelds, die Umhausung
hatte keine Tür für die Instandhaltung, und die Bedienplätze standen im Gefahrbereich.

**Neu**
- **Schutzgitterzaun** (Bauart Axelent X-Guard: gelbe Pfosten, schwarze Gitterpaneele) statt der Polycarbonat-Umhausung:
  links, hinten und rechts um Portal und Zinnbad, mit Gang neben dem Abstreifzylinder −MM4 und hinter Band 2,
  Abschlusselement an der Kamera, Durchlass für Band 1.
- **Schutztür hinten** mit Sicherheitsschalter und Zuhaltung −BG41 (Bauart Euchner MGB2) und Türanforderung −SF49:
  Anforderung schaltet −KF2 ab, nach 2 s Nachlaufzeit entriegelt die Zuhaltung, die Tür lässt sich öffnen;
  nach dem Schließen verriegelt sie wieder, dann Quittieren und START.
- **Lichtvorhang −BG20 vor den Bändern:** Sender an der linken Zaunecke, Umlenkspiegelsäule SICK PM4 (nach
  Maßzeichnung) vor den Bändern, Empfänger vor der Ausschussbox. Band 1, Rollenkurve, Band 2 und Kipper liegen
  im Schutzfeld, die KLT können ohne Eingriff entnommen werden.
- **Bodenmarkierung** gelb-schwarz rund um den ganzen abgesicherten Bereich.

**Geändert**
- Bedienpult und Vor-Ort-Steuerstelle −S30 stehen vor dem Schutzfeld.
- Signalsäule auf dem vorderen linken Zaunpfosten.
- Wrasenrohr der Sprühkühlung senkrecht nach oben, Abluftrohr des Zinnbads innerhalb des Zauns; beide wie die
  Druckluft-Fallleitungen bis 2600 mm.
- Werker geht von links durch den Lichtvorhang in die Anlage.

## 1.15.0 – 2026-10-07

Der Zwilling ändert sich (`web\index.html`). In der Bridge ändert sich nur die Versionsnummer, damit Zwilling und
Bridge wieder dieselbe Nebenversion haben. Signalliste und TIA-Variablentabellen bleiben gleich.

**Warum**
Viele Baugruppen waren noch nicht so dargestellt, wie sie real gebaut werden: Teile liefen ineinander,
Leitungen hingen frei in der Luft, Motoren und Ventile waren nur angedeutet.

**Neu**
- **Korb pendelt:** Beim Verfahren des Portals −MM3 schwingt der Korb physikalisch am Bügel (Anfahren und
  Abbremsen), in Luft leicht gedämpft, im Zinn sofort beruhigt.
- **Kabelwanne hinter Band 2:** Gelochte Kabelwanne 60 × 35 auf Bodenstützen und Tankkonsolen statt des
  PVC-Kanals. Alle Leitungen von Band 2, Kühlwassertank, Pumpe und Ventilen liegen darin, jede in einer eigenen
  Spur. Ein Fallstück führt sie am Bandanfang in die Kabelbrücke.
- **Regelventil −MB18** als Siemens VVG44.15-4 mit Stellantrieb SAS61.03 (Maße nach Datenblatt CE1N4581),
  Hubanzeige mit dem echten Hub 5,5 mm.
- **Laufrichtungspfeile** auf dem Gurt des Prüfbands −MA5, sie laufen mit dem Gurt mit.
- **Abdeckkappen** auf allen freien Enden der Aluprofile (automatisch erkannt).

**Geändert**
- **Umwälzpumpe −MA3** als kleine Eintauchpumpe mit Laterne, Motor IEC 63 und Lüfterhaube; Druckleitung über
  ein T-Stück ins Verteilerrohr, Sprühventil −MB13 gedreht.
- **Prüfbandmotor −MA5** als SEW-Stirnradgetriebemotor R07 DRN63.
- **Getriebemotoren:** Typenschild auf glattem Sockel statt zwischen den Kühlrippen.
- **Rollenkurve:** Rundriemen als geschlossene Schlaufen um die Riemenköpfe, eigene Antriebsrille.
- **Keyence-Kamera:** kompaktes Stativ mit Halterwinkel, Ringlicht direkt unter dem Objektiv.
- **Vor-Ort-Steuerstellen:** Gehäuse mittig auf der Säule, Leitung innen.
- **Schaltschrank:** Adern der S7 in die Kanalschlitze, HMI-Leitungen an den Steckern, Türschläuche am Rahmen
  vorbei, Wendekombinationen mit Brückenadern, geschlitzter Türkanal, PROFINET am Umrichter vor dem Leistungsteil.
- **Portal:** Winkelverbinder statt Knotenbleche (die Führungsschienen liefen hindurch), Führungsschienen links
  kürzer (vor den Schlauchleitungen), Anschlüsse von −MM2 vorne statt an der Führungsstange.
- **Umhausung:** obere Profile bis in die Ecken. **Zinnbad:** Abluftrohr mit Rohrbogen.
- **Füllstandsensor −BL2:** kein Flackern mehr, Stecker zur Kabelwanne.

**Behoben**
- Die X-Energiekette konnte beim Verfahren aus manchen Blickwinkeln verschwinden.

## 1.14.1 – 2026-10-07

Nur der Zwilling ändert sich (`web\index.html`). Bridge, Signalliste und TIA-Variablentabellen bleiben gleich,
die Bridge muss nicht neu gebaut werden.

**Warum**
Auf Laptops mit zwei Grafikchips rechnete der Browser auf der Onboard-Grafik, der Zwilling ruckelte dann auch
in niedrigen Stufen. Grafikeinstellungen lagen auf zwei Knöpfen verteilt, und die Seitenleiste verschob beim
Ein- und Ausblenden das 3D-Bild und schnitt beim Forcen die Knöpfe ab.

**Neu**
- **Grafik-Fenster:** Ein Knopf **„Grafik“** unten im 3D-Bild ersetzt „Grafik: Auto“ und „Tiefenschatten“.
  Er öffnet alle Einstellungen: Qualität (Auto/Hoch/Mittel/Niedrig), **Spiegelungen an/aus**, Tiefenschatten
  und die Grafikkarte, auf der der Browser rechnet, mit Warnung bei Onboard-Grafik.
- **Seitenleiste lösen:** Knopf **„Lösen“** oben in der Leiste verschiebt sie in ein eigenes Fenster, z. B. auf
  einen zweiten Bildschirm. Alles bleibt bedienbar (Bedienfeld, Forcen, Diagramm). **„Andocken“** oder
  Schließen des Fensters holt sie zurück.

**Geändert**
- **Seitenleiste** liegt über der 3D-Ansicht statt daneben: Ein- und Ausblenden verändert das 3D-Bild nicht
  mehr. Breite 480 statt 400 px, die Force-Knöpfe im Signalmonitor passen vollständig.
- Überschrift „Zinnbad“ mit Beschreibung oben links im 3D-Bild entfernt.

**Doku**
- Inbetriebnahme: neuer Abschnitt **„Starke Grafikkarte für den Browser einstellen“** für Windows 11 und 10,
  Chrome und Edge, dazu eine Zeile in der Fehlersuche und ein Hinweis bei den Systemvoraussetzungen.
- Bedienung: Grafik-Fenster und Seitenleiste beschrieben.

## 1.14.0 – 2026-10-07

Bridge neu bauen (`Bridge\build.bat`). **TIA-Variablentabellen neu importieren** (jetzt 186 Signale) und in
der Gerätekonfiguration eine 4. Baugruppe DI 32x24VDC HF mit Anfangsadresse 12 ergänzen.

**Warum**
Beim Review des Übungshandbuchs fielen Stellen auf, an denen der Zwilling anders arbeitete, als das Handbuch
lehrt: Wiederanlauf nach Not-Halt, Quittieren, Verriegelung −MM4, Verhalten des G120. Dazu fehlten Geräte,
die das Handbuch braucht (BCD-Anzeige und Daumenradschalter, auslösbarer Motorschutz, Drahtbruch an Analogwerten).

**Geändert (Sicherheit)**
- **Wiederanlaufsperre:** Nach Not-Halt oder Eingriff in den Lichtvorhang laufen Bandmodul, Rollenkurve,
  Band 2, Prüfstation und Portalsteuerung erst nach dem Quittieren **und START −SF1** wieder an. Das gilt
  auch für die Demo-SPS.
- **Überwachter Start:** −KF2 gibt erst beim **Loslassen** des Quittiertasters frei (DIN EN ISO 13849-1).
  Die Demo-SPS merkt sich den Quittierort deshalb vorher.
- **Verriegelung −MM4** in der Demo-SPS positiv formuliert: Schließen nur mit −MM2 oben oder −MM3 über dem
  Band. Ein Drahtbruch an −BG6 gibt nicht mehr frei.

**Neu**
- **BCD-Geräte am Bedienpult:** dreistellige Anzeige −PG1 (`%QW6`, Demo-SPS zeigt die verzinnten Körbe) und
  Daumenradschalter −SF48 für die Tauchzeit (`%IW12`, 4. DI-Baugruppe), je Dekade 8-4-2-1. Im 3D-Pult und in
  der Seitenleiste bedienbar, im Schaltplan auf eigenen Kanälen.
- **Störgrößen unter Prozess:** *Motorschutz −FA1/−FA5/−FA7/−FA8 auslösen* (der Motor steht wirklich) und
  *Drahtbruch −BT1/−BL1/−BT2/−BL2* (die Analogbaugruppe meldet 7FFF = 32767). Analogwerte gehen bis 32511
  in die Übersteuerung.
- **Signalmonitor:** Anzeige von Wörtern und Bytes als Dez, Hex oder Bin, Schalter *Bytes zeigen* mit einer
  Zeile je `%IBn`/`%QBn`.
- **G120:** STW1.10 = 0 lässt den Umrichter mit den zuletzt übernommenen Prozessdaten weiterarbeiten, statt
  abzuschalten. Feldbusüberwachung F01910 mit Schnellhalt AUS3 bei SPS-STOP oder Verbindungsabbruch (LED BF
  blinkt). Warnung A07910 bei heißem Motor setzt ZSW1.7.
- **Grafik:** Hallenkulisse mit umgebender Produktion und HDR-Umgebung (Poly Haven, CC0), weniger Dreiecke
  bei Kabeln und Fasen, Shader werden beim Start vorgezeichnet, damit Umschalten und Türen nicht ruckeln,
  feinere automatische Grafikstufe.

**Geändert**
- Meldetexte: „Kollision: −MM3 fährt nicht …“ statt „Verriegelung: …“, Kühlwasser-Meldung ohne Gedankenstrich.
- Bandmodul und Band 2 im Automatikbetrieb beachten den Motorschutz.

**Doku**
- Übungshandbuch: Hinweise auf Vereinfachungen des Zwillings in L03, L19, L21, L29 entfernt, L09 nutzt die
  BCD-Geräte, L11 den Drahtbruch, L20 den Motorschutz, L33 beschreibt Bit 10 und F01910 wie im Zwilling.
  Schaltplan mit 4. DI-Baugruppe (66 Seiten).
- `docs/02` bis `docs/05`, README: Signalzahl, Adressbelegung, Störgrößen, Signalmonitor, G120,
  PROFINET-Gerätenamen `ta2`…`ta5`, korrigierte Meldungsnamen.

## 1.13.0 – 2026-10-07

Bridge neu bauen (`Bridge\build.bat`): Die Bridge liefert jetzt auch den Ordner `docs/` aus.
Signalliste und TIA-Variablentabellen bleiben gleich. Am 3D-Modell ändert sich nichts.

**Warum**
Das Übungshandbuch lag neben dem Zwilling, war aus ihm heraus aber nicht erreichbar.

**Neu**
- **Knopf „Übungshandbuch“** unten im 3D-Bild: öffnet `docs/uebungshandbuch.html` in einem neuen Tab.

**Geändert**
- **Bridge:** Adressen unter `/docs/` kommen aus dem Doku-Ordner, damit der Knopf auch über
  `http://localhost:8181` funktioniert. Alles außerhalb von `docs/` und `web/` bleibt gesperrt.

**Doku**
- README und Kapitel 07 nennen den neuen Knopf.

## 1.12.0 – 2026-10-07

Bridge neu bauen (`Bridge\build.bat`): Der Code der Bridge hat sich nicht geändert, aber sie trägt die
neue Nebenversion. Signalliste und TIA-Variablentabellen bleiben gleich. Am 3D-Modell ändert sich nichts.

**Warum**
Das Übungshandbuch (`docs/uebungshandbuch.html`) war eine einzige Datei mit 2500 Zeilen und schwer zu pflegen.
Die Skizzen-Editoren hatten Fehler (Rückgängig, Seitenumbruch, Leitungsführung, Druck) und Normabweichungen.
Die Inhalte wuchsen von 32 auf 37 Übungen.

**Neu**
- **Übungshandbuch in Modulen:** Quelltext in `web/tools/uebungshandbuch/src/` (App, Editor-Kern, eine Datei je
  Vorlage), gebündelt mit esbuild. Beschreibung in `src/README.md`.
- **Inhalte:** 37 Übungen, neu L06 bis L11 (Zahlensysteme, Datentypen, Bitmuster, BCD, Vergleichen und Rechnen,
  Analogwert). Die bisherigen L07 bis L32 heißen jetzt L12 bis L37; gespeicherter Fortschritt zieht beim ersten
  Öffnen automatisch um.
- **Mappe „Meine Unterlagen“, Seite „Dein Projekt wächst mit“**, Vorlagen zum Ausfüllen je Übung, Bezüge auf
  frühere Dokumente, gestaffelter Stil-Check, Bewertungsraster je Übungstyp.
- **Skizzen-Editoren:**
  - GRAFCET: „+ Schritt“, Kette ausrichten, Neu nummerieren, Verzweigungen als Schnipsel, Zwangssteuerung,
    Ereignis-Aktion als Fähnchen, Kette durchspielen.
  - Stromlaufplan und Hauptstromkreis: Schaltzeichen nach IEC 60617 mit Anschlussnummern, Kennzeichen je
    Art, Kontaktspiegel und Querverweise, dreipolig verdrahten, Simulation mit Selbsthaltung, Not-Halt und
    Motorschutz, Klemmenplan.
  - Pneumatik: „Antrieb aus der Anlage“ fertig verdrahtet, Simulation mit Drosseln, Entlüftung und
    Weg-Zeit-Diagramm, Steueranschlüsse 14/12/10 nach ISO 11727.
  - Weg-Schritt-Diagramm: Schnelleingabe („MM2−, MM3+ …“), Bedeutung 1/0 je Zeile.
  - Regelkreis: Übertragungsglieder mit Sprungantwort, Bezug zu PID_Compact, Simulation „Ausprobieren“;
    Trend mit Kurve und Toleranzband; Kästchenraster mit echten 5 mm im Druck.
  - Für alle: Knopf „Prüfen“, Wiederholen (Strg+Y), Tastenkürzel („?“), Signalvorschläge aus `signale.csv`.
- **Schaltplan der Anlage** (`#/schaltplan`): 59 Seiten mit allen 162 Signalen, Querverweisen, Kontaktspiegeln,
  Klemmenplan und Betriebsmittelliste; Suche, Zoom, Druck A3 und A4.
- **Prüfwerkzeuge:** `pruefen/tests/lauf.mjs` (112 Verhaltenstests) und `pruefen/pruefen.mjs` (Vorher-nachher-Vergleich).

**Geändert**
- Leitungen in den Editoren laufen nie deckungsgleich und nicht über Kennzeichen oder fremde Klemmen.
- Rückgängig ohne leere Schritte, Esc schließt den Editor nicht mehr, Druck ohne leeres Zusatzblatt, Pfeilspitzen
  im Druck.
- Alle Texte des Handbuchs in Du-Form.

**Sicherheit**
- Gespeicherte und importierte Skizzen werden beim Laden geprüft (Zahlen, Farben, Schlüssel); Eingaben werden
  beim Anzeigen maskiert.

**Doku**
- Doku zweisprachig (`*.en.md`), neues Kapitel `docs/07-uebungshandbuch.md`.

## 1.11.0 – 2026-10-06

Bridge neu bauen (`Bridge\build.bat`): Der Code der Bridge hat sich nicht geändert, aber sie trägt die
neue Nebenversion. Signalliste und TIA-Variablentabellen bleiben gleich (Port-Belegung von −XD3 unverändert).

**Warum**
Zwischen Band 1 und Zinnbad lagen Leitungen und Schläuche frei in der Luft und am Boden, Ventilinsel −QM2 und
Feldverteiler −XD3 saßen hinten schlecht zugänglich, und mehrere Leitungen liefen von oben durch die Abdeckung
der Kabelbrücke.

**Neu**
- **Kabelrinne zwischen Band 1 und Zinnbad:** gelochte Kabelrinne (Stahl bandverzinkt) unten am Bandgestell,
  neben dem Bad 100 × 60, davor über ein Reduzierstück 150 × 60; Wandausleger an den Bandstützen, Bodenstütze
  vor der Umhausungsrückwand, Endstück, Trennsteg (Motorleitung −MA1 getrennt). Querrinne 60 × 60 mit Anbau-T
  unter dem Band zur Portalsäule für die Druckluftversorgung von −QM2. Darin liegen die Leitungen −BG14…−BG17/
  −BG40, die Sammelleitung von −XD3, Multipol und Schläuche von −QM2 und −MA1; keine Leitung kreuzt eine andere.
- **−QM2 und −XD3 vorn** am Bandgestell (Richtung Umhausungsfront, frei zugänglich).
- **Biegeradius Sensorleitungen 2 × D** (PUR, hochflexibel); alle übrigen Leitungen weiter mindestens 5 × D.

**Geändert**
- Sensorleitungen der Schwenkantriebe fallen senkrecht unter ihrem Abgang in ihre Lage der Rinne und steigen
  an −XD3 senkrecht zum Stecker.
- Alle Leitungen gehen neben der Kabelbrücke auf den Boden und seitlich unter der Schräge hinein (Kanal am
  Bandende, Rinne, −BG35 an der Rollenkurve); die Brücke hat 22 statt 20 Lagen.

**Doku**
- `docs/02-anlage.md`: Kabelrinne, Kabelbrücke, Biegeradien, Lage von −XD3.

## 1.10.1 – 2026-10-06

Nur der Zwilling (3D-Modell). Bridge, Signalliste und TIA-Variablentabellen bleiben gleich.

**Warum**
Beim Öffnen und Schließen wäre die Abdeckung −MM4 real durch Sensoren, Leitungen und Anbauteile am
Zinnbad gefahren.

**Geändert**
- **−BG9 Thermoelement und −BG10 Niveauelektrode** waagrecht durch die Rückwand des Bads statt von
  oben; Köpfe, M12-Stecker und Leitungen liegen hinten unterhalb des Randes.
- **Randabsaugung** als Schlitzkanal hinter der hinteren Führungsschiene (stand auf dem Badrand im
  Fahrweg von Schiene und Deckel), Konsolen an der Rückwand, Sammelhaube zum Abluftkanal.
- **Führung der Abdeckung:** Schienen und Endanschläge passend zum Hub 320 mm (die Wagen standen in
  der Endlage „zu“ neben der Schiene, ein Endanschlag im Fahrweg); Mitnehmer an einer Konsole vor der
  Deckelkante (steckte in der Endlage „zu“ in der Badwand), kurzes Ausgleichsstück.
- **−XD2** an der badseitigen Seitenfläche der rechten Portalsäule: Die Leitungen −BG7…−BG10 stiegen
  vor dem Verteiler durch die Ebene des offenen Deckels.

## 1.10.0 – 2026-10-06

Bridge neu bauen (`Bridge\build.bat`): Der Code der Bridge hat sich nicht geändert, aber sie trägt die
neue Nebenversion. Signalliste und TIA-Variablentabellen bleiben gleich.

**Warum**
Wer nur die Förderstrecke programmieren wollte, musste trotzdem die ganze Schrittkette des Portals
schreiben – ohne Verzinnen kommt kein fertiger Korb auf das Band. Und Tauch- und Abtropfzeit standen
fest auf 10 s.

**Neu**
- **Übungsumfang „Verzinnen: Portal −MM1…−MM4“** mit *Portal automatisch* / *SPS steuert*
  (Standard: SPS steuert, bestehende Programme laufen unverändert). Automatisch fährt die
  Portalsteuerung die Schrittkette der Demo-SPS – ohne START und unabhängig von −SA1, sobald −KF2 frei
  ist und ein Korb an −BG40 anliegt; −SA3 HAND schaltet auf die Tipptaster am Türtableau. Die
  Ausgänge −MB1…−MB8 der SPS sind dann ohne Wirkung (Signalmonitor: Quelle „Portal“, die DQ-LEDs
  zeigen weiter, was die CPU schreibt). HMI-Lampe „Portal auto“, Schrittnummer und Weg-Zeit-Diagramm
  laufen mit.
- **Rezept: Tauch- und Abtropfzeit** unter *Prozess* einstellbar (2…30 s, Standard je 10 s). Die
  Demo-SPS und das Portal „automatisch“ halten sie; steuert dein Programm das Portal, misst der
  Zwilling jeden Korb daran (kürzer als Soll − 0,5 s → „Korb mangelhaft“, öfter Ausschuss).

**Doku**
- `docs/03-bedienung.md`: Umschalter Portal, Übergabe Band ↔ Portal (−BG40, −BG1, −BG15, −BG2), Rezept.
- `docs/05-uebungen.md`: Stufe 0 „Nur Förderstrecke“.

## 1.9.0 – 2026-10-06

Bridge neu bauen (`Bridge\build.bat`) und mit der neuen `signale.csv` starten: Der Code der Bridge
hat sich nicht geändert, aber sie trägt die neue Nebenversion. Die TIA-Variablentabellen neu
importieren (Kommentare von −BG15 und −BG40 geändert, Adressen gleich).

**Warum**
Die gefederte Anschlagleiste aus 1.8.0 war so nicht baubar: Hebt das Portal den Korb ab, federt
die Leiste vor und steht dem abgesenkten Korb im Weg. Außerdem liegen die PU-Stoßpuffer unten am
Korb bei geschlossenem Anschlag unter dem Hebel – der Korb lässt sich am Übergabeplatz gar nicht
anheben, solange der Anschlag zu ist, auch nicht bei den 49° des alten Hebels. Und der hintere
Puffer stand 5 mm unter dem Vereinzelerhebel.

**Neu**
- **Anschlag und Vereinzeler mit pneumatischem Schwenkantrieb 90°** (Drehflügel, wie Festo DSM-16)
  statt Kompaktzylinder mit Kulisse: Der Hebel schwenkt senkrecht nach oben und steht dann ganz
  neben dem Korb. Endlagen −BG14…−BG17 über zwei induktive Sensoren M8 an einer Schaltnocke auf der
  Welle, Drosselrückschlagventile direkt am Antrieb, Alu-Konsole an der Profilnut.
- **Feste Anschlagleiste** (PE-UHMW auf Alu-Träger, kein Dämpfer), **−BG40 als induktiver Sensor
  M12 bündig in der Anschlagfläche** vor dem Eckstab des Korbs. Adresse und Name bleiben.
- **Vereinzeler 10 mm weiter zurück** (Anschlagfläche z = −105, wartender Korb bei −160): Der hintere
  Puffer des Korbs am Übergabeplatz kommt beim Anheben am Vereinzelerhebel vorbei.
- **Kollision sichtbar:** Anheben bei geschlossenem −MM5 – der vordere Puffer hängt unter dem Hebel,
  der Korb kippt am Haken nach vorn; ab 10° reißt er den Anschlag ab (Hebel verbogen hochgeklappt,
  ohne Funktion bis „Anlage zurücksetzen“, die Endlagen am Antrieb melden trotzdem „zu“), danach
  pendelt der Korb frei. Absenken auf den geschlossenen −MM5 – der Korb setzt mit dem Puffer auf dem
  Hebel auf und steht schief auf dem Gurt, −MM2 erreicht −BG4 nicht. Beides mit Meldung.

**Geändert**
- Ablauf am Übergabeplatz (Demo-SPS und Bandmodul): Korb an −BG40 → **Band stoppen → Anschlag
  öffnen (−BG15) → einhängen und anheben**. Der fertige Korb wird bei offenem Anschlag abgesenkt und
  fährt ab; erst wenn −MM5 wieder zu ist (−BG14), gibt der Vereinzeler den nächsten Korb frei.
  Solange der Haken im Korb am Übergabeplatz ist, steht das Band.
- Nennschwenkzeit von −MM5/−MM6 im Weg-Zeit-Diagramm 0,3 s.

**Doku**
- `docs/02-anlage.md`: Schwenkhebel-Stopper mit Schwenkantrieb, Puffer und Vereinzeler-Abstand.
- `docs/05-uebungen.md`: Aufgabe 7 um die Übernahme am Übergabeplatz und die Kollisionen ergänzt.
- Bild `10-drosselventile` neu (Drosseln am Schwenkantrieb).

## 1.8.0 – 2026-10-06

Bridge neu bauen (`Bridge\build.bat`) und mit der neuen `signale.csv` starten: Der Code der Bridge
hat sich nicht geändert, aber sie trägt die neue Nebenversion, und erst mit der neuen Signalliste
kennt sie −BG40. Die TIA-Variablentabellen neu importieren (162 Signale).

**Neu**
- **Abfrage „Korb liegt am Anschlag an“ −BG40** (`BG40_Korb_am_Anschlag` %I8.0): Die Lichtschranke
  −BG11 meldet einen Korb schon 55 mm vor dem Anschlag −MM5. Wie lange er bis zum Anschlag braucht,
  hängt von der Bandgeschwindigkeit ab – eine Wartezeit nach −BG11 passt deshalb nie für alle
  Geschwindigkeiten. Jetzt ist die Anschlagleiste gefedert: Der Korb drückt sie um den Resthub von
  3 mm gegen den Stoßdämpfer, eine Schaltfahne auf dem Alu-Träger kommt vor einen induktiven Sensor
  M8 (bündig, sn 1,5 mm) im Haltewinkel auf dem Hebel. −BG40 meldet erst, wenn der Korb wirklich
  anliegt.
- Die Leiste von Anschlag −MM5 und Vereinzeler −MM6 bewegt sich sichtbar mit, die Muttern der
  Führungsbolzen heben dabei vom Hebel ab. Leitung von −BG40 auf dem Hebel zur Drehachse und von dort
  zum Feldverteiler −XD3, Port X4.
- HMI-Bild im Schaltschrank: Lampe −BG40 neben −BG11, „Korb am Übergabeplatz“ zeigt jetzt −BG40.

**Geändert**
- −BG11 heißt in der Signalliste „Lichtschranke Einlauf Übergabeplatz (Korb kommt)“. Adresse und Name
  bleiben gleich.
- Die Demo-SPS startet den Zyklus und hält das Band mit −BG40 statt 1,5 s nach −BG11. Solange
  −BG11 belegt ist und −BG40 noch nicht meldet, fördert das Band weiter. Die Leuchte −PF4 zeigt −BG40.
- **TIA-Programme, die mit −BG11 den Zyklus starten**, laufen weiter, das Portal kann dabei aber
  einen Korb anfahren, der noch rollt. Auf −BG40 umstellen.

**Doku**
- `docs/02-anlage.md`: Anschlagleiste mit −BG40, Sensortabelle, Belegung von −XD3.
- `docs/05-uebungen.md`: Aufgabe 7 um −BG11/−BG40 und eine Einlaufüberwachung ergänzt.
- `docs/01-inbetriebnahme.md`, `docs/04-signale.md`, `README.md`: −BG40, 162 Signale.

## 1.7.0 – 2026-10-06

Bridge neu bauen (`Bridge\build.bat`) und mit der neuen `signale.csv` starten: Der Code der Bridge
hat sich nicht geändert, aber sie trägt die neue Nebenversion, und erst mit der neuen Signalliste
kennt sie die Signale des Kühlwassertanks. Die TIA-Variablentabellen neu importieren (161 Signale).

**Neu**
- **Füllstandsmessung und Nachspeisung des Kühlwassertanks** der Sprühkühlung: Das Abschrecken
  verbraucht Wasser (Sprühnebel, nasse Körbe, Verdampfung an heißen Körben), unter 8 % läuft die
  Pumpe −MA3 trocken und es kommt kein Sprühwasser mehr.
- Sensoren von Endress+Hauser: Radar **Micropilot FMR20B** −BL2 im Deckel (stetiger Füllstand,
  `BL2_Wasserstand` %IW72) und zwei Vibrations-Grenzschalter **Liquiphant FTL31** an der Rückwand:
  −BG38 MIN 25 % (`BG38_Wasser_Min` %I11.5, Trockenlaufschutz) und −BG39 MAX 90 %
  (`BG39_Wasser_Max_frei` %I11.6, 1 = frei, Ruhestromprinzip). Dazu ein Schauglas-Standrohr mit
  Wassersäule.
- Frischwasser-Fallleitung mit Kugelhahn, **Magnetventil −MB17** (`MB17_Nachspeisen` %Q5.4, hinter
  −KF2) und **Regelventil −MB18** in Reihe (`MB18_Regelventil` %QW80, Stellzeit 8 s,
  Stellungsrückmeldung `MB18_Stellung` %IW74, Stellungsanzeige am Joch).
- Neue Baugruppe **AQ 4xU/I ST** im Schaltschrank, AI 8 mit beschrifteten Kanälen BT1…MB18.
- Übungsumfang **Kühlwassertank: Nachspeisung**: *Niveauregler automatisch* (55…75 %, Pumpe unter
  −BG38 gesperrt) oder *SPS regelt*. Die Demo-SPS regelt mit einem PI-Regler auf 70 %.
- **Ablasshahn** als Störgröße (Seitenleiste *Prozess* oder Klick in 3D), Anzeige Kühlwasser −BL2
  mit Min-/Max-Marken, Ventilstellungen, Zulauf und Verbrauch live; Kühlwasser im HMI-Bild.
- Meldungen: Pumpe läuft trocken, Trockenlaufschutz hat gesperrt, Tank läuft über, −MB17 offen bei
  Regelventil 0 %.
- Neue Ansicht „Kühlwassertank · Nachspeisung“.

**Doku**
- `docs/04-signale.md`: Abschnitt „Kühlwassertank: Füllstand und Nachspeisung“, Adressbelegung.
- `docs/05-uebungen.md`: Aufgaben 21–24 zur Füllstandsregelung (Zweipunkt mit Grenzschaltern,
  Hysterese auf den Analogwert mit Plausibilität, PID_Compact, Ventil- und Zulaufüberwachung).
- `docs/02-anlage.md`, `docs/03-bedienung.md`: Tank, Signale, AQ-Baugruppe, Übungsumfang, Regelstrecke.
- Bilder: neu Kühlwassertank, Schaltschrank neu aufgenommen (AQ 4).

## 1.6.0 – 2026-10-05

Bridge neu bauen (`Bridge\build.bat`) und mit der neuen `signale.csv` starten: Der Code der Bridge
hat sich nicht geändert, aber sie trägt die neue Nebenversion, und erst mit der neuen Signalliste
kennt sie die Telegrammwörter der Umrichter.

**Neu**
- Band 1, Band 2, Rollenkurve und Prüfband wahlweise an **Frequenzumrichtern −TA2…−TA5**
  (SINAMICS G120, PROFINET, Standardtelegramm 1) statt an ihren Schützen: Umschalter je Antrieb unter
  *Übungsumfang → Antriebe*. Ein Technologieobjekt `TO_SpeedAxis` fährt jeden Förderer wie einen
  echten G120. Am Prüfband ist die negative Drehrichtung gesperrt (p1110).
- Umrichtermodell mit PROFIdrive-Zustandsmaschine (S1…S5), AUS1/AUS2/AUS3, Hochlaufgeber,
  Sollwertinvertierung, STO über Not-Halt −KF2 sowie den Störungen F30005 und F07011 mit Quittierung.
- Vier Umrichter im Schaltschrank (je PM240-2 FSA, CU240E-2 PN, Bedienpanel IOP-2) mit Live-Display,
  LEDs RDY/BF/SAFE und Kennzeichnungsschild, anklickbar.
- Fenster **Umrichter** (−TA2…−TA5 wählbar): Gerätefront mit bedienbarem Bedienpanel (HAND/AUTO,
  I/O, Drehrad, ESC, INFO, Quittieren), STW1/ZSW1 Bit für Bit, NSOLL_A/NIST_A in Hex, Prozent und
  1/min sowie **Rampen live** (Sollwert, wirksamer Sollwert, Istdrehzahl über 10/20/60 s).
- Der Umrichter läuft in jedem Übungsumfang: Bei *Bandmodul automatisch* (und in der Demo) führt
  ihn das Bandmodul über dasselbe Telegramm, bei *SPS steuert* dein Programm, in HAND das Panel.
- Signale `TA2_…` bis `TA5_…` (STW1, NSOLL_A, ZSW1, NIST_A auf `%QW/%IW256…270`) in
  `signale.csv` und in beiden TIA-Variablentabellen. Die Demo-SPS fährt alle vier Förderer auch über
  die Umrichter.
- **Vor-Ort-Steuerstelle −S50** am Prüfband: Schlüssel −SA7, EIN −SF45 / AUS −SF46, Drehzahl-
  potentiometer −SF47 (%IW70, 0…100 %, wirkt am Umrichter −TA5), Leuchte −PF16; in 3D und in der
  Seitenleiste bedienbar, Vorrang vor −S40. Die Demo-SPS wertet sie aus.
- Signalmonitor zeigt Wortausgänge an, Steuer- und Zustandswörter in Hex.
- **Tiefenschatten** (Ambient Occlusion, GTAO aus three.js r170) zuschaltbar über den Knopf unten in der
  3D-Ansicht; Zustand wird im Browser gemerkt, Standard aus.

**Geändert**
- Rohre, Schläuche und Kabel: Dreiecke mit richtigem Umlaufsinn – sichtbar ist jetzt die Außenseite
  (vorher die Innenseite der hinteren Wand), Leitungen erscheinen in ihrer echten Farbe.
- Drehpotentiometer in 3D: ziehen oder Mausrad (5 %), der Wert steht neben dem Mauszeiger.
- Untere Leiste etwas kompakter, damit der neue Knopf Platz hat.
- Neue Ansicht „Vor-Ort −S50 Prüfband“.

**Doku**
- `docs/04-signale.md`: Abschnitt „Umrichter und Technologieobjekt“ mit Projektierung in TIA.
- `docs/05-uebungen.md`: Aufgaben 17–20 zur Antriebstechnik.
- `docs/02-anlage.md`: Umrichter −TA2…−TA5 in der Belegung des Schaltschranks, Signale von −S50.
- `docs/03-bedienung.md`: Vor-Ort-Steuerstelle −S50.
- Bilder neu: Gesamtanlage, Schaltschrank, Prüfstation; dazu Umrichter-Fenster, Umrichter im Schrank
  und −S50. Neues Werkzeug `node tools\doku-bilder.mjs` nimmt sie neu auf.

## 1.5.0 – 2026-10-05

Bridge neu bauen (`Bridge\build.bat`): Sie hat sich nicht geändert, trägt aber die neue
Nebenversion – sonst meldet der Zwilling beim Verbinden einen Versionsunterschied.

**Neu**
- Kabel und Schläuche sind rund verlegt: Jede Ecke ist ein echter Bogen mit mindestens 5 × Außen-
  durchmesser statt eines Knicks, der Querschnitt ist rund, kurze Versätze laufen als flaches S.
- An den Feldverteilern −XD1, −XD2, −XD3 und −XD5 laufen die Sensorleitungen als geordnetes Bündel
  senkrecht vor dem Verteiler und biegen jede in ihrer eigenen Lage gerade in den Stecker – keine
  Schlaufen und Kreuzungen mehr.
- Gewinkelte M12-Stecker, wo hinter dem Stecker kein Platz für einen Bogen ist (Lichtschranken,
  Drehgeber, −BG37, Multipol −QM4).
- Schlitten und Hubteil überarbeitet: Schlittenplatte, Konsole und Z-Grundplatte als geschlossener
  Kasten, stehende Hub-Energiekette in einer Rinne an der Grundplatte, Mitnehmerschwert am Haken.

**Geändert**
- Leitungswege neu geführt: Kettenleitungen durch eine Kabeltülle im Wannenboden zu −XD1,
  −MM3-/−MM4-Schläuche ohne kurze Versätze, Druckluft-Fallleitungen fluchtend mit der Wartungseinheit,
  Ventilinsel −QM4 30 mm höher, Kabelkanal an der rechten Portalsäule endet über −XD2, Schläuche zum
  Luftmesser Ø8.

**Doku**
- `docs/06-entwicklung.md`: Abschnitt „Leitungen verlegen“; neues Prüfwerkzeug
  `node tools\biegung.mjs` listet Bögen unter dem Mindestbiegeradius.

## 1.4.0 – 2026-10-05

Bridge neu bauen (`Bridge\build.bat`): Die Nebenversion hat sich geändert, und die Bridge liest
Kommentare mit Semikolon jetzt vollständig.

**Neu**
- Englische Oberfläche: Umschalter DE/EN oben in der Seitenleiste (lädt die Seite neu). Übersetzt
  sind Seitenleiste, Fenster, Meldungen, 3D-Beschriftungen, HMI-Bild und Signalkommentare. Ohne
  gespeicherte Wahl richtet sich die Sprache nach dem Browser.
- Englische TIA-Variablentabelle `TIA/PLC_Tags_Tinning_EN.xlsx`: dieselben 134 Signale und Adressen
  mit englischen Namen (Kennzeichen vorn, z. B. `MB1_HookIn`, `BG11_Basket`) und Kommentaren.
- Der Signalmonitor zeigt in der englischen Oberfläche die englischen Variablennamen; der interne
  Name aus `signale.csv` steht im Tooltip, die Suche findet beide.

**Behoben**
- `signale.csv` ist Excel-fest: Kommentare beginnen nicht mehr mit `-` (Excel machte daraus
  `#NAME?`), das Kennzeichen steht jetzt hinter dem Begriff („Tauchzylinder -MM2: senken“).
  Semikolons in Kommentaren durch Kommas ersetzt.
- Bridge: Ein Semikolon im Kommentar schnitt bisher alles davor ab (z. B. bei −BG20).

**Doku**
- Klargestellt: Fest sind nur die Namen in `signale.csv`; die Namen im TIA-Projekt sind frei, weil
  die Bridge über die Adressen koppelt.

## 1.3.1 – 2026-10-05

**Geändert**
- Fahrzeiten und Messlinien beziehen sich auf die Endlagensensoren (Sensor verlassen bis anderen
  Sensor erreicht) – genau die Zeit, die auch das SPS-Programm sieht. Vorher rasteten die Linien
  kurz vor dem Hubende ein, das wegen der Endlagendämpfung deutlich später liegt.
- Die Versionswarnung kommt nur noch, wenn sich Haupt- oder Nebenversion von Zwilling und Bridge
  unterscheiden; Fehlerbehebungen (x.y.**z**) brauchen keine neu gebaute Bridge.
- Doku: Weg-Zeit-Diagramm, Drosseln und zwei neue Übungsaufgaben (Überwachungszeiten auslegen,
  Taktzeit optimieren), Bilder 09 und 10.

## 1.3.0 – 2026-10-05

**Neu**
- Weg-Zeit-Diagramm mit allen sieben Zylindern (−MM1…−MM6, −MM8) statt nur −MM1…−MM4.
- Großes Diagrammfenster (verschiebbar, in der Größe ziehbar): Zeitfenster 5…120 s, Anhalten und
  Zurückblättern, zwei Messlinien mit Δt, die an Bewegungsanfang und -ende einrasten
  (ab 1.3.1 an den Endlagensensoren).
- Drosselrückschlagventile an jedem Zylinder, Ausfahren und Einfahren getrennt einstellbar
  (0…100 %, 0 % = Zylinder steht), mit Richtwert und gemessener Fahrzeit je Richtung. Die Ventile
  sitzen sichtbar an den Zylinderanschlüssen; ein Klick darauf öffnet die Einstellung.

**Geändert**
- Der Regler „Zylindergeschwindigkeit“ heißt jetzt „Geschwindigkeit aller Zylinder“ und wirkt auch auf
  −MM5/−MM6.

## 1.2.2 – 2026-10-05

**Neu**
- Die Anlage läuft weiter, wenn das Browserfenster minimiert oder verdeckt ist. Damit lässt sich auf
  einem einzigen Monitor im TIA Portal beobachten, während der Zwilling im Hintergrund die Eingänge
  der virtuellen CPU stellt.
- Grundstellungsfahrt der Demo-Schrittkette: Steht die Anlage beim START nicht in Grundstellung
  (nach Handbetrieb, Umschalten der Betriebsart oder abgebrochenem Zyklus), fährt sie zuerst zurück
  (Schritte 11–14) und arbeitet dann normal weiter.
- Verständliche Meldung statt grauer Fläche, wenn Browser oder Grafiktreiber kein WebGL 2 bieten
  oder der Start aus einem anderen Grund scheitert. Nach einem Reset des Grafiktreibers wird die
  3D-Darstellung von selbst wiederhergestellt; die Anlage rechnet in der Zwischenzeit weiter.
- Versionsnummer im Zwilling und in der Bridge; Warnung, wenn beide nicht zusammenpassen.

**Behoben**
- Demo-Schrittkette blieb nach Handbetrieb oder nach dem Wechsel PLCSIM → Demo dauerhaft in Schritt 1
  stehen. Beim Umschalten auf Handbetrieb öffnete außerdem der Vereinzeler −MM6 sofort und ließ den
  nächsten Korb unter den belegten Haken rollen.
- Geforcte Eingänge waren nach jedem Neuverbinden der Bridge im Signalmonitor nicht mehr markiert,
  wirkten aber weiter.
- Mehrere Registerkarten: Eine Registerkarte im Demo-Modus konnte die Steuerung übernehmen, ohne
  Eingänge zu senden. Jetzt steuert immer die zuletzt geöffnete Registerkarte im Modus PLCSIM.
- Bei weniger als 20 Bildern je Sekunde lief die Anlage langsamer als die Uhr der SPS; Überwachungszeiten
  im SPS-Programm liefen dadurch zu früh ab. Jetzt hält sie bis etwa 4 Bilder je Sekunde Schritt.
- Rücksetzen mit einem Werker im Lichtvorhang löste sofort wieder Not-Halt aus.
- Fiel ein Teil neben den Trichter, kam die Prüfmeldung für diesen Korb nie.
- Entfernte Körbe gaben ihren Grafikspeicher nicht frei; bei den Grafikstufen Mittel und darunter
  wurde die Anlage dadurch über Stunden langsamer.

**Sicherheit**
- Die Bridge nimmt WebSocket-Verbindungen nur noch vom Zwilling an (über `http://localhost:<Port>`
  oder per Doppelklick geöffnet). Andere Webseiten, die im selben Browser offen sind, können keine
  Eingänge mehr in die SPS schreiben. Nachrichten über 1 MB trennen die Verbindung.

**Geändert**
- Schriften (IBM Plex) sind in `web/index.html` eingebettet statt von Google Fonts geladen: Der
  Zwilling sieht auch ohne Internet gleich aus und nimmt keine Verbindung nach außen auf.
