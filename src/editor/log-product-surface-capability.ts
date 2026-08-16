import "katex/dist/katex.min.css";
import "./log-product-surface.css";

import {
  kpEditorLogProductSurfaceAdapter
} from "./log-product-surface-adapter.ts";
import type {
  KpEditorAnimationSurfaceAdapterRegistry
} from "./animation-surface-adapter-registry.ts";

export function registerKpEditorLogProductSurfaceCapability(
  registry: KpEditorAnimationSurfaceAdapterRegistry
): () => void {
  return registry.register(kpEditorLogProductSurfaceAdapter);
}
