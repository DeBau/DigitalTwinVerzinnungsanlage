/* ---------- Nachschlagen: Aufgabe und Fachwissen als Popup ---------- */
// Ab Schritt 2 steht in der Seitenleiste der Kasten „Nachschlagen“, unter jedem Aufgabenschritt das passende Fachwissen (fw).
// Ein Popup zeigt die Aufgabe oder genau ein Fachwissen-Thema (uebungVorlage.md, Abschnitt 3).
import { $, BY, chips, esc, quelle, tableHTML } from './basis.js';

const hatWissen = s => !!(s.wissen && s.wissen.length);
const themaLink = (i, html) => `<a href="#" data-act="ns-fw" data-i="${i}">${html}</a>`;

export const fwThemaHTML = w => `<div class="prose">${chips(w.h)}${quelle(w)}</div>`;
// Alle Themen als zuklappbare Liste; offen = Nummer des offenen Themas, -1 = alle zu
export function fwListHTML(s, offen){
  const thema = (w, i) => `<details${i === offen ? " open" : ""}><summary>${w.t}</summary>${fwThemaHTML(w)}</details>`;
  return `<div class="fw">${s.wissen.map(thema).join("")}</div>`;
}
export function aufgabeHTML(s){
  const text = `<div class="prose${s.beschr ? " beschr" : ""}">${chips(s.beschr || s.sit)}</div>`;
  const tab = s.tab ? `<h3>${s.tab.cap}</h3>` + tableHTML(s.tab.head, s.tab.rows) : "";
  const list = s.list ? `<h3>${s.list.cap}</h3><ol class="prose">${s.list.items.map(x => `<li>${chips(x)}</li>`).join("")}</ol>` : "";
  return text + tab + list;
}
// Fachwissen zum Aufgabenschritt i (Feld fw in uebungen.js)
export function fwZuHTML(s, i){
  const nr = ((s.fw || {})[i] || []).filter(x => hatWissen(s) && s.wissen[x]);
  return nr.length ? `<span class="fwzu">${nr.map(x => themaLink(x, s.wissen[x].t)).join("")}</span>` : "";
}
// Kasten in der Seitenleiste; „Fachwissen“ (alle Themen) ist nur im schmalen Fenster sichtbar, dort fehlt die Liste
export function nachschlagenHTML(s){
  const alle = hatWissen(s) ? `<button class="btn small nsalle" type="button" data-act="ns-alle">Fachwissen</button>` : "";
  const liste = hatWissen(s) ? `<ul class="fwthemen">${s.wissen.map((w, i) => `<li>${themaLink(i, w.t)}</li>`).join("")}</ul>` : "";
  const knoepfe = `<div class="nsbtns"><button class="btn small" type="button" data-act="ns-aufgabe">Aufgabe</button>${alle}</div>`;
  return `<div class="box nachschlagen"><h4>Nachschlagen</h4>${knoepfe}${liste}</div>`;
}

/* ---------- Popup ---------- */
function zeige(titel, unter, inhalt){
  const schliessen = `<div class="row"><button class="btn primary" value="ok">Schließen</button></div>`;
  $("#dlg").innerHTML = `<form class="dlg nsdlg" method="dialog"><h2>${titel}</h2><p class="muted">${unter}</p>${inhalt}${schliessen}</form>`;
  $("#dlg").showModal();
}
const NS_AKTION = {
  "ns-aufgabe": s => zeige(`Aufgabe ${s.id}`, esc(s.t), aufgabeHTML(s)),
  "ns-alle": s => zeige(`Fachwissen ${s.id}`, esc(s.t), fwListHTML(s, -1)),
  "ns-fw": (s, i) => zeige(s.wissen[i].t, `Fachwissen ${s.id}`, fwThemaHTML(s.wissen[i])),
};
export function init(){
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-act^=ns-]"), m = location.hash.match(/^#\/(L\d\d)/);
    if (!a || !m || !NS_AKTION[a.dataset.act]) return;
    e.preventDefault();
    NS_AKTION[a.dataset.act](BY[m[1]], +a.dataset.i);
  });
}
