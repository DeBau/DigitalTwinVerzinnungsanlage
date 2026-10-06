/* Klemmen der Anlage: −X1 (Abgänge 400 V und 230 V), −X3 (Eingänge), −X4 (Ausgänge), −X5 (Analogwerte).
   klemmenAufbauen vergibt alle Nummern fortlaufend je Leiste und trägt jede Klemme mit Feld- und Schrankseite in
   eine Liste ein. Aus dieser Liste entsteht der Klemmenplan. Die Zeichnung liest die Nummern aus den Gliedern. */

const LEISTE = {DI: "−X3", DQ: "−X4", AI: "−X5", AQ: "−X5"};

// Ausgänge der Geräte, die vor einer Motorklemme sitzen (Schrankseite der Klemme)
const AUSGANG = {ms3: ["2", "4", "6"], ls3: ["2", "4", "6"], schuetz3: ["2", "4", "6"], wende: ["2", "4", "6"],
  hlr3: ["2", "4", "6"], umrichter: ["U2", "V2", "W2"]};
const VERBRAUCHER_AN = {motor3: ["U1", "V1", "W1"], heizung3: ["1", "2", "3"]};

/* Anschlüsse eines Analogkanals. "haupt" ist die Pfadlinie, "seite" der zweite Leiter rechts daneben.
   Strom (2-Leiter): Die Baugruppe speist über UV, der Messstrom kommt über I+ zurück. Der zweite Leiter geht
   deshalb vom oberen Anschluss (+) des Messumformers ab. Spannung: Signal über U+, Bezug über U−. */
const ANALOG = {
  strom: {haupt: ["−", n => `I${n}+`], seite: ["+", n => `UV${n}`], vonOben: true, text: "2-Leiter, gespeist von der Baugruppe"},
  spannung: {haupt: ["+", n => `U${n}+`], seite: ["−", n => `U${n}−`], vonOben: false, text: "Spannungssignal"},
  ausgang: {haupt: ["Y", n => `QV${n}`], seite: ["M", () => "MANA"], vonOben: false, text: "Spannungsausgang"},
};
const FELD_AN = {poti: ["2", "3"]};   // Potentiometer: Schleifer 2 auf der Pfadlinie, 3 auf dem zweiten Leiter

export function analogAnschluss(k){
  const art = k.typ === "AQ" ? "ausgang" : /mA/.test(k.an) ? "strom" : "spannung";
  const a = ANALOG[art], feld = FELD_AN[String(k.sym).split(":")[0]], n = k.modul.kanal;
  return {art, text: a.text, vonOben: a.vonOben,
    haupt: {feld: feld ? feld[0] : a.haupt[0], baugruppe: a.haupt[1](n)},
    seite: {feld: feld ? feld[1] : a.seite[0], baugruppe: a.seite[1](n)}};
}

function neueListe(){
  const liste = [], zaehler = {};
  const neu = (leiste, feld, schrank, signal = "", ziel = "") => {
    zaehler[leiste] = (zaehler[leiste] || 0) + 1;
    const klemme = `${leiste}:${zaehler[leiste]}`;
    liste.push({klemme, feld, schrank, signal, ziel});
    return klemme;
  };
  return {liste, neu};
}

/* ---------- Kanäle ---------- */
const SENSOR = /^(sens|geber|lvh)/;

function feldAnschlussDigital(k){
  if (SENSOR.test(k.sym)) return String(k.sym).split(":")[1]?.length === 1 ? String(k.sym).split(":")[1] : "BK";
  const teile = String(k.an || "").split("/");
  return k.typ === "DI" ? teile[1] || teile[0] : teile[0] || "A1";
}

function kanalKlemmen(kanaele, k){
  for (const kanal of kanaele) {
    if (kanal.typ[0] === "A") kanal.analog = analogAnschluss(kanal);
    if (kanal.ort === "+A1") continue;
    const leiste = LEISTE[kanal.typ], schrank = `−KF1 %${kanal.adr}`;
    if (kanal.typ === "DI" || kanal.typ === "DQ") {
      const pin = kanal.modul.pin ? `, Pin ${kanal.modul.pin}` : "";
      kanal.klemme = k.neu(leiste, `${kanal.bmk} ${feldAnschlussDigital(kanal)}`, schrank + pin, kanal.signal, kanal.bmk);
      continue;
    }
    const a = kanal.analog;
    kanal.klemme = k.neu(leiste, `${kanal.bmk} ${a.haupt.feld}`, `${schrank} ${a.haupt.baugruppe}`, kanal.signal, kanal.bmk);
    kanal.klemmeSeite = k.neu(leiste, `${kanal.bmk} ${a.seite.feld}`, `${schrank} ${a.seite.baugruppe}`, kanal.signal, kanal.bmk);
  }
}

/* ---------- Abgänge 400 V ---------- */
// Verbraucher mit zwei Wegen (Schütz oder Umrichter) bekommen eigene Klemmen je Weg, eine Umsteckbrücke
// und einen gemeinsamen Klemmensatz für das Motorkabel. So liegen nie zwei Wege fest auf demselben Motor.
function leistungKlemmen(leistung, k){
  const wege = new Map(), motorSatz = new Map();
  for (const a of leistung) wege.set(verbraucherVon(a).bmk, (wege.get(verbraucherVon(a).bmk) || 0) + 1);
  for (const a of leistung) {
    const i = a.glieder.findIndex(g => g.sym === "klemme3"), vor = a.glieder[i - 1], ziel = verbraucherVon(a);
    const quelle = AUSGANG[vor.sym].map(t => `${vor.bmk} ${t}`), an = VERBRAUCHER_AN[ziel.sym];
    if (wege.get(ziel.bmk) < 2) {
      a.glieder[i].nummern = satz(k, an.map(t => `${ziel.bmk} ${t}`), quelle, ziel.bmk, true);
      continue;
    }
    const weg = satz(k, ["Umsteckbrücke", "Umsteckbrücke", "Umsteckbrücke"], quelle, ziel.bmk, false);
    if (!motorSatz.has(ziel.bmk)) motorSatz.set(ziel.bmk, satz(k, an.map(t => `${ziel.bmk} ${t}`),
      ["Umsteckbrücke", "Umsteckbrücke", "Umsteckbrücke"], ziel.bmk, true));
    a.glieder.splice(i, 1, {...a.glieder[i], nummern: weg},
      {sym: "bruecke3", bmk: "", an: "", text: "Umsteckbrücke: nur ein Weg gesteckt"},
      {...a.glieder[i], nummern: motorSatz.get(ziel.bmk)});
  }
}

// Letztes Glied eines Abgangs: der Verbraucher (Motor, Heizung)
const verbraucherVon = a => a.glieder[a.glieder.length - 1];

// Klemmensatz L1 L2 L3 (optional PE) auf −X1; liefert die vier Nummern (PE leer, wenn ohne)
function satz(k, feld, schrank, ziel, mitPE){
  const nummern = feld.map((f, i) => k.neu("−X1", f, schrank[i], "", ziel).split(":")[1]);
  nummern.push(mitPE ? k.neu("−X1", `${ziel} PE`, "−XPE", "", ziel).split(":")[1] : "");
  return nummern;
}

/* ---------- Klemmen in Strompfaden (zum Beispiel Vibrorinne 230 V) ---------- */
function pfadKlemmen(pfadseiten, k){
  for (const seite of pfadseiten) for (const pfad of seite.pfade) {
    pfad.glieder.forEach((g, i) => {
      if (g.sym !== "klemme") return;
      const vor = pfad.glieder[i - 1], nach = pfad.glieder[i + 1];
      const feld = g.an === "N" ? `${vor.bmk} N` : `${nach.bmk} ${g.an}`;
      const schrank = g.an === "N" ? `${seite.unten} (Schiene)` : `${vor.bmk} ${String(vor.an).split("/")[1] || ""}`.trim();
      g.bmk = k.neu(g.bmk, feld, schrank, "", feld.split(" ")[0]);
    });
    const geraet = pfad.glieder.find(g => g.sym === "geraet");
    if (pfad.pe && geraet) pfad.peKlemme = k.neu("−X1", `${geraet.bmk} PE`, "−XPE", "", geraet.bmk);
  }
}

export function klemmenAufbauen(kanaele, leistung, pfadseiten){
  const k = neueListe();
  kanalKlemmen(kanaele, k);
  leistungKlemmen(leistung, k);
  pfadKlemmen(pfadseiten, k);
  return k.liste;
}
