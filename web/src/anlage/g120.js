import * as THREE from 'three';
import { st } from '../logik/zustand.js';
import { canvasTextur } from '../core/texturen.js';
import { M } from '../core/materialien.js';
import { box } from '../core/geometrie.js';
import { platte, tafel } from '../core/beschriftung.js';
import { sensorLed } from '../core/leds.js';
import { LOCALE, t } from '../core/sprache.js';
import { KLICK, PULT_TASTER } from './register.js';
import { FU, FU_BEZUG, ZUSTAND_TEXT, zsw1 } from '../logik/umrichter.js';
import { feldbusAktiv } from '../logik/antriebe.js';
import { ereignis } from '../ui/ereignisse.js';

// ----------------------------------------------------------------------------
// SINAMICS G120 (−TA2 … −TA5): Leistungsteil PM240-2 FSA (73 × 196 × 165), Control Unit CU240E-2 PN
// (73 × 199 × 46) und Bedienpanel IOP-2 (70 × 106 × 19,6). Display, LEDs und Panel-Tasten gibt es
// einmal je Umrichter – das 3D-Gerät im Schaltschrank und das Fenster „Umrichter“ zeigen dasselbe.
// ----------------------------------------------------------------------------
export const N_BEZUG = 1500;                          // p2000 Bezugsdrehzahl 1/min
const SEITEN = 3;                                     // Status, Werte, Telegramm (Diagnose über INFO)

const nf0 = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const hex = (w) => '16#' + (w & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
const puls = (fu) => ['S4', 'AUS1', 'AUS3'].includes(fu.zustand);
// Modellwerte für die Anzeige: Strom aus Leerlauf- und Lastanteil, Ausgangsspannung nach U/f-Kennlinie
export const anzeigeWerte = (fu) => ({
  n: fu.n * N_BEZUG, f: fu.n * 50, i: puls(fu) ? 0.55 + 0.35 * Math.abs(fu.n) : 0,
  u: puls(fu) ? Math.min(400, 20 + 380 * Math.abs(fu.n)) : 0, v: fu.n * fu.vBezug,
});

// LEDs der CU240E-2 PN: RDY grün = bereit / rot = Störung, BF aus = zyklischer Datenaustausch / rot blinkend =
// kein Datenaustausch (keine Verbindung oder CPU in STOP), SAFE gelb = STO projektiert / gelb blinkend = STO angewählt
export function g120Leds(fu) {
  const pnOk = st.betriebBand === 'auto' || feldbusAktiv();
  return {
    rdy: fu.stoerung ? 'rot' : 'gruen',
    bf: pnOk ? '' : 'rot blinkt',
    safe: fu.sto ? 'gelb blinkt' : 'gelb',
    lnk: st.modus === 'demo' || st.plcVerbunden || st.betriebBand === 'auto' ? 'gruen' : '',
  };
}

// --- Bedienpanel IOP-2: Tasten ---------------------------------------------------------------
function melden(fu, text) { fu.iop.meldung = text; fu.iop.meldungT = 2.5; }
export function iopTaste(fu, taste) {
  switch (taste) {
    case 'handAuto':
      fu.hand = !fu.hand;
      if (fu.hand) { fu.handSoll = fu.n; fu.handEin = fu.zustand === 'S4'; }   // stoßfrei übernehmen
      ereignis(fu.hand ? t`Umrichter −${fu.name}: HAND – das Bedienpanel führt, das Telegramm der SPS ist ohne Wirkung` : t`Umrichter −${fu.name}: AUTO – Führung wieder über PROFINET`);
      break;
    case 'ein':
      if (fu.hand) fu.handEin = true; else melden(fu, t('EIN nur in HAND'));
      break;
    case 'aus':
      if (fu.hand) fu.handEin = false; else melden(fu, t('AUS nur in HAND'));
      break;
    case 'info': fu.iop.seite = 'diag'; break;
    case 'esc': fu.iop.seite = 0; break;
    case 'ok':
      if (fu.iop.seite === 'diag') {
        if (fu.stoerung) { fu.panelQuitt = true; melden(fu, t('Quittieren …')); } else fu.iop.seite = 0;
      }
      break;
  }
}
// Drehrad: in HAND der Sollwert (30 1/min je Raste), sonst Blättern durch die Statusseiten
export function iopDrehen(fu, schritte) {
  if (fu.hand && fu.iop.seite !== 'diag') {
    fu.handSoll = Math.max(fu.negSperre ? 0 : -FU.nMax, Math.min(FU.nMax, Math.round((fu.handSoll * N_BEZUG + schritte * 30) / 30) * 30 / N_BEZUG));
  } else if (fu.iop.seite !== 'diag') fu.iop.seite = ((fu.iop.seite + schritte) % SEITEN + SEITEN) % SEITEN;
}

// --- Display (320 × 240, wie das 2,8"-Farbdisplay) --------------------------------------------
const PETROL = '#009999';
export function iopZeichnen(c, fu) {
  const W = 320, H = 240, w = anzeigeWerte(fu);
  c.save();
  c.setTransform(c.canvas.width / W, 0, 0, c.canvas.height / H, 0, 0);
  c.fillStyle = '#0d1114'; c.fillRect(0, 0, W, H);
  // Kopfzeile: Betriebsart, Führung, Störung/Warnung
  c.fillStyle = '#20282e'; c.fillRect(0, 0, W, 30);
  c.font = '700 15px Arial'; c.textBaseline = 'middle'; c.textAlign = 'left';
  c.fillStyle = fu.hand ? '#ffb000' : PETROL; c.fillText(fu.hand ? 'HAND' : 'AUTO', 10, 15);
  c.fillStyle = '#c9d3da'; c.font = '600 13px Arial'; c.fillText(fu.hand ? 'IOP-2' : 'PROFINET', 64, 15);
  if (fu.stoerung) { c.fillStyle = '#ff4d4d'; c.beginPath(); c.arc(W - 20, 15, 9, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = '700 13px Arial'; c.textAlign = 'center'; c.fillText('!', W - 20, 16); }
  else if (fu.sto || fu.warnung) { c.fillStyle = '#ffd000'; c.beginPath(); c.moveTo(W - 20, 6); c.lineTo(W - 10, 24); c.lineTo(W - 30, 24); c.fill(); }
  c.textAlign = 'left';
  const zeile = (text, y, farbe = '#e8eef2', font = '500 15px Arial', x = 12, ausr = 'left') => { c.fillStyle = farbe; c.font = font; c.textAlign = ausr; c.fillText(text, x, y); };
  if (fu.iop.seite === 'diag') {
    zeile(t('Störungen und Warnungen'), 48, PETROL, '700 16px Arial');
    if (fu.stoerung) {
      zeile(t('Störung'), 78, '#ff6b6b', '700 15px Arial');
      zeile(fu.stoerung.nr, 104, '#fff', '700 22px Arial');
      zeile(t(fu.stoerung.text), 130, '#e8eef2', '500 15px Arial');
      zeile(t('OK = Quittieren'), 214, '#9fb0bb', '500 13px Arial');
    } else if (fu.warnung) {
      zeile(t('Warnung'), 78, '#ffd000', '700 15px Arial');
      zeile(fu.warnung.nr, 104, '#fff', '700 22px Arial');
      zeile(t(fu.warnung.text), 130, '#e8eef2', '500 15px Arial');
    } else if (fu.sto) {
      zeile(t('Warnung'), 78, '#ffd000', '700 15px Arial');
      zeile('STO', 104, '#fff', '700 22px Arial');
      zeile(t('Safe Torque Off angewählt (−KF2)'), 130);
    } else zeile(t('Keine Störungen oder Warnungen'), 90);
    zeile(t('ESC = zurück'), 232, '#9fb0bb', '500 13px Arial');
  } else if (fu.iop.seite === 0) {
    zeile(t('Drehzahl'), 50, '#9fb0bb', '500 14px Arial');
    zeile(nf0.format(w.n), 108, '#ffffff', '600 52px Arial', W - 62, 'right');
    zeile('1/min', 104, '#9fb0bb', '500 15px Arial', W - 12, 'right');
    // Balken Ist (petrol) und Soll (Strich), Bereich ±p1082
    const bx = 12, by = 128, bw = W - 24, mitte = bx + bw / 2, s = bw / 2 / FU.nMax;
    c.fillStyle = '#2a343b'; c.fillRect(bx, by, bw, 12);
    c.fillStyle = PETROL; c.fillRect(Math.min(mitte, mitte + fu.n * s), by, Math.abs(fu.n * s), 12);
    c.fillStyle = '#ffb000'; c.fillRect(mitte + fu.ziel * s - 1.5, by - 4, 3, 20);
    c.fillStyle = '#56636c'; c.fillRect(mitte - 0.5, by - 2, 1, 16);
    zeile(t('Sollwert'), 166, '#9fb0bb', '500 14px Arial');
    zeile(nf0.format((fu.hand ? fu.handSoll : fu.nsoll / FU_BEZUG) * N_BEZUG) + ' 1/min', 166, '#e8eef2', '600 15px Arial', W - 12, 'right');
    zeile(t('Strom'), 190, '#9fb0bb', '500 14px Arial');
    zeile(nf2.format(w.i) + ' A', 190, '#e8eef2', '600 15px Arial', W - 12, 'right');
  } else if (fu.iop.seite === 1) {
    zeile(t('Istwerte'), 48, PETROL, '700 16px Arial');
    [['Drehzahl', nf0.format(w.n) + ' 1/min'], ['Ausgangsfrequenz', nf1.format(w.f) + ' Hz'], ['Ausgangsspannung', nf0.format(w.u) + ' V'],
      ['Ausgangsstrom', nf2.format(w.i) + ' A'], ['Bandgeschwindigkeit', nf0.format(w.v) + ' mm/s']].forEach(([a, b], i) => {
      zeile(t(a), 80 + i * 28, '#9fb0bb', '500 14px Arial'); zeile(b, 80 + i * 28, '#e8eef2', '600 15px Arial', W - 12, 'right');
    });
  } else {
    zeile(t('Telegramm 1'), 48, PETROL, '700 16px Arial');
    [['STW1', hex(fu.stw)], ['NSOLL_A', hex(fu.nsoll) + '  ' + nf1.format(fu.nsoll / FU_BEZUG * 100) + ' %'], ['ZSW1', hex(zsw1(fu))], ['NIST_A', hex(Math.round(fu.n * FU_BEZUG)) + '  ' + nf1.format(fu.n * 100) + ' %']].forEach(([a, b], i) => {
      zeile(a, 82 + i * 30, '#9fb0bb', '600 14px Arial'); zeile(b, 82 + i * 30, '#e8eef2', '600 15px Consolas, monospace', W - 12, 'right');
    });
  }
  // Fußzeile: Zustand, Seitenpunkte bzw. kurze Meldung
  c.fillStyle = '#20282e'; c.fillRect(0, H - 24, W, 24);
  if (fu.iop.seite !== 'diag') {
    zeile(fu.iop.meldungT > 0 ? fu.iop.meldung : t(ZUSTAND_TEXT[fu.zustand]), H - 11, fu.iop.meldungT > 0 ? '#ffb000' : '#c9d3da', '500 13px Arial');
    for (let i = 0; i < SEITEN; i++) { c.fillStyle = i === fu.iop.seite ? PETROL : '#56636c'; c.beginPath(); c.arc(W - 40 + i * 12, H - 12, 3.5, 0, 7); c.fill(); }
  }
  c.restore();
}

// --- 3D-Gerät im Schaltschrank ------------------------------------------------------------------
// x, y = Mitte des Leistungsteils auf der Montageplatte, z0 = Vorderkante Montageplatte
// fu = Umrichter aus UMRICHTER; je Gerät ein eigenes Display (Canvas) und eigene LEDs
export const G120 = { geraete: [], takt: 0, blink: 0 };
export function g120Bauen(g, x, y, z0, fu) {
  const pm = new THREE.MeshStandardMaterial({ color: 0x3b4045, roughness: 0.55, metalness: 0.1 });
  const cu = new THREE.MeshStandardMaterial({ color: 0x4a5056, roughness: 0.5, metalness: 0.08 });
  const iop = new THREE.MeshStandardMaterial({ color: 0x17191b, roughness: 0.35, metalness: 0.1 });
  // Leistungsteil PM240-2 FSA mit Kühlkörper hinten, Lüftungsgittern oben und unten
  box(73, 196, 165, pm, x, y, z0 + 82.5, g);
  for (const sy of [-1, 1]) for (let i = 0; i < 6; i++) box(60, 0.8, 8, M.schwarz, x, y + sy * 98.2, z0 + 30 + i * 22, g);
  // Netz- und Motoranschluss unten (Klemmendeckel), Typschild seitlich
  box(73, 30, 40, pm, x, y - 83, z0 + 185, g);
  platte(tafel('pm240', 73, 30, (c) => {
    c.fillStyle = '#3b4045'; c.fillRect(0, 0, 73, 30);
    c.fillStyle = '#d7dde2'; c.font = '600 3.4px Arial'; c.fillText('PM240-2  FSA  0,37 kW', 4, 8);
    c.font = '500 2.8px Arial'; c.fillText('U2 V2 W2   L1 L2 L3   PE', 4, 24);
  }), 73, 30, g, x, y - 83, z0 + 205.1);
  // Control Unit CU240E-2 PN auf der Front, Frontklappen, PROFINET-Buchsen X150 P1/P2 unten
  box(73, 150, 46, cu, x, y + 23, z0 + 188, g);
  platte(tafel('cu240e2', 73, 150, (c) => {
    c.fillStyle = '#4a5056'; c.fillRect(0, 0, 73, 150);
    // sichtbar bleibt unter dem Bedienpanel nur der untere Teil (ab 107 mm von oben)
    c.fillStyle = '#d7dde2'; c.font = '600 2.6px Arial'; c.textAlign = 'center';
    c.fillText('RDY', 9, 120); c.fillText('BF', 25, 120); c.fillText('SAFE', 41, 120);
    c.textAlign = 'left';
    c.strokeStyle = '#2f3438'; c.lineWidth = 0.6; c.strokeRect(3, 124, 67, 23);       // untere Frontklappe
    c.font = '700 3.4px Arial'; c.fillText('SINAMICS', 6, 132);
    c.font = '500 3px Arial'; c.fillText('CU240E-2 PN', 6, 138);
  }), 73, 150, g, x, y + 23, z0 + 211.1);
  // Kennzeichnungsschild auf der Frontklappe
  platte(tafel('bmk' + fu.name, 22, 7, (c) => {
    c.fillStyle = '#f1f2ef'; c.fillRect(0, 0, 22, 7);
    c.fillStyle = '#1b1f23'; c.font = '700 4.4px Arial'; c.textAlign = 'center'; c.fillText('−' + fu.name, 11, 5.4);
  }), 22, 7, g, x + 22, y - 44, z0 + 211.2);
  for (const dx of [-18, 0]) box(14, 6, 12, M.kunststoff, x + dx, y - 54, z0 + 195, g);   // X150 P1/P2 (Unterseite)
  // Bedienpanel IOP-2
  box(70, 106, 19.6, iop, x, y + 44, z0 + 211 + 9.8, g);
  platte(tafel('iop2', 70, 106, (c) => {
    c.fillStyle = '#17191b'; c.fillRect(0, 0, 70, 106);
    c.fillStyle = '#ffffff'; c.font = '700 5px Arial'; c.fillText('SIEMENS', 4, 7);
    c.fillStyle = '#26292c'; c.beginPath(); c.arc(35, 70, 12, 0, 7); c.fill();          // Drehrad
    c.strokeStyle = '#5b6066'; c.lineWidth = 0.8; c.stroke();
    c.fillStyle = '#3a3e42'; c.fillRect(5, 62, 12, 6); c.fillRect(53, 62, 12, 6);      // ESC, INFO
    c.fillStyle = '#c9cdd1'; c.font = '600 2.6px Arial'; c.fillText('ESC', 7.5, 66); c.fillText('INFO', 54.5, 66);
    c.fillStyle = '#1f9a4a'; c.fillRect(5, 90, 14, 9); c.fillStyle = '#3a3e42'; c.fillRect(28, 90, 14, 9); c.fillStyle = '#c62c2c'; c.fillRect(51, 90, 14, 9);
    c.fillStyle = '#ffffff'; c.font = '700 5px Arial'; c.fillText('I', 11, 96.6); c.fillText('O', 56.2, 96.6);
    c.font = '600 2.4px Arial'; c.fillText('HAND', 30.5, 94.2); c.fillText('AUTO', 30.6, 97.4);
  }), 70, 106, g, x, y + 44, z0 + 230.7);
  const tex = canvasTextur(320, 240, () => {});
  platte(new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), 56, 42, g, x, y + 44 + 23, z0 + 230.9);
  const led = (dx) => sensorLed(g, x + dx, y - 15, z0 + 211.5, '', 3, 3, 1.2);
  const leds = { rdy: led(-27.5), bf: led(-11.5), safe: led(4.5), lnk: sensorLed(g, x - 10, y - 50, z0 + 211.5, '', 3, 1.6, 1.2) };
  G120.geraete.push({ fu, tex, leds });
  // anklickbar: öffnet das Fenster „Umrichter“ mit diesem Gerät
  const klick = new THREE.Mesh(new THREE.BoxGeometry(80, 205, 240), KLICK);
  klick.position.set(x, y, z0 + 120); klick.userData = { art: 'umrichter', taster: fu.name }; g.add(klick);
  PULT_TASTER.push({ key: 'umrichter' + fu.name, kappe: klick, art: 'umrichter' });
}
const LED_FARBE = { gruen: 0x22dd55, rot: 0xff3b2f, gelb: 0xffc400 };
export function g120Aktualisieren(dt) {
  G120.blink = (G120.blink + dt) % 1;
  G120.takt -= dt;
  const zeichnen = G120.takt <= 0;
  if (zeichnen) G120.takt = 0.25;
  for (const { fu, tex, leds } of G120.geraete) {
    if (fu.iop.meldungT > 0) fu.iop.meldungT -= dt;
    const zustand = g120Leds(fu);
    for (const [k, m] of Object.entries(leds)) {
      const z = zustand[k], farbe = Object.keys(LED_FARBE).find(f => z.includes(f));
      const an = !!farbe && (!z.includes('blinkt') || G120.blink < 0.5);
      if (farbe) { m.emissive.setHex(LED_FARBE[farbe]); m.color.setHex(LED_FARBE[farbe]).multiplyScalar(0.15); }
      m.emissiveIntensity = an ? 1.6 : 0;
    }
    if (zeichnen) { iopZeichnen(tex.userData.canvas.getContext('2d'), fu); tex.needsUpdate = true; }
  }
}
