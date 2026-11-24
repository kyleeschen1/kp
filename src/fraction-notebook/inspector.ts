import type { Node as ProseNode } from 'prosemirror-model';
import { NodeSelection, TextSelection, type EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { closeHistory } from 'prosemirror-history';
import { metadata } from './json.ts';
import { schema } from './schema.ts';

export function selectedObject(state: EditorState): { node: ProseNode; pos: number } | undefined {
  const s = state.selection;
  if (s instanceof NodeSelection && typeof s.node.attrs['id'] === 'string') return { node: s.node, pos: s.from };
  for (let depth = s.$from.depth; depth > 0; depth--) {
    const node = s.$from.node(depth);
    if (typeof node.attrs['id'] === 'string') return { node, pos: s.$from.before(depth) };
  }
  return undefined;
}
export function addAuthor(view: EditorView) {
  const header = view.state.doc.firstChild;
  if (!header || header.childCount >= 9) return;
  const pos = header.nodeSize - 1, author = schema.node('authorCredit', { id: crypto.randomUUID(), metadata: {}, role: 'author' });
  const tr = closeHistory(view.state.tr).insert(pos, author);
  view.dispatch(tr.setSelection(TextSelection.create(tr.doc, pos + 1)).scrollIntoView()); view.focus();
}
export function annotateSelection(view: EditorView): string {
  const { from, to, $from, $to } = view.state.selection;
  if (from === to || !$from.sameParent($to) || !['paragraph', 'title'].includes($from.parent.type.name)) throw new Error('Select a phrase in a paragraph or title first.');
  let object = false;
  view.state.doc.nodesBetween(from, to, n => { if (n.isInline && !n.isText) object = true; });
  if (object) throw new Error('Inspect inline objects individually; select ordinary text for a phrase annotation.');
  const id = crypto.randomUUID();
  view.dispatch(closeHistory(view.state.tr).addMark(from, to, schema.mark('annotation', { id, metadata: { note: '' } })));
  return id;
}
interface Target { readonly id: string; readonly kind: 'node' | 'annotation'; readonly label: string; readonly value: unknown }
export function mountInspector(parent: HTMLElement, view: EditorView) {
  const panel = document.createElement('section'); panel.className = 'fn-inspector'; panel.hidden = true; panel.setAttribute('aria-label', 'Content details');
  const label = document.createElement('label'); label.textContent = 'Inspect '; const picker = document.createElement('select'); picker.setAttribute('aria-label', 'Metadata target'); label.append(picker);
  const identity = document.createElement('code'); identity.className = 'fn-inspector-id';
  const input = document.createElement('textarea'); input.setAttribute('aria-label', 'Metadata JSON'); input.spellcheck = false; input.rows = 4;
  const apply = document.createElement('button'); apply.type = 'button'; apply.textContent = 'Apply metadata';
  const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Remove annotation';
  const role = document.createElement('select'); role.setAttribute('aria-label', 'Credit role');
  for (const name of ['author', 'editor', 'translator']) { const option = document.createElement('option'); option.value = name; option.textContent = name; role.append(option); }
  const message = document.createElement('p'); message.setAttribute('role', 'status');
  panel.append(label, identity, role, input, apply, remove, message); parent.append(panel);
  let targets: Target[] = [], chosen: Target | undefined;
  const findNode = (id: string) => { let result: { node: ProseNode; pos: number } | undefined;
    view.state.doc.descendants((node, pos) => { if (node.attrs['id'] === id) result = { node, pos }; }); return result; };
  const choose = () => {
    chosen = targets.find(t => t.id === picker.value); if (!chosen) return;
    identity.textContent = chosen.id; input.value = JSON.stringify(chosen.value, null, 2); message.textContent = '';
    remove.hidden = chosen.kind !== 'annotation';
    const node = chosen.kind === 'node' ? findNode(chosen.id)?.node : undefined;
    role.hidden = node?.type.name !== 'authorCredit'; if (node) role.value = node.attrs['role'] ?? 'author';
  };
  const refresh = (preferred?: string) => {
    if (panel.hidden || (panel.contains(document.activeElement) && !preferred)) return;
    const next: Target[] = [], seen = new Set<string>();
    const push = (t: Target) => { if (!seen.has(t.id)) { seen.add(t.id); next.push(t); } };
    const { selection } = view.state, selected = selectedObject(view.state);
    const add = (node: ProseNode) => { if (typeof node.attrs['id'] === 'string') push({ id: node.attrs['id'], kind: 'node', label: node.type.name, value: node.attrs['metadata'] }); };
    const annotation = (node: ProseNode) => { for (const mark of node.marks) if (mark.type.name === 'annotation') push({ id: mark.attrs['id'], kind: 'annotation', label: 'Selected phrase', value: mark.attrs['metadata'] }); };
    if (selection.empty) {
      for (const mark of selection.$from.marks()) if (mark.type.name === 'annotation') push({ id: mark.attrs['id'], kind: 'annotation', label: 'Selected phrase', value: mark.attrs['metadata'] });
    } else view.state.doc.nodesBetween(selection.from, selection.to, annotation);
    if (selected) add(selected.node);
    for (let d = selection.$from.depth; d > 0; d--) add(selection.$from.node(d));
    targets = next; picker.replaceChildren(...next.map(t => { const option = document.createElement('option'); option.value = t.id; option.textContent = t.label; return option; }));
    picker.value = preferred && seen.has(preferred) ? preferred : next[0]?.id ?? '';
    input.disabled = apply.disabled = !next.length; if (next.length) choose(); else identity.textContent = 'Select content in the article.';
  };
  picker.onchange = choose;
  apply.onclick = () => {
    if (!chosen) return;
    try {
      const value = metadata(JSON.parse(input.value)), tr = closeHistory(view.state.tr);
      if (chosen.kind === 'node') {
        const found = findNode(chosen.id); if (!found) throw new Error('This object was removed. Select another object.');
        tr.setNodeMarkup(found.pos, undefined, { ...found.node.attrs, metadata: value });
      } else view.state.doc.descendants((node, pos) => {
        for (const mark of node.marks) if (mark.type.name === 'annotation' && mark.attrs['id'] === chosen!.id) {
          tr.removeMark(pos, pos + node.nodeSize, mark).addMark(pos, pos + node.nodeSize, schema.mark('annotation', { id: chosen!.id, metadata: value }));
        }
      });
      view.dispatch(tr); message.textContent = 'Metadata applied.';
    } catch (error) { message.textContent = String(error); }
  };
  remove.onclick = () => {
    if (chosen?.kind !== 'annotation') return;
    const tr = closeHistory(view.state.tr);
    view.state.doc.descendants((node, pos) => { for (const m of node.marks) if (m.type.name === 'annotation' && m.attrs['id'] === chosen!.id) tr.removeMark(pos, pos + node.nodeSize, m); });
    view.dispatch(tr); view.focus(); refresh();
  };
  role.onchange = () => {
    if (!chosen) return; const found = findNode(chosen.id); if (found?.node.type.name !== 'authorCredit') return;
    view.dispatch(closeHistory(view.state.tr).setNodeMarkup(found.pos, undefined, { ...found.node.attrs, role: role.value }));
  };
  return { refresh, show(visible: boolean, preferred?: string) { panel.hidden = !visible; if (visible) refresh(preferred); }, dispose() { panel.remove(); } };
}
