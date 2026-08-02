export const kpEditorGraphSvgAnimationIds = Object.freeze([
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
  // This small authority lets the host choose the graph capability without
  // importing the renderer (and therefore KaTeX) just to ask if it applies.
  return (kpEditorGraphSvgAnimationIds as readonly string[])
    .includes(animationId);
}
