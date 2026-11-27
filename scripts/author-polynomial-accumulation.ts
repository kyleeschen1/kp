import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { renderAccumulationReference } from '../src/experiments/polynomial-accumulation/view.ts';
const path = new URL('../experiments/polynomial-accumulation/index.html', import.meta.url);
const html = renderAccumulationReference(), args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--check') {
  if (await readFile(path, 'utf8') !== html) throw new Error('Accumulation reference is stale. Run npm run author:polynomial-accumulation.');
  console.log('Static accumulation reference matches its source.');
} else {
  if (args.length) throw new Error('Use --check or no arguments.');
  await mkdir(new URL('.', path), { recursive: true }); await writeFile(path, html);
  console.log('Wrote static accumulation reference.');
}
