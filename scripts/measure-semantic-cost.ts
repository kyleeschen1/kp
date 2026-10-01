import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { performance } from 'node:perf_hooks';
import { collectKpHtmlBundleFiles, type KpBundleManifest } from './bundle-closure-attribution.ts';
import { constant } from '../src/math/expression.ts';
import { createKpScalarExpression, createKpTypedMatrixFromRows } from '../src/math/typed-semantic-math.ts';
import { matrixProduct } from '../src/math/matrix-product.ts';
import { columnCombinations } from '../src/math/matrix-interpretations.ts';
import budgets from './semantic-cost-budgets.json' with { type: 'json' };

const root = 'dist/matrix-interpretations';
const manifest: KpBundleManifest = JSON.parse(await readFile(`${root}/.vite/manifest.json`, 'utf8'));
const pages = ['dot-product-passage', 'rectangular-product', 'matrix-column-product', 'matrix-column-combinations', 'matrix-examples', 'matrix-composition'];
const closures = [];
for (const page of pages) {
  const html = `experiments/${page === 'matrix-composition' ? 'matrix-column-combinations' : page}/index.html`;
  // Composition activates both lazy modules; include their full dependencies,
  // not only the ordinary page's cold static closure.
  const files = [html, ...collectKpHtmlBundleFiles(await readFile(`${root}/${html}`, 'utf8'), manifest, page === 'matrix-composition' || page === 'rectangular-product')];
  const measured = await Promise.all(files.map(async file => {
    const data = await readFile(`${root}/${file}`);
    return { file, raw: data.byteLength, gzip: gzipSync(data).byteLength };
  }));
  const sum = (suffix: string) => measured.filter(f => f.file.endsWith(suffix)).reduce((a, f) => ({ raw: a.raw + f.raw, gzip: a.gzip + f.gzip }), { raw: 0, gzip: 0 });
  closures.push({ page, js: sum('.js'), css: sum('.css'), html: sum('.html'), files: measured });
}
const inventory: { file: string; modules: string[] }[] = JSON.parse(await readFile(`${root}/module-inventory.json`, 'utf8'));
const reachableFiles = new Set(closures.flatMap(closure => closure.files.map(file => file.file)));
const modules = [...new Set(inventory.filter(chunk => reachableFiles.has(chunk.file)).flatMap(chunk => chunk.modules))].sort();
for (const module of modules) if (budgets.forbiddenModuleFragments.some(part => module.includes(part))) {
  throw new Error(`Unrelated module reached ordinary animations: ${module}`);
}
for (const closure of closures) {
  const limit = budgets.entries[closure.page as keyof typeof budgets.entries];
  if (closure.js.gzip > limit.jsGzip || closure.css.gzip > limit.cssGzip) throw new Error(`Entry budget exceeded: ${closure.page}`);
}
// An iframe is a separate document, but its assets still belong to this reader.
// Account for the union rather than reporting only the tiny menu script.
const menuFiles = [...new Map(closures.filter(c => ['matrix-examples', 'matrix-column-combinations'].includes(c.page))
  .flatMap(c => c.files.map(file => [file.file, file] as const))).values()];
const menuWithDefaultChild = { jsGzip: menuFiles.filter(f => f.file.endsWith('.js')).reduce((n, f) => n + f.gzip, 0),
  cssGzip: menuFiles.filter(f => f.file.endsWith('.css')).reduce((n, f) => n + f.gzip, 0) };
if (menuWithDefaultChild.jsGzip > budgets.menuWithDefaultChild.jsGzip || menuWithDefaultChild.cssGzip > budgets.menuWithDefaultChild.cssGzip) {
  throw new Error('Complete menu plus child exceeded budget');
}
const matrix = (id: string, n: number, seed: number) => createKpTypedMatrixFromRows({ id,
  rows: Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) =>
    createKpScalarExpression({ id: `${id}.${i}.${j}`, expression: constant((i + j + seed) % 7 - 3) }))),
});
const construction = [];
for (const size of [2, 10, 20]) {
  const a = matrix('bench.a', size, 1), b = matrix('bench.b', size, 3);
  const times: number[] = [];
  for (let i = 0; i < 9; i++) {
    const start = performance.now();
    const product = matrixProduct({ id: 'bench.product', left: a, right: b });
    const columns = columnCombinations(product);
    if (columns.column(0).terms[0]!.pairs[0] !== product.cell(0, 0).dot.pairs[0]) throw new Error('Lost contribution identity');
    if (i > 1) times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  construction.push({ size, contributions: size ** 3, medianMs: times[3], maxMs: times[6] });
}
const product = matrixProduct({ id: 'bench.product', left: matrix('bench.a', 2, 1), right: matrix('bench.b', 2, 3) });
const naive = JSON.stringify(product);
const inputs = JSON.stringify({ id: product.id, left: [[-2, -1], [-1, 0]], right: [[0, 1], [1, 2]] });
const report = { schemaVersion: 1, node: process.version, closures, menuWithDefaultChild, modules, construction,
  serializationIllustration: { actualTransport: 'These pages construct objects locally; neither JSON below is sent.',
    naiveObjectRawBytes: Buffer.byteLength(naive), naiveObjectGzipBytes: gzipSync(naive).byteLength,
    numericInputRawBytes: Buffer.byteLength(inputs), numericInputGzipBytes: gzipSync(inputs).byteLength },
  exclusions: ['Fonts are measured from actual browser requests separately.', 'Closure sizes are compressed estimates, not network transfers.', 'Node construction timings are local samples, not browser timings or a universal scaling claim.'] };
await mkdir('tmp/codex/semantic-cost', { recursive: true });
await writeFile('tmp/codex/semantic-cost/closure.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ closures: closures.map(({ files: _files, ...entry }) => entry), menuWithDefaultChild, construction, serialization: report.serializationIllustration }, null, 2));
