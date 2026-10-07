// Pneumatik-Simulation: Anzeige im Eigenschaftsfeld. Signale der Endlagensensoren und Spulen (0/1) wie an der SPS und
// ein mitlaufendes Weg-Zeit-Diagramm der Antriebe (letzte 10 s). Benutzt von pneumatik-simulation.js und pneumatik.js.
import { $, esc } from '../../app/basis.js';
import { ED } from '../status.js';
import { simOn } from '../bauteile.js';
import { ANTRIEB_ARTEN, VALVE, posOf, steuerNr, vstate } from './pneumatik-symbole.js';

export const WEGZEIT = {dauer: 10000, takt: 50, breite: 236, zeile: 30};
const antriebe = () => ED.data.o.filter(o => ANTRIEB_ARTEN.includes(o.k));

export const SIM_HILFE = `<p class="small" style="margin:0 0 6px">Auf die Betätigung <b>links</b> oder <b>rechts</b> eines `
  + `Ventils klicken: Es schaltet um. Ein Taster schaltet nur, solange du drückst. Druckführende Leitungen werden blau, `
  + `Zylinder fahren, Endlagensensoren melden 1. Ein Zylinder fährt nur, wenn die Gegenseite entlüften kann; Drosseln `
  + `bremsen ihn.</p><p class="small muted" style="margin:0 0 8px">Monostabile Ventile fallen beim zweiten Klick in die `
  + `Grundstellung zurück. Beim bistabilen Ventil ist die Spule nur 1, solange du drückst (Impuls). Seine Stellung bleibt und `
  + `steht unter den Signalen. Zum Bearbeiten „Auswählen“ wählen.</p>`;
// Haken anleitung der Vorlage, solange das Werkzeug Simulation gewählt ist
export const simAnleitung = () => `<div class="props"><div class="palh">Simulation</div>${SIM_HILFE}`
  + `<div id="simstatus">${simStatusHTML()}</div></div>`;

// Bistabil: Wegeventil mit Rastung durch zwei Betätigungen (nicht 5/3, das von Federn in die Mitte gestellt wird)
export const istBistabil = o => o.k !== "v53" && (o.ar || "feder") !== "feder";
// Spule links bzw. rechts 1? Monostabil und 5/3: solange die Stellung gehalten wird. Bistabil: nur während des Impulses.
function spuleAn(o, links){
  const imp = ED.sim.impuls;
  if (istBistabil(o)) return !!imp && imp.id === o.id && imp.links === links;
  return vstate(o) === (links ? "act" : "b");
}
// Signale: Endlagensensoren der Antriebe und Spulen der Ventile mit ihrem Zustand
export function simSignale(){
  const s = [];
  antriebe().forEach(o => {
    const p = posOf(o);
    if (o.s1) s.push([o.s1, p < .02]);
    if (o.s2) s.push([o.s2, p > .98]);
  });
  ED.data.o.filter(o => o.spl || o.spr).forEach(o => {
    if (o.spl) s.push([o.spl, spuleAn(o, true)]);
    if (o.spr) s.push([o.spr, spuleAn(o, false)]);
  });
  return s;
}
// Schaltstellung der bistabilen Ventile, getrennt von den Spulen, z. B. „−MB3/−MB4: 14“
const schaltstellungen = () => ED.data.o.filter(o => VALVE[o.k] && istBistabil(o) && (o.spl || o.spr))
  .map(o => `${esc(o.v || [o.spl, o.spr].filter(Boolean).join("/"))}: ${steuerNr(o, vstate(o))}`);
export function simStatusHTML(){
  if (!simOn()) return "";
  const signal = ([n, an]) => `<span style="display:inline-block;margin:0 10px 4px 0;font-size:12.5px">`
    + `<b>${esc(n)}</b> <span style="color:${an ? "#2E7D4F" : "#8A949C"};font-weight:700">${an ? 1 : 0}</span></span>`;
  const sig = simSignale(), st = schaltstellungen();
  return (sig.length ? `<div>${sig.map(signal).join("")}</div>` : "")
    + (st.length ? `<div class="small muted" data-simstellung>Schaltstellung ${st.join(", ")}</div>` : "") + wegZeitSVG();
}
export function simStatusZeigen(){
  const el = $("#simstatus");
  if (el) el.innerHTML = simStatusHTML();
}

/* ---------- Weg-Zeit-Diagramm ---------- */
// Lage aller Antriebe alle WEGZEIT.takt ms merken; ältere Werte als WEGZEIT.dauer fallen weg.
// Die Anzeige wird nur neu geschrieben, wenn sich eine Lage geändert hat (im Stillstand steht sie).
export function wegZeitMerken(t){
  const v = ED.sim.verlauf || (ED.sim.verlauf = []), letzte = v[v.length - 1];
  if (letzte && t - letzte.t < WEGZEIT.takt) return;
  const pos = Object.fromEntries(antriebe().map(o => [o.id, posOf(o)]));
  v.push({t, pos});
  while (v.length && t - v[0].t > WEGZEIT.dauer) v.shift();
  if (!letzte || Object.keys(pos).some(id => letzte.pos[id] !== pos[id])) simStatusZeigen();
}
// Je Antrieb eine Zeile: Kennzeichen, Linie 0 (unten) bis 1 (oben) über die Zeit
export function wegZeitSVG(){
  const v = ED.sim.verlauf || [], as = antriebe(), {dauer, breite, zeile} = WEGZEIT;
  if (!as.length || !v.length) return "";
  const t1 = v[v.length - 1].t, x = t => (46 + (breite - 50) * (1 - (t1 - t) / dauer)).toFixed(1);
  const reihe = (o, i) => {
    const y0 = i * zeile + 24, y = p => (y0 - p * 18).toFixed(1);
    const pkt = v.filter(s => s.pos[o.id] !== undefined).map(s => `${x(s.t)},${y(s.pos[o.id])}`).join(" ");
    return `<text x="0" y="${y0 - 5}" font-size="10" font-weight="600">${esc(o.v || o.k)}</text>`
      + `<path d="M46 ${y0}H${breite - 4}M46 ${y0 - 18}H${breite - 4}" stroke="#C9D0D5" stroke-width=".6" stroke-dasharray="2 2"/>`
      + `<polyline points="${pkt}" fill="none" stroke="#17212B" stroke-width="2"/>`;
  };
  return `<div class="small muted" style="margin:6px 0 2px">Weg-Zeit-Diagramm (letzte 10 s)</div>`
    + `<svg class="wegzeit" viewBox="0 0 ${breite} ${as.length * zeile + 8}" width="100%" role="img" `
    + `aria-label="Weg-Zeit-Diagramm der Antriebe">${as.map(reihe).join("")}</svg>`;
}
