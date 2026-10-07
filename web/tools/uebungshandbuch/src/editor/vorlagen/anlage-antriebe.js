// Pneumatische Antriebe der Verzinnungsanlage als Tabelle, gemeinsam für den Pneumatikschaltplan („Antrieb aus der
// Anlage“, pneumatik-antriebe.js) und das Weg-Schritt-Diagramm (Schnelleingabe, wegschritt-eingabe.js).
// Quelle: signale.csv und logik/zustand.js (ZYL) der Anlage. −MM7 gibt es an der Anlage nicht.
// art: Bauteil im Schaltplan; aus = Spule 14 (Stellung 1), ein = Spule 12 (Stellung 0, fehlt bei Federrückstellung);
// s1 = Sensor in Stellung 0 (hinten), s2 = Sensor in Stellung 1 (vorn); b1, b0 = Bedeutung von Stellung 1 und 0.

export const ANTRIEBE = {
  MM1: {art: "zyl2", aus: "MB2", ein: "MB1", s1: "BG1", s2: "BG2", b1: "gelöst", b0: "eingehängt"},
  MM2: {art: "zyl2", aus: "MB3", ein: "MB4", s1: "BG3", s2: "BG4", b1: "unten", b0: "oben"},
  MM3: {art: "zyl2", aus: "MB5", ein: "MB6", s1: "BG5", s2: "BG6", b1: "über Zinnbad", b0: "über Band"},
  MM4: {art: "zyl2", aus: "MB7", ein: "MB8", s1: "BG7", s2: "BG8", b1: "Bad zu", b0: "Bad offen"},
  MM5: {art: "rot", aus: "MB9", s1: "BG14", s2: "BG15", b1: "offen", b0: "zu"},
  MM6: {art: "rot", aus: "MB10", s1: "BG17", s2: "BG16", b1: "sperrt", b0: "offen"},
  MM8: {art: "zyl2", aus: "MB15", s1: "BG30", s2: "BG31", b1: "gekippt", b0: "unten"},
};
// Antrieb zum Kennzeichen oder Zeilennamen, z. B. "−MM2 Tauchzylinder" → ["MM2", {…}], sonst null
export function antriebZu(text){
  const m = /MM\d+/.exec(String(text || ""));
  return m && ANTRIEBE[m[0]] ? [m[0], ANTRIEBE[m[0]]] : null;
}
