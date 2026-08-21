import "katex/dist/katex.min.css";
import "./even-root-surface.css";

import {
  kpEditorEvenRootSurfaceAdapter
} from "./even-root-surface-adapter.ts";
import type { KpEditorAnimationSurfaceAdapterRegistry } from
  "./animation-surface-adapter-registry.ts";

export function registerKpEditorEvenRootSurfaceCapability(
  registry: KpEditorAnimationSurfaceAdapterRegistry
): () => void {
  return registry.register(kpEditorEvenRootSurfaceAdapter);
}
