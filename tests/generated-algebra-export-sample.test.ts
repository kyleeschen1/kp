import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createGeneratedAlgebraIframeExportSample,
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
