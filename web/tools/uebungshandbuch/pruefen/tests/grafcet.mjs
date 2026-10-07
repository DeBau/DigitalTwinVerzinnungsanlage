// Abnahmetests des Pakets GRAFCET (vorlagen/grafcet*.js, vorlagen/zustand.js, avoidBreak, routeV).
// Die Tests liegen nach Themen im Ordner grafcet/ (dort auch die Hilfen); lauf.mjs liest nur diese Datei.
import { tests as kette } from './grafcet/kette.mjs';
import { tests as werkzeuge } from './grafcet/werkzeuge.mjs';
import { tests as zweige } from './grafcet/zweige.mjs';

export const tests = [...kette, ...werkzeuge, ...zweige];
