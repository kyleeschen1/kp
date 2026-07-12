import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createGeneratedLinearSolveTutorialCardSample,
  generatedLinearSolveTutorialCardSampleId
} from "../src/tutorial/generated-linear-solve-card-sample.ts";
import { renderKpTutorialCardHtmlShell } from "../src/tutorial/card-html-shell.ts";

test("generated linear-solve tutorial card samples use generated fixture semantics", () => {
  const sample = createGeneratedLinearSolveTutorialCardSample(
    "generated.linear-solve.x-plus-3"
  );
  const frame = sample.sample(0.5);

  assert.equal(
    sample.id,
    generatedLinearSolveTutorialCardSampleId("generated.linear-solve.x-plus-3")
  );
  assert.equal(sample.fixtureId, "generated.linear-solve.x-plus-3");
  assert.equal(sample.title, "Generated solve x plus 3");
  assert.equal(frame.progress, 0.5);
  assert.equal(frame.equationFrame.animationId, "linear-equation-solve-x");
  assert.equal(
    frame.equationFrame.semanticFrame?.assetId,
    "asset.generated.linear-solve.x-plus-3"
  );
  assert.deepEqual(frame.equationFrame.semanticFrame?.activeTransformationIds, [
    "transform.generated.linear-solve.x-plus-3.cancel-additive-inverse"
  ]);
  assert.deepEqual(frame.diagnostics, []);
});

test("generated linear-solve tutorial card samples render fixture identity", () => {
  const sample = createGeneratedLinearSolveTutorialCardSample(
    "generated.linear-solve.x-plus-3"
  );
  const html = renderKpTutorialCardHtmlShell(sample, sample.sample(0));

  assert.match(
    html,
    /data-kp-tutorial-card="tutorial\.generated\.linear-solve\.x-plus-3\.card\.live-sample"/
  );
  assert.match(
    html,
    /data-kp-tutorial-fixture="generated\.linear-solve\.x-plus-3"/
  );
  assert.match(html, /<h2>Generated solve x plus 3<\/h2>/);
});
