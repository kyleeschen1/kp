import { uuid, type UUID } from '../notebook/model.ts';
import { array, exact, fail, metadata, object, text } from './json.ts';
import { migrateV1 } from './migration.ts';
import type { Annotation, AuthorCredit, Cell, Definition, FractionNotebook, Inline, Mark, Step } from './types.ts';
export * from './types.ts';
export { FractionNotebookGap, object, exact } from './json.ts';

export function readSteps(source: string, count: number, openingCaption?: string): readonly Step[] {
  const data = object(JSON.parse(source)); exact(data, ['steps']);
  const steps = array(data['steps'], count);
  if (steps.length !== count) return fail(`Keep the ${count} checked moments in their existing order.`);
  return steps.map((value, index) => {
    const step = object(value), slotted = index === 0 && openingCaption !== undefined;
    exact(step, slotted ? ['title', 'focusRefs'] : ['title', 'content', 'focusRefs']);
    return { title: text(step['title'], 300), content: slotted ? openingCaption : text(step['content']),
      focusRefs: array(step['focusRefs'], 24).map(v => text(v, 300)) };
  });
}
export function readNotebook(value: unknown): FractionNotebook {
  const input = object(value), data = input['schemaVersion'] === 1 ? object(migrateV1(input)) : input;
  exact(data, ['schemaVersion', 'id', 'revision', 'cells']);
  if (data['schemaVersion'] !== 2 || !Number.isSafeInteger(data['revision']) || Number(data['revision']) < 0) return fail('Unsupported notebook version or revision.');
  const seen = new Set<string>([uuid(data['id'])]), annotations = new Map<UUID, Annotation>();
  const identity = (v: Record<string, unknown>) => {
    const id = uuid(v['id']); if (seen.has(id) || annotations.has(id)) fail('UUID already belongs to another object.'); seen.add(id);
    return { id, metadata: metadata(v['metadata']) };
  };
  const annotation = (raw: unknown): Annotation => {
    const v = object(raw); exact(v, ['id', 'metadata']);
    const id = uuid(v['id']), result = { id, metadata: metadata(v['metadata']) }, old = annotations.get(id);
    if (seen.has(id) || (old && JSON.stringify(old) !== JSON.stringify(result))) fail('Annotation identity has conflicting metadata.');
    annotations.set(id, result); return result;
  };
  const content = (raw: unknown): Inline[] => array(raw, 2000).map(item => {
    const v = object(item);
    if (v['type'] === 'link' || v['type'] === 'math') {
      exact(v, ['type', 'id', 'metadata', 'source']); return { ...identity(v), type: v['type'], source: text(v['source'], 8000) };
    }
    exact(v, ['type', 'text', 'marks', 'annotations']); if (v['type'] !== 'text') return fail('Unsupported inline type.');
    const marks: Mark[] = array(v['marks'], 3).map(mark => mark === 'strong' || mark === 'em' || mark === 'code' ? mark : fail('Unsupported prose formatting.'));
    return { type: 'text', text: text(v['text']), marks: [...new Set(marks)], annotations: array(v['annotations'], 8).map(annotation) };
  });
  const cells: Cell[] = array(data['cells'], 200).map(raw => {
    const c = object(raw), base = identity(c);
    if (c['type'] === 'articleHeader') {
      exact(c, ['type', 'id', 'metadata', 'title', 'authors']);
      const title = object(c['title']); exact(title, ['type', 'id', 'metadata', 'content']);
      if (title['type'] !== 'title') return fail('Header requires a typed title.');
      const titleBase = identity(title), titleContent = content(title['content']);
      const authors = array(c['authors'], 8).map((raw): AuthorCredit => {
        const a = object(raw); exact(a, ['type', 'id', 'metadata', 'name', 'role']);
        if (a['type'] !== 'authorCredit') return fail('Unsupported author credit.');
        const role = a['role']; if (role !== 'author' && role !== 'editor' && role !== 'translator') return fail('Unsupported role.');
        return { ...identity(a), type: 'authorCredit' as const, name: text(a['name'], 300), role };
      });
      if (!authors.length) return fail('Keep at least one author credit.');
      return { ...base, type: 'articleHeader', title: { ...titleBase, type: 'title', content: titleContent }, authors };
    }
    if (c['type'] === 'story') {
      exact(c, ['type', 'id', 'metadata', 'source', 'caption']);
      const caption = object(c['caption']); exact(caption, ['type', 'id', 'metadata', 'text']);
      if (caption['type'] !== 'caption') return fail('Story requires its opening caption slot.');
      return { ...base, type: 'story', source: text(c['source'], 100000), caption: { ...identity(caption), type: 'caption', text: text(caption['text']) } };
    }
    exact(c, ['type', 'id', 'metadata', 'content']); if (c['type'] !== 'paragraph') return fail('Unsupported cell type.');
    return { ...base, type: 'paragraph', content: content(c['content']) };
  });
  if (cells.filter(c => c.type === 'story').length !== 1) return fail('Keep one fractional animation in this exemplar.');
  if (cells[0]?.type !== 'articleHeader' || cells.filter(c => c.type === 'articleHeader').length !== 1) return fail('Keep one opening article header.');
  return { schemaVersion: 2, id: uuid(data['id']), revision: Number(data['revision']), cells };
}
export function importFractionReading(markdown: string): { notebook: FractionNotebook; definition: Definition } {
  const match = /```kp-animation-story\s*\n([\s\S]*?)\n```/.exec(markdown);
  if (!match || markdown.indexOf('```kp-animation-story', match.index + 1) !== -1) return fail('Expected the canonical single fraction story.');
  // Only the checked-in manuscript supplies mathematical authority.
  const definition: Definition = JSON.parse(match[1]!);
  const id = (n: number) => uuid(`20000000-0000-4000-8000-${String(n).padStart(12, '0')}`);
  let next = 2;
  const prose = (text: string) => text.trim().split(/\n\s*\n/).filter(Boolean).map(text => ({
    id: id(next++), type: text.startsWith('# ') ? 'heading' : 'paragraph', content: [{ text: text.replace(/^# /, '').trim(), marks: [] }]
  }));
  const before = prose(markdown.slice(0, match.index));
  const source = JSON.stringify({ steps: definition.beats.map(({ title, content, focusRefs }) => ({ title, content, focusRefs })) }, null, 2);
  const story = { id: id(next++), type: 'story', source };
  return { definition, notebook: readNotebook({ schemaVersion: 1, id: id(1), revision: 0,
    cells: [...before, story, ...prose(markdown.slice(match.index + match[0].length))] }) };
}
export function projectReading(doc: FractionNotebook, definition: Definition): string {
  return doc.cells.map(cell => {
    if (cell.type === 'story') {
      const steps = readSteps(cell.source, definition.beats.length, cell.caption.text);
      const story = { ...definition, beats: definition.beats.map((beat, index) => ({ ...beat, ...steps[index] })) };
      return '```kp-animation-story\n' + JSON.stringify(story, null, 2) + '\n```';
    }
    const content = cell.type === 'articleHeader' ? cell.title.content : cell.content;
    const raw = content.map(t => t.type === 'text' ? t.text : t.source).join('');
    if (/\n|```|\[\[/.test(raw)) return fail('Use a new paragraph for line breaks; semantic directives belong in the animation cell.');
    if (cell.type === 'paragraph' && /^\s*#/.test(raw)) return fail('This paragraph cannot introduce another heading.');
    return (cell.type === 'articleHeader' ? '# ' : '') + (raw.trim() || '\u00a0');
  }).join('\n\n') + '\n';
}
