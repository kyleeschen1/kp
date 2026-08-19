import "./carrier-preserving-simplification-surface.css";

import {
  kpEditorOperationEvaluationSurfaceAdapter
} from "./operation-evaluation-surface-adapter.ts";
import {
  kpEditorCarrierPreservingSimplificationSurfaceAdapter
} from "./carrier-preserving-simplification-surface-adapter.ts";
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
  const disposeCarrierCandidate = registry.register(
    kpEditorCarrierPreservingSimplificationSurfaceAdapter
  );
  return () => {
    disposeCarrierCandidate();
    disposeCanonical();
  };
}
