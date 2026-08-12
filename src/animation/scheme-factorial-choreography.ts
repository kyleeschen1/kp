import type { KpSchemeBindingChoreography } from
  "./scheme-factorial-binding-choreography.ts";
import type { KpSchemeEvaluationMotifs } from
  "./scheme-factorial-evaluation-motifs.ts";
import type { KpSchemeReturnChoreography } from
  "./scheme-factorial-return-choreography.ts";
import type { KpSchemeStructuralChoreography } from
  "./scheme-factorial-structural-choreography.ts";

export interface KpSchemeFactorialChoreography {
  readonly schemaVersion: "kp.scheme-factorial-choreography.v1";
  readonly structural: KpSchemeStructuralChoreography;
  readonly binding: KpSchemeBindingChoreography;
  readonly evaluation: KpSchemeEvaluationMotifs;
  readonly returns: KpSchemeReturnChoreography;
}

export function defineKpSchemeFactorialChoreography(input: {
  readonly structural: KpSchemeStructuralChoreography;
  readonly binding: KpSchemeBindingChoreography;
  readonly evaluation: KpSchemeEvaluationMotifs;
  readonly returns: KpSchemeReturnChoreography;
}): KpSchemeFactorialChoreography {
  if (input.structural.transitions.length !== 3 ||
      input.binding.arcs.length !== 4 ||
      input.returns.steps.length !== 3) {
    throw new Error("Factorial choreography is missing a canonical motion family.");
  }
  return deepFreeze({
    schemaVersion: "kp.scheme-factorial-choreography.v1",
    ...input
  });
}

function deepFreeze<Value>(value: Value): Value {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}
