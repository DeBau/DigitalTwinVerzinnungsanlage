/* Ansicht #/schaltplan/<Seite>/<Spalte>: Inhaltsverzeichnis und Suche links, das Blatt in der Mitte.
   Blättern mit Pfeiltasten und Bild auf/ab, Klick auf einen Querverweis springt, Klick auf ein Kennzeichen zeigt alle
   Fundstellen. Drucken auf A3 oder A4 quer. Der Plan wird beim ersten Aufruf einmal gezeichnet. */
import { SIG } from '../app/daten.js';
import { $, esc } from '../app/basis.js';
import { app, setNav } from '../app/start.js';
import { doPrint } from '../app/druck.js';
import { SPALTE, X0 } from './blatt.js';
import { PLAN } from './daten.js';
import { aufbereiten } from './modell.js';
import { zeichnePlan } from './plan.js';
import { fundstellen, verweisText } from './querverweise.js';

let plan = null, aktuell = 1;
const ladePlan = () => plan || (plan = zeichnePlan(aufbereiten(PLAN, SIG)));
const ziel = (seite, spalte) => `#/schaltplan/${seite}` + (spalte !== undefined ? `/${spalte}` : "");
const ROLLE = {haupt: "Spule oder Gerät", kontakt: "Kontakt", geraet: "Gerät", klemme: "Anschluss"};

function inhaltsListe(seiten){
  return seiten.map(s => `<a href="${ziel(s.nr)}" data-nr="${s.nr}"${s.nr === aktuell ? ' aria-current="page"' : ""}>`
    + `<span class="nr">${s.nr}</span><span>${esc(s.titel)}</span></a>`).join("");
}

function leiste(n, gesamt, titel){
  const knopf = (nr, text, aria) => nr >= 1 && nr <= gesamt
    ? `<a class="btn small" href="${ziel(nr)}" aria-label="${aria}">${text}</a>` : `<span class="btn small" aria-disabled="true">${text}</span>`;
  return `<div class="sp-leiste">${knopf(n - 1, "‹", "Vorige Seite")}<span class="sp-pos"><b>Seite ${n}</b> von ${gesamt}`
    + `<span class="muted"> · ${esc(titel)}</span></span>${knopf(n + 1, "›", "Nächste Seite")}<span class="grow"></span>`
    + `<button class="btn small" type="button" data-sp="drucken">Drucken</button></div>`;
}

export function viewSchaltplan(seite, spalte){
  setNav("schaltplan");
  const {seiten} = ladePlan();
  aktuell = Math.min(Math.max(1, +seite || 1), seiten.length);
  const s = seiten[aktuell - 1];
  app.innerHTML = `<section class="sp"><aside class="sp-seitenleiste">
      <h1>Schaltplan der Anlage</h1>
      <input type="search" id="sp-suche" placeholder="Kennzeichen, Signal oder Adresse" aria-label="Im Schaltplan suchen">
      <div id="sp-treffer" class="sp-treffer" aria-live="polite"></div>
      <nav class="sp-inhalt" aria-label="Seiten des Schaltplans">${inhaltsListe(seiten)}</nav>
    </aside><div class="sp-haupt">${leiste(aktuell, seiten.length, s.titel)}
      <div class="sp-blatt" id="sp-blatt">${s.svg}</div>
      <p class="sp-tipp muted">Pfeiltasten blättern. Ein Klick auf einen blauen Verweis wie /12.3 springt zu Seite 12, Spalte 3.
      Ein Klick auf ein Kennzeichen zeigt alle Stellen, an denen es vorkommt.</p></div></section>`;
  const liste = $(".sp-inhalt"), eintrag = $(".sp-inhalt [aria-current]");
  if (eintrag) liste.scrollTop = eintrag.offsetTop - liste.offsetTop - liste.clientHeight / 2;
  if (spalte !== undefined && spalte !== "") markiereSpalte(+spalte);
}

function markiereSpalte(spalte){
  const svg = $("#sp-blatt svg"), rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  Object.entries({x: X0 + spalte * SPALTE, y: 26, width: SPALTE, height: 744, class: "sp-markiert"}).forEach(([k, v]) => rect.setAttribute(k, v));
  svg.appendChild(rect);
}

/* ---------- Suche und Fundstellen ---------- */
const normal = t => String(t).toLowerCase().replace(/^[-–]/, "−").replace(/%/g, "");

function treffer(frage){
  const {index} = ladePlan(), q = normal(frage);
  if (q.length < 2) return [];
  const geraete = [...index.orte.keys()].filter(b => b.startsWith("−") && normal(b).includes(q)).slice(0, 12)
    .map(b => ({titel: b, ort: fundstellen(index, b)[0], art: "Kennzeichen"}));
  const signale = Object.values(SIG).flat().filter(e => normal(e.n).includes(q) || normal(e.a) === q).slice(0, 12)
    .map(e => ({titel: `${e.a}  ${e.n}`, ort: index.signale.get(e.n), art: "Signal"}));
  return [...geraete, ...signale];
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
    <p class="muted">Jede Seite wird ein Blatt quer. A3 ist das Originalformat, A4 verkleinert auf etwa 70 %.</p>
    <div class="opts"><label class="opt"><input type="radio" name="format" value="a3" checked><span><b>A3 quer</b><span>Originalgröße</span></span></label>
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
  $("#dlg").showModal();
}

function drucke(format, von, bis){
  const klasse = format === "a4" ? "land" : "sp-a3";
  doPrint(ladePlan().seiten.slice(von - 1, bis).map(s => `<section class="pp sp-druck ${klasse}">${s.svg}</section>`).join(""));
}

/* ---------- Ereignisse ---------- */
const imPlan = () => location.hash.startsWith("#/schaltplan");

function taste(e){
  if (!imPlan() || e.target.closest("input, textarea, dialog")) return;
  const sprung = {ArrowLeft: -1, PageUp: -1, ArrowRight: 1, PageDown: 1}[e.key];
  const gesamt = ladePlan().seiten.length;
  if (sprung) location.hash = ziel(Math.min(gesamt, Math.max(1, aktuell + sprung)));
  else if (e.key === "Home") location.hash = ziel(1);
  else if (e.key === "End") location.hash = ziel(gesamt);
  else return;
  e.preventDefault();
}

function klick(e){
  if (!imPlan()) return;
  const ref = e.target.closest("[data-ref]"), bmk = e.target.closest("[data-bmk]");
  if (ref) location.hash = ziel(...ref.dataset.ref.split("."));
  else if (bmk && bmk.closest("#sp-blatt")) zeigeFundstellen(bmk.dataset.bmk);
  else if (e.target.closest('[data-sp="drucken"]')) druckDialog();
}

export function init(){
  document.addEventListener("keydown", taste);
  document.addEventListener("click", klick);
  document.addEventListener("input", e => { if (e.target.id === "sp-suche") $("#sp-treffer").innerHTML = trefferHTML(treffer(e.target.value)); });
}
