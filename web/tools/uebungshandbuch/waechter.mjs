// Wächter für die Module in src/: Jeder Bezeichner muss im Modul deklariert, importiert oder ein bekanntes
// Browser-Global sein. esbuild selbst meldet einen vergessenen Import nicht, er würde erst zur Laufzeit als
// ReferenceError auffallen. Zusätzlich: Importe müssen auf exportierte Namen zeigen.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../package.json'));
const acorn = require('acorn');

// Browser- und Sprach-Globals, die der Code benutzen darf, dazu die Platzhalter des Builds
export const GLOBALS = new Set(`
window document navigator location history localStorage sessionStorage console alert confirm prompt print
setTimeout clearTimeout setInterval clearInterval requestAnimationFrame cancelAnimationFrame queueMicrotask
addEventListener removeEventListener getSelection innerWidth innerHeight scrollTo scrollX scrollY getComputedStyle matchMedia
Blob URL File FileReader Image ImageData DOMParser XMLSerializer MutationObserver ResizeObserver IntersectionObserver
Event CustomEvent KeyboardEvent PointerEvent MouseEvent HTMLElement Element Node SVGElement DOMMatrix DOMPoint
Math JSON Object Array String Number Boolean Symbol Date RegExp Error TypeError RangeError Map Set WeakMap WeakSet
Promise Proxy Reflect Intl BigInt Infinity NaN undefined isNaN isFinite parseInt parseFloat encodeURIComponent
decodeURIComponent encodeURI decodeURI structuredClone globalThis arguments fetch performance crypto atob btoa
__SIG__ __SHEETS__ __TEXTE__ __QUIZ__ __STIL__
`.trim().split(/\s+/));

// Kleine Gültigkeitsbereichs-Analyse: Funktions- und Blockbereiche, Parameter, catch, Klassen
function pruefeModul(ast) {
  const frei = new Map(), imports = new Map(), exports = new Set();
  const namen = (p, out = []) => {
    if (!p) return out;
    if (p.type === 'Identifier') out.push(p.name);
    else if (p.type === 'ObjectPattern') p.properties.forEach((q) => namen(q.type === 'RestElement' ? q.argument : q.value, out));
    else if (p.type === 'ArrayPattern') p.elements.forEach((q) => namen(q, out));
    else if (p.type === 'AssignmentPattern') namen(p.left, out);
    else if (p.type === 'RestElement') namen(p.argument, out);
    return out;
  };
  // Deklarationen, die in einem Bereich gelten (var/function bis zur Funktionsgrenze, let/const/class im Block)
  function sammle(body, fnBereich) {
    const s = new Set();
    const lauf = (n, tief) => {
      if (!n || typeof n.type !== 'string') return;
      if (n.type === 'VariableDeclaration') { if (n.kind === 'var' ? fnBereich : !tief) n.declarations.forEach((d) => namen(d.id).forEach((x) => s.add(x))); }
      else if (n.type === 'FunctionDeclaration') { if (!tief) s.add(n.id.name); return; }
      else if (n.type === 'ClassDeclaration') { if (!tief) s.add(n.id.name); return; }
      if (/Function/.test(n.type)) return;
      for (const k of Object.keys(n)) {
        if (k === 'start' || k === 'end') continue;
        const v = n[k], neuTief = tief || /^(BlockStatement|ForStatement|ForInStatement|ForOfStatement|SwitchStatement|CatchClause)$/.test(n.type);
        if (Array.isArray(v)) v.forEach((x) => lauf(x, neuTief)); else if (v && typeof v.type === 'string') lauf(v, neuTief);
      }
    };
    (Array.isArray(body) ? body : [body]).forEach((x) => lauf(x, false));
    return s;
  }
  const bereiche = [];
  const bekannt = (x) => bereiche.some((b) => b.has(x));
  function ref(name, node) { if (!bekannt(name) && !GLOBALS.has(name)) { if (!frei.has(name)) frei.set(name, node.start); } }
  function besuche(n, parent, key) {
    if (!n || typeof n.type !== 'string') return;
    switch (n.type) {
      case 'Identifier': {
        const skip = parent && ((parent.type === 'MemberExpression' && key === 'property' && !parent.computed)
          || ((parent.type === 'Property' || parent.type === 'MethodDefinition' || parent.type === 'PropertyDefinition') && key === 'key' && !parent.computed)
          || ((parent.type === 'LabeledStatement' || parent.type === 'BreakStatement' || parent.type === 'ContinueStatement') && key === 'label'));
        if (!skip) ref(n.name, n);
        return;
      }
      case 'ImportDeclaration': n.specifiers.forEach((s) => imports.set(s.local.name, { von: n.source.value, name: s.imported ? s.imported.name : 'default' })); return;
      case 'ExportNamedDeclaration': {
        if (n.declaration) { const d = n.declaration; (d.type === 'VariableDeclaration' ? d.declarations.flatMap((x) => namen(x.id)) : [d.id.name]).forEach((x) => exports.add(x)); besuche(d, n, 'declaration'); }
        n.specifiers.forEach((s) => { exports.add(s.exported.name); ref(s.local.name, s); });
        return;
      }
      case 'FunctionDeclaration': case 'FunctionExpression': case 'ArrowFunctionExpression': {
        const b = new Set(n.params.flatMap((p) => namen(p)));
        if (n.type === 'FunctionExpression' && n.id) b.add(n.id.name);
        if (n.body.type === 'BlockStatement') sammle(n.body.body, true).forEach((x) => b.add(x));
        bereiche.push(b);
        n.params.forEach((p) => besuche(p, n, 'params'));
        if (n.body.type === 'BlockStatement') n.body.body.forEach((x) => besuche(x, n.body, 'body')); else besuche(n.body, n, 'body');
        bereiche.pop(); return;
      }
      case 'BlockStatement': case 'StaticBlock': { bereiche.push(sammle(n.body, false)); n.body.forEach((x) => besuche(x, n, 'body')); bereiche.pop(); return; }
      case 'ForStatement': case 'ForInStatement': case 'ForOfStatement': {
        const b = new Set(); const init = n.init || n.left; if (init && init.type === 'VariableDeclaration') init.declarations.forEach((d) => namen(d.id).forEach((x) => b.add(x)));
        bereiche.push(b); for (const k of ['init', 'test', 'update', 'left', 'right', 'body']) besuche(n[k], n, k); bereiche.pop(); return;
      }
      case 'SwitchStatement': { besuche(n.discriminant, n, 'discriminant'); bereiche.push(sammle(n.cases.flatMap((c) => c.consequent), false)); n.cases.forEach((c) => besuche(c, n, 'cases')); bereiche.pop(); return; }
      case 'CatchClause': { bereiche.push(new Set(namen(n.param))); besuche(n.body, n, 'body'); bereiche.pop(); return; }
      case 'ClassExpression': case 'ClassDeclaration': { const b = new Set(n.id ? [n.id.name] : []); bereiche.push(b); besuche(n.superClass, n, 'superClass'); besuche(n.body, n, 'body'); bereiche.pop(); return; }
    }
    for (const k of Object.keys(n)) {
      if (k === 'start' || k === 'end') continue;
      const v = n[k]; if (Array.isArray(v)) v.forEach((x) => besuche(x, n, k)); else if (v && typeof v.type === 'string') besuche(v, n, k);
    }
  }
  const top = sammle(ast.body, true);
  ast.body.forEach((s) => { if (s.type === 'ImportDeclaration') s.specifiers.forEach((x) => top.add(x.local.name)); });
  bereiche.push(top);
  ast.body.forEach((s) => besuche(s, ast, 'body'));
  return { frei, imports, exports };
}

// Prüft alle Module ab dem Einstieg. Gibt eine Liste von Fehlertexten zurück.
export function waechter(einstieg) {
  const fehler = [], module = new Map(), offen = [path.resolve(einstieg)];
  while (offen.length) {
    const f = offen.pop(); if (module.has(f)) continue;
    const text = readFileSync(f, 'utf8');
    let ast; try { ast = acorn.parse(text, { ecmaVersion: 'latest', sourceType: 'module' }); }
    catch (e) { fehler.push(`${path.basename(f)}: Syntaxfehler ${e.message}`); module.set(f, null); continue; }
    const m = pruefeModul(ast); m.text = text; module.set(f, m);
    for (const { von } of m.imports.values()) offen.push(path.resolve(path.dirname(f), von));
    for (const s of ast.body) if (s.type === 'ImportDeclaration' && !s.specifiers.length) offen.push(path.resolve(path.dirname(f), s.source.value));
  }
  const wurzel = path.dirname(path.resolve(einstieg));
  // Schichten: main.js importiert die Module in Ladereihenfolge. Ein Modul darf nur aus Modulen importieren,
  // die davor stehen. Sonst ändert esbuild die Ladereihenfolge und Konstanten wären beim Laden noch leer.
  const haupt = acorn.parse(readFileSync(path.resolve(einstieg), 'utf8'), { ecmaVersion: 'latest', sourceType: 'module' });
  const rang = new Map(haupt.body.filter((s) => s.type === 'ImportDeclaration').map((s, i) => [path.resolve(wurzel, s.source.value), i]));
  for (const [f, m] of module) {
    if (!m || !rang.has(f)) continue;
    for (const { von, name } of m.imports.values()) {
      const z = path.resolve(path.dirname(f), von);
      if (!rang.has(z)) fehler.push(`${path.relative(wurzel, f)}: importiert ${von}, das main.js nicht lädt`);
      else if (rang.get(z) > rang.get(f)) fehler.push(`${path.relative(wurzel, f).replace(/\\/g, '/')}: importiert „${name}“ aus ${von}, das in main.js später geladen wird (Schichtverletzung)`);
    }
  }
  for (const [f, m] of module) {
    if (!m) continue;
    const r = path.relative(wurzel, f).replace(/\\/g, '/');
    for (const [name, pos] of m.frei) { const zeile = m.text.slice(0, pos).split('\n').length; fehler.push(`${r}:${zeile}: „${name}“ ist weder deklariert noch importiert`); }
    for (const [lokal, { von, name }] of m.imports) {
      const q = module.get(path.resolve(path.dirname(f), von));
      if (q && !q.exports.has(name)) fehler.push(`${r}: Import „${name}“ aus ${von} wird dort nicht exportiert`);
    }
  }
  return fehler;
}
