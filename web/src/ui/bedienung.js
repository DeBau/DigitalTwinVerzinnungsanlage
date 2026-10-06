import * as THREE from 'three';
import { KW, ZYL, st } from '../logik/zustand.js';
import { $, anlage, camera, controls, renderer } from '../core/szene.js';
import { fmt0 } from '../core/format.js';
import { PULT_TASTER } from '../anlage/register.js';
import { personEntfernen, personStarten } from '../anlage/werker.js';
import { BAND, BAND2 } from '../anlage/baender.js';
import { MM8, MULDE, ST } from '../anlage/pruefstation.js';
import { daempfe, koerbe, korbEntfernen, korbErzeugen, korbNrZuruecksetzen, tropfen } from '../anlage/koerbe.js';
import { ereignis, zuletzt } from './ereignisse.js';
import { demo } from '../logik/demo-sps.js';
import { korbAuflegen, prozessZuruecksetzen } from '../logik/prozess.js';
import { UMRICHTER, UMRICHTER_LISTE, umrichterZuruecksetzen } from '../logik/umrichter.js';
import { rollenkurveZuruecksetzen } from '../logik/rollenkurve.js';
import { wzFensterOeffnen, wzZuruecksetzen } from './diagramm.js';
import { fuFensterOeffnen } from './umrichter.js';
import { monitorAufbauen } from './signalmonitor.js';
import { modusSetzen } from './status.js';
import { eingaengeSenden } from './bridge.js';
import { t } from '../core/sprache.js';

const raycaster = new THREE.Raycaster();
let pultGedrueckt = null;
function treffer(e) {
  const r = renderer.domElement.getBoundingClientRect();
  raycaster.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
  return raycaster.intersectObjects(PULT_TASTER.map(t => t.kappe), false)[0];
}
// Potentiometer wie ein Drehknopf: ziehen (nach oben/rechts = mehr, 160 px = 0…100 %), Mausrad 5 % je Raste.
// Neben dem Mauszeiger steht dabei der Wert.
let potiZug = null, tippAus = 0;
const tipp = document.createElement('div');
tipp.className = 'poti-tipp'; tipp.hidden = true; document.body.append(tipp);
function potiSetzen(key, wert, e) {
  st[key] = Math.max(0, Math.min(1, wert));
  tipp.textContent = t`Drehzahl ${fmt0.format(st[key] * 100)} %`;
  tipp.style.left = e.clientX + 16 + 'px'; tipp.style.top = e.clientY - 10 + 'px';
  tipp.hidden = false;
  bedienSync();
}
renderer.domElement.addEventListener('wheel', (e) => {
  const hit = treffer(e);
  if (!hit || hit.object.userData.art !== 'poti') return;
  e.preventDefault(); e.stopImmediatePropagation();                    // nicht zoomen
  const key = hit.object.userData.taster;
  potiSetzen(key, Math.round((st[key] + (e.deltaY < 0 ? 0.05 : -0.05)) * 20) / 20, e);
  clearTimeout(tippAus); tippAus = setTimeout(() => { if (!potiZug) tipp.hidden = true; }, 1200);
}, { capture: true, passive: false });
window.addEventListener('pointermove', (e) => {
  if (potiZug) potiSetzen(potiZug.key, potiZug.v0 + ((e.clientX - potiZug.x) - (e.clientY - potiZug.y)) / 160, e);
});
renderer.domElement.addEventListener('pointerdown', (e) => {
  const hit = treffer(e);
  if (!hit) return;
  const { taster: key, art } = hit.object.userData;
  if (art === 'lichtvorhang') { personStarten(); return; }
  if (art === 'drossel') { wzFensterOeffnen(key); return; }          // Drosselrückschlagventil: Einstellung im Weg-Zeit-Fenster
  if (art === 'umrichter') { fuFensterOeffnen(key); return; }        // Umrichter −TA2…−TA5 im Schaltschrank
  if (art === 'ablass') { $('btn-ablass').click(); return; }         // Ablasshahn am Kühlwassertank
  if (art === 'notHalt') { st.notHalt[key] = !st.notHalt[key]; bedienSync(); return; }
  if (art === 'wahl') { st[key] = !st[key]; bedienSync(); return; }
  if (art === 'poti') {
    potiZug = { key, x: e.clientX, y: e.clientY, v0: st[key] };
    controls.enabled = false;
    potiSetzen(key, st[key], e);
    return;
  }
  pultGedrueckt = key;
  st.bedien[key] = true;
  $(key).classList.add('down');
  controls.enabled = false;
  eingaengeSenden(false);            // nicht bis zum naechsten Bild warten
});
window.addEventListener('pointerup', () => {
  if (!potiZug) return;
  potiZug = null; controls.enabled = true;
  clearTimeout(tippAus); tippAus = setTimeout(() => { tipp.hidden = true; }, 600);
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
for (const k of ['sf1', 'sf2', 'sf4', 'sf41', 'sf42', 'sf43', 'sf44', 'sf5', 'sf6', 'sf7', 'sf23', 'sf24', 'sf25', 'sf30', 'sf31', 'sf32', 'sf34', 'sf35', 'sf36', 'sf37', 'sf38', 'sf39', 'sf45', 'sf46', 'sf28', 'sf29', 'sf19', 'sf20', 'sf21', 'sf22', 'sf11', 'sf12', 'sf13', 'sf14', 'sf15', 'sf16', 'sf17', 'sf18']) taster($(k), k);
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
$('sa7').onclick = () => { st.sa7 = !st.sa7; bedienSync(); };
$('sf47').addEventListener('input', (e) => { st.pbPoti = Number(e.target.value) / 100; bedienSync(); });
$('sa5').onclick = () => { st.sa5 = !st.sa5; bedienSync(); };
$('sa4').onclick = () => { st.sa4 = !st.sa4; bedienSync(); };
$('sa1').onclick = () => { st.sa1 = !st.sa1; bedienSync(); };
$('sa2').onclick = () => { st.sa2 = !st.sa2; bedienSync(); };
function betriebSetzen(was, wert) {
  if (was === 'band') st.betriebBand = wert; else if (was === 'wasser') st.betriebWasser = wert; else st.betriebBad = wert;
  ereignis(was === 'band'
    ? (wert === 'sps' ? 'Übungsumfang: Band, Anschlag und Vereinzeler steuert jetzt die SPS' : 'Übungsumfang: Bandmodul läuft wieder automatisch')
    : was === 'wasser'
      ? (wert === 'sps' ? 'Übungsumfang: Nachspeisung des Kühlwassertanks (−MB17/−MB18) regelt jetzt die SPS' : 'Übungsumfang: Kühlwassertank wird wieder vom Niveauregler nachgespeist')
      : (wert === 'sps' ? 'Übungsumfang: Zinnbad-Temperatur und Nachfüllen regelt jetzt die SPS' : 'Übungsumfang: Zinnbad wird wieder vom Regler am Bad geregelt'));
  bedienSync();
}
$('bm-auto').onclick = () => betriebSetzen('band', 'auto');
$('bm-sps').onclick = () => betriebSetzen('band', 'sps');
// Antriebe: je Förderer Schütz oder Umrichter (−TA2 Band 1, −TA3 Band 2, −TA4 Rollenkurve, −TA5 Prüfband)
const antriebKnoepfe = [...document.querySelectorAll('[data-antrieb]')];
for (const b of antriebKnoepfe) b.onclick = () => antriebSetzen(b.dataset.antrieb, b.dataset.art);
function antriebSetzen(name, art) {
  if (st.antrieb[name] === art) return;
  st.antrieb[name] = art;
  const fu = UMRICHTER[name], wo = `${t(fu.foerderer)} ${fu.motor}`;
  ereignis(art === 'fu' ? t`${wo} jetzt am Umrichter −${name} (PROFINET, Standardtelegramm 1)` : t`${wo} jetzt an den Schützen ${fu.schuetz}`);
  bedienSync();
}
$('zb-auto').onclick = () => betriebSetzen('bad', 'auto');
$('zb-sps').onclick = () => betriebSetzen('bad', 'sps');
$('kw-auto').onclick = () => betriebSetzen('wasser', 'auto');
$('kw-sps').onclick = () => betriebSetzen('wasser', 'sps');
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
  $('sa7').setAttribute('aria-pressed', st.sa7);
  $('sf47').value = Math.round(st.pbPoti * 100);
  $('o-sf47').textContent = fmt0.format(st.pbPoti * 100) + ' %';
  $('sf33').setAttribute('aria-pressed', st.notHalt.sf33);
  $('sa3').setAttribute('aria-pressed', st.sa3);
  $('bm-auto').setAttribute('aria-pressed', st.betriebBand === 'auto');
  $('bm-sps').setAttribute('aria-pressed', st.betriebBand === 'sps');
  $('zb-auto').setAttribute('aria-pressed', st.betriebBad === 'auto');
  $('zb-sps').setAttribute('aria-pressed', st.betriebBad === 'sps');
  $('kw-auto').setAttribute('aria-pressed', st.betriebWasser === 'auto');
  $('kw-sps').setAttribute('aria-pressed', st.betriebWasser === 'sps');
  $('btn-ablass').setAttribute('aria-pressed', st.ablass);
  $('btn-ablass').textContent = t(st.ablass ? 'Ablasshahn schließen' : 'Ablasshahn öffnen');
  for (const b of antriebKnoepfe) b.setAttribute('aria-pressed', st.antrieb[b.dataset.antrieb] === b.dataset.art);
  $('btn-heizung').disabled = st.betriebBad === 'sps';
  $('btn-fuellen').disabled = st.betriebBad === 'sps';
  $('betrieb-hint').textContent = [
    st.betriebBand === 'sps' ? 'Band: −QA1/−QA2 (Rechts/Links), −MB9 Anschlag, −MB10 Vereinzeler, Rollenkurve −QA10/−QA11, Band 2, Muldenrollen −QA12/−QA13 und Prüfstation aus deinem Programm; −BG11…−BG13, −BG40 (Korb liegt am Anschlag an), −BG35/−BG36, −BG21…−BG24, −BG37/−BG33 (Einlauf/Endanschlag Kippmulde) und die Vor-Ort-Steuerstellen sind Eingänge.' : 'Band: Das Bandmodul fördert, stoppt, vereinzelt und übergibt über die Rollenkurve selbstständig.',
    UMRICHTER_LISTE.some(fu => st.antrieb[fu.name] === 'fu') ? t`Am Umrichter: ${UMRICHTER_LISTE.filter(fu => st.antrieb[fu.name] === 'fu').map(fu => '−' + fu.name).join(', ')}. ${t(st.betriebBand === 'sps' ? 'Dein Programm führt sie über Standardtelegramm 1 (STW1/NSOLL_A → ZSW1/NIST_A), z. B. mit TO_SpeedAxis; die zugehörigen Schütze sind ohne Wirkung.' : 'Das Bandmodul führt sie selbst. Mit „SPS steuert“ übernimmt dein Programm die Telegramme.')}` : '',
    st.betriebBad === 'sps' ? 'Zinnbad: −TB1 Heizung (2-Punkt, Impuls/PWM oder PID) und −MB11 Nachfüllen aus deinem Programm, Istwerte −BT1/−BL1 analog.' : 'Zinnbad: Der Regler am Bad hält 280 °C, nachfüllen per Knopf.',
    st.betriebWasser === 'sps' ? 'Kühlwasser: −MB17 Magnetventil und −MB18 Regelventil (%QW80, 0…27648) aus deinem Programm – Zweipunkt mit den Grenzschaltern −BG38/−BG39, mit Hysterese auf den Radar −BL2 (%IW72) oder stetig mit PID_Compact. Den Trockenlaufschutz der Pumpe −MA3 übernimmt dein Programm.' : 'Kühlwasser: Der Niveauregler am Tank speist zwischen 55 und 75 % nach und sperrt die Pumpe unter −BG38.',
  ].filter(Boolean).map(x => t(x)).join(' ');
  eingaengeSenden(false);
}
bedienSync();
$('sf2-nc').addEventListener('change', (e) => { st.sf2Oeffner = e.target.checked; });
$('btn-heizung').onclick = (e) => {
  st.heizung = !st.heizung;
  e.currentTarget.setAttribute('aria-pressed', st.heizung);
  e.currentTarget.textContent = t(st.heizung ? 'Heizung ein' : 'Heizung aus');
};
$('btn-fuellen').onclick = () => { st.fuell = 85; ereignis('Zinn nachgefüllt (85 %)'); };
$('btn-korb').onclick = () => korbAuflegen(true);
$('btn-ablass').onclick = () => {
  st.ablass = !st.ablass;
  ereignis(st.ablass ? 'Ablasshahn am Kühlwassertank geöffnet (Störgröße)' : 'Ablasshahn am Kühlwassertank geschlossen');
  bedienSync();
};
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
  Object.assign(demo, { schritt: 1, auto: false, t: 0, korbFertig: false, mitKorb: false, sf1Alt: false, warten: false });
  personEntfernen();
  st.demoAusgaenge = {};
  const grund = { MM1: 1, MM2: 1, MM3: 0, MM4: 1 };
  for (const [n, c] of Object.entries(ZYL)) {
    c.x = grund[n] * c.hub; c.v = 0; c.verz = 0; c.ventil = grund[n] ? 1 : -1;
    c.an0 = c.x <= 0; c.an1 = c.x >= c.hub;
  }
  prozessZuruecksetzen();
  umrichterZuruecksetzen();
  for (const k of [...koerbe]) korbEntfernen(k);
  for (const t of tropfen.splice(0)) anlage.remove(t.m);
  for (const d of daempfe.splice(0)) { anlage.remove(d.s); d.s.material.dispose(); }
  korbNrZuruecksetzen();
  korbErzeugen(-160);
  Object.assign(st, { temp: 266, heizung: true, fuell: 62, verzinnt: 0, wasser: 70, ablass: false });
  Object.assign(KW, { y: 0, mb17: false, zulauf: 0, verbrauch: 0, ablauf: 0, regelEin: false, sperre: false, sperreGemeldet: false, trocken: false, ohneFluss: 0 });
  demo.kw.i = 0;
  for (const k in st.bedien) st.bedien[k] = false;
  Object.assign(st, { notHalt: { sf0: false, sf8: false, sf9: false, sf10: false, sf33: false }, kf2: true, eingriff: false, sa1: true, sa2: false, sa3: false, sa4: false, sa5: false, sa6: false, sa7: false, pbPoti: 1, heizElement: 0.76 });
  Object.assign(BAND2, { v: 0, wende: 0, pruefT: 0, ergebnisT: 0, pumpe: 0, spruehen: 0, blasen: 0 });
  Object.assign(ST, { teile: [], trichter: [], klt: 0, aus: 0, kltTausch: 0, kipBefehl: false, pruefT: 0, ergebnisT: 0, vorOrt: { pruef: false, kip: false, pb: false } });
  Object.assign(MULDE, { v: 0, wende: 0 });
  Object.assign(demo.ps, { kip: false, kt: 0, gekippt: false, nachlauf: 0, ausblasZeiten: [], mulde: 0, voPruef: false, voKip: false, voPb: false }); ST.korbSumme.clear(); MM8.x = 0; MM8.v = 0; MM8.ventil = -1; MM8.an0 = true; MM8.an1 = false; rollenkurveZuruecksetzen();
  Object.assign(demo.kurve, { rechts: false, links: false, nachlauf: 0 });
  Object.assign(demo.band, { rechts: false, links: false, nachlauf: 0, abgabe: 0, anschlagAuf: false, bg11Aus: 0, uebNach: 0, steht: 0 });
  demo.b2.mulde = false;
  Object.assign(BAND, { v: 0, wende: 0, anschlagPos: 1, vereinzelerPos: 0, anschlagDefekt: false, bg40: false });
  bedienSync();
  $('btn-heizung').setAttribute('aria-pressed', true);
  $('btn-heizung').textContent = t('Heizung ein');
  st.force = {};
  monitorAufbauen();
  wzZuruecksetzen();
  $('events').innerHTML = '';
  $('events').append(Object.assign(document.createElement('li'), { className: 'empty', textContent: t('Noch keine Ereignisse.') }));
  zuletzt.clear();
  $('toast').hidden = true;
  eingaengeSenden(true);                       // Grundstellung sofort an die CPU
  ereignis(st.modus === 'sps'
    ? 'Anlage in Grundstellung zurückgesetzt · das CPU-Programm läuft weiter, Ausgänge greifen sofort wieder'
    : 'Anlage in Grundstellung zurückgesetzt · SF1 startet die Automatik');
}
$('mode-demo').onclick = () => modusSetzen('demo', true);

