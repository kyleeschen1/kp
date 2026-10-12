import { mkdir, writeFile } from 'node:fs/promises';
import { renderCollectionReading } from '../src/experiments/rectangular-product/collection-reading.ts';
import { polynomialModel } from '../src/experiments/rectangular-product/polynomial-model.ts';
import { linearSystemModel } from '../src/experiments/rectangular-product/linear-system-source.ts';
import { reorderedPolynomialModel } from '../src/experiments/rectangular-product/collection-variation.ts';

const directory = new URL('../tmp/codex/la-collection-readings/', import.meta.url);
await mkdir(directory, { recursive: true });
for (const model of [polynomialModel, linearSystemModel, reorderedPolynomialModel]) {
  const html = renderCollectionReading(model);
  await writeFile(new URL(`${model.id}.html`, directory), html);
  console.log(`${model.id}: ${Buffer.byteLength(html)} bytes; native MathML, no JavaScript`);
}
