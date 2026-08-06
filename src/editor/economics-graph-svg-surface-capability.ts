import type {
  KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";
import {
  renderKpEconomicsRetainedInlineLatex
} from "../rendering/economics-equilibrium-retained-math.ts";

export async function createKpEconomicsGraphSvgSurfaceCapability():
Promise<KpEditorAnimationSurfaceAdapter> {
  // The learner route selects one renderer. Keeping this import literal makes
  // the economics capability independently chunkable from the editor registry.
  // Prose hydration already owns the retained math corpus on this route; only
  // the graph runtime remains a meaningful lazy boundary.
  const client = await import("./graph-svg-viewport.ts");
  return client.createKpEconomicsGraphSvgViewportAdapter({
    renderInlineLatex: renderKpEconomicsRetainedInlineLatex
  });
}
