/* ---------- Interaktive Erklärungen: Box einer Anweisung mit Instanz (FUP, KOP) und SCL mit Status ---------- */
// Zeichnet eine Anweisungsbox wie in TIA im Programmstatus (IEC-Zeiten, IEC-Zähler): oben der Instanzname, im Kasten
// Anweisung und Datentyp (TON, Time), links die Eingänge, rechts die Ausgänge.
// box: {inst, titel, typ, ein: [Pin], aus: [Pin]}, Pin: {pin: "IN", name: Operand, wert, bool}
//   bool: binärer Pin, wert 0/1, Leitung grün durchgezogen (1) oder blau gestrichelt (0)
//   sonst: Wert-Pin (Zeit, Zahl), wert ist der Text, den der Programmstatus unter dem Operanden zeigt
// In KOP fließt der Strom über den ersten Eingang hinein (Kontakt mit seinem Operanden) und über den ersten Ausgang
// hinaus (Spule mit seinem Operanden). Die übrigen Pins tragen ihre Operanden wie in FUP.
import { esc } from '../basis.js';
import { iaLinie, iaName, iaStrich, iaSvg, iaText } from './basis.js';

const BX_LINKS = 150, BX_RECHTS = 240, BX_OBEN = 86, BX_ZEILE = 34, BX_BREITE = 410;
const bxY = i => BX_OBEN + i * BX_ZEILE;
const bxUnten = box => bxY(Math.max(box.ein.length, box.aus.length) - 1) + 18;

/* ---------- Pins ---------- */
function bxLeitung(x1, x2, y, p){
  return p.bool ? iaLinie(x1, y, x2, y, p.wert) : `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" class="bx-wert"/>`;
}
const bxStatus = (x, y, p, anker) => p.bool ? "" : iaText(x, y + 16, p.wert, "bx-status", anker);
function bxEingang(p, y, x0 = 24){
  return bxLeitung(x0, BX_LINKS, y, p) + iaText(BX_LINKS - 8, y - 7, p.name, "ia-op", "end")
    + bxStatus(BX_LINKS - 8, y, p, "end") + iaText(BX_LINKS + 6, y + 4, p.pin, "bx-pin", "start");
}
function bxAusgang(p, y){
  return bxLeitung(BX_RECHTS, BX_LINKS + 230, y, p) + iaText(BX_RECHTS + 8, y - 7, p.name, "ia-op", "start")
    + bxStatus(BX_RECHTS + 8, y, p, "start") + iaText(BX_RECHTS - 6, y + 4, p.pin, "bx-pin", "end");
}

/* ---------- Kasten ---------- */
function bxKasten(box){
  const mitte = (BX_LINKS + BX_RECHTS) / 2;
  return iaText(mitte, 16, box.inst, "ia-op") + `<rect x="${BX_LINKS}" y="26" width="${BX_RECHTS - BX_LINKS}" height="${bxUnten(box) - 26}" rx="3" class="bx-kasten"/>`
    + iaText(mitte, 46, box.titel, "bx-titel") + iaText(mitte, 63, box.typ, "bx-typ");
}
export function bxFupSVG(box){
  const ein = box.ein.map((p, i) => bxEingang(p, bxY(i))).join("");
  const aus = box.aus.map((p, i) => bxAusgang(p, bxY(i))).join("");
  return iaSvg(BX_BREITE, bxUnten(box) + 26, bxKasten(box) + ein + aus, `FUP: ${box.titel}`);
}

/* ---------- KOP ---------- */
function bxKontakt(p, y){
  const x = 72;
  return iaLinie(14, y, x - 7, y, 1) + iaText(x, y - 18, p.name, "ia-op")
    + `<line x1="${x - 7}" y1="${y - 12}" x2="${x - 7}" y2="${y + 12}" ${iaStrich(p.wert)}/><line x1="${x + 7}" y1="${y - 12}" x2="${x + 7}" y2="${y + 12}" ${iaStrich(p.wert)}/>`
    + iaLinie(x + 7, y, BX_LINKS, y, p.wert) + iaText(BX_LINKS + 6, y + 4, p.pin, "bx-pin", "start");
}
function bxSpule(p, y){
  const x = 362;
  return iaLinie(BX_RECHTS, y, x - 10, y, p.wert) + iaText(x, y - 18, p.name, "ia-op") + iaText(BX_RECHTS - 6, y + 4, p.pin, "bx-pin", "end")
    + `<path d="M${x - 6} ${y - 12} q-8 12 0 24 M${x + 6} ${y - 12} q8 12 0 24" ${iaStrich(p.wert)} fill="none"/>`;
}
export function bxKopSVG(box){
  const [strom, ...weitereEin] = box.ein, [spule, ...weitereAus] = box.aus;
  const schiene = `<line x1="14" y1="26" x2="14" y2="${bxUnten(box)}" class="ia-schiene"/>`;
  const ein = bxKontakt(strom, bxY(0)) + weitereEin.map((p, i) => bxEingang(p, bxY(i + 1), 90)).join("");
  const aus = bxSpule(spule, bxY(0)) + weitereAus.map((p, i) => bxAusgang(p, bxY(i + 1))).join("");
  return iaSvg(BX_BREITE, bxUnten(box) + 26, schiene + bxKasten(box) + ein + aus, `KOP: ${box.titel}`);
}

/* ---------- Anzeige eines Ausgangs ---------- */
// Feld mit Pin, Operand und Wert, z. B. „Q (#tempBathReady) 1“; grün, wenn der Ausgang 1 ist
export function bxLampe(pin, operand, wert){
  const name = operand ? ` <i>${iaName(operand)}</i>` : "";
  return `<div class="ze-q${wert ? " an" : ""}"><span>${pin}</span>${name}<b>${wert}</b></div>`;
}

/* ---------- Umschalter ---------- */
// Knopfreihe für Art oder Ansicht (FUP, KOP, SCL); Klick löst die Aktion „akt:Wert“ aus
export function bxTabs(liste, aktiv, akt){
  if (liste.length < 2) return "";
  const knopf = w => `<button type="button" data-ia-akt="${akt}:${w}" aria-pressed="${w === aktiv}">${w}</button>`;
  return `<div class="ia-tabs">${liste.map(knopf).join("")}</div>`;
}

/* ---------- SCL ---------- */
// code: Aufruf als Text; status: [[Variable, Wert als Text, an]] mit an = true (1), false (0) oder null (Zahl, Zeit)
const BX_ZEILENKLASSE = {true: "an", false: "aus", null: ""};
export function bxSclHTML(code, status){
  const zeilen = status.map(([name, wert, an]) => `<tr class="${BX_ZEILENKLASSE[an]}"><td>${esc(name)}</td><td>${esc(wert)}</td></tr>`).join("");
  return `<div class="ia-scl-wrap"><pre class="ia-scl"><code>${esc(code)}</code></pre>`
    + `<table class="ia-scl-status"><thead><tr><th>Variable</th><th>Wert</th></tr></thead><tbody>${zeilen}</tbody></table></div>`;
}
