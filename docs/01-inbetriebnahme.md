# Inbetriebnahme

Von der leeren Festplatte zum laufenden Zwilling an der virtuellen S7-1500 – in vier Schritten.
Für den ersten Blick ohne SPS genügt Schritt 1.

[◀ Zurück zur Übersicht](../README.md)


## 1. Bridge bauen und Zwilling öffnen (ohne SPS)

1. Ordner entpacken, z. B. nach `C:\Zwilling_Zinnbad`.
2. `Bridge\build.bat` doppelklicken. Das Skript sucht die API-DLL von PLCSIM Advanced und erzeugt `ZwillingBridge.exe`.
3. `Bridge\start.bat` doppelklicken. Der Browser öffnet `http://localhost:8181`.

Zum Anschauen ohne Bridge reicht auch ein Doppelklick auf `web\index.html`. Ohne SPS läuft der Modus **Demo ohne SPS**: Eine Schrittkette im Browser steuert die Anlage, die Automatik startet von selbst.



## 2. TIA-Projekt vorbereiten

1. **Simulation erlauben:** Projekt → Eigenschaften → *Schutz* → *Simulation bei Kompilierung von Bausteinen unterstützen*.
2. **Hardware:** CPU 1516-3 PN/DP, DI 32x24VDC HF, DQ 32x24VDC/0.5A ST, AI 8xU/I/RTD/TC ST (Kanal 0/1 auf %IW64/%IW66). Andere Adressen sind kein Problem, dann nur `signale.csv` anpassen. Für Antriebe am Umrichter je einen SINAMICS G120 mit Standardtelegramm 1 (−TA2…−TA5 auf E/A 256…271) – siehe [Umrichter und Technologieobjekt](04-signale.md#umrichter-und-technologieobjekt).
3. **Variablen importieren:** PLC-Variablen → Rechtsklick → *Importieren* → `TIA\PLC_Variablen_Zinnbad.xlsx` (deutsche Namen) oder `TIA\PLC_Tags_Tinning_EN.xlsx` (englische Namen, gleiche Adressen). Die Namen im TIA-Projekt sind frei – die Bridge koppelt über die **Adressen**. Der Signalmonitor zeigt in der englischen Oberfläche die englischen Namen.
4. **Programm schreiben.** Welchen Teil der Anlage dein Programm übernimmt, legst du in der Seitenleiste unter *Übungsumfang* fest – siehe [Übungsaufgaben](05-uebungen.md). Den Rest fährt das Modell selbst, du kannst also mit der Schrittkette anfangen und später erweitern.
5. Übersetzen.



## 3. PLCSIM Advanced starten und laden

1. *S7-PLCSIM Advanced Control Panel* öffnen, *Online Access* auf **PLCSIM**.
2. *Start Virtual S7-1500 PLC*: Instance name **`Zinnbad`** → *Start*.
3. In TIA: *Laden in Gerät* → Schnittstelle **PLCSIM** → Instanz wählen → laden → **RUN**.



## 4. Koppeln und testen

1. `Bridge\start.bat` starten. In der Konsole erscheint *Mit PLCSIM-Advanced-Instanz 'Zinnbad' verbunden*.
2. Der Zwilling schaltet automatisch auf **PLCSIM Advanced** (zwei grüne Punkte).
3. −SA1 auf AUTO, **START −SF1** drücken. Liegt ein Korb am Anschlag an (−BG40) und sind Temperatur und Füllhöhe in Ordnung, läuft der Zyklus.
4. Testideen:
   - **NOT-HALT** während der Fahrt → alles steht, −PF5 und die Leuchttaster der Vor-Ort-Stellen blinken, HMI und Ereignisliste nennen den Taster. Entriegeln, an einer beliebigen Stelle quittieren, START → weiter.
   - **STOP** im Automatikbetrieb → der laufende Korb wird fertig, danach Stopp. **EINZEL** → ein Zyklus pro START.
   - **Hand** an der Schaltschranktür → Zylinder einzeln fahren, Verriegelungen prüfen.
   - **Heizung aus** (bzw. Übungsumfang Zinnbad: SPS) → unter 250 °C fällt −BG9 ab, kein neuer Start. Regler selbst programmieren: 2-Punkt, PWM, PID_Compact.
   - Übungsumfang Band: SPS → Band mit Nachlaufzeit, Anschlag und Vereinzeler selbst programmieren, Vor-Ort-Steuerstelle mit Schlüsselschalter, Übergabe über die Rollenkurve −MA6 auf Band 2.
   - Im Signalmonitor **−BG7 auf 0 forcen** → das Programm wartet in Schritt 5 (Bad öffnen).
   - **Drossel** eines Zylinders zudrehen (Klick auf das Drosselventil in 3D oder Weg-Zeit-Diagramm → „Groß öffnen“) → längere Fahrzeit oder bei 0 % Stillstand, gut für Überwachungszeiten. Mit den Messlinien im Diagramm die Fahrzeiten ausmessen.



## Fehlersuche

| Meldung / Effekt | Ursache und Lösung |
|---|---|
| `build.bat`: API-DLL nicht gefunden | Pfad setzen: `set PLCSIMADV_API_DLL=C:\Program Files\Common Files\Siemens\PLCSIMADV\API\<Version>\Siemens.Simatic.Simulation.Runtime.Api.x64.dll`, dann `build.bat` im selben Fenster starten. |
| `build.bat`: Kompilierfehler | Meist eine abweichende PLCSIM-Advanced-API-Version. Meldung und API-Version (Ordnername unter `…\PLCSIMADV\API\`) als [Issue](https://github.com/DeBau/DigitalTwinVerzinnungsanlage/issues) melden. |
| Seite bleibt grau, Meldung „3D-Darstellung nicht möglich“ | Browser oder Grafiktreiber stellen kein WebGL 2 bereit. Aktuellen Chrome, Edge oder Firefox verwenden, Grafiktreiber aktualisieren, in den Browsereinstellungen die Hardwarebeschleunigung einschalten. |
| *Runtime-Manager läuft nicht* | PLCSIM Advanced Control Panel öffnen. |
| *Instanz 'Zinnbad' nicht gefunden* | Instanzname im Control Panel prüfen oder in `start.bat` anpassen. |
| Webserver startet nicht | Port belegt → `PORT` in `start.bat` ändern. Bei „Zugriff verweigert“ einmalig als Administrator: `netsh http add urlacl url=http://localhost:8181/ user=%USERNAME%` |
| Zwilling meldet „Namen nicht gefunden“ | Namen in `signale.csv` wurden geändert. Die Namen müssen wie geliefert bleiben, nur die Adressen sind frei. |
| Anlage bewegt sich nicht | Not-Halt verriegelt oder nicht quittiert (−KF2_NotHalt_OK = 0)? −SA3 auf HAND? Im Signalmonitor prüfen, ob MB1–MB8 ankommen und ob die Grundstellung (BG2, BG4, BG5, BG8) sowie BG9, BG10 und BG40 anliegen. |
| Seite per Doppelklick geöffnet, aber keine Verbindung | Die Bridge muss laufen (`start.bat`). Die Seite verbindet sich dann von selbst mit `localhost:8181`, egal ob per Doppelklick oder über `http://localhost:8181` geöffnet. |

[◀ Zurück zur Übersicht](../README.md)
