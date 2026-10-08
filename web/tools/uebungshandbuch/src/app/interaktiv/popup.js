/* ---------- Interaktive Erklärungen: Popups zum Ausprobieren ---------- */
// Im Text steht von jeder Erklärung nur eine Vorschau, ein Klick öffnet sie groß in #iadlg (basis.js). Darüber kann
// #iadlg2 liegen (Speicheraufbau groß aus der Zahl-Erklärung). Beide liegen auch über dem Fachwissen-Popup (#dlg).
// „← Zurück“, „×“ oder Esc schließt nur das oberste Popup, darunter steht alles wie vorher. Ein Klick daneben schließt nicht.
// Beim Schließen ruft puOeffnen die Rückmeldung zu auf (z. B. Vorschau neu zeichnen, Abspielen anhalten).
import { $, DLG_X } from '../basis.js';

const PU_ZU = new Map();
function puSchliessen(d){
  const zu = PU_ZU.get(d); PU_ZU.delete(d);
  puRuheEnde(d);
  d.innerHTML = "";
  if (zu) zu();
}
function puAnmelden(d){
  if (d.dataset.bereit) return;
  d.dataset.bereit = "1";
  d.addEventListener("close", () => puSchliessen(d));
}
export function puOeffnen(auswahl, titel, inhalt, zu){
  const d = $(auswahl); if (!d) return;
  puAnmelden(d);
  PU_ZU.set(d, zu);
  d.innerHTML = `<div class="iadlg-in"><header class="iadlg-kopf"><form method="dialog"><button class="btn" value="zurueck">← Zurück</button></form>`
    + `<h2>${titel}</h2>${DLG_X}</header><div class="iadlg-body">${inhalt}</div></div>`;
  d.querySelector(".dlg-x").onclick = () => d.close();
  d.showModal();
  puEinpassen(d);
  puRuhigHalten(d);
}

/* ---------- Ruhig: das Popup wird nie kleiner, solange es offen ist ---------- */
// Kommt beim Abspielen eine Textzeile und geht wieder, würde das mittig sitzende Popup pulsieren. Darum merkt sich der
// Inhaltsbereich seine größte Höhe (höchstens bis zum Fensterrand) und wird nicht wieder kleiner. ResizeObserver meldet
// vor dem Zeichnen, das Kleinerwerden ist also nie zu sehen.
const PU_RUHE = new Map();
function puRuheMessen(d, ruhe){
  const body = d.querySelector(".iadlg-body"), inhalt = body.firstElementChild;
  const frei = innerHeight - 24 - d.querySelector(".iadlg-kopf").offsetHeight;
  const bedarf = Math.ceil(inhalt.getBoundingClientRect().height) + 24;   // 24: Innenabstand oben und unten
  ruhe.hoechste = Math.max(ruhe.hoechste, Math.min(bedarf, frei));
  body.style.minHeight = ruhe.hoechste + "px";
}
function puRuhigHalten(d){
  const inhalt = d.querySelector(".iadlg-body > *"); if (!inhalt) return;
  const ruhe = {hoechste: 0};
  ruhe.wache = new ResizeObserver(() => puRuheMessen(d, ruhe));
  ruhe.wache.observe(inhalt);
  PU_RUHE.set(d, ruhe);
}
function puRuheEnde(d){
  const ruhe = PU_RUHE.get(d); PU_RUHE.delete(d);
  if (ruhe) ruhe.wache.disconnect();
}
// Fenstergröße geändert: neu einpassen, die größte Höhe neu bestimmen
function puNeuEinpassen(d){
  const ruhe = PU_RUHE.get(d), body = d.querySelector(".iadlg-body");
  if (ruhe) ruhe.hoechste = 0;
  if (body) body.style.minHeight = "";
  puEinpassen(d);
  if (ruhe) puRuheMessen(d, ruhe);
}

/* ---------- Einpassen: beim Öffnen keine senkrechte Scrollleiste ---------- */
// Ist das Fenster zu niedrig, wird der Inhalt verkleinert (CSS zoom, höchstens bis PU_MIN = 70 %), bis er ohne Scrollleiste
// passt. Das gilt für den Stand beim Öffnen und bei Größenänderung des Fensters; klappt man danach etwas auf (z. B.
// Begriffe), darf die Scrollleiste erscheinen. Bilder mit width:100% werden durch zoom nicht kleiner, darum mehrere Runden.
const PU_MIN = .7, PU_RUNDEN = 5;
function puEinpassen(d){
  const body = d.querySelector(".iadlg-body"), inhalt = body && body.firstElementChild; if (!inhalt) return;
  inhalt.style.zoom = "";
  let faktor = 1;
  for (let i = 0; i < PU_RUNDEN && body.scrollHeight > body.clientHeight && faktor > PU_MIN; i++) {
    faktor = Math.max(PU_MIN, faktor * body.clientHeight / body.scrollHeight - .01);
    inhalt.style.zoom = faktor;
  }
}
addEventListener("resize", () => document.querySelectorAll("dialog.iadlg[open]").forEach(puNeuEinpassen));
