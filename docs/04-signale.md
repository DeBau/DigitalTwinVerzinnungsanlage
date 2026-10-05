# Signale und TIA-Anbindung

Der Zwilling kennt **155 Signale**: 104 Eingänge (davon 4 Analogwerte und 8 Telegrammwörter) und
51 Ausgänge (davon 8 Telegrammwörter). Sie sind die
einzige Schnittstelle zwischen deinem Programm und dem Modell – kein proprietäres Protokoll, keine
Bausteinbibliothek, keine Lizenzdatei.

[◀ Zurück zur Übersicht](../README.md)

![Signalmonitor](bilder/08-signalmonitor.jpg)

## Eine Datei, eine Wahrheit: `signale.csv`

```
Name;Adresse;Kommentar
SF1_Start;%I0.0;Taster START (Schliesser)
MB1_Einhaengen;%Q0.0;Einhaengezylinder -MM1: Korb einhaengen
BT1_Temperatur;%IW64;Zinntemperatur analog 0...27648 = 0...400 Grad C
```

- **Namen bleiben wie geliefert.** Der Zwilling erkennt jedes Signal an seinem Namen in dieser
  Datei. Das betrifft nur `signale.csv` – wie die Variablen in deinem TIA-Projekt heißen, ist frei,
  denn die Bridge schreibt und liest die SPS über die Adressen.
- **Adressen sind frei.** Passen die Adressen deiner Hardware-Konfiguration nicht, änderst du nur
  die mittlere Spalte – weder Bridge noch Browser müssen neu gebaut werden.
- **In Excel bearbeiten geht:** Kein Kommentar beginnt mit `-`, `+`, `=` oder `@` (Excel würde ihn
  als Formel lesen und `#NAME?` daraus machen), und kein Kommentar enthält ein Semikolon. Bei eigenen
  Kommentaren das Kennzeichen deshalb hinter den Begriff setzen („Tauchzylinder -MM2: senken“).
  Speichern als *CSV (Trennzeichen-getrennt)*, ohne Umlaute.
- Die Bridge liest die Datei beim Start und schickt die Liste an den Browser. Findet der Zwilling
  einen erwarteten Namen nicht, meldet er das in der Ereignisliste statt still falsch zu laufen.

## Adressbelegung

| Bereich | Adressen | Inhalt |
|---|---|---|
| Digitale Eingänge | `%I0.0 … %I11.7` | Endlagen, Lichtschranken, Taster, Wahl- und Schlüsselschalter, Motorschutz-Hilfskontakte, Not-Halt-Meldekontakte, Rückmeldung Sicherheitsrelais |
| Digitale Ausgänge | `%Q0.0 … %Q5.2` | Ventilspulen, Wendeschütze, Heizung, Pumpe, Vibrorinne, Prüfband, Ausblasdüse, Melde- und Leuchttaster |
| Analoge Eingänge | `%IW64`, `%IW66`, `%IW68`, `%IW70` | Zinntemperatur −BT1 (0…400 °C), Füllstand −BL1 (0…100 %), Korbtemperatur −BT2 (0…400 °C), Drehzahlpotentiometer −SF47 an −S50 (0…100 %) – jeweils 0…27648 |
| Umrichter −TA2…−TA5 (Telegramm 1) | `%QW256…270` / `%IW256…270` | je Umrichter STW1 und NSOLL_A hin, ZSW1 und NIST_A zurück – nur bei Antrieb „Umrichter“ |

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

## Umrichter und Technologieobjekt

![Fenster Umrichter: Bedienpanel, Telegramm 1 und Rampen live](bilder/11-umrichter.jpg)

Vier Förderer laufen wahlweise an ihren Schützen oder an einem **Frequenzumrichter** (SINAMICS
G120 an PROFINET). Umgeschaltet wird je Antrieb in der Seitenleiste unter *Übungsumfang → Antriebe*.
Die Umrichter sitzen im Schaltschrank −A1 unten rechts (je PM240-2 FSA mit CU240E-2 PN und
Bedienpanel IOP-2, Display und LEDs live, anklickbar).

| Umrichter | Antrieb | Schütze im Schützbetrieb | STW1 / NSOLL_A | ZSW1 / NIST_A | 16#4000 = 1500 1/min = |
|---|---|---|---|---|---|
| −TA2 | Band 1 −MA1 | −QA1/−QA2 | `%QW256` / `%QW258` | `%IW256` / `%IW258` | 100 mm/s |
| −TA3 | Band 2 −MA2 | −QA5/−QA6 | `%QW260` / `%QW262` | `%IW260` / `%IW262` | 120 mm/s |
| −TA4 | Rollenkurve −MA6 | −QA10/−QA11 | `%QW264` / `%QW266` | `%IW264` / `%IW266` | 110 mm/s |
| −TA5 | Prüfband −MA5 | −QA9 | `%QW268` / `%QW270` | `%IW268` / `%IW270` | 150 mm/s, nur vorwärts (p1110) |

100 % entsprechen jeweils der Geschwindigkeit am Netz mit Schütz. Am Prüfband ist die negative
Drehrichtung gesperrt, ein negativer Sollwert wirkt dort wie 0.

Wer einen Umrichter führt, hängt vom Übungsumfang ab:

- *Band: Bandmodul automatisch* (auch in der Demo): Das Bandmodul gibt ihm selbst das Telegramm.
- *Band: SPS steuert*: Dein Programm. Der Zwilling liest Steuerwort und Sollwert aus dem
  Ausgangsabbild und antwortet im Eingangsabbild mit Zustandswort und Istwert. Damit fährt ein
  **Technologieobjekt `TO_SpeedAxis`** (oder `SinaSpeed` aus der DriveLib) das Band genau so, wie es
  einen echten G120 fahren würde.
- **HAND** am Bedienpanel: Das Panel führt, das Telegramm der SPS ist ohne Wirkung (ZSW1.9 = 0).

**Telegramm:** SIEMENS-Standardtelegramm 1, PZD-2/2, je Umrichter vier Wörter (Beispiel −TA2):

| Wort | Richtung | Inhalt |
|---|---|---|
| `TA2_STW1` | SPS → Umrichter | Steuerwort 1, Betrieb typisch `16#047F`, AUS1 `16#047E` |
| `TA2_NSOLL_A` | SPS → Umrichter | Drehzahlsollwert, `16#4000` = 100 % = 1500 1/min, negativ = rückwärts |
| `TA2_ZSW1` | Umrichter → SPS | Zustandswort 1 |
| `TA2_NIST_A` | Umrichter → SPS | Drehzahlistwert, gleiche Normierung |

**Was nachgebildet ist:**

- Zustandsmaschine nach PROFIdrive: S1 Einschaltsperre → S2 Einschaltbereit (AUS1 = 0) →
  S3 Betriebsbereit (AUS1 = 1) → S4 Betrieb (STW1.3). Aus der Einschaltsperre geht es nur mit
  AUS1 = 0, wie am echten Gerät.
- AUS1 mit Rücklauframpe, AUS2 = Impulssperre (Band trudelt aus), AUS3 = Schnellhalt,
  Hochlaufgeber (STW1.4…6), Sollwertinvertierung (STW1.11), Führung durch SPS (STW1.10 = 0 →
  Telegramm wird ignoriert).
- Antriebsparameter: Bezugsdrehzahl p2000 = 1500 1/min, Maximaldrehzahl p1082 = 2250 1/min (150 %),
  Hoch- und Rücklaufzeit 0,3 s, AUS3-Rampe 0,1 s. Das eigentliche Fahrprofil kommt vom Technologieobjekt.
- **Not-Halt** wählt über −KF2 **STO** an: Impulse sofort gesperrt, LED SAFE blinkt, danach
  Einschaltsperre. Die Wendeschütze −QA1/−QA2 bleiben in dieser Betriebsart abgefallen.
- **Störungen** im Fenster des Umrichters: *Störung Überlast* (F30005, sofort quittierbar) und
  *Motor überhitzt* (F07011, quittierbar erst nach dem Abkühlen). Quittiert wird mit einer Flanke an
  STW1.7 – beim Technologieobjekt mit `MC_Reset`.

**Fenster „Umrichter“** (Klick auf einen Umrichter im Schaltschrank oder Übungsumfang →
*Umrichter und Telegramme öffnen*, oben −TA2…−TA5 wählen): links die Gerätefront mit dem
Bedienpanel IOP-2, rechts beide Telegrammrichtungen Bit für Bit mit Bedeutung, unten **Rampen live**:
Sollwert NSOLL_A (gestrichelt), wirksamer Sollwert am Eingang des Hochlaufgebers (0 ohne Betrieb,
auf p1082 begrenzt) und Istdrehzahl über 10, 20 oder 60 s. Daran sieht man Hoch- und Rücklauf,
AUS1/AUS3 und das Austrudeln nach STO. Das Display zeigt dasselbe wie das Gerät im Schaltschrank.
Bedienen lässt sich das Panel so:

| Taste | Wirkung |
|---|---|
| HAND/AUTO (Hand-Symbol) | Führung zwischen Panel (HAND) und PROFINET (AUTO) umschalten, stoßfrei |
| I / O | in HAND einschalten bzw. AUS1 |
| Drehrad | in HAND Drehzahlsollwert (30 1/min je Raste), sonst Statusseiten blättern (Status, Istwerte, Telegramm); Mausrad, Pfeiltasten oder Klick auf den Rand |
| INFO | Störungen und Warnungen, dort **OK** (Mitte des Drehrads) = Quittieren |
| ESC | zurück zur Statusanzeige |

LEDs der CU240E-2 PN: **RDY** grün = bereit, rot = Störung; **BF** aus = Datenaustausch über
PROFINET, rot blinkend = keine Verbindung zur SPS; **SAFE** gelb = STO projektiert, gelb blinkend =
STO angewählt. Das Bedienpanel ist dem IOP-2 nachempfunden, die Menüs sind vereinfacht.

### Projektierung in TIA

1. **Umrichter einfügen:** In der Netzsicht je benutztem Antrieb einen SINAMICS G120 mit
   PROFINET-Control-Unit (z. B. CU240E-2 PN) an die CPU hängen, Gerätenamen vergeben (−TA2…−TA5).
2. **Telegramm:** In der Gerätesicht jedes Umrichters unter *Telegrammkonfiguration*
   **Standardtelegramm 1, PZD-2/2** wählen, E-/A-Adressen wie in der Tabelle oben (−TA2 256…259,
   −TA3 260…263, −TA4 264…267, −TA5 268…271). Andere Adressen gehen auch, dann in `signale.csv`
   die Zeilen `TA…_` anpassen und die Bridge neu starten.
3. **Technologieobjekt anlegen:** *Technologieobjekte → Neues Objekt hinzufügen → Motion Control →
   TO_SpeedAxis*. Unter *Hardwareschnittstelle → Antrieb* den G120 bzw. sein Telegramm 1 auswählen.
   **Simulation / virtuelle Achse nicht aktivieren** – sonst schreibt das Technologieobjekt kein
   Telegramm, und der Zwilling bekommt nichts zu sehen.
4. **Antriebsdaten von Hand eintragen:** Bezugsdrehzahl 1500 1/min, Maximaldrehzahl 2250 1/min
   (am Prüfband −TA5 nur positive Richtung).
   Eine automatische Übernahme der Antriebswerte online ausschalten, denn es gibt keinen echten
   Antrieb, aus dem sie kommen könnten.
5. **Programm:** `MC_Power` (Enable, StartMode = 1), `MC_MoveVelocity` (Velocity in 1/min,
   1500 1/min = 100 mm/s Bandgeschwindigkeit), `MC_Halt` zum Anhalten, `MC_Reset` zum Quittieren.
   Der Zustand der Achse steht im Technologieobjekt-DB (`StatusWord`, `ErrorWord`, `ActualSpeed`).

Die Bridge braucht dafür nichts Neues: Sie liest und schreibt Wörter schon immer. Sie muss nur mit
der aktuellen `signale.csv` gestartet werden, sonst kennt sie die Telegrammwörter nicht.

> **Hinweis zu PLCSIM Advanced:** Die Bridge schreibt das Telegramm direkt ins Prozessabbild der
> virtuellen CPU. Das Technologieobjekt arbeitet im Takt des OB MC-Servo, der Zwilling antwortet im
> Bridge-Zyklus (Vorgabe 10 ms). Für eine Drehzahlachse reicht das gut. Für eine Lageregelung
> wäre es zu träge.

## Signalmonitor im Browser

Die Seitenleiste zeigt jedes Signal mit Name, Adresse und Live-Zustand. Jeder Eingang lässt sich
auf **0** oder **1 forcen** – damit prüfst du Verriegelungen und Fehlerwege, ohne die Anlage in
die passende Lage zu fahren. **A** gibt das Signal wieder ans Modell zurück.

## Schließer und Öffner

Drahtbruchsicher verdrahtet, also **1 = nicht betätigt**:

| Signal | Gerät |
|---|---|
| `SF2_Stop` | STOP Bedienpult −SF2 |
| `SF7_VorOrt_Halt`, `SF25_B2_Halt`, `SF32_Kurve_Halt`, `SF35_Pruef_Halt`, `SF46_Pruefband_Aus` | Halt-Taster der Vor-Ort-Steuerstellen |
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

Zwei Variablentabellen mit denselben 155 Signalen und denselben Adressen, zum Import in TIA
(PLC-Variablen → Rechtsklick → *Importieren*):

| Datei | Namen und Kommentare | Beispiel |
|---|---|---|
| `TIA/PLC_Variablen_Zinnbad.xlsx` | deutsch, Tabelle „Zinnbad“ | `MB1_Einhaengen`, `BG11_Korb`, `SF0_NotHalt_frei` |
| `TIA/PLC_Tags_Tinning_EN.xlsx` | englisch, Tabelle „Tinning“ | `MB1_HookIn`, `BG11_Basket`, `SF0_EStop_Released` |

Das Betriebsmittelkennzeichen steht in beiden Sprachen vorn, so passen Schaltplan, Zwilling und
TIA-Projekt zusammen. Die Zuordnung deutsch → englisch steht in `web/src/sprache/en-signalnamen.js`;
in der englischen Oberfläche zeigt der Signalmonitor die englischen Namen (der interne Name aus
`signale.csv` steht im Tooltip, die Suche findet beide).
