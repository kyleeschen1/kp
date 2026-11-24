import { NotebookGap, uuid, type Binding, type Json, type Matrix2, type Metadata, type Node, type Notebook, type Reference, type UUID } from './model.ts';

function fail(path: string, message: string): never { throw new NotebookGap('invalid-document', path, message); }
function object(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail(path, 'Expected a plain data object.');
  const entries: [string, unknown][] = [];
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    if (typeof key !== 'string' || !descriptor.enumerable || !('value' in descriptor)) fail(path, 'Executable accessors and hidden fields are not document data.');
    entries.push([key, descriptor.value]);
  }
  return Object.fromEntries(entries);
}
function fields(value: Record<string, unknown>, allowed: readonly string[], path: string) {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail(`${path}.${key}`, 'Unsupported field.');
}
function text(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length > 100_000) fail(path, 'Expected bounded text.'); return value;
}
function list(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > 2000) fail(path, 'Expected a bounded plain array.');
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    if (typeof key !== 'string' || !('value' in descriptor) || (key !== 'length' && (!/^(0|[1-9]\d*)$/.test(key) || !descriptor.enumerable))) fail(path, 'Expected data entries without accessors.');
  }
  for (let i = 0; i < value.length; i++) if (!Object.hasOwn(value, i)) fail(path, 'Sparse arrays are not supported.');
  return value;
}
function json(value: unknown, path: string, depth = 0): Json {
  if (depth > 12) fail(path, 'Metadata is too deeply nested.');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return list(value, path).map(v => json(v, path, depth + 1));
  return Object.fromEntries(Object.entries(object(value, path)).map(([k, v]) => [k, json(v, `${path}.${k}`, depth + 1)]));
}
export function metadata(value: unknown, path = 'metadata'): Metadata {
  return Object.fromEntries(Object.entries(object(value, path)).map(([key, v]) => {
    if (!/^[a-z][a-z0-9.-]*:[a-zA-Z0-9._-]+$/.test(key)) fail(path, 'Metadata keys need a namespace, such as kp:goal.');
    return [key, json(v, `${path}.${key}`)];
  }));
}
export function matrix2(value: unknown, path = 'matrix'): Matrix2 {
  const rows = list(value, path);
  const row = (v: unknown): readonly [number, number] => {
    const r = list(v, path);
    if (r.length !== 2 || typeof r[0] !== 'number' || typeof r[1] !== 'number' || !r.every(Number.isFinite))
      fail(path, 'Expected two finite numerical entries.');
    return [r[0], r[1]];
  };
  if (rows.length !== 2) fail(path, 'Only two by two matrices are supported.');
  return [row(rows[0]), row(rows[1])];
}
function reference(value: unknown, path: string): Reference {
  const v = object(value, path); fields(v, ['notebookId', 'nodeId'], path);
  return { notebookId: uuid(v['notebookId'], path), nodeId: uuid(v['nodeId'], path) };
}
function binding(value: unknown, path: string): Binding {
  const v = object(value, path);
  if (v['kind'] === 'input') { fields(v, ['kind', 'inputId'], path); return { kind: 'input', inputId: uuid(v['inputId'], path) }; }
  if (v['kind'] === 'resource') { fields(v, ['kind', 'source'], path); return { kind: 'resource', source: reference(v['source'], path) }; }
  return fail(path, 'Expected an explicit resource or component input binding.');
}

export function parseNotebook(value: unknown): Notebook {
  const doc = object(value, 'notebook'); fields(doc, ['schemaVersion', 'id', 'revision', 'title', 'children'], 'notebook');
  if (doc['schemaVersion'] !== 1) fail('schemaVersion', 'Unsupported notebook schema; preserve the original file.');
  if (typeof doc['revision'] !== 'number' || !Number.isSafeInteger(doc['revision']) || doc['revision'] < 0)
    fail('revision', 'Expected a nonnegative safe integer.');
  const id = uuid(doc['id']); const seen = new Set<UUID>([id]); let count = 0;
  const unique = (value: unknown, path: string) => {
    const id = uuid(value, path); if (seen.has(id)) fail(path, 'Duplicate identity.'); seen.add(id); return id;
  };
  const parse = (value: unknown, path: string, depth: number): Node => {
    if (++count > 2000 || depth > 32) fail(path, 'Notebook structure exceeds the bounded editor capacity.');
    const v = object(value, path), type = v['type'];
    const base = { id: unique(v['id'], path), title: text(v['title'], path), metadata: metadata(v['metadata'], `${path}.metadata`) };
    const common = ['id', 'type', 'title', 'metadata'];
    const children = () => list(v['children'], path).map((child, i) => parse(child, `${path}.children[${i}]`, depth + 1));
    switch (type) {
      case 'section': fields(v, [...common, 'children'], path); return { ...base, type, children: children() };
      case 'component': {
        fields(v, [...common, 'children', 'inputs'], path);
        const names = new Set<string>();
        const inputs = list(v['inputs'], path).map((input, i) => {
          const p = `${path}.inputs[${i}]`, x = object(input, p); fields(x, ['id', 'name', 'default'], p);
          const name = text(x['name'], p);
          if (!name.trim() || names.has(name)) fail(p, 'Input names must be nonempty and unique within the component.'); names.add(name);
          return { id: unique(x['id'], p), name, default: reference(x['default'], p) };
        });
        return { ...base, type, inputs, children: children() };
      }
      case 'prose': fields(v, [...common, 'text'], path); return { ...base, type, text: text(v['text'], path) };
      case 'matrix': fields(v, [...common, 'rows'], path); return { ...base, type, rows: matrix2(v['rows'], path) };
      case 'scene':
        fields(v, [...common, 'renderer', 'left', 'right', 'column'], path);
        if (v['renderer'] !== 'matrix-columns' || (v['column'] !== 0 && v['column'] !== 1)) fail(path, 'Unsupported renderer or column.');
        return { ...base, type, renderer: v['renderer'], column: v['column'], left: binding(v['left'], path), right: binding(v['right'], path) };
      case 'import': {
        fields(v, [...common, 'source', 'policy', 'bindings'], path);
        if (v['policy'] !== 'live') fail(path, 'This authoring proof supports live imports only.');
        const bindings = Object.fromEntries(Object.entries(object(v['bindings'], path)).map(([key, v]) => [uuid(key, path), reference(v, path)]));
        return { ...base, type, source: reference(v['source'], path), policy: 'live', bindings };
      }
      default: return fail(path, `Unsupported block type ${String(type)}; original data must not be overwritten.`);
    }
  };
  return { schemaVersion: 1, id, revision: doc['revision'], title: text(doc['title'], 'title'), children: list(doc['children'], 'children').map((v, i) => parse(v, `children[${i}]`, 0)) };
}
export function parseWorkspace(value: unknown): readonly Notebook[] {
  const docs = list(value, 'workspace').map(parseNotebook), seen = new Set<UUID>();
  const visit = (id: UUID) => { if (seen.has(id)) fail(id, 'Identity is already owned by another notebook.'); seen.add(id); };
  const nodes = (items: readonly Node[]) => { for (const n of items) { visit(n.id); if (n.type === 'component') n.inputs.forEach(i => visit(i.id)); if ('children' in n) nodes(n.children); } };
  for (const doc of docs) { visit(doc.id); nodes(doc.children); }
  return docs;
}
