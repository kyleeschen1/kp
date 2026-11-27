/** Ownership is explicit so workers can develop fixtures without importing a
 * sibling application. This is a development boundary, not a release registry. */
export const libraryLanes = [
  { id: 'interaction', app: 'apps/interaction-lab', source: 'src/interaction/', entrypoint: 'src/interaction/public-api.ts', port: 8011 },
  { id: 'mathematics', app: 'apps/mathematics-lab', source: 'src/math-resources/', entrypoint: 'src/math-resources/public-api.ts', port: 8012 },
  { id: 'player', app: 'apps/player-lab', source: 'src/animation-player/', entrypoint: 'src/animation-player/public-api.ts', port: 8013 }
] as const;
export type LibraryLane = typeof libraryLanes[number];

interface Edge { readonly importer: string; readonly target: string }
interface Graph { readonly sourcePaths: readonly string[]; readonly localEdges: readonly Edge[];
  readonly unresolvedLocalReferences: readonly { readonly importer: string; readonly specifier: string }[] }
const hosts = ['apps/', 'src/fraction-notebook/', 'src/editor-chat/', 'src/editor/',
  'src/experiments/', 'src/reader/app/', 'src/internal-studio/', 'src/project-dashboard/', 'server/'];

export function auditLibraryLane(graph: Graph, lane: LibraryLane): readonly string[] {
  const issues: string[] = [], visited = new Set<string>();
  if (!graph.sourcePaths.includes(lane.entrypoint)) return [`Missing lane entrypoint: ${lane.entrypoint}`];
  const edges = new Map<string, string[]>();
  for (const edge of graph.localEdges) edges.set(edge.importer, [...edges.get(edge.importer) ?? [], edge.target]);
  const visit = (path: string) => {
    if (visited.has(path)) return; visited.add(path);
    if (hosts.some(prefix => path.startsWith(prefix))) issues.push(`${lane.id} imports product host: ${path}`);
    if (libraryLanes.some(peer => peer.id !== lane.id && path.startsWith(peer.source))) issues.push(`${lane.id} imports sibling lane: ${path}`);
    for (const missing of graph.unresolvedLocalReferences) if (missing.importer === path)
      issues.push(`${lane.id} has unresolved import: ${path} -> ${missing.specifier}`);
    for (const target of edges.get(path) ?? []) visit(target);
  };
  visit(lane.entrypoint);
  return issues;
}
