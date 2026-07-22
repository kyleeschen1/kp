import type { KpCancellationPresentationIntent } from "../semantic/cancellation-presentation-intent.ts";
import {
  kpCancellationPresentationCapabilities,
  type KpCancellationMeasuredTopology,
  type KpCancellationPresentationCapabilities
} from "./cancellation-presentation-capabilities.ts";
import type { KpEquationCancellationPresentationRecipe } from "./equation-presentation-policy.ts";

export interface KpCancellationPresentationResolutionInput {
  readonly intent: KpCancellationPresentationIntent;
  readonly topology: KpCancellationMeasuredTopology;
}

export type KpCancellationPresentationResolution =
  | {
      readonly kind: "resolved";
      readonly recipe: KpEquationCancellationPresentationRecipe;
    }
  | {
      readonly kind: "repair-source-topology";
      readonly issue: "incomplete-cancellation-source-set";
      readonly minimumSourceCount: 2;
    }
  | {
      readonly kind: "repair-intent";
      readonly issue: "distinct-baselines-require-two-axis-contact";
      readonly repairedIntent: KpCancellationPresentationIntent;
    }
  | {
      readonly kind: "manual-review";
      readonly issue: "no-supported-cancellation-recipe";
    };

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
