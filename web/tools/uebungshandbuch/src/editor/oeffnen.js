// Editor-Kern: Editor öffnen mit Werkzeugleiste und Palette, Blatt aufbauen.
import { $, $$, BY, IC, S } from '../app/basis.js';
import { ED } from './status.js';
import { BAUSTEIN, GRUPPE, SAMPLE, VORL, vorlage } from './registry.js';
import { drawObj, pageCount, pcSample } from './zeichnen.js';
import { skKey, skMeta, sketchSVG } from './blaetter.js';
import { sizeSVG } from './anzeige.js';
import { hatPruefung } from './pruefung.js';
import { setTool } from './werkzeuge.js';
import { edDown, edMove, edUp } from './zeiger.js';

// Bild für Wiederholen: gespiegeltes Rückgängig (IC.undo). Der Knopf bleibt aus, bis KERN K2 ihn schaltet.
export const IC_REDO = '<svg class="ic" viewBox="0 0 24 24"><path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/></svg>';
// Knopf „Prüfen“ nur für Vorlagen mit dem Haken pruefe (pruefung.js)
export const PRUEFKNOPF = key => hatPruefung(key)
  ? `<button type="button" class="tool" data-ed="pruefen" title="Zeichnung auf typische Fehler prüfen">Prüfen</button>` : "";
// Linien-Werkzeug, solange eine Vorlage es nicht über werkzeugleiste.linie umbenennt
export const LINIE_STANDARD = {titel: "Gerade Linie, rastet im 10er-Raster", name: "Linie"};
// Editor für die Zeichnung der Vorlage key im Bereich scope (Übung oder „frei“) öffnen.
// Die Vorlage kann Werkzeugleiste, Seitenleiste und Startwerkzeug über ihre Haken ergänzen.
export function openEditor(scope, key){
  const data = S.get(skKey(scope, key)) || {}; data.s ||= []; data.t ||= []; data.o ||= []; data.c ||= [];
  const v = vorlage(key), pal = v.gruppen || [], leiste = v.werkzeugleiste || {}, linie = leiste.linie || LINIE_STANDARD;
  const keepTool = ["pen","line","rect","text","erase"].includes(ED.tool) ? ED.tool : "pen";
  Object.assign(ED, {scope, key, data, hist:[], zukunft:[], tx:null, cur:null, sel:null, selC:null, selS:null, selT:null, from:null, place:null, drag:null, tool: pal.length ? "sel" : v.startWerkzeug || keepTool});
  const ex = BY[scope], dlg = $("#editor");
  const colors = [["#17212B","Schwarz"],["#0E4C92","Blau"],["#C0392B","Rot"]];
  dlg.innerHTML = `<div class="ed"><div class="edbar">
    <span class="ttl">${VORL[key].n}${ex ? ` – ${ex.id}` : ""}</span>
    <button type="button" class="tool" data-tool="sel" title="Bausteine, Linien und Texte markieren, verschieben, ändern">${IC.cursor}Auswählen</button>
    ${pal.length ? `<button type="button" class="tool" data-tool="conn" title="Zwei Bausteine bzw. Anschlüsse nacheinander anklicken">${IC.link}Verbinden</button>` : ""}${leiste.nachVerbinden || ""}<span class="sep"></span>
    ${colors.map(([c, n]) => `<button type="button" class="tool" data-tool="pen" data-color="${c}"><span class="dot" style="background:${c}"></span>${n}</button>`).join("")}
    <button type="button" class="tool" data-tool="line" title="${linie.titel}">${IC.line}${linie.name}</button>
    ${leiste.nachLinie || ""}
    <button type="button" class="tool" data-tool="rect" title="Rechteck, rastet im 10er-Raster">${IC.rect}Kasten</button>
    <button type="button" class="tool" data-tool="text">${IC.text}Text</button>
    <button type="button" class="tool" data-tool="erase">${IC.eraser}Radierer</button>
    <span class="sep"></span>
    <button type="button" class="tool" data-ed="grid" aria-pressed="${ED.grid}" title="Bausteine und Linien rasten im 10er-Raster ein">${IC.grid}Raster fangen</button>
    ${pal.length ? `<button type="button" class="tool" data-ed="dock" aria-pressed="${ED.dock}" title="Bausteine richten sich an Nachbarn aus und verbinden sich automatisch">${IC.magnet}Andocken</button>` : ""}
    <span class="sep"></span>
    <button type="button" class="tool" data-w="1.4">dünn</button><button type="button" class="tool" data-w="2.2">mittel</button><button type="button" class="tool" data-w="4">dick</button>
    <span class="sep"></span>
    <span class="takewrap"><button type="button" class="tool" data-ed="take" aria-haspopup="true" title="Eine eigene Zeichnung dieser Art aus einer anderen Übung in diese Übung kopieren">${IC.copy}Aus früherer Übung</button></span><button type="button" class="tool" data-ed="undo" title="Strg+Z">${IC.undo}Rückgängig</button><button type="button" class="tool" data-ed="redo" title="Strg+Y" disabled>${IC_REDO}Wiederholen</button><button type="button" class="tool" data-ed="del" title="Entf">${IC.trash}Markiertes löschen</button><button type="button" class="tool" data-ed="clear">Alles leeren</button>${PRUEFKNOPF(key)}
    <span style="flex:1"></span>
    <button type="button" class="btn small" data-ed="print">${IC.print}Drucken</button><button type="button" class="btn primary small" data-ed="close">Fertig</button>
  </div><div class="edbody"><aside class="pal" aria-label="Bausteine und Eigenschaften"><div id="props"></div>${pal.length ? paletteHTML(pal) : (v.seitenleiste ? v.seitenleiste() : "") + `<div class="palhelp">${v.hilfe || ""}<p><b>Auswählen</b> markiert Linien, Kästen, Striche und Texte. Ziehen verschiebt, die runden Griffe verändern Linienenden, Doppelklick ändert Text, Entf löscht.</p></div>`}</aside><div class="edstage" id="edstage" tabindex="-1"></div></div></div>`;
  dlg.showModal(); paintEditor(); setTool(ED.tool);
  $$("#editor [data-w]").forEach(b => b.setAttribute("aria-pressed", +b.dataset.w === ED.w));
}
export function paletteHTML(groups){
  return groups.map(g => `<div class="palg"><div class="palh">${GRUPPE[g].name}</div>${Object.entries(BAUSTEIN).filter(([, b]) => b.g === g && !b.hide).map(([k, b]) => { const [o, vb, extra] = SAMPLE[k] || pcSample(k);
    return `<button type="button" class="palb" data-place="${k}" title="${b.n} setzen"><svg viewBox="${vb}" aria-hidden="true">${extra || ""}${drawObj(o, false)}</svg><span>${b.n}</span></button>`; }).join("")}</div>`).join("")
    + `<div class="palhelp">${GRUPPE[groups[0]].hinweis ? `<p>${GRUPPE[groups[0]].hinweis}</p>` : ""}<p><b>Ziehen:</b> Bausteine direkt aus dieser Leiste aufs Blatt ziehen – oder anklicken und dann aufs Blatt klicken.</p><p><b>Andocken:</b> Ziehen Sie einen Baustein an einen Anschluss – die blaue Vorschau zeigt die Verbindung, beim Loslassen rastet er ein.</p><p><b>Doppelklick</b> beschriftet, <b>Ziehen</b> verschiebt, <b>Entf</b> löscht, <b>Pfeiltasten</b> schieben, <b>Esc</b> bricht ab.</p></div>`;
}
export function paintEditor(){
  ED.pages = pageCount(ED.key, ED.data); ED.extraY = 0;
  $("#edstage").innerHTML = sketchSVG(ED.key, BY[ED.scope], ED.data, skMeta(ED.scope, ED.key, ED.data), true);
  const svg = ED.svg = $("#edstage svg"); sizeSVG();
  svg.addEventListener("pointerdown", edDown); svg.addEventListener("pointermove", edMove); svg.addEventListener("pointerup", edUp); svg.addEventListener("pointercancel", edUp);
  svg.addEventListener("pointerleave", () => { $(".ghost", svg).innerHTML = ""; });
}
