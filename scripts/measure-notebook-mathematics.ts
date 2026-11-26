import { build, type Plugin } from 'vite';
import { execFileSync } from 'node:child_process';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import ts from 'typescript';

const root = fileURLToPath(new URL('..', import.meta.url));
// Accepted workspace immediately before M0; comparison reads Git objects and
// never checks out, rewrites or measures a reduced surrogate application.
const baseline = '1c1e8791c06f106f7237a2a92666309bf9b6ece5';
const sources = [
  ['notebook', 'src/fraction-notebook/app.ts'],
  ['native-reader', 'src/reader/app/exemplar-entry.ts'],
  ['mathematical-reading', 'src/fraction-notebook/math-preview.ts']
] as const;
function historicalSources(): Plugin {
  const cache = new Map<string, string>();
  return { name: 'read-notebook-baseline', enforce: 'pre', load(id) {
    const [path, query] = id.split('?'), local = relative(root, path!);
    if (local.startsWith('..') || !/^(src|content)\//.test(local) || !/\.(ts|js|json|css|md)$/.test(local)) return null;
    let source = cache.get(local);
    if (source === undefined) { source = execFileSync('git', ['show', `${baseline}:${local}`], { cwd: root, encoding: 'utf8', maxBuffer: 10_000_000 }); cache.set(local, source); }
    return query === 'raw' ? `export default ${JSON.stringify(source)};` : source;
  } };
}
async function measure(label: string, entry: string, before: boolean) {
  const output = await build({ root, configFile: false, publicDir: false, logLevel: 'silent', base: './',
    plugins: before ? [historicalSources()] : [],
    build: { write: false, minify: true, target: 'esnext', cssCodeSplit: true,
      rolldownOptions: { input: resolve(root, entry), preserveEntrySignatures: 'strict' } } });
  const files: { file: string; raw: number; gzip: number }[] = [];
  const chunks: { file: string; entry: boolean; imports: readonly string[]; dynamicImports: readonly string[]; modules: readonly string[] }[] = [];
  for (const result of Array.isArray(output) ? output : [output]) {
    if (!('output' in result)) throw new Error('Expected a finished build.');
    for (const item of result.output) {
      const bytes = Buffer.from(item.type === 'chunk' ? item.code : item.source);
      files.push({ file: item.fileName, raw: bytes.length, gzip: gzipSync(bytes).length });
      if (item.type === 'chunk') chunks.push({ file: item.fileName, entry: item.isEntry, imports: item.imports, dynamicImports: item.dynamicImports,
        modules: Object.keys(item.modules).map(path => relative(root, path)).sort() });
    }
  }
  const initial = new Set<string>(), queue = chunks.filter(chunk => chunk.entry).map(chunk => chunk.file);
  while (queue.length) {
    const file = queue.pop()!; if (initial.has(file)) continue; initial.add(file);
    const chunk = chunks.find(chunk => chunk.file === file); if (!chunk) throw new Error(`Missing emitted dependency ${file}`);
    queue.push(...chunk.imports);
  }
  const total = (selected: typeof files) => ({ files: selected.length, raw: selected.reduce((sum, f) => sum + f.raw, 0), gzip: selected.reduce((sum, f) => sum + f.gzip, 0) });
  const initialModules = chunks.filter(chunk => initial.has(chunk.file)).flatMap(chunk => chunk.modules);
  if (label === 'notebook' && !before && initialModules.some(module => /math-runtime|math-controller|graph-2d-svg|graph-3d/.test(module)))
    throw new Error('The ordinary notebook acquired a mathematical runtime or renderer eagerly.');
  if (label === 'mathematical-reading' && chunks.some(chunk => chunk.modules.some(module => /graph-3d|animation-catalogue|mathjs/.test(module))))
    throw new Error('The mathematical reading acquired an unrelated 3D/catalogue runtime.');
  const summary = { label, revision: before ? baseline : 'working-tree', initialJs: total(files.filter(f => initial.has(f.file))),
    completeJsCss: total(files.filter(f => /\.(js|css)$/.test(f.file))), completeEmitted: total(files) };
  console.log(JSON.stringify(summary));
  return { ...summary, files, chunks };
}
function measureTypes(before: boolean) {
  const tracked = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', baseline], { cwd: root, encoding: 'utf8', maxBuffer: 10_000_000 }).trim().split('\n'));
  const cache = new Map<string, string>();
  const owned = (file: string) => { const path = relative(root, file); return path !== '' && !path.startsWith('..') && !path.startsWith('node_modules/') ? path : undefined; };
  const readFile = (file: string) => {
    const path = owned(file); if (!before || path === undefined) return ts.sys.readFile(file);
    if (!tracked.has(path)) return undefined;
    let text = cache.get(path);
    if (text === undefined) { text = execFileSync('git', ['show', `${baseline}:${path}`], { cwd: root, encoding: 'utf8', maxBuffer: 10_000_000 }); cache.set(path, text); }
    return text;
  };
  const fileExists = (file: string) => !before || owned(file) === undefined ? ts.sys.fileExists(file) : tracked.has(owned(file)!);
  const configPath = resolve(root, 'config/typescript/tsconfig.fraction-notebook.json');
  const config = ts.readConfigFile(configPath, readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
  const parsed = ts.parseJsonConfigFileContent(config.config, { ...ts.sys, readFile, fileExists,
    readDirectory: (...args) => ts.sys.readDirectory(...args).filter(file => fileExists(file)) }, dirname(configPath));
  const host = ts.createCompilerHost(parsed.options); host.readFile = readFile; host.fileExists = fileExists;
  host.getSourceFile = (file, language) => { const text = readFile(file); return text === undefined ? undefined : ts.createSourceFile(file, text, language); };
  const program = ts.createProgram(parsed.fileNames, parsed.options, host);
  const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
  if (diagnostics.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: path => path, getCurrentDirectory: () => root, getNewLine: () => '\n'
  }));
  const summary = { revision: before ? baseline : 'working-tree', rootFiles: parsed.fileNames.length, files: program.getSourceFiles().length,
    types: program.getTypeCount(), instantiations: program.getInstantiationCount() };
  console.log(JSON.stringify({ typecheck: summary })); return summary;
}
const consumers = [];
for (const [label, entry] of sources) {
  if (label !== 'mathematical-reading') consumers.push(await measure(label, entry, true));
  consumers.push(await measure(label, entry, false));
}
const typechecks = [measureTypes(true), measureTypes(false)];
const qualification = 'Independent production consumers, including every reachable lazy chunk and emitted asset. Initial JS excludes lazy chunks. Complete emitted includes all emitted font formats and inline assets; gzip is a per-file estimate, not HTTP transfer. HTML, API payloads, network overhead and server work are excluded. Type comparisons use each revision’s complete scoped config and current installed dependencies; the current config adds mathematical, rendering and cache consumers. Runtime/paint measurements are separate in visual:notebook-mathematics.';
await mkdir(resolve(root, 'tmp/codex/notebook-mathematics-cost'), { recursive: true });
await writeFile(resolve(root, 'tmp/codex/notebook-mathematics-cost/production.json'), JSON.stringify({ qualification, consumers, typechecks }, null, 2));
console.log(qualification);
