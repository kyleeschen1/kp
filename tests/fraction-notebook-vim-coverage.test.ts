import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parseVimReference, vimReference } from '../src/editor-commands/vim-reference.ts';
import { bindingSupport, searchBindings, surfaces, statuses, workspaceBindings, type VimSurface } from '../src/editor-commands/vim-coverage.ts';

const raw = readFileSync(new URL('../vendor/vim-9.2.0000/index.txt', import.meta.url), 'utf8');
const entries = parseVimReference(raw);
const row = (tag: string, mode = 'normal') => { const entry = entries.find(entry => entry.tag === tag && entry.mode === mode); assert.ok(entry, `${mode} ${tag}`); return entry; };
const support = (tag: string, surface: VimSurface, mode = 'normal') => bindingSupport(row(tag, mode), surface, 'mac');

test('the pinned index retains every tagged command and its untagged aliases with stable identities', () => {
  assert.equal(createHash('sha256').update(raw).digest('hex'), vimReference.sha256);
  assert.equal(entries.length, 1358); assert.equal(new Set(entries.map(entry => entry.id)).size, entries.length);
  const indexedLines = raw.split('\n').flatMap((line, index) => /^\|[^|]+\|[\t ]+/.test(line) ? [index + 1] : []);
  assert.deepEqual(entries.filter(entry => entry.tag).map(entry => entry.line), indexedLines);
  assert.equal(entries.filter(entry => !entry.tag).length, 22);
  assert.ok(entries.every(entry => entry.keys.trim() && entry.description.trim() && entry.line > 0));
  assert.match(readFileSync(new URL('../vendor/vim-9.2.0000/LICENSE', import.meta.url), 'utf8'), /VIM LICENSE/);
  assert.equal(row('i_CTRL-V_digit', 'insert').keys, 'CTRL-V {number}');
  assert.match(row('i_CTRL-V_digit', 'insert').description, /single byte/);
  assert.equal(row('c_CTRL-R_CTRL-R', 'command-line').description, row('c_CTRL-R_CTRL-O', 'command-line').description);
  assert.match(row(':redrawtabpanel', 'ex').description, /^force a redraw/);
  assert.ok(entries.filter(entry => entry.tag === 'count').every(entry => entry.description === row('count').description));
  assert.throws(() => parseVimReference(raw.replace('|dd|', '|removed|').replace(/^\|removed\|.*\n/m, '')), /incomplete/);
});

test('support separates prose limitations, read-only behavior, overrides and unverified source features', () => {
  for (const surface of ['notebook', 'composer', 'note', 'picker'] as const) {
    assert.equal(support('u', surface).status, 'implemented');
    assert.equal(support('w', surface).status, 'partial');
    assert.equal(support('d', surface).status, 'missing');
    assert.equal(support('v_d', surface, 'visual').status, 'partial');
    assert.equal(support('v_iw', surface, 'operator').status, 'missing');
    assert.equal(support('count', surface).status, 'missing');
    assert.equal(support('.', surface).status, 'missing');
  }
  assert.equal(support('u', 'transcript').status, 'not-applicable');
  assert.equal(support('v_y', 'transcript', 'visual').status, 'missing');
  assert.equal(support('i', 'transcript').status, 'overridden');
  assert.equal(support('za', 'transcript').status, 'partial');
  assert.equal(support('za', 'notebook').status, 'missing');
  assert.equal(support('j', 'picker').status, 'overridden');
  assert.equal(support(':', 'picker').status, 'not-applicable');
  assert.equal(support(':help', 'picker', 'ex').status, 'not-applicable');
  assert.equal(support('i_CTRL-[', 'picker', 'insert').status, 'implemented');
  assert.equal(support('i_CTRL-[', 'notebook', 'insert').status, 'missing');
  for (const surface of ['json', 'markdown'] as const) {
    assert.equal(support('d', surface).status, 'unverified');
    assert.equal(support('v_iw', surface, 'operator').status, 'unverified');
    assert.equal(support(':substitute', surface, 'ex').status, 'missing');
    assert.equal(support(':write', surface, 'ex').status, 'overridden');
    assert.equal(support('CTRL-X', surface).status, 'overridden');
  }
  assert.equal(support(':set', 'json', 'ex').status, 'partial');
  assert.equal(support(':set', 'markdown', 'ex').status, 'missing');
  assert.equal(support('u', 'input').status, 'not-applicable');
  assert.equal(bindingSupport(row('CTRL-B'), 'notebook', 'other').status, 'overridden');
  assert.equal(bindingSupport(row('CTRL-B'), 'notebook', 'mac').status, 'missing');
});

test('every row has a documented classification and library upgrades cannot silently check more boxes', () => {
  const installed: { version: string } = JSON.parse(readFileSync(new URL('../node_modules/@replit/codemirror-vim/package.json', import.meta.url), 'utf8'));
  assert.equal(installed.version, '6.4.0', 'Review the CodeMirror surface audit when upgrading Vim.');
  for (const surface of Object.keys(surfaces) as VimSurface[]) for (const entry of [...entries, ...workspaceBindings]) {
    const claim = bindingSupport(entry, surface);
    assert.ok(Object.hasOwn(statuses, claim.status)); assert.ok(claim.note.trim()); assert.ok(claim.evidence.length);
    assert.ok(claim.evidence.every(path => path.endsWith('.ts') || path.endsWith('package.json')));
  }
});

test('search covers keys, prose, modes and compositional examples across the full reference', () => {
  assert.ok(searchBindings(entries, 'diw').some(entry => entry.tag === 'v_iw'));
  assert.ok(searchBindings(entries, '3w').some(entry => entry.tag === 'count'));
  assert.ok(searchBindings(entries, 'macro').some(entry => entry.tag === 'q'));
  assert.ok(searchBindings(entries, 'text objects inner word').some(entry => entry.tag === 'v_iw'));
  assert.ok(searchBindings(entries, ':%s/foo/bar/g').some(entry => entry.tag === ':substitute'));
  assert.ok(searchBindings(entries, ':wq').some(entry => entry.tag === ':wq'));
  assert.equal(searchBindings(entries, '').length, 1358);
  assert.equal(searchBindings(entries, 'not-a-vim-binding-xyz').length, 0);
});
