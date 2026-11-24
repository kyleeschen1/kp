import { Fragment, Slice, type Node as ProseNode } from 'prosemirror-model';

/** A copy gets fresh identities when its originals still exist. A cut followed
 * by paste may retain them. Run only for clipboard paste, never for a move/drop. */
export function preparePastedSlice(doc: ProseNode, slice: Slice): Slice {
  const occupied = new Set<string>(), annotations = new Map<string, string>();
  doc.descendants(node => {
    if (typeof node.attrs['id'] === 'string') occupied.add(node.attrs['id']);
    for (const m of node.marks) if (m.type.name === 'annotation') occupied.add(m.attrs['id']);
  });
  const visit = (node: ProseNode): ProseNode => {
    const marks = node.marks.map(mark => {
      const id: unknown = mark.attrs['id'];
      if (mark.type.name !== 'annotation' || typeof id !== 'string' || !occupied.has(id)) return mark;
      let replacement = annotations.get(id); if (!replacement) { replacement = crypto.randomUUID(); annotations.set(id, replacement); }
      return mark.type.create({ ...mark.attrs, id: replacement });
    });
    if (node.isText) return node.mark(marks);
    const children: ProseNode[] = []; node.forEach(child => children.push(visit(child)));
    const id: unknown = node.attrs['id'];
    const attrs = typeof id === 'string' && occupied.has(id) ? { ...node.attrs, id: crypto.randomUUID() } : node.attrs;
    return node.type.create(attrs, Fragment.from(children), marks);
  };
  const nodes: ProseNode[] = []; slice.content.forEach(node => nodes.push(visit(node)));
  return new Slice(Fragment.from(nodes), slice.openStart, slice.openEnd);
}
