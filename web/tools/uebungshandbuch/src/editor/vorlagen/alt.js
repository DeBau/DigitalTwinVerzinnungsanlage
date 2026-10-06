// Alle Vorlagen, Bausteingruppen und Bausteine, wie sie vor der Aufteilung in vorlage.html standen.
// Diese Datei meldet sie in der Registry an (editor/registry.js). Nach und nach zieht jede Vorlage in eine
// eigene Datei vorlagen/<key>.js um; wie das geht, steht in vorlagen/README.md.
import { INK, SVGT, arrowHead } from '../svg.js';
import { BLK, LABEL_HINT, PC, PROPS, SAMPLE, fuelle, registriereGruppe, registriereVorlage } from '../registry.js';
import { G, G2, TX, grid } from '../vorlagen-svg.js';
import { BLUE, LB, PD, PN, PP, SK, VALVE, cylinder, drawValve, posOf, pressed, thin, vPairs, vstate } from '../bauteile.js';
import { rund } from '../bausteine.js';

/* ---------- Vorlagen: Reihenfolge = Reihenfolge der Kacheln ---------- */
registriereVorlage("leistung", {n: "Hauptstromkreis", d: "L1, L2, L3, N, PE – Schütze, Wendeschützschaltung, Motorschutz, Motoren, Umrichter", gruppen: ["leistung", "geraete", "elektro"], schienen: [["L1",50,60,915], ["L2",70,60,915], ["L3",90,60,915], ["N",110,60,915], ["PE",130,60,915]], body: (ex, page, meta) => tplBody("leistung", ex, page, meta)});
registriereVorlage("pneumatik", {n: "Pneumatikschaltplan", d: "Zylinder, Wegeventile, Drosseln nach ISO 1219 – mit Simulation", gruppen: ["pneu"], body: (ex, page, meta) => tplBody("pneumatik", ex, page, meta)});
registriereVorlage("regelkreis", {n: "Regelkreis", d: "Blockschaltbild Regler, Stellglied, Strecke, Messglied", gruppen: ["regel"], body: (ex, page, meta) => tplBody("regelkreis", ex, page, meta)});
registriereVorlage("trend", {n: "Trendaufzeichnung", d: "Istwert, Sollwert und Stellgröße über der Zeit", einblattig: true, body: (ex, page, meta) => tplBody("trend", ex, page, meta)});
registriereVorlage("raster", {n: "Kästchenraster", d: "5-mm-Raster für alles Weitere", gruppen: ["grafcet", "zustand", "elektro", "geraete", "leistung", "pneu", "regel"], body: (ex, page, meta) => tplBody("raster", ex, page, meta)});

/* ---------- Bausteingruppen: Name in der Palette und Bedienhinweis ---------- */
registriereGruppe("leistung", {name: "Hauptstromkreis", hinweis: "Bauteile setzen und mit Verbinden Anschluss für Anschluss verdrahten: erst den Anschluss am einen, dann am anderen Bauteil anklicken – auch direkt auf die Schienen L1, L2, L3, N, PE. Wendeschützschaltung: zwei Schütze, beim zweiten L1 und L3 tauschen."});
registriereGruppe("pneu", {name: "Pneumatik nach ISO 1219", hinweis: "Ventile, Zylinder und Quelle setzen, mit Verbinden die Leitungen von Anschluss zu Anschluss ziehen. Freie Entlüftungen 3 und 5 bekommen ihr Dreieck selbst. Mit Simulation die Ventilbetätigung links oder rechts anklicken."});
registriereGruppe("regel", {pfeiltext: true, name: "Regelkreis", hinweis: "Blöcke und Summierstelle setzen, mit Verbinden den Signalfluss ziehen. Doppelklick auf einen Pfeil beschriftet ihn."});

/* ---------- Bausteintabellen ---------- */
fuelle(BLK, {
  box:{g:"regel", n:"Block"}, sum:{g:"regel", n:"Summierstelle", ...rund(15), beschriftung: false}
});
fuelle(PC, {
  /* Hauptstromkreis – drei Pole bei 10/30/50 */
  ls3:{g:"leistung", n:"Leitungsschutzschalter 3-polig", lbl:"-FA2", w:60, h:60, ports:[["1",10,0,"u"],["3",30,0,"u"],["5",50,0,"u"],["2",10,60,"d"],["4",30,60,"d"],["6",50,60,"d"]],
    draw:o => [10,30,50].map(d => PP(`M${o.x+d} ${o.y}V${o.y+20}M${o.x+d} ${o.y+60}V${o.y+42}L${o.x+d-11} ${o.y+21}M${o.x+d-3} ${o.y+17}L${o.x+d+3} ${o.y+23}M${o.x+d+3} ${o.y+17}L${o.x+d-3} ${o.y+23}`)).join("") + PD(`M${o.x+4} ${o.y+31}H${o.x+46}`) + LB(o.x-4, o.y+35, o.v)},
  ms3:{g:"leistung", n:"Motorschutzschalter", lbl:"-FA1", w:90, h:60, ports:[["1",10,0,"u"],["3",30,0,"u"],["5",50,0,"u"],["2",10,60,"d"],["4",30,60,"d"],["6",50,60,"d"]],
    draw:o => [10,30,50].map(d => PP(`M${o.x+d} ${o.y}V${o.y+20}M${o.x+d} ${o.y+60}V${o.y+42}L${o.x+d-11} ${o.y+21}M${o.x+d-3} ${o.y+17}L${o.x+d+3} ${o.y+23}M${o.x+d+3} ${o.y+17}L${o.x+d-3} ${o.y+23}`)).join("") + PD(`M${o.x+4} ${o.y+31}H${o.x+62}`)
      + `<rect x="${o.x+62}" y="${o.y+21}" width="26" height="20" fill="#fff" ${SK}/>` + SVGT(o.x+75, o.y+35, "I> ϑ", "middle", 9, 600) + LB(o.x-4, o.y+35, o.v)},
  k3:{g:"leistung", n:"Schütz 3-polig (Hauptkontakte)", lbl:"-QA1", w:60, h:60, ports:[["1",10,0,"u"],["3",30,0,"u"],["5",50,0,"u"],["2",10,60,"d"],["4",30,60,"d"],["6",50,60,"d"]],
    draw:o => [10,30,50].map(d => PP(`M${o.x+d} ${o.y}V${o.y+20}M${o.x+d} ${o.y+60}V${o.y+42}L${o.x+d-11} ${o.y+21}`) + `<path d="M${o.x+d-3.5} ${o.y+20}A3.5 3.5 0 0 0 ${o.x+d+3.5} ${o.y+20}" ${SK}/>`).join("") + PD(`M${o.x+4} ${o.y+31}H${o.x+46}`) + LB(o.x-4, o.y+35, o.v)},
  qs3:{g:"leistung", n:"Hauptschalter 3-polig", lbl:"-QB1", w:60, h:60, ports:[["1",10,0,"u"],["3",30,0,"u"],["5",50,0,"u"],["2",10,60,"d"],["4",30,60,"d"],["6",50,60,"d"]],
    draw:o => [10,30,50].map(d => PP(`M${o.x+d} ${o.y}V${o.y+20}M${o.x+d} ${o.y+60}V${o.y+42}L${o.x+d-11} ${o.y+21}M${o.x+d-4} ${o.y+20}H${o.x+d+4}`)).join("") + PD(`M${o.x+4} ${o.y+31}H${o.x+64}`) + PP(`M${o.x+64} ${o.y+25}V${o.y+37}`) + LB(o.x-4, o.y+35, o.v)},
  m3:{g:"leistung", n:"Drehstrommotor", lbl:"-MA1", w:60, h:80, ports:[["U1",10,0,"u"],["V1",30,0,"u"],["W1",50,0,"u"]],
    draw:o => PP(`M${o.x+10} ${o.y}V${o.y+43}M${o.x+30} ${o.y}V${o.y+30}M${o.x+50} ${o.y}V${o.y+43}`) + `<circle cx="${o.x+30}" cy="${o.y+52}" r="22" fill="#fff" ${SK}/>` + SVGT(o.x+30, o.y+54, "M", "middle", 15, 600) + SVGT(o.x+30, o.y+68, "3~", "middle", 10, 500)
      + PN(o.x+12, o.y+10, "U1") + PN(o.x+32, o.y+10, "V1") + PN(o.x+52, o.y+10, "W1") + LB(o.x-4, o.y+56, o.v)},
  fu:{g:"leistung", n:"Frequenzumrichter", lbl:"-TA2", w:80, h:90, ports:[["L1",10,0,"u"],["L2",30,0,"u"],["L3",50,0,"u"],["PE",70,0,"u"],["U",10,90,"d"],["V",30,90,"d"],["W",50,90,"d"],["PE2",70,90,"d"]],
    draw:o => `<rect x="${o.x}" y="${o.y+15}" width="80" height="60" fill="#fff" ${SK}/>` + PP(`M${o.x} ${o.y+75}L${o.x+80} ${o.y+15}` + [10,30,50,70].map(d => `M${o.x+d} ${o.y}V${o.y+15}M${o.x+d} ${o.y+75}V${o.y+90}`).join(""))
      + SVGT(o.x+18, o.y+36, "~", "middle", 14, 600) + SVGT(o.x+62, o.y+66, "~", "middle", 14, 600) + ["L1","L2","L3","PE"].map((n, i) => PN(o.x+12+i*20, o.y+9, n)).join("") + ["U","V","W","PE"].map((n, i) => PN(o.x+12+i*20, o.y+87, n)).join("") + LB(o.x-4, o.y+48, o.v)},
  rail:{g:"leistung", n:"Potenzialschiene", lbl:"L+", w:400, h:0, props:[["w","Länge","text"]],
    draw:o => `<path d="M${o.x} ${o.y}H${o.x+(o.w||400)}" stroke="${INK}" stroke-width="2.2" ${o.v === "PE" ? 'stroke-dasharray="10 4"' : ""}/>` + LB(o.x-6, o.y+4, o.v)},
  /* Pneumatik nach ISO 1219 – Energiefluss von unten nach oben */
  src:{g:"pneu", n:"Druckluftquelle", lbl:"", w:30, h:40, ports:[["1",15,0,"u"]], sim:() => ({src: ["1"]}),
    draw:o => PP(`M${o.x+15} ${o.y}V${o.y+16}`) + `<circle cx="${o.x+15}" cy="${o.y+27}" r="11" fill="#fff" stroke="${INK}" stroke-width="1.6"/><circle cx="${o.x+15}" cy="${o.y+27}" r="2.6" fill="${INK}"/>` + LB(o.x-4, o.y+31, o.v)},
  frl:{g:"pneu", n:"Wartungseinheit", lbl:"-AZ1", w:50, h:60, ports:[["1",20,60,"d"],["2",20,0,"u"]], sim:() => ({pairs: [["1","2"]]}),
    draw:o => `<rect x="${o.x+2}" y="${o.y+10}" width="46" height="40" fill="none" stroke="${INK}" stroke-width="1" stroke-dasharray="7 2 1.5 2"/>`
      + PP(`M${o.x+20} ${o.y}V${o.y+16}M${o.x+20} ${o.y+44}V${o.y+60}`) + `<path d="M${o.x+20} ${o.y+16}L${o.x+34} ${o.y+30}L${o.x+20} ${o.y+44}L${o.x+6} ${o.y+30}Z" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`
      + `<path d="M${o.x+10} ${o.y+30}H${o.x+30}" ${thin} stroke-dasharray="3 2"/><path d="M${o.x+34} ${o.y+30}H${o.x+38}" ${thin}/><circle cx="${o.x+42}" cy="${o.y+30}" r="4.5" fill="#fff" ${thin}/><path d="M${o.x+40} ${o.y+32}L${o.x+44.5} ${o.y+27.5}" ${thin}/>`
      + PN(o.x+23, o.y+7, "2") + PN(o.x+23, o.y+59, "1") + LB(o.x-4, o.y+34, o.v)},
  v22:{g:"pneu", n:"2/2-Wegeventil", lbl:"-MB14", hide:true, w:140, h:60, def:{al:"mag", ar:"feder", gs:"nc"}, ports:o => VALVE.v22.ports.map(([n, dx, d]) => [n, 70 + dx, d === "u" ? 0 : 60, d]),
    info:"Zwei Anschlüsse, zwei Stellungen: Durchgang von 1 nach 2 oder gesperrt. Kein Entlüftungsanschluss – die Leitung hinter dem Ventil bleibt beim Sperren unter Druck. An der Anlage: Luftmesser −MB14, Ausblasdüse −MB16, Frischwasser −MB17 (stromlos geschlossen).",
    props:[["gs","Grundstellung","select",[["nc","gesperrt (NC, stromlos geschlossen)"],["no","offen (NO, stromlos offen)"]]],["al","Betätigung links","select",[["mag","Magnet"],["magp","Magnet vorgesteuert"],["taster","Taster"],["hebel","Hebel"]]],["ar","Rückstellung rechts","select",[["feder","Feder"],["mag","Magnet"],["magp","Magnet vorgesteuert"]]]],
    sim:(o, s) => ({pairs: vPairs(o, s || "rest")}), draw:o => drawValve(o)},
  v32:{g:"pneu", n:"3/2-Wegeventil", lbl:"-MB1", hide:true, w:140, h:60, def:{al:"mag", ar:"feder", gs:"nc"}, ports:o => VALVE.v32.ports.map(([n, dx, d]) => [n, 70 + dx, d === "u" ? 0 : 60, d]),
    props:[["gs","Grundstellung","select",[["nc","gesperrt (NC)"],["no","offen (NO)"]]],["al","Betätigung links","select",[["mag","Magnet"],["magp","Magnet vorgesteuert"],["taster","Taster"],["hebel","Hebel"]]],["ar","Rückstellung rechts","select",[["feder","Feder"],["mag","Magnet"],["magp","Magnet vorgesteuert"]]]],
    sim:(o, s) => ({pairs: vPairs(o, s || "rest")}), draw:o => drawValve(o)},
  v52:{g:"pneu", n:"5/2-Wegeventil", lbl:"-MB1", hide:true, w:140, h:60, def:{al:"mag", ar:"feder"}, ports:o => VALVE.v52.ports.map(([n, dx, d]) => [n, 70 + dx, d === "u" ? 0 : 60, d]),
    props:[["al","Betätigung links (14)","select",[["mag","Magnet"],["magp","Magnet vorgesteuert"],["taster","Taster"],["hebel","Hebel"]]],["ar","Betätigung rechts (12)","select",[["feder","Feder – monostabil"],["mag","Magnet – bistabil"],["magp","Magnet vorgesteuert – bistabil"]]]],
    sim:(o, s) => ({pairs: vPairs(o, s || "rest")}), draw:o => drawValve(o)},
  v53:{g:"pneu", n:"5/3-Wegeventil", lbl:"-MB1", hide:true, w:180, h:60, def:{al:"mag", ar:"mag"}, ports:o => VALVE.v53.ports.map(([n, dx, d]) => [n, 70 + dx, d === "u" ? 0 : 60, d]),
    props:[["al","Betätigung links (14)","select",[["mag","Magnet"],["magp","Magnet vorgesteuert"]]],["ar","Betätigung rechts (12)","select",[["mag","Magnet"],["magp","Magnet vorgesteuert"]]]],
    sim:(o, s) => ({pairs: vPairs(o, s || "center")}), draw:o => drawValve(o)},
  zyl2:{g:"pneu", n:"Zylinder doppeltwirkend", lbl:"-MM1", w:240, h:60, def:{s1:"", s2:""}, ports:[["A",10,60,"d"],["B",110,60,"d"]],
    props:[["s1","Sensor hintere Endlage","text"],["s2","Sensor vordere Endlage","text"],["dp","Endlagendämpfung","select",[["","ohne"],["fest","beidseitig fest"],["einst","beidseitig einstellbar"]]],["mk","Magnetkolben (für berührungslose Sensoren)","select",[["","nein"],["ja","ja"]]]], draw:o => cylinder(o, false)},
  zyl1:{g:"pneu", n:"Zylinder einfachwirkend mit Feder", lbl:"-MM1", w:240, h:60, def:{s1:"", s2:""}, ports:[["A",10,60,"d"]],
    props:[["s1","Sensor hintere Endlage","text"],["s2","Sensor vordere Endlage","text"],["mk","Magnetkolben (für berührungslose Sensoren)","select",[["","nein"],["ja","ja"]]]], draw:o => cylinder(o, true)},
  rot:{g:"pneu", n:"Schwenkantrieb", lbl:"-MM5", w:60, h:60, ports:[["A",20,60,"d"],["B",40,60,"d"]],
    draw:o => { const x = o.x, y = o.y, p = posOf(o), a = (-90 + p * 90) * Math.PI / 180, cx = x + 30, cy = y + 42, f = n => n.toFixed(1);
      return `<path d="M${x+8} ${cy}A22 22 0 0 1 ${x+52} ${cy}Z" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`                       // Halbkreis: begrenzter Schwenkwinkel
        + `<path d="M${x+20} ${cy-1}L${x+16} ${cy-9}H${x+24}Z" fill="${INK}"/><path d="M${x+40} ${cy-1}L${x+36} ${cy-9}H${x+44}Z" fill="${INK}"/>`   // zwei Richtungen
        + `<path d="M${x+11} ${y+12}A24 24 0 0 1 ${x+49} ${y+12}" ${thin}/>` + arrowHead(x+18, y+6.5, x+11, y+12, 6) + arrowHead(x+42, y+6.5, x+49, y+12, 6)
        + `<path d="M${cx} ${cy}L${f(cx + 15*Math.cos(a))} ${f(cy + 15*Math.sin(a))}" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="2.2" fill="${INK}"/>`
        + PP(`M${x+20} ${cy}V${y+60}M${x+40} ${cy}V${y+60}`) + PN(x+23, y+59, "A") + PN(x+43, y+59, "B") + LB(x-4, y+40, o.v); }},
  drv:{g:"pneu", n:"Drossel­rückschlag­ventil", lbl:"-RZ1", w:50, h:60, info:"Frei von 1 nach 2 (Kugel hebt ab), gedrosselt von 2 nach 1. Mit 1 zum Ventil und 2 zum Zylinder: Abluftdrosselung – der Normalfall. Um 180° gedreht: Zuluftdrosselung.", ports:[["1",20,60,"d"],["2",20,0,"u"]], sim:() => ({pairs: [["1","2"]]}),
    draw:o => { const x = o.x, y = o.y;
      return `<rect x="${x+1}" y="${y+8}" width="48" height="44" fill="none" stroke="${INK}" stroke-width="1" stroke-dasharray="7 2 1.5 2"/>`   // Baueinheit
        + PP(`M${x+20} ${y}V${y+14}M${x+20} ${y+46}V${y+60}M${x+12} ${y+14}H${x+36}M${x+12} ${y+46}H${x+36}M${x+12} ${y+14}V${y+46}M${x+36} ${y+14}V${y+24}M${x+36} ${y+42}V${y+46}`)
        + `<path d="M${x+7} ${y+22}Q${x+12} ${y+30} ${x+7} ${y+38}M${x+17} ${y+22}Q${x+12} ${y+30} ${x+17} ${y+38}" ${thin}/>`                   // Drossel
        + `<path d="M${x+3} ${y+41}L${x+21} ${y+19}" ${thin}/>` + arrowHead(x+3, y+41, x+21, y+19, 6)                                                // einstellbar
        + `<path d="M${x+30} ${y+37}L${x+36} ${y+43}L${x+42} ${y+37}" ${thin}/><circle cx="${x+36}" cy="${y+31}" r="5.5" fill="#fff" stroke="${INK}" stroke-width="1.5"/>`  // Kugel im Sitz
        + PN(x+23, y+6, "2") + PN(x+23, y+59, "1") + LB(x-4, y+34, o.v); }},
  dr:{g:"pneu", n:"Drosselventil einstellbar", lbl:"-RZ2", w:30, h:60, ports:[["1",15,60,"d"],["2",15,0,"u"]], sim:() => ({pairs: [["1","2"]]}),
    draw:o => PP(`M${o.x+15} ${o.y}V${o.y+60}`) + `<path d="M${o.x+10} ${o.y+22}Q${o.x+15} ${o.y+30} ${o.x+10} ${o.y+38}M${o.x+20} ${o.y+22}Q${o.x+15} ${o.y+30} ${o.x+20} ${o.y+38}" ${thin}/>`
      + `<path d="M${o.x+5} ${o.y+41}L${o.x+25} ${o.y+19}" ${thin}/>` + arrowHead(o.x+5, o.y+41, o.x+25, o.y+19, 6) + LB(o.x-2, o.y+34, o.v)},
  rv:{g:"pneu", n:"Rückschlagventil", lbl:"-RM1", w:30, h:60, ports:[["1",15,60,"d"],["2",15,0,"u"]], sim:(o, s, has) => ({dir: has("1") ? [["1","2"]] : []}),
    draw:o => PP(`M${o.x+15} ${o.y}V${o.y+25}M${o.x+15} ${o.y+42}V${o.y+60}`) + `<path d="M${o.x+8} ${o.y+35}L${o.x+15} ${o.y+42}L${o.x+22} ${o.y+35}" ${thin}/><circle cx="${o.x+15}" cy="${o.y+30}" r="5.5" fill="#fff" stroke="${INK}" stroke-width="1.5"/>` + LB(o.x-2, o.y+34, o.v)},
  /* Weitere Symbole der Anlage und Klassiker der Ausbildung */
  kh:{g:"pneu", n:"Absperrventil (Kugelhahn)", lbl:"-QM10", w:50, h:60, def:{zu:"auf"}, ports:[["1",20,60,"d"],["2",20,0,"u"]],
    info:"Handbetätigtes Absperrventil in der Zuleitung vor der Wartungseinheit. In der Simulation per Klick auf- und zudrehen.",
    props:[["zu","Stellung","select",[["auf","offen"],["zu","geschlossen"]]]],
    sim:(o, s) => ({pairs: (s || o.zu || "auf") === "auf" ? [["1","2"]] : []}),
    draw:o => { const x = o.x, y = o.y, open = (vstate(o) === "rest" ? (o.zu || "auf") : vstate(o)) === "auf";
      return PP(`M${x+20} ${y}V${y+18}M${x+20} ${y+42}V${y+60}`) + `<path d="M${x+11} ${y+18}H${x+29}L${x+11} ${y+42}H${x+29}Z" fill="${open ? "#fff" : INK}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`
        + `<path d="M${x+29} ${y+30}H${x+40}M${x+40} ${y+22}V${y+38}" ${thin}/>` + PN(x+23, y+7, "2") + PN(x+23, y+59, "1") + LB(x-2, y+34, o.v); }},
  mano:{g:"pneu", n:"Manometer", lbl:"", w:40, h:60, ports:[["1",20,60,"d"]], sim:() => ({}),
    draw:o => { const x = o.x, y = o.y, on = pressed(o, "1");
      return PP(`M${x+20} ${y+60}V${y+42}`) + `<circle cx="${x+20}" cy="${y+28}" r="14" fill="${on ? "#DCEBFF" : "#fff"}" stroke="${INK}" stroke-width="1.6"/>`
        + `<path d="M${x+10} ${y+38}L${x+28} ${y+20}" ${thin}/>` + arrowHead(x+10, y+38, x+29, y+19, 6) + LB(x-2, y+32, o.v); }},
  ds:{g:"pneu", n:"Druckschalter (pneumatisch-elektrisch)", lbl:"-BP1", w:70, h:60, ports:[["1",20,60,"d"]], sim:() => ({}),
    info:"Meldet der SPS, dass der Druck einen einstellbaren Wert überschritten hat – z. B. Druckluft vorhanden hinter der Wartungseinheit. Ausgang ist ein elektrischer Kontakt.",
    draw:o => { const x = o.x, y = o.y, on = pressed(o, "1");
      return PP(`M${x+20} ${y+60}V${y+44}`) + `<rect x="${x+4}" y="${y+14}" width="32" height="30" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`
        + `<path d="M${x+20} ${y+44}V${y+34}" ${thin}/><path d="M${x+15} ${y+34}L${x+20} ${y+26}L${x+25} ${y+34}Z" fill="${INK}"/>`                  // Druck wirkt auf den Messkolben
        + `<path d="M${x+8} ${y+40}L${x+32} ${y+18}" ${thin}/>` + arrowHead(x+8, y+40, x+33, y+17, 5)                                                // einstellbar
        + `<path d="M${x+36} ${y+29}H${x+44}M${x+58} ${y+29}H${x+66}" ${thin}/><path d="M${x+44} ${y+29}L${x+57} ${y+(on ? 29 : 21)}" stroke="${on ? "#2E7D4F" : INK}" stroke-width="1.6" stroke-linecap="round"/>`
        + LB(x+2, y+10, o.v, "start"); }},
  duese:{g:"pneu", n:"Blasdüse", lbl:"", w:40, h:60, ports:[["1",20,60,"d"]], sim:() => ({}),
    info:"Verbraucher hinter einem 2/2-Wegeventil: Luftmesser −MB14 (bläst das Wasser vom Korb) und Ausblasdüse −MB16 (n.i.O.-Teile).",
    draw:o => { const x = o.x, y = o.y, on = pressed(o, "1"), c = on ? BLUE : INK;
      return PP(`M${x+20} ${y+60}V${y+34}`) + `<path d="M${x+12} ${y+34}H${x+28}L${x+23} ${y+20}H${x+17}Z" fill="#fff" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`
        + `<path d="M${x+20} ${y+16}V${y+4}M${x+15} ${y+16}L${x+9} ${y+5}M${x+25} ${y+16}L${x+31} ${y+5}" stroke="${c}" stroke-width="1.3" stroke-dasharray="${on ? "4 2" : "2 3"}" fill="none"/>` + LB(x+4, y+32, o.v); }},
  wv:{g:"pneu", n:"Wechselventil (ODER)", lbl:"", w:60, h:60, ports:[["1",8,60,"d"],["3",52,60,"d"],["2",30,0,"u"]],
    info:"ODER-Glied: Druck an 1 ODER 3 gelangt nach 2. Die Kugel sperrt jeweils den anderen Eingang – keine Luft entweicht rückwärts.",
    sim:(o, s, has) => ({dir: [...(has("1") ? [["1","2"]] : []), ...(has("3") ? [["3","2"]] : [])]}),
    draw:o => { const x = o.x, y = o.y;
      return `<rect x="${x+4}" y="${y+20}" width="52" height="20" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`
        + `<path d="M${x+12} ${y+22}L${x+18} ${y+30}L${x+12} ${y+38}M${x+48} ${y+22}L${x+42} ${y+30}L${x+48} ${y+38}" ${thin}/><circle cx="${x+30}" cy="${y+30}" r="5.5" fill="#fff" stroke="${INK}" stroke-width="1.5"/>`
        + PP(`M${x+30} ${y}V${y+20}M${x+8} ${y+40}V${y+60}M${x+52} ${y+40}V${y+60}`) + PN(x+33, y+8, "2") + PN(x+11, y+58, "1") + PN(x+55, y+58, "3") + LB(x, y+34, o.v); }},
  zd:{g:"pneu", n:"Zweidruckventil (UND)", lbl:"", w:60, h:60, ports:[["1",8,60,"d"],["3",52,60,"d"],["2",30,0,"u"]],
    info:"UND-Glied: Nur wenn an 1 UND 3 Druck anliegt, gelangt Luft nach 2.",
    sim:(o, s, has) => ({dir: has("1") && has("3") ? [["1","2"],["3","2"]] : []}),
    draw:o => { const x = o.x, y = o.y;
      return `<rect x="${x+4}" y="${y+20}" width="52" height="20" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`
        + `<path d="M${x+12} ${y+22}V${y+38}M${x+48} ${y+22}V${y+38}" ${thin}/><rect x="${x+15}" y="${y+25}" width="8" height="10" fill="#fff" ${thin}/><rect x="${x+37}" y="${y+25}" width="8" height="10" fill="#fff" ${thin}/><path d="M${x+23} ${y+30}H${x+37}" ${thin}/>`
        + PP(`M${x+30} ${y}V${y+20}M${x+8} ${y+40}V${y+60}M${x+52} ${y+40}V${y+60}`) + PN(x+33, y+8, "2") + PN(x+11, y+58, "1") + PN(x+55, y+58, "3") + LB(x, y+34, o.v); }},
  se:{g:"pneu", n:"Schnell­entlüftungs­ventil", lbl:"-RM2", w:60, h:60, ports:[["1",20,60,"d"],["2",20,0,"u"]],
    info:"Direkt am Zylinder: Beim Entlüften strömt die Luft über 3 ins Freie statt den langen Weg zurück durchs Wegeventil – der Zylinder fährt schneller zurück.",
    sim:(o, s, has) => ({dir: has("1") ? [["1","2"]] : []}),
    draw:o => { const x = o.x, y = o.y;
      return PP(`M${x+20} ${y}V${y+18}M${x+20} ${y+42}V${y+60}M${x+20} ${y+30}H${x+44}`) + `<rect x="${x+8}" y="${y+18}" width="24" height="24" fill="none" stroke="${INK}" stroke-width="1" stroke-dasharray="7 2 1.5 2"/>`
        + `<circle cx="${x+20}" cy="${y+30}" r="5" fill="#fff" stroke="${INK}" stroke-width="1.5"/><path d="M${x+14} ${y+37}L${x+20} ${y+41}L${x+26} ${y+37}" ${thin}/>`
        + `<path d="M${x+44} ${y+24}L${x+54} ${y+30}L${x+44} ${y+36}Z" fill="#fff" stroke="${INK}" stroke-width="1.4"/>` + PN(x+23, y+8, "2") + PN(x+23, y+58, "1") + PN(x+46, y+22, "3") + LB(x+2, y+34, o.v); }},
  insel:{g:"pneu", n:"Ventilinsel (Baugruppenrahmen)", lbl:"-QM1", w:360, h:120, def:{fw:"360", fh:"120"},
    info:"Strichpunktierter Rahmen um die Ventile einer Ventilinsel, z. B. −QM1 Portal und −QM2 Band. Breite und Höhe links einstellen; die Ventile darin bleiben anklickbar.",
    props:[["fw","Breite","text"],["fh","Höhe","text"]],
    draw:o => `<rect x="${o.x}" y="${o.y}" width="${+o.fw || 360}" height="${+o.fh || 120}" fill="none" stroke="${INK}" stroke-width="1.2" stroke-dasharray="12 3 2 3"/>` + LB(o.x + 6, o.y - 6, o.v, "start")},
  sd:{g:"pneu", n:"Schalldämpfer", lbl:"", w:24, h:34, ports:[["1",12,0,"u"]],
    draw:o => PP(`M${o.x+12} ${o.y}V${o.y+10}`) + `<path d="M${o.x+12} ${o.y+10}L${o.x+22} ${o.y+20}L${o.x+12} ${o.y+30}L${o.x+2} ${o.y+20}Z" fill="#fff" stroke="${INK}" stroke-width="1.5"/><path d="M${o.x+6} ${o.y+17}H${o.x+18}M${o.x+5} ${o.y+20}H${o.x+19}M${o.x+6} ${o.y+23}H${o.x+18}" ${thin}/>`}
});
/* Palette: Ventil-Varianten als Voreinstellungen eines Grundtyps */
const PCPAL = {
  v22nc:{g:"pneu", n:"2/2-Wegeventil gesperrt, Magnet/Feder", mk:{k:"v22", gs:"nc", al:"mag", ar:"feder"}},
  v22no:{g:"pneu", n:"2/2-Wegeventil offen, Magnet/Feder", mk:{k:"v22", gs:"no", al:"mag", ar:"feder"}},
  v32nc:{g:"pneu", n:"3/2-Wegeventil gesperrt, Magnet/Feder", mk:{k:"v32", gs:"nc", al:"mag", ar:"feder"}},
  v32no:{g:"pneu", n:"3/2-Wegeventil offen, Magnet/Feder", mk:{k:"v32", gs:"no", al:"mag", ar:"feder"}},
  v32h:{g:"pneu", n:"3/2-Wegeventil Taster/Feder", mk:{k:"v32", gs:"nc", al:"taster", ar:"feder"}},
  v52m:{g:"pneu", n:"5/2-Wegeventil monostabil", mk:{k:"v52", al:"mag", ar:"feder"}},
  v52b:{g:"pneu", n:"5/2-Wegeventil bistabil (Impuls)", mk:{k:"v52", al:"mag", ar:"mag"}},
  v52p:{g:"pneu", n:"5/2 vorgesteuert, monostabil", mk:{k:"v52", al:"magp", ar:"feder"}},
  v52pb:{g:"pneu", n:"5/2 vorgesteuert, bistabil", mk:{k:"v52", al:"magp", ar:"magp"}},
  v53c:{g:"pneu", n:"5/3-Wegeventil Mitte gesperrt", mk:{k:"v53", al:"mag", ar:"mag"}}
};
fuelle(SAMPLE, {
  box:[{k:"box", x:2, y:2, v:"Regler"}, "0 0 114 54"], sum:[{k:"sum", x:24, y:24}, "0 0 48 48"]
});
fuelle(PROPS, {box:[["v","Bezeichnung"]]});
fuelle(LABEL_HINT, {box:"Bezeichnung, z. B. Regler"});
Object.entries(PC).forEach(([k, pc]) => { if (k === "zyl2") Object.assign(BLK, PCPAL); if (!BLK[k]) BLK[k] = {g: pc.g, n: pc.n, hide: pc.hide}; });

/* ---------- Vorgedruckter Inhalt je Vorlage ---------- */
function tplBody(key, ex, page=0, meta=null){
  switch (key) {
    case "raster": return grid(10, G2);
    case "leistung": {
      let r = "";
      [["L1",50],["L2",70],["L3",90],["N",110],["PE",130]].forEach(([n, y]) => { r += `<path d="M60 ${y}H975" stroke="${G}" stroke-width="2" ${n === "PE" ? 'stroke-dasharray="10 4"' : ""}/>` + TX(50, y + 4, 12, n, "end", "#555", 600); });
      return grid(10, "#EEF1F3", 40, 150, 975, 620) + r + TX(975, 38, 9, "3/N/PE AC 400/230 V 50 Hz", "end");
    }
    case "pneumatik": return grid(10, "#EEF1F3", 15, 15, 985, 630) + TX(25, 33, 10, "Energiefluss von unten nach oben: Versorgung unten, Ventile in der Mitte, Antriebe oben", "start");
    case "regelkreis": {
      const box = (x, y, w, h, lbl) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#fff" stroke="${G}" stroke-width="1.3"/>` + TX(x + w/2, y - 7, 10, lbl, "middle", "#666", 600);
      const ar = (d) => `<path d="${d}" fill="none" stroke="${G}" stroke-width="1.3" marker-end="url(#ah)"/>`;
      let s = `<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="${G}"/></marker></defs>`;
      s += `<circle cx="140" cy="200" r="16" fill="#fff" stroke="${G}" stroke-width="1.3"/><path d="M129 189L151 211M151 189L129 211" stroke="${G}"/>` + TX(126,190,11,"+","end") + TX(150,232,11,"−","start");
      s += ar("M60 200H122") + TX(60,190,12,"w","start","#555",600);
      s += box(200,165,150,70,"Regler") + ar("M156 200H198") + TX(176,190,11,"e","middle","#555");
      s += box(420,165,150,70,"Stellglied") + ar("M350 200H418") + TX(385,190,11,"y","middle","#555");
      s += box(640,165,150,70,"Strecke") + ar("M570 200H638");
      s += ar("M790 200H940") + TX(940,190,12,"x","end","#555",600);
      s += ar("M715 90V163") + TX(725,100,12,"z  Störgröße","start","#555");
      s += box(420,310,150,60,"Messglied") + ar("M860 200V340H572") + ar("M418 340H140V218");
      s += TX(60,440,12,"Größe","start","#666",600) + TX(260,440,12,"Bedeutung in dieser Übung","start","#666",600) + TX(640,440,12,"Signal / Adresse","start","#666",600);
      ["w Führungsgröße","x Regelgröße","e Regeldifferenz","y Stellgröße","z Störgröße"].forEach((r, i) => { const y = 470 + i*30; s += `<path d="M60 ${y+8}H975" stroke="${G2}" stroke-width=".7"/>` + TX(60, y, 12, r, "start", "#555"); });
      return s;
    }
    case "trend": {
      let s = "";
      const ax = (y0, h, lbl, unit) => { let r = `<path d="M80 ${y0}V${y0+h}H965" stroke="${G}" stroke-width="1.3" fill="none"/>`;
        for (let i = 1; i <= 8; i++) r += `<path d="M80 ${y0 + h - i*h/8}H965" stroke="${G2}" stroke-width=".5"/>`;
        for (let i = 1; i <= 16; i++) r += `<path d="M${80 + i*885/16} ${y0}V${y0+h}" stroke="${G2}" stroke-width=".5"/>`;
        return r + TX(70, y0+10, 11, lbl, "end", "#555", 600) + TX(70, y0+26, 9, unit, "end"); };
      s += ax(40, 380, "x, w", "Einheit:") + TX(965, 440, 11, "t in s", "end", "#555", 600);
      s += ax(470, 130, "y", "in %");
      return s;
    }
  }
  return "";
}
