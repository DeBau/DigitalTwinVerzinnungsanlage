/* ---------- Interaktive Erklärungen: großes Popup für Zahlenformate ---------- */
// Zweite Popup-Ebene #iadlg2 (src/seite.html), sie liegt über der groß geöffneten Zahl-Erklärung (#iadlg). Der Inhalt
// ist eine interaktive Erklärung wie im Text (Platzhalter über iaEinsetzen, bedienbar), daher gelten dieselben Klicks
// und Eingaben. Beim Schließen ruft zgOeffnen die Rückmeldung zu auf (zahl.js übernimmt damit den Speicher).
import { puOeffnen } from './popup.js';
import { iaEinsetzen } from './basis.js';

export function zgOeffnen(titel, platzhalter, zu){
  puOeffnen("#iadlg2", titel, iaEinsetzen(platzhalter, {bedienbar: true}), zu);
}
