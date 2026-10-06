/* Aufbereitung der Plandaten (schaltplan.json) zusammen mit der Signalliste (signale.csv).
   Adresse und Kommentar eines Kanals kommen immer aus der Signalliste, der Plan ergänzt nur Kennzeichen, Zeichen, Ort und Weg.
   Hier entstehen auch alle Klemmen (−X1, −X3, −X4, −X5): Jede vergebene Klemme landet in einer Liste, aus der der
   Klemmenplan gezeichnet wird. So gibt es keine zweite Zählung, die auseinanderlaufen kann. Reine Funktionen ohne DOM. */
import { klemmenAufbauen } from './klemmen.js';

const SPALTEN = ["adr", "signal", "bmk", "sym", "ort", "an", "weg", "annahme"];

// Signalliste {Kennzeichen: [{n, a, k}]} als Tabelle Name → Eintrag
export function signalTabelle(sig){
  const tabelle = new Map();
  for (const liste of Object.values(sig)) for (const s of liste) tabelle.set(s.n, s);
  return tabelle;
}

// "I4.6" → {bereich: "I", byte: 4, bit: 6}; "IW64" → {bereich: "IW", byte: 64, bit: 0}
function zerlege(adr){
  const m = /^([IQ])(\d+)\.(\d)$/.exec(adr);
  return m ? {bereich: m[1], byte: +m[2], bit: +m[3]} : {bereich: adr.slice(0, 2), byte: +adr.slice(2), bit: 0};
}

const startByte = baugruppe => +String(baugruppe[3]).replace(/\D/g, "");

// Baugruppe zu einem Kanal. Analog: 2 Byte je Kanal. Digital: 4 Byte je Baugruppe, Frontstecker-Pin nach Formel.
function baugruppe(sps, typ, teile){
  const passend = sps.filter(([, name]) => name.startsWith(typ));
  if (typ === "AI" || typ === "AQ") {
    const b = passend[0];
    return {platz: b[0], name: b[1], kanal: (teile.byte - startByte(b)) / 2};
  }
  const b = passend.find(g => teile.byte >= startByte(g) && teile.byte < startByte(g) + 4);
  const kanal = (teile.byte - startByte(b)) * 8 + teile.bit;
  return {platz: b[0], name: b[1], kanal, pin: 1 + kanal % 8 + 10 * Math.floor(kanal / 8)};
}

function kanalObjekt(typ, zeile, signale, plan){
  const k = Object.fromEntries(SPALTEN.map((s, i) => [s, zeile[i] ?? ""]));
  const teile = zerlege(k.adr);
  const versorgung = plan.versorgung[typ] || plan.versorgung[typ[1] + teile.byte];
  return {...k, typ, annahme: !!k.annahme, info: signale.get(k.signal) || null, teile, versorgung,
    modul: baugruppe(plan.sps, typ, teile)};
}

// Glied einer Kette aus dem Datenformat [Zeichen, Kennzeichen, Anschlüsse, Text, angenommen]
const glied = ([sym, bmk, an = "", text = "", annahme = 0]) => ({sym, bmk, an, text, annahme: !!annahme});

// Letztes Glied eines Abgangs: der Verbraucher (Motor, Heizung)
export const verbraucher = abgang => abgang.glieder[abgang.glieder.length - 1];

// Betriebsmittel: Geräte aus dem Plan plus alle Kennzeichen der Kanäle
function betriebsmittel(plan, kanaele){
  const liste = new Map(plan.geraete.map(([bmk, text, ort, annahme, typ = ""]) => [bmk, {bmk, text, ort, typ, annahme: !!annahme}]));
  for (const k of kanaele) {
    if (!liste.has(k.bmk)) liste.set(k.bmk, {bmk: k.bmk, text: k.info ? k.info.k : "", ort: k.ort, typ: "", annahme: k.annahme});
  }
  return liste;
}

export function aufbereiten(plan, sig){
  const signale = signalTabelle(sig);
  const kanaele = ["DI", "DQ", "AI", "AQ"].flatMap(typ => plan.kanaele[typ].map(z => kanalObjekt(typ, z, signale, plan)));
  const leistung = plan.leistung.map(a => ({...a, glieder: a.glieder.map(glied)}));
  const pfadseiten = plan.pfadseiten.map(s => ({...s, pfade: s.pfade.map(p => ({...p, glieder: p.glieder.map(glied)}))}));
  const klemmen = klemmenAufbauen(kanaele, leistung, pfadseiten);
  const profinet = plan.kanaele.PN.map(([adr, signal, bmk]) => ({typ: "PN", adr, signal, bmk, info: signale.get(signal) || null}));
  return {plan, signale, kanaele, profinet, leistung, pfadseiten, klemmen, geraete: betriebsmittel(plan, kanaele)};
}

// Prüfung für Build und Test: jedes Signal genau einmal, alle Zeichen bekannt, keine Klemme doppelt
export function pruefe(modell, symbole){
  const fehler = [], gezaehlt = new Map();
  for (const k of [...modell.kanaele, ...modell.profinet]) gezaehlt.set(k.signal, (gezaehlt.get(k.signal) || 0) + 1);
  for (const name of modell.signale.keys()) {
    const n = gezaehlt.get(name) || 0;
    if (n !== 1) fehler.push(`Signal ${name} kommt ${n}-mal im Plan vor`);
  }
  for (const name of gezaehlt.keys()) if (!modell.signale.has(name)) fehler.push(`Signal ${name} fehlt in signale.csv`);
  for (const k of modell.kanaele) if (!symbole[String(k.sym).split(":")[0]]) fehler.push(`${k.adr}: Zeichen ${k.sym} unbekannt`);
  const namen = modell.klemmen.map(z => z.klemme);
  for (const n of new Set(namen)) if (namen.indexOf(n) !== namen.lastIndexOf(n)) fehler.push(`Klemme ${n} doppelt vergeben`);
  return fehler;
}
