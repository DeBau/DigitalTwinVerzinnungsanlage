/* Tabellenseite zeichnen: Kopfzeile, Zeilen im festen Raster, Querverweise in den Zellen anklickbar. */
import { GRAU, SCHMAL, linie, text } from '../symbole/grund.js';
import { X0, ueberschrift } from './blatt.js';
import { verweis } from './elemente.js';
import { TABELLEN } from './tabellen.js';

const OBEN = 104, ZEILE = 20.5, LINKS = X0 + 20;

function zelle(inhalt, x, y, breite, kopfspalte){
  if (inhalt && inhalt.ref) return verweis(x + 4, y, `/${inhalt.ref}`, "start");
  const zeichen = Math.floor(breite / 5);
  const t = String(inhalt ?? ""), kurz = t.length > zeichen ? t.slice(0, zeichen - 1) + "…" : t;
  return text(x + 4, y, kurz, {g: 9, w: kopfspalte ? 600 : 400, schrift: kopfspalte ? SCHMAL : undefined});
}

export function listeInhalt(ctx){
  const s = ctx.seite, t = TABELLEN[s.tabelle], zeilen = t.zeilen(ctx).slice(s.von, s.bis);
  const breite = t.spalten.reduce((a, [, b]) => a + b, 0);
  let svg = ueberschrift(t.titel, s.von ? `Fortsetzung ab Zeile ${s.von + 1}` : "");
  let x = LINKS;
  for (const [name, b] of t.spalten) {
    svg += text(x + 4, OBEN - 6, name, {g: 8.5, w: 600, f: GRAU});
    x += b;
  }
  svg += linie(`M${LINKS} ${OBEN}H${LINKS + breite}`, 1.2);
  zeilen.forEach((z, i) => {
    const y = OBEN + (i + 1) * ZEILE - 6;
    let zx = LINKS;
    t.spalten.forEach(([, b], j) => {
      svg += zelle(z[j], zx, y, b, j === 0);
      zx += b;
    });
    svg += linie(`M${LINKS} ${y + 6}H${LINKS + breite}`, .4);
  });
  return svg;
}
