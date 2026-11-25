import { Slice, type Node as ProseNode } from 'prosemirror-model';
import { EditorState, Plugin, TextSelection, type Command } from 'prosemirror-state';
import { EditorView, Decoration, DecorationSet } from 'prosemirror-view';
import { baseKeymap, toggleMark, setBlockType, chainCommands, newlineInCode, createParagraphNear, liftEmptyBlock, splitBlock } from 'prosemirror-commands';
import { history, undo, redo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { splitListItem, sinkListItem, liftListItem } from 'prosemirror-schema-list';
import { EditorView as CodeView, keymap as codeKeymap, drawSelection } from '@codemirror/view';
import { EditorState as CodeState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap } from '@codemirror/commands';
import { vim, getCM, Vim } from '@replit/codemirror-vim';
import { proseVim, vimKey, setVimMode } from '../fraction-notebook/vim.ts';
import { parseMarkdown, serializeMarkdown, richSchema } from './rich-document.ts';
import { mathView } from './math-view.ts';

export type RichProfile = 'composer' | 'comment' | 'transcript';
export interface RichOptions {
  profile: RichProfile; label: string; text?: string; limit?: number;
  onChange?: (text: string) => void; onSelection?: () => void;
  onNavigate?: () => void;
  onSubmit?: () => void; onSave?: () => void;
  minimal?: boolean; onHelp?: () => void;
  plugins?: readonly Plugin[];
}
export interface RichHighlight { from: number; to: number; id: string }
export interface DraftCursor { anchor: number; head: number; source: boolean }

/** One editor state per mounted surface. Profile configuration is shared;
 * source handles, pending Vim keys, history and focus are never global. */
export function mountRichText(host: HTMLElement, options: RichOptions) {
  const readOnly = options.profile === 'transcript', limit = options.limit ?? 32768;
  const root = document.createElement('div'); root.className = `kp-rich kp-rich-${options.profile}`;
  const toolbar = document.createElement('div'); toolbar.className = 'kp-rich-tools';
  toolbar.hidden = options.minimal ?? false;
  const body = document.createElement('div'); body.className = 'kp-rich-body';
  const sourceHost = document.createElement('div'); sourceHost.className = 'kp-rich-source'; sourceHost.hidden = true;
  const status = document.createElement('span'); status.className = 'kp-rich-mode'; status.setAttribute('aria-live', 'off');
  const help = document.createElement('div'); help.className = 'kp-rich-help'; help.hidden = true; help.setAttribute('role', 'note');
  help.textContent = 'i / a / I / A: insert · Esc: normal · h j k l / w b / gg / G: move · v: select · u / Ctrl-r: undo / redo · Cmd/Ctrl-b / i: bold / italic. :w saves; :source switches Markdown. Source uses CodeMirror Vim. Transcript text is read-only; select a passage to comment or tag.';
  const bar = document.createElement('form'); bar.className = 'kp-rich-command'; bar.hidden = true;
  const command = document.createElement('input'); command.setAttribute('aria-label', `${options.label} command`); command.autocomplete = 'off'; bar.append(':', command);
  root.append(toolbar, body, sourceHost, bar, help); host.append(root);
  let source = options.text ?? '', code: CodeView | undefined, disabled = false, disposed = false, adopting = false;
  let highlights: readonly RichHighlight[] = [];
  const replacement = new Plugin({
    // editable:false only disables browser input. Keyboard/plugin transactions
    // must also be fenced to keep the transcript authoritative.
    filterTransaction: transaction => {
      if (!transaction.docChanged || transaction.getMeta(replacement)) return true;
      if (readOnly || disabled) return false;
      if (serializeMarkdown(transaction.doc).length <= limit) return true;
      status.textContent = `Limit: ${limit.toLocaleString()} characters`; return false;
    },
    props: { decorations: state => DecorationSet.create(state.doc, highlights.filter(item => item.from >= 0 && item.to <= state.doc.content.size && item.to > item.from)
      .map(item => Decoration.inline(item.from, item.to, { class: 'kp-chat-highlight', 'data-note-id': item.id }))) }
  });
  const openBelow: Command = (state, dispatch) => {
    const { $head } = state.selection;
    for (let depth = $head.depth; depth > 0; depth--) if ($head.node(depth).isTextblock) {
      const pos = $head.after(depth), paragraph = richSchema.nodes['paragraph']!.create();
      if (!$head.node(depth - 1).canReplaceWith($head.index(depth - 1) + 1, $head.index(depth - 1) + 1, paragraph.type)) return false;
      const transaction = state.tr.insert(pos, paragraph);
      dispatch?.(transaction.setSelection(TextSelection.create(transaction.doc, pos + 1)));
      return true;
    }
    return false;
  };
  const plugins = [replacement, ...(options.plugins ?? []), ...(readOnly ? [] : [history()]), keymap({
    'Mod-Enter': () => { if (!readOnly && !disabled) options.onSubmit?.(); return true; },
    'Mod-b': toggleMark(richSchema.marks['strong']!), 'Mod-i': toggleMark(richSchema.marks['em']!),
    'Mod-z': undo, 'Mod-Shift-z': redo, 'Mod-y': redo
  }), proseVim({ openBelow, readOnly }), keymap({
    Enter: chainCommands(newlineInCode, splitListItem(richSchema.nodes['list_item']!), createParagraphNear, liftEmptyBlock, splitBlock),
    Tab: sinkListItem(richSchema.nodes['list_item']!), 'Shift-Tab': liftListItem(richSchema.nodes['list_item']!)
  }), keymap(baseKeymap)];
  const state = (doc: ProseNode) => EditorState.create({ doc, plugins });
  function restoreNativeSelection(editor: EditorView) {
    const { anchor, head } = editor.state.selection;
    const from = editor.domAtPos(anchor), to = editor.domAtPos(head);
    editor.dom.ownerDocument.getSelection()?.setBaseAndExtent(from.node, from.offset, to.node, to.offset);
  }
  const view = new EditorView(body, {
    state: state(parseMarkdown(source)), editable: () => !readOnly && !disabled,
    attributes: { role: 'textbox', 'aria-label': options.label, 'aria-multiline': 'true', 'aria-readonly': String(readOnly), tabindex: '0', spellcheck: String(!readOnly) },
    handleDOMEvents: { focus: editor => {
      // A read-only DOM can receive focus while the native range still belongs
      // to the composer. Restore it on every focus path, including tab/click.
      if (readOnly) restoreNativeSelection(editor);
      return false;
    }, keydown: (editor, event) => {
      // ProseMirror's normal keydown pipeline is gated on editable. Forward
      // read-only motions through the same plugins, retaining the write fence.
      if (!readOnly || event.isComposing) return false;
      const handled = editor.someProp('handleKeyDown', handler => handler(editor, event));
      if (handled) event.preventDefault(); return Boolean(handled);
    } },
    nodeViews: { math_inline: mathView, math_block: mathView },
    clipboardTextParser: text => new Slice(parseMarkdown(text).content, 0, 0),
    dispatchTransaction(transaction) {
      const next = view.state.applyTransaction(transaction); view.updateState(next.state);
      if (transaction.selectionSet && transaction.scrolledIntoView && !transaction.docChanged) options.onNavigate?.();
      if (!readOnly && transaction.getMeta(replacement) !== 'source' && next.transactions.some(tr => tr.docChanged)) { source = serializeMarkdown(next.state.doc); options.onChange?.(source); }
      status.textContent = `${(vimKey.getState(next.state) ?? 'normal').toUpperCase()}${readOnly ? ' · select to annotate' : ' · :h for keys'}`;
      options.onSelection?.();
    }
  });
  status.textContent = readOnly ? 'NORMAL · select to annotate' : 'NORMAL · i to write · :h for keys';
  const button = (label: string, run: () => void) => {
    const value = document.createElement('button'); value.type = 'button'; value.textContent = label;
    value.onmousedown = event => event.preventDefault(); value.onclick = run; toolbar.append(value); return value;
  };
  const run = (action: Command) => { if (!disabled && !readOnly) action(view.state, view.dispatch, view); view.focus(); };
  if (!readOnly) {
    button('Bold', () => run(toggleMark(richSchema.marks['strong']!)));
    button('Italic', () => run(toggleMark(richSchema.marks['em']!)));
    button('Code', () => run(setBlockType(richSchema.nodes['code_block']!)));
    button('Text', () => run(setBlockType(richSchema.nodes['paragraph']!)));
  }
  const sourceButton = !readOnly ? button('Markdown', toggleSource) : null;
  button('Keys', () => { help.hidden = !help.hidden; }); toolbar.append(status);
  function toggleSource(focusAfter = true) {
    if (readOnly || disabled) return;
    if (code) {
      const next = parseMarkdown(source); code.destroy(); code = undefined;
      body.hidden = false; sourceHost.hidden = true; if (sourceButton) sourceButton.textContent = 'Markdown';
      replaceDocument(next, 'source'); setVimMode('normal')(view.state, view.dispatch); if (focusAfter) view.focus(); status.textContent = 'NORMAL · i to write · :h for keys';
      return;
    }
    body.hidden = true; sourceHost.hidden = false; if (sourceButton) sourceButton.textContent = 'Rich text';
    code = new CodeView({ parent: sourceHost, doc: source, extensions: [vim(), markdown(), drawSelection(),
      codeKeymap.of([{ key: 'Mod-Enter', run: () => { options.onSubmit?.(); return true; } }, ...defaultKeymap]),
      CodeState.transactionFilter.of(transaction => {
        if (transaction.newDoc.length <= limit) return transaction;
        status.textContent = `Limit: ${limit.toLocaleString()} characters`; return [];
      }), CodeView.updateListener.of(update => { if (update.docChanged && !adopting) { source = update.state.doc.toString(); options.onChange?.(source); } }),
      CodeView.contentAttributes.of({ 'aria-label': `${options.label} Markdown` }), CodeView.lineWrapping
    ] });
    const sourceView = code, codeVim = getCM(sourceView);
    const reportMode = () => {
      const current = codeVim?.state.vim;
      sourceView.dom.dataset['vimMode'] = current?.insertMode ? 'insert' : current?.visualMode ? 'visual' : 'normal';
    };
    codeVim?.on('vim-mode-change', reportMode); reportMode();
    status.textContent = 'MARKDOWN · Vim · :h for keys'; if (focusAfter) code.focus();
  }
  const focus = () => {
    if (code) code.focus();
    else {
      // ProseMirror focuses its DOM only when editable. A read-only transcript
      // still owns motions and must regain actual browser focus after a dialog.
      if (readOnly) {
        view.dom.focus({ preventScroll: true });
        // A noneditable DOM does not acquire a native range merely by focus.
        // Restore that range explicitly before ProseMirror synchronizes it.
        restoreNativeSelection(view);
      }
      view.focus();
    }
  };
  function replaceDocument(doc: ProseNode, reason: 'source' | 'remote') {
    const before = view.state.doc, start = before.content.findDiffStart(doc.content);
    if (start === null) return;
    const end = before.content.findDiffEnd(doc.content); if (!end) return;
    let { a, b } = end; const overlap = start - Math.min(a, b); if (overlap > 0) { a += overlap; b += overlap; }
    const transaction = view.state.tr.replace(start, a, doc.slice(start, b)).setMeta(replacement, reason);
    if (reason === 'remote') transaction.setMeta('addToHistory', false);
    view.dispatch(transaction);
  }
  root.addEventListener('keydown', event => {
    if (event.isComposing || event.metaKey || event.ctrlKey || event.altKey || event.target === command) return;
    if (event.key === ':' && (code ? !getCM(code)?.state.vim?.insertMode : vimKey.getState(view.state) !== 'insert')) {
      event.preventDefault(); event.stopPropagation(); bar.hidden = false; command.value = ''; command.focus();
    }
  }, true);
  command.onkeydown = event => { if (event.key === 'Escape') { event.preventDefault(); bar.hidden = true; focus(); } };
  bar.onsubmit = event => {
    event.preventDefault(); const value = command.value.trim(); bar.hidden = true;
    if (value === 'h' || value === 'help') { if (options.onHelp) { options.onHelp(); return; } help.hidden = false; }
    else if (value === 'w' || value === 'write') options.onSave?.();
    else if (value === 'source') toggleSource();
    else status.textContent = `Unknown command: ${value}. Use :h.`;
    focus();
  };
  // Stop a handled editor key from becoming a host/window command elsewhere.
  root.addEventListener('keydown', event => { if (event.defaultPrevented) event.stopPropagation(); });
  return {
    view, root, focus, toggleSource, value: () => source,
    isSource: () => Boolean(code),
    isInsert: () => code ? Boolean(getCM(code)?.state.vim?.insertMode) : vimKey.getState(view.state) === 'insert',
    insert() {
      if (readOnly || disabled) return;
      if (code) { const cm = getCM(code); if (cm && !cm.state.vim?.insertMode) Vim.handleKey(cm, 'i', 'api'); }
      else setVimMode('insert')(view.state, view.dispatch);
      focus();
    },
    cursor(): DraftCursor {
      const selection = code ? code.state.selection.main : view.state.selection;
      return { anchor: selection.anchor, head: selection.head, source: Boolean(code) };
    },
    restoreCursor(cursor: DraftCursor) {
      if (readOnly) return;
      if (cursor.source !== Boolean(code)) toggleSource(false);
      if (code) {
        const clamp = (n: number) => Math.max(0, Math.min(code!.state.doc.length, n));
        code.dispatch({ selection: { anchor: clamp(cursor.anchor), head: clamp(cursor.head) } });
      } else {
        const clamp = (n: number) => view.state.doc.resolve(Math.max(0, Math.min(view.state.doc.content.size, n)));
        view.dispatch(view.state.tr.setSelection(TextSelection.between(clamp(cursor.anchor), clamp(cursor.head))));
      }
    },
    setText(text: string) {
      if (text === source) return;
      source = text; view.updateState(state(parseMarkdown(text)));
      if (code) { adopting = true; try { code.dispatch({ changes: { from: 0, to: code.state.doc.length, insert: text } }); } finally { adopting = false; } }
    },
    setDisabled(value: boolean) { disabled = value; view.setProps({ editable: () => !readOnly && !disabled }); view.dom.setAttribute('aria-disabled', String(value)); },
    normal() { if (code) { const cm = getCM(code); if (cm) Vim.handleKey(cm, '<Esc>', 'api'); } else setVimMode('normal')(view.state, view.dispatch); },
    replaceDocument(doc: ProseNode) {
      replaceDocument(doc, 'remote');
    },
    highlight(values: readonly RichHighlight[]) { highlights = values; view.updateState(view.state); },
    dispose() { if (disposed) return; disposed = true; code?.destroy(); view.destroy(); root.remove(); }
  };
}
export type RichSurface = ReturnType<typeof mountRichText>;
