import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
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
