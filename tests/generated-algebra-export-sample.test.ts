import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createGeneratedAlgebraIframeExportSample,
  createGeneratedAlgebraIframeExportSamples,
  createGeneratedAlgebraStaticStepExportSamples,
  createGeneratedAlgebraStaticStepExportSample
} from "../src/tutorial/generated-algebra-export-sample.ts";

test("generated algebra iframe export sample renders fraction fixture card HTML", () => {
  const fixture = createGeneratedAlgebraIframeExportSample(
    "generated.fraction-expression.two-fourths",
    0.5
  );

  assert.equal(
    fixture.artifact.id,
    "artifact.generated.fraction-expression.two-fourths.iframe"
  );
  assert.equal(
    fixture.artifact.profileId,
    "export.generated.fraction-expression.two-fourths.iframe"
  );
  assert.equal(fixture.fixtureFamilyId, "generated.fraction-expression");
  assert.equal(
    fixture.artifact.metadata?.["generatedFixtureFamilyId"],
    "generated.fraction-expression"
  );
  assert.deepEqual(
    {
      id: fixture.dependencyManifest.id,
      artifactId: fixture.dependencyManifest.artifactId,
      fixtureId: fixture.dependencyManifest.fixtureId,
      fixtureFamilyId: fixture.dependencyManifest.fixtureFamilyId,
      assetId: fixture.dependencyManifest.assetId,
      transformationIds: fixture.dependencyManifest.transformationIds
    },
    {
      id:
        "dependency-manifest.artifact.generated.fraction-expression.two-fourths.iframe",
      artifactId: "artifact.generated.fraction-expression.two-fourths.iframe",
      fixtureId: "generated.fraction-expression.two-fourths",
      fixtureFamilyId: "generated.fraction-expression",
      assetId: "asset.generated.fraction-expression.two-fourths",
      transformationIds: [
        "transform.generated.fraction-expression.two-fourths.split-factors",
        "transform.generated.fraction-expression.two-fourths.merge-common-factor",
        "transform.generated.fraction-expression.two-fourths.simplify-unit-factor"
      ]
    }
  );
  assert.equal(fixture.progress, 0.5);
  assert.match(
    fixture.html,
    /data-kp-tutorial-card="tutorial\.generated\.fraction-expression\.two-fourths\.card\.live-sample"/
  );
  assert.match(
    fixture.html,
    /data-kp-tutorial-fixture="generated\.fraction-expression\.two-fourths"/
  );
  assert.deepEqual(fixture.diagnostics, []);
});

test("generated algebra static-step export sample preserves fraction semantics", () => {
  const fixture = createGeneratedAlgebraStaticStepExportSample(
    "generated.fraction-expression.two-fourths"
  );

  assert.equal(
    fixture.sequence.artifact.id,
    "artifact.generated.fraction-expression.two-fourths.steps"
  );
  assert.equal(
    fixture.sequence.artifact.profileId,
    "export.generated.fraction-expression.two-fourths.steps"
  );
  assert.equal(fixture.fixtureFamilyId, "generated.fraction-expression");
  assert.deepEqual(
    fixture.sequence.steps.map((step) => step.progress),
    [0, 1 / 3, 2 / 3, 1]
  );
  assert.equal(
    fixture.sequence.steps[2]?.frame.equationFrame.semanticFrame?.assetId,
    "asset.generated.fraction-expression.two-fourths"
  );
  assert.equal(
    fixture.sequence.artifact.metadata?.["sampleId"],
    "tutorial.generated.fraction-expression.two-fourths.card.live-sample"
  );
  assert.deepEqual(fixture.dependencyManifest.traceStepIds, [
    "trace.generated.fraction-expression.two-fourths.initial",
    "trace.generated.fraction-expression.two-fourths.factored",
    "trace.generated.fraction-expression.two-fourths.common-factor",
    "trace.generated.fraction-expression.two-fourths.simplified"
  ]);
  assert.deepEqual(fixture.dependencyManifest.flashcardIds, [
    "card.generated.fraction-expression.two-fourths.explain-equivalent-fraction"
  ]);
  assert.deepEqual(fixture.dependencyManifest.diagnostics, []);
  assert.deepEqual(fixture.diagnostics, []);
});

test("generated algebra iframe export sample renders exponent fixture card HTML", () => {
  const fixture = createGeneratedAlgebraIframeExportSample(
    "generated.exponent.square-as-product",
    0.75
  );

  assert.equal(
    fixture.artifact.id,
    "artifact.generated.exponent.square-as-product.iframe"
  );
  assert.equal(fixture.fixtureFamilyId, "generated.exponent");
  assert.equal(
    fixture.artifact.metadata?.["generatedFixtureFamilyId"],
    "generated.exponent"
  );
  assert.deepEqual(
    fixture.dependencyManifest.transformationIds,
    [
      "transform.generated.exponent.square-as-product.lower-exponent",
      "transform.generated.exponent.square-as-product.unwrap-unit-exponent"
    ]
  );
  assert.deepEqual(fixture.dependencyManifest.flashcardIds, [
    "card.generated.exponent.square-as-product.explain-exponent-product"
  ]);
  assert.match(
    fixture.html,
    /data-kp-tutorial-card="tutorial\.generated\.exponent\.square-as-product\.card\.live-sample"/
  );
  assert.match(
    fixture.html,
    /data-kp-tutorial-fixture="generated\.exponent\.square-as-product"/
  );
  assert.deepEqual(fixture.diagnostics, []);
});

test("generated algebra static-step export sample preserves exponent trace semantics", () => {
  const fixture = createGeneratedAlgebraStaticStepExportSample(
    "generated.exponent.square-as-product"
  );

  assert.equal(
    fixture.sequence.artifact.id,
    "artifact.generated.exponent.square-as-product.steps"
  );
  assert.equal(fixture.fixtureFamilyId, "generated.exponent");
  assert.deepEqual(
    fixture.sequence.steps.map((step) => step.progress),
    [0, 1 / 3, 2 / 3, 1]
  );
  assert.equal(
    fixture.sequence.steps[2]?.frame.equationFrame.semanticFrame?.assetId,
    "asset.generated.exponent.square-as-product"
  );
  assert.deepEqual(fixture.dependencyManifest.traceStepIds, [
    "trace.generated.exponent.square-as-product.initial",
    "trace.generated.exponent.square-as-product.lowered",
    "trace.generated.exponent.square-as-product.expanded"
  ]);
  assert.deepEqual(fixture.dependencyManifest.flashcardIds, [
    "card.generated.exponent.square-as-product.explain-exponent-product"
  ]);
  assert.deepEqual(fixture.dependencyManifest.diagnostics, []);
  assert.deepEqual(fixture.diagnostics, []);
});

test("generated algebra iframe export sample renders radical fixture card HTML", () => {
  const fixture = createGeneratedAlgebraIframeExportSample(
    "generated.radical.square-root-as-power",
    0.5
  );

  assert.equal(
    fixture.artifact.id,
    "artifact.generated.radical.square-root-as-power.iframe"
  );
  assert.equal(fixture.fixtureFamilyId, "generated.radical");
  assert.equal(
    fixture.artifact.metadata?.["generatedFixtureFamilyId"],
    "generated.radical"
  );
  assert.deepEqual(fixture.dependencyManifest.transformationIds, [
    "transform.generated.radical.square-root-as-power.rewrite-power-as-root"
  ]);
  assert.deepEqual(fixture.dependencyManifest.flashcardIds, [
    "card.generated.radical.square-root-as-power.explain-radical-power"
  ]);
  assert.match(
    fixture.html,
    /data-kp-tutorial-card="tutorial\.generated\.radical\.square-root-as-power\.card\.live-sample"/
  );
  assert.match(
    fixture.html,
    /data-kp-tutorial-fixture="generated\.radical\.square-root-as-power"/
  );
  assert.deepEqual(fixture.diagnostics, []);
});

test("generated algebra static-step export sample preserves radical trace semantics", () => {
  const fixture = createGeneratedAlgebraStaticStepExportSample(
    "generated.radical.square-root-as-power"
  );

  assert.equal(
    fixture.sequence.artifact.id,
    "artifact.generated.radical.square-root-as-power.steps"
  );
  assert.equal(fixture.fixtureFamilyId, "generated.radical");
  assert.equal(
    fixture.sequence.steps[2]?.frame.equationFrame.semanticFrame?.assetId,
    "asset.generated.radical.square-root-as-power"
  );
  assert.deepEqual(fixture.dependencyManifest.traceStepIds, [
    "trace.generated.radical.square-root-as-power.power",
    "trace.generated.radical.square-root-as-power.radical"
  ]);
  assert.deepEqual(fixture.dependencyManifest.flashcardIds, [
    "card.generated.radical.square-root-as-power.explain-radical-power"
  ]);
  assert.deepEqual(fixture.dependencyManifest.diagnostics, []);
  assert.deepEqual(fixture.diagnostics, []);
});

test("generated algebra export sample discovery includes exponent fixtures", () => {
  const iframeSamples = createGeneratedAlgebraIframeExportSamples(0.25);
  const staticStepSamples = createGeneratedAlgebraStaticStepExportSamples();

  assert.deepEqual(
    iframeSamples
      .filter((sample) => sample.fixtureFamilyId !== "generated.linear-solve")
      .map((sample) => [
        sample.fixtureId,
        sample.fixtureFamilyId,
        sample.artifact.id
      ]),
    [
      [
        "generated.fraction-expression.two-fourths",
        "generated.fraction-expression",
        "artifact.generated.fraction-expression.two-fourths.iframe"
      ],
      [
        "generated.exponent.square-as-product",
        "generated.exponent",
        "artifact.generated.exponent.square-as-product.iframe"
      ],
      [
        "generated.radical.square-root-as-power",
        "generated.radical",
        "artifact.generated.radical.square-root-as-power.iframe"
      ],
      [
        "generated.function-wrap.apply-f",
        "generated.function-wrap",
        "artifact.generated.function-wrap.apply-f.iframe"
      ],
      [
        "generated.distribution.expand-a-sum",
        "generated.distribution",
        "artifact.generated.distribution.expand-a-sum.iframe"
      ],
      [
        "generated.distribution.factor-common-a",
        "generated.distribution",
        "artifact.generated.distribution.factor-common-a.iframe"
      ]
    ]
  );
  assert.deepEqual(
    staticStepSamples
      .filter((sample) => sample.fixtureFamilyId !== "generated.linear-solve")
      .map((sample) => [
        sample.fixtureId,
        sample.fixtureFamilyId,
        sample.sequence.artifact.id
      ]),
    [
      [
        "generated.fraction-expression.two-fourths",
        "generated.fraction-expression",
        "artifact.generated.fraction-expression.two-fourths.steps"
      ],
      [
        "generated.exponent.square-as-product",
        "generated.exponent",
        "artifact.generated.exponent.square-as-product.steps"
      ],
      [
        "generated.radical.square-root-as-power",
        "generated.radical",
        "artifact.generated.radical.square-root-as-power.steps"
      ],
      [
        "generated.function-wrap.apply-f",
        "generated.function-wrap",
        "artifact.generated.function-wrap.apply-f.steps"
      ],
      [
        "generated.distribution.expand-a-sum",
        "generated.distribution",
        "artifact.generated.distribution.expand-a-sum.steps"
      ],
      [
        "generated.distribution.factor-common-a",
        "generated.distribution",
        "artifact.generated.distribution.factor-common-a.steps"
      ]
    ]
  );
});
