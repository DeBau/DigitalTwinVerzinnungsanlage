import * as THREE from 'three';
import { FUELL_MIN, QUITT, TEMP_SOLL, ZYL, ZYL_LISTE, st } from '../logik/zustand.js';
import { $, TAKT, anlage } from '../core/szene.js';
import { M } from '../core/materialien.js';
import { fmt0 } from '../core/format.js';
import { KNEBEL, LICHTVORHANG, POTIS, PULT_LAMPEN, PULT_TASTER, SENSOREN } from '../anlage/register.js';
import { personBewegen } from '../anlage/werker.js';
import { B1, B2, BAND, BAND2, BAND_Y, KURVE, TROMMEL_R } from '../anlage/baender.js';
import { QM2 } from '../anlage/band1.js';
import { LS_STRAHLEN } from '../bauteile/lichtschranke.js';
import { kurvenPunkt } from '../anlage/rollenkurve.js';
import { KUEHL } from '../anlage/kuehlung.js';
import { BAD_X, reglerZeichnen, zinn, zinnY } from '../anlage/zinnbad.js';
import { deckel } from '../anlage/abdeckung.js';
import { haken, hakenKinematik, schlitten } from '../anlage/portal.js';
import { VENTIL_LEDS, mm1SchlaeucheAktualisieren } from '../anlage/pneumatik.js';
import { FELD_LEDS, ketteAktualisieren } from '../anlage/verdrahtung.js';
import { SAEULE } from '../anlage/umhausung.js';
import { KUPFER, ZINN_FARBE, daempfe, koerbe, rauchMat } from '../anlage/koerbe.js';
import { toastBis } from './ereignisse.js';
import { ausgang, eingang, wirksam } from '../logik/eingaenge.js';
import { demo } from '../logik/demo-sps.js';
import { korbUnterkante } from '../logik/prozess.js';
import { pruefstationZeichnen } from '../logik/pruefstation.js';
import { t as tr } from '../core/sprache.js';

// ----------------------------------------------------------------------------
// Visualisierung
// ----------------------------------------------------------------------------
let reglerTakt = 0, rauchTakt = 0;
export function visual(dt) {
  schlitten.position.x = ZYL.MM3.pos * BAD_X;
  haken.position.y = (1 - ZYL.MM2.pos) * 300;
  hakenKinematik(ZYL.MM1.x);
  deckel.position.x = BAD_X + (1 - ZYL.MM4.pos) * 320;
  ketteAktualisieren();
  mm1SchlaeucheAktualisieren();

  // Gurt und Trommeln bewegen sich mit der tatsächlichen Bandgeschwindigkeit (Obertrum in +z)
  B1.gurtMat.alphaMap.offset.y = -BAND.weg / B1.teilung;                 // Drahtgurt-Schleife: Textur läuft mit dem Gurtweg
  for (const tr of BAND.trommeln) tr.rotation.x = BAND.weg / TROMMEL_R;
  B2.gurtMat.alphaMap.offset.y = -BAND2.weg / B2.teilung;
  for (const tr of BAND2.trommeln) tr.rotation.x = BAND2.weg / TROMMEL_R;
  for (const r of KURVE.rollen) r.rotation.x = KURVE.weg / 17;            // konische Rollen: Radius auf der Mittellinie ca. 17 mm
  for (const k of KUEHL.kegel) k.visible = BAND2.spruehen > 0.5;
  KUEHL.luftschleier.visible = BAND2.blasen > 0.5;
  KUEHL.ventilLed.emissiveIntensity = BAND2.spruehen > 0.5 ? 2.4 : 0;
  KUEHL.blasLed.emissiveIntensity = BAND2.blasen > 0.5 ? 2.4 : 0;
  // Dampf aus dem Wrasenrohr, solange heiße Körbe abgeschreckt werden
  KUEHL.dampfTakt -= dt;
  if (BAND2.spruehen > 0.5 && KUEHL.dampfTakt <= 0 && koerbe.some(k => k.zustand === 'band2' && k.x > KUEHL.x0 && k.x < KUEHL.x1 && k.temp > 60)) {
    const sp = new THREE.Sprite(rauchMat.clone());
    sp.position.set((KUEHL.x0 + KUEHL.x1) / 2 + (Math.random() - 0.5) * 60, BAND_Y + 270 + 1100, B2.z - 560 + (Math.random() - 0.5) * 60);
    sp.scale.setScalar(90); anlage.add(sp); daempfe.push({ s: sp, t: 0 });
    KUEHL.dampfTakt = 0.15;
  }
  pruefstationZeichnen();
  BAND.anschlag.userData.stellen(BAND.anschlagPos);           // Schwenkhebel und Kolbenstange
  BAND.vereinzeler.userData.stellen(BAND.vereinzelerPos);

  for (const k of koerbe) {
    if (k.zustand === 'kipper') { /* Position in pruefstationZeichnen */ }
    else if (k.zustand === 'haken') { k.g.position.set(schlitten.position.x, korbUnterkante(), 0); k.g.rotation.y = 0; }
    else if (k.zustand === 'kurve') { const p = kurvenPunkt(k.s); k.g.position.set(p.x, BAND_Y, p.z); k.g.rotation.y = p.winkel; }   // Korb dreht sich mit der Kurve
    else if (k.zustand === 'band2') { k.g.position.set(k.x, BAND_Y, B2.z); k.g.rotation.y = Math.PI / 2; }
    else { k.g.position.set(0, BAND_Y, k.z); k.g.rotation.y = 0; }
    k.teilMat.color.copy(KUPFER).lerp(ZINN_FARBE, k.beschichtung);
    k.teilMat.roughness = 0.3 - 0.15 * k.beschichtung;
  }

  zinn.position.y = zinnY();
  M.zinn.map.offset.x += dt * 0.004; M.zinn.map.offset.y += dt * 0.0025;
  const heiss = Math.max(0, Math.min(1, (st.temp - 180) / 100));
  M.zinn.emissiveIntensity = 0.03 * heiss + 0.05 * heiss * (1 - ZYL.MM4.pos);
  const offen = 1 - ZYL.MM4.pos;
  // Dämpfe über dem offenen, heißen Bad
  rauchTakt -= dt;
  if (offen > 0.3 && heiss > 0.5 && rauchTakt <= 0) {
    const s = new THREE.Sprite(rauchMat.clone());
    s.position.set(BAD_X + (Math.random() - 0.5) * 200, zinnY() + 10, (Math.random() - 0.5) * 200);
    s.scale.setScalar(60);
    anlage.add(s); daempfe.push({ s, t: 0 });
    rauchTakt = 0.12;
  }
  for (const d of [...daempfe]) {
    d.t += dt;
    d.s.position.y += 60 * dt; d.s.position.z -= 40 * dt * Math.min(1, d.t);   // Absaugung zieht nach hinten
    d.s.scale.setScalar(60 + d.t * 70);
    d.s.material.opacity = Math.max(0, 0.35 * (1 - d.t / 2.2));
    if (d.t > 2.2) { anlage.remove(d.s); d.s.material.dispose(); daempfe.splice(daempfe.indexOf(d), 1); }
  }
  reglerTakt -= dt;
  if (reglerTakt <= 0) { reglerZeichnen(); reglerTakt = 0.5; }

  for (const s of SENSOREN) {
    const an = eingang(s.signal);
    s.mat.emissiveIntensity = an ? 2.4 : 0;
    s.div.classList.toggle('on', an);
  }
  for (const l of VENTIL_LEDS) l.mat.emissiveIntensity = ausgang(l.signal) ? 2.4 : 0;
  for (const l of FELD_LEDS) l.mat.emissiveIntensity = eingang(l.signal) ? 2.4 : 0;
  for (const c of ZYL_LISTE) {
    c.matA.emissiveIntensity = c.ventil > 0 ? 0.55 : 0;
    c.matB.emissiveIntensity = c.ventil < 0 ? 0.55 : 0;
  }
  for (const l of LS_STRAHLEN) l.mat.opacity = eingang(l.signal) ? 0.08 : 0.5;
  for (const m of LICHTVORHANG.leds) { m.emissive.setHex(st.eingriff ? 0xff2a1f : 0x22dd55); m.color.setHex(st.eingriff ? 0x331111 : 0x113311); }
  LICHTVORHANG.strahlen.count = st.eingriff ? 0 : 41;

  const blink = (performance.now() % 1000) < 550;
  for (const l of PULT_LAMPEN) l.mat.emissiveIntensity = ausgang(l.signal) ? 1.8 : 0;
  for (const l of QM2.leds) l.mat.emissiveIntensity = wirksam(l.signal) ? 2.4 : 0;
  for (const s of SAEULE) s.mat.emissiveIntensity = ausgang(s.signal) ? (s.signal === 'PF3_Fuellhoehe' && !blink ? 0.2 : 1.6) : 0;
  personBewegen(dt);
  for (const t of PULT_TASTER) {
    if (t.art === 'tast') t.kappe.position.z = t.z0 - (st.bedien[t.key] ? 4 : 0);
    else if (t.art === 'notHalt') t.kappe.position.z = t.z0 - (st.notHalt[t.key] ? 6 : 0);
  }
  for (const k of KNEBEL) k.knebel.rotation.z = st[k.key] ? -Math.PI / 4 : Math.PI / 4;
  for (const p of POTIS) p.knopf.rotation.z = Math.PI * (0.75 - 1.5 * st[p.key]);   // 0 % links unten, 100 % rechts unten

  if (TAKT.bild % 6 !== 0) return;                                       // Seitenleiste (DOM) nur ~10× pro Sekunde
  $('pf1').classList.toggle('on', ausgang('PF1_Automatik'));
  $('pf2').classList.toggle('on', ausgang('PF2_Temperatur'));
  $('pf3').classList.toggle('on', ausgang('PF3_Fuellhoehe'));
  $('pf4').classList.toggle('on', ausgang('PF4_Korb'));
  for (const q of QUITT) $(q.key).classList.toggle('on', ausgang(q.pf));          // Leuchttaster Quittieren je Steuerstelle
  $('pf6').classList.toggle('on', ausgang('PF6_VorOrt'));
  $('pf8').classList.toggle('on', ausgang('PF8_VorOrt2'));
  $('pf9').classList.toggle('on', ausgang('PF9_VorOrt3'));
  $('pf11').classList.toggle('on', ausgang('PF11_VorOrt4'));
  $('pf16').classList.toggle('on', ausgang('PF16_VorOrt5'));
  $('pf7').classList.toggle('on', ausgang('PF7_Handbetrieb'));
  $('bad-info').textContent = tr`Heizung −TB1: ${tr(st.heizU ? 'EIN' : 'AUS')} · Heizelement ${fmt0.format(st.heizElement * 100)} % · BT1 = ${eingang('BT1_Temperatur')} · BL1 = ${eingang('BL1_Fuellstand')}`
    + (st.kf2 ? '' : ' · ' + tr('NOT-HALT aktiv'));

  $('ro-step').textContent = st.modus === 'demo' ? String(demo.schritt) + (demo.t > 0 ? ' · ' + fmt0.format(demo.t) + ' s' : '') : tr('SPS');
  $('ro-temp').textContent = fmt0.format(st.temp) + ' °C';
  $('ro-temp').classList.toggle('warn', st.temp < TEMP_SOLL);
  $('ro-level').textContent = fmt0.format(st.fuell) + ' %';
  $('ro-level').classList.toggle('warn', st.fuell < FUELL_MIN);
  $('ro-count').textContent = st.verzinnt;
  $('g-temp').textContent = fmt0.format(st.temp) + ' °C';
  $('g-temp-bar').style.width = Math.min(100, st.temp / 300 * 100) + '%';
  $('g-level').textContent = fmt0.format(st.fuell) + ' %';
  $('g-level-bar').style.width = Math.min(100, st.fuell) + '%';

  if (!$('toast').hidden && performance.now() > toastBis) $('toast').hidden = true;
}
$('g-temp-mark').style.left = (TEMP_SOLL / 300 * 100) + '%';
$('g-level-mark').style.left = FUELL_MIN + '%';

