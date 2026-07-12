import { strict as assert } from "node:assert";
import test from "node:test";

import {
  checkKpRendererFrameSemanticPreservation
} from "../src/semantic/asset-laws.ts";
import {
  createGeneratedAlgebraTutorialCardSample,
  generatedAlgebraTutorialCardSampleId
} from "../src/tutorial/generated-algebra-card-sample.ts";
import { renderKpTutorialCardHtmlShell } from "../src/tutorial/card-html-shell.ts";

test("generated algebra tutorial card samples expose fraction fixture semantics", () => {
  const sample = createGeneratedAlgebraTutorialCardSample(
    "generated.fraction-expression.two-fourths"
  );
  const frame = sample.sample(0.5);

  assert.equal(
    sample.id,
    generatedAlgebraTutorialCardSampleId(
      "generated.fraction-expression.two-fourths"
    )
  );
  assert.equal(sample.fixtureId, "generated.fraction-expression.two-fourths");
  assert.equal(sample.fixtureFamilyId, "generated.fraction-expression");
  assert.equal(sample.title, "Generated simplify two fourths");
  assert.equal(
    frame.equationFrame.semanticFrame?.assetId,
    "asset.generated.fraction-expression.two-fourths"
  );
  assert.deepEqual(frame.equationFrame.semanticFrame?.activeTransformationIds, [
    "transform.generated.fraction-expression.two-fourths.merge-common-factor"
  ]);
  assert.deepEqual(
    frame.equationFrame.semanticFrame?.objectRefs.map((ref) => [
      ref.objectId,
      ref.role
    ]),
    [
      [
        "expression.generated.fraction-expression.two-fourths.factored",
        "source"
      ],
      [
        "expression.generated.fraction-expression.two-fourths.common-factor",
        "target"
      ]
    ]
  );
  assert.deepEqual(frame.equationFrame.semanticFrame?.flashcardIds, [
    "card.generated.fraction-expression.two-fourths.explain-equivalent-fraction"
  ]);
  assert.deepEqual(frame.diagnostics, []);
  assert.deepEqual(
    checkKpRendererFrameSemanticPreservation(frame.equationFrame),
    {
      lawId: "renderer-frame.semantic-preservation",
      passed: true,
      failures: []
    }
  );
});

test("generated algebra tutorial card samples render fraction fixture identity", () => {
  const sample = createGeneratedAlgebraTutorialCardSample(
    "generated.fraction-expression.two-fourths"
  );
  const html = renderKpTutorialCardHtmlShell(sample, sample.sample(0));

  assert.match(
    html,
    /data-kp-tutorial-card="tutorial\.generated\.fraction-expression\.two-fourths\.card\.live-sample"/
  );
  assert.match(
    html,
    /data-kp-tutorial-fixture="generated\.fraction-expression\.two-fourths"/
  );
  assert.match(html, /<h2>Generated simplify two fourths<\/h2>/);
});
