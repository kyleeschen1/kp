import { Schema, type Node as ProseNode } from 'prosemirror-model';
import { readNotebook, type FractionNotebook, type Inline } from './model.ts';
import { metadata } from './json.ts';
import { uuid } from '../notebook/model.ts';

const identity = { id: { default: null }, metadata: { default: {} } };
const attrs = (n: ProseNode) => ({ 'data-cell-id': n.attrs['id'], 'data-kp-meta': JSON.stringify(n.attrs['metadata']) });
const parse = (el: HTMLElement) => {
  try { return { id: el.dataset['cellId'] ? uuid(el.dataset['cellId']) : null, metadata: metadata(JSON.parse(el.dataset['kpMeta'] ?? '{}')) }; }
  catch { return false; }
};
export const schema = new Schema({
  nodes: {
    doc: { content: 'articleHeader paragraph* story paragraph*' },
    articleHeader: { attrs: identity, content: 'title authorCredit{1,8}', isolating: true, defining: true,
      toDOM: n => ['header', { ...attrs(n), class: 'fn-article-header' }, 0], parseDOM: [{ tag: 'header.fn-article-header', getAttrs: parse }] },
    title: { attrs: identity, content: 'inline*', defining: true,
      toDOM: n => ['h1', { ...attrs(n), 'aria-label': 'Article title' }, 0], parseDOM: [{ tag: 'h1', getAttrs: parse }] },
    authorCredit: { attrs: { ...identity, role: { default: 'author' } }, content: 'text*', marks: '', defining: true,
      toDOM: n => ['p', { ...attrs(n), class: 'fn-author', 'data-role': n.attrs['role'], 'aria-label': 'Author name' }, 0],
      parseDOM: [{ tag: 'p.fn-author', getAttrs: el => {
        const a = parse(el), role = el.dataset['role'] ?? 'author';
        return a && ['author', 'editor', 'translator'].includes(role) ? { ...a, role } : false;
      } }] },
    paragraph: { attrs: identity, content: 'inline*', group: 'block',
      toDOM: n => ['p', attrs(n), 0], parseDOM: [{ tag: 'p', getAttrs: parse }] },
    story: { attrs: identity, content: 'caption specification', group: 'block', defining: true, isolating: true,
      toDOM: n => ['section', { ...attrs(n), class: 'fn-story' },
        ['h2', { contenteditable: 'false' }, 'Undo the last operation'],
        ['p', { contenteditable: 'false', class: 'fn-cell-context' }, 'Existing fraction animation · local wording and targets'],
        ['div', 0]], parseDOM: [{ tag: 'section.fn-story', getAttrs: parse }] },
    caption: { attrs: identity, content: 'text*', marks: '', isolating: true,
      toDOM: n => ['div', { ...attrs(n), class: 'fn-caption' },
        ['span', { contenteditable: 'false', class: 'fn-slot-label' }, 'Opening caption · this occurrence'],
        ['p', { 'aria-label': 'Opening caption' }, 0]], parseDOM: [{ tag: 'div.fn-caption', getAttrs: parse, contentElement: 'p' }] },
    specification: { content: 'text*', marks: '', code: true, isolating: true,
      toDOM: () => ['pre', { class: 'fn-spec-source' }, ['code', 0]], parseDOM: [{ tag: 'pre.fn-spec-source', preserveWhitespace: 'full' }] },
    link: { attrs: identity, content: 'text*', inline: true, group: 'inline', atom: true, isolating: true, marks: '',
      toDOM: n => ['span', { ...attrs(n), 'data-inline-kind': 'link' }, 0], parseDOM: [{ tag: 'span[data-inline-kind=link]', getAttrs: parse }] },
    math: { attrs: identity, content: 'text*', inline: true, group: 'inline', atom: true, isolating: true, marks: '',
      toDOM: n => ['span', { ...attrs(n), 'data-inline-kind': 'math' }, 0], parseDOM: [{ tag: 'span[data-inline-kind=math]', getAttrs: parse }] },
    text: { group: 'inline' }
  },
  marks: {
    strong: { toDOM: () => ['strong', 0], parseDOM: [{ tag: 'strong' }, { tag: 'b' }] },
    em: { toDOM: () => ['em', 0], parseDOM: [{ tag: 'em' }, { tag: 'i' }] },
    code: { toDOM: () => ['code', 0], parseDOM: [{ tag: 'code' }] },
    annotation: { attrs: identity, inclusive: false, excludes: '',
      toDOM: m => ['span', { 'data-annotation-id': m.attrs['id'], 'data-kp-meta': JSON.stringify(m.attrs['metadata']), class: 'fn-annotation' }, 0],
      parseDOM: [{ tag: 'span[data-annotation-id]', getAttrs: el => {
        try { return { id: uuid(el.dataset['annotationId']), metadata: metadata(JSON.parse(el.dataset['kpMeta'] ?? '{}')) }; } catch { return false; }
      } }] }
  }
});
const textNode = (text: string) => text ? schema.text(text) : undefined;
const inlineNodes = (content: readonly Inline[]) => content.flatMap(item => {
  if (item.type !== 'text') return [schema.node(item.type, { id: item.id, metadata: item.metadata }, textNode(item.source))];
  return item.text ? [schema.text(item.text, [...item.marks.map(mark => schema.mark(mark)), ...item.annotations.map(a => schema.mark('annotation', a))])] : [];
});
export function toProse(doc: FractionNotebook): ProseNode {
  return schema.node('doc', null, doc.cells.map(cell => {
    const attrs = { id: cell.id, metadata: cell.metadata };
    if (cell.type === 'articleHeader') return schema.node('articleHeader', attrs, [
      schema.node('title', { id: cell.title.id, metadata: cell.title.metadata }, inlineNodes(cell.title.content)),
      ...cell.authors.map(a => schema.node('authorCredit', { id: a.id, metadata: a.metadata, role: a.role }, textNode(a.name)))
    ]);
    if (cell.type === 'story') return schema.node('story', attrs, [
      schema.node('caption', { id: cell.caption.id, metadata: cell.caption.metadata }, textNode(cell.caption.text)),
      schema.node('specification', null, textNode(cell.source))
    ]);
    return schema.node('paragraph', attrs, inlineNodes(cell.content));
  }));
}
export function fromProse(doc: ProseNode, basis: FractionNotebook): FractionNotebook {
  const identified = (n: ProseNode) => ({ id: n.attrs['id'], metadata: n.attrs['metadata'] });
  const content = (n: ProseNode): unknown[] => {
    const result: unknown[] = [];
    n.forEach(child => {
      if (!child.isText) result.push({ ...identified(child), type: child.type.name, source: child.textContent });
      else result.push({ type: 'text', text: child.text!, marks: child.marks.filter(m => m.type.name !== 'annotation').map(m => m.type.name),
        annotations: child.marks.filter(m => m.type.name === 'annotation').map(m => ({ id: m.attrs['id'], metadata: m.attrs['metadata'] })) });
    }); return result;
  };
  const cells: unknown[] = [];
  doc.forEach(node => {
    if (node.type.name === 'articleHeader') {
      const authors: unknown[] = []; node.forEach((a, _pos, index) => { if (index) authors.push({ ...identified(a), type: 'authorCredit', name: a.textContent, role: a.attrs['role'] }); });
      cells.push({ ...identified(node), type: 'articleHeader', title: { ...identified(node.child(0)), type: 'title', content: content(node.child(0)) }, authors });
    } else if (node.type.name === 'story') cells.push({ ...identified(node), type: 'story', source: node.child(1).textContent,
      caption: { ...identified(node.child(0)), type: 'caption', text: node.child(0).textContent } });
    else cells.push({ ...identified(node), type: 'paragraph', content: content(node) });
  });
  return readNotebook({ ...basis, revision: basis.revision + 1, cells });
}
