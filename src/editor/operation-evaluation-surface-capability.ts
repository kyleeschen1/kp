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
  const disposeCanonical = registry.register(
    kpEditorOperationEvaluationSurfaceAdapter
  );
  return disposeCanonical;
}
