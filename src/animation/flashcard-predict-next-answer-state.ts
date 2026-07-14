import type {
  KpAnimationFlashcardPreviewRendererItem
} from "./flashcard-preview-renderer-data.ts";

export type KpAnimationPredictNextAnswerStatus =
  | "pending"
  | "correct"
  | "incorrect"
  | "unavailable";

export type KpAnimationPredictNextCandidateState =
  | "available"
  | "expected"
  | "correct"
  | "incorrect";

export interface CreateKpAnimationPredictNextAnswerStateInput {
  readonly item: KpAnimationFlashcardPreviewRendererItem;
  readonly selectedTransformationId?: string | undefined;
}

export interface KpAnimationPredictNextAnswerState {
  readonly id: string;
  readonly kind: "animation-predict-next-answer-state";
  readonly cardId: string;
  readonly expectedTransformationId?: string | undefined;
  readonly selectedTransformationId?: string | undefined;
  readonly status: KpAnimationPredictNextAnswerStatus;
  readonly candidates: readonly KpAnimationPredictNextCandidateStateRow[];
  readonly diagnostics: readonly KpAnimationPredictNextAnswerDiagnostic[];
}

export interface KpAnimationPredictNextCandidateStateRow {
  readonly transformationId: string;
  readonly state: KpAnimationPredictNextCandidateState;
}

export interface KpAnimationPredictNextAnswerDiagnostic {
  readonly severity: "info" | "warning" | "error";
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export function createKpAnimationPredictNextAnswerState(
  input: CreateKpAnimationPredictNextAnswerStateInput
): KpAnimationPredictNextAnswerState {
  const diagnostics: KpAnimationPredictNextAnswerDiagnostic[] = [];

  if (input.item.interactionKind !== "predict-next") {
    diagnostics.push({
      severity: "warning",
      code: "predict-next-answer.non-predict-item",
      path: `items[${input.item.cardId}]`,
      message:
        `Flashcard preview item ${input.item.cardId} is ${input.item.interactionKind}, not predict-next.`
    });

    return answerState(input, "unavailable", [], diagnostics);
  }

  const expected = input.item.expectedTransformationId;
  const selected = input.selectedTransformationId;
  const candidateSet = new Set(input.item.candidateTransformationIds);

  if (selected !== undefined && !candidateSet.has(selected)) {
    diagnostics.push({
      severity: "warning",
      code: "predict-next-answer.unavailable-selection",
      path: "selectedTransformationId",
      message:
        `Selected transformation ${selected} is not a candidate for ${input.item.cardId}.`
    });

    return answerState(
      input,
      "unavailable",
      candidateRows(input.item, selected, expected),
      diagnostics
    );
  }

  if (selected === undefined) {
    return answerState(
      input,
      "pending",
      candidateRows(input.item, selected, expected),
      diagnostics
    );
  }

  return answerState(
    input,
    selected === expected ? "correct" : "incorrect",
    candidateRows(input.item, selected, expected),
    diagnostics
  );
}

function answerState(
  input: CreateKpAnimationPredictNextAnswerStateInput,
  status: KpAnimationPredictNextAnswerStatus,
  candidates: readonly KpAnimationPredictNextCandidateStateRow[],
  diagnostics: readonly KpAnimationPredictNextAnswerDiagnostic[]
): KpAnimationPredictNextAnswerState {
  return {
    id: `predict-next-answer.${input.item.cardId}`,
    kind: "animation-predict-next-answer-state",
    cardId: input.item.cardId,
    ...(input.item.expectedTransformationId === undefined
      ? {}
      : { expectedTransformationId: input.item.expectedTransformationId }),
    ...(input.selectedTransformationId === undefined
      ? {}
      : { selectedTransformationId: input.selectedTransformationId }),
    status,
    candidates,
    diagnostics
  };
}

function candidateRows(
  item: KpAnimationFlashcardPreviewRendererItem,
  selectedTransformationId: string | undefined,
  expectedTransformationId: string | undefined
): readonly KpAnimationPredictNextCandidateStateRow[] {
  return item.candidateTransformationIds.map((transformationId) => ({
    transformationId,
    state: candidateState(
      transformationId,
      selectedTransformationId,
      expectedTransformationId
    )
  }));
}

function candidateState(
  transformationId: string,
  selectedTransformationId: string | undefined,
  expectedTransformationId: string | undefined
): KpAnimationPredictNextCandidateState {
  if (selectedTransformationId === transformationId) {
    return selectedTransformationId === expectedTransformationId
      ? "correct"
      : "incorrect";
  }

  return transformationId === expectedTransformationId ? "expected" : "available";
}
