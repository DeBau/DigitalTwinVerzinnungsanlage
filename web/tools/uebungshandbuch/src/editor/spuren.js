// Editor-Kern: Spurbelegung für Leitungen und Verbindungen. zeichnungSVG legt je Zeichnung eine Belegung an und reicht sie
// an verbindungsWeg weiter (Leitungen: wireD, Ketten: routeV, Gruppen: Haken verbinde, Seitenbausteine: seite.verbinde).
// Ein Weg meldet seine Abschnitte an und bekommt eine freie Spur: Abschnitte verschiedener Netze liegen dann nicht
// deckungsgleich übereinander. Ein Netz ist ein Text wie "a:pa" (Objekt-ID und Anschluss).
// Solange niemand belege oder knick aufruft, ändert sich kein Weg. Mit sperre meldet zeichnungSVG die Kennzeichen der
// Bauteile und ihre Anschlüsse als Flächen, durch die kein Weg läuft (kennzeichenSperren, anschlussSperren in bauteile.js).

// Versuchte Verschiebungen in Rasterschritten: erst die Ausgangslage, dann abwechselnd darüber und darunter
export const SPUR_FOLGE = [0, 1, -1, 2, -2, 3, -3];

// Neue, leere Belegung. raster ist der Abstand zweier Spuren.
export function neueSpuren(raster = 10){
  const belegt = {h: [], v: []};   // waagrechte Abschnitte (lage = y) und senkrechte (lage = x)
  return {
    raster,
    belege: (achse, lage, von, bis, netz) => belegeSpur(belegt[achse], raster, lage, von, bis, netz),
    knick: (punkte, netz) => knickeWeg(belegt, raster, punkte, netz),
    // Rechteck für alle Netze sperren (Kennzeichen eines Bauteils): Abschnitte weichen ihm aus wie einer belegten Spur
    sperre: (x, y, w, h) => {
      belegt.h.push({lage: y, dicke: h, von: x, bis: x + w, netz: null});
      belegt.v.push({lage: x, dicke: w, von: y, bis: y + h, netz: null});
    },
  };
}

// Liegt auf Spur lage zwischen von und bis schon ein Abschnitt eines anderen Netzes? Ein gesperrtes Rechteck belegt
// alle Spuren von lage bis lage + dicke.
export function spurFrei(liste, lage, von, bis, netz){
  const a = Math.min(von, bis), b = Math.max(von, bis), trifft = s => lage > s.lage - 1 && lage < s.lage + (s.dicke || 0) + 1;
  return !liste.some(s => s.netz !== netz && trifft(s) && s.von < b && a < s.bis);
}

// Abschnitt anmelden; Rückgabe ist die belegte Lage (die Ausgangslage, wenn keine Spur in SPUR_FOLGE frei ist)
export function belegeSpur(liste, raster, lage, von, bis, netz){
  const frei = SPUR_FOLGE.map(k => lage + k * raster).find(l => spurFrei(liste, l, von, bis, netz));
  const l = frei ?? lage;
  liste.push({lage: l, von: Math.min(von, bis), bis: Math.max(von, bis), netz});
  return l;
}

// Rechtwinkligen Linienzug anmelden. Die inneren Abschnitte weichen auf eine freie Spur aus, der erste und der
// letzte bleiben, weil sie an Anschlüssen hängen. Eine Spur gilt erst als frei, wenn auch die beiden Nachbarstücke,
// die sich mit ihr verlängern oder verkürzen, frei sind (sonst nur der Abschnitt selbst). Rückgabe: die neuen Punkte.
export function knickeWeg(belegt, raster, punkte, netz){
  const p = punkte.map(q => [...q]);
  for (let i = 1; i + 2 < p.length; i++) {
    const [a, b] = [p[i], p[i + 1]], waagrecht = Math.abs(a[1] - b[1]) < 1;
    const achse = waagrecht ? "h" : "v", k = waagrecht ? 1 : 0, j = 1 - k;
    const lagen = SPUR_FOLGE.map(s => a[k] + s * raster).filter(l => spurFrei(belegt[achse], l, a[j], b[j], netz));
    const l = lagen.find(l => nachbarnFrei(belegt[waagrecht ? "v" : "h"], p, i, k, l, netz)) ?? lagen[0] ?? a[k];
    a[k] = l; b[k] = l;
  }
  p.slice(1).forEach((b, i) => {
    const a = p[i], waagrecht = Math.abs(a[1] - b[1]) < 1, k = waagrecht ? 1 : 0;
    belegeSpur(belegt[waagrecht ? "h" : "v"], raster, a[k], a[1 - k], b[1 - k], netz);
  });
  return p;
}
// Sind die Nachbarstücke von Abschnitt i (p[i] → p[i + 1]) frei, wenn er auf Lage l liegt? Die äußeren Enden
// (Anschluss oder Knick) zählen nicht mit, nur die Strecke bis 5 davor.
export function nachbarnFrei(liste, p, i, k, l, netz){
  const frei = (q, ende) => { const r = ende[k] < l ? 1 : -1; return spurFrei(liste, q[1 - k], ende[k] + 5 * r, l, netz); };
  return frei(p[i], p[i - 1]) && frei(p[i + 1], p[i + 2]);
}

// Linienzug als SVG-Pfad
export const pfadD = punkte => "M" + punkte.map(q => q.join(" ")).join("L");
