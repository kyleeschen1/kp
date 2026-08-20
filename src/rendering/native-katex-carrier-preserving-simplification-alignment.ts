import {
  kpEquationSettlementTolerancePx
} from "../animation/equation-shared-presentation-policy.ts";
import type {
  KpCarrierPreservingSimplificationRecipe
} from "../animation/carrier-preserving-simplification-recipe.ts";
import type {
  KpNativeKatexPresentationGroupObservation,
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";

export interface KpNativeKatexStationaryContextAlignment {
  readonly kind: "native-katex-stationary-context-alignment";
  readonly translateX: number;
  readonly translateY: number;
  readonly correspondenceRecordIds: readonly string[];
}

/**
 * Stationary semantic pairs align the whole target endpoint before final
 * measurement. Sampling then consumes one immutable geometry transaction;
 * it never corrects context pose frame by frame or infers alignment from text.
 */
export function planKpNativeKatexStationaryContextAlignment(input: {
  readonly recipe: KpCarrierPreservingSimplificationRecipe;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): KpNativeKatexStationaryContextAlignment {
  if (input.recipe.stationaryContext.length === 0) {
    return alignment(0, 0, []);
  }
  const deltas = input.recipe.stationaryContext.map((context) => {
    const source = requiredGroup(
      input.source,
      context.sourceSelectorRef
    );
    const target = requiredGroup(
      input.target,
      context.targetSelectorRef
    );
    assertEquivalentStationaryPaint(source, target);
    return Object.freeze({
      correspondenceRecordId: context.correspondenceRecordId,
      x: source.rect.left - target.rect.left,
      y: requiredBaseline(source) - requiredBaseline(target)
    });
  });
  const reference = deltas[0]!;
  for (const delta of deltas.slice(1)) {
    if (
      Math.abs(delta.x - reference.x) > kpEquationSettlementTolerancePx ||
      Math.abs(delta.y - reference.y) > kpEquationSettlementTolerancePx
    ) {
      throw new Error(
        "Stationary context cannot be aligned by one target-endpoint translation."
      );
    }
  }
  return alignment(
    reference.x,
    reference.y,
    deltas.map(({ correspondenceRecordId }) => correspondenceRecordId)
  );
}

function alignment(
  translateX: number,
  translateY: number,
  correspondenceRecordIds: readonly string[]
): KpNativeKatexStationaryContextAlignment {
  return Object.freeze({
    kind: "native-katex-stationary-context-alignment" as const,
    translateX,
    translateY,
    correspondenceRecordIds: Object.freeze([...correspondenceRecordIds])
  });
}

function requiredGroup(
  observation: KpNativeKatexRenderedSceneObservation,
  semanticEntityId: string
): KpNativeKatexPresentationGroupObservation {
  const groups = observation.groups.filter((group) =>
    group.semanticEntityId === semanticEntityId
  );
  if (groups.length !== 1) {
    throw new Error(
      `Stationary alignment expected one ${observation.endpoint} owner for ` +
      `${semanticEntityId}, received ${groups.length}.`
    );
  }
  return groups[0]!;
}

function requiredBaseline(
  group: KpNativeKatexPresentationGroupObservation
): number {
  if (group.baselineY === undefined || group.baselineY === null ||
      !Number.isFinite(group.baselineY)) {
    throw new Error(
      `Stationary alignment owner ${group.semanticEntityId} lacks a baseline.`
    );
  }
  return group.baselineY;
}

function assertEquivalentStationaryPaint(
  source: KpNativeKatexPresentationGroupObservation,
  target: KpNativeKatexPresentationGroupObservation
): void {
  if (
    Math.abs(source.rect.width - target.rect.width) >
      kpEquationSettlementTolerancePx ||
    Math.abs(source.rect.height - target.rect.height) >
      kpEquationSettlementTolerancePx ||
    source.styleFingerprint !== target.styleFingerprint
  ) {
    throw new Error(
      `Stationary context ${source.semanticEntityId} and ` +
      `${target.semanticEntityId} do not have equivalent native paint.`
    );
  }
}
