import type {
  KpSupplyTaxScrollScoreSampleV1,
  KpSupplyTaxScrollScoreV1
} from "./kinetic-figure-supply-tax-scroll-score-score.ts";

export type KpSupplyTaxScrollScorePhraseAttentionRole =
  "focus" | "releasing" | "context";

export interface KpSupplyTaxScrollScorePhraseAttentionV1 {
  readonly phraseId: string;
  readonly role: KpSupplyTaxScrollScorePhraseAttentionRole;
  readonly strength: number;
}

const receptionShare = 0.18;

/**
 * Transfer the reading light early, then hold it while the semantic action
 * unfolds. This keeps prose focus distinct from the score's progress meter.
 */
export function projectKpSupplyTaxScrollScorePhraseAttention(input: {
  readonly score: KpSupplyTaxScrollScoreV1;
  readonly sample: KpSupplyTaxScrollScoreSampleV1;
  readonly discrete: boolean;
}): readonly KpSupplyTaxScrollScorePhraseAttentionV1[] {
  const activeIndex = input.sample.passage.phrases.indexOf(input.sample.phrase);
  if (activeIndex < 0) {
    throw new Error("Active Scroll Score phrase must belong to its passage.");
  }
  const reception = input.discrete || activeIndex === 0
    ? 1
    : smoothstep(Math.min(1, input.sample.phraseProgress / receptionShare));
  const releasingId = activeIndex > 0
    ? input.sample.passage.phrases[activeIndex - 1]!.id
    : undefined;
  return Object.freeze(input.score.phrases.map((phrase) => {
    if (phrase.id === input.sample.phrase.id) {
      return Object.freeze({
        phraseId: phrase.id,
        role: "focus" as const,
        strength: reception
      });
    }
    if (phrase.id === releasingId && reception < 1) {
      return Object.freeze({
        phraseId: phrase.id,
        role: "releasing" as const,
        strength: 1 - reception
      });
    }
    return Object.freeze({
      phraseId: phrase.id,
      role: "context" as const,
      strength: 0
    });
  }));
}

function smoothstep(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}
