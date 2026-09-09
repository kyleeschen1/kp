import { checkBayesDraft, createBayesDraft } from "../../src/experiments/bayesian-reasoning/draft.ts";
import { compileKpEquationSeriesLogarithmBaseDraft, createKpEquationSeriesLogarithmBaseDraft } from "../../src/authoring/equation-series-logarithm-base-draft.ts";
import { bindCodeReasoningEvidence, createCodeReasoningSource } from "../../src/experiments/reusable-reasoning/code-evidence.ts";
import { routeKpCrossDomainGalleryGeneration } from "../../scripts/cross-domain-gallery-generation-router.ts";
import { kpGalleryGraph3DSaddleParameterFrontend, kpGalleryGraph3DSaddleParameterRequest } from "../../scripts/gallery-graph-3d-saddle-parameter-frontend.ts";

// Measure the actual owner closures before a facade can hide their costs.
const bayes = checkBayesDraft(JSON.stringify(createBayesDraft()));
if (bayes.status === "compiled") {
  const revision: string = bayes.draft.revisionId; void revision;
} else {
  // @ts-expect-error Invalid input never carries a partial prepared draft.
  bayes.draft;
}
const equation = compileKpEquationSeriesLogarithmBaseDraft(createKpEquationSeriesLogarithmBaseDraft());
if (equation.status === "compiled") {
  const active = equation.active; void active;
}
const code = bindCodeReasoningEvidence(createCodeReasoningSource());
const kind: "pedagogical-stage" = code.context.checkpointKind; void kind;
// @ts-expect-error Code evidence does not have mathematical semantic stops.
const mathematical: "semantic-state" = code.context.checkpointKind; void mathematical;
// @ts-expect-error Bound code source is immutable.
code.source.title = "mutated";
const graph = routeKpCrossDomainGalleryGeneration(kpGalleryGraph3DSaddleParameterRequest, [kpGalleryGraph3DSaddleParameterFrontend]);
if (graph.status === "repair-required") {
  const diagnostic = graph.diagnostics[0]; void diagnostic;
}
