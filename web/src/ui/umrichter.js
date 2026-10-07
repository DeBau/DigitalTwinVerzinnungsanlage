import { SIGNALE } from '../signale.js';
import { st } from '../logik/zustand.js';
import { $ } from '../core/szene.js';
import { fmt0, fmt1 } from '../core/format.js';
import { t } from '../core/sprache.js';
import { FU_BEZUG, UMRICHTER, UMRICHTER_LISTE, nistA, ueberlastAusloesen, zsw1 } from '../logik/umrichter.js';
import { N_BEZUG, g120Leds, iopDrehen, iopTaste, iopZeichnen } from '../anlage/g120.js';
import { ereignis } from './ereignisse.js';
import { fensterVerschiebbar } from './fenster.js';

// ----------------------------------------------------------------------------
// Fenster „Umrichter“ (−TA2 … −TA5): Gerätefront mit Bedienpanel, Standardtelegramm 1 Bit für Bit
// und die Rampen live (Sollwert, wirksamer Sollwert, Istdrehzahl)
// ----------------------------------------------------------------------------
const STW1_BITS = [
  'EIN / AUS1', 'Kein AUS2 (Austrudeln)', 'Kein AUS3 (Schnellhalt)', 'Betrieb freigeben',
  'Hochlaufgeber freigeben', 'Hochlaufgeber fortsetzen', 'Drehzahlsollwert freigeben', 'Störung quittieren (Flanke 0 → 1)',
  'nicht verwendet', 'nicht verwendet', 'Führung durch SPS', 'Drehrichtungsumkehr (Sollwert invertieren)',
  'nicht verwendet', 'Motorpotenziometer höher (nicht verwendet)', 'Motorpotenziometer tiefer (nicht verwendet)', 'reserviert',
];
const ZSW1_BITS = [
  'Einschaltbereit', 'Betriebsbereit', 'Betrieb freigegeben', 'Störung wirksam',
  'Kein AUS2 aktiv', 'Kein AUS3 aktiv', 'Einschaltsperre aktiv', 'Warnung wirksam',
  'Drehzahl-Soll-Ist-Abweichung im Toleranzbereich', 'Führung gefordert', 'Vergleichsdrehzahl erreicht', 'I-, M- oder P-Grenze nicht erreicht',
  'Haltebremse offen', 'Keine Warnung Motorübertemperatur', 'Motor dreht rechts', 'Keine Warnung Umrichterüberlast',
];
const ZUSTAENDE = [['S1', 'S1 Einschaltsperre'], ['S2', 'S2 Einschaltbereit'], ['S3', 'S3 Betriebsbereit'], ['S4', 'S4 Betrieb'], ['S5', 'S5 Ausschalten'], ['F', 'Störung']];

let aktiv = UMRICHTER.TA2;                         // im Fenster gezeigter Umrichter
const fenster = $('fuf');
fensterVerschiebbar(fenster, $('fuf-kopf'));
$('fuf-zu').onclick = () => { fenster.hidden = true; };
// name = 'TA2' … 'TA5' (Klick auf ein Gerät im Schaltschrank); ohne Angabe bleibt der zuletzt gezeigte
export function fuFensterOeffnen(name) {
  if (UMRICHTER[name]) aktiv = UMRICHTER[name];
  fenster.hidden = false; letzte.clear(); fuFensterAktualisieren();
}
$('btn-fu').onclick = () => fuFensterOeffnen();
const wahl = UMRICHTER_LISTE.map((fu) => {
  const b = document.createElement('button');
  b.type = 'button'; b.textContent = '−' + fu.name; b.title = `${t(fu.foerderer)} ${fu.motor}`;
  b.onclick = () => fuFensterOeffnen(fu.name);
  $('fu-wahl').append(b);
  return { fu, b };
});
$('fu-ueberlast').onclick = () => { ueberlastAusloesen(aktiv); ereignis(t`Umrichter −${aktiv.name}: Störung F30005 Leistungsteil Überlast I2t`, 'err'); };
$('fu-heiss').onclick = () => {
  const fu = aktiv;
  fu.motorHeiss = !fu.motorHeiss;
  ereignis(fu.motorHeiss ? t`Umrichter −${fu.name}: Kaltleiter im Motor ${fu.motor} hat angesprochen (Warnung A07910, Störung F07011)` : t`Motor ${fu.motor} abgekühlt: F07011 lässt sich quittieren`, fu.motorHeiss ? 'err' : '');
};

// Bedienpanel IOP-2: Tasten und Drehrad
const display = $('iop-display').getContext('2d');
for (const b of document.querySelectorAll('.iop-taste')) b.addEventListener('click', () => { iopTaste(aktiv, b.dataset.taste); fuFensterAktualisieren(); });
const rad = $('iop-rad');
rad.addEventListener('click', (e) => {
  // Rand links/rechts = eine Raste drehen, Mitte = OK drücken
  const r = rad.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2);
  if (e.detail && Math.abs(dx) > r.width * 0.26) iopDrehen(aktiv, Math.sign(dx)); else iopTaste(aktiv, 'ok');
  fuFensterAktualisieren();
});
rad.addEventListener('wheel', (e) => { e.preventDefault(); iopDrehen(aktiv, e.deltaY < 0 ? 1 : -1); fuFensterAktualisieren(); }, { passive: false });
rad.addEventListener('keydown', (e) => {
  const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
  if (d) { e.preventDefault(); iopDrehen(aktiv, d); fuFensterAktualisieren(); }
});

function bitListe(id, namen) {
  const ol = $(id);
  return namen.map((n, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<b>.${i}</b><i class="led"></i><span>${t(n)}</span>`;
    ol.append(li);
    return li;
  });
}
const stwZeilen = bitListe('fu-stw-bits', STW1_BITS), zswZeilen = bitListe('fu-zsw-bits', ZSW1_BITS);
const zustandChips = ZUSTAENDE.map(([k, text]) => {
  const el = document.createElement('span');
  el.textContent = t(text);
  if (k === 'F') el.className = 'stoerung';
  $('fu-zustaende').append(el);
  return { k, el };
});

const hex = (w) => '16#' + (w & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
const letzte = new Map();            // nur geänderte Werte ins DOM schreiben
function setze(id, wert, eigenschaft = 'textContent') {
  const k = id + eigenschaft;
  if (letzte.get(k) === wert) return;
  letzte.set(k, wert);
  $(id)[eigenschaft] = wert;
}
function bitsZeigen(zeilen, w) {
  zeilen.forEach((li, i) => {
    const an = ((w >> i) & 1) === 1;
    li.classList.toggle('aus', !an);
    li.querySelector('.led').classList.toggle('on', an);
  });
}
const adresse = (name) => SIGNALE.find(s => s.name === name)?.adresse || '–';
const drehzahlText = (wert) => `${wert} · ${fmt1.format(wert / FU_BEZUG * 100)} % · ${fmt0.format(wert / FU_BEZUG * N_BEZUG)} 1/min`;

// --- Rampen live: je Umrichter alle 50 ms Sollwert (NSOLL_A bzw. HAND-Sollwert), wirksamer Sollwert
// (Eingang des Hochlaufgebers: 0 ohne Betrieb/Freigabe, begrenzt auf p1082) und Istdrehzahl, 60 s lang ---
const ABTAST = 0.05, PUNKTE = 60 / ABTAST;
const verlauf = new Map(UMRICHTER_LISTE.map(fu => [fu.name, []]));
let abtastT = 0, spanne = 20;
$('fu-spanne').onchange = (e) => { spanne = Number(e.target.value); kurveZeichnen(); };
export function fuAufzeichnen(dt) {
  abtastT += dt;
  if (abtastT < ABTAST) return;
  abtastT = 0;
  for (const fu of UMRICHTER_LISTE) {
    const v = verlauf.get(fu.name);
    v.push([fu.hand ? fu.handSoll : fu.nsoll / FU_BEZUG, fu.ziel, fu.n]);
    if (v.length > PUNKTE) v.shift();
  }
}
const cv = $('fu-kurve');
function kurveZeichnen() {
  const dpr = devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
  if (!W || !H) return;
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const c = cv.getContext('2d'), css = getComputedStyle(fenster);
  const farbe = (v) => css.getPropertyValue(v).trim();
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, W, H);
  const daten = verlauf.get(aktiv.name).slice(-Math.round(spanne / ABTAST));
  // Wertebereich in 1/min: mindestens ±Bezugsdrehzahl, bei Bedarf bis p1082
  let max = N_BEZUG, neg = false;
  for (const p of daten) for (const w of p) { max = Math.max(max, Math.abs(w) * N_BEZUG); if (w < -0.01) neg = true; }
  max = Math.ceil(max / 500) * 500;
  const L = 52, R = 10, O = 8, U = 22, bw = W - L - R, bh = H - O - U;
  const y = (w) => O + bh * (neg ? 0.5 - w * N_BEZUG / max / 2 : 1 - w * N_BEZUG / max);
  const x = (i) => L + bw * (1 - (daten.length - 1 - i) * ABTAST / spanne);
  // Raster
  c.font = '11px ' + farbe('--font-data'); c.fillStyle = farbe('--muted'); c.strokeStyle = farbe('--line'); c.lineWidth = 1;
  c.textAlign = 'right'; c.textBaseline = 'middle';
  for (let w = neg ? -max : 0; w <= max + 1; w += 500) {
    const yy = Math.round(y(w / N_BEZUG)) + 0.5;
    c.globalAlpha = w === 0 ? 1 : 0.6; c.beginPath(); c.moveTo(L, yy); c.lineTo(W - R, yy); c.stroke();
    c.globalAlpha = 1; c.fillText(fmt0.format(w), L - 6, yy);
  }
  c.textAlign = 'center'; c.textBaseline = 'top';
  const schritt = spanne <= 10 ? 2 : spanne <= 20 ? 5 : 10;
  for (let s = 0; s <= spanne; s += schritt) {
    const xx = Math.round(L + bw * (1 - s / spanne)) + 0.5;
    c.globalAlpha = 0.6; c.beginPath(); c.moveTo(xx, O); c.lineTo(xx, O + bh); c.stroke();
    c.globalAlpha = 1; c.fillText(s ? `−${s} s` : '0', xx, O + bh + 5);
  }
  c.save(); c.translate(12, O + bh / 2); c.rotate(-Math.PI / 2); c.textBaseline = 'middle'; c.fillText('1/min', 0, 0); c.restore();
  // Kurven: Sollwert gestrichelt, wirksamer Sollwert, Istdrehzahl kräftig
  const linie = (k, f, breite, strich = []) => {
    c.strokeStyle = f; c.lineWidth = breite; c.setLineDash(strich); c.lineJoin = 'round';
    c.beginPath(); daten.forEach((p, i) => (i ? c.lineTo(x(i), y(p[k])) : c.moveTo(x(i), y(p[k])))); c.stroke();
  };
  c.save(); c.beginPath(); c.rect(L, O - 2, bw, bh + 4); c.clip();
  linie(0, farbe('--muted'), 1.5, [5, 4]);
  linie(1, farbe('--led'), 1.5);
  linie(2, '#009999', 2.5);
  c.restore(); c.setLineDash([]);
}
new ResizeObserver(() => { if (!fenster.hidden) kurveZeichnen(); }).observe(cv);

export function fuFensterAktualisieren() {
  if (fenster.hidden) return;
  const fu = aktiv, n = fu.name;
  // Was beim Umrichter ankommt (SPS, Bandmodul oder in HAND das Bedienpanel)
  const stw = fu.stw & 0xFFFF, nsoll = fu.nsoll;
  const zsw = zsw1(fu), nist = nistA(fu);

  setze('fuf-titel', `${t('Umrichter')} −${n} · ${t(fu.foerderer)} ${fu.motor} · SINAMICS G120 · ${t('Standardtelegramm 1')}`);
  for (const w of wahl) w.b.setAttribute('aria-pressed', w.fu === fu);
  // Telegramm
  setze('fu-adr-stw', adresse(n + '_STW1')); setze('fu-adr-nsoll', adresse(n + '_NSOLL_A'));
  setze('fu-adr-zsw', adresse(n + '_ZSW1')); setze('fu-adr-nist', adresse(n + '_NIST_A'));
  setze('fu-stw-hex', hex(stw)); setze('fu-zsw-hex', hex(zsw));
  setze('fu-nsoll-hex', hex(nsoll)); setze('fu-nist-hex', hex(nist));
  setze('fu-nsoll-wert', drehzahlText(nsoll)); setze('fu-nist-wert', drehzahlText(nist));
  if (letzte.get('stw') !== stw) { letzte.set('stw', stw); bitsZeigen(stwZeilen, stw); }
  if (letzte.get('zsw') !== zsw) { letzte.set('zsw', zsw); bitsZeigen(zswZeilen, zsw); }
  const zk = fu.zustand === 'AUS1' || fu.zustand === 'AUS3' ? 'S5' : fu.zustand;
  for (const c of zustandChips) c.el.classList.toggle('an', c.k === 'F' ? !!fu.stoerung : c.k === zk);

  // Bedienpanel und LEDs (wie am Gerät im Schaltschrank)
  iopZeichnen(display, fu);
  const leds = g120Leds(fu);
  setze('fu-led-rdy', 'fu-led ' + leds.rdy, 'className');
  setze('fu-led-bf', 'fu-led ' + leds.bf, 'className');
  setze('fu-led-safe', 'fu-led ' + leds.safe, 'className');
  setze('fu-led-lnk', 'fu-led ' + leds.lnk, 'className');
  setze('fu-heiss', String(fu.motorHeiss), 'ariaPressed');
  setze('iop-hand', String(fu.hand), 'ariaPressed');
  kurveZeichnen();

  const wo = `${t(fu.foerderer)} ${fu.motor}`;
  setze('fu-hinweis', st.antrieb[n] !== 'fu'
    ? t`Der Umrichter ist nicht gewählt: im Übungsumfang ${wo} auf „Umrichter −${n}“ stellen.`
    : fu.hand ? t('HAND: Das Bedienpanel führt den Umrichter (I/O, Drehrad = Sollwert). Das Telegramm der SPS ist ohne Wirkung, ZSW1.9 = 0.')
    : st.betriebBand === 'sps' ? t`Der Umrichter treibt ${wo}. Fahrbefehle kommen aus dem Telegramm der SPS, die Schützansteuerung ${fu.schuetz} ist ohne Wirkung. Not-Halt wählt STO an.`
    : t`Der Umrichter treibt ${wo}. Das Bandmodul (Übungsumfang „automatisch“) führt ihn über dasselbe Telegramm. Not-Halt wählt STO an.`);
}
