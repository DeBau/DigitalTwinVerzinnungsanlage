// Vorlage Regelkreis: vorgedrucktes Blockschaltbild (Regler, Stellglied, Strecke, Messglied) und die Bausteine
// Block und Summierstelle für eigene Blockschaltbilder. Pfeile zwischen Blöcken sind beschriftbar.
import { INK, SVGT, tw } from '../svg.js';
import { BAUSTEIN, SAMPLE, fuelle, registriereGruppe, registriereVorlage } from '../registry.js';
import { G, G2, TX } from '../vorlagen-svg.js';
import { LINIE, platzhalter, rund } from '../bausteine.js';

export const bw = o => Math.max(110, Math.round((tw(o.v || "Block") + 30) / 10) * 10);   // Blockbreite nach Text

// Muster-Regelkreis im Vordruck. Sobald die Zeichnung einen Baustein hat, blendet MUSTER_AUS ihn aus (CSS :has),
// damit Vordruck-Kästen und gesetzte Bausteine nicht doppelt erscheinen. Der leere Vordruck druckt ihn weiter.
export const MUSTER_AUS = `<style>svg:has(.ink [data-o]) .rk-muster{display:none}</style>`;
export function regelkreisMuster(){
  const box = (x, y, w, h, lbl) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#fff" stroke="${G}" `
    + `stroke-width="1.3"/>` + TX(x + w/2, y - 7, 10, lbl, "middle", "#666", 600);
  const ar = (d) => `<path d="${d}" fill="none" stroke="${G}" stroke-width="1.3" marker-end="url(#rk-pfeil)"/>`;
  let s = `<defs><marker id="rk-pfeil" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">`
    + `<path d="M0 0L10 5L0 10z" fill="${G}"/></marker></defs>`;
  s += `<circle cx="140" cy="200" r="16" fill="#fff" stroke="${G}" stroke-width="1.3"/>`
    + `<path d="M129 189L151 211M151 189L129 211" stroke="${G}"/>` + TX(126,190,11,"+","end") + TX(150,232,11,"−","start");
  s += ar("M60 200H122") + TX(60,190,12,"w","start","#555",600);
  s += box(200,165,150,70,"Regler") + ar("M156 200H198") + TX(176,190,11,"e","middle","#555");
  s += box(420,165,150,70,"Stellglied") + ar("M350 200H418") + TX(385,190,11,"y","middle","#555");
  s += box(640,165,150,70,"Strecke") + ar("M570 200H638");
  s += ar("M790 200H940") + TX(940,190,12,"x","end","#555",600);
  s += ar("M715 90V163") + TX(725,100,12,"z  Störgröße","start","#555");
  s += box(420,310,150,60,"Messglied") + ar("M860 200V340H572") + ar("M418 340H140V218");
  return `<g class="rk-muster">${s}</g>`;
}
// Tabelle der Größen unter dem Kreis
export const REGELGROESSEN = ["w Führungsgröße", "x Regelgröße", "e Regeldifferenz", "y Stellgröße", "z Störgröße"];
export function groessenTabelle(){
  let s = TX(60, 440, 12, "Größe", "start", "#666", 600) + TX(260, 440, 12, "Bedeutung in dieser Übung", "start", "#666", 600)
    + TX(640, 440, 12, "Signal / Adresse", "start", "#666", 600);
  REGELGROESSEN.forEach((r, i) => {
    const y = 470 + i*30;
    s += `<path d="M60 ${y+8}H975" stroke="${G2}" stroke-width=".7"/>` + TX(60, y, 12, r, "start", "#555");
  });
  return s;
}
export const regelkreisBlatt = () => MUSTER_AUS + regelkreisMuster() + groessenTabelle();
registriereVorlage("regelkreis", {n: "Regelkreis", d: "Blockschaltbild Regler, Stellglied, Strecke, Messglied", gruppen: ["regel"], body: (ex, page) => page ? "" : regelkreisBlatt()});
registriereGruppe("regel", {name: "Regelkreis", hinweis: "Blöcke und Summierstelle setzen, mit Verbinden den Signalfluss ziehen. Doppelklick auf einen Pfeil beschriftet ihn.", pfeiltext: true});

fuelle(BAUSTEIN, {
  box: {g: "regel", n: "Block",
    zeichne(o, edit){
      const w = bw(o);
      return `<rect x="${o.x}" y="${o.y}" width="${w}" height="50" rx="3" fill="#fff" ${LINIE}/>` + (o.v ? SVGT(o.x+w/2, o.y+30, o.v) : platzhalter(edit, "Block", o.x+w/2, o.y+30));
    },
    umriss: o => ({x: o.x, y: o.y, w: bw(o), h: 50}),
    neu(o, [px, py]){ o.x = px - 55; o.y = py - 25; o.v = ""; },
    feldliste: [["v", "Bezeichnung"]],
    beschriftung: {sofort: true, hinweis: "Bezeichnung, z. B. Regler"}},
  sum: {g: "regel", n: "Summierstelle", ...rund(15), beschriftung: false,
    zeichne: o => `<circle cx="${o.x}" cy="${o.y}" r="15" fill="#fff" ${LINIE}/><path d="M${o.x-10.6} ${o.y-10.6}L${o.x+10.6} ${o.y+10.6}M${o.x+10.6} ${o.y-10.6}L${o.x-10.6} ${o.y+10.6}" stroke="${INK}" stroke-width="1"/>`},
});
fuelle(SAMPLE, {box: [{k:"box", x:2, y:2, v:"Regler"}, "0 0 114 54"], sum: [{k:"sum", x:24, y:24}, "0 0 48 48"]});
