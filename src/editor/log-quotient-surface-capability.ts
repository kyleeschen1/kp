import "katex/dist/katex.min.css";
import "./log-quotient-surface.css";

import {
  kpEditorLogQuotientSurfaceAdapter
} from "./log-quotient-surface-adapter.ts";
import type {
  KpEditorAnimationSurfaceAdapterRegistry
} from "./animation-surface-adapter-registry.ts";

export function registerKpEditorLogQuotientSurfaceCapability(
  registry: KpEditorAnimationSurfaceAdapterRegistry
): () => void {
  return registry.register(kpEditorLogQuotientSurfaceAdapter);
}
