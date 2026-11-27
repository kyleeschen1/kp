import { build } from 'vite';
import { relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
const built = await build({ root, configFile: false, publicDir: false, logLevel: 'silent',
  build: { write: false, minify: true, target: 'esnext',
    rolldownOptions: { input: resolve(root, 'experiments/matrix-reference/index.html') } } });
const files: { file: string; raw: number; gzip: number }[] = [];
const modules = new Set<string>();
for (const result of Array.isArray(built) ? built : [built]) {
  if (!('output' in result)) throw new Error('Expected a finished production build.');
  for (const item of result.output) {
    const bytes = Buffer.from(item.type === 'chunk' ? item.code : item.source);
    files.push({ file: item.fileName, raw: bytes.length, gzip: gzipSync(bytes).length });
    if (item.type === 'chunk') for (const module of Object.keys(item.modules)) {
      const path = relative(root, module); modules.add(path);
      assert.doesNotMatch(path, /prosemirror|codemirror|src\/(fraction-notebook|editor-chat|editor|animation-player)\/|graph-3d|three\/|mathjs/,
        `The standalone reference acquired an editor, chat or unrelated mathematics dependency: ${path}`);
    }
  }
}
assert.ok([...modules].some(path => path.endsWith('matrix-column-combinations/embed.ts')));
assert.ok([...modules].some(path => path.endsWith('interaction/row-picker.ts')), 'Use the existing host-free picker.');
const total = (selected: typeof files) => ({ files: selected.length, raw: selected.reduce((sum, f) => sum + f.raw, 0),
  gzip: selected.reduce((sum, f) => sum + f.gzip, 0) });
const jsCss = total(files.filter(f => /\.(js|css)$/.test(f.file)));
// Bounded standalone consumer including every reachable chunk. Fonts are
// reported separately rather than hidden behind the JavaScript-only budget.
assert.ok(jsCss.gzip <= 200_000, `Reference JS/CSS gzip exceeds 200 KB: ${jsCss.gzip}`);
console.log(JSON.stringify({ completeJsCss: jsCss, completeEmitted: total(files), modules: modules.size }));
console.log('All emitted chunks/assets included. Gzip is per-file estimation, not measured network transfer. No editor/chat/3D modules.');
