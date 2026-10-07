/* ---------- Interaktive Erklärungen: Verknüpfung als FUP und KOP ---------- */
// Zeichnet eine Verknüpfung im Programmstatus wie in TIA: grün durchgezogen = erfüllt (1), blau gestrichelt = nicht erfüllt (0).
// op (aus logik.js): {fup: Symbol im Kasten, ein: [{sig, neg}] Eingänge, kop: [[{sig, neg}]] Zweige mit Kontakten}
// werte: {a, b, q} als 0/1, namen: {a, b, q} Operanden.
import { iaLinie, iaStrich, iaSvg, iaText } from './basis.js';

const durch = (k, werte) => k.neg ? !werte[k.sig] : !!werte[k.sig];   // Kontakt geschlossen bzw. Eingang erfüllt

/* ---------- FUP ---------- */
function fupEingang(e, y, werte, namen){
  const neg = e.neg ? `<circle cx="136" cy="${y}" r="4" ${iaStrich(werte[e.sig])} fill="var(--panel)"/>` : "";
  return iaText(100, y - 7, namen[e.sig], "ia-op") + iaLinie(60, y, e.neg ? 132 : 140, y, werte[e.sig]) + neg;
}
function fupZuweisung(x, werte, namen){
  return iaText(x + 25, 47, namen.q, "ia-op") + `<rect x="${x}" y="55" width="50" height="40" rx="3" ${iaStrich(werte.q)} fill="none"/>`
    + iaText(x + 25, 81, "=", "ia-sym");
}
export function fupSVG(op, werte, namen){
  const ys = op.ein.length === 1 ? [75] : [50, 100];
  const ein = op.ein.map((e, i) => fupEingang(e, ys[i], werte, namen)).join("");
  // NICHT: der negierte Eingang geht direkt auf die Zuweisung
  if (!op.fup) return iaSvg(330, 140, ein + fupZuweisung(140, werte, namen), "FUP");
  const kasten = `<rect x="140" y="30" width="60" height="90" rx="3" ${iaStrich(werte.q)} fill="none"/>` + iaText(170, 52, op.fup, "ia-sym");
  return iaSvg(330, 140, ein + kasten + iaLinie(200, 75, 250, 75, werte.q) + fupZuweisung(250, werte, namen), "FUP");
}

/* ---------- KOP ---------- */
export function kopKontakt(k, x, y, an, namen){
  const schraeg = k.neg ? `<line x1="${x - 7}" y1="${y + 11}" x2="${x + 7}" y2="${y - 11}" ${iaStrich(an)}/>` : "";
  return iaText(x, y - 18, namen[k.sig], "ia-op")
    + `<line x1="${x - 7}" y1="${y - 12}" x2="${x - 7}" y2="${y + 12}" ${iaStrich(an)}/><line x1="${x + 7}" y1="${y - 12}" x2="${x + 7}" y2="${y + 12}" ${iaStrich(an)}/>` + schraeg;
}
// Ein Zweig: Strom fließt von der Schiene durch alle Kontakte; jedes Leitungsstück zeigt, ob bis dorthin Strom ankommt
function kopZweig(zweig, y, werte, namen){
  let strom = true, x = 20, svg = "";
  zweig.forEach((k, i) => {
    const kx = 80 + i * 90;
    svg += iaLinie(x, y, kx - 7, y, strom);
    const zu = durch(k, werte);
    svg += kopKontakt(k, kx, y, zu, namen);
    strom = strom && zu; x = kx + 7;
  });
  return {svg: svg + iaLinie(x, y, 250, y, strom), strom};
}
export function kopSVG(op, werte, namen){
  const ys = op.kop.map((_, i) => 50 + i * 70), hoehe = ys[ys.length - 1] + 40;
  const zweige = op.kop.map((z, i) => kopZweig(z, ys[i], werte, namen));
  const schiene = `<line x1="20" y1="20" x2="20" y2="${hoehe - 10}" class="ia-schiene"/>`;
  const sammel = ys.length > 1 ? iaLinie(250, ys[0], 250, ys[ys.length - 1], werte.q) : "";
  const spule = iaText(300, ys[0] - 18, namen.q, "ia-op") + iaLinie(250, ys[0], 288, ys[0], werte.q)
    + `<path d="M292 ${ys[0] - 12} q-8 12 0 24 M308 ${ys[0] - 12} q8 12 0 24" ${iaStrich(werte.q)} fill="none"/>`;
  return iaSvg(340, hoehe, schiene + zweige.map(z => z.svg).join("") + sammel + spule, "KOP");
}
