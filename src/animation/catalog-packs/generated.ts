import type { KpAnimationAsset } from "../asset.ts";
import {
  createGeneratedProblemAnimationAsset,
  generatedProblemMatrixVectorRowCount
} from "../generated-problem-import.ts";
import { createKpMatrixVectorSemanticDuration } from "../matrix-vector-semantic-duration.ts";
import {
  createGeneratedCalculusProblemFixtures
} from "../../semantic/generated-calculus-problem-fixture.ts";
import {
  createGeneratedLinearAlgebraProblemFixtures
} from "../../semantic/generated-linear-algebra-problem-fixture.ts";

export function createKpGeneratedProblemAnimationPack():
  readonly KpAnimationAsset[] {
  return [
    ...createGeneratedCalculusProblemFixtures(),
    ...createGeneratedLinearAlgebraProblemFixtures()
  ].map((fixture) => {
    const animation = createGeneratedProblemAnimationAsset(fixture);
    const rowCount = generatedProblemMatrixVectorRowCount(fixture);
    if (rowCount === undefined) return animation;

    // Full semantic compilation stays inside this lazy capability; the eager
    // dashboard catalog shares only the arithmetic duration contract.
    const duration = createKpMatrixVectorSemanticDuration({
      id: fixture.id,
      rowCount
    });
    if (animation.timeline?.durationMs !== duration.totalDurationMs) {
      throw new Error(`Matrix-vector duration contract drifted for ${fixture.id}.`);
    }
    return animation;
  });
}
