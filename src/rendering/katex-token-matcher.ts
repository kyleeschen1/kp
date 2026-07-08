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

export function createKatexTransitionPlan(
  sourceTokens: readonly KatexMotionToken[],
  targetTokens: readonly KatexMotionToken[]
): KatexTransitionPlan {
  const matchableSourceTokens = sourceTokens.filter((source) => source.text.length > 0);
  const matchableTargetTokens = targetTokens.filter((target) => target.text.length > 0);
  const matched: Array<{ source: KatexMotionToken; target: KatexMotionToken }> = [];
  const usedTargets = new Set<string>();
  let ambiguousGroupCount = 0;

  for (const source of matchableSourceTokens) {
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
      usedTargets.add(best.target.id);
    }
  }

  const usedSources = new Set(matched.map((match) => match.source.id));
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
      ambiguousGroupCount
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
