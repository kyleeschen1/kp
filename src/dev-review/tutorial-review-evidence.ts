import type { KpDevReviewTutorialEvidenceV1 } from
  "../../protocols/dev-review-v1.ts";
import { kpDevReviewTutorialEvidenceSchema } from
  "../../protocols/dev-review-schema.ts";

const evidenceDatasetKey = "kpTutorialReviewEvidence";

/**
 * Keeps domain adapters typed while exposing only one optional extension seam
 * to the generic tutorial capture provider.
 */
export function writeKpTutorialReviewEvidence(
  root: HTMLElement,
  evidence: KpDevReviewTutorialEvidenceV1
): void {
  root.dataset[evidenceDatasetKey] = JSON.stringify(
    kpDevReviewTutorialEvidenceSchema.parse(evidence)
  );
}

export function readKpTutorialReviewEvidence(
  root: HTMLElement
): KpDevReviewTutorialEvidenceV1 {
  const serialized = root.dataset[evidenceDatasetKey];
  if (serialized === undefined || serialized.trim() === "") return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error("Tutorial review evidence must be valid JSON.");
  }
  return kpDevReviewTutorialEvidenceSchema.parse(parsed);
}
