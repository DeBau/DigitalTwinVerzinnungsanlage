import { NOT_HALT, QUITT, ZYL, autoFrei, notHaltText, st } from './zustand.js';
import { anlage } from '../core/szene.js';
import { fmt1 } from '../core/format.js';
import { BAND, BAND_ENDE, BAND_Y, KORB_TEILUNG, KURVE, STOPPER } from '../anlage/baender.js';
import { BAD_X, RAND_Y, zinnY } from '../anlage/zinnbad.js';
import { koerbe, korbEntfernen, korbErzeugen, tropfen, tropfenErzeugen } from '../anlage/koerbe.js';
import { ereignis } from '../ui/ereignisse.js';
import { t } from '../core/sprache.js';
import { wirksam } from './eingaenge.js';
import { amUmrichter, umrichterFahren } from './antriebe.js';
import { zylinderBewegen } from './pneumatik-modell.js';
import { drosselFaktor } from './drosseln.js';
import { uebergabeUndBand2 } from './band2.js';
import { UEBERGABE, kurveEinlauf, vBand1 } from './rollenkurve.js';
import { pruefstation } from './pruefstation.js';

let angehaengt = null;
let spawnSperre = 0;
let nhAlt = new Set();
let pufferLage = null, korbXMax = Infinity;          // Korbpuffer unter/über dem Hebel −MM5, Grenze für −MM2 beim Absenken
export function prozessZuruecksetzen() { angehaengt = null; vSchlittenAlt = 0; spawnSperre = 0; nhAlt = new Set(); pufferLage = null; korbXMax = Infinity; BAND.anschlagDefekt = false; }
// Korb hängt mit dem Bügel (Mitte 158 über Korbboden) in den Hakenmulden (Bügelmitte im Haken bei 446);
// über dem Band steht er so lange auf dem Gurt, bis der Haken die 12 mm Spiel überwunden hat
export function korbUnterkante() { const u = (1 - ZYL.MM2.pos) * 300 + 446 - 158; return ZYL.MM3.pos < 0.05 ? Math.max(BAND_Y, u) : u; }
function ueberBad() { return ZYL.MM3.pos > 0.97; }

// ----------------------------------------------------------------------------
// Schutztür hinten mit Sicherheitsschalter und Zuhaltung −BG41 (SICK TR10 Lock TR10-SRM01C, Prinzip Ruhestrom:
// verriegelt durch Federkraft, entriegelt nur mit Freigabe). Ablauf wie an der realen Anlage:
//  1. Türanforderung −SF49 am Bediengehäuse neben der Tür: −KF2 schaltet die Anlage sicher ab (Stopp-Kategorie 1),
//  2. nach der Nachlaufzeit (Stillstand von Portal und Bändern) entriegelt die Zuhaltung, die Tür lässt sich öffnen,
//  3. Tür schließen: der Betätiger gleitet über den Sensor, der Riegelbolzen fährt ein, die Zuhaltung verriegelt; danach Quittieren und START.
// Tür offen oder Zuhaltung entriegelt hält −KF2 abgeschaltet (zweikanalig im Sicherheitskreis wie Not-Halt und −BG20).
// ----------------------------------------------------------------------------
const NACHLAUF = 2;
export function tuerKlick() {
  const T = st.tuer;
  if (T.offen) { T.offen = false; T.verriegelt = true; ereignis('Schutztür geschlossen, Zuhaltung −BG41 verriegelt: Quittieren und START −SF1'); return; }
  if (!T.verriegelt) { T.offen = true; ereignis('Schutztür geöffnet: −KF2 bleibt abgeschaltet, solange die Tür offen ist'); return; }
  if (T.anf > 0) return;
  T.anf = NACHLAUF;
  ereignis('Türanforderung −SF49: Anlage wird stillgesetzt, Zuhaltung −BG41 entriegelt nach der Nachlaufzeit');
}
function tuerZuhaltung(dt) {
  const T = st.tuer;
  if (T.anf <= 0) return;
  T.anf -= dt;
  if (T.anf <= 0) { T.anf = 0; T.verriegelt = false; ereignis('Zuhaltung −BG41 entriegelt: Schutztür kann geöffnet werden'); }
}

export function prozess(dt) {
  const p2 = ZYL.MM2.pos, p3 = ZYL.MM3.pos, p4 = ZYL.MM4.pos;
  // Sicherheitsrelais −KF2: Not-Halt −SF0/−SF8/−SF9/−SF10/−SF33 (Öffner in Reihe), Start über einen der parallelen
  // Quittiertaster −SF4/−SF41…−SF44 am Reset-Eingang. Überwachter Start (DIN EN ISO 13849-1, 5.2.2): −KF2 gibt erst beim
  // Loslassen des Tasters frei, ein klemmender Taster gibt also nie frei
  const quitt = QUITT.find(q => st.bedien[q.key]), quittFlanke = !!quitt && !st.quittAlt;
  const losgelassen = !quitt && st.quittAlt;
  const gedrueckt = NOT_HALT.filter(n => st.notHalt[n.key]);
  tuerZuhaltung(dt);
  const tuerNichtZu = st.tuer.offen || !st.tuer.verriegelt || st.tuer.anf > 0;   // Zuhaltung −BG41 nicht verriegelt (zuhaltungsüberwacht)
  const nh = gedrueckt.length > 0 || st.eingriff || tuerNichtZu;
  if (nh && st.kf2) {
    st.kf2 = false; st.anlauf = false;
    ereignis(gedrueckt.length ? t`NOT-HALT ${notHaltText(gedrueckt)}: Sicherheitsrelais −KF2 hat Ventile, Schütze und Heizung abgeschaltet`
      : st.eingriff ? 'Lichtvorhang −BG20 unterbrochen: −KF2 hat Ventile, Schütze und Heizung abgeschaltet'
        : 'Türanforderung −SF49: −KF2 hat Ventile, Schütze und Heizung abgeschaltet', 'err');
  }
  else for (const n of gedrueckt) if (!nhAlt.has(n.key)) ereignis(t`NOT-HALT ${notHaltText([n])} betätigt (−KF2 hat bereits abgeschaltet)`, 'err');
  nhAlt = new Set(gedrueckt.map(n => n.key));
  if (!nh && !st.kf2 && losgelassen) { st.kf2 = true; ereignis(t`Not-Halt quittiert ${t(losgelassen.ort)} (${losgelassen.bmk}): −KF2 gibt wieder frei, START −SF1 setzt die Anlage wieder in Gang`); }
  if (nh && quittFlanke) ereignis(gedrueckt.length ? t`Quittieren nicht möglich: Not-Halt ${notHaltText(gedrueckt)} ist noch verriegelt` : st.eingriff ? 'Quittieren nicht möglich: Schutzfeld des Lichtvorhangs ist nicht frei' : 'Quittieren nicht möglich: Schutztür offen oder nicht zugehalten (−BG41)', '', 'nhq');
  st.quittAlt = quitt || null;
  // Wiederanlaufsperre: Bandmodul und Portalsteuerung laufen nach dem Quittieren erst mit einem neuen Startbefehl
  if (st.kf2 && !st.anlauf && st.bedien.sf1) { st.anlauf = true; ereignis('START −SF1: automatische Bereiche laufen wieder an'); }

  zylinderBewegen(ZYL.MM1, dt);
  const badFrei = p3 > 0.97 && p4 < 0.03;
  const badSperre = p3 > 0.6 && !badFrei;
  zylinderBewegen(ZYL.MM2, dt, {
    xMax: Math.min(badSperre ? 0.45 * 300 : 300, korbXMax),
    sperrText: !badSperre ? 'Kollision: Korb setzt mit dem Puffer auf dem geschlossenen Anschlag −MM5 auf und hängt schief'
      : p3 > 0.97 ? 'Kollision: −MM2 senkt auf die geschlossene Badabdeckung (−BG7 fehlt)' : 'Kollision: −MM2 senkt auf den Badrand (−MM3 nicht in Endlage)',
    last: ZYL.MM2.ventil > 0 ? 1.12 : (angehaengt ? 0.82 : 0.95),
  });
  // −MM3 darf bei gesenktem −MM2 nicht verfahren – die letzten 10 mm in die Endlage (Sensor schaltet 3 mm davor, die
  // Dämpfung kriecht) fährt er aber zu Ende: der Korb steht da schon über dem Ziel, das ist keine Kollision
  const mm3Ziel = ZYL.MM3.ventil > 0 ? ZYL.MM3.hub : 0, mm3FaehrtEin = Math.abs(mm3Ziel - ZYL.MM3.x) < 10;
  zylinderBewegen(ZYL.MM3, dt, { gesperrt: p2 > 0.05 && !mm3FaehrtEin, sperrText: 'Kollision: −MM3 fährt nicht, Tauchzylinder −MM2 ist nicht oben (−BG3)' });
  zylinderBewegen(ZYL.MM4, dt, { gesperrt: ZYL.MM4.ventil > 0 && p3 > 0.6 && p2 > 0.45, sperrText: 'Kollision: Abdeckung −MM4 stößt an den abgesenkten Korb' });

  // Regelstrecke Zinnbad: Heizelement (PT1, 6 s) → Bad (PT1, 150 s, Verluste an die Umgebung)
  // Volle Leistung ergibt 360 °C im Beharrungszustand, für 280 °C sind ca. 76 % nötig.
  let u;
  if (st.betriebBad === 'auto') {
    if (st.temp < 278) st.regelEin = true;
    if (st.temp > 282) st.regelEin = false;
    u = st.heizung && st.kf2 && st.regelEin ? 1 : 0;
  } else u = wirksam('TB1_Heizung') ? 1 : 0;
  st.heizU = u;
  st.heizElement += (u - st.heizElement) * Math.min(1, dt / 6);
  st.temp += (2.27 * st.heizElement - (st.temp - 20) / 150) * dt;
  if (st.betriebBad === 'sps' && wirksam('MB11_Nachfuellen')) {
    st.fuell = Math.min(100, st.fuell + 2 * dt);
    if (st.fuell >= 99.5) ereignis('Zinnbad überfüllt: Nachfüllen −MB11 nicht rechtzeitig beendet', 'err', 'voll');
  }

  // Band: Antrieb, Anschlag und Vereinzeler – je nach Übungsumfang vom Bandmodul oder von der SPS gesteuert
  const bandKoerbe = koerbe.filter(k => k.zustand === 'band');
  // Schwenkhebel −MM5/−MM6: Anschlagleiste ab za, Hebel bis za + DICKE (bei −MM5 ragt −BG40 weiter nach hinten)
  const ueberdeckt = (za, tief) => bandKoerbe.some(k => k.z + 55 > za + 0.5 && k.z - 55 < za + tief);   // Korbkörper ±55
  // −MM5 schwenkt auch nicht in einen Korb, der am Haken über dem Übergabeplatz hängt (Puffer und Korbkörper im Weg)
  const korbUnterMM5 = !!angehaengt && p3 < 0.05 && korbHoehe() < 170;
  let anschlagZu, vereinzelerZu;
  if (st.betriebBand === 'auto' && !st.sa3) {
    // Bandmodul: Anschlag öffnet, sobald der Haken den Korb hat und das Band steht, und bleibt offen, bis der fertige Korb abgefahren ist;
    // der Vereinzeler gibt den nächsten Korb erst frei, wenn der Anschlag wieder zu ist
    anschlagZu = !(angehaengt && (BAND.anschlagPos > 0.02 || Math.abs(BAND.v) < 1)) && !bandKoerbe.some(k => k.fertig && k.z > -60 && k.z < 125);
    vereinzelerZu = !!angehaengt || bandKoerbe.some(k => k.z > -40 && k.z < 125) || BAND.anschlagPos > 0.08;
  } else {
    anschlagZu = !wirksam('MB9_Anschlag_auf');                          // Federrückstellung: ohne Spannung zu
    vereinzelerZu = wirksam('MB10_Vereinzeler_zu');                      // Federrückstellung: ohne Spannung offen
  }
  // Stellung 0 = zu, 1 = offen (90°); Schwenkantrieb mit Nennschwenkzeit SCHWENKZEIT, je Richtung gedrosselt
  const fahre = (pos, zu, frei, kurz) => {
    const ziel = zu && !(pos > STOPPER.FREI && !frei) ? 0 : 1;          // Hebel schwenkt nicht in einen Korb hinein
    const schritt = dt / STOPPER.SCHWENKZEIT * st.speed * drosselFaktor(kurz, ziel === 0 ? 1 : -1);
    return pos + Math.max(-schritt, Math.min(schritt, ziel - pos));
  };
  BAND.anschlagPos = fahre(BAND.anschlagPos, anschlagZu, !ueberdeckt(STOPPER.MM5, STOPPER.RUECKEN_MM5) && !korbUnterMM5, 'MM5');
  BAND.vereinzelerPos = fahre(BAND.vereinzelerPos, vereinzelerZu, !ueberdeckt(STOPPER.MM6, STOPPER.DICKE), 'MM6');
  const grenzen = bandGrenzen(bandKoerbe);
  let vZiel = 0;
  if (st.betriebBand === 'auto' && st.sa2) {
    // Vor-Ort-Steuerstelle (Schlüsselschalter): Rechts/Links mit Selbsthaltung, Halt (Öffner), gegenseitig verriegelt
    const vo = BAND.vorOrt;
    if (st.bedien.sf7 || !st.kf2 || !st.fa1Ok) vo.r = vo.l = false;
    else if (st.bedien.sf5 && !vo.l) vo.r = true;
    else if (st.bedien.sf6 && !vo.r) vo.l = true;
    BAND.wende = vo.r ? 1 : vo.l ? -1 : 0;
    vZiel = BAND.wende * BAND.vSoll;
  } else if (st.betriebBand === 'auto') {
    BAND.vorOrt.r = BAND.vorOrt.l = false; BAND.wende = 0;
    // Bedarf: ein Korb kann weiter, oder ein Korb liegt noch im Übergabebereich am Kurvenanfang (Band 1 muss mitlaufen)
    const bedarf = bandKoerbe.some(k => k.z < grenzen.get(k).max - 0.5) || koerbe.some(k => k.zustand === 'kurve' && k.s < UEBERGABE && KURVE.wende > 0);
    vZiel = bedarf && autoFrei() && st.fa1Ok && !korbUnterMM5 ? BAND.vSoll : 0;          // Band steht, solange ein Korb am Haken über dem Übergabeplatz hängt
  } else if (amUmrichter('TA2')) {
    // Umrichter −TA2: das Telegramm kommt von der SPS
  } else {
    // Wendeschützkombination −QA1/−QA2: mechanisch verriegelt, das zuerst angezogene Schütz bleibt
    let r = wirksam('QA1_Band_Rechts'), l = wirksam('QA2_Band_Links');
    if (r && l) { ereignis('Wendeschütz: Rechts- und Linkslauf gleichzeitig angesteuert (mechanisch verriegelt)', 'err', 'wende'); r = BAND.wende > 0; l = BAND.wende < 0; }
    BAND.wende = st.fa1Ok ? (r ? 1 : l ? -1 : 0) : 0;
    vZiel = BAND.wende * BAND.vSoll;
  }
  BAND.fu = amUmrichter('TA2');
  if (BAND.fu) {
    // Umrichter −TA2 (Rampen macht der Umrichter, Not-Halt −KF2 wählt STO an); im Übungsumfang „automatisch“ führt ihn das Bandmodul
    BAND.wende = 0;
    BAND.v = umrichterFahren('TA2', dt, st.betriebBand === 'sps' ? null : vZiel);
  } else BAND.v += Math.max(-BAND.a * dt, Math.min(BAND.a * dt, vZiel - BAND.v));
  BAND.weg += BAND.v * dt;
  for (const k of bandKoerbe) {
    const g = grenzen.get(k);
    k.z = Math.max(Math.min(k.z, g.min), Math.min(Math.max(k.z, g.max), k.z + vBand1(k) * dt));   // an der Kurve gemeinsam mit −MA6
  }
  korbAnschlagKollision(dt);
  korbPendel(dt);
  // −BG40 in der Anschlagleiste: sieht den Eckstab des Korbs, solange er anliegt (auch am Haken, bis er ca. 25 mm angehoben ist)
  BAND.bg40 = !BAND.anschlagDefekt && BAND.anschlagPos < 0.03 && (bandKoerbe.some(k => Math.abs(k.z) < 1) || (!!angehaengt && p3 < 0.05 && korbHoehe() < 25));
  uebergabeUndBand2(dt);
  pruefstation(dt);
  spawnSperre -= dt;
  const wartend = koerbe.filter(k => k.zustand === 'band' && !k.fertig).length + (angehaengt ? 1 : 0);
  if (st.zufuhr && spawnSperre <= 0 && wartend < 2) korbAuflegen(false);

  // Einhängen / Lösen
  const amBandUnten = p2 > 0.97 && p3 < 0.02;
  if (!angehaengt && ZYL.MM1.pos < 0.5 && amBandUnten) {
    const k = koerbe.find(k => k.zustand === 'band' && Math.abs(k.z) < 3);
    if (k) { k.zustand = 'haken'; k.z = 0; k.kipp = 0; k.kippV = 0; k.pendel = 0; k.pendelV = 0; angehaengt = k; }
  }
  if (angehaengt && ZYL.MM1.pos > 0.5) {
    const k = angehaengt;
    angehaengt = null;
    if (amBandUnten) {
      k.zustand = 'band'; k.z = 0; k.fertig = true;
      if (!k.getaucht) ereignis(t`Korb ${k.nr} unverzinnt abgelegt`, 'err');
      else {
        const ok = k.tauch >= st.tauchSoll - 0.5 && k.tropf >= st.tropfSoll - 0.5;
        if (ok) st.verzinnt++;
        ereignis(ok ? t`Korb ${k.nr} verzinnt · Tauchzeit ${fmt1.format(k.tauch)} s · Abtropfzeit ${fmt1.format(k.tropf)} s` : t`Korb ${k.nr} mangelhaft · Tauchzeit ${fmt1.format(k.tauch)} s · Abtropfzeit ${fmt1.format(k.tropf)} s`, ok ? 'ok' : 'err');
      }
    } else if (ueberBad() && korbUnterkante() < RAND_Y && ZYL.MM4.pos < 0.03) {
      ereignis(t`Korb ${k.nr} ist ins Zinnbad gefallen (−MM1 über dem Bad gelöst)`, 'err');
      korbEntfernen(k);
    } else {
      ereignis(t`Korb ${k.nr} abgeworfen (−MM1 nicht über dem Band gelöst)`, 'err');
      korbEntfernen(k);
    }
  }

  // Tauchen und Abtropfen (Hysterese, damit sinkender Pegel nicht doppelt zählt)
  if (angehaengt) {
    const k = angehaengt, unten = korbUnterkante();
    const imZinn = ueberBad() && (k.imBad ? unten < zinnY() + 5 : unten < zinnY() - 15);
    if (imZinn && !k.imBad) { st.fuell = Math.max(0, st.fuell - 4); st.temp -= 5; k.getaucht = true; }
    k.imBad = imZinn;
    if (imZinn) { k.tauch += dt; k.beschichtung = Math.min(1, k.beschichtung + dt / 3); k.temp = st.temp; }
    else if (k.getaucht && ueberBad()) {
      k.tropf += dt;
      k.tropfenTakt -= dt;
      if (k.tropfenTakt <= 0 && k.tropf < 14) { tropfenErzeugen(BAD_X, unten, 0); k.tropfenTakt = 0.05 + k.tropf * 0.06; }
    }
  }
  for (const t of [...tropfen]) {
    t.v += 9810 * dt * 0.4;
    t.m.position.y -= t.v * dt;
    if (t.m.position.y < zinnY()) { anlage.remove(t.m); tropfen.splice(tropfen.indexOf(t), 1); }
  }
}
export function korbAuflegen(manuell) {
  if (koerbe.some(k => k.zustand === 'band' && k.z < -BAND_ENDE + KORB_TEILUNG)) { if (manuell) ereignis('Bandanfang belegt, Korb später auflegen', '', 'belegt'); return; }
  korbErzeugen(-BAND_ENDE);
  spawnSperre = 3;
}
// Bewegungsgrenzen je Korb: Endanschlag am Bandanfang, Abstand zu den Nachbarkörben (Kante an Kante),
// Anschlag- und Vereinzelerhebel (sperren je nach Richtung von der einen oder anderen Seite: von vorn an der
// Anschlagfläche za, von hinten am Hebel bzw. bei −MM5 an −BG40)
// Körbe stauen sich über ihre Stoßpuffer: Teilung 150 mm, 40 mm Lücke zwischen den Korbkörpern; der Korb am Vereinzeler
// wartet 10 mm hinter dem Korb am Übergabeplatz (50 mm Lücke, der Vereinzelerhebel steht nicht über dessen Puffer).
// Der Schwenkhebel gibt den Korb erst ab FREI (80 %) des Öffnungswinkels frei; ein abgerissener −MM5 hält nichts mehr.
function bandGrenzen(liste) {
  const m = new Map(), vor = [...liste].sort((a, b) => b.z - a.z);
  const a5 = !BAND.anschlagDefekt && BAND.anschlagPos < STOPPER.FREI, a6 = BAND.vereinzelerPos < STOPPER.FREI;
  const z5 = STOPPER.MM5 - 55, z6 = STOPPER.MM6 - 55;                  // Korbmitte am Anschlag / am Vereinzeler
  let vorne = kurveEinlauf() + KORB_TEILUNG;                           // letzter Korb in der Rollenkurve
  for (const k of vor) {
    let max = vorne - KORB_TEILUNG;
    if (a5 && k.z <= z5 + 0.5) max = Math.min(max, z5);
    if (a6 && k.z <= z6 + 0.5) max = Math.min(max, z6);
    m.set(k, { max, min: -Infinity }); vorne = k.z;
  }
  let hinten = -Infinity;
  const r5 = STOPPER.MM5 + STOPPER.RUECKEN_MM5 + 55, r6 = STOPPER.MM6 + STOPPER.DICKE + 55;
  for (const k of [...vor].reverse()) {
    let min = Math.max(hinten + KORB_TEILUNG, -BAND_ENDE);
    if (a5 && k.z >= r5 - 0.5) min = Math.max(min, r5);
    if (a6 && k.z >= r6 - 0.5) min = Math.max(min, r6);
    m.get(k).min = min; hinten = k.z;
  }
  return m;
}

// ----------------------------------------------------------------------------
// Korbpuffer und Anschlaghebel −MM5
// Die PU-Puffer sitzen unten am Korb (0…15 mm über der Unterkante, x = ±31…45, bis 20 mm vor der Stirnwand). Am
// Übergabeplatz liegen sie bei geschlossenem −MM5 unter dem Hebel. Der Hebel überdeckt sie, solange sein Arm über
// x = 45 hinausreicht (bis ca. 56° Öffnung).
//  - Anheben bei geschlossenem Anschlag: der vordere Puffer hängt unter dem Hebel, der Korb kippt um den Bügel nach vorn;
//    ab 10° reißt −MM5 ab (Hebel verbogen hochgeklappt, ohne Funktion bis „Anlage zurücksetzen“), der Korb pendelt frei.
//  - Absenken auf den geschlossenen Anschlag: der Puffer setzt auf dem Hebel auf, der Korb kippt nach hinten, bis die
//    Kufen auf dem Gurt stehen – dann kommt −MM2 nicht weiter (bleibt vor −BG4 stehen).
// Höhen über dem Gurt; Kippwinkel um die Bügelmitte (158 über der Unterkante), + = Stirnseite nach unten.
// ----------------------------------------------------------------------------
const BUEGEL = 158, PUFFER_Z = 69, KIPP_RISS = 10 * Math.PI / 180, PENDEL_W = Math.sqrt(9810 / BUEGEL);
const korbHoehe = () => Math.max(0, (1 - ZYL.MM2.pos) * 300 + 446 - BUEGEL - BAND_Y);   // Unterkante über dem Gurt, ungekippt
function hebelUeberPuffer() {
  if (BAND.anschlagDefekt) return null;
  const w = STOPPER.WINKEL * BAND.anschlagPos, c = Math.cos(w);
  if (c < 1e-6 || STOPPER.L * c < STOPPER.X - 45) return null;           // Arm endet vor den Puffern
  const y0 = STOPPER.Y - BAND_Y, tn = Math.tan(w), dick = 8 / c;
  return { unten: y0 + (STOPPER.X - 45) * tn - dick, oben: y0 + Math.min(STOPPER.X - 31, STOPPER.L * c) * tn + dick };
}
// Absenken: Kippwinkel (nach hinten, ≥ 0), mit dem der Puffer auf dem Hebel (oben) liegt, bei Unterkante h
function kippAufHebel(h, oben) {
  const R = Math.hypot(157, PUFFER_Z), phi = Math.atan2(PUFFER_Z, 157), c = (h + BUEGEL - oben) / R;
  return c >= 157 / R ? 0 : Math.acos(Math.max(-1, c)) - phi;
}
// ----------------------------------------------------------------------------
// Pendeln am Bügel beim Verfahren von −MM3: Der Bügel liegt in den Hakenmulden (Drehachse z), der Korb schwingt
// als physikalisches Pendel in Fahrtrichtung x. Im Schlittensystem wirkt die Schlittenbeschleunigung a als Scheinkraft:
//   φ'' = −(g·sin φ + a·cos φ) / L − 2·ζ·ω·φ'      (φ > 0: Unterkante nach +x)
// L = I / (m·d) ≈ 128 mm (Schwerpunkt ca. 93 mm unter dem Bügel, Korb 150 × 130 mm) → ω ≈ 8,8 1/s, f ≈ 1,4 Hz.
// Bei 180 mm/s Fahrgeschwindigkeit schwingt der Korb nach Anfahren und Abbremsen etwa ±8°.
// Steht der Korb noch auf dem Gurt, pendelt er nicht; im flüssigen Zinn ist er stark gedämpft.
// ----------------------------------------------------------------------------
const PENDEL_L = 128, PENDEL_W0 = Math.sqrt(9810 / PENDEL_L), DAEMPF_LUFT = 0.06, DAEMPF_ZINN = 1.5;
let vSchlittenAlt = 0;
function korbPendel(dt) {
  const v = ZYL.MM3.v || 0, a = dt > 0 ? (v - vSchlittenAlt) / dt : 0;
  vSchlittenAlt = v;
  const k = angehaengt;
  if (!k) return;
  k.pendel ??= 0; k.pendelV ??= 0;
  if (korbHoehe() < 1) { k.pendel = 0; k.pendelV = 0; return; }         // steht auf dem Gurt
  const zeta = ueberBad() && korbUnterkante() < zinnY() ? DAEMPF_ZINN : DAEMPF_LUFT;
  const n = Math.ceil(dt / 0.005), h = dt / n;                            // Teilschritte: stabil auch bei großen Zeitschritten
  for (let i = 0; i < n; i++) {
    k.pendelV += (-(9810 * Math.sin(k.pendel) + a * Math.cos(k.pendel)) / PENDEL_L - 2 * zeta * PENDEL_W0 * k.pendelV) * h;
    k.pendel += k.pendelV * h;
  }
}
function korbAnschlagKollision(dt) {
  const k = angehaengt;
  korbXMax = Infinity;
  if (!k) { pufferLage = null; return; }
  k.kipp ??= 0; k.kippV ??= 0;
  const h = korbHoehe(), hebel = ZYL.MM3.pos < 0.05 ? hebelUeberPuffer() : null;
  if (!hebel) pufferLage = null;
  else if (!pufferLage) pufferLage = h + 1 >= hebel.oben - 0.5 ? 'ueber' : 'unter';
  let kipp = null;                                                     // erzwungener Kippwinkel (sonst pendelt der Korb)
  if (pufferLage === 'unter') {
    const R = Math.hypot(BUEGEL - 14, PUFFER_Z), phi = Math.atan2(PUFFER_Z, BUEGEL - 14);
    const c = (h + BUEGEL - hebel.unten) / R;
    if (c * R > BUEGEL - 14) {
      ereignis(t`Kollision: Puffer von Korb ${k.nr} hängt unter dem geschlossenen Anschlag −MM5, der Korb kippt`, 'err', 'mm5haengt');
      kipp = c >= 1 ? Infinity : phi - Math.acos(c);
      if (kipp >= KIPP_RISS) {
        BAND.anschlagDefekt = true; pufferLage = null; kipp = null; k.kipp = KIPP_RISS; k.kippV = 0;
        ereignis(t`Anschlag −MM5 abgerissen: Korb ${k.nr} bei geschlossenem Anschlag angehoben. Hebel verbogen, ohne Funktion bis „Anlage zurücksetzen“`, 'err');
      }
    }
  } else if (pufferLage === 'ueber' && h + 1 < hebel.oben + 40) {
    kipp = -kippAufHebel(h, hebel.oben);
    // tiefste Unterkante: Puffer auf dem Hebel und Kufen hinten auf dem Gurt (Halbierung)
    let lo = 0, hi = hebel.oben;
    const hinten = (hh) => { const s = kippAufHebel(hh, hebel.oben); return hh + BUEGEL - BUEGEL * Math.cos(s) - 63 * Math.sin(s); };
    if (hinten(lo) < 0) { for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (hinten(m) < 0) lo = m; else hi = m; } korbXMax = 288 - hi; }
    if (kipp === 0) kipp = null;
  }
  if (kipp !== null) { k.kipp = kipp; k.kippV = 0; }
  else {
    // frei hängend: gedämpftes Pendel um den Bügel
    k.kippV += (-PENDEL_W * PENDEL_W * k.kipp - 2 * 0.12 * PENDEL_W * k.kippV) * dt;
    k.kipp += k.kippV * dt;
  }
}
