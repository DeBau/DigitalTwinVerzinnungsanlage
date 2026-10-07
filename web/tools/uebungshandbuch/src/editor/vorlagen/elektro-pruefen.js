// Knopf „Prüfen“ für Stromlaufplan und Hauptstromkreis (Haken pruefe der Vorlagen, editor/pruefung.js zeigt die Befunde).
// Regeln: offene Anschlüsse im Strompfad, doppelte Spulen-Kennzeichen, Kontakt ohne Spule, einseitige Verriegelung
// einer Wendeschaltung, Kurzschluss von L+ nach M ohne Verbraucher; im Hauptstromkreis Motor ohne PE.
import { PH } from '../svg.js';
import { art } from '../registry.js';
import { portsOf } from '../bauteile.js';
import { kettenLeitung } from '../zeichnen.js';
import { anschlussAnzeige, spulenVon } from './elektro-kennzeichen.js';
import { autoLeitungen, imPfad, pfadNummer } from './elektro-pfade.js';
import { netzAus, objekteVon } from './elektro-simulation.js';

const fehler = (text, o) => ({stufe: "fehler", text, o: o && o.id});
const hinweis = (text, o) => ({stufe: "hinweis", text, o: o && o.id});
const wer = o => o.v || art(o.k).n;

// Anschlüsse, an denen eine Leitung, eine Kettenverbindung oder eine automatische Leitung hängt: Set "id:Anschluss"
export function belegteAnschluesse(d){
  const cs = d.c || [], objs = objekteVon(d), r = new Set();
  cs.forEach(c => {
    if (c.pa !== undefined || c.pb !== undefined) { r.add(c.a + ":" + c.pa); r.add(c.b + ":" + c.pb); return; }
    const e = kettenLeitung(c, objs);
    if (e) { r.add(c.a + ":" + e[0].n); r.add(c.b + ":" + e[1].n); }
  });
  autoLeitungen(d, cs).forEach(({o, p}) => r.add(o.id + ":" + p.n));
  return r;
}
// Glieder im Strompfad mit offenem Anschluss (der Schaltausgang BK des Sensors darf offen bleiben)
export function offeneAnschluesse(d, glieder = (d.o || []).filter(imPfad)){
  const belegt = belegteAnschluesse(d);
  return glieder.flatMap(o => portsOf(o).filter(p => !belegt.has(o.id + ":" + p.n) && p.n !== "BK")
    .map(p => hinweis(`${wer(o)}: Anschluss ${anschlussAnzeige(o, p.n)} ist offen.`, o)));
}
export function doppelteSpulen(d){
  const gesehen = new Set();
  return spulenVon(d).filter(o => o.v && (gesehen.has(o.v) || !gesehen.add(o.v)))
    .map(o => fehler(`Das Kennzeichen ${o.v} haben mehrere Spulen. Jede Spule braucht ein eigenes Kennzeichen.`, o));
}
export function kontakteOhneSpule(d){
  const da = new Set(spulenVon(d).map(o => o.v));
  return (d.o || []).filter(o => (o.k === "no" || o.k === "nc") && !da.has(o.v))
    .map(o => fehler(`Kontakt ${wer(o)}: Es gibt keine Spule mit diesem Kennzeichen.`, o));
}
// Öffner eines fremden Kennzeichens im Strompfad (gleiche Spalte, gleiches Blatt) einer Spule
const imPfadVon = (sp, o) => pfadNummer(o.x) === pfadNummer(sp.x) && Math.floor(o.y / PH) === Math.floor(sp.y / PH);
const verriegelt = (d, sp, gegen) => (d.o || []).some(o => o.k === "nc" && o.v === gegen.v && imPfadVon(sp, o));
// Wendeschaltung: Verriegelt eine Spule die andere, muss die andere sie auch verriegeln
export function einseitigeVerriegelung(d){
  const sp = spulenVon(d).filter(o => o.v);
  return sp.flatMap(a => sp.filter(b => b !== a && verriegelt(d, a, b) && !verriegelt(d, b, a))
    .map(b => fehler(`${a.v} ist durch einen Öffner von ${b.v} verriegelt, ${b.v} aber nicht durch einen Öffner von `
      + `${a.v}. Eine Wendeschaltung braucht die gegenseitige Verriegelung.`, b)));
}
// Kurzschluss: L+ und M ohne Verbraucher verbunden, in Ruhe oder mit allem betätigt (alle Taster, alle Spulen an)
export function kurzschluss(d){
  const objs = objekteVon(d), cs = d.c || [];
  const kurz = z => { const n = netzAus(d, cs, objs, () => z); return n.f("pot:L+") === n.f("pot:M"); };
  const ruhe = kurz({betaetigt: false, an: false}), alles = kurz({betaetigt: true, an: true});
  return ruhe || alles ? [fehler(`Kurzschluss: L+ ist ${ruhe ? "schon in Ruhe" : "beim Betätigen"} ohne Verbraucher mit M `
    + `verbunden.`)] : [];
}
export const pruefeStromlauf = d => [...kurzschluss(d), ...doppelteSpulen(d), ...kontakteOhneSpule(d),
  ...einseitigeVerriegelung(d), ...offeneAnschluesse(d)];

/* ---------- Hauptstromkreis ---------- */
export function motorOhnePE(d){
  const pe = new Set((d.c || []).flatMap(c => [c.a + ":" + c.pa, c.b + ":" + c.pb]));
  return (d.o || []).filter(o => o.k === "m3" && !pe.has(o.id + ":PE"))
    .map(o => fehler(`Motor ${wer(o)}: Der Schutzleiter PE ist nicht angeschlossen.`, o));
}
const imHauptstromkreis = o => art(o.k).g === "leistung" && !art(o.k).schiene;
export const pruefeLeistung = d => [...motorOhnePE(d), ...offeneAnschluesse(d, (d.o || []).filter(imHauptstromkreis))];
