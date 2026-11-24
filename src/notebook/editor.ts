import { indexNotebook, newId, uuid, type Node, type Notebook, type Reference, type UUID } from './model.ts';
import { matrix2, metadata, parseNotebook } from './validation.ts';
import { transact, type Operation } from './transactions.ts';
import { flattenBlocks, resolveNotebook } from './resolve.ts';
import { button, element } from './view.ts';
import type { AttachEditor } from './app.ts';

/** The inspector owns a draft at a particular revision. Incoming updates refresh
 * the reader but never overwrite typed work or silently rebase a save. */
export const attachNotebookEditor: AttachEditor = (root, controls, context) => {
  let selected: UUID | undefined, disposed = false, busy = false;
  const draftKey = (id: UUID) => `kp.notebook.draft.${context.current().id}.${id}`;
  const clearDraft = (id: UUID) => { try { sessionStorage.removeItem(draftKey(id)); } catch { /* Draft recovery is optional when browser storage is unavailable. */ } };
  let undo: { before: Notebook; after: number } | undefined;
  const defaultMessage = () => root.replaceChildren(element('h2', '', 'Edit a block'), element('p', '', 'Choose Edit beside a block. Shared definitions and local occurrences are edited separately.'));
  defaultMessage();
  const report = (error: unknown) => context.status(error instanceof Error ? error.message : String(error));
  const save = async (basis: Notebook, operations: readonly Operation[]) => {
    if (busy || disposed) return; busy = true;
    const editedDraft = selected ? `kp.notebook.draft.${basis.id}.${selected}` : undefined;
    try {
      const next = transact(basis, basis.revision, operations);
      // Unsupported mathematics must not replace a working scene. Missing
      // references after an intentional deletion remain explicit diagnostics.
      const proposal = context.documents().map(d => d.id === next.id ? next : d);
      const gaps = proposal.flatMap(d => flattenBlocks(resolveNotebook(proposal, d.id).blocks)).filter(b => b.problem?.code === 'unsupported-scene');
      if (gaps.length) throw new Error(gaps[0]!.problem!.message);
      await context.store.save(basis.revision, next); undo = { before: basis, after: next.revision };
      if (editedDraft) { try { sessionStorage.removeItem(editedDraft); } catch { /* Saved document is already durable. */ } }
      await context.refresh();
      context.status(`Saved revision ${next.revision} in this browser. Only declared dependents update.`);
      if (!disposed && selected && indexNotebook(next).nodes.has(selected)) select({ notebookId: next.id, nodeId: selected });
      else if (!disposed) defaultMessage();
    } catch (error) { report(error); } finally { busy = false; }
  };
  const addKind = element('select'); addKind.setAttribute('aria-label', 'New block type');
  for (const kind of ['prose', 'section', 'matrix']) { const option = element('option', '', kind); option.value = kind; addKind.append(option); }
  const add = button('Add block', () => {
    const doc = context.current(), target = selected ? indexNotebook(doc).nodes.get(selected) : undefined;
    const parentId = target && 'children' in target ? target.id : doc.id;
    const base = { id: newId(), title: addKind.value === 'section' ? 'New section' : addKind.value === 'matrix' ? 'New matrix' : 'New explanation', metadata: {} };
    const node: Node = addKind.value === 'section' ? { ...base, type: 'section', children: [] }
      : addKind.value === 'matrix' ? { ...base, type: 'matrix', rows: [[1,0],[0,1]] } : { ...base, type: 'prose', text: 'Write your explanation here.' };
    selected = node.id; void save(doc, [{ type: 'insert', parentId, node }]);
  });
  const importPicker = element('select'); importPicker.setAttribute('aria-label', 'Reusable component');
  const refreshPicker = () => {
    importPicker.replaceChildren();
    for (const doc of context.documents()) for (const node of indexNotebook(doc).nodes.values()) if (node.type === 'component') {
      const option = element('option', '', `${doc.title} / ${node.title}`); option.value = `${doc.id}/${node.id}`; importPicker.append(option);
    }
  };
  refreshPicker();
  const importComponent = button('Import component', () => {
    try {
      const [notebookId, nodeId] = importPicker.value.split('/'); const doc = context.current();
      const node: Node = { id: newId(), type: 'import', title: 'Imported component', metadata: {}, source: { notebookId: uuid(notebookId), nodeId: uuid(nodeId) }, policy: 'live', bindings: {} };
      selected = node.id; void save(doc, [{ type: 'insert', parentId: doc.id, node }]);
    } catch (error) { report(error); }
  });
  const download = button('Download notebook JSON', () => {
    const doc = context.current(), url = URL.createObjectURL(new Blob([JSON.stringify(doc, null, 2) + '\n'], { type: 'application/json' }));
    const link = element('a'); link.href = url; link.download = `${doc.id}.notebook.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const file = element('input'); file.type = 'file'; file.accept = '.json,application/json'; file.setAttribute('aria-label', 'Import notebook JSON');
  const importFile = button('Import notebook JSON', () => file.click()); file.hidden = true;
  file.onchange = () => { void (async () => {
    const source = file.files?.[0]; if (!source) return;
    try {
      if (source.size > 2_000_000) throw new Error('Notebook exceeds the 2 MB local import limit.');
      const doc = parseNotebook(JSON.parse(await source.text()));
      if (context.documents().some(d => d.id === doc.id)) throw new Error('This notebook UUID already exists. Open it from the notebook selector; importing cannot overwrite it.');
      await context.store.save(null, doc); await context.navigate(doc.id);
      context.status('Imported with original resource UUIDs. Missing dependencies are shown explicitly.');
    } catch (error) { report(error); } finally { file.value = ''; }
  })(); };
  const undoButton = button('Undo last save', () => { void (async () => {
    if (!undo || busy) { context.status('No edit to undo in this session.'); return; }
    try {
      await context.store.save(undo.after, { ...undo.before, revision: undo.after + 1 }); undo = undefined;
      await context.refresh(); if (selected) select({ notebookId: context.current().id, nodeId: selected });
      context.status('Restored the previous content as a new revision.');
    } catch (error) { report(error); }
  })(); });
  controls.append(addKind, add, importPicker, importComponent, download, importFile, file, undoButton);
  const unsubscribe = context.store.subscribe(refreshPicker);

  function select(source: Reference) {
    if (disposed) return;
    const doc = context.current(); if (source.notebookId !== doc.id) { void context.navigate(source.notebookId, source.nodeId); return; }
    const { nodes, parents } = indexNotebook(doc), node = nodes.get(source.nodeId);
    if (!node) { defaultMessage(); return; } selected = node.id;
    const title = element('input'); title.value = node.title;
    const field = (name: string, input: HTMLElement) => { const label = element('label', '', name); label.append(input); return label; };
    const form = element('form'), subtitle = element('p', 'nb-draft-note', node.type === 'import' ? 'Editing this occurrence changes its title and bindings. Use Open source to change the shared component.' : `Editing this saved source at revision ${doc.revision}. Live uses of this resource may update.`);
    const payload = element('textarea'); payload.value = node.type === 'prose' ? node.text : node.type === 'matrix' ? JSON.stringify(node.rows) : '';
    const meta = element('textarea'); meta.value = JSON.stringify(node.metadata, null, 2); meta.rows = 3;
    form.append(field('Title', title));
    if (node.type === 'prose' || node.type === 'matrix') form.append(field(node.type === 'prose' ? 'Explanation' : 'Matrix entries (2 × 2 JSON)', payload));
    const bindings: { inputId: UUID; select: HTMLSelectElement }[] = [];
    if (node.type === 'import') {
      const definition = context.documents().find(d => d.id === node.source.notebookId);
      const component = definition && indexNotebook(definition).nodes.get(node.source.nodeId);
      form.append(button('Open shared source', () => { void context.navigate(node.source.notebookId, node.source.nodeId); }));
      if (component?.type === 'component') for (const input of component.inputs) {
        const picker = element('select'), defaultOption = element('option', '', 'Use source default'); defaultOption.value = ''; picker.append(defaultOption);
        for (const owner of context.documents()) for (const resource of indexNotebook(owner).nodes.values()) if (resource.type === 'matrix') {
          const option = element('option', '', `${owner.title} / ${resource.title}`); option.value = `${owner.id}/${resource.id}`; picker.append(option);
        }
        const bound = node.bindings[input.id], value = bound ? `${bound.notebookId}/${bound.nodeId}` : '';
        if (value && ![...picker.options].some(option => option.value === value)) {
          const missing = element('option', '', 'Unavailable bound resource'); missing.value = value; picker.append(missing);
        }
        picker.value = value;
        form.append(field(`Input: ${input.name}`, picker)); bindings.push({ inputId: input.id, select: picker });
      }
    }
    form.append(field('Metadata (namespaced JSON)', meta));
    const submit = element('button', 'nb-primary', 'Save block'); submit.type = 'submit';
    form.append(submit, button('Reload latest block', () => { clearDraft(node.id); select(source); }));
    let restoredStale = false, dirty = false, draftRevision = doc.revision;
    try {
      const saved: unknown = JSON.parse(sessionStorage.getItem(draftKey(node.id)) ?? 'null');
      if (saved && typeof saved === 'object' && 'title' in saved && typeof saved.title === 'string'
        && 'payload' in saved && typeof saved.payload === 'string' && 'meta' in saved && typeof saved.meta === 'string'
        && 'revision' in saved && typeof saved.revision === 'number') {
        title.value = saved.title; payload.value = saved.payload; meta.value = saved.meta;
        dirty = true;
        if ('bindings' in saved && Array.isArray(saved.bindings)) for (const binding of bindings) {
          const entry: unknown = saved.bindings.find((v: unknown) => Array.isArray(v) && v[0] === binding.inputId);
          if (Array.isArray(entry) && typeof entry[1] === 'string') binding.select.value = entry[1];
        }
        draftRevision = saved.revision; restoredStale = saved.revision !== doc.revision;
        if (restoredStale) subtitle.textContent = 'Recovered an older draft. Copy any text you need, then Reload latest block before saving. The saved notebook has changed.';
        else subtitle.textContent += ' Your unsaved draft was recovered.';
      }
    } catch { /* Malformed session state cannot replace saved content. */ }
    submit.disabled = restoredStale;
    form.oninput = () => {
      dirty = true; for (const control of actions.querySelectorAll('button')) control.disabled = true;
      try { sessionStorage.setItem(draftKey(node.id), JSON.stringify({ revision: draftRevision, title: title.value, payload: payload.value, meta: meta.value, bindings: bindings.map(b => [b.inputId, b.select.value]) })); }
      catch { context.status('Draft recovery is unavailable. Save explicitly or copy your text before leaving.'); }
    };
    form.onsubmit = event => {
      event.preventDefault();
      if (restoredStale) { context.status('Recovered draft is stale. Copy needed text, then Reload latest block.'); return; }
      try {
        const ops: Operation[] = [{ type: 'rename', id: node.id, title: title.value }, { type: 'metadata', id: node.id, metadata: metadata(JSON.parse(meta.value)) }];
        if (node.type === 'prose') ops.push({ type: 'prose', id: node.id, text: payload.value });
        if (node.type === 'matrix') ops.push({ type: 'matrix', id: node.id, rows: matrix2(JSON.parse(payload.value)) });
        for (const binding of bindings) {
          if (!binding.select.value) ops.push({ type: 'unbind', id: node.id, inputId: binding.inputId });
          else { const [notebookId, nodeId] = binding.select.value.split('/'); ops.push({ type: 'bind', id: node.id, inputId: binding.inputId, source: { notebookId: uuid(notebookId), nodeId: uuid(nodeId) } }); }
        }
        void save(doc, ops);
      } catch (error) { report(error); }
    };
    const actions = element('div', 'nb-actions'), parentId = parents.get(node.id)!;
    const siblings = parentId === doc.id ? doc.children : (() => { const parent = nodes.get(parentId); return parent && 'children' in parent ? parent.children : []; })();
    const at = siblings.findIndex(n => n.id === node.id), previous = siblings[at - 1], next = siblings[at + 1];
    const move = (parentId: UUID, beforeId?: UUID) => { void save(doc, [{ type: 'move', id: node.id, parentId, ...(beforeId ? { beforeId } : {}) }]); };
    const up = button('Move up', () => { if (previous) move(parentId, previous.id); }); up.disabled = !previous;
    const down = button('Move down', () => { if (next) move(parentId, siblings[at + 2]?.id); }); down.disabled = !next;
    const nest = button('Nest', () => { if (previous && 'children' in previous) move(previous.id); }); nest.disabled = !previous || !('children' in previous);
    const unnest = button('Unnest', () => { const destination = parents.get(parentId); if (destination) move(destination); }); unnest.disabled = parentId === doc.id;
    actions.append(up, down, nest, unnest, button('Duplicate', () => { void save(doc, [{ type: 'duplicate', id: node.id }]); }), button('Delete block', () => { void save(doc, [{ type: 'delete', id: node.id }]); }));
    if (dirty) for (const control of actions.querySelectorAll('button')) control.disabled = true;
    root.replaceChildren(element('h2', '', node.title), subtitle, form, actions, element('p', 'nb-draft-note', 'Save your draft before moving this block. Unrelated scenes keep their position. Undo restores the last save in this session.'), element('code', '', node.id));
    root.scrollIntoView({ block: 'nearest' }); title.focus({ preventScroll: true });
  }
  return { select, dispose() { disposed = true; unsubscribe(); } };
};
