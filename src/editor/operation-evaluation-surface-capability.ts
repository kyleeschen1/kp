import {
  kpEditorOperationEvaluationSurfaceAdapter
} from "./operation-evaluation-surface-adapter.ts";
import type {
  KpEditorAnimationSurfaceAdapterRegistry
} from "./animation-surface-adapter-registry.ts";

export function registerKpEditorOperationEvaluationSurfaceCapability(
  registry: KpEditorAnimationSurfaceAdapterRegistry
):
  () => void {
  return registry.register(kpEditorOperationEvaluationSurfaceAdapter);
}
