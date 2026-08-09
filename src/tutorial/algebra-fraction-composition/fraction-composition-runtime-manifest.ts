import type {
  KpArticleStageManifest
} from "../../article/kp-article-stage-manifest.ts";
import { selectKpVignetteInitialCheckpoint } from
  "../../article/kp-vignette-static-projection.ts";
import {
  fractionCompositionArticleVignetteRelease
} from "../../article/vignettes/fraction-composition-vignette.ts";

const release = fractionCompositionArticleVignetteRelease;
const accessibility = release.accessibility;
if (accessibility === undefined) {
  throw new Error("Fraction composition runtime requires accessibility metadata.");
}

/**
 * Browser activation needs only the already-locked stage contract. The full
 * article parser and KaTeX compiler remain build-only; equality with their
 * projection is enforced by the Article v1 suite.
 */
export const kpFractionCompositionArticleRuntimeManifest:
KpArticleStageManifest = Object.freeze({
  kind: "kp-article-stage-manifest" as const,
  schemaVersion: "kp.article-stage-manifest.v1" as const,
  documentId: "lesson.algebra.fraction-composition.article",
  stageId: "solve",
  fullId: "lesson.algebra.fraction-composition.article#solve",
  release: Object.freeze({
    vignetteId: release.id,
    version: release.version,
    integrity: release.integrity,
    moduleSpecifier: release.moduleSpecifier,
    animationId: release.animationId
  }),
  semantic: Object.freeze({
    objectPaths: release.objectPaths,
    transitionPaths: release.transitionPaths,
    checkpointPaths: release.checkpointPaths
  }),
  accessibility: Object.freeze({
    stageId: "solve",
    fullId: "lesson.algebra.fraction-composition.article#solve",
    accessibleName: accessibility.accessibleName,
    semanticSummary: accessibility.semanticSummary,
    checkpoints: Object.freeze(release.staticProjection!.checkpoints.map(
      (checkpoint) => Object.freeze({
        ...checkpoint,
        fullId:
          `lesson.algebra.fraction-composition.article#solve/${checkpoint.id}`
      })
    )),
    reducedMotionSeeks: Object.freeze(
      release.transitionPaths.map((transitionId) => {
        const transition = release.staticProjection!.transitions.find(
          ({ id }) => id === transitionId
        );
        if (transition === undefined) {
          throw new Error(`Missing reduced-motion range ${transitionId}.`);
        }
        return Object.freeze({
          transitionId,
          fromCheckpointId:
            `lesson.algebra.fraction-composition.article#solve/${transition.from}`,
          toCheckpointId:
            `lesson.algebra.fraction-composition.article#solve/${transition.to}`,
          behavior: "direct-checkpoint-seek" as const
        });
      })
    )
  }),
  activation: Object.freeze({
    policy: "on-demand" as const,
    triggers: Object.freeze(["direct-address", "near-viewport"] as const),
    initialCheckpointId:
      `lesson.algebra.fraction-composition.article#solve/${selectKpVignetteInitialCheckpoint(release).id}`
  })
});
