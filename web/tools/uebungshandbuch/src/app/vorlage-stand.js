/* ---------- Vorlagen: Felder, Fortschritt und Karte im Schritt ---------- */
// felder (uebungVorlage.md, Abschnitt 6): je Eingabespalte {typ: "01" | "janein" | "text" | "notiz", ab: Phase}.
// Im Schritt steht jede Vorlage als Karte mit Fortschritt, ausgefüllt wird im Popup (vorlage-popup.js).
// d.fw: Fachwissen, das erklärt, was die Vorlage ist und warum du sie ausfüllst (Chips auf Karte und im Popup).
import { PHASES } from './daten.js';
import { S } from './basis.js';
import { tplHead, tplKey, tplNIn, tplRows } from './vorlagen-basis.js';
import { fwChipsHTML } from './nachschlagen.js';

const alsFeld = f => typeof f === "string" ? {typ: f, ab: 0} : {typ: f.typ || "text", ab: f.ab || 0};

// felder gilt für die letzten Spalten von head. Leere Zusatzzeilen haben davor weitere Eingabespalten, die sind "text".
export function feld(ex, d, r, ci){
  const fl = d.felder || [];
  const i = r.length + ci - (tplHead(ex, d).length - fl.length);
  return alsFeld(fl[i] || "text");
}
export function zeileWerte(ex, d, ri, r){
  const n = tplNIn(d, r, tplHead(ex, d));
  return Array.from({length: n}, (_, ci) => String(S.get(tplKey(ex.id, d, ri, ci)) ?? "").trim());
}
// Zeile fertig: alle Pflichtfelder (nicht "notiz") bis Phase p gefüllt; ohne Pflichtfelder reicht ein Eintrag
export function zeileFertig(ex, d, ri, r, p){
  const werte = zeileWerte(ex, d, ri, r);
  const pflicht = werte.map((_, ci) => ci).filter(ci => {
    const f = feld(ex, d, r, ci);
    return f.typ !== "notiz" && f.ab <= p;
  });
  return pflicht.length ? pflicht.every(ci => werte[ci]) : werte.some(Boolean);
}
// Abweichung: d.vergleich = [a, b] zwei Eingabespalten, die gleich sein sollten (z. B. erwartet und gemessen)
export function zeileAuffaellig(ex, d, ri, r){
  if (!d.vergleich) return false;
  const [a, b] = d.vergleich, werte = zeileWerte(ex, d, ri, r);
  return !!(werte[a] && werte[b] && werte[a] !== werte[b]);
}
export function tplStand(ex, d, p){
  const rows = tplRows(d);
  return {
    fertig: rows.filter((r, ri) => zeileFertig(ex, d, ri, r, p)).length,
    gesamt: (d.rows || []).length ? rows.length : 0,   // nur freie Zeilen: kein Ziel, nur Anzahl der Einträge
    auffaellig: rows.filter((r, ri) => zeileAuffaellig(ex, d, ri, r)).length,
  };
}

/* ---------- Karte im Schritt ---------- */
function standText(st){
  if (!st.gesamt) return st.fertig ? `${st.fertig} Einträge` : "Noch leer";
  const auff = st.auffaellig ? ` · ${st.auffaellig} Abweichung${st.auffaellig > 1 ? "en" : ""}` : "";
  return `${st.fertig} von ${st.gesamt} Zeilen fertig${auff}`;
}
function knopfText(st){
  if (st.gesamt && st.fertig === st.gesamt) return "Ansehen und ändern";
  return st.fertig ? "Weiter ausfüllen" : "Ausfüllen";
}
// Eine Kachel je Zeile: grau offen, grün fertig, gelb Abweichung
function kachelnHTML(ex, d, p){
  const klasse = (r, ri) => zeileAuffaellig(ex, d, ri, r) ? "auff" : zeileFertig(ex, d, ri, r, p) ? "ok" : "";
  return `<div class="tplk-kacheln">${tplRows(d).map((r, ri) => `<i class="${klasse(r, ri)}"></i>`).join("")}</div>`;
}
export function balkenHTML(st){
  const prozent = Math.round(100 * st.fertig / (st.gesamt || 1));
  return `<div class="tplk-bar"><i style="width:${prozent}%"></i></div>`;
}
export function tplKarteHTML(ex, d, p){
  const st = tplStand(ex, d, p), voll = st.gesamt && st.fertig === st.gesamt;
  const knopf = `<button class="btn ${voll ? "" : "primary"}" type="button" data-act="tpl-open" data-t="${d.id}" data-p="${p}">${knopfText(st)}</button>`;
  const kopf = `<div class="tplk-kopf"><div><h3>${d.cap}</h3><span class="muted small">${standText(st)}</span></div>${knopf}</div>`
    + fwChipsHTML(ex, d.fw);
  const fort = st.gesamt ? balkenHTML(st) + kachelnHTML(ex, d, p) : "";
  return `<div class="tplk${voll ? " voll" : ""}" data-t="${d.id}">${kopf}${fort}</div>`;
}
// Hinweis über der Karte, wenn die Vorlage aus einem früheren Schritt stammt
export function frueherHTML(d, p){
  const ab = d.phase || 4;
  return ab < p ? `<p class="muted small tplk-hin">Angelegt im Schritt ${PHASES[ab].n}. Du kannst hier weiter eintragen.</p>` : "";
}
