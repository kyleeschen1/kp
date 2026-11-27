import test from 'node:test';
import assert from 'node:assert/strict';
import { CommandRegistry, available, unavailable, target } from '../src/editor-commands/registry.ts';
import { matchCommands } from '../src/editor-commands/matching.ts';
import { CommandShortcut, type ShortcutKey } from '../src/editor-commands/shortcut.ts';

test('commands are inert during discovery, revalidate scope/state, and reject stale owners', async () => {
  const messages: string[] = [], registry = new CommandRegistry(() => ({ scope: 'notebook' }), text => messages.push(text));
  let ready = true, count = 0;
  const handle = registry.add({ id: 'notebook.test', title: 'Test', category: 'Notebook', scope: 'notebook', state: () => ready ? available() : unavailable('Wait'), run: () => { count++; } });
  const [captured] = registry.snapshot(); assert.equal(count, 0); assert.equal(captured!.state().enabled, true);
  assert.throws(() => registry.add({ id: handle.id, title: 'Duplicate', category: 'Notebook', run: () => {} }), /already registered/);
  assert.equal((await handle.invoke({ scope: 'chat' })).ok, false);
  ready = false; assert.deepEqual(await captured!.execute(), { ok: false, reason: 'Wait' }); assert.equal(count, 0);
  ready = true; assert.equal((await captured!.execute()).ok, true); assert.equal(count, 1);
  const invalid = handle.prepare({ scope: 'notebook', valid: () => 'Branch changed' }); assert.equal((await invalid.execute()).ok, false);
  handle.dispose(); registry.add({ id: handle.id, title: 'Replacement', category: 'Notebook', run: () => { count += 10; } });
  assert.equal((await captured!.execute()).ok, false); assert.equal(count, 1); assert.ok(messages.includes('Branch changed'));
});

test('typed targets remain captured and async actions run once until completion', async () => {
  const registry = new CommandRegistry(() => ({ scope: 'chat' }), () => {}), seen: string[] = [];
  let selection = 'note.a', release: () => void = () => {};
  const handle = registry.targeted({ id: 'note.open', title: 'Open note', category: 'Notes', target: () => target(selection),
    run: async id => { seen.push(id); await new Promise<void>(resolve => { release = resolve; }); } });
  const captured = handle.prepare(); selection = 'note.b';
  const running = captured.execute(); assert.deepEqual(seen, ['note.a']);
  assert.equal((await handle.invoke()).ok, false); release(); assert.equal((await running).ok, true);
  const explicit = handle.forTarget('note.c').execute(); assert.deepEqual(seen, ['note.a', 'note.c']); release(); await explicit;
  assert.deepEqual(registry.recent(), ['note.open']);
});

test('command search retains all matches, uses aliases and ranks names before metadata', () => {
  const registry = new CommandRegistry(() => ({ scope: 'notebook' }), () => {});
  for (let index = 0; index < 12; index++) registry.add({ id: `action.${index}`, title: `Action ${index}`, category: 'Notebook', run: () => {} });
  registry.add({ id: 'bold', title: 'Bold', category: 'Notebook', keywords: ['strong', 'format'], run: () => {} });
  registry.add({ id: 'other', title: 'Other', category: 'Notebook', description: 'bold actions', run: () => {} });
  registry.add({ id: 'notebook.load', title: 'Load', category: 'Notebook', run: () => {} });
  assert.equal(matchCommands(registry.snapshot(), 'action').length, 13);
  assert.equal(matchCommands(registry.snapshot(), 'BoLd')[0]?.id, 'bold');
  assert.deepEqual(matchCommands(registry.snapshot(), 'bold').map(command => command.id), ['bold', 'other']);
  assert.equal(matchCommands(registry.snapshot(), 'format strong')[0]?.id, 'bold');
  assert.equal(matchCommands(registry.snapshot(), 'not-found-at-all').length, 0);
});

test('a disposed async owner cannot block or record history for its replacement', async () => {
  const registry = new CommandRegistry(() => ({ scope: 'notebook' }), () => {});
  let release: () => void = () => {};
  const old = registry.add({ id: 'owner', title: 'Old', category: 'Notebook', run: () => new Promise<void>(resolve => { release = resolve; }) });
  const running = old.invoke(); old.dispose();
  const replacement = registry.add({ id: 'owner', title: 'New', category: 'Notebook', run: () => {} });
  assert.equal(replacement.prepare().state().enabled, true);
  release(); await running; assert.deepEqual(registry.recent(), []);
  assert.equal((await replacement.invoke()).ok, true); assert.deepEqual(registry.recent(), ['owner']);
});

test('notification membership is bounded and a closed registry cannot resolve retiring owners', () => {
  const registry = new CommandRegistry(() => ({ scope: 'notebook' }), () => {});
  let calls = 0, remove = () => {};
  const refresh = () => { calls++; remove(); if (calls < 100) remove = registry.subscribe(refresh); };
  remove = registry.subscribe(refresh); registry.notify(); assert.equal(calls, 1);
  remove();
  let resolutions = 0;
  const command = registry.targeted({ id: 'closing', title: 'Closing', category: 'Notebook', target: () => { resolutions++; return target('source'); }, run() {} });
  registry.subscribe(() => command.prepare()); registry.dispose(); registry.notify(); command.prepare(); command.dispose();
  assert.equal(resolutions, 0);
  registry.subscribe(() => { calls++; }); registry.notify(); assert.equal(calls, 1);
  assert.throws(() => registry.add({ id: 'late', title: 'Late', category: 'Notebook', run() {} }), /closed/);
});

test('launch shortcuts handle interruption, repeat, timeout, composition and Option-generated characters', () => {
  const chord = new CommandShortcut(), base: ShortcutKey = { key: 'x', code: 'KeyX', ctrlKey: true, altKey: false, metaKey: false, shiftKey: false, repeat: false, isComposing: false };
  assert.equal(chord.next(base, 0), 'prefix');
  assert.equal(chord.next({ ...base, repeat: true }, 100), 'prefix');
  assert.equal(chord.next({ ...base, key: 'Control', code: 'ControlLeft' }, 110), 'pass');
  assert.equal(chord.next(base, 200), 'open');
  assert.equal(chord.next(base, 300), 'prefix');
  assert.equal(chord.next({ ...base, key: 'a', code: 'KeyA', ctrlKey: false }, 400), 'pass');
  assert.equal(chord.next(base, 500), 'prefix'); chord.reset(); assert.equal(chord.next(base, 600), 'prefix');
  assert.equal(chord.next(base, 2500), 'prefix');
  assert.equal(chord.next({ ...base, isComposing: true }, 2600), 'pass'); assert.equal(chord.next(base, 2700), 'prefix');
  assert.equal(chord.next({ ...base, key: '≈', ctrlKey: false, altKey: true }, 2800), 'open');
  assert.equal(chord.next({ ...base, metaKey: true, ctrlKey: false }, 2900), 'pass');
});
