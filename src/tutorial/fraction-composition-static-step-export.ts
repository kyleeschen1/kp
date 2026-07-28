import type { KpSampledAnimationFrame } from "../animation/kernel.ts";
import {
  createKpFractionCompositionEquationAnimationAsset
} from "../animation/fraction-composition-equation-adapter.ts";
import {
  compileKpAnimationTransformationPhaseCohorts
} from "../animation/transformation-phase-cohorts.ts";
import {
  createKpFractionCompositionEndpointSpecs
} from "../semantic/fraction-composition-endpoint-spec.ts";
import {
  selectKpAnimationStaticStepCheckpoints
} from "./static-step-checkpoints.ts";
import {
  renderKpTutorialCardStaticStepSequence,
  type KpTutorialCardStaticStepSequence
} from "./static-step-sequence-renderer.ts";

export interface KpFractionCompositionStaticStepFrame
  extends KpSampledAnimationFrame {
  readonly planId: "animation.fraction-composition.two-thirds-solve";
  readonly timelineId: "timeline.fraction-composition.shared";
  readonly state: {
    readonly objectId: string;
    readonly latex: string;
    readonly accessibilityLabel: string;
  };
  readonly completedOperationIds: readonly string[];
  readonly semanticTruth: {
    readonly sourceTraceId:
      "macro.fraction.two-thirds-x-plus-six-equals-ten";
    readonly operationIds: readonly string[];
    readonly finalObjectId: "fraction-solve.state.solved";
    readonly exactSolution: {
      readonly numerator: "9";
      readonly denominator: "1";
    };
  };
}

export type KpFractionCompositionStaticStepExport =
  KpTutorialCardStaticStepSequence<KpFractionCompositionStaticStepFrame>;

/**
 * Export consumes the canonical tree rather than a fold projection, so every
 * presentation mode emits the same fourteen exact equation truths.
 */
export function createKpFractionCompositionStaticStepExport():
  KpFractionCompositionStaticStepExport {
  const animation = createKpFractionCompositionEquationAnimationAsset();
  const cohorts = compileKpAnimationTransformationPhaseCohorts(animation);
  const endpoints = createKpFractionCompositionEndpointSpecs();
  const operationIds = Object.freeze(
    cohorts.flatMap(({ transformationIds }) => transformationIds)
  );

  return renderKpTutorialCardStaticStepSequence({
    artifact: {
      id: "artifact.fraction-composition.static-steps",
      manifestId: "tutorial.fraction-composition.card",
      profileId: "export.fraction-composition.static-steps",
      exportKind: "step-sequence",
      target: "static",
      artifactKind: "static-step-sequence",
      payloadKind: "json-document",
      status: "metadata",
      timelineIds: ["timeline.fraction-composition.shared"],
      dependencies: {
        phases: ["critical", "optional"],
        capabilityKeys: [
          "kp.semantic:document.read:*:*",
          "kp.equation:render.katex:equation:*",
          "kp.export:render.step-sequence:*:*"
        ],
        assetIds: ["asset.fraction-composition-equation"]
      },
      fallback: {
        strategy: "static-snapshot",
        preservesLayout: true,
        message:
          "Show all fourteen certified equation states when motion is unavailable."
      },
      metadata: {
        sourceTraceId:
          "macro.fraction.two-thirds-x-plus-six-equals-ten",
        foldInvariant: true,
        checkpointCount: endpoints.length
      }
    },
    checkpoints: selectKpAnimationStaticStepCheckpoints(animation),
    sampler: {
      sample(progress): KpFractionCompositionStaticStepFrame {
        const bounded = Math.max(0, Math.min(1, progress));
        const completedPhaseCount = Math.min(
          cohorts.length,
          Math.floor(bounded * cohorts.length + Number.EPSILON)
        );
        const endpoint = endpoints[completedPhaseCount]!;
        return {
          progress: bounded,
          planId: "animation.fraction-composition.two-thirds-solve",
          timelineId: "timeline.fraction-composition.shared",
          state: {
            objectId: endpoint.stateId,
            latex: endpoint.segments.map(({ latex }) => latex).join(""),
            accessibilityLabel: endpoint.accessibleText
          },
          completedOperationIds: cohorts
            .slice(0, completedPhaseCount)
            .flatMap(({ transformationIds }) => transformationIds),
          semanticTruth: {
            sourceTraceId:
              "macro.fraction.two-thirds-x-plus-six-equals-ten",
            operationIds,
            finalObjectId: "fraction-solve.state.solved",
            exactSolution: { numerator: "9", denominator: "1" }
          }
        };
      }
    }
  });
}
