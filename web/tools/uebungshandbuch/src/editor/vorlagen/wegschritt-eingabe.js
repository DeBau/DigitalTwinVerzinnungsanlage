// Weg-Schritt-Diagramm: Schnelleingabe und Prüfung. Eine Zeile wie „MM2−, MM3+, MM2+, t = 10 s, MM2−, MM3−, MM2+“
// ergibt Funktionslinien, Signallinien mit den Endlagensensoren der Anlage (anlage-antriebe.js), Start und Zyklusende.
// Gleichzeitige Bewegungen stehen mit Leerzeichen in einem Schritt („MM1+ MM2+“). Dazu die Bedeutung von 1 und 0 je
// Zeile und die Prüfregeln (Haken pruefe). Benutzt von vorlagen/wegschritt.js.
import { $, quelle } from '../../app/basis.js';
import { ED } from '../status.js';
import { aendere } from '../verlauf.js';
import { ANTRIEBE, antriebZu } from './anlage-antriebe.js';
import { WS_RASTER, sigLoop, spalteBei, wsAus, wsPunkt, wsZeilen, zeileBei, zeilenName } from './wegschritt-striche.js';

/* ---------- Ablauf lesen ---------- */
const ANLAGE_ANTRIEBE = Object.keys(ANTRIEBE).map(mm => "−" + mm).join(", ");   // für die Meldung „gibt es nicht“
// Eine Wartezeit braucht eine Bewegung davor: nicht am Anfang, nicht zwei Zeiten hintereinander. Meldung oder ""
function zeitFehler(schritte, roh){
  if (!schritte.length) return `Der Ablauf beginnt mit dem Start −SF1 und einer Bewegung. Setz „${roh}“ hinter eine `
    + `Bewegung, z. B. MM2−, ${roh}, MM2+.`;
  if (schritte[schritte.length - 1].zeit) return `„${roh}“ folgt direkt auf eine Wartezeit. Fasse beide zu einer Zeit `
    + `zusammen, z. B. t = 5 s.`;
  return "";
}
// Text → [{moves: [{mm, aus}], zeit}] oder {fehler}. "−", "-" und "–" gelten als Minus.
export function leseAblauf(text){
  const schritte = [];
  for (const roh of String(text).split(/[,;]/).map(t => t.trim()).filter(Boolean)) {
    const zeit = /^t\s*=\s*(.+)$/i.exec(roh);
    if (zeit && zeitFehler(schritte, roh)) return {fehler: zeitFehler(schritte, roh)};
    if (zeit) { schritte.push({moves: [], zeit: "t = " + zeit[1].trim()}); continue; }
    const moves = roh.split(/\s+/).map(m => /^[-−–]?(MM\d+)([+\-−–])$/i.exec(m));
    if (!moves.length || moves.some(m => !m)) return {fehler: `„${roh}“ verstehe ich nicht. Beispiel: MM2−, MM3+, t = 10 s`};
    const unbekannt = moves.map(m => m[1].toUpperCase()).find(mm => !ANTRIEBE[mm]);
    if (unbekannt) return {fehler: `−${unbekannt} gibt es an der Anlage nicht. Es gibt ${ANLAGE_ANTRIEBE}.`};
    schritte.push({moves: moves.map(m => ({mm: m[1].toUpperCase(), aus: m[2] === "+"}))});
  }
  if (!schritte.length) return {fehler: "Trag einen Ablauf ein, z. B. MM2−, MM3+, MM2+."};
  if (schritte.length > WS_RASTER.spalten - 1) return {fehler: `Höchstens ${WS_RASTER.spalten - 1} Schritte passen ins Formular.`};
  return {schritte};
}
// Zeile je Antrieb: vorhandener Zeilenname mit dem Kennzeichen, sonst die nächste freie Zeile (bekommt den Namen)
export function zeilenFuer(schritte, namen){
  const neu = [...namen], zeile = {};
  schritte.flatMap(s => s.moves).forEach(({mm}) => {
    if (zeile[mm] !== undefined) return;
    let i = neu.findIndex(n => antriebZu(n) && antriebZu(n)[0] === mm);
    if (i < 0) i = neu.findIndex(n => !n);
    if (i < 0) return;
    if (!neu[i]) neu[i] = "−" + mm;
    zeile[mm] = i;
  });
  return {zeile, namen: neu};
}
// Stellung jedes Antriebs an jeder Schrittgrenze; Grundstellung = Gegenteil der ersten Bewegung
export function stellungen(schritte){
  const pos = {};
  schritte.forEach(s => s.moves.forEach(({mm, aus}) => { if (!pos[mm]) pos[mm] = [aus ? 0 : 1]; }));
  schritte.forEach((s, j) => Object.keys(pos).forEach(mm => {
    const m = s.moves.find(x => x.mm === mm);
    pos[mm][j + 1] = m ? (m.aus ? 1 : 0) : pos[mm][j];
  }));
  return pos;
}

/* ---------- Zeichnen ---------- */
const LINIENFARBE = {c: "#17212B"};
// Funktionslinien eines Antriebs: je Abschnitt gleicher Richtung eine Linie
export function funktionslinien(p, zeile){
  const s = [];
  for (let j = 0; j + 1 < p.length; j++) {
    const a = wsPunkt(j, zeile, p[j]), b = wsPunkt(j + 1, zeile, p[j + 1]), letzte = s[s.length - 1];
    if (letzte && p[j] === p[j + 1] && letzte.p[0][1] === letzte.p[1][1] && letzte.p[1][1] === a[1]) letzte.p[1] = b;
    else s.push({k: "l", ...LINIENFARBE, w: 2.8, p: [a, b]});
  }
  return s;
}
// Auslöser von Schritt j: Endlagensensoren der Antriebe, die in Schritt j − 1 (bzw. vor der Wartezeit) fertig wurden.
// leseAblauf sorgt dafür, dass vor jeder Wartezeit eine Bewegung steht.
export function ausloeser(schritte, j){
  const vorher = schritte[j - 1].zeit ? schritte[j - 2] : schritte[j - 1];
  const zeit = schritte[j - 1].zeit, an = vorher ? vorher.moves : [];
  return {zeit, sensoren: an.map(({mm, aus}) => ({mm, aus, j: schritte[j - 1].zeit ? j - 1 : j,
    tag: ANTRIEBE[mm] ? "−" + ANTRIEBE[mm][aus ? "s2" : "s1"] : ""}))};
}
// Signallinien zu Schritt j: von jedem Sensor zum Beginn jeder Bewegung; mehrere Sensoren über eine UND-Verknüpfung
export function signallinien(schritte, j, zeile){
  const {zeit, sensoren} = ausloeser(schritte, j), s = [];
  const quelle = q => wsPunkt(q.j, zeile[q.mm], q.aus ? 1 : 0);
  if (!sensoren.length) return s;
  schritte[j].moves.forEach(({mm, aus}) => {
    const ziel = wsPunkt(j, zeile[mm], aus ? 0 : 1), tz = zeit ? {tz: zeit} : {};
    if (sensoren.length === 1) {
      s.push({k: "sig", ...LINIENFARBE, w: 1.2, p: [quelle(sensoren[0]), ziel], lbl: sensoren[0].tag, ...tz});
      return;
    }
    const J = [ziel[0], ziel[1] - wsAus(ziel[1]) * 18];
    s.push({k: "vk", ...LINIENFARBE, w: 1.2, t: "und", p: [J]}, {k: "sig", ...LINIENFARBE, w: 1.2, p: [J, ziel], lbl: "", ...tz});
    sensoren.forEach(q => s.push({k: "sig", ...LINIENFARBE, w: 1.2, p: [quelle(q), J], lbl: q.tag}));
  });
  return s;
}
// Alle Striche des Ablaufs: Funktionslinien, Start, Signallinien, Zyklusende
export function ablaufStriche(schritte, zeile, zeilen){
  const pos = stellungen(schritte), s = Object.keys(pos).flatMap(mm => funktionslinien(pos[mm], zeile[mm]));
  schritte[0].moves.forEach(({mm, aus}) => s.push({k: "st", ...LINIENFARBE, w: 1.2, p: [wsPunkt(0, zeile[mm], aus ? 0 : 1)],
    lbl: "−SF1"}));
  schritte.forEach((st, j) => { if (j > 0 && st.moves.length) s.push(...signallinien(schritte, j, zeile)); });
  const xEnde = wsPunkt(schritte.length, 0, 1)[0];
  s.push({k: "eq", ...LINIENFARBE, w: 2.6, p: [[xEnde, 57]], y2: WS_RASTER.y0 + zeilen * WS_RASTER.zeile});
  return s;
}
export const WS_ARTEN = ["l", "sig", "st", "eq", "vk"];
// Schnelleingabe ausführen: Diagramm ersetzen (nach Rückfrage, wenn schon gezeichnet), Zeilennamen ergänzen
export function ablaufZeichnen(text){
  const r = leseAblauf(text);
  if (r.fehler) return r.fehler;
  const namen = wsZeilen(ED.scope).map((v, i) => zeilenName(ED.data.meta, v, i));
  const {zeile, namen: neu} = zeilenFuer(r.schritte, namen);
  const fehlt = r.schritte.flatMap(s => s.moves).find(m => zeile[m.mm] === undefined);
  if (fehlt) return `Für −${fehlt.mm} ist keine Zeile frei.`;
  if (ED.data.s.some(st => WS_ARTEN.includes(st.k)) && !confirm("Vorhandene Linien im Diagramm ersetzen?")) return "";
  aendere(d => {
    d.s = [...d.s.filter(st => !WS_ARTEN.includes(st.k)), ...ablaufStriche(r.schritte, zeile, namen.length)];
    if (neu.some((n, i) => n !== namen[i])) { d.meta = d.meta || {}; d.meta.rows = neu; }
  });
  return "";
}

/* ---------- Bedienung in der Seitenleiste ---------- */
const EINGABE_HINWEIS = "+ fährt aus (1), − fährt ein (0). Sensoren und Zeilen kommen aus der Anlage.";
export const EINGABE_HTML = `<div class="palg"><div class="palh">Schnelleingabe</div>`
  + `<label class="prop">Ablauf, Schritt für Schritt<input type="text" data-wsablauf placeholder="MM2−, MM3+, MM2+, t = 10 s" `
  + `autocomplete="off"></label><button type="button" class="tool" data-wsablaufknopf>Diagramm zeichnen</button>`
  + `<p class="small muted" data-wsablaufhinweis style="margin:6px 0 0">${EINGABE_HINWEIS}</p></div>`;
// Haken klick: Knopf „Diagramm zeichnen“; true, wenn erledigt. Ohne Fehler steht wieder der Ausgangshinweis da.
export function eingabeKlick(e){
  if (!e.target.closest("[data-wsablaufknopf]")) return false;
  const feld = $("#editor [data-wsablauf]"), hinweis = $("#editor [data-wsablaufhinweis]");
  const fehler = ablaufZeichnen(feld ? feld.value : "");
  if (hinweis) { hinweis.textContent = fehler || EINGABE_HINWEIS; hinweis.style.color = fehler ? "#C0392B" : ""; }
  return true;
}

/* ---------- Bedeutung von 1 und 0 ---------- */
// [Bedeutung 1, Bedeutung 0] der Zeile i: eingetragen (meta.bed) oder vorbelegt aus der Anlage
export function bedeutung(meta, name, i){
  const eigen = meta && meta.bed && meta.bed[i], a = antriebZu(name);
  const vor = a ? [a[1].b1, a[1].b0] : ["", ""];
  return [0, 1].map(k => eigen && eigen[k] !== undefined && eigen[k] !== null ? eigen[k] : vor[k]);
}

/* ---------- Prüfen (Haken pruefe) ---------- */
const nah = (a, b) => Math.abs(a[0] - b[0]) < 3 && Math.abs(a[1] - b[1]) < 3;
const linksRechts = st => [...st.p].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
// Ziel eines Auslösers: Pfeilspitze der Signallinie (Schleife: ihr Punkt) bzw. Beginn beim Start
const zielVon = st => st.k === "st" || sigLoop(st) ? st.p[0] : st.p[1];
// Jede Bewegung (schräge oder senkrechte Funktionslinie) braucht einen Auslöser, außer sie setzt eine Bewegung fort
export function bewegungOhneAusloeser(d){
  const bewegt = d.s.filter(st => st.k === "l" && Math.abs(st.p[0][1] - st.p[1][1]) > 1);
  const ziele = d.s.filter(st => st.k === "sig" || st.k === "st").map(zielVon);
  return bewegt.map(linksRechts).filter(([a]) => !ziele.some(z => nah(z, a)) && !bewegt.some(b => nah(linksRechts(b)[1], a)))
    .map(([a]) => ({stufe: "fehler", pt: a, text: `Schritt ${spalteBei(a[0]) + 1}: Die Bewegung hat keinen Auslöser. Zieh eine `
      + `Signallinie vom Sensor oder setz den Start.`}));
}
// Jede Zeile endet in derselben Stellung, in der sie beginnt (Grundstellung)
export function nichtInGrundstellung(d){
  const zeilen = {};
  d.s.filter(st => st.k === "l" && st.p[0][0] >= WS_RASTER.x0 - 1).forEach(st => st.p.forEach(q => {
    const i = zeileBei(q[1]); (zeilen[i] = zeilen[i] || []).push(q);
  }));
  return Object.entries(zeilen).map(([i, ps]) => [i, linksRechts({p: ps})])
    .filter(([, ps]) => wsAus(ps[0][1]) !== wsAus(ps[ps.length - 1][1]))
    .map(([i, ps]) => ({stufe: "fehler", pt: ps[ps.length - 1], text: `Zeile ${+i + 1}: Der Zyklus endet nicht in der Grundstellung.`}));
}
export const zyklusendeFehlt = d => d.s.some(st => st.k === "l") && !d.s.some(st => st.k === "eq")
  ? [{stufe: "hinweis", text: "Das Zyklusende n = 1 fehlt. Setz es in die Spalte nach dem letzten Schritt."}] : [];
export const wsPruefen = d => [bewegungOhneAusloeser, nichtInGrundstellung, zyklusendeFehlt].flatMap(r => r(d));
