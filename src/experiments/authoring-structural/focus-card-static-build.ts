import katex from "katex";
import { buildKpAuthoredDistributionPreview } from "./distribution-preview-build.ts";
import { buildKpAuthoredSimplificationPreview } from "./simplification-preview-build.ts";
import { renderKpAuthoredFocusCard } from "../authored-focus-card-content.ts";

/** Static paint is compiled from the same verified endpoints as enhancement.
 * No handwritten equation or authoring callback is shipped as reader truth. */
export function buildKpAuthoredFocusCardStatic(kind: "distribution" | "simplification") {
  const { animation } = kind === "distribution" ? buildKpAuthoredDistributionPreview() : buildKpAuthoredSimplificationPreview();
  const operation = animation.transformations[0]!;
  const endpoints = [operation.sourceObjectIds[0], operation.targetObjectIds[0]].map(id => {
    const object = animation.bundle.objects.find(object => object.id === id);
    const value = object?.value;
    if (typeof value !== "object" || value === null || !("latex" in value) || typeof value.latex !== "string") {
      throw new Error("kp.authoring.static-card.endpoint-gap");
    }
    return katex.renderToString(value.latex, { displayMode: true, throwOnError: true });
  });
  return renderKpAuthoredFocusCard(kind, `<div class="kp-focus-deck__stage" data-kp-static-equation-endpoints>${endpoints.join("")}</div>`, true);
}
