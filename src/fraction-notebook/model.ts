import { uuid, type UUID } from '../notebook/model.ts';
import { array, exact, fail, metadata, object, text } from './json.ts';
import { migrateV1, migrateV2 } from './migration.ts';
import { projectionText } from './inline-source.ts';
import { readNotebookMathematics, readMathViewport } from '../notebook/math-model.ts';
import { readMatrixResources, matrixOccurrence } from './matrix-data.ts';
import type { Annotation, AuthorCredit, Cell, ContentBlock, Definition, FractionNotebook, Inline, Mark, Step } from './types.ts';
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
  const input = object(value), v2 = input['schemaVersion'] === 1 ? object(migrateV1(input)) : input;
  const data = v2['schemaVersion'] === 2 ? object(migrateV2(v2)) : v2;
  exact(data, ['schemaVersion', 'id', 'revision', 'cells', 'mathematics', 'matrixResources']);
  if (data['schemaVersion'] !== 3 || !Number.isSafeInteger(data['revision']) || Number(data['revision']) < 0) return fail('Unsupported notebook version or revision.');
  const seen = new Set<string>([uuid(data['id'])]), annotations = new Map<UUID, Annotation>();
  const mathematics = data['mathematics'] === undefined ? undefined : readNotebookMathematics(data['mathematics']);
  const matrixResources = data['matrixResources'] === undefined ? undefined : readMatrixResources(data['matrixResources']);
  if (mathematics && matrixResources) return fail('Choose one mathematical family for this notebook exemplar.');
  for (const d of matrixResources ?? []) for (const id of [d.id, d.matrix.id, d.vector.id, d.result.id, ...d.occurrences.map(o => o.id)]) {
    if (seen.has(id)) return fail('Matrix resource and occurrence identities must be unique across the notebook.'); seen.add(id);
  }
  const usedMatrixViews = new Set<UUID>();
  for (const resource of mathematics?.resources ?? []) {
    if (seen.has(resource.id)) fail('A resource UUID cannot also belong to the notebook.'); seen.add(resource.id);
  }
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
  const readTitle = (raw: unknown) => {
    const v = object(raw); exact(v, ['type', 'id', 'metadata', 'content']);
    if (v['type'] !== 'title') return fail('Expected a block title.');
    return { ...identity(v), type: 'title' as const, content: content(v['content']) };
  };
  let blockCount = 0;
  const block = (raw: unknown, depth: number): ContentBlock => {
    if (depth > 8 || ++blockCount > 200) return fail('This editing region supports 200 blocks and eight nesting levels.');
    const c = object(raw); exact(c, ['type', 'id', 'metadata', 'kind', 'title', 'content', 'children', 'layout', 'folded']);
    if (c['type'] !== 'block' || (c['kind'] !== 'paragraph' && c['kind'] !== 'note')) return fail('Unsupported content block.');
    const layout = c['layout'];
    if (layout !== 'flow' && layout !== 'bullets' && layout !== 'numbered' && layout !== 'outline') return fail('Unsupported child layout.');
    if (typeof c['folded'] !== 'boolean') return fail('Invalid folded state.');
    return { ...identity(c), type: 'block', kind: c['kind'], title: c['title'] === null ? null : readTitle(c['title']),
      content: content(c['content']), children: array(c['children'], 200).map(child => block(child, depth + 1)), layout, folded: c['folded'] };
  };
  const cells: Cell[] = array(data['cells'], 200).map(raw => {
    if (object(raw)['type'] === 'block') return block(raw, 1);
    const c = object(raw), base = identity(c);
    if (c['type'] === 'matrixObject') {
      exact(c, ['type', 'id', 'metadata', 'resource', 'occurrence', 'folded']);
      const resource = uuid(c['resource']), occurrence = uuid(c['occurrence']);
      matrixOccurrence(matrixResources ?? [], resource, occurrence);
      if (typeof c['folded'] !== 'boolean' || usedMatrixViews.has(occurrence)) return fail('Each matrix cell requires its own view occurrence and folded state.');
      usedMatrixViews.add(occurrence);
      return { ...base, type: 'matrixObject', resource, occurrence, folded: c['folded'] };
    }
    if (c['type'] === 'mathObject') {
      exact(c, ['type', 'id', 'metadata', 'resource', 'view', 'viewport', 'folded']);
      const resource = uuid(c['resource']), view = c['view'];
      if (!mathematics?.resources.some(r => r.id === resource)) return fail('Restore the mathematical resource referenced by this occurrence.');
      if ((view !== 'equation' && view !== 'graph') || typeof c['folded'] !== 'boolean') return fail('Unsupported mathematical view.');
      return { ...base, type: 'mathObject', resource, view, viewport: readMathViewport(c['viewport']), folded: c['folded'] };
    }
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
    return fail('Unsupported cell type.');
  });
  if (cells.filter(c => c.type === 'story').length > 1) return fail('This exemplar supports at most one fractional animation.');
  if (cells.filter(c => c.type === 'articleHeader').length > 1 || cells.some((c, i) => c.type === 'articleHeader' && i !== 0)) return fail('An optional article header belongs at the beginning.');
  return { schemaVersion: 3, id: uuid(data['id']), revision: Number(data['revision']), cells, ...(mathematics ? { mathematics } : {}), ...(matrixResources ? { matrixResources } : {}) };
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
  const prose = (content: readonly Inline[], heading = false) => {
    const raw = projectionText(content);
    if (/\n|```|\[\[/.test(raw)) return fail('Use a new paragraph for line breaks; semantic directives belong in the animation cell.');
    if (!heading && /^\s*#/.test(raw)) return fail('Use the optional block title for a heading.');
    return (heading ? '# ' : '') + (raw.trim() || '\u00a0');
  };
  const projectBlock = (b: ContentBlock): string => [b.title ? prose(b.title.content) : '', prose(b.content), ...b.children.map(projectBlock)].filter(Boolean).join('\n\n');
  const cells = doc.cells.map(cell => {
    if (cell.type === 'mathObject' || cell.type === 'matrixObject') return fail('Mathematical objects use the selected mathematical notebook preview.');
    if (cell.type === 'story') {
      const steps = readSteps(cell.source, definition.beats.length, cell.caption.text);
      const story = { ...definition, beats: definition.beats.map((beat, index) => ({ ...beat, ...steps[index] })) };
      return '```kp-animation-story\n' + JSON.stringify(story, null, 2) + '\n```';
    }
    return cell.type === 'articleHeader' ? prose(cell.title.content, true) : projectBlock(cell);
  });
  if (doc.cells[0]?.type !== 'articleHeader') cells.unshift('# Fraction notebook');
  return cells.join('\n\n') + '\n';
}
