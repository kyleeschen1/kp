import { Schema, type Node as ProseNode } from 'prosemirror-model';
import { readNotebook, type FractionNotebook, type Inline } from './model.ts';
import { metadata } from './json.ts';
import { uuid } from '../notebook/model.ts';
import { defaultMathViewport, readMathViewport, readNotebookMathematics } from '../notebook/math-model.ts';
import { readMatrixResources } from './matrix-data.ts';

const identity = { id: { default: null }, metadata: { default: {} } };
const attrs = (n: ProseNode) => ({ 'data-cell-id': n.attrs['id'], 'data-kp-meta': JSON.stringify(n.attrs['metadata']) });
const parse = (el: HTMLElement) => {
  try { return { id: el.dataset['cellId'] ? uuid(el.dataset['cellId']) : null, metadata: metadata(JSON.parse(el.dataset['kpMeta'] ?? '{}')) }; }
  catch { return false; }
};
export const schema = new Schema({
  nodes: {
    doc: { content: '(mathematics | matrixResources)? articleHeader? (block | story | mathObject | matrixObject)*' },
    matrixResources: { attrs: { value: {} }, atom: true, selectable: false,
      toDOM: () => ['div', { hidden: '', 'data-matrix-store': '', contenteditable: 'false' }] },
    matrixObject: { attrs: { ...identity, resource: {}, occurrence: {}, folded: { default: false } }, atom: true, selectable: true, isolating: true,
      toDOM: n => ['section', { ...attrs(n), 'data-matrix-resource': n.attrs['resource'], 'data-matrix-occurrence': n.attrs['occurrence'], 'data-folded': String(n.attrs['folded']) }],
      parseDOM: [{ tag: 'section[data-matrix-resource]', getAttrs: el => {
        try { const a = parse(el); return a ? { ...a, resource: uuid(el.dataset['matrixResource']), occurrence: uuid(el.dataset['matrixOccurrence']), folded: el.dataset['folded'] === 'true' } : false; }
        catch { return false; }
      } }] },
    // Root attribute changes recreate ProseMirror's entire document view. A
    // nonselectable data node keeps resource edits in native undo history
    // without replacing focused controls or persisting a second source of truth.
    mathematics: { attrs: { value: {} }, atom: true, selectable: false,
      toDOM: () => ['div', { hidden: '', 'data-mathematics-store': '', contenteditable: 'false' }] },
    mathObject: { attrs: { ...identity, resource: {}, view: { default: 'equation' }, viewport: { default: defaultMathViewport }, folded: { default: false } }, atom: true, selectable: true, isolating: true,
      toDOM: n => ['section', { ...attrs(n), class: 'fn-math-object', 'data-math-resource': n.attrs['resource'], 'data-math-view': n.attrs['view'],
        'data-math-viewport': JSON.stringify(n.attrs['viewport']), 'data-folded': String(n.attrs['folded']) }],
      parseDOM: [{ tag: 'section[data-math-resource]', getAttrs: el => {
        try { const a = parse(el), view = el.dataset['mathView'];
          return a && (view === 'equation' || view === 'graph') ? { ...a, resource: uuid(el.dataset['mathResource']), view,
            viewport: readMathViewport(JSON.parse(el.dataset['mathViewport'] ?? '{}')), folded: el.dataset['folded'] === 'true' } : false;
        } catch { return false; }
      } }] },
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
    block: { attrs: { ...identity, kind: { default: 'paragraph' }, layout: { default: 'flow' }, folded: { default: false } },
      content: 'blockTitle? paragraph block*', defining: true,
      toDOM: n => ['section', { ...attrs(n), class: 'fn-block', 'data-layout': n.attrs['layout'], 'data-kind': n.attrs['kind'], 'data-folded': String(n.attrs['folded']) }, 0],
      parseDOM: [{ tag: 'section.fn-block', getAttrs: el => {
        const a = parse(el), layout = el.dataset['layout'] ?? 'flow', kind = el.dataset['kind'] ?? 'paragraph';
        return a && ['flow', 'bullets', 'numbered', 'outline'].includes(layout) && ['paragraph', 'note'].includes(kind)
          ? { ...a, layout, kind, folded: el.dataset['folded'] === 'true' } : false;
      } }] },
    blockTitle: { attrs: identity, content: 'inline*', defining: true,
      toDOM: n => ['h2', { ...attrs(n), class: 'fn-block-title', 'aria-label': 'Block title' }, 0], parseDOM: [{ tag: 'h2.fn-block-title', getAttrs: parse }] },
    paragraph: { content: 'inline*', toDOM: () => ['p', 0], parseDOM: [{ tag: 'p' }] },
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
  const block = (cell: import('./types.ts').ContentBlock): ProseNode => schema.node('block',
    { id: cell.id, metadata: cell.metadata, kind: cell.kind, layout: cell.layout, folded: cell.folded }, [
      ...(cell.title ? [schema.node('blockTitle', { id: cell.title.id, metadata: cell.title.metadata }, inlineNodes(cell.title.content))] : []),
      schema.node('paragraph', null, inlineNodes(cell.content)), ...cell.children.map(block)
    ]);
  return schema.node('doc', null, [...(doc.mathematics ? [schema.node('mathematics', { value: doc.mathematics })] : []), ...(doc.matrixResources ? [schema.node('matrixResources', { value: doc.matrixResources })] : []), ...doc.cells.map(cell => {
    const attrs = { id: cell.id, metadata: cell.metadata };
    if (cell.type === 'matrixObject') return schema.node('matrixObject', cell);
    if (cell.type === 'mathObject') return schema.node('mathObject', { ...attrs, resource: cell.resource, view: cell.view, viewport: cell.viewport, folded: cell.folded });
    if (cell.type === 'articleHeader') return schema.node('articleHeader', attrs, [
      schema.node('title', { id: cell.title.id, metadata: cell.title.metadata }, inlineNodes(cell.title.content)),
      ...cell.authors.map(a => schema.node('authorCredit', { id: a.id, metadata: a.metadata, role: a.role }, textNode(a.name)))
    ]);
    if (cell.type === 'story') return schema.node('story', attrs, [
      schema.node('caption', { id: cell.caption.id, metadata: cell.caption.metadata }, textNode(cell.caption.text)),
      schema.node('specification', null, textNode(cell.source))
    ]);
    return block(cell);
  })]);
}
export function mathematicsIn(doc: ProseNode) {
  if (doc.firstChild?.type.name !== 'mathematics') throw new Error('The mathematical resource store is missing. Undo to restore it.');
  return readNotebookMathematics(doc.firstChild.attrs['value']);
}
export function matrixResourcesIn(doc: ProseNode) {
  if (doc.firstChild?.type.name !== 'matrixResources') throw new Error('The matrix resource store is missing. Undo to restore it.');
  return readMatrixResources(doc.firstChild.attrs['value']);
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
  const block = (node: ProseNode): unknown => {
    const titled = node.firstChild?.type.name === 'blockTitle', children: unknown[] = [];
    node.forEach(child => { if (child.type.name === 'block') children.push(block(child)); });
    return { ...identified(node), type: 'block', kind: node.attrs['kind'], layout: node.attrs['layout'], folded: node.attrs['folded'],
      title: titled ? { ...identified(node.child(0)), type: 'title', content: content(node.child(0)) } : null,
      content: content(node.child(titled ? 1 : 0)), children };
  };
  doc.forEach(node => {
    if (node.type.name === 'mathematics' || node.type.name === 'matrixResources') return;
    if (node.type.name === 'matrixObject') cells.push({ ...identified(node), type: 'matrixObject', resource: node.attrs['resource'], occurrence: node.attrs['occurrence'], folded: node.attrs['folded'] });
    else if (node.type.name === 'mathObject') cells.push({ ...identified(node), type: 'mathObject', resource: node.attrs['resource'], view: node.attrs['view'], viewport: node.attrs['viewport'], folded: node.attrs['folded'] });
    else if (node.type.name === 'articleHeader') {
      const authors: unknown[] = []; node.forEach((a, _pos, index) => { if (index) authors.push({ ...identified(a), type: 'authorCredit', name: a.textContent, role: a.attrs['role'] }); });
      cells.push({ ...identified(node), type: 'articleHeader', title: { ...identified(node.child(0)), type: 'title', content: content(node.child(0)) }, authors });
    } else if (node.type.name === 'story') cells.push({ ...identified(node), type: 'story', source: node.child(1).textContent,
      caption: { ...identified(node.child(0)), type: 'caption', text: node.child(0).textContent } });
    else cells.push(block(node));
  });
  return readNotebook({ schemaVersion: 3, id: basis.id, revision: basis.revision + 1, cells,
    ...(doc.firstChild?.type.name === 'matrixResources' ? { matrixResources: matrixResourcesIn(doc) } : {}),
    ...(doc.firstChild?.type.name === 'mathematics' ? { mathematics: mathematicsIn(doc) } : {}) });
}
