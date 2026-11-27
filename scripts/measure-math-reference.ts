import { build } from 'vite';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import assert from 'node:assert/strict';

// Measure the actual index entry. Linked destinations are navigations, not hidden imports.
const output = await build({ configFile: false, publicDir: false, logLevel: 'silent',
  build: { write: false, minify: true, rolldownOptions: { input: resolve('experiments/math-reference/index.html') } } });
const files: { file: string; raw: number; gzip: number }[] = [];
for (const result of Array.isArray(output) ? output : [output]) {
  if (!('output' in result)) throw new Error('Expected a completed build');
  for (const item of result.output) {
    assert.equal(item.type, 'asset', 'The reference index must not acquire a JavaScript runtime');
    const bytes = Buffer.from(item.source);
    files.push({ file: item.fileName, raw: bytes.length, gzip: gzipSync(bytes).length });
  }
}
const sum = (selected: typeof files) => ({ files: selected.length, raw: selected.reduce((n, x) => n + x.raw, 0), gzip: selected.reduce((n, x) => n + x.gzip, 0) });
const reading = sum(files.filter(x => /\.(html|css)$/.test(x.file)));
assert.ok(reading.gzip < 8000, 'Static index HTML/CSS exceeds its bounded 8 KB allowance');
console.log(JSON.stringify({ javascript: 0, reading, completeEmitted: sum(files) }, null, 2));
console.log('Complete static index and emitted font formats; linked destination payloads are separate. Gzip sums estimate files, not network transfer.');
