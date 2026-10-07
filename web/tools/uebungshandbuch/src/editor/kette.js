// Editor-Kern: Ablaufkette. Bausteine einer Gruppe mit `kette: true` (GRAFCET, Steuerstrompfad) hängen sich
// senkrecht untereinander, docken an Nachbarn an und werden mit senkrechten Linien verbunden.
// Seitenbausteine (GRAFCET-Aktionen) hängen sich rechts an; ihr Verhalten steht im Haken `seite` der Bausteinart.
// Benutzt von zeichnen.js (Verbindungslinien) und andocken.js (Setzen, Ziehen).
import { ED } from './status.js';
import { BAUSTEIN, art } from './registry.js';
import { gruppeVon, gruppenId, kettenAus, kettenEin, mitteVon, umrissVon } from './bausteine.js';
import { markiertesObjekt } from './auswahl.js';

// Seitenbaustein-Haken eines Objekts bzw. eines Paletteneintrags (Palettenvarianten zeigen über mk.k auf die Grundart)
export const seite = o => o && art(o.k).seite;
export function seitenArt(k){
  if (!BAUSTEIN[k]) return null;
  const grund = (BAUSTEIN[k].mk && BAUSTEIN[k].mk.k) || k;
  return art(grund).seite || null;
}

// Senkrechte Verbindung von unten aus A nach oben in B, bei Rücksprüngen links vorbei mit Pfeil nach oben.
// Rücksprünge melden ihre Bahn in spuren (spuren.js) an: Zwei Rücksprünge liegen dann nie deckungsgleich übereinander.
// objs (Liste der Bausteine, optional): Die Bahn des Rücksprungs läuft links an allen vorbei, die sie kreuzen würde.
export function routeV([x1, y1], [x2, y2], spuren, objs){
  const p = {p1: [x1, y1], p2: [x2, y2]};
  if (y2 > y1 + 4) {
    if (Math.abs(x1 - x2) < 1) return {...p, d: `M${x1} ${y1}V${y2}`};
    const m = Math.round((y1 + y2) / 20) * 10;
    return {...p, d: `M${x1} ${y1}V${m}H${x2}V${y2}`};
  }
  const bahn = freieBahn(objs, Math.min(x1, x2) - 50, y2 - 20, y1 + 20);
  return {...p, ...ruecksprung([x1, y1], [x2, y2], spuren, bahn)};
}
// Senkrechte Bahn bei x zwischen oben und unten: Kreuzt sie einen Baustein (mit 10 Abstand), weicht sie 30 links
// an ihm vorbei, so lange, bis sie frei ist (z. B. am linken Zweig einer UND-Verzweigung vorbei). Fände sie erst
// links vom Blattrand Platz, bleibt sie bei x.
export function freieBahn(objs, x, oben, unten){
  const boxen = (objs || []).map(umrissVon).filter(b => b.y < unten && b.y + b.h > oben);
  let bahn = x;
  for (let b = null; (b = boxen.find(q => q.x - 10 < bahn && bahn < q.x + q.w + 10)); ) bahn = b.x - 30;
  return bahn >= 20 ? bahn : x;
}
// Rücksprung: 20 unter A nach links auf die Bahn (50 neben der Kette oder links an den Zweigen vorbei), hoch bis
// 20 über B, hinein in B. Netz ist der Startpunkt; die Bahn und die waagrechten Stücke weichen auf eine freie Spur aus.
export function ruecksprung([x1, y1], [x2, y2], spuren, lane = Math.min(x1, x2) - 50){
  const ya = y1 + 20, yb = y2 - 20;
  const roh = [[x1, y1], [x1, ya], [lane, ya], [lane, yb], [x2, yb], [x2, y2]];
  const [, [, ya2], [lane2], [, yb2]] = spuren ? spuren.knick(roh, `${x1}:${y1}`) : roh;
  return {d: `M${x1} ${y1}V${ya2}H${lane2}V${yb2}H${x2}V${y2}`, up: [lane2, (ya2 + yb2) / 2]};
}

// Linie von A nach B innerhalb einer Kette; spuren geht an routeV bzw. den Haken seite.verbinde. Hat die Gruppe den
// Haken ruecksprungFrei (GRAFCET), bekommt routeV die Bausteine der Gruppe: Die Rücksprungbahn weicht ihnen aus.
export function verbindeKette(A, B, spuren, objs){
  const s = seite(B);
  if (s) return s.verbinde(A, B, spuren);
  const von = kettenAus(A, mitteVon(B)[0]);
  const g = gruppenId(A), hindernisse = gruppeVon(A).ruecksprungFrei && Object.values(objs || {}).filter(o => gruppenId(o) === g);
  return routeV(von, kettenEin(B, von[0]), spuren, hindernisse || null);
}

// An welchen Baustein hängt sich ein neuer Baustein der Palettenart k? Der markierte, wenn er zur selben Kette gehört.
export function kettenQuelle(k){
  const A = !ED.ausPalette && markiertesObjekt();   // beim Ziehen entscheidet die Ablagestelle (Andocken), nicht die Markierung
  if (!A || !gruppeVon(A).kette || gruppenId(A) !== BAUSTEIN[k].g) return null;
  const neuSeite = seitenArt(k);
  if (seite(A)) return neuSeite ? A : null;
  if (neuSeite) return neuSeite.quelle(A);
  return A;
}

// Neuen Baustein o unter bzw. neben A ausrichten. Mit dem Haken teilung der Bausteinart liegt sein Kettenanschluss
// fest teilung unter dem von A (GRAFCET: Teilung 100), sonst bleibt die Höhe vom Klick.
export function ausrichten(o, A, pt){
  const s = seite(o);
  if (s) return s.ausrichten(o, A, pt);
  const [ax, ay] = kettenAus(A, mitteVon(o)[0]), teilung = art(o.k).teilung;
  o.x = ax - (art(o.k).einrueck || 0);
  if (teilung !== undefined) o.y += ay + teilung - kettenEin(o, ax)[1];
}

/* Andocken: Anschluss in der Nähe eines passenden Anschlusses → ausrichten und beim Loslassen verbinden.
   Ergebnis {a, b, d, sx, sy, pa?, pb?}: Verbindung a → b (mit pa, pb zwischen Anschlüssen), Abstand d, Verschiebung von o.
   Der Haken andocke(o, andere) der Gruppe ersetzt die Suche, sonst docken nur Ketten an (andockKette). */
export function andockStelle(o){
  const g = gruppenId(o), gruppe = gruppeVon(o);
  if (!ED.dock) return null;
  const others = ED.data.o.filter(p => p.id !== o.id && gruppenId(p) === g);
  if (gruppe.andocke) return gruppe.andocke(o, others);
  if (!gruppe.kette) return null;
  return andockKette(o, others);
}
// Andocken in einer Kette: oben bzw. unten an einen Nachbarn in höchstens weite Abstand, Seitenbausteine über seite.andocken
export function andockKette(o, others, weite = 140){
  let best = null;
  const take = c => { if (!best || c.d < best.d) best = c; };
  const s = seite(o);
  if (s) { s.andocken(o, others, take); return best; }
  for (const p of others) {
    if (seite(p)) continue;
    const po = kettenAus(p, mitteVon(o)[0]), oi = kettenEin(o, po[0]), dy1 = oi[1] - po[1], dx1 = po[0] - oi[0];
    if (dy1 >= 10 && dy1 <= weite && Math.abs(dx1) <= 30) take({a: p.id, b: o.id, d: Math.abs(dx1) + dy1/4, sx: dx1, sy: 0});
    const oo = kettenAus(o, mitteVon(p)[0]), pi = kettenEin(p, oo[0]), dy2 = pi[1] - oo[1], dx2 = pi[0] - oo[0];
    if (dy2 >= 10 && dy2 <= weite && Math.abs(dx2) <= 30) take({a: o.id, b: p.id, d: Math.abs(dx2) + dy2/4, sx: dx2, sy: 0});
  }
  return best;
}

// Punkt, an dem die Andock-Vorschau den Anschluss in B markiert
export function andockPunkt(A, B){
  const s = seite(B);
  if (s) return s.punkt(A, B);
  return kettenEin(B, kettenAus(A, mitteVon(B)[0])[0]);
}
