import { TextSelection } from 'prosemirror-state';
import type { Node as ProseNode } from 'prosemirror-model';
import type { ChatMessage, ChatSnapshot } from './protocol.ts';
import type { PassageTarget } from './annotations.ts';
import { passageTarget, resolvePassage } from './annotation-target.ts';
import { messageDocument, richSchema } from './rich-document.ts';
import { mountRichText, type RichHighlight } from './rich-text.ts';
import { transcriptNavigation } from './transcript-navigation.ts';
import { transcriptFolding } from './folding.ts';

export function mountTranscript(host: HTMLElement, selected: (target: PassageTarget | null) => void, openNote: (id: string) => void, onNavigate: () => void) {
  let snapshot: ChatSnapshot | undefined;
  let cached = new Map<string, { message: ChatMessage; doc: ProseNode; node: ProseNode }>();
  const folding = transcriptFolding(host);
  const surface = mountRichText(host, { profile: 'transcript', label: 'Conversation transcript', minimal: true, onSelection: selectionChanged, onNavigate, plugins: [folding.plugin] });
  const navigation = transcriptNavigation(surface, host, () => snapshot?.branchId, onNavigate);
  function selectionChanged() {
    if (!snapshot?.threadId || surface.view.state.selection.empty) { selected(null); return; }
    const { $from, $to, from, to } = surface.view.state.selection;
    for (let depth = $from.depth; depth > 0; depth--) if ($from.node(depth).type.name === 'chat_message') {
      const node = $from.node(depth), entry = cached.get(String(node.attrs['id']));
      if (!entry || $to.depth < depth || $to.node(depth) !== node) break;
      try { selected(passageTarget(snapshot.threadId, entry.message, from - $from.start(depth), to - $from.start(depth), entry.doc)); return; }
      catch { break; }
    }
    selected(null);
  }
  function resolve(target: PassageTarget) {
    const entry = cached.get(target.messageId);
    return resolvePassage(target, snapshot?.threadId ?? null, entry?.message, entry?.doc);
  }
  function positions() {
    const result = new Map<string, number>();
    surface.view.state.doc.forEach((node, pos) => { if (node.type.name === 'chat_message') result.set(String(node.attrs['id']), pos + 1); });
    return result;
  }
  surface.root.addEventListener('click', event => {
    if (!surface.view.state.selection.empty || !(event.target instanceof Element)) return;
    const mark = event.target.closest<HTMLElement>('[data-note-id]');
    if (mark?.dataset['noteId']) openNote(mark.dataset['noteId']);
  });
  return {
    surface, resolve, ...navigation,
    update(value: ChatSnapshot, following = false) {
      const before = navigation.capture(), sameBranch = snapshot?.branchId === value.branchId;
      let changed = !sameBranch || cached.size !== value.messages.length;
      snapshot = value;
      folding.configure(value.project, value.branchId);
      const next = new Map<string, { message: ChatMessage; doc: ProseNode; node: ProseNode }>();
      const nodes = value.messages.map(message => {
        const previous = cached.get(message.id);
        if (previous && previous.message.text === message.text && previous.message.complete === message.complete
          && previous.message.clipped === message.clipped && previous.message.role === message.role
          && (message.role !== 'tool' || (previous.message.role === 'tool' && previous.message.tool === message.tool))) {
          next.set(message.id, previous); return previous.node;
        }
        changed = true;
        const doc = previous?.message.text === message.text && previous.message.role === message.role ? previous.doc : messageDocument(message);
        const speaker = message.role === 'user' ? 'You' : message.role === 'tool' ? 'Tool · ' + message.tool : 'Codex';
        const node = richSchema.nodes['chat_message']!.create({ id: message.id, role: message.role, speaker, complete: message.complete, clipped: message.clipped }, doc.content);
        next.set(message.id, { message, doc, node }); return node;
      });
      cached = next;
      surface.replaceDocument(richSchema.node('doc', null, nodes.length ? nodes : [richSchema.node('paragraph')]));
      const offsets = positions(), marks: RichHighlight[] = [];
      for (const note of value.annotations) {
        if (note.archived || note.target.kind !== 'passage') continue;
        const offset = offsets.get(note.target.messageId), range = resolve(note.target);
        if (offset !== undefined && range.status === 'attached') marks.push({ from: offset + range.from, to: offset + range.to, id: note.id });
      }
      surface.highlight(marks); selectionChanged();
      // Draft acknowledgements and mode changes must not move an unchanged transcript.
      if (following && changed) host.scrollTop = host.scrollHeight;
      else if (sameBranch) navigation.restoreScroll(before.scroll);
    },
    reveal(target: PassageTarget) {
      const range = resolve(target), offset = positions().get(target.messageId);
      if (range.status !== 'attached' || offset === undefined) return false;
      surface.view.dispatch(surface.view.state.tr.setSelection(TextSelection.create(surface.view.state.doc, offset + range.from, offset + range.to)).scrollIntoView());
      surface.focus(); return true;
    },
    dispose() { surface.dispose(); cached.clear(); }
  };
}
