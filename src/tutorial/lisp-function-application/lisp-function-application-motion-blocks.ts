import type {
  KpTutorialMotionBlock,
  KpTutorialMotionCheckpoint,
  KpTutorialMotionCorridor
} from "../kp-tutorial-motion.ts";
import {
  compileKpLispDwellTimeline,
  defineKpLispInternalTuning,
  KP_LISP_AUTHORED_DWELL_BEATS
} from "../../animation/lisp-s-expression-timing.ts";

export type KpLispLessonMotionBlockId =
  | "structure"
  | "application"
  | "evaluation";

export interface KpLispLessonMotionCheckpoint
  extends KpTutorialMotionCheckpoint {}

export interface KpLispLessonMotionCorridor extends KpTutorialMotionCorridor {}

export interface KpLispLessonMotionBlock
  extends KpTutorialMotionBlock<KpLispLessonMotionBlockId> {
  readonly checkpoints: readonly KpLispLessonMotionCheckpoint[];
  readonly corridor: KpLispLessonMotionCorridor;
}

export const kpLispLessonMotionBlocks: readonly KpLispLessonMotionBlock[] =
  Object.freeze([
    authoredBlock("structure", "See the structure", {
      "source-readable": "Source readable",
      "leaf-forms-folded": "Leaf forms folded",
      "lambda-form-folded": "Lambda folded",
      "application-folded": "Application folded",
      "source-restored": "Source restored"
    }),
    authoredBlock("application", "Apply the lambda", {
      "binding-ready": "Binding ready",
      "parameter-bound": "Parameter bound",
      "body-propagated": "Body propagated",
      "body-reconstructed": "Body reconstructed"
    }),
    authoredBlock("evaluation", "Evaluate the result", {
      "reduction-ready": "Reduction ready",
      "inputs-gathered": "Inputs gathered",
      "result-settled": "Result settled"
    })
  ]);

export function isKpLispLessonMotionBlockId(
  value: string | undefined
): value is KpLispLessonMotionBlockId {
  return kpLispLessonMotionBlocks.some(({ id }) => id === value);
}

function authoredBlock(
  id: KpLispLessonMotionBlockId,
  label: string,
  labels: Readonly<Record<string, string>>
): KpLispLessonMotionBlock {
  const beats = KP_LISP_AUTHORED_DWELL_BEATS.filter(({ block: beatBlock }) =>
    beatBlock === id
  );
  const timeline = compileKpLispDwellTimeline(
    beats,
    defineKpLispInternalTuning()
  );
  const checkpoints = timeline.checkpoints.map((entry, index) => checkpoint(
    entry.id,
    labels[entry.id] ?? entry.id,
    index === 0
      ? 0
      : index === timeline.checkpoints.length - 1
        ? 1
        : entry.seekProgress
  ));
  return block(id, label, checkpoints, corridorFor(checkpoints));
}

function block(
  id: KpLispLessonMotionBlockId,
  label: string,
  checkpoints: readonly KpLispLessonMotionCheckpoint[],
  motionCorridor: KpLispLessonMotionCorridor
): KpLispLessonMotionBlock {
  return Object.freeze({
    id,
    label,
    checkpoints: Object.freeze([...checkpoints]),
    corridor: motionCorridor
  });
}

function checkpoint(
  id: string,
  label: string,
  progress: number
): KpLispLessonMotionCheckpoint {
  return Object.freeze({ id, label, progress });
}

function corridor(
  keyframes: readonly (readonly [travel: number, progress: number])[]
): KpLispLessonMotionCorridor {
  return Object.freeze({
    startViewportRatio: 0.72,
    endViewportRatio: 0.16,
    keyframes: Object.freeze(keyframes.map(([travel, progress]) =>
      Object.freeze({ travel, progress })
    ))
  });
}

function corridorFor(
  checkpoints: readonly KpLispLessonMotionCheckpoint[]
): KpLispLessonMotionCorridor {
  const keyframes: Array<readonly [number, number]> = [
    [0, 0],
    [0.08, 0]
  ];
  for (let index = 1; index < checkpoints.length - 1; index += 1) {
    const center = index / (checkpoints.length - 1);
    const progress = checkpoints[index]!.progress;
    keyframes.push([center - 0.035, progress], [center + 0.035, progress]);
  }
  keyframes.push([0.92, 1], [1, 1]);
  return corridor(keyframes);
}
