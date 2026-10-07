[Deutsch](06-entwicklung.md) · **English**

# Development

For anyone who wants to change the twin itself: source code structure, build and tools.

[◀ Back to overview](../README.en.md)

## Building

```bat
cd web
npm install          :: once
npm run build        :: src\  ->  web\index.html
npm run watch        :: rebuilds on every change
```

`web/build.mjs` uses esbuild to bundle all ES modules from `web/src/` together with three.js and writes a
**single** `web/index.html`. This file runs by double-click: no server, no internet, no
node_modules. This is intentional: the twin has to work on a training PC without a network.

The bridge does not need Visual Studio. `Bridge/build.bat` compiles `ZwillingBridge.cs` with the
C# compiler that already ships with every Windows installation with .NET Framework, and links in the
PLCSIM Advanced API DLL, which it locates by itself.

## Structure of `web/src/`

| Folder | Contents |
|---|---|
| `main.js` | Startup, main loop (fixed simulation time step, rendering decoupled) |
| `core/` | Renderer, scene, camera, materials, textures, labels, graphics control, mesh merging |
| `bauteile/` | Reusable design components: aluminum profile, ISO 15552 cylinder, slot sensor, light barrier, conveyor, cables, connectors |
| `anlage/` | The line itself: hall, conveyors, tin bath, gantry, roller curve, cooling, inspection station, baskets, pneumatics, wiring, control cabinet, control devices, operator figure |
| `logik/` | State, input calculation, process model (physics of cylinders, conveyors, baskets, temperature), inverters −TA2…−TA5 (PROFIdrive state machine, telegram 1, `umrichter.js`; coupling to the conveyors in `antriebe.js`), demo PLC |
| `ui/` | Sidebar, operation, signal monitor, displacement-time diagram, event log, views, bridge connection |
| `lib/` | three.js r170, three-mesh-bvh and the IBM Plex font (`lib/fonts/`, embedded during the build), included locally (licenses alongside) |
| `signale.js` | Fallback signal list in case the bridge does not supply a `signale.csv` |
| `version.js` | Version number of the twin |
| `sprache/` | English dictionaries (`en-ui`, `en-anlage`, `en-logik`, `en-signale`) |

## Language

The source code is in German, and the German text is also the key into the dictionary
(`core/sprache.js`):

- Fixed texts: `t('Korb auflegen')`, texts with values: `` t`Korb ${nr} verzinnt` `` (key
  "Korb {0} verzinnt", in English with `{0}`, `{1}` …).
- `label()` and `ereignis()` translate by themselves; fixed texts there only need a dictionary entry.
- Static HTML is translated by `domUebersetzen()` at startup (text nodes, `title`, `aria-label` …).
- If a translation is missing, the German text appears. To track these down, set
  `window.__fehlend = new Set()` in the console before loading (e.g. via a breakpoint or a Playwright init script);
  afterwards the set contains every text that was displayed without a translation.

## New version

The version number appears in four places and must be identical in all of them: `web/src/version.js`,
`web/package.json`, `Bridge.Version` in `Bridge/ZwillingBridge.cs`, and a new section in
`CHANGELOG.md`. If the major or minor version of the twin and the bridge differ, the
twin reports this when connecting; a pure bug fix (x.y.**z**) does not need a rebuilt bridge.
The bridge version is updated anyway so that all four places stay identical.

## Tools

```bat
node tools\shot.mjs       :: screenshot plus console errors, for a quick visual check
node tools\zyklen.mjs     :: checks the ES modules for import cycles
node tools\biegung.mjs    :: lists cable bends below the minimum bending radius
node tools\doku-bilder.mjs [name]  :: recapture images in docs\bilder (visible Chrome window, High level)
```

## Routing cables

`bauteile/leitungen.js` generates all cables and hoses:

- `leitung(punkte, material, r, R)`: fixed routing. Straight runs, each corner a circular arc with
  at least 5 × outer diameter (`BIEGEFAKTOR`). Short offsets automatically become a
  flat S. If a run is too short for the bend, the bend gets tighter and ends up in the list of
  `tools\biegung.mjs`; then place the points so that there is at least 2 × R of space between two 90° corners.
- `schlauch(punkte, …)`: freely hanging or moving (smooth curve through the points).
- `rohr(…)`: rigid pipes and corrugated hose, radius as specified.
- Sensor cables to a field distributor run via `zumPort()` (`anlage/verdrahtung.js`): bundle
  vertical in front of the distributor, each cable in its own layer, entering the connector straight with a radius.
- Where there is no room for a bend behind the connector, use an angled connector
  (`steckerWinkel()` in `bauteile/stecker.js`).

## Conventions

- **German** in identifiers, comments and UI: the line has the same names in the code as in the circuit diagram.
- **Reference designations** according to EN 81346 (`−MM3`, `−BG11`, `−QA1`) are the links between
  3D model, `signale.csv`, control cabinet and TIA project. If you change one, change it everywhere.
- A signal is calculated in **exactly one** place (`logik/eingaenge.js`) and applied in exactly one
  place (`logik/prozess.js`).
- Graphics levels adjust themselves to the frame rate; moving cables are only recalculated when
  their angle changes, and fixed parts are merged into a few meshes.

## Measuring performance

Measure frame times in WebGL with caution: V-Sync caps at 16.7 ms, the first run
includes shader compilation, and `readPixels` forces a synchronization that distorts
the result. For reliable figures, average over several seconds and discard the first run.
