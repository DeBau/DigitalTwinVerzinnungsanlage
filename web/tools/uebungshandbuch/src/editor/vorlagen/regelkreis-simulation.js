// Vorlage Regelkreis: "Regelkreis ausprobieren". Eine kleine Zeitsimulation für die Kette Regler (P, PI oder
// Zweipunkt) → Strecke (PT1 mit 10 s, dazu 1 s Totzeit). Sie läuft im Eigenschaftsfeld neben dem Blatt (Haken
// anleitung), die Felder wirken sofort (Haken eingabe), "Sollwertsprung" zeichnet den Verlauf neu.
// Zustand in ED.vorlage.sim = {regler, kp, tn, gestartet}; gespeichert wird nichts.
import { $, esc } from '../../app/basis.js';
import { ED } from '../status.js';
import { markiertesElement } from '../auswahl.js';
import { FARBEN, FELDER_JE_ART, HINWEIS, auswahlFeld, updateProps } from '../eigenschaften.js';

export const STRECKE = {t1: 10, totzeit: 1, ks: 1};     // Zeitkonstante und Totzeit in s, Verstärkung
export const LAUF = {dauer: 60, dt: 0.05, sprungBei: 5, wVor: 20, wNach: 60, hysterese: 2,
  ruhe: 15, laengstens: 300, mehr: 30};   // Zeiten in s, Werte in %; ruhe: so lange muss x am Ende ruhig sein
// laengstens, mehr: Der PI-Regler rechnet in Schritten von mehr Sekunden weiter, bis x eingeschwungen ist
export const SIM_REGLER = [["P", "P-Regler"], ["PI", "PI-Regler"], ["2P", "Zweipunktregler"]];
// Regler aus der Zeichnung übernehmen (PID rechnet hier wie PI), sonst PI
export function startRegler(d){
  const b = (d.o || []).find(o => o.k === "box" && ["P", "PI", "PID", "2P"].includes(o.typ));
  return !b ? "PI" : b.typ === "PID" ? "PI" : b.typ;
}
export const neueSimulation = d => ({regler: startRegler(d), kp: "2", tn: "8", gestartet: false});

/* ---------- Rechnen ---------- */
export const zahlAus = (v, vorgabe) => { const z = +String(v).replace(",", "."); return z > 0 ? z : vorgabe; };
export const aufProzent = y => Math.max(0, Math.min(100, y));
// Stellgröße je Regler: e Regeldifferenz, z Zustand {i Integral, y letzte Stellgröße}
export const STELLGROESSE = {
  P: (e, s, z) => aufProzent(s.kp * e),
  PI: (e, s, z) => { z.i += e * LAUF.dt; return aufProzent(s.kp * (e + z.i / s.tn)); },
  "2P": (e, s, z) => e > LAUF.hysterese ? 100 : e < -LAUF.hysterese ? 0 : z.y,
};
// Verlauf [{t, w, x, y}] für die Einstellungen sim. Der PI-Regler rechnet weiter, bis x eingeschwungen ist.
export function simuliere(sim){
  const lauf = neuerLauf(sim);
  rechneBis(lauf, LAUF.dauer);
  while (sim.regler === "PI" && !eingeschwungen(lauf.punkte) && lauf.i * LAUF.dt < LAUF.laengstens) {
    rechneBis(lauf, lauf.i * LAUF.dt + LAUF.mehr);
  }
  return lauf.punkte;
}
// Start im Gleichgewicht: Der P-Regler hält x schon vor dem Sprung etwas unter w (bleibende Regeldifferenz).
// Der Zweipunktregler kennt nur 0 und 100 %: Er startet bei x = w ausgeschaltet.
export function neuerLauf(sim){
  const s = {kp: zahlAus(sim.kp, 1), tn: zahlAus(sim.tn, 10)}, v = s.kp * STRECKE.ks;
  const x = sim.regler === "P" ? LAUF.wVor * v / (1 + v) : LAUF.wVor, y = sim.regler === "2P" ? 0 : x / STRECKE.ks;
  return {regler: sim.regler, s, x, z: {y, i: sim.regler === "PI" ? y / s.kp * s.tn : 0}, verzug: [], punkte: [], i: 0};
}
// Schritte des Laufs l bis zur Zeit ende in s
export function rechneBis(l, ende){
  for (; l.i * LAUF.dt <= ende + 1e-9; l.i++) {
    const t = l.i * LAUF.dt, w = t < LAUF.sprungBei ? LAUF.wVor : LAUF.wNach;
    l.z.y = STELLGROESSE[l.regler](w - l.x, l.s, l.z);
    l.verzug.push(l.z.y);
    const yVerzoegert = l.verzug.length > STRECKE.totzeit / LAUF.dt ? l.verzug.shift() : l.verzug[0];
    l.x += (STRECKE.ks * yVerzoegert - l.x) * LAUF.dt / STRECKE.t1;
    l.punkte.push({t, w, x: l.x, y: l.z.y});
  }
}
// x ist eingeschwungen: am Ende bei w und in den letzten LAUF.ruhe Sekunden ruhig
export function eingeschwungen(p){
  const xs = p.slice(-Math.round(LAUF.ruhe / LAUF.dt)).map(q => q.x), ende = p[p.length - 1];
  return Math.abs(ende.w - ende.x) < 0.5 && Math.max(...xs) - Math.min(...xs) < 0.5;
}
// Schwingt x am Ende dauernd? In den letzten LAUF.ruhe Sekunden schwankt x um mehr als 1 % und kehrt dabei
// mindestens zweimal um (ein langsames Ansteigen ist kein Schwingen).
export function schwingtDauernd(p){
  const xs = p.slice(-Math.round(LAUF.ruhe / LAUF.dt)).filter((q, i) => i % 10 === 0).map(q => q.x);
  const auf = xs.slice(1).map((x, i) => Math.sign(x - xs[i])).filter(r => r);   // je Abschnitt: steigt (1) oder fällt (−1)
  const wenden = auf.slice(1).filter((r, i) => r !== auf[i]).length;
  return Math.max(...xs) - Math.min(...xs) > 1 && wenden >= 2;
}
// Zahl in % mit Komma, echtem Minuszeichen (U+2212) und geschütztem Leerzeichen vor %
export const PROZ = " %";
export const prozent = v => (v.toFixed(1) === "-0.0" ? "0.0" : v.toFixed(1)).replace(".", ",").replace("-", "−") + PROZ;
export const ZU_STARK = {P: "Kp ist zu groß.", PI: "Kp ist zu groß oder Tn zu klein."};
// Kurzer Satz zum Ergebnis: Dauerschwingung, bleibende Regeldifferenz, Überschwingen über den Endwert
export function ergebnisText(sim, p){
  const ende = p[p.length - 1], e = ende.w - ende.x, ueber = Math.max(...p.map(q => q.x)) - ende.x;
  if (sim.regler === "2P") return zweipunktText(p);
  if (schwingtDauernd(p)) return `x schwingt dauernd und kommt nicht zur Ruhe. ${ZU_STARK[sim.regler]}`;
  const ueberText = ueber > 0.5 ? ` x schwingt ${prozent(ueber)} über den Endwert hinaus.` : " x schwingt nicht über.";
  return restText(sim, e, ende.t) + ueberText;
}

// Zweipunktregler: wie weit x um w pendelt, und warum weiter als die Hysterese
export function zweipunktText(p){
  const xs = p.slice(-Math.round(LAUF.ruhe / LAUF.dt)).map(q => q.x), w = p[p.length - 1].w;
  const ab = prozent(Math.max(0, w - Math.min(...xs))), auf = prozent(Math.max(0, Math.max(...xs) - w));
  return `Der Regler schaltet nur ganz ein (100${PROZ}) oder ganz aus (0${PROZ}). x pendelt um w, bis ${ab} darunter `
    + `und ${auf} darüber. Die Hysterese ist nur ±${LAUF.hysterese}${PROZ}: Weiter pendelt x wegen der Totzeit, `
    + `denn das Umschalten wirkt erst ${STRECKE.totzeit} s später.`;
}
// Regeldifferenz am Ende: weg, beim PI-Regler noch nicht fertig, beim P-Regler bleibend
export function restText(sim, e, t){
  if (Math.abs(e) < 0.5) return `Die Regeldifferenz ist am Ende weg (nach ${Math.round(t)} s).`;
  if (sim.regler === "PI") return `Nach ${Math.round(t)} s fehlen noch ${prozent(e)}, der I-Anteil regelt weiter.`;
  return `Am Ende bleibt eine Regeldifferenz von ${prozent(e)}.`;
}

/* ---------- Zeichnen ---------- */
export const BILD = {b: 260, h: 160, x0: 40, x1: 252, y0: 12, y1: 135};
export const bildX = (t, dauer) => BILD.x0 + (BILD.x1 - BILD.x0) * t / dauer;
export const bildY = v => BILD.y1 - (BILD.y1 - BILD.y0) * v / 100;
export function simLinie(p, f, farbe){
  const jeder = Math.ceil(p.length / 300), dauer = p[p.length - 1].t;   // höchstens etwa 300 Punkte je Linie
  const d = "M" + p.filter((q, i) => i % jeder === 0).map(q => `${bildX(q.t, dauer).toFixed(1)} ${bildY(q[f]).toFixed(1)}`).join("L");
  return `<path class="rk-linie" d="${d}" pathLength="1" fill="none" stroke="${farbe}" stroke-width="1.6"/>`;
}
// Zeichnet die Linien einmal von links nach rechts (ohne Bewegung, wenn der Rechner das so eingestellt hat)
export const ANIMATION = `<style>.rk-linie{stroke-dasharray:1;animation:rk-zeichnen 1.6s linear}`
  + `@keyframes rk-zeichnen{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}`
  + `@media (prefers-reduced-motion:reduce){.rk-linie{animation:none}}</style>`;
export function achsenBild(dauer){
  const t = (x, y, s, a = "end") => `<text x="${x}" y="${y}" font-size="10" text-anchor="${a}" fill="#666">${s}</text>`;
  return `<path d="M${BILD.x0} ${BILD.y0}V${BILD.y1}H${BILD.x1}" stroke="#9AA4AD" fill="none"/>`
    + t(BILD.x0 - 4, BILD.y1 + 3, "0") + t(BILD.x0 - 4, BILD.y0 + 6, "100 %")
    + t(BILD.x1, BILD.y1 + 13, `t in s (bis ${Math.round(dauer)})`) + t(BILD.x0, BILD.y1 + 13, "0", "middle");
}
// Hysterese des Zweipunktreglers: gestrichelte Schaltpunkte w ± LAUF.hysterese
export function hystereseBand(p){
  const jeder = Math.ceil(p.length / 300), dauer = p[p.length - 1].t, punkte = p.filter((q, i) => i % jeder === 0);
  const rand = d => "M" + punkte.map(q => `${bildX(q.t, dauer).toFixed(1)} ${bildY(q.w + d).toFixed(1)}`).join("L");
  return `<path d="${rand(LAUF.hysterese)}${rand(-LAUF.hysterese)}" fill="none" stroke="${FARBEN[1][0]}" `
    + `stroke-width=".8" stroke-dasharray="3 2" opacity=".7"/>`;
}
export function verlaufSVG(sim){
  const p = sim.gestartet ? simuliere(sim) : [], dauer = p.length ? p[p.length - 1].t : LAUF.dauer;
  const band = p.length && sim.regler === "2P" ? hystereseBand(p) : "";
  const linien = p.length ? simLinie(p, "w", FARBEN[1][0]) + simLinie(p, "y", FARBEN[2][0]) + simLinie(p, "x", FARBEN[0][0]) : "";
  return `<svg viewBox="0 0 ${BILD.b} ${BILD.h}" role="img" aria-label="Verlauf von w, x und y">${ANIMATION}${achsenBild(dauer)}`
    + `${band}${linien}</svg>`;
}
export const LEGENDE_SIM = `<p class="small" style="margin:4px 0 8px">`
  + FARBEN.map(([c], i) => `<span style="color:${c};font-weight:600">${["x Istwert", "w Sollwert", "y Stellgröße"][i]}</span>`)
    .join(" · ") + `</p>`;
export function simText(sim){
  if (!sim.gestartet) return "Drück auf Sollwertsprung: w springt von 20 % auf 60 %, und du siehst, wie x folgt.";
  return ergebnisText(sim, simuliere(sim));
}

/* ---------- Eigenschaftsfeld ---------- */
export const simFeld = (f, lbl, wert, an) => `<label class="prop" ${an ? "" : 'style="opacity:.45"'}>${lbl}`
  + `<input type="text" data-rks="${f}" value="${esc(wert)}" inputmode="decimal" autocomplete="off" ${an ? "" : "disabled"}></label>`;
export function simPanel(){
  const sim = ED.vorlage.sim, regler = auswahlFeld("regler", "Regler", SIM_REGLER, sim.regler).replace('data-prop=', 'data-rks=');
  return `<div class="props"><div class="palh">Regelkreis ausprobieren</div>`
    + HINWEIS("Die Strecke verhält sich wie ein Tank: Sie folgt verzögert (10 s) und merkt erst nach 1 s etwas.")
    + regler + simFeld("kp", "Verstärkung Kp", sim.kp, sim.regler !== "2P")
    + simFeld("tn", "Nachstellzeit Tn in s", sim.tn, sim.regler === "PI")
    + `<div class="propact" style="justify-content:flex-start;gap:6px"><button type="button" class="tool" data-rk="sprung">`
    + `Sollwertsprung</button><button type="button" class="tool" data-rk="simzu">Schließen</button></div>`
    + `<div id="rk-sim-bild">${verlaufSVG(sim)}</div>${LEGENDE_SIM}<p id="rk-sim-text" class="small">${simText(sim)}</p>`
    + HINWEIS(SIM_TIPPS[sim.regler]) + `</div>`;
}
export const SIM_TIPPS = {
  P: "Tipp: Mach Kp etwas größer, z. B. 4 oder 8. Die Regeldifferenz wird kleiner, verschwindet aber nie ganz. "
    + "Ist Kp zu groß (hier ab etwa 15), schwingt x dauernd.",
  PI: "Tipp: Mach Tn kleiner. Der Regler wird schneller, aber x schwingt stärker über. Zu klein, dann schwingt x dauernd.",
  "2P": "Tipp: Der Zweipunktregler kennt nur ein und aus. Gut für Heizungen, wenn ein kleines Pendeln nicht stört. "
    + "Die gestrichelten Linien sind die Schaltpunkte (Hysterese).",
};
// Haken anleitung: das Panel, solange die Simulation offen ist. Ist etwas markiert, stehen seine Eigenschaften darüber
// und bleiben bedienbar.
export function simAnleitung(){
  if (!ED.vorlage.sim) return null;
  const el = markiertesElement();
  return (el ? FELDER_JE_ART[ED.markiert.art](el) : "") + simPanel();
}
// Haken eingabe: Feld übernehmen und nur das Bild und den Text neu zeichnen (das Feld behält den Fokus)
export function simEingabe(e){
  const f = e.target.dataset && e.target.dataset.rks, sim = ED.vorlage.sim;
  if (!f || !sim) return false;
  sim[f] = e.target.value;
  if (f === "regler") { updateProps("neu"); return true; }
  $("#rk-sim-bild").innerHTML = verlaufSVG(sim);
  $("#rk-sim-text").textContent = simText(sim);
  return true;
}
export const SIM_AKTIONEN = {
  sim: () => { ED.vorlage.sim = ED.vorlage.sim ? null : neueSimulation(ED.data); updateProps("neu"); },
  sprung: () => { ED.vorlage.sim.gestartet = true; updateProps("neu"); },
  simzu: () => { ED.vorlage.sim = null; updateProps("neu"); },
};
export const SIMKNOPF = `<button type="button" class="tool" data-rk="sim" `
  + `title="Kleine Simulation: Regler und Strecke im Zeitverlauf">Ausprobieren</button>`;
