/* Zoom und Verschieben des Blatts in der Schaltplan-Ansicht: Mausrad und Knöpfe zoomen um den Zeiger, Ziehen
   verschiebt, zwei Finger zoomen. Der Zustand (Kamera) bleibt beim Blättern erhalten, damit du dieselbe Stelle
   auf mehreren Seiten vergleichen kannst. Genutzt von ansicht.js. */
import { $ } from '../app/basis.js';

const MIN = 1, MAX = 8, SCHRITT = 1.25, ZIEHEN_AB = 4;
const kamera = {z: 1, x: 0, y: 0};
const zeiger = new Map();   // aktive Zeiger (Maus, Finger) → letzte Position
let gezogen = false;

const begrenze = (v, min, max) => Math.min(max, Math.max(min, v));

function anwenden(){
  const blatt = $("#sp-blatt"), svg = $("#sp-blatt svg");
  if (!svg) return;
  const breite = blatt.clientWidth, hoehe = blatt.clientHeight;
  kamera.x = begrenze(kamera.x, breite - breite * kamera.z, 0);
  kamera.y = begrenze(kamera.y, hoehe - hoehe * kamera.z, 0);
  svg.style.transform = `translate(${kamera.x}px, ${kamera.y}px) scale(${kamera.z})`;
  blatt.classList.toggle("sp-gezoomt", kamera.z > 1);
  const wert = $("#sp-zoom-wert");
  if (wert) wert.textContent = `${Math.round(kamera.z * 100)} %`;
}

// Zoomen um einen Punkt (px, py) im Blatt: Der Punkt bleibt unter dem Zeiger stehen
export function zoomeUm(faktor, px, py){
  const blatt = $("#sp-blatt");
  if (!blatt) return;
  const z = begrenze(kamera.z * faktor, MIN, MAX), f = z / kamera.z;
  const mx = px ?? blatt.clientWidth / 2, my = py ?? blatt.clientHeight / 2;
  kamera.x = mx - (mx - kamera.x) * f;
  kamera.y = my - (my - kamera.y) * f;
  kamera.z = z;
  anwenden();
}

export const zoomeRein = () => zoomeUm(SCHRITT);
export const zoomeRaus = () => zoomeUm(1 / SCHRITT);

export function einpassen(){
  Object.assign(kamera, {z: 1, x: 0, y: 0});
  anwenden();
}

export function vollbild(){
  const haupt = $(".sp-haupt");
  if (document.fullscreenElement) document.exitFullscreen();
  else if (haupt && haupt.requestFullscreen) haupt.requestFullscreen();
}

/* ---------- Zeiger: Ziehen und zwei Finger ---------- */
const abstand = () => { const [a, b] = [...zeiger.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
const mitte = () => { const [a, b] = [...zeiger.values()]; return {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2}; };

function relativ(e){
  const r = $("#sp-blatt").getBoundingClientRect();
  return {x: e.clientX - r.left, y: e.clientY - r.top};
}

function runter(e){
  zeiger.set(e.pointerId, relativ(e));
  gezogen = false;
}

function bewegen(e){
  if (!zeiger.has(e.pointerId)) return;
  const vorher = zeiger.get(e.pointerId), jetzt = relativ(e);
  if (zeiger.size === 2) {
    const alt = abstand();
    zeiger.set(e.pointerId, jetzt);
    const m = mitte();
    zoomeUm(abstand() / alt, m.x, m.y);
    gezogen = true;
    return;
  }
  zeiger.set(e.pointerId, jetzt);
  if (kamera.z === 1) return;
  if (!gezogen && Math.hypot(jetzt.x - vorher.x, jetzt.y - vorher.y) < ZIEHEN_AB) return;
  gezogen = true;
  kamera.x += jetzt.x - vorher.x;
  kamera.y += jetzt.y - vorher.y;
  anwenden();
}

const hoch = e => zeiger.delete(e.pointerId);

function rad(e){
  e.preventDefault();
  const p = relativ(e);
  zoomeUm(e.deltaY < 0 ? SCHRITT : 1 / SCHRITT, p.x, p.y);
}

// Ein Klick direkt nach dem Ziehen soll keinen Verweis auslösen
export const warGezogen = () => gezogen;

// Nach jedem neuen Blatt: Ereignisse binden und die Kamera übernehmen
export function bindeZoom(){
  const blatt = $("#sp-blatt");
  blatt.addEventListener("wheel", rad, {passive: false});
  blatt.addEventListener("pointerdown", runter);
  blatt.addEventListener("pointermove", bewegen);
  for (const art of ["pointerup", "pointercancel", "pointerleave"]) blatt.addEventListener(art, hoch);
  anwenden();
}
