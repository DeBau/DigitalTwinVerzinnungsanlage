# Signale und TIA-Anbindung

Der Zwilling kennt **134 Signale**: 92 Eingänge (davon 3 Analogwerte) und 42 Ausgänge. Sie sind die
einzige Schnittstelle zwischen deinem Programm und dem Modell – kein proprietäres Protokoll, keine
Bausteinbibliothek, keine Lizenzdatei.

[◀ Zurück zur Übersicht](../README.md)

![Signalmonitor](bilder/08-signalmonitor.jpg)

## Eine Datei, eine Wahrheit: `signale.csv`

```
Name;Adresse;Kommentar
SF1_Start;%I0.0;Taster START (Schliesser)
MB1_Einhaengen;%Q0.0;-MM1 Einhaengezylinder: Korb einhaengen
BT1_Temperatur;%IW64;Zinntemperatur analog 0...27648 = 0...400 Grad C
```

- **Namen bleiben wie geliefert.** Der Zwilling erkennt jedes Signal an seinem Namen.
- **Adressen sind frei.** Passen die Adressen deiner Hardware-Konfiguration nicht, änderst du nur
  die mittlere Spalte – weder Bridge noch Browser müssen neu gebaut werden.
- Die Bridge liest die Datei beim Start und schickt die Liste an den Browser. Findet der Zwilling
  einen erwarteten Namen nicht, meldet er das in der Ereignisliste statt still falsch zu laufen.

## Adressbelegung

| Bereich | Adressen | Inhalt |
|---|---|---|
| Digitale Eingänge | `%I0.0 … %I11.7` | Endlagen, Lichtschranken, Taster, Wahl- und Schlüsselschalter, Motorschutz-Hilfskontakte, Not-Halt-Meldekontakte, Rückmeldung Sicherheitsrelais |
| Digitale Ausgänge | `%Q0.0 … %Q5.2` | Ventilspulen, Wendeschütze, Heizung, Pumpe, Vibrorinne, Prüfband, Ausblasdüse, Melde- und Leuchttaster |
| Analoge Eingänge | `%IW64`, `%IW66`, `%IW68` | Zinntemperatur −BT1 (0…400 °C), Füllstand −BL1 (0…100 %), Korbtemperatur −BT2 (0…400 °C) – jeweils 0…27648 |

## Was die Bridge tut

```
Browser  ──WebSocket──►  ZwillingBridge.exe  ──Runtime-API──►  virtuelle S7-1500
   Eingänge als Block                           WriteInputArea
   Ausgänge als Block  ◄──────────────────────  ReadOutputArea
```

- Prozessabbild **blockweise** statt Signal für Signal – ein Durchlauf je CPU-Zyklus.
- `start.bat` setzt die **Mindestzykluszeit** der virtuellen CPU (Vorgabe 10 ms). Der TIA-Standard von
  100 ms macht aus jedem Tastendruck bis zu 200 ms Verzögerung; mit 10 ms reagiert die Anlage sofort.
- Mehrere offene Registerkarten: nur die **zuletzt geöffnete im Modus PLCSIM** schreibt Eingänge,
  die anderen beobachten. Sonst würden sich zwei Zwillinge gegenseitig überschreiben und jedes Bit
  zappeln. Eine Registerkarte im Demo-Modus übernimmt die Steuerung nie.
- Verbinden darf sich nur der Zwilling selbst (über `http://localhost:<Port>` oder per Doppelklick
  geöffnet). Andere Webseiten im Browser weist die Bridge ab und meldet das in der Konsole.

## Signalmonitor im Browser

Die Seitenleiste zeigt jedes Signal mit Name, Adresse und Live-Zustand. Jeder Eingang lässt sich
auf **0** oder **1 forcen** – damit prüfst du Verriegelungen und Fehlerwege, ohne die Anlage in
die passende Lage zu fahren. **A** gibt das Signal wieder ans Modell zurück.

## Schließer und Öffner

Drahtbruchsicher verdrahtet, also **1 = nicht betätigt**:

| Signal | Gerät |
|---|---|
| `SF2_Stop` | STOP Bedienpult −SF2 |
| `SF7_VorOrt_Halt`, `SF25_B2_Halt`, `SF32_Kurve_Halt`, `SF35_Pruef_Halt` | Halt-Taster der Vor-Ort-Steuerstellen |
| `SF0/SF8/SF9/SF10/SF33_NotHalt_frei` | Meldekontakte der Not-Halt-Taster (1 = entriegelt) |
| `FA1/FA5/FA7/FA8_Motorschutz` | Hilfskontakte der Motorschutzschalter (1 = OK) |
| `KF2_NotHalt_OK` | Rückmeldung Sicherheitsrelais (1 = Freigabe) |
| `BG20_Lichtvorhang_frei` | Sicherheitslichtvorhang (1 = Schutzfeld frei) |

Erwartet dein Programm bei STOP einen Schließer, nimm im Bedienfeld den Haken
„STOP −SF2 als Öffner verdrahtet“ heraus.

## Demo ohne SPS

Ohne Bridge und ohne PLCSIM Advanced läuft im Browser eine Schrittkette mit, die die Anlage
selbstständig fährt. Sie ist kein Teil deiner Aufgabe, sondern ein Vergleichsmaßstab: Du siehst
jederzeit, wie sich die Anlage verhalten *soll* – Betriebsarten, Verriegelungen, Handshakes an den
Übergaben, Not-Halt und Quittierung. Umschalten in der Seitenleiste unter *Verbindung*.

Steht die Anlage beim START nicht in Grundstellung (nach Handbetrieb, Umschalten der Betriebsart
oder einem abgebrochenen Zyklus), fährt die Schrittkette zuerst zurück: Schritte 11–14 heben,
fahren zum Band und schließen das Bad, senken und lösen. Ein dabei abgelegter Korb fährt ab.

## Variablentabelle

`TIA/PLC_Variablen_Zinnbad.xlsx` enthält alle 134 Signale zum Import in TIA
(PLC-Variablen → Rechtsklick → *Importieren*).
