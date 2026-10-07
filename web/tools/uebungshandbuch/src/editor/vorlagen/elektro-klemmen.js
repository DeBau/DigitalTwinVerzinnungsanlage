// Klemmenplan des Stromlaufplans: Tabelle aller Klemmen (−X1:n) mit dem, was oben und unten angeschlossen ist,
// und dem Strompfad. Steht im Eigenschaftsfeld, solange nichts markiert ist (Haken anleitung).
import { esc } from '../../app/basis.js';
import { PH } from '../svg.js';
import { art } from '../registry.js';
import { portsOf } from '../bauteile.js';
import { kettenLeitung } from '../zeichnen.js';
import { anschlussAnzeige } from './elektro-kennzeichen.js';
import { autoLeitungen, pfadNummer } from './elektro-pfade.js';
import { objekteVon } from './elektro-simulation.js';

const ziel = (o, n) => (o.virt ? o.v : `${o.v || art(o.k).n}${n && n !== "~" ? ":" + anschlussAnzeige(o, n) : ""}`);
// Was an Anschluss n von o hängt: Leitungen, Kettenverbindungen, automatische Leitung zu L+ oder M
export function gegenueber(d, o, n){
  const cs = d.c || [], objs = objekteVon(d), r = [];
  cs.forEach(c => {
    const e = c.pa === undefined && c.pb === undefined ? kettenLeitung(c, objs) : null;
    const pa = e ? e[0].n : c.pa, pb = e ? e[1].n : c.pb;
    if (c.a === o.id && pa === n && objs[c.b]) r.push(ziel(objs[c.b], pb));
    if (c.b === o.id && pb === n && objs[c.a]) r.push(ziel(objs[c.a], pa));
  });
  autoLeitungen(d, cs).forEach(a => { if (a.o.id === o.id && a.p.n === n) r.push(a.y % PH === 70 ? "L+" : "M"); });
  return r.join(", ") || "frei";
}
const ZELLE = ' style="padding:3px 4px;text-align:left"';
const KOPF = ["Klemme", "oben", "unten", "Pfad"].map(t => `<th${ZELLE}>${t}</th>`).join("");
export function klemmenplanHTML(d){
  const klemmen = (d.o || []).filter(o => o.k === "term")
    .sort((a, b) => (a.v || "").localeCompare(b.v || "", "de", {numeric: true}));
  if (!klemmen.length) return null;
  const zeile = o => {
    const [oben, unten] = portsOf(o);
    return `<tr><td${ZELLE}><b>${esc(o.v || "")}</b></td><td${ZELLE}>${esc(gegenueber(d, o, oben.n))}</td>`
      + `<td${ZELLE}>${esc(gegenueber(d, o, unten.n))}</td><td${ZELLE}>${pfadNummer(o.x)}</td></tr>`;
  };
  return `<div class="props"><div class="palh">Klemmenplan</div><table class="klemmenplan small" style="width:100%;`
    + `border-collapse:collapse;table-layout:fixed;font-size:11.5px"><colgroup><col style="width:30%">`
    + `<col><col><col style="width:17%"></colgroup><thead><tr>${KOPF}</tr></thead>`
    + `<tbody>${klemmen.map(zeile).join("")}</tbody></table>`
    + `<p class="small muted" style="margin:6px 0 0">Element anklicken zum Ändern, Doppelklick beschriftet.</p></div>`;
}
