// Vorlage Kästchenraster: leeres Blatt im 5-mm-Raster mit allen Bausteingruppen für alles Weitere.
import { registriereVorlage } from '../registry.js';
import { G2, grid } from '../vorlagen-svg.js';

registriereVorlage("raster", {n: "Kästchenraster", d: "5-mm-Raster für alles Weitere", gruppen: ["grafcet", "zustand", "elektro", "geraete", "leistung", "pneu", "regel"], body: () => grid(10, G2)});
