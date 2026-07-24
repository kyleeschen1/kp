import type { KpAnimationAsset } from "./asset.ts";
import {
  compileKpFocusProfile,
  sampleKpFocusProfile,
  type KpFocusAccessibilityMode,
  type KpFocusProfileFrame,
  type KpFocusProfilePlan
} from "./focus-profile.ts";
import { deriveKpOrganicMotionSignature } from "./organic-motion-primitives.ts";
import {
  compileKpPropagation,
  type KpPropagationPlan
} from "./propagation-compiler.ts";
import type { KpSemanticTraversalPlan } from "./semantic-traversal.ts";
import {
  KP_MATRIX_VECTOR_ENVELOPE_LEAD_MS,
  KP_MATRIX_VECTOR_ENVELOPE_RELEASE_MS,
  KP_MATRIX_VECTOR_ROW_MINIMUM_DURATION_MS,
  matrixVectorSemanticDurationMs
} from "./matrix-vector-duration-contract.ts";
import {
  sampleKpMatrixVectorCompositionProgress,
  type KpMatrixVectorCompositionPlan,
  type KpMatrixVectorCompositionProgressFrame,
  type KpMatrixVectorCompositionRowPlan as KpMatrixVectorProgressRowPlan
} from "./matrix-vector-composition-progress.ts";

export interface KpMatrixVectorCompositionRowPlan
  extends KpMatrixVectorProgressRowPlan {
  readonly focus: KpFocusProfilePlan;
}

export interface KpMatrixVectorCompositionChoreography {
  readonly id: string;
  readonly transformationId: string;
  readonly traversal: KpSemanticTraversalPlan;
  readonly propagation: KpPropagationPlan;
  readonly rendererPlan: KpMatrixVectorCompositionPlan;
  readonly rows: readonly KpMatrixVectorCompositionRowPlan[];
}

export interface KpMatrixVectorCompositionChoreographyFrame {
  readonly motion: KpMatrixVectorCompositionProgressFrame;
  readonly focusFrames: readonly {
    readonly semanticIndex: number;
    readonly plan: KpFocusProfilePlan;
    readonly frame: KpFocusProfileFrame;
  }[];
}

export function createKpMatrixVectorCompositionChoreography(
  animation: KpAnimationAsset
): KpMatrixVectorCompositionChoreography {
  const transformation = animation.transformations.find(
    (candidate) => candidate.transformType === "multiplyMatrixVector"
  );
  if (transformation === undefined) {
    throw new Error(`Animation ${animation.id} has no matrix-vector transformation.`);
  }
  const source = animation.bundle.objects.find(
    (object) => object.id === transformation.sourceObjectIds[0]
  );
  const target = animation.bundle.objects.find(
    (object) => object.id === transformation.targetObjectIds[0]
  );
  const matrixRows = numericMatrix(source?.value, "matrixRows");
  const vector = numericArray(source?.value, "vector");
  const result = numericArray(target?.value, "result");
  if (matrixRows.length !== result.length) {
    throw new Error("Matrix-vector row count must match the result dimension.");
  }
  const semanticDurationMs = matrixVectorSemanticDurationMs(matrixRows.length);
  if (animation.timeline?.durationMs !== semanticDurationMs) {
    throw new Error("Matrix-vector timeline must preserve semantic row duration.");
  }
  const vectorSelectorIds = indexedSelectorIds(source, ".vector.component.");
  const resultSelectorIds = indexedSelectorIds(target, ".result.component.");
  const participants = matrixRows.map((_row, semanticIndex) => ({
    id: `${transformation.id}.row.${semanticIndex}`,
    entityIds: [
      ...matrixRowSelectorIds(source, semanticIndex),
      ...vectorSelectorIds
    ],
    rank: semanticIndex,
    semanticIndex
  }));
  const traversal: KpSemanticTraversalPlan = {
    id: `traversal.${transformation.id}.rows`,
    kind: "semantic-traversal-plan",
    policy: "ranked-index",
    authorityId: "kp.linear-algebra.matrix-vector#row-dot-products",
    participants,
    ranks: participants.map((participant) => ({
      rank: participant.rank,
      participantIds: [participant.id],
      presentation: "show"
    })),
    cascade: {
      adjacentOnly: true,
      nextRankReadinessThreshold: 0.68
    }
  };
  const propagation = compileKpPropagation({
    id: `propagation.${transformation.id}.rows`,
    rule: "semantic-traversal-rank",
    participants: participants.map((participant) => ({
      id: `${participant.id}.visual`,
      semanticEntityIds: participant.entityIds,
      traversalParticipantId: participant.id
    })),
    traversalPlan: traversal,
    constraints: {
      maximumStaggerSpan: 0.32,
      requestedStaggerSpan: 0.3,
      readinessThreshold: 0.68,
      latestOverlappingStartProgress: 0.82,
      minimumParticipantDuration: 0.34,
      stableVariationStrength: 0.035
    }
  });
  if (!propagation.promotable) {
    throw new Error(
      `Matrix-vector row propagation failed: ${propagation.diagnostics[0] ?? "unknown gap"}`
    );
  }
  const intermediateObjects = animation.bundle.objects.filter((object) =>
    optionalStringValue(object.value, "representation") ===
      "matrix-vector-row-dot-product"
  );
  const rows: KpMatrixVectorCompositionRowPlan[] = matrixRows.map(
    (rowValues, semanticIndex) => {
      const matrixSelectorIds = matrixRowSelectorIds(source, semanticIndex);
      const resultSelectorId = resultSelectorIds[semanticIndex];
      const intermediate = intermediateObjects.find((object) =>
        numericValue(object.value, "semanticIndex") === semanticIndex
      );
      if (
        matrixSelectorIds.length !== rowValues.length ||
        vectorSelectorIds.length !== vector.length ||
        resultSelectorId === undefined ||
        intermediate === undefined
      ) {
        throw new Error(
          `Matrix-vector row ${semanticIndex} requires selectors and an authored row-dot-product representation.`
        );
      }
      const expected = rowValues.reduce(
        (sum, value, columnIndex) => sum + value * vector[columnIndex]!,
        0
      );
      if (
        expected !== result[semanticIndex] ||
        numericValue(intermediate.value, "result") !== expected
      ) {
        throw new Error(`Matrix-vector row ${semanticIndex} intermediate is incorrect.`);
      }
      const sourceSelectorIds = [...matrixSelectorIds, ...vectorSelectorIds];
      const id = `${transformation.id}.row-composition.${semanticIndex}`;
      return {
        id,
        semanticIndex,
        matrixSelectorIds,
        vectorSelectorIds,
        resultSelectorId,
        rowValues,
        vectorValues: vector,
        result: expected,
        intermediateObjectId: intermediate.id,
        rowLatex: stringValue(intermediate.value, "rowLatex"),
        start: (KP_MATRIX_VECTOR_ENVELOPE_LEAD_MS +
          semanticIndex * KP_MATRIX_VECTOR_ROW_MINIMUM_DURATION_MS) /
          semanticDurationMs,
        end: (KP_MATRIX_VECTOR_ENVELOPE_LEAD_MS +
          (semanticIndex + 1) * KP_MATRIX_VECTOR_ROW_MINIMUM_DURATION_MS) /
          semanticDurationMs,
        sourceSignatures: Object.fromEntries(sourceSelectorIds.map((selectorId, index) => [
          selectorId,
          deriveKpOrganicMotionSignature({
            identityId: selectorId,
            lineageEdgeId: id,
            branchIndex: index,
            motifId: "matrix-vector-row-dot-sweep",
            motionFieldId: `${id}.field`
          })
        ])),
        focus: compileKpFocusProfile({
          id: `focus.${id}`,
          groupId: id,
          semanticEntityIds: sourceSelectorIds,
          fragmentIds: [],
          profile: "elevated",
          strength: 0.46,
          contextDimming: 0.09,
          accessibilityMode: "full"
        })
      };
    }
  );
  return {
    id: `matrix-vector.${transformation.id}`,
    transformationId: transformation.id,
    traversal,
    propagation,
    rendererPlan: {
      id: `renderer.${transformation.id}.matrix-vector`,
      kind: "matrix-vector-renderer-plan",
      rows,
      semanticDurationMs,
      semanticActionCount: matrixRows.length,
      sourceReleaseStart:
        (semanticDurationMs - KP_MATRIX_VECTOR_ENVELOPE_RELEASE_MS) /
        semanticDurationMs,
      sourceReleaseEnd: 1,
      structureRevealStart: 0.02,
      structureRevealEnd: KP_MATRIX_VECTOR_ENVELOPE_LEAD_MS / semanticDurationMs
    },
    rows
  };
}

export function sampleKpMatrixVectorCompositionChoreography(input: {
  readonly choreography: KpMatrixVectorCompositionChoreography;
  readonly progress: number;
  readonly direction: "forward" | "rewind";
  readonly accessibilityMode: KpFocusAccessibilityMode;
}): KpMatrixVectorCompositionChoreographyFrame {
  const semanticProgress = input.direction === "forward"
    ? input.progress
    : 1 - input.progress;
  const motion = sampleKpMatrixVectorCompositionProgress({
    plan: input.choreography.rendererPlan,
    progress: semanticProgress
  });
  return {
    motion,
    focusFrames: input.choreography.rows.map((row) => {
      const rowFrame = motion.rows.find(
        (candidate) => candidate.semanticIndex === row.semanticIndex
      )!;
      const focusPlan = input.accessibilityMode === "full"
        ? row.focus
        : compileKpFocusProfile({
            id: row.focus.id,
            groupId: row.focus.groupId,
            semanticEntityIds: row.focus.semanticEntityIds,
            fragmentIds: [],
            profile: row.focus.groupTreatment.profile,
            strength: 0.46,
            contextDimming: row.focus.contextProfile.dimming,
            accessibilityMode: input.accessibilityMode
          });
      const phase = rowFrame.status === "upcoming"
        ? { id: "orient" as const, progress: 0 }
        : rowFrame.status === "resolved"
          ? { id: "release" as const, progress: 1 }
          : rowFrame.localProgress < 0.22
            ? { id: "orient" as const, progress: rowFrame.localProgress / 0.22 }
            : rowFrame.localProgress <= 0.72
              ? { id: "act" as const, progress: 1 }
              : {
                  id: "release" as const,
                  progress: (rowFrame.localProgress - 0.72) / 0.28
                };
      return {
        semanticIndex: row.semanticIndex,
        plan: focusPlan,
        frame: sampleKpFocusProfile({
          plan: focusPlan,
          phaseId: phase.id,
          phaseProgress: Math.max(0, Math.min(1, phase.progress))
        })
      };
    })
  };
}

function indexedSelectorIds(
  object: KpAnimationAsset["bundle"]["objects"][number] | undefined,
  marker: string
): readonly string[] {
  return [...(object?.selectors ?? [])]
    .filter((selector) => selector.id.includes(marker))
    .sort((left, right) => selectorIndex(left.id) - selectorIndex(right.id))
    .map((selector) => selector.id);
}

function matrixRowSelectorIds(
  object: KpAnimationAsset["bundle"]["objects"][number] | undefined,
  rowIndex: number
): readonly string[] {
  const marker = `.matrix.entry.${rowIndex}.`;
  return indexedSelectorIds(object, marker);
}

function selectorIndex(id: string): number {
  const value = Number(id.split(".").at(-1));
  return Number.isInteger(value) ? value : Number.MAX_SAFE_INTEGER;
}

function numericMatrix(value: unknown, key: string): readonly (readonly number[])[] {
  const candidate = recordValue(value, key);
  if (
    !Array.isArray(candidate) ||
    !candidate.every((row: unknown) =>
      Array.isArray(row) && row.every((entry: unknown) => typeof entry === "number")
    )
  ) {
    throw new Error(`Matrix-vector source requires numeric ${key}.`);
  }
  return candidate as number[][];
}

function numericArray(value: unknown, key: string): readonly number[] {
  const candidate = recordValue(value, key);
  if (!Array.isArray(candidate) || !candidate.every((item) => typeof item === "number")) {
    throw new Error(`Matrix-vector value requires numeric ${key}.`);
  }
  return candidate as number[];
}

function numericValue(value: unknown, key: string): number {
  const candidate = recordValue(value, key);
  if (typeof candidate !== "number") {
    throw new Error(`Matrix-vector representation requires numeric ${key}.`);
  }
  return candidate;
}

function stringValue(value: unknown, key: string): string {
  const candidate = recordValue(value, key);
  if (typeof candidate !== "string" || candidate.length === 0) {
    throw new Error(`Matrix-vector representation requires string ${key}.`);
  }
  return candidate;
}

function optionalStringValue(value: unknown, key: string): string | undefined {
  const candidate = recordValue(value, key);
  return typeof candidate === "string" ? candidate : undefined;
}

function recordValue(value: unknown, key: string): unknown {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)[key]
    : undefined;
}
