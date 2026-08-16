import type {
  KpProgrammingExecutionTraceFrame
} from "../domain-ir/programming-execution-trace.ts";
import type {
  LinearMapVectorGraphRuntimeFrame
} from "./graph-runtime-frame.ts";
import {
  attachKpSampledFrameDomainPayload
} from "./sampled-frame-envelope.ts";
import {
  createKpSampledFrameDomainPayload,
  kpGraphDiagramSampledFramePayloadSchemaVersion,
  kpProgramTraceSampledFramePayloadSchemaVersion,
  type KpGraphDiagramSampledFramePayload,
  type KpProgramTraceSampledFramePayload
} from "./sampled-frame-payload.ts";
import type {
  KpAnimationRuntimeFrame
} from "./runtime-sampler.ts";

export interface KpGraphDiagramSampledFrameAdaptation {
  readonly runtimeFrame: KpAnimationRuntimeFrame;
  readonly compatibilityFrame: LinearMapVectorGraphRuntimeFrame;
  readonly payload: KpGraphDiagramSampledFramePayload;
}

export interface KpProgramTraceSampledFrameAdaptation {
  readonly runtimeFrame: KpAnimationRuntimeFrame;
  readonly compatibilityFrame: KpProgrammingExecutionTraceFrame;
  readonly payload: KpProgramTraceSampledFramePayload;
}

export function adaptKpGraphDiagramSampledRuntimeFrame(input: {
  readonly runtimeFrame: KpAnimationRuntimeFrame;
  readonly graphFrame: LinearMapVectorGraphRuntimeFrame;
}): KpGraphDiagramSampledFrameAdaptation {
  assertRuntimeIdentity(input.runtimeFrame, {
    animationId: input.graphFrame.animationId,
    runtimeFrameId: input.graphFrame.runtimeFrameId,
    progress: input.graphFrame.progress,
    frameId: input.graphFrame.id
  });
  const payload = createKpSampledFrameDomainPayload({
    domain: "graph-diagram",
    schemaVersion: kpGraphDiagramSampledFramePayloadSchemaVersion,
    kind: "graph-diagram-frame-payload",
    frameId: input.graphFrame.id,
    sceneId: input.graphFrame.graphId,
    surface: "graph",
    entityIds: [
      input.graphFrame.graphId,
      input.graphFrame.linearMapId,
      input.graphFrame.sourceVectorId,
      input.graphFrame.targetVectorId
    ],
    relationIds: [input.graphFrame.linearMapId],
    groupIds: [],
    regionIds: [input.graphFrame.graphId],
    activeSelectorIds: input.runtimeFrame.focusSelectorIds,
    numericSamples: [
      {
        entityId: input.graphFrame.sourceVectorId,
        role: "source",
        components: input.graphFrame.sourceCoordinates
      },
      {
        entityId: input.graphFrame.targetVectorId,
        role: "target",
        components: input.graphFrame.targetCoordinates
      },
      {
        entityId: input.graphFrame.targetVectorId,
        role: "current",
        components: input.graphFrame.currentCoordinates
      }
    ]
  });

  return Object.freeze({
    runtimeFrame: {
      ...input.runtimeFrame,
      envelope: attachKpSampledFrameDomainPayload(
        input.runtimeFrame.envelope,
        payload
      )
    },
    compatibilityFrame: input.graphFrame,
    payload
  });
}

export function adaptKpProgramTraceSampledRuntimeFrame(input: {
  readonly runtimeFrame: KpAnimationRuntimeFrame;
  readonly traceFrame: KpProgrammingExecutionTraceFrame;
}): KpProgramTraceSampledFrameAdaptation {
  assertRuntimeIdentity(input.runtimeFrame, {
    animationId: input.runtimeFrame.animationId,
    runtimeFrameId: input.runtimeFrame.id,
    progress: input.traceFrame.progress,
    frameId: input.traceFrame.stepId
  });
  const payload = createKpSampledFrameDomainPayload({
    domain: "program-trace",
    schemaVersion: kpProgramTraceSampledFramePayloadSchemaVersion,
    kind: "program-trace-frame-payload",
    frameId: `program-trace-frame.${input.runtimeFrame.id}`,
    traceId: input.traceFrame.traceId,
    sourceFileId: input.traceFrame.sourceFileId,
    sharedClockId: input.traceFrame.sharedClockId,
    step: {
      index: input.traceFrame.stepIndex,
      id: input.traceFrame.stepId,
      kind: input.traceFrame.kind,
      ...(input.traceFrame.summary === undefined
        ? {}
        : { summary: input.traceFrame.summary })
    },
    activeSelectorIds: input.traceFrame.activeSelectorIds,
    stack: input.traceFrame.stack,
    locals: input.traceFrame.locals,
    output: input.traceFrame.output
  });

  return Object.freeze({
    runtimeFrame: {
      ...input.runtimeFrame,
      envelope: attachKpSampledFrameDomainPayload(
        input.runtimeFrame.envelope,
        payload
      )
    },
    compatibilityFrame: input.traceFrame,
    payload
  });
}

function assertRuntimeIdentity(
  runtimeFrame: KpAnimationRuntimeFrame,
  domainFrame: {
    readonly animationId: string;
    readonly runtimeFrameId: string;
    readonly progress: number;
    readonly frameId: string;
  }
): void {
  if (
    runtimeFrame.animationId !== domainFrame.animationId ||
    runtimeFrame.id !== domainFrame.runtimeFrameId
  ) {
    throw new Error(
      `Domain frame ${domainFrame.frameId} does not belong to runtime frame ${runtimeFrame.id}.`
    );
  }
  if (Math.abs(runtimeFrame.clock.progress - domainFrame.progress) > 1e-9) {
    throw new Error(
      `Domain frame ${domainFrame.frameId} progress does not match runtime frame ${runtimeFrame.id}.`
    );
  }
}
