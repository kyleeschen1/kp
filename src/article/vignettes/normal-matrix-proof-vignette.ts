import { createKpVignetteRelease } from "../kp-article-import-lock.ts";
import {
  kpNormalMatrixProofCheckpoints,
  type KpNormalMatrixProofCheckpointId
} from "../../semantic/normal-matrix-proof-checkpoints.ts";
import { kpNormalMatrixProofTransformationPaths } from
  "../../semantic/normal-matrix-proof-operations.ts";
import { kpNormalMatrixProofObjectPaths } from
  "../../semantic/normal-matrix-proof-semantics.ts";

export const kpNormalMatrixProofVignetteRelease = createKpVignetteRelease({
  schemaVersion: "kp.vignette-release.v1",
  id: "vignette.linear-algebra.normal-matrix-proof",
  version: "1.0.0",
  integrity: "sha256:b1df9de21f68d619b69f83de71b13111d365a8859e1ad85df70d67a520323c7a",
  moduleSpecifier: "../../semantic/normal-matrix-proof-animation-asset.ts",
  animationId: "animation.linear-algebra.normal-matrix-proof",
  objectPaths: kpNormalMatrixProofObjectPaths,
  transitionPaths: kpNormalMatrixProofTransformationPaths,
  checkpointPaths: kpNormalMatrixProofCheckpoints.map(({ id }) => id),
  accessibility: {
    accessibleName: "Why a normal matrix becomes block diagonal",
    semanticSummary:
      "The first row contributes an extra squared norm that the sparse first column does not; normality forces that row remainder to zero and leaves a smaller normal block.",
    reducedMotion: "direct-checkpoint-seek"
  },
  staticProjection: {
    checkpoints: kpNormalMatrixProofCheckpoints.map((checkpoint) => ({
      id: checkpoint.id,
      label: checkpoint.label,
      alt: checkpoint.accessibleDescription,
      caption: checkpoint.learnerQuestion,
      assetPath: `./kp-static/normal-matrix-proof-${checkpoint.id}.svg`
    })),
    transitions: [
      transition("interpret-left-first-entry", "statement", "row-column-norms"),
      transition("interpret-right-first-entry", "statement", "row-column-norms"),
      transition("choose-eigenvector-first-basis", "row-column-norms", "eigenbasis"),
      transition("compare-first-entries", "eigenbasis", "norm-equation"),
      transition("force-row-remainder-zero", "norm-equation", "remainder-zero"),
      transition("restrict-normality-to-lower-block", "remainder-zero", "recursion")
    ]
  }
});

export const kpNormalMatrixProofVignetteRegistry = Object.freeze([
  kpNormalMatrixProofVignetteRelease
]);

function transition(
  id: typeof kpNormalMatrixProofTransformationPaths[number],
  from: KpNormalMatrixProofCheckpointId,
  to: KpNormalMatrixProofCheckpointId
) {
  return Object.freeze({ id, from, to });
}
