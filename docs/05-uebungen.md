# Übungsaufgaben

Der Zwilling ist in Stufen schaltbar: Du entscheidest, welchen Teil der Anlage dein Programm
übernimmt und welchen das Modell selbst fährt. So fängt ein Anfänger mit der Schrittkette an,
während ein Fortgeschrittener an derselben Anlage Handshakes, Regelung und Ausschussbehandlung
programmiert.

[◀ Zurück zur Übersicht](../README.md)

## Stufen (Umschalter „Übungsumfang“ in der Seitenleiste)

| Stufe | Dein Programm macht | Das Modell macht |
|---|---|---|
| **0 – Nur Förderstrecke** | Band 1, Anschlag, Vereinzeler, Rollenkurve, Band 2, Kippmulde, Prüfstation (Übungsumfang *Portal automatisch*, *Band: SPS steuert*) | Verzinnen (Schrittkette −MM1…−MM4), Temperaturregelung |
| **1 – Nur Verzinnen** | Schrittkette −MM1…−MM4, Betriebsarten, Meldeleuchten | Band, Rollenkurve, Band 2, Kühlung, Prüfstation, Temperaturregelung |
| **2 – + Förderstrecke** | zusätzlich Band 1, Anschlag, Vereinzeler, Rollenkurve, Band 2, Kippmulde, Prüfstation, Vor-Ort-Steuerstellen; Band 1, Band 2, Rollenkurve und Prüfband wahlweise über Schütz oder Umrichter (Telegramm 1) | Temperaturregelung, Nachspeisung Kühlwasser |
| **3 – + Zinnbad und Kühlwasser** | zusätzlich Heizung −TB1 und Nachfüllen −MB11 aus Analogwerten, Nachspeisung des Kühlwassertanks −MB17/−MB18 | nichts mehr – die ganze Anlage hängt an deinem Programm |

Die Nachspeisung des Kühlwassertanks lässt sich auch einzeln auf *SPS regelt* stellen – gut als
eigene Regelungsübung neben einer automatisch laufenden Anlage (Aufgaben 21–24).

## Aufgaben nach Schwierigkeit

### Einstieg

1. **Grundstellung und Freigabe.** Anlage nur starten, wenn alle Zylinder in Grundstellung stehen
   (−BG2, −BG4, −BG5, −BG8), Temperatur (−BG9) und Füllhöhe (−BG10) in Ordnung sind und
   −KF2 Freigabe meldet. Meldeleuchten −PF1…−PF4 bedienen.
2. **Schrittkette Verzinnen.** Korb einhängen, anheben, zum Bad verschieben, Bad öffnen, tauchen,
   abtropfen, Bad abdecken, zurück, absetzen, lösen.
3. **Betriebsarten.** −SA1 AUTO (Zyklus um Zyklus bis STOP, laufender Korb wird fertig) und
   EINZEL (ein Zyklus je START).

### Aufbaustufe

4. **Handbetrieb.** −SA3 auf HAND: Schrittkette ruht, Taster am Türtableau fahren die Zylinder im
   Tippbetrieb – mit Verriegelungen (−MM3 nur mit angehobenem Korb, Lösen nur abgesenkt über dem Band).
5. **Not-Halt-Diagnose.** Aus den Meldekontakten `SFx_NotHalt_frei` den Erstwert bilden: Welcher
   Taster hat ausgelöst, wo wurde quittiert? Leuchttaster −PF5, −PF12…−PF15 blinken lassen.
6. **Band mit Vor-Ort-Steuerstelle.** −SA2 schaltet auf Vor-Ort um, Rechts/Links/Halt mit
   Selbsthaltung und gegenseitiger Verriegelung, Leuchte −PF6, Motorschutz −FA1 auswerten.
7. **Anschlag und Vereinzeler.** Körbe stauen, einzeln freigeben, nächsten Korb an den
   Übergabeplatz fördern. −BG11 meldet nur „Korb kommt“ (55 mm vor dem Anschlag), erst −BG40
   „Korb liegt an“ – die Kette auf −BG40 weiterschalten, nicht auf eine Wartezeit nach −BG11
   (die passt nur für eine Bandgeschwindigkeit). Einlaufüberwachung: Kommt nach −BG11 nicht
   innerhalb von 3 s −BG40, Störung „Korb klemmt“ melden und das Band anhalten.
   Übernahme am Übergabeplatz: **Band stoppen, Anschlag −MM5 öffnen (−BG15), erst dann
   einhängen und anheben**; der fertige Korb wird bei offenem Anschlag abgesenkt, danach fährt
   er ab, der Anschlag schließt (−BG14) und erst dann gibt der Vereinzeler den nächsten Korb
   frei. Wer bei geschlossenem Anschlag anhebt, sieht den Korb mit dem Puffer unter dem Hebel
   hängen und kippen – und reißt den Anschlag ab (bis „Anlage zurücksetzen“ ohne Funktion, die
   Endlagen am Schwenkantrieb melden trotzdem „zu“). Wer auf den geschlossenen Anschlag absenkt,
   setzt den Korb schief auf; −MM2 erreicht −BG4 nicht.

### Fortgeschritten

8. **Übergabe-Handshake.** Band 1 → Rollenkurve → Band 2 → Kippmulde. An jeder Stoßstelle liegt der
   Korb auf beiden Förderern und bewegt sich nur, wenn beide in dieselbe Richtung laufen. Zwischen
   den Lichtschranken einer Übergabe liegt eine Lücke von 22…35 mm – mit Nachlaufzeit oder Merker
   überbrücken.
9. **Positionieren über den Inkrementalgeber.** −BG18 (Band 1) bzw. −BG27 (Band 2) mit
   Hochgeschwindigkeitszähler statt Lichtschranken auswerten: 10 Impulse/Umdrehung, 24,5 mm je Impuls,
   Spur A/B für die Richtung, Nullimpuls als Referenz.
10. **Abschrecken.** Pumpe −QA7 vor Ventil −MB13, am Kühlplatz warten, bis Pyrometer −BT2 unter
    60 °C meldet, danach Luftmesser −MB14 nur solange der Korb im Bereich ist.
11. **Temperaturregelung.** Heizung −TB1 aus −BT1 regeln: Zweipunkt mit Hysterese, Impuls/PWM oder
    `PID_Compact`. Strecke: Heizelement PT1 6 s → Bad PT1 150 s, 100 % ergibt 360 °C, für 280 °C
    sind rund 76 % nötig. Jedes Tauchen kühlt um 5 K.
12. **Ausschussbehandlung.** Kamera −KF10 triggern (−BG32), Ergebnis i.O./n.i.O. innerhalb von 0,3 s
    übernehmen, n.i.O.-Teil mit −MB16 nach Laufzeit ausblasen, KLT-Wechsel bei −BG34.

### Diagnose und Störungen

13. Im Signalmonitor **−BG7 auf 0 forcen** → das Programm muss in Schritt „Bad öffnen“ warten und
    nach Überwachungszeit melden.
14. **Überwachungszeiten auslegen.** Im Weg-Zeit-Diagramm („Groß öffnen“) die Fahrzeit jedes
    Zylinders mit den Messlinien ausmessen und daraus die Überwachungszeiten der Schrittkette
    ableiten. Danach die Drossel eines Zylinders zudrehen (0 % = Zylinder steht) oder stark
    drosseln → dein Programm muss die Störung mit Zylinder und Richtung melden.
15. **Motorschutz** auslösen, **Lichtvorhang −BG20** unterbrechen (Person durchlaufen lassen),
    **Heizung aus** → unter 250 °C fällt −BG9 ab, kein neuer Start.
16. **Taktzeit optimieren.** Drosseln so einstellen, dass die Zykluszeit sinkt, ohne dass ein
    Zylinder hart in die Endlage schlägt oder sich Bewegungen überschneiden. Ergebnis mit den
    Messlinien (Schrittwechsel 2 bis Schrittwechsel 1) belegen.

### Antriebstechnik

17. **Förderstrecke am Umrichter.** Unter *Übungsumfang → Antriebe* Band 1, Rollenkurve und Band 2
    auf *Umrichter* stellen und jeden Förderer über ein `TO_SpeedAxis` mit Standardtelegramm 1 fahren
    (Projektierung in [Signale und TIA-Anbindung](04-signale.md#umrichter-und-technologieobjekt)):
    `MC_Power`, `MC_MoveVelocity`, `MC_Halt`. An den Übergaben bewegt sich ein Korb nur so schnell wie
    der langsamere Förderer – Geschwindigkeiten aufeinander abstimmen, Rückwärtslauf über negative
    Geschwindigkeit. Rampen im Fenster *Umrichter* unter *Rampen live* prüfen.
18. **Telegramm von Hand.** Dasselbe ohne Technologieobjekt: STW1 und NSOLL_A selbst bilden, ZSW1
    auswerten (Einschaltsperre → `16#047E`, dann `16#047F`). Im Fenster *Umrichter* Bit für Bit
    mitverfolgen.
20. **Prüfband mit variabler Geschwindigkeit.** Vor-Ort-Steuerstelle −S50 auswerten: Schlüssel −SA7,
    EIN/AUS mit Selbsthaltung, Drehzahl vom Potentiometer −SF47 (%IW70, 0…27648) als NSOLL_A an
    −TA5 (`16#4000` = 100 %). Die Ausblaszeit der n.i.O.-Teile aus NIST_A berechnen statt aus einer
    festen Laufzeit (200 mm von der Kamera bis zur Düse).
19. **Antriebsstörungen.** Im Fenster des Umrichters *Störung Überlast* und *Motor überhitzt*
    auslösen, Not-Halt drücken (STO) und am Bedienpanel auf HAND schalten (ZSW1.9 fällt ab). Dein Programm meldet Störung (ZSW1.3) und Einschaltsperre
    (ZSW1.6) und quittiert mit `MC_Reset` bzw. STW1.7 – F07011 erst, wenn der Motor abgekühlt ist.

### Füllstandsregelung Kühlwassertank

Übungsumfang *Kühlwassertank: Nachspeisung → SPS regelt*. Gerätedaten und Regelstrecke in
[Signale und TIA-Anbindung](04-signale.md#kühlwassertank-füllstand-und-nachspeisung). Den Ablasshahn
als Störgröße nutzen, damit die Regelung etwas zu tun hat.

21. **Zweipunkt mit Grenzschaltern.** −MB17 öffnen, sobald −BG38 abfällt, schließen, wenn −BG39
    abfällt (0 = voll); −MB18 dafür fest auf 100 % (`27648` auf %QW80). Pumpe −QA7 nur mit −BG38
    freigeben (Trockenlaufschutz). Drahtbruch prüfen: −BG39 im Signalmonitor auf 0 forcen – dein
    Programm darf dann nicht mehr nachspeisen und soll eine Störung melden.
22. **Analogwert und Hysterese.** −BL2 mit `NORM_X`/`SCALE_X` in Prozent umrechnen, Zweipunktregler
    mit Hysterese 60/80 % auf den Analogwert. Die Grenzschalter bleiben als unabhängige
    Sicherheitsebene darüber. Plausibilität: −BL2 über 95 %, aber −BG39 noch frei (oder −BL2 unter
    20 % und −BG38 bedeckt) → Messung gestört, Meldung ausgeben (mit Forcen von −BL2 testen).
23. **Stetige Regelung mit PID_Compact.** Sollwert 70 %, Istwert −BL2, Stellwert `Output_PER` auf
    −MB18 (%QW80); −MB17 als Freigabe (zu bei −BG39 = 0 oder Not-Halt). Erst nur mit P-Anteil fahren
    und die bleibende Regelabweichung bei offenem Ablasshahn beobachten, dann mit I-Anteil. Die
    Strecke ist integrierend – warum reicht ohne Störgröße ein P-Regler? Selbstoptimierung ausprobieren.
24. **Ventil und Zulauf überwachen.** Stellungsrückmeldung −MB18 (%IW74) mit dem Stellwert
    vergleichen: Abweichung über 10 % länger als 15 s → „Regelventil klemmt“. Ist −MB17 offen und
    steigt der Pegel in 20 s nicht um 1 %, fehlt Frischwasser → Meldung und Nachspeisung abschalten.

## Was der Zwilling selbst meldet

Die Ereignisliste in der Seitenleiste ist ein Korrektiv, kein Logbuch: Sie nennt Fehlverhalten im
Klartext – hängender Korb an einer Übergabe (>4 s), Gutteil ausgeblasen, n.i.O.-Teil im KLT,
KLT übervoll, Korb nicht abgeblasen, Zinn nicht auf Temperatur, Pumpe läuft trocken, Kühlwassertank
läuft über, −MB17 offen bei geschlossenem Regelventil. Das Weg-Zeit-Diagramm zeichnet alle
sieben Zylinder mit Schrittnummern mit und misst je Zylinder und Richtung die Fahrzeit zwischen den
Endlagensensoren.
