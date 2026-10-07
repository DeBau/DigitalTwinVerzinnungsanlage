// Pneumatik: Regeln für den Knopf „Prüfen“ (Haken pruefe der Vorlage). Jede Regel liefert Befunde
// {stufe: "fehler" | "hinweis", text, o?, pt?}. Benutzt von vorlagen/pneumatik.js.
import { art } from '../registry.js';
import { portsOf } from '../bauteile.js';
import { ANTRIEB_ARTEN, VALVE, istEntlueftung } from './pneumatik-symbole.js';
import { leitungsNetze } from './pneumatik-simulation.js';

const DOPPELT = ["zyl2", "rot"];
const bauteilName = o => o.v || art(o.k).n;
const pruefKnoten = (o, p) => o.id + ":" + p;
const istAblass = (o, p) => !!VALVE[o.k] && istEntlueftung(p);

// Offene Anschlüsse: alles außer den Entlüftungen 3 und 5 eines Wegeventils braucht eine Leitung
export function offeneAnschluesse(d, netz){
  return d.o.flatMap(o => portsOf(o).filter(q => !istAblass(o, q.n) && !netz.has(pruefKnoten(o, q.n)))
    .map(q => ({stufe: "fehler", text: `${bauteilName(o)}: Anschluss ${q.n} ist offen.`, o: o.id, pt: [q.x, q.y]})));
}
// Druckluft an einer Entlüftung: Quelle oder Ausgang 2 der Wartungseinheit im selben Leitungsnetz wie 3 oder 5
export function versorgungAnAblass(d, netz){
  const versorgung = new Set(d.o.flatMap(o => o.k === "src" ? [pruefKnoten(o, "1")] : o.k === "frl" ? [pruefKnoten(o, "2")] : []));
  return d.o.flatMap(o => ["3", "5"].filter(p => istAblass(o, p) && (netz.get(pruefKnoten(o, p)) || []).some(n => versorgung.has(n)))
    .map(p => ({stufe: "fehler", o: o.id,
      text: `${bauteilName(o)}: Die Versorgung hängt an ${p}. Druckluft gehört an 1, 3 und 5 sind Entlüftungen.`})));
}
// Zylinder ohne Wegeventil: über Leitungen und Durchgangsbauteile (Drosseln, Rückschlagventile …) erreicht keiner seiner
// Anschlüsse ein Wegeventil
export function zylinderOhneVentil(d, netz){
  const byId = Object.fromEntries(d.o.map(o => [o.id, o]));
  const nachbarn = n => {
    const [id, p] = n.split(":"), o = byId[id], weiter = o && !VALVE[o.k] && !ANTRIEB_ARTEN.includes(o.k)
      ? portsOf(o).map(q => pruefKnoten(o, q.n)).filter(m => m !== n) : [];
    return [...(netz.get(n) || []), ...weiter];
  };
  const erreichtVentil = start => {
    const gesehen = new Set(), st = [start];
    while (st.length) {
      const n = st.pop();
      if (gesehen.has(n)) continue;
      gesehen.add(n);
      if (VALVE[byId[n.split(":")[0]].k]) return true;
      st.push(...nachbarn(n));
    }
    return false;
  };
  return d.o.filter(o => ANTRIEB_ARTEN.includes(o.k) && !portsOf(o).some(q => erreichtVentil(pruefKnoten(o, q.n))))
    .map(o => ({stufe: "fehler", text: `${bauteilName(o)}: Kein Wegeventil steuert diesen Antrieb.`, o: o.id}));
}
// Zuluftdrosselung beim doppeltwirkenden Antrieb: Anschluss 1 des Drosselrückschlagventils zeigt zum Zylinder
export function zuluftDrosselung(d, netz){
  const doppelt = new Set(d.o.filter(o => DOPPELT.includes(o.k)).flatMap(o => ["A", "B"].map(p => pruefKnoten(o, p))));
  return d.o.filter(o => o.k === "drv" && (netz.get(pruefKnoten(o, "1")) || []).some(n => doppelt.has(n)))
    .map(o => ({stufe: "hinweis", o: o.id, text: `${bauteilName(o)}: Zuluftdrosselung. Beim doppeltwirkenden Zylinder ist die `
      + `Abluftdrosselung üblich (2 zum Zylinder), sie fährt ruhiger.`}));
}
// Doppelte Kennzeichen von Bauteilen, Spulen und Sensoren
export function doppelteKennzeichen(d){
  const wer = new Map();
  d.o.forEach(o => ["v", "spl", "spr", "s1", "s2"].forEach(f => {
    if (o[f]) (wer.get(o[f]) || wer.set(o[f], []).get(o[f])).push(o);
  }));
  return [...wer].filter(([, os]) => os.length > 1)
    .map(([k, os]) => ({stufe: "fehler", text: `${k} kommt ${os.length}-mal vor.`, o: os[1].id}));
}
// Antriebe ohne Endlagensensoren (die SPS erfährt sonst nicht, wann die Bewegung fertig ist)
export function fehlendeSensoren(d){
  return d.o.filter(o => ANTRIEB_ARTEN.includes(o.k) && (!o.s1 || !o.s2)).map(o => ({stufe: "hinweis", o: o.id,
    text: `${bauteilName(o)}: Sensor für die ${!o.s1 ? "hintere" : "vordere"} Endlage fehlt. Ohne ihn weiß die SPS nicht, `
      + `wann die Bewegung fertig ist.`}));
}
export const PNEU_REGELN = [offeneAnschluesse, versorgungAnAblass, zylinderOhneVentil, zuluftDrosselung, doppelteKennzeichen,
  fehlendeSensoren];
// Haken pruefe der Vorlage Pneumatik
export function pneuPruefen(d){
  const netz = leitungsNetze(d);
  return PNEU_REGELN.flatMap(r => r(d, netz));
}
