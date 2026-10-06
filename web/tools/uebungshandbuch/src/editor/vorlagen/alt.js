// Alle Vorlagen, Bausteingruppen und Bausteine, wie sie vor der Aufteilung in vorlage.html standen.
// Diese Datei meldet sie in der Registry an (editor/registry.js). Nach und nach zieht jede Vorlage in eine
// eigene Datei vorlagen/<key>.js um; wie das geht, steht in vorlagen/README.md.
import { BLK, LABEL_HINT, PROPS, SAMPLE, fuelle, registriereGruppe, registriereVorlage } from '../registry.js';
import { G, G2, TX, grid } from '../vorlagen-svg.js';
import { rund } from '../bausteine.js';

/* ---------- Vorlagen: Reihenfolge = Reihenfolge der Kacheln ---------- */
registriereVorlage("regelkreis", {n: "Regelkreis", d: "Blockschaltbild Regler, Stellglied, Strecke, Messglied", gruppen: ["regel"], body: (ex, page, meta) => tplBody("regelkreis", ex, page, meta)});
registriereVorlage("trend", {n: "Trendaufzeichnung", d: "Istwert, Sollwert und Stellgröße über der Zeit", einblattig: true, body: (ex, page, meta) => tplBody("trend", ex, page, meta)});
registriereVorlage("raster", {n: "Kästchenraster", d: "5-mm-Raster für alles Weitere", gruppen: ["grafcet", "zustand", "elektro", "geraete", "leistung", "pneu", "regel"], body: (ex, page, meta) => tplBody("raster", ex, page, meta)});

/* ---------- Bausteingruppen: Name in der Palette und Bedienhinweis ---------- */
registriereGruppe("regel", {pfeiltext: true, name: "Regelkreis", hinweis: "Blöcke und Summierstelle setzen, mit Verbinden den Signalfluss ziehen. Doppelklick auf einen Pfeil beschriftet ihn."});

/* ---------- Bausteintabellen ---------- */
fuelle(BLK, {
  box:{g:"regel", n:"Block"}, sum:{g:"regel", n:"Summierstelle", ...rund(15), beschriftung: false}
});
fuelle(SAMPLE, {
  box:[{k:"box", x:2, y:2, v:"Regler"}, "0 0 114 54"], sum:[{k:"sum", x:24, y:24}, "0 0 48 48"]
});
fuelle(PROPS, {box:[["v","Bezeichnung"]]});
fuelle(LABEL_HINT, {box:"Bezeichnung, z. B. Regler"});

/* ---------- Vorgedruckter Inhalt je Vorlage ---------- */
function tplBody(key, ex, page=0, meta=null){
  switch (key) {
    case "raster": return grid(10, G2);
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
