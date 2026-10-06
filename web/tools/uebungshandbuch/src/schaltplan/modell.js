/* Aufbereitung der Plandaten (schaltplan.json) zusammen mit der Signalliste (signale.csv).
   Adresse und Kommentar eines Kanals kommen immer aus der Signalliste, der Plan ergänzt nur Kennzeichen, Zeichen, Ort und Weg.
   Hier werden auch die Klemmen −X1, −X3, −X4, −X5 fortlaufend vergeben. Reine Funktionen ohne DOM. */

const LEISTE = {DI: "−X3", DQ: "−X4", AI: "−X5", AQ: "−X5"};
const SPALTEN = ["adr", "signal", "bmk", "sym", "ort", "an", "weg", "annahme"];

// Signalliste {Kennzeichen: [{n, a, k}]} als Tabelle Name → Eintrag
export function signalTabelle(sig){
  const tabelle = new Map();
  for (const liste of Object.values(sig)) for (const s of liste) tabelle.set(s.n, s);
  return tabelle;
}

// "I4.6" → {byte: "I4", bit: 6}; "IW64" → {byte: "IW", bit: 0}
function zerlege(adr){
  const m = /^([IQ])(\d+)\.(\d)$/.exec(adr);
  return m ? {bereich: m[1], byte: +m[2], bit: +m[3]} : {bereich: adr.slice(0, 2), byte: +adr.slice(2), bit: 0};
}

// Baugruppe zu einem Kanal: Digitalbaugruppen haben je 4 Byte ab ihrer Startadresse
function baugruppe(sps, typ, teile){
  const passend = sps.filter(([, name]) => name.startsWith(typ));
  const start = b => +String(b[3]).replace(/\D/g, "");
  if (typ === "AI" || typ === "AQ") return {platz: passend[0][0], name: passend[0][1], kanal: (teile.byte - start(passend[0])) / 2};
  const gruppe = passend.find(b => teile.byte >= start(b) && teile.byte < start(b) + 4);
  const kanal = (teile.byte - start(gruppe)) * 8 + teile.bit;
  return {platz: gruppe[0], name: gruppe[1], kanal, pin: 1 + kanal % 8 + 10 * Math.floor(kanal / 8)};
}

function kanalObjekt(typ, zeile, signale, sps){
  const k = Object.fromEntries(SPALTEN.map((s, i) => [s, zeile[i] ?? ""]));
  const teile = zerlege(k.adr);
  return {...k, typ, annahme: !!k.annahme, info: signale.get(k.signal) || null, teile, modul: baugruppe(sps, typ, teile)};
}

// Klemmen fortlaufend je Leiste, nur für Geräte außerhalb des Schaltschranks
function vergibKlemmen(kanaele){
  const zaehler = {};
  for (const k of kanaele) {
    if (k.ort === "+A1") continue;
    const leiste = LEISTE[k.typ];
    zaehler[leiste] = (zaehler[leiste] || 0) + 1;
    k.klemme = `${leiste}:${zaehler[leiste]}`;
  }
}

// Glied einer Kette aus dem Datenformat [Zeichen, Kennzeichen, Anschlüsse, Text]
const glied = ([sym, bmk, an = "", text = ""]) => ({sym, bmk, an, text});

// Motorklemmen −X1: je Verbraucher U, V, W, PE; derselbe Motor (Schütz oder Umrichter) behält seine Klemmen
function motorKlemmen(leistung, pfadseiten){
  const nummern = new Map();
  let n = 0;
  for (const abgang of leistung) {
    const ziel = abgang.glieder[abgang.glieder.length - 1].bmk;
    if (!nummern.has(ziel)) {
      nummern.set(ziel, [n + 1, n + 2, n + 3, n + 4].map(String));
      n += 4;
    }
    abgang.klemmen = nummern.get(ziel);
  }
  for (const seite of pfadseiten) for (const pfad of seite.pfade) for (const g of pfad.glieder) {
    if (g.sym === "klemme" && g.bmk === "−X1") g.nummer = String(++n);
  }
}

// Betriebsmittel: Geräte aus dem Plan plus alle Kennzeichen der Kanäle
function betriebsmittel(plan, kanaele){
  const liste = new Map(plan.geraete.map(([bmk, text, ort, annahme]) => [bmk, {bmk, text, ort, annahme: !!annahme}]));
  for (const k of kanaele) if (!liste.has(k.bmk)) liste.set(k.bmk, {bmk: k.bmk, text: k.info ? k.info.k : "", ort: k.ort, annahme: k.annahme});
  return liste;
}

export function aufbereiten(plan, sig){
  const signale = signalTabelle(sig);
  const kanaele = ["DI", "DQ", "AI", "AQ"].flatMap(typ => plan.kanaele[typ].map(z => kanalObjekt(typ, z, signale, plan.sps)));
  vergibKlemmen(kanaele);
  const leistung = plan.leistung.map(a => ({...a, glieder: a.glieder.map(glied)}));
  const pfadseiten = plan.pfadseiten.map(s => ({...s, pfade: s.pfade.map(p => ({...p, glieder: p.glieder.map(glied)}))}));
  motorKlemmen(leistung, pfadseiten);
  const profinet = plan.kanaele.PN.map(([adr, signal, bmk]) => ({typ: "PN", adr, signal, bmk, info: signale.get(signal) || null}));
  return {plan, signale, kanaele, profinet, leistung, pfadseiten, geraete: betriebsmittel(plan, kanaele)};
}

// Prüfung für Build und Test: jedes Signal genau einmal, alle Zeichen bekannt
export function pruefe(modell, symbole){
  const fehler = [], gezaehlt = new Map();
  for (const k of [...modell.kanaele, ...modell.profinet]) gezaehlt.set(k.signal, (gezaehlt.get(k.signal) || 0) + 1);
  for (const name of modell.signale.keys()) {
    const n = gezaehlt.get(name) || 0;
    if (n !== 1) fehler.push(`Signal ${name} kommt ${n}-mal im Plan vor`);
  }
  for (const name of gezaehlt.keys()) if (!modell.signale.has(name)) fehler.push(`Signal ${name} fehlt in signale.csv`);
  for (const k of modell.kanaele) if (!symbole[String(k.sym).split(":")[0]]) fehler.push(`${k.adr}: Zeichen ${k.sym} unbekannt`);
  return fehler;
}
