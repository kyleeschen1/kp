import { Schema } from 'prosemirror-model';
import { EditorState, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { baseKeymap } from 'prosemirror-commands';
import { history, undo, redo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { proseVim, setVimMode, vimKey } from './vim.ts';

export const queryLimit = 256;
export const querySchema = new Schema({ nodes: {
  doc: { content: 'paragraph' },
  paragraph: { content: 'text*', toDOM: () => ['p', 0], parseDOM: [{ tag: 'p' }] },
  text: {}
} });
export const singleLine = (text: string) => text.replace(/[\r\n\t\u2028\u2029]+/g, ' ');

export function mountPickerQuery(host: HTMLElement, changed: (text: string) => void,
  options = { label: 'Find a fruit', list: 'kp-fruit-results', surface: 'Picker › query' }) {
  const shape = new Plugin({ filterTransaction: tr => !tr.docChanged || (
    tr.doc.childCount === 1 && tr.doc.firstChild?.type === querySchema.nodes['paragraph']
    && tr.doc.textContent.length <= queryLimit && singleLine(tr.doc.textContent) === tr.doc.textContent
  ) });
  const view = new EditorView(host, {
    state: EditorState.create({ schema: querySchema, plugins: [shape, history(),
      keymap({ 'Mod-z': undo, 'Mod-Shift-z': redo, 'Mod-y': redo }),
      // A one-line prompt has no "open a paragraph below" operation.
      proseVim({ openBelow: () => false }), keymap(baseKeymap)
    ] }),
    attributes: { role: 'combobox', 'aria-label': options.label, 'aria-autocomplete': 'list',
      'aria-expanded': 'false', 'aria-controls': options.list, 'aria-haspopup': 'listbox',
      'aria-multiline': 'false', 'data-editor-surface': options.surface, spellcheck: 'false' },
    handlePaste(editor, event) {
      if (vimKey.getState(editor.state) !== 'insert') return true;
      const text = event.clipboardData?.getData('text/plain'); if (text === undefined) return false;
      const { from, to } = editor.state.selection;
      const room = queryLimit - editor.state.doc.textContent.length + to - from;
      editor.dispatch(editor.state.tr.insertText(singleLine(text).slice(0, room)).scrollIntoView()); return true;
    },
    dispatchTransaction(tr) {
      const next = view.state.applyTransaction(tr); view.updateState(next.state);
      if (next.transactions.some(transaction => transaction.docChanged)) changed(next.state.doc.textContent);
    }
  });
  setVimMode('insert')(view.state, view.dispatch);
  return view;
}
