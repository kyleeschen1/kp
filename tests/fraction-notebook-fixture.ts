import { readFileSync } from 'node:fs';

// The published v1 shape, independent of the v2 importer/migration.
export function fractionV1Fixture() {
  const source = readFileSync(new URL('../content/authoring/algebra/fractional-linear-reasoning.article.md', import.meta.url), 'utf8');
  const match = /```kp-animation-story\s*\n([\s\S]*?)\n```/.exec(source)!;
  const definition = JSON.parse(match[1]!);
  const id = (n: number) => `20000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  let next = 2;
  const prose = (text: string) => text.trim().split(/\n\s*\n/).filter(Boolean).map(text => ({
    id: id(next++), type: text.startsWith('# ') ? 'heading' : 'paragraph', content: [{ text: text.replace(/^# /, '').trim(), marks: [] }]
  }));
  const before = prose(source.slice(0, match.index));
  const story = { id: id(next++), type: 'story', source: JSON.stringify({ steps: definition.beats.map((b: { title: string; content: string; focusRefs: string[] }) => ({ title: b.title, content: b.content, focusRefs: b.focusRefs })) }, null, 2) };
  return { schemaVersion: 1, id: id(1), revision: 7, cells: [...before, story, ...prose(source.slice(match.index + match[0].length))] };
}
