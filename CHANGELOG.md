# Änderungen

Alle nennenswerten Änderungen am Zwilling und an der Bridge. Die Version steht im Zwilling oben in
der Seitenleiste und in der Kopfzeile der Bridge-Konsole. Zwilling und Bridge sollten immer dieselbe
Version haben, sonst meldet der Zwilling das in der Ereignisliste.

[◀ Zurück zur Übersicht](README.md)

## 1.3.0 – 2026-10-05

**Neu**
- Weg-Zeit-Diagramm mit allen sieben Zylindern (−MM1…−MM6, −MM8) statt nur −MM1…−MM4.
- Großes Diagrammfenster (verschiebbar, in der Größe ziehbar): Zeitfenster 5…120 s, Anhalten und
  Zurückblättern, zwei Messlinien mit Δt, die an Bewegungsanfang und -ende einrasten.
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
