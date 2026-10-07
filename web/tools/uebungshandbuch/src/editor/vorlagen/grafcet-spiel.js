// GRAFCET: Kette durchspielen (Werkzeug sim, wie die Pneumatik-Simulation). Am Anfang sind die Anfangsschritte aktiv.
// Ein Klick auf eine Transition schaltet weiter, wenn alle Schritte davor aktiv sind: Sie werden inaktiv, die Schritte
// danach aktiv. Ein Klick auf einen Schritt schaltet ihn von Hand ein oder aus. Aktive Schritte tragen einen Punkt,
// ihre Aktionen sind grün, schaltbare Transitionen blau (Zeichnen über spielZustand in grafcet-aktion.js).
import { IC } from '../../app/basis.js';
import { ED } from '../status.js';
import { clearSel, objById } from '../auswahl.js';
import { renderInk } from '../anzeige.js';
import { isAct, isStep, isTrans, spielZustand } from './grafcet-aktion.js';
import { aktionenVon, nachfolgerUeberLinien, objIn } from './grafcet-kette.js';

export const SPIEL_KNOPF = `<button type="button" class="tool" data-tool="sim" `
  + `title="Kette durchspielen: Transition anklicken, der Ablauf schaltet weiter">${IC.play}Durchspielen</button>`;
export const SPIEL_ANLEITUNG = `<div class="props"><div class="palh">Kette durchspielen</div><p class="small" style="margin:0 0 6px">`
  + `Klick auf eine <b>blaue Transition</b>: Sie schaltet, wenn ihre Bedingung erfüllt wäre. Der Punkt wandert in den `
  + `nächsten Schritt, die Aktionen der aktiven Schritte werden grün.</p><p class="small muted" style="margin:0">Ein Klick `
  + `auf einen Schritt schaltet ihn von Hand ein oder aus. Zum Bearbeiten wählst du „Auswählen“.</p></div>`;

// Schritte, die über Verzweigungslinien (und Verweise) vor bzw. nach der Transition liegen
export const zielSchritt = (d, ref) => d.o.find(o => isStep(o) && o.v === (/\d+/.exec(ref.v || "") || [""])[0]);
export const schrittOderZiel = (d, B) => isStep(B) ? [B] : B.k === "ref" ? [zielSchritt(d, B)].filter(Boolean) : [];
export const schritteNach = (d, A) => nachfolgerUeberLinien(d, A).flatMap(B => schrittOderZiel(d, B));
export function schritteVor(d, B, tiefe = 0){
  return d.c.filter(c => c.b === B.id).map(c => objIn(d, c.a)).filter(A => A && !isAct(A) && !isTrans(A)).flatMap(A =>
    isStep(A) ? [A] : tiefe < 4 ? schritteVor(d, A, tiefe + 1) : []);
}
export function schaltbar(d, aktiv, tr){
  const vor = schritteVor(d, tr);
  return vor.length > 0 && vor.every(s => aktiv.has(s.id));
}
// Aktionen der aktiven Schritte und schaltbare Transitionen neu bestimmen und zeichnen
export function spielAuffrischen(){
  const s = ED.vorlage.spiel, d = ED.data;
  s.aktionen = new Set([...s.aktiv].flatMap(id => aktionenVon(d, id)));
  s.schaltbar = new Set(d.o.filter(o => isTrans(o) && schaltbar(d, s.aktiv, o)).map(o => o.id));
  renderInk();
}
// Vorlagen-Haken werkzeugWechsel: beim Wählen von sim mit den Anfangsschritten beginnen, beim Verlassen aufräumen
export function spielWechsel(t){
  if (t !== "sim") { delete ED.vorlage.spiel; return; }
  clearSel();
  ED.vorlage.spiel = {aktiv: new Set(ED.data.o.filter(o => o.k === "init").map(o => o.id))};
  spielAuffrischen();
}
// Transition schalten bzw. Schritt von Hand umschalten
export const SPIEL_KLICK = [
  {passt: isTrans, tue: (d, s, tr) => {
    if (!schaltbar(d, s.aktiv, tr)) return;
    schritteVor(d, tr).forEach(x => s.aktiv.delete(x.id));
    schritteNach(d, tr).forEach(x => s.aktiv.add(x.id));
  }},
  {passt: isStep, tue: (d, s, x) => { if (!s.aktiv.delete(x.id)) s.aktiv.add(x.id); }},
];
// Vorlagen-Haken zeiger.unten: im Werkzeug sim jeden Klick selbst behandeln
export function spielKlick(e){
  const s = spielZustand();
  if (!s) return false;
  const h = e.target.closest("[data-o]"), o = h && objById(h.dataset.o), regel = o && SPIEL_KLICK.find(r => r.passt(o));
  if (regel) { regel.tue(ED.data, s, o); spielAuffrischen(); }
  return true;
}
export const spielAnleitung = () => spielZustand() ? SPIEL_ANLEITUNG : null;
