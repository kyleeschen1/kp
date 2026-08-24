import type {
  KpEditorAnimationSurfaceSlotKind
} from "./animation-surface-dispatch.ts";
import {
  hasKpSpecializedEquationSurfaceFamily,
  projectKpEquationSurfaceFamily,
  type KpEquationSelectedSurfaceCapability
} from "../domain-ir/equation-surface-family-declarations.ts";
import {
  findKpCrossDomainUpperBoundaryDeclaration,
  type KpCrossDomainSelectedSurfaceCapability
} from "./cross-domain-upper-boundary.ts";

export const kpEditorGraphSvgAnimationIds = Object.freeze([
  "animation.generated.linear-algebra.matrix-vector.two-by-two",
  "animation.graph-2d.quadratic-translate-right-two",
  "animation.graph.vector.linear-map-scale",
  "animation.derivative-rules.tangent-graph",
  "animation.integral-ftc.area-sweep",
  "animation.dot-projection.basic",
  "animation.economics.supply-demand-equilibrium-shift",
  "animation.physics.constant-force-work-energy"
] as const);

export const kpEditorGraph3DAnimationIds = Object.freeze([
  "animation.graph.surface-mode.mesh-to-donut",
  "animation.graph-3d.saddle-denominator-four-to-eight"
] as const);

export function supportsKpEditorGraphSvgAnimation(
  animationId: string
): boolean {
  // Capability selection must stay independent of the renderer chunk. When
  // this predicate lived beside Graph SVG, chunk coalescing pulled KaTeX into
  // unrelated Graph3D and programming selections.
  return (kpEditorGraphSvgAnimationIds as readonly string[])
    .includes(animationId);
}

export type KpEditorSelectedSurfaceCapability =
  | KpEquationSelectedSurfaceCapability
  | KpCrossDomainSelectedSurfaceCapability
  | "graph-svg-katex-labels"
  | "graph-webgl-3d";

export const kpEditorSelectedSurfaceCapabilityValues = Object.freeze([
  "carrier-preserving-simplification",
  "equation-katex",
  "fraction-equivalence",
  "finite-binder-expansion",
  "log-exponent",
  "logarithm-change-of-base",
  "log-quotient",
  "log-product",
  "exponential-homomorphism",
  "even-root",
  "exact-fraction-quantity",
  "operation-evaluation",
  "place-value-addition",
  "graph-svg-economics",
  "graph-svg-katex-labels",
  "graph-webgl-3d",
  "programming-trace"
] as const satisfies readonly KpEditorSelectedSurfaceCapability[]);

export function deriveKpEditorSelectedSurfaceCapabilities(input: {
  readonly animationId: string;
  readonly slotKinds: readonly KpEditorAnimationSurfaceSlotKind[];
}): readonly KpEditorSelectedSurfaceCapability[] {
  const capabilities: KpEditorSelectedSurfaceCapability[] = [];
  const crossDomain = findKpCrossDomainUpperBoundaryDeclaration(
    input.animationId
  );
  if (
    input.slotKinds.includes("equation") ||
    hasKpSpecializedEquationSurfaceFamily(input.animationId)
  ) {
    capabilities.push(
      ...projectKpEquationSurfaceFamily(input.animationId)
        .selectedCapabilityIds
    );
  }
  if (
    crossDomain !== undefined &&
    input.slotKinds.includes(crossDomain.slotKind)
  ) {
    capabilities.push(crossDomain.selectedCapabilityId);
  } else if (
    input.slotKinds.includes("graph") &&
    supportsKpEditorGraphSvgAnimation(input.animationId)
  ) {
    capabilities.push("graph-svg-katex-labels");
  }
  if (
    input.slotKinds.includes("graph") &&
    (kpEditorGraph3DAnimationIds as readonly string[])
      .includes(input.animationId)
  ) {
    capabilities.push("graph-webgl-3d");
  }
  if (
    input.slotKinds.includes("programming") &&
    crossDomain === undefined &&
    (
      input.animationId === "animation.programming.add.execution-trace" ||
      input.animationId === "animation.comparison.linear-solve-programming" ||
      input.animationId ===
        "animation.programming.lisp-lambda-application" ||
      input.animationId ===
        "animation.programming.python-free-shipping-refactor" ||
      input.animationId === "animation.programming.scheme-factorial"
    )
  ) {
    // This capability registers every specialized programming adapter; new
    // programming assets must enter through this selection boundary as well
    // as the pack, or the catalogue can load data it cannot paint.
    capabilities.push("programming-trace");
  }
  return Object.freeze(capabilities);
}
