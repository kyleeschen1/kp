import type { KpEquationOperationRegistration } from
  "../domain-ir/equation-extension-registry.ts";
import type { KpValidatedEquationExtensionPack } from
  "../domain-ir/equation-extension-pack-validator.ts";
import type {
  KpHomomorphicCausalPhaseGrammar,
  KpHomomorphicCausalPhaseId
} from "../domain-ir/homomorphic-causal-phases.ts";
import type { KpOperationKind, KpRecipeId } from
  "../domain-ir/equation-motion-vocabulary.ts";
import type { KpSemanticMotionPrecedenceSpec } from
  "../domain-ir/semantic-motion-precedence-compiler.ts";

export interface KpHomomorphicCrossoverPhaseBinding {
  readonly phaseId: KpHomomorphicCausalPhaseId;
  readonly eventIds: readonly [string, ...string[]];
  readonly realization: "dedicated" | "coalesced";
}

export interface KpHomomorphicCrossoverCallerRegistration {
  readonly schemaVersion: "kp.homomorphic-crossover-caller-registration.v1";
  readonly kind: "homomorphic-crossover-caller-registration";
  readonly id: string;
  readonly callerIds: readonly [string, ...string[]];
  readonly semanticMotionOperationId: string;
  readonly semanticAuthorityId: string;
  readonly operationKind: KpOperationKind;
  readonly recipeId: KpRecipeId;
  readonly causalGrammarId: KpHomomorphicCausalPhaseGrammar["id"];
  readonly phaseBindings: readonly KpHomomorphicCrossoverPhaseBinding[];
  readonly presentationAuthority: "caller-local";
}

const registrations = new WeakSet<object>();

/**
 * Joins a domain law and its existing semantic events to the nominal recipe.
 * It deliberately records no clock, geometry, route, cardinality policy, or
 * paint behavior; those remain with the approved product and quotient callers.
 */
export function registerKpHomomorphicCrossoverCaller(input: {
  readonly id: string;
  readonly callerIds: readonly [string, ...string[]];
  readonly semanticMotionOperationId: string;
  readonly semanticAuthorityId: string;
  readonly operationRegistration: KpEquationOperationRegistration;
  readonly recipeId: KpRecipeId;
  readonly grammar: KpHomomorphicCausalPhaseGrammar;
  readonly precedence: KpSemanticMotionPrecedenceSpec;
  readonly phaseBindings: readonly KpHomomorphicCrossoverPhaseBinding[];
  readonly registryAuthority: KpValidatedEquationExtensionPack;
}): KpHomomorphicCrossoverCallerRegistration {
  requireText(input.id, "Crossover caller registration");
  requireUniqueText(input.callerIds, "Crossover caller");
  requireText(input.semanticMotionOperationId, "Semantic-motion operation");
  if (!input.operationRegistration.semanticAuthorityIds.includes(
    input.semanticAuthorityId
  )) {
    throw new Error(
      `Operation ${input.operationRegistration.id} does not license ${input.semanticAuthorityId}.`
    );
  }
  const pack = input.registryAuthority.pack;
  const operation = pack.operations.byId[input.operationRegistration.id];
  const recipe = pack.recipes.byId[input.recipeId];
  if (
    operation === undefined ||
    recipe === undefined ||
    operation.familyId !== input.operationRegistration.familyId ||
    !sameValues(
      operation.semanticAuthorityIds,
      input.operationRegistration.semanticAuthorityIds
    )
  ) {
    throw new Error("Crossover caller requires exact validated pack authority.");
  }
  if (
    !recipe.operationKinds.includes(operation.id) ||
    !recipe.causalGrammarIds.includes(input.grammar.id)
  ) {
    throw new Error(
      `Recipe ${input.recipeId} does not bind ${operation.id} to ${input.grammar.id}.`
    );
  }
  validatePhaseBindings(input.grammar, input.precedence, input.phaseBindings);
  const registration = Object.freeze({
    schemaVersion: "kp.homomorphic-crossover-caller-registration.v1" as const,
    kind: "homomorphic-crossover-caller-registration" as const,
    id: input.id,
    callerIds: Object.freeze([...input.callerIds]) as
      readonly [string, ...string[]],
    semanticMotionOperationId: input.semanticMotionOperationId,
    semanticAuthorityId: input.semanticAuthorityId,
    operationKind: operation.id,
    recipeId: recipe.id,
    causalGrammarId: input.grammar.id,
    phaseBindings: Object.freeze(input.phaseBindings.map((binding) =>
      Object.freeze({
        ...binding,
        eventIds: Object.freeze([...binding.eventIds]) as
          readonly [string, ...string[]]
      })
    )),
    presentationAuthority: "caller-local" as const
  }) satisfies KpHomomorphicCrossoverCallerRegistration;
  registrations.add(registration);
  return registration;
}

export function isKpHomomorphicCrossoverCallerRegistration(
  value: unknown
): value is KpHomomorphicCrossoverCallerRegistration {
  return typeof value === "object" && value !== null &&
    registrations.has(value);
}

function validatePhaseBindings(
  grammar: KpHomomorphicCausalPhaseGrammar,
  precedence: KpSemanticMotionPrecedenceSpec,
  bindings: readonly KpHomomorphicCrossoverPhaseBinding[]
): void {
  const expectedPhaseIds = grammar.phases.map(({ id }) => id);
  const actualPhaseIds = bindings.map(({ phaseId }) => phaseId);
  if (
    actualPhaseIds.length !== expectedPhaseIds.length ||
    new Set(actualPhaseIds).size !== actualPhaseIds.length ||
    expectedPhaseIds.some((id) => !actualPhaseIds.includes(id))
  ) {
    throw new Error("Crossover caller must bind every causal phase exactly once.");
  }
  const knownEvents = new Set(precedence.events.map(({ id }) => id));
  const mappedEvents = new Set<string>();
  const eventOwners = new Map<string, KpHomomorphicCrossoverPhaseBinding[]>();
  for (const binding of bindings) {
    requireUniqueText(binding.eventIds, `Phase ${binding.phaseId} event`);
    for (const eventId of binding.eventIds) {
      if (!knownEvents.has(eventId)) {
        throw new Error(`Crossover phase ${binding.phaseId} references unknown ${eventId}.`);
      }
      mappedEvents.add(eventId);
      eventOwners.set(eventId, [...(eventOwners.get(eventId) ?? []), binding]);
    }
  }
  for (const [eventId, owners] of eventOwners) {
    if (
      owners.length > 1 &&
      owners.some(({ realization }) => realization !== "coalesced")
    ) {
      throw new Error(
        `Shared event ${eventId} must declare coalesced phase realization.`
      );
    }
  }
  const unmapped = precedence.events.filter(({ id }) => !mappedEvents.has(id));
  if (unmapped.length > 0) {
    throw new Error(
      `Crossover caller leaves semantic events unmapped: ${unmapped.map(({ id }) => id).join(", ")}.`
    );
  }
}

function sameValues(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) =>
    value === right[index]
  );
}

function requireText(value: string, label: string): void {
  if (value.trim() === "") throw new Error(`${label} requires a non-empty id.`);
}

function requireUniqueText(values: readonly string[], label: string): void {
  values.forEach((value) => requireText(value, label));
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} ids must be unique.`);
  }
}
