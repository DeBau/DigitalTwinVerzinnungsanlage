import { ZYL, st } from '../logik/zustand.js';
import { $ } from '../core/szene.js';
import { demo } from '../logik/demo-sps.js';
import { BAND } from '../anlage/baender.js';
import { MM8 } from '../anlage/pruefstation.js';
import { DROSSEL, DROSSEL_GRUND, drosselSpeichern } from '../logik/drosseln.js';
import { LOCALE, t } from '../core/sprache.js';
import { fensterVerschiebbar } from './fenster.js';

// ----------------------------------------------------------------------------
// Weg-Zeit-Diagramm aller Zylinder: klein in der Seitenleiste (60 s), groß im Fenster
// mit Zeitfenster, Anhalten, zwei Messlinien (rasten an den Endlagensensoren ein) und
// den Drosselrückschlagventilen je Zylinder samt gemessener Fahrzeit.
// Stellung 0/1 wie im Weg-Schritt-Diagramm: 1 = Kolbenstange ausgefahren.
// ----------------------------------------------------------------------------
// s0/s1: Endlagensensoren (wie die SPS sie sieht) – Fahrzeiten und Rastpunkte der Messlinien beziehen sich darauf
const zyl = (c) => ({ pos: () => c.pos, s0: () => c.an0, s1: () => c.an1, nenn: c.zeit });
// name/e0/e1: Anzeigetexte (übersetzt)
const uebersetzt = (k) => ({ ...k, name: t(k.name), e0: t(k.e0), e1: t(k.e1) });
export const KANAELE = [
  { kurz: 'MM1', name: 'Einhängen', e0: 'eingehängt', e1: 'gelöst', ...zyl(ZYL.MM1) },
  { kurz: 'MM2', name: 'Tauchen', e0: 'oben', e1: 'unten', ...zyl(ZYL.MM2) },
  { kurz: 'MM3', name: 'Verschieben', e0: 'Band', e1: 'Bad', ...zyl(ZYL.MM3) },
  { kurz: 'MM4', name: 'Abstreifen', e0: 'offen', e1: 'zu', ...zyl(ZYL.MM4) },
  { kurz: 'MM5', name: 'Anschlag', e0: 'offen', e1: 'zu', pos: () => 1 - BAND.anschlagPos, s0: () => BAND.anschlagPos > 0.92, s1: () => BAND.anschlagPos < 0.08, nenn: 1 / 6 },
  { kurz: 'MM6', name: 'Vereinzeler', e0: 'offen', e1: 'zu', pos: () => 1 - BAND.vereinzelerPos, s0: () => BAND.vereinzelerPos > 0.92, s1: () => BAND.vereinzelerPos < 0.08, nenn: 1 / 6 },
  { kurz: 'MM8', name: 'Kippen', e0: 'unten', e1: 'gekippt', ...zyl(MM8) },
].map(uebersetzt);
const N = KANAELE.length;
const fmt2 = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtAchse = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });
const sek = (t) => (t < -0.0005 ? '−' : '') + fmt2.format(Math.abs(t)) + ' s';

// ---------------------------------------------------------------- Aufzeichnung
const PUFFER_S = 125;                 // so weit lässt sich im angehaltenen Fenster zurückblättern
const verlauf = [];                   // { t, p: Float32Array, s }
const kanten = [];                    // Sensorflanken { t, i } – Rastpunkte der Messlinien
export const MESSUNG = Object.fromEntries(KANAELE.map(k => [k.kurz, { aus: null, ein: null }]));
const fahrt = KANAELE.map(k => ({ s0: k.s0(), s1: k.s1(), start: 0, richtung: 0 }));
let tSim = 0, zeichnenTakt = 0, fensterTakt = 0;

// Fahrzeit = Endlagensensor verlassen bis anderen Endlagensensor erreicht (das misst auch die SPS)
function fahrzeitenMessen(t) {
  KANAELE.forEach((k, i) => {
    const f = fahrt[i], s0 = k.s0(), s1 = k.s1();
    if (f.s0 && !s0) { f.start = t; f.richtung = 1; kanten.push({ t, i }); }
    if (f.s1 && !s1) { f.start = t; f.richtung = -1; kanten.push({ t, i }); }
    if (!f.s1 && s1) { kanten.push({ t, i }); if (f.richtung > 0) MESSUNG[k.kurz].aus = t - f.start; f.richtung = 0; }
    if (!f.s0 && s0) { kanten.push({ t, i }); if (f.richtung < 0) MESSUNG[k.kurz].ein = t - f.start; f.richtung = 0; }
    f.s0 = s0; f.s1 = s1;
  });
}
export function wzAufzeichnen(dt) {
  tSim += dt;
  const p = Float32Array.from(KANAELE, k => k.pos());
  fahrzeitenMessen(tSim);
  verlauf.push({ t: tSim, p, s: st.modus === 'demo' ? demo.schritt : null });
  while (verlauf.length && verlauf[0].t < tSim - PUFFER_S) verlauf.shift();
  while (kanten.length && kanten[0].t < tSim - PUFFER_S) kanten.shift();
  if (document.hidden) return;
  zeichnenTakt += dt; fensterTakt += dt;
  if (zeichnenTakt >= 0.1) { zeichnenTakt = 0; wzZeichnen(); }
  if (!fenster.hidden && fensterTakt >= 1 / 30) { fensterTakt = 0; if (!halt) fensterZeichnen(); drosselnAktualisieren(); }
}
export function wzZuruecksetzen() {
  verlauf.length = 0; kanten.length = 0; linien.length = 0;
  for (const m of Object.values(MESSUNG)) m.aus = m.ein = null;
  KANAELE.forEach((k, i) => Object.assign(fahrt[i], { s0: k.s0(), s1: k.s1(), richtung: 0 }));
  wzZeichnen(); if (!fenster.hidden) fensterZeichnen();
}

// ---------------------------------------------------------------- Zeichnen
function farben() {
  const cs = getComputedStyle(document.documentElement), v = (n) => cs.getPropertyValue(n).trim();
  return { fg: v('--fg'), muted: v('--muted'), line: v('--line'), accent: v('--accent'), ok: v('--ok'), led: v('--led'), panel: v('--panel') };
}
function vorbereiten(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight;
  if (!w || !h) return null;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, w, h);
  return { c, w, h };
}
// Gemeinsame Darstellung: Bahnen je Zylinder, Schrittwechsel, Kurven; liefert die Abbildung Zeit ↔ x
function diagramm(cv, { spanne, tEnde, gross }) {
  const v = vorbereiten(cv);
  if (!v) return null;
  const { c, w, h } = v, F = farben();
  const links = gross ? 150 : 44, rechts = gross ? 12 : 4, oben = 16, unten = gross ? 20 : 4;
  const bahn = (h - oben - unten) / N, breite = w - links - rechts;
  const zuX = (t) => links + breite - (tEnde - t) / spanne * breite;
  const zuT = (x) => tEnde - (links + breite - x) / breite * spanne;
  const tAnfang = tEnde - spanne;
  // Zeitraster (nur groß)
  if (gross) {
    const schritt = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 30].find(s => breite / (spanne / s) >= 70) || 60;
    c.font = '400 10.5px "IBM Plex Mono", monospace'; c.textBaseline = 'top'; c.textAlign = 'center';
    for (let k = Math.ceil(-spanne / schritt); k <= 0; k++) {
      const x = Math.round(zuX(tEnde + k * schritt)) + 0.5;
      c.strokeStyle = F.line; c.lineWidth = 1; c.beginPath(); c.moveTo(x, oben); c.lineTo(x, h - unten); c.stroke();
      c.fillStyle = F.muted; c.fillText(k === 0 ? (halt ? '0' : t('jetzt')) : fmtAchse.format(k * schritt) + ' s', x, h - unten + 4);
    }
    c.textAlign = 'left';
  }
  // Bahnen
  for (let i = 0; i < N; i++) {
    const k = KANAELE[i], y0 = oben + i * bahn;
    c.textBaseline = 'middle';
    c.font = `500 ${gross ? 12.5 : 10.5}px "IBM Plex Sans Condensed", Arial, sans-serif`;
    c.fillStyle = F.fg; c.fillText('−' + k.kurz, 2, y0 + bahn / 2 - (gross ? 6 : 0));
    if (gross) {
      c.font = '400 11px "IBM Plex Sans", Arial, sans-serif'; c.fillStyle = F.muted; c.fillText(k.name, 2, y0 + bahn / 2 + 8);
      c.font = '400 10px "IBM Plex Mono", monospace'; c.textAlign = 'right';
      c.fillText('1 ' + k.e1, links - 8, y0 + 7); c.fillText('0 ' + k.e0, links - 8, y0 + bahn - 7); c.textAlign = 'left';
    }
    c.strokeStyle = F.line; c.lineWidth = 1;
    for (const yy of [y0 + 5, y0 + bahn - 5]) { c.beginPath(); c.moveTo(links, Math.round(yy) + 0.5); c.lineTo(links + breite, Math.round(yy) + 0.5); c.stroke(); }
  }
  // sichtbarer Ausschnitt des Puffers
  let i0 = 0; while (i0 < verlauf.length && verlauf[i0].t < tAnfang) i0++;
  i0 = Math.max(0, i0 - 1);
  // Schrittwechsel der Demo-SPS
  c.textBaseline = 'top'; c.font = '400 9.5px "IBM Plex Mono", monospace';
  for (let j = Math.max(i0, 1); j < verlauf.length && verlauf[j].t <= tEnde; j++) {
    if (verlauf[j].s !== verlauf[j - 1].s && verlauf[j].s != null) {
      const x = Math.round(zuX(verlauf[j].t)) + 0.5;
      c.strokeStyle = F.line; c.beginPath(); c.moveTo(x, oben - 2); c.lineTo(x, h - unten); c.stroke();
      c.fillStyle = F.muted; c.fillText(String(verlauf[j].s), x + 2, 2);
    }
  }
  // Kurven (je Bildpunktspalte höchstens ein Punkt)
  c.strokeStyle = F.accent; c.lineWidth = gross ? 2 : 1.6; c.lineJoin = 'round';
  for (let i = 0; i < N; i++) {
    const y0 = oben + i * bahn + 5, hoehe = bahn - 10;
    c.beginPath();
    let letzteX = -1, erster = true;
    for (let j = i0; j < verlauf.length; j++) {
      const e = verlauf[j]; if (e.t > tEnde) break;
      const x = zuX(e.t), y = y0 + (1 - e.p[i]) * hoehe;
      const naechstes = verlauf[j + 1];
      if (!erster && x - letzteX < 0.75 && naechstes && naechstes.t <= tEnde) continue;   // letzten sichtbaren Punkt immer zeichnen
      erster ? c.moveTo(x, y) : c.lineTo(x, y); erster = false; letzteX = x;
    }
    c.stroke();
  }
  return { c, w, h, F, links, oben, unten, bahn, breite, zuX, zuT };
}
const wz = $('wz');
export function wzZeichnen() { diagramm(wz, { spanne: 60, tEnde: tSim, gross: false }); }

// ---------------------------------------------------------------- Fenster
const fenster = $('wzf'), cv = $('wzf-canvas'), messText = $('wzf-mess');
let spanne = 30, halt = false, tHalt = 0, geometrie = null, ziehen = null;
const linien = [];                    // Zeitpunkte der Messlinien (Simulationszeit)
const tEndeAktuell = () => (halt ? tHalt : tSim);
function fensterZeichnen() {
  geometrie = diagramm(cv, { spanne, tEnde: tEndeAktuell(), gross: true });
  if (!geometrie) return;
  const { c, h, F, oben, unten, zuX } = geometrie;
  linien.forEach((t, n) => {
    const x = Math.round(zuX(t)) + 0.5, farbe = n ? F.led : F.ok;
    c.strokeStyle = farbe; c.lineWidth = 2; c.setLineDash([6, 4]);
    c.beginPath(); c.moveTo(x, oben - 4); c.lineTo(x, h - unten); c.stroke(); c.setLineDash([]);
    c.fillStyle = farbe; c.font = '600 11px "IBM Plex Mono", monospace'; c.textBaseline = 'top';
    c.fillText(String(n + 1), x + 4, oben - 2);
  });
  messAnzeigen();
}
function messAnzeigen() {
  const rel = (t) => sek(t - tEndeAktuell());
  if (!linien.length) {
    messText.textContent = t('Klick ins Diagramm setzt Messlinie 1, ein zweiter Klick Messlinie 2. Sie rasten an den Flanken der Endlagensensoren ein (Alt-Taste: frei). Ziehen verschiebt, Mausrad blättert im angehaltenen Diagramm.');
    return;
  }
  const teile = linien.map((zeit, n) => t`Linie ${n + 1}: <b>${rel(zeit)}</b>`);
  if (linien.length === 2) teile.push(`Δt = <b>${sek(Math.abs(linien[1] - linien[0]))}</b>`);
  messText.innerHTML = teile.join(' &nbsp;·&nbsp; ');
}
// Rastpunkt in der Nähe: zuerst Kanten der Bahn unter dem Zeiger, sonst beliebige
function einrasten(t, y, frei) {
  if (frei || !geometrie) return t;
  const { oben, bahn, breite } = geometrie, tol = 14 / breite * spanne;
  const bahnNr = Math.floor((y - oben) / bahn);
  let best = null;
  for (const k of kanten) {
    const d = Math.abs(k.t - t);
    if (d > tol) continue;
    const wert = d + (k.i === bahnNr ? 0 : tol);       // eigene Bahn bevorzugt
    if (!best || wert < best.wert) best = { t: k.t, wert };
  }
  return best ? best.t : t;
}
function zeigerT(e) {
  const r = cv.getBoundingClientRect();
  return { t: geometrie.zuT(e.clientX - r.left), y: e.clientY - r.top, x: e.clientX - r.left };
}
cv.addEventListener('pointerdown', (e) => {
  if (!geometrie) return;
  const { t, y, x } = zeigerT(e);
  if (x < geometrie.links) return;
  if (!halt) haltSetzen(true);                      // wie am Oszilloskop: zum Messen anhalten
  const nah = linien.findIndex(l => Math.abs(geometrie.zuX(l) - x) < 7);
  let n = nah;
  if (n < 0) {
    if (linien.length < 2) { linien.push(t); n = linien.length - 1; }
    else n = Math.abs(linien[0] - t) < Math.abs(linien[1] - t) ? 0 : 1;
  }
  linien[n] = einrasten(t, y, e.altKey);
  ziehen = n; cv.setPointerCapture(e.pointerId);
  fensterZeichnen();
});
cv.addEventListener('pointermove', (e) => {
  if (ziehen === null || !geometrie) return;
  const { t, y } = zeigerT(e);
  linien[ziehen] = einrasten(t, y, e.altKey);
  fensterZeichnen();
});
cv.addEventListener('pointerup', () => { ziehen = null; });
cv.addEventListener('wheel', (e) => {
  if (!halt) return;
  e.preventDefault();
  const aeltestes = verlauf.length ? verlauf[0].t : tSim;
  tHalt = Math.min(tSim, Math.max(aeltestes + spanne, tHalt + Math.sign(e.deltaY || e.deltaX) * spanne * 0.15));
  fensterZeichnen();
}, { passive: false });

const haltBtn = $('wzf-halt');
function haltSetzen(an) {
  halt = an; if (an) tHalt = tSim;
  haltBtn.setAttribute('aria-pressed', an);
  haltBtn.textContent = t(an ? 'Weiter' : 'Anhalten');
  fensterZeichnen();
}
haltBtn.onclick = () => haltSetzen(!halt);
$('wzf-linien-weg').onclick = () => { linien.length = 0; fensterZeichnen(); };
$('wzf-spanne').onchange = (e) => { spanne = Number(e.target.value); fensterZeichnen(); };
$('wzf-zu').onclick = () => { fenster.hidden = true; };
$('btn-wz-gross').onclick = () => wzFensterOeffnen();
new ResizeObserver(() => { if (!fenster.hidden) fensterZeichnen(); }).observe(cv);
fensterVerschiebbar(fenster, $('wzf-kopf'));

// kurz: Zylinder, dessen Drosseln hervorgehoben werden (Klick auf ein Ventil in der 3D-Ansicht)
export function wzFensterOeffnen(kurz) {
  fenster.hidden = false;
  fensterZeichnen(); drosselnAktualisieren();
  for (const z of zeilen) z.el.classList.toggle('markiert', z.k.kurz === kurz);
  const z = zeilen.find(z => z.k.kurz === kurz);
  if (z) { z.el.scrollIntoView({ block: 'nearest' }); z.regler.aus.focus({ preventScroll: true }); }
}

// ---------------------------------------------------------------- Drosseln
const RICHTUNG = { aus: { text: t('Ausfahren'), ende: 'e1', anschluss: 'B' }, ein: { text: t('Einfahren'), ende: 'e0', anschluss: 'A' } };
const zeilen = KANAELE.map((k) => {
  const el = document.createElement('div');
  el.className = 'dr-zeile';
  el.innerHTML = `<div class="dr-name"><b>−${k.kurz}</b> ${k.name}<small>${t`Endlagen ${k.e0} / ${k.e1}`}</small></div>`;
  const regler = {}, ausgabe = {}, info = {};
  for (const r of ['aus', 'ein']) {
    const R = RICHTUNG[r];
    const lab = document.createElement('label'); lab.className = 'dr-rich';
    lab.title = r === 'aus' ? t`Drosselrückschlagventil an Anschluss ${R.anschluss} (drosselt die Abluft beim Ausfahren)` : t`Drosselrückschlagventil an Anschluss ${R.anschluss} (drosselt die Abluft beim Einfahren)`;
    lab.innerHTML = `<span>${R.text} → ${k[R.ende]}</span><output></output><input type="range" min="0" max="100" step="5" aria-label="${t`−${k.kurz} Drossel ${R.text}`}"><small></small>`;
    regler[r] = lab.querySelector('input'); ausgabe[r] = lab.querySelector('output'); info[r] = lab.querySelector('small');
    regler[r].value = DROSSEL[k.kurz][r];
    regler[r].addEventListener('input', () => { DROSSEL[k.kurz][r] = Number(regler[r].value); drosselSpeichern(); drosselnAktualisieren(); });
    el.append(lab);
  }
  $('dr-liste').append(el);
  return { k, el, regler, ausgabe, info };
});
function drosselnAktualisieren() {
  for (const { k, regler, ausgabe, info } of zeilen) for (const r of ['aus', 'ein']) {
    const w = DROSSEL[k.kurz][r], m = MESSUNG[k.kurz][r];
    if (Number(regler[r].value) !== w) regler[r].value = w;
    ausgabe[r].textContent = w + ' %';
    const richtwert = w > 0 ? '≈ ' + sek(k.nenn / (w / DROSSEL_GRUND) / st.speed) : t('zu – Zylinder steht');
    const text = t`${richtwert} · gemessen ${m == null ? '–' : sek(m)}`;
    if (info[r].textContent !== text) info[r].textContent = text;
    info[r].classList.toggle('zu', w === 0);
  }
}
$('dr-grund').onclick = () => {
  for (const k of KANAELE) DROSSEL[k.kurz].aus = DROSSEL[k.kurz].ein = DROSSEL_GRUND;
  drosselSpeichern(); drosselnAktualisieren();
};
drosselnAktualisieren();
