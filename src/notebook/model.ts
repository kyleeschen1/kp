/** Document identity is independent of position, display names and runtime mounts. */
declare const uuidBrand: unique symbol;
export type UUID = string & { readonly [uuidBrand]: true };
export type Json = null | boolean | number | string | readonly Json[] | { readonly [key: string]: Json };
export type Metadata = Readonly<Record<string, Json>>;
export type Matrix2 = readonly [readonly [number, number], readonly [number, number]];
export interface Reference { readonly notebookId: UUID; readonly nodeId: UUID }
export type Binding = { readonly kind: 'resource'; readonly source: Reference }
  | { readonly kind: 'input'; readonly inputId: UUID };
export interface Input { readonly id: UUID; readonly name: string; readonly default: Reference }
interface Base { readonly id: UUID; readonly title: string; readonly metadata: Metadata }
export type Node = Base & (
  | { readonly type: 'section'; readonly children: readonly Node[] }
  | { readonly type: 'prose'; readonly text: string }
  | { readonly type: 'matrix'; readonly rows: Matrix2 }
  | { readonly type: 'component'; readonly inputs: readonly Input[]; readonly children: readonly Node[] }
  | { readonly type: 'scene'; readonly renderer: 'matrix-columns'; readonly left: Binding; readonly right: Binding; readonly column: 0 | 1 }
  | { readonly type: 'import'; readonly source: Reference; readonly policy: 'live'; readonly bindings: Readonly<Record<string, Reference>> }
);
export interface Notebook {
  readonly schemaVersion: 1; readonly id: UUID; readonly revision: number;
  readonly title: string; readonly children: readonly Node[];
}
export class NotebookGap extends Error {
  readonly code: string;
  readonly path: string;
  constructor(code: string, path: string, message: string) {
    super(`${path}: ${message}`); this.name = 'NotebookGap'; this.code = code; this.path = path;
  }
}
export function uuid(value: unknown, path = 'id'): UUID {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
    throw new NotebookGap('invalid-uuid', path, 'Expected a persistent UUID.');
  return value.toLowerCase() as UUID;
}
export const newId = (): UUID => uuid(crypto.randomUUID());
export const childrenOf = (node: Node): readonly Node[] => 'children' in node ? node.children : [];
export function indexNotebook(doc: Notebook) {
  const nodes = new Map<UUID, Node>();
  const parents = new Map<UUID, UUID>();
  const visit = (children: readonly Node[], parent: UUID) => {
    for (const node of children) {
      nodes.set(node.id, node); parents.set(node.id, parent);
      visit(childrenOf(node), node.id);
    }
  };
  visit(doc.children, doc.id); return { nodes, parents };
}
