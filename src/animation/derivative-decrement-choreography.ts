import type { KpAssetBundle } from "../semantic/asset.ts";
import type { KpSemanticTransformation } from
  "../semantic/asset-transformation.ts";

export const kpDerivativeDecrementPhaseIds = [
  "orient-decrement",
  "reflow-context",
  "hold-decrement",
  "withdraw-decrement",
  "resolve-exponent",
  "settle-result",
  "release-result-focus"
] as const;

export type KpDerivativeDecrementPhaseId =
  (typeof kpDerivativeDecrementPhaseIds)[number];

export interface KpDerivativeDecrementChoreographyPlan {
  readonly kind: "derivative-decrement-choreography-plan";
  readonly id: string;
  readonly transformationId: string;
  readonly operationId: "kp.arithmetic.subtract";
  readonly contextRecordIds: readonly string[];
  readonly evaluation: {
    readonly recordId: string;
    readonly minuendSelectorId: string;
    readonly decrementOperatorSelectorId: string;
    readonly decrementAmountSelectorId: string;
    readonly resultSelectorId: string;
  };
}

export interface KpDerivativeDecrementChoreographyFrame {
  readonly kind: "derivative-decrement-choreography-frame";
  readonly planId: string;
  readonly direction: "forward" | "rewind";
  readonly progress: number;
  readonly semanticProgress: number;
  readonly phases: Readonly<Record<KpDerivativeDecrementPhaseId, number>>;
  readonly contextReflowProgress: number;
  readonly minuend: {
    readonly pathProgress: number;
    readonly opacity: number;
  };
  readonly decrementCause: {
    readonly withdrawalProgress: number;
    readonly opacity: number;
  };
  readonly result: {
    readonly recognitionProgress: number;
    readonly opacity: number;
  };
  readonly attention: {
    readonly decrementCause: number;
    readonly result: number;
  };
  readonly settlementProgress: number;
}

export function compileKpDerivativeDecrementChoreography(input: {
  readonly id: string;
  readonly transformation: KpSemanticTransformation;
  readonly bundle: KpAssetBundle;
}): KpDerivativeDecrementChoreographyPlan {
  if (input.id.trim() === "") {
    throw new Error("Derivative decrement choreography id must not be empty.");
  }
  if (input.transformation.transformType !== "simplifyConstantDifference") {
    throw new Error(
      "Derivative decrement choreography requires constant-difference evaluation."
    );
  }
  const correspondence = input.transformation.correspondenceMap;
  if (correspondence === undefined) {
    throw new Error("Derivative decrement choreography requires correspondence.");
  }
  const selectors = new Map(input.bundle.objects.flatMap((object) =>
    object.selectors.map((selector) => [selector.id, selector] as const)
  ));
  const byRole = (role: string) => [...selectors.values()].filter(
    (selector) => selector.metadata?.["successorRole"] === role &&
      selector.metadata?.["successorOperationId"] === "kp.arithmetic.subtract"
  );
  const minuend = singleSelector(byRole("minuend"), "minuend");
  const decrementOperator = singleSelector(
    byRole("subtraction-operator"),
    "subtraction operator"
  );
  const decrementAmount = singleSelector(byRole("subtrahend"), "subtrahend");
  const result = singleSelector(byRole("evaluated-difference"), "result");
  const evaluation = correspondence.records.find((record) =>
    record.relation === "fan-in" &&
    sameIds(record.sourceSelectorIds, [
      minuend.id,
      decrementOperator.id,
      decrementAmount.id
    ]) &&
    sameIds(record.targetSelectorIds, [result.id])
  );
  const contextRecords = correspondence.records.filter((record) =>
    record.relation === "identity"
  );
  if (evaluation === undefined || contextRecords.length !== 2) {
    throw new Error(
      "Derivative decrement choreography requires two persistent context records and one exact subtraction fan-in."
    );
  }
  return Object.freeze({
    kind: "derivative-decrement-choreography-plan" as const,
    id: input.id,
    transformationId: input.transformation.id,
    operationId: "kp.arithmetic.subtract" as const,
    contextRecordIds: Object.freeze(contextRecords.map(({ id }) => id)),
    evaluation: Object.freeze({
      recordId: evaluation.id,
      minuendSelectorId: minuend.id,
      decrementOperatorSelectorId: decrementOperator.id,
      decrementAmountSelectorId: decrementAmount.id,
      resultSelectorId: result.id
    })
  });
}

export function sampleKpDerivativeDecrementChoreography(input: {
  readonly plan: KpDerivativeDecrementChoreographyPlan;
  readonly progress: number;
  readonly direction?: "forward" | "rewind" | undefined;
}): KpDerivativeDecrementChoreographyFrame {
  const progress = clamp01(input.progress);
  const direction = input.direction ?? "forward";
  const p = roundProgress(direction === "forward" ? progress : 1 - progress);
  const phases: Readonly<Record<KpDerivativeDecrementPhaseId, number>> = {
    "orient-decrement": phaseProgress(p, 0, 0.18),
    "reflow-context": phaseProgress(p, 0.08, 0.36),
    "hold-decrement": phaseProgress(p, 0.3, 0.5),
    "withdraw-decrement": phaseProgress(p, 0.5, 0.72),
    "resolve-exponent": phaseProgress(p, 0.58, 0.82),
    "settle-result": phaseProgress(p, 0.78, 0.9),
    "release-result-focus": phaseProgress(p, 0.9, 1)
  };
  const withdrawal = phases["withdraw-decrement"];
  const recognition = phases["resolve-exponent"];
  const release = phases["release-result-focus"];
  return Object.freeze({
    kind: "derivative-decrement-choreography-frame" as const,
    planId: input.plan.id,
    direction,
    progress,
    semanticProgress: p,
    phases,
    contextReflowProgress: phases["reflow-context"],
    minuend: Object.freeze({
      // Hold 3 beside −1 until evaluation begins; moving it with the
      // surrounding continuants would make the cause look pre-resolved.
      pathProgress: recognition,
      opacity: 1 - recognition
    }),
    decrementCause: Object.freeze({
      withdrawalProgress: withdrawal,
      opacity: 1 - withdrawal
    }),
    result: Object.freeze({
      recognitionProgress: recognition,
      opacity: recognition
    }),
    attention: Object.freeze({
      decrementCause: phases["orient-decrement"] * (1 - withdrawal),
      result: recognition * (1 - release)
    }),
    settlementProgress: phases["settle-result"]
  });
}

function singleSelector<T>(values: readonly T[], label: string): T {
  if (values.length !== 1) {
    throw new Error(`Derivative decrement requires one ${label} selector.`);
  }
  return values[0]!;
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((id) => right.includes(id));
}

function phaseProgress(progress: number, start: number, end: number): number {
  const local = clamp01((progress - start) / (end - start));
  return local * local * (3 - 2 * local);
}

function roundProgress(value: number): number {
  return Math.round(value * 1_000_000_000_000) / 1_000_000_000_000;
}

function clamp01(value: number): number {
  return Number.isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
}
