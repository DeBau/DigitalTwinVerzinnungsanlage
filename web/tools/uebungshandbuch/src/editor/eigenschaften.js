// Editor-Kern: Eigenschaftsfeld links im Editor (Felder des markierten Elements, Zeichenleiste).
import { $, $$, IC, esc } from '../app/basis.js';
import { ED } from './status.js';
import { BLK, PC, PROPS, art } from './registry.js';
import { gruppeVon } from './bausteine.js';
import { anySel, objById } from './auswahl.js';
import { deDate, skMeta } from './blaetter.js';

export const SYMS = `<div class="syms" aria-label="Zeichen einfügen">${[["·","UND"],["+","ODER"],["¬","NICHT"],["↑","steigende Flanke"],["↓","fallende Flanke"],[":=","Zuweisung"],["≥","größer gleich"]].map(([c, t]) => `<button type="button" class="sym" data-sym="${c}" title="${t}">${c}</button>`).join("")}</div>`;
export let propsKey = null, lastProp = null;
export const setLastProp = (el) => { lastProp = el; };   // für den focusin-Listener in ereignisse.js
// Bausteine für Eigenschaftsfelder, auch für die Haken felder(o) der Vorlagen.
// Kennzeichen, Texte und Beschriftungen bekommen ein mehrzeiliges Feld, alles andere eine Zeile.
export const MEHRZEILIG = ["v", "tv", "cv", "b"];
export function textFeld(f, lbl, ph, val){
  const wert = esc(val ?? ""), platz = esc(ph || "");
  if (!MEHRZEILIG.includes(f)) return `<label class="prop">${lbl}<input type="text" data-prop="${f}" value="${wert}" placeholder="${platz}" autocomplete="off"></label>`;
  const zeilen = Math.max(1, String(val ?? "").split("\n").length);
  return `<label class="prop">${lbl}<textarea data-prop="${f}" rows="${zeilen}" placeholder="${platz}" title="Alt+Enter: neue Zeile">${wert}</textarea></label>`;
}
export function auswahlFeld(f, lbl, opts, cur){
  const optionen = opts.map(([v, n]) => `<option value="${v}" ${String(v) === String(cur) ? "selected" : ""}>${n}</option>`).join("");
  return `<label class="prop">${lbl}<select data-prop="${f}">${optionen}</select></label>`;
}
export const FARBEN = [["#17212B","Schwarz"],["#0E4C92","Blau"],["#C0392B","Rot"]];
export const loeschKnopf = () => `<div class="propact"><button type="button" class="tool" data-ed="del">${IC.trash}Löschen</button></div>`;
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
  const inp = textFeld, sel = auswahlFeld, COL = FARBEN, del = loeschKnopf();
  if (ED.selT !== null && ED.data.t[ED.selT]) { const t = ED.data.t[ED.selT];
    return `<div class="props"><div class="palh">Text</div>${inp("tv", "Text", "", t.v)}${SYMS}${sel("ts", "Größe", [[12,"klein"],[16,"normal"],[20,"groß"],[26,"sehr groß"]], t.s || 16)}${sel("sc", "Farbe", COL, t.c)}${del}</div>`; }
  if (ED.selS !== null && ED.data.s[ED.selS]) { const st = ED.data.s[ED.selS];
    if (st.k === "eq") return `<div class="props"><div class="palh">Zyklusende</div><p class="small muted" style="margin:0 0 8px">Der Schritt in dieser Spalte entspricht wieder Schritt 1 – der Ablauf beginnt von vorn.</p>${del}</div>`;
    if (st.k === "st") return `<div class="props"><div class="palh">Startbedingung</div>${inp("sl", "Starttaster / Bedingung", "z. B. −SF1 START", st.lbl)}${sel("sc", "Farbe", COL, st.c)}<p class="small muted" style="margin:0 0 8px">Der Pfeil zeigt auf den Beginn der ersten Bewegung.</p>${del}</div>`;
    if (st.k === "vk") return `<div class="props"><div class="palh">Verknüpfung</div>${sel("vt", "Art", [["und","UND – Schrägstrich: alle Signale müssen anliegen"],["oder","ODER – Punkt: ein Signal genügt"]], st.t || "und")}<p class="small muted" style="margin:0 0 8px">Signallinien von den Signalgebern enden hier, die Linie mit Pfeil führt zum ausgelösten Bewegungsbeginn.</p>${del}</div>`;
    if (st.k === "sig") return `<div class="props"><div class="palh">Signallinie</div>${inp("sl", "Signalgeber (steht am Ausgangspunkt)", "z. B. −BG2", st.lbl)}${sel("sg", "Darstellung des Signalgebers", [["punkt","Grenztaster / Sensor – Punkt"],["kreis","Grenztaster – Kreis"],["balken","Betätigung über eine Strecke – Balken"],["extern","Signal von anderer Maschine"]], st.sg || "punkt")}${inp("tz", "Zeitglied (optional)", "z. B. t = 10 s", st.tz)}${sel("sc", "Farbe", COL, st.c)}<p class="small muted" style="margin:0 0 8px">Signallinien sind dünn, Funktionslinien dick. Die Linie beginnt am Signalgeber und endet mit dem Pfeil dort, wo die Zustandsänderung ausgelöst wird.</p>${del}</div>`;
    return `<div class="props"><div class="palh">${st.k === "l" ? "Linie" : st.k === "r" ? "Kasten" : "Freihandstrich"}</div>${sel("sc", "Farbe", COL, st.c)}${sel("sw", "Strichstärke", [[1.4,"dünn"],[2.2,"mittel"],[4,"dick"]], st.w)}${st.k ? `<p class="small muted" style="margin:0 0 8px">Die runden Griffe an den Enden ziehen.</p>` : ""}${del}</div>`; }
  const o = ED.sel && objById(ED.sel);
  if (o) return objektFelder(o);
  const c = ED.selC !== null && ED.data.c[ED.selC];
  if (c && (c.pa !== undefined || c.pb !== undefined)) return `<div class="props"><div class="palh">Leitung</div>${inp("cv", "Beschriftung (optional)", "z. B. Aderfarbe oder Querschnitt", c.v)}${sel("cst", "Leitungsart", [["", "Arbeits-/Hauptleitung"], ["st", "Steuerleitung (gestrichelt)"]], c.st || "")}${del}</div>`;
  if (c) { const beschriftbar = gruppeVon(objById(c.a)).pfeiltext;
    return `<div class="props"><div class="palh">Verbindung</div>${beschriftbar ? inp("cv", "Beschriftung", "z. B. BG13 / QA1", c.v) + SYMS : `<p class="small muted" style="margin:0 0 8px">GRAFCET-Verbindungen tragen keine Beschriftung – die Bedingung steht an der Transition.</p>`}<div class="propact"><button type="button" class="tool" data-ed="del">${IC.trash}Löschen</button></div></div>`; }
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

// Eigenschaftsfeld eines Bausteins: eigene Felder über den Haken felder(o), sonst aus PC.props bzw. PROPS
export function objektFelder(o){
  const a = art(o.k), pc = PC[o.k];
  let h = "";
  if (a.felder) h += a.felder(o);
  else if (pc) h += bauteilFelder(o, pc);
  else for (const [f, lbl, ph] of PROPS[o.k] || []) h += textFeld(f, lbl, ph, o[f]);
  if (pc && pc.info) h += `<p class="small muted" style="margin:0 0 8px;line-height:1.45">${pc.info}</p>`;
  if (pc && o.k !== "rail") h += DREHKNOEPFE;
  return `<div class="props"><div class="palh">${a.titel || BLK[o.k].n}</div>${h}${h ? SYMS : ""}${loeschKnopf()}</div>`;
}
export function bauteilFelder(o, pc){
  let h = textFeld("v", o.k === "rail" ? "Potenzial, z. B. L+, M, L1, PE" : "Kennzeichen", pc.lbl, o.v);
  for (const [f, lbl, ty, opts] of pc.props || []) {
    if (ty === "select") h += auswahlFeld(f, lbl, opts, o[f] ?? (pc.def || {})[f]);
    else h += textFeld(f, lbl, "", f === "w" ? (o.w || 400) : o[f]);
  }
  return h;
}
export const DREHKNOEPFE = `<div class="propact" style="justify-content:flex-start;gap:6px;margin-bottom:8px"><button type="button" class="tool" data-ed="rot" title="Taste R">↻ Drehen 90°</button><button type="button" class="tool" data-ed="flip" title="Taste M">⇋ Spiegeln</button></div>`;
