import {
  createKpNormalMatrixProofOperationSet
} from "../../semantic/normal-matrix-proof-operations.ts";
import {
  kpNormalMatrixProofPrompts,
  type KpNormalMatrixProofPromptId
} from "../../semantic/normal-matrix-proof-prompts.ts";
import type { KpNormalMatrixProofCheckpointId } from
  "../../semantic/normal-matrix-proof-checkpoints.ts";
import {
  encodeKpNormalMatrixProofUrl
} from "../../public-web/normal-matrix-proof-url-codec.ts";
import {
  encodeKpNormalMatrixProofSemanticLocation,
  type KpNormalMatrixProofSemanticAddress
} from "./normal-matrix-proof-semantic-focus.ts";

export interface KpNormalMatrixProofPromptProjection {
  readonly id: KpNormalMatrixProofPromptId;
  readonly kind: string;
  readonly title: string;
  readonly question: string;
  readonly answer: string;
  readonly checkpointId: KpNormalMatrixProofCheckpointId;
  readonly focusAddress: KpNormalMatrixProofSemanticAddress;
  readonly promptUrl: string;
  readonly returnUrl: string;
}

const operations = createKpNormalMatrixProofOperationSet();

export function createKpNormalMatrixProofPromptProjections(
  baseUrl: string | URL
): readonly KpNormalMatrixProofPromptProjection[] {
  return Object.freeze(kpNormalMatrixProofPrompts.map((prompt) => {
    const focusAddress = `normal-proof/${prompt.focusPath}` as const;
    return Object.freeze({
      id: prompt.id,
      kind: prompt.card.kind,
      title: prompt.card.title,
      question: prompt.card.prompt,
      answer: answerText(prompt.card.answer),
      checkpointId: prompt.checkpointId,
      focusAddress,
      promptUrl: semanticUrl(baseUrl, {
        checkpoint: prompt.checkpointId,
        evidence: "motion",
        review: prompt.id
      }, focusAddress),
      returnUrl: semanticUrl(baseUrl, {
        checkpoint: prompt.checkpointId,
        evidence: "motion"
      }, focusAddress)
    });
  }));
}

function answerText(
  answer: (typeof kpNormalMatrixProofPrompts)[number]["card"]["answer"]
): string {
  if (answer === undefined) return "No answer has been authored.";
  if (answer.kind !== "transformation") return answer.value;
  const transformation = operations.transformations.find(
    ({ id }) => id === answer.value
  );
  if (transformation === undefined) {
    throw new Error(`Prompt answer references missing transformation ${answer.value}.`);
  }
  const summaries = transformation.correspondenceMap?.records.map(
    ({ summary }) => summary
  ).filter((summary): summary is string => summary !== undefined) ?? [];
  return summaries.join(" ") || transformation.title;
}

function semanticUrl(
  baseUrl: string | URL,
  state: Parameters<typeof encodeKpNormalMatrixProofUrl>[1],
  address: KpNormalMatrixProofSemanticAddress
): string {
  const routeUrl = encodeKpNormalMatrixProofUrl(baseUrl, state);
  const url = new URL(encodeKpNormalMatrixProofSemanticLocation(
    routeUrl,
    address
  ));
  return `${url.pathname}${url.search}${url.hash}`;
}
