/* ---------- Router ---------- */
import { CRIT, STIL, bewKey, critOf } from './daten.js';
import { BY, S, stilFor } from './basis.js';
import { viewHome } from './start.js';
import { curTime, timerEx, viewExercise } from './uebung.js';
import { viewAnlage, viewBewertung, viewKonzept, viewRichtlinien, viewSignale, viewVorlagen } from './seiten.js';
import { viewUnterlagen } from './unterlagen.js';
import { viewProjekt } from './projekt.js';
import { hideTip } from './tooltip.js';

export function route(){
  hideTip();
  const h = location.hash.replace(/^#\/?/, "").split("/");
  if (/^L\d\d$/.test(h[0])) return viewExercise(h[0], h[1]);
  if (h[0] === "vorlagen") return viewVorlagen();
  if (h[0] === "signale") return viewSignale();
  if (h[0] === "anlage") return viewAnlage();
  if (h[0] === "richtlinien") return viewRichtlinien(h[1]);
  if (h[0] === "konzept") return viewKonzept();
  if (h[0] === "bewertung") return viewBewertung(h[1]);
  if (h[0] === "unterlagen") return viewUnterlagen();
  if (h[0] === "projekt") return viewProjekt();
  viewHome();
}
// Umnummerierung auf 37 Übungen (Version _v = 4): neue Übungen L06 bis L11, alt L07 bis L32 werden L12 bis L37 (+5).
// Die Schlüssel der alten L06 wandern nach _alt:L06:* (nicht gelöscht, die Übung ist in L10 und L11 aufgegangen).
// Reine Funktion auf einem Objekt {Schlüssel ohne "uebh2:": Wert}, damit sie auch für geladene Dateien gilt.
export const UMNUM_V = 4;
export function umnummerieren(alt){
  const neu = {}, rx = /^L(\d\d)(?=:)/;
  Object.keys(alt).sort().reverse().forEach(k => {   // absteigend, wie verabredet; Ziel und Quelle überschneiden sich nicht
    const m = rx.exec(k), n = m ? +m[1] : 0;
    const z = !m ? k : n === 6 ? "_alt:" + k : n >= 7 && n <= 32 ? "L" + String(n + 5).padStart(2, "0") + k.slice(3) : k;
    neu[z] = alt[k];
  });
  return neu;
}
// Erst ausführen, wenn die Daten wirklich 37 Übungen haben, sonst würden Eingaben auf Übungen geschoben, die es noch nicht gibt.
export const UMNUM_BEREIT = () => !!BY.L37;
export function umziehen4(){
  if ((S.get("_v") || 0) >= UMNUM_V || !UMNUM_BEREIT()) return;
  const alt = S.all(), rx = /^L\d\d:/;
  if (Object.keys(alt).some(k => rx.test(k))) {
    const neu = umnummerieren(alt);
    Object.keys(alt).forEach(k => { if (rx.test(k)) S.set(k, null); });
    Object.entries(neu).forEach(([k, v]) => { if (rx.test(k) || k.startsWith("_alt:")) S.set(k, v); });
  }
  S.set("_v", UMNUM_V);
}
// Gesicherte Datei (Meine Daten): ohne _v ≥ 4 stammt sie aus der alten Nummerierung
export const altDatei = d => (d._v || 0) >= UMNUM_V || !UMNUM_BEREIT() ? d : {...umnummerieren(d), _v: UMNUM_V};
// Migrationen ohne Versionsnummer: Jede Funktion erkennt alte Schlüssel selbst, setzt die neuen und löscht die alten.
// Sie laufen bei jedem Start und nach dem Laden einer gesicherten Datei (Meine Daten), mehrfaches Ausführen ändert nichts.
// Alter Stil-Check (sechs Sammelregeln, Schlüssel Lxx:stil{i}) → Einzelregeln aus stil.js (Lxx:stil:<Index in STIL>).
// Ein Haken an einer Sammelregel gilt für jede Einzelregel, die sie enthielt und die in dieser Übung schon gilt.
export const STIL_ALT = [[/Merker/, /symbolische Namen/, /PlantData/], [/über seine Schnittstelle/], [/Namen nach Styleguide/],
  [/Zeiten rufst/, /Zähler rufst/], [/Konstante in GROSSSCHRIFT/], [/ELSE/, /Bausteinkopf/]];
export function migriereStil(){
  const alt = S.all();
  Object.entries(alt).forEach(([k, v]) => {
    const m = /^(L\w+):stil(\d+)$/.exec(k); if (!m) return;
    const ex = BY[m[1]], gilt = ex ? new Set(stilFor(ex).map(x => x.i)) : new Set();
    if (v === true) (STIL_ALT[+m[2]] || []).forEach(rx => STIL.forEach((r, i) => { if (rx.test(r.t) && gilt.has(i)) S.set(`${m[1]}:stil:${i}`, true); }));
    S.set(k, null);
  });
}
// Punkte der Lehrkraft: bisher ein Raster für alle (Lxx:bew{i}), jetzt Raster je Übungstyp (Lxx:bew:<i>).
// Gleichnamige Kriterien übernehmen ihre Punkte, solange sie in den neuen Höchstwert passen. Alles andere bleibt als
// Zeile in den Bemerkungen erhalten, damit keine Eingabe verloren geht.
export function migriereBew(){
  const rest = {};
  Object.entries(S.all()).forEach(([k, v]) => {
    const m = /^(L\w+):bew(\d+)$/.exec(k); if (!m) return;
    const id = m[1], alt = CRIT[+m[2]], crit = critOf(BY[id]), j = alt ? crit.findIndex(c => c[0] === alt[0]) : -1;
    if (v !== null && v !== "") {
      if (j >= 0 && +v <= crit[j][1] && S.get(bewKey(id, j)) === null) S.set(bewKey(id, j), v);
      else (rest[id] ||= []).push(`${alt ? alt[0] : "Kriterium " + (+m[2] + 1)} ${v}${alt ? " von " + alt[1] : ""}`);
    }
    S.set(k, null);
  });
  Object.entries(rest).forEach(([id, l]) => { const n = S.get(id + ":bewnote") || ""; S.set(id + ":bewnote", (n ? n + "\n" : "") + "Punkte aus dem früheren Bewertungsraster: " + l.join(", ")); });
}
// Vorlagen: alte Schlüssel Lxx:t<r>_<c> (Feld tpl) wandern in die erste Vorlage aus tpls (Lxx:t:<id>:<r>_<c>).
// Solange eine Übung noch kein tpls hat, gilt tpl als Fallback und liest die alten Schlüssel weiter.
export function migriereTpl(){
  Object.entries(S.all()).forEach(([k, v]) => {
    const m = /^(L\w+):t(\d+)_(\d+)$/.exec(k), ex = m && BY[m[1]]; if (!ex || !ex.tpls || !ex.tpls.length) return;
    const neu = `${m[1]}:t:${ex.tpls[0].id}:${m[2]}_${m[3]}`;
    if (S.get(neu) === null) S.set(neu, v);
    S.set(k, null);
  });
}
// Sicherheit: Daten aus „Meine Daten“ (Import) oder einem veränderten Speicher sind nicht vertrauenswürdig.
// Schlüssel: nur Zeichen, die die App selbst erzeugt. Skizzen (Lxx:sk:…): Der Editor setzt Koordinaten, Farben und
// Strichstärken direkt in SVG-Attribute. Darin dürfen keine Zeichen stehen, die ein Attribut verlassen können.
// Texte (Beschriftungen, Schriftfeld) maskiert der Editor selbst, sie bleiben unverändert.
export const KEY_OK = /^[\w:.\-]+$/;
// Freitexte der Zeichnung; der Editor maskiert sie beim Zeichnen mit esc() (Kennzeichen, Bedingungen b, Signaltext tz,
// Bedeutung bed im Weg-Schritt-Diagramm, Achsen im Trend)
const SK_TEXT = new Set(["v", "lbl", "title", "name", "datum", "rows", "b", "tz", "bed", "achsen"]), SK_ZAHL = new Set(["x", "y", "w", "h", "s", "r", "rot", "fw", "fh", "ts", "p"]);
const skizzenZahl = v => { const n = typeof v === "number" ? v : parseFloat(v); return Number.isFinite(n) ? n : 0; };
// art: "text" (Editor maskiert selbst), "zahl" (Koordinaten, Größen, Punkte) oder sonst Bezeichner und Farben
export function sauberSkizze(d, art = ""){
  if (Array.isArray(d)) return d.map(x => sauberSkizze(x, art));
  if (d && typeof d === "object") return Object.fromEntries(Object.entries(d).filter(([k]) => KEY_OK.test(k)).map(([k, v]) => [k, sauberSkizze(v, art === "text" || SK_TEXT.has(k) ? "text" : SK_ZAHL.has(k) ? "zahl" : "")]));
  if (art === "zahl" && (typeof d === "string" || typeof d === "number")) return skizzenZahl(d);
  if (typeof d === "string") return art === "text" ? d : d.replace(/[<>"'`&]/g, "");
  return typeof d === "number" && !Number.isFinite(d) ? 0 : d;
}
export const sauber = (k, v) => /:sk:/.test(k) ? sauberSkizze(v) : v;
// Importierte Einträge: unzulässige Schlüssel fallen weg, Skizzen werden bereinigt
export const sauberImport = d => Object.fromEntries(Object.entries(d && typeof d === "object" ? d : {}).filter(([k]) => KEY_OK.test(k)).map(([k, v]) => [k, sauber(k, v)]));
export function migriereSicher(){
  Object.entries(S.all()).forEach(([k, v]) => {
    if (!KEY_OK.test(k)) return S.set(k, null);
    const n = sauber(k, v); if (JSON.stringify(n) !== JSON.stringify(v)) S.set(k, n);
  });
}
export function migriere(){ migriereSicher(); migriereStil(); migriereBew(); migriereTpl(); }
// Seiteneffekte: Listener, Migrationen, Start. main.js ruft init() in der ursprünglichen Reihenfolge auf.
export function init(){
(function umziehen(){
  if (S.get("ver") >= 2) return;
  const alt = S.all(), rx = /^L(\d\d)(?=:)/;
  Object.keys(alt).forEach(k => { if (rx.test(k)) S.set(k, null); });
  Object.entries(alt).forEach(([k, v]) => { const m = rx.exec(k); if (m) { const n = +m[1]; S.set((n >= 2 ? "L" + String(n + 5).padStart(2, "0") : "L" + m[1]) + k.slice(3), v); } });
  S.set("ver", 2);
})();
(function umziehen3(){   // Hand, Verriegelung, HAND/AUTO, Befehlsausgabe vor die Schrittkette
  if (S.get("ver") >= 3) return;
  const alt = S.all(), rx = /^L(\d\d)(?=:)/, neu = n => n <= 7 ? n : ({8: 12, 9: 13, 10: 9})[n] || n + 3;
  Object.keys(alt).forEach(k => { if (rx.test(k)) S.set(k, null); });
  Object.entries(alt).forEach(([k, v]) => { const m = rx.exec(k); if (m) S.set("L" + String(neu(+m[1])).padStart(2, "0") + k.slice(3), v); });
  S.set("ver", 3);
})();
umziehen4();
migriere();
addEventListener("hashchange", route);
addEventListener("beforeunload", () => { if (timerEx) S.set(timerEx+":zeit", curTime(timerEx)); });
route();
}
