import { type Node as ProseNode } from 'prosemirror-model';
import { EditorState, Plugin, TextSelection, NodeSelection, Selection, type Command, type SelectionBookmark } from 'prosemirror-state';
import { EditorView, type NodeView } from 'prosemirror-view';
import { baseKeymap, toggleMark } from 'prosemirror-commands';
import { history, undo, redo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { EditorView as CodeView, keymap as codeKeymap, lineNumbers, drawSelection } from '@codemirror/view';
import { Compartment } from '@codemirror/state';
import type { LineMode } from './numbers.ts';
import { defaultKeymap } from '@codemirror/commands';
import { json } from '@codemirror/lang-json';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { vim, getCM, Vim } from '@replit/codemirror-vim';
import { type FractionNotebook, type Mark } from './model.ts';

export { schema, toProse, fromProse } from './schema.ts';
import { schema, toProse } from './schema.ts';
import { selectedObject } from './inspector.ts';
import { createInlinePlugin, enterInline } from './inline-plugin.ts';
import { InlineSourceView } from './inline-view.ts';
import { preparePastedSlice } from './clipboard.ts';
import { BlockView } from './block-view.ts';
import { emptyBlock, splitContentBlock, nestBlock, outdentBlock, moveBlock, withinStructureLimits } from './structure.ts';
import { proseVim, setVimMode, vimKey } from './vim.ts';

/** A split/paste keeps one original identity and gives new cells fresh UUIDs.
 * Positions are editor addresses, never persistent notebook identity. */
const identities = new Plugin({ filterTransaction: tr => !tr.docChanged || withinStructureLimits(tr.doc), appendTransaction(transactions, _old, state) {
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
const enterField: Command = (state, dispatch) => {
  const { $from } = state.selection, name = $from.parent.type.name;
  if (name === 'paragraph') return splitContentBlock(state, dispatch);
  if (name === 'blockTitle') {
    dispatch?.(state.tr.setSelection(Selection.near(state.doc.resolve($from.after()), 1)).scrollIntoView()); return true;
  }
  if (!['title', 'authorCredit', 'caption'].includes(name)) return false;
  const insideHeader = name !== 'caption' && $from.indexAfter(1) < $from.node(1).childCount;
  const pos = insideHeader ? $from.after() : $from.after(1), tr = state.tr;
  if (!insideHeader && tr.doc.nodeAt(pos)?.type.name !== 'block') tr.insert(pos, emptyBlock());
  if (dispatch) dispatch(tr.setSelection(Selection.near(tr.doc.resolve(pos), 1)).scrollIntoView());
  return true;
};

export interface SourceWorkspace {
  host: HTMLElement;
  open: () => void;
  close: () => void;
  run: () => void;
}
export function mountFractionEditor(root: HTMLElement, doc: FractionNotebook, onChange: (node: ProseNode) => void, onSelect: (id: string) => void, onMode: (mode: string) => void = () => {}, workspace?: SourceWorkspace) {
  let source: SpecificationView | undefined, bookmark: SelectionBookmark | undefined, scrollTop = 0;
  const closeSource = () => { source?.close(); };
  const sourceWorkspace = workspace && { ...workspace,
    open() { bookmark = view.state.selection.getBookmark(); scrollTop = root.scrollTop; workspace.open(); },
    close() { workspace.close(); if (bookmark) view.dispatch(view.state.tr.setSelection(bookmark.resolve(view.state.doc))); bookmark = undefined; view.focus(); root.scrollTop = scrollTop; }
  };
  const view = new EditorView(root, {
    state: EditorState.create({ doc: toProse(doc), plugins: [identities, history(), proseVim(), createInlinePlugin(), keymap({ 'Mod-z': undo, 'Mod-Shift-z': redo, 'Mod-y': redo,
      'Mod-b': toggleMark(schema.marks['strong']!), 'Mod-i': toggleMark(schema.marks['em']!), Enter: enterField,
      Tab: nestBlock, 'Shift-Tab': outdentBlock, 'Alt-ArrowUp': moveBlock(-1), 'Alt-ArrowDown': moveBlock(1),
      ArrowLeft: enterInline(-1), ArrowRight: enterInline(1), Backspace: enterInline(-1) }), keymap(baseKeymap)] }),
    attributes: { 'aria-label': 'Fraction notebook', spellcheck: 'true' },
    nodeViews: { block: (node, outer, getPos) => new BlockView(node, outer, getPos), specification: (node, outer, getPos) => (source = new SpecificationView(node, outer, getPos, onMode, sourceWorkspace)),
      link: (node, outer, getPos) => new InlineSourceView(node, outer, getPos), math: (node, outer, getPos) => new InlineSourceView(node, outer, getPos) },
    handlePaste(view, _event, slice) {
      if (vimKey.getState(view.state) !== 'insert') return true;
      view.dispatch(view.state.tr.replaceSelection(preparePastedSlice(view.state.doc, slice)).setMeta('paste', true).setMeta('uiEvent', 'paste').scrollIntoView()); return true;
    },
    handleDOMEvents: { focus: view => { onMode(vimKey.getState(view.state) ?? 'normal'); return false; } },
    dispatchTransaction(transaction) {
      const next = view.state.applyTransaction(transaction); view.updateState(next.state);
      for (const tr of next.transactions) bookmark = bookmark?.map(tr.mapping);
      onMode(vimKey.getState(next.state) ?? 'normal');
      if (next.transactions.some(tr => tr.docChanged)) onChange(next.state.doc);
      const node = selectedObject(view.state)?.node;
      const id: unknown = node?.attrs['id'];
      if (typeof id === 'string') onSelect(id);
    }
  });
  return {
    view,
    closeSource,
    sourceOpen: () => source?.isOpen() ?? false,
    numbers(mode: LineMode) { source?.numbers(mode); },
    run(command: Command) { const done = command(view.state, view.dispatch, view); view.focus(); return done; },
    normal() { setVimMode('normal')(view.state, view.dispatch); },
    toggleMode() {
      const code = document.activeElement instanceof HTMLElement ? CodeView.findFromDOM(document.activeElement) : null;
      const cm = code && getCM(code);
      if (cm && (root.contains(code.dom) || workspace?.host.contains(code.dom))) { Vim.handleKey(cm, cm.state.vim?.insertMode ? '<Esc>' : 'i', 'user'); code.focus(); }
      else { setVimMode(vimKey.getState(view.state) === 'insert' ? 'normal' : 'insert')(view.state, view.dispatch); view.focus(); }
    },
    mark(name: Mark) { toggleMark(schema.marks[name]!)(view.state, view.dispatch); view.focus(); },
    undo() { undo(view.state, view.dispatch); }, redo() { redo(view.state, view.dispatch); },
    reveal(id: string) {
      const tr = view.state.tr;
      view.state.doc.descendants((node, pos) => {
        if (node.attrs['id'] !== id) return;
        const resolved = view.state.doc.resolve(pos);
        for (let d = resolved.depth; d > 0; d--) if (resolved.node(d).type.name === 'block' && resolved.node(d).attrs['folded'])
          tr.setNodeMarkup(resolved.before(d), undefined, { ...resolved.node(d).attrs, folded: false });
      });
      if (tr.docChanged) view.dispatch(tr);
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
  private readonly details = document.createElement('details');
  private readonly host = document.createElement('div');
  private active = false;
  private readonly gutter = new Compartment();
  private disposed = false;
  private readonly workspace: SourceWorkspace | undefined;
  constructor(node: ProseNode, outer: EditorView, getPos: () => number | undefined, onMode: (mode: string) => void, workspace?: SourceWorkspace) {
    this.workspace = workspace;
    this.node = node;
    this.dom.className = 'fn-specification'; this.dom.contentEditable = 'false';
    const details = this.details, summary = document.createElement('summary'); summary.textContent = 'Edit animation specification';
    const help = document.createElement('p'); help.className = 'fn-code-help'; help.textContent = 'The opening caption is edited above. Edit remaining wording and focusRefs here; the nine mathematical moments retain their order.';
    const host = this.host; host.className = 'fn-code';
    host.append(help); details.append(summary, host); this.dom.append(details);
    const slot = document.createElement('div'); slot.className = 'fn-animation-slot'; slot.setAttribute('aria-label', 'Animation result'); this.dom.append(slot);
    host.addEventListener('focusin', () => {
      const pos = getPos(); if (pos !== undefined && !(outer.state.selection instanceof NodeSelection && outer.state.selection.from === pos)) {
        outer.dispatch(outer.state.tr.setSelection(NodeSelection.create(outer.state.doc, pos)));
      }
      reportMode();
    });
    this.code = new CodeView({ doc: node.textContent, parent: host, extensions: [vim(), json(), this.gutter.of(lineNumbers()), drawSelection(), syntaxHighlighting(HighlightStyle.define([
      { tag: tags.string, color: 'var(--fn-code-string)' }, { tag: tags.propertyName, color: 'var(--fn-code-property)' },
      { tag: tags.number, color: 'var(--fn-code-number)' }, { tag: tags.punctuation, color: 'var(--fn-code-punctuation)' }
    ])),
      codeKeymap.of([{ key: 'Mod-z', run: () => undo(outer.state, outer.dispatch) }, { key: 'Mod-Shift-z', run: () => redo(outer.state, outer.dispatch) },
        { key: 'Mod-y', run: () => redo(outer.state, outer.dispatch) },
        // Escape belongs to Vim; closing the panel must not steal its Normal
        // mode transition or redirect subsequent typing into the prose editor.
        { key: 'Mod-Enter', run: () => { this.close(); return true; } },
        { key: 'Shift-Enter', run: () => { workspace?.run(); return true; } }, ...defaultKeymap]),
      CodeView.updateListener.of(update => {
        if (this.updating || !update.docChanged) return;
        const pos = getPos(); if (pos === undefined) return;
        const text = update.state.doc.toString(), tr = outer.state.tr.replaceWith(pos + 1, pos + this.node.nodeSize - 1, text ? schema.text(text) : []);
        tr.setSelection(TextSelection.create(tr.doc, pos + 1 + update.state.selection.main.anchor, pos + 1 + update.state.selection.main.head));
        outer.dispatch(tr); reportMode();
      }), CodeView.theme({ '&': { backgroundColor: 'transparent', color: 'var(--fn-text)', fontSize: 'var(--fn-code-size)' }, '.cm-content': { fontFamily: 'ui-monospace, monospace' }, '.cm-gutters': { backgroundColor: 'transparent', color: 'var(--fn-gutter)', border: 'none' }, '.cm-scroller': { overflow: 'auto', maxHeight: '540px' }, '&.cm-focused .cm-cursor': { borderLeftColor: 'var(--kp-editor-cursor)' }, '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: 'var(--fn-selection)' } })
    ] });
    // Extension facets must share the same CodeMirror instance. Fail visibly
    // if stale development chunks otherwise leave a silently nonmodal editor.
    const codeVim = getCM(this.code);
    if (!codeVim) throw new Error('JSON Vim did not attach. Reload after the development server finishes rebuilding.');
    const reportMode = () => {
      const mode = getCM(this.code)?.state.vim;
      if (this.code.hasFocus) onMode(mode?.insertMode ? 'insert' : mode?.visualMode ? 'visual' : 'normal');
    };
    codeVim.on('vim-mode-change', reportMode);
    details.addEventListener('toggle', () => {
      if (this.disposed || this.active === details.open) return;
      if (details.open) {
        this.active = true; workspace?.open(); workspace?.host.append(host);
        this.code.requestMeasure(); this.code.focus();
      } else this.close();
    });
  }
  isOpen() { return this.active; }
  numbers(mode: LineMode) {
    this.code.dispatch({ effects: this.gutter.reconfigure(mode === 'off' ? [] : lineNumbers({ formatNumber: (number, state) => {
      const active = state.doc.lineAt(state.selection.main.head).number;
      return String(mode === 'relative' && number !== active ? Math.abs(number - active) : number);
    } })) });
  }
  close() {
    if (!this.active) return;
    this.active = false; this.details.open = false; this.details.append(this.host); this.workspace?.close();
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
  destroy() { this.close(); this.disposed = true; this.code.destroy(); }
}
