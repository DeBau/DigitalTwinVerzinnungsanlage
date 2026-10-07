// Knopf „Prüfen“ für Stromlaufplan und Hauptstromkreis (Haken pruefe der Vorlagen, editor/pruefung.js zeigt die Befunde).
// Regeln: offene Anschlüsse im Strompfad, doppelte Spulen-Kennzeichen, Kontakt ohne Spule, einseitige Verriegelung
// einer Wendeschaltung, Spule hinter dem eigenen Öffner, Kurzschluss von L+ nach M ohne Verbraucher (bei wenigen
// Bedienteilen und Spulen jede Kombination); im Hauptstromkreis Motor ohne PE. Wendeschaltung (zwei Schütze auf
// einem Motor): Phasen getauscht? Im Stromlaufplan derselben Übung überhaupt verriegelt?
import { S } from '../../app/basis.js';
import { PH } from '../svg.js';
import { art } from '../registry.js';
import { portsOf, virtuelleSchienen } from '../bauteile.js';
import { kettenLeitung, pageCount } from '../zeichnen.js';
import { skKey } from '../blaetter.js';
import { anschlussAnzeige, spulenVon } from './elektro-kennzeichen.js';
import { autoLeitungen, breiteVon, imPfad, pfadNummer } from './elektro-pfade.js';
import { BEDIENUNG, VERBRAUCHER, kennung, knoten, netzAus, neuesNetz, objekteVon } from './elektro-simulation.js';

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
// Liegt o im Strompfad (gleiche Spalte, gleiches Blatt) der Spule sp? Pfadbreite der Zeichnung d
const imPfadVon = (d, sp, o) => pfadNummer(o.x, breiteVon(d.meta)) === pfadNummer(sp.x, breiteVon(d.meta))
  && Math.floor(o.y / PH) === Math.floor(sp.y / PH);
// Öffner mit dem Kennzeichen von gegen im Strompfad der Spule sp
const verriegelt = (d, sp, gegen) => (d.o || []).some(o => o.k === "nc" && o.v === gegen.v && imPfadVon(d, sp, o));
// Wendeschaltung: Verriegelt eine Spule die andere, muss die andere sie auch verriegeln
export function einseitigeVerriegelung(d){
  const sp = spulenVon(d).filter(o => o.v);
  return sp.flatMap(a => sp.filter(b => b !== a && verriegelt(d, a, b) && !verriegelt(d, b, a))
    .map(b => fehler(`${a.v} ist durch einen Öffner von ${b.v} verriegelt, ${b.v} aber nicht durch einen Öffner von `
      + `${a.v}. Eine Wendeschaltung braucht die gegenseitige Verriegelung.`, b)));
}
// Spule hinter dem eigenen Öffner: Zieht sie an, schaltet sie sich selbst ab und flattert
export function eigenerOeffner(d){
  return spulenVon(d).filter(sp => sp.v && verriegelt(d, sp, sp))
    .map(sp => fehler(`Spule ${sp.v} liegt hinter ihrem eigenen Öffner ${sp.v}: Zieht sie an, schaltet sie sich `
      + `selbst wieder ab und flattert.`, sp));
}
// Was im Stromlaufplan schaltet: Bedienteile (Kennung) und Spulen samt Sicherheitsrelais (Kennzeichen)
const schaltendeNamen = d => [...new Set([...(d.o || []).filter(o => BEDIENUNG[o.k]).map(kennung),
  ...(d.o || []).filter(o => VERBRAUCHER.includes(o.k) || o.k === "sr").map(o => o.v).filter(Boolean)])];
// Kurzschluss: L+ und M ohne Verbraucher verbunden. Bis KOMBINATIONEN_BIS schaltende Namen jede Kombination, sonst
// nur Ruhe und alles betätigt. Gemeldet wird die kleinste Kombination.
export const KOMBINATIONEN_BIS = 8;
export function kurzschluss(d){
  const objs = objekteVon(d), cs = d.c || [], namen = schaltendeNamen(d);
  const kurz = an => {
    const n = netzAus(d, cs, objs, o => ({betaetigt: an.has(kennung(o)), an: an.has(o.v)}));
    return n.f("pot:L+") === n.f("pot:M");
  };
  const alle = 2 ** namen.length - 1, bits = m => namen.filter((_, i) => (m >> i) & 1);
  const masken = namen.length <= KOMBINATIONEN_BIS ? Array.from({length: alle + 1}, (_, m) => m) : [0, alle];
  const k = masken.map(bits).sort((a, b) => a.length - b.length).find(an => kurz(new Set(an)));
  if (!k) return [];
  return [fehler(`Kurzschluss: L+ ist ${k.length ? `mit ${k.join(", ")} betätigt bzw. angezogen` : "schon in Ruhe"} `
    + `ohne Verbraucher mit M verbunden.`)];
}
export const pruefeStromlauf = (d, {scope} = {}) => [...kurzschluss(d), ...doppelteSpulen(d), ...kontakteOhneSpule(d),
  ...einseitigeVerriegelung(d), ...eigenerOeffner(d), ...ohneVerriegelung(skizze(scope, "leistung", d), d, "stromlauf"),
  ...offeneAnschluesse(d)];

/* ---------- Hauptstromkreis ---------- */
export function motorOhnePE(d){
  const pe = new Set((d.c || []).flatMap(c => [c.a + ":" + c.pa, c.b + ":" + c.pb]));
  return (d.o || []).filter(o => o.k === "m3" && !pe.has(o.id + ":PE"))
    .map(o => fehler(`Motor ${wer(o)}: Der Schutzleiter PE ist nicht angeschlossen.`, o));
}
const imHauptstromkreis = o => art(o.k).g === "leistung" && !art(o.k).schiene;
export const pruefeLeistung = (d, {scope} = {}) => [...motorOhnePE(d), ...ohnePhasentausch(d),
  ...ohneVerriegelung(d, skizze(scope, "stromlauf", d), "leistung"),
  ...offeneAnschluesse(d, (d.o || []).filter(imHauptstromkreis))];

/* ---------- Wendeschaltung: zwei Schütze auf einem Motor ---------- */
// Die andere Skizze derselben Übung (gespeichert); ohne sie die Zeichnung selbst
const skizze = (scope, key, d) => (scope && S.get(skKey(scope, key))) || d;
const PHASEN = ["L1", "L2", "L3"], KLEMMEN = ["U1", "V1", "W1"], DURCHGANG = ["ls3", "ms3", "qs3"];
// Pole oben und unten eines dreipoligen Bauteils (gleich für Schütz und Schutzschalter)
const pole = () => art("k3").pole;
// Netz des Hauptstromkreises: Leitungen und die Pole der Schutz- und Hauptschalter. Schütze bleiben offen.
function leistungsNetz(d){
  const objs = Object.fromEntries((d.o || []).map(o => [o.id, o])), netz = neuesNetz();
  virtuelleSchienen("leistung", pageCount("leistung", d)).forEach(r => { objs[r.id] = r; });
  (d.c || []).filter(c => objs[c.a] && objs[c.b] && c.pa !== undefined)
    .forEach(c => netz.u(knoten(objs[c.a], c.pa), knoten(objs[c.b], c.pb)));
  const [oben, unten] = pole();
  (d.o || []).filter(o => DURCHGANG.includes(o.k)).forEach(o => oben.forEach((p, j) => netz.u(knoten(o, p), knoten(o, unten[j]))));
  return netz;
}
// Phasen an U1, V1, W1 des Motors m über das Schütz k, z. B. ["L1", "L2", "L3"]; null, wenn k nicht ganz daran hängt
function phasenfolge(netz, k, m){
  const gleich = (a, b) => netz.f(a) === netz.f(b), [oben, unten] = pole();
  const folge = KLEMMEN.map(kl => {
    const j = unten.findIndex(p => gleich(knoten(k, p), knoten(m, kl)));
    return j < 0 ? null : PHASEN.find(ph => gleich("pot:" + ph, knoten(k, oben[j])));
  });
  return folge.every(Boolean) ? folge : null;
}
// Drehrichtung als gerade (0) oder ungerade (1) Vertauschung: zwei getauschte Phasen kehren sie um
const drehsinn = folge => folge.reduce((n, p, i) => n + folge.slice(i + 1).filter(q => q < p).length, 0) % 2;
// Paare [k1, k2, m, folge1, folge2] von Schützen, die denselben Motor m mit allen drei Phasen speisen
export function wendepaare(d){
  const netz = leistungsNetz(d), schuetze = (d.o || []).filter(o => o.k === "k3" && o.v), r = [];
  (d.o || []).filter(o => o.k === "m3").forEach(m => {
    const an = schuetze.map(k => [k, phasenfolge(netz, k, m)]).filter(([, f]) => f);
    an.forEach(([k1, f1], i) => an.slice(i + 1).forEach(([k2, f2]) => r.push([k1, k2, m, f1, f2])));
  });
  return r;
}
export function ohnePhasentausch(d){
  return wendepaare(d).filter(([, , , f1, f2]) => drehsinn(f1) === drehsinn(f2))
    .map(([k1, k2, m]) => fehler(`${k1.v} und ${k2.v} lassen ${wer(m)} gleich herum drehen. Tausch beim zweiten `
      + `Schütz zwei Phasen, z. B. L1 und L3.`, k2));
}
// Wendeschaltung ganz ohne Verriegelung im Stromlaufplan: Ziehen beide Schütze an, gibt es einen Kurzschluss.
// leistung, strom: die beiden Zeichnungen; markiert wird in der geöffneten (hier: "leistung" oder "stromlauf")
export function ohneVerriegelung(leistung, strom, hier){
  const spule = v => spulenVon(strom).find(o => o.v === v);
  return wendepaare(leistung).filter(([k1, k2]) => spule(k1.v) && spule(k2.v)
    && !verriegelt(strom, spule(k1.v), k2) && !verriegelt(strom, spule(k2.v), k1))
    .map(([k1, k2]) => fehler(`Wendeschaltung ${k1.v} und ${k2.v} ohne Verriegelung: Vor jede Spule gehört ein Öffner `
      + `des anderen Schützes. Sonst ziehen beide an und schließen zwei Phasen kurz.`, hier === "leistung" ? k2 : spule(k2.v)));
}
