import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { CommandRegistry, available, unavailable, target, type Availability, type CommandHandle } from '../src/editor-commands/registry.ts';
import { createRowPickerSession } from '../src/interaction/row-picker-session.ts';
import { collectKpTypescriptImportGraph } from '../scripts/typescript-import-extractor.ts';
import { mathematicalOperations } from '../src/notebook/math-model.ts';
import { captureMathematicalDiscovery, mathCapabilityCatalog, mathCapabilityReadiness, mathCapabilityState,
  type MathCapability, type MathDiscoverySelection } from '../src/math-discovery/public-api.ts';
import type { Row } from '../src/editor-rows/model.ts';

const selection = (kind: Exclude<MathDiscoverySelection['kind'], 'none'> = 'quadratic', revision: object | string = {}): MathDiscoverySelection =>
  ({ kind, id: 'source-a', occurrenceId: 'occurrence-a', revision });
function fixture(initial = selection()) {
  const calls: string[] = [], messages: string[] = [], handles = new Map<string, CommandHandle>();
  let current = initial, focused = 'source-a', readiness: Availability = available();
  const registry = new CommandRegistry(() => ({ scope: 'notebook' }), message => messages.push(message));
  for (const descriptor of mathCapabilityCatalog) handles.set(descriptor.id, registry.targeted({
    id: descriptor.id, title: `Owner: ${descriptor.id}`, category: 'Mathematics', scope: 'notebook',
    keywords: ['owner-alias'], description: 'Owner description', target: () => target(focused),
    state: () => readiness, run: source => { calls.push(`${descriptor.id}:${source}`); }
  }));
  const capture = (originValid?: () => string | undefined) => captureMathematicalDiscovery(registry, {
    origin: { scope: 'notebook', ...(originValid ? { valid: originValid } : {}) }, selection: current, currentSelection: () => current
  });
  return { registry, calls, messages, handles, capture,
    current: () => current, change: (next: MathDiscoverySelection) => { current = next; },
    focus: (id: string) => { focused = id; }, readiness: (next: Availability) => { readiness = next; }
  };
}
function command(rows: readonly Row<MathCapability>[], id: string) {
  const capability = rows.find(row => row.id === id)?.resource;
  assert.equal(capability?.kind, 'command');
  if (capability?.kind !== 'command') throw new Error(`Expected command ${id}`);
  return capability.command;
}

test('discovery enriches existing command descriptions without invoking them or inventing owners', () => {
  const f = fixture(), rows = f.capture();
  assert.deepEqual(rows.map(row => row.id), mathematicalOperations.map(operation => operation.id));
  assert.equal(rows.length, 3); assert.equal(rows[0]?.fields['title']?.text, 'Owner: math.graph');
  assert.equal(rows[0]?.fields['description']?.text, 'Owner description');
  assert.equal(rows[0]?.fields['aliases']?.text, 'owner-alias');
  assert.deepEqual(rows[0]?.facets, { family: ['quadratic'], operation: ['view'], availability: ['available'] });
  assert.equal(f.calls.length, 0); assert.deepEqual(f.registry.recent(), []);
  f.handles.get('math.graph')?.dispose();
  assert.equal(f.capture().some(row => row.id === 'math.graph'), false);
  f.change(selection('matrix-vector'));
  assert.deepEqual(f.capture().map(row => row.id), ['matrix.graph', 'matrix.explain']);
});

test('missing input and incompatible derived objects have no executable placeholder', () => {
  const f = fixture({ kind: 'none' }), missing = f.capture();
  assert.equal(missing.length, 5);
  for (const row of missing) {
    assert.equal(row.resource.kind, 'needs-input'); assert.equal('command' in row.resource, false);
    assert.deepEqual(row.actions, []); assert.equal(mathCapabilityState(row.resource).enabled, false);
  }
  f.change(selection('derivative'));
  const derived = f.capture(); assert.equal(derived.length, 3);
  assert.equal(derived[0]?.resource.kind, 'command');
  for (const row of derived.slice(1)) {
    assert.equal(row.resource.kind, 'unsupported'); assert.equal('command' in row.resource, false);
    assert.equal(mathCapabilityReadiness(row.resource).status, 'unsupported');
  }
  f.change(selection('tangent')); assert.equal(f.capture()[0]?.resource.kind, 'command');
});

test('moving focus does not retarget an already captured invocation', async () => {
  const f = fixture(), rows = f.capture(); f.focus('another-object');
  assert.deepEqual(await command(rows, 'math.derivative').execute(), { ok: true });
  assert.deepEqual(f.calls, ['math.derivative:source-a']);
  assert.deepEqual(f.registry.recent(), ['math.derivative']);
});

test('a changed source, occurrence, kind or immutable document cannot execute stale discovery', async () => {
  for (const change of [
    (s: Exclude<MathDiscoverySelection, {kind: 'none'}>) => ({ ...s, id: 'source-b' }),
    (s: Exclude<MathDiscoverySelection, {kind: 'none'}>) => ({ ...s, occurrenceId: 'occurrence-b' }),
    (s: Exclude<MathDiscoverySelection, {kind: 'none'}>) => ({ ...s, kind: 'tangent' as const }),
    (s: Exclude<MathDiscoverySelection, {kind: 'none'}>) => ({ ...s, revision: {} })
  ]) {
    const f = fixture(), rows = f.capture(), previous = f.current();
    assert.notEqual(previous.kind, 'none'); if (previous.kind === 'none') throw new Error('Expected selection');
    f.change(change(previous));
    const result = await command(rows, 'math.graph').execute();
    assert.equal(result.ok, false); if (!result.ok) assert.match(result.reason, /changed/);
    assert.deepEqual(f.calls, []); assert.deepEqual(f.registry.recent(), []);
  }
});

test('undo/re-edit with a reused numeric revision is distinguished by actual source and draft fingerprint', async () => {
  const first = selection('quadratic', JSON.stringify({ revision: 1, a: 2, draft: '2' }));
  const f = fixture(first), rows = f.capture();
  f.change(selection('quadratic', JSON.stringify({ revision: 1, a: 3, draft: '3' })));
  assert.equal((await command(rows, 'math.graph').execute()).ok, false);
  // Returning to precisely the captured state restores the same operation basis.
  f.change(first); assert.equal((await command(rows, 'math.graph').execute()).ok, true);
  const another = f.capture();
  f.change(selection('quadratic', JSON.stringify({ revision: 1, a: 2, draft: '-' })));
  assert.equal((await command(another, 'math.graph').execute()).ok, false);
});

test('owner availability and originating-context guards are preserved and rechecked at invocation', async () => {
  const f = fixture(); let invalid: string | undefined;
  const rows = f.capture(() => invalid), capability = rows[0]!.resource;
  f.readiness(unavailable('Finish the numeric draft'));
  assert.deepEqual(mathCapabilityReadiness(capability), { status: 'unavailable', reason: 'Finish the numeric draft' });
  assert.equal((await command(rows, 'math.graph').execute()).ok, false);
  f.readiness(available()); invalid = 'The originating document closed';
  assert.equal((await command(rows, 'math.graph').execute()).ok, false);
  invalid = undefined; f.change({ kind: 'none' });
  assert.deepEqual(mathCapabilityState(capability), { enabled: false, reason: 'The selected mathematical object was removed.' });
  assert.deepEqual(f.calls, []);
});

test('disposal and replacement of a command cannot revive a captured command', async () => {
  const f = fixture(), rows = f.capture(); f.handles.get('math.graph')?.dispose();
  f.registry.add({ id: 'math.graph', title: 'Replacement', category: 'Mathematics', scope: 'notebook', run: () => f.calls.push('replacement') });
  assert.equal((await command(rows, 'math.graph').execute()).ok, false);
  assert.equal((await command(f.capture(), 'math.graph').execute()).ok, true);
  assert.deepEqual(f.calls, ['replacement']); f.registry.dispose();
  assert.equal((await command(rows, 'math.derivative').execute()).ok, false);
});

test('workspace commands cannot bypass captured object validation', () => {
  const registry = new CommandRegistry(() => ({ scope: 'workspace' }), () => {});
  registry.add({ id: 'math.graph', title: 'Unsafe workspace mutation', category: 'Mathematics', scope: 'workspace', run: () => assert.fail('Must not execute') });
  const selected = selection();
  const rows = captureMathematicalDiscovery(registry, { origin: { scope: 'workspace' }, selection: selected, currentSelection: () => selected });
  assert.equal(rows.length, 1); assert.equal(rows[0]?.resource.kind, 'unavailable');
  assert.equal('command' in rows[0]!.resource, false); assert.deepEqual(rows[0]?.actions, []);
});

test('rows work in the existing fuzzy session with metadata search and current availability', async () => {
  const f = fixture();
  const picker = createRowPickerSession<MathCapability>({
    state: row => mathCapabilityState(row.resource),
    execute: row => row.resource.kind === 'command' ? row.resource.command.execute() : { ok: false, reason: row.resource.reason }
  });
  picker.open(f.capture()); picker.query('contact');
  // Fuzzy metadata can admit secondary matches; the intended operation must rank first.
  assert.equal(picker.snapshot().selected, 'math.tangent');
  f.change(selection()); assert.equal((await picker.accept()).ok, false);
  assert.equal(picker.snapshot().open, true); assert.deepEqual(f.calls, []);
  picker.close(); assert.equal(picker.snapshot().visible.length, 0); picker.dispose();
});

test('the operation noun outranks an incidental mention in another command requirement', () => {
  const registry = new CommandRegistry(() => ({ scope: 'notebook' }), () => {});
  for (const operation of mathematicalOperations) registry.add({ ...operation, category: 'Mathematics', scope: 'notebook', run() {} });
  const selected = selection();
  const picker = createRowPickerSession<MathCapability>({ execute: () => ({ ok: true }) });
  picker.open(captureMathematicalDiscovery(registry, { origin: { scope: 'notebook' }, selection: selected, currentSelection: () => selected }));
  for (const [query, id] of [['derivative', 'math.derivative'], ['tangent', 'math.tangent'], ['graph', 'math.graph'], ['vertex', 'math.graph'], ['factored', 'math.graph'], ['expanded', 'math.graph']]) {
    picker.query(query!); assert.equal(picker.snapshot().selected, id);
  }
  picker.dispose(); registry.dispose();
});

test('discovery transitive imports contain no evaluator, host, DOM renderer or generated catalogue', () => {
  const graph = collectKpTypescriptImportGraph(resolve(import.meta.dirname, '..'));
  const seen = new Set<string>(), pending = ['src/math-discovery/public-api.ts'];
  while (pending.length) {
    const path = pending.pop()!; if (seen.has(path)) continue; seen.add(path);
    assert.doesNotMatch(path, /src\/(?:fraction-notebook|editor-chat|rendering|semantic-state|math|math-resources|animation-player)\//, path);
    assert.doesNotMatch(path, /(?:catalogue|catalog)-generated|node_modules/, path);
    pending.push(...graph.localEdges.filter(edge => edge.importer === path).map(edge => edge.target));
  }
  assert.ok(seen.has('src/math-discovery/catalog.ts'));
  assert.equal(mathCapabilityCatalog.length, 5);
});
