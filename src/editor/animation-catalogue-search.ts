import type {
  KpAnimationCatalogueEntry
} from "./animation-catalogue-projection.ts";

export function searchKpAnimationCatalogueEntries(input: {
  readonly entries: readonly KpAnimationCatalogueEntry[];
  readonly query: string;
  readonly selectedAnimationId?: string | undefined;
}): readonly KpAnimationCatalogueEntry[] {
  const tokens = normalize(input.query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return selectedFirst(input.entries, input.selectedAnimationId);
  }

  return input.entries
    .map((entry) => ({
      entry,
      score: scoreEntry(entry, tokens)
    }))
    .filter((result): result is {
      entry: KpAnimationCatalogueEntry;
      score: number;
    } => result.score !== undefined)
    .sort((left, right) =>
      left.score - right.score ||
      left.entry.title.localeCompare(right.entry.title) ||
      left.entry.animationId.localeCompare(right.entry.animationId)
    )
    .map(({ entry }) => entry);
}

function scoreEntry(
  entry: KpAnimationCatalogueEntry,
  tokens: readonly string[]
): number | undefined {
  const terms = entry.searchTerms.map(normalize);
  let total = 0;

  for (const token of tokens) {
    const scores = terms.flatMap((term) => {
      const score = scoreToken(term, token);
      return score === undefined ? [] : [score];
    });
    if (scores.length === 0) return undefined;
    total += Math.min(...scores);
  }

  return total;
}

function scoreToken(term: string, token: string): number | undefined {
  if (term === token) return 0;
  if (term.startsWith(token)) return 10 + term.length - token.length;
  const substringIndex = term.indexOf(token);
  if (substringIndex >= 0) return 30 + substringIndex;

  let bestSpan: number | undefined;
  for (let start = 0; start < term.length; start += 1) {
    if (term[start] !== token[0]) continue;
    let tokenIndex = 1;
    for (let termIndex = start + 1; termIndex < term.length; termIndex += 1) {
      if (term[termIndex] !== token[tokenIndex]) continue;
      tokenIndex += 1;
      if (tokenIndex === token.length) {
        const span = termIndex - start + 1;
        bestSpan = Math.min(bestSpan ?? span, span);
        break;
      }
    }
  }
  // A bounded gap permits missing characters without matching unrelated prose.
  if (bestSpan === undefined || bestSpan > token.length + 4) return undefined;
  return 60 + bestSpan - token.length;
}

function selectedFirst(
  entries: readonly KpAnimationCatalogueEntry[],
  selectedAnimationId: string | undefined
): readonly KpAnimationCatalogueEntry[] {
  if (selectedAnimationId === undefined) return entries;
  const selected = entries.find(
    ({ animationId }) => animationId === selectedAnimationId
  );
  if (selected === undefined) return entries;
  return [
    selected,
    ...entries.filter(({ animationId }) => animationId !== selectedAnimationId)
  ];
}

function normalize(value: string): string {
  return value.normalize("NFKD").toLocaleLowerCase();
}
