import type {
  KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";

export async function createKpEconomicsGraphSvgSurfaceCapability():
Promise<KpEditorAnimationSurfaceAdapter> {
  // The learner route selects one renderer. Keeping this import literal makes
  // the economics capability independently chunkable from the editor registry.
  const [client, math] = await Promise.all([
    import("./graph-svg-viewport.ts"),
    import("../rendering/economics-equilibrium-retained-math.ts")
  ]);
  return client.createKpEconomicsGraphSvgViewportAdapter({
    renderInlineLatex: math.renderKpEconomicsRetainedInlineLatex
  });
}
