import { createKpAnimationAsset } from "../../animation/asset.ts";
import { createKpTwoTimesOneCarrierAnimationAsset } from "../../animation/operation-evaluation-adapter.ts";

export class KpReaderAuthoringSimplificationPreviewError extends Error {
  readonly code = "kp.reader.authoring-simplification-preview-gap";
}

export function restoreKpReaderAuthoringSimplificationPreview(value: unknown) {
  if (typeof value !== "object" || value === null) throw new KpReaderAuthoringSimplificationPreviewError("Missing prepared source.");
  const data = value as Record<string, unknown>;
  if (data["schemaVersion"] !== "kp.authoring-simplification-preview.v1" || data["status"] !== "valid" ||
    typeof data["beforeVersionId"] !== "string" || !data["beforeVersionId"] ||
    typeof data["afterVersionId"] !== "string" || !data["afterVersionId"] || data["beforeVersionId"] === data["afterVersionId"]) {
    throw new KpReaderAuthoringSimplificationPreviewError("Invalid source revision.");
  }
  const canonical = createKpTwoTimesOneCarrierAnimationAsset();
  if (JSON.stringify(data["animation"]) !== JSON.stringify(canonical)) {
    throw new KpReaderAuthoringSimplificationPreviewError("Prepared source differs from reviewed semantics, lineage or timing.");
  }
  return Object.freeze({ animation: createKpAnimationAsset(data["animation"] as typeof canonical),
    beforeVersionId: data["beforeVersionId"], afterVersionId: data["afterVersionId"] });
}
