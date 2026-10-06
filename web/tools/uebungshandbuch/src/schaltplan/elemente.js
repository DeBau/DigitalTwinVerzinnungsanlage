/* Ein Glied (Schaltzeichen mit Kennzeichen) setzen: Zeichen zeichnen, Kennzeichen beschriften, im Index merken,
   Querverweis auf den Hauptort und die Markierung "angenommen" anfügen. Genutzt von Pfad- und Leistungsseiten. */
import { ANNAHME, BLAU, GRAU, SCHMAL, maskiere, text } from '../symbole/grund.js';
import { zeichen } from '../symbole/iec60617.js';
import { spalteVon } from './blatt.js';
import { merke, verweisZu } from './querverweise.js';

// Querverweis als anklickbarer Text "/12.3"
export function verweis(x, y, ziel, a = "end"){
  if (!ziel) return "";
  return text(x, y, ziel, {a, g: 8, f: BLAU, k: "sp-ref", attr: `data-ref="${ziel.slice(1)}"`});
}

export const annahme = (x, y, a = "end") => text(x, y, "angenommen", {a, g: 6.5, f: ANNAHME, attr: 'font-style="italic"'});

// Kennzeichen mit Verweis und Markierung; opt.zeichenX = Mittellinie des Zeichens (bestimmt die eigene Spalte)
export function beschriftung(ctx, bmk, x, y, opt = {}){
  const {a = "end", annahme: angenommen = false, zeichenX = x} = opt, hier = {seite: ctx.seite.nr, spalte: spalteVon(zeichenX)};
  const ziel = verweisZu(ctx.lesen, bmk.split(":")[0], hier);
  return `<g class="sp-bmk" data-bmk="${maskiere(bmk.split(":")[0])}">`
    + text(x, y, bmk, {a, g: 10, w: 600, schrift: SCHMAL}) + "</g>"
    + verweis(x, y + 10, ziel, a) + (angenommen ? annahme(x, y + (ziel ? 19 : 10), a) : "");
}

const anschluesse = (g, sym) => g.an ? String(g.an).split("/") : (sym.an || []);

// Glied auf der Mittellinie x ab Höhe y setzen; liefert {svg, h, sym}
export function setze(ctx, g, x, y){
  const {sym, schluessel, variante} = zeichen(g.sym);
  if (!sym) return {svg: text(x, y + 20, `? ${g.sym}`, {a: "middle", g: 9, f: "#B3261E"}), h: 30, sym: {}};
  const an = g.nummern || anschluesse(g, sym);
  const hier = {seite: ctx.seite.nr, spalte: spalteVon(x)};
  merke(ctx.schreiben, g.bmk.split(":")[0], {...hier, rolle: sym.rolle, an: g.anText || g.an || an.join("/"), sym: schluessel});
  if (sym.rolle === "klemme") merke(ctx.schreiben, g.bmk, {...hier, rolle: "klemme"});
  const bild = sym.zeichne(x, y, {an, variante, text: g.text});
  const links = sym.pole === 3 ? x + 82 : x - (sym.rolle === "klemme" ? 10 : sym.links || 34);
  const marke = beschriftung(ctx, g.bmk, links, y + sym.h / 2 + 4, {a: sym.pole === 3 ? "start" : "end", annahme: g.annahme, zeichenX: x});
  return {svg: bild + marke, h: sym.h, sym};
}

export const grauerText = (x, y, t, a = "middle") => text(x, y, t, {a, g: 8, f: GRAU});
