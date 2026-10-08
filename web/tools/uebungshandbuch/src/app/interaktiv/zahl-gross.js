/* ---------- Interaktive Erklärungen: großes Popup für Zahlenformate ---------- */
// Eigenes dialog-Element #iadlg (src/seite.html). Es kann über dem Fachwissen-Popup (#dlg) liegen. Der Inhalt ist eine
// interaktive Erklärung wie im Text (Platzhalter über iaEinsetzen), daher gelten dieselben Klicks und Eingaben.
// Beim Schließen ruft zgOeffnen die Rückmeldung zu auf (zahl.js übernimmt damit den Speicher in die kleine Erklärung).
import { $ } from '../basis.js';
import { iaEinsetzen } from './basis.js';

let zgZu = null;
function zgSchliessen(){
  const zu = zgZu; zgZu = null;
  if (zu) zu();
  $("#iadlg").innerHTML = "";
}
function zgAnmelden(d){
  if (d.dataset.bereit) return;
  d.dataset.bereit = "1";
  d.addEventListener("close", zgSchliessen);
  d.addEventListener("click", e => { if (e.target === d) d.close(); });
}
export function zgOeffnen(titel, platzhalter, zu){
  const d = $("#iadlg"); if (!d) return;
  zgAnmelden(d);
  zgZu = zu;
  d.innerHTML = `<div class="iadlg-in"><header class="iadlg-kopf"><h2>${titel}</h2><form method="dialog">`
    + `<button class="btn primary" value="ok">Fertig</button></form></header><div class="iadlg-body">${iaEinsetzen(platzhalter)}</div></div>`;
  d.showModal();
}
