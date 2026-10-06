/* ================= Grundlagen ================= */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const BY = Object.fromEntries(SHEETS.map(s => [s.id, s]));
const S = {
  get(k, d=null){ try { const v = localStorage.getItem("uebh2:"+k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v){ try { if (v === null || v === undefined || v === "" || v === false) localStorage.removeItem("uebh2:"+k); else localStorage.setItem("uebh2:"+k, JSON.stringify(v)); } catch {} },
  all(){ const o = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith("uebh2:")) o[k.slice(6)] = JSON.parse(localStorage.getItem(k)); } } catch {} return o; }
};
const esc = s => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const chip = tag => `<span class="sig${SIG[tag]||EXTRA[tag] ? "" : " nodata"}" tabindex="0" data-tag="${tag}">&minus;${tag}</span>`;
const chipsQuiet = html => chips(html).replace(/ tabindex="0"/g, "");
const chips = html => String(html).replace(/−([A-Z]{1,3}\d{1,2})(?![\d_])/g, (m, t) => chip(t));
const plain = html => String(html).replace(/<[^>]+>/g, "");
// Leitfrage, Prüfpunkt: Text oder [Text, [Zielindex, …]]
const qt = e => Array.isArray(e) ? e[0] : e;
const zielTag = e => { const z = Array.isArray(e) && Array.isArray(e[1]) ? e[1] : []; return z.length ? ` <span class="zt" title="gehört zu Lernziel ${z.map(i => i+1).join(", ")}">Ziel ${z.map(i => i+1).join(", ")}</span>` : ""; };
const extLinks = h => String(h ?? "").replace(/<a (?![^>]*\btarget=)/g, '<a target="_blank" rel="noopener" ');
const quelle = w => w.q ? `<p class="quelle">Quelle: ${extLinks(w.q)}</p>` : "";
const typOf = s => (s && s.typ) || "programmieren";
// Kurz-Checks: ein = Eingangs-Check (Phase 1, Schlüssel q{i}), aus = Abschluss-Check (Phase 6, Schlüssel qa{i})
const quizSet = (id, w) => { const q = QUIZ[id]; return !q ? [] : Array.isArray(q) ? (w === "ein" ? q : []) : (q[w] || []); };
const quizKey = (id, w, qi) => `${id}:${w === "aus" ? "qa" : "q"}${qi}`;
// Arbeitsergebnisse: was eine Übung aus ihren vor-Übungen mitbringt
const vorIds = s => (String(s.vor || "").match(/L\d\d/g) || []).filter(v => BY[v]);
const mitbringen = s => vorIds(s).flatMap(v => (BY[v].ergebnis || []).map(e => ({...e, von: v})));
const ART = {neu:["N","neu angelegt"], erweitert:["E","erweitert"], "übernommen":["Ü","unverändert übernommen"], umgebaut:["U","umgebaut"]};
const artPill = a => ART[a] ? `<span class="art art-${ART[a][0]}" title="${ART[a][1]}">${ART[a][0]}</span>` : "";
const HAS_ERG = SHEETS.some(s => s.ergebnis && s.ergebnis.length);
const HSTUFE = ["Denkanstoß", "Vorgehen", "Lösungsskizze"];
const hilfeLevel = (s, i) => +S.get(`${s.id}:h${i}`) || 0;
const hilfeUsed = s => Object.keys(s.hilfe || {}).map(i => [+i, hilfeLevel(s, i)]).filter(([, l]) => l > 0).sort((a, b) => a[0] - b[0]);
const hilfeText = s => { const u = hilfeUsed(s); return u.length ? u.map(([i, l]) => `Schritt ${i+1} mit Hilfe ${l} (${HSTUFE[l-1]}) gelöst`).join(", ") + "." : "Ohne Hilfen gelöst."; };
const tableHTML = (head, rows) => `<div class="tw"><table><thead><tr>${head.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${chips(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const IC = {
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
const sigEntries = s => s.sig.split(" ").flatMap(t => (SIG[t] || []).map(e => ({tag:t, ...e})));
const USES = {};
SHEETS.forEach(s => s.sig.split(" ").forEach(t => (USES[t] ||= []).push(s.id)));

