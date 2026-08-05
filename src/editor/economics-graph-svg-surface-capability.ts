import type {
  KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";

export async function createKpEconomicsGraphSvgSurfaceCapability():
Promise<KpEditorAnimationSurfaceAdapter> {
  // The learner route selects one renderer. Keeping this import literal makes
  // the economics capability independently chunkable from the editor registry.
  const client = await import("./graph-svg-viewport.ts");
  return client.createKpEconomicsGraphSvgViewportAdapter();
}
