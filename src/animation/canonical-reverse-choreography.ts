import {
  kpCanonicalOperationRegistry,
  type KpCanonicalOperationRegistry,
  type KpCanonicalOperationRegistryEntry
} from "../semantic/canonical-operation-registry.ts";
import type { KpCanonicalReverseChoreographyPlan } from "./canonical-reverse-capability.ts";

export interface KpCanonicalReverseLawIssue {
  readonly code:
    | "reverse.invalid-inverse-claim"
    | "reverse.nonreciprocal-inverse"
    | "reverse.invalid-annihilation"
    | "reverse.invalid-fission-fusion"
    | "reverse.missing-narration";
  readonly message: string;
}

export function createKpCanonicalReverseChoreographyPlan(
  entry: KpCanonicalOperationRegistryEntry
): KpCanonicalReverseChoreographyPlan {
  return {
    kind: "canonical-reverse-choreography-plan",
    sourceOperationId: entry.id,
    ...(entry.contract.reverse.operationId === undefined
      ? {}
      : { inverseOperationId: entry.contract.reverse.operationId }),
    validity: entry.contract.reverse.validity,
    choreographyKind: entry.contract.reverse.choreography.kind,
    causalEmphasis: entry.contract.reverse.choreography.causalEmphasis,
    traversal: "target-to-source",
    interpretation: entry.contract.reverse.interpretation,
    narration: entry.contract.reverse.choreography.narration
  };
}

export function canonicalReversePlanForTransformationType(input: {
  readonly transformType: string;
  readonly registry?: KpCanonicalOperationRegistry | undefined;
}): KpCanonicalReverseChoreographyPlan | undefined {
  const registry = input.registry ?? kpCanonicalOperationRegistry;
  const candidates = registry.entries.filter(
    (entry) => entry.sourceTransformType === input.transformType
  );
  // Transform types are shared by generated algebra and direct arithmetic.
  // Preserve the authored transformation authority instead of registry order.
  const entry = candidates.find((candidate) =>
    candidate.packId === "kp.semantic-motion"
  ) ?? candidates.find((candidate) =>
    candidate.packId === "kp.algebra"
  ) ?? candidates[0];
  return entry === undefined
    ? undefined
    : createKpCanonicalReverseChoreographyPlan(entry);
}

export function evaluateKpCanonicalReverseChoreographyLaws(input: {
  readonly entry: KpCanonicalOperationRegistryEntry;
  readonly registry?: KpCanonicalOperationRegistry | undefined;
}): readonly KpCanonicalReverseLawIssue[] {
  const registry = input.registry ?? kpCanonicalOperationRegistry;
  const reverse = input.entry.contract.reverse;
  const issues: KpCanonicalReverseLawIssue[] = [];
  if (reverse.kind === "one-way" && reverse.validity !== "authored-history-only") {
    issues.push({
      code: "reverse.invalid-inverse-claim",
      message: `${input.entry.id} cannot expose historical reconstruction as a mathematical inverse.`
    });
  }
  if (reverse.kind === "inverse") {
    const inverse = registry.entries.find(
      (entry) => entry.id === reverse.operationId
    );
    if (inverse?.contract.reverse.kind !== "inverse" ||
        inverse.contract.reverse.operationId !== input.entry.id) {
      issues.push({
        code: "reverse.nonreciprocal-inverse",
        message: `${input.entry.id} lacks a reciprocal registered inverse.`
      });
    }
  }
  if (input.entry.contract.witnessIds.length > 0 &&
      reverse.choreography.kind !== "introduce-neutral-pair") {
    issues.push({
      code: "reverse.invalid-annihilation",
      message: `${input.entry.id} must reverse witnessed annihilation by introducing the neutral pair.`
    });
  }
  if (input.entry.contract.ownershipMode === "fission-fusion" &&
      reverse.kind === "inverse" &&
      reverse.choreography.kind !== "fission" &&
      reverse.choreography.kind !== "fusion") {
    issues.push({
      code: "reverse.invalid-fission-fusion",
      message: `${input.entry.id} must reverse with the opposite ownership transfer.`
    });
  }
  if (reverse.choreography.narration.trim().length === 0) {
    issues.push({
      code: "reverse.missing-narration",
      message: `${input.entry.id} lacks reverse narration.`
    });
  }
  return issues;
}
