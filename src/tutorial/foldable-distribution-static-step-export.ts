import type { KpSampledAnimationFrame } from "../animation/kernel.ts";
import {
  compileKpAnimationTransformationPhaseCohorts
} from "../animation/transformation-phase-cohorts.ts";
import {
  createKpFoldableDistributionEquationAnimationAsset
} from "../animation/foldable-distribution-equation-adapter.ts";
import {
  createKpFoldableDistributionEndpointSpecs
} from "../semantic/foldable-distribution-endpoint-spec.ts";
import {
  selectKpAnimationStaticStepCheckpoints
} from "./static-step-checkpoints.ts";
import {
  renderKpTutorialCardStaticStepSequence,
  type KpTutorialCardStaticStepSequence
} from "./static-step-sequence-renderer.ts";

export interface KpFoldableDistributionStaticStepFrame
  extends KpSampledAnimationFrame {
  readonly planId: "animation.foldable-distribution.collect-like-terms";
  readonly timelineId: "timeline.foldable-distribution.shared";
  readonly state: {
    readonly objectId: string;
    readonly latex: string;
    readonly accessibilityLabel: string;
  };
  readonly completedOperationIds: readonly string[];
  readonly semanticTruth: {
    readonly sourceTraceId: "trace.algebra.foldable-distribution";
    readonly operationIds: readonly string[];
    readonly finalObjectId: "expression.foldable-distribution.collected";
  };
}

export type KpFoldableDistributionStaticStepExport =
  KpTutorialCardStaticStepSequence<KpFoldableDistributionStaticStepFrame>;

/**
 * Static export samples the canonical transformation tree directly. Fold
 * presentation is intentionally absent so collapsed and expanded readers
 * cannot produce different mathematical records.
 */
export function createKpFoldableDistributionStaticStepExport():
  KpFoldableDistributionStaticStepExport {
  const animation = createKpFoldableDistributionEquationAnimationAsset();
  const cohorts = compileKpAnimationTransformationPhaseCohorts(animation);
  const endpoints = createKpFoldableDistributionEndpointSpecs();
  const operationIds = Object.freeze(
    cohorts.flatMap(({ transformationIds }) => transformationIds)
  );

  return renderKpTutorialCardStaticStepSequence({
    artifact: {
      id: "artifact.foldable-distribution.static-steps",
      manifestId: "tutorial.foldable-distribution.card",
      profileId: "export.foldable-distribution.static-steps",
      exportKind: "step-sequence",
      target: "static",
      artifactKind: "static-step-sequence",
      payloadKind: "json-document",
      status: "metadata",
      timelineIds: ["timeline.foldable-distribution.shared"],
      dependencies: {
        phases: ["critical", "optional"],
        capabilityKeys: [
          "kp.semantic:document.read:*:*",
          "kp.equation:render.katex:equation:*",
          "kp.export:render.step-sequence:*:*"
        ],
        assetIds: ["asset.foldable-distribution-equation"]
      },
      fallback: {
        strategy: "static-snapshot",
        preservesLayout: true,
        message:
          "Show the five verified equation checkpoints when motion is unavailable."
      },
      metadata: {
        sourceTraceId: "trace.algebra.foldable-distribution",
        foldInvariant: true,
        checkpointCount: endpoints.length
      }
    },
    checkpoints: selectKpAnimationStaticStepCheckpoints(animation),
    sampler: {
      sample(progress): KpFoldableDistributionStaticStepFrame {
        const bounded = Math.max(0, Math.min(1, progress));
        const completedPhaseCount = Math.min(
          cohorts.length,
          Math.floor(bounded * cohorts.length + Number.EPSILON)
        );
        const endpoint = endpoints[completedPhaseCount]!;
        return {
          progress: bounded,
          planId: "animation.foldable-distribution.collect-like-terms",
          timelineId: "timeline.foldable-distribution.shared",
          state: {
            objectId: endpoint.objectId,
            latex: endpoint.tokens.map(([, latex]) => latex).join(" "),
            accessibilityLabel: endpoint.label
          },
          completedOperationIds: cohorts
            .slice(0, completedPhaseCount)
            .flatMap(({ transformationIds }) => transformationIds),
          semanticTruth: {
            sourceTraceId: "trace.algebra.foldable-distribution",
            operationIds,
            finalObjectId: "expression.foldable-distribution.collected"
          }
        };
      }
    }
  });
}
