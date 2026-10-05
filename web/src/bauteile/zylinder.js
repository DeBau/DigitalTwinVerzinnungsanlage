import * as THREE from 'three';
import { M } from '../core/materialien.js';
import { box, cached, mesh, zyl } from '../core/geometrie.js';
import { label, platte, tafel } from '../core/beschriftung.js';
import { NUT_OBEN, nutSensor } from './nutsensor.js';
import { KLICK, PULT_TASTER } from '../anlage/register.js';

// Drehteil um die y-Achse aus Profilpunkten [r, y] (r in Vielfachen von s), gecacht je Schlüssel
function drehteil(key, pkte, s, seg) {
  return cached(`dt${key}|${s}|${seg}`, () => new THREE.LatheGeometry(pkte.map(([r, y]) => new THREE.Vector2(r * s, y)), seg));
}
// Steckverschraubung (Festo QS: Sechskant + Gewindebund vernickelt, Lösering blau), zeigt in +y; liefert die Schlauchöffnung
export function steckverschraubung(parent, x, y, z, r = 6) {
  zyl(r * 1.15, 4.2, M.stahl, x, y + 2.1, z, null, parent, 6);                    // Sechskant (Schlüsselfläche)
  const k = mesh(drehteil('qsKoerper', [[0.98, 4.2], [1.0, 4.6], [0.82, 5.2], [0.8, 10.4], [0.88, 10.8], [0.88, 11.2]], r, 16), M.stahl, parent);
  k.position.set(x, y, z);
  const l = mesh(drehteil('qsRing', [[0.62, 11], [0.96, 11], [1.0, 11.6], [1.0, 14.2], [0.9, 14.9], [0.6, 15]], r, 16), M.qsBlau, parent);
  l.position.set(x, y, z);
  return new THREE.Vector3(x, y + 15, z);
}

// Drosselrückschlagventil (Bauart GRLA, Abluftdrosselung) direkt im Zylinderanschluss, zeigt in +y:
// Einschraubsechskant, Alu-Gehäuse mit seitlicher Drosselschraube und Kontermutter, Steckanschluss oben.
// Anklickbar (öffnet das Weg-Zeit-Diagramm mit den Drosseln); liefert die Schlauchöffnung.
export function drosselVentil(parent, x, y, z, r, kurz) {
  zyl(r * 1.15, 4.2, M.stahl, x, y + 2.1, z, null, parent, 6);                    // Sechskant G1/8
  const w = Math.max(9, r * 2.4), d = Math.max(8, r * 2), h = 14;
  box(w, h, d, M.festoAlu, x, y + 4.2 + h / 2, z, parent);
  zyl(Math.max(1.6, r * 0.45), 7, M.messing, x + w / 2 + 3.5, y + 13, z, 'x', parent, 10);   // Drosselschraube
  zyl(Math.max(2.4, r * 0.7), 2.2, M.stahl, x + w / 2 + 1.1, y + 13, z, 'x', parent, 6);      // Kontermutter
  zyl(r * 0.95, 4, M.stahl, x, y + 4.2 + h + 2, z, null, parent, 16);              // Steckanschluss
  zyl(r, 2.4, M.qsBlau, x, y + 4.2 + h + 5.2, z, null, parent, 16);                // Lösering
  // Klickfläche etwas größer als das Ventil, damit es sich auch aus der Übersicht treffen lässt
  const klick = new THREE.Mesh(cached('drosselKlick', () => new THREE.BoxGeometry(1, 1, 1)), KLICK);
  klick.scale.set(w + 16, h + 20, d + 16); klick.position.set(x, y + 4.2 + h / 2, z);
  klick.userData = { art: 'drossel', taster: kurz };
  parent.add(klick);
  if (kurz) PULT_TASTER.push({ key: 'drossel' + kurz, kappe: klick, art: 'drossel' });
  return new THREE.Vector3(x, y + 4.2 + h + 6.4, z);
}

// Hauptmaße nach ISO 15552 / Festo DSBC (Katalog 2017/12): E Kantenmaß, B Zentrierbund, TG Lochbild Deckel,
// AH Achshöhe Fuß HNC, AU Fußüberstand, US Fußbreite, TR Lochabstand Fuß
const ISO15552 = {
  32: { E: 45, B: 30, TG: 32.5, AU: 24, US: 45, TR: 32 },
  40: { E: 54, B: 35, TG: 38, AU: 28, US: 54, TR: 36 },
  50: { E: 64, B: 40, TG: 46.5, AU: 32, US: 64, TR: 45 },
  63: { E: 75, B: 45, TG: 56.5, AU: 32, US: 75, TR: 50 },
};
const isoMasse = (d) => ISO15552[d] || { E: d + 14, B: Math.round(d * 0.88), TG: Math.round((d + 14) * 0.7), AU: Math.round(d * 0.75), US: d + 14, TR: d };
// Zylinderrohr DSBC: Quadrat mit gerundeten Ecken, T-Nuten für Nutsensoren oben (2x) und seitlich (je 1x, Variante D3)
function dsbcForm(a) {
  const s = new THREE.Shape(), h = a / 2, r = a * 0.09, o = 2.2, hals = 1.4, ib = 3.2, t = 5;
  const nutQuer = (c) => {   // Nut in der Oberseite, Mitte x = c (Laufrichtung −x)
    s.lineTo(c + o, h); s.lineTo(c + o, h - hals); s.lineTo(c + ib, h - hals); s.lineTo(c + ib, h - t);
    s.lineTo(c - ib, h - t); s.lineTo(c - ib, h - hals); s.lineTo(c - o, h - hals); s.lineTo(c - o, h);
  };
  s.moveTo(-h + r, -h); s.lineTo(h - r, -h);
  s.absarc(h - r, -h + r, r, -Math.PI / 2, 0, false);
  for (const [px, py] of [[h, -o], [h - hals, -o], [h - hals, -ib], [h - t, -ib], [h - t, ib], [h - hals, ib], [h - hals, o], [h, o]]) s.lineTo(px, py);
  s.absarc(h - r, h - r, r, 0, Math.PI / 2, false);
  nutQuer(a * NUT_OBEN); nutQuer(-a * NUT_OBEN);
  s.absarc(-h + r, h - r, r, Math.PI / 2, Math.PI, false);
  for (const [px, py] of [[-h, o], [-h + hals, o], [-h + hals, ib], [-h + t, ib], [-h + t, -ib], [-h + hals, -ib], [-h + hals, -o], [-h, -o]]) s.lineTo(px, py);
  s.absarc(-h + r, -h + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}
// Zylinderschraube mit Innengewinde (Deckelbefestigung, zugleich Befestigungsgewinde RT) – Kopf in Achsrichtung
function deckelSchraube(g, x, y, z, s) {
  zyl(4.6, 1, M.verzinkt, x + s * 0.5, y, z, 'x', g, 12);
  zyl(2.3, 1.2, M.schwarz, x + s * 0.7, y, z, 'x', g, 6);
}
// Typschild/Laserbeschriftung am Profil (Festo-Logo, Typschlüssel)
function typSchild(bohrung, hub) {
  return tafel(`dsbc${bohrung}|${hub}`, 70, 9, (c) => {
    c.fillStyle = '#c4c9ce'; c.fillRect(0, 0, 70, 9);
    c.fillStyle = '#1d1f22'; c.font = '700 6px Arial'; c.textBaseline = 'middle'; c.fillText('FESTO', 2, 4.8);
    c.font = '500 3.2px Arial'; c.fillText(`DSBC-${bohrung}-${hub}-PPV-A-N3`, 25, 3.2);
    c.fillStyle = '#3a3e43'; c.font = '400 2.4px Arial'; c.fillText('pmax 12 bar  ·  Made in Germany', 25, 6.6);
  }, 8);
}
// ISO-15552-Profilzylinder (Festo DSBC) entlang lokaler +x (Boden bei x = 0, Stange tritt bei x = laenge aus)
export function profilZylinder(parent, { laenge, bohrung, position, rotation, name, sensoren = [], fuesse = false, seite = 1, drossel = null }) {
  const g = new THREE.Group();
  g.position.copy(position);
  if (rotation) g.rotation.copy(rotation);
  parent.add(g);
  const iso = isoMasse(bohrung), a = iso.E, kap = Math.round(a * 0.42);
  const rohr = cached(`zr${a}|${laenge}`, () => new THREE.ExtrudeGeometry(dsbcForm(a), { depth: laenge - 2 * kap, bevelEnabled: false, curveSegments: 3 }));
  const r = mesh(rohr, M.zylinder, g);
  r.rotation.y = Math.PI / 2; r.position.x = kap;
  // Lagerdeckel/Enddeckel: Alu-Druckguss, quadratisch mit gebrochenen Ecken und Fase
  const kapGeo = cached(`zk${a}|${kap}`, () => {
    const s = new THREE.Shape(), b = (a + 0.6) / 2 - 0.8, f = b * 0.16;
    s.moveTo(-b + f, -b); s.lineTo(b - f, -b); s.lineTo(b, -b + f); s.lineTo(b, b - f); s.lineTo(b - f, b);
    s.lineTo(-b + f, b); s.lineTo(-b, b - f); s.lineTo(-b, -b + f); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: kap - 1.6, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.8, bevelSegments: 1, curveSegments: 2 });
    geo.translate(0, 0, 0.8);
    return geo;
  });
  const tg = iso.TG / 2;
  for (const [x0, s] of [[0, -1], [laenge - kap, 1]]) {
    const k = mesh(kapGeo, M.deckel, g);
    k.rotation.y = Math.PI / 2; k.position.x = x0;
    const xs = s < 0 ? 0 : laenge;
    for (const sy of [-1, 1]) for (const sz of [-1, 1]) deckelSchraube(g, xs, sy * tg, sz * tg, s);
    zyl(2.2, 1.4, M.stahl, x0 + kap / 2, -a * 0.2, seite * (a / 2 + 0.4), 'z', g, 10);   // Stellschraube Endlagendämpfung
  }
  // Zentrierbund Ø B (Länge 4) und Abstreifer an der Stangenseite
  zyl(iso.B / 2, 4, M.deckel, laenge + 2, 0, 0, 'x', g, 28);
  zyl(bohrung * 0.26, 1.6, M.schwarz, laenge + 4.6, 0, 0, 'x', g, 20);
  // drossel = Kurzname des Zylinders: Drosselrückschlagventile statt einfacher Steckverschraubungen
  const anschluss = (px) => drossel ? drosselVentil(g, px, a / 2 + 0.3, 0, a * 0.1, drossel) : steckverschraubung(g, px, a / 2 + 0.3, 0, a * 0.1);
  const portA = anschluss(kap / 2);
  const portB = anschluss(laenge - kap / 2);
  // Laserbeschriftung auf der sensorfreien Seite (unterhalb der Seitennut)
  if (laenge > 160) platte(typSchild(bohrung, Math.max(10, Math.round((laenge - 2 * a) / 10) * 10)), 70, 9, g, laenge / 2, -a * 0.25, -seite * (a / 2 + 0.05), seite > 0 ? Math.PI : 0);
  // Fußbefestigung HNC (verzinktes Stahlblech, Winkel an beiden Deckeln, Fuß zeigt nach außen)
  if (fuesse) {
    const ah = a / 2 + 6, us = iso.US, at = 4;
    const winkel = cached(`hnc${a}|${iso.B}`, () => {
      const s = new THREE.Shape(), yo = Math.min(us / 2, a / 2) - 1, c = 5;
      s.moveTo(-us / 2, -ah); s.lineTo(us / 2, -ah); s.lineTo(us / 2, yo - c); s.lineTo(us / 2 - c, yo); s.lineTo(-us / 2 + c, yo); s.lineTo(-us / 2, yo - c); s.closePath();
      s.holes.push(new THREE.Path().absarc(0, 0, iso.B / 2 + 0.5, 0, Math.PI * 2, true));
      return new THREE.ExtrudeGeometry(s, { depth: at, bevelEnabled: false, curveSegments: 12 });
    });
    for (const [xf, s] of [[0, -1], [laenge, 1]]) {
      const w = mesh(winkel, M.verzinkt, g);
      w.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; w.position.x = xf;
      box(iso.AU - at, at, us, M.verzinkt, xf + s * (at + (iso.AU - at) / 2), -ah + at / 2, 0, g);
      for (const sz of [-1, 1]) zyl(4.5, 2.5, M.schwarz, xf + s * (iso.AU * 0.62), -ah + at + 1.2, sz * iso.TR / 2, null, g, 12);   // Befestigungsschrauben
      for (const sy of [-1, 1]) for (const sz of [-1, 1]) deckelSchraube(g, xf + s * at, sy * tg, sz * tg, s);
    }
  }
  // hinterer Sensor in der oberen Nut, vorderer in der Seitennut (jedes Kabel hat seine eigene Nut)
  [...sensoren].sort((p, q) => p.x - q.x).forEach((s, i) => nutSensor(g, s.x, a, kap, s.signal, s.text, i === 0 ? 'oben' : 'seite', seite));
  label(name, g, laenge / 2, a / 2 + 40, 0, 'cyl');
  return { g, a, portA, portB };
}
