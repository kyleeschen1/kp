import { createKpAuthoredDistributionProjection, requireKpAuthoredDistributionNativeAnimation } from "./distribution-projection.ts";

/** Trusted local preparation. No author callbacks or receipt capabilities cross
 * the read-only transport; the reader must reconstruct its own paint authority.
 */
export function buildKpAuthoredDistributionPreview() {
  const { projection } = createKpAuthoredDistributionProjection();
  return { schemaVersion: "kp.authoring-structural-preview.v1", status: "valid",
    animation: requireKpAuthoredDistributionNativeAnimation(projection),
    requestId: projection.governed.requestId,
    beforeVersionId: projection.before.versionId, afterVersionId: projection.after.versionId };
}
