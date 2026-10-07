// Vorlage Regelkreis: "Regelkreis ausprobieren". Eine kleine Zeitsimulation für die Kette Regler (P, PI oder
// Zweipunkt) → Strecke (PT1 mit 10 s, dazu 1 s Totzeit). Sie läuft im Eigenschaftsfeld neben dem Blatt (Haken
// anleitung), die Felder wirken sofort (Haken eingabe), "Sollwertsprung" zeichnet den Verlauf neu.
// Zustand in ED.vorlage.sim = {regler, kp, tn, gestartet}; gespeichert wird nichts.
import { $, esc } from '../../app/basis.js';
import { ED } from '../status.js';
import { FARBEN, HINWEIS, auswahlFeld, updateProps } from '../eigenschaften.js';
import { richtung } from './zustand.js';

export const STRECKE = {t1: 10, totzeit: 1, ks: 1};     // Zeitkonstante und Totzeit in s, Verstärkung
export const LAUF = {dauer: 60, dt: 0.05, sprungBei: 5, wVor: 20, wNach: 60, hysterese: 2,
  ruhe: 15};   // Zeiten in s, Werte in %; ruhe: so lange muss x am Ende ruhig sein
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
// Verlauf [{t, w, x, y}] für die Einstellungen sim
export function simuliere(sim){
  const s = {kp: zahlAus(sim.kp, 1), tn: zahlAus(sim.tn, 10)}, z = {i: 0, y: 0}, verzug = [], punkte = [];
  // Start im Gleichgewicht: Der P-Regler hält x schon vor dem Sprung etwas unter w (bleibende Regeldifferenz)
  const v = s.kp * STRECKE.ks;
  let x = sim.regler === "P" ? LAUF.wVor * v / (1 + v) : LAUF.wVor;
  z.y = x / STRECKE.ks; z.i = sim.regler === "PI" ? z.y / s.kp * s.tn : 0;
  for (let t = 0; t <= LAUF.dauer; t += LAUF.dt) {
    const w = t < LAUF.sprungBei ? LAUF.wVor : LAUF.wNach;
    z.y = STELLGROESSE[sim.regler](w - x, s, z);
    verzug.push(z.y);
    const yVerzoegert = verzug.length > STRECKE.totzeit / LAUF.dt ? verzug.shift() : verzug[0];
    x += (STRECKE.ks * yVerzoegert - x) * LAUF.dt / STRECKE.t1;
    punkte.push({t, w, x, y: z.y});
  }
  return punkte;
}
// Schwingt x am Ende dauernd? In den letzten LAUF.ruhe Sekunden schwankt x um mehr als 1 % und kehrt dabei
// mindestens zweimal um (ein langsames Ansteigen ist kein Schwingen).
export function schwingtDauernd(p){
  const xs = p.slice(-Math.round(LAUF.ruhe / LAUF.dt)).filter((q, i) => i % 10 === 0).map(q => q.x);
  const richtung = xs.slice(1).map((x, i) => Math.sign(x - xs[i])).filter(r => r);
  const wenden = richtung.slice(1).filter((r, i) => r !== richtung[i]).length;
  return Math.max(...xs) - Math.min(...xs) > 1 && wenden >= 2;
}
export const prozent = v => v.toFixed(1).replace(".", ",") + " %";
export const ZU_STARK = {P: "Kp ist zu groß.", PI: "Kp ist zu groß oder Tn zu klein."};
// Kurzer Satz zum Ergebnis: Dauerschwingung, bleibende Regeldifferenz, Überschwingen über den Endwert
export function ergebnisText(sim, p){
  const ende = p[p.length - 1], e = ende.w - ende.x, ueber = Math.max(...p.map(q => q.x)) - ende.x;
  if (sim.regler === "2P") return `Der Regler schaltet ganz ein und ganz aus. x pendelt um w, bis ${prozent(Math.max(0, ueber - e))} darüber.`;
  if (schwingtDauernd(p)) return `x schwingt dauernd und kommt nicht zur Ruhe. ${ZU_STARK[sim.regler]}`;
  const rest = Math.abs(e) < 0.5 ? "Die Regeldifferenz ist am Ende weg." : `Am Ende bleibt eine Regeldifferenz von ${prozent(e)}.`;
  return rest + (ueber > 0.5 ? ` x schwingt ${prozent(ueber)} über den Endwert hinaus.` : " x schwingt nicht über.");
}

/* ---------- Zeichnen ---------- */
export const BILD = {b: 260, h: 160, x0: 40, x1: 252, y0: 12, y1: 135};
export const bildX = t => BILD.x0 + (BILD.x1 - BILD.x0) * t / LAUF.dauer;
export const bildY = v => BILD.y1 - (BILD.y1 - BILD.y0) * v / 100;
export function simLinie(p, f, farbe){
  const d = "M" + p.filter((q, i) => i % 4 === 0).map(q => `${bildX(q.t).toFixed(1)} ${bildY(q[f]).toFixed(1)}`).join("L");
  return `<path class="rk-linie" d="${d}" pathLength="1" fill="none" stroke="${farbe}" stroke-width="1.6"/>`;
}
// Zeichnet die Linien einmal von links nach rechts (ohne Bewegung, wenn der Rechner das so eingestellt hat)
export const ANIMATION = `<style>.rk-linie{stroke-dasharray:1;animation:rk-zeichnen 1.6s linear}`
  + `@keyframes rk-zeichnen{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}`
  + `@media (prefers-reduced-motion:reduce){.rk-linie{animation:none}}</style>`;
export function achsenBild(){
  const t = (x, y, s, a = "end") => `<text x="${x}" y="${y}" font-size="10" text-anchor="${a}" fill="#666">${s}</text>`;
  return `<path d="M${BILD.x0} ${BILD.y0}V${BILD.y1}H${BILD.x1}" stroke="#9AA4AD" fill="none"/>`
    + t(BILD.x0 - 4, BILD.y1 + 3, "0") + t(BILD.x0 - 4, BILD.y0 + 6, "100 %")
    + t(BILD.x1, BILD.y1 + 13, `t in s (bis ${LAUF.dauer})`) + t(BILD.x0, BILD.y1 + 13, "0", "middle");
}
export function verlaufSVG(sim){
  const p = sim.gestartet ? simuliere(sim) : [];
  const linien = p.length ? simLinie(p, "w", FARBEN[1][0]) + simLinie(p, "y", FARBEN[2][0]) + simLinie(p, "x", FARBEN[0][0]) : "";
  return `<svg viewBox="0 0 ${BILD.b} ${BILD.h}" role="img" aria-label="Verlauf von w, x und y">${ANIMATION}${achsenBild()}`
    + `${linien}</svg>`;
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
  "2P": "Tipp: Der Zweipunktregler kennt nur ein und aus. Gut für Heizungen, wenn ein kleines Pendeln nicht stört.",
};
// Haken anleitung: das Panel, solange die Simulation offen ist
export const simAnleitung = () => ED.vorlage.sim ? simPanel() : null;
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
