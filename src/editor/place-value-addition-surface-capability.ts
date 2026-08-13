import {
  kpEditorPlaceValueAdditionSurfaceAdapter
} from "./place-value-addition-surface-adapter.ts";
import type {
  KpEditorAnimationSurfaceAdapterRegistry
} from "./animation-surface-adapter-registry.ts";

export function registerKpEditorPlaceValueAdditionSurfaceCapability(
  registry: KpEditorAnimationSurfaceAdapterRegistry
):
  () => void {
  return registry.register(kpEditorPlaceValueAdditionSurfaceAdapter);
}
