import { strict as assert } from "node:assert";
import test from "node:test";

import {
  checkKpRendererFrameSemanticPreservation
} from "../src/semantic/asset-laws.ts";
import {
  createGeneratedAlgebraTutorialCardSample,
  createGeneratedAlgebraTutorialCardSamples,
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

test("generated algebra tutorial card samples expose exponent fixture semantics", () => {
  const sample = createGeneratedAlgebraTutorialCardSample(
    "generated.exponent.square-as-product"
  );
  const frame = sample.sample(0.75);

  assert.equal(
    sample.id,
    generatedAlgebraTutorialCardSampleId("generated.exponent.square-as-product")
  );
  assert.equal(sample.fixtureId, "generated.exponent.square-as-product");
  assert.equal(sample.fixtureFamilyId, "generated.exponent");
  assert.equal(sample.title, "Generated expand square as product");
  assert.equal(
    frame.equationFrame.semanticFrame?.assetId,
    "asset.generated.exponent.square-as-product"
  );
  assert.deepEqual(frame.equationFrame.semanticFrame?.activeTransformationIds, [
    "transform.generated.exponent.square-as-product.unwrap-unit-exponent"
  ]);
  assert.deepEqual(
    frame.equationFrame.semanticFrame?.objectRefs.map((ref) => [
      ref.objectId,
      ref.role
    ]),
    [
      ["expression.generated.exponent.square-as-product.lowered", "source"],
      ["expression.generated.exponent.square-as-product.expanded", "target"]
    ]
  );
  assert.deepEqual(frame.equationFrame.semanticFrame?.flashcardIds, [
    "card.generated.exponent.square-as-product.explain-exponent-product"
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

test("generated algebra tutorial card samples expose radical fixture semantics", () => {
  const sample = createGeneratedAlgebraTutorialCardSample(
    "generated.radical.square-root-as-power"
  );
  const frame = sample.sample(0.5);

  assert.equal(
    sample.id,
    generatedAlgebraTutorialCardSampleId(
      "generated.radical.square-root-as-power"
    )
  );
  assert.equal(sample.fixtureId, "generated.radical.square-root-as-power");
  assert.equal(sample.fixtureFamilyId, "generated.radical");
  assert.equal(sample.title, "Generated rewrite square root as power");
  assert.equal(
    frame.equationFrame.semanticFrame?.assetId,
    "asset.generated.radical.square-root-as-power"
  );
  assert.deepEqual(frame.equationFrame.semanticFrame?.activeTransformationIds, [
    "transform.generated.radical.square-root-as-power.rewrite-power-as-root"
  ]);
  assert.deepEqual(
    frame.equationFrame.semanticFrame?.objectRefs.map((ref) => [
      ref.objectId,
      ref.role
    ]),
    [
      ["expression.generated.radical.square-root-as-power.power", "source"],
      ["expression.generated.radical.square-root-as-power.radical", "target"]
    ]
  );
  assert.deepEqual(frame.equationFrame.semanticFrame?.flashcardIds, [
    "card.generated.radical.square-root-as-power.explain-radical-power"
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

test("generated algebra tutorial card sample discovery includes exponent fixtures", () => {
  const samples = createGeneratedAlgebraTutorialCardSamples();

  assert.deepEqual(
    samples
      .filter((sample) => sample.fixtureFamilyId !== "generated.linear-solve")
      .map((sample) => [
        sample.fixtureId,
        sample.fixtureFamilyId,
        sample.id
      ]),
    [
      [
        "generated.fraction-expression.two-fourths",
        "generated.fraction-expression",
        "tutorial.generated.fraction-expression.two-fourths.card.live-sample"
      ],
      [
        "generated.exponent.square-as-product",
        "generated.exponent",
        "tutorial.generated.exponent.square-as-product.card.live-sample"
      ],
      [
        "generated.radical.square-root-as-power",
        "generated.radical",
        "tutorial.generated.radical.square-root-as-power.card.live-sample"
      ],
      [
        "generated.function-wrap.apply-f",
        "generated.function-wrap",
        "tutorial.generated.function-wrap.apply-f.card.live-sample"
      ]
    ]
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
