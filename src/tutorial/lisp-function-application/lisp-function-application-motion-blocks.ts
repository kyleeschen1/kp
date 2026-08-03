export type KpLispLessonMotionBlockId =
  | "bind-and-reconstruct"
  | "evaluate-and-gather";

export interface KpLispLessonMotionCheckpoint {
  readonly id: string;
  readonly label: string;
  readonly progress: number;
}

export interface KpLispLessonMotionBlock {
  readonly id: KpLispLessonMotionBlockId;
  readonly label: string;
  readonly checkpoints: readonly KpLispLessonMotionCheckpoint[];
}

export const kpLispLessonMotionBlocks: readonly KpLispLessonMotionBlock[] =
  Object.freeze([
    block("bind-and-reconstruct", "Bind and reconstruct", [
      checkpoint("application-ready", "Application ready", 0),
      checkpoint("binding-established", "Binding established", 0.46),
      checkpoint("body-reconstructed", "Body reconstructed", 1)
    ]),
    block("evaluate-and-gather", "Evaluate and gather", [
      checkpoint("evaluation-form-ready", "Form ready", 0),
      checkpoint("evaluation-gathering", "Evaluation gathering", 0.58),
      checkpoint("result-settled", "Result settled", 1)
    ])
  ]);

function block(
  id: KpLispLessonMotionBlockId,
  label: string,
  checkpoints: readonly KpLispLessonMotionCheckpoint[]
): KpLispLessonMotionBlock {
  return Object.freeze({ id, label, checkpoints: Object.freeze([...checkpoints]) });
}

function checkpoint(
  id: string,
  label: string,
  progress: number
): KpLispLessonMotionCheckpoint {
  return Object.freeze({ id, label, progress });
}
