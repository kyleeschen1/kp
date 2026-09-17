import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { compileRepertoire, parseRepertoire, readRepertoire } from './repertoire-dashboard.ts';

const example = '# Algebra\n## Cancellation\n### Semantic moves\n- [x] Cancel a nonzero factor. [Evidence](proof.md)\n### Visual motifs\n- [ ] Retain the original.\n';
test('topic headings separate semantic moves from visual treatments', () => {
  const data = parseRepertoire(example, 'example.md');
  assert.equal(data.topics[0]!.moves[0]!.checked, true);
  assert.equal(data.topics[0]!.motifs[0]!.checked, false);
  assert.equal(data.topics[0]!.moves[0]!.label, 'Cancel a nonzero factor.');
});
test('unsupported or unsupported-by-evidence edits return located errors', () => {
  assert.throws(() => parseRepertoire(example.replace(' [Evidence](proof.md)', ''), 'example.md'), /example.md:4: Checked items require/);
  assert.throws(() => parseRepertoire(example.replace('### Visual motifs', '### Progress scores'), 'example.md'), /example.md:5:/);
  assert.throws(() => parseRepertoire(example.replace('## Cancellation', '## Cancellation\n## Cancellation'), 'example.md'), /Duplicate topic/);
});
test('the real checklists compile with evidence packaged as plain text', () => {
  const { html, assets } = compileRepertoire(process.cwd());
  const disciplines = readRepertoire(process.cwd());
  assert.ok(disciplines.length > 0);
  assert.equal((html.match(/data-discipline=/g) ?? []).length, disciplines.length);
  assert.ok(disciplines.find(d => d.id === 'algebra')!.topics.some(t => t.file.endsWith('02-fractions.md')));
  assert.ok(html.includes('Projection'));
  for (const link of html.matchAll(/href="\/(experiments\/repertoire\/evidence\/[^\"]+)"/g)) assert.ok(assets.has(decodeURIComponent(link[1]!)));
  assert.ok(assets.size > 9);
});

const granular = '# Algebra\n## Fractions\n### Semantic moves\n- [ ] `alg.add` Add fractions.\n  Example: 1/3+1/3 → 2/3\n  Audit: unaudited\n### Visual motifs\n- [ ] Preserve the denominator.\n';
test('granular claims require examples and honest audit states', () => {
  assert.equal(parseRepertoire(granular, 'topic.md').topics[0]!.moves[0]!.id, 'alg.add');
  assert.throws(() => parseRepertoire(granular.replace('  Example: 1/3+1/3 → 2/3\n', ''), 'topic.md'), /needs Example/);
  assert.throws(() => parseRepertoire(granular.replace('Audit: unaudited', 'Audit: implemented'), 'topic.md'), /checkbox contradicts/);
  assert.throws(() => parseRepertoire(granular.replace('Audit: unaudited', 'Audit: gap'), 'topic.md'), /audited claims require Evidence/);
  assert.throws(() => parseRepertoire(granular.replace('Audit: unaudited', 'Audit: probably'), 'topic.md'), /valid Audit/);
});

test('curriculum documentation and audit evidence contain no broken local file links', () => {
  for (const directory of ['docs/project/repertoire', 'docs/project/repertoire-notes']) {
    const files = readdirSync(directory, { recursive: true, withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
      .map(entry => resolve(entry.parentPath, entry.name));
    for (const file of files) {
      // Examples in fenced authoring instructions are not actual source links.
      const markdown = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
      for (const match of markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
        const link = match[1]!;
        if (/^https?:\/\//.test(link) || link.startsWith('#')) continue;
        assert.ok(existsSync(resolve(file, '..', link.split('#')[0]!)), `${file}: broken ${link}`);
      }
    }
  }
});

test('worked-problem traces refer only to existing stable curriculum rows', () => {
  const ids = new Set(readRepertoire(process.cwd()).flatMap(d => d.topics.flatMap(t => [...t.moves, ...t.motifs].map(item => item.id))));
  const directory = 'docs/project/repertoire-notes/traces';
  for (const file of readdirSync(directory).filter(name => name.endsWith('.md'))) {
    const text = readFileSync(resolve(directory, file), 'utf8');
    const refs = [...text.matchAll(/`((?:motif|alg|calc|ode|pde|la|prob|stats|opt|num|econ|mech|code|reading)\.[a-z0-9.-]+)`/g)];
    assert.ok(refs.length > 0, `${file}: trace needs row references`);
    for (const ref of refs) assert.ok(ids.has(ref[1]), `${file}: unknown row ${ref[1]}`);
  }
});

function withFixture(run: (root: string, put: (path: string, content: string) => void) => void) {
  mkdirSync('tmp/codex', { recursive: true });
  const root = mkdtempSync(resolve('tmp/codex/repertoire-test-'));
  const put = (path: string, content: string) => {
    const file = resolve(root, path);
    mkdirSync(resolve(file, '..'), { recursive: true });
    writeFileSync(file, content);
  };
  try { run(root, put); } finally { rmSync(root, { recursive: true, force: true }); }
}
const completeGranular = granular.replace('- [ ] Preserve the denominator.', '- [ ] `motif.denominator` Preserve the denominator.\n  Example: Retain the same denominator\n  Audit: unaudited');
test('topic-file edits cannot create duplicate IDs, conflicting disciplines or dangling reuse links', () => withFixture((root, put) => {
  const path = 'docs/project/repertoire/algebra/';
  put(path + 'first.md', completeGranular);
  put(path + 'second.md', completeGranular.replace('## Fractions', '## Another topic'));
  assert.throws(() => readRepertoire(root), /duplicate item alg.add/);
  put(path + 'second.md', completeGranular.replace('# Algebra', '# Other name'));
  assert.throws(() => readRepertoire(root), /inconsistent discipline title/);
  rmSync(resolve(root, path, 'second.md'));
  put(path + 'first.md', completeGranular.replace('Audit: unaudited', 'Audit: unaudited\n  Uses: alg.missing'));
  assert.throws(() => readRepertoire(root), /unknown Uses reference alg.missing/);
  put(path + 'first.md', completeGranular.replace('`alg.add` ', ''));
  assert.throws(() => readRepertoire(root), /Details require an indented granular item/);
}));

test('source projection escapes authored text and cannot serve evidence outside approved directories', () => withFixture((root, put) => {
  for (const path of ['docs/project/repertoire/README.md', 'docs/project/repertoire-notes/scope-and-sources.md', 'docs/project/repertoire-notes/trace-findings.md']) put(path, '# Notes');
  const path = 'docs/project/repertoire/algebra/first.md';
  put(path, completeGranular.replace('Add fractions.', '<img src=x onerror=alert(1)>'));
  const compiled = compileRepertoire(root);
  assert.ok(compiled.html.includes('&lt;img'));
  assert.ok(!compiled.html.includes('<img'));
  put('private.txt', 'Fixture-only private content');
  put(path, completeGranular.replace('Add fractions.', 'Add fractions. [Evidence](../../../../private.txt)'));
  assert.throws(() => compileRepertoire(root), /Evidence outside supported source directories/);
}));
