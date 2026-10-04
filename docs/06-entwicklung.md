# Entwicklung

Wer am Zwilling selbst etwas ändern will: Aufbau des Quellcodes, Build und Werkzeuge.

[◀ Zurück zur Übersicht](../README.md)

## Bauen

```bat
cd web
npm install          :: einmalig
npm run build        :: src\  ->  web\index.html
npm run watch        :: baut bei jeder Änderung neu
```

`web/build.mjs` bündelt mit esbuild alle ES-Module aus `web/src/` samt three.js und schreibt eine
**einzige** `web/index.html`. Diese Datei läuft per Doppelklick – ohne Server, ohne Internet, ohne
node_modules. Das ist Absicht: Der Zwilling soll auf einem Schulungsrechner ohne Netz funktionieren.

Die Bridge braucht kein Visual Studio. `Bridge/build.bat` kompiliert `ZwillingBridge.cs` mit dem
C#-Compiler, der in jedem Windows mit .NET Framework bereits enthalten ist, und bindet die
PLCSIM-Advanced-API-DLL ein, die es selbst sucht.

## Aufbau von `web/src/`

| Ordner | Inhalt |
|---|---|
| `main.js` | Start, Hauptschleife (feste Simulationsschrittweite, Rendern entkoppelt) |
| `core/` | Renderer, Szene, Kamera, Materialien, Texturen, Beschriftungen, Grafikregelung, Mesh-Zusammenfassung |
| `bauteile/` | Wiederverwendbare Konstruktionsteile: Aluprofil, ISO-15552-Zylinder, Nutsensor, Lichtschranke, Förderer, Leitungen, Stecker |
| `anlage/` | Die Anlage selbst: Halle, Bänder, Zinnbad, Portal, Rollenkurve, Kühlung, Prüfstation, Körbe, Pneumatik, Verdrahtung, Schaltschrank, Befehlsgeräte, Werker |
| `logik/` | Zustand, Eingänge berechnen, Prozessmodell (Physik der Zylinder, Förderer, Körbe, Temperatur), Demo-SPS |
| `ui/` | Seitenleiste, Bedienung, Signalmonitor, Weg-Zeit-Diagramm, Ereignisliste, Ansichten, Bridge-Verbindung |
| `lib/` | three.js r170 und three-mesh-bvh, lokal eingebunden (Lizenzen liegen daneben) |
| `signale.js` | Fallback-Signalliste, falls die Bridge keine `signale.csv` liefert |

## Werkzeuge

```bat
node tools\shot.mjs       :: Screenshot plus Konsolenfehler, für schnelle Sichtprüfung
node tools\zyklen.mjs     :: prüft die ES-Module auf Importzyklen
```

## Konventionen

- **Deutsch** in Bezeichnern, Kommentaren und Oberfläche – die Anlage heißt im Code wie im Schaltplan.
- **Betriebsmittelkennzeichen** nach EN 81346 (`−MM3`, `−BG11`, `−QA1`) sind die Bindeglieder zwischen
  3D-Modell, `signale.csv`, Schaltschrank und TIA-Projekt. Wer eines ändert, ändert es überall.
- Ein Signal wird an **genau einer** Stelle berechnet (`logik/eingaenge.js`) und an genau einer
  Stelle angewendet (`logik/prozess.js`).
- Grafikstufen regeln sich selbst nach der Bildrate; bewegte Leitungen werden nur bei
  Winkeländerung neu berechnet, feste Teile werden zu wenigen Meshes zusammengefasst.

## Leistung messen

Bildzeiten sind in WebGL nur mit Vorsicht zu messen: V-Sync deckelt auf 16,7 ms, der erste Durchlauf
enthält die Shader-Übersetzung, und `readPixels` erzwingt eine Synchronisation, die das Ergebnis
verfälscht. Für belastbare Zahlen über mehrere Sekunden mitteln und den ersten Durchlauf verwerfen.
