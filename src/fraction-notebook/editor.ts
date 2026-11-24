import { type Node as ProseNode } from 'prosemirror-model';
import { EditorState, Plugin, TextSelection, NodeSelection, Selection, type Command } from 'prosemirror-state';
import { EditorView, type NodeView } from 'prosemirror-view';
import { baseKeymap, toggleMark, splitBlockAs } from 'prosemirror-commands';
import { history, undo, redo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { EditorView as CodeView, keymap as codeKeymap, lineNumbers, drawSelection } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { json } from '@codemirror/lang-json';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { type FractionNotebook, type Mark } from './model.ts';

export { schema, toProse, fromProse } from './schema.ts';
import { schema, toProse } from './schema.ts';
import { selectedObject } from './inspector.ts';

/** A split/paste keeps one original identity and gives new cells fresh UUIDs.
 * Positions are editor addresses, never persistent notebook identity. */
const identities = new Plugin({ appendTransaction(transactions, _old, state) {
  if (!transactions.some(tr => tr.docChanged)) return null;
  const seen = new Set<string>(), tr = state.tr;
  state.doc.descendants((node, position) => {
    if (!Object.hasOwn(node.attrs, 'id')) return;
    const id: unknown = node.attrs['id'];
    if (typeof id !== 'string' || seen.has(id)) tr.setNodeMarkup(position, undefined, { ...node.attrs, id: crypto.randomUUID() });
    else seen.add(id);
  });
  return tr.docChanged ? tr : null;
} });

// The required story is also a text block, so ProseMirror's generic default
// can choose it when splitting prose. Enter must create a paragraph instead.
const splitProse = splitBlockAs(node => node.type.name === 'paragraph' ? { type: schema.nodes['paragraph']! } : null);
const enterField: Command = (state, dispatch) => {
  const { $from } = state.selection, name = $from.parent.type.name;
  if (name === 'paragraph') return splitProse(state, dispatch);
  if (!['title', 'authorCredit', 'caption'].includes(name)) return false;
  const insideHeader = name !== 'caption' && $from.indexAfter(1) < $from.node(1).childCount;
  const pos = insideHeader ? $from.after() : $from.after(1), tr = state.tr;
  if (!insideHeader && tr.doc.nodeAt(pos)?.type.name !== 'paragraph') tr.insert(pos, schema.node('paragraph'));
  if (dispatch) dispatch(tr.setSelection(Selection.near(tr.doc.resolve(pos), 1)).scrollIntoView());
  return true;
};

export function mountFractionEditor(root: HTMLElement, doc: FractionNotebook, onChange: (node: ProseNode) => void, onSelect: (id: string) => void) {
  const view = new EditorView(root, {
    state: EditorState.create({ doc: toProse(doc), plugins: [identities, history(), keymap({ 'Mod-z': undo, 'Mod-Shift-z': redo, 'Mod-y': redo,
      'Mod-b': toggleMark(schema.marks['strong']!), 'Mod-i': toggleMark(schema.marks['em']!), Enter: enterField }), keymap(baseKeymap)] }),
    attributes: { 'aria-label': 'Fraction notebook', spellcheck: 'true' },
    nodeViews: { specification: (node, outer, getPos) => new SpecificationView(node, outer, getPos) },
    dispatchTransaction(transaction) {
      const next = view.state.applyTransaction(transaction); view.updateState(next.state);
      if (next.transactions.some(tr => tr.docChanged)) onChange(next.state.doc);
      const node = selectedObject(view.state)?.node;
      const id: unknown = node?.attrs['id'];
      if (typeof id === 'string') onSelect(id);
    }
  });
  return {
    view,
    mark(name: Mark) { toggleMark(schema.marks[name]!)(view.state, view.dispatch); view.focus(); },
    undo() { undo(view.state, view.dispatch); }, redo() { redo(view.state, view.dispatch); },
    reveal(id: string) {
      view.state.doc.descendants((node, pos) => {
        if (node.attrs['id'] !== id) return;
        view.dispatch(view.state.tr.setSelection(!node.isTextblock ? NodeSelection.create(view.state.doc, pos) : TextSelection.create(view.state.doc, pos + 1)).scrollIntoView());
      }); view.focus();
    },
    dispose() { view.destroy(); }
  };
}

class SpecificationView implements NodeView {
  readonly dom = document.createElement('section');
  private readonly code: CodeView;
  private updating = false;
  private node: ProseNode;
  constructor(node: ProseNode, outer: EditorView, getPos: () => number | undefined) {
    this.node = node;
    this.dom.className = 'fn-specification'; this.dom.contentEditable = 'false';
    const details = document.createElement('details'), summary = document.createElement('summary'); summary.textContent = 'Edit animation specification';
    const help = document.createElement('p'); help.className = 'fn-code-help'; help.textContent = 'The opening caption is edited above. Edit remaining wording and focusRefs here; the nine mathematical moments retain their order.';
    const host = document.createElement('div'); host.className = 'fn-code';
    details.append(summary, help, host); this.dom.append(details);
    this.dom.addEventListener('focusin', () => {
      const pos = getPos(); if (pos !== undefined && !(outer.state.selection instanceof NodeSelection && outer.state.selection.from === pos)) {
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
    this.node = node;
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
