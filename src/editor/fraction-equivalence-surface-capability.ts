import type { KpEditorAnimationSurfaceAdapterRegistry } from
  "./animation-surface-adapter-registry.ts";
import "./fraction-equivalence-surface.css";
import { kpEditorFractionEquivalenceSurfaceAdapter } from
  "./fraction-equivalence-surface-adapter.ts";

export function registerKpEditorFractionEquivalenceSurfaceCapability(
  registry: KpEditorAnimationSurfaceAdapterRegistry
): () => void {
  return registry.register(kpEditorFractionEquivalenceSurfaceAdapter);
}
