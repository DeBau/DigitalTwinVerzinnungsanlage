/* ---------- Interaktive Erklärung: Zeitmodell der IEC-Zeiten TP, TON, TOF und TONR ---------- */
// Verhalten genau nach der TIA-Hilfe V21 (FUP: „TP: Impuls erzeugen“, „TON: Einschaltverzögerung erzeugen“,
// „TOF: Ausschaltverzögerung erzeugen“, „TONR: Zeit akkumulieren“). Die Zeit t läuft in ms.
// Die Zeitmessung läuft (m.lauf), solange ET wächst: ET = basis + (t − start), höchstens PT.
// Jede Art reagiert auf vier Ereignisse: steigende und fallende Flanke an IN, Ablauf (ET erreicht PT) und R (nur TONR).
// Die Spuren merken sich ihre Wechsel als [t, wert], ET als Knickpunkte [t, ET] für die Rampe im Signalverlauf.

export function zeModell(art, pt){
  return {art, pt, t: 0, in: 0, r: 0, q: 0, et: 0, lauf: false, start: 0, basis: 0, inSeit: 0, vorherDauer: 0, impulsEnde: null, hinweis: null,
    spuren: {in: [[0, 0]], r: [[0, 0]], q: [[0, 0]]}, etPunkte: [[0, 0]], marken: []};
}

// Aktueller Zeitwert ET (läuft die Zeitmessung, wächst er mit t bis PT)
export const zeEt = m => m.lauf ? Math.min(m.pt, m.basis + (m.t - m.start)) : m.et;
// ET als Punkte für die Rampe, der letzte Punkt ist „jetzt“
export const zeEtVerlauf = m => [...m.etPunkte, [m.t, zeEt(m)]];
// Ruht die Zeit? Nichts läuft, kein Antippen offen; dann lohnt das Abspielen nur noch für den Signalverlauf
export const zeRuht = m => !m.lauf && m.impulsEnde === null;

function zeSpur(m, spur, wert){
  if (m[spur] === wert) return;
  m[spur] = wert;
  m.spuren[spur].push([m.t, wert]);
}
// ET springt oder knickt: alten und neuen Wert zur selben Zeit festhalten
function zeSetzeEt(m, wert){
  m.etPunkte.push([m.t, zeEt(m)]);
  m.lauf = false; m.et = wert;
  m.etPunkte.push([m.t, wert]);
}
function zeStarte(m, basis, text){
  zeSetzeEt(m, basis);
  m.lauf = true; m.start = m.t; m.basis = basis;
  m.marken.push({t: m.t, text});
}

/* ---------- Verhalten je Art ---------- */
// Jede Funktion ändert m; hinweis merkt sich Besonderheiten für den Satz in Worten (zeit.js).
const ZE_ART = {
  TP: {
    steigend: m => { if (m.lauf) { m.hinweis = "nachtriggern"; return; } zeStarte(m, 0, "Start"); zeSpur(m, "q", 1); },
    fallend: m => { if (!m.lauf) zeSetzeEt(m, 0); },
    ablauf: m => { zeSetzeEt(m, m.in ? m.pt : 0); zeSpur(m, "q", 0); },
  },
  TON: {
    steigend: m => zeStarte(m, 0, "Start"),
    fallend: m => { if (m.lauf) m.hinweis = "abbruch"; zeSetzeEt(m, 0); zeSpur(m, "q", 0); },
    ablauf: m => { zeSetzeEt(m, m.pt); zeSpur(m, "q", 1); },
  },
  TOF: {
    steigend: m => { if (m.lauf) m.hinweis = "wieder"; zeSetzeEt(m, 0); zeSpur(m, "q", 1); },
    fallend: m => zeStarte(m, 0, "Start"),
    ablauf: m => { zeSetzeEt(m, m.pt); zeSpur(m, "q", 0); },
  },
  TONR: {
    steigend: m => { if (!m.r && m.et < m.pt) zeStarte(m, m.et, "weiter"); },
    fallend: m => { if (m.lauf) zeSetzeEt(m, zeEt(m)); },
    ablauf: m => { zeSetzeEt(m, m.pt); zeSpur(m, "q", 1); },
  },
};
export const ZE_ARTEN = Object.keys(ZE_ART);

/* ---------- Zeit laufen lassen ---------- */
function zeNaechstes(m){
  const kandidaten = [];
  // Ablauf genau dann, wenn ET den Wert PT erreicht; die Zeit dafür wird aus start und basis berechnet, nicht aus t
  if (m.lauf) kandidaten.push({t: m.start + m.pt - m.basis, id: "ablauf"});
  if (m.impulsEnde !== null) kandidaten.push({t: m.impulsEnde, id: "impulsEnde"});
  return kandidaten.sort((a, b) => a.t - b.t)[0] || null;
}
const ZE_EREIGNIS = {
  ablauf: m => { ZE_ART[m.art].ablauf(m); m.marken.push({t: m.t, text: "PT erreicht"}); },
  impulsEnde: m => { m.impulsEnde = null; zeIn(m, 0); },
};
// Zeit um dt (ms) weiterlaufen lassen und die Ereignisse dazwischen ausführen.
// Toleranz 1e-6: t wächst in Schritten und liegt durch Rundung manchmal knapp unter dem Ereignis.
export function zeLaufen(m, dt){
  const ziel = m.t + dt;
  for (let e = zeNaechstes(m); e && e.t <= ziel + 1e-6; e = zeNaechstes(m)) {
    m.t = Math.max(m.t, e.t);
    ZE_EREIGNIS[e.id](m);
  }
  m.t = ziel;
}

/* ---------- Bedienung ---------- */
export function zeIn(m, wert){
  if (m.in === wert) return;
  m.hinweis = null;
  zeSpur(m, "in", wert);
  m.vorherDauer = m.t - m.inSeit;   // wie lange IN vorher seinen alten Wert hatte
  m.inSeit = m.t;
  ZE_ART[m.art][wert ? "steigend" : "fallend"](m);
}
// Klick auf IN: umschalten; ein laufendes „kurz antippen“ ist damit vorbei
export function zeUmschalten(m){
  m.impulsEnde = null;
  zeIn(m, m.in ? 0 : 1);
}
// IN für die Dauer kurz auf 1 („kurz antippen“)
export function zeTippen(m, dauer){
  if (m.in) return;
  zeIn(m, 1);
  m.impulsEnde = m.t + dauer;
}
// R (nur TONR): 1 setzt ET und Q zurück und blockiert die Zeitmessung, 0 gibt sie wieder frei
export function zeR(m, wert){
  if (m.r === wert) return;
  m.hinweis = null;
  zeSpur(m, "r", wert);
  if (wert) { zeSetzeEt(m, 0); zeSpur(m, "q", 0); return; }
  if (m.in) zeStarte(m, 0, "Start");
}
