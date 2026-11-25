import type { Node as ProseNode } from 'prosemirror-model';
import { NodeSelection, Plugin, PluginKey, TextSelection } from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import { CommandRegistry, available, unavailable, target, type TargetedCommand } from '../editor-commands/registry.ts';

type Fold = { id: string; from: number; to: number; message: string; label: string; lines: number };
function blocks(doc: ProseNode): Fold[] {
  const result: Fold[] = [];
  doc.forEach((message, start) => {
    if (message.type.name !== 'chat_message') return;
    let ordinal = 0;
    message.descendants((node, offset) => {
      if (node.type.name !== 'code_block') return;
      const id = String(message.attrs['id']), from = start + 1 + offset;
      // Native messages have stable IDs; code ordinals remain stable while the
      // last block streams. Text hashes would reopen a fold on every delta.
      result.push({ id: JSON.stringify([id, ordinal++]), message: id, from, to: from + node.nodeSize,
        label: message.attrs['role'] === 'tool' ? 'tool output' : `code${node.attrs['params'] ? ' · ' + String(node.attrs['params']) : ''}`,
        lines: node.textContent.split('\n').length });
    });
  });
  return result;
}

/** Folding changes only view preferences, never native history or draft state. */
export function transcriptFolding(host: HTMLElement) {
  const key = new PluginKey('chat-folding');
  let scope = '', closed = new Set<string>(), pendingZ = false;
  type FoldTarget = { scope: string; id: string; mode: 'toggle' | 'open' | 'close' };
  let command: TargetedCommand<FoldTarget> | undefined;
  const save = () => { try { localStorage.setItem(scope, JSON.stringify([...closed].slice(-500))); } catch { /* Optional view preference. */ } };
  function preserve(operation: () => void) {
    const top = host.getBoundingClientRect().top, before = host.scrollTop;
    const atBottom = host.scrollHeight - before - host.clientHeight < 50;
    // A message may span many screens. Anchor a visible block, not its heading.
    const anchor = [...host.querySelectorAll<HTMLElement>('.kp-chat-text p, .kp-chat-text pre, .kp-chat-fold-toggle')]
      .find(node => node.getBoundingClientRect().height > 0 && node.getBoundingClientRect().bottom > top + 1);
    const offset = anchor?.getBoundingClientRect().top ?? top;
    operation();
    if (atBottom) host.scrollTop = host.scrollHeight;
    else if (anchor?.isConnected && anchor.getBoundingClientRect().height) host.scrollTop += anchor.getBoundingClientRect().top - offset;
    else host.scrollTop = before;
  }
  function change(view: EditorView, fold: Fold, collapse: boolean) {
    preserve(() => {
      if (collapse) closed.add(fold.id); else closed.delete(fold.id);
      const transaction = view.state.tr.setMeta(key, true), selection = view.state.selection;
      if (selection.from >= fold.from && selection.to <= fold.to) transaction.setSelection(collapse
        ? NodeSelection.create(view.state.doc, fold.from) : TextSelection.create(view.state.doc, fold.from + 1));
      view.dispatch(transaction); save();
    });
  }
  const plugin = new Plugin({
    key,
    props: {
      decorations(state) {
        const decorations: Decoration[] = [];
        for (const fold of blocks(state.doc)) {
          const collapsed = closed.has(fold.id);
          decorations.push(Decoration.widget(fold.from, view => {
            const button = document.createElement('button'); button.type = 'button'; button.className = 'kp-chat-fold-toggle';
            button.setAttribute('aria-expanded', String(!collapsed));
            button.setAttribute('aria-label', `${collapsed ? 'Expand' : 'Collapse'} ${fold.label}`);
            button.textContent = `${collapsed ? '▸' : '▾'} ${fold.label} · ${fold.lines} ${fold.lines === 1 ? 'line' : 'lines'}`;
            button.onmousedown = event => event.preventDefault();
            button.dataset['commandId'] = 'chat.transcript.fold';
            button.onclick = () => {
              if (command) { void command.forTarget({ scope, id: fold.id, mode: 'toggle' }, { scope: 'chat', element: view.dom }).execute(); return; }
              const current = blocks(view.state.doc).find(block => block.id === fold.id);
              if (current) { change(view, current, !closed.has(fold.id)); view.dom.focus({ preventScroll: true }); }
            };
            return button;
          }, { side: -1, key: fold.id + ':' + collapsed + ':' + fold.label + ':' + fold.lines, stopEvent: () => true }));
          if (collapsed) decorations.push(Decoration.node(fold.from, fold.to, { class: 'kp-chat-folded' }));
        }
        return DecorationSet.create(state.doc, decorations);
      },
      handleKeyDown(view, event) {
        if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) { pendingZ = false; return false; }
        if (event.key === 'z') { pendingZ = true; return true; }
        if (!pendingZ) return false;
        pendingZ = false;
        if (!['a', 'o', 'c'].includes(event.key)) return false;
        const { from, to } = view.state.selection, values = blocks(view.state.doc);
        const fold = values.find(block => from >= block.from && to <= block.to)
          ?? values.find(block => block.from >= from);
        if (fold) {
          if (command) void command.forTarget({ scope, id: fold.id, mode: event.key === 'c' ? 'close' : event.key === 'o' ? 'open' : 'toggle' }, { scope: 'chat', element: view.dom }).execute();
          else change(view, fold, event.key === 'c' || (event.key === 'a' && !closed.has(fold.id)));
        }
        return true;
      },
      handleDOMEvents: { blur: () => { pendingZ = false; return false; } }
    },
    appendTransaction(transactions, _old, state) {
      // Remote replacement maps selections too. Only explicit navigation may
      // open a fold; streaming must never undo the reader's choice.
      const navigation = transactions.find(tr => tr.selectionSet && !tr.docChanged && !tr.getMeta(key));
      if (!navigation || state.selection instanceof NodeSelection) return null;
      const hidden = blocks(state.doc).filter(fold => closed.has(fold.id) && state.selection.to > fold.from && state.selection.from < fold.to);
      if (!hidden.length) return null;
      if (!navigation.scrolledIntoView) return state.tr.setSelection(NodeSelection.create(state.doc, hidden[0]!.from)).setMeta(key, true);
      for (const fold of hidden) closed.delete(fold.id);
      save(); return state.tr.setMeta(key, true);
    }
  });
  return { plugin, attach(view: EditorView, registry: CommandRegistry) {
    command = registry.targeted({ id: 'chat.transcript.fold', title: 'Fold code or tool output', category: 'Chat transcript', scope: 'chat', keys: ['za', 'zo', 'zc'], keywords: ['collapse', 'expand'],
      target: () => {
        const { from, to } = view.state.selection, values = blocks(view.state.doc);
        const fold = values.find(block => from >= block.from && to <= block.to) ?? values.find(block => block.from >= from);
        return fold ? target<FoldTarget>({ scope, id: fold.id, mode: 'toggle' }) : { found: false, reason: 'Choose a message with code or tool output' };
      }, state: (value, origin) => value.scope !== scope ? unavailable('Conversation changed') : origin.element && !host.contains(origin.element) ? unavailable('Use from the transcript')
        : blocks(view.state.doc).some(block => block.id === value.id) ? available(closed.has(value.id)) : unavailable('This block is no longer loaded'),
      run: value => { const fold = blocks(view.state.doc).find(block => block.id === value.id); if (fold) { change(view, fold, value.mode === 'close' || (value.mode === 'toggle' && !closed.has(value.id))); view.dom.focus({ preventScroll: true }); } }
    });
  }, dispose() { command?.dispose(); }, configure(project: string, branch: string) {
    const next = `kp.chat-folds.v1:${project}:${branch}`;
    if (next === scope) return;
    scope = next; closed = new Set(); pendingZ = false;
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(scope) ?? '[]');
      if (Array.isArray(saved)) for (const id of saved.slice(-500)) if (typeof id === 'string' && id.length < 500) closed.add(id);
    } catch { /* A malformed preference cannot prevent reading. */ }
  } };
}
