/* ---------- Übungsansicht ---------- */
let timerId = null, timerEx = null, timerStart = 0;
function fmtTime(sec){ const h = Math.floor(sec/3600), m = Math.floor(sec%3600/60), s = sec%60; return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`; }
function curTime(id){ let t = S.get(id+":zeit", 0); if (timerEx === id) t += Math.floor((Date.now() - timerStart)/1000); return t; }
function toggleTimer(id){
  if (timerEx) { S.set(timerEx+":zeit", curTime(timerEx)); clearInterval(timerId); const was = timerEx; timerEx = null; if (was === id) return paintTimer(id); }
  timerEx = id; timerStart = Date.now(); timerId = setInterval(() => paintTimer(id), 1000); paintTimer(id);
}
function paintTimer(id){ const el = $("#tv"); if (!el) return; el.textContent = fmtTime(curTime(id)); const b = $("#tbtn"); if (b) { b.innerHTML = timerEx === id ? IC.pause : IC.play; b.setAttribute("aria-label", timerEx === id ? "Arbeitszeit anhalten" : "Arbeitszeit starten"); } }

function viewExercise(id, p){
  const s = BY[id]; if (!s) return viewHome();
  setNav(null);
  p = Math.min(6, Math.max(1, +p || 1));
  const st = STUFEN[s.st], i = SHEETS.indexOf(s), prev = SHEETS[i-1], next = SHEETS[i+1];
  app.innerHTML = `
  <div style="--c:${st.c}">
    <section class="exhead">
      <div class="code">${s.id}</div>
      <div><h1>${esc(s.t)}</h1><div class="sub">${esc(s.sub)}</div>
        <div class="meta"><span>Stufe <b>${s.st} ${st.n}</b></span><span>Planzeit <b>${s.ue} UE</b></span><span>Vorkenntnisse <b>${s.vor}</b></span><span>Aufgabe im Repository <b>${s.repo}</b></span></div></div>
      <div class="tools">
        <div class="timer" title="Arbeitszeit an dieser Übung"><span class="plan">Arbeitszeit</span><span class="tv" id="tv">${fmtTime(curTime(id))}</span><button class="btn ghost small" id="tbtn" type="button" data-act="timer" aria-label="Arbeitszeit starten">${timerEx===id?IC.pause:IC.play}</button></div>
        <button class="btn" type="button" data-act="print" data-id="${id}">${IC.print}Drucken</button>
      </div>
    </section>
    <div class="exgrid">
      <nav class="stepper" aria-label="Schritte der Übung"><ol>${[1,2,3,4,5,6].map(n => `<li><a href="#/${id}/${n}" class="${phaseDone(s,n)?"done":""}" data-step="${n}" ${n===p?'aria-current="step"':""}><span class="n">${phaseDone(s,n)?"✓":n}</span><span class="pt">${PHASES[n].n}</span><span class="ps">${PHASES[n].s}</span></a></li>`).join("")}</ol>
        <div class="exnav">${prev ? `<a class="btn ghost small" href="#/${prev.id}/1">${prev.id}</a>` : "<span></span>"}<a class="btn ghost small" href="#/">Übersicht</a>${next ? `<a class="btn ghost small" href="#/${next.id}/1">${next.id}</a>` : "<span></span>"}</div>
      </nav>
      <section class="work" id="work">${phaseHTML(s, p)}
        <div class="pager">${p > 1 ? `<a class="btn" href="#/${id}/${p-1}">Zurück zu ${PHASES[p-1].n}</a>` : "<span></span>"}${p < 6 ? `<a class="btn primary" href="#/${id}/${p+1}">Weiter zu ${PHASES[p+1].n}</a>` : (next ? `<a class="btn primary" href="#/${next.id}/1">Zur nächsten Übung ${next.id}</a>` : "")}</div>
      </section>
      <aside class="ctx">${ctxHTML(s)}</aside>
    </div>
  </div>`;
  restoreInputs(app);
  if (p === 2) paintSketches(s);
  window.scrollTo(0, 0);
  const cur = $(".stepper a[aria-current]"), ol = $(".stepper ol"); if (cur && ol.scrollWidth > ol.clientWidth) ol.scrollLeft = cur.offsetLeft - 16;
}
function ctxHTML(s){
  return `<div class="box"><h4>Bearbeitet von</h4><div style="display:grid;gap:8px"><input type="text" data-k="name" placeholder="Name" aria-label="Name"><input type="text" data-k="${s.id}:datum" placeholder="Datum" aria-label="Datum"></div></div>`
    + (s.bild ? `<div class="box"><figure><img src="bilder/${s.bild[0]}" alt="${esc(plain(s.bild[1]))}" data-act="zoom" data-src="bilder/${s.bild[0]}" data-cap="${esc(s.bild[1])}"><figcaption>${chips(s.bild[1])}</figcaption></figure></div>` : "")
    + `<div class="box"><h4>Lernziele: Du kannst …</h4><ol class="goals">${s.ziele.map(z => `<li>${z}</li>`).join("")}</ol></div>`
    + `<div class="box"><h4>Einstellung im Zwilling</h4><div class="small">${s.einst}</div></div>`
    + `<div class="box"><h4>Beteiligte Signale</h4><div style="display:flex;flex-wrap:wrap;gap:6px">${s.sig.split(" ").map(chip).join("")}</div></div>`;
}
const ergList = (list, von) => `<ul class="erg">${list.map(e => `<li>${artPill(e.a)}<span><b>${esc(e.n)}</b>${von && e.von ? ` <a class="muted small" href="#/${e.von}/6">aus ${e.von}</a>` : ""}${e.h ? `<br><span class="muted small">${chips(e.h)}</span>` : ""}</span></li>`).join("")}</ul>`;
function tplHTML(s){
  const k = s.id;
  return `<h3>${s.tpl.cap}</h3><div class="tw"><table class="tplt"><thead><tr>${s.tpl.head.map(x => `<th>${x}</th>`).join("")}</tr></thead><tbody>${
    s.tpl.rows.map((r, ri) => `<tr>${r.map(x => `<td>${chips(x)}</td>`).join("")}${Array.from({length: s.tpl.inputs}, (_, ci) => `<td><input type="text" data-k="${k}:t${ri}_${ci}" aria-label="${esc(s.tpl.head[r.length+ci])}, Zeile ${ri+1}"></td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
// gestufte Hilfen zu Aufgabenschritt i: Stufe n lässt sich erst nach Stufe n−1 öffnen, die höchste geöffnete Stufe wird gespeichert (k:h{i})
function hilfeInner(s, i){
  const h = (s.hilfe || {})[i]; if (!h || !h.length) return "";
  const l = hilfeLevel(s, i);
  return h.slice(0, l).map((t, n) => `<details open><summary>Hilfe ${n+1} · ${HSTUFE[n]}</summary><div class="prose">${chips(t)}</div></details>`).join("")
    + (l < Math.min(3, h.length) ? `<button class="btn ghost small" type="button" data-act="hilfe" data-i="${i}">Hilfe ${l+1} · ${HSTUFE[l]} öffnen</button>` : "");
}
const lfHTML = (k, list, pre) => list.map((q, i) => `<div class="qa"><label for="${pre}${i}">${chips(qt(q))}${zielTag(q)}<span class="state" data-state="${k}:${pre}${i}"></span></label><textarea id="${pre}${i}" data-k="${k}:${pre}${i}" rows="3"></textarea></div>`).join("");

function phaseHTML(s, p){
  const k = s.id, erk = typOf(s) === "erkunden", H = (t, intro) => `<h2><span class="pn">${p}</span>${t}</h2><p class="intro">${intro}</p>`;
  if (p === 1) {
    let h = H("Informieren", "Verschaffe dir ein Bild von der Aufgabe, stelle den Zwilling ein und suche jedes beteiligte Signal in der Anlage.");
    h += `<div class="callout"><div class="prose">${chips(s.sit)}</div></div>`;
    const mit = mitbringen(s);
    if (mit.length) h += `<div class="callout" style="--c:var(--ok)"><b>Das bringst du mit</b><span class="muted small"> (Ergebnisse aus ${vorIds(s).join(", ")})</span>${ergList(mit, true)}</div>`;
    if (s.beschr) h += `<h3>Aufgabenbeschreibung</h3><div class="prose beschr">${chips(s.beschr)}</div>`;
    if (s.tab) h += `<h3>${s.tab.cap}</h3>` + tableHTML(s.tab.head, s.tab.rows);
    if (s.wissen && s.wissen.length) h += `<h3>Fachwissen: warum, wieso, weshalb</h3><div class="fw">${s.wissen.map((w, i) => `<details${i ? "" : " open"}><summary>${w.t}</summary><div class="prose">${chips(w.h)}${quelle(w)}</div></details>`).join("")}</div>`;
    if (s.list) h += `<h3>${s.list.cap}</h3><ol class="prose">${s.list.items.map(x => `<li>${chips(x)}</li>`).join("")}</ol>`;
    h += `<h3>Zwilling einstellen</h3><label class="confirm"><input type="checkbox" data-k="${k}:einst"><span>${s.einst}<br><span class="muted small">Setze den Haken, sobald der Übungsumfang in der Seitenleiste so eingestellt ist.</span></span></label>`;
    const se = sigEntries(s);
    if (se.length) h += `<h3>Signal-Rallye</h3><p class="muted small">Suche jedes Signal im Zwilling (Signalmonitor oder 3D-Ansicht) und hake es ab. So kennst du deine Anlage, bevor du programmierst.</p>
      <div class="siglist">${se.map(e => `<label class="sigcard"><input type="checkbox" data-k="${k}:sr:${e.n}"><span><b>${e.n}</b><span class="ad">${e.a}</span><br>${esc(e.k)}</span></label>`).join("")}</div>`;
    const qz = quizSet(k, "ein");
    if (qz.length) h += `<h3>Eingangs-Check</h3><p class="muted small">Prüfe kurz, ob dein Vorwissen aus den vorigen Übungen sitzt.</p>` + qz.map((q, qi) => quizHTML(k, qi, q, "ein")).join("");
    return h;
  }
  if (p === 2) {
    let h = H("Planen", "Beantworte die Leitfragen schriftlich, plane den Ablauf und lege deine Variablen fest. Erst planen, dann programmieren.");
    h += `<h3>Leitfragen</h3>` + lfHTML(k, s.lf, "lf");
    if (s.plan && s.plan.length) h += `<h3>Planungsaufträge</h3><p class="muted small">Erstelle jede Unterlage (z. B. in den Skizzen unten) und hake sie ab.</p><ol class="tasks">${s.plan.map((a, i) => `<li><input type="checkbox" data-k="${k}:plan${i}" aria-label="Planungsauftrag ${i+1} erledigt"><span class="tx">${chips(a)}</span></li>`).join("")}</ol>`;
    if (s.tpl && s.tplPhase === 2) h += tplHTML(s);
    h += `<h3>Skizzen</h3><p class="muted small">Zeichne mit Maus, Stift oder Finger direkt in die Vorlage. Jede Skizze wird gespeichert und lässt sich einzeln drucken, leer oder mit deiner Zeichnung.</p><div class="sketches" id="sketches"></div>`;
    h += `<h3>Variablenliste</h3><p class="muted small">Übernimm die Signale dieser Übung und ergänze eigene statische Variablen, Zeiten und Zähler deines FB.</p>
      <div class="tw"><table class="vars"><thead><tr><th style="width:28%">Name</th><th style="width:13%">Datentyp</th><th style="width:15%">Adresse</th><th>Kommentar</th><th></th></tr></thead><tbody id="vars"></tbody></table></div>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn small" type="button" data-act="var-add">Zeile hinzufügen</button><button class="btn small" type="button" data-act="var-import">Signale dieser Übung übernehmen</button></div>`;
    setTimeout(() => paintVars(s), 0);
    return h;
  }
  if (p === 3) {
    if (erk) return H("Entscheiden", "Du programmierst hier noch nicht. Stelle dein Vorgehen für die Untersuchung kurz im Fachgespräch vor. Freigabe heißt hier: Vorgehen mit der Lehrkraft abgestimmt.")
      + `<div class="qa"><label for="d1">Mein Vorgehen in drei Sätzen</label><textarea id="d1" data-k="${k}:weg" rows="4"></textarea></div>
         <div class="qa"><label for="d2">Was beobachte oder messe ich, und woran erkenne ich das Ergebnis?</label><textarea id="d2" data-k="${k}:alt" rows="3"></textarea></div>
         <div class="qa"><label for="d3">Welche Fragen kläre ich mit der Lehrkraft?</label><textarea id="d3" data-k="${k}:fragen" rows="2"></textarea></div>
         <h3>Freigabe</h3><label class="confirm"><input type="checkbox" data-k="${k}:frei"><span>Vorgehen mit der Lehrkraft abgestimmt</span></label>
         <div style="max-width:260px"><label class="small muted" for="d4">Kürzel der Lehrkraft</label><input type="text" id="d4" data-k="${k}:kuerzel"></div>`;
    return H("Entscheiden", "Stelle deinen Lösungsweg im Fachgespräch kurz vor. Die Lehrkraft gibt ihn frei. Erst dann wird programmiert.")
      + `<div class="qa"><label for="d1">Mein Lösungsweg in drei Sätzen</label><textarea id="d1" data-k="${k}:weg" rows="4"></textarea></div>
         <div class="qa"><label for="d2">Welche Alternative habe ich verworfen, und warum?</label><textarea id="d2" data-k="${k}:alt" rows="3"></textarea></div>
         <div class="qa"><label for="d3">Welche Fragen kläre ich mit der Lehrkraft?</label><textarea id="d3" data-k="${k}:fragen" rows="2"></textarea></div>
         <h3>Freigabe</h3><label class="confirm"><input type="checkbox" data-k="${k}:frei"><span>Lösungsweg mit der Lehrkraft abgestimmt und freigegeben</span></label>
         <div style="max-width:260px"><label class="small muted" for="d4">Kürzel der Lehrkraft</label><input type="text" id="d4" data-k="${k}:kuerzel"></div>`;
  }
  if (p === 4) {
    let h = erk ? H("Ausführen", "Du programmierst hier noch nicht. Führe die Untersuchung am Zwilling durch, notiere deine Beobachtungen und hake jeden Arbeitsschritt ab.")
      : H("Ausführen", "Programmiere in TIA, lade in PLCSIM Advanced und nimm am Zwilling in Betrieb. Hake jeden Arbeitsschritt ab.");
    if (!erk) h += `<div class="callout" style="--c:var(--s3)"><b>Programmierrichtlinien</b> (Siemens-Styleguide): Zustände als <code>stat</code>-Variablen im FB, keine Merker · Zeiten und Zähler als Multiinstanz <code>inst…</code> · Konstanten statt Zahlen · CASE mit ELSE · Bausteinkopf. <a href="#/richtlinien">Alle Regeln</a></div>`;
    if (s.hilfe && Object.keys(s.hilfe).length) h += `<p class="muted small">Zu einzelnen Schritten gibt es gestufte Hilfen. Du darfst sie nutzen. Öffne nur so viel, wie du brauchst: Die App hält ehrlich fest, welche Stufe du geöffnet hast, und zeigt das in der Selbsteinschätzung und im Ausdruck.</p>`;
    h += `<ol class="tasks">${s.auf.map((a, i) => `<li><input type="checkbox" data-k="${k}:a${i}" aria-label="Schritt ${i+1} erledigt"><span class="tx">${chips(a)}</span>${(s.hilfe || {})[i] ? `<div class="hilfe" data-hilfe="${i}">${hilfeInner(s, i)}</div>` : ""}</li>`).join("")}</ol>`;
    if (s.tpl && s.tplPhase !== 2) h += tplHTML(s);
    h += `<h3>${erk ? "Notizen zur Untersuchung" : "Notizen zur Inbetriebnahme"}</h3><textarea data-k="${k}:ibn" rows="4" aria-label="Notizen"></textarea>`;
    return h;
  }
  if (p === 5) {
    let h = H("Kontrollieren", "Arbeite das Prüfprotokoll Fall für Fall ab. Provoziere Fehler gezielt durch Forcen im Signalmonitor und notiere, was du beobachtest. Ist ein Fall nicht bestanden, halte Ursache, Änderung und Nachtest fest.")
      + `<div class="summary" id="sum"></div><div class="checks">${s.pr.map((c, i) => { const v = S.get(k+":p"+i); return `<div class="case ${v||""}" data-case="${k}:p${i}"><div class="ct">${chips(qt(c))}${zielTag(c)}</div>
        <div class="segbtn" role="group" aria-label="Ergebnis Prüffall ${i+1}"><button type="button" data-set="${k}:p${i}" data-val="ok" aria-pressed="${v==="ok"}">bestanden</button><button type="button" data-set="${k}:p${i}" data-val="bad" aria-pressed="${v==="bad"}">nicht bestanden</button></div>
        <div class="obs"><input type="text" data-k="${k}:b${i}" placeholder="Beobachtung" aria-label="Beobachtung zu Prüffall ${i+1}"></div>
        <div class="fa"><b class="small">Fehleranalyse</b>${[["u","Ursache","Warum hat es nicht funktioniert?"],["m","Änderung","Was hast du geändert?"],["n","Nachtest","Wie hast du erneut geprüft, mit welchem Ergebnis?"]].map(([x, l, ph]) => `<label class="small">${l}<input type="text" data-k="${k}:p${i}${x}" placeholder="${ph}"></label>`).join("")}</div></div>`; }).join("")}</div>`;
    if (s.lfk && s.lfk.length) h += `<h3>Kontrollfragen</h3><p class="muted small">Diese Fragen kannst du erst nach Versuch oder Messung beantworten.</p>` + lfHTML(k, s.lfk, "lfk");
    if (!erk) h += `<h3>Stil-Check nach Siemens-Styleguide</h3><ol class="tasks">${STYLECHECK.map((c, i) => `<li><input type="checkbox" data-k="${k}:stil${i}" aria-label="erfüllt"><span class="tx">${c}</span></li>`).join("")}</ol>`;
    return h + `<h3>Ereignisliste des Zwillings</h3><textarea data-k="${k}:ereig" rows="3" aria-label="Meldungen der Ereignisliste" placeholder="Meldungen, die während der Prüfung erschienen sind"></textarea>
        <div class="qa" style="margin-top:20px"><label for="fl">Welcher Fehler hat dich am meisten gelehrt? <span class="muted small">(freiwillig)</span></label><textarea id="fl" data-k="${k}:lehre" rows="3"></textarea></div>`;
  }
  const done = !!S.get(k+":fertig"), qa = quizSet(k, "aus");
  return H("Bewerten", "Schätze ein, wie sicher du jedes Lernziel beherrschst, und halte fest, was du mitnimmst.")
    + `<h3>Selbsteinschätzung</h3><p class="muted small">1 = noch nicht, 2 = mit Hilfe, 3 = selbstständig, 4 = sicher und kann es erklären</p>`
    + s.ziele.map((z, i) => { const v = S.get(k+":z"+i); return `<div class="rate"><span>${z}</span><span class="scale" role="group" aria-label="Einschätzung">${[1,2,3,4].map(n => `<button type="button" data-set="${k}:z${i}" data-val="${n}" aria-pressed="${v==n}">${n}</button>`).join("")}</span></div>`; }).join("")
    + (s.hilfe && Object.keys(s.hilfe).length ? `<p class="small" style="margin-top:12px"><b>Genutzte Hilfen:</b> ${hilfeText(s)}</p>` : "")
    + (qa.length ? `<h3>Abschluss-Check</h3><p class="muted small">Übertrage, was du in dieser Übung gelernt hast.</p>` + qa.map((q, qi) => quizHTML(k, qi, q, "aus")).join("") : "")
    + `<div class="qa" style="margin-top:22px"><label for="r1">Was lief gut, was war schwierig?</label><textarea id="r1" data-k="${k}:refl1" rows="3"></textarea></div>
       <div class="qa"><label for="r2">Was würde ich an einer realen Anlage anders absichern?</label><textarea id="r2" data-k="${k}:refl2" rows="3"></textarea></div>`
    + (s.ergebnis && s.ergebnis.length ? `<div class="callout" style="--c:var(--ok)"><b>Das nimmst du mit</b>${ergList(s.ergebnis)}${HAS_ERG ? `<a class="small" href="#/projekt">Dein Projekt im Überblick</a>` : ""}</div>` : "")
    + (s.plus ? `<div class="plus"><b>Plus-Aufgabe</b> (für alle, die früher fertig sind)<br>${chips(s.plus)}<label class="confirm" style="margin-bottom:0"><input type="checkbox" data-k="${k}:plus"><span>Plus-Aufgabe erledigt</span></label></div>` : "")
    + `<div class="finish ${done?"done":""}" id="finish">${finishInner(s)}</div>`;
}
function finishInner(s){
  const k = s.id, done = !!S.get(k+":fertig"), open = [1,2,3,4,5].filter(p => !phaseDone(s, p)), rated = s.ziele.every((_, i) => S.get(k+":z"+i));
  if (done) return `<span><b>${k} ist abgeschlossen.</b> Der Korb im Lernpfad ist voll.</span><button class="btn small" type="button" data-act="unfinish">Wieder öffnen</button>`;
  const hint = open.length ? `Noch offen: ${open.map(p => `<a href="#/${k}/${p}">${PHASES[p].n}</a>`).join(", ")}${rated ? "" : ", Selbsteinschätzung"}.` : (rated ? "Alle Schritte erledigt." : "Noch offen: Selbsteinschätzung.");
  return `<span>${hint}</span><button class="btn primary" type="button" data-act="finish" ${open.length || !rated ? "disabled" : ""}>Übung abschließen</button>`;
}
function quizHTML(k, qi, q, w="ein"){
  const a = S.get(quizKey(k, w, qi));
  const fb = a === null ? "" : `<div class="fb">${a === q[2] ? `<b class="ok">Richtig.</b>` : `<b class="no">Nicht ganz.</b> Richtig ist: ${chips(q[1][q[2]])}.`} ${chips(q[3])} <button class="btn ghost small" type="button" data-act="quiz-reset" data-q="${qi}" data-w="${w}">Noch einmal</button></div>`;
  return `<div class="quiz" data-quiz="${qi}"><div class="qq">${chips(q[0])}</div><div class="opts">${q[1].map((o, i) => `<button type="button" class="opt ${a===null?"":(i===q[2]?"right":(i===a?"wrong":""))}" data-act="quiz" data-q="${qi}" data-w="${w}" data-i="${i}" ${a===null?"":"disabled"}>${chipsQuiet(o)}</button>`).join("")}</div>${fb}</div>`;
}

