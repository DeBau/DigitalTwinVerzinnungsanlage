import { NOT_HALT, QUITT, TAUCH_SOLL, TROPF_SOLL, ZYL, notHaltText, st } from './zustand.js';
import { anlage } from '../core/szene.js';
import { fmt1 } from '../core/format.js';
import { BAND, BAND_ENDE, BAND_Y, KORB_TEILUNG, KURVE } from '../anlage/baender.js';
import { BAD_X, RAND_Y, zinnY } from '../anlage/zinnbad.js';
import { koerbe, korbEntfernen, korbErzeugen, tropfen, tropfenErzeugen } from '../anlage/koerbe.js';
import { ereignis } from '../ui/ereignisse.js';
import { wirksam } from './eingaenge.js';
import { zylinderBewegen } from './pneumatik-modell.js';
import { drosselFaktor } from './drosseln.js';
import { uebergabeUndBand2 } from './band2.js';
import { UEBERGABE, kurveEinlauf, vBand1 } from './rollenkurve.js';
import { pruefstation } from './pruefstation.js';

let angehaengt = null;
let spawnSperre = 0;
let nhAlt = new Set();
export function prozessZuruecksetzen() { angehaengt = null; spawnSperre = 0; nhAlt = new Set(); }
// Korb hängt mit dem Bügel (Mitte 158 über Korbboden) in den Hakenmulden (Bügelmitte im Haken bei 446);
// über dem Band steht er so lange auf dem Gurt, bis der Haken die 12 mm Spiel überwunden hat
export function korbUnterkante() { const u = (1 - ZYL.MM2.pos) * 300 + 446 - 158; return ZYL.MM3.pos < 0.05 ? Math.max(BAND_Y, u) : u; }
function ueberBad() { return ZYL.MM3.pos > 0.97; }

export function prozess(dt) {
  const p2 = ZYL.MM2.pos, p3 = ZYL.MM3.pos, p4 = ZYL.MM4.pos;
  // Sicherheitsrelais −KF2: Not-Halt −SF0/−SF8/−SF9/−SF10/−SF33 (Öffner in Reihe), Start über einen der parallelen
  // Quittiertaster −SF4/−SF41…−SF44 (Flanke am Reset-Eingang)
  const quitt = QUITT.find(q => st.bedien[q.key]), quittFlanke = !!quitt && !st.sf4Alt;
  const gedrueckt = NOT_HALT.filter(n => st.notHalt[n.key]);
  const nh = gedrueckt.length > 0 || st.eingriff;
  if (nh && st.kf2) { st.kf2 = false; ereignis(st.eingriff && !gedrueckt.length ? 'Lichtvorhang −BG20 unterbrochen: −KF2 hat Ventile, Schütze und Heizung abgeschaltet' : `NOT-HALT ${notHaltText(gedrueckt)}: Sicherheitsrelais −KF2 hat Ventile, Schütze und Heizung abgeschaltet`, 'err'); }
  else for (const n of gedrueckt) if (!nhAlt.has(n.key)) ereignis(`NOT-HALT ${notHaltText([n])} betätigt (−KF2 hat bereits abgeschaltet)`, 'err');
  nhAlt = new Set(gedrueckt.map(n => n.key));
  if (!nh && !st.kf2 && quittFlanke) { st.kf2 = true; ereignis(`Not-Halt quittiert ${quitt.ort} (${quitt.bmk}): −KF2 gibt wieder frei`); }
  if (nh && quittFlanke) ereignis(gedrueckt.length ? `Quittieren nicht möglich: Not-Halt ${notHaltText(gedrueckt)} ist noch verriegelt` : 'Quittieren nicht möglich: Schutzfeld des Lichtvorhangs ist nicht frei', '', 'nhq');
  st.sf4Alt = !!quitt;

  zylinderBewegen(ZYL.MM1, dt);
  const badFrei = p3 > 0.97 && p4 < 0.03;
  zylinderBewegen(ZYL.MM2, dt, {
    xMax: (p3 > 0.6 && !badFrei) ? 0.45 * 300 : 300,
    sperrText: p3 > 0.97 ? 'Kollision: −MM2 senkt auf die geschlossene Badabdeckung (−BG7 fehlt)' : 'Kollision: −MM2 senkt auf den Badrand (−MM3 nicht in Endlage)',
    last: ZYL.MM2.ventil > 0 ? 1.12 : (angehaengt ? 0.82 : 0.95),
  });
  zylinderBewegen(ZYL.MM3, dt, { gesperrt: p2 > 0.05, sperrText: 'Verriegelung: −MM3 fährt nicht, Tauchzylinder −MM2 ist nicht oben (−BG3)' });
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
  // Schwenkhebel −MM5/−MM6: Anschlagfläche za, Leiste/Hebel/Bolzenköpfe bis za + 25 (Dämpfer liegt neben dem Korb)
  const ueberdeckt = (za) => bandKoerbe.some(k => k.z + 55 > za + 0.5 && k.z - 55 < za + 25);   // Korbkörper ±55
  let anschlagZu, vereinzelerZu;
  if (st.betriebBand === 'auto' && !st.sa3) {
    anschlagZu = !bandKoerbe.some(k => k.fertig && k.z > -60 && k.z < 125);
    vereinzelerZu = !!angehaengt || bandKoerbe.some(k => k.z > -40 && k.z < 125);
  } else {
    anschlagZu = !wirksam('MB9_Anschlag_auf');                          // Federrückstellung: ohne Spannung zu
    vereinzelerZu = wirksam('MB10_Vereinzeler_zu');                      // Federrückstellung: ohne Spannung offen
  }
  // Stellung 0 = zu (Kolbenstange aus), 1 = offen; Nennschwenkzeit 1/6 s, je Richtung gedrosselt
  const fahre = (pos, zu, zf, kurz) => {
    const ziel = zu && !(pos > HEBEL_FREI && ueberdeckt(zf)) ? 0 : 1;   // Hebel schwenkt nicht in einen Korb hinein
    const schritt = dt * 6 * st.speed * drosselFaktor(kurz, ziel === 0 ? 1 : -1);
    return pos + Math.max(-schritt, Math.min(schritt, ziel - pos));
  };
  BAND.anschlagPos = fahre(BAND.anschlagPos, anschlagZu, 55, 'MM5');            // Anschlagfläche −MM5
  BAND.vereinzelerPos = fahre(BAND.vereinzelerPos, vereinzelerZu, -95, 'MM6');   // Anschlagfläche −MM6
  const grenzen = bandGrenzen(bandKoerbe);
  let vZiel;
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
    vZiel = bedarf && st.kf2 ? BAND.vSoll : 0;
  } else {
    // Wendeschützkombination −QA1/−QA2: mechanisch verriegelt, das zuerst angezogene Schütz bleibt
    let r = wirksam('QA1_Band_Rechts'), l = wirksam('QA2_Band_Links');
    if (r && l) { ereignis('Wendeschütz: Rechts- und Linkslauf gleichzeitig angesteuert (mechanisch verriegelt)', 'err', 'wende'); r = BAND.wende > 0; l = BAND.wende < 0; }
    BAND.wende = st.fa1Ok ? (r ? 1 : l ? -1 : 0) : 0;
    vZiel = BAND.wende * BAND.vSoll;
  }
  BAND.v += Math.max(-BAND.a * dt, Math.min(BAND.a * dt, vZiel - BAND.v));
  BAND.weg += BAND.v * dt;
  for (const k of bandKoerbe) {
    const g = grenzen.get(k);
    k.z = Math.max(Math.min(k.z, g.min), Math.min(Math.max(k.z, g.max), k.z + vBand1(k) * dt));   // an der Kurve gemeinsam mit −MA6
  }
  uebergabeUndBand2(dt);
  pruefstation(dt);
  spawnSperre -= dt;
  const wartend = koerbe.filter(k => k.zustand === 'band' && !k.fertig).length + (angehaengt ? 1 : 0);
  if (st.zufuhr && spawnSperre <= 0 && wartend < 2) korbAuflegen(false);

  // Einhängen / Lösen
  const amBandUnten = p2 > 0.97 && p3 < 0.02;
  if (!angehaengt && ZYL.MM1.pos < 0.5 && amBandUnten) {
    const k = koerbe.find(k => k.zustand === 'band' && Math.abs(k.z) < 3);
    if (k) { k.zustand = 'haken'; k.z = 0; angehaengt = k; }
  }
  if (angehaengt && ZYL.MM1.pos > 0.5) {
    const k = angehaengt;
    angehaengt = null;
    if (amBandUnten) {
      k.zustand = 'band'; k.z = 0; k.fertig = true;
      if (!k.getaucht) ereignis(`Korb ${k.nr} unverzinnt abgelegt`, 'err');
      else {
        const ok = k.tauch >= TAUCH_SOLL - 0.5 && k.tropf >= TROPF_SOLL - 0.5;
        if (ok) st.verzinnt++;
        ereignis(`Korb ${k.nr} ${ok ? 'verzinnt' : 'mangelhaft'} · Tauchzeit ${fmt1.format(k.tauch)} s · Abtropfzeit ${fmt1.format(k.tropf)} s`, ok ? 'ok' : 'err');
      }
    } else if (ueberBad() && korbUnterkante() < RAND_Y && ZYL.MM4.pos < 0.03) {
      ereignis(`Korb ${k.nr} ist ins Zinnbad gefallen (−MM1 über dem Bad gelöst)`, 'err');
      korbEntfernen(k);
    } else {
      ereignis(`Korb ${k.nr} abgeworfen (−MM1 nicht über dem Band gelöst)`, 'err');
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
// Anschlag- und Vereinzelerfinger (sperren je nach Richtung von der einen oder anderen Seite)
// Körbe stauen sich über ihre Stoßpuffer: Teilung 150 mm, 40 mm Lücke zwischen den Korbkörpern für den Vereinzelerhebel
// Der Schwenkhebel gibt den Korb erst ab 80 % Öffnungswinkel frei (dann ist er über Korbrand und Tragbügel)
const HEBEL_FREI = 0.8;
function bandGrenzen(liste) {
  const m = new Map(), vor = [...liste].sort((a, b) => b.z - a.z);
  let vorne = kurveEinlauf() + KORB_TEILUNG;                           // letzter Korb in der Rollenkurve
  for (const k of vor) {
    let max = vorne - KORB_TEILUNG;
    if (BAND.anschlagPos < HEBEL_FREI && k.z <= 0.5) max = Math.min(max, 0);
    if (BAND.vereinzelerPos < HEBEL_FREI && k.z <= -149.5) max = Math.min(max, -150);
    m.set(k, { max, min: -Infinity }); vorne = k.z;
  }
  let hinten = -Infinity;
  for (const k of [...vor].reverse()) {
    let min = Math.max(hinten + KORB_TEILUNG, -BAND_ENDE);
    if (BAND.anschlagPos < HEBEL_FREI && k.z >= 134.5) min = Math.max(min, 135);
    if (BAND.vereinzelerPos < HEBEL_FREI && k.z >= -15.5) min = Math.max(min, -15);
    m.get(k).min = min; hinten = k.z;
  }
  return m;
}
