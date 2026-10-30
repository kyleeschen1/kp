import assert from 'node:assert/strict';
import test from 'node:test';
import { relative } from 'node:path';
import * as source from '../src/authoring/algebra/source.ts';
import * as compiler from '../src/authoring/algebra/compile.ts';
import { session } from '../src/authoring/algebra/session.ts';
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

test('saved source rechecks preserve canonical output and issued authority', async () => {
  const current = compiler.compile(primary);
  const replay = compiler.compile(source.parse(compiler.serialize(current)));
  assert.equal(current.revisionId, replay.revisionId);
  assert.deepEqual(current.animation, replay.animation);
  assert.deepEqual(current.checkpointProgress, replay.checkpointProgress);
  assert.equal(compiler.serialize(current), compiler.serialize(replay));
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
  assert.equal(closure('src/authoring/algebra/compile.ts').some(path => path.includes('fixture')), false,
    'Proof-driven construction must not load tutorial fixture builders or registries.');
});

test('shared native algebra mounting cannot depend on an experiment host or its styles', () => {
  for (const entry of ['src/reader/app/algebra-presentation-mount.ts', 'src/reader/app/algebra-presentation-endpoints.ts']) {
    const files = collectKpRuntimeImportClosure(entry).map(path => relative(process.cwd(), path));
    assert.deepEqual(files.filter(path => path.startsWith('src/experiments/') || path.startsWith('src/reader/compiler/') || path.endsWith('.css')), [], entry);
    assert.ok(files.includes('src/authoring/composed-algebra-presentation-v2.ts'), 'Issued presentation authority must remain upstream.');
    assert.ok(files.includes('src/authoring/distribute-collect-presentation.ts'), 'Both real consumers must retain their checked owner.');
  }
});
