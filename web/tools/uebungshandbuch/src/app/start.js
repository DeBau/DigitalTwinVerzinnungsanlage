/* ================= Ansichten ================= */
const app = $("#app");
function setNav(r){ $$("#nav a").forEach(a => a.toggleAttribute("aria-current", false)); const m = {"":"#/", vorlagen:"#/vorlagen", signale:"#/signale", anlage:"#/anlage", richtlinien:"#/richtlinien", konzept:"#/konzept", bewertung:"#/bewertung"}[r];
  const a = m && $(`#nav a[href="${m}"]`); if (a) a.setAttribute("aria-current", "page"); }

function viewHome(){
  setNav("");
  const nx = nextSheet(), done = SHEETS.filter(s => doneCount(s) === 6).length;
  const phases = SHEETS.reduce((a, s) => a + doneCount(s), 0);
  app.innerHTML = `
  <section class="home-hero">
    <div class="txt">
      <h1>Übungshandbuch<br>SPS-Technik</h1>
      <p>${SHEETS.length} Übungen am digitalen Zwilling der Verzinnungsanlage. Jede führt Sie in sechs Schritten vom Verstehen der Aufgabe bis zur abgenommenen Lösung.</p>
      <div class="continue">
        ${nx ? `<a class="btn primary" href="#/${nx.id}/${firstOpenPhase(nx)}">${doneCount(nx) ? "Weiter mit" : "Starten mit"} ${nx.id} ${esc(nx.t)}</a>` : `<span class="btn primary">Alle Übungen abgeschlossen</span>`}
        <span class="meter"><b>${done}</b>von ${SHEETS.length} Übungen abgeschlossen, ${phases} von ${SHEETS.length * 6} Schritten</span>
      </div>
    </div>
    <div class="img"><img src="bilder/01-gesamtanlage.jpg" alt="Gesamtansicht des digitalen Zwillings"></div>
  </section>
  <section class="panel">
    <h2>Lernpfad</h2>
    <p class="lead">Jeder Korb ist eine Übung. Er füllt sich mit jedem abgeschlossenen Schritt; der gestrichelte ist Ihre nächste.</p>
    <div class="belt" style="--cols:${[1,2,3,4].map(n => SHEETS.filter(x => x.st === n).length + "fr").join(" ")}">${[1,2,3,4].map(n => { const st = STUFEN[n]; return `<div class="seg" style="--c:${st.c}"><div class="lbl">${n} ${st.n}</div><div class="sub">${st.ue} UE</div>
      <div class="baskets">${SHEETS.filter(s => s.st === n).map(s => { const d = doneCount(s); return `<a class="basket${d===6?" full":""}${nx===s?" next":""}" style="--p:${Math.round(d/6*100)}%" href="#/${s.id}/${firstOpenPhase(s)}" title="${s.id} ${esc(s.t)}, ${d} von 6 Schritten"><span>${s.id.slice(1)}</span></a>`; }).join("")}</div><div class="track"></div></div>`; }).join("")}</div>
  </section>
  <div class="stages">${[1,2,3,4].map(n => { const st = STUFEN[n]; return `<section class="stage" style="--c:${st.c}"><header><h3>Stufe ${n} – ${st.n}</h3><p>${st.sub} ${st.ue} UE.</p></header>
    ${SHEETS.filter(s => s.st === n).map(s => { const d = doneCount(s); return `<a class="exrow" href="#/${s.id}/${firstOpenPhase(s)}"><span class="code">${s.id}</span><span><span class="t">${esc(s.t)}</span><br><span class="s">${esc(s.sub)}</span></span>
      <span class="segs"><span class="ue">${s.ue} UE</span>${[1,2,3,4,5,6].map(p => `<i class="${phaseDone(s,p)?"on":""}" title="${PHASES[p].n}"></i>`).join("")}</span></a>`; }).join("")}</section>`; }).join("")}</div>
  <div class="quick">
    <a href="#/vorlagen"><b>Vorlagen</b><span>GRAFCET, Weg-Schritt, Stromlauf, Regelkreis – zeichnen oder leer drucken</span></a>
    <a href="#/signale"><b>Signale</b><span>Alle Kennzeichen mit Adresse, Bedeutung und den Übungen, die sie nutzen</span></a>
    <a href="#/anlage"><b>Anlage</b><span>Prozess, Antriebe, Befehlsstellen und Sicherheitskonzept</span></a>
    <a href="#/bewertung"><b>Bewertung</b><span>Bewertungsbogen mit Punkten und IHK-Note</span></a>
  </div>`;
}
function firstOpenPhase(s){ for (let p = 1; p <= 6; p++) if (!phaseDone(s, p)) return p; return 6; }

