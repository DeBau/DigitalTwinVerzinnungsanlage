// Vorlage GRAFCET nach DIN EN 60848: Schritte, Transitionen, Verzweigungen, Verweise und Aktionen.
// Die Bausteine bilden eine Ablaufkette (editor/kette.js). Aktionen (grafcet-aktion.js) sind Seitenbausteine: Sie hängen
// sich rechts an einen Schritt bzw. eine Transition oder unter bzw. hinter eine andere Aktion (Haken seite).
import { INK, SVGT, clamp, tw } from '../svg.js';
import { ED } from '../status.js';
import { BAUSTEIN, SAMPLE, fuelle, registriereGruppe, registriereVorlage } from '../registry.js';
import { G, TX, dots } from '../vorlagen-svg.js';
import { LINIE, platzhalter, setzeBreite } from '../bausteine.js';
import { textFeld } from '../eigenschaften.js';
import { AKTION, BEDINGUNG_KENNBUCHSTABEN, imSpiel, isStep } from './grafcet-aktion.js';
import { KETTEN_HAKEN, freieSchrittNummer, hinweisAnleitung } from './grafcet-kette.js';
import { schnipselNachSetzen } from './grafcet-schnipsel.js';
import { kettenKlick, kettenKnoepfeHTML, kettenTaste } from './grafcet-knoepfe.js';
import { pruefeGrafcet } from './grafcet-pruefen.js';
import { SPIEL_KNOPF, spielAnleitung, spielKlick, spielWechsel } from './grafcet-spiel.js';

/* ---------- Schritte, Transitionen, Verzweigungen ---------- */
export const QUADRAT = o => ({x: o.x, y: o.y, w: 40, h: 40});
export const naechsteSchrittNummer = () => freieSchrittNummer(ED.data);
export const SCHRITT = {
  umriss: QUADRAT,
  aus: o => [o.x+20, o.y+40],
  ein: o => [o.x+20, o.y],
  einrueck: 20,
  teilung: 30,   // fester Abstand unter dem Vorgänger, mit der Transition dazwischen Teilung 100
  neu(o, [px, py]){ o.x = px - 20; o.y = py - 20; o.v = naechsteSchrittNummer(); },
  verweisName: o => `Schritt ${o.v}`,
  feldliste: [["v", "Schrittnummer"], ["km", "Schrittkommentar (optional)", "z. B. Korb einhängen"]],
  beschriftung: {hinweis: "Schrittnummer"},
};
export const KASTEN = o => `<rect x="${o.x}" y="${o.y}" width="40" height="40" fill="#fff" ${LINIE}/>`;
// Schrittkommentar links neben dem Schritt in Anführungszeichen (DIN EN 60848)
export const KOMMENTAR = o => o.km ? SVGT(o.x-8, o.y+24, `„${o.km}“`, "end", 12, 400) : "";
// Beim Durchspielen trägt ein aktiver Schritt einen Punkt (Marke)
export const MARKE = (o, edit) => edit && imSpiel("aktiv", o.id) ? `<circle cx="${o.x+20}" cy="${o.y+31}" r="3" fill="${INK}"/>` : "";
export const zeichneSchritt = (o, edit) => KASTEN(o) + SVGT(o.x+20, o.y+25, o.v) + MARKE(o, edit) + KOMMENTAR(o);
export const zeichneAnfangsschritt = (o, edit) => KASTEN(o)
  + `<rect x="${o.x+4}" y="${o.y+4}" width="32" height="32" fill="none" ${LINIE}/>` + SVGT(o.x+20, o.y+25, o.v) + MARKE(o, edit)
  + KOMMENTAR(o);
export const zeichneMakro = (o, edit) => KASTEN(o) + `<path d="M${o.x} ${o.y+5}H${o.x+40}M${o.x} ${o.y+35}H${o.x+40}" ${LINIE}/>`
  + SVGT(o.x+20, o.y+25, o.v, "middle", 12) + MARKE(o, edit);
// Bei einer Abbruchstelle heißt die Transition nach dem Schritt davor bzw. danach
export function transitionName(o, objs, cs, dir){
  const c = cs.find(c => dir === "von" ? c.b === o.id && isStep(objs[c.a]) : c.a === o.id && isStep(objs[c.b]));
  if (c) return `Schritt ${(dir === "von" ? objs[c.a] : objs[c.b]).v}`;
  return o.v ? `Transition ${o.v}` : "Transition";
}
export const zeichneTransition = (o, edit) => `<path d="M${o.x-14} ${o.y}H${o.x+14}" `
  + `stroke="${edit && imSpiel("schaltbar", o.id) ? "#2F80ED" : INK}" stroke-width="3.2"/>`   // blau: schaltet beim Durchspielen
  + (o.nr ? SVGT(o.x-20, o.y+4, `(${o.nr})`, "end", 11, 400) : "")
  + (o.v ? SVGT(o.x+22, o.y+5, o.v, "start", 13, 400) : platzhalter(edit, "Bedingung", o.x+22, o.y+5, "start"));
export const verzweigungsBreite = o => o.w || 200;
export const VERZWEIGUNG = {
  aus: (o, tx) => [clamp(tx, o.x, o.x + verzweigungsBreite(o)), o.y],
  ein: (o, fx) => [clamp(fx, o.x, o.x + verzweigungsBreite(o)), o.y],
  einrueck: 100,
  teilung: 20,
  neu(o, [px, py], mk){ o.x = px - 100; o.y = py; o.w = 200; if (mk && mk.schnipsel) o.schnipsel = mk.schnipsel; },
  felder: o => textFeld("w", "Breite", undefined, verzweigungsBreite(o)),
  setze: setzeBreite,
  beschriftung: {
    hinweis: "Breite (Standard 200)",
    wert: o => String(verzweigungsBreite(o)),
    setze: (o, v) => setzeBreite(o, "w", v),
  },
};
export const verzweigungsLinie = (o, dy = 0) => `M${o.x} ${o.y+dy}H${o.x+verzweigungsBreite(o)}`;
export const zeichneVerweis = (o, edit) =>
  `<path d="M${o.x} ${o.y}V${o.y+30}M${o.x-5} ${o.y+23}L${o.x} ${o.y+31}L${o.x+5} ${o.y+23}" ${LINIE} fill="none"/>`
  + (o.v ? SVGT(o.x+9, o.y+29, o.v, "start", 12, 500) : platzhalter(edit, "Ziel, z. B. 1", o.x+9, o.y+29, "start"));

/* ---------- Anmeldung ---------- */
registriereVorlage("grafcet", {
  n: "GRAFCET", d: "Ablauf nach DIN EN 60848 mit Symbollegende", gruppen: ["grafcet"],
  body: (ex, page) => dots(20) + (page ? "" : GRAFCET_LEGENDE),
  anleitung: () => spielAnleitung() || hinweisAnleitung(),
  werkzeugleiste: {nachVerbinden: kettenKnoepfeHTML() + SPIEL_KNOPF},   // + Schritt, ausrichten, nummerieren, Durchspielen
  werkzeugWechsel: spielWechsel,
  zeiger: {unten: spielKlick},
  klick: kettenKlick,
  taste: kettenTaste,                 // Taste + wie „+ Schritt“ (Haken baut KERN)
  pruefe: pruefeGrafcet,              // Knopf „Prüfen“ (grafcet-pruefen.js)
});
export const LEGENDE_STRICH = `stroke="${G}" stroke-width="1.3"`;
export const GRAFCET_LEGENDE = [
  `<g><rect x="790" y="25" width="185" height="196" fill="#fff" stroke="${G}"/>${TX(800,43,10,"Symbole","start","#666",600)}`,
  `<rect x="800" y="54" width="22" height="22" fill="none" ${LEGENDE_STRICH}/>`
    + `<rect x="803" y="57" width="16" height="16" fill="none" ${LEGENDE_STRICH}/>${TX(832,69,10,"Anfangsschritt")}`,
  `<rect x="800" y="86" width="22" height="22" fill="none" ${LEGENDE_STRICH}/>${TX(832,101,10,"Schritt")}`,
  `<path d="M811 116V140M803 128H819" ${LEGENDE_STRICH}/>${TX(832,132,10,"Transition + Bedingung")}`,
  `<path d="M800 160H812" ${LEGENDE_STRICH}/><rect x="812" y="150" width="40" height="20" fill="none" ${LEGENDE_STRICH}/>`
    + `${TX(862,164,10,"Aktion")}`,
  `<path d="M811 180V206" ${LEGENDE_STRICH}/>${TX(832,197,10,"Wirkverbindung")}</g>`,
].join("\n        ");

registriereGruppe("grafcet", {
  name: "GRAFCET",
  hinweis: "Anfangsschritt setzen, dann mit „+ Schritt“ Transition und Schritt anhängen, oder Bausteine anklicken: Jeder "
    + "neue Baustein hängt sich unter den markierten, zwischen zwei Schritte kommt von selbst eine Transition. Aktionen hängen "
    + "sich rechts an den Schritt, eine weitere Aktion kommt darunter oder (Klick rechts daneben) dahinter. Für den Rücksprung "
    + "markierst du die letzte Transition, wählst Verbinden und klickst den Anfangsschritt an. Umschalt beim Ziehen nimmt den "
    + "Rest der Kette mit.",
  kette: true,
  ...KETTEN_HAKEN,                    // nachSetzen, vorVerbinden, loeschen, mitziehen (grafcet-kette.js)
  nachSetzen: schnipselNachSetzen,    // Verzweigungs-Schnipsel ausbauen, dann die Regeln der Kette
});

export const MAKRO = {
  einrueck: 0,   // Makroschritt richtet sich mit der linken Kante aus (wie bisher)
  feldliste: [["v", "Bezeichnung", "z. B. M1"]],
  beschriftung: {hinweis: "Bezeichnung, z. B. M1"},
  neu(o, [px, py]){ o.x = px - 20; o.y = py - 20; o.v = "M" + (ED.data.o.filter(q => q.k === "macro").length + 1); },
  zeichne: zeichneMakro,
};
export const TRANSITION = {
  zeichne: zeichneTransition,
  umriss: o => ({x: o.x-16, y: o.y-9, w: 32 + (o.v ? tw(o.v) + 12 : 70), h: 18}),
  mitte: o => [o.x, o.y],
  aus: o => [o.x, o.y], ein: o => [o.x, o.y],
  teilung: 30,
  verweisName: transitionName,
  kennbuchstaben: BEDINGUNG_KENNBUCHSTABEN,
  feldliste: [["v", "Übergangsbedingung", "z. B. BG1 · BG15, 5s/X3, ↑BG40"], ["nr", "Transitionsnummer (optional)", "z. B. 1"]],
  beschriftung: {sofort: true, ort: o => [o.x + 20, o.y], hinweis: "Bedingung, z. B. BG1 · BG40"},
};
export const VERWEIS = {
  zeichne: zeichneVerweis,
  umriss: o => ({x: o.x-10, y: o.y, w: 24 + tw(o.v || "Ziel"), h: 36}),
  aus: o => [o.x, o.y+30], ein: o => [o.x, o.y],
  neu(o, [px, py]){ o.x = px; o.y = py - 15; o.v = ""; },
  feldliste: [["v", "Ziel", "z. B. 1 oder Schritt 5"]],
  beschriftung: {sofort: true, hinweis: "Ziel, z. B. 1"},
};
fuelle(BAUSTEIN, {
  init: {g: "grafcet", n: "Anfangsschritt", ...SCHRITT, zeichne: zeichneAnfangsschritt},
  step: {g: "grafcet", n: "Schritt", ...SCHRITT, zeichne: zeichneSchritt},
  macro: {g: "grafcet", n: "Makroschritt", ...SCHRITT, ...MAKRO},
  trans: {g: "grafcet", n: "Transition", ...TRANSITION},
  action: {...AKTION, n: "Aktion kontinuierlich", mk: {t: "kont"}},
  actc: {g: "grafcet", n: "Aktion mit Zuweisungsbedingung", mk: {k: "action", t: "kont", b: "", hb: true}},
  acta: {g: "grafcet", n: "Aktion bei Aktivierung ↑", mk: {k: "action", t: "akt"}},
  actd: {g: "grafcet", n: "Aktion bei Deaktivierung ↓", mk: {k: "action", t: "deakt"}},
  acte: {g: "grafcet", n: "Aktion bei Ereignis", mk: {k: "action", t: "ereig", b: ""}},
  actz: {g: "grafcet", n: "Zwangssteuerung", mk: {k: "action", t: "zwang"}},
  actionq: {...AKTION, n: "Aktion S7-GRAPH (IEC 61131-3)", mk: {k: "action", t: "q", q: "S"}},
  alt: {g: "grafcet", n: "ODER-Verzweigung", ...VERZWEIGUNG,
    zeichne: o => `<path d="${verzweigungsLinie(o)}" stroke="${INK}" stroke-width="1.6"/>`,
    umriss: o => ({x: o.x, y: o.y-5, w: verzweigungsBreite(o), h: 10})},
  par: {g: "grafcet", n: "UND-Verzweigung", ...VERZWEIGUNG,
    zeichne: o => `<path d="${verzweigungsLinie(o)}${verzweigungsLinie(o, 5)}" stroke="${INK}" stroke-width="1.6"/>`,
    aus: (o, tx) => [clamp(tx, o.x, o.x + verzweigungsBreite(o)), o.y+5],
    umriss: o => ({x: o.x, y: o.y-5, w: verzweigungsBreite(o), h: 15})},
  oder2: {g: "grafcet", n: "ODER mit 2 Zweigen", mk: {k: "alt", schnipsel: "oder"}},
  und2: {g: "grafcet", n: "UND mit 2 Zweigen", mk: {k: "par", schnipsel: "und"}},
  ref: {g: "grafcet", n: "Verweis / Sprung", ...VERWEIS},
});
export const SAMPLE_LINIE = d => `<path d="${d}" stroke="${INK}" stroke-width="1.6"/>`;
fuelle(SAMPLE, {
  init: [{k:"init", x:4, y:4, v:"1"}, "0 0 48 48"], step: [{k:"step", x:4, y:4, v:"2"}, "0 0 48 48"],
  trans: [{k:"trans", x:24, y:24}, "0 0 48 48", SAMPLE_LINIE("M24 4V44")],
  macro: [{k:"macro", x:4, y:4, v:"M1"}, "0 0 48 48"], ref: [{k:"ref", x:16, y:8, v:"1"}, "0 0 48 48"],
  action: [{k:"action", t:"kont", x:4, y:9, v:"MB1"}, "0 0 98 48"],
  actionq: [{k:"action", t:"q", x:4, y:9, q:"S", v:"MB9"}, "0 0 98 48"],
  actz: [{k:"action", t:"zwang", x:4, y:9, v:"G2{INIT}"}, "0 0 98 48"],
  actc: [{k:"action", t:"kont", x:4, y:22, v:"MB1", b:"BG9"}, "0 0 98 56"],
  acta: [{k:"action", t:"akt", x:4, y:22, v:"Z := 0"}, "0 0 98 56"],
  actd: [{k:"action", t:"deakt", x:4, y:22, v:"Z := 0"}, "0 0 98 56"],
  acte: [{k:"action", t:"ereig", x:4, y:22, v:"Z := Z+1", b:"↑BG1"}, "0 0 98 56"],
  alt: [{k:"alt", x:8, y:24, w:72}, "0 0 88 48", SAMPLE_LINIE("M44 4V24M18 24V44M70 24V44")],
  par: [{k:"par", x:8, y:22, w:72}, "0 0 88 48", SAMPLE_LINIE("M44 4V22M18 27V44M70 27V44")],
  oder2: [{k:"alt", x:8, y:14, w:72}, "0 0 88 64",
    SAMPLE_LINIE("M44 2V14M18 14V52M70 14V52M8 52H80M44 52V62") + SAMPLE_LINIE("M12 24H24M64 24H76M12 42H24M64 42H76")],
  und2: [{k:"par", x:8, y:12, w:72}, "0 0 88 64",
    SAMPLE_LINIE("M44 2V12M18 17V48M70 17V48M8 48H80M8 53H80M44 53V62")
    + `<path d="M10 26h16v12h-16zM62 26h16v12h-16z" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`],
});
