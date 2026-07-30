import type {
  KpSampledAnimationFrame
} from "../animation/kernel.ts";
import {
  escapeKpTutorialHtmlAttribute,
  escapeKpTutorialHtmlText
} from "./generated-html-escaping.ts";
import {
  kpPlaceValueAdditionPreservationManifest as manifest
} from "../reader/compiler/place-value-addition-preservation-manifest.ts";
import {
  createKpReaderClockSample
} from "../reader/runtime/playback-clock.ts";
import {
  createKpPlaceValueAdditionRuntimeSession,
  sampleKpPlaceValueAdditionRuntime
} from "../rendering/place-value-addition-runtime.ts";
import type {
  KpPlaceValueNativeCellRoot
} from "../reader/compiler/place-value-addition-written-column-projection.ts";
import type {
  KpPlaceValueBaseTenFrame,
  KpPlaceValueBaseTenProjection
} from "../rendering/place-value-addition-base-ten-projection.ts";
import {
  renderKpTutorialCardStaticStepSequence,
  type KpTutorialCardStaticStepSequence
} from "./static-step-sequence-renderer.ts";

export interface KpPlaceValueAdditionStaticStepFrame
  extends KpSampledAnimationFrame {
  readonly planId: "animation.place-value-addition.278-plus-156";
  readonly timelineId:
    "timeline.place-value-addition.278-plus-156.shared";
  readonly state: {
    readonly stateId: string;
    readonly checkpointId: string;
    readonly activeOperationId: string;
    readonly accessibleMath: string;
    readonly description: string;
  };
  readonly representations: {
    readonly writtenAlgorithm: {
      readonly htmlAndMathml: string;
      readonly accessibilityLabel: string;
    };
    readonly baseTenBlocks: {
      readonly svg: string;
      readonly accessibilityLabel: string;
    };
  };
  readonly completedOperationIds: readonly string[];
  readonly focusEntityIds: readonly string[];
  readonly annotationIds: readonly string[];
  readonly transcriptRefIds: readonly string[];
  readonly semanticTruth: {
    readonly sourceTraceId:
      "trace.place-value-addition.278-plus-156";
    readonly operationIds: readonly string[];
    readonly stateIds: readonly string[];
    readonly finalValue: "434";
    readonly exactResultVerified: true;
  };
}

export type KpPlaceValueAdditionStaticStepExport =
  KpTutorialCardStaticStepSequence<
    KpPlaceValueAdditionStaticStepFrame
  >;

/**
 * Static export samples the sealed trace endpoints, not animated paint. The
 * emitted table and SVG therefore remain complete without JavaScript and
 * cannot lose a carry merely because a live view was folded or hidden.
 */
export function createKpPlaceValueAdditionStaticStepExport():
KpPlaceValueAdditionStaticStepExport {
  const runtime = createKpPlaceValueAdditionRuntimeSession();
  const accessibility = runtime.accessibility;
  const operationIds = Object.freeze(
    runtime.foundation.trace.beats.map(({ id }) => id)
  );
  const stateIds = Object.freeze(
    runtime.foundation.trace.states.map(({ id }) => id)
  );
  const timelineId =
    "timeline.place-value-addition.278-plus-156.shared" as const;

  return renderKpTutorialCardStaticStepSequence({
    artifact: {
      id: "artifact.place-value-addition.static-checkpoints",
      manifestId: "tutorial.place-value-addition.card",
      profileId: "export.place-value-addition.static-step",
      exportKind: "step-sequence",
      target: "static",
      artifactKind: "static-step-sequence",
      payloadKind: "json-document",
      status: "metadata",
      timelineIds: [timelineId],
      dependencies: {
        phases: ["critical"],
        capabilityKeys: [
          "kp.semantic:document.read:*:*",
          "kp.equation:render.katex:equation:*",
          "kp.diagram:render.svg:diagram:*",
          "kp.export:render.step-sequence:*:*"
        ],
        assetIds: [manifest.animationId]
      },
      fallback: {
        strategy: "static-snapshot",
        preservesLayout: true,
        message:
          "Show all seven place-value checkpoints when motion is unavailable."
      },
      metadata: {
        sourceTraceId: runtime.foundation.trace.id,
        foldInvariant: true,
        viewInvariant: true,
        checkpointCount: accessibility.steps.length,
        finalValue: "434"
      }
    },
    checkpoints: accessibility.steps.map((step) => ({
      id: `step.${step.checkpointId}`,
      label: step.label,
      progress: step.progressPermille / 1_000,
      beat: step.index + 1,
      timelineId,
      summary: step.description,
      markers: [
        ...step.focusEntityIds.map((entityId, markerIndex) => ({
          id: `marker.${step.checkpointId}.focus.${markerIndex}`,
          kind: "focus" as const,
          label: `Focus ${entityId}`,
          targetId: entityId,
          summary: step.description
        })),
        ...step.annotationIds.map((annotationId, markerIndex) => ({
          id: `marker.${step.checkpointId}.annotation.${markerIndex}`,
          kind: "annotation" as const,
          label: `Proof ${annotationId}`,
          targetId: annotationId,
          summary: step.description
        }))
      ]
    })),
    sampler: {
      sample(progress): KpPlaceValueAdditionStaticStepFrame {
        const stepIndex = checkpointIndex(progress);
        const step = accessibility.steps[stepIndex]!;
        const frame = sampleKpPlaceValueAdditionRuntime({
          session: runtime,
          clock: createKpReaderClockSample({
            source: "controls",
            progress: step.progressPermille / 1_000,
            previousProgress: step.progressPermille / 1_000,
            sequence: stepIndex,
            settled: true,
            checkpointId: step.checkpointId
          }),
          viewportWidth: 1_100,
          selectedView: "written"
        });
        return {
          progress: step.progressPermille / 1_000,
          planId: manifest.animationId,
          timelineId,
          state: {
            stateId: step.stateId,
            checkpointId: step.checkpointId,
            activeOperationId: step.beatId,
            accessibleMath: step.accessibleMath,
            description: step.description
          },
          representations: {
            writtenAlgorithm: {
              htmlAndMathml: renderWrittenStaticHtml({
                cells: runtime.written.cells,
                settledResultIds: frame.stableState.settledResultIds,
                visibleCarryIds: frame.stableState.visibleCarryIds,
                currentMath: step.nativeHtmlAndMathml,
                label: step.accessibleMath
              }),
              accessibilityLabel: step.accessibleMath
            },
            baseTenBlocks: {
              svg: renderBaseTenStaticSvg(
                runtime.baseTen,
                frame.baseTen.stable
              ),
              accessibilityLabel:
                "Base-ten blocks preserve 434 as four hundreds, three tens, and four ones."
            }
          },
          completedOperationIds: operationIds.slice(0, stepIndex + 1),
          focusEntityIds: step.focusEntityIds,
          annotationIds: step.annotationIds,
          transcriptRefIds: step.transcriptRefIds,
          semanticTruth: {
            sourceTraceId: runtime.foundation.trace.id,
            operationIds,
            stateIds,
            finalValue: "434",
            exactResultVerified:
              runtime.foundation.trace.verification.exactResultVerified
          }
        };
      }
    }
  });

  function checkpointIndex(progress: number): number {
    const bounded = Math.max(0, Math.min(1, progress));
    const found = accessibility.steps.findIndex(
      ({ progressPermille }) => bounded * 1_000 <= progressPermille
    );
    return found < 0 ? accessibility.steps.length - 1 : found;
  }
}

function renderWrittenStaticHtml(input: {
  readonly cells: readonly KpPlaceValueNativeCellRoot[];
  readonly settledResultIds: readonly string[];
  readonly visibleCarryIds: readonly string[];
  readonly currentMath: string;
  readonly label: string;
}): string {
  const visibleIds = new Set([
    ...input.cells
      .filter(({ visibility }) => visibility === "established")
      .map(({ semanticEntityId }) => semanticEntityId),
    ...input.settledResultIds,
    ...input.visibleCarryIds
  ]);
  const rows = [
    "carry",
    "first-addend",
    "second-addend",
    "result"
  ] as const;
  const columns = ["operator", "hundreds", "tens", "ones"] as const;
  const tableRows = rows.map((row) =>
    `<tr data-kp-place-value-row="${row}">${
      columns.map((column) => {
        const cell = input.cells.find((candidate) =>
          candidate.row === row && candidate.column === column
        );
        return `<td>${
          cell !== undefined && visibleIds.has(cell.semanticEntityId)
            ? cell.nativeHtmlAndMathml
            : ""
        }</td>`;
      }).join("")
    }</tr>`
  );
  const underline =
    "<tr data-kp-place-value-row=\"underline\">" +
    "<td colspan=\"4\" style=\"border-block-start:2px solid currentColor\"></td>" +
    "</tr>";
  return `<figure role="img" aria-label="${
    escapeKpTutorialHtmlAttribute(input.label)
  }"><table style="border-collapse:collapse;text-align:center"><tbody>${
    tableRows.slice(0, -1).join("")
  }${underline}${
    tableRows.at(-1)
  }</tbody></table><div>${
    input.currentMath
  }</div><figcaption>${
    escapeKpTutorialHtmlText(input.label)
  }</figcaption></figure>`;
}

function renderBaseTenStaticSvg(
  projection: KpPlaceValueBaseTenProjection,
  frame: KpPlaceValueBaseTenFrame
): string {
  const blocks = new Map(
    projection.blocks.map((block) => [block.id, block])
  );
  const rects = frame.placements.map((placement) => {
    const block = blocks.get(placement.blockId);
    if (block === undefined) {
      throw new Error(
        `Static base-ten frame lacks block ${placement.blockId}.`
      );
    }
    return `<rect data-block-id="${
      escapeKpTutorialHtmlAttribute(block.id)
    }" data-denomination="${block.denomination}" x="${placement.x}" y="${
      placement.y
    }" width="${placement.width}" height="${placement.height}"/>`;
  }).join("");
  const box = projection.intrinsicViewBox;
  const label =
    "Base-ten blocks showing four hundreds, three tens, and four ones.";
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${
    escapeKpTutorialHtmlAttribute(label)
  }" viewBox="${box.minX} ${box.minY} ${box.width} ${box.height}">${
    rects
  }</svg>`;
}
