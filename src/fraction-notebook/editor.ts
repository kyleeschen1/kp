import { Schema, type Node as ProseNode } from 'prosemirror-model';
import { EditorState, Plugin, TextSelection, NodeSelection } from 'prosemirror-state';
import { EditorView, type NodeView } from 'prosemirror-view';
import { baseKeymap, toggleMark, splitBlockAs } from 'prosemirror-commands';
import { history, undo, redo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { EditorView as CodeView, keymap as codeKeymap, lineNumbers, drawSelection } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { json } from '@codemirror/lang-json';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { readNotebook, type FractionNotebook, type Mark } from './model.ts';

const identity = { id: { default: null } };
export const schema = new Schema({
  nodes: {
    doc: { content: 'heading paragraph* story paragraph*' },
    paragraph: { attrs: identity, content: 'inline*', group: 'block', toDOM: n => ['p', { 'data-cell-id': n.attrs['id'] }, 0], parseDOM: [{ tag: 'p' }] },
    heading: { attrs: identity, content: 'inline*', group: 'block', defining: true, toDOM: n => ['h1', { 'data-cell-id': n.attrs['id'] }, 0], parseDOM: [{ tag: 'h1' }] },
    story: { attrs: identity, content: 'text*', marks: '', group: 'block', code: true, defining: true, isolating: true,
      toDOM: n => ['pre', { 'data-cell-id': n.attrs['id'] }, ['code', 0]] },
    text: { group: 'inline' }
  },
  marks: {
    strong: { toDOM: () => ['strong', 0], parseDOM: [{ tag: 'strong' }, { tag: 'b' }] },
    em: { toDOM: () => ['em', 0], parseDOM: [{ tag: 'em' }, { tag: 'i' }] },
    code: { toDOM: () => ['code', 0], parseDOM: [{ tag: 'code' }] }
  }
});
export function toProse(doc: FractionNotebook): ProseNode {
  return schema.node('doc', null, doc.cells.map(cell => cell.type === 'story'
    ? schema.node('story', { id: cell.id }, cell.source ? schema.text(cell.source) : undefined)
    : schema.node(cell.type, { id: cell.id }, cell.content.filter(t => t.text).map(t => schema.text(t.text, t.marks.map(mark => schema.mark(mark)))))));
}
export function fromProse(doc: ProseNode, basis: FractionNotebook): FractionNotebook {
  const cells: unknown[] = [];
  doc.forEach(node => {
    if (node.type.name === 'story') cells.push({ type: 'story', id: node.attrs['id'], source: node.textContent });
    else {
      const content: unknown[] = [];
      node.forEach(text => content.push({ text: text.text ?? '', marks: text.marks.map(mark => mark.type.name) }));
      cells.push({ type: node.type.name, id: node.attrs['id'], content });
    }
  });
  return readNotebook({ ...basis, revision: basis.revision + 1, cells });
}

/** A split/paste keeps one original identity and gives new cells fresh UUIDs.
 * Positions are editor addresses, never persistent notebook identity. */
const identities = new Plugin({ appendTransaction(transactions, _old, state) {
  if (!transactions.some(tr => tr.docChanged)) return null;
  const seen = new Set<string>(), tr = state.tr;
  state.doc.forEach((node, position) => {
    const id: unknown = node.attrs['id'];
    if (typeof id !== 'string' || seen.has(id)) tr.setNodeMarkup(position, undefined, { ...node.attrs, id: crypto.randomUUID() });
    else seen.add(id);
  });
  return tr.docChanged ? tr : null;
} });

// The required story is also a text block, so ProseMirror's generic default
// can choose it when splitting prose. Enter must create a paragraph instead.
const splitProse = splitBlockAs(node => node.type.name === 'story' ? null : { type: schema.nodes['paragraph']! });

export function mountFractionEditor(root: HTMLElement, doc: FractionNotebook, onChange: (node: ProseNode) => void, onSelect: (id: string) => void) {
  let selected: string | undefined;
  const view = new EditorView(root, {
    state: EditorState.create({ doc: toProse(doc), plugins: [identities, history(), keymap({ 'Mod-z': undo, 'Mod-Shift-z': redo, 'Mod-y': redo,
      'Mod-b': toggleMark(schema.marks['strong']!), 'Mod-i': toggleMark(schema.marks['em']!), Enter: splitProse }), keymap(baseKeymap)] }),
    attributes: { 'aria-label': 'Fraction notebook', spellcheck: 'true' },
    nodeViews: { story: (node, outer, getPos) => new StoryView(node, outer, getPos) },
    dispatchTransaction(transaction) {
      const next = view.state.applyTransaction(transaction); view.updateState(next.state);
      if (next.transactions.some(tr => tr.docChanged)) onChange(next.state.doc);
      const selection = view.state.selection;
      const node = selection instanceof NodeSelection ? selection.node : selection.$from.depth > 0 ? selection.$from.node(1) : undefined;
      const id: unknown = node?.attrs['id'];
      if (typeof id === 'string' && id !== selected) { selected = id; onSelect(id); }
    }
  });
  return {
    view,
    mark(name: Mark) { toggleMark(schema.marks[name]!)(view.state, view.dispatch); view.focus(); },
    undo() { undo(view.state, view.dispatch); }, redo() { redo(view.state, view.dispatch); },
    reveal(id: string) {
      view.state.doc.forEach((node, pos) => {
        if (node.attrs['id'] !== id) return;
        view.dispatch(view.state.tr.setSelection(node.type.name === 'story' ? NodeSelection.create(view.state.doc, pos) : TextSelection.create(view.state.doc, pos + 1)).scrollIntoView());
      }); view.focus();
    },
    dispose() { view.destroy(); }
  };
}

class StoryView implements NodeView {
  readonly dom = document.createElement('section');
  private readonly code: CodeView;
  private updating = false;
  private node: ProseNode;
  constructor(node: ProseNode, outer: EditorView, getPos: () => number | undefined) {
    this.node = node;
    this.dom.className = 'fn-story'; this.dom.dataset['cellId'] = node.attrs['id']; this.dom.contentEditable = 'false';
    const title = document.createElement('h2'); title.textContent = 'Undo the last operation';
    const description = document.createElement('p'); description.textContent = 'x/2 + 3 = 7 → x = 8'; description.className = 'fn-equation-label';
    const context = document.createElement('p'); context.className = 'fn-cell-context'; context.textContent = 'Existing fraction animation · local wording and targets';
    const details = document.createElement('details'), summary = document.createElement('summary'); summary.textContent = 'Edit animation specification';
    const help = document.createElement('p'); help.className = 'fn-code-help'; help.textContent = 'Edit titles, wording and focusRefs. The nine moments retain their checked order and mathematics.';
    const host = document.createElement('div'); host.className = 'fn-code';
    details.append(summary, help, host); this.dom.append(title, description, context, details);
    // This isolated cell owns its DOM events; explicitly tell the notebook
    // which cell is active without stealing the embedded editor's focus.
    this.dom.addEventListener('focusin', () => {
      const pos = getPos(), selection = outer.state.selection;
      const active = selection instanceof NodeSelection ? selection.node : selection.$from.depth > 0 ? selection.$from.node(1) : null;
      if (pos !== undefined && active?.attrs['id'] !== this.node.attrs['id']) {
        outer.dispatch(outer.state.tr.setSelection(NodeSelection.create(outer.state.doc, pos)));
      }
    });
    this.code = new CodeView({ doc: node.textContent, parent: host, extensions: [json(), lineNumbers(), drawSelection(), syntaxHighlighting(HighlightStyle.define([
      { tag: tags.string, color: '#d8c59b' }, { tag: tags.propertyName, color: '#b9cfdf' },
      { tag: tags.number, color: '#bfd0a9' }, { tag: tags.punctuation, color: '#c1c7ce' }
    ])),
      codeKeymap.of([{ key: 'Mod-z', run: () => undo(outer.state, outer.dispatch) }, { key: 'Mod-Shift-z', run: () => redo(outer.state, outer.dispatch) },
        { key: 'Mod-y', run: () => redo(outer.state, outer.dispatch) },
        { key: 'Escape', run: () => { details.open = false; outer.focus(); return true; } }, ...defaultKeymap]),
      CodeView.updateListener.of(update => {
        if (this.updating || !update.docChanged) return;
        const pos = getPos(); if (pos === undefined) return;
        const text = update.state.doc.toString(), tr = outer.state.tr.replaceWith(pos + 1, pos + this.node.nodeSize - 1, text ? schema.text(text) : []);
        tr.setSelection(TextSelection.create(tr.doc, pos + 1 + update.state.selection.main.anchor, pos + 1 + update.state.selection.main.head));
        outer.dispatch(tr);
      }), CodeView.theme({ '&': { backgroundColor: 'transparent', color: '#e0dfd4', fontSize: '13px' }, '.cm-content': { fontFamily: 'ui-monospace, monospace' }, '.cm-gutters': { backgroundColor: 'transparent', color: '#8f968f', border: 'none' }, '.cm-scroller': { overflow: 'auto', maxHeight: '540px' }, '&.cm-focused .cm-cursor': { borderLeftColor: '#f4e9c9' }, '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: '#40534e' } })
    ] });
    details.addEventListener('toggle', () => { if (details.open) this.code.requestMeasure(); });
  }
  update(node: ProseNode) {
    if (node.type !== this.node.type) return false;
    this.node = node; this.dom.dataset['cellId'] = node.attrs['id'];
    const text = node.textContent;
    if (text !== this.code.state.doc.toString()) {
      this.updating = true;
      this.code.dispatch({ changes: { from: 0, to: this.code.state.doc.length, insert: text } });
      this.updating = false;
    }
    return true;
  }
  selectNode() { this.dom.classList.add('ProseMirror-selectednode'); }
  deselectNode() { this.dom.classList.remove('ProseMirror-selectednode'); }
  stopEvent() { return true; }
  ignoreMutation() { return true; }
  destroy() { this.code.destroy(); }
}
