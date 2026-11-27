import { defineConfig } from 'vite';
import { gzipSync } from 'node:zlib';
export default defineConfig({ plugins: [{ name: 'projection-complete-output-cost', writeBundle(_options, bundle) {
  const totals = { jsCssGzip: 0, allEmittedGzip: 0, files: 0 };
  for (const [name, entry] of Object.entries(bundle)) {
    const source = entry.type === 'chunk' ? entry.code : entry.source;
    const gzip = gzipSync(typeof source === 'string' ? Buffer.from(source) : Buffer.from(source)).byteLength;
    totals.files++; totals.allEmittedGzip += gzip;
    if (/\.(?:js|css)$/.test(name)) totals.jsCssGzip += gzip;
  }
  console.log(JSON.stringify({ consumer: 'editable R2 projection', ...totals,
    qualification: 'Complete emitted assets including all font formats and HTML; per-file gzip estimates, not network or memory.' }));
} }], build: { outDir: 'tmp/codex/inner-product-projection-build', emptyOutDir: true,
  rollupOptions: { input: 'experiments/inner-product-projection/index.html' } } });
