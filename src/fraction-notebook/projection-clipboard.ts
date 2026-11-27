import { Fragment, Slice, type Node as ProseNode } from 'prosemirror-model';
import { copyProjectionResource, readProjectionResources, type ProjectionResource } from '../projection-explanation/resource.ts';
import { newId } from '../notebook/model.ts';

/** Native copy makes one independent source per copied source group; cut/move
 * preserves the source. Unknown resources are explicit gaps, never transclusion. */
export function prepareProjectionPaste(doc: ProseNode, slice: Slice, resources: readonly ProjectionResource[]) {
  const occupied = new Set<string>(), copies = new Map<string, ProjectionResource>();
  doc.descendants(node => { if (typeof node.attrs['id'] === 'string') occupied.add(node.attrs['id']); });
  const visit = (node: ProseNode): ProseNode => {
    if (node.type.name === 'projectionObject') {
      const source = resources.find(r => r.id === node.attrs['resource']);
      if (!source) throw new Error('Restore the vector pair before pasting this view.');
      if (!occupied.has(node.attrs['id'])) { occupied.add(node.attrs['id']); return node; }
      let copy = copies.get(source.id);
      if (!copy) { copy = copyProjectionResource(source); copies.set(source.id, copy); }
      return node.type.create({ ...node.attrs, id: newId(), resource: copy.id });
    }
    if (node.isText) return node;
    const children: ProseNode[] = []; node.forEach(child => children.push(visit(child)));
    return node.copy(Fragment.from(children));
  };
  const children: ProseNode[] = []; slice.content.forEach(node => children.push(visit(node)));
  const result = new Slice(Fragment.from(children), slice.openStart, slice.openEnd);
  // Reclaim only at insertion. Cut sources survive until capacity is needed;
  // native undo restores the complete previous store atomically.
  const used = new Set<string>();
  for (const content of [doc, result.content]) content.descendants(n => { if (n.type.name === 'projectionObject') used.add(n.attrs['resource']); });
  const next = [...resources, ...copies.values()];
  return { slice: result, resources: readProjectionResources(next.length > 16 ? next.filter(r => used.has(r.id)) : next) };
}
