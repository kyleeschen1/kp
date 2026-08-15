import "katex/dist/katex.min.css";
import "./log-exponent-surface.css";

import {
  kpEditorLogExponentSurfaceAdapter
} from "./log-exponent-surface-adapter.ts";
import type {
  KpEditorAnimationSurfaceAdapterRegistry
} from "./animation-surface-adapter-registry.ts";

export function registerKpEditorLogExponentSurfaceCapability(
  registry: KpEditorAnimationSurfaceAdapterRegistry
): () => void {
  return registry.register(kpEditorLogExponentSurfaceAdapter);
}
