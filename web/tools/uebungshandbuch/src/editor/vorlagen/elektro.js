// Vorlage Stromlaufplan (Steuerstromkreis zwischen L+ und M) mit den Gruppen Steuerstromkreis und Geräte/SPS.
// Kontakte, Spulen und Taster bilden Strompfade: eine Ablaufkette (editor/kette.js), die oben an L+ und unten
// an M andockt. Geräte (SPS-Baugruppen, Netzteil, Sicherheitsrelais) werden Anschluss für Anschluss verdrahtet.
import { INK, PH, SVGT } from '../svg.js';
import { BAUSTEIN, SAMPLE, art, bauteil, fuelle, registriereBauteile, registriereGruppe, registriereVorlage } from '../registry.js';
import { G, G2, TX, grid } from '../vorlagen-svg.js';
import { LB, PD, PN, PP, SK, portsOf } from '../bauteile.js';
import { LINIE, gruppenId } from '../bausteine.js';

export const cNO = (x, y) => `M${x} ${y}V${y+20}M${x} ${y+60}V${y+42}L${x-13} ${y+19}`;
export const cNC = (x, y) => `M${x} ${y}V${y+20}H${x+9}M${x} ${y+60}V${y+42}L${x+12} ${y+16}`;
// Strompfad: Spalte i liegt bei x = 40 + i·46, 20 Pfade je Blatt
export const pfadNummer = x => Math.max(1, Math.min(20, Math.round((x - 40) / 46)));

/* ---------- Vorlage ---------- */
export function stromlaufBlatt(){
  let s = `<path d="M40 70H975M40 590H975" stroke="${G}" stroke-width="2"/>` + TX(30,74,12,"L+","end","#555",600) + TX(30,594,12,"M","end","#555",600) + TX(975,62,9,"24 V DC","end");
  for (let i = 1; i <= 20; i++) { const x = 40 + i*46; s += TX(x, 52, 9, String(i), "middle") + `<path d="M${x} 74V586" stroke="${G2}" stroke-width=".6" stroke-dasharray="2 5"/>`; }
  return grid(10, "#EEF1F3", 40, 80, 975, 580) + s + TX(40, 615, 9, "Strompfad-Nr. oben, Kontaktspiegel unter den Spulen eintragen");
}
// Glieder eines Strompfads ohne eigene Leitung nach oben bzw. unten verbinden sich mit L+ und M des eigenen Blatts
export function strompfadAnschluesse(d, cs){
  let s = "";
  const imPfad = o => gruppenId(o) === "elektro" && (bauteil(o.k) ? bauteil(o.k).bx : art(o.k).anschluesse);
  (d.o || []).filter(imPfad).forEach(o => {
    const ps = portsOf(o), top = ps[0], bot = ps[1], base = Math.floor(o.y / PH) * PH, yT = base + 70, yB = base + 590;
    const wired = p => cs.some(c => (c.a === o.id && c.pa === p.n) || (c.b === o.id && c.pb === p.n));
    if (!cs.some(c => c.b === o.id && c.pa === undefined) && !wired(top) && o.y > yT) s += `<path d="M${o.x} ${yT}V${o.y}" stroke="${INK}" stroke-width="1.6"/><circle cx="${o.x}" cy="${yT}" r="2.6" fill="${INK}"/>`;
    if (!cs.some(c => c.a === o.id && c.pa === undefined) && !wired(bot) && o.y + 60 < yB) s += `<path d="M${o.x} ${o.y+60}V${yB}" stroke="${INK}" stroke-width="1.6"/><circle cx="${o.x}" cy="${yB}" r="2.6" fill="${INK}"/>`;
  });
  return s;
}
registriereVorlage("stromlauf", {
  n: "Stromlaufplan", d: "Steuerstromkreis zwischen L+ und M – Taster, Not-Halt, SPS, Sicherheitsrelais",
  gruppen: ["elektro", "geraete", "leistung"], schienen: [["L+",70,40,935], ["M",590,40,935]],
  body: stromlaufBlatt,
  hintergrund: strompfadAnschluesse,
  // Glieder des Steuerstromkreises rasten auf die Strompfad-Spalten
  fangBaustein(o){ if (gruppenId(o) === "elektro") o.x = 40 + pfadNummer(o.x) * 46; },
  // Abbruchstellen nennen zusätzlich den Strompfad
  verweis: x => `, Pfad ${pfadNummer(x)}`,
});

/* ---------- Gruppen ---------- */
registriereGruppe("elektro", {
  name: "Steuerstromkreis",
  hinweis: "Kontakte und Spule untereinander setzen – sie verbinden sich zum Strompfad und docken oben an L+ und unten an M an. Kennzeichen per Doppelklick ändern.",
  kette: true,
});
registriereGruppe("geraete", {
  name: "Geräte und SPS",
  hinweis: "Geräte setzen und mit Verbinden verdrahten – z. B. den Sensorausgang BK auf einen Eingang der DI-Baugruppe.",
});

/* ---------- Einfache Kontakte und Spulen: Mittellinie bei o.x, Höhe 60 ---------- */
export const KONTAKT = {
  g: "elektro",
  umriss: o => ({x: o.x-22, y: o.y, w: 44, h: 60}),
  aus: o => [o.x, o.y+60], ein: o => [o.x, o.y],
  beschriftung: {ort: o => [o.x - 120, o.y + 30]},
};
export const kontaktNeu = v => (o, [px, py]) => { o.x = px; o.y = py - 30; o.v = v; };
// Kontakt oder Spule mit Kennzeichen-Vorschlag v und den Anschlüssen oben und unten
export const kontakt = (v, oben, unten) => ({...KONTAKT, neu: kontaktNeu(v), feldliste: [["v", "Kennzeichen"]],
  anschluesse: [[oben, 0, 0, "u"], [unten, 0, 60, "d"]], beschriftung: {...KONTAKT.beschriftung, hinweis: "Kennzeichen, z. B. " + v}});
fuelle(BAUSTEIN, {
  no: {...kontakt("-SF1", "13", "14"), n: "Schließer",
    zeichne: o => `<path d="M${o.x} ${o.y}V${o.y+20}M${o.x} ${o.y+60}V${o.y+42}L${o.x-13} ${o.y+19}" ${LINIE} fill="none" stroke-linecap="round"/>` + SVGT(o.x-20, o.y+35, o.v, "end", 12)},
  nc: {...kontakt("-SF2", "11", "12"), n: "Öffner",
    zeichne: o => `<path d="M${o.x} ${o.y}V${o.y+20}H${o.x+9}M${o.x} ${o.y+60}V${o.y+42}L${o.x+12} ${o.y+16}" ${LINIE} fill="none" stroke-linecap="round"/>` + SVGT(o.x-20, o.y+35, o.v, "end", 12)},
  coil: {...kontakt("-QA1", "A1", "A2"), n: "Spule / Schütz",
    zeichne: o => `<path d="M${o.x} ${o.y}V${o.y+18}M${o.x} ${o.y+42}V${o.y+60}" ${LINIE}/><rect x="${o.x-15}" y="${o.y+18}" width="30" height="24" fill="#fff" ${LINIE}/>` + SVGT(o.x-22, o.y+35, o.v, "end", 12)},
  lamp: {...kontakt("-PF1", "X1", "X2"), n: "Meldeleuchte",
    zeichne: o => `<path d="M${o.x} ${o.y}V${o.y+18}M${o.x} ${o.y+42}V${o.y+60}" ${LINIE}/><circle cx="${o.x}" cy="${o.y+30}" r="12" fill="#fff" ${LINIE}/><path d="M${o.x-8.5} ${o.y+21.5}L${o.x+8.5} ${o.y+38.5}M${o.x+8.5} ${o.y+21.5}L${o.x-8.5} ${o.y+38.5}" ${LINIE}/>` + SVGT(o.x-20, o.y+35, o.v, "end", 12)},
});
fuelle(SAMPLE, {no:[{k:"no", x:34, y:2}, "0 0 56 64"], nc:[{k:"nc", x:30, y:2}, "0 0 56 64"], coil:[{k:"coil", x:28, y:2}, "0 0 56 64"], lamp:[{k:"lamp", x:28, y:2}, "0 0 56 64"]});

/* ---------- Bauteile mit Anschlüssen ---------- */
// Glied im Strompfad: Anschluss 0 oben, Anschluss 1 unten
export const xy = q => [q.x, q.y];
export const STROMPFAD = {aus: o => xy(portsOf(o)[1]), ein: o => xy(portsOf(o)[0])};
registriereBauteile({
  /* Steuerstromkreis – Mittellinie bei o.x, Höhe 60 */
  tno:{g:"elektro", n:"Taster Schließer", lbl:"-SF1", bx:-22, ...STROMPFAD, w:44, h:60, anschluesse:[["13",0,0,"u"],["14",0,60,"d"]],
    zeichne:o => PP(cNO(o.x, o.y)) + PD(`M${o.x-7} ${o.y+31}H${o.x-24}`) + PP(`M${o.x-24} ${o.y+24}V${o.y+38}M${o.x-24} ${o.y+24}H${o.x-28}M${o.x-24} ${o.y+38}H${o.x-28}`) + LB(o.x-34, o.y+35, o.v) + PN(o.x+5, o.y+11, "13") + PN(o.x+5, o.y+57, "14")},
  tnc:{g:"elektro", n:"Taster Öffner", lbl:"-SF2", bx:-22, ...STROMPFAD, w:44, h:60, anschluesse:[["11",0,0,"u"],["12",0,60,"d"]],
    zeichne:o => PP(cNC(o.x, o.y)) + PD(`M${o.x+5} ${o.y+29}H${o.x-24}`) + PP(`M${o.x-24} ${o.y+22}V${o.y+36}M${o.x-24} ${o.y+22}H${o.x-28}M${o.x-24} ${o.y+36}H${o.x-28}`) + LB(o.x-34, o.y+33, o.v) + PN(o.x+12, o.y+11, "11") + PN(o.x+5, o.y+57, "12")},
  estop:{g:"elektro", n:"Not-Halt (Pilztaster)", lbl:"-SF0", bx:-22, ...STROMPFAD, w:44, h:60, anschluesse:[["11",0,0,"u"],["12",0,60,"d"]],
    zeichne:o => PP(cNC(o.x, o.y)) + PD(`M${o.x+5} ${o.y+29}H${o.x-20}`) + `<path d="M${o.x-20} ${o.y+20}A9 9 0 0 0 ${o.x-20} ${o.y+38}Z" fill="#C0392B" fill-opacity=".85" stroke="${INK}" stroke-width="1.4"/>` + LB(o.x-34, o.y+33, o.v) + PN(o.x+12, o.y+11, "11") + PN(o.x+5, o.y+57, "12")},
  key:{g:"elektro", n:"Schlüsselschalter", lbl:"-SA2", bx:-22, ...STROMPFAD, w:44, h:60, anschluesse:[["13",0,0,"u"],["14",0,60,"d"]],
    zeichne:o => PP(cNO(o.x, o.y)) + PD(`M${o.x-7} ${o.y+31}H${o.x-20}`) + `<circle cx="${o.x-25}" cy="${o.y+31}" r="4.5" ${SK}/>` + PP(`M${o.x-29.5} ${o.y+31}H${o.x-36}M${o.x-33} ${o.y+31}V${o.y+35}`) + LB(o.x-40, o.y+35, o.v) + PN(o.x+5, o.y+11, "13") + PN(o.x+5, o.y+57, "14")},
  lsw:{g:"elektro", n:"Positionsschalter", lbl:"-BG1", bx:-22, ...STROMPFAD, w:44, h:60, anschluesse:[["13",0,0,"u"],["14",0,60,"d"]],
    zeichne:o => PP(cNO(o.x, o.y)) + PD(`M${o.x-7} ${o.y+31}H${o.x-20}`) + PP(`M${o.x-20} ${o.y+24}V${o.y+38}L${o.x-28} ${o.y+31}Z`) + LB(o.x-32, o.y+35, o.v) + PN(o.x+5, o.y+11, "13") + PN(o.x+5, o.y+57, "14")},
  sens:{g:"elektro", n:"Näherungsschalter PNP", lbl:"-BG2", bx:-22, ...STROMPFAD, w:56, h:60, anschluesse:[["BN",0,0,"u"],["BU",0,60,"d"],["BK",30,30,"r"]],
    zeichne:o => `<rect x="${o.x-15}" y="${o.y+15}" width="30" height="30" fill="#fff" ${SK}/>` + PP(`M${o.x} ${o.y}V${o.y+15}M${o.x} ${o.y+45}V${o.y+60}M${o.x+15} ${o.y+30}H${o.x+30}M${o.x} ${o.y+22}L${o.x+8} ${o.y+30}L${o.x} ${o.y+38}L${o.x-8} ${o.y+30}Z`)
      + LB(o.x-20, o.y+35, o.v) + PN(o.x+4, o.y+10, "BN") + PN(o.x+4, o.y+57, "BU") + PN(o.x+18, o.y+26, "BK")},
  mbv:{g:"elektro", n:"Ventilspule", lbl:"-MB1", bx:-22, ...STROMPFAD, w:44, h:60, anschluesse:[["A1",0,0,"u"],["A2",0,60,"d"]],
    zeichne:o => PP(`M${o.x} ${o.y}V${o.y+18}M${o.x} ${o.y+42}V${o.y+60}`) + `<rect x="${o.x-15}" y="${o.y+18}" width="30" height="24" fill="#fff" ${SK}/>` + PP(`M${o.x-15} ${o.y+42}L${o.x+15} ${o.y+18}`) + LB(o.x-22, o.y+35, o.v) + PN(o.x+5, o.y+11, "A1") + PN(o.x+5, o.y+57, "A2")},
  term:{g:"elektro", n:"Klemme", lbl:"-X1:1", bx:-22, ...STROMPFAD, w:44, h:60, anschluesse:[["1",0,0,"u"],["2",0,60,"d"]],
    zeichne:o => PP(`M${o.x} ${o.y}V${o.y+26}M${o.x} ${o.y+34}V${o.y+60}`) + `<circle cx="${o.x}" cy="${o.y+30}" r="4" fill="#fff" ${SK}/>` + LB(o.x-10, o.y+34, o.v)},
  fuse:{g:"elektro", n:"Sicherung", lbl:"-FA2", bx:-22, ...STROMPFAD, w:44, h:60, anschluesse:[["1",0,0,"u"],["2",0,60,"d"]],
    zeichne:o => PP(`M${o.x} ${o.y}V${o.y+60}`) + `<rect x="${o.x-5}" y="${o.y+16}" width="10" height="28" ${SK}/>` + LB(o.x-12, o.y+34, o.v) + PN(o.x+8, o.y+11, "1") + PN(o.x+8, o.y+57, "2")},
  /* Geräte und SPS – oben links */
  di8:{g:"geraete", n:"SPS-Eingänge DI 8", lbl:"-KF1", w:200, h:70, def:{b:"0"}, feldliste:[["b","Byte-Adresse (%I…)"]],
    anschluesse:() => [...Array.from({length: 8}, (_, i) => ["DI" + i, 40 + i*20, 0, "u"]), ["L+", 0, 25, "l"], ["M", 0, 45, "l"]],
    zeichne:o => { let s = `<rect x="${o.x+10}" y="${o.y+10}" width="180" height="50" fill="#fff" ${SK}/>` + PP(`M${o.x} ${o.y+25}H${o.x+10}M${o.x} ${o.y+45}H${o.x+10}`) + PN(o.x+1, o.y+21, "L+") + PN(o.x+1, o.y+41, "M");
      for (let i = 0; i < 8; i++) s += PP(`M${o.x+40+i*20} ${o.y}V${o.y+10}`) + PN(o.x+40+i*20, o.y+22, "." + i, "middle");
      return s + PN(o.x+14, o.y+22, `%I${o.b ?? 0}`) + SVGT(o.x+18, o.y+52, `${o.v || ""}  DI 8 × 24 V DC`, "start", 10.5, 600)}},
  dq8:{g:"geraete", n:"SPS-Ausgänge DQ 8", lbl:"-KF1", w:200, h:70, def:{b:"0"}, feldliste:[["b","Byte-Adresse (%Q…)"]],
    anschluesse:() => [...Array.from({length: 8}, (_, i) => ["DQ" + i, 40 + i*20, 70, "d"]), ["L+", 0, 25, "l"], ["M", 0, 45, "l"]],
    zeichne:o => { let s = `<rect x="${o.x+10}" y="${o.y+10}" width="180" height="50" fill="#fff" ${SK}/>` + PP(`M${o.x} ${o.y+25}H${o.x+10}M${o.x} ${o.y+45}H${o.x+10}`) + PN(o.x+1, o.y+21, "L+") + PN(o.x+1, o.y+41, "M");
      for (let i = 0; i < 8; i++) s += PP(`M${o.x+40+i*20} ${o.y+60}V${o.y+70}`) + PN(o.x+40+i*20, o.y+55, "." + i, "middle");
      return s + PN(o.x+14, o.y+55, `%Q${o.b ?? 0}`) + SVGT(o.x+18, o.y+26, `${o.v || ""}  DQ 8 × 24 V DC`, "start", 10.5, 600)}},
  ps:{g:"geraete", n:"Netzteil 24 V DC", lbl:"-TA1", w:100, h:70, anschluesse:[["L",30,0,"u"],["N",50,0,"u"],["PE",70,0,"u"],["+",40,70,"d"],["−",60,70,"d"]],
    zeichne:o => `<rect x="${o.x+10}" y="${o.y+10}" width="80" height="50" fill="#fff" ${SK}/>` + PP(`M${o.x+30} ${o.y}V${o.y+10}M${o.x+50} ${o.y}V${o.y+10}M${o.x+70} ${o.y}V${o.y+10}M${o.x+40} ${o.y+60}V${o.y+70}M${o.x+60} ${o.y+60}V${o.y+70}M${o.x+10} ${o.y+60}L${o.x+90} ${o.y+10}`)
      + SVGT(o.x+28, o.y+32, "~", "middle", 14, 600) + SVGT(o.x+72, o.y+52, "=", "middle", 14, 600) + PN(o.x+33, o.y+8, "L") + PN(o.x+53, o.y+8, "N") + PN(o.x+73, o.y+8, "PE") + PN(o.x+43, o.y+68, "+") + PN(o.x+63, o.y+68, "−") + LB(o.x+6, o.y+40, o.v)},
  sr:{g:"geraete", n:"Sicherheitsrelais", lbl:"-KF2", w:220, h:80,
    anschluesse:[["A1",30,0,"u"],["S11",60,0,"u"],["S12",80,0,"u"],["S21",110,0,"u"],["S22",130,0,"u"],["S34",160,0,"u"],["13",180,0,"u"],["23",200,0,"u"],["A2",30,80,"d"],["14",180,80,"d"],["24",200,80,"d"]],
    zeichne:o => { let s = `<rect x="${o.x+10}" y="${o.y+10}" width="200" height="60" fill="#fff" ${SK}/>` + SVGT(o.x+110, o.y+44, "Sicherheitsrelais", "middle", 11, 600) + LB(o.x+6, o.y+44, o.v);
      BAUSTEIN.sr.anschluesse.forEach(([n, dx, dy]) => { s += dy ? PP(`M${o.x+dx} ${o.y+70}V${o.y+80}`) + PN(o.x+dx, o.y+66, n, "middle") : PP(`M${o.x+dx} ${o.y}V${o.y+10}`) + PN(o.x+dx, o.y+20, n, "middle"); });
      return s; }}
});
