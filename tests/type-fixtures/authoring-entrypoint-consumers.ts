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
import { renderBayesCardRevision } from "../../src/experiments/bayesian-reasoning/page.ts";
import { projectBayesReading } from "../../src/experiments/bayesian-reasoning/readings.ts";
import { projectBayesPrompts } from "../../src/experiments/bayesian-reasoning/prompts.ts";
import { extractBayesDenominator, resolveBayesDenominatorReturn } from "../../src/experiments/bayesian-reasoning/extraction.ts";
import { createBayesAuthoringSession } from "../../src/experiments/bayesian-reasoning/authoring.ts";
import { readBayesSourceEnvelope, type BayesSourceEnvelope, type BayesEditorialText } from "../../src/experiments/bayesian-reasoning/editorial-source.ts";
import { bindBayesEditorial } from "../../src/experiments/bayesian-reasoning/editorial-binding.ts";
import { compileKpEquationTransformSeries } from "../../src/authoring/compile-equation-transform-series.ts";
import { verifyKpDistributionRewrite } from "../../src/semantic/structured-expression-rewrite.ts";
import type { KpStructuredExpressionRoleBindingSet } from "../../src/semantic/structured-expression-role-binding.ts";
import { createDistributionFactoringAnimationAsset } from "../../src/animation/distribution-adapter.ts";
import { readKpCommonFactorSource, type KpCommonFactorSource } from "../../src/authoring/common-factor-source.ts";
import { normalizeKpCommonFactorEndpoints } from "../../src/authoring/common-factor-normalizer.ts";
const factoringSyntax = readKpCommonFactorSource(undefined); void factoringSyntax;
const factoringEndpoints = normalizeKpCommonFactorEndpoints(factoringSyntax); void factoringEndpoints;
// @ts-expect-error Authoring syntax has exactly two endpoints and no partial source.
const partialFactoring: KpCommonFactorSource = { schemaVersion: "kp.common-factor-source.v1", states: [] }; void partialFactoring;

// M1a pins the actual pre-extension series, proof and asset closures. Add each
// new authoring consumer here as it lands; a registry count is not cost coverage.
declare const factoringRequest: unknown;
declare const factoringBindings: KpStructuredExpressionRoleBindingSet;
const factoringCandidate = compileKpEquationTransformSeries({ value: factoringRequest });
const factoringRewrite = verifyKpDistributionRewrite(factoringBindings);
const factoringAsset = createDistributionFactoringAnimationAsset();
void [factoringCandidate, factoringAsset];
if (factoringRewrite.ok) {
  const law: "kp.algebra.distribute.v1" = factoringRewrite.verification.lawId; void law;
} else {
  // @ts-expect-error Rejected structure cannot carry a verified rewrite.
  factoringRewrite.verification;
}

// Include every selected domain owner, not only the first implementation wave.
// Node transport is checked by tsconfig.node; this fixed cohort is platform-neutral.
declare const selectedJson: string;
declare const selectedMarket: unknown;
const editorialEnvelope = readBayesSourceEnvelope(selectedMarket);
if (editorialEnvelope.schemaVersion === "kp.bayes-source.v2") {
  const title: string = editorialEnvelope.editorial.title; void title;
}
// @ts-expect-error A v2 source must carry its complete editorial input.
const missingEditorial: BayesSourceEnvelope = { schemaVersion: "kp.bayes-source.v2", model: {}, teaching: { firstEventId: "a", detailLevel: "complete" } }; void missingEditorial;
// @ts-expect-error A source fact reference cannot author proof or an arbitrary expression.
const proofText: BayesEditorialText = [{ fact: "proof" }]; void proofText;
// @ts-expect-error Parsed syntax cannot stand in for a compiled source with semantic authority.
const syntaxDraft: PreparedBayesDraft = editorialEnvelope; void syntaxDraft;
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
  const editorial = bindBayesEditorial(bayes.draft.trace, selectedMarket);
  const resolvedBody: string = editorial.passages[0]!.body; void resolvedBody;
  // @ts-expect-error Parsed source does not establish verified trace authority.
  bindBayesEditorial(editorialEnvelope, selectedMarket);
  const revision: string = bayes.draft.revisionId; void revision;
  // R4B measures all affected view owners before adding editorial source types.
  const card: string = renderBayesCardRevision(bayes.draft); void card;
  const reading = projectBayesReading(bayes.draft, "compact");
  const prompts = projectBayesPrompts(bayes.draft);
  const extraction = extractBayesDenominator(bayes.draft, 2.5);
  const position = resolveBayesDenominatorReturn(bayes.draft, extraction);
  const session = createBayesAuthoringSession({ initial: bayes.draft,
    prepare: async () => ({ dispose() {} }), commit: (_surface, selected) => { const id: string = selected.revisionId; void id; } });
  void [reading, prompts, position, session];
  // @ts-expect-error A report has no authority to render a selected Bayes revision.
  renderBayesCardRevision(bayesReport);
  // @ts-expect-error Published reading output cannot replace a prepared source.
  projectBayesPrompts(reading);
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
