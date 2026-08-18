import "katex/dist/katex.min.css";
import "./logarithm-change-of-base-surface.css";

import {
  kpEditorLogarithmChangeOfBaseSurfaceAdapter
} from "./logarithm-change-of-base-surface-adapter.ts";
import type {
  KpEditorAnimationSurfaceAdapterRegistry
} from "./animation-surface-adapter-registry.ts";

export function registerKpEditorLogarithmChangeOfBaseSurfaceCapability(
  registry: KpEditorAnimationSurfaceAdapterRegistry
): () => void {
  return registry.register(kpEditorLogarithmChangeOfBaseSurfaceAdapter);
}
