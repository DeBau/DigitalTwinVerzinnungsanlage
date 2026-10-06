/* Listen des Schaltplans: Inhaltsverzeichnis, Klemmenplan, Betriebsmittelliste, SPS-Zuordnungsliste.
   Jede Liste beschreibt ihre Spalten und erzeugt ihre Zeilen aus Modell und Querverweis-Index.
   Eine Zelle ist Text oder {ref: "12.3"} für einen anklickbaren Querverweis. */
import { fundstellen } from './querverweise.js';

const ref = e => e ? {ref: `${e.seite}.${e.spalte}`} : "";
const natuerlich = (a, b) => a.localeCompare(b, "de", {numeric: true});

/* ---------- Zeilen ---------- */
function klemmZeilen(ctx){
  const {modell, lesen} = ctx, zeilen = [];
  for (const k of modell.kanaele) {
    if (!k.klemme) continue;
    zeilen.push([k.klemme, `${k.bmk} ${k.an || ""}`.trim(), `−KF1 %${k.adr}`, k.signal, ref(fundstellen(lesen, k.klemme)[0])]);
  }
  const wege = new Map();   // Verbraucher → alle Abgänge, über die er läuft (Schütz oder Umrichter)
  for (const a of modell.leistung) {
    const ziel = a.glieder[a.glieder.length - 1].bmk;
    if (!wege.has(ziel)) wege.set(ziel, {klemmen: a.klemmen, titel: []});
    wege.get(ziel).titel.push(a.titel);
  }
  for (const [ziel, w] of wege) {
    ["U", "V", "W", "PE"].forEach((leiter, i) => zeilen.push([`−X1:${w.klemmen[i]}`, `${ziel} ${leiter}`, w.titel.join(" oder "), "",
      ref(fundstellen(lesen, ziel)[0])]));
  }
  return zeilen.sort((a, b) => natuerlich(a[0], b[0]));
}

function bmZeilen(ctx){
  const liste = [...ctx.modell.geraete.values()].sort((a, b) => natuerlich(a.bmk, b.bmk));
  return liste.map(g => {
    const orte = fundstellen(ctx.lesen, g.bmk).slice(0, 5).map(ref);
    return [g.bmk, g.text + (g.annahme ? " (angenommen)" : ""), g.ort, ...orte];
  });
}

function signalZeilen(ctx){
  const alle = [...ctx.modell.kanaele, ...ctx.modell.profinet];
  return alle.map(k => [`%${k.adr}`, k.signal, k.bmk, k.info ? k.info.k : "", ref(ctx.lesen.signale.get(k.signal))]);
}

const inhaltZeilen = ctx => ctx.seiten.map(s => [String(s.nr), s.titel, s.art, {ref: `${s.nr}.0`}]);

/* ---------- Tabelle der Listen ---------- */
export const TABELLEN = {
  inhalt: {titel: "Inhaltsverzeichnis", jeSeite: 30, anzahl: () => 0, zeilen: inhaltZeilen,
    spalten: [["Seite", 80], ["Inhalt", 640], ["Art", 260], ["", 128]]},
  klemmen: {titel: "Klemmenplan −X1, −X3, −X4, −X5", jeSeite: 30, zeilen: klemmZeilen,
    anzahl: m => m.kanaele.filter(k => k.klemme).length + new Set(m.leistung.map(a => a.glieder[a.glieder.length - 1].bmk)).size * 4,
    spalten: [["Klemme", 130], ["Feld (Gerät, Anschluss)", 230], ["Schrank (Ziel)", 260], ["Signal", 360], ["Seite", 128]]},
  betriebsmittel: {titel: "Betriebsmittelliste", jeSeite: 30, zeilen: bmZeilen, anzahl: m => m.geraete.size,
    spalten: [["Kennzeichen", 110], ["Beschreibung", 560], ["Ort", 70], ["Fundstellen", 74], ["", 74], ["", 74], ["", 74], ["", 72]]},
  signale: {titel: "SPS-Zuordnungsliste", jeSeite: 30, zeilen: signalZeilen,
    anzahl: m => m.kanaele.length + m.profinet.length,
    spalten: [["Adresse", 90], ["Symbolname", 230], ["Kennzeichen", 100], ["Kommentar", 560], ["Seite", 128]]},
};

