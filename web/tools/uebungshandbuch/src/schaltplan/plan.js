/* Den ganzen Schaltplan zeichnen. Zwei Läufe: Der erste sammelt alle Fundstellen im Index, der zweite zeichnet
   mit fertigen Querverweisen. Ergebnis: Liste der Seiten mit SVG und der Index für Suche und Sprünge. Reine Funktion. */
import { blatt } from './blatt.js';
import { BLOECKE } from './bloecke.js';
import { einspeisungInhalt, leistungInhalt } from './leistung.js';
import { listeInhalt } from './liste.js';
import { pfadInhalt } from './pfade.js';
import { neuerIndex } from './querverweise.js';
import { seitenBauen } from './seiten.js';

const ZEICHNER = {
  block: ctx => BLOECKE[ctx.seite.block](ctx),
  einspeisung: einspeisungInhalt,
  leistung: leistungInhalt,
  pfade: pfadInhalt,
  tabelle: listeInhalt,
};

function lauf(modell, seiten, lesen){
  const schreiben = neuerIndex();
  const bilder = seiten.map(seite => ZEICHNER[seite.typ]({seite, seiten, modell, lesen, schreiben}));
  return {schreiben, bilder};
}

export function zeichnePlan(modell){
  const seiten = seitenBauen(modell);
  const erster = lauf(modell, seiten, neuerIndex());
  const zweiter = lauf(modell, seiten, erster.schreiben);
  const meta = modell.plan.meta;
  return {
    index: zweiter.schreiben,
    seiten: seiten.map((s, i) => ({nr: s.nr, titel: s.titel, art: s.art, svg: blatt(s, seiten.length, meta, zweiter.bilder[i])})),
  };
}
