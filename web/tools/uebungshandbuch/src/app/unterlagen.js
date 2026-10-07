/* ---------- Mappe „Meine Unterlagen“: alle Dokumente aller Übungen ---------- */
import { EXVORL, SHEETS, STUFEN } from './daten.js';
import { $, $$, IC, S, chips, esc, listOf, plain, qt } from './basis.js';
import { filled } from './fortschritt.js';
import { VORL } from '../editor/registry.js';
import { ladeSkizze } from '../editor/blaetter.js';
import { app, setNav } from './start.js';
import { sketchCards } from './skizzen-kacheln.js';
import { docGanz, prViewHTML, tplFind, tplHasData, tplTeile, tplsOf } from './uebung.js';
import { ansOr, checkPage, doPrint, pageHead, sketchPage, varsPage, whoRow } from './druck.js';

let filt = {st: 0, voll: true};

// Ein Dokument: {ex, art, titel, voll, zeige(), druck()}
export function mappeDocs(ex){
  const k = ex.id, out = [];
  // Vorlagen: eigene Dokumente und Ursprünge fortgeschriebener Dokumente mit allen Erweiterungen. Eine Erweiterung steht
  // nur dann für sich, wenn ihr Ursprung fehlt.
  tplsOf(ex).forEach(d => {
    if (d.erweitert && tplFind(d.erweitert)) return;
    const ref = `${k}:${d.id}`, teile = tplTeile(ref), weiter = teile.slice(1).map(t => t.ex.id);
    out.push({ex, art: "Vorlage", titel: d.cap, info: weiter.length ? `fortgeschrieben in ${weiter.join(", ")}` : "",
      voll: teile.some(t => tplHasData(t.ex.id, t.d)),
      zeige: () => docGanz(ref, "view", Infinity, {fremd: true}),
      druck: () => `<section class="pp">${pageHead(ex, plain(d.cap))}${whoRow(ex, true)}${docGanz(ref, "view", Infinity, {ohneLink: true, fremd: true})}</section>`});
  });
  // Prüfprotokoll aus Phase 5 als virtuelles Dokument (id "pruefprotokoll")
  if (ex.pr && ex.pr.length) out.push({ex, art: "Prüfprotokoll", titel: `Prüfprotokoll ${k}`,
    voll: ex.pr.some((_, i) => S.get(`${k}:p${i}`) || filled(`${k}:b${i}`)),
    zeige: () => prViewHTML(ex),
    druck: () => checkPage(ex, true)});
  // Antworten auf Leitfragen (Phase 2) und Kontrollfragen (Phase 5)
  const fr = [...(ex.lf || []).map((q, i) => [q, `${k}:lf${i}`, "Leitfrage"]), ...(ex.lfk || []).map((q, i) => [q, `${k}:lfk${i}`, "Kontrollfrage"])];
  if (fr.length) out.push({ex, art: "Antworten", titel: `Leitfragen ${k}`, voll: fr.some(([, key]) => filled(key)),
    zeige: () => `<ol class="mfr">${fr.map(([q, key, t]) => `<li><b>${chips(qt(q))}</b> <span class="muted small">${t}</span><div class="wert">${esc(S.get(key) || "") || '<span class="muted">noch keine Antwort</span>'}</div></li>`).join("")}</ol>`,
    druck: () => `<section class="pp">${pageHead(ex, "Leitfragen und Antworten")}${whoRow(ex, true)}${fr.map(([q, key, t], i) => `<div class="qp"><p><b>${i+1}. ${chips(qt(q))}</b> (${t})</p>${ansOr(S.get(key), 3)}</div>`).join("")}</section>`});
  // Variablenliste
  const vars = listOf(S.get(k + ":vars", []));
  if (vars.length) out.push({ex, art: "Variablenliste", titel: `Variablenliste ${k}`, voll: true,
    zeige: () => `<div class="tw"><table class="tplt ro"><thead><tr><th>Name</th><th>Datentyp</th><th>Adresse</th><th>Kommentar</th></tr></thead><tbody>${vars.map(r => `<tr>${["n","t","a","k"].map(f => `<td>${esc(r[f])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`,
    druck: () => varsPage(ex, true)});
  // Skizzen mit Inhalt, als Vorschau
  (EXVORL[k] || ["raster"]).filter(key => VORL[key] && ladeSkizze(k, key)).forEach(key => out.push({ex, art: "Skizze", titel: VORL[key].n, voll: true, skizze: key,
    zeige: () => `<div class="sketches">${sketchCards(k, [key], ex)}</div>`,
    druck: () => sketchPage(k, key, true)}));
  return out;
}

export function viewUnterlagen(){
  setNav("unterlagen");
  const alle = SHEETS.filter(s => !filt.st || s.st === filt.st).flatMap(mappeDocs), docs = alle.filter(d => !filt.voll || d.voll);
  const gruppen = SHEETS.map(ex => [ex, docs.filter(d => d.ex === ex)]).filter(([, l]) => l.length);
  app.innerHTML = `<div class="page"><h1>Meine Unterlagen</h1><p class="lead">Deine Mappe: alle Dokumente aus allen Übungen an einer Stelle. Fortgeschriebene Dokumente stehen als ein Dokument bei der Übung, in der sie entstehen. Bearbeiten kannst du sie in der jeweiligen Übung.</p>
    <div class="filters"><div class="segbtn" role="group" aria-label="Stufe">${[0,1,2,3,4].map(n => `<button type="button" data-mst="${n}" aria-pressed="${filt.st === n}">${n ? `Stufe ${n}` : "alle Stufen"}</button>`).join("")}</div>
      <label class="small" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="mvoll" ${filt.voll ? "checked" : ""}> nur Dokumente mit Eingaben</label><span class="grow" style="flex:1"></span>
      <button class="btn" type="button" id="mall" ${docs.length ? "" : "disabled"}>${IC.print}Mappe drucken (${docs.length})</button></div>
    ${gruppen.length ? gruppen.map(([ex, l]) => `<section class="panel mappe" style="--c:${STUFEN[ex.st].c}"><h2><a href="#/${ex.id}/1">${ex.id}</a> ${esc(ex.t)}</h2>
      ${l.map(d => `<details class="mdoc"><summary><span class="mart">${d.art}</span><b>${d.titel}</b>${d.info ? ` <span class="muted small">${d.info}</span>` : ""}${d.voll ? "" : ` <span class="muted small">noch leer</span>`}<button class="btn ghost small" type="button" data-mp="${docs.indexOf(d)}" title="Dieses Dokument drucken">${IC.print}Drucken</button></summary><div class="mbody" data-mz="${docs.indexOf(d)}"></div></details>`).join("")}</section>`).join("")
      : `<section class="panel"><p class="muted" style="margin:0">${filt.voll ? "Noch keine Dokumente mit Eingaben. Sobald du in einer Übung etwas einträgst, erscheint es hier. Nimm den Haken bei „nur Dokumente mit Eingaben“ heraus, um alle Vorlagen zu sehen." : "Keine Dokumente in dieser Auswahl."}</p></section>`}</div>`;
  // Inhalt erst beim Aufklappen erzeugen (Skizzen sind groß)
  $$("details.mdoc").forEach(el => el.addEventListener("toggle", () => { const b = $(".mbody", el); if (el.open && !b.innerHTML) b.innerHTML = docs[+b.dataset.mz].zeige(); }));
  $$("[data-mp]").forEach(b => b.onclick = e => { e.preventDefault(); e.stopPropagation(); doPrint(docs[+b.dataset.mp].druck()); });
  $$("[data-mst]").forEach(b => b.onclick = () => { filt.st = +b.dataset.mst; viewUnterlagen(); });
  $("#mvoll").onchange = e => { filt.voll = e.target.checked; viewUnterlagen(); };
  $("#mall").onclick = () => doPrint(docs.map(d => d.druck()).join(""));
}
