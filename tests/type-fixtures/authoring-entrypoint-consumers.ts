import { checkBayesDraft, createBayesDraft } from "../../src/experiments/bayesian-reasoning/draft.ts";
import { compileKpEquationSeriesLogarithmBaseDraft, createKpEquationSeriesLogarithmBaseDraft } from "../../src/authoring/equation-series-logarithm-base-draft.ts";
import { bindCodeReasoningEvidence, createCodeReasoningSource } from "../../src/experiments/reusable-reasoning/code-evidence.ts";
import { routeKpCrossDomainGalleryGeneration } from "../../scripts/cross-domain-gallery-generation-router.ts";
import { kpGalleryGraph3DSaddleParameterFrontend, kpGalleryGraph3DSaddleParameterRequest } from "../../scripts/gallery-graph-3d-saddle-parameter-frontend.ts";
import { reportAuthorCheck } from "../../src/authoring/author-check-report.ts";
import type { PreparedBayesDraft } from "../../src/experiments/bayesian-reasoning/draft.ts";
import type { KpLogarithmBaseDraftCompilation } from "../../src/authoring/equation-series-logarithm-base-draft.ts";
import { compileKpEquationSeriesLogarithmBaseText } from "../../src/authoring/equation-series-logarithm-base-draft.ts";
import { checkBayesAuthorSource } from "../../src/experiments/bayesian-reasoning/author-check.ts";
import { checkCodeReasoningSource } from "../../src/experiments/reusable-reasoning/code-author-check.ts";
import { checkEquationReasoningSource } from "../../src/experiments/reusable-reasoning/equation-author-check.ts";
import { readKpAuthoringMarketSourceBranch } from "../../src/experiments/authoring-market/authoring-market-source-branch.ts";
import { inspectAuthorSourceLimits } from "../../src/authoring/author-source-limits.ts";

// Include every selected domain owner, not only the first implementation wave.
// Node transport is checked by tsconfig.node; this fixed cohort is platform-neutral.
declare const selectedJson: string;
declare const selectedMarket: unknown;
const probabilitySummary = reportAuthorCheck("bayes.binary", checkBayesAuthorSource(selectedJson));
if (probabilitySummary.status === "checked") {
  const revision: string = probabilitySummary.result.revisionId; void revision;
  // @ts-expect-error Serial summary does not carry a prepared runtime draft.
  probabilitySummary.result.draft;
}
const codeSummary = reportAuthorCheck("reasoning.code", checkCodeReasoningSource(selectedJson));
if (codeSummary.status === "checked") {
  const checkpointKind: "pedagogical-stage" = codeSummary.result.checkpointKind; void checkpointKind;
}
const reasoningSummary = checkEquationReasoningSource(selectedJson);
if (reasoningSummary.status === "compiled") {
  const promptCount: number = reasoningSummary.promptCount; void promptCount;
}
const market = readKpAuthoringMarketSourceBranch(selectedMarket);
const branchName: string = market.name; void branchName;
const numericText = compileKpEquationSeriesLogarithmBaseText(selectedJson);
if (numericText.status === "compiled") {
  const stateCount: number = numericText.active.request.states.length; void stateCount;
}
const transportGap = inspectAuthorSourceLimits(selectedJson);
if (transportGap) { const code: string = transportGap.diagnostic.code; void code; }

// Measure the actual owner closures before a facade can hide their costs.
const bayes = checkBayesDraft(JSON.stringify(createBayesDraft()));
const bayesReport = reportAuthorCheck("bayes.binary", bayes);
// @ts-expect-error A preview link is not an applied host revision.
const applied: "applied" = bayesReport.handoff.execution; void applied;
// @ts-expect-error The check report cannot issue a publication revision.
bayesReport.handoff.publishedRevision;
if (bayesReport.status === "repair-gap") {
  const expected: string = bayesReport.result.diagnostic.expected; void expected;
  // @ts-expect-error A rejected report cannot contain a prepared draft.
  bayesReport.result.draft;
}
// @ts-expect-error A checked report never supplies host preparation authority.
const prepared: PreparedBayesDraft = bayesReport; void prepared;
if (bayes.status === "compiled") {
  const revision: string = bayes.draft.revisionId; void revision;
} else {
  // @ts-expect-error Invalid input never carries a partial prepared draft.
  bayes.draft;
}
const equation = compileKpEquationSeriesLogarithmBaseDraft(createKpEquationSeriesLogarithmBaseDraft());
if (equation.status === "compiled") {
  const count: number = equation.active.request.states.length; void count;
  const semanticId: string = equation.semantic.id; void semanticId;
}
// @ts-expect-error A compiled numeric result requires active candidate and semantic evidence.
const partialEquation: KpLogarithmBaseDraftCompilation = { status: "compiled", repairs: [] }; void partialEquation;
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
