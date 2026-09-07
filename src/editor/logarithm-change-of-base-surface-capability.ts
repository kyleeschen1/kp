import "katex/dist/katex.min.css";
import "./logarithm-change-of-base-surface.css";

import {
  createKpEditorLogarithmChangeOfBaseSurfaceAdapter
} from "./logarithm-change-of-base-surface-adapter.ts";
import type {
  KpEditorAnimationSurfaceAdapterRegistry
} from "./animation-surface-adapter-registry.ts";

export function registerKpEditorLogarithmChangeOfBaseSurfaceCapability(
  registry: KpEditorAnimationSurfaceAdapterRegistry,
  semantic?: Parameters<typeof createKpEditorLogarithmChangeOfBaseSurfaceAdapter>[0]
): () => void {
  return registry.register(createKpEditorLogarithmChangeOfBaseSurfaceAdapter(semantic));
}
