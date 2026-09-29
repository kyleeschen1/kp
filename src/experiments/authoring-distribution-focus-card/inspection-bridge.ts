import type { restoreKpReaderAuthoringDistributionPreview } from "../../reader/app/authoring-distribution-preview.ts";
import { createKpSymbolicInspectionLease } from "../../semantic/symbolic-inspection-lease.ts";
import { KpSymbolicInspectionGap } from "../../semantic/symbolic-inspection-evidence.ts";

/** Consumes the already-restored specimen; never accepts serialized authority. */
export function createKpDistributionInspection(preview: ReturnType<typeof restoreKpReaderAuthoringDistributionPreview>) {
  const transformation = preview.animation.transformations[0];
  if (transformation?.id !== "fraction-solve.step.distribute") throw new KpSymbolicInspectionGap("transformation", "The distribution host must inspect its first canonical operation.");
  return createKpSymbolicInspectionLease({
    assetId: preview.animation.id, bundle: preview.animation.bundle, transformation,
    sourceRevision: preview.beforeVersionId, targetRevision: preview.afterVersionId
  });
}
