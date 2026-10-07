// Pneumatik-Symbole nach ISO 1219 ohne Schaltstellungen: Quelle, Wartungseinheit, Drosseln, Sperr- und Logikventile,
// Messgeräte, Schwenkantrieb, Ventilinsel. GERAET[k](o) zeichnet das Bauteil k; angemeldet werden sie in pneumatik.js.
import { INK, arrowHead } from '../svg.js';
import { ED } from '../status.js';
import { BLUE, LB, PN, PP, pressed, simOn } from '../bauteile.js';
import { endlagen, posOf, thin } from './pneumatik-symbole.js';

const KONTUR = `stroke="${INK}" stroke-width="1.6"`, KUGEL = `fill="#fff" stroke="${INK}" stroke-width="1.5"`;
const STRICHPUNKT = `fill="none" stroke="${INK}" stroke-width="1" stroke-dasharray="7 2 1.5 2"`;   // Baueinheit
const kugel = (x, y) => `<circle cx="${x}" cy="${y}" r="5.5" ${KUGEL}/>`;
const einstellbar = (x1, y1, x2, y2, h = 6) => `<path d="M${x1} ${y1}L${x2} ${y2}" ${thin}/>` + arrowHead(x1, y1, x2, y2, h);
// Drossel als zwei Bögen um die Mitte (cx, cy)
const drossel = (cx, cy) => `<path d="M${cx-5} ${cy-8}Q${cx} ${cy} ${cx-5} ${cy+8}M${cx+5} ${cy-8}Q${cx} ${cy} ${cx+5} ${cy+8}" ${thin}/>`;
// Öffnung einer Drossel in Prozent (Feld of), Vorgabe 50
export const oeffnung = o => Math.max(0, Math.min(100, +(o.of ?? 50) || 0));
const oeffnungText = (o, x, y) => o.of !== undefined && o.of !== "" ? PN(x, y, oeffnung(o) + " %") : "";
// Stellung des Kugelhahns: in der Simulation die geschaltete, sonst das Feld zu
export const kugelhahnOffen = o => ((simOn() && ED.sim.st[o.id]) || o.zu || "auf") === "auf";
// Zwei Eingänge 1 und 3 unten, Ausgang 2 oben (Wechsel- und Zweidruckventil)
const logikGehaeuse = (x, y, innen) => `<rect x="${x+4}" y="${y+20}" width="52" height="20" fill="#fff" ${KONTUR}/>` + innen
  + PP(`M${x+30} ${y}V${y+20}M${x+8} ${y+40}V${y+60}M${x+52} ${y+40}V${y+60}`)
  + PN(x+33, y+8, "2") + PN(x+11, y+58, "1") + PN(x+55, y+58, "3");

export const GERAET = {
  src: o => PP(`M${o.x+15} ${o.y}V${o.y+16}`) + `<circle cx="${o.x+15}" cy="${o.y+27}" r="11" fill="#fff" ${KONTUR}/>`
    + `<circle cx="${o.x+15}" cy="${o.y+27}" r="2.6" fill="${INK}"/>` + LB(o.x-4, o.y+31, o.v),
  frl: o => { const x = o.x, y = o.y;
    return `<rect x="${x+2}" y="${y+10}" width="46" height="40" ${STRICHPUNKT}/>` + PP(`M${x+20} ${y}V${y+16}M${x+20} ${y+44}V${y+60}`)
      + `<path d="M${x+20} ${y+16}L${x+34} ${y+30}L${x+20} ${y+44}L${x+6} ${y+30}Z" fill="#fff" ${KONTUR}/>`
      + `<path d="M${x+10} ${y+30}H${x+30}" ${thin} stroke-dasharray="3 2"/><path d="M${x+34} ${y+30}H${x+38}" ${thin}/>`
      + `<circle cx="${x+42}" cy="${y+30}" r="4.5" fill="#fff" ${thin}/><path d="M${x+40} ${y+32}L${x+44.5} ${y+27.5}" ${thin}/>`
      + PN(x+23, y+7, "2") + PN(x+23, y+59, "1") + LB(x-4, y+34, o.v); },
  rot: o => { const x = o.x, y = o.y, a = (-90 + posOf(o) * 90) * Math.PI / 180, cx = x + 30, cy = y + 42, f = n => n.toFixed(1);
    return `<path d="M${x+8} ${cy}A22 22 0 0 1 ${x+52} ${cy}Z" fill="#fff" ${KONTUR}/>`                 // Halbkreis: begrenzter Winkel
      + `<path d="M${x+20} ${cy-1}L${x+16} ${cy-9}H${x+24}Z" fill="${INK}"/>`
      + `<path d="M${x+40} ${cy-1}L${x+36} ${cy-9}H${x+44}Z" fill="${INK}"/>`
      + `<path d="M${x+11} ${y+12}A24 24 0 0 1 ${x+49} ${y+12}" ${thin}/>` + arrowHead(x+18, y+6.5, x+11, y+12, 6)
      + arrowHead(x+42, y+6.5, x+49, y+12, 6)
      + `<path d="M${cx} ${cy}L${f(cx + 15*Math.cos(a))} ${f(cy + 15*Math.sin(a))}" stroke="${INK}" stroke-width="2.2" `
      + `stroke-linecap="round"/>`
      + `<circle cx="${cx}" cy="${cy}" r="2.2" fill="${INK}"/>` + PP(`M${x+20} ${cy}V${y+60}M${x+40} ${cy}V${y+60}`)
      + PN(x+23, y+59, "A") + PN(x+43, y+59, "B") + endlagen(o, 2, 58, true) + LB(x-4, y+40, o.v); },
  drv: o => { const x = o.x, y = o.y;
    return `<rect x="${x+1}" y="${y+8}" width="48" height="44" ${STRICHPUNKT}/>`
      + PP(`M${x+20} ${y}V${y+14}M${x+20} ${y+46}V${y+60}M${x+12} ${y+14}H${x+36}M${x+12} ${y+46}H${x+36}M${x+12} ${y+14}V${y+46}`
        + `M${x+36} ${y+14}V${y+24}M${x+36} ${y+42}V${y+46}`)
      + drossel(x+12, y+30) + einstellbar(x+3, y+41, x+21, y+19)
      + `<path d="M${x+30} ${y+37}L${x+36} ${y+43}L${x+42} ${y+37}" ${thin}/>` + kugel(x+36, y+31)   // Kugel im Sitz
      + PN(x+23, y+6, "2") + PN(x+23, y+59, "1") + oeffnungText(o, x+52, y+56) + LB(x-4, y+34, o.v); },
  dr: o => PP(`M${o.x+15} ${o.y}V${o.y+60}`) + drossel(o.x+15, o.y+30) + einstellbar(o.x+5, o.y+41, o.x+25, o.y+19)
    + oeffnungText(o, o.x+28, o.y+56) + LB(o.x-2, o.y+34, o.v),
  rv: o => PP(`M${o.x+15} ${o.y}V${o.y+25}M${o.x+15} ${o.y+42}V${o.y+60}`)
    + `<path d="M${o.x+8} ${o.y+35}L${o.x+15} ${o.y+42}L${o.x+22} ${o.y+35}" ${thin}/>` + kugel(o.x+15, o.y+30) + LB(o.x-2, o.y+34, o.v),
  kh: o => { const x = o.x, y = o.y;
    return PP(`M${x+20} ${y}V${y+18}M${x+20} ${y+42}V${y+60}`)
      + `<path d="M${x+11} ${y+18}H${x+29}L${x+11} ${y+42}H${x+29}Z" fill="${kugelhahnOffen(o) ? "#fff" : INK}" `
      + `stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`
      + `<path d="M${x+29} ${y+30}H${x+40}M${x+40} ${y+22}V${y+38}" ${thin}/>` + PN(x+23, y+7, "2") + PN(x+23, y+59, "1")
      + LB(x-2, y+34, o.v); },
  mano: o => { const x = o.x, y = o.y;
    return PP(`M${x+20} ${y+60}V${y+42}`)
      + `<circle cx="${x+20}" cy="${y+28}" r="14" fill="${pressed(o, "1") ? "#DCEBFF" : "#fff"}" ${KONTUR}/>`
      + einstellbar(x+10, y+38, x+29, y+19) + LB(x-2, y+32, o.v); },
  ds: o => { const x = o.x, y = o.y, on = pressed(o, "1");
    return PP(`M${x+20} ${y+60}V${y+44}`) + `<rect x="${x+4}" y="${y+14}" width="32" height="30" fill="#fff" ${KONTUR}/>`
      + `<path d="M${x+20} ${y+44}V${y+34}" ${thin}/>`
      + `<path d="M${x+15} ${y+34}L${x+20} ${y+26}L${x+25} ${y+34}Z" fill="${INK}"/>`   // Druck wirkt auf den Messkolben
      + einstellbar(x+8, y+40, x+33, y+17, 5) + `<path d="M${x+36} ${y+29}H${x+44}M${x+58} ${y+29}H${x+66}" ${thin}/>`
      + `<path d="M${x+44} ${y+29}L${x+57} ${y+(on ? 29 : 21)}" stroke="${on ? "#2E7D4F" : INK}" stroke-width="1.6" `
      + `stroke-linecap="round"/>`
      + LB(x+2, y+10, o.v, "start"); },
  duese: o => { const x = o.x, y = o.y, on = pressed(o, "1");
    return PP(`M${x+20} ${y+60}V${y+34}`)
      + `<path d="M${x+12} ${y+34}H${x+28}L${x+23} ${y+20}H${x+17}Z" fill="#fff" ${KONTUR} stroke-linejoin="round"/>`
      + `<path d="M${x+20} ${y+16}V${y+4}M${x+15} ${y+16}L${x+9} ${y+5}M${x+25} ${y+16}L${x+31} ${y+5}" stroke="${on ? BLUE : INK}" `
      + `stroke-width="1.3" stroke-dasharray="${on ? "4 2" : "2 3"}" fill="none"/>` + LB(x+4, y+32, o.v); },
  wv: o => logikGehaeuse(o.x, o.y, `<path d="M${o.x+12} ${o.y+22}L${o.x+18} ${o.y+30}L${o.x+12} ${o.y+38}`
    + `M${o.x+48} ${o.y+22}L${o.x+42} ${o.y+30}L${o.x+48} ${o.y+38}" ${thin}/>` + kugel(o.x+30, o.y+30)) + LB(o.x, o.y+34, o.v),
  zd: o => { const x = o.x, y = o.y, kolben = kx => `<rect x="${kx}" y="${y+25}" width="8" height="10" fill="#fff" ${thin}/>`;
    return logikGehaeuse(x, y, `<path d="M${x+12} ${y+22}V${y+38}M${x+48} ${y+22}V${y+38}" ${thin}/>` + kolben(x+15) + kolben(x+37)
      + `<path d="M${x+23} ${y+30}H${x+37}" ${thin}/>`) + LB(x, y+34, o.v); },
  se: o => { const x = o.x, y = o.y;
    return PP(`M${x+20} ${y}V${y+18}M${x+20} ${y+42}V${y+60}M${x+20} ${y+30}H${x+44}`)
      + `<rect x="${x+8}" y="${y+18}" width="24" height="24" ${STRICHPUNKT}/>`
      + `<circle cx="${x+20}" cy="${y+30}" r="5" ${KUGEL}/><path d="M${x+14} ${y+37}L${x+20} ${y+41}L${x+26} ${y+37}" ${thin}/>`
      + `<path d="M${x+44} ${y+24}L${x+54} ${y+30}L${x+44} ${y+36}Z" fill="#fff" stroke="${INK}" stroke-width="1.4"/>`
      + PN(x+23, y+8, "2") + PN(x+23, y+58, "1") + PN(x+46, y+22, "3") + LB(x+2, y+34, o.v); },
  insel: o => `<rect x="${o.x}" y="${o.y}" width="${+o.fw || 360}" height="${+o.fh || 120}" fill="none" stroke="${INK}" `
    + `stroke-width="1.2" stroke-dasharray="12 3 2 3"/>` + LB(o.x + 6, o.y - 6, o.v, "start"),
  sd: o => PP(`M${o.x+12} ${o.y}V${o.y+10}`)
    + `<path d="M${o.x+12} ${o.y+10}L${o.x+22} ${o.y+20}L${o.x+12} ${o.y+30}L${o.x+2} ${o.y+20}Z" fill="#fff" ${KUGEL}/>`
    + `<path d="M${o.x+6} ${o.y+17}H${o.x+18}M${o.x+5} ${o.y+20}H${o.x+19}M${o.x+6} ${o.y+23}H${o.x+18}" ${thin}/>`,
};
