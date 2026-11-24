import * as M from '../math/authoring/matrices.ts';
import { assertMatrixColumnNumerals } from '../authoring/matrix-columns/numeric-support.ts';
import { columnExampleFromProduct, type ColumnExample } from '../experiments/matrix-column-combinations/model.ts';
import { indexNotebook, NotebookGap, type Binding, type Node, type Notebook, type Reference, type UUID } from './model.ts';

export interface ResolvedBlock {
  readonly key: string;
  readonly source: Reference;
  readonly sourceRevision: number;
  readonly node: Node;
  readonly children: readonly ResolvedBlock[];
  readonly scene?: ColumnExample;
  readonly signature?: string;
  readonly problem?: { readonly code: string; readonly message: string };
}
export const referenceKey = (ref: Reference) => `${ref.notebookId}/${ref.nodeId}`;

/** Resolve ownership and lexical bindings before selecting a presentation.
 * Render occurrence keys do not include organizational section positions. */
export function resolveNotebook(documents: readonly Notebook[], selected: UUID) {
  const docs = new Map(documents.map(d => [d.id, { doc: d, ...indexNotebook(d) }]));
  const current = docs.get(selected);
  if (!current) throw new NotebookGap('missing-notebook', selected, 'Notebook is unavailable.');
  const matrices = new Map<string, ReturnType<typeof M.matrix>>();
  const dependents = new Map<string, Set<string>>();
  let expanded = 0;
  const dependency = (ref: Reference, occurrence: string) => {
    const key = referenceKey(ref), set = dependents.get(key) ?? new Set<string>(); set.add(occurrence); dependents.set(key, set);
  };
  const get = (ref: Reference): Node => docs.get(ref.notebookId)?.nodes.get(ref.nodeId)
    ?? fail('missing-reference', referenceKey(ref), 'The referenced resource is unavailable or was deleted.');
  const matrix = (ref: Reference, occurrence: string) => {
    dependency(ref, occurrence); const n = get(ref);
    if (n.type !== 'matrix') return fail('binding-type', n.id, 'This input requires a matrix resource.');
    const key = referenceKey(ref); let value = matrices.get(key);
    if (!value) { value = M.matrix(key, n.rows); matrices.set(key, value); }
    return { value, identity: key, rows: n.rows };
  };
  const visit = (node: Node, owner: UUID, prefix: string, scope: ReadonlyMap<UUID, Reference>, trail: ReadonlySet<string>, overrides?: Readonly<Record<string, Reference>>): ResolvedBlock => {
    const source = { notebookId: owner, nodeId: node.id }, key = `${prefix}${node.id}`, identity = referenceKey(source);
    const base = { key, source, sourceRevision: docs.get(owner)!.doc.revision, node };
    dependency(source, key);
    try {
      if (++expanded > 4000 || trail.size >= 64) fail('expansion-limit', identity, 'Import expansion exceeds this notebook proof capacity.');
      if (trail.has(identity)) fail('reference-cycle', identity, 'Import would recursively contain itself.');
      const nextTrail = new Set(trail).add(identity);
      if (node.type === 'import') {
        const target = get(node.source); dependency(node.source, key);
        if (target.type !== 'component' && Object.keys(node.bindings).length) fail('binding-type', node.id, 'Only components declare inputs.');
        // Imports close over their definition, never the importing notebook's scope.
        return { ...base, children: [visit(target, node.source.notebookId, `${key}/`, new Map(), nextTrail, node.bindings)] };
      }
      if (node.type === 'component') {
        const local = new Map<UUID, Reference>();
        for (const input of node.inputs) local.set(input.id, overrides?.[input.id] ?? input.default);
        for (const inputId of Object.keys(overrides ?? {})) if (!node.inputs.some(i => i.id === inputId))
          fail('unknown-input', inputId, 'This binding targets an input no longer exported by the component.');
        for (const ref of local.values()) matrix(ref, key);
        return { ...base, children: node.children.map(n => visit(n, owner, prefix, local, nextTrail)) };
      }
      if (node.type === 'section') return { ...base, children: node.children.map(n => visit(n, owner, prefix, scope, nextTrail)) };
      if (node.type === 'scene') {
        const bound = (binding: Binding) => binding.kind === 'resource' ? binding.source : scope.get(binding.inputId)
          ?? fail('unbound-input', binding.inputId, 'Scene input is outside its component scope.');
        const left = matrix(bound(node.left), key), right = matrix(bound(node.right), key);
        assertMatrixColumnNumerals(left.rows, right.rows);
        const product = M.product({ id: `${identity}.product`, left: left.value, right: right.value });
        const scene = columnExampleFromProduct(product, node.column);
        // Source revisions are intentionally absent: unrelated prose/title edits
        // must not destroy a running scene with identical semantic inputs.
        const signature = JSON.stringify([node.renderer, node.column, left.identity, left.rows, right.identity, right.rows]);
        return { ...base, scene, signature, children: [] };
      }
      return { ...base, children: [] };
    } catch (error) {
      return { ...base, children: [], problem: { code: error instanceof NotebookGap ? error.code : 'unsupported-scene', message: error instanceof Error ? error.message : String(error) } };
    }
  };
  const blocks = current.doc.children.map(n => visit(n, selected, '', new Map(), new Set()));
  return { blocks, dependents };
}
function fail(code: string, path: string, message: string): never { throw new NotebookGap(code, path, message); }
export function flattenBlocks(blocks: readonly ResolvedBlock[]): readonly ResolvedBlock[] {
  return blocks.flatMap(b => [b, ...flattenBlocks(b.children)]);
}
