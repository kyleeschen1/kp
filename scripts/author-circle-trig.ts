import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { renderCircleReference } from '../src/experiments/circle-trig/view.ts';

const path = new URL('../experiments/circle-trig/index.html', import.meta.url);
const html = renderCircleReference(), args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--check') {
  if (await readFile(path, 'utf8') !== html) throw new Error('Circle reference is stale. Run npm run author:circle-trig.');
  console.log('Static circle reference matches its semantic and presentation source.');
} else {
  if (args.length) throw new Error('Use --check or no arguments.');
  await mkdir(new URL('.', path), { recursive: true }); await writeFile(path, html);
  console.log('Wrote the static circle reference.');
}
