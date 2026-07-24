import {
  kpCancellationPresentationCapabilities,
  type KpCancellationPresentationCapabilities
} from "./cancellation-presentation-capabilities.ts";
import type {
  KpCancellationPresentationResolution,
  KpCancellationPresentationResolutionInput,
  KpEquationCancellationPresentationRecipe
} from "../animation/cancellation-presentation-contract.ts";

export type {
  KpCancellationPresentationResolution,
  KpCancellationPresentationResolutionInput
} from "../animation/cancellation-presentation-contract.ts";

const recipeOrder = Object.freeze([
  "counter-orbit-v1",
  "witnessed-annihilation-v1",
  "native-handoff-v1"
] as const satisfies readonly KpEquationCancellationPresentationRecipe[]);

export function resolveKpCancellationPresentationRecipe(
  input: KpCancellationPresentationResolutionInput
): KpEquationCancellationPresentationRecipe | undefined {
  return recipeOrder.find((recipe) => capabilityMatches(
    kpCancellationPresentationCapabilities[recipe],
    input
  ));
}

export function resolveKpCancellationPresentation(
  input: KpCancellationPresentationResolutionInput
): KpCancellationPresentationResolution {
  const recipe = resolveKpCancellationPresentationRecipe(input);
  if (recipe !== undefined) return Object.freeze({ kind: "resolved", recipe });
  if (input.topology.sourceCount < 2) {
    return Object.freeze({
      kind: "repair-source-topology",
      issue: "incomplete-cancellation-source-set",
      minimumSourceCount: 2
    });
  }
  if (
    input.topology.sourceBaselines === "distinct" &&
    input.intent.approach === "direct-convergence"
  ) {
    return Object.freeze({
      kind: "repair-intent",
      issue: "distinct-baselines-require-two-axis-contact",
      repairedIntent: Object.freeze({
        ...input.intent,
        approach: "opposing-arcs"
      })
    });
  }
  return Object.freeze({
    kind: "manual-review",
    issue: "no-supported-cancellation-recipe"
  });
}

function capabilityMatches(
  capability: KpCancellationPresentationCapabilities,
  input: KpCancellationPresentationResolutionInput
): boolean {
  return input.topology.sourceCount >= capability.minimumSourceCount &&
    capability.contact === input.intent.contact &&
    capability.approaches.includes(input.intent.approach) &&
    capability.identityBeats.includes(input.intent.identityBeat) &&
    capability.retirement === input.intent.retirement &&
    capability.readability === input.intent.readability &&
    (
      input.topology.sourceBaselines === "shared" ||
      capability.sourceBaselines === "shared-or-distinct"
    );
}
