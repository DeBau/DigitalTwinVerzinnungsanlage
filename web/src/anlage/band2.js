import * as THREE from 'three';
import { anlage } from '../core/szene.js';
import { B2, BAND, BAND2, LS_POS } from './baender.js';
import { getriebemotor, gurtband, inkrementalgeber } from '../bauteile/foerderer.js';
import { lichtschranke } from '../bauteile/lichtschranke.js';

// --- Band 2 (Abtransport nach rechts): lokale Gruppe, lokal +z = Welt +x, lokal +x = Welt −z (Rückseite) ---
export const b2g = new THREE.Group(); b2g.position.set(B2.xm, 0, B2.z); b2g.rotation.y = Math.PI / 2; anlage.add(b2g);
export const B2x = (x) => x - B2.xm;                                          // Welt-x → lokal z
{
  const r = gurtband(b2g, B2.L, {
    beine: [520, 1120, 1820, 2520].map(B2x), stuetzrollen: [800, 1500, 2200].map(B2x),
    fuehrung: [[B2x(B2.x0 + 60), B2x(B2.x1 - 60)]], halter: [600, 900, 1800, 2250, 2600].map(B2x), welleKopf: 1, welleEnde: -1, draht: true,
  });
  Object.assign(B2, r);
  BAND2.trommeln = r.trommeln;
}
export const B2_MOTOR = getriebemotor(b2g, B2.TZ, 1, 'Antrieb Band 2 −MA2');
BAND.geber2Stecker = inkrementalgeber(b2g, B2.trommeln[0], -1, '−BG27 Inkrementalgeber Band 2');
export const E2 = B2.xm + B2.H - 49 - 6 - 55;                                   // Korbmitte am Bandende (Übergabe auf die Kippmulde)
// Lichtschranken Band 2 (Sensoren auf der Rückseite, Reflektoren vorn): −BG21 hinter der Umlenktrommel am Bandanfang,
// −BG22 im Kühltunnel, −BG24 kurz vor dem Kopf (Korb wartet bei E2 auf die Kippmulde, Strahl 30 mm vor der Korbmitte)
for (const [sig, txt] of [['BG21_B2_Anfang', '−BG21 Band 2 Anfang'], ['BG22_B2_Kuehlung', '−BG22 Kühlplatz'], ['BG24_B2_Ende', '−BG24 Band 2 Ende']]) {
  lichtschranke(B2x(LS_POS[sig]), sig, txt, { parent: b2g, seite: 1 });
}
