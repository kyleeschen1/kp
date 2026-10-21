import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { collectKpRuntimeImportClosure } from '../scripts/runtime-import-closure.ts';

test('runtime closure excludes both type export spellings and retains mixed runtime exports', () => {
  mkdirSync('tmp/codex', { recursive: true });
  const root = mkdtempSync('tmp/codex/import-closure-');
  try {
    writeFileSync(`${root}/entry.ts`, 'export type { A } from "./types.ts"; export { type A } from "./inline.ts"; export { type A, value } from "./mixed.ts";');
    for (const name of ['types', 'inline', 'mixed']) writeFileSync(`${root}/${name}.ts`, 'export type A = number; export const value = 1;');
    assert.deepEqual(collectKpRuntimeImportClosure(`${root}/entry.ts`), [resolve(root, 'entry.ts'), resolve(root, 'mixed.ts')]);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
