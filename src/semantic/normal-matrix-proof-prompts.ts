import {
  createKpFlashcardSpec,
  validateKpFlashcardSpec,
  type KpFlashcardKind,
  type KpFlashcardSpec
} from "./asset-flashcard.ts";
import {
  kpNormalMatrixProofCheckpointTimeMs,
  type KpNormalMatrixProofCheckpointId
} from "./normal-matrix-proof-checkpoints.ts";
import {
  createKpNormalMatrixProofOperationSet,
  kpNormalMatrixProofSelectorId,
  type KpNormalMatrixProofTransformationPath
} from "./normal-matrix-proof-operations.ts";
import type { KpNormalMatrixProofObjectPath } from
  "./normal-matrix-proof-semantics.ts";

export const kpNormalMatrixProofPromptIds = Object.freeze([
  "define-normality",
  "read-left-entry",
  "read-right-entry",
  "connect-normality-to-norms",
  "explain-sparse-column",
  "predict-row-remainder",
  "explain-zero-norm",
  "inherit-normality",
  "reconstruct-proof",
  "why-complex",
  "diagonal-only-trap"
] as const);

export type KpNormalMatrixProofPromptId =
  typeof kpNormalMatrixProofPromptIds[number];

export interface KpNormalMatrixProofPrompt {
  readonly id: KpNormalMatrixProofPromptId;
  readonly checkpointId: KpNormalMatrixProofCheckpointId;
  readonly card: KpFlashcardSpec;
}

const operationSet = createKpNormalMatrixProofOperationSet();

export const kpNormalMatrixProofPrompts:
  readonly KpNormalMatrixProofPrompt[] = Object.freeze([
    prompt(
      "define-normality",
      "cloze",
      "Define normality",
      "Complete the equation that defines a normal matrix: M M† = ____.",
      "statement",
      ["normality"],
      [],
      { kind: "text", value: "M† M" }
    ),
    prompt(
      "read-left-entry",
      "focus-relationship",
      "Read the left product",
      "What does the top-left entry of M M† measure?",
      "row-column-norms",
      ["product-left", "product-left/first-entry"],
      ["interpret-left-first-entry"],
      { kind: "text", value: "The squared norm of the first row: |lambda|² + ||r||²." }
    ),
    prompt(
      "read-right-entry",
      "focus-relationship",
      "Read the right product",
      "What does the top-left entry of M† M measure?",
      "row-column-norms",
      ["product-right", "product-right/first-entry"],
      ["interpret-right-first-entry"],
      { kind: "text", value: "The squared norm of the first column: |lambda|²." }
    ),
    prompt(
      "connect-normality-to-norms",
      "explain-transform",
      "Connect normality to the norms",
      "Why must the corresponding first-row and first-column norms agree?",
      "row-column-norms",
      ["normality", "product-left/first-entry", "product-right/first-entry"],
      ["interpret-left-first-entry", "interpret-right-first-entry"],
      { kind: "text", value: "Normality equates M M† and M† M, so their corresponding diagonal entries agree." }
    ),
    prompt(
      "explain-sparse-column",
      "explain-transform",
      "Explain the sparse column",
      "Why does the eigenvector-first basis put zeros below lambda?",
      "eigenbasis",
      ["eigenbasis", "matrix/eigenvalue", "matrix/zero-column"],
      ["choose-eigenvector-first-basis"],
      { kind: "text", value: "Because the first basis vector v satisfies Mv = lambda v." }
    ),
    prompt(
      "predict-row-remainder",
      "predict-next",
      "Predict the row remainder",
      "The two first entries are equal. What must normality force r to be?",
      "norm-equation",
      ["matrix/row-remainder", "inference/norm-equality"],
      ["force-row-remainder-zero"],
      {
        kind: "transformation",
        value: transformationId("force-row-remainder-zero")
      }
    ),
    prompt(
      "explain-zero-norm",
      "explain-transform",
      "Explain zero norm",
      "Why does ||r||² = 0 imply r = 0?",
      "remainder-zero",
      ["matrix/row-remainder", "inference/remainder-zero"],
      ["force-row-remainder-zero"],
      { kind: "text", value: "A norm is positive definite: only the zero vector has squared norm zero." }
    ),
    prompt(
      "inherit-normality",
      "focus-relationship",
      "Pass normality to B",
      "Why is the lower block B itself normal?",
      "recursion",
      ["normality", "matrix/lower-block", "proof/recursive-subproblem"],
      ["restrict-normality-to-lower-block"],
      { kind: "text", value: "The lower-right blocks of M M† = M† M give B B† = B† B." }
    ),
    prompt(
      "reconstruct-proof",
      "explain-transform",
      "Reconstruct the proof",
      "Starting with one eigenvector, reconstruct the route to induction in a few sentences.",
      "recursion",
      ["matrix", "eigenbasis", "inference/remainder-zero", "proof/recursive-subproblem"],
      [...operationSet.transformations.map(({ id }) =>
        id.replace("transform.normal-proof.", "") as KpNormalMatrixProofTransformationPath
      )],
      {
        kind: "text",
        value: "Choose an orthonormal basis beginning with an eigenvector. Compare the first row and column norms using normality to force r = 0. The remaining block B is normal, so diagonalize it by induction and compose the unitary basis changes."
      }
    ),
    prompt(
      "why-complex",
      "explain-transform",
      "Locate the complex-field step",
      "Which step can fail if the scalar field is real rather than complex?",
      "eigenbasis",
      ["eigenbasis"],
      ["choose-eigenvector-first-basis"],
      { kind: "text", value: "The characteristic polynomial need not have a real root, so a real eigenvector may not exist." }
    ),
    prompt(
      "diagonal-only-trap",
      "focus-relationship",
      "Avoid the diagonal-entry trap",
      "Why is matching row and column norms in one arbitrary basis not enough to prove normality?",
      "row-column-norms",
      ["normality", "product-left/first-entry", "product-right/first-entry"],
      [],
      { kind: "text", value: "Those equalities compare only diagonal entries. Full normality is the matrix equality, and the proof uses its unitary invariance before choosing an eigenvector-containing basis." }
    )
  ]);

export function findKpNormalMatrixProofPrompt(
  id: KpNormalMatrixProofPromptId
): KpNormalMatrixProofPrompt {
  const found = kpNormalMatrixProofPrompts.find((candidate) => candidate.id === id);
  if (found === undefined) throw new Error(`Unknown normal-proof prompt ${id}.`);
  return found;
}

export function checkKpNormalMatrixProofPrompts(
  prompts: readonly KpNormalMatrixProofPrompt[] = kpNormalMatrixProofPrompts
): readonly string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  const selectorIds = new Set(
    operationSet.bundle.objects.flatMap(({ selectors }) =>
      selectors.map(({ id }) => id)
    )
  );
  const transformationIds = new Set(
    operationSet.transformations.map(({ id }) => id)
  );

  for (const promptSpec of prompts) {
    if (ids.has(promptSpec.id)) issues.push(`Duplicate normal-proof prompt ${promptSpec.id}.`);
    ids.add(promptSpec.id);
    issues.push(...validateKpFlashcardSpec(promptSpec.card, {
      bundle: operationSet.bundle,
      transformations: operationSet.transformations
    }).map(({ message }) => message));
    if (promptSpec.card.id !== `card.normal-proof.${promptSpec.id}`) {
      issues.push(`Prompt ${promptSpec.id} has a non-canonical card id.`);
    }
    if (
      promptSpec.card.timeMs !==
      kpNormalMatrixProofCheckpointTimeMs(promptSpec.checkpointId)
    ) {
      issues.push(`Prompt ${promptSpec.id} time must derive from checkpoint ${promptSpec.checkpointId}.`);
    }
    const answer = promptSpec.card.answer;
    if (answer?.kind === "selector" && !selectorIds.has(answer.value)) {
      issues.push(`Prompt ${promptSpec.id} answers with unknown selector ${answer.value}.`);
    }
    if (answer?.kind === "transformation" && !transformationIds.has(answer.value)) {
      issues.push(`Prompt ${promptSpec.id} answers with unknown transformation ${answer.value}.`);
    }
  }
  if (
    prompts.length !== kpNormalMatrixProofPromptIds.length ||
    kpNormalMatrixProofPromptIds.some((id) => !ids.has(id))
  ) {
    issues.push("The normal-proof prompt suite must contain all eleven stable prompt ids.");
  }
  return Object.freeze(issues);
}

function prompt(
  id: KpNormalMatrixProofPromptId,
  kind: KpFlashcardKind,
  title: string,
  promptText: string,
  checkpointId: KpNormalMatrixProofCheckpointId,
  objectPaths: readonly KpNormalMatrixProofObjectPath[],
  transformationPaths: readonly KpNormalMatrixProofTransformationPath[],
  answer: NonNullable<KpFlashcardSpec["answer"]>
): KpNormalMatrixProofPrompt {
  return Object.freeze({
    id,
    checkpointId,
    card: createKpFlashcardSpec({
      id: `card.normal-proof.${id}`,
      kind,
      title,
      assetId: operationSet.bundle.id,
      prompt: promptText,
      objectIds: [operationSet.bundle.objects[0]!.id],
      selectorIds: objectPaths.map(kpNormalMatrixProofSelectorId),
      transformationIds: transformationPaths.map(transformationId),
      timeMs: kpNormalMatrixProofCheckpointTimeMs(checkpointId),
      answer
    })
  });
}

function transformationId(path: KpNormalMatrixProofTransformationPath): string {
  return `transform.normal-proof.${path}`;
}
