/* ================= Weitere Seiten ================= */
function viewVorlagen(){
  setNav("vorlagen");
  app.innerHTML = `<div class="page"><h1>Vorlagen</h1><p class="lead">Alle Skizzenvorlagen mit Schriftfeld. Zeichnen Sie direkt darin oder drucken Sie sie leer für die Arbeit auf Papier. Was Sie hier zeichnen, gehört zu keiner Übung.</p>
    <div class="tplgrid">${sketchCards("frei", Object.keys(VORL), null)}</div>
    <section class="panel"><h2>Formulare für alle Übungen</h2><p class="lead">Leere Formulare als einzelne Seite drucken.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" data-act="form" data-f="vars">${IC.print}Variablenliste</button><button class="btn" data-act="form" data-f="fehler">${IC.print}Fehlerprotokoll</button><button class="btn" data-act="form" data-f="fahr">${IC.print}Fahrzeitentabelle</button><button class="btn" data-act="form" data-f="bew">${IC.print}Bewertungsbogen</button></div></section></div>`;
}
function formPage(f){
  const head = what => `<section class="pp">${pageHead(null, what)}${whoRow(null, false)}`;
  const tbl = (h, n, rows) => `<table><thead><tr>${h.map(x => `<th>${x}</th>`).join("")}</tr></thead><tbody>${(rows || Array.from({length:n}, () => [])).map(r => `<tr>${h.map((_, i) => `<td style="height:9mm">${r[i] ? chips(r[i]) : ""}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  if (f === "vars") return head("Variablenliste") + tbl(["Name","Datentyp","Adresse","Kommentar"], 24) + "</section>";
  if (f === "fehler") return head("Fehlerprotokoll") + tbl(["Nr.","Symptom","Vermutung","Prüfschritt","Ursache","Behebung","min"], 12) + "</section>";
  if (f === "fahr") return head("Fahrzeiten und Überwachungszeiten") + tbl(["Zylinder","Richtung","Fahrzeit (s)","Faktor","Überwachungszeit (s)","Begründung"], 0, [["−MM1","einhängen"],["−MM1","lösen"],["−MM2","senken"],["−MM2","anheben"],["−MM3","zum Bad"],["−MM3","zum Band"],["−MM4","abdecken"],["−MM4","öffnen"],["−MM5","öffnen"],["−MM5","schließen"],["−MM6","öffnen"],["−MM6","schließen"],["−MM8","kippen"],["−MM8","zurück"]]) + "</section>";
  return head("Bewertungsbogen") + `<p>Lernsituation: ____________________</p><table><thead><tr><th>Kriterium</th><th>Erfüllt, wenn</th><th>max.</th><th>Punkte</th></tr></thead><tbody>${CRIT.map(c => `<tr><td>${c[0]}</td><td>${c[2]}</td><td>${c[1]}</td><td></td></tr>`).join("")}<tr><td colspan="2"><b>Summe</b></td><td>100</td><td></td></tr></tbody></table><p style="margin-top:4mm">Note: ________</p><div class="sign"><div>Lehrkraft</div><div>Datum</div></div></section>`;
}

function viewSignale(){
  setNav("signale");
  const all = Object.entries(SIG).flatMap(([t, l]) => l.map(e => ({tag:t, ...e})));
  app.innerHTML = `<div class="page"><h1>Signale</h1><p class="lead">${all.length} Signale aus <code>signale.csv</code> mit Adresse, Bedeutung und den Übungen, in denen sie vorkommen.</p>
    <div class="filters"><input type="text" id="sq" placeholder="Name, Adresse oder Bedeutung suchen" aria-label="Signale durchsuchen">
      <div class="segbtn" role="group" aria-label="Signaltyp">${[["","alle"],["DI","Eingänge"],["DQ","Ausgänge"],["AI","Analog ein"],["AQ","Analog aus"]].map(([v, n], i) => `<button type="button" data-styp="${v}" aria-pressed="${i===0}">${n}</button>`).join("")}</div></div>
    <div class="panel" style="padding:8px 14px"><div class="tw"><table><thead><tr><th>Signal</th><th>Adresse</th><th>Bedeutung</th><th>Übungen</th></tr></thead><tbody id="sbody">${all.map(e => `<tr data-typ="${typ(e.a)}" data-s="${esc((e.n+" "+e.a+" "+e.k).toLowerCase())}"><td><code>${e.n}</code></td><td><code>${e.a}</code></td><td>${esc(e.k)}</td><td class="uses">${(USES[e.tag]||[]).map(x => `<a href="#/${x}/1">${x}</a>`).join("")}</td></tr>`).join("")}</tbody></table></div></div></div>`;
  let typF = "";
  const f = () => { const q = $("#sq").value.trim().toLowerCase(); $$("#sbody tr").forEach(r => r.hidden = !((!typF || r.dataset.typ === typF) && (!q || r.dataset.s.includes(q)))); };
  $("#sq").oninput = f;
  $$("[data-styp]").forEach(b => b.onclick = () => { typF = b.dataset.styp; $$("[data-styp]").forEach(x => x.setAttribute("aria-pressed", x === b)); f(); });
}
const typ = a => /^%[IE]W/.test(a) ? "AI" : /^%[QA]W/.test(a) ? "AQ" : /^%[IE]/.test(a) ? "DI" : "DQ";

const IMGS = [["01-gesamtanlage.jpg","Gesamtanlage"],["02-bedienpult.jpg","Bedienpult"],["03-schaltschrank.jpg","Schaltschrank −A1"],["04-zinnbad.jpg","Portal und Zinnbad"],["05-rollenkurve.jpg","Rollenkurve −MA6"],["06-pruefstation.jpg","Entleer- und Prüfstation"],["07-spruehkuehlung.jpg","Sprühkühlung"],["08-signalmonitor.jpg","Signalmonitor"],["09-weg-zeit-diagramm.jpg","Weg-Zeit-Diagramm"],["10-drosselventile.jpg","Drosselrückschlagventile"],["11-umrichter.jpg","Fenster Umrichter"],["12-umrichter-schrank.jpg","Umrichter im Schaltschrank"],["13-vorort-pruefband.jpg","Vor-Ort-Steuerstelle −S50"],["14-kuehlwassertank.jpg","Kühlwassertank"]];
function viewAnlage(){
  setNav("anlage");
  app.innerHTML = `<div class="page"><h1>Die Anlage</h1><p class="lead">Die Anlage verzinnt Kupfer-Rohrkabelschuhe: 36 Teile je Korb werden in flüssiges Zinn getaucht, abgeschreckt, abgeblasen, ausgekippt und einzeln per Kamera geprüft. Alle Kennzeichen folgen EN 81346 und heißen in <code>signale.csv</code>, im TIA-Projekt und im Zwilling gleich.</p>
  <section class="panel"><h2>Prozesskette</h2><ol class="prose" style="margin-top:12px">${[
    "<b>Zufuhr Band 1</b> −MA1: Körbe stauen am Vereinzeler −MM6 und laufen einzeln an den Anschlag −MM5.",
    "<b>Portal</b> −MM1 bis −MM4: einhängen, anheben, zum Bad, öffnen, tauchen, abtropfen, abdecken, zurück, absetzen, lösen.",
    "<b>Abtransport</b>: Band 1, Rollenkurve −MA6, Band 2 −MA2.","<b>Abschrecken</b>: Pumpe −QA7, Sprühventil −MB13, Pyrometer −BT2, Luftmesser −MB14.",
    "<b>Entleeren</b>: Kippmulde mit −MA7, Korbkipper −MM8.","<b>Prüfen</b>: Vibrorinne −MA4, Prüfband −MA5, Kamera −KF10, Ausblasdüse −MB16.",
    "<b>Versorgung</b>: Heizung −TB1, Nachfüllen −MB11, Kühlwasser −MB17 und −MB18."].map(x => `<li>${chips(x)}</li>`).join("")}</ol></section>
  <section class="panel"><h2>Pneumatische Antriebe</h2><p class="lead">Bistabile Ventile halten ihre Stellung ohne Signal, monostabile fallen zurück – deshalb brauchen die Handtaster für −MM5, −MM6 und −MM8 eine Selbsthaltung.</p>${tableHTML(["Zylinder","Funktion","Stellung 0","Stellung 1","Grundstellung","Ventil"],[
    ["−MM1","Korb einhängen / lösen","eingehängt (−BG1)","gelöst (−BG2)","1","5/2 bistabil −MB1 / −MB2"],["−MM2","Tauchen","oben (−BG3)","unten (−BG4)","1","5/2 bistabil −MB3 / −MB4"],
    ["−MM3","Verschieben","über Band (−BG5)","über Bad (−BG6)","0","5/2 bistabil −MB5 / −MB6"],["−MM4","Bad abdecken","offen (−BG7)","abgedeckt (−BG8)","1","5/2 bistabil −MB7 / −MB8"],
    ["−MM5","Anschlag","offen (−BG15)","zu (−BG14)","je nach Korblage","5/2 monostabil −MB9"],["−MM6","Vereinzeler","offen (−BG17)","zu (−BG16)","je nach Korblage","5/2 monostabil −MB10"],
    ["−MM8","Korbkipper","unten (−BG30)","gekippt (−BG31)","0","5/2 monostabil −MB15"]])}</section>
  <section class="panel"><h2>Befehlsstellen</h2>${tableHTML(["Ort","Geräte"],[
    ["Bedienpult","Not-Halt −SF0, START −SF1, STOP −SF2 (Öffner), Quittieren −SF4 mit −PF5, Wahlschalter −SA1, Meldeleuchten −PF1 bis −PF4"],
    ["Schaltschranktür","Wahlschalter −SA3 AUTO/HAND, Leuchte −PF7, Tipptaster −SF11 bis −SF22, −SF28, −SF29, HMI TP1200"],
    ["Vor-Ort −S10, Band 1","−SA2, Rechts −SF5, Links −SF6, Halt −SF7, −PF6, Not-Halt −SF8, Quittieren −SF41"],["Vor-Ort −S20, Band 2","−SA4, Rechts −SF23, Links −SF24, Halt −SF25, Not-Halt −SF9, Quittieren −SF42"],
    ["Vor-Ort −S30, Rollenkurve","−SA5, Rechts −SF30, Links −SF31, Halt −SF32, Not-Halt −SF10, Quittieren −SF43"],
    ["Vor-Ort −S40, Prüfstation","−SA6, EIN −SF34, AUS −SF35, Muldenrollen −SF36 / −SF37, Kipper −SF38 / −SF39, Not-Halt −SF33, Quittieren −SF44"],
    ["Vor-Ort −S50, Prüfband","−SA7, EIN −SF45, AUS −SF46, Drehzahlpoti −SF47"]])}</section>
  <section class="panel"><h2>Sicherheitskonzept</h2><p class="prose" style="margin-top:10px">${chips("Alle Not-Halt-Taster und der Lichtvorhang −BG20 wirken hart über das Sicherheitsrelais −KF2: Ventile, Schütze und Heizung werden spannungsfrei, die Umrichter wählen STO an – unabhängig vom SPS-Programm. Die SPS bekommt nur Meldungen. Halt-, Stop- und Not-Halt-Meldekontakte sind Öffner, damit ein Drahtbruch immer zur sicheren Seite führt.")}</p>
    <div class="callout warn"><b>Merksatz:</b> Das SPS-Programm macht die Anlage bedienbar und diagnostizierbar. Sicher macht sie die Sicherheitstechnik nach EN ISO 13849-1.</div></section>
  <section class="panel"><h2>Bilder</h2><div class="gallery" style="margin-top:14px">${IMGS.map(([f, c]) => `<figure data-act="zoom" data-src="bilder/${f}" data-cap="${esc(c)}"><img src="bilder/${f}" alt="${esc(plain(c))}" loading="lazy"><figcaption>${chips(c)}</figcaption></figure>`).join("")}</div></section></div>`;
}
/* ---------- Programmierrichtlinien nach Siemens (Programmierleitfaden und Programmierstyleguide S7-1200/S7-1500, Beitrags-ID 81318674) ---------- */
const STYLECHECK = [
  "Keine Merker und keine absoluten Adressen – Zustände als stat-Variablen im FB, gemeinsame Daten in einem globalen DB",
  "Im Baustein nur lokale Variablen und Schnittstellen – kein direkter Zugriff auf globale DBs, PLC-Variablen oder fremde Instanzen",
  "Bezeichner nach Styleguide: Bausteine mit Großbuchstaben, camelCase, Präfixe stat / temp / inst / type, keine Umlaute",
  "Zeiten und Zähler als Multiinstanz (instTimer…), keine Einzelinstanzen",
  "Zahlenwerte ≠ 0 als lokale Konstante in GROSSSCHRIFT (z. B. DIP_TIME)",
  "CASE immer mit ELSE-Zweig, Bausteinkopf ausgefüllt, nur //-Kommentare"
];
const CODE = s => `<pre class="code"><code>${esc(s)}</code></pre>`;
function viewRichtlinien(){
  setNav("richtlinien");
  const ok = `<span class="pill" style="--c:var(--ok)">richtig</span>`, bad = `<span class="pill" style="--c:var(--bad)">falsch</span>`;
  app.innerHTML = `<div class="page"><h1>Programmierrichtlinien</h1>
  <p class="lead">Alle Übungen folgen dem Programmierleitfaden und dem Programmierstyleguide von Siemens für S7-1200/S7-1500. Wer so programmiert, schreibt Bausteine, die sich wiederverwenden, prüfen und von anderen lesen lassen – und vermeidet CPU-Stopps.</p>
  <div class="callout warn"><b>Regel</b> = verbindlich, <b>Empfehlung</b> = soll eingehalten werden. Weicht ein Programm von einer Regel ab, wird das an der Stelle im Code begründet. Kundenvorgaben haben Vorrang.</div>

  <section class="panel"><h2>Grundregeln aus dem Programmierleitfaden</h2>${tableHTML(["Grundsatz","Was das für unsere Anlage heißt"],[
    ["Keine Merker, sondern Datenbausteine (Leitfaden 4.2)","Zustände wie Betriebsbereitschaft oder Schrittnummer liegen als stat-Variablen im Instanz-DB des FB. Was mehrere Bausteine brauchen, steht in einem globalen DB, z. B. „PlantData“."],
    ["Kein Taktmerker, sondern ein Taktgeber-Baustein (4.3)","Der Blinker für −PF3 ist ein eigener FB „Clock“ mit dem Eingang frequency – unabhängig von der Hardware-Konfiguration."],
    ["Symbolisch statt absolut adressieren (3.6)","Im Programm steht „BG40_Korb_am_Anschlag“, nie %I8.0. Die Adressen stehen nur in der Variablentabelle."],
    ["Optimierte Bausteine (2.6)","Alle Bausteine und DBs mit optimiertem Zugriff anlegen – das ist in TIA die Voreinstellung."],
    ["Multiinstanzen (3.2.5)","TON für die Tauchzeit, Meldungs-FBs und Antriebe werden als Multiinstanz im aufrufenden FB angelegt."],
    ["PLC-Datentypen statt STRUCT (3.6.4)","Ein Zylinder mit Endlagen, Ventilen und Überwachungszeit wird einmal als „typeCylinder“ definiert und für −MM1 bis −MM4 genutzt."],
    ["Wiederverwendbarkeit (3.2.9)","Ein Baustein greift nur auf seine Schnittstelle zu. Dann passt er in eine Bibliothek – und in die nächste Anlage."]])}</section>

  <section class="panel"><h2>Bezeichner</h2>
    <p class="prose" style="margin-top:8px">Bezeichner sind englisch, sprechend und ohne Umlaute, Leer- oder Sonderzeichen; sie sollten höchstens 24 Zeichen lang sein. Die Sprache bleibt im ganzen Projekt einheitlich – Siemens empfiehlt Englisch für Code und Kommentare.</p>
    ${tableHTML(["Element","Schreibweise","Beispiel aus der Anlage"],[
      ["Baustein (OB, FB, FC, DB)","beginnt mit Großbuchstaben, ohne Unterstrich","Tinning, OperationMode, Message, StartRelease"],
      ["Einzelinstanz-DB","Präfix Inst","InstTinning"],
      ["Multiinstanz","Präfix inst","instTimerDip, instMsgLightCurtain"],
      ["Input, Output, InOut","kein Präfix, camelCase","start, stop, homePosition, readyToStart"],
      ["Static-Variable","Präfix stat","statStep, statReady, statModeAuto"],
      ["Temp-Variable","Präfix temp, vor dem Lesen beschreiben","tempTemperature, tempRawValue"],
      ["Konstante","GROSSSCHRIFT mit Unterstrich, lokal im Baustein","DIP_TIME, DRIP_TIME, TEMP_MIN, MAX_STEP"],
      ["PLC-Datentyp","Präfix type","typeCylinder, typeConveyor"],
      ["Array","Mehrzahl, Index ab 0, Obergrenze als Konstante","cylinders[0..CYL_UPPER_LIM]"]])}
    <h3>Standard-Abkürzungen</h3>${tableHTML(["Abkürzung","Bedeutung","Abkürzung","Bedeutung"],[["Min / Max","Minimum / Maximum","Act","aktuell (Istwert)"],["Prev / Next","vorheriger / nächster","Avg / Diff / Sum","Mittelwert / Differenz / Summe"],["Ris / Fal","steigende / fallende Flanke","Old","alter Wert, z. B. für Flanken"],["Pos / Dir","Position / Richtung","Err / Warn","Fehler / Warnung"],["Cmd","Befehl","Sim","simuliert"]])}
    <p class="muted small" style="margin-top:8px">Nur eine Abkürzung je Bezeichner, Wortfolge wie gesprochen: statPositionAct statt statActPos.</p></section>

  <section class="panel"><h2>Bausteine und Schnittstellen</h2><ul class="prose" style="padding-left:20px;margin:10px 0 0">
    <li><b>Regel:</b> Im Baustein nur lokale Variablen – kein Zugriff auf globale DBs, Einzelinstanzen oder PLC-Variablen. Daten fließen über Input, Output und InOut.</li>
    <li><b>Regel:</b> Auf stat-Variablen eines FB wird von außen nicht zugegriffen.</li>
    <li><b>Regel:</b> Variablen, die man beim Testen sehen muss (z. B. Schrittnummer), sind static, nicht temp – temp lässt sich nicht beobachten.</li>
    <li><b>Regel:</b> Jeder Baustein hat einen Bausteinkopf (Schablone unten).</li>
    <li><b>Regel:</b> Fehlercodes aufgerufener Bausteine und Systemfunktionen immer auswerten.</li>
    <li><b>Empfehlung:</b> SCL für Logik mit Berechnungen und Abläufen, KOP oder FUP für Verschaltungen und Binärlogik – das erleichtert dem Service die Diagnose.</li>
    <li><b>Empfehlung:</b> Viele Parameter in einem PLC-Datentyp als InOut übergeben; jeden Output nur einmal pro Zyklus schreiben.</li></ul></section>

  <section class="panel"><h2>SCL schreiben</h2><div class="cols2" style="margin-top:8px">
    <div><p>${ok} Konstante, Klammern, Leerzeichen, Zeilenumbruch nach THEN</p>${CODE(`// Dipping: time runs only in lower end position
instTimerDip(IN := (#statStep = 6) AND #mm2Down,
             PT := #DIP_TIME);
IF instTimerDip.Q THEN
  #statStep := 7;
END_IF;`)}</div>
    <div><p>${bad} Zahl im Code, Merker, keine Struktur</p>${CODE(`IF "M_Schritt"=6 AND "BG4" AND "T_Tauch".Q THEN "M_Schritt":=7;END_IF;`)}</div></div>
    <ul class="prose" style="padding-left:20px;margin:14px 0 0">
      <li><b>Regel:</b> Einrücken mit zwei Leerzeichen, keine Tabulatoren. Bedingungs- und Anweisungsteil durch Zeilenumbruch trennen.</li>
      <li><b>Regel:</b> Jede CASE-Anweisung hat einen ELSE-Zweig, der unerwartete Werte meldet.</li>
      <li><b>Empfehlung:</b> CASE statt langer ELSIF-Ketten, Ausdrücke klammern, Leerzeichen um Operatoren, Zeilen höchstens 80 Zeichen, nur //-Kommentare.</li></ul>
    ${CODE(`CASE #statStep OF
  1: // Home position, wait for start
    IF #readyToStart AND #start THEN
      #statStep := 2;
    END_IF;
  2: // Hook basket
    ;
ELSE // Unexpected step: report error
  #statStepErr := TRUE;
END_CASE;`)}
    <h3>Bausteinkopf</h3>${CODE(`//=============================================================================
// School / Company          (c) Copyright 2026
//-----------------------------------------------------------------------------
// Library:       TinningPlant
// Tested with:   CPU 1516-3 PN/DP FW 3.1, PLCSIM Advanced
// Engineering:   TIA Portal V19
// Restrictions:  Call in OB1 only
// Requirements:  none
// Functionality: Step sequence portal tinning (-MM1 to -MM4)
//-----------------------------------------------------------------------------
// Change log table:
// Version  Date        Expert in charge  Changes applied
// 01.00.00 06.10.2026  (Name)            First released version
//=============================================================================`)}</section>

  <section class="panel"><h2>Schnittstellen nach PLCopen und Fehlerrückgabe</h2>${tableHTML(["Baustein-Art","Eingang","Ausgänge"],[
    ["Auftrag mit Ende (z. B. Grundstellungsfahrt)","execute (Flanke)","done, busy, error, status – execute erfordert busy und done"],
    ["Dauerfunktion (z. B. Temperaturregelung)","enable","valid, busy, error, status – enable erfordert valid"]])}
    <p class="prose" style="margin-top:10px">Ein Fehler setzt <code>error</code> und das höchstwertige Bit von <code>status</code> (16#8…); die übrigen Bits nennen die Ursache. So arbeiten auch die Siemens-Systembausteine wie MC_Power.</p></section>

  <section class="panel"><h2>Stil-Check zur Abgabe</h2><p class="lead">Dieselbe Liste steht in jeder Übung unter „Kontrollieren“ und im gedruckten Prüfprotokoll.</p>
    <ol class="tasks">${STYLECHECK.map((c, i) => `<li><input type="checkbox" data-k="stil:${i}" aria-label="erfüllt"><span class="tx">${c}</span></li>`).join("")}</ol></section>

  <section class="panel"><h2>Quellen</h2><ul class="prose" style="padding-left:20px;margin:10px 0 0">
    <li><a href="https://support.industry.siemens.com/cs/ww/de/view/81318674" target="_blank" rel="noopener">Siemens: Programmierleitfaden und Programmierstyleguide für S7-1200/S7-1500, Beitrags-ID 81318674</a> – hier stehen immer die aktuellen Fassungen.</li>
    <li>Ausgewertet: Programmierstyleguide V1.2 (10/2016) und Programmierleitfaden V1.5 (03/2017). Neuere Fassungen ergänzen die Regeln, ändern die Grundsätze oben aber nicht.</li>
    <li><a href="https://support.industry.siemens.com/cs/ww/de/view/109479728" target="_blank" rel="noopener">Siemens: Taktgeber-Baustein statt Taktmerker, Beitrags-ID 109479728</a></li></ul></section></div>`;
  restoreInputs(app);
}

function viewKonzept(){
  setNav("konzept");
  app.innerHTML = `<div class="page"><h1>Didaktisches Konzept</h1><p class="lead">${SHEETS.length} Übungen führen von der ersten Grundstellungsabfrage bis zur Anlage, die vollständig am Programm der Lernenden hängt. Der Zwilling übernimmt jeweils den Teil, der noch nicht selbst programmiert wird.</p>
  <section class="panel"><h2>Sechs Schritte in jeder Übung</h2><ol class="phases6">${[["Informieren","Situation lesen, Zwilling einstellen, Signal-Rallye und Kurz-Check"],["Planen","Leitfragen beantworten, Ablauf skizzieren, Variablen festlegen"],["Entscheiden","Lösungsweg im Fachgespräch abstimmen, Freigabe durch die Lehrkraft"],["Ausführen","in TIA programmieren, in PLCSIM Advanced laden, in Betrieb nehmen"],["Kontrollieren","Prüfprotokoll Fall für Fall, Fehler durch Forcen provozieren"],["Bewerten","Selbsteinschätzung je Lernziel, Reflexion, Plus-Aufgabe"]].map(([b, s]) => `<li><b>${b}</b><span>${s}</span></li>`).join("")}</ol></section>
  <div class="cols2"><section class="panel"><h2>Vier Kompetenzstufen</h2>${tableHTML(["Stufe","Leitfrage der Lernenden"],[[`<span class="pill" style="--c:var(--s1)">1 Grundlagen</span>`,"Was meldet die Anlage, und wie bewege ich sie sicher von Hand?"],[`<span class="pill" style="--c:var(--s2)">2 Aufbau</span>`,"Wie baue ich Betriebsarten und Automatik sauber auf?"],[`<span class="pill" style="--c:var(--s3)">3 Vertiefung</span>`,"Wie koordiniere ich Teilprozesse und verarbeite Analogwerte?"],[`<span class="pill" style="--c:var(--s4)">4 Experte</span>`,"Wie entwerfe ich ein robustes Gesamtsystem?"]])}</section>
  <section class="panel"><h2>Rahmen</h2>${tableHTML(["",""],[["Zielgruppe","Fachschule Technik, Umschulung, Meister- und Technikerkurse"],["Voraussetzung","Digitaltechnik, Zahlensysteme, Grundbegriffe Elektropneumatik"],["Werkzeuge","TIA Portal ab V17, S7-PLCSIM Advanced, Zwilling mit Bridge"],["Sprachen","KOP/FUP, SCL, S7-GRAPH optional"],["Umfang","ca. 139 UE à 45 min einschließlich Abschlussprojekt"]])}</section></div>
  <section class="panel"><h2>Normen</h2>${tableHTML(["Norm","Inhalt","Übungen"],[["DIN EN 61131-3","SPS-Programmiersprachen","alle"],["DIN EN 60848","GRAFCET","L12, L13, L16, L32"],["DIN EN 60204-1","Elektrische Ausrüstung von Maschinen, Not-Halt, Betriebsarten","L09, L10, L14, L15"],["DIN EN ISO 13849-1","Sicherheitsbezogene Teile von Steuerungen","Sicherheitskonzept"],["DIN EN ISO 13850","Not-Halt","L14"],["DIN EN 81346-2","Referenzkennzeichen","alle"],["Siemens Programmierleitfaden und -styleguide S7-1200/1500 (ID 81318674)","Programmierstil, Bezeichner, Bausteine","alle"],["PROFIdrive-Profil","Zustandsmaschine, STW1/ZSW1, Telegramme","L27 bis L30"]])}</section>
  <section class="panel"><h2>Glossar</h2>${tableHTML(["Begriff","Bedeutung"],[["AUS1 / AUS2 / AUS3","Stopp mit Rampe / austrudeln (Impulssperre) / Schnellhalt"],["Erstwert","die zuerst aufgetretene von mehreren Störungen"],["Forcen","ein Signal unabhängig vom Prozess fest auf 0 oder 1 setzen"],["Handshake","gegenseitige Quittung zweier Teilsysteme vor einer Übergabe"],["Hysterese","Abstand zwischen Ein- und Ausschaltpunkt eines Zweipunktreglers"],["Integrierende Strecke","Istwert ändert sich, solange Zu- und Abfluss ungleich sind"],["Öffner","unbetätigt geschlossener Kontakt (1 = nicht betätigt)"],["PT1","Strecke erster Ordnung mit Zeitkonstante"],["Ruhestromprinzip","Gutzustand = Strom fließt, Drahtbruch wirkt wie Auslösung"],["Selbsthaltung","Ausgang hält sich über seinen eigenen Zustand"],["STO","Safe Torque Off, sichere Impulssperre im Umrichter"],["Transition","Übergangsbedingung zwischen zwei Schritten"]])}</section></div>`;
}

const CRIT = [["Planung",15,"Skizze vollständig, Leitfragen fachlich richtig"],["Funktion",30,"alle Prüffälle bestanden, Ereignisliste ohne Meldungen"],["Fehlerverhalten",20,"geforcte Fehler erkannt, gemeldet, sicher behandelt; kein selbstständiger Wiederanlauf"],["Programmstruktur",15,"nach Siemens-Programmierstyleguide: FB/FC-Aufteilung, Bezeichner und Präfixe, keine Merker, Multiinstanzen, Konstanten, Bausteinkopf"],["Dokumentation",10,"Prüfprotokoll ausgefüllt, Änderungen nachvollziehbar"],["Fachgespräch",10,"Lösung begründet, Alternativen benannt, Transfer auf reale Anlage"]];
const critOf = () => CRIT, TYPN = {erkunden:"Erkunden", programmieren:"Programmieren", auslegen:"Auslegen", projekt:"Projekt"};
const gradeOf = p => p >= 92 ? "1 sehr gut" : p >= 81 ? "2 gut" : p >= 67 ? "3 befriedigend" : p >= 50 ? "4 ausreichend" : p >= 30 ? "5 mangelhaft" : "6 ungenügend";
function viewBewertung(sel){
  setNav("bewertung");
  const ex = BY[sel] || SHEETS[0];
  const sumOf = s => { const v = CRIT.map((_, i) => S.get(`${s.id}:bew${i}`)); return v.some(x => x !== null) ? v.reduce((a, x) => a + (+x || 0), 0) : null; };
  app.innerHTML = `<div class="page"><h1>Bewertung</h1><p class="lead">Ein lauffähiges Programm ist die Voraussetzung, nicht die Note. Gleich viel zählen Fehlerverhalten, Struktur und Fachgespräch.</p>
  <div class="cols2"><section class="panel"><div style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap"><h2>Bewertungsbogen</h2>
    <select id="bsel" aria-label="Übung wählen" style="max-width:320px">${SHEETS.map(s => `<option value="${s.id}" ${s===ex?"selected":""}>${s.id} ${esc(s.t)}</option>`).join("")}</select></div>
    <div class="tw" style="margin-top:12px"><table class="bewtab"><thead><tr><th>Kriterium</th><th>Erfüllt, wenn</th><th>max.</th><th>Punkte</th></tr></thead><tbody>${CRIT.map((c, i) => `<tr><td><b>${c[0]}</b></td><td class="small">${c[2]}</td><td>${c[1]}</td><td><input type="text" inputmode="numeric" data-k="${ex.id}:bew${i}" data-max="${c[1]}" aria-label="Punkte ${c[0]}"></td></tr>`).join("")}</tbody></table></div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;gap:14px;flex-wrap:wrap"><div><span class="muted small">Summe und Note</span><div class="grade" id="grade"></div></div><button class="btn" data-act="bew-print" data-id="${ex.id}">${IC.print}Bewertungsbogen drucken</button></div>
    <div class="qa" style="margin-top:14px"><label for="bn">Bemerkungen</label><textarea id="bn" data-k="${ex.id}:bewnote" rows="3"></textarea></div></section>
  <section class="panel"><h2>Übersicht</h2><div class="tw" style="margin-top:10px"><table><thead><tr><th>Übung</th><th>Schritte</th><th>Punkte</th><th>Note</th></tr></thead><tbody>${SHEETS.map(s => { const v = sumOf(s); return `<tr><td><a href="#/bewertung/${s.id}">${s.id}</a> ${esc(s.t)}</td><td>${doneCount(s)} / 6</td><td>${v ?? "–"}</td><td>${v === null ? "–" : gradeOf(v)}</td></tr>`; }).join("")}</tbody></table></div>
    <p class="muted small" style="margin-top:10px">IHK-Schlüssel: ab 92 Punkten sehr gut, ab 81 gut, ab 67 befriedigend, ab 50 ausreichend, ab 30 mangelhaft.</p></section></div></div>`;
  $("#bsel").onchange = e => location.hash = "#/bewertung/" + e.target.value;
  restoreInputs(app); paintGrade(ex);
}
function paintGrade(ex){ const el = $("#grade"); if (!el) return; const v = CRIT.map((_, i) => S.get(`${ex.id}:bew${i}`)); const any = v.some(x => x !== null); const s = v.reduce((a, x) => a + (+x || 0), 0); el.textContent = any ? `${s} Punkte, ${gradeOf(s)}` : "noch keine Punkte"; }

