import { mkdir, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { build } from 'vite';
import { collectKpRuntimeImportClosure } from './runtime-import-closure.ts';
import ts from 'typescript';
import budgets from './authoring-boundary-budgets.json' with { type: 'json' };

const consumers = ['matrices', 'algebra-source', 'algebra-compile', 'algebra-editor'] as const;
const reports = [];
const config = ts.readConfigFile('tsconfig.test.json', ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
if (parsed.errors.length) throw new Error('Cannot read authoring measurement TypeScript configuration');
for (const consumer of consumers) {
  const entry = `tests/fixtures/authoring-cost/${consumer}.ts`;
  const staticLocalImports = collectKpRuntimeImportClosure(entry).map(path => relative(process.cwd(), path));
  const chunks: { file: string; raw: number; gzip: number; modules: string[] }[] = [];
  // Build each complete consumer separately: a shared multi-entry build can
  // make one caller appear small by charging its dependencies to another chunk.
  await build({ configFile: false, logLevel: 'silent', plugins: [{ name: 'authoring-cost',
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) if (chunk.type === 'chunk') chunks.push({
        file: chunk.fileName, raw: Buffer.byteLength(chunk.code), gzip: gzipSync(chunk.code).length,
        modules: Object.keys(chunk.modules).map(path => relative(process.cwd(), path)).sort(),
      });
    },
  }], build: { write: false, minify: true, rolldownOptions: { input: resolve(entry), preserveEntrySignatures: 'strict' } } });
  const modules = [...new Set(chunks.flatMap(chunk => chunk.modules))].sort();
  let types: { count: number; instantiations: number; localFiles: number } | undefined;
  if (process.argv.includes('--types')) {
    const program = ts.createProgram([resolve(entry)], { ...parsed.options, incremental: false, noEmit: true });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    if (diagnostics.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: path => path, getCurrentDirectory: () => process.cwd(), getNewLine: () => '\n',
    }));
    types = { count: program.getTypeCount(), instantiations: program.getInstantiationCount(),
      localFiles: program.getSourceFiles().filter(file => file.fileName.startsWith(process.cwd()) && !file.fileName.includes('/node_modules/')).length };
  }
  reports.push({ consumer, entry, staticLocalImports, chunks, modules,
    ...(types ? { types } : {}),
    raw: chunks.reduce((n, chunk) => n + chunk.raw, 0), gzip: chunks.reduce((n, chunk) => n + chunk.gzip, 0) });
}
await mkdir('tmp/codex/authoring-boundaries', { recursive: true });
await writeFile('tmp/codex/authoring-boundaries/runtime.json', JSON.stringify({ reports,
  qualification: 'Static local imports before tree shaking vs all emitted JS chunks for an independently built complete consumer. Not network transfer or TypeScript cost.' }, null, 2) + '\n');
console.log(JSON.stringify(reports.map(({ consumer, staticLocalImports, modules, raw, gzip, types }) => ({ consumer,
  staticLocalFiles: staticLocalImports.length, emittedModules: modules.length, raw, gzip,
  ...(types ? { types } : {}),
  emittedExamples: modules.filter(path => path.includes('/examples/')) })), null, 2));
if (process.argv.includes('--check')) {
  if (!process.argv.includes('--types')) throw new Error('Acceptance requires the complete runtime and TypeScript cohort; include --types.');
  if (reports.length !== Object.keys(budgets).length) throw new Error('Every budgeted consumer must be measured.');
  for (const report of reports) {
    const budget = budgets[report.consumer];
    if (!report.types || report.gzip > budget.gzip || report.types.count > budget.types || report.types.instantiations > budget.instantiations)
      throw new Error(`Authoring cost exceeds ${report.consumer} budget; diagnose before changing ceilings.`);
    if (report.consumer !== 'matrices' && report.modules.some(path => path.includes('/examples/')))
      throw new Error(`${report.consumer} must not ship example content.`);
    if (report.consumer === 'algebra-source' && report.staticLocalImports.some(path => path.startsWith('src/') &&
      !['src/authoring/algebra/source.ts', 'src/authoring/composed-algebra-source-v2.ts', 'src/authoring/composed-algebra-source.ts'].includes(path)))
      throw new Error('Source validation acquired an undeclared runtime dependency.');
  }
  console.log('Authoring runtime and TypeScript budgets passed for every complete consumer.');
}
