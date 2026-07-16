import type { KpEnvelopeBridge } from "./material-continuity.ts";

export interface KpBridgedChoreographyStep {
  readonly transformationId: string;
  readonly weight: number;
}

export interface KpBridgedChoreographySequence {
  readonly id: string;
  readonly steps: readonly KpBridgedChoreographyStep[];
  readonly bridges: readonly KpEnvelopeBridge[];
  readonly boundaries: readonly number[];
  readonly bridgeSpan: number;
}

export interface KpBridgedChoreographyFrame {
  readonly semanticProgress: number;
  readonly stepIndex: number;
  readonly transformationId: string;
  readonly stepLocalProgress: number;
  readonly activeBridge?: {
    readonly bridge: KpEnvelopeBridge;
    readonly progress: number;
    readonly boundary: number;
  };
  readonly suppressStepOrient: boolean;
  readonly suppressStepRelease: boolean;
}

export function compileKpBridgedChoreographySequence(input: {
  readonly id: string;
  readonly steps: readonly KpBridgedChoreographyStep[];
  readonly bridges: readonly KpEnvelopeBridge[];
  readonly bridgeSpan?: number;
}): KpBridgedChoreographySequence {
  if (input.steps.length === 0) {
    throw new Error("Bridged choreography requires at least one step.");
  }
  const totalWeight = input.steps.reduce((sum, step) => {
    if (!Number.isFinite(step.weight) || step.weight <= 0) {
      throw new Error(`Step ${step.transformationId} must have positive weight.`);
    }
    return sum + step.weight;
  }, 0);
  const boundaries: number[] = [];
  let cumulative = 0;
  for (const step of input.steps.slice(0, -1)) {
    cumulative += step.weight / totalWeight;
    boundaries.push(round(cumulative));
  }
  for (const [index, bridge] of input.bridges.entries()) {
    const left = input.steps[index];
    const right = input.steps[index + 1];
    if (
      left === undefined ||
      right === undefined ||
      bridge.fromTransformationId !== left.transformationId ||
      bridge.toTransformationId !== right.transformationId
    ) {
      throw new Error(
        `Bridge ${bridge.id} must connect adjacent choreography steps in order.`
      );
    }
  }
  if (input.bridges.length !== Math.max(0, input.steps.length - 1)) {
    throw new Error("Bridged choreography requires one bridge per step boundary.");
  }
  const bridgeSpan = input.bridgeSpan ?? 0.04;
  if (!Number.isFinite(bridgeSpan) || bridgeSpan <= 0 || bridgeSpan >= 0.25) {
    throw new Error("Bridge span must be between zero and 0.25.");
  }
  return {
    id: input.id,
    steps: input.steps,
    bridges: input.bridges,
    boundaries,
    bridgeSpan
  };
}

export function sampleKpBridgedChoreographySequence(input: {
  readonly sequence: KpBridgedChoreographySequence;
  readonly progress: number;
  readonly direction?: "forward" | "rewind";
}): KpBridgedChoreographyFrame {
  const requested = clamp01(input.progress);
  const semanticProgress = round(
    input.direction === "rewind" ? 1 - requested : requested
  );
  const stepIndex = Math.min(
    input.sequence.steps.length - 1,
    input.sequence.boundaries.findIndex((boundary) => semanticProgress < boundary) === -1
      ? input.sequence.steps.length - 1
      : input.sequence.boundaries.findIndex(
          (boundary) => semanticProgress < boundary
        )
  );
  const stepStart = stepIndex === 0
    ? 0
    : input.sequence.boundaries[stepIndex - 1]!;
  const stepEnd = input.sequence.boundaries[stepIndex] ?? 1;
  const stepLocalProgress = round(clamp01(
    (semanticProgress - stepStart) / (stepEnd - stepStart)
  ));
  const bridgeIndex = input.sequence.boundaries.findIndex((boundary) =>
    Math.abs(semanticProgress - boundary) <= input.sequence.bridgeSpan / 2
  );
  const activeBridge = bridgeIndex < 0
    ? undefined
    : {
        bridge: input.sequence.bridges[bridgeIndex]!,
        progress: round(clamp01(
          (
            semanticProgress -
            (
              input.sequence.boundaries[bridgeIndex]! -
              input.sequence.bridgeSpan / 2
            )
          ) / input.sequence.bridgeSpan
        )),
        boundary: input.sequence.boundaries[bridgeIndex]!
      };
  return {
    semanticProgress,
    stepIndex,
    transformationId:
      input.sequence.steps[stepIndex]!.transformationId,
    stepLocalProgress,
    ...(activeBridge === undefined ? {} : { activeBridge }),
    suppressStepOrient:
      stepIndex > 0 &&
      (
        activeBridge?.bridge.attention === "hold" ||
        activeBridge?.bridge.attention === "transfer"
      ),
    suppressStepRelease:
      stepIndex < input.sequence.steps.length - 1 &&
      (
        activeBridge?.bridge.attention === "hold" ||
        activeBridge?.bridge.attention === "transfer"
      )
  };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Bridged choreography progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  const result = Math.round(value * 1_000_000) / 1_000_000;
  return Object.is(result, -0) ? 0 : result;
}
