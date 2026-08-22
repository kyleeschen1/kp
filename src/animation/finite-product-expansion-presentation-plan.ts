import type { KpFiniteBinderSemanticId } from
  "../domain-ir/finite-binder-vocabulary.ts";
import {
  KP_FINITE_PRODUCT_EXPAND_OPERATION,
  type KpVerifiedFiniteProductExpansionOperation
} from "../semantic/finite-product-expansion-operation.ts";
import {
  kpCanonicalFiniteProductExpansionOperation
} from "../semantic/canonical-finite-product-expansion.ts";
import {
  kpFiniteProductEquivalenceFrameOccurrenceIds
} from "../semantic/finite-product-equivalence-frame.ts";

export interface KpFiniteProductPresentationWindow {
  readonly start: number;
  readonly end: number;
}

export interface KpFiniteProductFactorPresentation {
  readonly ordinal: number;
  readonly bodyInstanceId: KpFiniteBinderSemanticId;
  readonly instantiatedReferenceId: KpFiniteBinderSemanticId;
  readonly factorTransitWindow: KpFiniteProductPresentationWindow;
  readonly referenceReceptionWindow: KpFiniteProductPresentationWindow;
  readonly valueSource: "lower-bound" | "range-successor" | "upper-bound";
  readonly precedingAdjacency?: Readonly<{
    adjacencyId: KpFiniteBinderSemanticId;
    leftNeighborId: KpFiniteBinderSemanticId;
    paintPolicy: "settles-through-native-factor-spacing";
  }> | undefined;
}

export interface KpFiniteProductExpansionPresentationPlan {
  readonly schemaVersion: "kp.finite-product-expansion-presentation-plan.v1";
  readonly kind: "finite-product-expansion-presentation-plan";
  readonly id: "presentation.finite-product-expansion.canonical.v1";
  readonly maturity: "product-pressure-candidate";
  readonly operationId: typeof KP_FINITE_PRODUCT_EXPAND_OPERATION;
  readonly topology: "ordered-adjacent-factor-generation";
  readonly stateRetention: Readonly<{
    policy: "equivalence-frame";
    source: "frozen-native-context";
    relation: "fixed-native-equality";
    target: "live-then-native";
  }>;
  readonly transitBoundary: Readonly<{
    relationOccurrenceId: string;
    policy: "preserve-relation-legibility";
  }>;
  readonly sourceHoldWindow: KpFiniteProductPresentationWindow;
  readonly factors: readonly KpFiniteProductFactorPresentation[];
  readonly targetHoldWindow: KpFiniteProductPresentationWindow;
  readonly clock: Readonly<{
    authority: "one-normalized-external-clock";
    rendererScheduling: "forbidden";
  }>;
}

const SOURCE_HOLD = window(0, 0.08);
const FACTOR_WINDOWS = Object.freeze([
  window(0.08, 0.3),
  window(0.32, 0.54),
  window(0.56, 0.78)
]);
const REFERENCE_WINDOWS = Object.freeze([
  window(0.2, 0.3),
  window(0.44, 0.54),
  window(0.68, 0.78)
]);
const TARGET_HOLD = window(0.84, 1);

/** Product adjacency is perceived through settled factor spacing, not plus paint. */
export function compileKpFiniteProductExpansionPresentationPlan(
  operation: KpVerifiedFiniteProductExpansionOperation
): KpFiniteProductExpansionPresentationPlan {
  if (operation.operation !== KP_FINITE_PRODUCT_EXPAND_OPERATION ||
      operation.target.instances.length !== 3 ||
      operation.target.adjacencies.length !== 2) {
    throw new Error(
      "The product presentation is limited to the canonical three-factor pressure caller."
    );
  }
  const factors = operation.target.instances.map((instance, ordinal) => {
    const reference = instance.references[0];
    const factorTransitWindow = FACTOR_WINDOWS[ordinal];
    const referenceReceptionWindow = REFERENCE_WINDOWS[ordinal];
    if (reference === undefined || factorTransitWindow === undefined ||
        referenceReceptionWindow === undefined) {
      throw new Error("Finite-product presentation lacks an ordered factor role.");
    }
    const adjacency = ordinal === 0
      ? undefined
      : operation.target.adjacencies[ordinal - 1];
    return Object.freeze({
      ordinal,
      bodyInstanceId: instance.id,
      instantiatedReferenceId: reference.id,
      factorTransitWindow,
      referenceReceptionWindow,
      valueSource: ordinal === 0
        ? "lower-bound" as const
        : ordinal === operation.target.instances.length - 1
          ? "upper-bound" as const
          : "range-successor" as const,
      ...(adjacency === undefined ? {} : {
        precedingAdjacency: Object.freeze({
          adjacencyId: adjacency.id,
          leftNeighborId: operation.target.instances[ordinal - 1]!.id,
          paintPolicy: "settles-through-native-factor-spacing" as const
        })
      })
    });
  });
  return Object.freeze({
    schemaVersion: "kp.finite-product-expansion-presentation-plan.v1" as const,
    kind: "finite-product-expansion-presentation-plan" as const,
    id: "presentation.finite-product-expansion.canonical.v1" as const,
    maturity: "product-pressure-candidate" as const,
    operationId: operation.operation,
    topology: "ordered-adjacent-factor-generation" as const,
    stateRetention: Object.freeze({
      policy: "equivalence-frame" as const,
      source: "frozen-native-context" as const,
      relation: "fixed-native-equality" as const,
      target: "live-then-native" as const
    }),
    transitBoundary: Object.freeze({
      relationOccurrenceId:
        kpFiniteProductEquivalenceFrameOccurrenceIds.relation,
      policy: "preserve-relation-legibility" as const
    }),
    sourceHoldWindow: SOURCE_HOLD,
    factors: Object.freeze(factors),
    targetHoldWindow: TARGET_HOLD,
    clock: Object.freeze({
      authority: "one-normalized-external-clock" as const,
      rendererScheduling: "forbidden" as const
    })
  });
}

export const kpCanonicalFiniteProductExpansionPresentationPlan =
  compileKpFiniteProductExpansionPresentationPlan(
    kpCanonicalFiniteProductExpansionOperation
  );

function window(
  start: number,
  end: number
): KpFiniteProductPresentationWindow {
  if (!Number.isFinite(start) || !Number.isFinite(end) ||
      start < 0 || end > 1 || start > end) {
    throw new Error(
      "Finite-product presentation windows must be ordered in [0, 1]."
    );
  }
  return Object.freeze({ start, end });
}
