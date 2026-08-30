import type {
  KpSupplyTaxScrollScoreSampleV1,
  KpSupplyTaxScrollScoreV1
} from "./kinetic-figure-supply-tax-scroll-score-score.ts";

export type KpSupplyTaxScrollScorePhraseAttentionRole =
  "focus" | "releasing" | "context";
export type KpSupplyTaxScrollScorePhraseFocusProfile =
  "karaoke" | "coverage" | "reception";

export interface KpSupplyTaxScrollScorePhraseAttentionV1 {
  readonly phraseId: string;
  readonly role: KpSupplyTaxScrollScorePhraseAttentionRole;
  readonly strength: number;
  readonly coverage: number;
}

export interface KpSupplyTaxScrollScoreCoverageUnitV1 {
  readonly index: number;
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
  readonly profile: KpSupplyTaxScrollScorePhraseFocusProfile;
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
        strength: reception,
        coverage: input.profile !== "reception" && !input.discrete
          ? input.sample.phraseProgress
          : 1
      });
    }
    if (phrase.id === releasingId && reception < 1) {
      return Object.freeze({
        phraseId: phrase.id,
        role: "releasing" as const,
        strength: 1 - reception,
        coverage: 1
      });
    }
    return Object.freeze({
      phraseId: phrase.id,
      role: "context" as const,
      strength: 0,
      coverage: 0
    });
  }));
}

/**
 * Resolve a soft two-unit frontier in reading order. Geometry and wrapping
 * remain DOM concerns; this projection only says how much light each stable
 * display unit receives at a sampled score position.
 */
export function projectKpSupplyTaxScrollScoreCoverageUnits(input: {
  readonly unitCount: number;
  readonly coverage: number;
}): readonly KpSupplyTaxScrollScoreCoverageUnitV1[] {
  if (!Number.isInteger(input.unitCount) || input.unitCount < 0) {
    throw new Error("Scroll Score coverage unit count must be nonnegative.");
  }
  if (!Number.isFinite(input.coverage) ||
    input.coverage < 0 || input.coverage > 1) {
    throw new Error("Scroll Score phrase coverage must be between zero and one.");
  }
  if (input.unitCount === 0) return Object.freeze([]);
  const frontierUnits = Math.min(2, input.unitCount);
  const denominator = input.unitCount - 1 + frontierUnits;
  return Object.freeze(Array.from({ length: input.unitCount }, (_, index) => {
    const start = index / denominator;
    const end = (index + frontierUnits) / denominator;
    const localProgress = Math.max(0, Math.min(1,
      (input.coverage - start) / (end - start)));
    return Object.freeze({ index, strength: smoothstep(localProgress) });
  }));
}

export function readKpSupplyTaxScrollScorePhraseFocusProfile(
  search: string
): KpSupplyTaxScrollScorePhraseFocusProfile {
  const profile = new URLSearchParams(search).get("phrase-focus");
  if (profile === "coverage" || profile === "reception") return profile;
  return "karaoke";
}

function smoothstep(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}
