import "katex/dist/katex.min.css";
import "./finite-sum-surface.css";

import {
  kpEditorFiniteSumSurfaceAdapter
} from "./finite-sum-surface-adapter.ts";
import type {
  KpEditorAnimationSurfaceAdapterRegistry
} from "./animation-surface-adapter-registry.ts";

export function registerKpEditorFiniteSumSurfaceCapability(
  registry: KpEditorAnimationSurfaceAdapterRegistry
): () => void {
  return registry.register(kpEditorFiniteSumSurfaceAdapter);
}
