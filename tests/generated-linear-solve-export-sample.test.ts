import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createGeneratedLinearSolveIframeExportSample,
  createGeneratedLinearSolveStaticStepExportSample
} from "../src/tutorial/generated-linear-solve-export-sample.ts";

test("generated linear-solve iframe export sample renders fixture card HTML", () => {
  const fixture = createGeneratedLinearSolveIframeExportSample(
    "generated.linear-solve.x-plus-3",
    0.5
  );

  assert.equal(
    fixture.artifact.id,
    "artifact.generated.linear-solve.x-plus-3.iframe"
  );
  assert.equal(
    fixture.artifact.profileId,
    "export.generated.linear-solve.x-plus-3.iframe"
  );
  assert.equal(fixture.artifact.metadata?.["generatedFixtureId"], fixture.fixtureId);
  assert.ok(fixture.dependencyManifest);
  assert.deepEqual(
    {
      id: fixture.dependencyManifest.id,
      artifactId: fixture.dependencyManifest.artifactId,
      fixtureId: fixture.dependencyManifest.fixtureId,
      assetId: fixture.dependencyManifest.assetId,
      transformationIds: fixture.dependencyManifest.transformationIds,
      transformDefinitionIds: fixture.dependencyManifest.transformDefinitionIds,
      drillDownIds: fixture.dependencyManifest.drillDownIds
    },
    {
      id: "dependency-manifest.artifact.generated.linear-solve.x-plus-3.iframe",
      artifactId: "artifact.generated.linear-solve.x-plus-3.iframe",
      fixtureId: "generated.linear-solve.x-plus-3",
      assetId: "asset.generated.linear-solve.x-plus-3",
      transformationIds: [
        "transform.generated.linear-solve.x-plus-3.subtract-addend",
        "transform.generated.linear-solve.x-plus-3.cancel-additive-inverse",
        "transform.generated.linear-solve.x-plus-3.simplify-difference"
      ],
      transformDefinitionIds: [
        "definition.generated.linear-solve.subtract-both-sides",
        "definition.generated.linear-solve.cancel-additive-inverses",
        "definition.generated.linear-solve.simplify-constant-difference"
      ],
      drillDownIds: [
        "drilldown.generated.linear-solve.x-plus-3.cancel-additive-inverse"
      ]
    }
  );
  assert.equal(fixture.progress, 0.5);
  assert.match(
    fixture.html,
    /data-kp-tutorial-card="tutorial\.generated\.linear-solve\.x-plus-3\.card\.live-sample"/
  );
  assert.match(
    fixture.html,
    /data-kp-tutorial-fixture="generated\.linear-solve\.x-plus-3"/
  );
  assert.deepEqual(fixture.diagnostics, []);
});

test("generated linear-solve static-step export sample preserves generated semantics", () => {
  const fixture = createGeneratedLinearSolveStaticStepExportSample(
    "generated.linear-solve.x-plus-3"
  );

  assert.equal(
    fixture.sequence.artifact.id,
    "artifact.generated.linear-solve.x-plus-3.steps"
  );
  assert.equal(
    fixture.sequence.artifact.profileId,
    "export.generated.linear-solve.x-plus-3.steps"
  );
  assert.deepEqual(
    fixture.sequence.steps.map((step) => step.progress),
    [0, 1 / 3, 2 / 3, 1]
  );
  assert.equal(
    fixture.sequence.steps[2]?.frame.equationFrame.semanticFrame?.assetId,
    "asset.generated.linear-solve.x-plus-3"
  );
  assert.equal(
    fixture.sequence.artifact.metadata?.["sampleId"],
    "tutorial.generated.linear-solve.x-plus-3.card.live-sample"
  );
  assert.ok(fixture.dependencyManifest);
  assert.deepEqual(fixture.dependencyManifest.traceStepIds, [
    "trace.generated.linear-solve.x-plus-3.initial",
    "trace.generated.linear-solve.x-plus-3.after-subtract",
    "trace.generated.linear-solve.x-plus-3.left-simplified",
    "trace.generated.linear-solve.x-plus-3.solved"
  ]);
  assert.deepEqual(fixture.dependencyManifest.dependencyPhases, [
    "critical",
    "optional"
  ]);
  assert.deepEqual(fixture.dependencyManifest.transformDefinitionIds, [
    "definition.generated.linear-solve.subtract-both-sides",
    "definition.generated.linear-solve.cancel-additive-inverses",
    "definition.generated.linear-solve.simplify-constant-difference"
  ]);
  assert.deepEqual(fixture.dependencyManifest.diagnostics, []);
  assert.deepEqual(fixture.diagnostics, []);
});
