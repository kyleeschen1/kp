import "katex/dist/katex.min.css";
import "./finite-sum-surface.css";
import "./finite-product-surface.css";

import { kpEditorFiniteSumSurfaceAdapter } from
  "./finite-sum-surface-adapter.ts";
import { kpEditorFiniteProductSurfaceAdapter } from
  "./finite-product-surface-adapter.ts";
import type { KpEditorAnimationSurfaceAdapterRegistry } from
  "./animation-surface-adapter-registry.ts";

export function registerKpEditorFiniteBinderSurfaceCapability(
  registry: KpEditorAnimationSurfaceAdapterRegistry
): () => void {
  const unregister = [
    registry.register(kpEditorFiniteSumSurfaceAdapter),
    registry.register(kpEditorFiniteProductSurfaceAdapter)
  ];
  return () => [...unregister].reverse().forEach((dispose) => dispose());
}
