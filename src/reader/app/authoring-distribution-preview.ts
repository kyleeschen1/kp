import { createKpAnimationAsset } from "../../animation/asset.ts";
import { createKpFractionCompositionEquationAnimationAsset } from "../../animation/fraction-composition-equation-adapter.ts";
import { createKpSemanticTransformation } from "../../semantic/asset-transformation.ts";
import { compileKpFractionCompositionDistributionPresentationPlan } from "../../animation/fraction-composition-distribution-presentation-plan.ts";
import { registerKpOperationPresentationPlan } from "../../animation/operation-presentation-plan-types.ts";

export class KpReaderAuthoringDistributionPreviewError extends Error {
  readonly code = "kp.reader.authoring-distribution-preview-gap";
}

/** Exact canonical specimen transport, not arbitrary animation deserialization.
 * Endpoint, timing and lineage checks precede reconstruction of local authority.
 */
export function restoreKpReaderAuthoringDistributionPreview(value: unknown) {
  if (typeof value !== "object" || value === null) throw new KpReaderAuthoringDistributionPreviewError("Missing prepared structural preview.");
  const data = value as Record<string, unknown>;
  if (data["schemaVersion"] !== "kp.authoring-structural-preview.v1" || data["status"] !== "valid" ||
      data["requestId"] !== "request.authoring-structural.distribution" ||
      typeof data["beforeVersionId"] !== "string" || data["beforeVersionId"].length === 0 ||
      typeof data["afterVersionId"] !== "string" || data["afterVersionId"].length === 0 ||
      data["beforeVersionId"] === data["afterVersionId"]) throw new KpReaderAuthoringDistributionPreviewError("Invalid prepared structural revision.");
  const canonical = createKpFractionCompositionEquationAnimationAsset();
  const expected = createKpAnimationAsset({ ...canonical, transformations: canonical.transformations.map((transformation, index) =>
    index === 0 ? createKpSemanticTransformation({ ...transformation,
      definitionId: "definition.generated.distribution.distribute-multiplication" }) : transformation) });
  if (JSON.stringify(data["animation"]) !== JSON.stringify(expected)) throw new KpReaderAuthoringDistributionPreviewError(
    "Prepared animation differs from the bounded canonical source, lineage or presentation contract.");
  // Rebuild rather than accepting serialized nominal authority. The authoring
  // source executes on the dev server, never inside the reader's runtime graph.
  const animation = createKpAnimationAsset(data["animation"] as typeof expected);
  const transformation = animation.transformations[0]!;
  const selectors = (ids: readonly string[]) => animation.bundle.objects.filter(object => ids.includes(object.id))
    .flatMap(object => object.selectors.map(selector => selector.id));
  registerKpOperationPresentationPlan(transformation, compileKpFractionCompositionDistributionPresentationPlan({
    transformation, sourceSelectorIds: selectors(transformation.sourceObjectIds), targetSelectorIds: selectors(transformation.targetObjectIds)
  }));
  return Object.freeze({ animation, beforeVersionId: data["beforeVersionId"], afterVersionId: data["afterVersionId"] });
}

export async function loadKpReaderAuthoringDistributionPreview(root: HTMLElement) {
  const response = await fetch("/api/dev/authoring-structural/distribution", { cache: "no-store" });
  if (!response.ok) throw new KpReaderAuthoringDistributionPreviewError("The prepared structural preview is unavailable; no replacement animation was selected.");
  const preview = restoreKpReaderAuthoringDistributionPreview(await response.json());
  root.dataset["kpAuthoringStructuralSource"] = "distribution";
  root.dataset["kpAuthoringStructuralBefore"] = preview.beforeVersionId;
  root.dataset["kpAuthoringStructuralAfter"] = preview.afterVersionId;
  return preview.animation;
}
