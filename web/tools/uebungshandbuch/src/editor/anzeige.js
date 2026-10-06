// Editor-Kern: Blatt und Zeichnung im geöffneten Editor neu zeichnen, Blattzahl nachführen.
import { $, BY } from '../app/basis.js';
import { PH } from './svg.js';
import { ED } from './status.js';
import { inkSVG, pageCount } from './zeichnen.js';
import { pagesSVG, skMeta } from './blaetter.js';
import { updateProps } from './eigenschaften.js';

export function sizeSVG(){
  const st = $("#edstage"), svg = ED.svg; if (!st || !svg) return;
  const w = Math.max(320, Math.min(st.clientWidth - 28, (st.clientHeight - 28) * 1000 / PH));
  svg.style.width = w + "px"; svg.style.height = (w * PH * ED.pages / 1000) + "px";
}
export function checkPages(){
  const n = pageCount(ED.key, ED.data, ED.extraY || 0);
  if (!ED.svg || n === ED.pages) return;
  ED.pages = n; ED.svg.setAttribute("viewBox", `0 0 1000 ${PH*n}`);
  refreshTpl(); sizeSVG();
}
export function refreshTpl(){ if (ED.svg) ED.svg.querySelector(".tpl").innerHTML = pagesSVG(ED.key, BY[ED.scope], skMeta(ED.scope, ED.key, ED.data), ED.pages, true); }
export function renderInk(){ if (ED.svg) { ED.svg.querySelector(".ink").innerHTML = inkSVG(ED.data, true, ED.key); checkPages(); } updateProps(); }
