// Pneumatik: „Antrieb aus der Anlage einfügen“. Ein Klick setzt einen Antrieb der Verzinnungsanlage fertig verdrahtet ein:
// Zylinder bzw. Schwenkantrieb mit Endlagensensoren, 5/2-Wegeventil mit Spulen (14 = ausfahren, 12 = einfahren),
// zwei Drosselrückschlagventile in Abluftdrosselung und eine Druckluftquelle an 1. Benutzt von vorlagen/pneumatik.js.
// Die Kennzeichen stehen in ANTRIEBE (anlage-antriebe.js), die Namen im Menü in EXTRA (app/daten.js).
import { EXTRA } from '../../app/daten.js';
import { $ } from '../../app/basis.js';
import { PH } from '../svg.js';
import { ED, markiere } from '../status.js';
import { umrissVon } from '../bausteine.js';
import { uid } from '../auswahl.js';
import { HINWEIS, propsKasten, updateProps } from '../eigenschaften.js';
import { aendere } from '../verlauf.js';
import { setTool } from '../werkzeuge.js';
import { ANTRIEBE } from './anlage-antriebe.js';

const kz = tag => tag ? "−" + tag : "";

// Auswahlliste im Eigenschaftsfeld
export function antriebMenue(){
  const zeile = ([mm, a]) => `<button type="button" class="tool" data-antrieb="${mm}" style="display:block;width:100%;`
    + `text-align:left;margin:0 0 6px;white-space:normal"><b>−${mm}</b> ${EXTRA[mm] || ""}<br><span class="small muted">`
    + `${kz(a.aus)}${a.ein ? " / " + kz(a.ein) : " / Feder"}, ${kz(a.s1)} / ${kz(a.s2)}</span></button>`;
  return propsKasten("Antrieb aus der Anlage", HINWEIS("Wähle einen Antrieb. Er kommt mit Ventil, Spulen, Endlagensensoren "
    + "und Drosselrückschlagventilen (Abluftdrosselung) fertig verdrahtet an den nächsten freien Platz.")
    + Object.entries(ANTRIEBE).map(zeile).join(""));
}
// Bausteine und Leitungen des Antriebs mm mit dem Zylinder links oben bei (x0, y0)
export function antriebTeile(mm, x0, y0, d){
  const a = ANTRIEBE[mm], rot = a.art === "rot", id = {z: uid(), v: uid(), da: uid(), db: uid(), q: uid()};
  const rz = freieNummer(d, "−RZ");
  const o = [
    {id: id.z, k: a.art, x: rot ? x0 + 40 : x0, y: y0, v: "−" + mm, s1: kz(a.s1), s2: kz(a.s2)},
    {id: id.da, k: "drv", x: x0 - 10, y: y0 + 110, v: "−RZ" + rz},       // unter Anschluss A des Zylinders
    {id: id.db, k: "drv", x: x0 + 90, y: y0 + 110, v: "−RZ" + (rz + 1)},  // unter Anschluss B
    {id: id.v, k: "v52", x: x0 - 10, y: y0 + 240, v: "", al: "mag", ar: a.ein ? "mag" : "feder", spl: kz(a.aus), spr: kz(a.ein)},
    {id: id.q, k: "src", x: x0 + 65, y: y0 + 340, v: ""},
  ];
  const leitung = (a1, p1, b1, p2) => ({a: a1, pa: p1, b: b1, pb: p2, v: ""});
  const c = [leitung(id.v, "4", id.da, "1"), leitung(id.da, "2", id.z, "A"), leitung(id.v, "2", id.db, "1"),
    leitung(id.db, "2", id.z, "B"), leitung(id.q, "1", id.v, "1")];
  return {o, c, zylinder: id.z};
}
// Kleinste Nummer n, ab der prefix + n und prefix + (n + 1) frei sind
export function freieNummer(d, prefix){
  const belegt = new Set(d.o.map(o => o.v));
  let n = 1;
  while (belegt.has(prefix + n) || belegt.has(prefix + (n + 1))) n++;
  return n;
}
// Erster freier Platz für einen Antrieb (links oben des Zylinders): drei Spalten je Blatt, sonst ein neues Blatt.
// Der Antrieb braucht links 60 für die Kennzeichen, oben 30 für die Sensoren und ist samt Quelle 410 hoch.
export const ANTRIEB_SPALTEN = [80, 390, 700];
export function freierPlatz(d){
  const frei = (x, y) => d.o.every(o => {
    const b = umrissVon(o);
    return b.x > x + 250 || b.x + b.w < x - 60 || b.y > y + 380 || b.y + b.h < y - 30;
  });
  for (let blatt = 0; ; blatt++) {
    const y = blatt * PH + 60, x = ANTRIEB_SPALTEN.find(sx => frei(sx, y));
    if (x !== undefined) return [x, y];
  }
}
// Antrieb mm an den ersten freien Platz setzen, den Zylinder markieren
export function antriebEinfuegen(mm){
  const [x0, y0] = freierPlatz(ED.data), t = antriebTeile(mm, x0, y0, ED.data);
  setTool("sel");
  aendere(d => { d.o.push(...t.o); d.c.push(...t.c); markiere("o", t.zylinder); });
  updateProps(true);
}
// Haken klick der Vorlage: Knopf in der Werkzeugleiste öffnet das Menü, ein Eintrag fügt ein
export function antriebKlick(e){
  const knopf = e.target.closest("[data-pneu='antrieb']"), wahl = e.target.closest("[data-antrieb]");
  if (wahl) { antriebEinfuegen(wahl.dataset.antrieb); return true; }
  if (!knopf) return false;
  const el = $("#props");
  if (el) el.innerHTML = antriebMenue();
  return true;
}
export const ANTRIEB_KNOPF = `<button type="button" class="tool" data-pneu="antrieb" `
  + `title="Zylinder, Ventil, Sensoren und Drosseln eines Antriebs der Anlage fertig verdrahtet einfügen">Antrieb aus der Anlage</button>`;
