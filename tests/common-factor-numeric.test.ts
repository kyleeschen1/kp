import assert from "node:assert/strict";
import test from "node:test";
import numeric from "../src/authoring/examples/common-factor-numeric.json" with { type: "json" };
import { prepareKpCommonFactorDraft, exportKpCommonFactorSource } from "../src/authoring/common-factor-draft.ts";
import { createKpCommonFactorExample } from "../src/authoring/common-factor-author-check.ts";
import { commonFactorEndpoints } from "../src/experiments/common-factor/endpoints.ts";
import { projectCommonFactorReading } from "../src/experiments/common-factor/readings.ts";
import { projectCommonFactorPrompts } from "../src/experiments/common-factor/practice.ts";

test("numeric second caller reuses complete canonical presentation from source alone", () => {
  const primary = prepareKpCommonFactorDraft(createKpCommonFactorExample());
  const draft = prepareKpCommonFactorDraft(numeric);
  assert.equal(draft.presentation.owner, primary.presentation.owner);
  assert.equal(draft.presentation.canonicalReference, primary.presentation.canonicalReference);
  assert.equal(draft.presentation.composition, primary.presentation.composition);
  assert.deepEqual(draft.presentation.plan.choreography!.phaseIds, primary.presentation.plan.choreography!.phaseIds);
  assert.notEqual(draft.revisionId, primary.revisionId);
  assert.deepEqual(commonFactorEndpoints(draft).map(endpoint => endpoint.annotated.rawLatex), ["2x + 2y", "2(x + y)"]);
  assert.equal(prepareKpCommonFactorDraft(JSON.parse(exportKpCommonFactorSource(draft))).revisionId, draft.revisionId);
  assert.ok(projectCommonFactorReading(draft, "full").html.includes(numeric.editorial.setup));
  for (const prompt of projectCommonFactorPrompts(draft)) assert.equal(prompt.answerLatex, "2(x + y)");
});
