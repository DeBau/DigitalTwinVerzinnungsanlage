// Vorlage Regelkreis: Knopf "Prüfen" (Haken pruefe). Die Regeln prüfen den Aufbau, nicht die Werte: Summierstelle mit
// + und −, Strecke, Rückführung, geschlossener Kreis, dazu Hinweise zu Blöcken ohne Ein- oder Ausgang.
// Befund: {stufe: "fehler" | "hinweis", text, o?, c?} (editor/pruefung.js).
import { mitteVon } from '../bausteine.js';
import { GLIED, istRegler } from './regelkreis-glieder.js';
import { vorzeichen } from './regelkreis-bausteine.js';
import { eintrittsSeite } from './regelkreis-wege.js';

export const STRECKENTYPEN = ["PT1", "PT2", "Tt", "I"];
export const istStrecke = o => o.k === "box" && (STRECKENTYPEN.includes(o.typ) || /strecke/i.test(o.v || ""));
export const VZ_FELD = {l: "vl", u: "vo", d: "vu"};   // Eintrittsseite der Summierstelle → Feld mit dem Vorzeichen
export const rkFehler = (text, ort = {}) => ({stufe: "fehler", text, ...ort});
export const rkHinweis = (text, ort = {}) => ({stufe: "hinweis", text, ...ort});

// Pfeile (ohne Leitungen) mit Index, Quelle und Ziel
export function pfeileVon(d){
  const objs = Object.fromEntries(d.o.map(o => [o.id, o]));
  return d.c.map((c, i) => ({c, i, A: objs[c.a], B: objs[c.b]})).filter(p => p.A && p.B && p.c.pa === undefined);
}
// Vorzeichen, mit dem der Pfeil p in die Summierstelle läuft
export const eingangsVorzeichen = p => vorzeichen(p.B, VZ_FELD[eintrittsSeite(p.B, mitteVon(p.A))]);
// Läuft der Signalfluss von start aus wieder zu start zurück?
export function kreisGeschlossen(start, pfeile){
  const gesehen = new Set(), offen = [start.id];
  while (offen.length) {
    const id = offen.pop();
    for (const p of pfeile.filter(q => q.A.id === id)) {
      if (p.B.id === start.id) return true;
      if (!gesehen.has(p.B.id)) { gesehen.add(p.B.id); offen.push(p.B.id); }
    }
  }
  return false;
}
// Regeln je Summierstelle: Vorzeichen an jedem Eingang, + und −, geschlossener Kreis
export function pruefeSummierstelle(s, pfeile){
  const ein = pfeile.filter(p => p.B === s), zeichen = ein.map(eingangsVorzeichen), b = [];
  ein.forEach((p, j) => {
    if (!zeichen[j]) b.push(rkFehler("Dieser Pfeil läuft ohne Vorzeichen in die Summierstelle. Stell + oder − ein.", {c: p.i}));
  });
  if (!zeichen.includes("+")) b.push(rkFehler("Die Summierstelle braucht ein + am Sollwert w.", {o: s.id}));
  if (!zeichen.includes("−")) {
    b.push(rkFehler("Es fehlt die Rückführung: Der Istwert x muss mit − zur Summierstelle zurück.", {o: s.id}));
  }
  if (!kreisGeschlossen(s, pfeile)) {
    b.push(rkFehler("Der Kreis ist nicht geschlossen: Von der Summierstelle führt kein Weg über die Pfeile zurück.", {o: s.id}));
  }
  return b;
}
// Hinweise zu Blöcken ohne Eingang oder ohne Ausgang
export function pruefeBloecke(d, pfeile){
  return d.o.filter(o => o.k === "box").flatMap(o => {
    const rein = pfeile.some(p => p.B === o), raus = pfeile.some(p => p.A === o);
    if (rein && raus) return [];
    const name = o.v || (GLIED[o.typ] || [""])[0], wer = name ? `Der Block „${name}“` : "Ein Block";
    return [rkHinweis(`${wer} hat ${rein ? "keinen Ausgang" : "keinen Eingang"}.`, {o: o.id})];
  });
}
// Haken pruefe der Vorlage
export function pruefeRegelkreis(d){
  if (!d.o.length) return [rkHinweis("Noch keine Bausteine. Mit „Muster übernehmen“ bekommst du einen Regelkreis zum Anpassen.")];
  const pfeile = pfeileVon(d), summen = d.o.filter(o => o.k === "sum"), b = [];
  if (!summen.length) b.push(rkFehler("Es fehlt die Summierstelle. Dort vergleicht der Regler Sollwert und Istwert: e = w − x."));
  summen.forEach(s => b.push(...pruefeSummierstelle(s, pfeile)));
  if (!d.o.some(istStrecke)) b.push(rkFehler("Es fehlt die Strecke: ein Block „Strecke“ oder ein PT1-, PT2-, I- oder Totzeitglied."));
  if (!d.o.some(istRegler)) b.push(rkHinweis("Kein Block ist als Regler zu erkennen. Nenn ihn „Regler“ oder nimm ein Reglerglied."));
  return [...b, ...pruefeBloecke(d, pfeile)];
}
