import type {
  KatexMotionToken,
  KatexTransitionPlan
} from "./katex-transition-types.ts";

interface MatchCandidate {
  source: KatexMotionToken;
  target: KatexMotionToken;
  score: number;
  targetIndex: number;
}

export interface KatexTokenCorrespondenceOverride {
  readonly sourceTokenId: string;
  readonly targetTokenId: string;
}

export interface KatexTransitionPlanOptions {
  readonly correspondenceMatches?:
    | readonly KatexTokenCorrespondenceOverride[]
    | undefined;
}

export function createKatexTransitionPlan(
  sourceTokens: readonly KatexMotionToken[],
  targetTokens: readonly KatexMotionToken[],
  options: KatexTransitionPlanOptions = {}
): KatexTransitionPlan {
  const matchableSourceTokens = sourceTokens.filter((source) => source.text.length > 0);
  const matchableTargetTokens = targetTokens.filter((target) => target.text.length > 0);
  const matched: Array<{ source: KatexMotionToken; target: KatexMotionToken }> = [];
  const sourceById = new Map(
    matchableSourceTokens.map((source) => [source.id, source])
  );
  const targetById = new Map(
    matchableTargetTokens.map((target) => [target.id, target])
  );
  const usedSources = new Set<string>();
  const usedTargets = new Set<string>();
  let overrideMatchCount = 0;
  let invalidOverrideCount = 0;
  let ambiguousGroupCount = 0;

  for (const override of options.correspondenceMatches ?? []) {
    const source = sourceById.get(override.sourceTokenId);
    const target = targetById.get(override.targetTokenId);

    if (
      source === undefined ||
      target === undefined ||
      usedSources.has(source.id) ||
      usedTargets.has(target.id) ||
      source.text !== target.text
    ) {
      invalidOverrideCount += 1;
      continue;
    }

    matched.push({ source, target });
    usedSources.add(source.id);
    usedTargets.add(target.id);
    overrideMatchCount += 1;
  }

  for (const source of matchableSourceTokens) {
    if (usedSources.has(source.id)) {
      continue;
    }

    const candidates = matchableTargetTokens
      .map((target, targetIndex): MatchCandidate => ({
        source,
        target,
        targetIndex,
        score: scoreCandidate(source, target)
      }))
      .filter((candidate) => candidate.score > 0 && !usedTargets.has(candidate.target.id))
      .sort(compareCandidates);

    if (candidates.length === 0) {
      continue;
    }

    if (
      candidates.length > 1 &&
      candidates[0] !== undefined &&
      candidates[1] !== undefined &&
      candidates[0].score === candidates[1].score
    ) {
      ambiguousGroupCount += 1;
    }

    const best = candidates[0];

    if (best !== undefined) {
      matched.push({ source: best.source, target: best.target });
      usedSources.add(best.source.id);
      usedTargets.add(best.target.id);
    }
  }

  const sourceOnly = matchableSourceTokens
    .filter((source) => !usedSources.has(source.id))
    .map((source) => ({ source }));
  const targetOnly = matchableTargetTokens
    .filter((target) => !usedTargets.has(target.id))
    .map((target) => ({ target }));

  return {
    matched,
    sourceOnly,
    targetOnly,
    diagnostics: {
      sourceTokenCount: matchableSourceTokens.length,
      targetTokenCount: matchableTargetTokens.length,
      matchedCount: matched.length,
      sourceOnlyCount: sourceOnly.length,
      targetOnlyCount: targetOnly.length,
      ambiguousGroupCount,
      overrideMatchCount,
      invalidOverrideCount
    }
  };
}

function scoreCandidate(
  source: KatexMotionToken,
  target: KatexMotionToken
): number {
  if (source.text.length === 0 || target.text.length === 0) {
    return 0;
  }

  if (source.text !== target.text) {
    return 0;
  }

  const signatureScore = source.signature === target.signature ? 100 : 60;
  const rowPenalty = Math.min(Math.abs(source.row - target.row), 6) * 4;

  return Math.max(signatureScore - rowPenalty, 1);
}

function compareCandidates(a: MatchCandidate, b: MatchCandidate): number {
  if (a.score !== b.score) {
    return b.score - a.score;
  }

  return a.targetIndex - b.targetIndex;
}
