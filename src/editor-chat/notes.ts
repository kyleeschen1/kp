import { DOMSerializer } from 'prosemirror-model';
import type { ChatAction, ChatSnapshot } from './protocol.ts';
import { noteLimit, noteRevision, readAnnotationDraft, type AnnotationDraft, type AnnotationTarget, type ChatAnnotation, type PassageTarget } from './annotations.ts';
import type { ResolvedPassage } from './annotation-target.ts';
import { parseMarkdown, richSchema } from './rich-document.ts';
import { mountRichText, type RichSurface } from './rich-text.ts';
import { renderNoteMath } from './math-view.ts';

const recoveryKey = 'kp.editor-chat.note-draft.v1';
const element = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string) => {
  const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; return node;
};
export function mountNotes(host: HTMLElement, actions: {
  save: (action: ChatAction) => Promise<ChatSnapshot>;
  reveal: (target: PassageTarget) => void;
  resolve: (target: PassageTarget) => ResolvedPassage;
}) {
  const intro = element('p', 'kp-chat-context', 'Notes and tags stay with this conversation. They are included in a message only when you add them yourself.');
  const search = element('input', 'kp-notes-search'); search.type = 'search'; search.placeholder = 'Find a note or tag'; search.setAttribute('aria-label', 'Find notes and tags');
  const notice = element('p', 'kp-notes-notice'); notice.setAttribute('role', 'status');
  const list = element('div', 'kp-notes-list'), form = element('section', 'kp-note-form'); form.hidden = true; form.setAttribute('aria-label', 'Edit note');
  const caption = element('strong'), quote = element('blockquote', 'kp-note-quote'), editorHost = element('div', 'kp-note-editor');
  const tags = element('input', 'kp-note-tags'); tags.setAttribute('aria-label', 'Note tags'); tags.placeholder = 'Tags, separated by commas'; tags.maxLength = 480;
  const state = element('p', 'kp-chat-context'), controls = element('div', 'kp-note-controls');
  const button = (label: string, run: () => void) => { const node = element('button', '', label); node.type = 'button'; node.onclick = run; return node; };
  const save = button('Save note', () => { void submit(); }), cancel = button('Discard draft', finish);
  const load = button('Load saved note', () => {
    const saved = current?.annotations.find(note => note.id === draft?.id);
    if (!saved || saved.archived || !confirm('Replace your local note with the saved version? Copy any text you want to keep first.')) return;
    dirty = false; edit(saved);
  }); load.hidden = true;
  controls.append(save, cancel, load); form.append(caption, quote, editorHost, tags, state, controls);
  host.append(intro, search, notice, form, list);
  let current: ChatSnapshot | undefined, draft: AnnotationDraft | undefined, revision = 0;
  let editor: RichSurface | undefined, dirty = false, generation = 0, saving = false, conflict = false, recovered = false, disposed = false;
  let rendered = '';
  function remember() {
    if (!draft || !current) return;
    try { sessionStorage.setItem(recoveryKey, JSON.stringify({ project: current.project, draft, revision })); }
    catch { state.textContent = 'Local recovery unavailable. Save this note before closing.'; }
  }
  function forget() { try { sessionStorage.removeItem(recoveryKey); } catch { /* Saved project copy remains authoritative. */ } }
  function finish() { editor?.dispose(); editor = undefined; draft = undefined; dirty = false; conflict = false; form.hidden = true; forget(); draw(); }
  function describe() {
    save.disabled = saving || conflict || !draft || (!draft.body.trim() && !draft.tags.length);
    cancel.disabled = saving;
    load.hidden = !conflict || !current?.annotations.some(note => note.id === draft?.id && !note.archived);
    state.textContent = conflict ? 'Note conflict · your local text is retained' : saving ? 'Saving note…' : dirty ? 'Unsaved note · Save note or Cmd/Ctrl+Enter' : 'Saved to this project';
  }
  function changed() { dirty = true; generation++; remember(); describe(); }
  function edit(note: AnnotationDraft & { revision?: number }, focusTags = false) {
    if (saving) return;
    if (draft?.id === note.id && editor && dirty) { if (focusTags) tags.focus(); else editor.focus(); return; }
    if (dirty && !confirm('Discard the unsaved note draft and open another note?')) return;
    editor?.dispose();
    draft = { id: note.id, target: structuredClone(note.target), body: note.body, tags: [...note.tags] };
    revision = note.revision ?? 0; dirty = revision === 0; conflict = false; generation++;
    caption.textContent = draft.target.kind === 'passage' ? 'Passage comment' : 'Conversation note';
    quote.hidden = draft.target.kind !== 'passage'; quote.textContent = draft.target.kind === 'passage' ? draft.target.quote : '';
    tags.value = draft.tags.join(', '); form.hidden = false;
    editor = mountRichText(editorHost, { profile: 'comment', label: 'Note text', text: draft.body, limit: noteLimit,
      onChange: body => { if (draft) { draft.body = body; changed(); } }, onSubmit: () => { void submit(); }, onSave: () => { void submit(); } });
    describe(); remember();
    if (focusTags) tags.focus(); else editor.focus();
  }
  tags.oninput = () => {
    if (!draft) return;
    draft.tags = tags.value.split(',').map(value => value.trim().replace(/^#+/, '').toLowerCase()).filter(Boolean);
    changed();
  };
  async function submit() {
    if (!draft || saving || conflict) return;
    const editGeneration = generation;
    let submitted: AnnotationDraft;
    try { submitted = readAnnotationDraft(draft); }
    catch (error) { notice.textContent = String(error instanceof Error ? error.message : error); return; }
    saving = true; describe();
    try {
      const snapshot = await actions.save({ kind: 'annotation-save', revision, annotation: submitted });
      if (disposed) return;
      current = snapshot; revision = snapshot.annotations.find(note => note.id === submitted.id)?.revision ?? revision;
      conflict = false; notice.textContent = 'Note saved to this project.';
      if (generation === editGeneration) finish(); else { dirty = true; remember(); }
    } catch (error) {
      if (disposed) return;
      notice.textContent = `${error instanceof Error ? error.message : String(error)} Your local note is retained.`; remember();
    } finally { saving = false; if (!disposed) { describe(); draw(); } }
  }
  async function remove(note: ChatAnnotation) {
    if (saving) return;
    saving = true; describe();
    try {
      current = await actions.save({ kind: 'annotation-delete', id: note.id, revision: note.revision });
      if (disposed) return;
      if (draft?.id === note.id) finish(); notice.textContent = 'Note removed.';
    } catch (error) { notice.textContent = error instanceof Error ? error.message : String(error); }
    finally { saving = false; if (!disposed) { describe(); draw(); } }
  }
  function draw() {
    if (!current || disposed) return;
    const visible = current.annotations.filter(note => !note.archived);
    const states = visible.map(note => note.target.kind === 'passage' ? actions.resolve(note.target).status : 'note');
    const signature = JSON.stringify([visible, states, search.value]);
    if (signature === rendered) return; rendered = signature; list.replaceChildren();
    const terms = search.value.toLowerCase().split(/\s+/).filter(Boolean);
    let count = 0;
    for (const [index, note] of visible.entries()) {
      const searchable = `${note.body} ${note.tags.map(tag => `#${tag}`).join(' ')} ${note.target.kind === 'passage' ? note.target.quote : ''}`.toLowerCase();
      if (!terms.every(term => searchable.includes(term))) continue;
      count++;
      const card = element('article', 'kp-note-card'); card.dataset['noteId'] = note.id;
      if (note.target.kind === 'passage') {
        const target = note.target, excerpt = element('blockquote', 'kp-note-quote', target.quote); card.append(excerpt);
        const attached = states[index] === 'attached';
        if (attached) card.append(button('Show passage', () => actions.reveal(target)));
        else card.append(element('p', 'kp-note-detached', states[index] === 'changed'
          ? 'Passage changed · original quotation retained' : 'Passage outside the loaded conversation · original quotation retained'));
      }
      const body = element('div', 'kp-rich-content');
      body.append(DOMSerializer.fromSchema(richSchema).serializeFragment(parseMarkdown(note.body).content)); renderNoteMath(body); card.append(body);
      const labels = element('div', 'kp-note-labels');
      for (const tag of note.tags) labels.append(button(`#${tag}`, () => { search.value = `#${tag}`; draw(); }));
      card.append(labels);
      const cardActions = element('div', 'kp-note-controls');
      cardActions.append(button('Edit note', () => edit(note)), button('Remove note', () => { void remove(note); })); card.append(cardActions); list.append(card);
    }
    if (!count) list.append(element('p', 'kp-chat-context', visible.length ? 'No notes match this search.' : 'Select a passage to comment or tag it, or add a conversation note.'));
  }
  search.oninput = draw;
  return {
    update(snapshot: ChatSnapshot) {
      current = snapshot;
      if (!recovered) {
        recovered = true;
        try {
          const raw = sessionStorage.getItem(recoveryKey);
          if (raw) {
            const value: unknown = JSON.parse(raw);
            if (!value || typeof value !== 'object' || !('project' in value) || value.project !== snapshot.project || !('draft' in value) || !('revision' in value)) throw new Error('Saved note recovery belongs to another project or is unreadable.');
            const recoveredDraft = readAnnotationDraft(value.draft), savedRevision = noteRevision(value.revision);
            edit({ ...recoveredDraft, revision: savedRevision }); dirty = true; notice.textContent = 'Recovered an unsaved note. Nothing was sent to Codex.';
          }
        } catch (error) { notice.textContent = `${String(error)} Original recovery bytes retained.`; }
      }
      if (draft && !saving) {
        const saved = snapshot.annotations.find(note => note.id === draft?.id);
        conflict = saved ? saved.archived || saved.revision !== revision : revision !== 0;
        describe();
      }
      draw();
    },
    create(target: AnnotationTarget = { kind: 'conversation' }, focusTags = false) {
      edit({ id: crypto.randomUUID(), target, body: '', tags: [] }, focusTags);
    },
    edit(id: string) { const note = current?.annotations.find(note => note.id === id && !note.archived); if (note) edit(note); },
    dirty: () => dirty, remember,
    dispose() { disposed = true; if (dirty) remember(); editor?.dispose(); host.replaceChildren(); }
  };
}
