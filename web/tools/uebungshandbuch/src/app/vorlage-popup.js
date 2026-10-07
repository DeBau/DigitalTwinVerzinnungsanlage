/* ---------- Vorlage im Popup ausfüllen ---------- */
// Vorlagen mit felder: Ansicht „Karten“ (links Zeilenliste, rechts eine Karte je Zeile mit großen Tasten 0/1, ja/nein)
// und Ansicht „Übersicht“ (die ganze Tabelle auf einen Blick). Vorlagen ohne felder: die bisherige Tabelle.
// Gespeichert wird unter denselben Schlüsseln wie in der Tabelle (tplKey), Druck und Mappe bleiben gleich.
import { $, BY, S, chips, esc, plain, trenn } from './basis.js';
import { PHASES } from './daten.js';
import { tplHead, tplKey, tplNIn, tplRows, tplsOf } from './vorlagen-basis.js';
import { balkenHTML, feld, tplKarteHTML, tplStand, zeileAuffaellig, zeileFertig, zeileWerte } from './vorlage-stand.js';
import { docTable, restoreInputs } from './uebung.js';

const Z = {ex: null, d: null, p: 4, ri: 0, filter: "alle", ansicht: "karten"};
const WAHL = {"01": ["0", "1"], "janein": ["ja", "nein"]};
const TASTE = {"0": ["01", "0"], "1": ["01", "1"], "j": ["janein", "ja"], "n": ["janein", "nein"]};
const PFEIL = {ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1};
const FILTER = [["alle", "Alle"], ["offen", "Offen"], ["auff", "Abweichung"]];
const ANSICHT = [["karten", "Karten"], ["uebersicht", "Übersicht"]];

const dlg = () => $("#tpd");
const zeilen = () => tplRows(Z.d);
const zeile = () => zeilen()[Z.ri];
const fertig = ri => zeileFertig(Z.ex, Z.d, ri, zeilen()[ri], Z.p);
const auff = ri => zeileAuffaellig(Z.ex, Z.d, ri, zeilen()[ri]);
const sichtbar = ri => Z.filter === "offen" ? !fertig(ri) : Z.filter === "auff" ? auff(ri) : true;
const status = ri => auff(ri) ? "auff" : fertig(ri) ? "ok" : "";
const statusZeichen = ri => auff(ri) ? "!" : fertig(ri) ? "✓" : ri + 1;
const istWahl = (r, ci) => !!WAHL[feld(Z.ex, Z.d, r, ci).typ];

export function openVorlage(id, tid, p){
  const ex = BY[id], d = tplsOf(ex).find(x => x.id === tid); if (!d) return;
  Object.assign(Z, {ex, d, p, filter: "alle", ansicht: "karten"});
  Z.ri = Math.max(0, zeilen().findIndex((_, ri) => !fertig(ri)));
  if (d.felder) zeichne(); else zeichneTabelle();
  dlg().showModal();
}
function zeichneTabelle(){
  const kopf = `<header class="tpd-kopf"><h2>${Z.d.cap}</h2><button class="btn primary" value="ok">Fertig</button></header>`;
  dlg().innerHTML = `<form method="dialog" class="tpd-in">${kopf}<div class="tpd-tab">${docTable(Z.ex, Z.d, "edit")}</div></form>`;
  restoreInputs(dlg());
}

/* ---------- Zeichnen ---------- */
function zeichne(){
  const karten = `<div class="tpd-body"><nav class="tpd-liste" aria-label="Zeilen">${listeHTML()}</nav>`
    + `<section class="tpd-karte">${karteHTML()}</section></div>`;
  const inhalt = Z.ansicht === "uebersicht" ? `<div class="tpd-tab">${uebersichtHTML()}</div>` : karten;
  dlg().innerHTML = `<form method="dialog" class="tpd-in"><header class="tpd-kopf">${kopfHTML()}</header>${inhalt}</form>`;
  const karte = $(".tpd-karte", dlg()); if (karte) restoreInputs(karte);
  $(".tpd-z.aktiv", dlg())?.scrollIntoView({block: "nearest"});
}
function umschalterHTML(liste, aktiv, act, label){
  const knopf = ([k, n]) => `<button type="button" class="btn small" data-act="${act}" data-f="${k}" aria-pressed="${aktiv === k}">${n}</button>`;
  return `<div class="tpd-filter" role="group" aria-label="${label}">${liste.map(knopf).join("")}</div>`;
}
function kopfHTML(){
  const st = tplStand(Z.ex, Z.d, Z.p);
  const auffText = st.auffaellig ? ` · <b>${st.auffaellig}</b> Abweichung` : "";
  const fort = `<div class="tpd-fort">${balkenHTML(st)}<span><b>${st.fertig}</b> von ${st.gesamt} fertig${auffText}</span></div>`;
  const filter = Z.ansicht === "karten" ? umschalterHTML(FILTER, Z.filter, "tpd-filter", "Zeilen filtern") : "";
  return `<div class="tpd-titel"><h2>${Z.d.cap}</h2>${fort}</div>${umschalterHTML(ANSICHT, Z.ansicht, "tpd-ansicht", "Ansicht")}${filter}`
    + `<button class="btn primary" value="ok">Fertig</button>`;
}

/* ---------- Ansicht Karten ---------- */
function listeEintragHTML(r, ri){
  const titel = r.length ? chips(r[0]) : `Zeile ${ri + 1}`;
  const werte = zeileWerte(Z.ex, Z.d, ri, r).filter((_, ci) => istWahl(r, ci)).map(v => `<i>${esc(v) || "·"}</i>`).join("");
  return `<button type="button" class="tpd-z ${status(ri)}${ri === Z.ri ? " aktiv" : ""}" data-act="tpd-zeile" data-r="${ri}">`
    + `<span class="st">${statusZeichen(ri)}</span>`
    + `<span class="tx"><b>${titel}</b> ${r[1] ? chips(r[1]) : ""}<br><span class="small muted">${esc(plain(r[2] ?? ""))}</span></span>`
    + `<span class="werte">${werte}</span></button>`;
}
function listeHTML(){
  const html = zeilen().map((r, ri) => sichtbar(ri) ? listeEintragHTML(r, ri) : "").join("");
  return html || `<p class="muted small" style="padding:12px">Keine Zeile in diesem Filter.</p>`;
}
function steckbriefHTML(werte, head){
  const eintrag = (x, c) => `<div><dt>${trenn(head[c] || "")}</dt><dd>${trenn(chips(x))}</dd></div>`;
  return `<dl class="tpd-steck">${werte.map(eintrag).join("")}</dl>`;
}
function beispielHTML(head){
  if (!Z.d.muster) return "";
  return `<details class="tpd-bsp"><summary>Beispiel: so trägst du ein</summary>${steckbriefHTML(Z.d.muster, head)}</details>`;
}
function abweichungHTML(head){
  if (!auff(Z.ri)) return "";
  const r = zeile(), [a, b] = Z.d.vergleich, v = zeileWerte(Z.ex, Z.d, Z.ri, r);
  const name = i => esc(plain(head[r.length + i]));
  return `<div class="tpd-auff"><b>Abweichung:</b> ${name(a)} ist <b>${esc(v[a])}</b>, ${name(b)} ist <b>${esc(v[b])}</b>. `
    + `Das ist kein Fehler, wenn du es erklären kannst. Schreib in die Bemerkung, warum.</div>`;
}
function geschafftHTML(){
  const st = tplStand(Z.ex, Z.d, Z.p);
  if (!st.gesamt || st.fertig < st.gesamt) return "";
  return `<div class="tpd-geschafft">Geschafft! Alle ${st.gesamt} Zeilen sind ausgefüllt. `
    + `<button type="button" class="btn small" data-act="tpd-ansicht" data-f="uebersicht">Zur Übersicht</button></div>`;
}
function navHTML(){
  const letzte = Z.ri >= zeilen().length - 1;
  return `<div class="tpd-nav"><button type="button" class="btn" data-act="tpd-schritt" data-d="-1" ${Z.ri ? "" : "disabled"}>Vorige Zeile</button>`
    + `<span class="muted small">Tasten: 0 und 1, J und N füllen das nächste freie Feld, Pfeile wechseln die Zeile</span>`
    + `<button type="button" class="btn primary" data-act="tpd-schritt" data-d="1" ${letzte ? "disabled" : ""}>Nächste Zeile</button></div>`;
}
function karteHTML(){
  const r = zeile(), head = tplHead(Z.ex, Z.d), n = tplNIn(Z.d, r, head);
  const felder = Array.from({length: n}, (_, ci) => feldHTML(head[r.length + ci] || "", ci)).join("");
  return geschafftHTML() + beispielHTML(head) + `<div class="tpd-nr">Zeile ${Z.ri + 1} von ${zeilen().length}</div>`
    + steckbriefHTML(r, head) + abweichungHTML(head) + `<div class="tpd-felder">${felder}</div>` + navHTML();
}
function feldHTML(titel, ci){
  const f = feld(Z.ex, Z.d, zeile(), ci), k = tplKey(Z.ex.id, Z.d, Z.ri, ci), v = String(S.get(k) ?? "").trim();
  const label = trenn(titel);
  if (f.ab > Z.p) {
    const jetzt = v ? ` Jetzt: <b>${esc(v)}</b>` : "";
    return `<div class="tpd-feld zu"><label>${label}</label><span class="muted small">Trägst du im Schritt ${PHASES[f.ab].n} ein.${jetzt}</span></div>`;
  }
  if (!WAHL[f.typ]) return `<div class="tpd-feld"><label for="tpd${ci}">${label}</label><textarea id="tpd${ci}" class="auto" rows="2" data-k="${k}"></textarea></div>`;
  const knopf = w => `<button type="button" data-act="tpd-set" data-ci="${ci}" data-v="${w}" aria-pressed="${v === w}">${w}</button>`;
  return `<div class="tpd-feld"><label>${label}</label><div class="tpd-wahl">${WAHL[f.typ].map(knopf).join("")}</div></div>`;
}

/* ---------- Ansicht Übersicht: alle Zeilen und Werte, Klick auf eine Zeile öffnet ihre Karte ---------- */
function uebersichtZeileHTML(r, ri, n){
  const werte = zeileWerte(Z.ex, Z.d, ri, r);
  const fest = r.map(x => `<td>${trenn(chips(x))}</td>`).join("");
  const ein = Array.from({length: n}, (_, ci) => `<td class="wert${istWahl(r, ci) ? " wahl" : ""}">${esc(werte[ci] || "")}</td>`).join("");
  return `<tr class="${status(ri)}" data-act="tpd-zeile" data-r="${ri}"><td class="st"><span>${statusZeichen(ri)}</span></td>${fest}${ein}</tr>`;
}
function uebersichtHTML(){
  const head = tplHead(Z.ex, Z.d);
  const kopf = `<tr><th></th>${head.map(x => `<th>${trenn(x)}</th>`).join("")}</tr>`;
  const body = zeilen().map((r, ri) => uebersichtZeileHTML(r, ri, tplNIn(Z.d, r, head))).join("");
  return `<p class="muted small">Klicke auf eine Zeile, um sie zu bearbeiten.</p>`
    + `<div class="tw"><table class="tplt ro tpd-ueb"><thead>${kopf}</thead><tbody>${body}</tbody></table></div>`;
}

/* ---------- Bedienen ---------- */
function setze(ci, w){
  const k = tplKey(Z.ex.id, Z.d, Z.ri, ci), war = fertig(Z.ri);
  S.set(k, String(S.get(k) ?? "") === w ? null : w);
  zeichne();
  // Zeile gerade fertig geworden und ohne Abweichung: kurz zeigen, dann zur nächsten offenen Zeile
  if (!war && fertig(Z.ri) && !auff(Z.ri)) setTimeout(() => { if (dlg().open) springe(naechsteOffene()); }, 350);
}
function naechsteOffene(){
  const n = zeilen().length;
  for (let i = 1; i <= n; i++) {
    const ri = (Z.ri + i) % n;
    if (!fertig(ri)) return ri;
  }
  return Z.ri;
}
function springe(ri){
  Z.ri = Math.max(0, Math.min(zeilen().length - 1, ri));
  zeichne();
}
function freiesFeld(typ){
  const r = zeile(), werte = zeileWerte(Z.ex, Z.d, Z.ri, r);
  return werte.findIndex((v, ci) => {
    const f = feld(Z.ex, Z.d, r, ci);
    return !v && f.typ === typ && f.ab <= Z.p;
  });
}
function tpdTaste(e){
  if (Z.ansicht !== "karten" || e.target.closest("textarea,input")) return;
  const t = TASTE[e.key.toLowerCase()], ci = t ? freiesFeld(t[0]) : -1;
  if (ci >= 0) { e.preventDefault(); setze(ci, t[1]); }
  if (PFEIL[e.key]) { e.preventDefault(); springe(Z.ri + PFEIL[e.key]); }
}
const TPD_AKTION = {
  "tpd-set": a => setze(+a.dataset.ci, a.dataset.v),
  "tpd-zeile": a => { Z.ansicht = "karten"; springe(+a.dataset.r); },
  "tpd-schritt": a => springe(Z.ri + +a.dataset.d),
  "tpd-filter": a => { Z.filter = a.dataset.f; zeichne(); },
  "tpd-ansicht": a => { Z.ansicht = a.dataset.f; zeichne(); },
};
// Nach dem Schließen: Karte im Schritt neu zeichnen
function geschlossen(){
  const alt = $(`.tplk[data-t="${Z.d.id}"]`);
  if (alt) alt.outerHTML = tplKarteHTML(Z.ex, Z.d, Z.p);
}
export function init(){
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-act=tpl-open]"), m = location.hash.match(/^#\/(L\d\d)/);
    if (a && m) openVorlage(m[1], a.dataset.t, +a.dataset.p);
  });
  dlg().addEventListener("click", e => {
    const a = e.target.closest("[data-act^=tpd-]");
    if (a && Z.d.felder) TPD_AKTION[a.dataset.act](a);
  });
  // auf document und in der Capture-Phase: Nach dem Neuzeichnen liegt der Fokus nicht mehr im Popup, und die Pfeiltasten
  // dürfen nicht den Schritt der Übung wechseln (ereignisse.js)
  document.addEventListener("keydown", e => {
    if (!dlg().open || !Z.d || !Z.d.felder) return;
    e.stopPropagation();
    tpdTaste(e);
  }, true);
  dlg().addEventListener("close", geschlossen);
}
