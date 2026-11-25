import type { PreparedCommand } from './registry.ts';

function score(label: string, term: string): number {
  if (label === term) return 0;
  if (label.startsWith(term)) return 1;
  if (label.includes(term)) return 2;
  let cursor = 0, first = -1, last = 0;
  for (const letter of term) {
    const index = label.indexOf(letter, cursor); if (index < 0) return Infinity;
    if (first < 0) first = index; last = index; cursor = index + 1;
  }
  return 3 + (last - first - term.length + 1) / Math.max(1, label.length);
}
/** Space-separated terms narrow in any order. All matches stay navigable. */
export function matchCommands(commands: readonly PreparedCommand[], query: string, recent: readonly string[] = []): PreparedCommand[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return commands.map((command, index) => {
    const title = command.title.toLowerCase(), detail = `${command.category} ${command.id} ${command.description ?? ''} ${command.keywords?.join(' ') ?? ''}`.toLowerCase();
    return { command, index, rank: terms.reduce((sum, term) => sum + Math.min(score(title, term), detail.includes(term) ? 4 : Infinity,
      ...(command.keywords?.map(alias => 3 + score(alias.toLowerCase(), term)) ?? [])), 0),
      enabled: command.state().enabled, recent: recent.includes(command.id) ? recent.indexOf(command.id) : Infinity };
  }).filter(value => Number.isFinite(value.rank)).sort((a, b) => a.rank - b.rank || Number(b.enabled) - Number(a.enabled) || a.recent - b.recent || a.index - b.index).map(value => value.command);
}
export function commandMatchPositions(title: string, query: string): ReadonlySet<number> {
  const result = new Set<number>(), lower = title.toLowerCase();
  for (const term of query.trim().toLowerCase().split(/\s+/).filter(Boolean)) {
    let cursor = 0; const positions: number[] = [];
    for (const letter of term) { const index = lower.indexOf(letter, cursor); if (index < 0) break; positions.push(index); cursor = index + 1; }
    if (positions.length === term.length) for (const position of positions) result.add(position);
  }
  return result;
}
