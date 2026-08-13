import {
  kpEditorExactFractionQuantitySurfaceAdapter
} from "./exact-fraction-quantity-surface-adapter.ts";
import type {
  KpEditorAnimationSurfaceAdapterRegistry
} from "./animation-surface-adapter-registry.ts";

export function registerKpEditorExactFractionQuantitySurfaceCapability(
  registry: KpEditorAnimationSurfaceAdapterRegistry
):
  () => void {
  return registry.register(kpEditorExactFractionQuantitySurfaceAdapter);
}
