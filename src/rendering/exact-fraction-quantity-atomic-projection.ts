import {
  createKpRational,
  type KpNormalizedRational
} from "../../domains/math/exact-rational.ts";
import type {
  KpExactFractionQuantityNeutralFrame
} from "../animation/exact-fraction-quantity-neutral-frame.ts";
import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../reader/compiler/exact-fraction-quantity-preservation-manifest.ts";

export interface KpExactFractionAtomicViewPart {
  readonly atomicPartId: string;
  readonly exactMeasure: KpNormalizedRational;
  readonly sourceSelectionIds: readonly string[];
  readonly targetSelectionIds: readonly string[];
  readonly lifecycle: "persist" | "fission" | "fusion";
  readonly selected: boolean;
}

/**
 * Shared semantic-to-view joint for concrete quantity renderers.
 *
 * Circle, bar, and number-line adapters may choose geometry, but they must not
 * independently infer selection or lineage. Keeping that rule here prevents
 * visually plausible views from silently disagreeing about which exact part
 * persisted, split, or fused.
 */
export function projectKpExactFractionAtomicViewParts(
  frame: KpExactFractionQuantityNeutralFrame
): readonly KpExactFractionAtomicViewPart[] {
  assertKpExactFractionCanonicalAtoms(frame.atomicPartIds);
  const targetSelectedAtoms = new Set(
    frame.targetSelections.flatMap(({ atomicPartIds }) => atomicPartIds)
  );
  return Object.freeze(frame.atomicPartIds.map((atomicPartId) => {
    const semanticTransition = frame.selectionTransitions.find(
      ({ atomicPartIds }) => atomicPartIds.includes(atomicPartId)
    );
    return Object.freeze({
      atomicPartId,
      exactMeasure: createKpRational(1n, 6n),
      sourceSelectionIds:
        semanticTransition?.sourceSelectionIds ?? Object.freeze([]),
      targetSelectionIds:
        semanticTransition?.targetSelectionIds ?? Object.freeze([]),
      lifecycle: semanticTransition?.lifecycle ?? "persist",
      selected: targetSelectedAtoms.has(atomicPartId)
    });
  }));
}

export function assertKpExactFractionCanonicalAtoms(
  atomicPartIds: readonly string[]
): void {
  if (
    atomicPartIds.length !== manifest.atomicPartIds.length ||
    atomicPartIds.some(
      (atomicPartId, index) => atomicPartId !== manifest.atomicPartIds[index]
    )
  ) {
    throw new Error(
      "Concrete exact-fraction projection requires the canonical ordered sixth atoms."
    );
  }
}
