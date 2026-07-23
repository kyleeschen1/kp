import {
  defaultEquationTransformVisualMotifRules
} from "../rendering/equation-visual-motif-defaults.ts";
import type { EquationVisualMotifKind } from "../rendering/visual-motif.ts";
import type {
  KpEditorEquationTransitionProjection
} from "./equation-runtime-frame-projection.ts";

export interface KpEditorEquationTransitionMotifFrame {
  readonly kind: EquationVisualMotifKind;
  readonly progress: number;
  readonly source: KpEditorEquationTransitionLayerMotion;
  readonly target: KpEditorEquationTransitionLayerMotion;
  readonly focusLabels: readonly string[];
}

export interface KpEditorEquationTransitionLayerMotion {
  readonly opacity: number;
  readonly translateX: number;
  readonly translateY: number;
  readonly scale: number;
  readonly blurPx: number;
  readonly rotateY: number;
}

export function createKpEditorEquationTransitionMotifFrame(input: {
  readonly transition: KpEditorEquationTransitionProjection;
  readonly progress: number;
}): KpEditorEquationTransitionMotifFrame {
  const progress = Math.min(1, Math.max(0, input.progress));
  const kind = motifKindForTransition(input.transition);
  const focusLabels = unique(
    [...input.transition.source, ...input.transition.target]
      .flatMap((object) => object.selectors)
      .filter((selector) => selector.focused)
      .flatMap((selector) => selector.label === undefined ? [] : [selector.label])
  );

  return {
    kind,
    progress,
    source: sourceMotion(kind, progress),
    target: targetMotion(kind, progress),
    focusLabels
  };
}

export function motifKindForTransition(
  transition: KpEditorEquationTransitionProjection
): EquationVisualMotifKind {
  if (transition.transformType === "computeDotProduct") {
    return "dot-product-accumulate";
  }
  return defaultEquationTransformVisualMotifRules.find(
    (rule) => rule.transformationKind === transition.transformType
  )?.descriptor.kind ?? "artifact-replace";
}

function sourceMotion(
  kind: EquationVisualMotifKind,
  progress: number
): KpEditorEquationTransitionLayerMotion {
  switch (kind) {
    case "append-after-shift":
      return motion(1 - progress, -12 * progress, 0, 1, 0);
    case "cancelation":
      return motion(1 - progress, 0, 0, 1 - 0.18 * progress, 0.8 * progress);
    case "copy-fan-out":
      return motion(1 - progress, 0, 0, 1 - 0.32 * progress, 0);
    case "dot-product-accumulate":
      return motion(1 - progress, 0, 0, 1, 0);
    case "exponent-factor-peel":
    case "fraction-factor-split":
      return motion(1 - progress, 0, 0, 1 - 0.18 * progress, 0);
    case "fraction-common-factor-extract":
      return motion(1 - progress, 0, 0, 1, 0);
    case "exponent-unit-absorb":
    case "fraction-unit-absorb":
      return motion(1 - progress, 0, 0, 1 - 0.08 * progress, 0);
    case "derivative-power":
      return motion(1 - progress, 0, 0, 1, 0);
    case "limit-convergence":
      return motion(1 - progress, 0, 0, 1, 0);
    case "merge-fan-in":
      return motion(1 - progress, 0, 0, 1, 0);
    case "matrix-row-compose":
      return motion(1, 0, 0, 1, 0);
    case "matrix-cell-compose":
      return motion(1, 0, 0, 1, 0);
    case "radical-corner-transfer":
      return motion(1 - progress, 0, 0, 1, 0);
    case "relation-flip":
      return motion(1 - progress, 0, 0, 1, 0, -90 * progress);
    case "simplify-into":
      return motion(1 - progress, 0, 0, 1 - 0.12 * progress, 0);
    case "substitute":
      return motion(1 - progress, 0, 0, 1 - 0.08 * progress, 0);
    case "wrap":
      return motion(1 - progress, -6 * progress, 0, 1 - 0.04 * progress, 0);
    case "unwrap":
      return motion(1 - progress, 6 * progress, 0, 1 - 0.1 * progress, progress);
    case "artifact-enter":
    case "artifact-exit":
    case "artifact-replace":
      return motion(1 - progress, 0, -6 * progress, 1 - 0.02 * progress, 0);
  }
}

function targetMotion(
  kind: EquationVisualMotifKind,
  progress: number
): KpEditorEquationTransitionLayerMotion {
  switch (kind) {
    case "append-after-shift":
      return motion(progress, 16 * (1 - progress), 0, 1, 0);
    case "cancelation":
      return motion(progress, 0, 0, 0.9 + 0.1 * progress, 0);
    case "copy-fan-out":
      return motion(progress, 0, 0, 0.68 + 0.32 * progress, 0);
    case "dot-product-accumulate":
      return motion(progress, 0, 0, 0.9 + 0.1 * progress, 0);
    case "exponent-factor-peel":
    case "fraction-factor-split":
      return motion(progress, 0, 0, 0.82 + 0.18 * progress, 0);
    case "fraction-common-factor-extract":
      return motion(progress, 0, 0, 0.88 + 0.12 * progress, 0);
    case "exponent-unit-absorb":
    case "fraction-unit-absorb":
      return motion(progress, 0, 0, 0.92 + 0.08 * progress, 0);
    case "derivative-power":
      return motion(progress, 0, 0, 1, 0);
    case "limit-convergence":
      return motion(progress, 0, 0, 1, 0);
    case "merge-fan-in":
      return motion(progress, 0, 0, 0.68 + 0.32 * progress, 0);
    case "matrix-row-compose":
      return motion(1, 0, 0, 1, 0);
    case "matrix-cell-compose":
      return motion(1, 0, 0, 1, 0);
    case "radical-corner-transfer":
      return motion(progress, 0, 0, 1, 0);
    case "relation-flip":
      return motion(progress, 0, 0, 1, 0, 90 * (1 - progress));
    case "simplify-into":
      return motion(progress, 0, 0, 0.86 + 0.14 * progress, 0);
    case "substitute":
      return motion(progress, 0, 0, 0.82 + 0.18 * progress, 0);
    case "wrap":
      return motion(progress, 6 * (1 - progress), 0, 0.9 + 0.1 * progress, 0);
    case "unwrap":
      return motion(progress, -6 * (1 - progress), 0, 0.94 + 0.06 * progress, 0);
    case "artifact-enter":
    case "artifact-exit":
    case "artifact-replace":
      return motion(progress, 0, 6 * (1 - progress), 0.98 + 0.02 * progress, 0);
  }
}

function motion(
  opacity: number,
  translateX: number,
  translateY: number,
  scale: number,
  blurPx: number,
  rotateY: number = 0
): KpEditorEquationTransitionLayerMotion {
  return { opacity, translateX, translateY, scale, blurPx, rotateY };
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}
