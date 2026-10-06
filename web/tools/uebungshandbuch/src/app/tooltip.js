/* ---------- Signal-Tooltip ---------- */
const tip = $("#tip");
function showTip(el){
  const t = el.dataset.tag, list = SIG[t], ex = EXTRA[t]; if (!list && !ex) return;
  tip.innerHTML = (ex ? `<div><span class="tn">−${t}</span> ${ex}</div>` : "") + (list || []).map(s => `<div><span class="tn">${s.n}</span> <span class="ta">${s.a}</span><br>${esc(s.k)}</div>`).join("");
  tip.classList.add("on"); const r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
  let x = Math.min(Math.max(8, r.left), innerWidth - w - 8), y = r.bottom + 8; if (y + h > innerHeight - 8) y = r.top - h - 8;
  tip.style.left = x + "px"; tip.style.top = y + "px";
}
const hideTip = () => tip.classList.remove("on");
document.addEventListener("mouseover", e => { const el = e.target.closest(".sig"); if (el) showTip(el); });
document.addEventListener("mouseout", e => { if (e.target.closest(".sig")) hideTip(); });
document.addEventListener("focusin", e => { const el = e.target.closest(".sig"); if (el) showTip(el); });
document.addEventListener("focusout", hideTip);
addEventListener("scroll", hideTip, {passive:true});

