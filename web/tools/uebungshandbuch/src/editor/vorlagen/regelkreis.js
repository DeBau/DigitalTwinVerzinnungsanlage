// Vorlage Regelkreis: Vordruck mit Muster-Regelkreis und Tabelle der Größen, Gruppe "regel" mit Pfeilen, Vorschlägen für
// die Signalnamen (w, e, y, z, x) und Verzweigungen. Die Bausteine stehen in regelkreis-bausteine.js, die Wege in
// regelkreis-wege.js. Das Muster ist eine echte Zeichnung (MUSTER): grau im Vordruck, mit "Muster übernehmen" als Bausteine.
import { ED } from '../status.js';
import { registriereGruppe, registriereVorlage } from '../registry.js';
import { G2, TX } from '../vorlagen-svg.js';
import { mitteVon } from '../bausteine.js';
import { uid } from '../auswahl.js';
import { zeichnungSVG } from '../zeichnen.js';
import { zeigeHinweis } from '../eigenschaften.js';
import { aendere } from '../verlauf.js';
import { eintrittsSeite, istPunkt, pfeilZug, verbindeRegelkreis } from './regelkreis-wege.js';

/* ---------- Muster und Vordruck ---------- */
// Der Standard-Regelkreis als Zeichnung: Mitten im 10er-Raster, Blöcke 60 hoch
export const MUSTER = {
  o: [
    {id: "w", k: "sig", x: 70, y: 200, v: "w"}, {id: "s", k: "sum", x: 150, y: 200},
    {id: "r", k: "box", x: 220, y: 170, v: "Regler"}, {id: "g", k: "box", x: 420, y: 170, v: "Stellglied"},
    {id: "z", k: "sig", x: 680, y: 90, v: "z"}, {id: "t", k: "box", x: 620, y: 170, v: "Strecke"},
    {id: "v", k: "abzw", x: 820, y: 200}, {id: "x", k: "sig", x: 920, y: 200, v: "x"},
    {id: "m", k: "box", x: 420, y: 300, v: "Messglied"},
  ],
  c: [["w", "s"], ["s", "r", "e"], ["r", "g", "y"], ["g", "t"], ["z", "t"], ["t", "v"], ["v", "x"], ["v", "m"], ["m", "s", "x"]]
    .map(([a, b, v = ""]) => ({a, b, v})),
  s: [], t: [],
};
// Sobald die Zeichnung einen Baustein hat, blendet diese Regel das Muster aus (CSS :has), damit Muster und gesetzte
// Bausteine nicht doppelt erscheinen. Der leere Vordruck druckt das Muster weiter.
export const MUSTER_AUS = `<style>svg:has(.ink [data-o]) .rk-muster{display:none}</style>`;
export const regelkreisMuster = () =>
  `<g class="rk-muster" opacity=".45" pointer-events="none">${zeichnungSVG(MUSTER, false, "regelkreis")}</g>`;
// Tabelle der Größen unter dem Kreis, mit dem Namen bei PID_Compact
export const REGELGROESSEN = ["w Führungsgröße (Sollwert, PID_Compact: Setpoint)", "x Regelgröße (Istwert, PID_Compact: Input)",
  "e Regeldifferenz (e = w − x)", "y Stellgröße (PID_Compact: Output)", "z Störgröße (PID_Compact: Disturbance)"];
export function groessenTabelle(){
  let s = TX(60, 440, 12, "Größe", "start", "#666", 600) + TX(400, 440, 12, "Bedeutung in dieser Übung", "start", "#666", 600)
    + TX(720, 440, 12, "Signal / Adresse", "start", "#666", 600);
  REGELGROESSEN.forEach((r, i) => {
    const y = 470 + i*30;
    s += `<path d="M60 ${y+8}H975" stroke="${G2}" stroke-width=".7"/>` + TX(60, y, 11, r, "start", "#555");
  });
  return s;
}
export const regelkreisBlatt = () => MUSTER_AUS + regelkreisMuster() + groessenTabelle();

// Muster als Bausteine in die Zeichnung übernehmen (nur, solange sie keine Bausteine hat)
export function musterUebernehmen(){
  if (ED.data.o.length) { zeigeHinweis("Das Muster lässt sich nur auf ein Blatt ohne Bausteine übernehmen."); return; }
  const neu = Object.fromEntries(MUSTER.o.map(o => [o.id, uid()]));
  aendere(d => {
    d.o.push(...MUSTER.o.map(o => ({...o, id: neu[o.id]})));
    d.c.push(...MUSTER.c.map(c => ({...c, a: neu[c.a], b: neu[c.b]})));
  });
}

/* ---------- Gruppe: Vorschläge und Verzweigungen ---------- */
export const REGLERTYPEN = ["P", "I", "PI", "PID", "2P"];
export const istRegler = o => o.k === "box" && (REGLERTYPEN.includes(o.typ) || /regler/i.test(o.v || ""));
// Vorschlag für den Namen am Pfeil von A nach B: e hinter der Summierstelle, x an der Rückführung, y hinter dem Regler.
// An einem Signal steht der Name schon am Signal (w, z, x).
export function signalVorschlag(A, B){
  if (istPunkt(A) && A.k === "sig") return "";
  if (A.k === "sum") return "e";
  if (B.k === "sum" && eintrittsSeite(B, mitteVon(A)) !== "l") return "x";
  return istRegler(A) ? "y" : "";
}
// Signalname für ein neues Signal: der erste freie aus w, x, z
export const signalName = d => ["w", "x", "z"].find(n => !d.o.some(o => o.k === "sig" && o.v === n)) || "";
// Hat A schon einen Pfeil, teilt sich das Signal: Auf dem ersten Abschnitt des alten Pfeils entsteht eine Verzweigung,
// von der beide Pfeile ausgehen.
export function verzweige(d, A, alt, B, v){
  const objs = Object.fromEntries(d.o.map(o => [o.id, o])), [p1, p2] = pfeilZug(A, objs[alt.b], objs, d.c).punkte;
  const id = uid(), r10 = q => Math.round(q / 10) * 10;
  d.o.push({id, k: "abzw", x: r10((p1[0] + p2[0]) / 2), y: r10((p1[1] + p2[1]) / 2)});
  d.c.push({a: A.id, b: id, v: ""}, {a: id, b: B.id, v});
  alt.a = id;
}
// Gruppen-Haken vorVerbinden: Pfeil mit Namensvorschlag, bei einem zweiten Pfeil aus A über eine Verzweigung
export function vorVerbinden(A, B){
  const v = signalVorschlag(A, B);
  return {ersetze(d){
    const alt = d.c.find(c => c.a === A.id && c.pa === undefined && c.b !== B.id);
    if (alt && A.k !== "abzw") verzweige(d, A, alt, B, v); else d.c.push({a: A.id, b: B.id, v});
  }};
}

registriereGruppe("regel", {name: "Regelkreis", pfeiltext: true,
  hinweis: "Bausteine setzen, mit Verbinden den Signalfluss ziehen. Namen wie e, y und x schlägt der Editor vor, "
    + "Doppelklick auf einen Pfeil ändert sie. Ein zweiter Pfeil aus demselben Baustein bekommt eine Verzweigung.",
  verbinde: verbindeRegelkreis, vorVerbinden,
  kennzeichen: (k, d, vorschlag) => k === "sig" ? signalName(d) : vorschlag,
});

export const MUSTERKNOPF = `<button type="button" class="tool" data-rk="muster" `
  + `title="Den grauen Muster-Regelkreis als Bausteine übernehmen und dann anpassen">Muster übernehmen</button>`;
// Knöpfe der Vorlage (data-rk)
export const AKTIONEN_RK = {muster: musterUebernehmen};
registriereVorlage("regelkreis", {
  n: "Regelkreis", d: "Blockschaltbild Regler, Stellglied, Strecke, Messglied", gruppen: ["regel", "regelglied"],
  body: (ex, page) => page ? "" : regelkreisBlatt(),
  werkzeugleiste: {nachVerbinden: MUSTERKNOPF},
  klick(e){
    const k = e.target.closest("[data-rk]"), aktion = k && AKTIONEN_RK[k.dataset.rk];
    if (aktion) aktion(k);
    return !!aktion;
  },
});
