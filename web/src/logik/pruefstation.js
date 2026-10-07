import * as THREE from 'three';
import { autoFrei, st } from './zustand.js';
import { BAND2, BAND_Y } from '../anlage/baender.js';
import { kipperKinematik, kippWinkel, MM8, MULDE, ST } from '../anlage/pruefstation.js';
import { E2 } from '../anlage/band2.js';
import { TEILE_JE_KORB, kipperKorb, koerbe, korbEntfernen } from '../anlage/koerbe.js';
import { ereignis } from '../ui/ereignisse.js';
import { t } from '../core/sprache.js';
import { wirksam } from './eingaenge.js';
import { amUmrichter, umrichterFahren } from './antriebe.js';
import { zylinderBewegen } from './pneumatik-modell.js';

// Entleer- und Prüfstation: Korb auf die Kippmulde, Kippen, Teilefluss Trichter → Rinne → Prüfband → Kamera → Ausblasen/KLT
const _tm = new THREE.Matrix4(), _tq = new THREE.Quaternion(), _te = new THREE.Euler(), _tv = new THREE.Vector3(), _ts = new THREE.Vector3(1, 1, 1), _tc = new THREE.Color();
const ZINN_C = new THREE.Color(0xdfe4e8), KUPFER_C = new THREE.Color(0xb8743f);
export function pruefstation(dt) {
  const auto = st.betriebBand === 'auto' && !st.sa3;
  const vo = auto && st.sa6;                                         // Vor-Ort −S40 (bei „SPS“ wertet die SPS sie aus)
  const korb = kipperKorb();
  const amEndanschlag = !!korb && korb.kx >= ST.korbX - 2;
  // --- Kipper ---
  if (auto && !vo) {
    if (!ST.kipBefehl && korb && korb.kx >= ST.korbX - 1 && MM8.an0 && !korb.entleert && ST.trichter.length < 8 && autoFrei()) ST.kipBefehl = true;
    if (ST.kipBefehl && MM8.an1 && korb && korb.entleert) ST.kipBefehl = false;
    if (!korb) ST.kipBefehl = false;
  } else ST.kipBefehl = false;
  // Vor-Ort −S40: Kippen −SF38 / Zurück −SF39 (5/2 monostabil → Selbsthaltung), Kippen nur mit Korb am Endanschlag oder leerer Mulde
  if (vo) {
    if (st.bedien.sf38 && (!korb || amEndanschlag)) ST.vorOrt.kip = true;
    if (st.bedien.sf39 || !st.kf2) ST.vorOrt.kip = false;
  } else ST.vorOrt.kip = false;
  MM8.befehl = () => (vo ? ST.vorOrt.kip && st.kf2 : auto ? ST.kipBefehl && autoFrei() : wirksam('MB15_Kippen'));
  zylinderBewegen(MM8, dt, { gesperrt: !!korb && !amEndanschlag, sperrText: 'Kippen gesperrt: Korb steht nicht am Endanschlag der Mulde (−BG33)' });
  // --- Muldenrollen −MA7: Wendeschützkombination −QA12 vor / −QA13 zurück, Motorschutz −FA8 ---
  if (vo) {
    const vor = st.bedien.sf36 && !st.bedien.sf37, zur = st.bedien.sf37 && !st.bedien.sf36;   // Tippbetrieb, nur mit Mulde unten
    MULDE.wende = st.kf2 && st.fa8Ok && MM8.an0 ? (vor ? 1 : zur ? -1 : 0) : 0;
  } else if (auto) {
    // Bandmodul automatisch: Rollen laufen zur Übernahme (Korb am Ende von Band 2, Mulde unten und leer) und bis der Korb am Endanschlag liegt
    const uebernahme = !korb && MM8.an0 && BAND2.wende > 0 && koerbe.some(k => k.zustand === 'band2' && k.x >= E2 - 1);
    MULDE.wende = (uebernahme || (korb && !amEndanschlag && MM8.pos < 0.02)) && autoFrei() && st.fa8Ok ? 1 : 0;
  } else {
    let r = wirksam('QA12_Mulde_Vor'), l = wirksam('QA13_Mulde_Zurueck');
    if (r && l) { ereignis('Wendeschütz Muldenrollen: Vor- und Rücklauf gleichzeitig angesteuert (mechanisch verriegelt)', 'err', 'wende4'); r = MULDE.wende > 0; l = MULDE.wende < 0; }
    MULDE.wende = st.fa8Ok ? (r ? 1 : l ? -1 : 0) : 0;
  }
  MULDE.v += Math.max(-MULDE.a * dt, Math.min(MULDE.a * dt, MULDE.wende * MULDE.vSoll - MULDE.v));
  MULDE.weg += MULDE.v * dt;
  const winkel = kippWinkel(MM8.x);
  // Teile rutschen ab ca. 100° Kippwinkel über die Schurre am Endanschlag aus dem Korb (Öffnung zeigt dann nach unten)
  if (korb && winkel > 1.75 && korb.rest > 0) {
    korb.ausT = (korb.ausT || 0) - dt;
    if (korb.ausT <= 0) {
      korb.ausT = 0.06;
      korb.rest--;
      korb.teileMesh.forEach(m => { if (m.isInstancedMesh) m.count = korb.rest; });   // Aufnahme für Aufnahme leer
      const gut = teilGut(korb);
      // Startpunkt an der Korböffnung (Mulde lokal x −110 … −30, y 0), Geschwindigkeit entlang der Öffnungsnormalen
      const c = Math.cos(winkel), s = Math.sin(winkel), lx = -30 - Math.random() * 80, ly = 0, v = 250 + Math.random() * 150;
      ST.teile.push({ korb, gut, zustand: 'fall', x: ST.kipX + lx * c + ly * s, y: ST.kipY - lx * s + ly * c, z: ST.z + (Math.random() - 0.5) * 100, vx: s * v, vy: c * v, vz: (Math.random() - 0.5) * 60, rx: Math.random() * 6, ry: Math.random() * 6, farbe: korb.beschichtung });
      const sm = ST.korbSumme.get(korb.nr) || { gut: 0, schlecht: 0, daneben: 0, offen: TEILE_JE_KORB }; ST.korbSumme.set(korb.nr, sm);
      if (korb.rest === 0) { korb.entleert = true; korb.teileMesh.forEach(m => { m.visible = false; }); }
    }
  }
  // Leerkorb: nach dem Zurückschwenken vom Werker abgenommen
  if (korb && korb.entleert && MM8.an0) { korb.leerT = (korb.leerT || 0) + dt; if (korb.leerT > 3) { ereignis(t`Leerkorb ${korb.nr} vom Kipper abgenommen`); korbEntfernen(korb); } }

  // --- Antriebe Rinne / Prüfband, Kamera, Ausblasen ---
  const kltVoll = ST.klt >= ST.kltVoll;
  if (auto) {
    const imFluss = ST.trichter.length > 0 || ST.teile.some(t => t.zustand === 'rinne' || t.zustand === 'band');
    if (vo) {
      // Vor-Ort −S40: Vibrorinne + Prüfband EIN −SF34 (Selbsthaltung), AUS −SF35 (Öffner)
      if (st.bedien.sf35 || !st.kf2) ST.vorOrt.pruef = false;
      else if (st.bedien.sf34) ST.vorOrt.pruef = true;
      ST.vRinne = ST.vBand = ST.vorOrt.pruef ? 1 : 0;
    } else {
      ST.vorOrt.pruef = false;
      ST.vRinne = imFluss && !kltVoll && autoFrei() ? 1 : 0;
      ST.vBand = imFluss && !kltVoll && autoFrei() ? 1 : 0;
    }
    const amKam = ST.teile.find(t => t.zustand === 'band' && !t.geprueft && Math.abs(t.x - ST.kamX) < 6);
    if (amKam && ST.pruefT <= 0) ST.pruefT = 0.12;
    ST.blasen = ST.teile.some(t => t.zustand === 'band' && t.ergebnis === 'niO' && Math.abs(t.x - ST.duesX) < 14) ? 1 : 0;
  } else {
    ST.vorOrt.pruef = false;
    ST.vRinne = wirksam('QA8_Vibro') ? 1 : 0;
    ST.vBand = wirksam('QA9_Pruefband') ? 1 : 0;
    const trig = wirksam('KF10_Kamera_Trigger');
    if (trig && !ST.trig) ST.pruefT = 0.12;
    ST.trig = trig;
    ST.blasen = wirksam('MB16_Ausblasen') ? 1 : 0;
  }
  // Vor-Ort −S50 Prüfband (Schlüssel −SA7, Vorrang vor −S40 und dem Bandmodul): EIN −SF45 mit Selbsthaltung, AUS −SF46 (Öffner),
  // Drehzahl am Potentiometer −SF47 – die wirkt nur am Umrichter −TA5, am Schütz −QA9 läuft das Band mit Nenngeschwindigkeit
  let pbSoll = ST.vBand;
  if (auto && st.sa7) {
    if (st.bedien.sf46 || !st.kf2) ST.vorOrt.pb = false;
    else if (st.bedien.sf45) ST.vorOrt.pb = true;
    ST.vBand = ST.vorOrt.pb ? 1 : 0;
    pbSoll = ST.vorOrt.pb ? st.pbPoti : 0;
  } else ST.vorOrt.pb = false;
  // Prüfband am Umrichter −TA5 (sonst Schütz −QA9, Faktor 0/1): im Übungsumfang „automatisch“ führt ihn das Bandmodul.
  // Das Band fördert nur vorwärts: im Umrichter ist die negative Drehrichtung gesperrt (p1110).
  ST.fuBand = amUmrichter('TA5');
  if (ST.fuBand) ST.vBand = Math.max(0, umrichterFahren('TA5', dt, auto ? pbSoll * 150 : null) / 150);
  // Kamera: Belichtung, dann Ergebnis für das Teil im Bild (0,3 s gültig)
  if (ST.pruefT > 0) {
    ST.pruefT -= dt;
    if (ST.pruefT <= 0) {
      const t = ST.teile.find(q => q.zustand === 'band' && Math.abs(q.x - ST.kamX) < 14);
      if (t) { t.geprueft = true; t.ergebnis = t.gut ? 'iO' : 'niO'; ST.ergebnis = t.ergebnis; }
      else { ST.ergebnis = 'leer'; ereignis('Kamera −KF10 ausgelöst, aber kein Teil im Bild', '', 'kamLeer'); }
      ST.ergebnisT = 0.3;
    }
  }
  ST.ergebnisT = Math.max(0, ST.ergebnisT - dt);
  // KLT-Tausch durch den Werker (automatisch nach 6 s)
  if (kltVoll) { ST.kltTausch += dt; if (ST.kltTausch > 6) { ereignis(t`KLT mit ${ST.klt} i.O.-Teilen getauscht`, 'ok'); ST.klt = 0; ST.kltTausch = 0; } } else ST.kltTausch = 0;

  // --- Teilefluss ---
  const vR = 70 * ST.vRinne, vB = 150 * ST.vBand;
  ST.gurtWeg = (ST.gurtWeg || 0) + vB * dt;
  ST.rinneZeit -= dt;
  const rinneStartFrei = !ST.teile.some(t => t.zustand === 'rinne' && t.x < ST.rinne0 + 45);
  if (ST.vRinne && ST.trichter.length && rinneStartFrei && ST.rinneZeit <= 0) {
    const t = ST.trichter.shift(); Object.assign(t, { zustand: 'rinne', x: ST.rinne0 + 10, y: ST.rinneY, z: ST.z, rx: Math.PI / 2, ry: 0 }); ST.rinneZeit = 0.35;
  }
  const rinne = ST.teile.filter(t => t.zustand === 'rinne').sort((a, b) => b.x - a.x);
  let vorne = Infinity;
  for (const t of rinne) {
    let nx = Math.min(t.x + vR * dt, vorne - 26);
    if (nx >= ST.rinne1) {
      const bandFrei = !ST.teile.some(q => q.zustand === 'band' && q.x < ST.band0 + 40);
      if (bandFrei) { Object.assign(t, { zustand: 'band', x: ST.band0 + 10, y: ST.bandY + 4, rx: Math.PI / 2, ry: 0 }); continue; }
      nx = ST.rinne1;
    }
    t.x = Math.max(t.x, nx); vorne = t.x;
  }
  for (const t of ST.teile) {
    if (t.zustand === 'fall') {
      t.vy -= 9810 * dt * 0.6; t.x += t.vx * dt; t.y += t.vy * dt; t.z += t.vz * dt; t.rx += dt * 8; t.ry += dt * 5;
      if (t.y < ST.trY && t.x > 3040 && t.x < 3280) { t.zustand = 'trichter'; ST.trichter.push(t); }
      else if (t.y < 10) {
        t.zustand = 'weg'; ereignis('Teil neben den Trichter gefallen', 'err', 'daneben');
        const s = ST.korbSumme.get(t.korb.nr);
        if (s) { s.daneben++; s.offen--; korbSummeMelden(t.korb.nr, s); }   // zählt mit, sonst kommt die Korbmeldung nie
      }
    } else if (t.zustand === 'trichter') {
      const i = ST.trichter.indexOf(t);
      t.x = 3180 + Math.sin(i * 2.4) * 22; t.z = ST.z + Math.cos(i * 1.7) * 20; t.y = 302 + Math.floor(i / 6) * 10;
    } else if (t.zustand === 'band') {
      t.x += vB * dt;
      if (ST.blasen && Math.abs(t.x - ST.duesX) < 15) { Object.assign(t, { zustand: 'aus', vx: 0, vy: 900, vz: 1400 }); }
      if (t.x >= ST.band1) {
        t.zustand = 'klt'; t.vx = 300; t.vy = 0; t.vz = 0;
      }
    } else if (t.zustand === 'aus' || t.zustand === 'klt') {
      t.vy -= 9810 * dt * 0.6; t.x += t.vx * dt; t.y += t.vy * dt; t.z += t.vz * dt; t.rx += dt * 10;
      const boden = t.zustand === 'aus' ? 20 : 95;
      if (t.zustand === 'aus' && t.z > ST.z + 260) { t.z = ST.z + 260 + (Math.random() - 0.5) * 200; t.vz = 0; t.vx = 0; }
      if (t.zustand === 'klt' && t.x > ST.kltX - 100) { t.vx = 0; }
      if (t.y <= boden) teilAbschliessen(t);
    }
  }
  ST.teile = ST.teile.filter(t => t.zustand !== 'fertig' && t.zustand !== 'weg');
}
function teilGut(k) {
  if (!k.getaucht || k.beschichtung < 0.95) return Math.random() < 0.05;            // Kupfer sichtbar
  if (k.nass > 0.3) return Math.random() < 0.3;                                      // Wasserflecken
  if (k.tauch < st.tauchSoll - 0.5 || k.tropf < st.tropfSoll - 0.5) return Math.random() < 0.4;
  return Math.random() > 0.04;                                                       // Zinnzapfen/Perlen
}
function teilAbschliessen(t) {
  t.zustand = 'fertig';
  const s = ST.korbSumme.get(t.korb.nr);
  if (t.vz > 0 || t.z > ST.z + 150) { ST.aus++; if (s) { s.schlecht++; s.offen--; } if (t.gut) ereignis('Gutteil ausgeblasen (Ausblasen zur falschen Zeit)', 'err', 'fehlaus'); }
  else {
    if (ST.klt >= ST.kltVoll) ereignis('KLT übervoll: −BG34 nicht beachtet', 'err', 'kltvoll');
    ST.klt++; if (s) { s.gut++; s.offen--; }
    if (!t.gut) ereignis('n.i.O.-Teil im i.O.-KLT (nicht ausgeblasen)', 'err', 'schlupf');
  }
  if (s) korbSummeMelden(t.korb.nr, s);
}
// Sind alle Teile eines Korbs angekommen (KLT, ausgeschleust oder daneben), Zusammenfassung melden
function korbSummeMelden(nr, s) {
  if (s.offen > 0) return;
  ereignis(t`Korb ${nr} geprüft: ${s.gut} i.O. im KLT, ${s.schlecht} n.i.O. ausgeschleust` + (s.daneben ? t`, ${s.daneben} neben den Trichter gefallen` : ''),
    s.schlecht > 5 || s.daneben ? 'err' : 'ok');
  ST.korbSumme.delete(nr);
}
export function pruefstationZeichnen() {
  // Kipper und Zylinder: Kolbenweg → Kippwinkel (Geometrie), Zylinder schwenkt um den Lagerbock, Stange um den Kolbenweg
  kipperKinematik(MM8.x);
  if (ST.gurtPfeile) ST.gurtPfeile.offset.x = -(ST.gurtWeg || 0) / 200;   // Pfeile laufen mit dem Gurt
  for (const f of ST.zeichnen) f();
  const k = kipperKorb();
  if (k) k.g.position.set(k.kx - ST.kipX, BAND_Y - ST.kipY, 0);
  // Vibrorinne zittert leicht
  ST.rinneGruppe.position.y = ST.vRinne ? Math.sin(performance.now() * 0.3) * 0.8 : 0;
  // Teile zeichnen
  let n = 0;
  for (const t of ST.teile) {
    if (n >= 400) break;
    _te.set(t.rx || 0, t.ry || 0, 0); _tq.setFromEuler(_te);
    _tv.set(t.x, t.y, t.z); _tm.compose(_tv, _tq, _ts);
    ST.im.setMatrixAt(n, _tm);
    _tc.copy(KUPFER_C).lerp(ZINN_C, t.farbe ?? 1); ST.im.setColorAt(n, _tc);
    n++;
  }
  ST.im.count = n; ST.im.instanceMatrix.needsUpdate = true; if (ST.im.instanceColor) ST.im.instanceColor.needsUpdate = true;
  ST.kamLicht.emissiveIntensity = ST.pruefT > 0 ? 3 : 0;
  // Füllstände
  ST.kltPlane.visible = ST.klt > 0; ST.kltPlane.position.y = ST.kltPlane.userData.y0 + 8 + 120 * Math.min(1, ST.klt / ST.kltVoll);
  ST.ausschussPlane.visible = ST.aus > 0; ST.ausschussPlane.position.y = 8 + 140 * Math.min(1, ST.aus / 80);
}

