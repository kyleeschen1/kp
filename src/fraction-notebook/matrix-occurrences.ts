import { Fragment, Slice, type Node as ProseNode } from 'prosemirror-model';
import { newId, uuid } from '../notebook/model.ts';
import { readMatrixVectorDocument, type MathOccurrence, type MatrixVectorDocument } from '../math-resources/data-api.ts';
import { copyMatrixResource, matrixOccurrence } from './matrix-data.ts';

function mapSlice(slice: Slice, matrix: (node: ProseNode) => ProseNode): Slice {
  const visit = (node: ProseNode): ProseNode => {
    if (node.type.name === 'matrixObject') return matrix(node);
    if (node.isText) return node;
    const children: ProseNode[] = []; node.forEach(child => children.push(visit(child)));
    return node.copy(Fragment.from(children));
  };
  const children: ProseNode[] = []; slice.content.forEach(node => children.push(visit(node)));
  return new Slice(Fragment.from(children), slice.openStart, slice.openEnd);
}

export function activeMatrixOccurrences(doc: ProseNode, resource: string): ReadonlySet<string> {
  const active = new Set<string>();
  doc.descendants(node => {
    if (node.type.name === 'matrixObject' && node.attrs['resource'] === resource) active.add(uuid(node.attrs['occurrence']));
  });
  return active;
}

/** Reclamation happens with insertion, not deletion: ordinary cuts keep their
 * stored records until space is needed, and native undo restores both together. */
export function withMatrixOccurrences(source: MatrixVectorDocument, doc: ProseNode, added: readonly MathOccurrence[]): MatrixVectorDocument {
  const active = activeMatrixOccurrences(doc, source.id);
  const occurrences = new Map(source.occurrences.filter(view => active.has(view.id)).map(view => [view.id, view]));
  for (const view of added) {
    if (occurrences.has(view.id)) throw new Error('Each matrix cell requires its own view occurrence.');
    occurrences.set(view.id, view);
  }
  return readMatrixVectorDocument({ ...source, occurrences: [...occurrences.values()] });
}

/** Carry only the existing occurrence configuration in native clipboard HTML.
 * No source values travel here: another notebook cannot fabricate a resource.
 * This survives reload even when insertion reclaimed the old unused record. */
export function matrixClipboardSlice(slice: Slice, resources: readonly MatrixVectorDocument[]): Slice {
  return mapSlice(slice, node => {
    const { view } = matrixOccurrence(resources, uuid(node.attrs['resource']), uuid(node.attrs['occurrence']));
    return node.type.create({ ...node.attrs, clipboardOccurrence: view }, node.content, node.marks);
  });
}

function clipboardView(node: ProseNode, source: MatrixVectorDocument): MathOccurrence {
  const id = uuid(node.attrs['occurrence']), raw: unknown = node.attrs['clipboardOccurrence'];
  const stored = source.occurrences.find(view => view.id === id);
  if (raw === null || raw === undefined) {
    if (!stored) throw new Error('The copied matrix view is unavailable. Copy it again from its source.');
    return stored;
  }
  // Reuse domain admission for IDs, resource linkage, view kinds and extent.
  // Current settings win when the original occurrence is still stored.
  const incoming = readMatrixVectorDocument({ ...source, occurrences: [raw] }).occurrences[0]!;
  if (incoming.id !== id) throw new Error('Clipboard occurrence identity differs from the copied cell.');
  return stored ?? incoming;
}

export function prepareMatrixPaste(doc: ProseNode, slice: Slice, resources: readonly MatrixVectorDocument[]) {
  const cellIds = new Set<string>();
  doc.descendants(node => { if (node.type.name === 'matrixObject') cellIds.add(uuid(node.attrs['id'])); });
  const records = new Map<ProseNode, { source: MatrixVectorDocument; view: MathOccurrence; copy: boolean }>();
  const copies = new Map<string, Map<string, MathOccurrence>>(), cuts = new Map<string, Map<string, MathOccurrence>>();
  slice.content.descendants(node => {
    if (node.type.name !== 'matrixObject') return;
    const resource = uuid(node.attrs['resource']), source = resources.find(value => value.id === resource);
    if (!source) throw new Error('Restore the matrix resource referenced by this clipboard item.');
    const view = clipboardView(node, source), copy = cellIds.has(uuid(node.attrs['id']));
    records.set(node, { source, view, copy });
    const groups = copy ? copies : cuts, views = groups.get(source.id) ?? new Map<string, MathOccurrence>();
    if (views.has(view.id)) throw new Error('Clipboard repeats a matrix occurrence.');
    views.set(view.id, view); groups.set(source.id, views);
  });
  const copied = new Map<string, { source: MatrixVectorDocument; ids: Map<string, string> }>();
  for (const [id, views] of copies) {
    const original = resources.find(source => source.id === id)!;
    // Copy only views in this slice; unused and unselected source views must
    // not consume the independent copy's entire eight-view allowance.
    const selected = [...views.values()], source = copyMatrixResource(readMatrixVectorDocument({ ...original, occurrences: selected }));
    copied.set(id, { source, ids: new Map(selected.map((view, index) => [view.id, source.occurrences[index]!.id])) });
  }
  const nextResources = resources.map(source => {
    const views = cuts.get(source.id);
    return views ? withMatrixOccurrences(source, doc, [...views.values()]) : source;
  });
  nextResources.push(...[...copied.values()].map(copy => copy.source));
  const nextSlice = mapSlice(slice, node => {
    const record = records.get(node)!;
    const copy = record.copy ? copied.get(record.source.id) : undefined;
    return node.type.create({ ...node.attrs, clipboardOccurrence: null,
      ...(copy ? { id: newId(), resource: copy.source.id, occurrence: copy.ids.get(record.view.id)! } : {}) }, node.content, node.marks);
  });
  return { resources: nextResources, slice: nextSlice,
    copies: [...copied].map(([source, copy]) => ({ source, resource: copy.source.id })) };
}
