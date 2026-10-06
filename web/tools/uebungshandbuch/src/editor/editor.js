import { CYL, SHEETS } from '../app/daten.js';
import { $, $$, BY, IC, S, esc } from '../app/basis.js';
import { INK, PH, SVGT, arrowHead } from './svg.js';
import { ED } from './status.js';
import { BLK, FIXED, GN, HINT, LABEL_HINT, PAL, PC, PROPS, SAMPLE, VORL } from './registry.js';
import { shapeD, snap, wsAus } from './vorlagen-svg.js';
import { nearestPort, portCap, simOn, vrails } from './bauteile.js';
import { ACT_T, atype, aw, bbox, ctr, fam, hasMark, isAct, isActKey } from './bausteine.js';
import { connGeom, drawObj, inPt, inkSVG, outPt, pageCount, pcSample, simClick, simCompute, simStep } from './zeichnen.js';
import { deDate, pagesSVG, skKey, skMeta, sketchSVG } from './blaetter.js';

export const objById = id => ED.data.o.find(o => o.id === id) || (String(id).startsWith("_") ? vrails(ED.key, ED.pages || 1).find(r => r.id === id) : undefined);
export const uid = () => "o" + Math.random().toString(36).slice(2, 9);
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
export function sizeSVG(){
  const st = $("#edstage"), svg = ED.svg; if (!st || !svg) return;
  const w = Math.max(320, Math.min(st.clientWidth - 28, (st.clientHeight - 28) * 1000 / PH));
  svg.style.width = w + "px"; svg.style.height = (w * PH * ED.pages / 1000) + "px";
}
export function checkPages(){
  const n = pageCount(ED.key, ED.data, ED.extraY || 0);
  if (!ED.svg || n === ED.pages) return;
  ED.pages = n; ED.svg.setAttribute("viewBox", `0 0 1000 ${PH*n}`);
  refreshTpl(); sizeSVG();
}
export function renderInk(){ if (ED.svg) { ED.svg.querySelector(".ink").innerHTML = inkSVG(ED.data, true, ED.key); checkPages(); } updateProps(); }
export const SYMS = `<div class="syms" aria-label="Zeichen einfügen">${[["·","UND"],["+","ODER"],["¬","NICHT"],["↑","steigende Flanke"],["↓","fallende Flanke"],[":=","Zuweisung"],["≥","größer gleich"]].map(([c, t]) => `<button type="button" class="sym" data-sym="${c}" title="${t}">${c}</button>`).join("")}</div>`;
export let propsKey = null, lastProp = null;
export const setLastProp = (el) => { lastProp = el; };   // für den focusin-Listener in ereignisse.js
export function propsHTML(){
  if (ED.key === "wegschritt" && !anySel() && ["sig", "line", "start", "eq", "vk"].includes(ED.tool)) {
    const step = t => `<li style="margin:0 0 6px">${t}</li>`;
    const how = {
      sig: ED.pend ? [`Jetzt den <b>Zielpunkt</b> anklicken: den Beginn der Bewegung, die ausgelöst wird.`, `Für eine <b>Schleife</b> denselben Punkt noch einmal anklicken.`, `Esc bricht ab.`]
                   : [`Den <b>Auslösepunkt</b> anklicken – meist die Endlage, an der der Sensor schaltet.`, `Dann den <b>Zielpunkt</b> anklicken – den Beginn der ausgelösten Bewegung.`, `Danach den Sensor eintragen, z. B. −BG2.`, `Bei UND/ODER als Zielpunkt den Verknüpfungspunkt anklicken – er fängt die Linie.`],
      line: ED.pend ? [`Nächsten <b>Eckpunkt</b> anklicken – die Funktionslinie läuft weiter.`, `Den letzten Punkt noch einmal anklicken oder Esc: Linie beenden.`]
                    : [`<b>Eckpunkte nacheinander anklicken</b>: waagrecht = Stillstand, schräg = Bewegung, senkrecht = Ventil schaltet.`, `Oder von Ecke zu Ecke ziehen.`],
      start: [`Den <b>Beginn der Bewegung</b> anklicken, die der Taster startet.`, `Taster und Pfeil werden ins Schrittfeld gesetzt; die Bezeichnung (z. B. −SF1) links ändern.`],
      vk: [`Den <b>Zielpunkt</b> anklicken – den Beginn der Bewegung, die erst ausgelöst wird, wenn die Bedingung erfüllt ist.`, `Davor entsteht der Verknüpfungspunkt (UND = Schrägstrich, ODER = Punkt) mit Pfeil zum Ziel.`, `Danach mit <b>Signallinie</b> jeden Signalgeber anklicken und dann den Verknüpfungspunkt – die Linien laufen dort zusammen.`],
      eq: [`Die <b>Spalte nach dem letzten Schritt</b> anklicken – sie wird zu „n = 1“, der Zyklus schließt sich.`]
    }[ED.tool];
    const titel = {sig: "Signallinie" + (ED.wsPreset && ED.wsPreset.tz ? " mit Zeitglied" : ""), line: "Funktionslinie", start: "Taster / Start", eq: "Zyklusende", vk: ED.wsPreset && ED.wsPreset.t === "oder" ? "ODER-Verknüpfung" : "UND-Verknüpfung"}[ED.tool];
    return `<div class="props"><div class="palh">${titel}</div><ol style="margin:0;padding-left:18px;font-size:13.5px;line-height:1.45">${how.map(step).join("")}</ol></div>`;
  }
  if (ED.tool === "sim") return `<div class="props"><div class="palh">Simulation</div><p class="small" style="margin:0 0 6px">Auf die Betätigung <b>links</b> oder <b>rechts</b> eines Ventils klicken: Es schaltet um. Druckführende Leitungen werden blau, Zylinder fahren, Endlagensensoren leuchten grün.</p><p class="small muted" style="margin:0">Monostabile Ventile fallen beim zweiten Klick in die Grundstellung zurück. Zum Bearbeiten „Auswählen“ wählen.</p></div>`;
  const inp = (f, lbl, ph, val) => ["v", "tv", "cv", "b"].includes(f)
    ? `<label class="prop">${lbl}<textarea data-prop="${f}" rows="${Math.max(1, String(val ?? "").split("\n").length)}" placeholder="${esc(ph || "")}" title="Alt+Enter: neue Zeile">${esc(val ?? "")}</textarea></label>`
    : `<label class="prop">${lbl}<input type="text" data-prop="${f}" value="${esc(val ?? "")}" placeholder="${esc(ph || "")}" autocomplete="off"></label>`;
  const sel = (f, lbl, opts, cur) => `<label class="prop">${lbl}<select data-prop="${f}">${opts.map(([v, n]) => `<option value="${v}" ${String(v) === String(cur) ? "selected" : ""}>${n}</option>`).join("")}</select></label>`;
  const COL = [["#17212B","Schwarz"],["#0E4C92","Blau"],["#C0392B","Rot"]], del = `<div class="propact"><button type="button" class="tool" data-ed="del">${IC.trash}Löschen</button></div>`;
  if (ED.selT !== null && ED.data.t[ED.selT]) { const t = ED.data.t[ED.selT];
    return `<div class="props"><div class="palh">Text</div>${inp("tv", "Text", "", t.v)}${SYMS}${sel("ts", "Größe", [[12,"klein"],[16,"normal"],[20,"groß"],[26,"sehr groß"]], t.s || 16)}${sel("sc", "Farbe", COL, t.c)}${del}</div>`; }
  if (ED.selS !== null && ED.data.s[ED.selS]) { const st = ED.data.s[ED.selS];
    if (st.k === "eq") return `<div class="props"><div class="palh">Zyklusende</div><p class="small muted" style="margin:0 0 8px">Der Schritt in dieser Spalte entspricht wieder Schritt 1 – der Ablauf beginnt von vorn.</p>${del}</div>`;
    if (st.k === "st") return `<div class="props"><div class="palh">Startbedingung</div>${inp("sl", "Starttaster / Bedingung", "z. B. −SF1 START", st.lbl)}${sel("sc", "Farbe", COL, st.c)}<p class="small muted" style="margin:0 0 8px">Der Pfeil zeigt auf den Beginn der ersten Bewegung.</p>${del}</div>`;
    if (st.k === "vk") return `<div class="props"><div class="palh">Verknüpfung</div>${sel("vt", "Art", [["und","UND – Schrägstrich: alle Signale müssen anliegen"],["oder","ODER – Punkt: ein Signal genügt"]], st.t || "und")}<p class="small muted" style="margin:0 0 8px">Signallinien von den Signalgebern enden hier, die Linie mit Pfeil führt zum ausgelösten Bewegungsbeginn.</p>${del}</div>`;
    if (st.k === "sig") return `<div class="props"><div class="palh">Signallinie</div>${inp("sl", "Signalgeber (steht am Ausgangspunkt)", "z. B. −BG2", st.lbl)}${sel("sg", "Darstellung des Signalgebers", [["punkt","Grenztaster / Sensor – Punkt"],["kreis","Grenztaster – Kreis"],["balken","Betätigung über eine Strecke – Balken"],["extern","Signal von anderer Maschine"]], st.sg || "punkt")}${inp("tz", "Zeitglied (optional)", "z. B. t = 10 s", st.tz)}${sel("sc", "Farbe", COL, st.c)}<p class="small muted" style="margin:0 0 8px">Signallinien sind dünn, Funktionslinien dick. Die Linie beginnt am Signalgeber und endet mit dem Pfeil dort, wo die Zustandsänderung ausgelöst wird.</p>${del}</div>`;
    return `<div class="props"><div class="palh">${st.k === "l" ? "Linie" : st.k === "r" ? "Kasten" : "Freihandstrich"}</div>${sel("sc", "Farbe", COL, st.c)}${sel("sw", "Strichstärke", [[1.4,"dünn"],[2.2,"mittel"],[4,"dick"]], st.w)}${st.k ? `<p class="small muted" style="margin:0 0 8px">Die runden Griffe an den Enden ziehen.</p>` : ""}${del}</div>`; }
  const o = ED.sel && objById(ED.sel);
  if (o) {
    let h = "";
    if (isAct(o)) {
      const t = atype(o);
      h += `<label class="prop">Art<select data-prop="t">${Object.entries(ACT_T).map(([k, n]) => `<option value="${k}" ${k === t ? "selected" : ""}>${n}</option>`).join("")}</select></label>`;
      if (t === "q") h += `<label class="prop">Bestimmungszeichen<select data-prop="q">${["N","S","R","D","L","P","SD","DS","SL"].map(q => `<option ${q === (o.q || "S") ? "selected" : ""}>${q}</option>`).join("")}</select></label>`;
      h += inp("v", "Aktion", "z. B. MB1 oder Z := Z + 1", o.v);
      if (t === "kont") h += inp("b", "Zuweisungsbedingung (optional)", "z. B. BG9 oder 3s/X2", o.b);
      if (t === "ereig") h += inp("b", "Ereignis", "z. B. ↑BG1", o.b);
    } else if (PC[o.k]) {
      h += inp("v", o.k === "rail" ? "Potenzial, z. B. L+, M, L1, PE" : "Kennzeichen", PC[o.k].lbl, o.v);
      (PC[o.k].props || []).forEach(([f, lbl, ty, opts]) => { h += ty === "select" ? sel(f, lbl, opts, o[f] ?? (PC[o.k].def || {})[f]) : inp(f, lbl, "", f === "w" ? (o.w || 400) : o[f]); });
      if (PC[o.k].info) h += `<p class="small muted" style="margin:0 0 8px;line-height:1.45">${PC[o.k].info}</p>`;
      if (o.k !== "rail") h += `<div class="propact" style="justify-content:flex-start;gap:6px;margin-bottom:8px"><button type="button" class="tool" data-ed="rot" title="Taste R">↻ Drehen 90°</button><button type="button" class="tool" data-ed="flip" title="Taste M">⇋ Spiegeln</button></div>`;
    } else for (const [f, lbl, ph] of (PROPS[o.k] || [])) h += inp(f, lbl, ph, f === "w" ? (o.w || 200) : o.v);
    return `<div class="props"><div class="palh">${isAct(o) ? "Aktion" : BLK[o.k].n}</div>${h}${h ? SYMS : ""}<div class="propact"><button type="button" class="tool" data-ed="del">${IC.trash}Löschen</button></div></div>`;
  }
  const c = ED.selC !== null && ED.data.c[ED.selC];
  if (c && (c.pa !== undefined || c.pb !== undefined)) return `<div class="props"><div class="palh">Leitung</div>${inp("cv", "Beschriftung (optional)", "z. B. Aderfarbe oder Querschnitt", c.v)}${sel("cst", "Leitungsart", [["", "Arbeits-/Hauptleitung"], ["st", "Steuerleitung (gestrichelt)"]], c.st || "")}${del}</div>`;
  if (c) { const g = fam(objById(c.a));
    return `<div class="props"><div class="palh">Verbindung</div>${g === "zustand" || g === "regel" ? inp("cv", "Beschriftung", "z. B. BG13 / QA1", c.v) + SYMS : `<p class="small muted" style="margin:0 0 8px">GRAFCET-Verbindungen tragen keine Beschriftung – die Bedingung steht an der Transition.</p>`}<div class="propact"><button type="button" class="tool" data-ed="del">${IC.trash}Löschen</button></div></div>`; }
  if (!ED.selF) return `<div class="props quiet"><p>Element anklicken zum Ändern, Doppelklick beschriftet. Name und Datum: aufs Schriftfeld klicken.</p></div>`;
  const m = ED.data.meta || {}, auto = skMeta(ED.scope, ED.key, {...ED.data, meta: {}});
  return `<div class="props"><div class="palh">Schriftfeld</div>${inp("mt", "Titel", auto.title, m.title)}${inp("mn", "Name", auto.name || "Name eintragen", m.name)}
    <label class="prop">Datum<span style="display:flex;gap:6px"><input type="text" data-prop="md" value="${esc(m.datum || "")}" placeholder="${esc(auto.datum || deDate(Date.now()))}" autocomplete="off"><button type="button" class="tool" data-ed="heute" style="margin-top:3px">Heute</button></span></label>
    <p class="small muted" style="margin:0 0 8px">Leer gelassen gelten der Name aus „Meine Daten“ und das Datum der letzten Änderung.</p>
    <div class="propact"><button type="button" class="tool" data-ed="sfzu">Fertig</button></div></div>`;
}
export function updateProps(force){
  const el = $("#props"); if (!el) return;
  const k = [ED.sel, ED.selC, ED.selS, ED.selT, ED.selF].join("|");
  if (!force && k === propsKey) return;
  if (force !== "neu" && k === propsKey && el.contains(document.activeElement)) {   // wird gerade bedient: nur Werte nachziehen
    const fresh = document.createElement("div"); fresh.innerHTML = propsHTML();
    $$("[data-prop]", el).forEach(f => { const n = fresh.querySelector(`[data-prop="${f.dataset.prop}"]`); if (n && f !== document.activeElement) f.value = n.value; });
    return;
  }
  propsKey = k; el.innerHTML = propsHTML();
}
export function applyProp(f, v){
  if (f === "cst") { const c = ED.data.c[ED.selC]; if (c) { c.st = v; saveSketch(); renderInk(); } return; }
  if (f === "mt" || f === "mn" || f === "md") { const m = ED.data.meta = ED.data.meta || {}; m[{mt: "title", mn: "name", md: "datum"}[f]] = v;
    Object.keys(m).forEach(k => { if (!m[k]) delete m[k]; }); if (!Object.keys(m).length) delete ED.data.meta; saveSketch(); refreshTpl(); return; }
  if (f === "cv") { const c = ED.data.c[ED.selC]; if (c) c.v = v; }
  else if (ED.selT !== null && ED.data.t[ED.selT] && ["tv","ts","sc"].includes(f)) { const t = ED.data.t[ED.selT]; if (f === "tv") t.v = v; if (f === "ts") t.s = +v; if (f === "sc") t.c = v; }
  else if (ED.selS !== null && ED.data.s[ED.selS] && ["sc","sw","sl","sg","tz","vk","vt"].includes(f)) { const st = ED.data.s[ED.selS]; if (f === "vt") st.t = v; if (f === "sc") st.c = v; if (f === "sw") st.w = +v; if (f === "sl") st.lbl = v; if (f === "sg") st.sg = v; if (f === "tz") st.tz = v; if (f === "vk") st.vk = v; }
  else { const o = objById(ED.sel); if (!o) return;
    if (f === "w") { const w = parseInt(v, 10); if (w >= 40) o.w = Math.round(w/10)*10; }
    else if (f === "t") { if (o.k === "actionq") o.k = "action"; o.t = v; if (v === "q" && !o.q) o.q = "S"; }
    else o[f] = v; }
  saveSketch(); ED.svg.querySelector(".ink").innerHTML = inkSVG(ED.data, true, ED.key);
}
export function setTool(t){
  ED.pend = null;
  ED.wsPreset = null; $$("#editor [data-ws]").forEach(x => x.setAttribute("aria-pressed", "false"));
  if (t === "sim" && !simOn()) { clearSel(); ED.sim = {on: true, st: {}, pos: {}, t: 0}; simCompute(); requestAnimationFrame(simStep); }
  else if (t !== "sim" && simOn()) ED.sim = {on: false, st: {}, pos: {}};
  ED.tool = t; if (t !== "place") ED.place = null; if (t !== "conn") ED.from = null;
  $$("#editor [data-tool]").forEach(b => b.setAttribute("aria-pressed", b.dataset.tool === t && (!b.dataset.color || b.dataset.color === ED.color)));
  $$("#editor [data-place]").forEach(b => b.setAttribute("aria-pressed", b.dataset.place === ED.place));
  if (ED.svg) { ["erase","text","sel","conn","place","sim"].forEach(c => ED.svg.classList.toggle(c, t === c)); $(".ghost", ED.svg).innerHTML = ""; renderInk(); }
  updateProps(true);
}
export function svgPt(svg, e){ const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(svg.getScreenCTM().inverse()); return [Math.round(q.x*10)/10, Math.round(q.y*10)/10]; }
export const wsRows = () => (CYL[ED.scope] || ["","","",""]).length + 2;
export function snapW(pt){
  if (!ED.grid) return [Math.round(pt[0]), Math.round(pt[1])];
  if (ED.key === "wegschritt") { const j = ED.data.s.find(q => q.k === "vk" && Math.hypot(q.p[0][0] - pt[0], q.p[0][1] - pt[1]) < 12); if (j) return [...j.p[0]]; }
  if (ED.key === "wegschritt") {   // im Diagramm immer auf einen Eckpunkt: Schrittgrenze × Stellung 1 oder 0
    const rows = (CYL[ED.scope] || ["","","",""]).length + 2, xs = 150, cw = (975 - 150) / 12, yTop = 74, yEnd = 74 + rows * 62;
    if (pt[0] >= xs - 30 && pt[0] <= 990 && pt[1] >= yTop - 10 && pt[1] <= yEnd + 10) {
      const c = Math.max(0, Math.min(12, Math.round((pt[0] - xs) / cw)));
      const lv = []; for (let i = 0; i < rows; i++) lv.push(yTop + i*62 + 16, yTop + i*62 + 50);
      const ny = lv.reduce((a, v) => Math.abs(v - pt[1]) < Math.abs(a - pt[1]) ? v : a, lv[0]);
      return [+(xs + c*cw).toFixed(2), ny];
    }
    return [Math.round(pt[0]/10)*10, Math.round(pt[1]/10)*10];
  }
  return snap(pt);
}
export const anySel = () => !!ED.sel || ED.selC !== null || ED.selS !== null || ED.selT !== null || !!ED.selF;
export function clearSel(){ ED.sel = null; ED.selC = null; ED.selS = null; ED.selT = null; ED.selF = false; }
export function snapshot(){ ED.hist.push(JSON.stringify(ED.data)); if (ED.hist.length > 80) ED.hist.shift(); }
export function saveSketch(){ const d = ED.data; d.ts = Date.now(); S.set(skKey(ED.scope, ED.key), (d.s.length || d.t.length || d.o.length || d.meta) ? d : null); }
export function refreshTpl(){ if (ED.svg) ED.svg.querySelector(".tpl").innerHTML = pagesSVG(ED.key, BY[ED.scope], skMeta(ED.scope, ED.key, ED.data), ED.pages, true); }
/* Zeichnung aus einer anderen Übung übernehmen: Kopie, das Original bleibt unverändert */
export function takeList(){
  const all = S.all(), suf = ":sk:" + ED.key, out = [];
  Object.entries(all).forEach(([k, d]) => { if (!k.endsWith(suf) || !d) return; const sc = k.slice(0, -suf.length); if (sc === ED.scope) return;
    const n = (d.o || []).length + (d.s || []).length + (d.t || []).length; if (n) out.push({sc, n, ts: d.ts || 0}); });
  const ord = sc => { const i = SHEETS.findIndex(x => x.id === sc); return i < 0 ? 999 : i; };
  return out.sort((a, b) => ord(a.sc) - ord(b.sc));
}
export function takeMenu(btn){
  const old = $("#editor .takemenu"); if (old) { old.remove(); return; }
  const list = takeList(), name = sc => BY[sc] ? `${sc} ${esc(BY[sc].t)}` : "Freie Zeichnung (Vorlagen)";
  const m = document.createElement("div"); m.className = "takemenu"; m.setAttribute("role", "menu");
  m.innerHTML = `<div class="tmh">${VORL[ED.key].n} aus einer anderen Übung kopieren</div>` + (list.length
    ? list.map(x => `<button type="button" role="menuitem" data-ed="takeit" data-from="${x.sc}"><b>${name(x.sc)}</b><span>${x.n} Elemente${x.ts ? " · geändert " + deDate(x.ts) : ""}</span></button>`).join("")
      + `<p>Die Kopie ersetzt die Zeichnung dieser Übung. Das Original bleibt unverändert, Rückgängig holt den alten Stand zurück.</p>`
    : `<p>Noch keine andere Übung hat eine Zeichnung dieser Art. Sobald Sie z. B. in L08 einen Plan gezeichnet haben, erscheint er hier.</p>`);
  btn.parentElement.appendChild(m);
  const off = e => { if (!m.contains(e.target) && e.target !== btn && !btn.contains(e.target)) { m.remove(); document.removeEventListener("pointerdown", off, true); } };
  document.addEventListener("pointerdown", off, true);
}
export function takeSketch(sc){
  const src = S.get(skKey(sc, ED.key)); $("#editor .takemenu")?.remove(); if (!src) return;
  const has = ED.data.s.length || ED.data.t.length || ED.data.o.length;
  if (has && !confirm(`Die Zeichnung dieser Übung wird durch die Kopie aus ${sc} ersetzt. Mit Rückgängig kommen Sie zurück. Fortfahren?`)) return;
  snapshot();
  const d = JSON.parse(JSON.stringify(src)); d.s ||= []; d.t ||= []; d.o ||= []; d.c ||= [];
  if (d.meta) { delete d.meta.title; delete d.meta.datum; }   // Titel und Datum gehören zur neuen Übung
  ED.data = d; clearSel(); saveSketch(); refreshTpl(); renderInk(); updateProps(true);
}
export function undo(){ if (!ED.hist.length) return; ED.data = JSON.parse(ED.hist.pop()); clearSel(); saveSketch(); renderInk(); }
export function turnSel(a){
  const o = objById(ED.sel); if (!o || !PC[o.k] || o.k === "rail") return;
  snapshot(); if (a === "rot") o.rot = ((o.rot || 0) + 90) % 360; else o.flip = !o.flip;
  saveSketch(); renderInk();
}
export function editTextItem(i){
  const t = ED.data.t[i]; if (!t) return;
  editLabel(t.x, t.y - 5, t.v, "Text", v => { snapshot(); if (v) t.v = v; else { ED.data.t.splice(i, 1); ED.selT = null; } saveSketch(); renderInk(); updateProps(true); });
}
export function removeObj(id){ ED.data.o = ED.data.o.filter(o => o.id !== id); ED.data.c = ED.data.c.filter(c => c.a !== id && c.b !== id); if (ED.sel === id) ED.sel = null; }
export function delSel(){
  if (ED.sel) { snapshot(); removeObj(ED.sel); }
  else if (ED.selC !== null && ED.data.c[ED.selC]) { snapshot(); ED.data.c.splice(ED.selC, 1); ED.selC = null; }
  else if (ED.selS !== null && ED.data.s[ED.selS]) { snapshot(); ED.data.s.splice(ED.selS, 1); ED.selS = null; }
  else if (ED.selT !== null && ED.data.t[ED.selT]) { snapshot(); ED.data.t.splice(ED.selT, 1); ED.selT = null; }
  else return;
  saveSketch(); renderInk();
}
export function eraseAt(e){
  const el = document.elementFromPoint(e.clientX, e.clientY); if (!el) return;
  const go = el.closest("[data-o]"), gc = el.closest("[data-c]");
  if (go) { snapshot(); removeObj(go.dataset.o); }
  else if (gc) { snapshot(); ED.data.c.splice(+gc.dataset.c, 1); }
  else if (el.dataset.i !== undefined) { snapshot(); ED.data.s.splice(+el.dataset.i, 1); }
  else if (el.dataset.ti !== undefined) { snapshot(); ED.data.t.splice(+el.dataset.ti, 1); }
  else return;
  saveSketch(); renderInk();
}
export function nextLabel(l){   // -QA1 → nächste freie Nummer
  const m = /^(.*?)(\d+)$/.exec(l); if (!m || l.includes(":")) return l;
  const used = ED.data.o.map(o => o.v || "").filter(v => v.startsWith(m[1])).map(v => parseInt(v.slice(m[1].length), 10)).filter(n => !isNaN(n));
  return used.length ? m[1] + (Math.max(...used) + 1) : l;
}
export function makeObj(k, [px, py]){
  const mk = BLK[k] && BLK[k].mk; if (mk) k = mk.k || k;
  if (PC[k]) { const pc = PC[k], o = {id: uid(), ...(pc.def || {}), ...(mk || {})}; o.k = k; o.v = nextLabel(pc.lbl || "");
    if (k === "rail") { o.w = 400; o.x = px - 200; o.y = py; } else { o.x = px - (pc.bx || 0) - pc.w / 2; o.y = py - pc.h / 2; }
    [o.x, o.y] = snap([o.x, o.y]); return o; }
  const o = {id: uid(), k}, nums = ED.data.o.filter(q => q.k === "step" || q.k === "init").map(q => parseInt(q.v, 10)).filter(v => !isNaN(v));
  if (k === "init" || k === "step") { o.x = px - 20; o.y = py - 20; o.v = String(nums.length ? Math.max(...nums) + 1 : 1); }
  else if (k === "action") { Object.assign(o, mk || {t: "kont"}); o.k = "action"; o.x = px - 20; o.y = py - 15; o.v = ""; }
  else if (k === "macro") { o.x = px - 20; o.y = py - 20; o.v = "M" + (ED.data.o.filter(q => q.k === "macro").length + 1); }
  else if (k === "ref") { o.x = px; o.y = py - 15; o.v = ""; }
  else if (k === "alt" || k === "par") { o.x = px - 100; o.y = py; o.w = 200; }
  else if (k === "box") { o.x = px - 55; o.y = py - 25; o.v = ""; }
  else if (k === "no" || k === "nc" || k === "coil" || k === "lamp") { o.x = px; o.y = py - 30; o.v = {no:"-SF1", nc:"-SF2", coil:"-QA1", lamp:"-PF1"}[k]; }
  else if (k === "state" || k === "sinit") { o.x = px; o.y = py; o.v = "Z" + ED.data.o.filter(q => q.k === "state" || q.k === "sinit").length; }
  else { o.x = px; o.y = py; }
  [o.x, o.y] = snap([o.x, o.y]);
  return o;
}
export function chainSource(k){
  const base = (BLK[k] && BLK[k].mk && BLK[k].mk.k) || k; if (PC[base] && !PC[base].bx) return null;
  const A = !ED.dnd && ED.sel && objById(ED.sel);   // beim Ziehen entscheidet die Ablagestelle (Andocken), nicht die Markierung
  if (!A || !(fam(A) === "grafcet" || fam(A) === "elektro") || fam(A) !== BLK[k].g) return null;
  if (isAct(A)) return isActKey(k) ? A : null;
  if (isActKey(k) && A.k !== "trans") { let cur = null, n = 0;   // hat der Schritt schon Aktionen, an die letzte anhängen
    for (let c = ED.data.c.find(c => c.a === A.id && isAct(objById(c.b))); c && n++ < 50; c = ED.data.c.find(q => q.a === cur.id && isAct(objById(q.b)))) cur = objById(c.b);
    return cur || A; }
  return A;
}
export function align(o, A, pt){
  if (isAct(o) && isAct(A)) {
    const right = pt && (pt[0] - (A.x + aw(A))) > (pt[1] - (A.y + 30));
    if (right) { o.x = A.x + aw(A); o.y = A.y; } else { o.x = A.x; o.y = A.y + 30 + (hasMark(o) ? 20 : 0); }
    return;
  }
  if (isAct(o)) { o.x = A.k === "trans" ? A.x + 40 : A.x + 70; o.y = A.k === "trans" ? A.y - 15 : A.y + 5; return; }
  const ax = outPt(A, ctr(o)[0])[0];
  o.x = o.k === "step" || o.k === "init" ? ax - 20 : o.k === "alt" || o.k === "par" ? ax - 100 : ax;
}
/* Andocken: Anschluss in der Nähe eines passenden Anschlusses → ausrichten und beim Loslassen verbinden */
export function dockFor(o){
  const g = fam(o); if (!ED.dock || !(g === "grafcet" || g === "elektro") || (PC[o.k] && !PC[o.k].bx)) return null;
  const others = ED.data.o.filter(p => p.id !== o.id && fam(p) === g && (!PC[p.k] || PC[p.k].bx));
  let best = null; const take = c => { if (!best || c.d < best.d) best = c; };
  if (isAct(o)) {
    for (const p of others) {
      if (["step","init","macro","trans"].includes(p.k)) {
        const px = p.k === "trans" ? p.x + 14 : p.x + 40, py = p.k === "trans" ? p.y : p.y + 20, dx = o.x - px, dy = o.y + 15 - py;
        if (dx >= 0 && dx <= 110 && Math.abs(dy) <= 30) take({a: p.id, b: o.id, d: Math.hypot(dx - 30, dy), sx: 0, sy: -dy});
      } else if (isAct(p)) {
        const rx = p.x + aw(p), by = p.y + 30 + (hasMark(o) ? 20 : 0);
        if (Math.abs(o.x - rx) <= 25 && Math.abs(o.y - p.y) <= 20) take({a: p.id, b: o.id, d: Math.abs(o.x - rx) + Math.abs(o.y - p.y), sx: rx - o.x, sy: p.y - o.y});
        if (Math.abs(o.x - p.x) <= 25 && Math.abs(o.y - by) <= 20) take({a: p.id, b: o.id, d: Math.abs(o.x - p.x) + Math.abs(o.y - by), sx: p.x - o.x, sy: by - o.y});
      }
    }
    return best;
  }
  for (const p of others) {
    if (isAct(p)) continue;
    const po = outPt(p, ctr(o)[0]), oi = inPt(o, po[0]), dy1 = oi[1] - po[1], dx1 = po[0] - oi[0];
    if (dy1 >= 10 && dy1 <= 140 && Math.abs(dx1) <= 30) take({a: p.id, b: o.id, d: Math.abs(dx1) + dy1/4, sx: dx1, sy: 0});
    const oo = outPt(o, ctr(p)[0]), pi = inPt(p, oo[0]), dy2 = pi[1] - oo[1], dx2 = pi[0] - oo[0];
    if (dy2 >= 10 && dy2 <= 140 && Math.abs(dx2) <= 30) take({a: o.id, b: p.id, d: Math.abs(dx2) + dy2/4, sx: dx2, sy: 0});
  }
  return best;
}
/* Hilfslinien: Mitte auf die Mitte eines Nachbarn ziehen */
export function smartPos(o){
  if (ED.key === "stromlauf" && fam(o) === "elektro") o.x = 40 + Math.max(1, Math.min(20, Math.round((o.x - 40) / 46))) * 46;
  const dock = dockFor(o), marks = [];
  if (dock) { o.x += dock.sx; o.y += dock.sy; }
  if (ED.dock && !dock) {
    const c = ctr(o); let gx = null, gy = null, bx = 12, by = 12;
    for (const p of ED.data.o) { if (p.id === o.id) continue; const q = ctr(p), dx = q[0] - c[0], dy = q[1] - c[1];
      if (Math.abs(dx) < bx && Math.abs(dx) > 0) { bx = Math.abs(dx); gx = [dx, q]; } else if (dx === 0) { bx = 0; gx = [0, q]; }
      if (Math.abs(dy) < by && Math.abs(dy) > 0) { by = Math.abs(dy); gy = [dy, q]; } else if (dy === 0) { by = 0; gy = [0, q]; } }
    if (gx && !(dock && dock.sx)) { o.x += gx[0]; const c2 = ctr(o); marks.push(`<path d="M${c2[0]} ${Math.min(c2[1], gx[1][1]) - 30}V${Math.max(c2[1], gx[1][1]) + 30}" stroke="#2F80ED" stroke-width="1" stroke-dasharray="4 4"/>`); }
    if (gy && !(dock && dock.sy)) { o.y += gy[0]; const c2 = ctr(o); marks.push(`<path d="M${Math.min(c2[0], gy[1][0]) - 30} ${c2[1]}H${Math.max(c2[0], gy[1][0]) + 30}" stroke="#2F80ED" stroke-width="1" stroke-dasharray="4 4"/>`); }
  }
  if (dock) {
    const map = Object.fromEntries(ED.data.o.map(p => [p.id, p])); map[o.id] = o;
    const gm = connGeom({a: dock.a, b: dock.b}, map, []);
    if (gm) marks.push(`<path d="${gm.d}" fill="none" stroke="#2F80ED" stroke-width="2.5" stroke-dasharray="6 4"/>`);
    const B = map[dock.b], A = map[dock.a], p = isAct(B) ? (isAct(A) && B.x < A.x + aw(A) - 1 ? [B.x + 8, B.y] : [B.x, B.y + 15]) : inPt(B, outPt(A, ctr(B)[0])[0]);
    marks.push(`<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="#2F80ED" fill-opacity=".25" stroke="#2F80ED" stroke-width="1.5"/>`);
  }
  return {dock, marks: marks.join("")};
}
export function avoidBreak(o){   // Bausteine nicht in Schriftfeld/Rand am Blattende legen – sonst auf das nächste Blatt
  if (FIXED[ED.key]) return;
  for (let i = 0; i < 4; i++) { const b = bbox(o), k = Math.floor((b.y + b.h + 80) / PH), B = k * PH;
    if (k >= 1 && b.y < B + 70 && b.y + b.h > B - 80) o.y += B + 70 - b.y; else break; }
}
export const linked = (a, b) => ED.data.c.some(c => (c.a === a && c.b === b) || (c.a === b && c.b === a));
export function placeObj(k, pt){
  const A = chainSource(k), o = makeObj(k, pt);
  let dock = null;
  if (A) align(o, A, pt); else dock = smartPos(o).dock;
  avoidBreak(o);
  snapshot(); ED.data.o.push(o);
  if (A) ED.data.c.push({a: A.id, b: o.id, v: ""});
  else if (dock && !linked(dock.a, dock.b)) ED.data.c.push({a: dock.a, b: dock.b, v: ""});
  ED.sel = o.id; ED.selC = null; saveSketch(); setTool("sel");
  if (o.k === "trans" || o.k === "box" || o.k === "ref" || isAct(o)) editObjLabel(o);
}
export function connectPorts(a, pa, b, pb){
  if (a === b && pa === pb) return;
  if (a.startsWith("_") && b.startsWith("_")) return;
  if (ED.data.c.some(c => (c.a === a && c.pa === pa && c.b === b && c.pb === pb) || (c.a === b && c.pa === pb && c.b === a && c.pb === pa))) return;
  snapshot(); ED.data.c.push({a, pa, b, pb, v: ""}); clearSel(); ED.selC = ED.data.c.length - 1; saveSketch(); renderInk();
}
export function connect(a, b){
  const A = objById(a); if (!A || (a === b && fam(A) !== "zustand")) return;
  if (ED.data.c.some(c => c.a === a && c.b === b)) return;
  snapshot(); ED.data.c.push({a, b, v: ""}); ED.selC = ED.data.c.length - 1; ED.sel = null; saveSketch(); renderInk();
  if (fam(A) === "zustand" && A.k !== "start") editConnLabel(ED.data.c.length - 1);
}
export function edDown(e){
  if (!e.target.closest("input")) { e.preventDefault(); const sl = getSelection(); if (sl && sl.rangeCount) sl.removeAllRanges(); }
  const svg = ED.svg, pt = svgPt(svg, e), hitO = e.target.closest("[data-o]"), hitC = e.target.closest("[data-c]");
  if (ED.tool === "sim") { const h = e.target.closest("[data-o]"); if (h) simClick(objById(h.dataset.o), pt); return; }
  if (ED.tool === "place" && ED.place) { e.preventDefault(); placeObj(ED.place, pt); return; }
  if (ED.tool === "sel") {
    e.preventDefault();
    const hitH = e.target.closest("[data-hi]"), hitS = e.target.closest("[data-i]"), hitT = e.target.closest("[data-ti]");
    if (ED.key === "wegschritt" && !hitS && !hitT && pt[0] >= 30 && pt[0] < 140 && pt[1] >= 74 && pt[1] < 74 + wsRows() * 62) {   // Zeilenname ändern
      const i = Math.floor((pt[1] - 74) / 62), cur = (skMeta(ED.scope, ED.key, ED.data).rows || [])[i];
      const def = [...(CYL[ED.scope] || ["−MM1","−MM2","−MM3","−MM4"]), "", ""][i];
      editLabel(40, 74 + i * 62 + 31, cur ?? def, "Bauglied, z. B. −MM1 Zylinder oder −MB1 Ventil", v => { snapshot(); const m = ED.data.meta = ED.data.meta || {}; m.rows = m.rows || []; m.rows[i] = v; saveSketch(); refreshTpl(); });
      return; }
    if (e.target.closest("[data-sf]") && !hitO && !hitS && !hitT) { clearSel(); ED.selF = true; renderInk(); updateProps("neu"); const f = $('#props [data-prop="mn"]'); if (f) f.focus(); return; }
    if (hitH) { ED.drag = {kind: "h", i: +hitH.dataset.hi, h: +hitH.dataset.h, sx: pt[0], sy: pt[1], moved: false}; svg.setPointerCapture(e.pointerId); return; }
    const now = Date.now(), hitId = hitO ? hitO.dataset.o : hitC ? "c" + hitC.dataset.c : hitT ? "t" + hitT.dataset.ti : hitS ? "s" + hitS.dataset.i : null;
    const dbl = hitId && ED.lastClick && ED.lastClick.id === hitId && now - ED.lastClick.t < 450;
    ED.lastClick = dbl ? null : {id: hitId, t: now};
    clearSel();
    if (dbl && hitO) { ED.sel = hitO.dataset.o; renderInk(); editObjLabel(objById(ED.sel)); return; }
    if (dbl && hitC) { ED.selC = +hitC.dataset.c; renderInk(); editConnLabel(ED.selC); return; }
    if (dbl && hitT) { ED.selT = +hitT.dataset.ti; renderInk(); editTextItem(ED.selT); return; }
    if (hitO) { const o = objById(hitO.dataset.o); ED.sel = o.id; ED.drag = {id: o.id, sx: pt[0], sy: pt[1], ox: o.x, oy: o.y, moved: false}; svg.setPointerCapture(e.pointerId); renderInk(); return; }
    if (hitC) { ED.selC = +hitC.dataset.c; renderInk(); return; }
    if (hitT) { const i = +hitT.dataset.ti, t = ED.data.t[i]; ED.selT = i; ED.drag = {kind: "t", i, sx: pt[0], sy: pt[1], ox: t.x, oy: t.y, moved: false}; svg.setPointerCapture(e.pointerId); renderInk(); return; }
    if (hitS) { const i = +hitS.dataset.i; ED.selS = i; ED.drag = {kind: "s", i, sx: pt[0], sy: pt[1], orig: JSON.parse(JSON.stringify(ED.data.s[i].p)), moved: false}; svg.setPointerCapture(e.pointerId); renderInk(); return; }
    renderInk(); return;
  }
  if (ED.tool === "conn") {
    e.preventDefault();
    let id = hitO && hitO.dataset.o;
    if (!id) { const vr = vrails(ED.key, ED.pages || 1).find(r => Math.abs(pt[1] - r.y) < 8 && pt[0] >= r.x && pt[0] <= r.x + r.w); if (vr) id = vr.id; }
    if (!id) { ED.from = null; ED.fromP = null; renderInk(); return; }
    const o = objById(id);
    if (portCap(o)) {   // Anschluss für Anschluss verdrahten
      const pn = nearestPort(o, pt);
      if (!ED.from) { ED.from = id; ED.fromP = pn; renderInk(); return; }
      const a = ED.from, pa = ED.fromP; ED.from = null; ED.fromP = null;
      if (portCap(objById(a))) connectPorts(a, pa, id, pn); else connect(a, id);
      renderInk(); return;
    }
    if (!ED.from) { ED.from = id; ED.fromP = null; renderInk(); return; }
    const a = ED.from; ED.from = null; ED.fromP = null; connect(a, id); renderInk(); return;
  }
  if (ED.tool === "erase") { ED.erasing = true; svg.setPointerCapture(e.pointerId); eraseAt(e); return; }
  if (ED.tool === "text") { e.preventDefault(); editLabel(pt[0], pt[1], "", "Text, Enter übernimmt", v => { if (v) { snapshot(); ED.data.t.push({x: pt[0], y: pt[1] + 5, v, c: ED.color, s: 16}); saveSketch(); renderInk(); } }); return; }
  if (ED.tool === "vk") { e.preventDefault(); const q = snapW(pt), J = [q[0], q[1] - wsAus(q[1]) * 18]; snapshot();
    ED.data.s.push({k: "vk", t: (ED.wsPreset && ED.wsPreset.t) || "und", c: ED.color, w: 1.2, p: [J]}, {k: "sig", c: ED.color, w: 1.2, p: [J, q], lbl: ""});
    saveSketch(); const keep = ED.wsPreset; setTool("sig"); ED.wsPreset = {}; clearSel(); renderInk(); updateProps(true); return; }
  if (ED.tool === "eq") { e.preventDefault(); const cw = (975 - 150) / 12, j = Math.max(1, Math.min(11, Math.floor((pt[0] - 150) / cw))); snapshot();
    ED.data.s = ED.data.s.filter(q => q.k !== "eq"); ED.data.s.push({k: "eq", c: ED.color, w: 2.6, p: [[+(150 + j * cw).toFixed(2), 57]], y2: 74 + wsRows() * 62}); clearSel(); saveSketch(); setTool("sel"); return; }
  if (ED.tool === "start") { e.preventDefault(); snapshot(); ED.data.s.push({k: "st", c: ED.color, w: 1.2, p: [snapW(pt)], lbl: "−SF1"}); clearSel(); ED.selS = ED.data.s.length - 1; saveSketch(); setTool("sel"); return; }
  if (ED.pend && (ED.tool === "sig" || ED.tool === "line")) {   // zweiter Klick: Linie vom gemerkten Punkt bis hier
    e.preventDefault(); const q = snapW(pt), a = ED.pend, same = Math.abs(a[0] - q[0]) < .5 && Math.abs(a[1] - q[1]) < .5;
    $(".ghost", svg).innerHTML = "";
    if (ED.tool === "sig") { snapshot(); ED.data.s.push({k: "sig", c: ED.color, w: 1.2, p: [a, q], lbl: "", ...(ED.wsPreset || {})}); ED.pend = null; saveSketch();
      clearSel(); ED.selS = ED.data.s.length - 1; renderInk(); updateProps("neu"); const f = $('#props [data-prop="sl"]'); if (f) f.focus(); return; }
    if (same) { ED.pend = null; renderInk(); updateProps(true); return; }   // gleicher Punkt: Linienzug beenden
    snapshot(); ED.data.s.push({k: "l", c: ED.color, w: Math.max(ED.w, 2.8), p: [a, q]}); ED.pend = q; saveSketch(); renderInk(); return;
  }
  svg.setPointerCapture(e.pointerId); snapshot();
  const q = ED.tool === "pen" ? pt : snapW(pt);
  ED.cur = ED.tool === "pen" ? {c: ED.color, w: ED.w, p: [q]} : {k: {line: "l", rect: "r", sig: "sig"}[ED.tool] || "l", c: ED.color, w: ED.tool === "sig" ? 1.2 : (ED.key === "wegschritt" && ED.tool === "line" ? Math.max(ED.w, 2.8) : ED.w), p: [q, q], ...(ED.tool === "sig" ? {lbl: "", ...(ED.wsPreset || {})} : {})};
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("stroke", ED.color); path.setAttribute("stroke-width", ED.w); path.setAttribute("fill", "none"); path.setAttribute("stroke-linecap", "round"); path.setAttribute("stroke-linejoin", "round");
  svg.querySelector(".ink").appendChild(path); ED.curEl = path; edMove(e);
}
export function edMove(e){
  const svg = ED.svg; if (!svg) return;
  if (ED.erasing) { eraseAt(e); return; }
  const pt = svgPt(svg, e);
  const busy = ED.drag || ED.cur || (ED.tool === "place" && ED.place);
  ED.extraY = busy ? pt[1] : 0; checkPages();
  if (busy) { const st = $("#edstage"), r = st.getBoundingClientRect();   // am Rand mitscrollen
    if (e.clientY > r.bottom - 36) st.scrollTop += 18; else if (e.clientY < r.top + 36) st.scrollTop -= 18; }
  if (ED.drag) {
    const dx = pt[0] - ED.drag.sx, dy = pt[1] - ED.drag.sy;
    if (!ED.drag.moved && Math.hypot(dx, dy) < 3) return;
    if (!ED.drag.moved) { snapshot(); ED.drag.moved = true; }
    if (ED.drag.kind === "h") { ED.data.s[ED.drag.i].p[ED.drag.h] = snapW(pt); renderInk(); return; }
    if (ED.drag.kind === "t") { const t = ED.data.t[ED.drag.i]; [t.x, t.y] = snap([ED.drag.ox + dx, ED.drag.oy + dy]); renderInk(); return; }
    if (ED.drag.kind === "s") {
      const st = ED.data.s[ED.drag.i], o0 = ED.drag.orig[0]; let mx = dx, my = dy;
      if (st.k === "vk") {   // Verknüpfungspunkt verschieben: angeschlossene Signallinien wandern mit
        if (!ED.drag.att) ED.drag.att = []; if (!ED.drag.attDone) { ED.drag.attDone = true; ED.data.s.forEach((q, j) => q.k === "sig" && q.p.forEach((v, h) => Math.hypot(v[0] - o0[0], v[1] - o0[1]) < .6 && ED.drag.att.push([j, h]))); }
        const cx = 150 + Math.round((o0[0] + dx - 150) / 68.75) * 68.75, q = [Math.abs(cx - o0[0] - dx) < 10 ? cx : Math.round((o0[0] + dx) / 4) * 4, Math.round((o0[1] + dy) / 4) * 4]; st.p = [q]; ED.drag.att.forEach(([j, h]) => ED.data.s[j].p[h] = [...q]); renderInk(); return; }
      if (st.k) { const q = snapW([o0[0] + dx, o0[1] + dy]); mx = q[0] - o0[0]; my = q[1] - o0[1]; }
      st.p = ED.drag.orig.map(([x, y]) => [+(x + mx).toFixed(1), +(y + my).toFixed(1)]); renderInk(); return;
    }
    const o = objById(ED.drag.id);
    [o.x, o.y] = snap([ED.drag.ox + dx, ED.drag.oy + dy]);
    const r = smartPos(o); avoidBreak(o); ED.drag.dock = r.dock && !linked(r.dock.a, r.dock.b) ? r.dock : null;
    renderInk(); $(".ghost", svg).innerHTML = r.marks; return;
  }
  if (ED.tool === "place" && ED.place) {
    const o = makeObj(ED.place, pt), A = chainSource(ED.place); let marks = "";
    if (A) { align(o, A, pt); const map = Object.fromEntries(ED.data.o.map(p => [p.id, p])); map[o.id] = o; const gm = connGeom({a: A.id, b: o.id}, map, []); if (gm) marks = `<path d="${gm.d}" fill="none" stroke="#2F80ED" stroke-width="2.5" stroke-dasharray="6 4"/>`; }
    else marks = smartPos(o).marks;
    avoidBreak(o);
    $(".ghost", svg).innerHTML = marks + `<g opacity=".5">${drawObj(o, true)}</g>`; return;
  }
  if (ED.pend && !ED.cur && (ED.tool === "sig" || ED.tool === "line")) { const q = snapW(pt), a = ED.pend;
    const d = ED.tool === "sig" ? shapeD({k: "sig", p: [a, q]}) : `M${a[0]} ${a[1]}L${q[0]} ${q[1]}`;
    $(".ghost", svg).innerHTML = `<path d="${d}" stroke="#2F80ED" stroke-width="${ED.tool === "sig" ? 1.4 : 2.8}" stroke-dasharray="5 4" fill="none"/><circle cx="${a[0]}" cy="${a[1]}" r="5" fill="#2F80ED" fill-opacity=".35" stroke="#2F80ED"/><circle cx="${q[0]}" cy="${q[1]}" r="4" fill="none" stroke="#2F80ED"/>`; return; }
  if (!ED.cur) return;
  if (ED.cur.k) { ED.cur.p[1] = snapW(pt); ED.curEl.setAttribute("d", shapeD(ED.cur)); return; }
  const l = ED.cur.p[ED.cur.p.length-1];
  if (Math.hypot(pt[0]-l[0], pt[1]-l[1]) > 1.2) ED.cur.p.push(pt);
  ED.curEl.setAttribute("d", "M" + ED.cur.p.map(q => q.join(" ")).join("L") + (ED.cur.p.length === 1 ? "l.01 0" : ""));
}
export function edUp(){
  ED.erasing = false; ED.extraY = 0;
  if (ED.drag) {
    const dk = ED.drag.dock;
    if (ED.drag.moved) { if (dk && !linked(dk.a, dk.b)) ED.data.c.push({a: dk.a, b: dk.b, v: ""}); saveSketch(); renderInk(); }
    ED.drag = null; if (ED.svg) $(".ghost", ED.svg).innerHTML = ""; return;
  }
  if (!ED.cur) return;
  if (ED.cur.k && ED.cur.p[0][0] === ED.cur.p[1][0] && ED.cur.p[0][1] === ED.cur.p[1][1]) {   // nur geklickt, nicht gezogen
    const p0 = ED.cur.p[0], k = ED.cur.k; ED.cur = null; ED.hist.pop();
    if (k === "sig" || (k === "l" && ED.key === "wegschritt")) { ED.pend = p0; renderInk(); updateProps(true); $(".ghost", ED.svg).innerHTML = `<circle cx="${p0[0]}" cy="${p0[1]}" r="5" fill="#2F80ED" fill-opacity=".35" stroke="#2F80ED"/>`; return; }
    renderInk(); return; }
  const neu = ED.cur; ED.data.s.push(neu); ED.cur = null; saveSketch();
  if (neu.k === "sig") { clearSel(); ED.selS = ED.data.s.length - 1; renderInk(); updateProps("neu"); const f = $('#props [data-prop="sl"]'); if (f) f.focus(); return; }
  renderInk();
}
export function edDbl(e){
  if (ED.tool !== "sel") return;
  const hitO = e.target.closest("[data-o]"), hitC = e.target.closest("[data-c]");
  if (hitO) editObjLabel(objById(hitO.dataset.o)); else if (hitC) editConnLabel(+hitC.dataset.c);
}
export function editObjLabel(o){
  if (!o || o.k === "start" || o.k === "sum") return;
  const b = bbox(o);
  const q = isAct(o) && atype(o) === "q";
  const init = q ? `${o.q || "S"} ${o.v || ""}`.trim() : (o.k === "alt" || o.k === "par") ? String(o.w || 200) : (o.v || "");
  const at = o.k === "trans" ? [o.x + 20, o.y] : (o.k === "no" || o.k === "nc" || o.k === "coil" || o.k === "lamp") ? [o.x - 120, o.y + 30] : [b.x, b.y + b.h/2];
  editLabel(at[0], at[1], init, q ? LABEL_HINT.actionq : LABEL_HINT[o.k], v => {
    snapshot();
    if (q) { const m = v.match(/^(\S+)\s*(.*)$/); o.q = m ? m[1] : "S"; o.v = m ? m[2] : ""; }
    else if (o.k === "alt" || o.k === "par") { const w = parseInt(v, 10); if (w >= 40) o.w = Math.round(w/10)*10; }
    else o.v = v;
    saveSketch(); renderInk(); updateProps(true);
  });
}
export function editConnLabel(i){
  const c = ED.data.c[i], p = ED.svg.querySelector(`[data-c="${i}"] path`); if (!c || !p) return;
  const L = p.getTotalLength(), m = p.getPointAtLength(L / 2);
  editLabel(m.x + 8, m.y, c.v || "", "Bedingung / Aktion, z. B. BG1 / MB1", v => { snapshot(); c.v = v; saveSketch(); renderInk(); updateProps(true); });
}
export function newline(el){ const a = el.selectionStart, b = el.selectionEnd; el.value = el.value.slice(0, a) + "\n" + el.value.slice(b); el.selectionStart = el.selectionEnd = a + 1; }
export function editLabel(x, y, init, ph, done){
  const svg = ED.svg, stage = $("#edstage"), r = stage.getBoundingClientRect(), m = svg.getScreenCTM();
  const inp = document.createElement("textarea"); inp.className = "txtin"; inp.value = init; inp.placeholder = (ph || "Text") + " – Enter übernimmt, Alt+Enter neue Zeile";
  inp.rows = Math.max(1, init.split("\n").length); inp.title = "Enter übernimmt, Alt+Enter (oder Umschalt+Enter) beginnt eine neue Zeile";
  inp.style.left = Math.max(4, Math.min(m.a * x + m.e - r.left, r.width - 270)) + "px"; inp.style.top = (m.d * y + m.f - r.top + stage.scrollTop - 17) + "px";
  stage.appendChild(inp); inp.focus(); inp.select();
  let fertig = false;
  const commit = (ok, wohin) => { if (fertig) return; fertig = true; const v = inp.value.trim(); inp.remove(); if (!wohin) stage.focus({preventScroll: true}); if (ok) done(v); };
  inp.addEventListener("keydown", ev => { ev.stopPropagation();
    if (ev.key === "Enter" && (ev.altKey || ev.shiftKey || ev.ctrlKey)) { ev.preventDefault(); newline(inp); inp.rows = inp.value.split("\n").length; return; }
    if (ev.key === "Enter") { ev.preventDefault(); commit(true); }
    if (ev.key === "Escape") { ev.preventDefault(); commit(false); } });
  inp.addEventListener("blur", ev => commit(true, ev.relatedTarget));
}

