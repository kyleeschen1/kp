import { childrenOf, indexNotebook, newId, NotebookGap, uuid, type Binding, type Matrix2, type Metadata, type Node, type Notebook, type Reference, type UUID } from './model.ts';
import { parseNotebook } from './validation.ts';

export type Operation =
  | { readonly type: 'rename'; readonly id: UUID; readonly title: string }
  | { readonly type: 'prose'; readonly id: UUID; readonly text: string }
  | { readonly type: 'matrix'; readonly id: UUID; readonly rows: Matrix2 }
  | { readonly type: 'metadata'; readonly id: UUID; readonly metadata: Metadata }
  | { readonly type: 'bind'; readonly id: UUID; readonly inputId: UUID; readonly source: Reference }
  | { readonly type: 'unbind'; readonly id: UUID; readonly inputId: UUID }
  | { readonly type: 'move'; readonly id: UUID; readonly parentId: UUID; readonly beforeId?: UUID }
  | { readonly type: 'insert'; readonly parentId: UUID; readonly node: Node; readonly beforeId?: UUID }
  | { readonly type: 'delete'; readonly id: UUID }
  | { readonly type: 'duplicate'; readonly id: UUID };
const gap = (id: string, text: string): never => { throw new NotebookGap('invalid-operation', id, text); };

/** All edits use a revision precondition and produce a fully validated document.
 * Failure cannot partially mutate the source or leave a detached subtree. */
export function transact(doc: Notebook, basis: number, operations: readonly Operation[], allocate: () => UUID = newId): Notebook {
  if (basis !== doc.revision) throw new NotebookGap('stale-revision', doc.id, 'This notebook changed. Reopen the latest revision before applying the draft.');
  let children = doc.children;
  for (const op of operations) {
    const { nodes, parents } = indexNotebook({ ...doc, children });
    const need = (id: UUID) => nodes.get(id) ?? gap(id, 'Node no longer exists.');
    const edit = (items: readonly Node[], id: UUID, change: (n: Node) => Node): readonly Node[] => items.map(n => n.id === id ? change(n) : 'children' in n ? { ...n, children: edit(n.children, id, change) } : n);
    const remove = (items: readonly Node[], id: UUID): readonly Node[] => items.filter(n => n.id !== id).map(n => 'children' in n ? { ...n, children: remove(n.children, id) } : n);
    const insert = (parentId: UUID, node: Node, beforeId?: UUID) => {
      const put = (items: readonly Node[]) => {
        const at = beforeId === undefined ? items.length : items.findIndex(n => n.id === beforeId);
        if (at < 0) gap(parentId, 'Insertion anchor is not a child of the destination.');
        return [...items.slice(0, at), node, ...items.slice(at)];
      };
      if (parentId === doc.id) children = put(children);
      else {
        const parent = need(parentId); if (!('children' in parent)) gap(parentId, 'Destination cannot contain blocks.');
        children = edit(children, parentId, n => 'children' in n ? { ...n, children: put(n.children) } : n);
      }
    };
    if (op.type === 'insert') { insert(op.parentId, op.node, op.beforeId); continue; }
    const node = need(op.id);
    switch (op.type) {
      case 'move': {
        const descendants = new Set(indexNotebook({ ...doc, children: [node] }).nodes.keys());
        if (descendants.has(op.parentId)) gap(op.id, 'A block cannot contain itself.');
        if (op.beforeId === op.id) {
          if (parents.get(op.id) !== op.parentId) gap(op.parentId, 'Insertion anchor is not a child of the destination.');
          break;
        }
        children = remove(children, op.id); insert(op.parentId, node, op.beforeId); break;
      }
      case 'delete': children = remove(children, op.id); break;
      case 'duplicate': insert(parents.get(op.id)!, duplicate(node, doc.id, allocate)); break;
      default: children = edit(children, op.id, n => {
        if (op.type === 'rename') return { ...n, title: op.title };
        if (op.type === 'metadata') return { ...n, metadata: op.metadata };
        if (op.type === 'prose' && n.type === 'prose') return { ...n, text: op.text };
        if (op.type === 'matrix' && n.type === 'matrix') return { ...n, rows: op.rows };
        if (op.type === 'bind' && n.type === 'import') return { ...n, bindings: { ...n.bindings, [op.inputId]: op.source } };
        if (op.type === 'unbind' && n.type === 'import') return { ...n, bindings: Object.fromEntries(Object.entries(n.bindings).filter(([key]) => key !== op.inputId)) };
        return gap(n.id, 'Operation does not match this block type.');
      });
    }
  }
  return parseNotebook({ ...doc, revision: doc.revision + 1, children });
}

function duplicate(node: Node, notebookId: UUID, allocate: () => UUID): Node {
  const ids = new Map<UUID, UUID>();
  const collect = (n: Node) => { ids.set(n.id, allocate()); if (n.type === 'component') n.inputs.forEach(i => ids.set(i.id, allocate())); childrenOf(n).forEach(collect); };
  collect(node);
  const ref = (r: Reference): Reference => r.notebookId === notebookId ? { ...r, nodeId: ids.get(r.nodeId) ?? r.nodeId } : r;
  const binding = (b: Binding): Binding => b.kind === 'resource' ? { ...b, source: ref(b.source) } : { ...b, inputId: ids.get(b.inputId) ?? b.inputId };
  const copy = (n: Node): Node => {
    const id = ids.get(n.id)!;
    switch (n.type) {
      case 'section': return { ...n, id, children: n.children.map(copy) };
      case 'component': return { ...n, id, inputs: n.inputs.map(i => ({ ...i, id: ids.get(i.id)!, default: ref(i.default) })), children: n.children.map(copy) };
      case 'scene': return { ...n, id, left: binding(n.left), right: binding(n.right) };
      case 'import': return { ...n, id, source: ref(n.source), bindings: Object.fromEntries(Object.entries(n.bindings).map(([key, r]) => [ids.get(uuid(key)) ?? key, ref(r)])) };
      default: return { ...n, id };
    }
  };
  return copy(node);
}
