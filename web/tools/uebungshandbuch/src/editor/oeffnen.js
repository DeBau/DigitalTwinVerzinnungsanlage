// Editor-Kern: Editor öffnen mit Werkzeugleiste und Palette, Blatt aufbauen.
import { $, $$, BY, IC, S } from '../app/basis.js';
import { INK, SVGT, arrowHead } from './svg.js';
import { ED } from './status.js';
import { BLK, GN, HINT, PAL, SAMPLE, VORL } from './registry.js';
import { drawObj, pageCount, pcSample } from './zeichnen.js';
import { skKey, skMeta, sketchSVG } from './blaetter.js';
import { sizeSVG } from './anzeige.js';
import { setTool } from './werkzeuge.js';
import { edDown, edMove, edUp } from './zeiger.js';

export function openEditor(scope, key){
  const data = S.get(skKey(scope, key)) || {}; data.s ||= []; data.t ||= []; data.o ||= []; data.c ||= [];
  const pal = PAL[key] || [];
  const keepTool = ["pen","line","rect","text","erase"].includes(ED.tool) ? ED.tool : "pen";
  Object.assign(ED, {scope, key, data, hist:[], cur:null, sel:null, selC:null, selS:null, selT:null, from:null, place:null, drag:null, tool: pal.length ? "sel" : key === "wegschritt" ? "line" : keepTool});
  const ex = BY[scope], dlg = $("#editor");
  const colors = [["#17212B","Schwarz"],["#0E4C92","Blau"],["#C0392B","Rot"]];
  dlg.innerHTML = `<div class="ed"><div class="edbar">
    <span class="ttl">${VORL[key].n}${ex ? ` – ${ex.id}` : ""}</span>
    <button type="button" class="tool" data-tool="sel" title="Bausteine, Linien und Texte markieren, verschieben, ändern">${IC.cursor}Auswählen</button>
    ${pal.length ? `<button type="button" class="tool" data-tool="conn" title="Zwei Bausteine bzw. Anschlüsse nacheinander anklicken">${IC.link}Verbinden</button>` : ""}${key === "pneumatik" ? `<button type="button" class="tool" data-tool="sim" title="Ventile per Klick schalten, Druck und Zylinderbewegung ansehen">${IC.play}Simulation</button>` : ""}<span class="sep"></span>
    ${colors.map(([c, n]) => `<button type="button" class="tool" data-tool="pen" data-color="${c}"><span class="dot" style="background:${c}"></span>${n}</button>`).join("")}
    <button type="button" class="tool" data-tool="line" title="${key === "wegschritt" ? "Funktionslinie: waagrecht = Stillstand, schräg = Bewegung, senkrecht = Ventil/Stellglied" : "Gerade Linie, rastet im 10er-Raster"}">${IC.line}${key === "wegschritt" ? "Funktionslinie" : "Linie"}</button>
    ${key === "wegschritt" ? `<button type="button" class="tool" data-tool="sig" title="Vom Auslöser (Endlage) zum Beginn der nächsten Bewegung ziehen">↳ Signallinie</button><button type="button" class="tool" data-tool="start" title="Auf den Beginn der ersten Bewegung klicken">⊤ Start</button><button type="button" class="tool" data-tool="eq" title="In die Spalte nach dem letzten Schritt klicken">n = 1</button>` : ""}
    <button type="button" class="tool" data-tool="rect" title="Rechteck, rastet im 10er-Raster">${IC.rect}Kasten</button>
    <button type="button" class="tool" data-tool="text">${IC.text}Text</button>
    <button type="button" class="tool" data-tool="erase">${IC.eraser}Radierer</button>
    <span class="sep"></span>
    <button type="button" class="tool" data-ed="grid" aria-pressed="${ED.grid}" title="Bausteine und Linien rasten im 10er-Raster ein">${IC.grid}Raster fangen</button>
    ${pal.length ? `<button type="button" class="tool" data-ed="dock" aria-pressed="${ED.dock}" title="Bausteine richten sich an Nachbarn aus und verbinden sich automatisch">${IC.magnet}Andocken</button>` : ""}
    <span class="sep"></span>
    <button type="button" class="tool" data-w="1.4">dünn</button><button type="button" class="tool" data-w="2.2">mittel</button><button type="button" class="tool" data-w="4">dick</button>
    <span class="sep"></span>
    <span class="takewrap"><button type="button" class="tool" data-ed="take" aria-haspopup="true" title="Eine eigene Zeichnung dieser Art aus einer anderen Übung in diese Übung kopieren">${IC.copy}Aus früherer Übung</button></span><button type="button" class="tool" data-ed="undo" title="Strg+Z">${IC.undo}Rückgängig</button><button type="button" class="tool" data-ed="del" title="Entf">${IC.trash}Markiertes löschen</button><button type="button" class="tool" data-ed="clear">Alles leeren</button>
    <span style="flex:1"></span>
    <button type="button" class="btn small" data-ed="print">${IC.print}Drucken</button><button type="button" class="btn primary small" data-ed="close">Fertig</button>
  </div><div class="edbody"><aside class="pal" aria-label="Bausteine und Eigenschaften"><div id="props"></div>${pal.length ? paletteHTML(pal) : (key === "wegschritt" ? wsPaletteHTML() : "") + `<div class="palhelp">${key === "wegschritt" ? "<p><b>Funktionslinie</b> (dick): waagrecht = Stillstand, schräg = Bewegung (je steiler, desto schneller), senkrecht = Ventil bzw. Stellglied schaltet. Die Enden rasten auf die Eckpunkte.</p><p><b>Zeilenname</b>: links auf den Namen klicken, z. B. eine freie Zeile in „−MB1 Ventil“ umbenennen.</p><p><b>Start</b>: auf den Beginn der ersten Bewegung klicken – der Starttaster (z. B. −SF1) wird davor gesetzt.</p><p><b>Signallinie</b>: vom Auslöser, z. B. der erreichten Endlage, zum Beginn der nächsten Bewegung ziehen und den Auslöser eintragen (−BG2, eine Zeit wie t = 10 s oder eine Verknüpfung).</p><p><b>Schleife</b>: Löst ein Zylinder mit seiner eigenen Endlage die Gegenbewegung aus, mit Signallinie einfach auf diesen Punkt klicken.</p><p><b>UND / ODER</b>: „UND-Verknüpfung“ bzw. „ODER-Verknüpfung“ wählen und den Beginn der ausgelösten Bewegung anklicken – davor entsteht der Verknüpfungspunkt (Schrägstrich = UND, Punkt = ODER). Dann mit Signallinie jeden Signalgeber mit diesem Punkt verbinden. Signalgeber und Zeitglied stellen Sie links bei der markierten Signallinie ein.</p><p><b>n = 1</b>: Spalte nach dem letzten Schritt anklicken – der Zyklus schließt sich.</p>" : ""}<p><b>Auswählen</b> markiert Linien, Kästen, Striche und Texte. Ziehen verschiebt, die runden Griffe verändern Linienenden, Doppelklick ändert Text, Entf löscht.</p></div>`}</aside><div class="edstage" id="edstage" tabindex="-1"></div></div></div>`;
  dlg.showModal(); paintEditor(); setTool(ED.tool);
  $$("#editor [data-w]").forEach(b => b.setAttribute("aria-pressed", +b.dataset.w === ED.w));
}
export const WSI = (inner) => `<svg viewBox="0 0 64 40" aria-hidden="true"><path d="M4 8H60M4 32H60" stroke="#C9D0D5" stroke-width="1" stroke-dasharray="2 2"/>${inner}</svg>`;
export const WSP = (d, w=1.2) => `<path d="${d}" stroke="${INK}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
export const WSA = (x, y1, y2) => WSP(`M${x} ${y1}V${y2}`) + arrowHead(x, y2 + (y2 > y1 ? -7 : 7), x, y2, 5);
export const WSPAL = [
  ["Funktionslinien", [["line", "Funktionslinie", {}, WSI(WSP("M6 8H20L40 32H58", 3))], ["line", "Ventil schaltet (senkrecht)", {}, WSI(WSP("M6 32H30V8H58", 3))]]],
  ["Signallinien und Signalgeber", [
    ["sig", "Grenztaster – Punkt", {sg: "punkt"}, WSI(WSP("M6 8H24L44 32", 2.4) + `<circle cx="24" cy="8" r="3" fill="${INK}"/>` + WSA(24, 8, 34))],
    ["sig", "Grenztaster – Kreis", {sg: "kreis"}, WSI(WSP("M6 8H24L44 32", 2.4) + WSA(24, 12, 34) + `<circle cx="24" cy="8" r="4.5" fill="#fff" stroke="${INK}" stroke-width="1.3"/>`)],
    ["sig", "Betätigung über Strecke – Balken", {sg: "balken"}, WSI(WSP("M6 8H40", 2.4) + `<path d="M20 8H38" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>` + WSA(38, 8, 34))],
    ["sig", "Signal von anderer Maschine", {sg: "extern"}, WSI(`<path d="M10 12H22L26 18L22 24H10Z" fill="#fff" stroke="${INK}" stroke-width="1.2"/>` + WSP("M26 18H34") + WSA(34, 18, 34))],
    ["sig", "Schleife – eigene Endlage", {}, WSI(WSP("M6 8L26 32H58", 2.4) + `<path d="M26 32C18 18 34 18 27 30" stroke="${INK}" stroke-width="1.2" fill="none"/><circle cx="26" cy="32" r="2.6" fill="${INK}"/>`)]]],
  ["Verknüpfungen und Zeit", [
    ["vk", "UND-Verknüpfung", {t: "und"}, WSI(WSP("M14 4V14H32M50 4V14H32V36") + WSP("M26 18L38 10", 2) + arrowHead(32, 29, 32, 36, 5))],
    ["vk", "ODER-Verknüpfung", {t: "oder"}, WSI(WSP("M14 4V14H32M50 4V14H32V36") + `<circle cx="32" cy="14" r="3.4" fill="${INK}"/>` + arrowHead(32, 29, 32, 36, 5))],
    ["sig", "Zeitglied", {tz: "t = 1 s"}, WSI(WSA(32, 4, 36) + `<rect x="18" y="13" width="28" height="13" rx="2" fill="#fff" stroke="${INK}" stroke-width="1.2"/>` + SVGT(32, 23, "t = 1 s", "middle", 8, 600))]]],
  ["Ablauf", [
    ["start", "Taster / Start", {}, WSI(`<rect x="12" y="16" width="12" height="12" rx="1" fill="#fff" stroke="${INK}" stroke-width="1.2"/>` + WSP("M15 19H21M18 19V25M24 20L32 10") + WSP("M32 8L58 32", 2.4))],
    ["eq", "Zyklusende n = 1", {}, WSI(WSP("M32 2V38", 2.6) + SVGT(46, 24, "n=1", "middle", 9, 700))]]]
];
export function wsPaletteHTML(){
  let n = 0;
  return WSPAL.map(([g, items]) => `<div class="palg"><div class="palh">${g}</div>${items.map(([tool, name, pre, icon]) => `<button type="button" class="palb" data-ws="${n++}" title="${name}">${icon}<span>${name}</span></button>`).join("")}</div>`).join("");
}
export const wsItem = i => WSPAL.flatMap(g => g[1])[i];
export function paletteHTML(groups){
  return groups.map(g => `<div class="palg"><div class="palh">${GN[g]}</div>${Object.entries(BLK).filter(([, b]) => b.g === g && !b.hide).map(([k, b]) => { const [o, vb, extra] = SAMPLE[k] || pcSample(k);
    return `<button type="button" class="palb" data-place="${k}" title="${b.n} setzen"><svg viewBox="${vb}" aria-hidden="true">${extra || ""}${drawObj(o, false)}</svg><span>${b.n}</span></button>`; }).join("")}</div>`).join("")
    + `<div class="palhelp">${HINT[groups[0]] ? `<p>${HINT[groups[0]]}</p>` : ""}<p><b>Ziehen:</b> Bausteine direkt aus dieser Leiste aufs Blatt ziehen – oder anklicken und dann aufs Blatt klicken.</p><p><b>Andocken:</b> Ziehen Sie einen Baustein an einen Anschluss – die blaue Vorschau zeigt die Verbindung, beim Loslassen rastet er ein.</p><p><b>Doppelklick</b> beschriftet, <b>Ziehen</b> verschiebt, <b>Entf</b> löscht, <b>Pfeiltasten</b> schieben, <b>Esc</b> bricht ab.</p></div>`;
}
export function paintEditor(){
  ED.pages = pageCount(ED.key, ED.data); ED.extraY = 0;
  $("#edstage").innerHTML = sketchSVG(ED.key, BY[ED.scope], ED.data, skMeta(ED.scope, ED.key, ED.data), true);
  const svg = ED.svg = $("#edstage svg"); sizeSVG();
  svg.addEventListener("pointerdown", edDown); svg.addEventListener("pointermove", edMove); svg.addEventListener("pointerup", edUp); svg.addEventListener("pointercancel", edUp);
  svg.addEventListener("pointerleave", () => { $(".ghost", svg).innerHTML = ""; });
}
