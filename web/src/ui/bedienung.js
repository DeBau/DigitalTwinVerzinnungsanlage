import * as THREE from 'three';
import { ZYL, st } from '../logik/zustand.js';
import { $, anlage, camera, controls, renderer } from '../core/szene.js';
import { fmt0 } from '../core/format.js';
import { PULT_TASTER } from '../anlage/register.js';
import { personStarten } from '../anlage/werker.js';
import { BAND, BAND2 } from '../anlage/baender.js';
import { MM8, MULDE, ST } from '../anlage/pruefstation.js';
import { daempfe, koerbe, korbEntfernen, korbErzeugen, korbNrZuruecksetzen, tropfen } from '../anlage/koerbe.js';
import { ereignis, zuletzt } from './ereignisse.js';
import { demo } from '../logik/demo-sps.js';
import { korbAuflegen, prozessZuruecksetzen } from '../logik/prozess.js';
import { rollenkurveZuruecksetzen } from '../logik/rollenkurve.js';
import { verlauf, wzZeichnen } from './diagramm.js';
import { monitorAufbauen } from './signalmonitor.js';
import { modusSetzen } from './status.js';
import { eingaengeSenden } from './bridge.js';

const raycaster = new THREE.Raycaster();
let pultGedrueckt = null;
renderer.domElement.addEventListener('pointerdown', (e) => {
  const r = renderer.domElement.getBoundingClientRect();
  raycaster.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
  const hit = raycaster.intersectObjects(PULT_TASTER.map(t => t.kappe), false)[0];
  if (!hit) return;
  const { taster: key, art } = hit.object.userData;
  if (art === 'lichtvorhang') { personStarten(); return; }
  if (art === 'notHalt') { st.notHalt[key] = !st.notHalt[key]; bedienSync(); return; }
  if (art === 'wahl') { st[key] = !st[key]; bedienSync(); return; }
  pultGedrueckt = key;
  st.bedien[key] = true;
  $(key).classList.add('down');
  controls.enabled = false;
  eingaengeSenden(false);            // nicht bis zum naechsten Bild warten
});
window.addEventListener('pointerup', () => {
  if (!pultGedrueckt) return;
  st.bedien[pultGedrueckt] = false;
  $(pultGedrueckt).classList.remove('down');
  pultGedrueckt = null;
  controls.enabled = true;
  eingaengeSenden(false);
});
// ----------------------------------------------------------------------------
// Bedienung (Seitenleiste)
// ----------------------------------------------------------------------------
function taster(el, key) {
  const down = (e) => { e.preventDefault(); el.classList.add('down'); st.bedien[key] = true; eingaengeSenden(false); };
  const up = () => { el.classList.remove('down'); st.bedien[key] = false; eingaengeSenden(false); };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointerleave', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') down(e); });
  el.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') up(); });
}
for (const k of ['sf1', 'sf2', 'sf4', 'sf41', 'sf42', 'sf43', 'sf44', 'sf5', 'sf6', 'sf7', 'sf23', 'sf24', 'sf25', 'sf30', 'sf31', 'sf32', 'sf34', 'sf35', 'sf36', 'sf37', 'sf38', 'sf39', 'sf28', 'sf29', 'sf19', 'sf20', 'sf21', 'sf22', 'sf11', 'sf12', 'sf13', 'sf14', 'sf15', 'sf16', 'sf17', 'sf18']) taster($(k), k);
$('sa3').onclick = () => { st.sa3 = !st.sa3; bedienSync(); };
$('btn-lv').onclick = () => personStarten();
// Not-Halt-Taster rasten ein (Klick = drücken, nochmal Klick = entriegeln), Wahl- und Schlüsselschalter rasten
function notHaltSchalten(k) { st.notHalt[k] = !st.notHalt[k]; bedienSync(); }
$('sf0').onclick = () => notHaltSchalten('sf0');
$('sf8').onclick = () => notHaltSchalten('sf8');
$('sf9').onclick = () => notHaltSchalten('sf9');
$('sf10').onclick = () => notHaltSchalten('sf10');
$('sf33').onclick = () => notHaltSchalten('sf33');
$('sa6').onclick = () => { st.sa6 = !st.sa6; bedienSync(); };
$('sa5').onclick = () => { st.sa5 = !st.sa5; bedienSync(); };
$('sa4').onclick = () => { st.sa4 = !st.sa4; bedienSync(); };
$('sa1').onclick = () => { st.sa1 = !st.sa1; bedienSync(); };
$('sa2').onclick = () => { st.sa2 = !st.sa2; bedienSync(); };
function betriebSetzen(was, wert) {
  if (was === 'band') st.betriebBand = wert; else st.betriebBad = wert;
  ereignis(was === 'band'
    ? (wert === 'sps' ? 'Übungsumfang: Band, Anschlag und Vereinzeler steuert jetzt die SPS' : 'Übungsumfang: Bandmodul läuft wieder automatisch')
    : (wert === 'sps' ? 'Übungsumfang: Zinnbad-Temperatur und Nachfüllen regelt jetzt die SPS' : 'Übungsumfang: Zinnbad wird wieder vom Regler am Bad geregelt'));
  bedienSync();
}
$('bm-auto').onclick = () => betriebSetzen('band', 'auto');
$('bm-sps').onclick = () => betriebSetzen('band', 'sps');
$('zb-auto').onclick = () => betriebSetzen('bad', 'auto');
$('zb-sps').onclick = () => betriebSetzen('bad', 'sps');
function bedienSync() {
  $('sf0').setAttribute('aria-pressed', st.notHalt.sf0);

  $('sf8').setAttribute('aria-pressed', st.notHalt.sf8);
  $('sa1').setAttribute('aria-pressed', st.sa1);
  $('sa2').setAttribute('aria-pressed', st.sa2);
  $('sa4').setAttribute('aria-pressed', st.sa4);
  $('sf9').setAttribute('aria-pressed', st.notHalt.sf9);
  $('sa5').setAttribute('aria-pressed', st.sa5);
  $('sf10').setAttribute('aria-pressed', st.notHalt.sf10);
  $('sa6').setAttribute('aria-pressed', st.sa6);
  $('sf33').setAttribute('aria-pressed', st.notHalt.sf33);
  $('sa3').setAttribute('aria-pressed', st.sa3);
  $('bm-auto').setAttribute('aria-pressed', st.betriebBand === 'auto');
  $('bm-sps').setAttribute('aria-pressed', st.betriebBand === 'sps');
  $('zb-auto').setAttribute('aria-pressed', st.betriebBad === 'auto');
  $('zb-sps').setAttribute('aria-pressed', st.betriebBad === 'sps');
  $('btn-heizung').disabled = st.betriebBad === 'sps';
  $('btn-fuellen').disabled = st.betriebBad === 'sps';
  $('betrieb-hint').textContent = [
    st.betriebBand === 'sps' ? 'Band: −QA1/−QA2 (Rechts/Links), −MB9 Anschlag, −MB10 Vereinzeler, Rollenkurve −QA10/−QA11, Band 2, Muldenrollen −QA12/−QA13 und Prüfstation aus deinem Programm; −BG11…−BG13, −BG35/−BG36, −BG21…−BG24, −BG37/−BG33 (Einlauf/Endanschlag Kippmulde) und die Vor-Ort-Steuerstellen sind Eingänge.' : 'Band: Das Bandmodul fördert, stoppt, vereinzelt und übergibt über die Rollenkurve selbstständig.',
    st.betriebBad === 'sps' ? 'Zinnbad: −TB1 Heizung (2-Punkt, Impuls/PWM oder PID) und −MB11 Nachfüllen aus deinem Programm, Istwerte −BT1/−BL1 analog.' : 'Zinnbad: Der Regler am Bad hält 280 °C, nachfüllen per Knopf.',
  ].join(' ');
  eingaengeSenden(false);
}
bedienSync();
$('sf2-nc').addEventListener('change', (e) => { st.sf2Oeffner = e.target.checked; });
$('btn-heizung').onclick = (e) => {
  st.heizung = !st.heizung;
  e.currentTarget.setAttribute('aria-pressed', st.heizung);
  e.currentTarget.textContent = st.heizung ? 'Heizung ein' : 'Heizung aus';
};
$('btn-fuellen').onclick = () => { st.fuell = 85; ereignis('Zinn nachgefüllt (85 %)'); };
$('btn-korb').onclick = () => korbAuflegen(true);
$('btn-zufuhr').onclick = (e) => {
  st.zufuhr = !st.zufuhr;
  e.currentTarget.setAttribute('aria-pressed', st.zufuhr);
};
$('p-speed').addEventListener('input', (e) => {
  st.speed = parseFloat(e.target.value);
  $('o-speed').textContent = fmt0.format(st.speed * 100) + ' %';
});

$('mode-sps').onclick = () => modusSetzen('sps', true);
$('btn-reset').onclick = () => anlageZuruecksetzen();

// Anlage zurücksetzen: Grundstellung, frisches Zinnbad, ein Korb auf dem Band, Automatik aus.
// Gilt in beiden Betriebsarten. Mit PLCSIM Advanced bleibt das CPU-Programm wie es ist:
// zurückgesetzt wird das Modell, die Ausgänge der CPU greifen danach sofort wieder.
function anlageZuruecksetzen() {
  Object.assign(demo, { schritt: 1, auto: false, t: 0, korbFertig: false, sf1Alt: false, warten: false });
  st.demoAusgaenge = {};
  const grund = { MM1: 1, MM2: 1, MM3: 0, MM4: 1 };
  for (const [n, c] of Object.entries(ZYL)) {
    c.x = grund[n] * c.hub; c.v = 0; c.verz = 0; c.ventil = grund[n] ? 1 : -1;
    c.an0 = c.x <= 0; c.an1 = c.x >= c.hub;
  }
  prozessZuruecksetzen();
  for (const k of [...koerbe]) korbEntfernen(k);
  for (const t of tropfen.splice(0)) anlage.remove(t.m);
  for (const d of daempfe.splice(0)) { anlage.remove(d.s); d.s.material.dispose(); }
  korbNrZuruecksetzen();
  korbErzeugen(-150);
  Object.assign(st, { temp: 266, heizung: true, fuell: 62, verzinnt: 0 });
  for (const k in st.bedien) st.bedien[k] = false;
  Object.assign(st, { notHalt: { sf0: false, sf8: false, sf9: false, sf10: false, sf33: false }, kf2: true, eingriff: false, sa1: true, sa2: false, sa3: false, sa4: false, sa5: false, sa6: false, heizElement: 0.76 });
  Object.assign(BAND2, { v: 0, wende: 0, pruefT: 0, ergebnisT: 0, pumpe: 0, spruehen: 0, blasen: 0 });
  Object.assign(ST, { teile: [], trichter: [], klt: 0, aus: 0, kltTausch: 0, kipBefehl: false, pruefT: 0, ergebnisT: 0, vorOrt: { pruef: false, kip: false } });
  Object.assign(MULDE, { v: 0, wende: 0 });
  Object.assign(demo.ps, { kip: false, kt: 0, gekippt: false, nachlauf: 0, ausblasZeiten: [], mulde: 0, voPruef: false, voKip: false }); ST.korbSumme.clear(); MM8.x = 0; MM8.v = 0; MM8.ventil = -1; MM8.an0 = true; MM8.an1 = false; rollenkurveZuruecksetzen();
  Object.assign(demo.kurve, { rechts: false, links: false, nachlauf: 0 });
  Object.assign(demo.band, { rechts: false, links: false, nachlauf: 0, abgabe: 0, anschlagAuf: false, bg11Zeit: 0, bg11Aus: 0, uebNach: 0 });
  demo.b2.mulde = false;
  Object.assign(BAND, { v: 0, wende: 0, anschlagPos: 1, vereinzelerPos: 0 });
  bedienSync();
  $('btn-heizung').setAttribute('aria-pressed', true);
  $('btn-heizung').textContent = 'Heizung ein';
  st.force = {};
  monitorAufbauen();
  verlauf.length = 0;
  wzZeichnen();
  $('events').innerHTML = '<li class="empty">Noch keine Ereignisse.</li>';
  zuletzt.clear();
  $('toast').hidden = true;
  eingaengeSenden(true);                       // Grundstellung sofort an die CPU
  ereignis(st.modus === 'sps'
    ? 'Anlage in Grundstellung zurückgesetzt · das CPU-Programm läuft weiter, Ausgänge greifen sofort wieder'
    : 'Anlage in Grundstellung zurückgesetzt · SF1 startet die Automatik');
}
$('mode-demo').onclick = () => modusSetzen('demo', true);

