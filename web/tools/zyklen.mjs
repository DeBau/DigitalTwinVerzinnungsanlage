// Prüft die relativen Importe unter einem Ordner auf Zyklen.
//   node tools/zyklen.mjs [ordner=src] [start=main.js]
import { readdirSync, statSync, readFileSync } from 'node:fs';
import path from 'node:path';

const wurzel = process.argv[2] || 'src', start = process.argv[3] || 'main.js';
const dateien = [];
(function lesen(d) {
  for (const f of readdirSync(d)) {
    const p = path.join(d, f);
    if (statSync(p).isDirectory()) { if (f !== 'lib') lesen(p); } else if (f.endsWith('.js')) dateien.push(path.relative(wurzel, p).split(path.sep).join('/'));
  }
})(wurzel);
const graph = {};
for (const f of dateien) {
  const txt = readFileSync(path.join(wurzel, f), 'utf8');
  graph[f] = [...txt.matchAll(/^import (?:.*? from )?'(\.[^']+)'/gm)]
    .map((m) => path.posix.normalize(path.posix.join(path.posix.dirname(f), m[1]))).filter((x) => !x.startsWith('lib/'));
}
const zustand = {}, zyklen = [];
function dfs(f, stack) {
  if (zustand[f] === 1) { zyklen.push([...stack.slice(stack.indexOf(f)), f].join(' → ')); return; }
  if (zustand[f] === 2) return;
  zustand[f] = 1; stack.push(f);
  for (const t of graph[f] || []) dfs(t, stack);
  stack.pop(); zustand[f] = 2;
}
dfs(start, []);
const unerreicht = dateien.filter((f) => !zustand[f]);
console.log(zyklen.length ? 'Zyklen:\n' + zyklen.join('\n') : 'Keine Zyklen.');
if (unerreicht.length) console.log('Nicht eingebunden: ' + unerreicht.join(', '));
