import type {
  KpTutorialMotionBlock,
  KpTutorialMotionCheckpoint,
  KpTutorialMotionCorridor
} from "../kp-tutorial-motion.ts";

export type KpLispLessonMotionBlockId =
  | "bind-and-reconstruct"
  | "evaluate-and-gather";

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
    block("bind-and-reconstruct", "Bind and reconstruct", [
      checkpoint("application-ready", "Application ready", 0),
      checkpoint("binding-established", "Binding established", 0.46),
      checkpoint("body-reconstructed", "Body reconstructed", 1)
    ], corridor([
      [0, 0], [0.14, 0], [0.48, 0.46], [0.61, 0.46], [0.94, 1], [1, 1]
    ])),
    block("evaluate-and-gather", "Evaluate and gather", [
      checkpoint("evaluation-form-ready", "Form ready", 0),
      checkpoint("evaluation-gathering", "Evaluation gathering", 0.58),
      checkpoint("result-settled", "Result settled", 1)
    ], corridor([
      [0, 0], [0.16, 0], [0.55, 0.58], [0.68, 0.58], [0.94, 1], [1, 1]
    ]))
  ]);

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
