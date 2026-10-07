// Werkzeug für die ES-Module in src/. Die Ladereihenfolge ist die Reihenfolge der Importe in src/main.js.
//   node web/tools/uebungshandbuch/module.mjs imports                     Importzeilen aller Module neu berechnen
//   node web/tools/uebungshandbuch/module.mjs check                       Schichtverletzungen melden (Bezug auf ein später geladenes Modul)
//   node web/tools/uebungshandbuch/module.mjs move <Name> <von> <nach>    Top-Level-Deklaration samt Kommentar davor verschieben,
//                                                                         Module ohne .js relativ zu src/, z. B. editor/vorlagen/alt
// Jede Top-Level-Deklaration eines Moduls steht mit export davor. imports trägt für jeden benutzten Namen
// eines anderen Moduls den passenden Import ein. Ein neues Modul musst du vorher in main.js importieren.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const hier = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(hier, '../../package.json'));
const acorn = require('acorn');
const src = path.join(hier, 'src') + path.sep;
const parse = (t) => acorn.parse(t, { ecmaVersion: 'latest', sourceType: 'module' });
const lies = (n) => existsSync(src + n + '.js') ? readFileSync(src + n + '.js', 'utf8') : '';
const folge = parse(readFileSync(src + 'main.js', 'utf8')).body.filter((s) => s.type === 'ImportDeclaration').map((s) => s.source.value.replace(/^\.\//, '').replace(/\.js$/, ''));

function refs(node, out = new Set(), parent = null, key = null) {
  if (!node || typeof node.type !== 'string') return out;
  if (node.type === 'Identifier') {
    const skip = parent && ((parent.type === 'MemberExpression' && key === 'property' && !parent.computed)
      || ((parent.type === 'Property' || parent.type === 'MethodDefinition' || parent.type === 'PropertyDefinition') && key === 'key' && !parent.computed)
      || ((parent.type === 'LabeledStatement' || parent.type === 'BreakStatement' || parent.type === 'ContinueStatement') && key === 'label'));
    if (!skip) out.add(node.name);
    return out;
  }
  if (node.type === 'ImportDeclaration') return out;
  for (const k of Object.keys(node)) {
    if (k === 'start' || k === 'end') continue;
    const v = node[k];
    if (Array.isArray(v)) v.forEach((x) => refs(x, out, node, k)); else if (v && typeof v.type === 'string') refs(v, out, node, k);
  }
  return out;
}
const declNames = (s) => {
  const d = s.type === 'ExportNamedDeclaration' ? s.declaration : s; if (!d) return [];
  if (d.type === 'FunctionDeclaration' || d.type === 'ClassDeclaration') return [d.id.name];
  if (d.type === 'VariableDeclaration') return d.declarations.flatMap((x) => x.id.type === 'Identifier' ? [x.id.name] : []);
  return [];
};
// Lokal deklarierte Namen (Parameter, Variablen in Funktionen, catch). Sie verdecken gleichnamige Exporte anderer
// Module und bekommen deshalb keinen Import (sonst zöge z. B. ein Parameter „text“ einen Import aus symbole/grund.js).
function lokale(ast) {
  const out = new Set();
  const muster = (p) => {
    if (!p) return;
    if (p.type === 'Identifier') out.add(p.name);
    else if (p.type === 'ObjectPattern') p.properties.forEach((q) => muster(q.value || q.argument));
    else if (p.type === 'ArrayPattern') p.elements.forEach(muster);
    else if (p.type === 'AssignmentPattern') muster(p.left);
    else if (p.type === 'RestElement') muster(p.argument);
  };
  const lauf = (n, tief) => {
    if (!n || typeof n.type !== 'string') return;
    if (/Function/.test(n.type)) { n.params.forEach(muster); if (n.id && tief) out.add(n.id.name); tief = true; }
    if (n.type === 'VariableDeclarator' && tief) muster(n.id);
    if (n.type === 'CatchClause') muster(n.param);
    for (const v of Object.values(n)) {
      if (Array.isArray(v)) v.forEach((x) => lauf(x, tief)); else if (v && typeof v.type === 'string') lauf(v, tief);
    }
  };
  ast.body.forEach((s) => lauf(s, false));
  return out;
}
const ohneImporte = (t) => t.replace(/^import [^;]*;[ ]*(\r?\n)?/gm, '');
const istGeteilt = (n) => n.startsWith('symbole/');
// symbole/ teilt sich der Editor mit dem Schaltplan: Dort zählen für andere Module nur die Exporte,
// und die Importzeilen pflegt das Modul selbst (imports schreibt es nicht um).
function module() {
  return folge.map((n, i) => {
    const t = ohneImporte(lies(n)), ast = parse(t), eigen = new Set(ast.body.flatMap(declNames));
    const exporte = ast.body.filter((s) => s.type === 'ExportNamedDeclaration').flatMap(declNames);
    return { n, i, t, ast, eigen, top: istGeteilt(n) ? new Set(exporte) : eigen, lokal: lokale(ast) };
  });
}

const [cmd, ...a] = process.argv.slice(2);
if (cmd === 'move') {
  const [name, von, nach] = a;
  if (!folge.includes(nach)) throw new Error(`${nach} wird in main.js nicht importiert`);
  const t = lies(von), ast = parse(t);
  const st = ast.body.find((s) => declNames(s).includes(name)); if (!st) throw new Error(`${name} nicht in ${von}`);
  let s0 = st.start; while (s0 > 0 && t[s0 - 1] !== '\n') s0--;
  for (;;) {   // direkt davor stehende Kommentarzeilen mitnehmen
    const p = s0 - 1; if (p < 0) break; let q = p; while (q > 0 && t[q - 1] !== '\n') q--;
    const zeile = t.slice(q, p).trim(); if (zeile.startsWith('//') || (zeile.startsWith('/*') && zeile.endsWith('*/'))) s0 = q; else break;
  }
  let e = st.end; while (e < t.length && t[e] !== '\n') e++; if (e < t.length) e++;
  writeFileSync(src + von + '.js', t.slice(0, s0) + t.slice(e));
  let z = lies(nach); if (z && !z.endsWith('\n')) z += '\n';
  writeFileSync(src + nach + '.js', z + t.slice(s0, e));
  console.log(`verschoben: ${name} ${von} → ${nach}. Danach: node module.mjs imports`);
}
if (cmd === 'imports' || cmd === 'check') {
  const M = module(), wo = new Map();
  for (const m of M) for (const x of m.top) { if (x === 'init') continue; if (wo.has(x)) console.log(`DOPPELT: ${x} in ${wo.get(x).n} und ${m.n}`); wo.set(x, m); }
  let fehler = 0;
  for (const m of M) {
    const imp = new Map();
    for (const s of m.ast.body) for (const r of refs(s)) { const g = wo.get(r); if (g && g !== m && !m.eigen.has(r) && !m.lokal.has(r)) (imp.get(g) || imp.set(g, new Set()).get(g)).add(r); }
    const auf = [...imp].filter(([g]) => g.i > m.i);
    if (auf.length) { fehler++; console.log(`SCHICHT: ${m.n} benutzt aus später geladenen Modulen ${auf.map(([g, s]) => `${g.n} (${[...s].join(', ')})`).join('; ')}`); }
    if (cmd === 'imports' && !istGeteilt(m.n)) {
      const nl = m.t.includes('\r\n') ? '\r\n' : '\n';
      const rel = (n) => { const r = path.posix.relative(path.posix.dirname(m.n), n) + '.js'; return r.startsWith('.') ? r : './' + r; };
      const kopf = [...imp].sort((x, y) => x[0].i - y[0].i).map(([g, s]) => `import { ${[...s].sort().join(', ')} } from '${rel(g.n)}';`).join(nl);
      // Kommentarzeilen am Dateianfang bleiben oben, die Importe folgen darunter
      const L = m.t.replace(/^(\r?\n)+/, '').split(/(?<=\n)/); let k = 0; while (k < L.length && /^\s*(\/\/|\/\*|\*)/.test(L[k])) k++;
      const vor = L.slice(0, k).join(''), rest = L.slice(k).join('').replace(/^(\r?\n)+/, '');
      writeFileSync(src + m.n + '.js', vor + (kopf ? kopf + nl + nl : (vor ? nl : '')) + rest);
    }
  }
  console.log(fehler ? `${fehler} Module mit Schichtverletzung` : 'Schichten in Ordnung');
  if (fehler) process.exitCode = 1;
}
if (!['move', 'imports', 'check'].includes(cmd)) console.log('Aufruf: node module.mjs imports | check | move <Name> <von> <nach>');
