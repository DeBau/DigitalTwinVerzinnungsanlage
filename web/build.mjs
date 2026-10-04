// Baut src/ zu einer einzigen web/index.html (läuft per Doppelklick ohne Server und ohne Internet).
//   npm run build        einmal bauen
//   npm run build -- --watch   bei jeder Änderung neu bauen
import * as esbuild from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(dir, 'src');
const lib = path.join(src, 'lib');
const watch = process.argv.includes('--watch');

// 'three' und 'three/addons/…' wie in der Importmap von src/index.html auflösen
const threeAlias = {
  name: 'three-alias',
  setup(b) {
    b.onResolve({ filter: /^three$/ }, () => ({ path: path.join(lib, 'three.module.min.js') }));
    b.onResolve({ filter: /^three\/addons\// }, (a) => ({ path: path.join(lib, 'addons', a.path.slice('three/addons/'.length)) }));
  },
};

// Nach jedem Build das JS in src/index.html einsetzen (statt Importmap + Modul-Skript)
const inline = {
  name: 'inline-html',
  setup(b) {
    b.onEnd(async (r) => {
      if (r.errors.length) return;
      const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
      let html = await readFile(path.join(src, 'index.html'), 'utf8');
      html = html.replace(/<script type="importmap">[\s\S]*?<\/script>\s*/, '');
      const tag = '<script type="module" src="./main.js"></script>';
      if (!html.includes(tag)) throw new Error(`${tag} nicht in src/index.html gefunden`);
      const banner = '/* Gebündelt aus src/ und three.js 0.170 (MIT-Lizenz, siehe src/lib/LICENSE-three.txt) */';
      html = html.replace(tag, () => `<script>\n${banner}\n${js}</script>`);
      await writeFile(path.join(dir, 'index.html'), html);
      console.log(`index.html geschrieben (${(html.length / 1e6).toFixed(2)} MB)`);
    });
  },
};

const ctx = await esbuild.context({
  entryPoints: [path.join(src, 'main.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  target: 'es2020',
  write: false,
  outfile: 'out.js',
  legalComments: 'none',
  plugins: [threeAlias, inline],
});

if (watch) {
  await ctx.watch();
  console.log('Beobachte src/ …');
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
