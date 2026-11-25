import type { VimEntry, VimMode } from './vim-reference.ts';

export const surfaces = {
  notebook: 'Notebook prose', composer: 'Chat composer', note: 'Note editor', json: 'Animation JSON',
  markdown: 'Chat / note Markdown', transcript: 'Chat transcript', picker: 'Picker query', input: 'Ordinary text field'
} as const;
export type VimSurface = keyof typeof surfaces;
export const statuses = {
  implemented: { mark: '[x]', label: 'Implemented' }, missing: { mark: '[ ]', label: 'Missing' },
  partial: { mark: '[~]', label: 'Partial' }, overridden: { mark: '[↪]', label: 'Overridden' },
  unverified: { mark: '[?]', label: 'Unverified' }, 'not-applicable': { mark: '[—]', label: 'Not applicable' }
} as const;
export type SupportStatus = keyof typeof statuses;
export interface Support { status: SupportStatus; note: string; evidence: readonly string[] }
const proseSource = 'src/fraction-notebook/vim.ts';
const chatSource = 'src/editor-chat/panel.ts';
const source = (status: SupportStatus, note: string, ...evidence: string[]): Support => ({ status, note, evidence });
const prose = (status: SupportStatus, note: string) => source(status, note, proseSource);
const chat = (status: SupportStatus, note: string) => source(status, note, chatSource);
const custom = (tag: string, keys: string, description: string, mode: VimMode = 'normal'): VimEntry => ({
  id: `workspace:${tag}`, tag, keys, description, mode, group: 'KP extensions', line: 0, changes: false, moves: false, origin: 'workspace', examples: []
});
export const workspaceBindings: readonly VimEntry[] = [
  custom('commands', 'Alt-x / Ctrl-x Ctrl-x', 'Search workspace commands'),
  custom('coverage', 'M-x Vim binding coverage', 'Inspect this checklist without running a binding'),
  custom('escape', 'Escape', 'Return to Normal mode or dismiss the current prompt'),
  custom('pane', 'Ctrl-`', 'Switch between the KP and chat panes'),
  custom('chat-menu', 'Ctrl-c', 'Open the chat command transient'),
  custom('message', '[m / ]m', 'Navigate conversation messages'),
  custom('submit', 'Ctrl/⌘-Enter', 'Send a message, save a note, or close the animation source'),
  custom('run', 'Shift-Enter / :run', 'Run the current animation source'),
  custom('source', ':source', 'Toggle the rich editor’s Markdown source', 'ex'),
  custom('number', ':set number / nonumber / relativenumber', 'Control notebook and animation-source line numbers', 'ex'),
  custom('transcript-ex', ':notes / :topics / :where', 'Open chat notes, topics or orientation', 'ex')
];
const isChat = (surface: VimSurface) => ['composer', 'note', 'markdown', 'transcript'].includes(surface);

/** Support is a reference claim, never a query against live editor state.
 * Unknown library behavior stays unknown; host capture takes precedence. */
export function bindingSupport(entry: VimEntry, surface: VimSurface, platform: 'mac' | 'other' = 'other'): Support {
  const { tag, mode, group } = entry;
  const code = surface === 'json' || surface === 'markdown';
  const notebook = surface === 'notebook' || surface === 'json';
  const chatSurface = isChat(surface);
  if (entry.origin === 'workspace') {
    const yes = (note: string, path: string) => source('implemented', note, path);
    const no = (note: string) => source('not-applicable', note, 'src/fraction-notebook/app.ts');
    switch (tag) {
      case 'commands': case 'coverage': return yes('Workspace entrypoint. Other modal dialogs retain their own keys; close one before opening another.', 'src/fraction-notebook/command-picker.ts');
      case 'pane': return yes('Switches the existing fixed panes; it does not implement Vim windows.', 'src/fraction-notebook/windows.ts');
      case 'escape': return surface === 'input' ? source('partial', 'Only fields with an explicit dismissal handler react to Escape.', 'src/fraction-notebook/inline-view.ts')
        : yes(surface === 'picker' ? 'Cancels the picker and restores its originating editor.' : chatSurface ? 'Returns to Normal mode or transcript reading, depending on the surface.' : 'Returns to Normal mode.', code ? 'src/fraction-notebook/editor.ts' : proseSource);
      case 'chat-menu': return chatSurface ? yes('Opens the chat transient; overrides Vim’s Ctrl-c.', chatSource) : no('Only the chat pane owns this transient.');
      case 'message': return surface === 'transcript' ? yes('Moves by conversation message, not by code method.', chatSource) : no('Requires the transcript.');
      case 'submit': return surface === 'json' ? yes('Closes source while retaining its draft.', 'src/fraction-notebook/editor.ts')
        : ['composer', 'note', 'markdown'].includes(surface) ? yes('Composer sends; note editor saves. Availability still depends on connection and draft state.', 'src/editor-chat/rich-text.ts') : no('Requires a composer, note or animation source.');
      case 'run': return notebook ? yes('Validates the animation draft and updates its result; prose uses :run.', 'src/fraction-notebook/commands.ts') : no('Requires the notebook or its animation source.');
      case 'source': return ['composer', 'note', 'markdown', 'transcript'].includes(surface) ? yes('Switches to/from Markdown; from the transcript it opens the composer source.', 'src/editor-chat/chat-commands.ts') : no('This alias belongs to chat and note editors.');
      case 'number': return notebook ? yes('These three settings are supported; arbitrary :set options are not.', 'src/fraction-notebook/commands.ts') : no('Only notebook and animation-source gutters use these settings.');
      case 'transcript-ex': return surface === 'transcript' ? yes('The transcript Ex prompt exposes these workspace commands.', 'src/editor-chat/chat-commands.ts') : no('These aliases belong to the transcript Ex prompt.');
      default: return source('unverified', 'No coverage annotation exists for this extension.', 'src/editor-commands/vim-coverage.ts');
    }
  }
  if (mode === 'terminal') return source('not-applicable', 'These panes are editors, not a Vim terminal job.', 'src/fraction-notebook/app.ts');
  if (entry.keys.startsWith('CTRL-X') || ['CTRL-X', 'i_CTRL-X', 'v_CTRL-X'].includes(tag))
    return source('overridden', 'Ctrl-x begins the workspace Ctrl-x Ctrl-x command prefix; this Vim form is intercepted.', 'src/fraction-notebook/command-picker.ts');
  if (chatSurface && /^(?:i_|v_|c_)?CTRL-C$/.test(tag)) return chat('overridden', 'Ctrl-c opens the chat command transient.');
  if (surface === 'input') return source('not-applicable', 'This is an ordinary browser field, without a Vim mode. Native editing shortcuts may still work.', 'src/fraction-notebook/inline-view.ts');
  if (group === 'Windows') return source('not-applicable', 'KP manages its panes separately; Vim’s window tree is not present.', 'src/fraction-notebook/windows.ts');
  if (surface === 'transcript' && mode === 'normal' && ['i', 'a', 'I', 'A'].includes(tag)) return chat('overridden', 'Focuses the persistent composer in Insert mode.');
  if (surface === 'transcript' && (entry.changes || mode === 'insert' || ['u', 'CTRL-R', 'v_d', 'v_x', 'v_c'].includes(tag)))
    return chat('not-applicable', 'The Codex transcript is read-only. Editing and undo cannot change conversation history.');
  if (mode === 'ex') {
    if (surface === 'picker') return source('not-applicable', 'The picker has no Ex prompt.', 'src/fraction-notebook/picker-query.ts');
    if (tag === ':help') return source('overridden', 'Only :h and :help open KP keybindings; Vim help topics and abbreviation rules are not implemented.', notebook ? 'src/fraction-notebook/commands.ts' : 'src/editor-chat/rich-text.ts');
    if (tag === ':write') return source('overridden', surface === 'transcript' ? 'Only :w saves the chat draft here; :write and Vim filename/range forms are not accepted.' : 'Only :w and :write save the local notebook, chat draft or note; there is no Vim filename/range writer.', notebook ? 'src/fraction-notebook/commands.ts' : 'src/editor-chat/rich-text.ts');
    if (notebook && [':quit', ':wq'].includes(tag)) return source('overridden', 'Workspace save/close semantics retain the draft. File, bang and range variants are not implemented.', 'src/fraction-notebook/commands.ts');
    if (notebook && tag === ':set') return source('partial', 'Only number, nonumber and relativenumber are accepted.', 'src/fraction-notebook/commands.ts');
    return source('missing', code ? 'The host captures : before CodeMirror; this Ex command is not in the workspace allowlist.' : 'This Ex command is not registered for this surface.', notebook ? 'src/fraction-notebook/commands.ts' : 'src/editor-chat/rich-text.ts');
  }
  if (mode === 'command-line') return source('unverified', 'The Ex/search prompt is a browser field. Native shortcuts may overlap; Vim command-line behavior has not been verified.', notebook ? 'src/fraction-notebook/commands.ts' : 'src/editor-chat/chat-commands.ts');
  if (code) {
    if (tag === 'i_<Esc>' || (mode === 'normal' && tag === 'i'))
      return source('implemented', 'CodeMirror Vim mode entry/exit is exercised in KP source-buffer browser checks. Counts are tracked separately.', notebook ? 'tests/fraction-notebook.browser.spec.ts' : 'tests/fraction-notebook-chat.browser.spec.ts', notebook ? 'src/fraction-notebook/editor.ts' : 'src/editor-chat/rich-text.ts');
    if (tag === ':') return source('overridden', 'Opens the host’s restricted Ex prompt, not the CodeMirror Ex command set.', notebook ? 'src/fraction-notebook/commands.ts' : 'src/editor-chat/rich-text.ts');
    return source('unverified', 'CodeMirror Vim 6.4.0 owns this surface. This form has not been individually verified in KP; library presence is not a support claim.', 'node_modules/@replit/codemirror-vim/package.json');
  }
  if (surface === 'picker') {
    if (['CTRL-H', 'i_CTRL-H', 'v_CTRL-H'].includes(tag)) return source('partial', 'The Vim coverage finder captures Ctrl-h for tag filters. Fruit and M-x queries have not adopted this transient; this is not a shared Vim Backspace implementation.', 'src/fraction-notebook/vim-coverage-content.ts');
    if (['j', 'k', 'CTRL-N', 'CTRL-P', 'i_CTRL-N', 'i_CTRL-P', '<Down>', '<Up>', 'i_<Down>', 'i_<Up>'].includes(tag))
      return source('overridden', 'Moves between suggestions instead of moving through query text.', 'src/fraction-notebook/command-picker.ts');
    if (['i_<Esc>', 'v_<Esc>'].includes(tag)) return source('overridden', 'Escape closes the picker. Use Ctrl-[ for Normal mode.', 'src/fraction-notebook/command-picker.ts');
    if (tag === 'i_CTRL-[') return source('implemented', 'Enters Normal mode while retaining the query.', 'src/fraction-notebook/command-picker.ts');
    if (tag === 'o') return source('not-applicable', 'A query contains one line; opening a line below is intentionally disabled.', 'src/fraction-notebook/picker-query.ts');
    if (['<CR>', 'i_<CR>'].includes(tag)) return source('overridden', 'Enter accepts the selected result.', 'src/fraction-notebook/command-picker.ts');
    if (['CTRL-D', 'CTRL-U'].includes(tag)) return source('partial', 'In the command picker’s Normal mode, moves five suggestions. The fruit picker has no page motion.', 'src/fraction-notebook/command-picker.ts');
    if (tag === ':') return source('not-applicable', 'The picker has no Ex prompt.', 'src/fraction-notebook/picker-query.ts');
  }
  if (surface === 'transcript' && mode === 'normal') {
    if (['i', 'a', 'I', 'A'].includes(tag)) return chat('overridden', 'Focuses the persistent composer in Insert mode.');
    if (['[m', ']m'].includes(tag)) return chat('overridden', 'Moves between messages, not method boundaries.');
    if (['/', 'n', 'N', '{', '}', 'CTRL-D', 'CTRL-U'].includes(tag)) return chat('partial', 'Navigation/search operates on the loaded transcript only. Vim counts, regex semantics and scroll options are not implemented.');
    if (['za', 'zo', 'zc'].includes(tag)) return source('partial', 'Folds a code or tool block at/after the cursor. Recursive/manual Vim fold models and counts are not implemented.', 'src/editor-chat/folding.ts');
  }
  if (platform === 'other' && ['CTRL-B', 'CTRL-I', 'i_CTRL-B', 'i_CTRL-I', 'v_CTRL-B', 'v_CTRL-I'].includes(tag) && surface !== 'picker')
    return source('overridden', 'On Windows/Linux Ctrl-b/Ctrl-i apply rich-text formatting. macOS uses Command for these shortcuts.', 'src/fraction-notebook/editor.ts', 'src/editor-chat/rich-text.ts');
  if (mode === 'normal') {
    if (['i', 'a', 'v', 'u', 'CTRL-R'].includes(tag)) return prose('implemented', 'The basic action is present. Counts/register variants have separate coverage entries.');
    if (['w', 'b'].includes(tag)) return prose('partial', 'Whitespace-based movement within the current text block; Vim punctuation rules, counts and operator composition are absent.');
    if (['h', 'l', 'x'].includes(tag)) return prose('partial', 'Moves/deletes one document position. Full Unicode grapheme, count and register semantics are not implemented.');
    if (['j', 'k'].includes(tag)) return prose('partial', 'Moves using rendered line geometry; desired-column and counted/logical-line semantics are absent.');
    if (['0', '$', 'I', 'A'].includes(tag)) return prose('partial', 'Uses the enclosing text-block boundary, not Vim’s logical-line/first-nonblank rules.');
    if (['gg', 'G'].includes(tag)) return prose('partial', 'Moves to document start/end. Counted line addresses are not implemented.');
    if (tag === 'o') return prose('partial', 'Adds a content block/list item/paragraph according to the editor schema, rather than a plain-text line.');
    if (tag === 'd') return prose('missing', 'Normal-mode d has no operator-pending state. Only Visual-mode d deletes a selection.');
    if (tag === ':') return source('overridden', 'Opens the restricted workspace Ex prompt.', notebook ? 'src/fraction-notebook/commands.ts' : 'src/editor-chat/rich-text.ts');
  }
  if (mode === 'visual' && ['v_d', 'v_x'].includes(tag)) return prose('partial', 'Deletes the current characterwise selection and returns to Normal mode; no Vim register is filled.');
  if (['i_<Esc>', 'v_<Esc>'].includes(tag)) return prose('implemented', 'Returns the rich editor to Normal mode. Chat host return behavior may also focus the transcript.');
  if (tag === 'v_v') return prose('implemented', 'Toggles characterwise Visual mode.');
  if (mode === 'insert' && ['i_<CR>', 'i_<BS>', 'i_<Del>'].includes(tag)) return source('partial', 'Native ProseMirror editing obeys the schema and custom-object boundaries; it is not a full Vim Insert-mode implementation.', 'src/fraction-notebook/editor.ts', 'src/editor-chat/rich-text.ts');
  return prose('missing', 'No Vim implementation of this form is present in this surface. A browser shortcut may have a separate native effect.');
}

export function detectVimSurface(element: Element | null | undefined, scope: string): VimSurface {
  if (element?.closest('.kp-picker-query')) return 'picker';
  if (element?.matches('input,textarea,select')) return 'input';
  if (element?.closest('.cm-editor')) return element.closest('.kp-rich') ? 'markdown' : 'json';
  if (element?.closest('.kp-rich-transcript')) return 'transcript';
  if (element?.closest('.kp-rich-comment')) return 'note';
  if (element?.closest('.kp-rich-composer')) return 'composer';
  return scope === 'chat' ? 'transcript' : 'notebook';
}
export function searchBindings(entries: readonly VimEntry[], query: string): VimEntry[] {
  const aliases: Readonly<Record<string, string>> = { q: 'macro macros recording', '@': 'macro macros playback', '@@': 'macro macros repeat',
    count: 'counts counted motion operator composition', quote: 'register registers clipboard', '.': 'dot repeat last change', '%': 'matching bracket delimiter' };
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return entries.filter(entry => {
    const haystack = `${entry.keys} ${entry.tag} ${entry.description} ${entry.group} ${entry.mode} ${entry.examples.join(' ')} ${aliases[entry.tag] ?? ''}`.toLowerCase();
    return terms.every(term => haystack.includes(term));
  });
}
