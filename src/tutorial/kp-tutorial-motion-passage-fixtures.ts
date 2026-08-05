import type {
  KpTutorialMotionPassageLifecyclePolicy,
  KpTutorialPresentMotionPassage
} from "./kp-tutorial-motion-passage-lifecycle.ts";

export const kpTutorialMotionPassageFixtureSizes = [1, 3, 12] as const;

export type KpTutorialMotionPassageFixtureSize =
  typeof kpTutorialMotionPassageFixtureSizes[number];

export type KpTutorialMotionPassageFixtureCapabilityId =
  | "economics.equilibrium-graph"
  | "physics.work-energy-graph";

export interface KpTutorialMotionPassageFixturePassage extends
  KpTutorialPresentMotionPassage<
    string,
    KpTutorialMotionPassageFixtureCapabilityId
  > {
  readonly label: string;
  readonly documentTop: number;
  readonly reservedStageBlockSize: number;
  readonly staticAlternativeText: string;
}

export interface KpTutorialMotionPassagePageFixture {
  readonly id: `page-scale.${KpTutorialMotionPassageFixtureSize}`;
  readonly viewportBlockSize: number;
  readonly readingBandRatio: number;
  readonly focusedPassageId: string;
  readonly policy: KpTutorialMotionPassageLifecyclePolicy;
  readonly passages: readonly KpTutorialMotionPassageFixturePassage[];
}

const viewportBlockSize = 800;
const reservedStageBlockSize = 480;
const passageStride = 720;
const readingBandRatio = 0.35;

/**
 * These deterministic fixtures carry only semantic and reserved geometry
 * facts. Browser hosts add observation and renderer sessions in later slices.
 */
export function createKpTutorialMotionPassagePageFixture(
  size: KpTutorialMotionPassageFixtureSize
): KpTutorialMotionPassagePageFixture {
  const focusedIndex = Math.floor((size - 1) / 2);
  const focusedPassageId = passageId(size, focusedIndex);
  const passages = Object.freeze(Array.from({ length: size }, (_, index) => {
    const id = passageId(size, index);
    const semanticProgress = index < focusedIndex
      ? 1
      : index === focusedIndex
        ? 0.5
        : 0;
    const proximity = index === focusedIndex
      ? "visible" as const
      : Math.abs(index - focusedIndex) === 1
        ? "near" as const
        : "distant" as const;
    return Object.freeze({
      id,
      capabilityId: index % 2 === 0
        ? "economics.equilibrium-graph" as const
        : "physics.work-energy-graph" as const,
      disposition: "present" as const,
      proximity,
      semanticProgress,
      label: `Motion passage ${index + 1} of ${size}`,
      documentTop: viewportBlockSize * readingBandRatio + index * passageStride,
      reservedStageBlockSize,
      staticAlternativeText:
        `Motion passage ${index + 1} of ${size}, ` +
        `settled at ${Math.round(semanticProgress * 100)} percent.`
    });
  }));
  return Object.freeze({
    id: `page-scale.${size}`,
    viewportBlockSize,
    readingBandRatio,
    focusedPassageId,
    policy: Object.freeze({ maxHydratedPassages: Math.min(3, size) }),
    passages
  });
}

export const kpTutorialOnePassagePageFixture =
  createKpTutorialMotionPassagePageFixture(1);
export const kpTutorialThreePassagePageFixture =
  createKpTutorialMotionPassagePageFixture(3);
export const kpTutorialTwelvePassagePageFixture =
  createKpTutorialMotionPassagePageFixture(12);

function passageId(
  size: KpTutorialMotionPassageFixtureSize,
  index: number
): string {
  return `page-scale.${size}.passage.${String(index + 1).padStart(2, "0")}`;
}
