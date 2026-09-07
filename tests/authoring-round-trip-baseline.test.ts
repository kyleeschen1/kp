import assert from "node:assert/strict";
import test from "node:test";
import { buildKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-build.ts";
import { prepareKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-prepare.ts";
import { compileKpEquationTransformSeries } from "../src/authoring/compile-equation-transform-series.ts";
import { createKpEquationSeriesLogarithmBaseSemanticSource,
  KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID, KP_LOGARITHM_BASE_AUTHORING_PACK_PIN
} from "../src/authoring/equation-series-logarithm-base-authoring.ts";
import { kpCanonicalLogarithmChangeOfBase as transformation } from "../src/semantic/logarithm-change-of-base.ts";

test("R1 wording baseline edits prose without changing the semantic revision", () => {
  const data = buildKpAuthoringMarketPreview("reference");
  const original = prepareKpAuthoringMarketPreview(data);
  const text = data.article.text.replace("How does a tax reshape a market?", "How does this tax change the market?");
  assert.notEqual(text, data.article.text);
  const edited = prepareKpAuthoringMarketPreview({ ...data, article: { ...data.article, text } });
  assert.equal(edited.facts.modelRevisionId, original.facts.modelRevisionId);
  assert.equal(edited.facts.text("after.revenue"), "12");
  assert.equal(edited.boundArticle.text, text);
});

test("R1 parameter baseline updates bound values and rejects mixed revisions", () => {
  const reference = buildKpAuthoringMarketPreview("reference");
  const variation = buildKpAuthoringMarketPreview("variation");
  const prepared = prepareKpAuthoringMarketPreview(variation);
  assert.equal(prepared.facts.text("after.revenue"), "10");
  assert.notEqual(variation.article.modelRevisionId, reference.article.modelRevisionId);
  assert.throws(() => prepareKpAuthoringMarketPreview({ ...variation, article: reference.article }), /revision/);
  assert.match(prepared.boundArticle.text, /2 dollars per unit/);
});

test("R1 equation edit baseline requires verified source and repairs a mismatched endpoint", () => {
  const source = createKpEquationSeriesLogarithmBaseSemanticSource({
    sourceId: "source.round-trip.log-base", revisionId: "revision.round-trip.log-base.v1",
    adjacencyId: "adjacency.round-trip.log-base", transformation
  });
  const value = {
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request", id: "series.round-trip.log-base",
    states: [
      { id: transformation.source.stateId, latex: "\\log_2(7)" },
      { id: transformation.target.stateId, latex: "\\frac{\\ln(7)}{\\ln(2)}" }
    ],
    adjacencies: [{ id: "adjacency.round-trip.log-base",
      fromStateId: transformation.source.stateId, toStateId: transformation.target.stateId,
      intent: { mode: "explicit", operationId: KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID,
        semanticArguments: {
          schemaVersion: "kp.equation-series.logarithm-base-intent.v1",
          sourcePin: { sourceId: source.sourceId, revisionId: source.revisionId },
          operationPin: KP_LOGARITHM_BASE_AUTHORING_PACK_PIN,
          semanticBindings: { sourceBaseSemanticId: transformation.source.base.semanticId,
            sourceArgumentSemanticId: transformation.source.argument.semanticId,
            targetLogarithmFunction: "natural-logarithm" },
          domainEvidenceIds: transformation.domainEvidence,
          correspondenceIds: transformation.correspondence.map(({ id }) => id)
        }
      }
    }]
  };
  const valid = compileKpEquationTransformSeries({ value, governedSources: [source] });
  assert.equal(valid.status, "compiled");
  const missingSource = compileKpEquationTransformSeries({ value });
  assert.equal(missingSource.status, "repair-required");
  assert.equal(missingSource.repairs[0]?.kind, "semantic-source");
  const changed = { ...value, states: [value.states[0]!, { ...value.states[1]!, latex: "\\frac{\\ln(2)}{\\ln(7)}" }] };
  const invalid = compileKpEquationTransformSeries({ value: changed, governedSources: [source], previous: valid });
  assert.equal(invalid.status, "repair-required");
  assert.equal(invalid.active, valid.active);
  assert.equal(invalid.repairs[0]?.kind, "semantic-source");
  const repaired = compileKpEquationTransformSeries({ value, governedSources: [source], previous: invalid });
  assert.equal(repaired.status, "compiled");
  assert.deepEqual(repaired.active, valid.active);
});
