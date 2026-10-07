// Editor-Kern: Listener des Editor-Dialogs (Palette ziehen, Klicks, Eigenschaftsfeld, Tastatur, Schließen).
import { $, $$ } from '../app/basis.js';
import { ED } from './status.js';
import { art, vorlage } from './registry.js';
import { clearSel, markiertesObjekt } from './auswahl.js';
import { deDate } from './blaetter.js';
import { istSignalFeld, schliesseListe, signalEingabe, signalWahl } from './signalfeld.js';
import { lastProp, setLastProp, updateProps } from './eigenschaften.js';
import { sizeSVG } from './anzeige.js';
import { pruefeSkizze, waehleBefund, zeigeBefunde } from './pruefung.js';
import { aendere, beginne, redo, schliesse, takeMenu, takeSketch, undo } from './verlauf.js';
import { blattPunkt, fokusAufsBlatt, setTool } from './werkzeuge.js';
import { applyProp, delSel, turnSel } from './bearbeiten.js';
import { placeObj } from './andocken.js';
import { zeigerBewegen } from './zeiger.js';
import { rasterUmschalten, taste, werkzeugNachAbbruch } from './tastatur.js';
import { doPrint, sketchPage } from '../app/druck.js';
import { route } from '../app/router.js';

export let palDrag = null;   // Ziehen aus der Palette: {k, x, y, on}
export const overSheet = e => {
  const r = ED.svg && $("#edstage").getBoundingClientRect();
  return r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
};

/* ---------- Ziehen aus der Palette ---------- */
export function paletteDruecken(e){
  const pb = e.target.closest("[data-place]");
  if (pb && e.button === 0) { e.preventDefault(); palDrag = {k: pb.dataset.place, x: e.clientX, y: e.clientY, on: false}; }
}
export function paletteZiehen(e){
  if (!palDrag || !ED.svg) return;
  if (!palDrag.on && Math.hypot(e.clientX - palDrag.x, e.clientY - palDrag.y) > 6) {   // erst ab 6 px ist es Ziehen
    palDrag.on = true; ED.ausPalette = true; ED.place = palDrag.k; setTool("place"); document.body.classList.add("dnd");
  }
  if (palDrag.on) { if (overSheet(e)) zeigerBewegen(e); else $(".ghost", ED.svg).innerHTML = ""; }
}
export function paletteLoslassen(e){
  if (!palDrag) return;
  const d = palDrag;
  palDrag = null; document.body.classList.remove("dnd");
  if (!d.on) return;
  ED.klickAuslassen = true; ED.zusatzY = 0;
  if (overSheet(e)) placeObj(d.k, blattPunkt(ED.svg, e)); else werkzeugNachAbbruch();
  ED.ausPalette = false;
}

/* ---------- Klicks ---------- */
// Knöpfe mit data-ed: Aktion je Name
export const AKTIONEN = {
  undo: () => undo(),
  redo: () => redo(),
  pruefen: () => zeigeBefunde(pruefeSkizze()),
  befund: t => waehleBefund(+t.dataset.n),
  take: t => takeMenu(t),
  takeit: t => takeSketch(t.dataset.from),
  rot: () => turnSel("rot"),
  flip: () => turnSel("flip"),
  sfzu: () => { clearSel(); updateProps("neu"); },
  heute: () => { const f = $('#props [data-prop="md"]'); if (f) { f.value = deDate(Date.now()); applyProp("md", f.value); } },
  del: () => delSel(),
  grid: () => rasterUmschalten(),
  dock: t => { ED.dock = !ED.dock; t.setAttribute("aria-pressed", ED.dock); },
  clear: () => alleLeeren(),
  print: () => doPrint(sketchPage(ED.scope, ED.key, true)),
  close: () => $("#editor").close(),
};
export const LEEREN_FRAGE = "Die ganze Skizze löschen? Das Schriftfeld bleibt, Rückgängig holt die Skizze zurück.";
// „Alles leeren“: Bausteine, Striche und Texte weg, das Schriftfeld (meta) bleibt
export function alleLeeren(){
  if (!(ED.data.s.length || ED.data.t.length || ED.data.o.length) || !confirm(LEEREN_FRAGE)) return;
  clearSel();
  aendere(d => ({s: [], t: [], o: [], c: [], ...(d.meta ? {meta: d.meta} : {})}));
}
export function klick(e){
  if (ED.klickAuslassen) { ED.klickAuslassen = false; if (e.target.closest("[data-place]")) return; }   // Klick nach Ziehen aus der Palette
  const pb = e.target.closest("[data-place]");
  if (pb) { ED.place = pb.dataset.place; setTool("place"); return; }
  const v = vorlage(ED.key);
  if (v.klick && v.klick(e)) return;   // Haken klick: Bedienelemente der Vorlage, z. B. Werkzeuge der Seitenleiste
  const sy = e.target.closest("[data-sym]");
  if (sy) { zeichenEinfuegen(sy.dataset.sym); return; }
  const t = e.target.closest("[data-tool],[data-w],[data-ed]");
  if (!t) return;
  if (t.dataset.tool) { if (t.dataset.color) ED.color = t.dataset.color; setTool(t.dataset.tool); }
  if (t.dataset.w) { ED.w = +t.dataset.w; $$("#editor [data-w]").forEach(b => b.setAttribute("aria-pressed", b === t)); }
  const a = AKTIONEN[t.dataset.ed];
  if (a) a(t);
  zurueckZumBlatt(e, t);
}
// Nach einem Mausklick auf einen Knopf (oder wenn der Knopf beim Neuzeichnen verschwunden ist) gehen die Tasten wieder
// ans Blatt. Sonst löst die Leertaste den Knopf erneut aus, und Entf oder Pfeile kommen nicht im Editor an.
// Hat die Aktion selbst ein Eingabefeld fokussiert (z. B. Schriftfeld), bleibt der Fokus dort.
export function zurueckZumBlatt(e, knopf){
  if (document.activeElement && document.activeElement.matches("input,textarea,select")) return;
  if (e.detail > 0 || !knopf.isConnected) fokusAufsBlatt();
}
// Zeichenleiste (·, +, ¬ …): Zeichen ins zuletzt benutzte Feld an der Schreibmarke einfügen
export function zeichenEinfuegen(zeichen){
  const el = lastProp;
  if (!el || !el.isConnected || (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA")) return;
  const a = el.selectionStart ?? el.value.length, b = el.selectionEnd ?? a;
  el.value = el.value.slice(0, a) + zeichen + el.value.slice(b);
  el.focus(); el.setSelectionRange(a + zeichen.length, a + zeichen.length);
  applyProp(el.dataset.prop, el.value);
}

/* ---------- Eigenschaftsfeld ---------- */
export function feldGeaendert(e){
  const f = e.target.dataset && e.target.dataset.prop, o = markiertesObjekt();
  if (!f || !o || !(art(o.k).umbau || []).includes(f)) return;   // Haken umbau: diese Felder ändern das Eigenschaftsfeld
  applyProp(f, e.target.value); updateProps("neu");
  const again = $(`#props [data-prop="${f}"]`); if (again) again.focus();
}

// Tippen in einem Feld ist ein Verlaufsschritt je Feld und markiertem Element (Transaktion in verlauf.js)
export const beginneFeld = f => beginne("feld:" + (ED.markiert ? ED.markiert.art + ED.markiert.id : "") + ":" + f);
export const schliesseFeld = () => { if (ED.tx && ED.tx.schluessel.startsWith("feld:")) schliesse(); };

// Seiteneffekte: Listener des Editor-Dialogs. main.js ruft init() in der ursprünglichen Reihenfolge auf.
export function init(){
  const dlg = $("#editor");
  addEventListener("resize", () => { if (ED.svg) sizeSVG(); });
  dlg.addEventListener("pointerdown", paletteDruecken);
  dlg.addEventListener("selectstart", e => { if (!e.target.closest || !e.target.closest("input,textarea")) e.preventDefault(); });
  document.addEventListener("pointermove", paletteZiehen);
  document.addEventListener("pointerup", paletteLoslassen);
  dlg.addEventListener("click", klick);
  dlg.addEventListener("focusin", e => { if (e.target.dataset && e.target.dataset.prop) setLastProp(e.target); });
  dlg.addEventListener("input", e => {
    const f = e.target.dataset && e.target.dataset.prop;
    if (istSignalFeld(e.target)) signalEingabe(e.target);   // Minuszeichen, Vorschlagsliste
    if (f) { beginneFeld(f); applyProp(f, e.target.value); }
  });
  dlg.addEventListener("focusout", e => {
    if (istSignalFeld(e.target)) schliesseListe(e.target);
    if (e.target.dataset && e.target.dataset.prop) schliesseFeld();
  });
  dlg.addEventListener("change", feldGeaendert);
  dlg.addEventListener("pointerdown", e => { if (e.target.closest(".sym")) e.preventDefault(); signalWahl(e); });   // Fokus im Feld lassen
  dlg.addEventListener("keydown", taste);
  // Liegt der Fokus nach einem Klick auf eine leere Fläche auf body, kommen die Tasten trotzdem im Editor an
  document.addEventListener("keydown", e => { if (ED.svg && !dlg.contains(e.target)) taste(e); });
  dlg.addEventListener("cancel", e => e.preventDefault());   // Esc schließt den Editor nie, nur „Fertig“
  dlg.addEventListener("close", () => { ED.svg = null; ED.sim = {on: false, st: {}, pos: {}}; route(); });
}
