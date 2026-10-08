/* Ansicht #/schaltplan/<Seite>/<Spalte>: Inhaltsverzeichnis und Suche links, das Blatt in der Mitte.
   Blättern mit Pfeiltasten und Bild auf/ab, Zoomen mit Mausrad, + und −, Vollbild mit F. Klick oder Enter auf einen
   Querverweis springt, auf ein Kennzeichen zeigt alle Fundstellen. Drucken auf A3 oder A4 quer.
   Der Plan wird beim ersten Aufruf einmal gezeichnet. */
import { SIG } from '../app/daten.js';
import { $, $$, dlgZeigen, esc } from '../app/basis.js';
import { app, setNav } from '../app/start.js';
import { doPrint } from '../app/druck.js';
import { SPALTE, X0, KOPF, FUSS } from './blatt.js';
import { PLAN } from './daten.js';
import { aufbereiten } from './modell.js';
import { zeichnePlan } from './plan.js';
import { fundstellen, verweisText } from './querverweise.js';
import { bindeZoom, einpassen, vollbild, warGezogen, zoomeRaus, zoomeRein } from './zoom.js';

let plan = null, aktuell = 1, ohneLeiste = false;
function ladePlan(){
  if (!plan) {
    const modell = aufbereiten(PLAN, SIG);
    plan = {...zeichnePlan(modell), modell};
  }
  return plan;
}
const ziel = (seite, spalte) => `#/schaltplan/${seite}` + (spalte !== undefined ? `/${spalte}` : "");
const ROLLE = {haupt: "Spule oder Gerät", kontakt: "Kontakt", geraet: "Gerät", klemme: "Anschluss"};

function inhaltsListe(seiten){
  return seiten.map(s => `<a href="${ziel(s.nr)}" data-nr="${s.nr}"${s.nr === aktuell ? ' aria-current="page"' : ""}>`
    + `<span class="nr">${s.nr}</span><span>${esc(s.titel)}</span></a>`).join("");
}

const knopf = (aktion, text, titel) => `<button class="btn small" type="button" data-sp="${aktion}" title="${titel}" `
  + `aria-label="${titel}">${text}</button>`;

function leiste(n, gesamt, titel){
  const blaettern = (nr, text, aria) => nr >= 1 && nr <= gesamt
    ? `<a class="btn small" href="${ziel(nr)}" aria-label="${aria}">${text}</a>` : `<span class="btn small" aria-disabled="true">${text}</span>`;
  return `<div class="sp-leiste">${knopf("leiste", "☰", "Inhaltsverzeichnis ein- oder ausblenden")}`
    + `${blaettern(n - 1, "‹", "Vorige Seite")}<span class="sp-pos"><b>Seite ${n}</b> von ${gesamt}`
    + `<span class="muted"> · ${esc(titel)}</span></span>${blaettern(n + 1, "›", "Nächste Seite")}<span class="grow"></span>`
    + `<span class="sp-zoom">${knopf("raus", "−", "Verkleinern (Taste −)")}<span id="sp-zoom-wert">100 %</span>`
    + `${knopf("rein", "+", "Vergrößern (Taste +)")}${knopf("einpassen", "Einpassen", "Ganzes Blatt zeigen (Taste 0)")}`
    + `${knopf("vollbild", "Vollbild", "Vollbild ein oder aus (Taste F)")}</span>`
    + `${knopf("drucken", "Drucken", "Seiten drucken")}</div>`;
}

// Verweise und Kennzeichen im Blatt mit der Tastatur erreichbar machen
function tastaturZiele(){
  for (const el of $$("#sp-blatt [data-ref], #sp-blatt [data-bmk]")) {
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "link");
  }
}

export function viewSchaltplan(seite, spalte){
  setNav("schaltplan");
  const {seiten} = ladePlan();
  aktuell = Math.min(Math.max(1, +seite || 1), seiten.length);
  const s = seiten[aktuell - 1];
  app.innerHTML = `<section class="sp${ohneLeiste ? " sp-ohne-leiste" : ""}"><aside class="sp-seitenleiste">
      <h1>Schaltplan der Anlage</h1>
      <input type="search" id="sp-suche" placeholder="Kennzeichen, Signal, Adresse, Gerät" aria-label="Im Schaltplan suchen">
      <div id="sp-treffer" class="sp-treffer" aria-live="polite"></div>
      <nav class="sp-seiten" aria-label="Seiten des Schaltplans">${inhaltsListe(seiten)}</nav>
    </aside><div class="sp-haupt">${leiste(aktuell, seiten.length, s.titel)}
      <div class="sp-blatt" id="sp-blatt">${s.svg}</div>
      <p class="sp-tipp muted">Pfeiltasten blättern, Mausrad oder + und − zoomen, Ziehen verschiebt, F schaltet das Vollbild.
      Ein Klick auf einen blauen Verweis wie /12.3 springt zu Seite 12, Spalte 3.
      Ein Klick auf ein Kennzeichen zeigt alle Stellen, an denen es vorkommt.</p></div></section>`;
  const liste = $(".sp-seiten"), eintrag = $(".sp-seiten [aria-current]");
  if (eintrag) liste.scrollTop = eintrag.offsetTop - liste.offsetTop - liste.clientHeight / 2;
  tastaturZiele();
  bindeZoom();
  if (spalte !== undefined && spalte !== "") markiereSpalte(+spalte);
}

function markiereSpalte(spalte){
  const svg = $("#sp-blatt svg"), rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  const lage = {x: X0 + spalte * SPALTE, y: KOPF, width: SPALTE, height: FUSS - KOPF, class: "sp-markiert"};
  Object.entries(lage).forEach(([k, v]) => rect.setAttribute(k, v));
  svg.appendChild(rect);
}

/* ---------- Suche und Fundstellen ---------- */
const normal = t => String(t).toLowerCase().replace(/^[-–]/, "−").replace(/%/g, "");

// Treffer aus Kennzeichen und Potenzialen (Index), Gerätebeschreibungen und Signalen
function treffer(frage){
  const {index, modell} = ladePlan(), q = normal(frage);
  if (q.length < 2) return [];
  const orte = [...index.orte.keys()].filter(b => normal(b).includes(q)).slice(0, 12)
    .map(b => ({titel: b, ort: fundstellen(index, b)[0], art: b.startsWith("−") ? "Kennzeichen" : "Potenzial"}));
  const geraete = [...modell.geraete.values()].filter(g => normal(g.text).includes(q) && !orte.some(o => o.titel === g.bmk))
    .slice(0, 8).map(g => ({titel: `${g.bmk}  ${g.text}`, ort: fundstellen(index, g.bmk)[0], art: "Gerät"}));
  const signale = Object.values(SIG).flat().filter(e => normal(e.n).includes(q) || normal(e.a) === q).slice(0, 12)
    .map(e => ({titel: `${e.a}  ${e.n}`, ort: index.signale.get(e.n), art: "Signal"}));
  return [...orte, ...geraete, ...signale];
}

const trefferHTML = liste => liste.length ? liste.map(t => t.ort
  ? `<a href="${ziel(t.ort.seite, t.ort.spalte)}"><b>${esc(t.titel)}</b><span>${t.art} ${verweisText(t.ort)}</span></a>` : "").join("")
  : `<p class="muted small">Nichts gefunden.</p>`;

function zeigeFundstellen(bmk){
  const liste = fundstellen(ladePlan().index, bmk);
  $("#sp-treffer").innerHTML = `<p class="small"><b>${esc(bmk)}</b> kommt ${liste.length}-mal vor:</p>` + liste.map(e =>
    `<a href="${ziel(e.seite, e.spalte)}"><b>${verweisText(e)}</b><span>${ROLLE[e.rolle] || e.rolle} ${esc(e.an || "")}</span></a>`).join("");
}

/* ---------- Drucken ---------- */
function druckDialog(){
  const gesamt = ladePlan().seiten.length;
  $("#dlg").innerHTML = `<form class="dlg" method="dialog"><h2>Schaltplan drucken</h2>
    <p class="muted">Jede Seite wird ein Blatt quer. A3 ist das Originalformat. A4 verkleinert auf etwa 70 %, die kleinste
    Schrift ist dann nur noch etwa 1,6 mm hoch. Für die Werkstatt nimmst du besser A3.</p>
    <div class="opts"><label class="opt"><input type="radio" name="format" value="a3" checked>
      <span><b>A3 quer</b><span>Originalgröße</span></span></label>
    <label class="opt"><input type="radio" name="format" value="a4"><span><b>A4 quer</b><span>verkleinert</span></span></label></div>
    <p><label>Seiten von <input type="number" name="von" min="1" max="${gesamt}" value="1" style="width:5em"></label>
    <label>bis <input type="number" name="bis" min="1" max="${gesamt}" value="${gesamt}" style="width:5em"></label></p>
    <div class="row"><button class="btn primary" value="ok">Drucken</button><button class="btn" value="abbrechen">Abbrechen</button></div></form>`;
  const form = $("#dlg form");
  form.addEventListener("submit", e => {
    if (e.submitter && e.submitter.value !== "ok") return;
    const d = new FormData(form), von = +d.get("von") || 1, bis = +d.get("bis") || gesamt;
    drucke(d.get("format"), Math.min(von, bis), Math.max(von, bis));
  });
  dlgZeigen($("#dlg"));
}

function drucke(format, von, bis){
  const klasse = format === "a4" ? "land" : "sp-a3";
  doPrint(ladePlan().seiten.slice(von - 1, bis).map(s => `<section class="pp sp-druck ${klasse}">${s.svg}</section>`).join(""));
}

/* ---------- Ereignisse ---------- */
const imPlan = () => location.hash.startsWith("#/schaltplan");

function blaettern(schritt){
  const gesamt = ladePlan().seiten.length;
  location.hash = ziel(Math.min(gesamt, Math.max(1, aktuell + schritt)));
}

const TASTEN = {
  ArrowLeft: () => blaettern(-1), PageUp: () => blaettern(-1), ArrowRight: () => blaettern(1), PageDown: () => blaettern(1),
  Home: () => { location.hash = ziel(1); }, End: () => { location.hash = ziel(ladePlan().seiten.length); },
  "+": zoomeRein, "=": zoomeRein, "-": zoomeRaus, "0": einpassen, f: vollbild, F: vollbild,
};

function taste(e){
  if (!imPlan() || e.target.closest("input, textarea, dialog") || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "Enter" && e.target.closest("#sp-blatt [data-ref], #sp-blatt [data-bmk]")) {
    folge(e.target);
    e.preventDefault();
    return;
  }
  const aktion = TASTEN[e.key];
  if (!aktion) return;
  aktion();
  e.preventDefault();
}

// Verweis springt, Kennzeichen zeigt Fundstellen
function folge(el){
  const ref = el.closest("[data-ref]"), bmk = el.closest("[data-bmk]");
  if (ref) location.hash = ziel(...ref.dataset.ref.split("."));
  else if (bmk && bmk.closest("#sp-blatt")) zeigeFundstellen(bmk.dataset.bmk);
}

const KNOEPFE = {
  drucken: druckDialog, rein: zoomeRein, raus: zoomeRaus, einpassen, vollbild,
  leiste: () => { ohneLeiste = !ohneLeiste; $(".sp").classList.toggle("sp-ohne-leiste", ohneLeiste); einpassen(); },
};

function klick(e){
  if (!imPlan()) return;
  const knopfEl = e.target.closest("[data-sp]");
  if (knopfEl) return KNOEPFE[knopfEl.dataset.sp]();
  if (!warGezogen()) folge(e.target);
}

export function init(){
  document.addEventListener("keydown", taste);
  document.addEventListener("click", klick);
  document.addEventListener("input", e => {
    if (e.target.id === "sp-suche") $("#sp-treffer").innerHTML = trefferHTML(treffer(e.target.value));
  });
}
