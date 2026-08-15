import type { KpSemanticBranchSchedule } from "./branch-schedule.ts";
import {
  isKpCompiledSymbolMotionContract,
  type KpCompiledSymbolMotionContract
} from "./symbol-motion-contract.ts";

declare const kpEquationOperationChoreographyBrand: unique symbol;

interface KpEquationOperationChoreographyBase {
  readonly schemaVersion: "kp.equation-operation-choreography.v1";
  readonly id: string;
  readonly transformationId: string;
  readonly direction: "forward" | "rewind";
  readonly [kpEquationOperationChoreographyBrand]: true;
}

export interface KpCounterOrbitCancellationChoreography
  extends KpEquationOperationChoreographyBase {
  readonly kind: "counter-orbit-cancellation";
  readonly linearRearrangementKind:
    | "cancel-additive-inverses"
    | "cancel-multiplicative-inverses";
  readonly relationRecordId: string;
  readonly semanticEntityIds: readonly string[];
  readonly cancellationRecipe: "counter-orbit-v1";
  readonly zeroWitnessRecipe: "none";
}

export interface KpSynchronizedBalancedIntroductionChoreography
  extends KpEquationOperationChoreographyBase {
  readonly kind: "synchronized-balanced-introduction";
  readonly linearRearrangementKind: "balanced-introduction";
  readonly semanticEntityIds: readonly string[];
  readonly branchSchedule: KpSemanticBranchSchedule;
  readonly entryWindow?: {
    readonly start: number;
    readonly end: number;
  } | undefined;
}

export interface KpCausalStructuralIntroductionChoreography
  extends KpEquationOperationChoreographyBase {
  readonly kind: "causal-structural-introduction";
  readonly semanticEntityIds: readonly string[];
  readonly entryWindow: {
    readonly start: number;
    readonly end: number;
  };
}

export interface KpCanonicalFunctionWrapChoreography
  extends KpEquationOperationChoreographyBase {
  readonly kind: "canonical-function-wrap";
  readonly canonicalOperationId: "kp.core.wrap";
  readonly branches: readonly {
    readonly id: string;
    readonly sourceArgumentEntityIds: readonly string[];
    readonly targetArgumentEntityIds: readonly string[];
    readonly wrapperEntityIds: readonly string[];
  }[];
  readonly argumentReflowWindow: {
    readonly start: number;
    readonly end: number;
  };
  readonly wrapperEntryWindow: {
    readonly start: number;
    readonly end: number;
  };
}

export type KpEquationOperationChoreography =
  | KpCounterOrbitCancellationChoreography
  | KpSynchronizedBalancedIntroductionChoreography
  | KpCausalStructuralIntroductionChoreography
  | KpCanonicalFunctionWrapChoreography;

export function createKpCanonicalFunctionWrapChoreography(input: {
  readonly contract: KpCompiledSymbolMotionContract;
  readonly motifId: string;
  readonly direction: "forward" | "rewind";
  readonly argumentReflowWindow?: {
    readonly start: number;
    readonly end: number;
  } | undefined;
  readonly wrapperEntryWindow?: {
    readonly start: number;
    readonly end: number;
  } | undefined;
}): KpCanonicalFunctionWrapChoreography {
  if (!isKpCompiledSymbolMotionContract(input.contract)) {
    throw new Error(
      "Canonical function-wrap choreography requires compiled symbol-motion authority."
    );
  }
  const motif = input.contract.canonicalMotifs.find(
    ({ id }) => id === input.motifId
  );
  if (motif?.kind !== "canonical-function-wrap") {
    throw new Error(
      `Symbol-motion contract ${input.contract.id} has no canonical wrap ${input.motifId}.`
    );
  }
  const continuants = new Map(input.contract.continuants.map((rule) => [
    rule.id,
    rule
  ]));
  const branches = motif.branches.map((branch) => {
    const rules = branch.argumentContinuantIds.map((id) => {
      const rule = continuants.get(id);
      if (rule === undefined) {
        throw new Error(
          `Canonical function-wrap branch ${branch.id} lacks continuant ${id}.`
        );
      }
      return rule;
    });
    return Object.freeze({
      id: branch.id,
      sourceArgumentEntityIds: Object.freeze(rules.flatMap(
        ({ sourceEntityIds }) => sourceEntityIds
      )),
      targetArgumentEntityIds: Object.freeze(rules.flatMap(
        ({ targetEntityIds }) => targetEntityIds
      )),
      wrapperEntityIds: Object.freeze([...branch.wrapperEntityIds])
    });
  });
  const argumentReflowWindow = input.argumentReflowWindow ?? {
    start: 0.04,
    end: 0.7
  };
  const wrapperEntryWindow = input.wrapperEntryWindow ?? {
    start: 0.62,
    end: 0.92
  };
  assertUnitWindow(argumentReflowWindow, "Function-wrap argument reflow");
  assertUnitWindow(wrapperEntryWindow, "Function-wrap wrapper entry");
  if (argumentReflowWindow.start >= wrapperEntryWindow.start) {
    throw new Error(
      "Canonical function-wrap arguments must begin reflow before wrappers enter."
    );
  }
  return Object.freeze({
    schemaVersion: "kp.equation-operation-choreography.v1" as const,
    kind: "canonical-function-wrap" as const,
    id: `operation-choreography.${input.contract.transformationId}.canonical-wrap.${input.direction}`,
    transformationId: input.contract.transformationId,
    direction: input.direction,
    canonicalOperationId: motif.canonicalOperationId,
    branches: Object.freeze(branches),
    argumentReflowWindow: Object.freeze({ ...argumentReflowWindow }),
    wrapperEntryWindow: Object.freeze({ ...wrapperEntryWindow })
  }) as KpCanonicalFunctionWrapChoreography;
}

export function createKpCausalStructuralIntroductionChoreography(input: {
  readonly id: string;
  readonly transformationId: string;
  readonly direction: "forward" | "rewind";
  readonly semanticEntityIds: readonly string[];
  readonly entryWindow: { readonly start: number; readonly end: number };
}): KpCausalStructuralIntroductionChoreography {
  if (
    input.id.trim() === "" ||
    input.transformationId.trim() === "" ||
    input.semanticEntityIds.length === 0 ||
    input.semanticEntityIds.some((id) => id.trim() === "") ||
    new Set(input.semanticEntityIds).size !== input.semanticEntityIds.length ||
    !Number.isFinite(input.entryWindow.start) ||
    !Number.isFinite(input.entryWindow.end) ||
    input.entryWindow.start < 0 ||
    input.entryWindow.end > 1 ||
    input.entryWindow.start >= input.entryWindow.end
  ) {
    throw new Error(
      "Causal structural introduction requires unique entities and an increasing unit entry window."
    );
  }
  return Object.freeze({
    schemaVersion: "kp.equation-operation-choreography.v1" as const,
    kind: "causal-structural-introduction" as const,
    id: input.id,
    transformationId: input.transformationId,
    direction: input.direction,
    semanticEntityIds: Object.freeze([...input.semanticEntityIds]),
    entryWindow: Object.freeze({ ...input.entryWindow })
  }) as KpCausalStructuralIntroductionChoreography;
}

function assertUnitWindow(
  window: { readonly start: number; readonly end: number },
  label: string
): void {
  if (
    !Number.isFinite(window.start) ||
    !Number.isFinite(window.end) ||
    window.start < 0 ||
    window.end > 1 ||
    window.start >= window.end
  ) {
    throw new Error(`${label} requires an increasing unit interval.`);
  }
}
