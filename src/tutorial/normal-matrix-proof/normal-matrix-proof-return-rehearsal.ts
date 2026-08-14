import type { KpNormalMatrixProofPromptId } from
  "../../semantic/normal-matrix-proof-prompt-ids.ts";
import {
  createKpNormalMatrixProofPromptProjections,
  type KpNormalMatrixProofPromptProjection
} from "./normal-matrix-proof-prompt-projection.ts";

export type KpNormalMatrixProofReturnDay = "day-zero" | "day-one" | "day-seven";

export interface KpNormalMatrixProofReturnSession {
  readonly id: KpNormalMatrixProofReturnDay;
  readonly title: string;
  readonly instruction: string;
  readonly prompts: readonly KpNormalMatrixProofPromptProjection[];
}

const promptIdsBySession = Object.freeze({
  "day-zero": Object.freeze([
    "predict-row-remainder",
    "explain-zero-norm",
    "reconstruct-proof"
  ] as const),
  "day-one": Object.freeze([
    "define-normality",
    "read-left-entry",
    "read-right-entry",
    "connect-normality-to-norms"
  ] as const),
  "day-seven": Object.freeze([
    "explain-sparse-column",
    "inherit-normality",
    "why-complex",
    "diagonal-only-trap"
  ] as const)
}) satisfies Readonly<
  Record<KpNormalMatrixProofReturnDay, readonly KpNormalMatrixProofPromptId[]>
>;

export const kpNormalMatrixProofReturnCaptureTemplate = `Return:
Prompts attempted:
What I reconstructed before revealing answers:
Where recall failed:
One proof link to revisit:`;

export function createKpNormalMatrixProofReturnRehearsal(
  baseUrl: string | URL
): readonly KpNormalMatrixProofReturnSession[] {
  const prompts = new Map(createKpNormalMatrixProofPromptProjections(baseUrl).map(
    (prompt) => [prompt.id, prompt] as const
  ));
  return Object.freeze([
    session(
      "day-zero",
      "Day zero",
      "Immediately after reading, recover the decisive inference and the whole route.",
      prompts
    ),
    session(
      "day-one",
      "Day one",
      "Return without rereading and rebuild the row-column comparison.",
      prompts
    ),
    session(
      "day-seven",
      "Day seven",
      "Pressure the basis choice, induction step, and limits of the argument.",
      prompts
    )
  ]);
}

function session(
  id: KpNormalMatrixProofReturnDay,
  title: string,
  instruction: string,
  prompts: ReadonlyMap<
    KpNormalMatrixProofPromptId,
    KpNormalMatrixProofPromptProjection
  >
): KpNormalMatrixProofReturnSession {
  return Object.freeze({
    id,
    title,
    instruction,
    prompts: Object.freeze(promptIdsBySession[id].map((promptId) => {
      const prompt = prompts.get(promptId);
      if (prompt === undefined) {
        throw new Error(`Return rehearsal references missing prompt ${promptId}.`);
      }
      return prompt;
    }))
  });
}
