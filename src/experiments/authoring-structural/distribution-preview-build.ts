import { createKpAuthoredDistributionProjection, requireKpAuthoredDistributionNativeAnimation } from "./distribution-projection.ts";
import { compileKpEquationExemplarTemplate } from "../../reader/compiler/equation-exemplar-page.ts";
import { createKpFractionCompositionSelectorAnnotatedLatex } from "../../rendering/fraction-composition-selector-annotated-latex.ts";

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

export function buildKpAuthoredDistributionFocusCardPreview() {
  const preview = buildKpAuthoredDistributionPreview();
  return { ...preview, stageTemplate: compileKpEquationExemplarTemplate(preview.animation,
    state => createKpFractionCompositionSelectorAnnotatedLatex(state.id),
    { readerControls: "fraction-composition-v1" }) };
}
