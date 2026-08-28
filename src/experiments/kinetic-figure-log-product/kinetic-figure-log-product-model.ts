export const kpLogProductKineticFigureStateIds = [
  "whole",
  "product",
  "transform",
  "result"
] as const;

export type KpLogProductKineticFigureStateId =
  (typeof kpLogProductKineticFigureStateIds)[number];

export type KpLogProductKineticFigurePose =
  | "source"
  | "target";

export type KpLogProductKineticFigureTransitionId =
  "transition.log-product.split";

export interface KpLogProductKineticFigureState {
  readonly id: KpLogProductKineticFigureStateId;
  readonly ordinal: 1 | 2 | 3 | 4;
  readonly label: string;
  readonly pose: KpLogProductKineticFigurePose;
  readonly entryTransitionId?:
    KpLogProductKineticFigureTransitionId | undefined;
  readonly proseTargetId: `prose.log-product.${string}`;
  readonly attentionTargetId?:
    | "semantic.log-product.product"
    | "semantic.log-product.introduced-structure"
    | "semantic.log-product.sum"
    | undefined;
}

/**
 * These are conceptual reading states. The local projection decides how to
 * interpolate between their poses; the model deliberately contains no DOM,
 * color, duration, or pixel instructions.
 */
export const kpLogProductKineticFigureStates:
readonly KpLogProductKineticFigureState[] = Object.freeze([
  Object.freeze({
    id: "whole",
    ordinal: 1,
    label: "Read the expression",
    pose: "source",
    proseTargetId: "prose.log-product.claim"
  }),
  Object.freeze({
    id: "product",
    ordinal: 2,
    label: "Locate the product",
    pose: "source",
    proseTargetId: "prose.log-product.together",
    attentionTargetId: "semantic.log-product.product"
  }),
  Object.freeze({
    id: "transform",
    ordinal: 3,
    label: "Watch the product separate",
    pose: "target",
    entryTransitionId: "transition.log-product.split",
    proseTargetId: "prose.log-product.separates",
    attentionTargetId: "semantic.log-product.introduced-structure"
  }),
  Object.freeze({
    id: "result",
    ordinal: 4,
    label: "Read the rewritten form",
    pose: "target",
    proseTargetId: "prose.log-product.result",
    attentionTargetId: "semantic.log-product.sum"
  })
]);

export function readKpLogProductKineticFigureState(
  value: string | undefined
): KpLogProductKineticFigureState {
  return kpLogProductKineticFigureStates.find(({ id }) => id === value) ??
    kpLogProductKineticFigureStates[0]!;
}
