/* ---------- Interaktive Erklärungen: Signalverlauf ---------- */
// Zeichnet ein Zeitdiagramm: je Spur eine Zeile, je Schritt eine Spalte, 1 oben, 0 unten.
// spuren: [{name, werte: [0/1 je Schritt]}]. Gezeigt werden die letzten SV_MAX Schritte.
import { iaSvg, iaText } from './basis.js';

const SV_MAX = 16, SV_LINKS = 92, SV_SPALTE = 30, SV_ZEILE = 38, SV_HUB = 20;

function svPfad(werte, y0){
  const y = w => y0 + (w ? 0 : SV_HUB);
  let d = `M${SV_LINKS} ${y(werte[0])}`;
  werte.forEach((w, i) => {
    const x = SV_LINKS + i * SV_SPALTE;
    if (i && w !== werte[i - 1]) d += ` L${x} ${y(w)}`;
    d += ` L${x + SV_SPALTE} ${y(w)}`;
  });
  return `<path d="${d}" class="sv-kurve"/>`;
}
function svSpur(spur, zeile){
  const y0 = 10 + zeile * SV_ZEILE;
  const grund = `<line x1="${SV_LINKS}" y1="${y0 + SV_HUB}" x2="${SV_LINKS + SV_MAX * SV_SPALTE}" y2="${y0 + SV_HUB}" class="sv-null"/>`;
  return iaText(SV_LINKS - 10, y0 + 15, spur.name, "sv-name", "end") + grund + (spur.werte.length ? svPfad(spur.werte, y0) : "");
}
function svRaster(n, hoehe){
  return Array.from({length: n + 1}, (_, i) => {
    const x = SV_LINKS + i * SV_SPALTE;
    return `<line x1="${x}" y1="4" x2="${x}" y2="${hoehe - 16}" class="sv-raster"/>`;
  }).join("");
}
export function signalverlaufSVG(spuren, beschriftung = "Schritt"){
  const kurz = spuren.map(s => ({...s, werte: s.werte.slice(-SV_MAX)}));
  const n = Math.max(1, ...kurz.map(s => s.werte.length)), hoehe = 26 + spuren.length * SV_ZEILE;
  const fuss = iaText(SV_LINKS + n * SV_SPALTE / 2, hoehe - 2, `${beschriftung} → Zeit`, "sv-fuss");
  const inhalt = svRaster(n, hoehe) + kurz.map(svSpur).join("") + fuss;
  return iaSvg(SV_LINKS + SV_MAX * SV_SPALTE + 10, hoehe, inhalt, "Signalverlauf");
}
