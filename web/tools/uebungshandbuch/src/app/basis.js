/* ================= Grundlagen ================= */
import { EXTRA, QUIZ, SHEETS, SIG, STIL, bewKey, critOf } from './daten.js';

export const $ = (s, r=document) => r.querySelector(s);
export const $$ = (s, r=document) => [...r.querySelectorAll(s)];
export const BY = Object.fromEntries(SHEETS.map(s => [s.id, s]));
// Position einer Übung in SHEETS. Eine vorläufige ID ohne Übung (z. B. L06B) steht hinter der letzten Übung mit gleicher
// oder kleinerer Nummer, ihre Regel greift also erst in der nächsten vorhandenen Übung.
export const sheetPos = id => { const i = SHEETS.findIndex(s => s.id === id); if (i >= 0) return i;
  const n = parseInt(String(id).slice(1), 10); let p = -1; SHEETS.forEach((s, j) => { if (parseInt(s.id.slice(1), 10) <= n) p = j; }); return p + 0.5; };
// Stil-Check: Regeln aus stil.js mit ab ≤ Übung, sortiert nach Position in SHEETS (bei gleicher Position nach Reihenfolge in stil.js).
// i = Index in STIL (Speicherschlüssel Lxx:stil:i), neu = Regel kommt in dieser Übung dazu.
export const stilSorted = () => STIL.map((r, i) => ({r, i, pos: sheetPos(r.ab)})).sort((a, b) => a.pos - b.pos || a.i - b.i);
export const stilFor = s => typOf(s) === "erkunden" ? [] : stilSorted().filter(x => x.pos <= sheetPos(s.id)).map(x => ({...x, neu: Math.ceil(x.pos) === sheetPos(s.id)}));
export const stilKey = (id, i) => `${id}:stil:${i}`;
export const S = {
  get(k, d=null){ try { const v = localStorage.getItem("uebh2:"+k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v){ try { if (v === null || v === undefined || v === "" || v === false) localStorage.removeItem("uebh2:"+k); else localStorage.setItem("uebh2:"+k, JSON.stringify(v)); } catch {} },
  all(){ const o = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith("uebh2:")) o[k.slice(6)] = JSON.parse(localStorage.getItem(k)); } } catch {} return o; }
};
export const esc = s => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
export const chip = tag => `<span class="sig${SIG[tag]||EXTRA[tag] ? "" : " nodata"}" tabindex="0" data-tag="${tag}">&minus;${tag}</span>`;
export const chipsQuiet = html => chips(html).replace(/ tabindex="0"/g, "");
export const chips = html => String(html).replace(/−([A-Z]{1,3}\d{1,2})(?![\d_])/g, (m, t) => chip(t));
// Weiche Trennstellen (&shy;) in langen deutschen Wörtern, nur im Text außerhalb von Tags, nicht in Code und Kennzeichen.
// Chrome trennt Deutsch mit hyphens:auto nicht überall, deshalb einfache Silbenregeln: vor einem einzelnen Konsonanten
// zwischen Vokalen (ge-mes-sen), vor dem letzten Konsonanten einer Gruppe (Kenn-zei-chen) oder vor einem Silbenanfang wie tr, pl, st. ch, ck, sch, ph, qu zählen
// als ein Laut; Doppellaute (ei, au, eu, äu, ie) werden nicht getrennt. Ein Wort bricht dann nur an einer Silbengrenze.
const ONS = /^(schr|schl|schw|str|spr|bl|br|dr|fl|fr|gl|gr|kl|kr|pl|pr|tr|zw|sp|st)$/i;   // sp, st nur nach weiterem Konsonanten (Bes-tim-mung, aber Schreib-stel-le)
const SV = "aeiouyäöüAEIOUYÄÖÜ", SL = /^(sch|ch|ck|ph|qu|[a-zäöüß])/i, DL = /^(ei|ai|au|eu|äu|ie)/i;
export const silben = w => {
  if (w.length < 8 || !/^[A-Za-zÄÖÜäöüß]+$/.test(w)) return w;
  const t = []; for (let i = 0; i < w.length;) { const m = DL.exec(w.slice(i)) || SL.exec(w.slice(i)); const l = m ? m[0].length : 1; t.push(w.slice(i, i + l)); i += l; }
  const vok = x => SV.includes(x[0]);
  let out = "", pos = 0;
  for (let i = 0; i < t.length; i++) {
    if (i > 0 && vok(t[i]) === false) {
      let j = i; while (j < t.length && !vok(t[j])) j++;   // Konsonantengruppe t[i..j-1], danach Vokal
      if (j < t.length && vok(t[i - 1]) && j - i >= 1) {
        let cut = j - 1;   // vor dem letzten Konsonanten trennen, außer die letzten bilden einen Silbenanfang (tr, pl, st, schr …)
        for (let n = Math.min(3, j - i); n >= 2; n--) { const o = t.slice(j - n, j).join(""); if (ONS.test(o) && (!/^s[pt]$/i.test(o) || j - n > i)) { cut = j - n; break; } }
        for (let k = i; k < j; k++) { if (k === cut && pos >= 2 && w.length - pos >= 3) out += "­"; out += t[k]; pos += t[k].length; }
        i = j - 1; continue;
      }
    }
    out += t[i]; pos += t[i].length;
  }
  return out;
};
export const trenn = html => String(html ?? "").replace(/(<code[\s\S]*?<\/code>|<[^>]+>)|([^<]+)/g, (m, tag, txt) => tag ? m : txt.replace(/[A-Za-zÄÖÜäöüß]{8,}/g, silben));
export const plain = html => String(html).replace(/<[^>]+>/g, "");
// Leitfrage, Prüfpunkt: Text oder [Text, [Zielindex, …]]
export const qt = e => Array.isArray(e) ? e[0] : e;
export const zielTag = e => { const z = Array.isArray(e) && Array.isArray(e[1]) ? e[1] : []; return z.length ? ` <span class="zt" title="gehört zu Lernziel ${z.map(i => i+1).join(", ")}">Ziel ${z.map(i => i+1).join(", ")}</span>` : ""; };
export const extLinks = h => String(h ?? "").replace(/<a (?![^>]*\btarget=)/g, '<a target="_blank" rel="noopener" ');
export const quelle = w => w.q ? `<p class="quelle">Quelle: ${extLinks(w.q)}</p>` : "";
export const typOf = s => (s && s.typ) || "programmieren";
// Punkte der Lehrkraft im Raster der Übung (critOf), Summe null, solange nichts eingetragen ist
export const bewPunkte = ex => critOf(ex).map((_, i) => S.get(bewKey(ex.id, i)));
export const bewSumme = ex => { const v = bewPunkte(ex); return v.some(x => x !== null) ? v.reduce((a, x) => a + (+x || 0), 0) : null; };
// Kurz-Checks: ein = Eingangs-Check (Phase 1, Schlüssel q{i}), aus = Abschluss-Check (Phase 6, Schlüssel qa{i})
export const quizSet = (id, w) => { const q = QUIZ[id]; return !q ? [] : Array.isArray(q) ? (w === "ein" ? q : []) : (q[w] || []); };
export const quizKey = (id, w, qi) => `${id}:${w === "aus" ? "qa" : "q"}${qi}`;
// Arbeitsergebnisse: was eine Übung aus ihren vor-Übungen mitbringt
export const vorIds = s => (String(s.vor || "").match(/L\d\d/g) || []).filter(v => BY[v]);
export const mitbringen = s => vorIds(s).flatMap(v => (BY[v].ergebnis || []).map(e => ({...e, von: v})));
export const ART = {neu:["N","neu angelegt"], erweitert:["E","erweitert"], "übernommen":["Ü","unverändert übernommen"], umgebaut:["U","umgebaut"]};
export const artPill = a => ART[a] ? `<span class="art art-${ART[a][0]}" title="${ART[a][1]}">${ART[a][0]}</span>` : "";
export const HAS_ERG = SHEETS.some(s => s.ergebnis && s.ergebnis.length);
export const HSTUFE = ["Denkanstoß", "Vorgehen", "Lösungsskizze"];
export const hilfeLevel = (s, i) => Math.max(0, Math.min(3, Math.floor(+S.get(`${s.id}:h${i}`) || 0)));
// Gespeicherte Werte mit festem Typ (Schutz gegen veränderte Daten aus einer importierten Datei)
export const prVal = v => v === "ok" || v === "bad" ? v : null;
export const listOf = v => Array.isArray(v) ? v.filter(r => r && typeof r === "object") : [];
export const hilfeUsed = s => Object.keys(s.hilfe || {}).map(i => [+i, hilfeLevel(s, i)]).filter(([, l]) => l > 0).sort((a, b) => a[0] - b[0]);
export const hilfeText = s => { const u = hilfeUsed(s); return u.length ? u.map(([i, l]) => `Schritt ${i+1} mit Hilfe ${l} (${HSTUFE[l-1]}) gelöst`).join(", ") + "." : "Ohne Hilfen gelöst."; };
export const tableHTML = (head, rows) => `<div class="tw"><table><thead><tr>${head.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${chips(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
export const IC = {
  print:'<svg class="ic" viewBox="0 0 24 24"><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2"/><path d="M6 14h12v7H6z"/></svg>',
  pen:'<svg class="ic" viewBox="0 0 24 24"><path d="M4 20l4-1 11-11-3-3L5 16z"/></svg>',
  copy:'<svg class="ic" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
  play:'<svg class="ic" viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg>',
  pause:'<svg class="ic" viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
  trash:'<svg class="ic" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  undo:'<svg class="ic" viewBox="0 0 24 24"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>',
  text:'<svg class="ic" viewBox="0 0 24 24"><path d="M5 6V4h14v2M12 4v16M9 20h6"/></svg>',
  cursor:'<svg class="ic" viewBox="0 0 24 24"><path d="M5 3l14 8-6 2-3 6z"/></svg>',
  link:'<svg class="ic" viewBox="0 0 24 24"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 8l8 8"/></svg>',
  grid:'<svg class="ic" viewBox="0 0 24 24"><path d="M4 9h16M4 15h16M9 4v16M15 4v16"/></svg>',
  magnet:'<svg class="ic" viewBox="0 0 24 24"><path d="M6 4v8a6 6 0 0 0 12 0V4h-4v8a2 2 0 0 1-4 0V4z"/></svg>',
  line:'<svg class="ic" viewBox="0 0 24 24"><path d="M5 19L19 5"/></svg>',
  rect:'<svg class="ic" viewBox="0 0 24 24"><rect x="5" y="6" width="14" height="12" rx="1"/></svg>',
  eraser:'<svg class="ic" viewBox="0 0 24 24"><path d="M16 3l5 5-11 11H5l-2-2z"/><path d="M14 21h7"/></svg>'
};
export const sigEntries = s => s.sig.split(" ").flatMap(t => (SIG[t] || []).map(e => ({tag:t, ...e})));
export const USES = {};
SHEETS.forEach(s => s.sig.split(" ").forEach(t => (USES[t] ||= []).push(s.id)));

