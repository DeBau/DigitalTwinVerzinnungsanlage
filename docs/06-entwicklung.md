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
| `logik/` | Zustand, Eingänge berechnen, Prozessmodell (Physik der Zylinder, Förderer, Körbe, Temperatur), Umrichter −TA2…−TA5 (PROFIdrive-Zustandsmaschine, Telegramm 1, `umrichter.js`; Kopplung an die Förderer in `antriebe.js`), Demo-SPS |
| `ui/` | Seitenleiste, Bedienung, Signalmonitor, Weg-Zeit-Diagramm, Ereignisliste, Ansichten, Bridge-Verbindung |
| `lib/` | three.js r170, three-mesh-bvh und die Schrift IBM Plex (`lib/fonts/`, wird beim Build eingebettet), lokal eingebunden (Lizenzen liegen daneben) |
| `signale.js` | Fallback-Signalliste, falls die Bridge keine `signale.csv` liefert |
| `version.js` | Versionsnummer des Zwillings |
| `sprache/` | Englische Wörterbücher (`en-ui`, `en-anlage`, `en-logik`, `en-signale`) |

## Sprache

Der Quelltext ist deutsch, der deutsche Text ist zugleich der Schlüssel ins Wörterbuch
(`core/sprache.js`):

- feste Texte: `t('Korb auflegen')`, Texte mit Werten: `` t`Korb ${nr} verzinnt` `` (Schlüssel
  „Korb {0} verzinnt“, im Englischen mit `{0}`, `{1}` …).
- `label()` und `ereignis()` übersetzen selbst, feste Texte brauchen dort nur einen Wörterbucheintrag.
- Statisches HTML übersetzt `domUebersetzen()` beim Start (Textknoten, `title`, `aria-label` …).
- Fehlt eine Übersetzung, erscheint der deutsche Text. Zum Aufspüren vor dem Laden in der Konsole
  `window.__fehlend = new Set()` setzen (z. B. per Haltepunkt oder Playwright-Init-Skript) – danach
  enthält die Menge jeden Text, der ohne Übersetzung angezeigt wurde.

## Neue Version

Die Versionsnummer steht an vier Stellen und muss überall gleich sein: `web/src/version.js`,
`web/package.json`, `Bridge.Version` in `Bridge/ZwillingBridge.cs` und ein neuer Abschnitt in
`CHANGELOG.md`. Weichen Haupt- oder Nebenversion von Zwilling und Bridge voneinander ab, meldet der
Zwilling das beim Verbinden; eine reine Fehlerbehebung (x.y.**z**) braucht keine neu gebaute Bridge.
Die Bridge-Version wird trotzdem mitgezogen, damit alle vier Stellen gleich bleiben.

## Werkzeuge

```bat
node tools\shot.mjs       :: Screenshot plus Konsolenfehler, für schnelle Sichtprüfung
node tools\zyklen.mjs     :: prüft die ES-Module auf Importzyklen
node tools\biegung.mjs    :: listet Leitungsbögen unter dem Mindestbiegeradius
node tools\doku-bilder.mjs [name]  :: Bilder in docs\bilder neu aufnehmen (sichtbares Chrome-Fenster, Stufe Hoch)
```

## Leitungen verlegen

`bauteile/leitungen.js` erzeugt alle Kabel und Schläuche:

- `leitung(punkte, material, r, R)` – fest verlegt. Gerade Strecken, jede Ecke ein Kreisbogen mit
  mindestens 5 × Außendurchmesser (`BIEGEFAKTOR`). Kurze Versätze werden automatisch zu einem
  flachen S. Ist eine Strecke für den Bogen zu kurz, wird er enger und landet in der Liste von
  `tools\biegung.mjs` – dann die Punkte so legen, dass zwischen zwei 90°-Ecken mindestens 2 × R Platz ist.
- `schlauch(punkte, …)` – frei hängend oder bewegt (glatte Kurve durch die Punkte).
- `rohr(…)` – starre Rohre und Wellschlauch, Radius wie angegeben.
- Sensorleitungen zu einem Feldverteiler laufen über `zumPort()` (`anlage/verdrahtung.js`): Bündel
  senkrecht vor dem Verteiler, jede Leitung in eigener Lage, mit Radius gerade in den Stecker.
- Wo kein Platz für einen Bogen hinter dem Stecker ist, einen gewinkelten Stecker nehmen
  (`steckerWinkel()` in `bauteile/stecker.js`).

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
