import { M } from '../core/materialien.js';
import { box, zyl } from '../core/geometrie.js';
import { rohr } from './leitungen.js';

// ----------------------------------------------------------------------------
// Stahlpanzerrohr (Stapa) verzinkt mit Bodenschellen: schützt Leitungen, die am Hallenboden zu einer Kabelwanne laufen.
//  pts: Leitungsweg in Anlagenkoordinaten, rechtwinklig verlegt. Das Rohr ist starr und nur gerade: je Abschnitt ein
//  Stück mit Einführungstüllen an beiden Enden. An einer Richtungsänderung endet es um luecke vor der Ecke, die Leitung
//  geht frei im Bogen hinüber ins nächste Stück. Stücke am Boden (y = r) bekommen höchstens alle 700 mm eine
//  Bügelschelle mit zwei Dübeln.
// vorn / hinten: Rohr am Anfang bzw. Ende um so viel kürzer als der Leitungsweg (die Leitung fällt dort frei herunter
// bzw. steigt frei auf und braucht Platz für ihren Bogen)
export function stapa(punkte, r = 10, vorn = 0, hinten = 0, luecke = 50) {
  const pts = punkte.filter((p, i) => !i || p.distanceTo(punkte[i - 1]) > 0.5);
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], q = pts[i], d = q.clone().sub(p).normalize();
    const p0 = p.clone().addScaledVector(d, i > 1 ? luecke : vorn), q0 = q.clone().addScaledVector(d, -(i < pts.length - 1 ? luecke : hinten));
    if (q0.clone().sub(p0).dot(d) < 30) continue;                         // zu kurz für ein eigenes Stück
    rohr([p0, q0], M.verzinkt, r, 1);
    tuelle(p0, q0, r); tuelle(q0, p0, r);
    if (Math.abs(p.y - r) < 1 && Math.abs(q.y - r) < 1) {
      const n = Math.ceil((p0.distanceTo(q0) - 200) / 700);
      for (let k = 0; k < n; k++) schelle(p0.clone().lerp(q0, (k + 0.5) / n), Math.abs(d.x) > Math.abs(d.z), r);
    }
  }
}
// Einführungstülle am Rohrende e (davor liegt der Punkt v)
function tuelle(e, v, r) {
  const d = e.clone().sub(v).normalize(), achse = Math.abs(d.y) > 0.5 ? null : Math.abs(d.x) > 0.5 ? 'x' : 'z';
  zyl(r + 1.5, 14, M.kunststoff, e.x - d.x * 5, e.y - d.y * 5, e.z - d.z * 5, achse, undefined, 16);
}
// Bügelschelle über dem Rohr, Füße beidseits mit je einem Dübel (inX: Rohr läuft in x)
function schelle(p, inX, r) {
  const w = 14;
  box(inX ? w : 2 * r + 6, 2, inX ? 2 * r + 6 : w, M.verzinkt, p.x, 2 * r + 1, p.z);
  for (const s of [-1, 1]) {
    const o = s * (r + 9);
    box(inX ? w : 12, 2, inX ? 12 : w, M.verzinkt, p.x + (inX ? 0 : o), 1, p.z + (inX ? o : 0));
    box(inX ? w : 2, 2 * r, inX ? 2 : w, M.verzinkt, p.x + (inX ? 0 : s * (r + 2)), r, p.z + (inX ? s * (r + 2) : 0));
    zyl(3, 3, M.stahl, p.x + (inX ? 0 : o), 3, p.z + (inX ? o : 0), null, undefined, 6);
  }
}
