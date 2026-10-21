import assert from 'node:assert/strict';
import test from 'node:test';
import { relative } from 'node:path';
import * as source from '../src/authoring/algebra/source.ts';
import * as compiler from '../src/authoring/algebra/compile.ts';
import { session } from '../src/authoring/algebra/session.ts';
import { prepareKpComposedAlgebraDraftV2 } from '../src/authoring/composed-algebra-session-v2.ts';
import primary from '../src/authoring/examples/composed-algebra-intuition.json' with { type: 'json' };
import { collectKpRuntimeImportClosure } from '../scripts/runtime-import-closure.ts';

test('source reading cannot accidentally acquire proof or presentation authority', () => {
  const invalid = structuredClone(primary); invalid.states[4]!.latex = '5x+999';
  const data = source.parse(JSON.stringify(invalid));
  assert.ok(Object.isFrozen(data));
  assert.equal(compiler.check(JSON.stringify(data)).status, 'repair-gap');
  // @ts-expect-error Source validation does not mint presentation authority.
  assert.throws(() => compiler.serialize(data), /issued/);
  // @ts-expect-error A caller must select source, never inherit example content.
  assert.throws(() => compiler.compile(), source.Repair);
});

test('explicit compilation preserves historical default output and repairs', async () => {
  const current = compiler.compile(primary), legacy = prepareKpComposedAlgebraDraftV2();
  assert.equal(current.revisionId, legacy.revisionId);
  assert.deepEqual(current.animation, legacy.animation);
  assert.deepEqual(current.checkpointProgress, legacy.checkpointProgress);
  assert.equal(compiler.serialize(current), compiler.serialize(legacy));
  assert.throws(() => compiler.serialize({ ...current }), /issued/);
  const lifetime = session({ initial: current, prepare: async () => ({ dispose() {} }), commit() {} });
  lifetime.dispose();
  assert.equal((await lifetime.apply(compiler.serialize(current))).status, 'superseded');
});

test('source-only imports stay small; compiler and editor never import teaching fixtures', () => {
  const closure = (entry: string) => collectKpRuntimeImportClosure(entry).map(path => relative(process.cwd(), path));
  const sourceFiles = closure('src/authoring/algebra/source.ts');
  assert.deepEqual(sourceFiles, ['src/authoring/algebra/source.ts', 'src/authoring/composed-algebra-source-v2.ts', 'src/authoring/composed-algebra-source.ts']);
  for (const entry of ['src/authoring/algebra/compile.ts', 'src/authoring/algebra/session.ts', 'src/authoring/algebra.ts']) {
    const files = closure(entry);
    assert.equal(files.some(path => /\/examples\/|\/fixtures\/|composed-algebra-session-v2/.test(path)), false, entry);
  }
  assert.equal(closure('src/authoring/algebra/compile.ts').includes('src/authoring/prepared-revision-session.ts'), false);
});
