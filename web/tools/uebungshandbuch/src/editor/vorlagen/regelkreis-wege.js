// Vorlage Regelkreis: Wege der Pfeile zwischen Block, Summierstelle, Verzweigung und Signal (Gruppen-Haken verbinde).
// Jeder Baustein hat die Anschlussseiten l, r, u (oben) und d (unten); Verzweigung und Signal sind Punkte (Seite p).
// Ein Weg ist rechtwinklig: Er verlässt A durch die Austrittsseite, läuft in B durch die Eintrittsseite, kreuzt keinen
// anderen Baustein und meldet sich in der Spurbelegung an (spuren.js), damit parallele Pfeile nicht aufeinanderliegen.
import { pfadD } from '../spuren.js';
import { mitteVon, umrissVon } from '../bausteine.js';

export const PUNKTARTEN = ["abzw", "sig"];           // Bausteine ohne Fläche: Pfeile beginnen und enden in ihrer Mitte
export const istPunkt = o => PUNKTARTEN.includes(o.k);
export const RICHTUNG = {l: [-1, 0], r: [1, 0], u: [0, -1], d: [0, 1], p: [0, 0]};
export const GEGENSEITE = {l: "r", r: "l", u: "d", d: "u", p: "p"};
export const STUMMEL = 20;      // so weit laufen Pfeile gerade aus dem Baustein heraus bzw. in ihn hinein
export const UMWEG = 20;        // Abstand eines Umwegs zu einem Baustein
export const KNICKKOSTEN = 40;  // ein Knick zählt so viel wie 40 Einheiten Weg

// Anschlusspunkt von o auf der Seite s
export function anschluss(o, s){
  const [cx, cy] = mitteVon(o);
  if (istPunkt(o)) return [cx, cy];
  const b = umrissVon(o), [rx, ry] = RICHTUNG[s];
  return [cx + rx * b.w / 2, cy + ry * b.h / 2];
}
// Seite, durch die ein Pfeil vom Punkt q in B hineinläuft. Die Summierstelle nimmt nur links, oben und unten auf.
export function eintrittsSeite(B, q){
  if (istPunkt(B)) return "p";
  const b = umrissVon(B), [, cy] = mitteVon(B);
  if (B.k === "sum") return q[1] > b.y + b.h ? "d" : q[1] < b.y ? "u" : "l";
  if (q[0] < b.x) return "l";
  if (q[0] > b.x + b.w) return "r";
  return q[1] < cy ? "u" : "d";
}
// Seite, durch die ein Pfeil A Richtung ziel verlässt. Ein Block gibt gegenüber seinem Eingang aus (eingang:
// Eintrittsseite seines ersten Pfeils), damit auch ein Block in der Rückführung von rechts nach links arbeitet.
export function austrittsSeite(A, ziel, eingang){
  if (istPunkt(A)) return "p";
  const [cx] = mitteVon(A);
  if (A.k === "box" && (eingang === "l" || eingang === "r")) return GEGENSEITE[eingang];
  return ziel[0] < cx ? "l" : "r";
}
// Eintrittsseite des ersten Pfeils, der in o hineinläuft (oder null)
export function eingangVon(o, objs, alle){
  const c = alle.find(x => x.b === o.id && objs[x.a] && x.pa === undefined);
  return c ? eintrittsSeite(o, mitteVon(objs[c.a])) : null;
}

/* ---------- Rechtwinkliger Weg ---------- */
export const stummelPunkt = (p, s, um) => [p[0] + RICHTUNG[s][0] * um, p[1] + RICHTUNG[s][1] * um];
export const aufRaster10 = v => Math.round(v / 10) * 10;
// Mögliche Linienzüge von p1 nach p2: zwei L-Formen und Z-Formen über mehrere Zwischenlagen
export function wegKandidaten(p1, s1, p2, s2, rechtecke){
  const a = stummelPunkt(p1, s1, STUMMEL), z = stummelPunkt(p2, s2, STUMMEL);
  const xs = [aufRaster10((a[0] + z[0]) / 2), a[0], z[0], ...rechtecke.flatMap(b => [b.x - UMWEG, b.x + b.w + UMWEG])];
  const ys = [aufRaster10((a[1] + z[1]) / 2), a[1], z[1], ...rechtecke.flatMap(b => [b.y - UMWEG, b.y + b.h + UMWEG])];
  const mitten = [[[z[0], a[1]]], [[a[0], z[1]]], ...xs.map(x => [[x, a[1]], [x, z[1]]]), ...ys.map(y => [[a[0], y], [z[0], y]])];
  return mitten.map(m => zugBereinigt([p1, a, ...m, z, p2]));
}
// Doppelte Punkte und Punkte auf einer Geraden entfernen
export function zugBereinigt(punkte){
  const p = punkte.filter((q, i) => i === 0 || q[0] !== punkte[i - 1][0] || q[1] !== punkte[i - 1][1]);
  return p.filter((q, i) => i === 0 || i === p.length - 1 || !aufGerade(p[i - 1], q, p[i + 1]));
}
export const aufGerade = (a, b, c) => (a[0] === b[0] && b[0] === c[0]) || (a[1] === b[1] && b[1] === c[1]);
// Richtung eines Abschnitts als Seite (l, r, u, d)
export const richtungVon = (a, b) => a[1] === b[1] ? (b[0] > a[0] ? "r" : "l") : (b[1] > a[1] ? "d" : "u");
// Verlässt der Zug p1 durch s1 und erreicht er p2 durch s2? Nur waagrechte und senkrechte Abschnitte.
export function wegPasst(p, s1, s2){
  if (p.some((q, i) => i > 0 && q[0] !== p[i - 1][0] && q[1] !== p[i - 1][1])) return false;
  if (p.length < 2) return false;
  const anfang = richtungVon(p[0], p[1]), ende = richtungVon(p[p.length - 2], p[p.length - 1]);
  return (s1 === "p" || anfang === s1) && (s2 === "p" || ende === GEGENSEITE[s2]);
}
// Schneidet der Abschnitt a-b das Rechteck b (offen, also nicht nur am Rand)?
export function schneidetRechteck([a, c], r){
  const x1 = Math.min(a[0], c[0]), x2 = Math.max(a[0], c[0]), y1 = Math.min(a[1], c[1]), y2 = Math.max(a[1], c[1]);
  return x1 < r.x + r.w && x2 > r.x && y1 < r.y + r.h && y2 > r.y;
}
export const wegFrei = (p, rechtecke) => !p.some((q, i) => i > 0 && rechtecke.some(r => schneidetRechteck([p[i - 1], q], r)));
export function wegKosten(p){
  let l = 0;
  for (let i = 1; i < p.length; i++) l += Math.abs(p[i][0] - p[i - 1][0]) + Math.abs(p[i][1] - p[i - 1][1]);
  return l + KNICKKOSTEN * (p.length - 2);
}
// Bester Weg von p1 (Seite s1) nach p2 (Seite s2), der kein Rechteck aus hindernisse schneidetRechteck
export function rechtwinklig(p1, s1, p2, s2, hindernisse){
  const alle = wegKandidaten(p1, s1, p2, s2, hindernisse);
  const gute = alle.filter(p => wegPasst(p, s1, s2) && wegFrei(p, hindernisse)).sort((a, b) => wegKosten(a) - wegKosten(b));
  const notfalls = alle.filter(p => wegPasst(p, s1, s2)).sort((a, b) => wegKosten(a) - wegKosten(b));
  return gute[0] || notfalls[0] || [p1, p2];
}

/* ---------- Haken verbinde der Gruppe ---------- */
// Umrisse, die ein Weg von A nach B nicht kreuzen darf: andere Bausteine etwas größer, A und B etwas kleiner
export function hindernisseFuer(A, B, objs){
  const groesser = (b, um) => ({x: b.x - um, y: b.y - um, w: b.w + 2 * um, h: b.h + 2 * um});
  return Object.values(objs).filter(o => !istPunkt(o) && !o.id.startsWith("_"))
    .map(o => groesser(umrissVon(o), o === A || o === B ? -2 : 6));
}
// Linienzug eines Pfeils von A nach B, dazu die Seiten an beiden Enden
export function pfeilZug(A, B, objs, alle){
  const s2 = eintrittsSeite(B, mitteVon(A)), p2 = anschluss(B, s2);
  const s1 = austrittsSeite(A, p2, eingangVon(A, objs, alle)), p1 = anschluss(A, s1);
  return {punkte: rechtwinklig(p1, s1, p2, s2, hindernisseFuer(A, B, objs)), s1, s2};
}
// Lage der Beschriftung: über der Mitte des längsten waagrechten Abschnitts, sonst neben dem längsten senkrechten
export function beschriftungsOrt(p){
  const abschnitte = p.slice(1).map((q, i) => [p[i], q]), laenge = ([a, b]) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  const waagrecht = abschnitte.filter(([a, b]) => a[1] === b[1]).sort((x, y) => laenge(y) - laenge(x))[0];
  if (waagrecht) return [(waagrecht[0][0] + waagrecht[1][0]) / 2, waagrecht[0][1] - 7, "middle"];
  const [a, b] = abschnitte.sort((x, y) => laenge(y) - laenge(x))[0];
  return [a[0] + 7, (a[1] + b[1]) / 2 + 4, "start"];
}
// Haken verbinde(c, A, B, objs, alle, spuren): Weg, Pfeilspitze (nicht in eine Verzweigung) und Beschriftung
export function verbindeRegelkreis(c, A, B, objs, alle, spuren){
  const {punkte} = pfeilZug(A, B, objs, alle);
  const zug = spuren.knick(punkte, A.id);
  return {d: pfadD(zug), arrow: B.k !== "abzw", lbl: beschriftungsOrt(zug)};
}
