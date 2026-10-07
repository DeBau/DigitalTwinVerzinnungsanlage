/* ---------- Interaktive Erklärung: Zeitmodell von Anlauf und SPS-Zyklus ---------- */
// Die Zeit t läuft in ms. Ein Zyklus der Länge T hat drei Phasen wie in SCE 032-200 und 034-100 (Anteile von T):
//   0    Eingänge ins PAE, 0.1  OB1 bearbeiten, schreibt das PAA (hier: a := e), 0.9  am Zyklusende PAA an die Ausgänge.
// Der ANLAUF dauert hier zur Anschauung eine Zykluszeit; er liest die Eingänge ins PAE und löscht das PAA.
// Jede Spur merkt sich ihre Wechsel als [t, wert]. Daraus entstehen Signalverlauf und Reaktionszeit.

export const ZY_EREIGNIS = [{anteil: 0, id: "ein"}, {anteil: 0.1, id: "ob1"}, {anteil: 0.9, id: "aus"}];
export const ZY_PHASE_BIS = {ein: 0.1, ob1: 0.9, aus: 1};   // Ende der Phase als Anteil von T, in der Reihenfolge des Zyklus

export function zyModell(T){
  return {T, t: 0, letztes: -Infinity, start: null, betrieb: "STOP", klemme: 0, pae: 0, paa: 0, ausgang: 0, impulsEnde: null,
    spuren: {k: [[0, 0]], e: [[0, 0]], a: [[0, 0]], q: [[0, 0]]}, lesungen: [], reaktion: null, verpasst: false, impulsGesehen: false};
}
function zySetze(z, spur, feld, wert){
  if (z[feld] === wert) return;
  z[feld] = wert;
  z.spuren[spur].push([z.t, wert]);
}
export const zyZyklusNr = z => z.start === null || z.t < z.start ? 0 : Math.floor((z.t - z.start) / z.T) + 1;
export function zyPhase(z){
  if (z.betrieb !== "RUN" || z.t < z.start) return null;
  const anteil = ((z.t - z.start) % z.T) / z.T;
  return Object.keys(ZY_PHASE_BIS).find(id => anteil < ZY_PHASE_BIS[id]);
}

/* ---------- Ereignisse ---------- */
const ZY_WIRKUNG = {
  aus: z => zySetze(z, "q", "ausgang", z.paa),
  ein: z => { zySetze(z, "e", "pae", z.klemme); z.lesungen.push(z.t); if (z.impulsEnde !== null && z.klemme) z.impulsGesehen = true; },
  ob1: z => zySetze(z, "a", "paa", z.pae),
};
function naechstesEreignis(z){
  const kandidaten = [];
  if (z.impulsEnde !== null) kandidaten.push({t: z.impulsEnde, id: "impulsEnde"});
  if (z.betrieb === "ANLAUF") kandidaten.push({t: z.start, id: "run"});
  if (z.betrieb === "RUN") {
    // Vergleich mit dem zuletzt ausgeführten Ereignis, nicht mit z.t: z.t wächst in Bruchteilen und liegt durch Rundung
    // manchmal knapp unter einem Ereignis (38,99999 statt 39); mit z.t würde das Ereignis übersprungen
    const c = z.start + Math.floor((Math.max(z.t, z.letztes) - z.start) / z.T) * z.T;
    for (const zyk of [c, c + z.T]) ZY_EREIGNIS.forEach(e => { const t = zyk + e.anteil * z.T; if (t > z.letztes + 1e-9) kandidaten.push({t, id: e.id}); });
  }
  return kandidaten.sort((x, y) => x.t - y.t)[0] || null;
}
const ZY_SONDER = {
  run: z => { z.betrieb = "RUN"; ZY_WIRKUNG.ein(z); },   // Zyklus 1 beginnt mit dem Einlesen der Eingänge
  impulsEnde: z => { zySetze(z, "k", "klemme", 0); z.impulsEnde = null; z.verpasst = !z.impulsGesehen; },
};
function ausfuehren(z, e){
  z.t = e.t; z.letztes = e.t;
  (ZY_SONDER[e.id] || ZY_WIRKUNG[e.id])(z);
  if (e.id === "aus") pruefeReaktion(z);
}
// Zeit um dt weiterlaufen lassen und alle Ereignisse dazwischen ausführen
export function zyLaufen(z, dt){
  if (z.betrieb === "STOP") return;
  const ziel = z.t + dt;
  for (let e = naechstesEreignis(z); e && e.t <= ziel; e = naechstesEreignis(z)) ausfuehren(z, e);
  z.t = ziel;
}
// Bis zum nächsten Ereignis springen (Taste „Ein Schritt“)
export function zySchritt(z){
  const e = naechstesEreignis(z);
  if (e) ausfuehren(z, e);
}

/* ---------- Bedienung ---------- */
export function zyEinschalten(z){
  z.betrieb = "ANLAUF"; z.start = z.t + z.T; z.letztes = z.t;
  zySetze(z, "a", "paa", 0); zySetze(z, "q", "ausgang", 0); zySetze(z, "e", "pae", z.klemme);
  z.lesungen.push(z.t);
}
export function zyAusschalten(z){
  z.betrieb = "STOP"; z.start = null; z.impulsEnde = null;
  zySetze(z, "q", "ausgang", 0);
}
export function zySensor(z){
  z.impulsEnde = null; z.verpasst = false;
  zySetze(z, "k", "klemme", z.klemme ? 0 : 1);
  z.reaktion = {start: z.t, ziel: z.klemme, wert: null};
}
export function zyImpuls(z, dauer){
  if (z.klemme) return;
  zySetze(z, "k", "klemme", 1);
  z.impulsEnde = z.t + dauer; z.impulsGesehen = false; z.verpasst = false; z.reaktion = null;
}
function pruefeReaktion(z){
  const r = z.reaktion;
  if (r && r.wert === null && z.ausgang === r.ziel) r.wert = z.t - r.start;
}
