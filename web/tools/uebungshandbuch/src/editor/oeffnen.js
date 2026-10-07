// Editor-Kern: Editor öffnen. Zustand zurücksetzen, Werkzeugleiste, Seitenleiste mit Palette, Blatt aufbauen.
// Die Vorlage ergänzt Werkzeugleiste, Seitenleiste und Startwerkzeug über ihre Haken (vorlage(key)).
import { $, $$, BY, IC, S } from '../app/basis.js';
import { ED } from './status.js';
import { BAUSTEIN, GRUPPE, SAMPLE, vorlage } from './registry.js';
import { drawObj, pageCount, pcSample } from './zeichnen.js';
import { skKey, skMeta, sketchSVG } from './blaetter.js';
import { FARBEN, STAERKEN } from './eigenschaften.js';
import { sizeSVG } from './anzeige.js';
import { hatPruefung } from './pruefung.js';
import { mitListen } from './verlauf.js';
import { setTool } from './werkzeuge.js';
import { edDown, edMove, edUp } from './zeiger.js';

// Bild für Wiederholen: gespiegeltes Rückgängig (IC.undo). Der Knopf bleibt aus, bis KERN K2 ihn schaltet.
export const IC_REDO = '<svg class="ic" viewBox="0 0 24 24"><path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/></svg>';
// Knopf „Prüfen“ nur für Vorlagen mit dem Haken pruefe (pruefung.js)
export const PRUEFKNOPF = key => hatPruefung(key)
  ? `<button type="button" class="tool" data-ed="pruefen" title="Zeichnung auf typische Fehler prüfen">Prüfen</button>` : "";
// Linien-Werkzeug, solange eine Vorlage es nicht über werkzeugleiste.linie umbenennt
export const LINIE_STANDARD = {titel: "Gerade Linie, rastet im 10er-Raster", name: "Linie"};
// Zeichenwerkzeuge, die beim nächsten Öffnen gewählt bleiben
export const ZEICHENWERKZEUGE = ["pen", "line", "rect", "text", "erase"];

// Editor für die Zeichnung der Vorlage key im Bereich scope (Übung oder „frei“) öffnen
export function openEditor(scope, key){
  const v = vorlage(key), pal = v.gruppen || [];
  const tool = pal.length ? "sel" : v.startWerkzeug || (ZEICHENWERKZEUGE.includes(ED.tool) ? ED.tool : "pen");
  zuruecksetzen(scope, key, mitListen(S.get(skKey(scope, key)) || {}), tool);
  const dlg = $("#editor");
  dlg.innerHTML = `<div class="ed">${werkzeugleisteHTML(v, key, pal)}<div class="edbody">${seitenleisteHTML(v, pal)}`
    + `<div class="edstage" id="edstage" tabindex="-1"></div></div></div>`;
  dlg.showModal(); paintEditor(); setTool(ED.tool);
  $$("#editor [data-w]").forEach(b => b.setAttribute("aria-pressed", +b.dataset.w === ED.w));
}
// Zustand für die neu geöffnete Zeichnung: Verlauf, Markierung und Zustand der Vorlage beginnen leer
export function zuruecksetzen(scope, key, data, tool){
  Object.assign(ED, {scope, key, data, tool, hist: [], zukunft: [], tx: null, strich: null, markiert: null, verbindenVon: null,
    place: null, drag: null, vorlage: {}});
}

/* ---------- Werkzeugleiste ---------- */
// Knopf für ein Werkzeug (data-tool) bzw. eine Aktion (data-ed); zusatz sind weitere Attribute, z. B. ' title="…"'
export const werkzeugKnopf = (tool, inhalt, zusatz = "") => `<button type="button" class="tool" data-tool="${tool}"${zusatz}>${inhalt}</button>`;
export const aktionsKnopf = (ed, inhalt, zusatz = "") => `<button type="button" class="tool" data-ed="${ed}"${zusatz}>${inhalt}</button>`;
export const titelAttr = t => ` title="${t}"`;
export const TRENNER = `<span class="sep"></span>`;
export const farbKnopf = ([c, n]) => `<button type="button" class="tool" data-tool="pen" data-color="${c}"><span class="dot" style="background:${c}"></span>${n}</button>`;
export const staerkeKnopf = ([w, n]) => `<button type="button" class="tool" data-w="${w}">${n}</button>`;
export const KOPIEREN = `<span class="takewrap">`
  + aktionsKnopf("take", IC.copy + "Aus früherer Übung", ` aria-haspopup="true"`
    + titelAttr("Eine eigene Zeichnung dieser Art aus einer anderen Übung in diese Übung kopieren")) + `</span>`;
export const ABSCHLUSS = `<button type="button" class="btn small" data-ed="print">${IC.print}Drucken</button>`
  + `<button type="button" class="btn primary small" data-ed="close">Fertig</button>`;

// Zeilen der Werkzeugleiste; jede Zeile ist eine Gruppe von Knöpfen
export function werkzeugleisteZeilen(v, key, mitPalette){
  const ex = BY[ED.scope], leiste = v.werkzeugleiste || {}, linie = leiste.linie || LINIE_STANDARD;
  return [
    [`<span class="ttl">${v.n}${ex ? ` – ${ex.id}` : ""}</span>`],
    [werkzeugKnopf("sel", IC.cursor + "Auswählen", titelAttr("Bausteine, Linien und Texte markieren, verschieben, ändern"))],
    [mitPalette ? werkzeugKnopf("conn", IC.link + "Verbinden", titelAttr("Zwei Bausteine bzw. Anschlüsse nacheinander anklicken")) : "",
      leiste.nachVerbinden || "", TRENNER],
    FARBEN.map(farbKnopf),
    [werkzeugKnopf("line", IC.line + linie.name, titelAttr(linie.titel))],
    [leiste.nachLinie || ""],
    [werkzeugKnopf("rect", IC.rect + "Kasten", titelAttr("Rechteck, rastet im 10er-Raster"))],
    [werkzeugKnopf("text", IC.text + "Text")],
    [werkzeugKnopf("erase", IC.eraser + "Radierer")],
    [TRENNER],
    [aktionsKnopf("grid", IC.grid + "Raster fangen", ` aria-pressed="${ED.grid}"` + titelAttr("Bausteine und Linien rasten im 10er-Raster ein"))],
    [mitPalette ? aktionsKnopf("dock", IC.magnet + "Andocken", ` aria-pressed="${ED.dock}"`
      + titelAttr("Bausteine richten sich an Nachbarn aus und verbinden sich automatisch")) : ""],
    [TRENNER],
    STAERKEN.map(staerkeKnopf),
    [TRENNER],
    [KOPIEREN, aktionsKnopf("undo", IC.undo + "Rückgängig", titelAttr("Strg+Z")), aktionsKnopf("redo", IC_REDO + "Wiederholen", titelAttr("Strg+Y") + " disabled"),
      aktionsKnopf("del", IC.trash + "Markiertes löschen", titelAttr("Entf")), aktionsKnopf("clear", "Alles leeren"), PRUEFKNOPF(key)],
    [`<span style="flex:1"></span>`],
    [ABSCHLUSS],
  ];
}
export function werkzeugleisteHTML(v, key, pal){
  const zeilen = werkzeugleisteZeilen(v, key, pal.length > 0).map(z => z.join(""));
  return `<div class="edbar">\n    ${zeilen.join("\n    ")}\n  </div>`;
}

/* ---------- Seitenleiste ---------- */
export const AUSWAHL_HILFE = `<p><b>Auswählen</b> markiert Linien, Kästen, Striche und Texte. Ziehen verschiebt, die runden Griffe verändern `
  + `Linienenden, Doppelklick ändert Text, Entf löscht.</p>`;
export const PALETTE_HILFE = `<p><b>Ziehen:</b> Bausteine direkt aus dieser Leiste aufs Blatt ziehen – oder anklicken und dann aufs Blatt `
  + `klicken.</p><p><b>Andocken:</b> Ziehen Sie einen Baustein an einen Anschluss – die blaue Vorschau zeigt die Verbindung, beim `
  + `Loslassen rastet er ein.</p><p><b>Doppelklick</b> beschriftet, <b>Ziehen</b> verschiebt, <b>Entf</b> löscht, <b>Pfeiltasten</b> `
  + `schieben, <b>Esc</b> bricht ab.</p>`;
// Eigenschaftsfeld oben, darunter die Palette oder (ohne Palette) die Seitenleiste und Hilfe der Vorlage
export function seitenleisteHTML(v, pal){
  const inhalt = pal.length ? paletteHTML(pal)
    : (v.seitenleiste ? v.seitenleiste() : "") + `<div class="palhelp">${v.hilfe || ""}${AUSWAHL_HILFE}</div>`;
  return `<aside class="pal" aria-label="Bausteine und Eigenschaften"><div id="props"></div>${inhalt}</aside>`;
}
// Palettenknopf für die Bausteinart k mit Bild (SAMPLE oder Bauteil mit Vorgaben)
export function paletteKnopf([k, b]){
  const [o, vb, extra] = SAMPLE[k] || pcSample(k);
  return `<button type="button" class="palb" data-place="${k}" title="${b.n} setzen"><svg viewBox="${vb}" aria-hidden="true">`
    + `${extra || ""}${drawObj(o, false)}</svg><span>${b.n}</span></button>`;
}
export function paletteHTML(groups){
  const gruppeHTML = g => `<div class="palg"><div class="palh">${GRUPPE[g].name}</div>`
    + Object.entries(BAUSTEIN).filter(([, b]) => b.g === g && !b.hide).map(paletteKnopf).join("") + `</div>`;
  const hinweis = GRUPPE[groups[0]].hinweis;
  return groups.map(gruppeHTML).join("") + `<div class="palhelp">${hinweis ? `<p>${hinweis}</p>` : ""}${PALETTE_HILFE}</div>`;
}

/* ---------- Blatt ---------- */
export function paintEditor(){
  ED.blattzahl = pageCount(ED.key, ED.data); ED.zusatzY = 0;
  $("#edstage").innerHTML = sketchSVG(ED.key, BY[ED.scope], ED.data, skMeta(ED.scope, ED.key, ED.data), true);
  const svg = ED.svg = $("#edstage svg"); sizeSVG();
  svg.addEventListener("pointerdown", edDown); svg.addEventListener("pointermove", edMove);
  svg.addEventListener("pointerup", edUp); svg.addEventListener("pointercancel", edUp);
  svg.addEventListener("pointerleave", () => { $(".ghost", svg).innerHTML = ""; });
}
