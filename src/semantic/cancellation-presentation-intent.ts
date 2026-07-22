const contactValues = Object.freeze(["shared-center"] as const);
const approachValues = Object.freeze([
  "opposing-arcs",
  "direct-convergence"
] as const);
const identityBeatValues = Object.freeze(["implicit", "explicit"] as const);
const retirementValues = Object.freeze(["after-contact"] as const);
const readabilityValues = Object.freeze(["through-contact"] as const);

/**
 * Semantic cancellation choices that authors and generators may express.
 * Renderer recipe names stay outside this contract so presentation policy can
 * evolve without leaking implementation details into durable lesson content.
 */
export const kpCancellationPresentationIntentVocabulary = Object.freeze({
  contact: contactValues,
  approach: approachValues,
  identityBeat: identityBeatValues,
  retirement: retirementValues,
  readability: readabilityValues
});

type KpCancellationIntentValue<
  TKey extends keyof typeof kpCancellationPresentationIntentVocabulary
> = (typeof kpCancellationPresentationIntentVocabulary)[TKey][number];

export interface KpCancellationPresentationIntent {
  readonly contact: KpCancellationIntentValue<"contact">;
  readonly approach: KpCancellationIntentValue<"approach">;
  readonly identityBeat: KpCancellationIntentValue<"identityBeat">;
  readonly retirement: KpCancellationIntentValue<"retirement">;
  readonly readability: KpCancellationIntentValue<"readability">;
}
