/* Querverweise: Jede Seite meldet beim Zeichnen, wo ein Kennzeichen steht (Seite, Spalte, Rolle, Anschlüsse).
   Der Plan wird zweimal gezeichnet: Im ersten Lauf entsteht der Index, im zweiten stehen alle Verweise fest.
   Ein Verweis hat die Form /Seite.Spalte, zum Beispiel /21.3. */

export const neuerIndex = () => ({orte: new Map(), signale: new Map()});

export function merke(index, bmk, eintrag){
  if (!bmk) return;
  if (!index.orte.has(bmk)) index.orte.set(bmk, []);
  index.orte.get(bmk).push(eintrag);
}

export const merkeSignal = (index, name, eintrag) => index.signale.set(name, eintrag);

export const fundstellen = (index, bmk) => index.orte.get(bmk) || [];

export const verweisText = e => e ? `/${e.seite}.${e.spalte}` : "";

// Hauptort eines Kennzeichens: die Spule oder das Gerät selbst, sonst die erste Fundstelle
export function hauptort(index, bmk){
  const alle = fundstellen(index, bmk);
  return alle.find(e => e.rolle === "haupt") || alle.find(e => e.rolle === "geraet") || null;
}

// Verweis auf den Hauptort, leer, wenn er an derselben Stelle liegt
export function verweisZu(index, bmk, hier){
  const ziel = hauptort(index, bmk);
  if (!ziel || (ziel.seite === hier.seite && ziel.spalte === hier.spalte)) return "";
  return verweisText(ziel);
}

// Kontaktspiegel: alle Kontakte eines Geräts mit Anschlüssen und Fundstelle
export const kontakte = (index, bmk) => fundstellen(index, bmk).filter(e => e.rolle === "kontakt");
