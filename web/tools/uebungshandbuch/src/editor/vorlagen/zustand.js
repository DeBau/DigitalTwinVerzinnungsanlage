// Vorlage Zustandsdiagramm: Zustände, Anfangszustand, Startpunkt und Übergänge als gebogene Pfeile.
// Übergänge tragen eine Bedingung; ein Übergang darf auf denselben Zustand zurückführen (Schleife).
import { INK, SVGT } from '../svg.js';
import { ED } from '../status.js';
import { BAUSTEIN, SAMPLE, art, fuelle, registriereGruppe, registriereVorlage } from '../registry.js';
import { G, TX, dots } from '../vorlagen-svg.js';
import { LINIE, mitteVon, rund } from '../bausteine.js';

export const f1 = n => n.toFixed(1);
// Punkt auf dem Weg von p nach q im Abstand r von p (Rand eines Kreises)
export const richtung = (p, q, r) => {
  const vx = q[0]-p[0], vy = q[1]-p[1], l = Math.hypot(vx, vy) || 1;
  return [p[0]+vx/l*r, p[1]+vy/l*r];
};
export const randRadius = o => art(o.k).radius || 20;

// Übergang von A nach B. Gibt es auch den Rückweg, biegen sich beide Pfeile auseinander.
export function verbindeZustand(c, A, B, objs, all){
  const ca = mitteVon(A), cb = mitteVon(B), ra = randRadius(A), rb = randRadius(B);
  if (c.a === c.b) {   // Schleife rechts am Zustand
    const [x, y] = ca;
    const d = `M${x+ra-3} ${y-14}C${x+ra+62} ${y-45} ${x+ra+62} ${y+45} ${x+ra-3} ${y+14}`;
    return {d, arrow: true, lbl: [x+ra+56, y+4, "start"]};
  }
  const rev = all.some(o => o.a === c.b && o.b === c.a);
  const dx = cb[0]-ca[0], dy = cb[1]-ca[1], L = Math.hypot(dx, dy) || 1, nx = -dy/L, ny = dx/L, off = rev ? 28 : 0;
  const mx = (ca[0]+cb[0])/2 + nx*off, my = (ca[1]+cb[1])/2 + ny*off;
  const s = richtung(ca, [mx, my], ra), e = richtung(cb, [mx, my], rb + 1);
  const lx = .25*s[0] + .5*mx + .25*e[0], ly = .25*s[1] + .5*my + .25*e[1];
  const side = Math.abs(nx) > .5, an = side ? (nx < 0 ? "end" : "start") : "middle", k = side ? 10 : 16;
  const d = `M${f1(s[0])} ${f1(s[1])}Q${f1(mx)} ${f1(my)} ${f1(e[0])} ${f1(e[1])}`;
  return {d, arrow: true, lbl: [f1(lx + nx*k), f1(ly + ny*k + 4), an]};
}

registriereVorlage("zustand", {
  n: "Zustandsdiagramm", d: "Zustände und Übergänge, z. B. für Übergaben und Antriebe", gruppen: ["zustand"],
  body: (ex, page) => dots(20) + (page ? "" : ZUSTAND_LEGENDE),
});
export const ZUSTAND_LEGENDE = [
  `<g><rect x="790" y="25" width="185" height="120" fill="#fff" stroke="${G}"/>${TX(800,43,10,"Symbole","start","#666",600)}`,
  `<circle cx="815" cy="72" r="15" fill="none" stroke="${G}" stroke-width="1.3"/>${TX(840,76,10,"Zustand (Name)")}`,
  `<path d="M802 112H840" stroke="${G}" stroke-width="1.3"/>`
    + `<path d="M834 107L842 112L834 117" fill="none" stroke="${G}" stroke-width="1.3"/>`
    + `${TX(850,108,10,"Übergang")}${TX(850,122,9,"Bedingung / Aktion")}</g>`,
].join("\n        ");

registriereGruppe("zustand", {
  name: "Zustandsdiagramm",
  hinweis: "Zustände setzen, dann mit Verbinden zwei Zustände nacheinander anklicken. "
    + "Die Bedingung schreiben Sie direkt an den Pfeil.",
  verbinde: verbindeZustand,
  schleife: true,                     // Übergang auf sich selbst erlaubt
  pfeiltext: true,                    // Übergänge sind beschriftbar
  bedingung: A => A.k !== "start",    // nach dem Verbinden gleich die Bedingung abfragen, im Editor Platzhalter zeigen
});

export const ZUSTANDSARTEN = ["state", "sinit"];
// Name des nächsten Zustands: Z0, Z1, …
export function zustandNeu(o, [px, py]){
  o.x = px; o.y = py;
  o.v = "Z" + ED.data.o.filter(q => ZUSTANDSARTEN.includes(q.k)).length;
}
export const ZUSTAND = {neu: zustandNeu, feldliste: [["v", "Name"]], beschriftung: {hinweis: "Name des Zustands"}};
export const KREIS = o => `<circle cx="${o.x}" cy="${o.y}" r="36" fill="#fff" ${LINIE}/>`;
fuelle(BAUSTEIN, {
  sinit: {g: "zustand", n: "Anfangszustand", ...rund(36), ...ZUSTAND,
    zeichne: o => KREIS(o) + `<circle cx="${o.x}" cy="${o.y}" r="31" fill="none" ${LINIE}/>` + SVGT(o.x, o.y+5, o.v)},
  state: {g: "zustand", n: "Zustand", ...rund(36), ...ZUSTAND,
    zeichne: o => KREIS(o) + SVGT(o.x, o.y+5, o.v)},
  start: {g: "zustand", n: "Startpunkt", ...rund(8), beschriftung: false,
    zeichne: o => `<circle cx="${o.x}" cy="${o.y}" r="8" fill="${INK}"/>`},
});
fuelle(SAMPLE, {
  sinit: [{k:"sinit", x:38, y:38, v:"Z0"}, "0 0 76 76"], state: [{k:"state", x:38, y:38, v:"Z1"}, "0 0 76 76"],
  start: [{k:"start", x:24, y:24}, "0 0 48 48"],
});
