import { $, $$, BY, S, chips, esc, hilfeLevel, listOf, quizKey, quizSet, sigEntries } from './basis.js';
import { paintVars, typeOf } from './variablen.js';
import { autoGrow, aufgabeHTML, fwListHTML, hilfeInner, quizHTML, refreshStatus, restoreInputs, toggleTimer } from './uebung.js';
import { openEditor } from '../editor/oeffnen.js';
import { bewPage, doPrint, openPrintDialog, sketchPage } from './druck.js';
import { formPage, paintGrade } from './seiten.js';
import { UMNUM_V, altDatei, migriere, route, sauberImport } from './router.js';

export const curEx = () => (location.hash.match(/^#\/(L\d\d)/) || [])[1];

// Popup zum Nachschlagen: Aufgabenbeschreibung oder Fachwissen, Thema i aufgeklappt
function openNachschlagen(s, titel, inhalt, i){
  $("#dlg").innerHTML = `<form class="dlg nsdlg" method="dialog"><h2>${titel} ${s.id}</h2><p class="muted">${esc(s.t)}</p>${inhalt}<div class="row"><button class="btn primary" value="ok">Schließen</button></div></form>`;
  $("#dlg").showModal();
  if (i >= 0) $$("#dlg details")[i]?.scrollIntoView({block: "start"});
}

export function openDataDialog(){
  $("#dlg").innerHTML = `<form class="dlg" method="dialog"><h2>Meine Daten</h2><p class="muted">Alle Eingaben, Häkchen und Skizzen bleiben nur in diesem Browser. Sichere sie als Datei, um sie abzugeben oder auf einem anderen Rechner weiterzuarbeiten.</p>
    <div class="cols2" style="gap:12px"><div><label class="small muted" for="dn">Name</label><input type="text" id="dn" data-k="name"></div><div><label class="small muted" for="dk">Klasse</label><input type="text" id="dk" data-k="klasse"></div></div>
    <div class="row" style="justify-content:flex-start"><button class="btn" type="button" id="dexp">Als Datei sichern</button><label class="btn">Datei laden<input type="file" id="dimp" accept="application/json" hidden></label><button class="btn" type="button" id="dclr">Alles löschen</button></div>
    <div class="row"><button class="btn primary" value="ok">Fertig</button></div></form>`;
  restoreInputs($("#dlg"));
  $("#dexp").onclick = () => { const blob = new Blob([JSON.stringify({handbuch:"Übungshandbuch SPS-Technik", stand:new Date().toISOString(), eingaben:S.all()}, null, 1)], {type:"application/json"});
    const l = document.createElement("a"); l.href = URL.createObjectURL(blob); l.download = `uebungshandbuch_${(S.get("name")||"eingaben").replace(/[^\wäöüÄÖÜß-]+/g,"_")}.json`; l.click(); setTimeout(() => URL.revokeObjectURL(l.href), 1000); };
  $("#dimp").onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { const d = sauberImport(altDatei(sauberImport(JSON.parse(t).eingaben || {}))); Object.entries(d).forEach(([k, v]) => S.set(k, v)); S.set("ver", Math.max(3, +S.get("ver") || 0)); S.set("_v", UMNUM_V); migriere(); $("#dlg").close(); route(); }).catch(() => alert("Diese Datei enthält keine gesicherten Eingaben des Übungshandbuchs.")); };
  $("#dclr").onclick = () => { if (confirm("Alle Eingaben, Häkchen und Skizzen in diesem Browser löschen?")) { Object.keys(S.all()).forEach(k => S.set(k, null)); S.set("ver", 3); S.set("_v", UMNUM_V); $("#dlg").close(); route(); } };
  $("#dlg").showModal();
}

// Seiteneffekte: Listener, Migrationen, Start. main.js ruft init() in der ursprünglichen Reihenfolge auf.
export function init(){
document.addEventListener("input", e => {
  const el = e.target;
  if (el.matches && el.matches("textarea.auto")) autoGrow(el);
  if (el.dataset.k) {
    let v = el.type === "checkbox" ? el.checked : el.value;
    if (el.dataset.max) { const n = Math.max(0, Math.min(+el.dataset.max, parseInt(v, 10) || 0)); v = el.value.trim() === "" ? null : n; }
    S.set(el.dataset.k, v);
    if (el.dataset.max) { const id = el.dataset.k.split(":")[0]; paintGrade(BY[id]); }
    refreshStatus();
  }
  if (el.dataset.var !== undefined) { const id = curEx(); const rows = listOf(S.get(id+":vars", [])); rows[+el.dataset.var][el.dataset.f] = el.value; S.set(id+":vars", rows); }
});
document.addEventListener("change", e => { if (e.target.dataset.max) e.target.value = S.get(e.target.dataset.k) ?? ""; });
document.addEventListener("click", e => {
  const set = e.target.closest("[data-set]");
  if (set) {
    const k = set.dataset.set, v = set.dataset.val, cur = S.get(k), nv = String(cur) === v ? null : (isNaN(+v) ? v : +v);
    S.set(k, nv); $$(`[data-set="${k}"]`).forEach(b => b.setAttribute("aria-pressed", String(nv) === b.dataset.val));
    const cs = set.closest(".case"); if (cs) { cs.classList.remove("ok", "bad"); if (nv) cs.classList.add(nv); }
    refreshStatus(); return;
  }
  const a = e.target.closest("[data-act]"); if (!a) return;
  const act = a.dataset.act, id = curEx();
  if (act === "timer") toggleTimer(id);
  if (act === "print") openPrintDialog(a.dataset.id);
  if (act === "quiz" || act === "quiz-reset") { const qi = +a.dataset.q, w = a.dataset.w || "ein"; S.set(quizKey(id, w, qi), act === "quiz" ? +a.dataset.i : null); a.closest(".quiz").outerHTML = quizHTML(id, qi, quizSet(id, w)[qi], w); }
  if (act === "hilfe") { const s = BY[id], i = +a.dataset.i; S.set(`${id}:h${i}`, Math.min(3, hilfeLevel(s, i) + 1)); const el = a.closest(".hilfe"); el.innerHTML = hilfeInner(s, i); }
  if (act === "sk-open") openEditor(a.dataset.scope, a.dataset.key);
  if (act === "sk-print") doPrint(sketchPage(a.dataset.scope, a.dataset.key, a.dataset.with === "1"));
  if (act === "var-add") { const rows = listOf(S.get(id+":vars", [])); rows.push({n:"",t:"",a:"",k:""}); S.set(id+":vars", rows); paintVars(BY[id]); const ins = $$("#vars input[data-f=n]"); ins[ins.length-1]?.focus(); }
  if (act === "var-del") { const rows = listOf(S.get(id+":vars", [])); rows.splice(+a.dataset.i, 1); S.set(id+":vars", rows.length ? rows : null); paintVars(BY[id]); }
  if (act === "var-import") { const rows = listOf(S.get(id+":vars", [])); const have = new Set(rows.map(r => r.n)); sigEntries(BY[id]).forEach(e => { if (!have.has(e.n)) rows.push({n:e.n, t:typeOf(e.a), a:e.a, k:e.k}); }); S.set(id+":vars", rows); paintVars(BY[id]); }
  if (act === "finish") { S.set(id+":fertig", true); refreshStatus(); }
  if (act === "unfinish") { S.set(id+":fertig", null); refreshStatus(); }
  if (act === "zoom") { $("#lb").innerHTML = `<form method="dialog"><img src="${a.dataset.src}" alt=""><p>${chips(a.dataset.cap)} <button class="btn small" style="float:right">Schließen</button></p></form>`; $("#lb").showModal(); }
  if (act === "form") doPrint(formPage(a.dataset.f));
  if (act === "bew-print") doPrint(bewPage(BY[a.dataset.id]));
  if (act === "data") openDataDialog();
  if (act === "ns-aufgabe") openNachschlagen(BY[id], "Aufgabe", aufgabeHTML(BY[id]), -1);
  if (act === "ns-fw") { e.preventDefault(); openNachschlagen(BY[id], "Fachwissen", fwListHTML(BY[id], +a.dataset.i), +a.dataset.i); }
});
document.addEventListener("keydown", e => {
  if (e.target.closest("input,textarea,select,dialog")) return;
  const m = location.hash.match(/^#\/(L\d\d)\/(\d)/); if (!m) return;
  const p = +m[2];
  if (e.key === "ArrowRight" && p < 6) location.hash = `#/${m[1]}/${p+1}`;
  if (e.key === "ArrowLeft" && p > 1) location.hash = `#/${m[1]}/${p-1}`;
  if ((e.key === "Enter" || e.key === " ") && e.target.matches(".th[data-act]")) { e.preventDefault(); e.target.click(); }
});
document.addEventListener("toggle", e => $$("textarea.auto", e.target).forEach(autoGrow), true);
addEventListener("resize", () => $$("textarea.auto").forEach(autoGrow));
$("#lb").addEventListener("click", e => { if (e.target === $("#lb")) $("#lb").close(); });
}
