/* ---------- Fortschritt ---------- */
const filled = key => String(S.get(key) ?? "").trim().length > 0;
// Prüfpunkt erledigt: bestanden, oder nicht bestanden mit Ursache, Änderung und Nachtest
const prDone = (k, i) => { const v = S.get(k+":p"+i); return v === "ok" || (v === "bad" && ["u","m","n"].every(x => filled(`${k}:p${i}${x}`))); };
function phaseDone(s, p){
  const k = s.id;
  switch (p) {
    case 1: return !!S.get(k+":einst");
    case 2: return s.lf.every((_, i) => filled(k+":lf"+i)) && (s.plan || []).every((_, i) => S.get(k+":plan"+i));
    case 3: return !!S.get(k+":frei");
    case 4: return s.auf.every((_, i) => S.get(k+":a"+i));
    case 5: return s.pr.every((_, i) => prDone(k, i)) && (s.lfk || []).every((_, i) => filled(k+":lfk"+i));
    case 6: return s.ziele.every((_, i) => S.get(k+":z"+i)) && !!S.get(k+":fertig");
  }
  return false;
}
const doneCount = s => [1,2,3,4,5,6].filter(p => phaseDone(s, p)).length;
const nextSheet = () => SHEETS.find(s => doneCount(s) < 6);

