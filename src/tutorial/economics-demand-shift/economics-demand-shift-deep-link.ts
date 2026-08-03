import {
  findKpEconomicsDemandShiftCheckpointIndex,
  kpEconomicsDemandShiftCheckpoints
} from "./economics-demand-shift-checkpoints.ts";
import type {
  KpEconomicsDemandShiftLesson
} from "./economics-demand-shift-lesson-compiler.ts";
import {
  findKpEconomicsMotionBlock,
  kpEconomicsMotionBlocks,
  projectKpEconomicsLessonMotion,
  type KpEconomicsLessonMotionProjection,
  type KpEconomicsMotionBlockId
} from "./economics-demand-shift-motion-blocks.ts";
import {
  resolveKpEconomicsCorridorTravelForProgress
} from "./economics-demand-shift-scroll-corridor.ts";
import type {
  KpTutorialTocDestination
} from "../kp-tutorial-toc.ts";
import {
  parseKpTutorialDestinationHash
} from "../kp-tutorial-url.ts";

export interface KpEconomicsDemandShiftInitialDestination {
  readonly destination: KpTutorialTocDestination | undefined;
  readonly targetElementId: string | undefined;
  readonly passageId: string;
  readonly checkpointIndex: number;
  readonly motion: KpEconomicsLessonMotionProjection;
  readonly motionScroll: {
    readonly blockId: KpEconomicsMotionBlockId;
    readonly travel: number;
  } | undefined;
}

export function resolveKpEconomicsDemandShiftInitialDestination(input: {
  readonly lesson: KpEconomicsDemandShiftLesson;
  readonly hash: string;
}): KpEconomicsDemandShiftInitialDestination {
  const destination = parseKpTutorialDestinationHash(input.hash);
  if (destination === undefined) return fallback(input.lesson);

  if (destination.kind === "section") {
    const section = input.lesson.sections.find(({ id }) => id === destination.id);
    const passage = section?.passages[0];
    return passage === undefined
      ? fallback(input.lesson)
      : projectionForPassage(input.lesson, passage.id, destination);
  }

  const block = destination.kind === "block"
    ? findKpEconomicsMotionBlock(destination.id)
    : kpEconomicsMotionBlocks.find(({ checkpoints }) =>
        checkpoints.some(({ id }) => id === destination.id)
      );
  if (block === undefined) return fallback(input.lesson);
  const checkpoint = destination.kind === "checkpoint"
    ? block.checkpoints.find(({ id }) => id === destination.id)
    : block.checkpoints[0];
  if (checkpoint === undefined) return fallback(input.lesson);
  const checkpointIndex = kpEconomicsDemandShiftCheckpoints.findIndex(
    ({ passageId }) => passageId === block.passageId
  );
  const motion = projectKpEconomicsLessonMotion({
    activeBlockId: block.id,
    localProgress: checkpoint.progress
  });
  return Object.freeze({
    destination,
    targetElementId: `kp-${destination.kind}-${destination.id}`,
    passageId: block.passageId,
    checkpointIndex: checkpointIndex < 0 ? 0 : checkpointIndex,
    motion,
    motionScroll: Object.freeze({
      blockId: block.id,
      travel: resolveKpEconomicsCorridorTravelForProgress({
        corridor: block.corridor,
        progress: checkpoint.progress,
        preferredTravel: destination.kind === "block" ? 0 : 0.5
      })
    })
  });
}

function projectionForPassage(
  lesson: KpEconomicsDemandShiftLesson,
  passageId: string,
  destination: KpTutorialTocDestination
): KpEconomicsDemandShiftInitialDestination {
  const passageIds = lesson.sections.flatMap(({ passages }) =>
    passages.map(({ id }) => id)
  );
  const passageIndex = passageIds.indexOf(passageId);
  const settledBlocks = kpEconomicsMotionBlocks.filter((block) =>
    passageIds.indexOf(block.passageId) < passageIndex
  );
  const lastSettled = settledBlocks.at(-1);
  const activeBlockId = lastSettled?.id ?? kpEconomicsMotionBlocks[0]!.id;
  const localProgress = lastSettled === undefined ? 0 : 1;
  const checkpoint = kpEconomicsDemandShiftCheckpoints.find(
    (candidate) => candidate.passageId === passageId
  );
  return Object.freeze({
    destination,
    targetElementId: `kp-${destination.kind}-${destination.id}`,
    passageId,
    checkpointIndex: findKpEconomicsDemandShiftCheckpointIndex(checkpoint?.id),
    motion: projectKpEconomicsLessonMotion({ activeBlockId, localProgress }),
    motionScroll: undefined
  });
}

function fallback(
  lesson: KpEconomicsDemandShiftLesson
): KpEconomicsDemandShiftInitialDestination {
  const passageId = lesson.sections[0]?.passages[0]?.id ?? "context";
  return Object.freeze({
    destination: undefined,
    targetElementId: undefined,
    passageId,
    checkpointIndex: 0,
    motion: projectKpEconomicsLessonMotion({
      activeBlockId: "demand-shift",
      localProgress: 0
    }),
    motionScroll: undefined
  });
}
