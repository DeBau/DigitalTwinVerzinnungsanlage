# Übungsaufgaben

Der Zwilling ist in Stufen schaltbar: Du entscheidest, welchen Teil der Anlage dein Programm
übernimmt und welchen das Modell selbst fährt. So fängt ein Anfänger mit der Schrittkette an,
während ein Fortgeschrittener an derselben Anlage Handshakes, Regelung und Ausschussbehandlung
programmiert.

[◀ Zurück zur Übersicht](../README.md)

## Stufen (Umschalter „Übungsumfang“ in der Seitenleiste)

| Stufe | Dein Programm macht | Das Modell macht |
|---|---|---|
| **1 – Nur Verzinnen** | Schrittkette −MM1…−MM4, Betriebsarten, Meldeleuchten | Band, Rollenkurve, Band 2, Kühlung, Prüfstation, Temperaturregelung |
| **2 – + Förderstrecke** | zusätzlich Band 1, Anschlag, Vereinzeler, Rollenkurve, Band 2, Kippmulde, Prüfstation, Vor-Ort-Steuerstellen | Temperaturregelung |
| **3 – + Zinnbad** | zusätzlich Heizung −TB1 und Nachfüllen −MB11 aus Analogwerten | nichts mehr – die ganze Anlage hängt an deinem Programm |

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
   Übergabeplatz fördern.

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

## Was der Zwilling selbst meldet

Die Ereignisliste in der Seitenleiste ist ein Korrektiv, kein Logbuch: Sie nennt Fehlverhalten im
Klartext – hängender Korb an einer Übergabe (>4 s), Gutteil ausgeblasen, n.i.O.-Teil im KLT,
KLT übervoll, Korb nicht abgeblasen, Zinn nicht auf Temperatur. Das Weg-Zeit-Diagramm zeichnet alle
sieben Zylinder mit Schrittnummern mit und misst je Zylinder und Richtung die Fahrzeit zwischen den
Endlagensensoren.
