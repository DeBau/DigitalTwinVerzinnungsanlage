/* ---------- Router ---------- */
import { S } from './basis.js';
import { viewHome } from './start.js';
import { curTime, timerEx, viewExercise } from './uebung.js';
import { viewAnlage, viewBewertung, viewKonzept, viewRichtlinien, viewSignale, viewVorlagen } from './seiten.js';
import { hideTip } from './tooltip.js';

export function route(){
  hideTip();
  const h = location.hash.replace(/^#\/?/, "").split("/");
  if (/^L\d\d$/.test(h[0])) return viewExercise(h[0], h[1]);
  if (h[0] === "vorlagen") return viewVorlagen();
  if (h[0] === "signale") return viewSignale();
  if (h[0] === "anlage") return viewAnlage();
  if (h[0] === "richtlinien") return viewRichtlinien();
  if (h[0] === "konzept") return viewKonzept();
  if (h[0] === "bewertung") return viewBewertung(h[1]);
  viewHome();
}
// Seiteneffekte: Listener, Migrationen, Start. main.js ruft init() in der ursprünglichen Reihenfolge auf.
export function init(){
(function umziehen(){
  if (S.get("ver") >= 2) return;
  const alt = S.all(), rx = /^L(\d\d)(?=:)/;
  Object.keys(alt).forEach(k => { if (rx.test(k)) S.set(k, null); });
  Object.entries(alt).forEach(([k, v]) => { const m = rx.exec(k); if (m) { const n = +m[1]; S.set((n >= 2 ? "L" + String(n + 5).padStart(2, "0") : "L" + m[1]) + k.slice(3), v); } });
  S.set("ver", 2);
})();
(function umziehen3(){   // Hand, Verriegelung, HAND/AUTO, Befehlsausgabe vor die Schrittkette
  if (S.get("ver") >= 3) return;
  const alt = S.all(), rx = /^L(\d\d)(?=:)/, neu = n => n <= 7 ? n : ({8: 12, 9: 13, 10: 9})[n] || n + 3;
  Object.keys(alt).forEach(k => { if (rx.test(k)) S.set(k, null); });
  Object.entries(alt).forEach(([k, v]) => { const m = rx.exec(k); if (m) S.set("L" + String(neu(+m[1])).padStart(2, "0") + k.slice(3), v); });
  S.set("ver", 3);
})();
addEventListener("hashchange", route);
addEventListener("beforeunload", () => { if (timerEx) S.set(timerEx+":zeit", curTime(timerEx)); });
route();
}
