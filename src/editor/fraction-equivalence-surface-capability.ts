import type { KpEditorAnimationSurfaceAdapterRegistry } from
  "./animation-surface-adapter-registry.ts";
import "./fraction-equivalence-surface.css";
import "./common-denominator-pressure-surface.css";
import { kpEditorCommonDenominatorPressureSurfaceAdapter } from
  "./common-denominator-pressure-surface-adapter.ts";
import { kpEditorFractionEquivalenceSurfaceAdapter } from
  "./fraction-equivalence-surface-adapter.ts";

export function registerKpEditorFractionEquivalenceSurfaceCapability(
  registry: KpEditorAnimationSurfaceAdapterRegistry
): () => void {
  const unregister = [
    registry.register(kpEditorFractionEquivalenceSurfaceAdapter),
    registry.register(kpEditorCommonDenominatorPressureSurfaceAdapter)
  ];
  return () => unregister.forEach((dispose) => dispose());
}
