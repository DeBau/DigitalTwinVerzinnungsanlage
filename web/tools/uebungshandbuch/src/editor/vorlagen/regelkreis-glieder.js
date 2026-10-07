// Vorlage Regelkreis: Übertragungsglieder nach DIN IEC 60050-351 mit Sprungantwort-Piktogramm (Zweipunktregler:
// Kennlinie mit Hysterese). Ein Glied ist ein Block mit o.typ; regelkreis-bausteine.js zeichnet ihn mit gliedSVG
// und meldet je Glied eine Palettenvariante an. Die Texte erklären das Verhalten ohne Formeln.
import { INK, MUTE, SVGT } from '../svg.js';
import { G } from '../vorlagen-svg.js';

export const GLIED_B = 80;   // Breite eines Glieds; Höhe wie jeder Block (BLOCK_H = 60)
// typ → [Name, Kurve im Glied (0..80 × 0..60), Erklärung]
export const GLIED = {
  P: ["P-Glied", "M12 50H24V26H70", "Der Ausgang folgt dem Eingang sofort, verstärkt um Kp."],
  I: ["I-Glied", "M12 50H24L64 12", "Der Ausgang wächst, solange am Eingang etwas anliegt. Er summiert auf."],
  PT1: ["PT1-Glied", "M12 50H24C29 28 40 20 70 19",
    "Der Ausgang folgt verzögert. Nach der Zeitkonstante T1 hat er 63 % erreicht. Typisch für Temperatur und Füllstand."],
  PT2: ["PT2-Glied", "M12 50H24C40 50 40 19 70 19", "Zwei Verzögerungen hintereinander: Der Ausgang läuft s-förmig an."],
  Tt: ["Totzeitglied", "M12 50H40V24H70", "Der Ausgang wiederholt den Eingang erst nach der Totzeit Tt, z. B. am Förderband."],
  PI: ["PI-Regler", "M12 50H24V38L66 16",
    "Der P-Anteil reagiert sofort, der I-Anteil baut die bleibende Regeldifferenz ab (Nachstellzeit Tn). "
      + "In der S7 macht das PID_Compact."],
  PID: ["PID-Regler", "M12 50H24V12L28 36L66 20",
    "Wie PI, dazu der D-Anteil: Er reagiert auf schnelle Änderungen (Vorhaltzeit Tv). In der S7 macht das PID_Compact."],
  "2P": ["Zweipunktregler", "M14 44H46V18H68M34 18V44",
    "Er schaltet ganz ein oder ganz aus. Die Hysterese (Abstand der beiden Schaltpunkte) verhindert dauerndes Schalten."],
};
export const GLIED_OPTIONEN = [["", "nur Text"], ...Object.entries(GLIED).map(([k, [n]]) => [k, n])];
export const ACHSEN_PIKTO = "M12 52V8M10 50H72";
// Glied o im Block bei o.x, o.y: Achsen grau, Kurve schwarz, Bezeichnung über dem Block
export function gliedSVG(o, edit){
  const [n, kurve] = GLIED[o.typ], name = o.v || (edit ? n : "");
  return `<g transform="translate(${o.x} ${o.y})"><path d="${ACHSEN_PIKTO}" stroke="${G}" stroke-width="1" fill="none"/>`
    + `<path d="${kurve}" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linejoin="round"/></g>`
    + (name ? SVGT(o.x + GLIED_B / 2, o.y - 7, name, "middle", 11, 600, o.v ? INK : MUTE) : "");
}
export const gliedInfo = t => GLIED[t] ? GLIED[t][2] : "";
// Regler: ein Reglerglied oder ein Block, der "Regler" heißt
export const REGLERTYPEN = ["P", "I", "PI", "PID", "2P"];
export const istRegler = o => o.k === "box" && (REGLERTYPEN.includes(o.typ) || /regler/i.test(o.v || ""));
