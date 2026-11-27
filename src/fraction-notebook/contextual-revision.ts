import type { EditorView } from 'prosemirror-view';
import type { EditorState } from 'prosemirror-state';
import { closeHistory } from 'prosemirror-history';
import { CommandRegistry } from '../editor-commands/registry.ts';
import { sha256 } from '../kernel/sha256.ts';
import { createContextualRevisionSession, contextualRevisionProtocol, type AnnotationRevisionChange,
  type ContextualRevisionRequest, type ContextualRevisionSnapshot } from '../editor-chat/contextual-revision.ts';
import { draftLimit, type ChatSnapshot } from '../editor-chat/protocol.ts';
import { readNotebook, readSteps, type FractionNotebook, type Step } from './model.ts';
import { schema } from './schema.ts';
import type { ObjectDescriptor } from './object-protocol.ts';
import type { CompiledFractionRevision } from './revision-transport.ts';
export type { CompiledFractionRevision } from './revision-transport.ts';

export type RevisionChatSnapshot = Readonly<Pick<ChatSnapshot, 'branchId' | 'threadId' | 'phase' | 'messages'>>;
export interface RevisionChatPort {
  open(): void;
  snapshot(): RevisionChatSnapshot | undefined;
  stageDraft(text: string, expected: { branchId: string; threadId: string }): void;
  subscribe(listener: (snapshot: RevisionChatSnapshot) => void): () => void;
}
export interface NotebookRevisionHost {
  readonly view: EditorView;
  readonly chat: RevisionChatPort;
  getNotebook(): FractionNotebook;
  describe(signal: AbortSignal): Promise<ObjectDescriptor>;
  compile(candidate: FractionNotebook, signal: AbortSignal): Promise<CompiledFractionRevision>;
  preview(value: CompiledFractionRevision, beatId: string): void;
  restorePreview(): void;
  selectedBeat?(): string | undefined;
  accepted?(value: CompiledFractionRevision): void;
}

/** Reconstruct only the selected annotation; first-step content belongs to its
 * caption slot. Canonical beat identity/order and all other source remain owned
 * by the existing compiler and notebook, never by a model-provided JSON path. */
export function revisedAnnotationNotebook(notebook: FractionNotebook, beats: readonly (Step & { readonly id: string })[], change: AnnotationRevisionChange): FractionNotebook {
  if (sha256(JSON.stringify(notebook)) !== change.request.draftRevision) throw new Error('The notebook changed; request a revision against the current draft.');
  const index = beats.findIndex(beat => beat.id === change.before.id);
  const story = notebook.cells.find(cell => cell.type === 'story');
  if (index < 0 || !story || change.after.id !== change.before.id) throw new Error('The selected annotation is unavailable.');
  const steps = readSteps(story.source, beats.length, story.caption.text), before = steps[index]!;
  if (JSON.stringify({ id: change.before.id, ...before }) !== JSON.stringify(change.before)) throw new Error('The selected annotation changed.');
  const next = steps.map((step, at) => at === index ? change.after : step);
  const source = JSON.stringify({ steps: next.map(({ title, content, focusRefs }, at) => at === 0 ? { title, focusRefs } : { title, content, focusRefs }) }, null, 2);
  return readNotebook({ ...notebook, revision: notebook.revision + 1, cells: notebook.cells.map(cell => cell.id !== story.id ? cell : {
    ...story, source, caption: index === 0 ? { ...story.caption, text: change.after.content } : story.caption
  }) });
}

export function annotationRevisionTransaction(state: EditorState, candidate: FractionNotebook) {
  const story = candidate.cells.find(cell => cell.type === 'story');
  if (!story) throw new Error('The candidate has no fraction annotation.');
  let found: { pos: number; captionSize: number; sourceSize: number } | undefined;
  state.doc.descendants((node, pos) => {
    if (node.type.name === 'story' && node.attrs['id'] === story.id)
      found = { pos, captionSize: node.child(0).nodeSize, sourceSize: node.child(1).nodeSize };
  });
  if (!found) throw new Error('The selected animation is no longer in this editor.');
  const { pos, captionSize, sourceSize } = found;
  const sourcePos = pos + 1 + captionSize, captionPos = pos + 1;
  // Higher range first keeps the lower caption address stable. Native node IDs
  // and the shared editor history survive the two text replacements together.
  return closeHistory(state.tr)
    .replaceWith(sourcePos + 1, sourcePos + sourceSize - 1, story.source ? schema.text(story.source) : [])
    .replaceWith(captionPos + 1, captionPos + captionSize - 1, story.caption.text ? schema.text(story.caption.text) : []);
}

export function revisionPrompt(request: ContextualRevisionRequest): string {
  const response = { protocol: contextualRevisionProtocol, sessionId: request.sessionId, request: request.request,
    objectId: request.objectId, sourceRevision: request.sourceRevision, draftRevision: request.draftRevision,
    annotationId: request.annotation.id, title: 'Replacement title', content: 'Replacement plain-language content',
    focusRefs: request.annotation.focusRefs };
  const prompt = 'Revise only the selected fraction annotation described below. Preserve the mathematics, moment identity, and reasoning. '
    + 'Use literal plain-language wording; do not add HTML, Markdown formatting, equations, timing, or new fields. '
    + 'Choose at least one focusRefs entry from availableTargets. Return only one JSON object matching the response shape. '
    + 'This is a proposal for the author to review, not permission to edit a file.\n\nContext:\n'
    + JSON.stringify(request) + '\n\nResponse shape (replace title/content as needed):\n' + JSON.stringify(response);
  if (prompt.length > draftLimit) throw new Error('The revision prompt exceeds the chat composer limit. Choose a shorter annotation or context.');
  return prompt;
}

export function readRevisionResponse(text: string): unknown {
  // Accept an entire JSON response or one ordinary JSON fence. Do not guess at
  // an object embedded in prose, tool output or executable JavaScript.
  const clean = text.trim(), fenced = /^```(?:json)?\s*\n([\s\S]*)\n```$/.exec(clean);
  return JSON.parse(fenced?.[1] ?? clean);
}

export function mountContextualRevision(host: HTMLElement, registry: CommandRegistry, options: NotebookRevisionHost) {
  const doc = host.ownerDocument;
  const element = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) => {
    const node = doc.createElement(tag); if (text !== undefined) node.textContent = text; return node;
  };
  const panel = element('aside'); panel.className = 'fn-side-panel fn-contextual-revision'; panel.hidden = true; panel.inert = true;
  panel.setAttribute('aria-label', 'Revise annotation');
  const title = element('h2', 'Revise annotation'), close = element('button', 'Close');
  const notice = element('p', 'Choose a moment, then describe the change.'); notice.setAttribute('role', 'status');
  const moment = element('select'); moment.setAttribute('aria-label', 'Annotation moment');
  const instruction = element('textarea'); instruction.setAttribute('aria-label', 'Requested annotation change'); instruction.rows = 3;
  instruction.maxLength = 4096;
  const stage = element('button', 'Prepare request in chat');
  const messages = element('select'); messages.setAttribute('aria-label', 'Completed model response');
  const pasted = element('textarea'); pasted.setAttribute('aria-label', 'Paste annotation proposal JSON'); pasted.rows = 4; pasted.maxLength = 65536;
  const manual = element('details'), manualTitle = element('summary', 'Paste a proposal instead'); manual.append(manualTitle, pasted);
  const preview = element('button', 'Preview proposal'), accept = element('button', 'Accept annotation'), reject = element('button', 'Reject proposal');
  const comparison = element('section'); comparison.hidden = true; comparison.setAttribute('aria-label', 'Annotation comparison');
  const before = element('p'), after = element('p'); before.dataset['revisionBefore'] = ''; after.dataset['revisionAfter'] = '';
  comparison.append(element('h3', 'Current'), before, element('h3', 'Proposed'), after);
  const field = (text: string, control: HTMLElement) => { const label = element('label', text); label.append(control); return label; };
  panel.append(title, close, notice, field('Moment', moment), field('What should improve?', instruction), stage,
    field('Response to inspect', messages), manual, preview, comparison, accept, reject);
  host.append(panel);
  const owner = createContextualRevisionSession(crypto.randomUUID());
  let generation = 0, controller: AbortController | undefined, disposed = false, ownApplying = false, previewing = false, busy = false;
  let checked: CompiledFractionRevision | undefined, descriptor: ObjectDescriptor | undefined;
  let request: ContextualRevisionRequest | undefined, candidate: CompiledFractionRevision | undefined;
  let returnFocus: HTMLElement | null = null;
  const buttons = () => { stage.disabled = busy || !checked; preview.disabled = busy || !request || !!candidate; accept.disabled = busy || !candidate; reject.disabled = !request; };
  const invalidate = (message?: string) => {
    ++generation; controller?.abort(); controller = undefined; owner.cancel(); request = undefined; candidate = undefined; busy = false;
    if (previewing) { previewing = false; options.restorePreview(); }
    comparison.hidden = true; if (message) notice.textContent = message; buttons();
  };
  const fail = (error: unknown) => { notice.textContent = error instanceof Error ? error.message : String(error); buttons(); };
  const chat = () => {
    const current = options.chat.snapshot();
    if (!current?.threadId || current.phase !== 'ready') throw new Error('Open chat, connect a session, and finish the current response first.');
    return { branchId: current.branchId, threadId: current.threadId };
  };
  const context = (basis: ObjectDescriptor): ContextualRevisionSnapshot => {
    if (!checked) throw new Error('Open this annotation again to load its checked moments.');
    const notebook = options.getNotebook(), story = notebook.cells.find(cell => cell.type === 'story');
    const index = checked.beats.findIndex(beat => beat.id === moment.value);
    if (!story || index < 0) throw new Error('Choose an existing fraction moment.');
    const steps = readSteps(story.source, checked.beats.length, story.caption.text);
    return { objectId: basis.id, objectTitle: basis.title, sourceRevision: basis.revision, draftSource: JSON.stringify(notebook), ...chat(),
      annotation: { id: checked.beats[index]!.id, ...steps[index]! }, availableTargets: checked.beats[index]!.focusRefs,
      surroundingContext: steps.slice(Math.max(0, index - 1), index + 2).map(step => `${step.title}: ${step.content}`).join('\n').slice(0, 4096) };
  };
  const renderMessages = (snapshot = options.chat.snapshot()) => {
    const selected = messages.value; messages.replaceChildren();
    messages.append(element('option', 'Choose a completed response'));
    messages.options[0]!.value = '';
    for (const message of snapshot?.messages ?? []) {
      if (message.role !== 'assistant' || !message.complete || message.clipped) continue;
      const option = element('option', message.text.replace(/\s+/g, ' ').slice(0, 70)); option.value = message.id; messages.append(option);
    }
    if ([...messages.options].some(option => option.value === selected)) messages.value = selected;
  };
  async function load() {
    invalidate(); checked = undefined; descriptor = undefined; busy = true; buttons();
    const token = generation, notebook = options.getNotebook(), original = JSON.stringify(notebook);
    const operation = new AbortController(); controller = operation;
    notice.textContent = 'Checking the current annotation source…';
    try {
      const [basis, value] = await Promise.all([options.describe(operation.signal), options.compile(notebook, operation.signal)]);
      if (disposed || token !== generation) return false;
      if (original !== JSON.stringify(options.getNotebook())) { invalidate('The notebook changed. Reopen to load the current draft.'); return false; }
      descriptor = basis; checked = value;
      const selected = options.selectedBeat?.() ?? moment.value; moment.replaceChildren();
      for (const beat of value.beats) { const option = element('option', beat.title); option.value = beat.id; moment.append(option); }
      if (value.beats.some(beat => beat.id === selected)) moment.value = selected;
      busy = false; notice.textContent = 'Describe one change. Preparing a request puts it in chat for you to send.'; renderMessages(); buttons(); return true;
    } catch (error) { if (!disposed && token === generation) { busy = false; fail(error); } return false; }
  }
  async function prepareRequest() {
    invalidate(); options.chat.open();
    try {
      chat(); if (!await load()) return;
      if (disposed || panel.hidden || !checked || !descriptor) return;
      request = owner.begin(context(descriptor), instruction.value);
      options.chat.stageDraft(revisionPrompt(request), { branchId: request.branchId, threadId: request.threadId });
      notice.textContent = 'Request is in chat. Send it there, then choose the completed response and preview it here.'; buttons();
    } catch (error) { owner.cancel(); request = undefined; fail(error); }
  }
  async function previewProposal() {
    if (!request || !checked || !descriptor) return;
    const token = ++generation, operation = new AbortController(); controller?.abort(); controller = operation; busy = true; buttons();
    try {
      const snapshot = options.chat.snapshot(), response = snapshot?.messages.find(message => message.id === messages.value);
      if (!pasted.value.trim() && (!response || response.role !== 'assistant' || !response.complete || response.clipped))
        throw new Error('Choose a complete assistant response or paste its proposal JSON.');
      const raw = readRevisionResponse(pasted.value.trim() || response!.text);
      const change = owner.receive(raw, context(descriptor));
      const next = revisedAnnotationNotebook(options.getNotebook(), checked.beats, change);
      notice.textContent = 'Checking the proposed wording and targets…';
      const value = await options.compile(next, operation.signal);
      const basis = await options.describe(operation.signal);
      if (disposed || token !== generation) return;
      owner.review(context(basis));
      candidate = value; before.textContent = `${change.before.title}\n${change.before.content}`;
      after.textContent = `${change.after.title}\n${change.after.content}`; comparison.hidden = false;
      previewing = true; options.preview(value, change.after.id);
      busy = false; notice.textContent = 'Preview only. Compare the wording at this moment; Accept makes one undoable notebook edit.'; buttons();
    } catch (error) {
      if (disposed || token !== generation) return;
      // A compile failure cannot leave an uncompiled proposal looking ready.
      // The original draft and player remain owned by the host.
      if (owner.pending()) invalidate(); busy = false; fail(error);
    }
  }
  async function acceptProposal() {
    if (!candidate) return;
    const token = ++generation, operation = new AbortController(); controller?.abort(); controller = operation; busy = true; buttons();
    try {
      const basis = await options.describe(operation.signal);
      if (disposed || token !== generation || !candidate) return;
      const current = context(basis), change = owner.review(current);
      const next = revisedAnnotationNotebook(options.getNotebook(), checked!.beats, change);
      const transaction = annotationRevisionTransaction(options.view.state, next);
      owner.accept(current);
      const accepted = candidate;
      ownApplying = true;
      try { options.view.dispatch(transaction); } finally { ownApplying = false; }
      previewing = false; candidate = undefined; request = undefined; checked = undefined; busy = false;
      notice.textContent = 'Annotation accepted. Undo in the notebook restores the previous wording.'; buttons();
      options.accepted?.(accepted);
    } catch (error) { if (!disposed && token === generation) { invalidate(); fail(error); } }
  }
  const hide = () => {
    invalidate(); panel.hidden = true; panel.inert = true;
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true }); else options.view.focus();
  };
  const command = registry.add({ id: 'notebook.revise-annotation', title: 'Revise fraction annotation in chat', category: 'Annotation', scope: 'notebook',
    run() { returnFocus = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
      panel.hidden = false; panel.inert = false; instruction.focus(); return load(); } });
  close.onclick = hide;
  panel.onkeydown = event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); hide(); } };
  moment.onchange = () => invalidate('Moment changed. Prepare a request for this annotation.');
  stage.onclick = () => { void prepareRequest(); }; preview.onclick = () => { void previewProposal(); }; accept.onclick = () => { void acceptProposal(); };
  reject.onclick = () => invalidate('Proposal rejected. Your notebook is unchanged.');
  const unsubscribe = options.chat.subscribe(snapshot => {
    renderMessages(snapshot);
    if (request && (snapshot.branchId !== request.branchId || snapshot.threadId !== request.threadId))
      invalidate('Conversation changed. Return to the intended thread and prepare a new request.');
  });
  buttons();
  return {
    changed() { if (!disposed && !ownApplying) { checked = undefined; invalidate('Notebook changed. Reopen this panel to request a revision against the current draft.'); } },
    dispose() {
      if (disposed) return;
      try { invalidate(); }
      finally { disposed = true; checked = undefined; descriptor = undefined; owner.dispose(); unsubscribe(); command.dispose(); panel.remove(); }
    }
  };
}
