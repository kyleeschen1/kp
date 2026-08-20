import {
  kpEditorCarrierPreservingSimplificationSurfaceAdapter
} from "./carrier-preserving-simplification-surface-adapter.ts";
import type {
  KpEditorAnimationSurfaceAdapterRegistry
} from "./animation-surface-adapter-registry.ts";

export function registerKpEditorCarrierPreservingSimplificationSurfaceCapability(
  registry: KpEditorAnimationSurfaceAdapterRegistry
): () => void {
  return registry.register(
    kpEditorCarrierPreservingSimplificationSurfaceAdapter
  );
}
