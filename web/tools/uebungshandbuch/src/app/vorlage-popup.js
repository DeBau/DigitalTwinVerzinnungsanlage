/* ---------- Vorlage im Popup ausfüllen ---------- */
// Vorlagen mit felder: links die Zeilenliste, rechts eine Karte je Zeile mit großen Tasten (0/1, ja/nein).
// Vorlagen ohne felder: die bisherige Tabelle im großen Popup. Gespeichert wird unter denselben Schlüsseln (tplKey).
import { $, $$, BY, S, chips, esc, plain, trenn } from './basis.js';
import { PHASES } from './daten.js';
import { docTable, feld, restoreInputs, tplHead, tplKarteHTML, tplKey, tplNIn, tplRows, tplStand, tplsOf, zeileAuffaellig, zeileFertig, zeileWerte } from './uebung.js';

const Z = {ex: null, d: null, p: 4, ri: 0, filter: "alle"};
const WAHL = {"01": ["0", "1"], "janein": ["ja", "nein"]};
const TASTE = {"0": ["01", "0"], "1": ["01", "1"], "j": ["janein", "ja"], "n": ["janein", "nein"]};
const FILTER = [["alle", "Alle"], ["offen", "Offen"], ["auff", "Abweichung"]];

const dlg = () => $("#tpd");
const zeilen = () => tplRows(Z.d);
const fertig = ri => zeileFertig(Z.ex, Z.d, ri, zeilen()[ri], Z.p);
const auff = ri => zeileAuffaellig(Z.ex, Z.d, ri, zeilen()[ri]);
const sichtbar = ri => Z.filter === "offen" ? !fertig(ri) : Z.filter === "auff" ? auff(ri) : true;

export function openVorlage(id, tid, p){
  const ex = BY[id], d = tplsOf(ex).find(x => x.id === tid); if (!d) return;
  Object.assign(Z, {ex, d, p, filter: "alle"});
  Z.ri = Math.max(0, zeilen().findIndex((_, ri) => !fertig(ri)));
  if (d.felder) zeichne();
  else { dlg().innerHTML = `<form method="dialog" class="tpd-in"><header class="tpd-kopf"><h2>${d.cap}</h2><button class="btn primary" value="ok">Fertig</button></header><div class="tpd-tab">${docTable(ex, d, "edit")}</div></form>`; restoreInputs(dlg()); }
  dlg().showModal();
}

/* ---------- Zeichnen ---------- */
function zeichne(){
  dlg().innerHTML = `<form method="dialog" class="tpd-in"><header class="tpd-kopf">${kopfHTML()}</header>
    <div class="tpd-body"><nav class="tpd-liste" aria-label="Zeilen">${listeHTML()}</nav><section class="tpd-karte">${karteHTML()}</section></div></form>`;
  restoreInputs($(".tpd-karte", dlg()));
  $(".tpd-z.aktiv", dlg())?.scrollIntoView({block: "nearest"});
}
function kopfHTML(){
  const st = tplStand(Z.ex, Z.d, Z.p), pz = Math.round(100 * st.fertig / (st.gesamt || 1));
  return `<div class="tpd-titel"><h2>${Z.d.cap}</h2><div class="tpd-fort"><div class="tplk-bar"><i style="width:${pz}%"></i></div><span><b>${st.fertig}</b> von ${st.gesamt} fertig</span></div></div>
    <div class="tpd-filter" role="group" aria-label="Zeilen filtern">${FILTER.map(([k, n]) => `<button type="button" class="btn small" data-act="tpd-filter" data-f="${k}" aria-pressed="${Z.filter === k}">${n}${k === "auff" && st.auffaellig ? ` <b>${st.auffaellig}</b>` : ""}</button>`).join("")}</div>
    <button class="btn primary" value="ok">Fertig</button>`;
}
function listeHTML(){
  const html = zeilen().map((r, ri) => sichtbar(ri) ? `<button type="button" class="tpd-z${ri === Z.ri ? " aktiv" : ""}${auff(ri) ? " auff" : fertig(ri) ? " ok" : ""}" data-act="tpd-zeile" data-r="${ri}">
    <span class="st">${auff(ri) ? "!" : fertig(ri) ? "✓" : ri + 1}</span><span class="tx"><b>${r.length ? chips(r[0]) : `Zeile ${ri + 1}`}</b> ${r[1] ? chips(r[1]) : ""}<br><span class="small muted">${esc(plain(r[2] ?? ""))}</span></span>
    <span class="werte">${zeileWerte(Z.ex, Z.d, ri, r).filter((_, ci) => WAHL[feld(Z.ex, Z.d, r, ci).typ]).map(v => `<i>${esc(v) || "·"}</i>`).join("")}</span></button>` : "").join("");
  return html || `<p class="muted small" style="padding:12px">Keine Zeile in diesem Filter.</p>`;
}
function karteHTML(){
  const r = zeilen()[Z.ri], head = tplHead(Z.ex, Z.d), n = tplNIn(Z.d, r, head), st = tplStand(Z.ex, Z.d, Z.p);
  const steck = r.map((x, c) => `<div><dt>${trenn(head[c] || "")}</dt><dd>${trenn(chips(x))}</dd></div>`).join("");
  const felder = Array.from({length: n}, (_, ci) => feldHTML(head[r.length + ci] || "", ci)).join("");
  const [a, b] = Z.d.vergleich || [], v = zeileWerte(Z.ex, Z.d, Z.ri, r);
  const hinweis = auff(Z.ri) ? `<div class="tpd-auff"><b>Abweichung:</b> ${esc(plain(head[r.length + a]))} ist <b>${esc(v[a])}</b>, ${esc(plain(head[r.length + b]))} ist <b>${esc(v[b])}</b>. Das ist kein Fehler, wenn du es erklären kannst. Schreib in die Bemerkung, warum.</div>` : "";
  const fertigAlle = st.gesamt && st.fertig === st.gesamt ? `<div class="tpd-geschafft">Geschafft! Alle ${st.gesamt} Zeilen sind ausgefüllt.</div>` : "";
  return fertigAlle + beispielHTML(head) + `<div class="tpd-nr">Zeile ${Z.ri + 1} von ${zeilen().length}</div><dl class="tpd-steck">${steck}</dl>${hinweis}<div class="tpd-felder">${felder}</div>
    <div class="tpd-nav"><button type="button" class="btn" data-act="tpd-schritt" data-d="-1" ${Z.ri ? "" : "disabled"}>Vorige Zeile</button><span class="muted small">Tasten: 0 und 1, J und N füllen das nächste freie Feld, Pfeile wechseln die Zeile</span><button type="button" class="btn primary" data-act="tpd-schritt" data-d="1" ${Z.ri < zeilen().length - 1 ? "" : "disabled"}>Nächste Zeile</button></div>`;
}
function feldHTML(titel, ci){
  const f = feld(Z.ex, Z.d, zeilen()[Z.ri], ci), k = tplKey(Z.ex.id, Z.d, Z.ri, ci), v = String(S.get(k) ?? "").trim();
  if (f.ab > Z.p) return `<div class="tpd-feld zu"><label>${trenn(titel)}</label><span class="muted small">Trägst du im Schritt ${PHASES[f.ab].n} ein.${v ? ` Jetzt: <b>${esc(v)}</b>` : ""}</span></div>`;
  if (!WAHL[f.typ]) return `<div class="tpd-feld"><label for="tpd${ci}">${trenn(titel)}</label><textarea id="tpd${ci}" class="auto" rows="2" data-k="${k}"></textarea></div>`;
  return `<div class="tpd-feld"><label>${trenn(titel)}</label><div class="tpd-wahl">${WAHL[f.typ].map(w => `<button type="button" data-act="tpd-set" data-ci="${ci}" data-v="${w}" aria-pressed="${v === w}">${w}</button>`).join("")}</div></div>`;
}
function beispielHTML(head){
  const m = Z.d.muster; if (!m) return "";
  return `<details class="tpd-bsp"><summary>Beispiel: so trägst du ein</summary><dl class="tpd-steck">${m.map((x, c) => `<div><dt>${trenn(head[c] || "")}</dt><dd>${trenn(chips(x))}</dd></div>`).join("")}</dl></details>`;
}

/* ---------- Bedienen ---------- */
function setze(ci, w){
  const k = tplKey(Z.ex.id, Z.d, Z.ri, ci), war = fertig(Z.ri);
  S.set(k, String(S.get(k) ?? "") === w ? null : w);
  // Zeile gerade fertig geworden: kurz zeigen, dann zur nächsten offenen Zeile
  if (!war && fertig(Z.ri) && !auff(Z.ri)) { zeichne(); setTimeout(() => { if (dlg().open) springe(naechsteOffene()); }, 350); }
  else zeichne();
}
const naechsteOffene = () => { const n = zeilen().length; for (let i = 1; i <= n; i++) { const ri = (Z.ri + i) % n; if (!fertig(ri)) return ri; } return Z.ri; };
function springe(ri){ Z.ri = Math.max(0, Math.min(zeilen().length - 1, ri)); zeichne(); }
function taste(e){
  if (e.target.closest("textarea,input")) return;
  const t = TASTE[e.key.toLowerCase()];
  if (t) { const v = zeileWerte(Z.ex, Z.d, Z.ri, zeilen()[Z.ri]), r = zeilen()[Z.ri], ci = v.findIndex((x, i) => { const f = feld(Z.ex, Z.d, r, i); return !x && f.typ === t[0] && f.ab <= Z.p; }); if (ci >= 0) { e.preventDefault(); setze(ci, t[1]); } return; }
  if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); springe(Z.ri + 1); }
  if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); springe(Z.ri - 1); }
}
const AKTION = {
  "tpd-set": a => setze(+a.dataset.ci, a.dataset.v),
  "tpd-zeile": a => springe(+a.dataset.r),
  "tpd-schritt": a => springe(Z.ri + +a.dataset.d),
  "tpd-filter": a => { Z.filter = a.dataset.f; zeichne(); },
};
// Nach dem Schließen: Karte im Schritt neu zeichnen
function geschlossen(){
  const alt = $(`.tplk[data-t="${Z.d.id}"]`); if (alt) alt.outerHTML = tplKarteHTML(Z.ex, Z.d, Z.p);
}
export function init(){
  document.addEventListener("click", e => { const a = e.target.closest("[data-act=tpl-open]"); const m = location.hash.match(/^#\/(L\d\d)/); if (a && m) openVorlage(m[1], a.dataset.t, +a.dataset.p); });
  dlg().addEventListener("click", e => { const a = e.target.closest("[data-act^=tpd-]"); if (a && Z.d.felder) AKTION[a.dataset.act](a); });
  // auf document und in der Capture-Phase: Nach dem Neuzeichnen liegt der Fokus nicht mehr im Popup, und die Pfeiltasten
  // dürfen nicht den Schritt der Übung wechseln (ereignisse.js)
  document.addEventListener("keydown", e => { if (dlg().open && Z.d && Z.d.felder) { e.stopPropagation(); taste(e); } }, true);
  dlg().addEventListener("close", geschlossen);
}
