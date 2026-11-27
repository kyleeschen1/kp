import { defineConfig } from 'vite';
import { gzipSync } from 'node:zlib';
export default defineConfig({ plugins: [{ name: 'polynomial-accumulation-output-cost', writeBundle(_options, bundle) {
  const totals = { jsCssGzip: 0, allEmittedGzip: 0, files: 0 };
  for (const [name, entry] of Object.entries(bundle)) {
    const source = entry.type === 'chunk' ? entry.code : entry.source;
    const gzip = gzipSync(typeof source === 'string' ? Buffer.from(source) : Buffer.from(source)).byteLength;
    totals.files++; totals.allEmittedGzip += gzip;
    if (/\.(?:js|css)$/.test(name)) totals.jsCssGzip += gzip;
  }
  console.log(JSON.stringify({ consumer: 'polynomial accumulation reference', ...totals,
    qualification: 'Complete emitted assets including all fonts and HTML; per-file gzip estimates, not network or memory.' }));
} }], build: { outDir: 'tmp/codex/polynomial-accumulation-build', emptyOutDir: true,
  rollupOptions: { input: 'experiments/polynomial-accumulation/index.html' } } });
