import { mkdir, writeFile } from 'node:fs/promises';
import { rowWorkbenchExamples } from '../src/experiments/rectangular-product/row-workbench-examples.ts';
import { rowWorkbenchReading } from '../src/experiments/rectangular-product/row-workbench-reading.ts';

const escape = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const directory = new URL('../tmp/codex/row-workbench-readings/', import.meta.url);
await mkdir(directory, { recursive: true });
for (const { key, model } of rowWorkbenchExamples) {
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(model.title)}</title><body><main><h1>${escape(model.title)}</h1>${rowWorkbenchReading(model, 'mathml')}</main></body></html>`;
  await writeFile(new URL(`${key}.html`, directory), html);
  console.log(`${key}: ${Buffer.byteLength(html)} bytes; native MathML, no scripts or external fonts`);
}
