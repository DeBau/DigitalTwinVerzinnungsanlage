import * as THREE from 'three';
import { M } from '../core/materialien.js';
import { V, box, zyl } from '../core/geometrie.js';
import { leitung } from '../bauteile/leitungen.js';
import { kabelrinne } from '../bauteile/kabelrinne.js';
import { B2 } from './baender.js';
import { B2x, b2g } from './band2.js';
import { BRUECKE, lage } from './kabelbruecke.js';

// ----------------------------------------------------------------------------
// Kabelwanne gelocht 60 × 35 hinter Band 2 (lokal in b2g: x = 365 … 425, Boden y = 310), vom Bandanfang (Welt x 470)
// bis zum Bandkopf (Welt x 2790). Sie läuft hinter dem Kühlwassertank vorbei (Tankrückwand x = 340) über der
// Kabelbrücke am Boden. Getragen von Bodenstützen (Fuß neben der Kabelbrücke, Ausleger unter die Wanne) und im
// Tankbereich von Wandkonsolen an der Tankrückwand. Am Bandanfang biegt die Wanne nach unten ab: senkrechtes Fallstück
// (Boden innen, Öffnung nach außen), unten eine Einführungshaube auf der Kabelbrücke, durch die die Leitungen senkrecht
// unter die Abdeckung gehen und darin zum Schaltschrank laufen.
// Spuren: 6 nebeneinander (x = 372 … 412), je 2 Lagen. In jeder Spur liegt die weiter hinten eingelegte Leitung unten.
// ----------------------------------------------------------------------------
export const WB2 = { x: 395, B: 60, H: 35, y: 310, z0: B2x(470), z1: B2x(2790) };
WB2.zFall = WB2.z0 - 9;                                   // Bodenebene des Fallstücks (Ende des Wannenbodens)
const HAUBE = { h: 40 };
const spurX = (i) => WB2.x - 23 + 8 * i;
const lageY = (e) => WB2.y + 4 + 7 * e;
{
  const { x, B, H, y, z0, z1 } = WB2;
  const wanne = kabelrinne(V(0, 0, 0), 0, { L: z1 - z0 + 9, B, H, enden: [z1 - z0 + 9] });
  b2g.add(wanne); wanne.position.set(x, y, z0 - 9); wanne.rotation.y = -Math.PI / 2;
  // Fallstück: Boden senkrecht in Verlängerung des Wannenbodens (Ebene z = WB2.zFall), Seiten bei x ± 30, offen nach −z
  const fall = kabelrinne(V(0, 0, 0), 0, { L: y - HAUBE.h, B, H });
  b2g.add(fall); fall.position.set(x, y, WB2.zFall);
  fall.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, -1, 0), V(0, 0, -1), V(1, 0, 0)));
  // Einführungshaube (Kunststoff) auf der Kabelbrücke unter dem Fallstück: Leitungen gehen darin senkrecht unter die Abdeckung
  box(B + 8, HAUBE.h, H + 10, M.kunststoff, x, HAUBE.h / 2, WB2.zFall - H / 2, b2g);
  box(B + 14, 4, H + 16, M.kunststoff, x, HAUBE.h - 2, WB2.zFall - H / 2, b2g);              // Kragen, Fallstück steckt darin
  // Bodenstützen: Fußplatte neben der Kabelbrücke (lokal x 250 … 350), Stiel C 41, Ausleger unter der Wanne
  for (const wx of [560, 900, 1650, 2000, 2350, 2700]) {
    const z = B2x(wx), h = y - 21 - 6;
    box(100, 6, 100, M.verzinkt, 300, 3, z, b2g);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) zyl(7, 3, M.stahl, 300 + sx * 36, 7.5, z + sz * 36, null, b2g, 6);
    box(41, h, 41, M.verzinkt, 300, 6 + h / 2, z, b2g);
    box(150, 21, 41, M.verzinkt, 355, y - 10.5, z, b2g);
    box(3, 21, 41, M.kunststoff, 431.5, y - 10.5, z, b2g);                                         // Endkappe Ausleger
  }
  // Wandkonsolen an der Tankrückwand (Tank lokal x 180 … 340, Welt x 1180 … 1540)
  for (const wx of [1210, 1330, 1420]) {
    const z = B2x(wx);
    box(4, 50, 30, M.verzinkt, 342, y - 25, z, b2g);
    box(88, 6, 30, M.verzinkt, 386, y - 3, z, b2g);
    zyl(4, 3, M.stahl, 345.5, y - 35, z, 'x', b2g, 6);
  }
}
// Leitung in die Wanne legen: pkte = Weg bis über die Einlegestelle (letzter Punkt oberhalb der Wanne, lokal b2g).
// Danach: zur Spur, hinunter auf die Lage, die Wanne entlang und über die Kante ins Fallstück (gleicher Abstand vom
// Boden, die untere Lage innen), in der Haube senkrecht unter die Abdeckung, darin in ihre Lage und zum Schrank.
export function inWanneB2(spur, ebene, pkte, mat = M.kabelGrau, r = 2.6) {
  const x = spurX(spur), y = lageY(ebene), e = pkte[pkte.length - 1], zF = WB2.zFall - (y - WB2.y);
  const d = lage(), lx = B2.z - (BRUECKE.z + d), zB = BRUECKE.x + d - B2.xm;
  return leitung([...pkte, V(x, e.y, e.z), V(x, y, e.z), V(x, y, zF), V(x, 6, zF), V(lx, 14, zF - 120), V(lx, 14, zB), V(B2.z + 60, 14, zB)], mat, r, 14, b2g);
}
// Punkt aus Anlagenkoordinaten in b2g-Koordinaten
export const inB2 = (p) => V(B2.z - p.z, p.y, p.x - B2.xm);
