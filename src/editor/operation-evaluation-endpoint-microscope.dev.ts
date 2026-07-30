import {
  observeKpNativeKatexSuccessorEndpoint,
  type KpNativeKatexSuccessorEndpointCheckpoint,
  type KpNativeKatexSuccessorEndpointSnapshot
} from "../rendering/native-katex-successor-endpoint-microscope.ts";
import type {
  KpNativeKatexRenderedSceneObservation
} from "../rendering/native-katex-rendered-scene.ts";

export interface KpOperationEvaluationEndpointMicroscopeSession {
  readonly observe: (
    checkpoint: KpNativeKatexSuccessorEndpointCheckpoint
  ) => KpNativeKatexSuccessorEndpointSnapshot;
  readonly dispose: () => void;
}

export interface KpOperationEvaluationEndpointMicroscopeStage
extends HTMLElement {
  __kpObserveSuccessorEndpoint?: (
    checkpoint: KpNativeKatexSuccessorEndpointCheckpoint
  ) => KpNativeKatexSuccessorEndpointSnapshot;
}

/**
 * Development-only bridge for browser evidence. The target scene keeps the
 * exact atom correlation; this bridge does not serialize DOM or promote pixel
 * observations into semantic authority.
 */
export function mountKpOperationEvaluationEndpointMicroscope(input: {
  readonly stage: HTMLElement;
  readonly targetScene: KpNativeKatexRenderedSceneObservation;
}): KpOperationEvaluationEndpointMicroscopeSession {
  const stage = input.stage as
    KpOperationEvaluationEndpointMicroscopeStage;
  const observe = (
    checkpoint: KpNativeKatexSuccessorEndpointCheckpoint
  ) => observeKpNativeKatexSuccessorEndpoint({
    checkpoint,
    stage,
    targetScene: input.targetScene
  });
  stage.__kpObserveSuccessorEndpoint = observe;
  return Object.freeze({
    observe,
    dispose() {
      delete stage.__kpObserveSuccessorEndpoint;
    }
  });
}
