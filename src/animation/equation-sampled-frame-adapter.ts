import type {
  KpEquationFrame,
  KpEquationFrameObjectRole
} from "../semantic/equation-frame-interpreter.ts";
import type {
  KpAnimationAssetTransformationTreeDirection
} from "./asset.ts";
import {
  attachKpSampledFrameDomainPayload
} from "./sampled-frame-envelope.ts";
import {
  createKpSampledFrameDomainPayload,
  kpEquationSampledFramePayloadSchemaVersion,
  type KpEquationSampledFramePayload
} from "./sampled-frame-payload.ts";
import type {
  KpAnimationRuntimeFrame
} from "./runtime-sampler.ts";

export interface KpEquationSampledFrameAdaptation {
  readonly runtimeFrame: KpAnimationRuntimeFrame;
  // The semantic interpreter contract remains the public compatibility view.
  readonly compatibilityFrame: KpEquationFrame;
  readonly payload: KpEquationSampledFramePayload;
}

export function createKpEquationSampledFramePayload(input: {
  readonly frame: KpEquationFrame;
  readonly direction?: KpAnimationAssetTransformationTreeDirection | undefined;
}): KpEquationSampledFramePayload {
  const direction = input.direction ?? "forward";
  const payload: KpEquationSampledFramePayload = {
    domain: "equation",
    schemaVersion: kpEquationSampledFramePayloadSchemaVersion,
    kind: "equation-frame-payload",
    frameId: input.frame.id,
    assetId: input.frame.assetId,
    surface: input.frame.surface,
    objects: input.frame.objectRefs.map((object) => ({
      objectId: object.objectId,
      ...(object.role === undefined
        ? {}
        : { role: orientObjectRole(object.role, direction) })
    })),
    selectors: input.frame.selectorRefs.map((selector) => ({
      selectorId: selector.selectorId,
      objectId: selector.objectId,
      ...(selector.role === undefined ? {} : { role: selector.role })
    })),
    correspondences: input.frame.selectorCorrespondenceRefs.map(
      (correspondence) => ({
        sourceSelectorId:
          direction === "forward"
            ? correspondence.sourceSelectorId
            : correspondence.targetSelectorId,
        targetSelectorId:
          direction === "forward"
            ? correspondence.targetSelectorId
            : correspondence.sourceSelectorId,
        preserves: [...correspondence.preserves]
      })
    )
  };

  return createKpSampledFrameDomainPayload(payload);
}

export function adaptKpEquationSampledRuntimeFrame(input: {
  readonly runtimeFrame: KpAnimationRuntimeFrame;
  readonly equationFrame: KpEquationFrame;
}): KpEquationSampledFrameAdaptation {
  assertClockParity(input.runtimeFrame, input.equationFrame);
  assertTransformationClosure(input.runtimeFrame, input.equationFrame);
  const payload = createKpEquationSampledFramePayload({
    frame: input.equationFrame,
    direction: input.runtimeFrame.clock.direction
  });
  const runtimeFrame = {
    ...input.runtimeFrame,
    envelope: attachKpSampledFrameDomainPayload(
      input.runtimeFrame.envelope,
      payload
    )
  };

  return Object.freeze({
    runtimeFrame,
    compatibilityFrame: input.equationFrame,
    payload
  });
}

function assertClockParity(
  runtimeFrame: KpAnimationRuntimeFrame,
  equationFrame: KpEquationFrame
): void {
  if (Math.abs(runtimeFrame.clock.progress - equationFrame.progress) > 1e-9) {
    throw new Error(
      `Equation frame ${equationFrame.id} progress does not match runtime frame ${runtimeFrame.id}.`
    );
  }
}

function assertTransformationClosure(
  runtimeFrame: KpAnimationRuntimeFrame,
  equationFrame: KpEquationFrame
): void {
  const active = new Set(runtimeFrame.activeTransformationIds);
  const missing = equationFrame.activeTransformationIds.filter(
    (transformationId) => !active.has(transformationId)
  );
  if (missing.length > 0) {
    throw new Error(
      `Equation frame ${equationFrame.id} references inactive runtime transformations: ${missing.join(", ")}.`
    );
  }
}

function orientObjectRole(
  role: KpEquationFrameObjectRole,
  direction: KpAnimationAssetTransformationTreeDirection
): KpEquationFrameObjectRole {
  if (direction === "forward") return role;
  if (role === "source") return "target";
  if (role === "target") return "source";
  return role;
}
