import { uuid, type UUID } from '../notebook/model.ts';

export type Mark = 'strong' | 'em' | 'code';
export interface Inline { readonly text: string; readonly marks: readonly Mark[] }
export type Cell = { readonly id: UUID; readonly type: 'paragraph' | 'heading'; readonly content: readonly Inline[] }
  | { readonly id: UUID; readonly type: 'story'; readonly source: string };
export interface FractionNotebook { readonly schemaVersion: 1; readonly id: UUID; readonly revision: number; readonly cells: readonly Cell[] }
export interface Step { readonly title: string; readonly content: string; readonly focusRefs: readonly string[] }
export interface Definition { readonly id: string; readonly asset: { readonly id: string; readonly version: string }; readonly presentation: string;
  readonly beats: readonly (Step & { readonly id: string; readonly progressPermille: number })[] }
export class FractionNotebookGap extends Error { override name = 'FractionNotebookGap'; }
const fail = (message: string): never => { throw new FractionNotebookGap(message); };
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return fail('Expected a plain JSON object.');
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(value).some(key => typeof key !== 'string') || Object.values(descriptors).some(d => !d.enumerable || !('value' in d))) return fail('Use JSON values without accessors or hidden fields.');
  return Object.fromEntries(Object.entries(value));
}
export function exact(value: Record<string, unknown>, keys: readonly string[]) {
  if (Object.keys(value).some(key => !keys.includes(key))) fail('Unsupported field; original source is retained.');
}
const string = (v: unknown, limit = 30000): string => typeof v === 'string' && v.length <= limit ? v : fail('Expected bounded text.');
export function readSteps(source: string, count: number): readonly Step[] {
  const data = object(JSON.parse(source)); exact(data, ['steps']);
  if (!Array.isArray(data['steps']) || data['steps'].length !== count) return fail(`Keep the ${count} checked moments in their existing order.`);
  return data['steps'].map((value: unknown) => {
    const step = object(value); exact(step, ['title', 'content', 'focusRefs']);
    if (!Array.isArray(step['focusRefs']) || step['focusRefs'].length > 24) return fail('Choose checked targets for this moment.');
    return { title: string(step['title'], 300), content: string(step['content']), focusRefs: step['focusRefs'].map(v => string(v, 300)) };
  });
}
export function readNotebook(value: unknown): FractionNotebook {
  const data = object(value); exact(data, ['schemaVersion', 'id', 'revision', 'cells']);
  if (data['schemaVersion'] !== 1 || !Number.isSafeInteger(data['revision']) || Number(data['revision']) < 0) return fail('Unsupported notebook version or revision.');
  if (!Array.isArray(data['cells']) || data['cells'].length > 200) return fail('Notebook requires at most 200 cells.');
  const seen = new Set<string>([uuid(data['id'])]);
  const cells: Cell[] = data['cells'].map((raw: unknown) => {
    const cell = object(raw), id = uuid(cell['id']);
    if (seen.has(id)) fail('Cell UUID already belongs to another cell.'); seen.add(id);
    if (cell['type'] === 'story') { exact(cell, ['id', 'type', 'source']); return { id, type: 'story', source: string(cell['source'], 100000) }; }
    exact(cell, ['id', 'type', 'content']);
    if (cell['type'] !== 'paragraph' && cell['type'] !== 'heading') return fail('Unsupported cell type.');
    if (!Array.isArray(cell['content']) || cell['content'].length > 2000) return fail('Expected bounded inline prose.');
    const content = cell['content'].map((raw: unknown): Inline => {
      const inline = object(raw); exact(inline, ['text', 'marks']);
      if (!Array.isArray(inline['marks']) || inline['marks'].some(mark => !['strong', 'em', 'code'].includes(mark))) return fail('Unsupported prose formatting.');
      return { text: string(inline['text']), marks: [...new Set(inline['marks'] as Mark[])] };
    });
    return { id, type: cell['type'], content };
  });
  if (cells.filter(c => c.type === 'story').length !== 1) return fail('Keep one fractional animation in this exemplar.');
  if (cells[0]?.type !== 'heading' || cells.filter(c => c.type === 'heading').length !== 1) return fail('Keep one opening title in this exemplar.');
  return { schemaVersion: 1, id: uuid(data['id']), revision: Number(data['revision']), cells };
}
export function importFractionReading(markdown: string): { notebook: FractionNotebook; definition: Definition } {
  const match = /```kp-animation-story\s*\n([\s\S]*?)\n```/.exec(markdown);
  if (!match || markdown.indexOf('```kp-animation-story', match.index + 1) !== -1) return fail('Expected the canonical single fraction story.');
  // This importer is used only with the checked-in canonical manuscript. All
  // editable payloads still pass readNotebook/readSteps and the lesson compiler.
  const definition: Definition = JSON.parse(match[1]!);
  const id = (n: number) => uuid(`20000000-0000-4000-8000-${String(n).padStart(12, '0')}`);
  let next = 2;
  const prose = (text: string): Cell[] => text.trim().split(/\n\s*\n/).filter(Boolean).map(text => ({
    id: id(next++), type: text.startsWith('# ') ? 'heading' : 'paragraph', content: [{ text: text.replace(/^# /, '').trim(), marks: [] }]
  }));
  const before = prose(markdown.slice(0, match.index));
  const source = JSON.stringify({ steps: definition.beats.map(({ title, content, focusRefs }) => ({ title, content, focusRefs })) }, null, 2);
  const story: Cell = { id: id(next++), type: 'story', source };
  return { definition, notebook: readNotebook({ schemaVersion: 1, id: id(1), revision: 0,
    cells: [...before, story, ...prose(markdown.slice(match.index + match[0].length))] }) };
}
export function projectReading(doc: FractionNotebook, definition: Definition): string {
  return doc.cells.map(cell => {
    if (cell.type === 'story') {
      const steps = readSteps(cell.source, definition.beats.length);
      const story = { ...definition, beats: definition.beats.map((beat, index) => ({ ...beat, ...steps[index] })) };
      return '```kp-animation-story\n' + JSON.stringify(story, null, 2) + '\n```';
    }
    const text = cell.content.map(t => t.text).join('');
    if (/\n|```|\[\[/.test(text)) return fail('Use a new paragraph for line breaks; semantic directives belong in the animation cell.');
    if (cell.type === 'paragraph' && /^\s*#/.test(text)) return fail('This paragraph cannot introduce another heading.');
    return (cell.type === 'heading' ? '# ' : '') + (text.trim() || '\u00a0');
  }).join('\n\n') + '\n';
}
