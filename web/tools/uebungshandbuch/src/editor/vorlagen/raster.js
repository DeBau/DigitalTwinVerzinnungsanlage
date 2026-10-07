// Vorlage Kästchenraster: leeres Blatt im 5-mm-Raster mit allen Bausteingruppen für alles Weitere.
// Das Raster ist auf dem Ausdruck wirklich 5 mm groß: Der Druck zeigt ein Blatt (707 Einheiten hoch) 192 mm hoch
// (styles/10-druck.css, .pp.land svg max-height), eine Einheit ist also 192/707 mm und 5 mm sind gut 18,4 Einheiten.
// Linien und Kästen rasten auf diesem Raster ein (Haken fangPunkt), Bausteine wie überall im 10er-Raster.
import { registriereVorlage } from '../registry.js';
import { G2, grid } from '../vorlagen-svg.js';

export const DRUCK_MM_JE_EINHEIT = 192 / 707;
export const KAESTCHEN = 5 / DRUCK_MM_JE_EINHEIT;    // 5 mm in Zeichnungseinheiten
export const RASTER_URSPRUNG = 15;                   // linke obere Ecke des Rahmens
export const aufKaestchen = v => +(RASTER_URSPRUNG + Math.round((v - RASTER_URSPRUNG) / KAESTCHEN) * KAESTCHEN).toFixed(2);

registriereVorlage("raster", {
  n: "Kästchenraster", d: "5-mm-Raster für alles Weitere",
  gruppen: ["grafcet", "zustand", "elektro", "geraete", "leistung", "pneu", "regel", "regelglied"],
  body: () => grid(KAESTCHEN, G2),
  fangPunkt: ([x, y]) => [aufKaestchen(x), aufKaestchen(y)],
});
