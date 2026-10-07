/* ================= Drucken ================= */
import { EXVORL, STUFEN, TYPN, critMax, critOf, gradeOf } from './daten.js';
import { $, $$, ART, BY, IC, S, bewPunkte, bewSumme, chips, esc, hilfeLevel, hilfeText, listOf, mitbringen, qt, quelle, sigEntries, stilFor, stilKey, tableHTML, typOf, zielTag } from './basis.js';
import { VORL } from '../editor/registry.js';
import { pageCount } from '../editor/zeichnen.js';
import { ladeSkizze, skMeta, sketchSVG } from '../editor/blaetter.js';
import { curTime, docTable, fmtTime, tplsOf } from './uebung.js';

export function pageHead(ex, what){
  const st = ex ? STUFEN[ex.st] : null;
  return `<div class="ph"><div class="c">${ex ? ex.id : "SPS"}</div><div><div class="t">${ex ? esc(ex.t) : what}</div><div class="u">${ex ? `${what}, Stufe ${ex.st} ${st.n}, ${ex.ue} UE` : "Übungshandbuch SPS-Technik"}</div></div><div class="r">Übungshandbuch<br>SPS-Technik</div></div>`;
}
export const whoRow = (ex, filled) => `<div class="who"><div>Name<b>${filled ? esc(S.get("name")||"") : ""}</b></div><div>Klasse<b>${filled ? esc(S.get("klasse")||"") : ""}</b></div><div>Datum<b>${filled && ex ? esc(S.get(ex.id+":datum")||"") : ""}</b></div></div>`;
export const lines = n => `<div class="lines">${"<i></i>".repeat(n)}</div>`;
export const ansOr = (v, n) => v && String(v).trim() ? `<div class="ans">${esc(v)}</div>` : lines(n);
// Vorlagen einer Phase zum Drucken, mit Zeilen früherer Übungen bei fortgeschriebenen Dokumenten
export const tplPrint = (ex, f, phase) => tplsOf(ex).filter(d => (d.phase || 4) === phase).map(d => `<h3>${d.cap}</h3>` + docTable(ex, d, f ? "view" : "blank", {ohneLink: true})).join("");
export const ergPrint = list => `<ul>${list.map(e => `<li><b>${esc(e.n)}</b> (${ART[e.a] ? ART[e.a][1] : esc(e.a)}${e.von ? `, aus ${e.von}` : ""})${e.h ? `: ${chips(e.h)}` : ""}</li>`).join("")}</ul>`;
export function sheetPage(ex, f){
  const k = ex.id, sig = sigEntries(ex), mit = mitbringen(ex);
  let h = `<section class="pp">${pageHead(ex, "Arbeitsblatt")}${whoRow(ex, f)}
    <h2>Ausgangssituation</h2><p>${chips(ex.sit)}</p><p><b>Einstellung im Zwilling:</b> ${ex.einst}</p>${ex.beschr ? `<h2>Aufgabenbeschreibung</h2>${chips(ex.beschr)}` : ""}
    <h2>Lernziele: Du kannst …</h2><ol>${ex.ziele.map(z => `<li>${z}</li>`).join("")}</ol>`;
  if (mit.length) h += `<h3>Das bringst du mit</h3>` + ergPrint(mit);
  if (ex.tab) h += `<h3>${ex.tab.cap}</h3>` + tableHTML(ex.tab.head, ex.tab.rows);
  if (ex.list) h += `<h3>${ex.list.cap}</h3><ol>${ex.list.items.map(x => `<li>${chips(x)}</li>`).join("")}</ol>`;
  if (sig.length) h += `<h2>Signale</h2><table><thead><tr><th>Signal</th><th>Adresse</th><th>Bedeutung</th></tr></thead><tbody>${sig.map(e => `<tr><td>${e.n}</td><td>${e.a}</td><td>${esc(e.k)}</td></tr>`).join("")}</tbody></table>`;
  h += `<h2>Leitfragen</h2>` + ex.lf.map((q, i) => `<div class="qp"><p><b>${i+1}. ${chips(qt(q))}</b>${zielTag(q)}</p>${f ? ansOr(S.get(k+":lf"+i), 4) : lines(4)}</div>`).join("");
  if (ex.plan && ex.plan.length) h += `<h2>Planungsaufträge</h2><div>${ex.plan.map((a, i) => `<p><span class="box">${f && S.get(k+":plan"+i) ? "✓" : ""}</span>${i+1}. ${chips(a)}</p>`).join("")}</div>`;
  h += tplPrint(ex, f, 2);
  h += `<h2>Auftrag</h2><div>${ex.auf.map((a, i) => { const l = f ? hilfeLevel(ex, i) : 0; return `<p><span class="box">${f && S.get(k+":a"+i) ? "✓" : ""}</span>${i+1}. ${chips(a)}${l ? ` <i>(mit Hilfe ${l} gelöst)</i>` : ""}</p>`; }).join("")}</div>`;
  h += tplPrint(ex, f, 4);
  if (ex.plus) h += `<h3>Plus-Aufgabe</h3><p>${chips(ex.plus)}</p>`;
  return h + `<div class="foot">${ex.id} ${esc(ex.t)}, Übungshandbuch SPS-Technik, Aufgabe im Repository: ${ex.repo}</div></section>`;
}
export function checkPage(ex, f){
  const k = ex.id;
  const bad = ex.pr.map((_, i) => i).filter(i => f && S.get(k+":p"+i) === "bad");
  const fa = f ? (bad.length ? `<table><thead><tr><th style="width:6%">Nr.</th><th>Ursache</th><th>Änderung</th><th>Nachtest</th></tr></thead><tbody>${bad.map(i => `<tr><td>${i+1}</td>${["u","m","n"].map(x => `<td>${esc(S.get(`${k}:p${i}${x}`)||"")}</td>`).join("")}</tr>`).join("")}</tbody></table>` : `<p>Keine nicht bestandenen Prüffälle.</p>`)
    : `<table><thead><tr><th style="width:6%">Nr.</th><th>Ursache</th><th>Änderung</th><th>Nachtest</th></tr></thead><tbody>${"<tr><td style='height:10mm'></td><td></td><td></td><td></td></tr>".repeat(3)}</tbody></table>`;
  return `<section class="pp">${pageHead(ex, "Prüfprotokoll")}${whoRow(ex, f)}
    <p>Prüfe jeden Fall am Zwilling. Provoziere Fehler durch Forcen im Signalmonitor. Trage deine Beobachtung ein und kreuze das Ergebnis an.</p>
    <table><thead><tr><th style="width:5%">Nr.</th><th style="width:45%">Prüffall</th><th>Beobachtet</th><th style="width:8%">i.O.</th><th style="width:8%">n.i.O.</th></tr></thead><tbody>${
      ex.pr.map((c, i) => { const v = f ? S.get(k+":p"+i) : null; return `<tr><td>${i+1}</td><td>${chips(qt(c))}${zielTag(c)}</td><td style="height:14mm">${f ? esc(S.get(k+":b"+i)||"") : ""}</td><td><span class="box">${v==="ok"?"✓":""}</span></td><td><span class="box">${v==="bad"?"✗":""}</span></td></tr>`; }).join("")}</tbody></table>
    <h2>Fehleranalyse (nicht bestandene Prüffälle)</h2>${fa}
    ${ex.lfk && ex.lfk.length ? `<h2>Kontrollfragen</h2>` + ex.lfk.map((q, i) => `<div class="qp"><p><b>${i+1}. ${chips(qt(q))}</b></p>${f ? ansOr(S.get(k+":lfk"+i), 3) : lines(3)}</div>`).join("") : ""}
    ${tplPrint(ex, f, 5)}
    ${stilPrint(ex, f)}
    <h2>Meldungen der Ereignisliste</h2>${f ? ansOr(S.get(k+":ereig"), 3) : lines(3)}
    <h2>Welcher Fehler hat dich am meisten gelehrt?</h2>${f ? ansOr(S.get(k+":lehre"), 2) : lines(2)}
    <div class="sign"><div>Geprüft (Lernende)</div><div>Abgenommen (Lehrkraft), Datum</div></div></section>`;
}
export function stilPrint(ex, f){
  const st = stilFor(ex); if (!st.length) return "";
  return `<h2>Programmierstil nach Siemens-Styleguide</h2><table><tbody>${st.map(x => `<tr><td style="width:6%"><span class="box">${f && S.get(stilKey(ex.id, x.i)) ? "✓" : ""}</span></td><td>${x.neu ? "<b>(neu)</b> " : ""}${x.r.t}</td></tr>`).join("")}</tbody></table>`;
}
export function varsPage(ex, f){
  const rows = f ? listOf(S.get(ex.id+":vars", [])) : [];
  const blank = Math.max(0, (f ? 6 : 22) - rows.length);
  return `<section class="pp">${pageHead(ex, "Variablenliste")}${whoRow(ex, f)}
    <table><thead><tr><th style="width:28%">Name</th><th style="width:12%">Datentyp</th><th style="width:14%">Adresse</th><th>Kommentar</th></tr></thead><tbody>${
      rows.map(r => `<tr><td>${esc(r.n)}</td><td>${esc(r.t)}</td><td>${esc(r.a)}</td><td>${esc(r.k)}</td></tr>`).join("")}${"<tr><td style='height:8mm'></td><td></td><td></td><td></td></tr>".repeat(blank)}</tbody></table></section>`;
}
export function ratePage(ex, f){
  const k = ex.id, hasH = ex.hilfe && Object.keys(ex.hilfe).length;
  return `<section class="pp">${pageHead(ex, "Selbsteinschätzung und Reflexion")}${whoRow(ex, f)}
    <p>1 = noch nicht, 2 = mit Hilfe, 3 = selbstständig, 4 = sicher und kann es erklären</p>
    <table><thead><tr><th>Lernziel: Ich kann …</th><th>1</th><th>2</th><th>3</th><th>4</th></tr></thead><tbody>${ex.ziele.map((z, i) => { const v = f ? S.get(k+":z"+i) : null; return `<tr><td>${z}</td>${[1,2,3,4].map(n => `<td><span class="box">${v==n?"✓":""}</span></td>`).join("")}</tr>`; }).join("")}</tbody></table>
    ${hasH ? `<p style="margin-top:3mm"><b>Genutzte Hilfen:</b> ${f ? hilfeText(ex) : "________________________________"}</p>` : ""}
    <h2>Mein Lösungsweg</h2>${f ? ansOr(S.get(k+":weg"), 4) : lines(4)}
    <h2>Was lief gut, was war schwierig?</h2>${f ? ansOr(S.get(k+":refl1"), 4) : lines(4)}
    <h2>Was würde ich an einer realen Anlage anders absichern?</h2>${f ? ansOr(S.get(k+":refl2"), 4) : lines(4)}
    ${ex.ergebnis && ex.ergebnis.length ? `<h2>Das nimmst du mit</h2>` + ergPrint(ex.ergebnis) : ""}
    <div class="sign"><div>Freigabe Fachgespräch (Kürzel)${f && S.get(k+":kuerzel") ? ": " + esc(S.get(k+":kuerzel")) : ""}</div><div>Arbeitszeit${f ? ": " + fmtTime(curTime(k)) : ""}</div></div></section>`;
}
export function sketchPage(scope, key, f){
  const ex = BY[scope], d = f ? ladeSkizze(scope, key) : null, meta = f ? skMeta(scope, key) : {title: ex ? `${ex.id} ${ex.t}` : VORL[key].n, vorlage: VORL[key].n};
  return Array.from({length: pageCount(key, d)}, (_, i) => `<section class="pp land">${sketchSVG(key, ex, d, meta, false, i)}</section>`).join("");
}
export const nivTable = crit => `<h2>Niveaustufen</h2><p>Passend zur Selbsteinschätzung: 1 = noch nicht, 2 = mit Hilfe, 3 = selbstständig, 4 = sicher und kann es erklären. Richtwert für die Punkte: Stufe 1 bis 25 %, Stufe 2 bis 50 %, Stufe 3 bis 75 %, Stufe 4 bis 100 % des Höchstwerts.</p>
  <table><thead><tr><th style="width:16%">Kriterium</th><th>1</th><th>2</th><th>3</th><th>4</th></tr></thead><tbody>${crit.map(c => `<tr><td><b>${c[0]}</b></td>${(c[3] || []).map(n => `<td>${n}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
export const bewTable = (crit, pts) => `<table><thead><tr><th>Kriterium</th><th>Erfüllt, wenn</th><th>max.</th><th>Punkte</th></tr></thead><tbody>${crit.map((c, i) => `<tr><td>${c[0]}</td><td>${c[2]}</td><td>${c[1]}</td><td>${pts ? esc(pts[i] ?? "") : ""}</td></tr>`).join("")}
    <tr><td colspan="2"><b>Summe</b></td><td>${critMax(crit)}</td><td><b>${pts && pts.some(v => v !== null) ? pts.reduce((a, v) => a + (+v || 0), 0) : ""}</b></td></tr></tbody></table>`;
export function bewPage(ex){
  const k = ex.id, crit = critOf(ex), sum = bewSumme(ex);
  return `<section class="pp">${pageHead(ex, "Bewertungsbogen")}${whoRow(ex, true)}
    <p>Bewertungsraster: <b>${TYPN[typOf(ex)]}</b></p>${bewTable(crit, bewPunkte(ex))}
    <p style="margin-top:4mm"><b>Note nach IHK-Schlüssel:</b> ${sum !== null ? gradeOf(sum) : ""}</p>
    ${ex.hilfe && Object.keys(ex.hilfe).length ? `<p><b>Genutzte Hilfen:</b> ${hilfeText(ex)}</p>` : ""}
    <h2>Bemerkungen</h2>${ansOr(S.get(k+":bewnote"), 4)}<div class="sign"><div>Lehrkraft</div><div>Datum</div></div>${nivTable(crit)}</section>`;
}
export function doPrint(html){
  $("#print").innerHTML = html;
  const fin = () => { $("#print").innerHTML = ""; removeEventListener("afterprint", fin); };
  addEventListener("afterprint", fin);
  setTimeout(() => window.print(), 50);
}
export function openPrintDialog(id){
  const ex = BY[id], sk = EXVORL[id] || [];
  const opt = (v, t, d, on) => `<label class="opt"><input type="checkbox" name="pp" value="${v}" ${on?"checked":""}><span><b>${t}</b><span>${d}</span></span></label>`;
  $("#dlg").innerHTML = `<form class="dlg" method="dialog"><h2>${ex.id} drucken</h2><p class="muted">Wähle die Seiten. Jede Seite ist ein eigenes Blatt A4; Skizzen kommen quer.</p>
    <div class="opts">${opt("sheet","Arbeitsblatt","Situation, Signale, Leitfragen mit Schreiblinien, Planungsaufträge, Auftrag",true)}${ex.wissen ? opt("wissen","Fachwissen","Hintergründe und Begründungen zur Übung, mit Quellen",false) : ""}${opt("check","Prüfprotokoll","Prüffälle zum Ankreuzen, Fehleranalyse, Unterschriftsfelder",true)}
    ${opt("vars","Variablenliste","Name, Datentyp, Adresse, Kommentar",false)}${opt("rate","Selbsteinschätzung und Reflexion","Lernziele 1 bis 4, genutzte Hilfen, Lösungsweg, Reflexion",false)}
    ${sk.map(key => opt("sk:"+key, "Skizze: "+VORL[key].n, VORL[key].d+", mit Schriftfeld", false)).join("")}
    ${opt("bew","Bewertungsbogen","für die Lehrkraft",false)}</div>
    <label class="switch"><input type="checkbox" id="pfill"> Meine Eingaben eintragen (sonst werden leere Vorlagen gedruckt)</label>
    <div class="row"><button class="btn" value="cancel">Abbrechen</button><button class="btn primary" type="button" id="pgo">${IC.print}Drucken</button></div></form>`;
  $("#pgo").onclick = () => {
    const f = $("#pfill").checked, sel = $$('#dlg input[name=pp]:checked').map(x => x.value);
    const html = sel.map(v => v === "sheet" ? sheetPage(ex, f) : v === "check" ? checkPage(ex, f) : v === "wissen" ? `<section class="pp">${pageHead(ex, "Fachwissen")}${ex.wissen.map(w => `<h2>${w.t}</h2>${chips(w.h)}${quelle(w)}`).join("")}</section>` : v === "vars" ? varsPage(ex, f) : v === "rate" ? ratePage(ex, f) : v === "bew" ? bewPage(ex) : sketchPage(id, v.slice(3), f)).join("");
    $("#dlg").close(); if (html) doPrint(html);
  };
  $("#dlg").showModal();
}

