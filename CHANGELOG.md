# Änderungen

Alle nennenswerten Änderungen am Zwilling und an der Bridge. Die Version steht im Zwilling oben in
der Seitenleiste und in der Kopfzeile der Bridge-Konsole. Zwilling und Bridge sollten dieselbe
Haupt- und Nebenversion haben (z. B. 1.4.x), sonst meldet der Zwilling das in der Ereignisliste.

[◀ Zurück zur Übersicht](README.md)

## 1.5.0 – 2026-10-05

Bridge neu bauen (`Bridgebuild.bat`): Sie hat sich nicht geändert, trägt aber die neue
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
  `node toolsbiegung.mjs` listet Bögen unter dem Mindestbiegeradius.

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
