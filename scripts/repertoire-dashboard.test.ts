import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { compileRepertoire, parseRepertoire } from './repertoire-dashboard.ts';

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
  const files = readdirSync('docs/project/repertoire').filter(name => name.endsWith('.md') && name !== 'README.md');
  assert.ok(files.length > 0);
  assert.equal((html.match(/data-discipline=/g) ?? []).length, files.length);
  assert.ok(html.includes('Projection'));
  for (const link of html.matchAll(/href="\/(experiments\/repertoire\/evidence\/[^\"]+)"/g)) assert.ok(assets.has(decodeURIComponent(link[1]!)));
  assert.ok(assets.size > 9);
});
