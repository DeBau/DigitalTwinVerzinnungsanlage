/* Listen des Schaltplans: Inhaltsverzeichnis, Klemmenplan, Betriebsmittelliste, SPS-Zuordnungsliste.
   Jede Liste beschreibt ihre Spalten und erzeugt ihre Zeilen aus Modell und Querverweis-Index.
   Eine Zelle ist Text oder {ref: "12.3"} für einen anklickbaren Querverweis. */
import { fundstellen } from './querverweise.js';

const ref = e => e ? {ref: `${e.seite}.${e.spalte}`} : "";
const natuerlich = (a, b) => a.localeCompare(b, "de", {numeric: true});
const MAX_FUNDSTELLEN = 4;

/* ---------- Zeilen ---------- */
// Klemmenplan direkt aus der Liste, in der modell.js jede Klemme vergeben hat
function klemmZeilen(ctx){
  const {modell, lesen} = ctx;
  const sortiert = [...modell.klemmen].sort((a, b) => natuerlich(a.klemme, b.klemme));
  return sortiert.map(z => [z.klemme, z.feld, z.schrank, z.signal,
    ref(fundstellen(lesen, z.klemme)[0] || fundstellen(lesen, z.ziel)[0])]);
}

// Fundstellen ohne Doppelte (gleiche Seite und Spalte), höchstens vier, sonst "…"
function fundstellenZellen(lesen, bmk){
  const gesehen = new Set(), alle = fundstellen(lesen, bmk).filter(e => {
    const schluessel = `${e.seite}.${e.spalte}`;
    return !gesehen.has(schluessel) && gesehen.add(schluessel);
  });
  const zellen = alle.slice(0, MAX_FUNDSTELLEN).map(ref);
  return alle.length > MAX_FUNDSTELLEN ? [...zellen, "…"] : zellen;
}

function bmZeilen(ctx){
  const liste = [...ctx.modell.geraete.values()].sort((a, b) => natuerlich(a.bmk, b.bmk));
  return liste.map(g => [g.bmk, g.text + (g.annahme ? " (angenommen)" : ""), g.typ, g.ort, ...fundstellenZellen(ctx.lesen, g.bmk)]);
}

function signalZeilen(ctx){
  const alle = [...ctx.modell.kanaele, ...ctx.modell.profinet];
  return alle.map(k => [`%${k.adr}`, k.signal, k.bmk, k.info ? k.info.k : "", ref(ctx.lesen.signale.get(k.signal))]);
}

const inhaltZeilen = ctx => ctx.seiten.map(s => [String(s.nr), s.titel, s.art, {ref: `${s.nr}.0`}]);

/* ---------- Tabelle der Listen ---------- */
export const TABELLEN = {
  inhalt: {titel: "Inhaltsverzeichnis", jeSeite: 30, anzahl: () => 0, zeilen: inhaltZeilen,
    spalten: [["Seite", 80], ["Inhalt", 640], ["Art", 260], ["Sprung", 128]]},
  klemmen: {titel: "Klemmenplan −X1, −X3, −X4, −X5", jeSeite: 30, zeilen: klemmZeilen, anzahl: m => m.klemmen.length,
    spalten: [["Klemme", 100], ["Feld (Gerät, Anschluss)", 240], ["Schrank (Ziel)", 270], ["Signal", 360], ["Seite", 138]]},
  betriebsmittel: {titel: "Betriebsmittelliste", jeSeite: 30, zeilen: bmZeilen, anzahl: m => m.geraete.size,
    spalten: [["Kennzeichen", 100], ["Beschreibung", 420], ["Typ", 170], ["Ort", 60],
      ["Fundstellen", 72], ["", 72], ["", 72], ["", 72], ["", 70]]},
  signale: {titel: "SPS-Zuordnungsliste", jeSeite: 30, zeilen: signalZeilen,
    anzahl: m => m.kanaele.length + m.profinet.length,
    spalten: [["Adresse", 90], ["Symbolname", 230], ["Kennzeichen", 100], ["Kommentar", 560], ["Seite", 128]]},
};
