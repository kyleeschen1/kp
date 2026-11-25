import { Fragment, type Node as ProseNode } from 'prosemirror-model';
import { NodeSelection, Selection, type Command, type EditorState, type Transaction } from 'prosemirror-state';
import { closeHistory } from 'prosemirror-history';
import { schema } from './schema.ts';
import type { ContentBlock } from './types.ts';

export function selectedBlock(state: EditorState) {
  const { selection } = state;
  if (selection instanceof NodeSelection && selection.node.type.name === 'block') return { node: selection.node, pos: selection.from };
  for (let depth = selection.$from.depth; depth > 0; depth--) {
    if (selection.$from.node(depth).type.name === 'block') return { node: selection.$from.node(depth), pos: selection.$from.before(depth) };
  }
  return undefined;
}
const children = (node: ProseNode) => { const result: ProseNode[] = []; node.forEach(n => result.push(n)); return result; };
const bodyIndex = (node: ProseNode) => node.firstChild?.type.name === 'blockTitle' ? 1 : 0;
export const emptyBlock = () => schema.node('block', { id: crypto.randomUUID() }, [schema.node('paragraph')]);

export function withinStructureLimits(doc: ProseNode): boolean {
  // Match the persisted cells array as well as the recursive block budget.
  if (doc.childCount > 200) return false;
  let count = 0, stories = 0, valid = true;
  const walk = (node: ProseNode, depth: number) => {
    if (node.type.name === 'block') { count++; depth++; }
    if (node.type.name === 'story') stories++;
    if (depth > 8 || count > 200 || stories > 1) { valid = false; return; }
    node.forEach(child => walk(child, depth));
  };
  walk(doc, 0); return valid;
}

/** Structural moves are one transaction. A UUID moves with its whole subtree;
 * selection is restored by identity rather than by an obsolete document offset. */
function finish(tr: Transaction, id: string, dispatch?: (tr: Transaction) => void) {
  if (!withinStructureLimits(tr.doc)) return false;
  let position: number | undefined;
  tr.doc.descendants((node, pos) => { if (node.attrs['id'] === id) position = pos; });
  if (position !== undefined) tr.setSelection(Selection.near(tr.doc.resolve(position + 1), 1));
  dispatch?.(closeHistory(tr).scrollIntoView()); return true;
}
export const addBlock: Command = (state, dispatch) => {
  const selected = selectedBlock(state), node = emptyBlock();
  const pos = selected ? selected.pos + selected.node.nodeSize : state.doc.content.size;
  return finish(state.tr.insert(pos, node), node.attrs['id'], dispatch);
};
export const splitContentBlock: Command = (state, dispatch) => {
  const selected = selectedBlock(state), { $from, $to } = state.selection;
  if (!selected || $from.parent.type.name !== 'paragraph' || !$from.sameParent($to)) return false;
  const parts = children(selected.node), index = bodyIndex(selected.node), paragraph = parts[index]!;
  parts[index] = paragraph.copy(paragraph.content.cut(0, $from.parentOffset));
  const next = emptyBlock().copy(Fragment.from(paragraph.copy(paragraph.content.cut($to.parentOffset))));
  return finish(state.tr.replaceWith(selected.pos, selected.pos + selected.node.nodeSize, [selected.node.copy(Fragment.from(parts)), next]), next.attrs['id'], dispatch);
};
export const titleBlock: Command = (state, dispatch) => {
  const selected = selectedBlock(state); if (!selected) return false;
  if (selected.node.firstChild?.type.name === 'blockTitle') return finish(state.tr, selected.node.firstChild.attrs['id'], dispatch);
  const title = schema.node('blockTitle', { id: crypto.randomUUID() });
  return finish(state.tr.insert(selected.pos + 1, title), title.attrs['id'], dispatch);
};
export const removeEmptyTitle: Command = (state, dispatch) => {
  const selected = selectedBlock(state), title = selected?.node.firstChild;
  if (!selected || title?.type.name !== 'blockTitle' || title.content.size) return false;
  return finish(state.tr.delete(selected.pos + 1, selected.pos + 1 + title.nodeSize), selected.node.attrs['id'], dispatch);
};
export const nestBlock: Command = (state, dispatch) => {
  const selected = selectedBlock(state); if (!selected) return false;
  const $pos = state.doc.resolve(selected.pos), previous = $pos.nodeBefore;
  if (previous?.type.name !== 'block') return false;
  const nested = previous.type.create({ ...previous.attrs, folded: false }, previous.content.append(Fragment.from(selected.node)));
  return finish(state.tr.replaceWith(selected.pos - previous.nodeSize, selected.pos + selected.node.nodeSize, nested), selected.node.attrs['id'], dispatch);
};
export const outdentBlock: Command = (state, dispatch) => {
  const selected = selectedBlock(state); if (!selected) return false;
  const $pos = state.doc.resolve(selected.pos), parent = $pos.parent;
  if (parent.type.name !== 'block') return false;
  const parentPos = $pos.before(), nodes = children(parent); nodes.splice($pos.index(), 1);
  return finish(state.tr.replaceWith(parentPos, parentPos + parent.nodeSize, [parent.copy(Fragment.from(nodes)), selected.node]), selected.node.attrs['id'], dispatch);
};
export const moveBlock = (direction: -1 | 1): Command => (state, dispatch) => {
  const selected = selectedBlock(state); if (!selected) return false;
  const $pos = state.doc.resolve(selected.pos), adjacent = direction < 0 ? $pos.nodeBefore : $pos.nodeAfter && state.doc.nodeAt(selected.pos + selected.node.nodeSize);
  if (!adjacent || !['block', 'story'].includes(adjacent.type.name)) return false;
  const from = direction < 0 ? selected.pos - adjacent.nodeSize : selected.pos;
  return finish(state.tr.replaceWith(from, from + adjacent.nodeSize + selected.node.nodeSize,
    direction < 0 ? [selected.node, adjacent] : [adjacent, selected.node]), selected.node.attrs['id'], dispatch);
};
export const mergeNext: Command = (state, dispatch) => {
  const selected = selectedBlock(state); if (!selected) return false;
  const next = state.doc.nodeAt(selected.pos + selected.node.nodeSize);
  // Merging must never silently erase a second title, metadata owner or layout.
  if (next?.type.name !== 'block' || bodyIndex(next) || Object.keys(next.attrs['metadata']).length
    || next.attrs['kind'] !== selected.node.attrs['kind'] || next.attrs['layout'] !== selected.node.attrs['layout']
    || next.attrs['folded'] !== selected.node.attrs['folded']) return false;
  const parts = children(selected.node), index = bodyIndex(selected.node), body = parts[index]!, other = next.firstChild!;
  const gap = body.content.size && other.content.size && !/\s$/.test(body.textContent) && !/^\s/.test(other.textContent)
    ? Fragment.from(schema.text(' ')) : Fragment.empty;
  parts[index] = body.copy(body.content.append(gap).append(other.content));
  parts.push(...children(next).slice(1));
  return finish(state.tr.replaceWith(selected.pos, selected.pos + selected.node.nodeSize + next.nodeSize,
    selected.node.copy(Fragment.from(parts))), selected.node.attrs['id'], dispatch);
};
export const changeBlock = (attrs: Partial<Pick<ContentBlock, 'layout' | 'kind' | 'folded'>>): Command => (state, dispatch) => {
  const selected = selectedBlock(state); if (!selected) return false;
  return finish(state.tr.setNodeMarkup(selected.pos, undefined, { ...selected.node.attrs, ...attrs }), selected.node.attrs['id'], dispatch);
};
export const toggleFold: Command = (state, dispatch) => {
  const selected = selectedBlock(state); if (!selected) return false;
  return changeBlock({ folded: !selected.node.attrs['folded'] })(state, dispatch);
};
