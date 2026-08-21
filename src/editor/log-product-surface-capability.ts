import "katex/dist/katex.min.css";
import "./log-product-surface.css";

import {
  kpEditorLogProductSurfaceAdapter
} from "./log-product-surface-adapter.ts";
import { kpEditorLogProductEquivalenceFrameSurfaceAdapter } from
  "./log-product-equivalence-frame-surface-adapter.ts";
import type {
  KpEditorAnimationSurfaceAdapterRegistry
} from "./animation-surface-adapter-registry.ts";

export function registerKpEditorLogProductSurfaceCapability(
  registry: KpEditorAnimationSurfaceAdapterRegistry
): () => void {
  const unregister = [
    registry.register(kpEditorLogProductSurfaceAdapter),
    registry.register(kpEditorLogProductEquivalenceFrameSurfaceAdapter)
  ];
  return () => unregister.reverse().forEach((dispose) => dispose());
}
