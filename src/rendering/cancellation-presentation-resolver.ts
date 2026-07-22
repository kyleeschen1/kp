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
