// Editor-Kern: Eigenschaftsfeld links im Editor (Felder des markierten Elements, Zeichenleiste).
import { $, $$, IC, esc } from '../app/basis.js';
import { ED } from './status.js';
import { BAUSTEIN, STRICH, art, vorlage } from './registry.js';
import { gruppeVon } from './bausteine.js';
import { markiertesElement, objById } from './auswahl.js';
import { deDate, skMeta } from './blaetter.js';
import { signalFeld } from './signalfeld.js';

// Zeichenleiste unter Text- und Beschriftungsfeldern
export const ZEICHEN = [["·","UND"],["+","ODER"],["¬","NICHT"],["↑","steigende Flanke"],["↓","fallende Flanke"],[":=","Zuweisung"],
  ["≥","größer gleich"]];
export const SYMS = `<div class="syms" aria-label="Zeichen einfügen">`
  + ZEICHEN.map(([c, t]) => `<button type="button" class="sym" data-sym="${c}" title="${t}">${c}</button>`).join("") + `</div>`;
export let propsKey = null, lastProp = null;
export const setLastProp = (el) => { lastProp = el; };   // für den focusin-Listener in ereignisse.js
// Bausteine für Eigenschaftsfelder, auch für die Haken felder(o) der Vorlagen.
// Kennzeichen, Texte und Beschriftungen bekommen ein mehrzeiliges Feld, alles andere eine Zeile.
export const MEHRZEILIG = ["v", "tv", "cv", "b"];
export function textFeld(f, lbl, ph, val){
  const wert = esc(val ?? ""), platz = esc(ph || "");
  if (!MEHRZEILIG.includes(f)) {
    return `<label class="prop">${lbl}<input type="text" data-prop="${f}" value="${wert}" placeholder="${platz}" `
      + `autocomplete="off"></label>`;
  }
  const zeilen = Math.max(1, String(val ?? "").split("\n").length);
  return `<label class="prop">${lbl}<textarea data-prop="${f}" rows="${zeilen}" placeholder="${platz}" title="Alt+Enter: neue Zeile">`
    + `${wert}</textarea></label>`;
}
export function auswahlFeld(f, lbl, opts, cur){
  const optionen = opts.map(([v, n]) => `<option value="${v}" ${String(v) === String(cur) ? "selected" : ""}>${n}</option>`).join("");
  return `<label class="prop">${lbl}<select data-prop="${f}">${optionen}</select></label>`;
}
export const FARBEN = [["#17212B","Schwarz"],["#0E4C92","Blau"],["#C0392B","Rot"]];
// Rahmen eines Eigenschaftsfelds mit Überschrift
export const propsKasten = (titel, inhalt) => `<div class="props"><div class="palh">${titel}</div>${inhalt}</div>`;
export const loeschKnopf = () => `<div class="propact"><button type="button" class="tool" data-ed="del">${IC.trash}Löschen</button></div>`;
// Inhalt des Eigenschaftsfelds für die aktuelle Markierung (oder die Anleitung der Vorlage zum gewählten Werkzeug)
export function propsHTML(){
  const v = vorlage(ED.key), anleitung = v.anleitung && v.anleitung();   // Haken anleitung: Hilfe zum gewählten Werkzeug
  if (anleitung) return anleitung;
  const el = markiertesElement();
  if (el) return FELDER_JE_ART[ED.markiert.art](el);
  return RUHE_HINWEIS;
}
export const RUHE_HINWEIS = `<div class="props quiet"><p>Element anklicken zum Ändern, Doppelklick beschriftet. `
  + `Name und Datum: aufs Schriftfeld klicken.</p></div>`;
// Eigenschaftsfeld je Art der Markierung (Arten in status.js)
export const FELDER_JE_ART = {
  o: o => objektFelder(o), c: c => verbindungFelder(c), s: st => strichFelder(st), t: t => textFelder(t),
  f: () => schriftfeldFelder(),
};
export const GROESSEN = [[12,"klein"],[16,"normal"],[20,"groß"],[26,"sehr groß"]];
export const STAERKEN = [[1.4,"dünn"],[2.2,"mittel"],[4,"dick"]];
export function textFelder(t){
  return propsKasten("Text", textFeld("tv", "Text", "", t.v) + SYMS + auswahlFeld("ts", "Größe", GROESSEN, t.s || 16)
    + auswahlFeld("sc", "Farbe", FARBEN, t.c) + loeschKnopf());
}
// Striche: Stricharten aus STRICH bringen Titel und Felder mit, sonst Linie, Kasten oder Freihandstrich
export function strichFelder(st){
  const a = STRICH[st.k];
  if (a && a.felder) return propsKasten(a.titel, a.felder(st) + loeschKnopf());
  const titel = st.k ? (STRICH[st.k] || STRICH.r).titel : "Freihandstrich";
  const griffe = st.k ? HINWEIS("Die runden Griffe an den Enden ziehen.") : "";
  return propsKasten(titel, auswahlFeld("sc", "Farbe", FARBEN, st.c) + auswahlFeld("sw", "Strichstärke", STAERKEN, st.w)
    + griffe + loeschKnopf());
}
// Leitung (zwischen Anschlüssen) oder Verbindung; beschriftbar sind Verbindungen einer Gruppe mit pfeiltext: true
export function verbindungFelder(c){
  if (c.pa !== undefined || c.pb !== undefined) {
    return propsKasten("Leitung", textFeld("cv", "Beschriftung (optional)", "z. B. Aderfarbe oder Querschnitt", c.v)
      + auswahlFeld("cst", "Leitungsart", LEITUNGSARTEN, c.st || "") + loeschKnopf());
  }
  const beschriftung = gruppeVon(objById(c.a)).pfeiltext
    ? textFeld("cv", "Beschriftung", "z. B. BG13 / QA1", c.v) + SYMS
    : HINWEIS("GRAFCET-Verbindungen tragen keine Beschriftung – die Bedingung steht an der Transition.");
  return propsKasten("Verbindung", beschriftung + loeschKnopf());
}
export const LEITUNGSARTEN = [["", "Arbeits-/Hauptleitung"], ["st", "Steuerleitung (gestrichelt)"]];
// Schriftfeld: leere Felder zeigen als Platzhalter, was ohne Eintrag gilt
export function schriftfeldFelder(){
  const m = ED.data.meta || {}, auto = skMeta(ED.scope, ED.key, {...ED.data, meta: {}});
  const datum = `<input type="text" data-prop="md" value="${esc(m.datum || "")}" placeholder="${esc(auto.datum || deDate(Date.now()))}" `
    + `autocomplete="off"><button type="button" class="tool" data-ed="heute" style="margin-top:3px">Heute</button>`;
  return `<div class="props"><div class="palh">Schriftfeld</div>${textFeld("mt", "Titel", auto.title, m.title)}`
    + `${textFeld("mn", "Name", auto.name || "Name eintragen", m.name)}
    <label class="prop">Datum<span style="display:flex;gap:6px">${datum}</span></label>
    ${HINWEIS("Leer gelassen gelten der Name aus „Meine Daten“ und das Datum der letzten Änderung.")}
    <div class="propact"><button type="button" class="tool" data-ed="sfzu">Fertig</button></div></div>`;
}
// Hinweis im Eigenschaftsfeld, z. B. wenn der Haken vorVerbinden eine Verbindung ablehnt. Er bleibt stehen, bis sich
// die Markierung ändert.
export function zeigeHinweis(text){
  const el = $("#props");
  if (el) el.innerHTML = `<div class="props quiet"><p>${esc(text)}</p></div>`;
}
export function updateProps(force){
  const el = $("#props"); if (!el) return;
  const k = ED.markiert ? ED.markiert.art + "|" + ED.markiert.id : "";
  if (!force && k === propsKey) return;
  if (force !== "neu" && k === propsKey && el.contains(document.activeElement)) {   // wird gerade bedient: nur Werte nachziehen
    const fresh = document.createElement("div"); fresh.innerHTML = propsHTML();
    $$("[data-prop]", el).forEach(f => {
      const n = fresh.querySelector(`[data-prop="${f.dataset.prop}"]`);
      if (n && f !== document.activeElement) f.value = n.value;
    });
    return;
  }
  propsKey = k; el.innerHTML = propsHTML();
}

// Eigenschaftsfeld eines Bausteins: eigene Felder über den Haken felder(o), sonst aus der feldliste
export function objektFelder(o){
  const a = art(o.k);
  let h = a.felder ? a.felder(o) : (a.feldliste || []).map(feld => listenFeld(o, a, feld)).join("");
  if (a.info) h += `<p class="small muted" style="margin:0 0 8px;line-height:1.45">${a.info}</p>`;
  if (a.bauteil && a.drehbar !== false) h += DREHKNOEPFE;
  return propsKasten(a.titel || BAUSTEIN[o.k].n, h + (h ? SYMS : "") + loeschKnopf());
}
// Kennzeichen: mit Vorschlagsliste (signalfeld.js), wenn die Bausteinart kennbuchstaben hat, z. B. ["QA", "KF"]
export function kennzeichenFeld(o, lbl, ph){
  const arten = art(o.k).kennbuchstaben;
  return arten ? signalFeld("v", lbl, o.v, {arten, ph}) : textFeld("v", lbl, ph, o.v);
}
// Ein Eintrag [Feld, Beschriftung, Platzhalter oder Optionen] der feldliste: Kennzeichen (v), Auswahl oder Textfeld
export function listenFeld(o, a, [f, lbl, zusatz]){
  if (f === "v") return kennzeichenFeld(o, lbl, zusatz);
  if (Array.isArray(zusatz)) return auswahlFeld(f, lbl, zusatz, o[f] ?? (a.def || {})[f]);
  return textFeld(f, lbl, zusatz, o[f]);
}
export const DREHKNOEPFE = `<div class="propact" style="justify-content:flex-start;gap:6px;margin-bottom:8px">`
  + `<button type="button" class="tool" data-ed="rot" title="Taste R">↻ Drehen 90°</button>`
  + `<button type="button" class="tool" data-ed="flip" title="Taste M">⇋ Spiegeln</button></div>`;
// Kleiner grauer Hinweis im Eigenschaftsfeld, auch für die Haken felder der Vorlagen
export const HINWEIS = t => `<p class="small muted" style="margin:0 0 8px">${t}</p>`;
