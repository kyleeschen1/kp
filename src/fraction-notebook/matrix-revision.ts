import type { EditorView } from 'prosemirror-view';
import { closeHistory } from 'prosemirror-history';
import { CommandRegistry, available, unavailable } from '../editor-commands/registry.ts';
import { uuid, type UUID } from '../notebook/model.ts';
import { createContextualRevisionSession, type ContextualRevisionRequest } from '../editor-chat/contextual-revision.ts';
import { readRevisionResponse, revisionPrompt, type RevisionChatPort } from './contextual-revision.ts';
import { matrixRevisionSnapshot, revisedMatrixNote } from './matrix-revision-data.ts';
import { selectedObject } from './inspector.ts';
import type { FractionNotebook } from './model.ts';
import './revision.css';

export function mountMatrixRevision(host: HTMLElement, registry: CommandRegistry, options: {
  view: EditorView; chat: RevisionChatPort; notebook(): FractionNotebook;
  preview(notebook: FractionNotebook): void; restore(): void;
}) {
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, text = '') => { const node = document.createElement(tag); node.textContent = text; return node; };
  const panel = el('aside'); panel.className = 'fn-side-panel fn-contextual-revision'; panel.hidden = true; panel.setAttribute('aria-label', 'Revise matrix explanation');
  const title = el('h2', 'Revise matrix explanation'), notice = el('p'); notice.setAttribute('role', 'status');
  const instruction = el('textarea'); instruction.setAttribute('aria-label', 'Requested matrix note change'); instruction.maxLength = 4096;
  const prepare = el('button', 'Prepare request in chat'), messages = el('select'); messages.setAttribute('aria-label', 'Completed model response');
  const preview = el('button', 'Preview proposal'), accept = el('button', 'Accept note'), reject = el('button', 'Reject proposal'), close = el('button', 'Close');
  const comparison = el('section'); comparison.setAttribute('aria-label', 'Matrix note comparison'); comparison.hidden = true;
  const before = el('p'), after = el('p'); before.dataset['revisionBefore'] = ''; after.dataset['revisionAfter'] = '';
  comparison.append(el('h3', 'Current'), before, el('h3', 'Proposed'), after);
  panel.append(title, close, notice, instruction, prepare, messages, preview, comparison, accept, reject); host.append(panel);
  let resource: UUID | undefined, owner: ReturnType<typeof createContextualRevisionSession> | undefined;
  let request: ContextualRevisionRequest | undefined, candidate: FractionNotebook | undefined, disposed = false;
  const current = () => {
    const chat = options.chat.snapshot();
    if (!resource || !chat?.threadId || !owner) throw new Error('Connect the intended chat before preparing this note.');
    return matrixRevisionSnapshot(options.notebook(), resource, chat.branchId, chat.threadId);
  };
  const buttons = () => { preview.disabled = !request || !!candidate; accept.disabled = !candidate; reject.disabled = !request; };
  const clear = () => { owner?.cancel(); request = undefined; candidate = undefined; comparison.hidden = true; options.restore(); buttons(); };
  const guard = (work: () => void) => { try { work(); } catch (error) { clear(); notice.textContent = String(error); } };
  const renderMessages = () => {
    const selected = messages.value; messages.replaceChildren(el('option', 'Choose a completed response')); messages.options[0]!.value = '';
    const chat = options.chat.snapshot();
    if (request && chat && (chat.branchId !== request.branchId || chat.threadId !== request.threadId)) { clear(); notice.textContent = 'Conversation changed. Prepare a new request in the intended thread.'; }
    for (const message of chat?.messages ?? []) if (message.role === 'assistant' && message.complete) {
      const option = el('option', message.text.replace(/\s+/g, ' ').slice(0, 70)); option.value = message.id; messages.append(option);
    }
    if ([...messages.options].some(o => o.value === selected)) messages.value = selected;
  };
  prepare.onclick = () => guard(() => {
    clear();
    if (options.chat.snapshot()?.phase !== 'ready') throw new Error('Connect chat and finish its current turn first.');
    request = owner!.begin(current(), instruction.value);
    options.chat.open(); options.chat.stageDraft(revisionPrompt(request, 'matrix explanation note'), { branchId: request.branchId, threadId: request.threadId });
    notice.textContent = 'Request staged in chat; send it explicitly, then preview the completed response here.'; buttons();
  });
  preview.onclick = () => guard(() => {
    const message = options.chat.snapshot()?.messages.find(m => m.id === messages.value);
    if (!message || message.role !== 'assistant' || !message.complete || message.clipped) throw new Error('Choose a complete assistant response.');
    const change = owner!.receive(readRevisionResponse(message.text), current());
    candidate = revisedMatrixNote(options.notebook(), resource!, change);
    before.textContent = `${change.before.title}\n${change.before.content}`; after.textContent = `${change.after.title}\n${change.after.content}`;
    comparison.hidden = false; options.preview(candidate); buttons(); notice.textContent = 'Preview only. Accept makes one undoable note edit; source mathematics is unchanged.';
  });
  accept.onclick = () => guard(() => {
    const checked = owner!.review(current()), next = revisedMatrixNote(options.notebook(), resource!, checked);
    owner!.accept(current());
    options.view.dispatch(closeHistory(options.view.state.tr).setNodeAttribute(0, 'notes', next.matrixNotes));
    options.view.dispatch(closeHistory(options.view.state.tr));
    clear(); panel.hidden = true; options.view.focus();
  });
  reject.onclick = () => { clear(); notice.textContent = 'Proposal rejected; original note retained.'; };
  close.onclick = () => { clear(); panel.hidden = true; options.view.focus(); };
  const command = registry.add({ id: 'matrix.revise-note', title: 'Revise matrix explanation in chat', category: 'Mathematics', scope: 'notebook',
    keywords: ['annotation', 'reasoning', 'LLM', 'context'],
    state: () => selectedObject(options.view.state)?.node.type.name === 'matrixObject' ? available() : unavailable('Select a matrix object'),
    run() {
      clear(); owner?.dispose(); const selected = selectedObject(options.view.state);
      if (selected?.node.type.name !== 'matrixObject') throw new Error('Select a matrix object.');
      resource = uuid(selected.node.attrs['resource']); owner = createContextualRevisionSession(crypto.randomUUID(), { kind: 'matrix-note', resource });
      panel.hidden = false; notice.textContent = 'Describe how the selected explanation should improve.'; renderMessages(); instruction.focus();
    } });
  const unsubscribe = options.chat.subscribe(renderMessages); buttons();
  return { dispose() { if (disposed) return; disposed = true; unsubscribe(); command.dispose(); owner?.dispose(); panel.remove(); } };
}
