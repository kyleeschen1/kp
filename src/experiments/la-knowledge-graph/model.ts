export interface RecordNode {
  id: string;
  title: string;
  body: string;
  kind: string;
  book: string;
  evidence: string;
  format: string;
  context: string;
  source?: string;
  locator?: string;
  url?: string;
  assumptions?: string[];
  steps?: string[];
}
export interface RecordEdge {
  source: string;
  target: string;
  relation: string;
  evidence: string;
  anchor?: string;
}
export interface Book {
  id: string;
  title: string;
  author: string;
  url: string;
  license: string;
  licenseUrl: string;
  format: string;
}
export interface Corpus {
  nodes: RecordNode[];
  edges: RecordEdge[];
  books: Book[];
  limitations: string[];
  unresolved: { source: string; anchor?: string; candidates?: string[] }[];
  diagnostics: { book: string; source: string; issue: string }[];
}
export interface Interpretation {
  nodes: RecordNode[];
  edges: RecordEdge[];
  note: string;
}

export function makeIndex(nodes: RecordNode[], edges: RecordEdge[]) {
  const byId = new Map(nodes.map(node => [node.id, node]));
  if (byId.size !== nodes.length) throw new Error('Duplicate graph identity');
  const adjacency = new Map<string, RecordEdge[]>();
  for (const edge of edges) {
    if (!byId.has(edge.source) || !byId.has(edge.target)) throw new Error('Dangling graph edge');
    for (const id of new Set([edge.source, edge.target])) {
      const list = adjacency.get(id) ?? [];
      list.push(edge);
      adjacency.set(id, list);
    }
  }
  return { byId, adjacency };
}
