import type { KpAnimationAsset } from "../asset.ts";
import {
  createGeneratedProblemAnimationAsset,
  generatedProblemMatrixMatrixCellCount,
  generatedProblemMatrixVectorRowCount
} from "../generated-problem-import.ts";
import { createKpMatrixMatrixSemanticDuration } from "../matrix-matrix-semantic-duration.ts";
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
    const cellCount = generatedProblemMatrixMatrixCellCount(fixture);
    // Compile the full semantic plan only inside this lazy capability; eager
    // catalogs share the smaller arithmetic duration contract.
    const duration = rowCount === undefined
      ? cellCount === undefined
        ? undefined
        : createKpMatrixMatrixSemanticDuration({ id: fixture.id, cellCount })
      : createKpMatrixVectorSemanticDuration({ id: fixture.id, rowCount });
    if (duration !== undefined &&
        animation.timeline?.durationMs !== duration.totalDurationMs) {
      throw new Error(`Matrix semantic duration contract drifted for ${fixture.id}.`);
    }
    return animation;
  });
}
