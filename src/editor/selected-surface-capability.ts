import type {
  KpEditorAnimationSurfaceSlotKind
} from "./animation-surface-dispatch.ts";

export const kpEditorGraphSvgAnimationIds = Object.freeze([
  "animation.generated.linear-algebra.matrix-vector.two-by-two",
  "animation.graph.vector.linear-map-scale",
  "animation.derivative-rules.tangent-graph",
  "animation.integral-ftc.area-sweep",
  "animation.dot-projection.basic",
  "animation.economics.supply-demand-equilibrium-shift",
  "animation.physics.constant-force-work-energy"
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
  | "equation-katex"
  | "log-exponent"
  | "log-quotient"
  | "log-product"
  | "exact-fraction-quantity"
  | "operation-evaluation"
  | "place-value-addition"
  | "graph-svg-economics"
  | "graph-svg-katex-labels"
  | "graph-webgl-3d"
  | "programming-trace";

export function deriveKpEditorSelectedSurfaceCapabilities(input: {
  readonly animationId: string;
  readonly slotKinds: readonly KpEditorAnimationSurfaceSlotKind[];
}): readonly KpEditorSelectedSurfaceCapability[] {
  const capabilities: KpEditorSelectedSurfaceCapability[] = [];
  if (
    input.animationId ===
      "animation.exact-fraction-quantity.third-plus-sixth"
  ) capabilities.push("exact-fraction-quantity");
  if (input.animationId.startsWith("animation.operation-evaluation.")) {
    capabilities.push("operation-evaluation");
  }
  if (
    input.animationId === "animation.place-value-addition.278-plus-156"
  ) capabilities.push("place-value-addition");
  if (
    input.animationId ===
      "animation.algebra.log-exponent.solve-two-power-x"
  ) capabilities.push("log-exponent");
  if (
    input.animationId ===
      "animation.algebra.log-quotient.difference-to-quotient"
  ) capabilities.push("log-quotient");
  if (
    input.animationId.startsWith("animation.algebra.log-product.")
  ) capabilities.push("log-product");
  if (
    input.slotKinds.includes("equation") &&
    input.animationId !==
      "animation.algebra.log-exponent.solve-two-power-x" &&
    input.animationId !==
      "animation.algebra.log-quotient.difference-to-quotient" &&
    !input.animationId.startsWith("animation.algebra.log-product.")
  ) {
    capabilities.push("equation-katex");
  }
  if (
    input.slotKinds.includes("graph") &&
    input.animationId ===
      "animation.economics.supply-demand-equilibrium-shift"
  ) {
    capabilities.push("graph-svg-economics");
  } else if (
    input.slotKinds.includes("graph") &&
    supportsKpEditorGraphSvgAnimation(input.animationId)
  ) {
    capabilities.push("graph-svg-katex-labels");
  }
  if (
    input.slotKinds.includes("graph") &&
    input.animationId === "animation.graph.surface-mode.mesh-to-donut"
  ) {
    capabilities.push("graph-webgl-3d");
  }
  if (
    input.slotKinds.includes("programming") &&
    (
      input.animationId === "animation.programming.add.execution-trace" ||
      input.animationId === "animation.comparison.linear-solve-programming" ||
      input.animationId ===
        "animation.programming.typescript-free-shipping-refactor" ||
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
