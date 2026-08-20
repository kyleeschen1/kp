import "katex/dist/katex.min.css";
import "./exponential-homomorphism-surface.css";

import {
  kpEditorExponentialHomomorphismSurfaceAdapter
} from "./exponential-homomorphism-surface-adapter.ts";
import type {
  KpEditorAnimationSurfaceAdapterRegistry
} from "./animation-surface-adapter-registry.ts";

export function registerKpEditorExponentialHomomorphismSurfaceCapability(
  registry: KpEditorAnimationSurfaceAdapterRegistry
): () => void {
  return registry.register(kpEditorExponentialHomomorphismSurfaceAdapter);
}
