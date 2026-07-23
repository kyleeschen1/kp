export interface KpFuzzyQueryField {
  readonly value: string;
  readonly weight?: number;
}

export interface KpFuzzyQueryScore {
  readonly score: number;
  readonly matchedValues: readonly string[];
}

export function scoreKpFuzzyQuery(
  fields: readonly KpFuzzyQueryField[],
  query: string
): KpFuzzyQueryScore | undefined {
  const normalizedQuery = normalizeKpFuzzySearchText(query);
  if (normalizedQuery === "") {
    return { score: 0, matchedValues: [] };
  }
  const normalizedFields = fields.map((field) => ({
    value: field.value,
    normalized: normalizeKpFuzzySearchText(field.value),
    weight: field.weight ?? 1
  }));
  const directMatches = normalizedFields
    .filter((field) => field.normalized.includes(normalizedQuery))
    .sort(
      (left, right) =>
        right.weight - left.weight ||
        left.normalized.localeCompare(right.normalized)
    );
  if (directMatches[0] !== undefined) {
    return {
      score: 60 * directMatches[0].weight + 40,
      matchedValues: [directMatches[0].value]
    };
  }
  const terms = normalizedQuery.split(" ");
  const matchedValues: string[] = [];
  let score = 0;

  for (const term of terms) {
    const matches = normalizedFields.flatMap((field) => {
      const fieldScore = scoreTerm(field.normalized, term);
      return fieldScore === undefined
        ? []
        : [{ ...field, score: fieldScore * field.weight }];
    });
    matches.sort(
      (left, right) =>
        right.score - left.score ||
        left.normalized.localeCompare(right.normalized)
    );
    const best = matches[0];
    if (best === undefined) return undefined;
    score += best.score;
    matchedValues.push(best.value);
  }

  if (
    normalizedFields.some((field) => field.normalized === normalizedQuery)
  ) {
    score += 40;
  }
  return { score, matchedValues: unique(matchedValues) };
}

export function kpFuzzyQueryMatches(
  fields: readonly string[],
  query: string
): boolean {
  return (
    scoreKpFuzzyQuery(
      fields.map((value) => ({ value })),
      query
    ) !== undefined
  );
}

export function normalizeKpFuzzySearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function scoreTerm(field: string, term: string): number | undefined {
  if (field === term) return 100;
  if (term.length < 3) return field.includes(term) ? 60 : undefined;
  return fuzzyTermMatches(field, term) ? 30 : undefined;
}

function fuzzyTermMatches(field: string, term: string): boolean {
  if (term.length < 3) {
    return field.includes(term);
  }

  let fieldIndex = 0;
  let firstMatch = -1;
  let lastMatch = -1;

  for (const character of term) {
    const nextIndex = field.indexOf(character, fieldIndex);
    if (nextIndex === -1) return false;
    if (firstMatch === -1) firstMatch = nextIndex;
    lastMatch = nextIndex;
    fieldIndex = nextIndex + 1;
  }

  const span = lastMatch - firstMatch + 1;
  const maxSpan = term.length + Math.max(2, Math.floor(term.length / 2));
  const wordLength = containingWordLength(field, firstMatch, lastMatch);
  return span <= maxSpan && wordLength <= term.length + 4;
}

function containingWordLength(
  field: string,
  firstMatch: number,
  lastMatch: number
): number {
  let start = firstMatch;
  let end = lastMatch;
  while (start > 0 && isSearchWordCharacter(field[start - 1] ?? "")) start -= 1;
  while (
    end + 1 < field.length &&
    isSearchWordCharacter(field[end + 1] ?? "")
  ) {
    end += 1;
  }
  return end - start + 1;
}

function isSearchWordCharacter(character: string): boolean {
  return /[a-z0-9]/.test(character);
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}
