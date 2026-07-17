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
  sampleKpMatrixMatrixCompositionProgress,
  type KpMatrixMatrixCompositionProgressFrame,
  type KpMatrixMatrixRendererCellPlan,
  type KpMatrixMatrixRendererPlan
} from "../rendering/equation-matrix-matrix-composition.ts";

export interface KpMatrixMatrixCompositionCellPlan
  extends KpMatrixMatrixRendererCellPlan {
  readonly focus: KpFocusProfilePlan;
}

export interface KpMatrixMatrixCompositionChoreography {
  readonly id: string;
  readonly transformationId: string;
  readonly traversal: KpSemanticTraversalPlan;
  readonly propagation: KpPropagationPlan;
  readonly rendererPlan: KpMatrixMatrixRendererPlan;
  readonly cells: readonly KpMatrixMatrixCompositionCellPlan[];
}

export interface KpMatrixMatrixCompositionChoreographyFrame {
  readonly motion: KpMatrixMatrixCompositionProgressFrame;
  readonly focusFrames: readonly {
    readonly semanticIndex: number;
    readonly plan: KpFocusProfilePlan;
    readonly frame: KpFocusProfileFrame;
  }[];
}

export function createKpMatrixMatrixCompositionChoreography(
  animation: KpAnimationAsset
): KpMatrixMatrixCompositionChoreography {
  const transformation = animation.transformations.find(
    (candidate) => candidate.transformType === "multiplyMatrices"
  );
  if (transformation === undefined) {
    throw new Error(`Animation ${animation.id} has no matrix-matrix transformation.`);
  }
  const source = animation.bundle.objects.find(
    (object) => object.id === transformation.sourceObjectIds[0]
  );
  const target = animation.bundle.objects.find(
    (object) => object.id === transformation.targetObjectIds[0]
  );
  const leftRows = numericMatrix(source?.value, "leftRows");
  const rightRows = numericMatrix(source?.value, "rightRows");
  const result = numericMatrix(target?.value, "result");
  const columnCount = rightRows[0]?.length ?? 0;
  const cellInputs = result.flatMap((row, rowIndex) =>
    row.map((_value, columnIndex) => {
      const semanticIndex = rowIndex * columnCount + columnIndex;
      return {
        semanticIndex,
        rowIndex,
        columnIndex,
        leftSelectorIds: matrixRowSelectorIds(source, "left.matrix", rowIndex),
        rightSelectorIds: matrixColumnSelectorIds(
          source,
          "right.matrix",
          rightRows.length,
          columnIndex
        ),
        resultSelectorId:
          `${target?.id}.result.matrix.entry.${rowIndex}.${columnIndex}`
      };
    })
  );
  const participants = cellInputs.map((cell) => ({
    id: `${transformation.id}.cell.${cell.semanticIndex}`,
    entityIds: [...cell.leftSelectorIds, ...cell.rightSelectorIds],
    rank: cell.semanticIndex,
    semanticIndex: cell.semanticIndex
  }));
  const traversal: KpSemanticTraversalPlan = {
    id: `traversal.${transformation.id}.cells`,
    kind: "semantic-traversal-plan",
    policy: "ranked-index",
    authorityId: "kp.linear-algebra.matrix-matrix#row-column-cells",
    participants,
    ranks: participants.map((participant) => ({
      rank: participant.rank,
      participantIds: [participant.id],
      presentation: "show"
    })),
    cascade: {
      adjacentOnly: true,
      nextRankReadinessThreshold: 0.56
    }
  };
  const propagation = compileKpPropagation({
    id: `propagation.${transformation.id}.cells`,
    rule: "semantic-traversal-rank",
    participants: participants.map((participant) => ({
      id: `${participant.id}.visual`,
      semanticEntityIds: participant.entityIds,
      traversalParticipantId: participant.id
    })),
    traversalPlan: traversal,
    constraints: {
      maximumStaggerSpan: 0.52,
      requestedStaggerSpan: 0.48,
      readinessThreshold: 0.56,
      latestOverlappingStartProgress: 0.9,
      minimumParticipantDuration: 0.25,
      stableVariationStrength: 0.025
    }
  });
  if (!propagation.promotable) {
    throw new Error(
      `Matrix-matrix cell propagation failed: ${propagation.diagnostics[0] ?? "unknown gap"}`
    );
  }
  const intermediateObjects = animation.bundle.objects.filter((object) =>
    optionalStringValue(object.value, "representation") ===
      "matrix-matrix-cell-dot-product"
  );
  const cells: KpMatrixMatrixCompositionCellPlan[] = cellInputs.map((cell) => {
    const leftValues = leftRows[cell.rowIndex]!;
    const rightValues = rightRows.map((row) => row[cell.columnIndex]!);
    const expected = leftValues.reduce(
      (sum, value, sharedIndex) => sum + value * rightValues[sharedIndex]!,
      0
    );
    const intermediate = intermediateObjects.find((object) =>
      numericValue(object.value, "semanticIndex") === cell.semanticIndex
    );
    if (
      cell.leftSelectorIds.length !== leftValues.length ||
      cell.rightSelectorIds.length !== rightValues.length ||
      intermediate === undefined ||
      result[cell.rowIndex]?.[cell.columnIndex] !== expected ||
      numericValue(intermediate.value, "result") !== expected
    ) {
      throw new Error(
        `Matrix-matrix cell ${cell.rowIndex},${cell.columnIndex} requires an exact authored row-column representation.`
      );
    }
    const propagationEntry = propagation.entries.find(
      (entry) =>
        entry.participantId ===
        `${transformation.id}.cell.${cell.semanticIndex}.visual`
    )!;
    const sourceSelectorIds = [
      ...cell.leftSelectorIds,
      ...cell.rightSelectorIds
    ];
    const id = `${transformation.id}.cell-composition.${cell.semanticIndex}`;
    return {
      id,
      ...cell,
      leftValues,
      rightValues,
      result: expected,
      intermediateObjectId: intermediate.id,
      cellLatex: stringValue(intermediate.value, "cellLatex"),
      start: 0.09 + propagationEntry.start * 0.67,
      end: 0.09 + propagationEntry.end * 0.67,
      sourceSignatures: Object.fromEntries(sourceSelectorIds.map((selectorId, index) => [
        selectorId,
        deriveKpOrganicMotionSignature({
          identityId: selectorId,
          lineageEdgeId: id,
          branchIndex: index,
          motifId: "matrix-matrix-cell-dot-sweep",
          motionFieldId: `${id}.field`
        })
      ])),
      focus: compileKpFocusProfile({
        id: `focus.${id}`,
        groupId: id,
        semanticEntityIds: sourceSelectorIds,
        fragmentIds: [],
        profile: "elevated",
        strength: 0.45,
        contextDimming: 0.09,
        accessibilityMode: "full"
      })
    };
  });
  return {
    id: `matrix-matrix.${transformation.id}`,
    transformationId: transformation.id,
    traversal,
    propagation,
    rendererPlan: {
      id: `renderer.${transformation.id}.matrix-matrix`,
      kind: "matrix-matrix-renderer-plan",
      cells,
      sourceReleaseStart: 0.82,
      sourceReleaseEnd: 0.97,
      structureRevealStart: 0.08,
      structureRevealEnd: 0.24
    },
    cells
  };
}

export function sampleKpMatrixMatrixCompositionChoreography(input: {
  readonly choreography: KpMatrixMatrixCompositionChoreography;
  readonly progress: number;
  readonly direction: "forward" | "rewind";
  readonly accessibilityMode: KpFocusAccessibilityMode;
}): KpMatrixMatrixCompositionChoreographyFrame {
  const semanticProgress = round(
    input.direction === "forward"
      ? input.progress
      : 1 - input.progress
  );
  const motion = sampleKpMatrixMatrixCompositionProgress({
    plan: input.choreography.rendererPlan,
    progress: semanticProgress
  });
  return {
    motion,
    focusFrames: input.choreography.cells.map((cell) => {
      const cellFrame = motion.cells.find(
        (candidate) => candidate.semanticIndex === cell.semanticIndex
      )!;
      const focusPlan = input.accessibilityMode === "full"
        ? cell.focus
        : compileKpFocusProfile({
            id: cell.focus.id,
            groupId: cell.focus.groupId,
            semanticEntityIds: cell.focus.semanticEntityIds,
            fragmentIds: [],
            profile: cell.focus.groupTreatment.profile,
            strength: 0.45,
            contextDimming: cell.focus.contextProfile.dimming,
            accessibilityMode: input.accessibilityMode
          });
      const phase = cellFrame.status === "upcoming"
        ? { id: "orient" as const, progress: 0 }
        : cellFrame.status === "resolved"
          ? { id: "release" as const, progress: 1 }
          : cellFrame.localProgress < 0.2
            ? { id: "orient" as const, progress: cellFrame.localProgress / 0.2 }
            : cellFrame.localProgress <= 0.74
              ? { id: "act" as const, progress: 1 }
              : {
                  id: "release" as const,
                  progress: (cellFrame.localProgress - 0.74) / 0.26
                };
      return {
        semanticIndex: cell.semanticIndex,
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

function matrixRowSelectorIds(
  object: KpAnimationAsset["bundle"]["objects"][number] | undefined,
  prefix: string,
  rowIndex: number
): readonly string[] {
  return indexedSelectorIds(object, `.${prefix}.entry.${rowIndex}.`);
}

function matrixColumnSelectorIds(
  object: KpAnimationAsset["bundle"]["objects"][number] | undefined,
  prefix: string,
  rowCount: number,
  columnIndex: number
): readonly string[] {
  return Array.from({ length: rowCount }, (_, rowIndex) =>
    object?.selectors.find((selector) =>
      selector.id.endsWith(`.${prefix}.entry.${rowIndex}.${columnIndex}`)
    )?.id
  ).filter((id): id is string => id !== undefined);
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
    throw new Error(`Matrix-matrix value requires numeric ${key}.`);
  }
  return candidate as number[][];
}

function numericValue(value: unknown, key: string): number {
  const candidate = recordValue(value, key);
  if (typeof candidate !== "number") {
    throw new Error(`Matrix-matrix representation requires numeric ${key}.`);
  }
  return candidate;
}

function stringValue(value: unknown, key: string): string {
  const candidate = recordValue(value, key);
  if (typeof candidate !== "string" || candidate.length === 0) {
    throw new Error(`Matrix-matrix representation requires string ${key}.`);
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

function round(value: number): number {
  const result = Math.round(value * 1_000_000) / 1_000_000;
  return Object.is(result, -0) ? 0 : result;
}
