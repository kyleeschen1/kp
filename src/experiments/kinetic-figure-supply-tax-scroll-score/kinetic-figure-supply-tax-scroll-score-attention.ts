import type {
  KpSupplyTaxScrollScoreSampleV1,
  KpSupplyTaxScrollScoreV1
} from "../../tutorial/kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score-score.ts";

export type KpSupplyTaxScrollScorePhraseAttentionRole =
  "focus" | "releasing" | "context";
export type KpSupplyTaxScrollScorePhraseFocusProfile =
  "reception-wave" | "karaoke" | "coverage" | "reception";

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
        coverage: phraseCoverage({
          profile: input.profile,
          phraseProgress: input.sample.phraseProgress,
          discrete: input.discrete
        })
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
 * Move one brief, local reception edge through a semantic phrase. Unlike
 * karaoke coverage, the edge leaves no bright history behind; phrase-level
 * attention owns the stable state before and after reception.
 */
export function projectKpSupplyTaxScrollScoreReceptionWaveUnits(input: {
  readonly unitCount: number;
  readonly progress: number;
}): readonly KpSupplyTaxScrollScoreCoverageUnitV1[] {
  validateUnitProjectionInput(input.unitCount, input.progress,
    "reception-wave progress");
  if (input.unitCount === 0) return Object.freeze([]);
  const envelope = Math.sin(Math.PI * input.progress);
  const center = input.progress * (input.unitCount - 1);
  const halfWidth = Math.min(1.75, input.unitCount);
  return Object.freeze(Array.from({ length: input.unitCount }, (_, index) => {
    const proximity = Math.max(0, 1 - Math.abs(index - center) / halfWidth);
    return Object.freeze({
      index,
      strength: envelope * smoothstep(proximity)
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
  validateUnitProjectionInput(input.unitCount, input.coverage,
    "phrase coverage");
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
  if (profile === "karaoke" || profile === "coverage" ||
    profile === "reception") return profile;
  return "reception-wave";
}

function phraseCoverage(input: {
  readonly profile: KpSupplyTaxScrollScorePhraseFocusProfile;
  readonly phraseProgress: number;
  readonly discrete: boolean;
}): number {
  if (input.discrete || input.profile === "reception") return 1;
  if (input.profile === "reception-wave") {
    return Math.min(1, input.phraseProgress / receptionShare);
  }
  return input.phraseProgress;
}

function validateUnitProjectionInput(
  unitCount: number,
  progress: number,
  progressLabel: string
): void {
  if (!Number.isInteger(unitCount) || unitCount < 0) {
    throw new Error("Scroll Score display unit count must be nonnegative.");
  }
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) {
    throw new Error(`Scroll Score ${progressLabel} must be between zero and one.`);
  }
}

function smoothstep(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}
