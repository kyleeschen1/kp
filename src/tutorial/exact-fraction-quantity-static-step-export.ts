import type { KpSampledAnimationFrame } from "../animation/kernel.ts";
import {
  createKpExactFractionQuantityAnimationAsset,
  kpExactFractionQuantityAnimationId
} from "../animation/exact-fraction-quantity-adapter.ts";
import {
  sampleKpExactFractionQuantityNeutralFrame
} from "../animation/exact-fraction-quantity-neutral-frame.ts";
import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../reader/compiler/exact-fraction-quantity-preservation-manifest.ts";
import {
  createKpExactFractionQuantityTrace
} from "../semantic/exact-fraction-quantity-trace.ts";
import {
  createKpExactFractionQuantityAccessibleProjection
} from "../rendering/exact-fraction-quantity-accessible-projection.ts";
import {
  projectKpExactFractionQuantityBar,
  renderKpExactFractionQuantityBarSvg
} from "../rendering/exact-fraction-quantity-bar-projection.ts";
import {
  projectKpExactFractionQuantityCircle,
  renderKpExactFractionQuantityCircleSvg
} from "../rendering/exact-fraction-quantity-circle-projection.ts";
import {
  projectKpExactFractionQuantityNumberLine,
  renderKpExactFractionQuantityNumberLineSvg
} from "../rendering/exact-fraction-quantity-number-line-projection.ts";
import {
  renderKpTutorialCardStaticStepSequence,
  type KpTutorialCardStaticStepSequence
} from "./static-step-sequence-renderer.ts";

export interface KpExactFractionQuantityStaticStepFrame
  extends KpSampledAnimationFrame {
  readonly planId: typeof kpExactFractionQuantityAnimationId;
  readonly timelineId:
    "timeline.exact-fraction-quantity.third-plus-sixth.shared";
  readonly state: {
    readonly stateId: string;
    readonly checkpointId: string;
    readonly activeOperationId: string;
    readonly accessibleMath: string;
    readonly description: string;
  };
  readonly representations: {
    readonly symbolic: {
      readonly latex: string;
      readonly htmlAndMathml: string;
      readonly accessibilityLabel: string;
    };
    readonly partitionedCircle: {
      readonly svg: string;
      readonly accessibilityLabel: string;
    };
    readonly fractionBar: {
      readonly svg: string;
      readonly accessibilityLabel: string;
    };
    readonly numberLine: {
      readonly svg: string;
      readonly accessibilityLabel: string;
    };
  };
  readonly completedOperationIds: readonly string[];
  readonly focusSelectionIds: readonly string[];
  readonly transcriptRefIds: readonly string[];
  readonly semanticTruth: {
    readonly sourceTraceId:
      "trace.exact-fraction-quantity.third-plus-sixth";
    readonly unitId: "unit.exact-fraction-quantity.one-whole";
    readonly operationIds: readonly string[];
    readonly stateIds: readonly string[];
    readonly finalValue: "1/2";
    readonly finalEqualityVerified: true;
  };
}

export type KpExactFractionQuantityStaticStepExport =
  KpTutorialCardStaticStepSequence<
    KpExactFractionQuantityStaticStepFrame
  >;

/**
 * This export samples settled semantic checkpoints, never animation paint.
 * Consequently no fold, active view, browser, or motion preference can omit a
 * causal operation or change the mathematical record.
 */
export function createKpExactFractionQuantityStaticStepExport():
KpExactFractionQuantityStaticStepExport {
  const animation = createKpExactFractionQuantityAnimationAsset();
  const staticTarget = animation.exportTargets.find(
    ({ kind }) => kind === "static-step"
  );
  if (
    staticTarget?.artifactId !==
      "artifact.exact-fraction-quantity.static-checkpoints"
  ) {
    throw new Error(
      "Exact-fraction static exporter is detached from its asset target."
    );
  }
  const trace = createKpExactFractionQuantityTrace();
  const accessibility =
    createKpExactFractionQuantityAccessibleProjection({ trace });
  const operationIds = Object.freeze(
    trace.beats.map(({ id }) => id)
  );
  const stateIds = Object.freeze(trace.states.map(({ id }) => id));
  const timelineId =
    "timeline.exact-fraction-quantity.third-plus-sixth.shared" as const;

  return renderKpTutorialCardStaticStepSequence({
    artifact: {
      id: staticTarget.artifactId,
      manifestId: "tutorial.exact-fraction-quantity.card",
      profileId: "export.exact-fraction-quantity.static-step",
      exportKind: "step-sequence",
      target: "static",
      artifactKind: "static-step-sequence",
      payloadKind: "json-document",
      status: "metadata",
      timelineIds: [timelineId],
      dependencies: {
        phases: ["critical", "optional"],
        capabilityKeys: [
          "kp.semantic:document.read:*:*",
          "kp.equation:render.katex:equation:*",
          "kp.diagram:render.svg:diagram:*",
          "kp.export:render.step-sequence:*:*"
        ],
        assetIds: [kpExactFractionQuantityAnimationId]
      },
      fallback: {
        strategy: "static-snapshot",
        preservesLayout: true,
        message:
          "Show all five certified exact-quantity checkpoints when motion is unavailable."
      },
      metadata: {
        sourceTraceId: trace.id,
        foldInvariant: true,
        viewInvariant: true,
        checkpointCount: accessibility.steps.length,
        finalValue: "1/2"
      }
    },
    checkpoints: accessibility.steps.map((step) => ({
      id: `step.${step.checkpointId}`,
      label: step.label,
      progress: manifest.checkpoints[step.index]!.progressPermille / 1_000,
      beat: step.index + 1,
      timelineId,
      summary: step.description,
      markers: step.focusSelectionIds.map((selectionId, markerIndex) => ({
        id: `marker.${step.checkpointId}.${markerIndex}`,
        kind: "focus" as const,
        label: `Focus ${selectionId}`,
        targetId: selectionId,
        summary: step.description
      }))
    })),
    sampler: {
      sample(progress): KpExactFractionQuantityStaticStepFrame {
        const index = checkpointIndex(progress);
        const step = accessibility.steps[index]!;
        const neutral = sampleKpExactFractionQuantityNeutralFrame({
          progress: manifest.checkpoints[index]!.progressPermille / 1_000,
          trace
        });
        const circle = projectKpExactFractionQuantityCircle(neutral);
        const bar = projectKpExactFractionQuantityBar(neutral);
        const numberLine =
          projectKpExactFractionQuantityNumberLine(neutral);
        return {
          progress: manifest.checkpoints[index]!.progressPermille / 1_000,
          planId: kpExactFractionQuantityAnimationId,
          timelineId,
          state: {
            stateId: step.stateId,
            checkpointId: step.checkpointId,
            activeOperationId: step.beatId,
            accessibleMath: step.accessibleMath,
            description: step.description
          },
          representations: {
            symbolic: {
              latex: step.rawLatex,
              htmlAndMathml: step.nativeHtmlAndMathml,
              accessibilityLabel: step.accessibleMath
            },
            partitionedCircle: {
              svg: renderKpExactFractionQuantityCircleSvg(circle),
              accessibilityLabel: circle.accessibleSummary
            },
            fractionBar: {
              svg: renderKpExactFractionQuantityBarSvg(bar),
              accessibilityLabel: bar.accessibleSummary
            },
            numberLine: {
              svg: renderKpExactFractionQuantityNumberLineSvg(numberLine),
              accessibilityLabel: numberLine.accessibleSummary
            }
          },
          completedOperationIds: operationIds.slice(0, index + 1),
          focusSelectionIds: step.focusSelectionIds,
          transcriptRefIds: step.transcriptRefIds,
          semanticTruth: {
            sourceTraceId: trace.id,
            unitId: trace.unitId,
            operationIds,
            stateIds,
            finalValue: "1/2",
            finalEqualityVerified:
              trace.verification.finalEqualityVerified
          }
        };
      }
    }
  });

  function checkpointIndex(progress: number): number {
    const bounded = Math.max(0, Math.min(1, progress));
    const found = manifest.checkpoints.findIndex(
      ({ progressPermille }) => bounded * 1_000 <= progressPermille
    );
    return found < 0 ? manifest.checkpoints.length - 1 : found;
  }
}
